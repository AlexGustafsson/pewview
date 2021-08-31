import {
  Group,
  Vector3,
  AmbientLight,
  DirectionalLight,
  SpotLight
} from "three"

import type {
  Texture,
} from "three"

import Globe from "./globe"
import Halo from "./halo"
import WorldMap from "./world-map"

import type Theme from "./theme"

type EarthOptions = {
  radius: number,
  theme: Theme,
  origin: Vector3,
  worldMapTexture: Texture
};

export default class Earth {
  radius: number;
  origin: Vector3;
  theme: Theme;
  scale: number;

  globe: Globe;
  worldMap: WorldMap;
  halo: Halo;

  // light0 = diffuse
  // light4 = spotlight
  // light2 = crest / atmosphere
  // light1 = left side / diffuse / atmosphere
  lights: {
    diffuse: AmbientLight,
    crest: DirectionalLight,
    atmosphere: SpotLight,
    spotlight: SpotLight
  };

  private orbitGroup: Group;
  private staticGroup: Group;

  constructor({
    radius,
    theme,
    origin,
    worldMapTexture,
  }: EarthOptions) {
    this.radius = radius;
    this.origin = origin;
    this.theme = theme;
    this.scale = 1;

    this.orbitGroup = new Group();
    this.staticGroup = new Group();

    this.lights = {
      diffuse: new AmbientLight(0xa9bfff, 0.8),
      crest: new DirectionalLight(0xa9bfff, 3),
      atmosphere: new SpotLight(0x2188ff, 5, 120, .3, 0, 1.1),
      spotlight: new SpotLight(0xf46bbe, 5, 75, .5, 0, 1.25)
    };
    this.lights.crest.target = this.orbitGroup;
    this.lights.atmosphere.target = this.orbitGroup;
    this.lights.spotlight.target = this.orbitGroup;
    for (const light of Object.values(this.lights))
      this.staticGroup.add(light);

    this.halo = new Halo(radius, theme);
    this.staticGroup.add(this.halo.mesh);

    this.globe = new Globe({
      radius: radius,
      detail: 55,
      theme,
      origin: origin
    });
    this.orbitGroup.add(this.globe.mesh);

    this.worldMap = new WorldMap({
      radius,
      texture: worldMapTexture,
      rows: 200,
      size: 0.095
    });
    this.orbitGroup.add(this.worldMap.mesh);
  }

  mount(orbitContainer: Group, staticContainer: Group) {
    orbitContainer.add(this.orbitGroup);
    staticContainer.add(this.staticGroup);
  }

  updateSize(radius: number, scale: number) {
    this.scale = scale;
    this.radius = radius;

    this.globe.updateSize(this.radius, this.scale);
    this.worldMap.updateSize(this.radius);
    this.halo.updateSize(this.radius);

    this.lights.atmosphere.position.set(-2.5 * this.radius, 80, -49).multiplyScalar(this.scale * 2);
    this.lights.atmosphere.distance = 120 * this.scale;

    // this.spotLights.light1.position.set(this.orbitParentContainer.position.x - 2.5 * GLOBE_RADIUS, 80, -49).multiplyScalar(containerScale);
    // this.spotLights.light1.distance = 120 * containerScale;

    this.lights.crest.position.set(-50, 30, 10).multiplyScalar(this.scale * 2);
    // this.directionalLights.light2.position.set(this.orbitParentContainer.position.x - 50, this.orbitParentContainer.position.y + 30, 10).multiplyScalar(containerScale);

    // where's light3? previously light2
    // this.lights.light3.position.set(this.parentContainer.position.x - 25, 0, 100).multiplyScalar(containerScale)
    // this.light3.distance = 150 * containerScale

    this.lights.spotlight.position.set(this.radius, this.radius, 2 * this.radius).multiplyScalar(this.scale * 2);
    this.lights.spotlight.distance = 75 * this.scale;
    // this.spotLights.light4.position.set(this.orbitParentContainer.position.x + GLOBE_RADIUS, GLOBE_RADIUS, 2 * GLOBE_RADIUS).multiplyScalar(containerScale);
    // this.spotLights.light4.distance = 75 * containerScale;
  }

  update(deltaTime: number) {
    if (this.halo)
      this.halo.update(deltaTime);
  }
}
