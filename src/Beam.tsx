import { Html } from "@react-three/drei";
import { type ReactNode, useEffect, useMemo } from "react";
import * as THREE from "three";

const HEIGHT = 7;

const material = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: 1 } },
    vertexShader: /* glsl */ `
      varying float vY;
      void main() {
        vY = uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vY;
      void main() {
        gl_FragColor = vec4(uColor, pow(1.0 - vY, 1.6) * uStrength);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

/** A glowing column rising from a point on the map, with a label at its foot. */
export function Beam({
  x,
  z,
  color,
  strength = 1,
  radius = 0.12,
  children,
}: {
  x: number;
  z: number;
  color: string;
  strength?: number;
  radius?: number;
  children?: ReactNode;
}) {
  const mat = useMemo(() => material(color), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, HEIGHT / 2, 0]} material={mat} material-uniforms-uStrength-value={strength} renderOrder={4}>
        <cylinderGeometry args={[radius, radius * 1.6, HEIGHT, 16, 1, true]} />
      </mesh>
      {children && (
        <Html position={[0, 0.2, 0]} center className="beam-label" pointerEvents="none">
          {children}
        </Html>
      )}
    </group>
  );
}
