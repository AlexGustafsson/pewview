import {
  Mesh,
  SphereBufferGeometry,
  ShaderMaterial,
  Color,
  Vector3
} from "../include/three"

import HALO_FRAGMENT_SHADER from "./shaders/halo.frag";
import HALO_VERTEX_SHADER from "./shaders/halo.vert";

export default class Halo {
  constructor(radius) {
    this.mesh = new Mesh(new SphereBufferGeometry(radius, 45, 45), new ShaderMaterial({
      uniforms: {
        c: {
          type: "f",
          value: .7
        },
        p: {
          type: "f",
          value: 15
        },
        glowColor: {
          type: "c",
          value: new Color(0x1c2462)
        },
        viewVector: {
          type: "v3",
          value: new Vector3(0, 0, 220)
        }
      },
      vertexShader: HALO_VERTEX_SHADER,
      fragmentShader: HALO_FRAGMENT_SHADER,
      side: 1,
      blending: 2,
      transparent: true
    }));
    this.mesh.scale.multiplyScalar(1.15);
    this.mesh.rotateX(.03 * Math.PI);
    this.mesh.rotateY(.03 * Math.PI);
    this.mesh.renderOrder = 3;
  }
}
