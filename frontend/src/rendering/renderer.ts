import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  SpotLight,
  DirectionalLight,
  AmbientLight,
  Group,
  Vector3,
  Euler,
  TextureLoader
} from "three"
import Theme from "./theme"
import Globe from "./globe"
import DebugUI from "./debug-ui"
import Arch from "./arch"
import {IS_MOBILE} from "./utils"
import Controller from "./controller"
import Halo from "./halo"
import WorldMap from "./world-map"
import Stars from "./stars"
import WORLD_MAP from "../../static/map.png"

// The number of milliseconds to wait before triggering a size update.
// Only the last event within this timespan will be handled
const SIZE_UPDATE_DEBOUNCE_DELAY = 200;

const GLOBE_RADIUS = 25;
const WORLD_MAP_OFFSET = 0;
const START_ROTATION = new Euler(.3, 4.6, .05)

type RendererOptions = {
  theme?: Theme,
  debug?: boolean
};

export default class Renderer {
  element: HTMLElement | null;
  theme: Theme;
  isRunning: boolean;
  hasLoaded: boolean;
  clock: Clock;
  fps: number;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  parentContainer: Group;
  container: Group;
  haloContainer: Group;
  halo: Halo | null;
  starsContainer: Group;
  stars: Stars | null;

  shadowPoint: Vector3;
  highlightPoint: Vector3;
  frontPoint: Vector3;
  globe: Globe;
  worldMap: WorldMap | null;

  ambientLights: {[key: string]: AmbientLight};
  spotLights: {[key: string]: SpotLight};
  directionalLights: {[key: string]: DirectionalLight};

  inputController: Controller | null;

  resizeDebouncer: ReturnType<typeof setInterval> | null;

  debugUI: DebugUI | null;

  constructor({
    theme = new Theme(),
    debug = false,
  }: RendererOptions = {}) {
    this.element = null;

    // Style
    this.theme = theme

    // Rendering loop
    this.isRunning = false;
    this.hasLoaded = false;
    this.clock = new Clock(false);
    this.fps = 0;

    // Rendering
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(10, 1, 170, 260);
    this.camera.position.set(0, 0, 220);
    this.scene.add(this.camera);
    this.renderer = new WebGLRenderer({
      // powerPreference: "high-performance",
      powerPreference: "low-power",
      alpha: false,
      preserveDrawingBuffer: false,
      precision: "highp",
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setClearColor(this.theme.colors.background, 1);

    // Scene
    this.parentContainer = new Group();
    this.scene.add(this.parentContainer);
    this.container = new Group();
    this.parentContainer.add(this.container);
    const rotation = START_ROTATION;
    const offset = (new Date()).getTimezoneOffset();
    rotation.y = START_ROTATION.y + Math.PI * (offset / 720);
    this.parentContainer.rotation.copy(rotation);

    // Setup the halo
    this.haloContainer = new Group();
    this.scene.add(this.haloContainer);
    this.halo = null;
    this.enableHalo();

    // Setup stars
    this.starsContainer = new Group();
    this.scene.add(this.starsContainer);
    this.stars = null;
    this.enableStars();

    // Setup the globe
    this.shadowPoint = (new Vector3()).copy(this.parentContainer.position).add(new Vector3(.7 * GLOBE_RADIUS, .3 * -GLOBE_RADIUS, GLOBE_RADIUS));
    this.highlightPoint = (new Vector3()).copy(this.parentContainer.position).add(new Vector3(1.5 * -GLOBE_RADIUS, 1.5 * -GLOBE_RADIUS, 0));
    this.frontPoint = (new Vector3()).copy(this.parentContainer.position).add(new Vector3(0, 0, GLOBE_RADIUS));
    this.globe = new Globe({
      radius: GLOBE_RADIUS,
      detail: 55,
      shadowPoint: this.shadowPoint,
      shadowDist: 1.5 * GLOBE_RADIUS,
      highlightPoint: this.highlightPoint,
      highlightColor: this.theme.colors.globe.highlight,
      highlightDist: 5,
      frontPoint: this.frontPoint,
      frontHighlightColor: this.theme.colors.globe.frontHighlight,
      waterColor: this.theme.colors.globe.water
    });
    this.container.add(this.globe.mesh);

    // Setup the world map
    this.worldMap = null;
    const textureLoaded = new Promise<void>(resolve => {
      new TextureLoader().load(WORLD_MAP, texture => {
        this.worldMap = new WorldMap({
          radius: GLOBE_RADIUS + WORLD_MAP_OFFSET,
          texture,
          rows: 200,
          size: 0.095
        });
        this.container.add(this.worldMap.mesh);
        resolve();
      });
    });

    // TODO: Temporary
    // const arch = new Arch({
    //   source: {latitude: 50.510986, longitude: 16.049161}, // "Europe"
    //   destination: {latitude: 2.341285, longitude: 21.940375}, // "Africa"
    //   globeRadius: GLOBE_RADIUS,
    //   colors: {normal: 0xff0000, highlighted: 0xffffff}
    // })
    // this.container.add(arch.mesh)

    // Setup lights
    this.ambientLights = {
      light0: new AmbientLight(0xa9bfff, .8),
    };

    this.directionalLights = {
      // Bottom light
      light2: new DirectionalLight(0xa9bfff, 3),
    };

    this.spotLights = {
      // The light blue atmospheric light
      light1: new SpotLight(0x2188ff, 5, 120, .3, 0, 1.1),
      // Highlight / focus light
      light4: new SpotLight(0xf46bbe, 5, 75, .5, 0, 1.25)
    };

    for (const light of Object.values(this.directionalLights))
      light.target = this.parentContainer;

    for (const light of Object.values(this.spotLights))
      light.target = this.parentContainer;

    for (const light of this.lights)
      this.scene.add(light);

    // Setup input controller (done when first mounted)
    this.inputController = null;

    // Always let the update loop access 'this'
    this.update = this.update.bind(this);

    // Timers / debouncers
    this.resizeDebouncer = null;

    // Debugging
    this.debugUI = null;
    textureLoaded.then(() => {
      this.debugUI = debug ? new DebugUI({renderer: this}) : null;
    });
  }

  get lights() {
    return [
      ...Object.values(this.ambientLights),
      ...Object.values(this.directionalLights),
      ...Object.values(this.spotLights)
    ];
  }

  enableStars(animate = true) {
    if (this.stars === null) {
      this.stars = new Stars(GLOBE_RADIUS);
      this.starsContainer.add(this.stars.mesh);
    }

    this.stars.animate = animate;
  }

  disableStars() {
    if (this.stars !== null) {
      this.starsContainer.remove(this.stars.mesh);
      this.stars = null;
    }
  }

  enableHalo(animate = true) {
    if (this.halo === null) {
      this.halo = new Halo(GLOBE_RADIUS);
      this.haloContainer.add(this.halo.mesh);
    }

    this.halo.animate = animate;
  }

  disableHalo() {
    if (this.halo !== null) {
      this.haloContainer.remove(this.halo.mesh);
      this.halo = null;
    }
  }

  mount(element: HTMLElement) {
    if (this.element)
      console.warn("The renderer was already mounted, this may cause undefined behaviour");

    this.element = element;
    this.element.appendChild(this.renderer.domElement);

    this.inputController = new Controller({
      element,
      object: this.container,
      objectContainer: this.parentContainer,
      renderer: this
    });

    window.addEventListener("resize", () => this.updateSize());
    window.addEventListener("orientationchange", () => this.updateSize());
    setTimeout(() => {
      this.updateSize(true);
    }, 1);
  }

  updateSize(immediate = false) {
    // Clear any existing debouncing
    if (this.resizeDebouncer != null) {
      clearTimeout(this.resizeDebouncer);
      this.resizeDebouncer = null;
    }

    const trigger = () => {
      if (this.element === null)
        return;

      const size = this.element.getBoundingClientRect();
      this.camera.aspect = size.width / size.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(size.width, size.height);

      const containerScale = 850 / size.height;
      if (IS_MOBILE) {
        this.parentContainer.position.set(0, 0, 0);
      } else {
        this.parentContainer.position.set(0, 0, 0);
        this.parentContainer.scale.set(containerScale, containerScale, containerScale);
        this.haloContainer.scale.set(containerScale, containerScale, containerScale);
        this.starsContainer.scale.set(containerScale, containerScale, containerScale);
      }

      this.haloContainer.position.set(0, 0, -10);
      this.starsContainer.position.set(0, 0, -20);

      this.spotLights.light1.position.set(this.parentContainer.position.x - 2.5 * GLOBE_RADIUS, 80, -49).multiplyScalar(containerScale);
      this.spotLights.light1.distance = 120 * containerScale;

      this.directionalLights.light2.position.set(this.parentContainer.position.x - 50, this.parentContainer.position.y + 30, 10).multiplyScalar(containerScale);

      // where's light3? previously light2
      // this.lights.light3.position.set(this.parentContainer.position.x - 25, 0, 100).multiplyScalar(containerScale)
      // this.light3.distance = 150 * containerScale

      this.spotLights.light4.position.set(this.parentContainer.position.x + GLOBE_RADIUS, GLOBE_RADIUS, 2 * GLOBE_RADIUS).multiplyScalar(containerScale);
      this.spotLights.light4.distance = 75 * containerScale;

      const scaledRadius = GLOBE_RADIUS * containerScale;
      this.shadowPoint.copy(this.parentContainer.position).add(new Vector3(.7 * scaledRadius, .3 * -scaledRadius, scaledRadius));
      this.globe.setShadowPoint(this.shadowPoint);
      this.highlightPoint.copy(this.parentContainer.position).add(new Vector3(1.5 * -scaledRadius, 1.5 * -scaledRadius, 0));
      this.globe.setHighlightPoint(this.highlightPoint);
      this.frontPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(0, 0, scaledRadius));
      this.globe.setFrontPoint(this.frontPoint);
      this.globe.setShadowDist(1.5 * scaledRadius);
      this.globe.setHighlightDist(5 * containerScale);
    };

    if (immediate) {
      trigger();
    } else {
      this.resizeDebouncer = setTimeout(() => {
        trigger();
        this.resizeDebouncer = null;
      }, SIZE_UPDATE_DEBOUNCE_DELAY);
    }
  }

  start() {
    if (!this.element)
      throw new Error("The renderer has not been mounted");

    if (this.isRunning)
      return;

    this.isRunning = true;
    this.clock.start();
    this.update();
  }

  stop() {
    if (!this.isRunning)
      return;

    this.isRunning = false;
    this.clock.stop();
  }

  update() {
    const deltaTime = this.clock.getDelta();
    this.fps = 1 / deltaTime;

    this.renderer.render(this.scene, this.camera);

    if (this.inputController)
      this.inputController.update(deltaTime);
    if (this.debugUI)
      this.debugUI.update(deltaTime);
    if (this.halo)
      this.halo.update(deltaTime);
    if (this.stars)
      this.stars.update(deltaTime);

    if (this.isRunning)
      requestAnimationFrame(this.update);
  }
}
