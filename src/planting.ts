import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { SPECIES, type Species } from "./species";
import { type Terrain, elevationAt, gridToWorld } from "./terrain";

const TREE_SCALE = 0.9;
/** Particles sampled from each species' mesh; every tree of the species reuses them. */
const POINTS_PER_TREE = 300;
/** Trees grow in clumps of roughly this many, like stands in a real forest. */
const TREES_PER_CLUMP = 24;
const CLUMP_RADIUS = 0.45;

export type Tree = {
  species: Species;
  x: number;
  z: number;
  elevation: number;
  rotation: number;
  scale: number;
};

export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gaussian = (random: () => number) =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

/** Scatters clumps inside each species' elevation band, then trees around each clump. */
export function plantForest(t: Terrain): Map<string, Tree[]> {
  const random = mulberry32(1);
  const inBand = (s: Species, col: number, row: number) => {
    const e = elevationAt(t, col, row);
    return e >= s.minElevation && e <= s.maxElevation ? e : null;
  };
  const forest = new Map<string, Tree[]>();
  for (const s of SPECIES) {
    const clumps: [number, number][] = [];
    const wanted = Math.ceil(s.count / TREES_PER_CLUMP);
    for (let i = 0; i < wanted * 20000 && clumps.length < wanted; i++) {
      const col = random() * (t.width - 1);
      const row = random() * (t.height - 1);
      if (inBand(s, col, row) !== null) clumps.push([col, row]);
    }
    const trees: Tree[] = [];
    for (let i = 0; i < s.count * 50 && trees.length < s.count && clumps.length; i++) {
      const [cc, cr] = clumps[Math.floor(random() * clumps.length)];
      const col = cc + (gaussian(random) * CLUMP_RADIUS) / 0.1;
      const row = cr + (gaussian(random) * CLUMP_RADIUS) / 0.1;
      const elevation = inBand(s, col, row);
      if (elevation === null) continue;
      const { x, z } = gridToWorld(t, col, row);
      trees.push({
        species: s,
        x,
        z,
        elevation,
        rotation: random() * Math.PI * 2,
        scale: TREE_SCALE * s.scale * (0.7 + random() * 0.6),
      });
    }
    forest.set(s.id, trees);
  }
  return forest;
}

type Template = {
  positions: Float32Array;
  colors: Float32Array;
  /** 0 at the base, 1 at the top: drives sway and fake shading. */
  heights: Float32Array;
  /** Random 0–1 for canopy points that can take on a bloom colour, -1 otherwise. */
  bloom: Float32Array;
};

const isBark = (c: THREE.Color) => c.r > c.g * 1.3 && c.r < 0.3;
const isLeaf = (c: THREE.Color) => c.g >= c.r && c.g >= c.b;

/**
 * Samples a tree mesh's surface into particles, pushed slightly inward so a
 * crown reads as a volume, not a shell. For species that bloom, the flower and
 * fruit blobs baked into the model are repainted leaf green: the timeline adds
 * those colours back in season.
 */
function sampleTemplate(geometry: THREE.BufferGeometry, species: Species, seed: number): Template {
  const random = mulberry32(seed);
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).setRandomGenerator(random).build();
  geometry.computeBoundingBox();
  const top = geometry.boundingBox!.max.y;
  const positions = new Float32Array(POINTS_PER_TREE * 3);
  const colors = new Float32Array(POINTS_PER_TREE * 3);
  const heights = new Float32Array(POINTS_PER_TREE);
  const bloom = new Float32Array(POINTS_PER_TREE);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const c = new THREE.Color();
  const leaves: THREE.Color[] = [];
  const blooms = species.phases.length > 0;

  for (let i = 0; i < POINTS_PER_TREE; i++) {
    sampler.sample(p, n, c);
    p.addScaledVector(n, -random() * 0.07);
    p.toArray(positions, i * 3);
    heights[i] = Math.max(p.y, 0) / top;
    const bark = isBark(c);
    if (blooms && !bark && !isLeaf(c)) c.setRGB(-1, -1, -1); // repaint below
    else if (!bark) leaves.push(c.clone());
    c.toArray(colors, i * 3);
    bloom[i] = blooms && !bark && heights[i] > 0.35 ? random() : -1;
  }

  for (let i = 0; i < POINTS_PER_TREE; i++) {
    if (colors[i * 3] < 0) leaves[Math.floor(random() * leaves.length)].toArray(colors, i * 3);
    // Darker inside and underneath, a little variation everywhere.
    const shade = (0.45 + 0.55 * heights[i]) * (0.8 + random() * 0.4);
    for (let k = 0; k < 3; k++) colors[i * 3 + k] *= shade;
  }
  return { positions, colors, heights, bloom };
}

/** One particle cloud for all trees of a species, positions baked to world space. */
export function buildSpeciesGeometry(geometry: THREE.BufferGeometry, species: Species, trees: Tree[], seed: number) {
  const tpl = sampleTemplate(geometry, species, seed);
  const count = trees.length * POINTS_PER_TREE;
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const sway = new Float32Array(count);
  const bloom = new Float32Array(count);
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();
  trees.forEach((tree, t) => {
    m.makeRotationY(tree.rotation).scale(v.setScalar(tree.scale)).setPosition(tree.x, 0, tree.z);
    for (let i = 0; i < POINTS_PER_TREE; i++) {
      const o = t * POINTS_PER_TREE + i;
      v.fromArray(tpl.positions, i * 3).applyMatrix4(m).toArray(position, o * 3);
      color.set(tpl.colors.subarray(i * 3, i * 3 + 3), o * 3);
      sway[o] = tpl.heights[i] * tpl.heights[i] * tree.scale;
      bloom[o] = tpl.bloom[i];
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(position, 3));
  out.setAttribute("color", new THREE.BufferAttribute(color, 3));
  out.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
  out.setAttribute("aBloom", new THREE.BufferAttribute(bloom, 1));
  return out;
}
