import {
  Vector3,
  Group,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Color
} from "../include/three"

import GLOBE_FRAGMENT_SHADER from "./shaders/globe.frag";
import GLOBE_VERTEX_SHADER from "./shaders/globe.vert";

export default class Globe {
  constructor({
    radius,
    detail,
    shadowPoint,
    highlightPoint,
    highlightColor,
    frontHighlightColor,
    waterColor,
    shadowDist,
    highlightDist,
    frontPoint
  }) {
    this.material = new MeshStandardMaterial({
      color: waterColor,
      metalness: 0,
      roughness: .9
    });

    // Hook up the globe's shaders
    this.uniforms = [];
    this.material.onBeforeCompile = (shader, _renderer) => {
      shader.uniforms.shadowDist = {value: shadowDist}
      shader.uniforms.highlightDist = {value: highlightDist}
      shader.uniforms.shadowPoint = {value: (new Vector3).copy(shadowPoint)}
      shader.uniforms.highlightPoint = {value: (new Vector3).copy(highlightPoint)}
      shader.uniforms.frontPoint = {value: (new Vector3).copy(frontPoint)}
      shader.uniforms.highlightColor = {value: new Color(highlightColor)}
      shader.uniforms.frontHighlightColor = {value: new Color(frontHighlightColor)}
      shader.fragmentShader = GLOBE_FRAGMENT_SHADER,
      shader.vertexShader = GLOBE_VERTEX_SHADER,
      this.uniforms.push(shader.uniforms);
    };

    // Declare shader constants
    this.material.defines = {
      USE_HIGHLIGHT: 1,
      USE_HIGHLIGHT_ALT: 1,
      USE_FRONT_HIGHLIGHT: 1,
      DITHERING: 1
    };

    // Create the geometry
    const geometry = new SphereBufferGeometry(radius, detail, detail);
    this.mesh = new Group();
    this.meshFill = new Mesh(geometry, this.material);
    this.meshFill.renderOrder = 1;
    this.mesh.add(this.meshFill);
  }

  setShadowPoint(value) {
    for (const uniform of this.uniforms)
      uniform.shadowPoint.value.copy(value);
  }

  setHighlightPoint(value) {
    for (const uniform of this.uniforms)
      uniform.highlightPoint.value.copy(value);
  }

  setFrontPoint(value) {
    for (const uniform of this.uniforms)
      uniform.frontPoint.value.copy(value);
  }

  setShadowDist(value) {
    for (const uniform of this.uniforms)
      uniform.shadowDist.value = value;
  }

  setHighlightDist(value) {
    for (const uniform of this.uniforms)
      uniform.highlightDist.value = value;
  }
}
