import {
  Vector3,
  Group,
  MeshBasicMaterial,
  Mesh,
  CircleBufferGeometry,
  CubicBezierCurve3,
  TubeBufferGeometry,
  RingBufferGeometry
} from "../include/three"
import {bl} from "./globals"

const Ml = Math.PI / 180; //rad2deg
const Sl = 180 / Math.PI; //deg2rad

// same as renderer
function Rl(t, e, n, i) {
    i = i || new Vector3;
    const r = (90 - t) * Ml,
        s = (e + 180) * Ml;
    return i.set(-n * Math.sin(r) * Math.cos(s), n * Math.cos(r), n * Math.sin(r) * Math.sin(s)), i
}


// radiansToDegrees
function El(t) {
    return t * Ml
}
// degreesToRadians
function Tl(t) {
    return t * Sl
}

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
    t = El(t), e = El(e), n = El(n);
    const r = (i = El(i)) - e,
        s = Math.cos(n) * Math.cos(r),
        o = Math.cos(n) * Math.sin(r),
        c = Math.atan2(Math.sin(t) + Math.sin(n), Math.sqrt((Math.cos(t) + s) * (Math.cos(t) + s) + o * o)),
        h = e + Math.atan2(o, Math.cos(t) + s);
    return [Tl(c), Tl(h)]
}

// Same as open-pr
function Dl(t, e, n, i, r) {
    return function(t, e, n) {
        return (n - e) * t + e
    }(function(t, e, n) {
        return (t - e) / (n - e) || 0
    }(t, e, n), i, r)
}

// In renderer too
function Ll(t) {
    t instanceof Mesh && (t.geometry && t.geometry.dispose(), t.material && (t.material.map && t.material.map.dispose(), t.material.lightMap && t.material.lightMap.dispose(), t.material.bumpMap && t.material.bumpMap.dispose(), t.material.normalMap && t.material.normalMap.dispose(), t.material.specularMap && t.material.specularMap.dispose(), t.material.envMap && t.material.envMap.dispose(), t.material.emissiveMap && t.material.emissiveMap.dispose(), t.material.metalnessMap && t.material.metalnessMap.dispose(), t.material.roughnessMap && t.material.roughnessMap.dispose(), t.material.dispose()))
}

export default class MergedPREntity {
    constructor(t) {
        this.props = t, this.init()
    }
    init() {
        const {
            data: t,
            radius: e = 1,
            camera: n,
            maxAmount: i = t.length,
            maxIndexDistance: r,
            visibleIndex: s,
            colors: o
        } = this.props, {
            parentNode: c,
            lineWidth: h,
            pixelRatio: u
        } = bl;
        this.mesh = new Group, this.isAnimating = [], this.animatingLandingsOut = [], this.landings = [], this.lineMeshes = [], this.lineHitMeshes = [], this.highlightedMesh, this.colors = o, this.landingGeo = new CircleBufferGeometry(.35, 8), this.TUBE_RADIUS_SEGMENTS = 3, this.HIT_DETAIL_FRACTION = 4, this.DATA_INCREMENT_SPEED = 1.5, this.PAUSE_LENGTH_FACTOR = 2, this.MIN_PAUSE = 3e3, this.visibleIndex = 0, this.lineAnimationSpeed = 600;
        const d = new Vector3,
            f = new Vector3;
            // Could be meshphong
        this.tubeMaterial = new MeshBasicMaterial({
            blending: 2,
            opacity: .95,
            transparent: true,
            color: this.colors.mergedPrColor
        })
        // Could be meshphong
        this.highlightMaterial = new MeshBasicMaterial({
            opacity: 1,
            transparent: false,
            color: this.colors.mergedPrColorHighlight
        })
        // could be meshphong
        this.hiddenMaterial = new MeshBasicMaterial({
            visible: false
        });
        for (let x = 0; x < t.Connections.length; x++) {
          /*
          {
            "uml": "Shanghai",
            "gm": {
              "lat": 31.16667,
              "lon": 121.46667
            },
            "uol": "Shanghai",
            "gop": {
              "lat": 31.16667,
              "lon": 121.46667
            },
            "l": "JavaScript",
            "nwo": "kaiyuanshe/open-hackathon",
            "pr": 843,
            "ma": "2021-01-13 02:41:59.000",
            "oa": "2021-01-13 02:41:51.000"
          },
          */
            const {
                Source: n,
                Destination: i
            } = t.Connections[x], r = n, s = i, o = Rl(r.Latitude, r.Longitude, e), c = Rl(s.Latitude, s.Longitude, e), h = o.distanceTo(c);
            if (h > 1.5) {
                let t;
                t = Dl(h, 0, 2 * e, 1, h > 1.85 * e ? 3.25 : h > 1.4 * e ? 2.3 : 1.5);
                const n = Cl(r.Latitude, r.Longitude, s.Latitude, s.Longitude),
                    i = Rl(n[0], n[1], e * t);
                d.copy(i), f.copy(i);
                const u = Dl(h, 10, 30, .2, .15),
                    m = Dl(h, 10, 30, .8, .85);
                t = Dl(h, 0, 2 * e, 1, 1.7);
                const y = new CubicBezierCurve3(o, d, f, c);
                y.getPoint(u, d), y.getPoint(m, f), d.multiplyScalar(t), f.multiplyScalar(t);
                const b = new CubicBezierCurve3(o, d, f, c),
                    w = Rl(s.Latitude, s.Longitude, e + x / 1e4),
                    M = Rl(s.Latitude, s.Longitude, e + 5);
                this.landings.push({
                    pos: w,
                    lookAt: M
                });
                const S = 20 + parseInt(b.getLength()),
                    E = new TubeBufferGeometry(b, S, .08, this.TUBE_RADIUS_SEGMENTS, false),
                    T = new TubeBufferGeometry(b, parseInt(S / this.HIT_DETAIL_FRACTION), .6, this.TUBE_RADIUS_SEGMENTS, false);
                E.setDrawRange(0, 0), T.setDrawRange(0, 0);
                const A = new Mesh(E, this.tubeMaterial),
                    L = new Mesh(T, this.hiddenMaterial);
                L.name = "lineMesh", A.userData = {
                    dataIndex: x
                }, L.userData = {
                    dataIndex: x,
                    lineMeshIndex: this.lineMeshes.length
                }, this.lineMeshes.push(A), this.lineHitMeshes.push(L)
            }
        }
        const {
            width: m,
            height: y
        } = c.getBoundingClientRect()
    }
    resetHighlight() {
        null != this.highlightedMesh && (this.highlightedMesh.material = this.tubeMaterial, this.highlightedMesh = null)
    }
    setHighlightObject(t) {
        const e = parseInt(t.userData.lineMeshIndex),
            n = this.lineMeshes[e];
        n != this.highlightedMesh && (n.material = this.highlightMaterial, this.resetHighlight(), this.highlightedMesh = n)
    }
    update(t = .01, e) {
        let n = parseInt(this.visibleIndex + t * this.DATA_INCREMENT_SPEED);
        n >= this.lineMeshes.length && (n = 0, this.visibleIndex = 0), n > this.visibleIndex && this.isAnimating.push(this.animatedObjectForIndex(n));
        let i = [],
            r = [];
        for (const s of this.isAnimating) {
            const e = s.line.geometry.index.count,
                n = s.line.geometry.drawRange.count + t * this.lineAnimationSpeed;
            let r = s.line.geometry.drawRange.start + t * this.lineAnimationSpeed;
            if (n >= e && r < e && this.animateLandingIn(s), n >= e * this.PAUSE_LENGTH_FACTOR + this.MIN_PAUSE && r < e) {
                if (s.line == this.highlightedMesh) {
                    i.push(s);
                    continue
                }
                r = this.TUBE_RADIUS_SEGMENTS * Math.ceil(r / this.TUBE_RADIUS_SEGMENTS);
                const t = this.TUBE_RADIUS_SEGMENTS * Math.ceil(r / this.HIT_DETAIL_FRACTION / this.TUBE_RADIUS_SEGMENTS);
                s.line.geometry.setDrawRange(r, n), s.lineHit.geometry.setDrawRange(t, n / this.HIT_DETAIL_FRACTION), i.push(s)
            } else r < e ? (s.line.geometry.setDrawRange(0, n), s.lineHit.geometry.setDrawRange(0, n / this.HIT_DETAIL_FRACTION), i.push(s)) : this.endAnimation(s)
        }
        for (let s = 0; s < this.animatingLandingsOut.length; s++) this.animateLandingOut(this.animatingLandingsOut[s]) && r.push(this.animatingLandingsOut[s]);
        this.isAnimating = i, this.animatingLandingsOut = r, this.visibleIndex = this.visibleIndex + t * this.DATA_INCREMENT_SPEED
    }
    endAnimation(t) {
        t.line.geometry.setDrawRange(0, 0), t.lineHit.geometry.setDrawRange(0, 0), this.mesh.remove(t.line), this.mesh.remove(t.lineHit), t.line = null, t.lineHit = null, this.animatingLandingsOut.push(t)
    }
    animateLandingIn(t) {
        if (t.dot.scale.x > .99) {
            if (null == t.dotFade) return;
            return t.dotFade.material.opacity = 0, this.mesh.remove(t.dotFade), Ll(t.dotFade), void(t.dotFade = null)
        }
        const e = t.dot.scale.x + .06 * (1 - t.dot.scale.x);
        t.dot.scale.set(e, e, 1);
        const n = t.dotFade.scale.x + .06 * (1 - t.dotFade.scale.x);
        t.dotFade.scale.set(n, n, 1), t.dotFade.material.opacity = 1 - n
    }
    animateLandingOut(t) {
        if (t.dot.scale.x < .01) return this.mesh.remove(t.dot), t.dot = null, Ll(t.dot), null != t.dotFade && (this.mesh.remove(t.dotFade), Ll(t.dotFade), t.dotFade = null), false;
        const e = t.dot.scale.x - .15 * t.dot.scale.x;
        return t.dot.scale.set(e, e, 1), true
    }
    animatedObjectForIndex(t) {
        const e = this.lineMeshes[t];
        this.mesh.add(e);
        const n = this.lineHitMeshes[t];
        this.mesh.add(n);
        const i = this.landingFromPositionData(this.landings[t]);
        this.mesh.add(i);
        const r = this.fadingLandingMeshFromMesh(i);
        return this.mesh.add(r), {
            line: e,
            lineHit: n,
            dot: i,
            dotFade: r
        }
    }
    landingFromPositionData(t) {
        const e = new Mesh(this.landingGeo, this.tubeMaterial);
        return e.position.set(t.pos.x, t.pos.y, t.pos.z), e.lookAt(t.lookAt.x, t.lookAt.y, t.lookAt.z), e.scale.set(0, 0, 1), e
    }
    fadingLandingMeshFromMesh(t) {
        const e = t.clone();
        // Could be meshphong
        return e.geometry = new RingBufferGeometry(1.55, 1.8, 16), e.material = new MeshBasicMaterial({
            color: this.colors.mergedPrColor,
            blending: 2,
            transparent: true,
            opacity: 0,
            alphaTest: .02,
            visible: true
        }), e.scale.set(0, 0, 1), e.renderOrder = 5, e
    }
    dispose() {
        this.mesh && Pl(this.mesh, Ll), this.mesh && this.mesh.parent && this.mesh.parent.remove(this.mesh), this.mesh = null
    }
}
