import {
  Vector2,
  Vector3,
  Matrix4,
} from "three"
import {messageBus, START_ROTATION, EVENT_PAUSE, EVENT_RESUME} from "./globals"
import {IS_MOBILE} from "./utils"

function Al(t, e, n) {
  const i = n || new Matrix4();
  i.identity();
  i.makeRotationY(e);
  i.multiply(t.matrix);
  t.matrix.copy(i);
  t.rotation.setFromRotationMatrix(t.matrix);
}

// in renderer as well
function Nl(t, e, n) {
  return Math.max(e, Math.min(t, n))
}

const MAX_ROTATION = 1;
const EASING = 0.12;
const ROTATE_SPEED = IS_MOBILE ? 1.5 : 3;
const AUTO_ROTATION_SPEED = 0.05;

export default class Controller {
  constructor({
    element,
    object,
    objectContainer,
    renderer,
  }) {
    this.element = element;
    this.object = object;
    this.objectContainer = objectContainer;
    this.renderer = renderer;

    this.dragging = false;
    this.mouse = new Vector2(.5, .5);
    this.lastMouse = new Vector2(.5, .5);
    this.target = new Vector3(0, 0);
    this.matrix = new Matrix4();
    this.velocity = new Vector2();
    this.autoRotationSpeedScalar = 1;
    this.autoRotationSpeedScalarTarget = 1;

    this.element.addEventListener("mousedown", this.handleMouseDown.bind(this), false)
    this.element.addEventListener("mousemove", this.handleMouseMove.bind(this), false)
    this.element.addEventListener("mouseup", this.handleMouseUp.bind(this), false)
    this.element.addEventListener("mouseout", this.handleMouseOut.bind(this), false)
    this.element.addEventListener("mouseleave", this.handleMouseOut.bind(this), false)
    this.element.addEventListener("touchstart", this.handleTouchStart.bind(this), false)
    this.element.addEventListener("touchmove", this.handleTouchMove.bind(this), false)
    this.element.addEventListener("touchend", this.handleTouchEnd.bind(this), false)
    this.element.addEventListener("touchcancel", this.handleTouchEnd.bind(this), false)

    messageBus.on(EVENT_PAUSE, this.handlePause);
    messageBus.on(EVENT_RESUME, this.handleResume)
  }

  setMouse(event) {
    const {width, height} = this.element.getBoundingClientRect();
    this.mouse.x = event.clientX / width * 2 - 1;
    this.mouse.y = -event.clientY / height * 2 + 1;
  }

  setDragging(isDragging) {
    this.dragging = isDragging;
    // if (this.options.setDraggingCallback)
    //   this.options.setDraggingCallback(isDragging);
  }

  handlePause() {
    // Originally removed listeners
  }

  handleResume() {
    // Originally added listeners
  }

  handleMouseDown(event) {
    this.setMouse(event);
    this.setDragging(true);
  }

  handleMouseMove(event) {
    this.setMouse(event);
  }

  handleMouseUp(event) {
    this.setMouse(event);
    this.setDragging(false);
  }

  handleMouseOut(_event) {
    this.setDragging(false)
  }

  handleTouchStart(event) {
    this.setMouse(event.changedTouches[0]);
    this.lastMouse.copy(this.mouse);
    this.setDragging(true);
  }

  handleTouchMove(event) {
    this.setMouse(event.changedTouches[0]);
  }

  handleTouchEnd(event) {
    this.setMouse(event.changedTouches[0]);
    this.setDragging(false)
  }

  update(deltaTime) {
    let velocityX = 0;
    let velocityY = 0;

    const previousTargetY = this.target.y;
    if (this.dragging) {
      velocityX = this.mouse.x - this.lastMouse.x
      velocityY = this.mouse.y - this.lastMouse.y
      this.target.y = Nl(this.target.y - velocityY, -MAX_ROTATION, .6 * MAX_ROTATION)
    }
    const targetYChanged = this.target.y !== previousTargetY;

    this.objectContainer.rotation.x += (this.target.y + START_ROTATION.x - this.objectContainer.rotation.x) * EASING;
    this.target.x += (velocityX - this.target.x) * EASING;
    Al(this.object, this.target.x * ROTATE_SPEED, this.matrix)

    if (!this.dragging)
      Al(this.object, deltaTime * AUTO_ROTATION_SPEED * this.autoRotationSpeedScalar, this.matrix)

    this.autoRotationSpeedScalar += .05 * (this.autoRotationSpeedScalarTarget - this.autoRotationSpeedScalar);
    this.lastMouse.copy(this.mouse);
    this.velocity.set(velocityX, velocityY);
    if (this.renderer.stars && this.renderer.stars.animate) {
      this.renderer.stars.uniforms.offset.value.x += (velocityX + this.autoRotationSpeedScalar * AUTO_ROTATION_SPEED * 0.01) * deltaTime * 10000;
      if (targetYChanged)
        this.renderer.stars.uniforms.offset.value.y += velocityY * deltaTime * 10000;
    }
  }
}
