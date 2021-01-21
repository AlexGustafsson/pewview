import {GUI} from "dat.gui"
import WorldMap from "./world-map"

// The number of seconds to wait before updating debounced values
// such as the FPS
const UPDATE_DEBOUNCE = 0.2;

export default class DebugUI {
  constructor({
    renderer
  }) {
    this.gui = new GUI();
    this.renderer = renderer;

    this.elapsedTime = 0;

    this.options = {
      rendering: {
        fps: 0,
        drawTime: 0,
        animateHalo: renderer.halo && renderer.halo.animate,
        animateStars: Boolean(renderer.stars && renderer.stars.animate),
        enableHalo: renderer.halo !== null,
        enableStars: renderer.stars !== null,
        toggle() {
          if (renderer.isRunning)
            renderer.stop();
          else
            renderer.start();
        }
      },
      worldMap: {
        rows: renderer.worldMap.rows,
        size: renderer.worldMap.size,
      },
      lights: {
        light0: renderer.lights.light0.visible,
        light1: renderer.lights.light1.visible,
        light2: renderer.lights.light2.visible,
        light4: renderer.lights.light4.visible,
      }
    };

    const renderingFolder = this.gui.addFolder("Rendering");

    const fps = renderingFolder.add(this.options.rendering, "fps").name("FPS").listen();
    fps.domElement.style.pointerEvents = "none";

    const drawTime = renderingFolder.add(this.options.rendering, "drawTime").step(0.001).name("Draw Time").listen();
    drawTime.domElement.style.pointerEvents = "none";

    renderingFolder.add(this.options.rendering, "animateHalo").name("Animate Halo");
    renderingFolder.add(this.options.rendering, "animateStars").name("Animate Stars");
    renderingFolder.add(this.options.rendering, "enableHalo").name("Enable Halo");
    renderingFolder.add(this.options.rendering, "enableStars").name("Enable Stars");

    renderingFolder.add(this.options.rendering, "toggle").name("Toggle Rendering");

    renderingFolder.open();

    const worldMapFolder = this.gui.addFolder("World Map");
    worldMapFolder.add(this.options.worldMap, "rows", 0, 400).step(5).name("Rows");
    worldMapFolder.add(this.options.worldMap, "size", 0, 0.25).step(0.005).name("Size");
    worldMapFolder.open();

    const lightsFolder = this.gui.addFolder("Lights");
    lightsFolder.add(this.options.lights, "light0").name("Enable Light 0");
    lightsFolder.add(this.options.lights, "light1").name("Enable Light 1");
    lightsFolder.add(this.options.lights, "light2").name("Enable Light 2");
    lightsFolder.add(this.options.lights, "light4").name("Enable Light 4");
    lightsFolder.open();
  }

  debouncedUpdate(deltaTime, _elapsedTime) {
    this.options.rendering.fps = this.renderer.fps;
    this.options.rendering.drawTime = deltaTime;

    const worldMapRowsChanged = this.options.worldMap.rows !== this.renderer.worldMap.rows;
    const worldMapSizeChanged = this.options.worldMap.size !== this.renderer.worldMap.size
    const worldMapChanged = worldMapRowsChanged || worldMapSizeChanged;
    if (worldMapChanged) {
      this.renderer.container.remove(this.renderer.worldMap.mesh);
      this.renderer.worldMap = new WorldMap({
        radius: this.renderer.worldMap.radius,
        texture: this.renderer.worldMap.texture,
        rows: this.options.worldMap.rows,
        size: this.options.worldMap.size
      });
      this.renderer.container.add(this.renderer.worldMap.mesh);
    }
  }

  update(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= UPDATE_DEBOUNCE) {
      this.debouncedUpdate(deltaTime, this.elapsedTime);
      this.elapsedTime = 0;
    }

    const haloEnabled = this.renderer.halo !== null;
    if (this.options.rendering.enableHalo !== haloEnabled) {
      if (this.options.rendering.enableHalo)
        this.renderer.enableHalo(this.options.rendering.animateHalo);
      else
        this.renderer.disableHalo();
    }


    const haloAnimationEnabled = this.renderer.halo && this.renderer.halo.animate;
    if (this.options.rendering.animateHalo !== haloAnimationEnabled && this.options.rendering.enableHalo)
      this.renderer.enableHalo(this.options.rendering.animateHalo);

    const starsEnabled = this.renderer.stars !== null;
    if (this.options.rendering.enableStars !== starsEnabled) {
      if (this.options.rendering.enableStars)
        this.renderer.enableStars(this.options.rendering.animateStars);
      else
        this.renderer.disableStars();
    }

    const starsAnimationEnabled = this.renderer.stars && this.renderer.stars.animate;
    if (this.options.rendering.animateStars !== starsAnimationEnabled && this.options.rendering.enableStars)
      this.renderer.enableStars(this.options.rendering.animateStars);

    let lightsChanged = false;
    for (const [light, visible] of Object.entries(this.options.lights)) {
      if (visible !== this.renderer.lights[light].visible) {
        this.renderer.lights[light].visible = visible;
        lightsChanged = true;
      }
    }

    if (lightsChanged)
      this.renderer.updateSize();
  }
}
