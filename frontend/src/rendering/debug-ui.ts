import { GUI } from "dat.gui"
import controls from "./controls";
export default class DebugUI {
  private gui: GUI;
  constructor() {
    this.gui = new GUI();

    const renderingFolder = this.gui.addFolder("Rendering");

    renderingFolder.add(controls.rendering, "enable").name("Toggle Rendering");
    renderingFolder.open();

    const controlsFolder = this.gui.addFolder("View");
    controlsFolder.add(controls.view, "rotationX", 0, 360).name("Rotation X");
    controlsFolder.add(controls.view, "rotationY", 0, 360).name("Rotation Y");

    const sceneFolder = this.gui.addFolder("Scene");
    sceneFolder.add(controls.scene, "renderGlobe").name("Enable Globe");
    sceneFolder.add(controls.scene, "renderWorldMap").name("Enable World Map");
    sceneFolder.add(controls.scene, "renderHalo").name("Enable Halo");
    sceneFolder.add(controls.scene, "renderStars").name("Enable Stars");
    sceneFolder.add(controls.scene, "animateHalo").name("Animate Halo");
    sceneFolder.add(controls.scene, "animateStars").name("Animate Stars");
    sceneFolder.open();
  }
}
