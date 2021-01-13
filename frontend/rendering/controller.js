import {
  Vector2,
  Vector3,
  Matrix4,
} from "../include/three"
import EventEmitter from "../event-emitter"
import {bl, _l, hl, vl, yl} from "./globals"

function Al(t, e, n) {
    const i = n || new Matrix4();
    i.identity(), i.makeRotationY(e), i.multiply(t.matrix), t.matrix.copy(i), t.rotation.setFromRotationMatrix(t.matrix)
}

// in renderer as well
function Nl(t, e, n) {
    return Math.max(e, Math.min(t, n))
}

export default class Controller {
    constructor(t) {
        this.props = t, this.handleMouseDown = this.handleMouseDown.bind(this), this.handleMouseMove = this.handleMouseMove.bind(this), this.handleMouseUp = this.handleMouseUp.bind(this), this.handleMouseOut = this.handleMouseOut.bind(this), this.handleTouchStart = this.handleTouchStart.bind(this), this.handleTouchMove = this.handleTouchMove.bind(this), this.handleTouchEnd = this.handleTouchEnd.bind(this), this.handlePause = this.handlePause.bind(this), this.handleResume = this.handleResume.bind(this), this.init()
    }
    init() {
        this.dragging = false, this.mouse = new Vector2(.5, .5), this.lastMouse = new Vector2(.5, .5), this.target = new Vector3(0, 0), this.matrix = new Matrix4(), this.velocity = new Vector2(), this.autoRotationSpeedScalar = 1, this.autoRotationSpeedScalarTarget = 1, this.addListeners(), _l.on(vl, this.handlePause), _l.on(yl, this.handleResume)
    }
    addListeners() {
        const {
            domElement: t
        } = this.props;
        this.removeListeners(), t.addEventListener("mousedown", this.handleMouseDown, false), t.addEventListener("mousemove", this.handleMouseMove, false), t.addEventListener("mouseup", this.handleMouseUp, false), t.addEventListener("mouseout", this.handleMouseOut, false), t.addEventListener("mouseleave", this.handleMouseOut, false), t.addEventListener("touchstart", this.handleTouchStart, false), t.addEventListener("touchmove", this.handleTouchMove, false), t.addEventListener("touchend", this.handleTouchEnd, false), t.addEventListener("touchcancel", this.handleTouchEnd, false)
    }
    removeListeners() {
        const {
            domElement: t
        } = this.props;
        t.removeEventListener("mousedown", this.handleMouseDown), t.removeEventListener("mousemove", this.handleMouseMove), t.removeEventListener("mouseup", this.handleMouseUp), t.removeEventListener("mouseout", this.handleMouseOut), t.removeEventListener("mouseleave", this.handleMouseOut), t.removeEventListener("touchstart", this.handleTouchStart), t.removeEventListener("touchmove", this.handleTouchMove), t.removeEventListener("touchend", this.handleTouchEnd), t.removeEventListener("touchcancel", this.handleTouchEnd)
    }
    setMouse(t) {
        const {
            width: e,
            height: n
        } = bl.parentNode.getBoundingClientRect();
        this.mouse.x = t.clientX / e * 2 - 1, this.mouse.y = -t.clientY / n * 2 + 1
    }
    setDragging(t) {
        this.dragging = t;
        const {
            setDraggingCallback: e
        } = this.props;
        e && "function" == typeof e && e(t)
    }
    handlePause() {
        this.removeListeners()
    }
    handleResume() {
        this.addListeners()
    }
    handleMouseDown(t) {
        this.setMouse(t), this.setDragging(true)
    }
    handleMouseMove(t) {
        this.setMouse(t)
    }
    handleMouseUp(t) {
        this.setMouse(t), this.setDragging(false)
    }
    handleMouseOut() {
        this.setDragging(false)
    }
    handleTouchStart(t) {
        this.setMouse(t.changedTouches[0]), this.lastMouse.copy(this.mouse), this.setDragging(true)
    }
    handleTouchMove(t) {
        this.setMouse(t.changedTouches[0])
    }
    handleTouchEnd(t) {
        this.setMouse(t.changedTouches[0]), this.setDragging(false)
    }
    update(t = .01) {
        let e = 0,
            n = 0;
        const {
            object: i,
            objectContainer: r,
            rotateSpeed: s,
            autoRotationSpeed: o,
            easing: c = .1,
            maxRotationX: h = .3
        } = this.props;
        this.dragging && (e = this.mouse.x - this.lastMouse.x, n = this.mouse.y - this.lastMouse.y, this.target.y = Nl(this.target.y - n, -h, .6 * h)), r.rotation.x += (this.target.y + hl.x - r.rotation.x) * c, this.target.x += (e - this.target.x) * c, Al(i, this.target.x * s, this.matrix), this.dragging || Al(i, t * o * this.autoRotationSpeedScalar, this.matrix), this.autoRotationSpeedScalar += .05 * (this.autoRotationSpeedScalarTarget - this.autoRotationSpeedScalar), this.lastMouse.copy(this.mouse), this.velocity.set(e, n)
    }
    dispose() {
        this.removeListeners(), _l.off(vl, this.handlePause), _l.off(yl, this.handleResume), this.dragging = null, this.mouse = null, this.lastMouse = null, this.target = null, this.matrix = null, this.velocity = null, this.autoRotationSpeedScalar = null, this.autoRotationSpeedScalarTarget = null
    }
}
