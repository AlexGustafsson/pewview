import {
  Vector3,
  Group,
  MeshBasicMaterial,
  Color,
  InstancedMesh,
  BoxBufferGeometry,
  CylinderBufferGeometry,
  InstancedBufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
} from "../include/three"
import {bl} from "./globals"

const wl = new Vector3();

const Ml = Math.PI / 180; //rad2deg
const Sl = 180 / Math.PI; //deg2rad

function Il() {
    this.array = null
}

// In renderer and merged too
function Ll(t) {
    t instanceof Mesh && (t.geometry && t.geometry.dispose(), t.material && (t.material.map && t.material.map.dispose(), t.material.lightMap && t.material.lightMap.dispose(), t.material.bumpMap && t.material.bumpMap.dispose(), t.material.normalMap && t.material.normalMap.dispose(), t.material.specularMap && t.material.specularMap.dispose(), t.material.envMap && t.material.envMap.dispose(), t.material.emissiveMap && t.material.emissiveMap.dispose(), t.material.metalnessMap && t.material.metalnessMap.dispose(), t.material.roughnessMap && t.material.roughnessMap.dispose(), t.material.dispose()))
}

function Dl(t, e, n, i, r) {
    return function(t, e, n) {
        return (n - e) * t + e
    }(function(t, e, n) {
        return (t - e) / (n - e) || 0
    }(t, e, n), i, r)
}

// Same as renderer
function Rl(t, e, n, i) {
    i = i || new Vector3;
    const r = (90 - t) * Ml,
        s = (e + 180) * Ml;
    return i.set(-n * Math.sin(r) * Math.cos(s), n * Math.cos(r), n * Math.sin(r) * Math.sin(s)), i
}

// in merged and controller too
function Nl(t, e, n) {
    return Math.max(e, Math.min(t, n))
}

export default class OpenPREntity {
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
        for (let U = 0; U < e.Connections.length; U++) {
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
            const t = e.Connections[U],
                {
                    Source: i
                } = t,
                r = i;
            Rl(r.Latitude, r.Longitude, n, L.position);
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
        for (let h = 0; h < t.Connections.length; h++) {
            const e = t.Connections[h],
                {
                    Source: o
                } = e,
                c = o;
            c && c.Latitude && c.Longitude && (Rl(c.Latitude, c.Longitude, n, i), r.push((new Vector3).copy(i)), s.push(0))
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
