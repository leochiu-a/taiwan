import { Html, Line, MapControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Suspense } from "react";
import { Beam } from "./Beam";
import { Forest } from "./Forest";
import type { Tree } from "./planting";
import { type Filter, HOTSPOTS, SPECIES, bloomAt, isShown } from "./species";
import { type Terrain, lonLatToWorld } from "./terrain";
import { Weather } from "./Weather";

/** public/map.json: lon/lat polylines and one label point per county. */
export type MapLines = {
  coast: number[][][];
  counties: number[][][];
  labels: { name: string; lon: number; lat: number }[];
};

const PICK_RADIUS = 0.5;

/** Module-level so re-renders don't hand the controls a new target and snap the view back. */
const START_TARGET: [number, number, number] = [0, 0, 2];

function BorderLines({ terrain, borders }: { terrain: Terrain; borders: MapLines }) {
  const toPoints = (line: number[][]) =>
    line.map(([lon, lat]) => {
      const { x, z } = lonLatToWorld(terrain, lon, lat);
      return [x, 0, z] as [number, number, number];
    });
  return (
    <>
      {borders.coast.map((line, i) => (
        <Line key={`c${i}`} points={toPoints(line)} color="#7f949c" lineWidth={1} transparent opacity={0.55} />
      ))}
      {borders.counties.map((line, i) => (
        <Line key={`k${i}`} points={toPoints(line)} color="#7f949c" lineWidth={1} transparent opacity={0.2} />
      ))}
    </>
  );
}

function CountyLabels({ terrain, labels }: { terrain: Terrain; labels: MapLines["labels"] }) {
  return labels.map((l) => {
    const { x, z } = lonLatToWorld(terrain, l.lon, l.lat);
    return (
      <Html key={l.name} position={[x, 0.05, z]} center className="county-label" pointerEvents="none">
        {l.name}
      </Html>
    );
  });
}

function Hotspots({ terrain, month }: { terrain: Terrain; month: number }) {
  return HOTSPOTS.map((h) => {
    const species = SPECIES.find((s) => s.id === h.speciesId)!;
    const bloom = bloomAt(species, month);
    if (!bloom || bloom.amount < 0.3) return null;
    const { x, z } = lonLatToWorld(terrain, h.lon, h.lat);
    return (
      <Beam key={h.place} x={x} z={z} color={bloom.phase.color} strength={bloom.amount}>
        <span style={{ opacity: bloom.amount }}>{h.place}</span>
      </Beam>
    );
  });
}

export function Scene({
  terrain,
  borders,
  forest,
  month,
  filter,
  picked,
  onPick,
}: {
  terrain: Terrain;
  borders: MapLines;
  forest: Map<string, Tree[]>;
  month: number;
  filter: Filter;
  picked: Tree | null;
  onPick: (tree: Tree | null) => void;
}) {
  // Particles are too many to raycast; pick the nearest visible tree to where the ground was hit.
  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // a drag, not a click
    let best: Tree | null = null;
    let bestDistance = PICK_RADIUS;
    for (const trees of forest.values()) {
      for (const t of trees) {
        if (!isShown(filter, t.species)) break;
        const d = Math.hypot(t.x - e.point.x, t.z - e.point.z);
        if (d < bestDistance) [best, bestDistance] = [t, d];
      }
    }
    onPick(best);
  };

  return (
    <Canvas camera={{ position: [4, 30, 30], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={["#050607"]} />
      <fog attach="fog" args={["#050607", 40, 90]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={pick}>
        <planeGeometry args={[terrain.width * 0.1, terrain.height * 0.1]} />
        {/* Only there to be clicked: drawing it would show its edge against the background. */}
        <meshBasicMaterial visible={false} />
      </mesh>
      <BorderLines terrain={terrain} borders={borders} />
      <CountyLabels terrain={terrain} labels={borders.labels} />
      <Suspense fallback={null}>
        <Forest forest={forest} month={month} filter={filter} />
      </Suspense>
      <Weather terrain={terrain} month={month} />
      <Hotspots terrain={terrain} month={month} />
      {picked && <Beam x={picked.x} z={picked.z} color="#ffffff" strength={0.7} radius={0.06} />}
      <MapControls
        makeDefault
        target={START_TARGET}
        maxPolarAngle={Math.PI * 0.48}
        minDistance={3}
        maxDistance={70}
        zoomToCursor
        enableDamping
      />
    </Canvas>
  );
}
