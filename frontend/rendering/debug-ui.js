import {GUI} from "../include/dat.gui"

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
        start() {
          renderer.start();
        },
        stop() {
          renderer.stop();
        }
      }
    };

    const renderingFolder = this.gui.addFolder("Rendering");
    const fps = renderingFolder.add(this.options.rendering, "fps").name("FPS").listen();
    fps.domElement.style.pointerEvents = "none";
    const drawTime = renderingFolder.add(this.options.rendering, "drawTime").step(0.001).name("Draw Time").listen();
    drawTime.domElement.style.pointerEvents = "none";
    renderingFolder.add(this.options.rendering, "start").name("Start");
    renderingFolder.add(this.options.rendering, "stop").name("Stop");
    renderingFolder.open();
  }

  debouncedUpdate(deltaTime, _elapsedTime) {
    this.options.rendering.fps = this.renderer.fps;
    this.options.rendering.drawTime = deltaTime;
  }

  update(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= UPDATE_DEBOUNCE) {
      this.debouncedUpdate(deltaTime, this.elapsedTime);
      this.elapsedTime = 0;
    }
  }
}
