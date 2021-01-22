import {
  Vector3,
  Group,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Color
} from "three"

import type Theme from "./theme"

import GLOBE_FRAGMENT_SHADER from "./shaders/globe.frag";
import GLOBE_VERTEX_SHADER from "./shaders/globe.vert";

type GlobeOptions = {
  radius: number,
  detail: number,
  theme: Theme,
  origin: Vector3
};

export default class Globe {
  private radius: number;
  private origin: Vector3;

  private shadowPoint: Vector3;
  private shadowDist: number;

  private highlightPoint: Vector3;
  private highlightDist: number;

  private frontPoint: Vector3;

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
    theme,
    origin
  }: GlobeOptions) {
    this.radius = radius;
    this.origin = origin;
    this.highlightPoint = new Vector3();
    this.highlightDist = 5;
    this.frontPoint = new Vector3();
    this.shadowPoint = new Vector3();
    this.shadowDist = 1.5 * radius;
    this.updateSize(radius, 1);

    this.material = new MeshStandardMaterial({
      color: theme.colors.globe.water,
      metalness: 0,
      roughness: .9
    });

    // Hook up the globe's shaders
    this.uniforms = {
      shadowDist: {
        type: "f",
        value: this.shadowDist
      },
      highlightDist: {
        type: "f",
        value: this.highlightDist
      },
      shadowPoint: {
        type: "v3",
        value: this.shadowPoint
      },
      highlightPoint: {
        type: "v3",
        value: this.highlightPoint
      },
      frontPoint: {
        type: "v3",
        value: this.frontPoint
      },
      highlightColor: {
        type: "c",
        value: new Color(theme.colors.globe.highlight)
      },
      frontHighlightColor: {
        type: "c",
        value: new Color(theme.colors.globe.frontHighlight)
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

  updateSize(radius: number, scale: number) {
    this.radius = radius;
    this.shadowPoint = this.origin.clone().add(new Vector3(.7 * this.radius, .3 * -this.radius, this.radius));
    this.highlightPoint = this.origin.clone().add(new Vector3(1.5 * -this.radius, 1.5 * -this.radius, 0));
    this.frontPoint = this.origin.clone().add(new Vector3(0, 0, this.radius));

    this.shadowDist = 1.5 * this.radius;
    this.highlightDist = 5 * scale;
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
