import {
  Vector2,
  Vector3,
  Matrix4,
} from "../include/three"
import {bl, messageBus, START_ROTATION, EVENT_PAUSE, EVENT_RESUME} from "./globals"

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

export default class Controller {
  constructor(options) {
    this.options = options; // {domElement, object, objectContainer, rotateSpeed, autoRotationSpeed, easing = 0.1, maxRotationX = 0.3}

    this.dragging = false;
    this.mouse = new Vector2(.5, .5);
    this.lastMouse = new Vector2(.5, .5);
    this.target = new Vector3(0, 0);
    this.matrix = new Matrix4();
    this.velocity = new Vector2();
    this.autoRotationSpeedScalar = 1;
    this.autoRotationSpeedScalarTarget = 1;

    this.options.element.addEventListener("mousedown", this.handleMouseDown.bind(this), false)
    this.options.element.addEventListener("mousemove", this.handleMouseMove.bind(this), false)
    this.options.element.addEventListener("mouseup", this.handleMouseUp.bind(this), false)
    this.options.element.addEventListener("mouseout", this.handleMouseOut.bind(this), false)
    this.options.element.addEventListener("mouseleave", this.handleMouseOut.bind(this), false)
    this.options.element.addEventListener("touchstart", this.handleTouchStart.bind(this), false)
    this.options.element.addEventListener("touchmove", this.handleTouchMove.bind(this), false)
    this.options.element.addEventListener("touchend", this.handleTouchEnd.bind(this), false)
    this.options.element.addEventListener("touchcancel", this.handleTouchEnd.bind(this), false)

    messageBus.on(EVENT_PAUSE, this.handlePause);
    messageBus.on(EVENT_RESUME, this.handleResume)
  }
  setMouse(event) {
    const {width, height} = bl.parentNode.getBoundingClientRect();
    this.mouse.x = event.clientX / width * 2 - 1;
    this.mouse.y = -event.clientY / height * 2 + 1;
  }
  setDragging(isDragging) {
    this.dragging = isDragging;
    if (this.options.setDraggingCallback)
      this.options.setDraggingCallback(isDragging);
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
  update(timestep = .01) {
    let velocityX = 0;
    let velocityY = 0;

    if (this.dragging) {
      velocityX = this.mouse.x - this.lastMouse.x
      velocityY = this.mouse.y - this.lastMouse.y
      this.target.y = Nl(this.target.y - velocityY, -this.options.maxRotationX, .6 * this.options.maxRotationX)
    }

    this.options.objectContainer.rotation.x += (this.target.y + START_ROTATION.x - this.options.objectContainer.rotation.x) * this.options.easing;
    this.target.x += (velocityX - this.target.x) * this.options.easing;
    Al(this.options.object, this.target.x * this.options.rotateSpeed, this.matrix)

    if (!this.dragging)
      Al(this.options.object, timestep * this.options.autoRotationSpeed * this.autoRotationSpeedScalar, this.matrix)

    this.autoRotationSpeedScalar += .05 * (this.autoRotationSpeedScalarTarget - this.autoRotationSpeedScalar);
    this.lastMouse.copy(this.mouse);
    this.velocity.set(velocityX, velocityY);
  }
}
