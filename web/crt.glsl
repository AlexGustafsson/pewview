uniform sampler2D mapTexture;
uniform sampler2D noiseTexture;
uniform float time;

varying vec2 vUv;
varying vec3 vPosition;

float noiseScale = 4.0;
float wobbleSpeed = 5.0;
float wobbleScale = 0.0005;
float rgbShift = 0.002;
float lineSize = 400.0;
float overlayAlpha = 0.6;
float baseAlpha = 0.5;

void main() {
  // Noise
  vec4 noise = texture(noiseTexture, fract(vec2(vUv.x * noiseScale, vUv.y * noiseScale)));

  // Wobble
  float wobbleX = noise.x * sin(time * wobbleSpeed) * wobbleScale;
  float wobbleY = noise.x * cos(time * wobbleSpeed) * wobbleScale;

  // Base
  vec4 base = texture(mapTexture, vUv);

  // Shift each channel
  vec4 img = texture(mapTexture, vec2(vUv.x - rgbShift + noise.x * 0.01+wobbleX,vUv.y+wobbleY));
  vec4 img2 = texture(mapTexture, vec2(vUv.x + 0. + noise.x * 0.01+wobbleX,vUv.y+wobbleY));
  vec4 img3 = texture(mapTexture, vec2(vUv.x + rgbShift + noise.x * 0.01+wobbleX, vUv.y+wobbleY));

  float brightness = 1.5;
  float lines = abs(sin(lineSize*vUv.y + time)) * brightness;
  float lines2 = abs(cos(lineSize*vUv.y + time)) * brightness;

  img.xyz *= vec3(1.,0.,0.); // red
  img2.xyz *= vec3(0.,1.,0.); // green
  img3.xyz *= vec3(0.,0.,1.); // blue
  vec3 col = img.xyz+img2.xyz+img3.xyz;
  if (vUv.x <= 0.0f || 1.0 <= vUv.x || vUv.y <= 0.0 || 1.0 <= vUv.y){
    col = vec3(0.);
  }

  vec3 line = lines * vec3(1.0, 1.0, 1.0) * 0.4 + lines2 * noise.xyz;

    // gl_FragColor = vec4(col + line, 0.4);
    gl_FragColor = vec4(base.xyz, baseAlpha) + vec4(col + line * col, 0.0) * overlayAlpha;
}
