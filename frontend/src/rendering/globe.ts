import {
  Vector3,
  Group,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Color
} from "three"

import GLOBE_FRAGMENT_SHADER from "./shaders/globe.frag";
import GLOBE_VERTEX_SHADER from "./shaders/globe.vert";

type GlobeOptions = {
  radius: number,
  detail: number,
  shadowPoint: Vector3,
  highlightPoint: Vector3,
  highlightColor: number,
  frontHighlightColor: number,
  waterColor: number,
  shadowDist: number,
  highlightDist: number,
  frontPoint: Vector3
};

type Uniform<T> = {
  type: string,
  value: T
};

export default class Globe {
  material: MeshStandardMaterial;
  uniforms: {
    shadowDist: Uniform<number>,
    highlightDist: Uniform<number>,
    shadowPoint: Uniform<Vector3>,
    highlightPoint: Uniform<Vector3>,
    frontPoint: Uniform<Vector3>,
    highlightColor: Uniform<Color>,
    frontHighlightColor: Uniform<Color>
  };
  mesh: Group;
  meshFill: Mesh;

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
  }: GlobeOptions) {
    this.material = new MeshStandardMaterial({
      color: waterColor,
      metalness: 0,
      roughness: .9
    });

    // Hook up the globe's shaders
    this.uniforms = {
      shadowDist: {
        type: "f",
        value: shadowDist
      },
      highlightDist: {
        type: "f",
        value: highlightDist
      },
      shadowPoint: {
        type: "v3",
        value: (new Vector3()).copy(shadowPoint)
      },
      highlightPoint: {
        type: "v3",
        value: (new Vector3()).copy(highlightPoint)
      },
      frontPoint: {
        type: "v3",
        value: (new Vector3()).copy(frontPoint)
      },
      highlightColor: {
        type: "c",
        value: new Color(highlightColor)
      },
      frontHighlightColor: {
        type: "c",
        value: new Color(frontHighlightColor)
      }
    }
    this.material.onBeforeCompile = (shader, _renderer) => {
      this.uniforms = {...shader.uniforms, ...this.uniforms};
      shader.uniforms = this.uniforms;
      shader.fragmentShader = GLOBE_FRAGMENT_SHADER;
      shader.vertexShader = GLOBE_VERTEX_SHADER;
    };

    // Declare shader constants
    this.material.defines = {
      USE_HIGHLIGHT: true,
      USE_HIGHLIGHT_ALT: true,
      USE_FRONT_HIGHLIGHT: true,
      DITHERING: true,
      FLAT_SHADED: false,
      USE_SHEEN: false,
      TRANSPARENCY: false,
      REFLECTIVITY: false,
      USE_TANGENT: false,
      PHYSICAL: false,
    	CLEARCOAT: false,
      USE_MAP: false,
      IS_FILL: false,
      USE_INSTANCING: false,
    };

    // Create the geometry
    const geometry = new SphereBufferGeometry(radius, detail, detail);
    this.mesh = new Group();
    this.meshFill = new Mesh(geometry, this.material);
    this.meshFill.renderOrder = 1;
    this.mesh.add(this.meshFill);
  }

  setShadowPoint(value: Vector3) {
    this.uniforms.shadowPoint.value.copy(value);
  }

  setHighlightPoint(value: Vector3) {
    this.uniforms.highlightPoint.value.copy(value);
  }

  setFrontPoint(value: Vector3) {
    this.uniforms.frontPoint.value.copy(value);
  }

  setShadowDist(value: number) {
    this.uniforms.shadowDist.value = value;
  }

  setHighlightDist(value: number) {
    this.uniforms.highlightDist.value = value;
  }
}
