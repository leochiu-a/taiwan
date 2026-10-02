import { useMemo } from "react";
import * as THREE from "three";
import { time, viewportHeight } from "./foliageMaterial";
import { mulberry32 } from "./planting";
import { type Terrain, elevationAt, gridToWorld } from "./terrain";
import { rainAt } from "./rain";

const MIST_PATCHES = 260;
const RAIN_STREAKS = 7000;
const RAIN_TOP = 9;

/** Slow-drifting soft sprites that hang over the mountains. */
function Mist({ terrain }: { terrain: Terrain }) {
  const [geometry, material] = useMemo(() => {
    const random = mulberry32(101);
    const positions: number[] = [];
    const seeds: number[] = [];
    for (let i = 0; positions.length < MIST_PATCHES * 3 && i < 200000; i++) {
      const col = random() * terrain.width;
      const row = random() * terrain.height;
      if (elevationAt(terrain, col, row) < 1000) continue;
      const { x, z } = gridToWorld(terrain, col, row);
      positions.push(x, 0.6 + random() * 1.6, z);
      seeds.push(random());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uViewport: viewportHeight },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uViewport;
        attribute float aSeed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.05 + aSeed * 30.0) * 1.2;
          p.z += cos(uTime * 0.04 + aSeed * 20.0) * 0.6;
          vAlpha = 0.5 + 0.5 * sin(uTime * 0.2 + aSeed * 12.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.5 + aSeed * 3.5) * projectionMatrix[1][1] * uViewport * 0.5 / -mv.z;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.0, 1.0, d)) * 0.035 * vAlpha;
          gl_FragColor = vec4(vec3(0.8, 0.84, 0.88), a);
        }`,
      transparent: true,
      depthWrite: false,
    });
    return [g, m];
  }, [terrain]);
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}

/** Slanted streaks falling over the whole map, faded in by the month's rain. */
function Rain({ month, width, depth }: { month: number; width: number; depth: number }) {
  const [geometry, material] = useMemo(() => {
    const random = mulberry32(202);
    const offsets = new Float32Array(RAIN_STREAKS * 2 * 3);
    const ends = new Float32Array(RAIN_STREAKS * 2);
    for (let i = 0; i < RAIN_STREAKS; i++) {
      const x = (random() - 0.5) * width;
      const z = (random() - 0.5) * depth;
      const phase = random() * RAIN_TOP;
      for (let k = 0; k < 2; k++) {
        offsets.set([x, phase, z], (i * 2 + k) * 3);
        ends[i * 2 + k] = k;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(offsets, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uRain: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aEnd;
        varying float vEnd;
        void main() {
          float y = ${RAIN_TOP.toFixed(1)} - mod(position.y + uTime * 7.0, ${RAIN_TOP.toFixed(1)});
          vec3 p = vec3(position.x + y * 0.25, y, position.z);
          p += vec3(-0.25, -1.0, 0.0) * aEnd * 0.45;
          vEnd = aEnd;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uRain;
        varying float vEnd;
        void main() {
          gl_FragColor = vec4(vec3(0.75, 0.82, 0.9), (0.08 + 0.22 * vEnd) * uRain);
        }`,
      transparent: true,
      depthWrite: false,
    });
    return [g, m];
  }, [width, depth]);
  const rain = rainAt(month);
  return (
    <lineSegments
      geometry={geometry}
      material={material}
      material-uniforms-uRain-value={rain}
      visible={rain > 0.02}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}

export function Weather({ terrain, month }: { terrain: Terrain; month: number }) {
  return (
    <>
      <Mist terrain={terrain} />
      <Rain month={month} width={terrain.width * 0.1} depth={terrain.height * 0.1} />
    </>
  );
}
