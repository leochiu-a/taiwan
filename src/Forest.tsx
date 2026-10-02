import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createFoliageMaterial, time, viewportHeight } from "./foliageMaterial";
import { type Tree, buildSpeciesGeometry } from "./planting";
import { type Filter, SPECIES, type Species, bloomAt, isShown } from "./species";

function SpeciesCloud({
  species,
  trees,
  mesh,
  seed,
  month,
  visible,
}: {
  species: Species;
  trees: Tree[];
  mesh: THREE.BufferGeometry;
  seed: number;
  month: number;
  visible: boolean;
}) {
  const geometry = useMemo(
    () => buildSpeciesGeometry(mesh, species, trees, seed),
    [mesh, species, trees, seed],
  );
  const material = useMemo(() => createFoliageMaterial(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const bloom = bloomAt(species, month);

  return (
    <points
      geometry={geometry}
      material={material}
      material-uniforms-uBloomAmount-value={bloom?.amount ?? 0}
      material-uniforms-uBloomColor-value={bloom?.phase.color ?? "#000"}
      visible={visible}
      frustumCulled={false}
    />
  );
}

export function Forest({
  forest,
  month,
  filter,
}: {
  forest: Map<string, Tree[]>;
  month: number;
  filter: Filter;
}) {
  const { nodes } = useGLTF("/trees.glb");
  useFrame((state, delta) => {
    time.value += delta;
    viewportHeight.value = state.size.height * state.viewport.dpr;
  });
  return SPECIES.map((s, i) => (
    <SpeciesCloud
      key={s.id}
      species={s}
      trees={forest.get(s.id)!}
      mesh={(nodes[s.id] as THREE.Mesh).geometry}
      seed={i + 1}
      month={month}
      visible={isShown(filter, s)}
    />
  ));
}

useGLTF.preload("/trees.glb");
