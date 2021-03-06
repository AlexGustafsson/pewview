import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Group,
  Vector3,
  Euler,
  TextureLoader
} from "three"
import Theme from "./theme"
import DebugUI from "./debug-ui"
import Arch from "./arch"
import {IS_MOBILE} from "./utils"
import Controller from "./controller"
import Stars from "./stars"
import Earth from "./earth"

import WORLD_MAP from "../../static/map.png"

import EventEmitter from "../event-emitter"

import {START_ROTATION} from "./globals"

// The number of milliseconds to wait before triggering a size update.
// Only the last event within this timespan will be handled
const SIZE_UPDATE_DEBOUNCE_DELAY = 200;

const GLOBE_RADIUS = 25;
const WORLD_MAP_OFFSET = 0;

type RendererOptions = {
  theme?: Theme,
  debug?: boolean
};

export default class Renderer extends EventEmitter {
  element: HTMLElement | null;
  theme: Theme;
  isRunning: boolean;
  hasLoaded: boolean;
  clock: Clock;
  fps: number;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  orbitParentContainer: Group;
  orbitContainer: Group;
  staticContainer: Group;
  stars: Stars | null;

  earth: Earth | null;

  inputController: Controller | null;

  resizeDebouncer: ReturnType<typeof setInterval> | null;

  debugUI: DebugUI | null;

  constructor({
    theme = new Theme(),
    debug = false,
  }: RendererOptions = {}) {
    super();
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
    this.orbitParentContainer = new Group();
    this.orbitContainer = new Group();
    this.orbitParentContainer.add(this.orbitContainer);
    this.scene.add(this.orbitParentContainer);
    this.staticContainer = new Group();
    this.scene.add(this.staticContainer);
    // const rotation = START_ROTATION;
    // const offset = (new Date()).getTimezoneOffset();
    // rotation.y = START_ROTATION.y + Math.PI * (offset / 720);
    this.orbitContainer.rotation.copy(START_ROTATION);

    // Setup stars
    this.stars = null;
    this.enableStars();

    // Setup the world map
    this.earth = null;
    const textureLoaded = new Promise<void>(resolve => {
      new TextureLoader().load(WORLD_MAP, texture => {
        this.earth = new Earth({
          radius: GLOBE_RADIUS,
          worldMapTexture: texture,
          origin: new Vector3(0, 0, 0),
          theme: theme
        });
        this.earth.mount(this.orbitContainer, this.staticContainer);
        resolve();
        this.emit("load");
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
      this.updateSize(true);
    });
  }

  enableStars(animate = true) {
    if (this.stars === null) {
      this.stars = new Stars(GLOBE_RADIUS);
      this.stars.mesh.position.set(0, 0, -20);
      this.staticContainer.add(this.stars.mesh);
    }

    this.stars.animate = animate;
  }

  disableStars() {
    if (this.stars !== null) {
      this.staticContainer.remove(this.stars.mesh);
      this.stars = null;
    }
  }

  mount(element: HTMLElement) {
    if (this.element)
      console.warn("The renderer was already mounted, this may cause undefined behaviour");

    this.element = element;
    this.element.appendChild(this.renderer.domElement);

    this.inputController = new Controller({
      element,
      object: this.orbitContainer,
      objectContainer: this.orbitParentContainer,
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
      // TODO: This is a costly process (about 12ms)
      // Makes resizing stutter more than necessary
      this.renderer.setSize(size.width, size.height, false);

      const containerScale = 800 / size.height;
      if (!IS_MOBILE) {
        this.orbitParentContainer.scale.set(containerScale, containerScale, containerScale);
        this.staticContainer.scale.set(containerScale, containerScale, containerScale);
      }

      this.orbitParentContainer.position.set(0, 0, 0);
      this.staticContainer.position.set(0, 0, 0);

      if (this.earth)
        this.earth.updateSize(GLOBE_RADIUS, containerScale);
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
    if (this.stars)
      this.stars.update(deltaTime);
    if (this.earth)
      this.earth.update(deltaTime);

    if (this.isRunning)
      requestAnimationFrame(this.update);
  }
}
