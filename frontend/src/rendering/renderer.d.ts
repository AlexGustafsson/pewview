import type {
  Clock,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Vector3,
  AmbientLight,
  SpotLight,
  DirectionalLight
} from "three"

import type WorldMap from "./world-map"

type RendererOptions = {
  theme?: any,
  debug?: boolean
};

export default class Renderer {
  constructor(options: RendererOptions);

  element: HTMLElement | null;
  theme: any;

  // Rendering loop
  isRunning: boolean;
  hasLoaded: boolean;
  clock: Clock;
  fps: number;

  // Rendering
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;

  // Scene
  parentContainer: Group;
  container: Group;

  // Setup the halo
  haloContainer: Group;
  halo: any;

  // Setup stars
  starsContainer: Group;
  stars: any;

  // Setup the globe
  shadowPoint: Vector3;
  highlightoint: Vector3;
  frontPoint: Vector3;
  globe: any;

  // Setup the world map
  worldMap: WorldMap | null;

  lights: {[name in string]: AmbientLight | SpotLight | DirectionalLight};

  // Setup input controller (done when first mounted)
  inputController: any;

  // Timers / debouncers
  resizeDebouncer: any;

  // Debugging
  debugUI: any;

  enableStars(animate: boolean): void;
  disableStars(): void;

  enableHalo(animate: boolean): void;
  disableHalo(): void;

  mount(element: HTMLElement): void;

  updateSize(immediate?: boolean): void;

  start(): void;

  stop(): void;

  update(): void;
}
