import {GUI} from "dat.gui"
// import WorldMap from "./world-map"

// import type {
//   SpotLight,
//   AmbientLight,
//   DirectionalLight
// } from "three"

import type Renderer from "./renderer"

// The number of seconds to wait before updating debounced values
// such as the FPS
const UPDATE_DEBOUNCE = 0.2;

type DatGUIOptions = {
  rendering: {
    fps: number,
    drawTime: number,
    // animateHalo: boolean,
    animateStars: boolean,
    // enableHalo: boolean,
    enableStars: boolean,
    toggle: () => void
  },
  // worldMap: {
  //   rows: number,
  //   size: number
  // },
  lights: {[key: string]: boolean}
};

type DebugUIOptions = {
  renderer: Renderer
};

export default class DebugUI {
  gui: GUI;
  renderer: Renderer;
  elapsedTime: number;
  options: DatGUIOptions;

  constructor({renderer}: DebugUIOptions) {
    this.gui = new GUI();
    this.renderer = renderer;

    this.elapsedTime = 0;

    this.options = {
      rendering: {
        fps: 0,
        drawTime: 0,
        // animateHalo: renderer.halo !== null && renderer.halo.animate,
        animateStars: renderer.stars !== null && renderer.stars.animate,
        // enableHalo: renderer.halo !== null,
        enableStars: renderer.stars !== null,
        toggle() {
          if (renderer.isRunning)
            renderer.stop();
          else
            renderer.start();
        }
      },
      // worldMap: {
      //   rows: renderer.worldMap?.rows || 0,
      //   size: renderer.worldMap?.size || 0,
      // },
      lights: {}
    };

    // for (const light of renderer.lights)
    //   this.options.lights[Object.values(this.options.lights).length.toString()] = light.visible;

    const renderingFolder = this.gui.addFolder("Rendering");

    const fps = renderingFolder.add(this.options.rendering, "fps").name("FPS").listen();
    fps.domElement.style.pointerEvents = "none";

    const drawTime = renderingFolder.add(this.options.rendering, "drawTime").step(0.001).name("Draw Time").listen();
    drawTime.domElement.style.pointerEvents = "none";

    // renderingFolder.add(this.options.rendering, "animateHalo").name("Animate Halo");
    renderingFolder.add(this.options.rendering, "animateStars").name("Animate Stars");
    // renderingFolder.add(this.options.rendering, "enableHalo").name("Enable Halo");
    renderingFolder.add(this.options.rendering, "enableStars").name("Enable Stars");

    renderingFolder.add(this.options.rendering, "toggle").name("Toggle Rendering");

    renderingFolder.open();

    // const worldMapFolder = this.gui.addFolder("World Map");
    // worldMapFolder.add(this.options.worldMap, "rows", 0, 400).step(5).name("Rows");
    // worldMapFolder.add(this.options.worldMap, "size", 0, 0.25).step(0.005).name("Size");
    // worldMapFolder.open();

    // const lightsFolder = this.gui.addFolder("Lights");
    // for (const light of Object.keys(this.options.lights))
    //   lightsFolder.add(this.options.lights, light).name(`Enable Light ${light}`);
    // lightsFolder.open();
  }

  debouncedUpdate(deltaTime: number, _elapsedTime: number) {
    this.options.rendering.fps = this.renderer.fps;
    this.options.rendering.drawTime = deltaTime;

    // if (this.renderer.worldMap !== null) {
    //   const worldMapRowsChanged = this.options.worldMap.rows !== this.renderer.worldMap.rows;
    //   const worldMapSizeChanged = this.options.worldMap.size !== this.renderer.worldMap.size
    //   const worldMapChanged = worldMapRowsChanged || worldMapSizeChanged;
    //   if (worldMapChanged) {
    //     this.renderer.container.remove(this.renderer.worldMap.mesh);
    //     this.renderer.worldMap = new WorldMap({
    //       radius: this.renderer.worldMap.radius,
    //       texture: this.renderer.worldMap.texture,
    //       rows: this.options.worldMap.rows,
    //       size: this.options.worldMap.size
    //     });
    //     this.renderer.container.add(this.renderer.worldMap.mesh);
    //   }
    // }
  }

  update(deltaTime: number) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= UPDATE_DEBOUNCE) {
      this.debouncedUpdate(deltaTime, this.elapsedTime);
      this.elapsedTime = 0;
    }

    // const haloEnabled = this.renderer.halo !== null;
    // if (this.options.rendering.enableHalo !== haloEnabled) {
    //   if (this.options.rendering.enableHalo)
    //     this.renderer.enableHalo(this.options.rendering.animateHalo);
    //   else
    //     this.renderer.disableHalo();
    // }
    //
    //
    // const haloAnimationEnabled = this.renderer.halo && this.renderer.halo.animate;
    // if (this.options.rendering.animateHalo !== haloAnimationEnabled && this.options.rendering.enableHalo)
    //   this.renderer.enableHalo(this.options.rendering.animateHalo);

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

    // let lightsChanged = false;
    // for (const [light, visible] of Object.entries(this.options.lights)) {
    //   const lightIndex = Number.parseInt(light) as number;
    //   if (visible !== (this.renderer.lights[lightIndex]).visible) {
    //     this.renderer.lights[lightIndex].visible = visible;
    //     lightsChanged = true;
    //   }
    // }
    // // Fix for lights not being updated the first frames without being resized
    // if (lightsChanged)
    //   this.renderer.updateSize();
  }
}
