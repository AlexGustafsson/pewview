import {
  TextureLoader
} from "../include/three"

export default class Loader {
  constructor() {
    this.reset()
  }
  reset() {
    clearInterval(this.interval);
    this.loadInfo = {};
    this.assets = {}
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
    if (!this.progressCallback)
      return;

    let t = 0, e = 0;
    for (const n in this.loadInfo) this.loadInfo[n].loaded && (t += this.loadInfo[n].loaded), this.loadInfo[n].total && (e += this.loadInfo[n].total);
    this.progressCallback && this.progressCallback(t, e)
  }
  dispose() {
    clearInterval(this.interval);
    this.interval = null;
    this.loadInfo = null;
    this.assets = null;
    this.progressCallback = null;
  }
}
