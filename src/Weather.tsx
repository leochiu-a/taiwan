import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { time } from "./foliageMaterial";
import { mulberry32 } from "./planting";
import { type Terrain, elevationAt, gridToWorld } from "./terrain";
import { rainAt } from "./rain";

const CLOUD_BANKS = 8;
const CLOUD_SPACING = 7;
const RAIN_STREAKS = 7000;
const RAIN_TOP = 9;

/**
 * Banks of cloud over the mountains, built from many textured puffs. They sit
 * above the treetops, drift slowly, and thicken and grey in the rainy months.
 */
function MountainClouds({ terrain, month }: { terrain: Terrain; month: number }) {
  const banks = useMemo(() => {
    const random = mulberry32(101);
    const placed: { x: number; z: number; seed: number }[] = [];
    for (let i = 0; placed.length < CLOUD_BANKS && i < 200000; i++) {
      const col = random() * terrain.width;
      const row = random() * terrain.height;
      if (elevationAt(terrain, col, row) < 1500) continue;
      const { x, z } = gridToWorld(terrain, col, row);
      if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < CLOUD_SPACING)) continue;
      placed.push({ x, z, seed: Math.floor(random() * 1000) });
    }
    return placed;
  }, [terrain]);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return; // still suspended on the texture
    group.current.position.x = Math.sin(time.value * 0.03) * 1.5;
    group.current.position.z = Math.cos(time.value * 0.02) * 0.8;
  });
  const rain = rainAt(month);
  return (
    <>
      {/* Only the clouds use a lit material; everything else is unlit. */}
      <hemisphereLight args={["#ffffff", "#2a3640", 1.5]} />
      <directionalLight position={[-10, 20, 5]} intensity={1.3} />
      <Suspense fallback={null}>
        <Clouds ref={group} texture="/cloud.png" limit={CLOUD_BANKS * 18} material={THREE.MeshLambertMaterial}>
          {banks.map((b) => (
            <Cloud
              key={b.seed}
              seed={b.seed}
              position={[b.x, 2.6, b.z]}
              bounds={[2.4, 0.4, 1.6]}
              segments={18}
              volume={1.3}
              smallestVolume={0.6}
              growth={2}
              speed={0.06}
              concentrate="inside"
              opacity={0.5 + 0.35 * rain}
              color={rain > 0.5 ? "#aeb8bf" : "#ffffff"}
            />
          ))}
        </Clouds>
      </Suspense>
    </>
  );
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
      <MountainClouds terrain={terrain} month={month} />
      <Rain month={month} width={terrain.width * 0.1} depth={terrain.height * 0.1} />
    </>
  );
}
