import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2
} from "three"

import STARS_FRAGMENT_SHADER from "./shaders/stars.frag";

export default class Stars {
  elapsedTime: number;
  animate: boolean;
  uniforms: {
    noiseSeed: Uniform<number>,
    noiseScale: Uniform<number>,
    noiseIntensity: Uniform<number>,
    resolution: Uniform<Vector2>,
    offset: Uniform<Vector2>
  };
  material: ShaderMaterial;
  geometry: PlaneGeometry;
  mesh: Mesh;

  constructor(radius: number) {
    this.elapsedTime = 0;
    this.animate = true;
    this.uniforms = {
      noiseSeed: {
        type: "f",
        value: this.elapsedTime
      },
      noiseScale: {
        type: "f",
        value: 8
      },
      noiseIntensity: {
        type: "f",
        value: 0.08
      },
      resolution: {
        type: "v2",
        value: new Vector2(radius, radius)
      },
      offset: {
        type: "v2",
        value: new Vector2(0, 0)
      }
    };
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      fragmentShader: STARS_FRAGMENT_SHADER,
      side: 0,
      blending: 2,
      transparent: true
    });

    this.geometry = new PlaneGeometry(radius, radius);
    this.mesh = new Mesh(this.geometry, this.material);
    // TODO: scale or set the size to fill the actual canvas
    this.mesh.scale.multiplyScalar(5);
  }

  update(deltaTime: number) {
    if (this.animate) {
      this.elapsedTime = this.elapsedTime + deltaTime;
      this.uniforms.noiseSeed.value = this.elapsedTime / 2;
    }
  }
}
