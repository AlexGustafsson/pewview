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

  filterData(t) {
    const e = [];
    for (let r = 0; r < t.length; r++) {
        const n = t[r],
            i = n.gop,
            s = n.gm;
        (i || s) && (n.gop = i || s, n.gm = s || i, n.uol = n.uol || n.uml, n.uml = n.uml || n.uol, n.gop.lat && n.gop.lon && n.gm.lat && n.gm.lon && (n.oa || n.ma) && e.splice(Math.floor(Math.random() * e.length), 0, n))
    }
    const n = e.slice(e.length - 60, e.length),
        i = e.slice(0, 60);
    return n.concat(e, i)
  }

  async init() {
    const worldMap = await new Promise((resolve, reject) => {
      new TextureLoader().load("/static/map.png", texture => resolve(texture), null, error => reject(error));
    });

    const dataRequest = await fetch("/static/data.json", {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const data = await dataRequest.json();

    bl.data = this.filterData(data);
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
