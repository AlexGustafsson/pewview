import {
  Vector2,
  Vector3,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  Group,
  AmbientLight,
  Clock,
  MeshBasicMaterial,
  SpotLight,
  DirectionalLight,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
  ShaderMaterial,
  Object3D,
  CircleBufferGeometry,
  InstancedMesh,
} from "three"
import Tooltip from "./tooltip"
import Globe from "./globe"
import Controller from "./controller"
import MergedPREntity from "./merged-pr-entity"
import OpenPREntity from "./open-pr-entity"
import Arch from "./arch"
import { bl, messageBus, START_ROTATION, EVENT_PAUSE, EVENT_RESUME, ul, dl } from "./globals"

const Ml = Math.PI / 180; //rad2deg

// Same as open-pr
function Rl(t, e, n, i) {
  i = i || new Vector3;
  const r = (90 - t) * Ml,
    s = (e + 180) * Ml;
  return i.set(-n * Math.sin(r) * Math.cos(s), n * Math.cos(r), n * Math.sin(r) * Math.sin(s)), i
}

// In renderer and merged too
function Ll(t) {
  t instanceof Mesh && (t.geometry && t.geometry.dispose(), t.material && (t.material.map && t.material.map.dispose(), t.material.lightMap && t.material.lightMap.dispose(), t.material.bumpMap && t.material.bumpMap.dispose(), t.material.normalMap && t.material.normalMap.dispose(), t.material.specularMap && t.material.specularMap.dispose(), t.material.envMap && t.material.envMap.dispose(), t.material.emissiveMap && t.material.emissiveMap.dispose(), t.material.metalnessMap && t.material.metalnessMap.dispose(), t.material.roughnessMap && t.material.roughnessMap.dispose(), t.material.dispose()))
}

export default class WebGLController {
  constructor({ element, isMobile, globeRadius }) {
    this.handleResize = this.handleResize.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.setDragging = this.setDragging.bind(this);
    this.update = this.update.bind(this);
    this.hasLoaded = false;
    this.initBase(element);
    this.initScene(globeRadius, isMobile);
    this.addListeners();
    messageBus.on(EVENT_PAUSE, this.handlePause);
    messageBus.on(EVENT_RESUME, this.handleResume);
  }
  initBase(t) {
    const { width, height } = bl.parentNode.getBoundingClientRect();
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(10, width / height, 170, 260);
    this.renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      alpha: false,
      preserveDrawingBuffer: false
    });
    this.then = Date.now() / 1e3;
    this.worldDotRows = 200;
    this.worldDotSize = .095;
    this.renderQuality = 4;
    this.renderer.setPixelRatio(bl.pixelRatio || 1);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(265505, 1);
    t.appendChild(this.renderer.domElement);
    this.renderer.domElement.classList.add("webgl-canvas");
    this.renderer.domElement.classList.add("js-globe-canvas");
    const i = new AmbientLight(16777215, .8);
    this.scene.add(i);
    this.parentContainer = new Group;
    this.parentContainer.name = "parentContainer";
    let r = START_ROTATION;
    const s = (new Date).getTimezoneOffset() || 0;
    r.y = START_ROTATION.y + Math.PI * (s / 720);
    this.parentContainer.rotation.copy(r);
    this.scene.add(this.parentContainer);
    this.haloContainer = new Group();
    this.haloContainer.name = "haloContainer";
    this.scene.add(this.haloContainer);
    this.container = new Group();
    this.container.name = "container";
    this.parentContainer.add(this.container);
    this.camera.position.set(0, 0, 220);
    this.scene.add(this.camera);
    this.clock = new Clock();
    this.mouse = new Vector3(0, 0, .5);
    this.mouseScreenPos = new Vector2(-9999, -9999);
    this.raycaster = new Raycaster();
    this.raycaster.far = 260;
    this.paused = false;
    this.canvasOffset = {
      x: 0,
      y: 0
    }
    this.updateCanvasOffset();
    // could be meshphong
    this.highlightMaterial = new MeshBasicMaterial({
      opacity: 1,
      transparent: false,
      color: 0xffffff
    });
    this.handleResize();
    this.startUpdating();
  }
  initScene(globeRadius, isMobile) {
    this.radius = globeRadius;
    // The light blue atmospheric light
    this.light0 = new SpotLight(0x2188ff, 5, 120, .3, 0, 1.1);
    // Bottom light
    this.light1 = new DirectionalLight(11124735, 3);
    // Highlight / focus light
    this.light3 = new SpotLight(0xf46bbe, 5, 75, .5, 0, 1.25);
    this.light0.target = this.parentContainer;
    this.light1.target = this.parentContainer;
    this.light3.target = this.parentContainer;
    this.scene.add(this.light0, this.light1, this.light3);
    this.positionContainer();
    this.shadowPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(.7 * this.radius, .3 * -this.radius, this.radius));
    this.highlightPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(1.5 * -this.radius, 1.5 * -this.radius, 0));
    this.frontPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(0, 0, this.radius));
    const r = new Globe({
      radius: this.radius,
      detail: 55,
      renderer: this.renderer,
      shadowPoint: this.shadowPoint,
      shadowDist: 1.5 * this.radius,
      highlightPoint: this.highlightPoint,
      highlightColor: 0x517966,
      highlightDist: 5,
      frontPoint: this.frontPoint,
      frontHighlightColor: 0x27367d,
      waterColor: 0x171634,
      landColorFront: 0xffffff,
      landColorBack: 0xffffff
    });
    this.container.add(r.mesh), this.globe = r;
    const s = new Mesh(new SphereBufferGeometry(globeRadius, 45, 45), new ShaderMaterial({
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
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      side: 1,
      blending: 2,
      transparent: true
    }));
    s.scale.multiplyScalar(1.15), s.rotateX(.03 * Math.PI), s.rotateY(.03 * Math.PI), s.renderOrder = 3, this.haloContainer.add(s), this.dragging = false, this.rotationSpeed = .05, this.raycastIndex = 0, this.raycastTrigger = 10, this.raycastTargets = [], this.intersectTests = [], this.controls = new Controller({
      object: this.container,
      objectContainer: this.parentContainer,
      element: this.renderer.domElement,
      setDraggingCallback: this.setDragging,
      rotateSpeed: isMobile ? 1.5 : 3,
      autoRotationSpeed: this.rotationSpeed,
      easing: .12,
      maxRotationX: 1,
      camera: this.camera
    })
  }
  initDataObjects(t, worldMap) {
    const e = {
      openPrColor: 0x2188ff,
      openPrParticleColor: 6137337,
      mergedPrColor: 0xf46bbe,
      mergedPrColorHighlight: 0xffffff
    };
    this.buildWorldGeometry(worldMap);
    this.maxAmount = t.length;
    this.maxIndexDistance = 60;
    this.indexIncrementSpeed = 15;
    this.visibleIndex = 60;
    // this.openPrEntity = new OpenPREntity({
    //   data: t,
    //   maxAmount: this.maxAmount,
    //   radius: this.radius,
    //   camera: this.camera,
    //   maxIndexDistance: this.maxIndexDistance,
    //   indexIncrementSpeed: this.indexIncrementSpeed,
    //   visibleIndex: this.visibleIndex,
    //   colors: e
    // });
    this.mergedPrEntity = new MergedPREntity({
      data: t,
      maxAmount: this.maxAmount,
      radius: this.radius,
      camera: this.camera,
      maxIndexDistance: this.maxIndexDistance,
      visibleIndex: this.visibleIndex,
      colors: e,
      mouse: this.mouse
    });
    const {
      width: n,
      height: i
    } = bl.parentNode.getBoundingClientRect(), r = 850 / i * 1;
    this.containerScale = r, this.dataInfo = new Tooltip({
      parentSelector: ".js-webgl-globe-data",
      domElement: this.renderer.domElement,
      controls: this.controls
    });
    this.dataItem = {};
    this.intersectTests.push(this.globe.meshFill);
    // this.intersectTests.push(this.openPrEntity.spikeIntersects);
    this.intersectTests.push(...this.mergedPrEntity.lineHitMeshes);
    this.intersects = []
  }
  updateRenderQuality() {
    4 == this.renderQuality ? this.initRegularQuality() : 3 == this.renderQuality ? this.initMediumQuality() : 2 == this.renderQuality ? this.initLowQuality() : 1 == this.renderQuality && this.initLowestQuality()
  }
  initRegularQuality() {
    this.renderer.setPixelRatio(bl.pixelRatio || 1), this.indexIncrementSpeed = 15, this.raycastTrigger = 10
  }
  initMediumQuality() {
    this.renderer.setPixelRatio(Math.min(bl.pixelRatio, 1.85)), this.indexIncrementSpeed = 13, this.raycastTrigger = 12
  }
  initLowQuality() {
    this.renderer.setPixelRatio(Math.min(bl.pixelRatio, 1.5)), this.indexIncrementSpeed = 10, this.raycastTrigger = 14, this.worldDotRows = 180, this.worldDotSize = .1, this.resetWorldMap(), this.buildWorldGeometry()
  }
  initLowestQuality() {
    this.renderer.setPixelRatio(1), this.indexIncrementSpeed = 5, this.raycastTrigger = 16, this.worldDotRows = 140, this.worldDotSize = .1, this.resetWorldMap(), this.buildWorldGeometry()
  }
  initPerformanceEmergency() {
    this.dispose()
  }
  buildWorldGeometry(worldMap) {
    const e = new Object3D;
    const n = this.getImageData(worldMap.image);
    const i = [];
    const r = this.worldDotRows;
    for (let h = -90; h <= 90; h += 180 / r) {
      const t = Math.cos(Math.abs(h) * Ml) * this.radius * Math.PI * 2 * 2;
      for (let r = 0; r < t; r++) {
        const s = 360 * r / t - 180;
        if (!this.visibilityForCoordinate(s, h, n)) continue;
        const o = Rl(h, s, this.radius);
        e.position.set(o.x, o.y, o.z);
        const c = Rl(h, s, this.radius + 5);
        e.lookAt(c.x, c.y, c.z), e.updateMatrix(), i.push(e.matrix.clone())
      }
    }
    const s = new CircleBufferGeometry(this.worldDotSize, 5),
      o = new MeshStandardMaterial({
        color: 3818644,
        metalness: 0,
        roughness: .9,
        transparent: true,
        alphaTest: .02
      });
    o.onBeforeCompile = function(t) {
      t.fragmentShader = t.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "\n        gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n        if (gl_FragCoord.z > 0.51) {\n          gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0;\n        }\n      ")
    };
    const c = new InstancedMesh(s, o, i.length);
    for (let h = 0; h < i.length; h++) c.setMatrixAt(h, i[h]);
    c.renderOrder = 3, this.worldMesh = c, this.container.add(c)
  }
  resetWorldMap() {
    this.container.remove(this.worldMesh), Ll(this.worldMesh), this.dotMesh = null
  }
  highlightArcticCodeVault() {
    this.vaultIsHighlighted || (this.arcticCodeVaultMesh.material = this.highlightMaterial, this.vaultIsHighlighted = true)
  }
  resetArcticCodeVaultHighlight() {
    this.vaultIsHighlighted && (this.arcticCodeVaultMesh.material = this.vaultMaterial, this.vaultIsHighlighted = false)
  }
  visibilityForCoordinate(t, e, n) {
    const i = 4 * n.width,
      r = parseInt((t + 180) / 360 * n.width + .5),
      s = n.height - parseInt((e + 90) / 180 * n.height - .5),
      o = parseInt(i * (s - 1) + 4 * r) + 3;
    return n.data[o] > 90
  }
  getImageData(t) {
    const e = document.createElement("canvas").getContext("2d");
    e.canvas.width = t.width;
    e.canvas.height = t.height;
    e.drawImage(t, 0, 0, t.width, t.height);
    return e.getImageData(0, 0, t.width, t.height);
  }
  addListeners() {
    window.addEventListener("resize", this.handleResize, false), window.addEventListener("orientationchange", this.handleResize, false), window.addEventListener("scroll", this.handleScroll, false), this.handleClick = t => {
      null === this.dataItem || null === this.dataItem.url || this.shouldCancelClick(t) || window.open(this.dataItem.url, "_blank")
    }, this.renderer.domElement.addEventListener("mouseup", this.handleClick, false), this.handleMouseDown = t => {
      this.resetInteractionIntention(t)
    }, this.renderer.domElement.addEventListener("mousedown", this.handleMouseDown, false), this.handleTouchStart = t => {
      const e = t.changedTouches[0];
      this.handleMouseMove(e), this.resetInteractionIntention(e), t.preventDefault()
    }, this.renderer.domElement.addEventListener("touchstart", this.handleTouchStart, false), this.handleTouchMove = t => {
      this.shouldCancelClick(t.changedTouches[0]) && (this.mouse = {
        x: -9999,
        y: -9999
      }, t.preventDefault())
    }, this.renderer.domElement.addEventListener("touchmove", this.handleTouchMove, false), this.renderer.domElement.addEventListener("mousemove", this.handleMouseMove, false)
  }
  removeListeners() {
    window.removeEventListener("resize", this.handleResize), window.removeEventListener("orientationchange", this.handleResize), window.removeEventListener("scroll", this.handleScroll), this.renderer.domElement.removeEventListener("mousemove", this.handleMouseMove), this.renderer.domElement.removeEventListener("mouseup", this.handleClick), this.renderer.domElement.removeEventListener("mousedown", this.handleMouseDown), this.renderer.domElement.removeEventListener("touchstart", this.handleTouchStart), this.renderer.domElement.removeEventListener("touchmove", this.handleTouchMove)
  }
  updateCanvasOffset() {
    const t = document.querySelector(".js-webgl-globe-data").getBoundingClientRect(),
      e = document.querySelector(".js-webgl-globe").getBoundingClientRect();
    this.canvasOffset = {
      x: e.x - t.x,
      y: e.y - t.y
    }
  }
  resetInteractionIntention(t) {
    this.mouseDownPos = {
      x: t.clientX,
      y: t.clientY
    }
  }
  shouldCancelClick(t) {
    const e = Math.abs(t.clientX - this.mouseDownPos.x);
    return Math.abs(t.clientY - this.mouseDownPos.y) > 2 || e > 2
  }
  positionContainer() {
    const {
      isMobile: t,
      parentNode: e
    } = bl, {
      height: n
    } = e.getBoundingClientRect(), i = 850 / n * 1;
    this.containerScale = i, t ? this.parentContainer.position.set(0, 0, 0) : (this.parentContainer.scale.set(i, i, i), this.parentContainer.position.set(0, 0, 0), this.haloContainer.scale.set(i, i, i)), this.haloContainer.position.set(0, 0, -10), this.positionLights(i)
  }
  positionLights(t = 1) {
    this.light0 && (this.light0.position.set(this.parentContainer.position.x - 2.5 * this.radius, 80, -40).multiplyScalar(t), this.light0.distance = 120 * t), this.light1 && this.light1.position.set(this.parentContainer.position.x - 50, this.parentContainer.position.y + 30, 10).multiplyScalar(t), this.light2 && (this.light2.position.set(this.parentContainer.position.x - 25, 0, 100).multiplyScalar(t), this.light2.distance = 150 * t), this.light3 && (this.light3.position.set(this.parentContainer.position.x + this.radius, this.radius, 2 * this.radius).multiplyScalar(t), this.light3.distance = 75 * t)
  }
  handlePause() {
    this.stopUpdating(), this.clock.stop()
  }
  handleResume() {
    this.clock.start(), this.startUpdating()
  }
  handleScroll() {
    window.scrollY >= this.renderer.domElement.getBoundingClientRect().height && !this.paused ? (this.paused = true, messageBus.emit(EVENT_PAUSE)) : window.scrollY < this.renderer.domElement.getBoundingClientRect().height && this.paused && (this.paused = false, messageBus.emit(EVENT_RESUME))
  }
  handleResize() {
    clearTimeout(this.resizeTimeout), this.resizeTimeout = setTimeout((() => {
      const {
        width: t,
        height: e
      } = bl.parentNode.getBoundingClientRect();
      this.camera.aspect = t / e, this.camera.updateProjectionMatrix(), this.renderer.setSize(t, e), this.positionContainer();
      const n = 850 / e * 1,
        i = this.radius * n;
      this.shadowPoint.copy(this.parentContainer.position).add(new Vector3(.7 * i, .3 * -i, i)), this.globe.setShadowPoint(this.shadowPoint), this.highlightPoint.copy(this.parentContainer.position).add(new Vector3(1.5 * -i, 1.5 * -i, 0)), this.globe.setHighlightPoint(this.highlightPoint), this.frontPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(0, 0, i)), this.globe.setFrontPoint(this.frontPoint), this.globe.setShadowDist(1.5 * i), this.globe.setHighlightDist(5 * n), this.updateCanvasOffset()
    }), 150)
  }
  handleMouseMove(t) {
    null != t.preventDefault && t.preventDefault();
    const {
      width: e,
      height: n,
      x: i,
      y: r
    } = bl.parentNode.getBoundingClientRect(), s = t.clientX - i, o = t.clientY - r;
    this.mouse.x = s / e * 2 - 1, this.mouse.y = -o / n * 2 + 1, this.mouseScreenPos.set(s, o)
  }
  startUpdating() {
    this.stopUpdating(), this.update()
  }
  stopUpdating() {
    cancelAnimationFrame(this.rafID)
  }
  setDragging(t = true) {
    this.dragging = t
  }
  setDataInfo(t) {
    if (!this.dataInfo) return;
    if (this.dataItem == t) return;
    this.dataItem = t;
    const {
      uol: e,
      uml: n,
      l: i,
      type: r,
      body: s,
      header: o,
      nwo: c,
      pr: h,
      ma: u,
      oa: d
    } = t;
    let f = u || d;
    f && (f = f.replace(" ", "T"), f = f.includes("Z") ? f : f.concat("-08:00"), f = Date.parse(f)), c && h && (this.dataItem.url = `https://github.com/${c}/pull/${h}`), this.dataInfo.setInfo({
      user_opened_location: e,
      user_merged_location: n,
      language: i,
      name_with_owner: c,
      pr_id: h,
      time: f,
      type: r,
      body: s,
      header: o,
      url: this.dataItem.url
    })
  }
  testForDataIntersection() {
    const {
      mouse: t,
      raycaster: e,
      camera: n
    } = this;
    this.intersects.length = 0,
      function(t, e, n, i, r, s = false) {
        (i = i || new ja).setFromCamera(t, e);
        const o = i.intersectObjects(n, s, r);
        o.length > 0 && o[0]
      }(t, n, this.intersectTests, e, this.intersects), this.intersects.length && this.intersects[0].object === this.globe.meshFill && (this.intersects.length = 0)
  }
  transitionIn() {
    return new Promise((() => {
      // this.container.add(this.openPrEntity.mesh);
      this.container.add(this.mergedPrEntity.mesh)

      // TODO: Temporary
      const arch = new Arch({
        source: {latitude: 50.510986, longitude: 16.049161}, // "Europe"
        destination: {latitude: 2.341285, longitude: 21.940375}, // "Africa"
        globeRadius: this.radius,
        colors: {normal: 0xff0000, highlighted: 0xffffff}
      })
      this.container.add(arch.mesh)
    }))
  }
  handleUpdate() {
    if (null === this.clock) return;
    const t = this.clock.getDelta();
    if (this.controls && this.controls.update(t), this.visibleIndex += t * this.indexIncrementSpeed, this.visibleIndex >= this.maxAmount - 60 && (this.visibleIndex = 60), this.openPrEntity && this.openPrEntity.update(this.visibleIndex), this.mergedPrEntity && this.mergedPrEntity.update(t, this.visibleIndex), !this.dataInfo) return void this.render();
    const {
      raycaster: e,
      camera: n,
      mouseScreenPos: i
    } = this;
    let r, s = false;
    if (this.raycastIndex % this.raycastTrigger == 0) {
      if (this.testForDataIntersection(), this.intersects.length) {
        this.radius, this.containerScale;
        for (let t = 0; t < this.intersects.length && !s; t++) {
          const {
            instanceId: e,
            object: n
          } = this.intersects[t];
          if ("lineMesh" === n.name) {
            r = this.setMergedPrEntityDataItem(n), s = true;
            break
          }
          if (this.openPrEntity && n === this.openPrEntity.spikeIntersects && this.shouldShowOpenPrEntity(e)) {
            r = this.setOpenPrEntityDataItem(e), s = true;
            break
          }
          if ("arcticCodeVault" === n.name) {
            r = {
              header: "Arctic Code Vault",
              body: "Svalbard â€¢ Cold storage of the work of 3,466,573 open source developers. For safe keeping.\nLearn more â†’",
              type: pl,
              url: "https://archiveprogram.github.com"
            }, this.highlightArcticCodeVault(), s = true;
            break
          }
        }
      }
      s && r ? (this.setDataInfo(r), this.dataInfo.show()) : (this.dataInfo.hide(), this.openPrEntity && this.openPrEntity.setHighlightIndex(-9999), this.mergedPrEntity.resetHighlight(), this.resetArcticCodeVaultHighlight(), this.dataItem = null, bl.isMobile && (this.mouse = {
        x: -9999,
        y: -9999
      }))
    }
    this.dragging && (this.dataInfo.hide(), this.openPrEntity && this.openPrEntity.setHighlightIndex(-9999), this.mergedPrEntity.resetHighlight(), this.resetArcticCodeVaultHighlight()), this.dataInfo.isVisible && this.dataInfo.update(i, this.canvasOffset), this.raycastIndex++ , this.raycastIndex >= this.raycastTrigger && (this.raycastIndex = 0), this.render()
  }
  update() {
    this.handleUpdate(), this.hasLoaded || this.sceneDidLoad(), this.rafID = requestAnimationFrame(this.update)
  }
  render() {
    this.renderer.render(this.scene, this.camera)
  }
  shouldShowMergedPrEntity(t, e) {
    const n = t.geometry.attributes.index.array[e];
    return n >= this.visibleIndex - this.maxIndexDistance && n <= this.visibleIndex + this.maxIndexDistance
  }
  sceneDidLoad() {
    this.hasLoaded = true;
    const t = document.querySelector(".js-webgl-globe-loading");
    if (!t) return;
    const e = {
      fill: "both",
      duration: 600,
      easing: "ease"
    };
    this.renderer.domElement.animate([{
      opacity: 0,
      transform: "scale(0.8)"
    }, {
      opacity: 1,
      transform: "scale(1)"
    }], e), t.animate([{
      opacity: 1,
      transform: "scale(0.8)"
    }, {
      opacity: 0,
      transform: "scale(1)"
    }], e).addEventListener("finish", (() => {
      t.remove()
    }))
  }
  setMergedPrEntityDataItem(t) {
    this.mergedPrEntity.setHighlightObject(t);
    // this.openPrEntity.setHighlightIndex(-9999);
    const e = this.mergedPrEntity.props.data.Connections[parseInt(t.userData.dataIndex)];
    return e.type = dl, e
  }
  shouldShowOpenPrEntity(t) {
    return t >= this.visibleIndex - this.maxIndexDistance && t <= this.visibleIndex + this.maxIndexDistance
  }
  setOpenPrEntityDataItem(t) {
    // this.openPrEntity.setHighlightIndex(t);
    this.mergedPrEntity.resetHighlight();
    // const e = this.openPrEntity.props.data.Connections[t];
    // return e.type = ul, e
  }
  dispose() {
    this.stopUpdating(), this.removeListeners(), messageBus.off(EVENT_PAUSE, this.handlePause), messageBus.off(EVENT_RESUME, this.handleResume), this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode && this.renderer.domElement.parentNode.removeChild(this.renderer.domElement), this.controls && this.controls.dispose(), this.globe && this.globe.dispose(), this.openPrEntity && this.openPrEntity.dispose(), this.mergedPrEntity && this.mergedPrEntity.dispose(), this.dataInfo && this.dataInfo.dispose(), this.scene = null, this.camera = null, this.renderer = null, this.parentContainer = null, this.container = null, this.clock = null, this.mouse = null, this.mouseScreenPos = null, this.raycaster = null, this.paused = null, this.radius = null, this.light0 = null, this.light1 = null, this.light2 = null, this.light3 = null, this.shadowPoint = null, this.highlightPoint = null, this.frontPoint = null, this.globe = null, this.dragging = null, this.rotationSpeed = null, this.raycastIndex = null, this.raycastTrigger = null, this.raycastTargets = null, this.intersectTests = null, this.controls = null, this.maxAmount = null, this.maxIndexDistance = null, this.indexIncrementSpeed = null, this.visibleIndex = null, this.openPrEntity = null
  }
}
