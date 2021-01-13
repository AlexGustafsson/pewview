import {
  Euler,
  Vector2,
  Vector3,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  Group,
  AmbientLight,
  Clock,
  MeshBasicMaterial,
  SpotLight,
  DirectionalLight,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
  ShaderMaterial,
  Object3D,
  CircleBufferGeometry,
  InstancedMesh,
  BoxBufferGeometry,
  CylinderBufferGeometry,
  InstancedBufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  CubicBezierCurve3,
  TubeBufferGeometry,
  RingBufferGeometry
} from "../include/three"
import Tooltip from "./tooltip"
import Globe from "./globe"
import Controller from "./controller"
import {bl, _l, hl, vl, yl, ul, dl} from "./globals"

const cl = 25;
const fl = 16777215;
const ml = 2197759;
const gl = 16018366;
const Ml = Math.PI / 180; //rad2deg
const Sl = 180 / Math.PI; //deg2rad
const wl = new Vector3();

function Il() {
    this.array = null
}

function Dl(t, e, n, i, r) {
    return function(t, e, n) {
        return (n - e) * t + e
    }(function(t, e, n) {
        return (t - e) / (n - e) || 0
    }(t, e, n), i, r)
}

function Rl(t, e, n, i) {
    i = i || new Vector3;
    const r = (90 - t) * Ml,
        s = (e + 180) * Ml;
    return i.set(-n * Math.sin(r) * Math.cos(s), n * Math.cos(r), n * Math.sin(r) * Math.sin(s)), i
}

function Ll(t) {
    t instanceof Mesh && (t.geometry && t.geometry.dispose(), t.material && (t.material.map && t.material.map.dispose(), t.material.lightMap && t.material.lightMap.dispose(), t.material.bumpMap && t.material.bumpMap.dispose(), t.material.normalMap && t.material.normalMap.dispose(), t.material.specularMap && t.material.specularMap.dispose(), t.material.envMap && t.material.envMap.dispose(), t.material.emissiveMap && t.material.emissiveMap.dispose(), t.material.metalnessMap && t.material.metalnessMap.dispose(), t.material.roughnessMap && t.material.roughnessMap.dispose(), t.material.dispose()))
}

// radiansToDegrees
function El(t) {
    return t * Ml
}
// degreesToRadians
function Tl(t) {
    return t * Sl
}

// in controller as well
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

class Kl {
    constructor(t) {
        this.props = t, this.init()
    }
    init() {
        const {
            maxAmount: t = 1e3,
            data: e = [],
            radius: n = 1,
            camera: i,
            maxIndexDistance: r,
            visibleIndex: s,
            colors: {
                openPrColor: o,
                openPrParticleColor: c
            }
        } = this.props, {
            pixelRatio: h,
            spikeRadius: u = .06
        } = bl;
        this.mesh = new Group;
        // Could be MeshPhong
        const d = new MeshBasicMaterial({
                color: 65280,
                visible: false
            }),
            f = new BoxBufferGeometry(.75, 1, .75);
        f.translate(0, .5, 0), f.rotateX(-Math.PI / 2);
        const m = new InstancedMesh(f, d, t);
        this.mesh.add(m);
        // Could be MeshPhong
        const y = new MeshBasicMaterial({
            color: o,
            transparent: true,
            opacity: .4,
            alphaTest: .05,
            blending: 2
        });
        y.onBeforeCompile = t => {
            t.uniforms.cameraPosition = {
                value: i.position
            }, t.uniforms.radius = {
                value: n
            }, t.uniforms.visibleIndex = {
                value: s
            }, t.uniforms.maxIndexDistance = {
                value: r
            }, t.uniforms.highlightIndex = {
                value: -9999
            }, t.vertexShader = "#define GLSLIFY 1\n#include <common>\n\nuniform float visibleIndex;\nuniform float maxIndexDistance;\n\nattribute float index;\n\nvarying float vScale;\nvarying float vIndex;\n\n#ifndef PI\n#define PI 3.141592653589793\n#endif\n\nfloat sineInOut(float t) {\n  return -0.5 * (cos(PI * t) - 1.0);\n}\n\nvoid main() {\n\tvIndex = index;\n\n\tvec3 pos = position;\n\n\tfloat scale = sineInOut(clamp(smoothstep(maxIndexDistance, 0.0, distance(index, visibleIndex)), 0., 1.));\n\tpos.z *= scale;\n\tvScale = scale;\n\n\tvec3 transformed = vec3( pos );\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n}", t.fragmentShader = "#define GLSLIFY 1\nuniform vec3 diffuse;\nuniform float opacity;\n\n#include <common>\n\nuniform float radius;\nuniform float visibleIndex;\nuniform float maxIndexDistance;\nuniform float highlightIndex;\n\nvarying float vScale;\nvarying float vIndex;\n\nvoid main() {\n\tif(vScale <= 0.01){\n\t\tdiscard;\n\t\treturn;\n\t}\n\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <alphatest_fragment>\n\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\treflectedLight.indirectDiffuse += vec3( 1.0 );\n\treflectedLight.indirectDiffuse *= diffuseColor.rgb;\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\n\n\tvec3 rgb = outgoingLight.rgb;\n\tfloat alpha = diffuseColor.a;\n\n\t// highlight when mouse is over\n\tif(highlightIndex == vIndex){\n\t\trgb = vec3(1.0);\n\t\talpha = 1.0;\n\t}\n\n\tgl_FragColor = vec4( rgb, alpha );\n}", this.spikeUniforms = t.uniforms
        };
        const x = [],
            b = [];
        for (let U = 0; U < t; U++) x.push(U), b.push(U);
        const w = new CylinderBufferGeometry(u * h, u * h, 1, 6, 1, false);
        w.setAttribute("index", new InstancedBufferAttribute(new Float32Array(x), 1)), w.translate(0, .5, 0), w.rotateX(-Math.PI / 2);
        const M = new InstancedMesh(w, y, t);
        this.mesh.add(M);
        const S = new BufferGeometry(),
            E = [],
            T = [],
            A = new Color(c),
            L = new Group(),
            P = this.getDensities(),
            {
                densityValues: C,
                minDensity: R,
                maxDensity: I
            } = P;
        let D = 0;
        for (let U = 0; U < t; U++) {
            const t = e[U],
                {
                    gop: i
                } = t,
                r = i;
            Rl(r.lat, r.lon, n, L.position);
            const s = C[D++];
            L.scale.z = Dl(s, R, I, .05 * n, .2 * n), L.lookAt(wl), L.updateMatrix(), M.setMatrixAt(U, L.matrix), m.setMatrixAt(U, L.matrix), Rl(r.lat, r.lon, n + L.scale.z + .25, L.position), E.push(L.position.x, L.position.y, L.position.z), T.push(A.r, A.g, A.b)
        }
        S.setAttribute("position", new Float32BufferAttribute(E, 3).onUpload(Il)), S.setAttribute("color", new Float32BufferAttribute(T, 3).onUpload(Il)), S.setAttribute("index", new Float32BufferAttribute(b, 1).onUpload(Il));
        const N = new PointsMaterial({
            alphaTest: .05,
            size: .8,
            depthWrite: false
        });
        console.log(N);
        N.onBeforeCompile = t => {
            t.uniforms.cameraPosition = {
                value: i.position
            }, t.uniforms.radius = {
                value: n
            }, t.uniforms.visibleIndex = {
                value: s
            }, t.uniforms.maxIndexDistance = {
                value: r
            }, t.vertexShader = "#define GLSLIFY 1\nuniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nuniform float time;\nuniform float visibleIndex;\nuniform float maxIndexDistance;\nuniform float speed;\n\nattribute float index;\nattribute vec3 curveStart;\nattribute vec3 curveCtrl1;\nattribute vec3 curveCtrl2;\nattribute vec3 curveEnd;\nattribute float timeOffset;\n\nvarying float vAlpha;\n\nfloat quarticInOut(float t) {\n  return t < 0.5\n    ? +8.0 * pow(t, 4.0)\n    : -8.0 * pow(t - 1.0, 4.0) + 1.0;\n}\n\nvec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, float t) {\n  vec3 E = mix(A, B, t);\n  vec3 F = mix(B, C, t);\n  vec3 G = mix(C, D, t);\n\n  vec3 H = mix(E, F, t);\n  vec3 I = mix(F, G, t);\n\n  vec3 P = mix(H, I, t);\n\n  return P;\n}\n\nvec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, float t) {\n  vec3 A1 = mix(A, B, t);\n  vec3 B1 = mix(B, C, t);\n  vec3 C1 = mix(C, D, t);\n  vec3 D1 = mix(D, E, t);\n\n  vec3 A2 = mix(A1, B1, t);\n  vec3 B2 = mix(B1, C1, t);\n  vec3 C2 = mix(C1, D1, t);\n\n  vec3 A3 = mix(A2, B2, t);\n  vec3 B3 = mix(B2, C2, t);\n  \n  vec3 P = mix(A3, B3, t);\n\n  return P;\n}\n\nvec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, vec3 F, float t) {\n  vec3 A1 = mix(A, B, t);\n  vec3 B1 = mix(B, C, t);\n  vec3 C1 = mix(C, D, t);\n  vec3 D1 = mix(D, E, t);\n  vec3 E1 = mix(E, F, t);\n\n  vec3 A2 = mix(A1, B1, t);\n  vec3 B2 = mix(B1, C1, t);\n  vec3 C2 = mix(C1, D1, t);\n  vec3 D2 = mix(D1, E1, t);\n\n  vec3 A3 = mix(A2, B2, t);\n  vec3 B3 = mix(B2, C2, t);\n  vec3 C3 = mix(C2, D2, t);\n\n  vec3 A4 = mix(A3, B3, t);\n  vec3 B4 = mix(B3, C3, t);\n  \n  vec3 P = mix(A4, B4, t);\n\n  return P;\n}\n\nvec3 bezier(vec3 A, vec3 B, vec3 C, vec3 D, vec3 E, vec3 F, vec3 G, float t) {\n  vec3 A1 = mix(A, B, t);\n  vec3 B1 = mix(B, C, t);\n  vec3 C1 = mix(C, D, t);\n  vec3 D1 = mix(D, E, t);\n  vec3 E1 = mix(E, F, t);\n  vec3 F1 = mix(F, G, t);\n\n  vec3 A2 = mix(A1, B1, t);\n  vec3 B2 = mix(B1, C1, t);\n  vec3 C2 = mix(C1, D1, t);\n  vec3 D2 = mix(D1, E1, t);\n  vec3 E2 = mix(E1, F1, t);\n\n  vec3 A3 = mix(A2, B2, t);\n  vec3 B3 = mix(B2, C2, t);\n  vec3 C3 = mix(C2, D2, t);\n  vec3 D3 = mix(D2, E2, t);\n\n  vec3 A4 = mix(A3, B3, t);\n  vec3 B4 = mix(B3, C3, t);\n  vec3 C4 = mix(C3, D3, t);\n\n  vec3 A5 = mix(A4, B4, t);\n  vec3 B5 = mix(B4, C4, t);\n  \n  vec3 P = mix(A5, B5, t);\n\n  return P;\n}\n\nvoid main() {    \n\t#include <color_vertex>\n\n\t// animate along curve and loop\n\tfloat t = quarticInOut(fract((time * speed + timeOffset)));\n\n\tvec3 pos = position;\n\n\t#ifdef USE_CURVE\n\t\tpos =  bezier(curveStart, curveCtrl1, curveCtrl2, curveEnd, t);\n\t#endif\n\n\tvec3 transformed = vec3( pos );\n\n\t// visible near visibleIndex\n\tfloat dist = distance(index, visibleIndex);\n\tvAlpha = smoothstep(maxIndexDistance * 0.75, 0.0, dist); // show after lines draw in (* 0.75)\n\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\tgl_PointSize = size;\n\t#ifdef USE_SIZEATTENUATION\n\t\tbool isPerspective = isPerspectiveMatrix( projectionMatrix );\n\t\tif ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n\t#endif\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <fog_vertex>\n}", t.fragmentShader = "#define GLSLIFY 1\nuniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nuniform float radius;\nuniform float visibleIndex;\nuniform float maxIndexDistance;\n\nvarying vec3 vViewPosition;\nvarying float vAlpha;\n\n#define V0 vec3(0.0)\n\nvoid main() {\n\tif(vAlpha <= 0.05){\n\t\tdiscard;\n\t\treturn;\n\t}\n\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_particle_fragment>\n\t#include <color_fragment>\n\t#include <alphatest_fragment>\t\n\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n}", this.particleUniforms = t.uniforms
        };
        const O = new Points(S, N);
        console.log(O);
        this.mesh.add(O);
        this.materials = [y, N];
        this.spikes = M;
        this.spikeIntersects = m;
        this.particles = O;
        this.spikes.renderOrder = 3;
        this.particles.renderOrder = 4;
    }
    getDensities() {
        const {
            data: t,
            maxAmount: e = 1e3,
            radius: n
        } = this.props, i = new Vector3, r = [], s = [];
        for (let h = 0; h < e; h++) {
            const e = t[h],
                {
                    gop: o
                } = e,
                c = o;
            c && c.lat && c.lon && (Rl(c.lat, c.lon, n, i), r.push((new Vector3).copy(i)), s.push(0))
        }
        let o = 99999,
            c = -1;
        return s.forEach((t => {
            t < o ? o = t : t > c && (c = t)
        })), {
            densityValues: s,
            minDensity: o,
            maxDensity: c
        }
    }
    setHighlightIndex(t) {
        this.spikeUniforms && this.spikeUniforms.highlightIndex.value !== t && (this.spikeUniforms.highlightIndex.value = t)
    }
    update(t) {
        if (this.spikeUniforms && this.particleUniforms) {
            const {
                maxAmount: e,
                maxIndexDistance: n
            } = this.props;
            this.spikeUniforms && (this.spikeUniforms.visibleIndex.value = t), this.particleUniforms && (this.particleUniforms.visibleIndex.value = t);
            const i = Nl(t - n | 0, 0, e),
                r = 2 * n | 0,
                s = Nl(i + r, 0, e);
            this.spikes.count = s, this.particles.geometry.setDrawRange(i, r)
        }
    }
    dispose() {
        this.mesh && Pl(this.mesh, Ll), this.mesh && this.mesh.parent && this.mesh.parent.remove(this.mesh), this.props = null, this.mesh = null, this.spikeUniforms = null, this.particleUniforms = null, this.materials = null, this.spikes = null, this.particles = null
    }
}

class $l {
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
        for (let x = 0; x < i; x++) {
            const {
                gop: n,
                gm: i
            } = t[x], r = n, s = i, o = Rl(r.lat, r.lon, e), c = Rl(s.lat, s.lon, e), h = o.distanceTo(c);
            if (h > 1.5) {
                let t;
                t = Dl(h, 0, 2 * e, 1, h > 1.85 * e ? 3.25 : h > 1.4 * e ? 2.3 : 1.5);
                const n = Cl(r.lat, r.lon, s.lat, s.lon),
                    i = Rl(n[0], n[1], e * t);
                d.copy(i), f.copy(i);
                const u = Dl(h, 10, 30, .2, .15),
                    m = Dl(h, 10, 30, .8, .85);
                t = Dl(h, 0, 2 * e, 1, 1.7);
                const y = new CubicBezierCurve3(o, d, f, c);
                y.getPoint(u, d), y.getPoint(m, f), d.multiplyScalar(t), f.multiplyScalar(t);
                const b = new CubicBezierCurve3(o, d, f, c),
                    w = Rl(s.lat, s.lon, e + x / 1e4),
                    M = Rl(s.lat, s.lon, e + 5);
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

export default class Renderer {
    constructor(t) {
        this.handleResize = this.handleResize.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handleResume = this.handleResume.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.setDragging = this.setDragging.bind(this);
        this.update = this.update.bind(this);
        this.hasLoaded = false;
        this.initBase(t || document.body);
        this.initScene();
        this.addListeners();
        _l.on(vl, this.handlePause);
        _l.on(yl, this.handleResume);
    }
    initBase(t) {
      const {width, height} = bl.parentNode.getBoundingClientRect();
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(20, width / height, 170, 260);
        this.renderer = new WebGLRenderer({
            powerPreference: "high-performance",
            alpha: false,
            preserveDrawingBuffer: false
        });
        this.then = Date.now() / 1e3;
        this.fpsWarnings = 0;
        this.fpsWarningThreshold = 50;
        this.fpsTarget = 60;
        this.fpsEmergencyThreshold = 12;
        this.fpsTargetSensitivity = .925;
        this.fpsStorage = [];
        this.worldDotRows = 200;
        this.worldDotSize = .095;
        this.renderQuality = 4;
        this.renderer.setPixelRatio(bl.pixelRatio || 1);
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(265505, 1);
        t.appendChild(this.renderer.domElement);
        this.renderer.domElement.classList.add("webgl-canvas");
        this.renderer.domElement.classList.add("js-globe-canvas");
        const i = new AmbientLight(16777215, .8);
        this.scene.add(i);
        this.parentContainer = new Group;
        this.parentContainer.name = "parentContainer";
        let r = hl;
        const s = (new Date).getTimezoneOffset() || 0;
        r.y = hl.y + Math.PI * (s / 720);
        this.parentContainer.rotation.copy(r);
        this.scene.add(this.parentContainer);
        this.haloContainer = new Group();
        this.haloContainer.name = "haloContainer";
        this.scene.add(this.haloContainer);
        this.container = new Group();
        this.container.name = "container";
        this.parentContainer.add(this.container);
        this.camera.position.set(0, 0, 220);
        this.scene.add(this.camera);
        this.clock = new Clock();
        this.mouse = new Vector3(0, 0, .5);
        this.mouseScreenPos = new Vector2(-9999, -9999);
        this.raycaster = new Raycaster();
        this.raycaster.far = 260;
        this.paused = false;
        this.canvasOffset = {
            x: 0,
            y: 0
        }
        this.updateCanvasOffset();
        // could be meshphong
        this.highlightMaterial = new MeshBasicMaterial({
            opacity: 1,
            transparent: false,
            color: fl
        });
        this.handleResize();
        this.startUpdating();
    }
    initScene() {
        const {
            isMobile: t,
            globeRadius: e = cl,
            assets: {
                textures: {
                    globeDiffuse: n,
                    globeAlpha: i
                }
            }
        } = bl;
        this.radius = e, this.light0 = new SpotLight(ml, 12, 120, .3, 0, 1.1), this.light1 = new DirectionalLight(11124735, 3), this.light3 = new SpotLight(gl, 5, 75, .5, 0, 1.25), this.light0.target = this.parentContainer, this.light1.target = this.parentContainer, this.light3.target = this.parentContainer, this.scene.add(this.light0, this.light1, this.light3), this.positionContainer(), this.shadowPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(.7 * this.radius, .3 * -this.radius, this.radius)), this.highlightPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(1.5 * -this.radius, 1.5 * -this.radius, 0)), this.frontPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(0, 0, this.radius));
        const r = new Globe({
            radius: this.radius,
            detail: 55,
            renderer: this.renderer,
            shadowPoint: this.shadowPoint,
            shadowDist: 1.5 * this.radius,
            highlightPoint: this.highlightPoint,
            highlightColor: 5339494,
            highlightDist: 5,
            frontPoint: this.frontPoint,
            frontHighlightColor: 2569853,
            waterColor: 1513012,
            landColorFront: fl,
            landColorBack: fl
        });
        this.container.add(r.mesh), this.globe = r;
        const s = new Mesh(new SphereBufferGeometry(cl, 45, 45), new ShaderMaterial({
            uniforms: {
                c: {
                    type: "f",
                    value: .7
                },
                p: {
                    type: "f",
                    value: 15
                },
                glowColor: {
                    type: "c",
                    value: new Color(1844322)
                },
                viewVector: {
                    type: "v3",
                    value: new Vector3(0, 0, 220)
                }
            },
            vertexShader: "#define GLSLIFY 1\nuniform vec3 viewVector;\nuniform float c;\nuniform float p;\nvarying float intensity;\nvoid main() \n{\n  vec3 vNormal = normalize( normalMatrix * normal );\n  vec3 vNormel = normalize( normalMatrix * viewVector );\n  intensity = pow( c - dot(vNormal, vNormel), p );\n  \n  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "#define GLSLIFY 1\nuniform vec3 glowColor;\nvarying float intensity;\nvoid main() \n{\n\tvec3 glow = glowColor * intensity;\n  gl_FragColor = vec4( glow, 1.0 );\n}",
            side: 1,
            blending: 2,
            transparent: true
        }));
        s.scale.multiplyScalar(1.15), s.rotateX(.03 * Math.PI), s.rotateY(.03 * Math.PI), s.renderOrder = 3, this.haloContainer.add(s), this.dragging = false, this.rotationSpeed = .05, this.raycastIndex = 0, this.raycastTrigger = 10, this.raycastTargets = [], this.intersectTests = [], this.controls = new Controller({
            object: this.container,
            objectContainer: this.parentContainer,
            domElement: this.renderer.domElement,
            setDraggingCallback: this.setDragging,
            rotateSpeed: t ? 1.5 : 3,
            autoRotationSpeed: this.rotationSpeed,
            easing: .12,
            maxRotationX: .5,
            camera: this.camera
        })
    }
    initDataObjects(t) {
        const e = {
            openPrColor: ml,
            openPrParticleColor: 6137337,
            mergedPrColor: gl,
            mergedPrColorHighlight: fl
        };
        this.buildWorldGeometry();
        this.maxAmount = t.length;
        this.maxIndexDistance = 60;
        this.indexIncrementSpeed = 15;
        this.visibleIndex = 60;
        this.openPrEntity = new Kl({
            data: t,
            maxAmount: this.maxAmount,
            radius: this.radius,
            camera: this.camera,
            maxIndexDistance: this.maxIndexDistance,
            indexIncrementSpeed: this.indexIncrementSpeed,
            visibleIndex: this.visibleIndex,
            colors: e
        }), this.mergedPrEntity = new $l({
            data: t,
            maxAmount: this.maxAmount,
            radius: this.radius,
            camera: this.camera,
            maxIndexDistance: this.maxIndexDistance,
            visibleIndex: this.visibleIndex,
            colors: e,
            mouse: this.mouse
        });
        const {
            width: n,
            height: i
        } = bl.parentNode.getBoundingClientRect(), r = 850 / i * 1;
        this.containerScale = r, this.dataInfo = new Tooltip({
            parentSelector: ".js-webgl-globe-data",
            domElement: this.renderer.domElement,
            controls: this.controls
        }), this.dataItem = {}, this.intersectTests.push(this.globe.meshFill), this.intersectTests.push(this.openPrEntity.spikeIntersects), this.intersectTests.push(...this.mergedPrEntity.lineHitMeshes), this.intersects = []
    }
    monitorFps() {
        if (1 == this.renderQuality) return;
        const t = Date.now() / 1e3,
            e = t - this.then;
        this.then = t;
        const n = parseInt(1 / e + .5);
        this.fpsStorage.push(n), this.fpsStorage.length > 10 && this.fpsStorage.shift();
        const i = this.fpsStorage.reduce(((t, e) => t + e)) / this.fpsStorage.length;
        i < this.fpsTarget * this.fpsTargetSensitivity && this.fpsStorage.length > 9 ? (this.fpsWarnings++, this.fpsWarnings > this.fpsWarningThreshold && (this.renderQuality = Math.max(this.renderQuality - 1, 1), this.fpsWarnings = 0, this.updateRenderQuality(), this.fpsStorage = [])) : this.fpsStorage.length > 9 && i < this.fpsEmergencyThreshold ? (this.renderQuality = 1, this.initPerformanceEmergency()) : this.fpsWarnings = 0
    }
    updateRenderQuality() {
        4 == this.renderQuality ? this.initRegularQuality() : 3 == this.renderQuality ? this.initMediumQuality() : 2 == this.renderQuality ? this.initLowQuality() : 1 == this.renderQuality && this.initLowestQuality()
    }
    initRegularQuality() {
        this.renderer.setPixelRatio(bl.pixelRatio || 1), this.indexIncrementSpeed = 15, this.raycastTrigger = 10
    }
    initMediumQuality() {
        this.renderer.setPixelRatio(Math.min(bl.pixelRatio, 1.85)), this.indexIncrementSpeed = 13, this.raycastTrigger = 12
    }
    initLowQuality() {
        this.renderer.setPixelRatio(Math.min(bl.pixelRatio, 1.5)), this.indexIncrementSpeed = 10, this.raycastTrigger = 14, this.worldDotRows = 180, this.worldDotSize = .1, this.resetWorldMap(), this.buildWorldGeometry()
    }
    initLowestQuality() {
        this.renderer.setPixelRatio(1), this.indexIncrementSpeed = 5, this.raycastTrigger = 16, this.worldDotRows = 140, this.worldDotSize = .1, this.resetWorldMap(), this.buildWorldGeometry()
    }
    initPerformanceEmergency() {
        this.dispose()
    }
    buildWorldGeometry() {
        const {
            assets: {
                textures: {
                    worldMap: t
                }
            }
        } = bl, e = new Object3D, n = this.getImageData(t.image), i = [], r = this.worldDotRows;
        for (let h = -90; h <= 90; h += 180 / r) {
            const t = Math.cos(Math.abs(h) * Ml) * cl * Math.PI * 2 * 2;
            for (let r = 0; r < t; r++) {
                const s = 360 * r / t - 180;
                if (!this.visibilityForCoordinate(s, h, n)) continue;
                const o = Rl(h, s, this.radius);
                e.position.set(o.x, o.y, o.z);
                const c = Rl(h, s, this.radius + 5);
                e.lookAt(c.x, c.y, c.z), e.updateMatrix(), i.push(e.matrix.clone())
            }
        }
        const s = new CircleBufferGeometry(this.worldDotSize, 5),
            o = new MeshStandardMaterial({
                color: 3818644,
                metalness: 0,
                roughness: .9,
                transparent: true,
                alphaTest: .02
            });
        o.onBeforeCompile = function(t) {
            t.fragmentShader = t.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "\n        gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n        if (gl_FragCoord.z > 0.51) {\n          gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0;\n        }\n      ")
        };
        const c = new InstancedMesh(s, o, i.length);
        for (let h = 0; h < i.length; h++) c.setMatrixAt(h, i[h]);
        c.renderOrder = 3, this.worldMesh = c, this.container.add(c)
    }
    resetWorldMap() {
        this.container.remove(this.worldMesh), Ll(this.worldMesh), this.dotMesh = null
    }
    highlightArcticCodeVault() {
        this.vaultIsHighlighted || (this.arcticCodeVaultMesh.material = this.highlightMaterial, this.vaultIsHighlighted = true)
    }
    resetArcticCodeVaultHighlight() {
        this.vaultIsHighlighted && (this.arcticCodeVaultMesh.material = this.vaultMaterial, this.vaultIsHighlighted = false)
    }
    visibilityForCoordinate(t, e, n) {
        const i = 4 * n.width,
            r = parseInt((t + 180) / 360 * n.width + .5),
            s = n.height - parseInt((e + 90) / 180 * n.height - .5),
            o = parseInt(i * (s - 1) + 4 * r) + 3;
        return n.data[o] > 90
    }
    getImageData(t) {
        const e = document.createElement("canvas").getContext("2d");
        return e.canvas.width = t.width, e.canvas.height = t.height, e.drawImage(t, 0, 0, t.width, t.height), e.getImageData(0, 0, t.width, t.height)
    }
    addListeners() {
        window.addEventListener("resize", this.handleResize, false), window.addEventListener("orientationchange", this.handleResize, false), window.addEventListener("scroll", this.handleScroll, false), this.handleClick = t => {
            null === this.dataItem || null === this.dataItem.url || this.shouldCancelClick(t) || window.open(this.dataItem.url, "_blank")
        }, this.renderer.domElement.addEventListener("mouseup", this.handleClick, false), this.handleMouseDown = t => {
            this.resetInteractionIntention(t)
        }, this.renderer.domElement.addEventListener("mousedown", this.handleMouseDown, false), this.handleTouchStart = t => {
            const e = t.changedTouches[0];
            this.handleMouseMove(e), this.resetInteractionIntention(e), t.preventDefault()
        }, this.renderer.domElement.addEventListener("touchstart", this.handleTouchStart, false), this.handleTouchMove = t => {
            this.shouldCancelClick(t.changedTouches[0]) && (this.mouse = {
                x: -9999,
                y: -9999
            }, t.preventDefault())
        }, this.renderer.domElement.addEventListener("touchmove", this.handleTouchMove, false), this.renderer.domElement.addEventListener("mousemove", this.handleMouseMove, false)
    }
    removeListeners() {
        window.removeEventListener("resize", this.handleResize), window.removeEventListener("orientationchange", this.handleResize), window.removeEventListener("scroll", this.handleScroll), this.renderer.domElement.removeEventListener("mousemove", this.handleMouseMove), this.renderer.domElement.removeEventListener("mouseup", this.handleClick), this.renderer.domElement.removeEventListener("mousedown", this.handleMouseDown), this.renderer.domElement.removeEventListener("touchstart", this.handleTouchStart), this.renderer.domElement.removeEventListener("touchmove", this.handleTouchMove)
    }
    updateCanvasOffset() {
        const t = document.querySelector(".js-webgl-globe-data").getBoundingClientRect(),
            e = document.querySelector(".js-webgl-globe").getBoundingClientRect();
        this.canvasOffset = {
            x: e.x - t.x,
            y: e.y - t.y
        }
    }
    resetInteractionIntention(t) {
        this.mouseDownPos = {
            x: t.clientX,
            y: t.clientY
        }
    }
    shouldCancelClick(t) {
        const e = Math.abs(t.clientX - this.mouseDownPos.x);
        return Math.abs(t.clientY - this.mouseDownPos.y) > 2 || e > 2
    }
    positionContainer() {
        const {
            isMobile: t,
            parentNode: e
        } = bl, {
            height: n
        } = e.getBoundingClientRect(), i = 850 / n * 1;
        this.containerScale = i, t ? this.parentContainer.position.set(0, 0, 0) : (this.parentContainer.scale.set(i, i, i), this.parentContainer.position.set(0, 0, 0), this.haloContainer.scale.set(i, i, i)), this.haloContainer.position.set(0, 0, -10), this.positionLights(i)
    }
    positionLights(t = 1) {
        this.light0 && (this.light0.position.set(this.parentContainer.position.x - 2.5 * this.radius, 80, -40).multiplyScalar(t), this.light0.distance = 120 * t), this.light1 && this.light1.position.set(this.parentContainer.position.x - 50, this.parentContainer.position.y + 30, 10).multiplyScalar(t), this.light2 && (this.light2.position.set(this.parentContainer.position.x - 25, 0, 100).multiplyScalar(t), this.light2.distance = 150 * t), this.light3 && (this.light3.position.set(this.parentContainer.position.x + this.radius, this.radius, 2 * this.radius).multiplyScalar(t), this.light3.distance = 75 * t)
    }
    handlePause() {
        this.stopUpdating(), this.clock.stop()
    }
    handleResume() {
        this.clock.start(), this.startUpdating()
    }
    handleScroll() {
        window.scrollY >= this.renderer.domElement.getBoundingClientRect().height && !this.paused ? (this.paused = true, _l.emit(vl)) : window.scrollY < this.renderer.domElement.getBoundingClientRect().height && this.paused && (this.paused = false, _l.emit(yl))
    }
    handleResize() {
        clearTimeout(this.resizeTimeout), this.resizeTimeout = setTimeout((() => {
            const {
                width: t,
                height: e
            } = bl.parentNode.getBoundingClientRect();
            this.camera.aspect = t / e, this.camera.updateProjectionMatrix(), this.renderer.setSize(t, e), this.positionContainer();
            const n = 850 / e * 1,
                i = this.radius * n;
            this.shadowPoint.copy(this.parentContainer.position).add(new Vector3(.7 * i, .3 * -i, i)), this.globe.setShadowPoint(this.shadowPoint), this.highlightPoint.copy(this.parentContainer.position).add(new Vector3(1.5 * -i, 1.5 * -i, 0)), this.globe.setHighlightPoint(this.highlightPoint), this.frontPoint = (new Vector3).copy(this.parentContainer.position).add(new Vector3(0, 0, i)), this.globe.setFrontPoint(this.frontPoint), this.globe.setShadowDist(1.5 * i), this.globe.setHighlightDist(5 * n), this.updateCanvasOffset()
        }), 150)
    }
    handleMouseMove(t) {
        null != t.preventDefault && t.preventDefault();
        const {
            width: e,
            height: n,
            x: i,
            y: r
        } = bl.parentNode.getBoundingClientRect(), s = t.clientX - i, o = t.clientY - r;
        this.mouse.x = s / e * 2 - 1, this.mouse.y = -o / n * 2 + 1, this.mouseScreenPos.set(s, o)
    }
    startUpdating() {
        this.stopUpdating(), this.update()
    }
    stopUpdating() {
        cancelAnimationFrame(this.rafID)
    }
    setDragging(t = true) {
        this.dragging = t
    }
    setDataInfo(t) {
        if (!this.dataInfo) return;
        if (this.dataItem == t) return;
        this.dataItem = t;
        const {
            uol: e,
            uml: n,
            l: i,
            type: r,
            body: s,
            header: o,
            nwo: c,
            pr: h,
            ma: u,
            oa: d
        } = t;
        let f = u || d;
        f && (f = f.replace(" ", "T"), f = f.includes("Z") ? f : f.concat("-08:00"), f = Date.parse(f)), c && h && (this.dataItem.url = `https://github.com/${c}/pull/${h}`), this.dataInfo.setInfo({
            user_opened_location: e,
            user_merged_location: n,
            language: i,
            name_with_owner: c,
            pr_id: h,
            time: f,
            type: r,
            body: s,
            header: o,
            url: this.dataItem.url
        })
    }
    testForDataIntersection() {
        const {
            mouse: t,
            raycaster: e,
            camera: n
        } = this;
        this.intersects.length = 0,
            function(t, e, n, i, r, s = false) {
                (i = i || new ja).setFromCamera(t, e);
                const o = i.intersectObjects(n, s, r);
                o.length > 0 && o[0]
            }(t, n, this.intersectTests, e, this.intersects), this.intersects.length && this.intersects[0].object === this.globe.meshFill && (this.intersects.length = 0)
    }
    transitionIn() {
        return new Promise((() => {
            this.container.add(this.openPrEntity.mesh), this.container.add(this.mergedPrEntity.mesh)
        }))
    }
    handleUpdate() {
        if (this.monitorFps(), null === this.clock) return;
        const t = this.clock.getDelta();
        if (this.controls && this.controls.update(t), this.visibleIndex += t * this.indexIncrementSpeed, this.visibleIndex >= this.maxAmount - 60 && (this.visibleIndex = 60), this.openPrEntity && this.openPrEntity.update(this.visibleIndex), this.mergedPrEntity && this.mergedPrEntity.update(t, this.visibleIndex), !this.dataInfo) return void this.render();
        const {
            raycaster: e,
            camera: n,
            mouseScreenPos: i
        } = this;
        let r, s = false;
        if (this.raycastIndex % this.raycastTrigger == 0) {
            if (this.testForDataIntersection(), this.intersects.length) {
                this.radius, this.containerScale;
                for (let t = 0; t < this.intersects.length && !s; t++) {
                    const {
                        instanceId: e,
                        object: n
                    } = this.intersects[t];
                    if ("lineMesh" === n.name) {
                        r = this.setMergedPrEntityDataItem(n), s = true;
                        break
                    }
                    if (n === this.openPrEntity.spikeIntersects && this.shouldShowOpenPrEntity(e)) {
                        r = this.setOpenPrEntityDataItem(e), s = true;
                        break
                    }
                    if ("arcticCodeVault" === n.name) {
                        r = {
                            header: "Arctic Code Vault",
                            body: "Svalbard â€¢ Cold storage of the work of 3,466,573 open source developers. For safe keeping.\nLearn more â†’",
                            type: pl,
                            url: "https://archiveprogram.github.com"
                        }, this.highlightArcticCodeVault(), s = true;
                        break
                    }
                }
            }
            s && r ? (this.setDataInfo(r), this.dataInfo.show()) : (this.dataInfo.hide(), this.openPrEntity.setHighlightIndex(-9999), this.mergedPrEntity.resetHighlight(), this.resetArcticCodeVaultHighlight(), this.dataItem = null, bl.isMobile && (this.mouse = {
                x: -9999,
                y: -9999
            }))
        }
        this.dragging && (this.dataInfo.hide(), this.openPrEntity.setHighlightIndex(-9999), this.mergedPrEntity.resetHighlight(), this.resetArcticCodeVaultHighlight()), this.dataInfo.isVisible && this.dataInfo.update(i, this.canvasOffset), this.raycastIndex++, this.raycastIndex >= this.raycastTrigger && (this.raycastIndex = 0), this.render()
    }
    update() {
        this.handleUpdate(), this.hasLoaded || this.sceneDidLoad(), this.rafID = requestAnimationFrame(this.update)
    }
    render() {
        this.renderer.render(this.scene, this.camera)
    }
    shouldShowMergedPrEntity(t, e) {
        const n = t.geometry.attributes.index.array[e];
        return n >= this.visibleIndex - this.maxIndexDistance && n <= this.visibleIndex + this.maxIndexDistance
    }
    sceneDidLoad() {
        this.hasLoaded = true;
        const t = document.querySelector(".js-webgl-globe-loading");
        if (!t) return;
        const e = {
            fill: "both",
            duration: 600,
            easing: "ease"
        };
        this.renderer.domElement.animate([{
            opacity: 0,
            transform: "scale(0.8)"
        }, {
            opacity: 1,
            transform: "scale(1)"
        }], e), t.animate([{
            opacity: 1,
            transform: "scale(0.8)"
        }, {
            opacity: 0,
            transform: "scale(1)"
        }], e).addEventListener("finish", (() => {
            t.remove()
        }))
    }
    setMergedPrEntityDataItem(t) {
        this.mergedPrEntity.setHighlightObject(t), this.openPrEntity.setHighlightIndex(-9999);
        const e = this.mergedPrEntity.props.data[parseInt(t.userData.dataIndex)];
        return e.type = dl, e
    }
    shouldShowOpenPrEntity(t) {
        return t >= this.visibleIndex - this.maxIndexDistance && t <= this.visibleIndex + this.maxIndexDistance
    }
    setOpenPrEntityDataItem(t) {
        this.openPrEntity.setHighlightIndex(t), this.mergedPrEntity.resetHighlight();
        const e = this.openPrEntity.props.data[t];
        return e.type = ul, e
    }
    dispose() {
        this.stopUpdating(), this.removeListeners(), _l.off(vl, this.handlePause), _l.off(yl, this.handleResume), this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode && this.renderer.domElement.parentNode.removeChild(this.renderer.domElement), this.controls && this.controls.dispose(), this.globe && this.globe.dispose(), this.openPrEntity && this.openPrEntity.dispose(), this.mergedPrEntity && this.mergedPrEntity.dispose(), this.dataInfo && this.dataInfo.dispose(), this.scene = null, this.camera = null, this.renderer = null, this.parentContainer = null, this.container = null, this.clock = null, this.mouse = null, this.mouseScreenPos = null, this.raycaster = null, this.paused = null, this.radius = null, this.light0 = null, this.light1 = null, this.light2 = null, this.light3 = null, this.shadowPoint = null, this.highlightPoint = null, this.frontPoint = null, this.globe = null, this.dragging = null, this.rotationSpeed = null, this.raycastIndex = null, this.raycastTrigger = null, this.raycastTargets = null, this.intersectTests = null, this.controls = null, this.maxAmount = null, this.maxIndexDistance = null, this.indexIncrementSpeed = null, this.visibleIndex = null, this.openPrEntity = null
    }
}
