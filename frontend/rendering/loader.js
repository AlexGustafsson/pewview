import {
  TextureLoader
} from "../include/three"
import Renderer from "./renderer"
import {bl, _l, vl, yl} from "./globals"

async function Ul(t = "") {
    const e = await fetch(t, {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (200 !== e.status) throw new Error(`WebGL Globe: Failed to load data.json (status: ${e.status})`);
    return e.json()
}

class Loader2 {
    constructor() {
        this.reset()
    }
    reset() {
        clearInterval(this.interval), this.loadInfo = {}, this.assets = {}
    }
    load(t, e) {
        return this.reset(), this.progressCallback = e, new Promise((e => {
            if (!t.length) return void e(null);
            const n = [];
            t.forEach((t => {
                "[object Array]" !== Object.prototype.toString.call(t.url) && (t.url.indexOf(".png") > -1 || t.url.indexOf(".jpg") > -1 || t.url.indexOf(".jpeg") > -1 || t.url.indexOf(".gif") > -1 ? (this.assets.textures = this.assets.textures || {}, n.push(this.loadTexture(t))) : t.url.indexOf(".json") > -1 && 0 === t.type && (this.assets.data = this.assets.data || {}, n.push(this.loadData(t))))
            })), this.interval = setInterval(this.update, 1e3 / 30), Promise.all(n).then((() => {
                e({
                    assets: this.assets,
                    loader: this
                })
            }))
        }))
    }
    loadData(t) {
        this.loadInfo[t.id] = {
            loaded: 0,
            total: 0
        };
        const e = new XMLHttpRequest;
        let n = false;
        return new Promise(((i, r) => {
            const s = () => {
                n = true, this.assets.data[t.id] = null, this.loadInfo[t.id].loaded = this.loadInfo[t.id].total = 1, r(new Error("loadData error"))
            };
            e.addEventListener("progress", (e => {
                this.loadInfo[t.id].loaded = e.loaded, this.loadInfo[t.id].total = e.total
            })), e.overrideMimeType("application/json"), e.open("GET", t.url, true), e.onreadystatechange = () => {
                4 === e.readyState && 200 === e.status ? (this.assets.data[t.id] = JSON.parse(e.responseText), this.loadInfo[t.id].loaded = this.loadInfo[t.id].total, i(this.assets.data[t.id])) : 404 !== e.status || n || s()
            }, e.onerror = s, e.send()
        }))
    }
    loadTexture({url, id}) {
      const textureLoader = new TextureLoader;
      this.loadInfo[id] = {
        loaded: 0,
        total: 0
      };
      return new Promise((resolve, reject) => {
        console.log("Loading texture", url, id);
        textureLoader.load(url, texture => {
          console.log("Loaded texture", texture);
          this.loadInfo[id].loaded = this.loadInfo[id].total, this.assets.textures[id] = texture;
          resolve();
        }, ({total, loaded}) => {
          console.log("Texture loading progressed");
          this.loadInfo[id].loaded = loaded, this.loadInfo[id].total = total;
        }, error => {
          console.error("Unable to load texture", error);
          reject(error);
        });
      });
    }
    update() {
        if ("function" == typeof this.progressCallback) {
            let t = 0,
                e = 0;
            for (const n in this.loadInfo) this.loadInfo[n].loaded && (t += this.loadInfo[n].loaded), this.loadInfo[n].total && (e += this.loadInfo[n].total);
            this.progressCallback && this.progressCallback(t, e)
        }
    }
    dispose() {
        clearInterval(this.interval), this.interval = null, this.loadInfo = null, this.assets = null, this.progressCallback = null
    }
}

export default class Loader {
    constructor(t) {
        this.init = this.init.bind(this), this.handleVisibilityChange = this.handleVisibilityChange.bind(this),
            function(t) {
                for (const [e, n] of Object.entries(t)) bl[e] = n
            }({
                app: this,
                env: "production",
                isMobile: /iPhone|iPad|iPod|Android|BlackBerry|BB10/i.test(navigator.userAgent),
                pixelRatio: window.devicePixelRatio || 1,
                ...t
            })
    }
    loadAssets() {
        const {
            basePath: t,
            imagePath: e
        } = bl, n = [{
            url: `${t}${e}map.png`,
            id: "worldMap"
        }], i = new Loader2();
        return new Promise(((t, e) => {
            i.load(n).then((({
                assets: e
            }) => {
                t(e), i.dispose()
            })).catch((t => e(t)))
        }))
    }
    async loadData() {
        try {
            const t = await Ul(bl.dataPath + "data.json");
            if (!t || 0 === t.length) throw new Error("WebGL Globe: data.json response was empty");
            return t
        } catch {
            return await this.loadFallbackData()
        }
    }
    async loadFallbackData() {
        try {
            const t = await Ul(bl.dataPath + "fallback.json");
            if (!t || 0 === t.length) throw new Error("WebGL Globe: fallback.json response was empty");
            return t
        } catch (t) {
            throw new Error(t)
        }
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
    trackPageVisibility() {
        let t, e;
        void 0 !== document.hidden ? (t = "hidden", e = "visibilitychange") : void 0 !== document.msHidden ? (t = "msHidden", e = "msvisibilitychange") : void 0 !== document.webkitHidden && (t = "webkitHidden", e = "webkitvisibilitychange"), this.documentHidden = t, this.visibilityChange = e, document.addEventListener(e, this.handleVisibilityChange, false)
    }
    init() {
        return new Promise(((t, e) => {
            this.loadAssets().then((n => {
                bl.assets = n;
                const {
                    parentNode: i = document.body
                } = bl;
                this.loadData().then((e => {
                    bl.data = this.filterData(e);
                    this.webglController = new Renderer(i);
                    this.webglController.initDataObjects(bl.data);
                    this.webglController.transitionIn(1.5, .6), this.trackPageVisibility();
                    t();
                })).catch((t => {
                    e(t)
                }))
            })).catch((t => {
                e(t)
            }))
        }))
    }
    handleVisibilityChange() {
        document[this.documentHidden] ? _l.emit(vl) : _l.emit(yl)
    }
    get renderer() {
        return this.webglController ? this.webglController.renderer : null
    }
    get canvas() {
        return this.webglController ? this.webglController.renderer.domElement : null
    }
    dispose() {
        document.removeEventListener(this.visibilityChange, this.handleVisibilityChange), this.webglController.dispose(), this.webglController = null, this.visibilityChange = null, this.documentHidden = null, Object.keys(bl).forEach((t => {
            delete bl[t]
        }))
    }
}
