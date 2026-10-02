export type Bounds = { west: number; east: number; south: number; north: number };

export type TerrainMeta = {
  width: number;
  height: number;
  kmPerCell: number;
  maxElevation: number;
  bounds: Bounds;
};

/** Elevation grid. The map is drawn flat; elevation only decides where each species grows. */
export type Terrain = TerrainMeta & {
  elevation: Int16Array;
};

/** World units per grid cell. */
export const CELL = 0.1;

export async function loadTerrain(): Promise<Terrain> {
  const [meta, buffer] = await Promise.all([
    fetch("/terrain.json").then((r) => r.json() as Promise<TerrainMeta>),
    fetch("/terrain.bin").then((r) => r.arrayBuffer()),
  ]);
  return { ...meta, elevation: new Int16Array(buffer) };
}

/** World x/z of a fractional grid position. Row 0 is the north edge. */
export function gridToWorld(t: TerrainMeta, col: number, row: number) {
  return {
    x: (col - (t.width - 1) / 2) * CELL,
    z: (row - (t.height - 1) / 2) * CELL,
  };
}

export function lonLatToWorld(t: TerrainMeta, lon: number, lat: number) {
  const { west, east, south, north } = t.bounds;
  return gridToWorld(
    t,
    ((lon - west) / (east - west)) * t.width - 0.5,
    ((north - lat) / (north - south)) * t.height - 0.5,
  );
}

/** Bilinear elevation in metres at a fractional grid position. */
export function elevationAt(t: Terrain, col: number, row: number) {
  const c = Math.min(Math.max(col, 0), t.width - 1.001);
  const r = Math.min(Math.max(row, 0), t.height - 1.001);
  const c0 = Math.floor(c);
  const r0 = Math.floor(r);
  const fc = c - c0;
  const fr = r - r0;
  const e = (cc: number, rr: number) => t.elevation[rr * t.width + cc];
  const top = e(c0, r0) * (1 - fc) + e(c0 + 1, r0) * fc;
  const bottom = e(c0, r0 + 1) * (1 - fc) + e(c0 + 1, r0 + 1) * fc;
  return top * (1 - fr) + bottom * fr;
}
