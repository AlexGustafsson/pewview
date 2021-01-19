import {TextureLoader} from "../include/three"
import WebGLController from "./web-gl-controller"
import {bl} from "./globals"

export default class App {
  constructor(options) {
    this.init = this.init.bind(this);

    this.options = {
      app: this,
      env: "production",
      isMobile: /iPhone|iPad|iPod|Android|BlackBerry|BB10/i.test(navigator.userAgent),
      pixelRatio: window.devicePixelRatio || 1,
      // basePath,
      // imagePath
      ...options
    }
    console.log(options);

    for (const [key, value] of Object.entries(this.options))
      bl[key] = value;
  }

  async init() {
    const worldMap = await new Promise((resolve, reject) => {
      new TextureLoader().load("/static/map.png", texture => resolve(texture), null, error => reject(error));
    });

    const dataRequest = await fetch("/api/v1/buckets/latest", {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await dataRequest.json();

    bl.data = data;
    this.webglController = new WebGLController({element: bl.parentNode, isMobile: this.options.isMobile, globeRadius: this.options.globeRadius});
    this.webglController.initDataObjects(bl.data, worldMap);
    this.webglController.transitionIn(1.5, .6);
  }

  get renderer() {
    return this.webglController ? this.webglController.renderer : null
  }

  get canvas() {
    return this.webglController ? this.webglController.renderer.domElement : null
  }
}
