import * as solar from "./include/solar-calculator"
import {
  AxisHelper,
  Geometry,
  TextureLoader,
  DirectionalLightHelper,
  MeshLambertMaterial,
  MeshPhongMaterial,
  ImageUtils,
  Color
} from "./include/three"
import {default as ThreeGlobe} from "./include/globe.gl"
import SimpleEventTarget from "./simple-event-target"

const POINT_OF_INTEREST_ANIMATION_DURATION = 2 * 1000;
const POINT_OF_INTEREST_INTERVAL = 60 * 1000;

const SCREENSAVER_DELAY = 3 * 1000;

export default class Globe extends SimpleEventTarget {
  constructor() {
    super();
    this.globe = ThreeGlobe();
    this.data = [];

    // Configure bump map
    const globeMaterial = this.globe.globeMaterial();
    // TODO: The bump map has artifacts, leading to the ocean having square artifacts
    globeMaterial.bumpScale = 10;
    new TextureLoader().load("./static/specular-map.png", texture => {
      globeMaterial.specularMap = texture;
      globeMaterial.specular = new Color("grey");
      globeMaterial.shininess = 15;
    });

    // Setup textures
    this.globe.backgroundImageUrl("./static/stars.png")
      .globeImageUrl("./static/color-map.jpg")
      .bumpImageUrl("./static/bump-map.png")
      .backgroundColor("#000000")
      .showAtmosphere(true);

    // Setup arcs to render
    this.globe.arcsData(this.data)
      .arcStartLat(context => context.source.latitude)
      .arcStartLng(context => context.source.longitude)
      .arcEndLat(context => context.destination.latitude)
      .arcEndLng(context => context.destination.longitude)
      .arcColor(context => context.colors)
      .arcDashLength(context => context.length)
      .arcDashGap(context => context.gap)
      .arcDashAnimateTime(context => context.animateTime);

    // Setup the daytime hemisphere
    const now = new Date()
    const solarTile = {
      position: this.calculateSunPosition(now),
      material: new MeshLambertMaterial({color: "#FFFF00", opacity: 0.1, transparent: true}),
      altitude: 0.006,
      width: 180,
      height: 180,
      useGlobeProjection: false,
      transitionDuration: 0
    };
    const cloudTile = {
      position: {latitude: 0, longitude: 0},
      material: new MeshPhongMaterial({
        map: ImageUtils.loadTexture("./static/cloud-map.png"),
        transparent: true,
        opacity: 0.6
      }),
      altitude: 0.01,
      width: 360,
      height: 180,
      useGlobeProjection: false,
      transitionDuration: 0
    }

    this.globe.tilesData([solarTile, cloudTile])
      .tileLng(context => context.position.longitude)
      .tileLat(context => context.position.latitude)
      .tileAltitude(context => context.altitude)
      .tileWidth(context => context.width)
      .tileHeight(context => context.height)
      .tileUseGlobeProjection(context => context.useGlobeProjection)
      .tileMaterial(context => context.material)
      .tilesTransitionDuration(0);

    // Screensaver timers
    this.screensaverTimer = null;
    this.pointOfInterestTimer = null;
    // The points of interest to animate between when in screensaver mode
    this.pointsOfInterest = [];

    this.mounted = false;
    this.waitingForMount = [];
  }

  push(...data) {
    this.data.push(...data);
    this.globe.arcsData(this.data);
  }

  clear() {
    this.data.clear();
    this.globe.arcsData(this.data);
  }

  performAdditionalSetup() {
    // TODO: Follow sun position
    this.directionalLight.position.set(200, 0, 150);
    this.directionalLight.intensity = 0.4;

    this.controls.maxDistance = 1000;
    this.controls.minDistance = 200;
    this.controls.zoomSpeed = 1;
    this.controls.autoRotateSpeed = 0.2;

    this.controls.addEventListener('start', this.onInteractionStarted.bind(this));
    this.controls.addEventListener('end', this.onInteractionStopped.bind(this));

    this.screensaverTimer = setTimeout(this.startScreensaver.bind(this), SCREENSAVER_DELAY);
  }

  get scene() {
    return this.globe.scene();
  }

  get directionalLight() {
    return this.globe.scene().children.find(object => object.type === "DirectionalLight");
  }

  get controls() {
    return this.globe.controls();
  }

  onInteractionStarted() {
    this.stopScreensaver();
  }

  onInteractionStopped() {
    this.screensaverTimer = setTimeout(this.startScreensaver.bind(this), SCREENSAVER_DELAY);
  }

  startScreensaver() {
    this.controls.autoRotate = true;
    this.pointOfInterestTimer = setInterval(this.moveToRandomPointOfInterest.bind(this), POINT_OF_INTEREST_INTERVAL);
  }

  stopScreensaver() {
    this.controls.autoRotate = false;
    if (this.screensaverTimer)
      this.screensaverTimer = clearTimeout(this.screensaverTimer);
    if (this.pointOfInterestTimer)
      this.pointOfInterestTimer = clearInterval(this.pointOfInterestTimer);
  }

  moveToRandomPointOfInterest() {
    const pointOfInterest = this.pointsOfInterest[Math.floor(Math.random() * this.pointsOfInterest.length)];
    this.globe.pointOfView({
      lat: pointOfInterest.latitude,
      lng: pointOfInterest.longitude
    }, POINT_OF_INTEREST_ANIMATION_DURATION);
  }

  calculateSunPosition(date) {
    const day = new Date(date).setUTCHours(0, 0, 0, 0);
    const century = solar.century(date.getTime());
    const longitude = (day - date.getTime()) / 864e5 * 360 - 180  - solar.equationOfTime(century) / 4;
    const latitude = solar.declination(century)
    return {longitude, latitude};
  }

  waitForMount(callback) {
    if (this.mounted)
      return callback();

    this.waitingForMount.push(callback);
  }

  mount(element) {
    this.globe(element);
    this.waitForMount(this.performAdditionalSetup.bind(this));
    setTimeout(() => {
      this.mounted = true;
      for (const callback of this.waitingForMount)
        callback();
    }, 1);
  }

  drawAxes() {
    this.waitForMount(() => {
      const axes = new AxisHelper(150)
      axes.geometry = new Geometry().fromBufferGeometry(axes.geometry);
      this.scene.add(axes);
    });
  }

  drawLights() {
    this.waitForMount(() => {
      const helper = new DirectionalLightHelper(this.directionalLight, 150);
      this.scene.add(helper);
    });
  }
}
