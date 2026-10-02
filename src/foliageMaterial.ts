import * as THREE from "three";

/** Shared clock for everything that moves; advance it once per frame. */
export const time = { value: 0 };
/** Drawing-buffer height in pixels, so particle sizes are in world units. */
export const viewportHeight = { value: 1000 };

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uViewport;
uniform float uSize;
uniform vec3 uBloomColor;
uniform float uBloomAmount;
attribute vec3 color;
attribute float aSway;
attribute float aBloom;
varying vec3 vColor;

void main() {
  vec3 p = position;
  // Gusts roll across the island as a wave; each point adds a small flutter.
  float gust = 0.55 + 0.45 * sin(dot(p.xz, vec2(0.32, 0.18)) - uTime * 1.1);
  float flutter = sin(uTime * 2.6 + p.x * 9.0 + p.z * 7.0);
  p.xz += vec2(1.0, 0.35) * (gust + 0.3 * flutter) * aSway * 0.09;

  bool blooming = aBloom >= 0.0 && aBloom < uBloomAmount * 0.75;
  vColor = blooming ? uBloomColor * (0.85 + 0.3 * aBloom) : color;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = blooming ? uSize * 1.25 : uSize;
  gl_PointSize = size * projectionMatrix[1][1] * uViewport * 0.5 / -mv.z;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.1, 1.0, d));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Soft round particles. alphaToCoverage keeps them depth-sorted correctly
 * through MSAA instead of needing a back-to-front sort of a million points.
 */
export function createFoliageMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uViewport: viewportHeight,
      uSize: { value: 0.11 },
      uBloomColor: { value: new THREE.Color() },
      uBloomAmount: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    alphaToCoverage: true,
  });
}
