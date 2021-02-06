import type {
  Group
} from "three"

import type Renderer from "./renderer"

import { coordinatesToRotation} from "./utils"
import { EaseOutCubic, Slerp } from "./easings"

type ControllerOptions = {
  element: HTMLElement,
  object: Group,
  objectContainer: Group,
  renderer: Renderer
}

const POINTS_OF_INTEREST = [
  { latitude: 50.510986, longitude: 16.049161 }, // "Europe"
  { latitude: 2.341285, longitude: 21.940375 }, // "Africa"
  { latitude: 45.296762, longitude: -98.680842 }, // "North America"
  { latitude: -20.581282, longitude: -58.949614 }, // "South America"
  { latitude: -14.628517, longitude: 133.087610 }, // "Oceania"
  { latitude: 39.602024, longitude: 133.563252 }, // "East Asia"
  { latitude: 26.001432, longitude: 101.085334 }, // "South Asia"
  { latitude: 60.653543, longitude: 84.736702 }, // "North Asia"
  { latitude: 36.612646, longitude: 63.891532 }, // "West Asia"
];

export default class Controller {
  element: HTMLElement;
  object: Group;
  objectContainer: Group;
  renderer: Renderer;

  pointOfInterest: number;
  rotationAnimation: Slerp;

  constructor({
    element,
    object,
    objectContainer,
    renderer,
  }: ControllerOptions) {
    this.element = element;
    this.object = object;
    this.objectContainer = objectContainer;
    this.renderer = renderer;

    this.pointOfInterest = 0;
    this.rotationAnimation = new Slerp(
      coordinatesToRotation(POINTS_OF_INTEREST[this.pointOfInterest].latitude, POINTS_OF_INTEREST[this.pointOfInterest].longitude),
      5,
      EaseOutCubic
    );
    this.rotationAnimation.repeat = true;
    this.rotationAnimation.on("done", () => {
      this.pointOfInterest = (this.pointOfInterest + 1) % POINTS_OF_INTEREST.length;
      this.rotationAnimation.to = coordinatesToRotation(POINTS_OF_INTEREST[this.pointOfInterest].latitude, POINTS_OF_INTEREST[this.pointOfInterest].longitude);
    });
  }

  update(deltaTime: number) {
    this.rotationAnimation.update(deltaTime);
    this.object.setRotationFromQuaternion(this.rotationAnimation.value);

    // let velocityX = 0;
    // let velocityY = 0;

    // const previousTargetY = this.target.y;
    // if (this.dragging) {
    //   velocityX = this.mouse.x - this.lastMouse.x
    //   velocityY = this.mouse.y - this.lastMouse.y
    //   this.target.y = Nl(this.target.y - velocityY, -MAX_ROTATION, .6 * MAX_ROTATION)
    // }
    // const targetYChanged = this.target.y !== previousTargetY;

    // this.objectContainer.rotation.x += (this.target.y + START_ROTATION.x - this.objectContainer.rotation.x) * EASING;
    // this.target.x += (velocityX - this.target.x) * EASING;
    // Al(this.object, this.target.x * ROTATE_SPEED, this.matrix)

    // if (!this.dragging)
    //   Al(this.object, deltaTime * AUTO_ROTATION_SPEED * this.autoRotationSpeedScalar, this.matrix)

    // this.autoRotationSpeedScalar += .05 * (this.autoRotationSpeedScalarTarget - this.autoRotationSpeedScalar);
    // this.lastMouse.copy(this.mouse);
    // this.velocity.set(velocityX, velocityY);
    // if (this.renderer.stars && this.renderer.stars.animate) {
    //   this.renderer.stars.uniforms.offset.value.x += (velocityX + this.autoRotationSpeedScalar * AUTO_ROTATION_SPEED * 0.01) * deltaTime * 10000;
    //   if (targetYChanged)
    //     this.renderer.stars.uniforms.offset.value.y += velocityY * deltaTime * 10000;
    // }
  }
}
