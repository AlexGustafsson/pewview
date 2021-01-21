import {
  Vector3,
  Group,
  MeshBasicMaterial,
  Mesh,
  CubicBezierCurve3,
  TubeBufferGeometry,
} from "three"
import {coordinatesToEuler, radiansToDegrees, degreesToRadians} from "./utils"

// in controller as well, in open-pr as well
function Nl(t, e, n) {
  return Math.max(e, Math.min(t, n))
}

function Pl(t, e) {
    for (let n = t.children.length - 1; n >= 0; n--) {
        const i = t.children[n];
        Pl(i, e), "function" == typeof e && e(i)
    }
}

function Cl(t, e, n, i) {
    t = radiansToDegrees(t);
    e = radiansToDegrees(e);
    n = radiansToDegrees(n);
    const r = (i = radiansToDegrees(i)) - e,
        s = Math.cos(n) * Math.cos(r),
        o = Math.cos(n) * Math.sin(r),
        c = Math.atan2(Math.sin(t) + Math.sin(n), Math.sqrt((Math.cos(t) + s) * (Math.cos(t) + s) + o * o)),
        h = e + Math.atan2(o, Math.cos(t) + s);
    return [degreesToRadians(c), degreesToRadians(h)]
}

// Same as open-pr
function Dl(t, e, n, i, r) {
    return function(t, e, n) {
        return (n - e) * t + e
    }(function(t, e, n) {
        return (t - e) / (n - e) || 0
    }(t, e, n), i, r)
}

const DISTANCE_THRESHOLD = 1.5;
const ARCH_THICKNESS = 0.2;
const TUBE_RADIUS_SEGMENTS = 3;
const HIT_DETAIL_FRACTION = 4;
const DATA_INCREMENT_SPEED = 1.5;
const PAUSE_LENGTH_FACTOR = 2;
const MIN_PAUSE = 3e3;

export default class Arch {
  constructor({
    source, //latitude, longitude
    destination,
    globeRadius,
    colors
  }) {
    this.highlighted = false;

    this.mesh = new Group();

    // normal, highlighted
    this.colors = colors;

    this.materials = {
      normal: new MeshBasicMaterial({
        blending: 2,
        opacity: 0.95,
        transparent: true,
        color: this.colors.normal
      }),
      highlighted: new MeshBasicMaterial({
        opacity: 1,
        transparent: false,
        color: this.colors.highlighted
      }),
      hidden: new MeshBasicMaterial({
        visible: false
      })
    };

    const startingPoint = coordinatesToEuler(source.latitude, source.longitude, globeRadius);
    const endingPoint = coordinatesToEuler(destination.latitude, destination.longitude, globeRadius);
    const distance = startingPoint.distanceTo(endingPoint);
    // if (distance >= DISTANCE_THRESHOLD) {
    // }
    const height = distance > 1.85 * globeRadius ? 3.25 : distance > 1.4 * globeRadius ? 2.3 : 1.5;
    const t = Dl(distance, 0, 2 * globeRadius, 1, height);
    const n = Cl(source.latitude, source.longitude, destination.latitude, destination.longitude);
    const i = coordinatesToEuler(n[0], n[1], globeRadius * t);
    // CubicBezierCurve3( v0 : Vector3, v1 : Vector3, v2 : Vector3, v3 : Vector3 )
    // v0 – The starting point.
    // v1 – The first control point.
    // v2 – The second control point.
    // v3 – The ending point.

    const firstControlPoint = new Vector3(i.x, i.y, i.z);
    const secondControlPoint = new Vector3(i.x, i.y, i.z);
    const curve1 = new CubicBezierCurve3(startingPoint, firstControlPoint, secondControlPoint, endingPoint);
    // Modify the controlPoints to produce a more cubic-like curve
    curve1.getPoint(Dl(distance, 10, 30, .2, .15), firstControlPoint);
    curve1.getPoint(Dl(distance, 10, 30, .8, .85), secondControlPoint);
    firstControlPoint.multiplyScalar(t)
    secondControlPoint.multiplyScalar(t)
    const curve2 = new CubicBezierCurve3(startingPoint, firstControlPoint, secondControlPoint, endingPoint);

    const landing = {
      // TODO: perhaps change the globe radius by some amount to avoid overlapping
      position: coordinatesToEuler(destination.latitude, destination.longitude, globeRadius),
      lookAt: coordinatesToEuler(destination.latitude, destination.longitude, globeRadius + 5)
    }

    // TubeBufferGeometry(path : Curve, tubularSegments : Integer, radius : Float, radialSegments : Integer, closed : Boolean)
    const segments = Math.round(20 + curve2.getLength());
    // Visual tube
    const visibleTube = new TubeBufferGeometry(curve2, segments, ARCH_THICKNESS, TUBE_RADIUS_SEGMENTS, false);
    // visibleTube.setDrawRange(0, 0);
    // Tube for hitbox
    const hiddenTube = new TubeBufferGeometry(curve2, Math.round(segments / HIT_DETAIL_FRACTION), ARCH_THICKNESS * 2, TUBE_RADIUS_SEGMENTS, false);
    // hiddenTube.setDrawRange(0, 0);

    this.visibleTubeMesh = new Mesh(visibleTube, this.materials.normal);
    this.mesh.add(this.visibleTubeMesh);
    // visibleTube.userData = {
    //   dataIndex: 0
    // };

    this.hitboxTubeMesh = new Mesh(hiddenTube, this.materials.hidden);
    // hitboxTubeMesh.userData = {
    //   dataIndex: 0,
    //   lineMeshIndex: this.lineMeshes.length
    // };
  }

  highlight() {
    if (this.highlighted)
      return;

    this.highlight = true;
    this.visibleTube.material = this.materials.highlight;
  }

  clearHighlight() {
    if (!this.highlighted)
      return;

    this.highlight = false;
    this.visibleTube.material = this.materials.normal;
  }

  update(step = 0.01) {

  }
}
