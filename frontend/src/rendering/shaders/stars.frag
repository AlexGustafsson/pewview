#define GLSLIFY 1
uniform float noiseSeed;
uniform float noiseScale;
uniform float noiseIntensity;
uniform vec2 resolution;
uniform vec2 offset;

#define HASHSCALE3 vec3(.1031, .1030, .0973)
#define UVSCALE 1.0

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
float perlinNoise(vec3 P) {
    vec3 i0 = mod289(floor(P)), i1 = mod289(i0 + vec3(1.0));
    vec3 f0 = fract(P), f1 = f0 - vec3(1.0), f = fade(f0);
    vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x), iy = vec4(i0.yy, i1.yy);
    vec4 iz0 = i0.zzzz, iz1 = i1.zzzz;
    vec4 ixy = permute(permute(ix) + iy), ixy0 = permute(ixy + iz0), ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0), gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    vec4 gx1 = ixy1 * (1.0 / 7.0), gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0); gx1 = fract(gx1);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0), sz0 = step(gz0, vec4(0.0));
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1), sz1 = step(gz1, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g0 = vec3(gx0.x,gy0.x,gz0.x), g1 = vec3(gx0.y,gy0.y,gz0.y),
        g2 = vec3(gx0.z,gy0.z,gz0.z), g3 = vec3(gx0.w,gy0.w,gz0.w),
        g4 = vec3(gx1.x,gy1.x,gz1.x), g5 = vec3(gx1.y,gy1.y,gz1.y),
        g6 = vec3(gx1.z,gy1.z,gz1.z), g7 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g0,g0), dot(g2,g2), dot(g1,g1), dot(g3,g3)));
    vec4 norm1 = taylorInvSqrt(vec4(dot(g4,g4), dot(g6,g6), dot(g5,g5), dot(g7,g7)));
    g0 *= norm0.x; g2 *= norm0.y; g1 *= norm0.z; g3 *= norm0.w;
    g4 *= norm1.x; g6 *= norm1.y; g5 *= norm1.z; g7 *= norm1.w;
    vec4 nz = mix(vec4(dot(g0, vec3(f0.x, f0.y, f0.z)), dot(g1, vec3(f1.x, f0.y, f0.z)),
        dot(g2, vec3(f0.x, f1.y, f0.z)), dot(g3, vec3(f1.x, f1.y, f0.z))),
        vec4(dot(g4, vec3(f0.x, f0.y, f1.z)), dot(g5, vec3(f1.x, f0.y, f1.z)),
            dot(g6, vec3(f0.x, f1.y, f1.z)), dot(g7, vec3(f1.x, f1.y, f1.z))), f.z);
    return 2.2 * mix(mix(nz.x,nz.z,f.y), mix(nz.y,nz.w,f.y), f.x);
}

vec2 hash22(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

float saturate(float x)
{
	return clamp(x, 0.0, 1.0);
}

vec3 saturate(vec3 x)
{
   x.x = clamp(x.x, 0.0, 1.0);
   x.y = clamp(x.y, 0.0, 1.0);
   x.z = clamp(x.z, 0.0, 1.0);

   return x;
}

void main() {
	float noise = perlinNoise(vec3(gl_FragCoord.x / noiseScale, gl_FragCoord.y / noiseScale, noiseSeed));
	float timeAlpha = 100.0;
	vec2 pos = gl_FragCoord.xy + offset;

	float screenRatio = resolution.x/resolution.y;
	vec2 ratioScale = vec2(1.0 * screenRatio, 1);
	vec2 uv = (pos * ratioScale)/resolution.xy * UVSCALE;
	vec2 uvcell = fract(uv);

	// get random 2d cell noise
	vec2 hash = hash22(floor(uv));
	hash = (hash - 0.5);
	hash *= saturate(timeAlpha - 3.0);
	float hashMagnitude = saturate((1.0 - length(hash)) - 0.7);


	vec3 frame1 = fract(vec3(pos/resolution.xy * ratioScale,0.0) * clamp(timeAlpha, 1.0/UVSCALE, 1.0) * UVSCALE);

	vec3 frame2 = frame1 - ((vec3(0.5, 0.5, 0.0) * saturate(timeAlpha - 1.0)) +
												vec3(hash,0.0) * 1.0) + vec3(0.1, 0.1, 0.1) * noise * 0.1;

	float radius = saturate(hashMagnitude);
	vec3 frame3 = saturate( 1.0 - vec3( length(frame2) /hashMagnitude) );



	vec3 section1 = mix(frame1, frame2, saturate(floor(timeAlpha)));

	vec3 section2 = frame3;

	vec3 final = mix(section1, section2, saturate(timeAlpha - 2.0));


	vec3 col = vec3(final);

	gl_FragColor = vec4(col, 1.0 * clamp(noise, 0.2, 1.0));
}
