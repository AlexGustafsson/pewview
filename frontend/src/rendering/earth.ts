import {
  Group,
  TextureLoader,
  Vector3
} from "three"

import type {
  Texture,
  Scene
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

  private earthGroup: Group;
  private backgroundGroup: Group;

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

    this.earthGroup = new Group();
    this.backgroundGroup = new Group();

    this.halo = new Halo(radius);
    this.halo.animate = true;
    this.backgroundGroup.add(this.halo.mesh);

    this.globe = new Globe({
      radius: radius,
      detail: 55,
      theme,
      origin: origin
    });
    this.earthGroup.add(this.globe.mesh);

    this.worldMap = new WorldMap({
      radius,
      texture: worldMapTexture,
      rows: 200,
      size: 0.095
    });
    this.earthGroup.add(this.worldMap.mesh);
  }

  mount(orbitContainer: Group, staticContainer: Group) {
    orbitContainer.add(this.earthGroup);
    staticContainer.add(this.backgroundGroup);
  }

  updateSize(radius: number, scale: number) {
    this.scale = scale;
    this.globe.updateSize(radius, scale);
    this.worldMap.updateSize(radius);
    this.halo.updateSize(radius);
    this.backgroundGroup.position.set(0, 0, -10);
  }

  update(deltaTime: number) {
    if (this.halo)
      this.halo.update(deltaTime);
  }
}
