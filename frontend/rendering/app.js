import Renderer from "./renderer"
import {bl} from "./globals"
import Loader from "./loader"

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

    for (const [key, value] of Object.entries(this.options))
      bl[key] = value;
  }

  async loadAssets() {
    const sources = [{
      url: `${this.options.basePath}${this.options.imagePath}map.png`,
      id: "worldMap"
    }];

    const loader = new Loader();
    const {assets} = await loader.load(sources);
    loader.dispose();
    return assets
  }

  async loadData() {
    const response = await fetch(this.options.dataPath + "data.json", {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.status !== 200)
      throw new Error(`WebGL Globe: Failed to load data.json (status: ${e.status})`);

    const data = await response.json();
    if (!data || 0 === data.length)
      throw new Error("WebGL Globe: data.json response was empty");

    return data;
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
    const assets = await this.loadAssets();
    bl.assets = assets;

    const data = await this.loadData();
    bl.data = this.filterData(data);
    this.webglController = new Renderer(bl.parentNode || document.body);
    this.webglController.initDataObjects(bl.data);
    this.webglController.transitionIn(1.5, .6);
  }

  get renderer() {
    return this.webglController ? this.webglController.renderer : null
  }

  get canvas() {
    return this.webglController ? this.webglController.renderer.domElement : null
  }
}
