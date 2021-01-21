#define GLSLIFY 1
#define STANDARD
#ifdef PHYSICAL
	#define REFLECTIVITY
	#define CLEARCOAT
	#define TRANSPARENCY
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef TRANSPARENCY
	uniform float transparency;
#endif
#ifdef REFLECTIVITY
	uniform float reflectivity;
#endif
#ifdef CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheen;
#endif
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform float shadowDist;
uniform float highlightDist;
uniform vec3 shadowPoint;
uniform vec3 highlightPoint;
uniform vec3 frontPoint;
uniform vec3 highlightColor;
uniform vec3 frontHighlightColor;

varying vec3 vWorldPosition;

void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#ifdef USE_MAP

		vec4 texelColor = texture2D( map, vUv );
		texelColor = mapTexelToLinear( texelColor );

		#ifndef IS_FILL
			diffuseColor *= texelColor;
		#endif

	#endif
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#ifdef TRANSPARENCY
		diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
	#endif

    float dist;
	float distZ;

    // highlights
	#ifdef USE_HIGHLIGHT
		dist = distance(vWorldPosition, highlightPoint);
		distZ = distance(vWorldPosition.z, 0.0);
		outgoingLight = mix(highlightColor, outgoingLight, smoothstep(0.0, highlightDist, dist) * smoothstep(0.0, 3.0, pow(distZ, 0.5)));
        outgoingLight = mix(outgoingLight * 2.0, outgoingLight, smoothstep(0.0, 12.0, distZ));
	#endif

    // front hightlight
    #ifdef USE_FRONT_HIGHLIGHT
        dist = distance(vWorldPosition * vec3(0.875, 0.5, 1.0), frontPoint);
        outgoingLight = mix(frontHighlightColor * 1.6, outgoingLight, smoothstep(0.0, 15.0, dist));
    #endif

    // shadows
    dist = distance(vWorldPosition, shadowPoint);
	outgoingLight = mix(outgoingLight * 0.01, outgoingLight, smoothstep(0.0, shadowDist, dist));
    // shadow debug
	// outgoingLight = mix(vec3(1.0, 0.0, 0.0), outgoingLight, smoothstep(0.0, shadowDist, dist));

	#ifdef IS_FILL
		outgoingLight = mix(outgoingLight, outgoingLight * 0.5, 1.0 - texelColor.g * 1.5);
	#endif

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
