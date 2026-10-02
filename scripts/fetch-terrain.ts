// Builds public/terrain.bin (Int16 meters, row-major, north row first) and
// public/terrain.json from AWS Terrarium elevation tiles.
// Run: node scripts/fetch-terrain.ts
import { mkdir, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";

const BOUNDS = { west: 118.95, east: 122.3, south: 21.6, north: 25.45 };
// Mainland Fujian reaches into the north-west corner; Penghu lies south of 23.8°N.
const isMainland = (lon: number, lat: number) => lon < 120.05 && lat > 24.0;
const ZOOM = 10;
const HEIGHT = 540;
const TILE = 256;

const midLat = ((BOUNDS.south + BOUNDS.north) / 2) * (Math.PI / 180);
const WIDTH = Math.round(
  (HEIGHT * (BOUNDS.east - BOUNDS.west) * Math.cos(midLat)) / (BOUNDS.north - BOUNDS.south),
);

const n = 2 ** ZOOM;
const lonToX = (lon: number) => ((lon + 180) / 360) * n;
const latToY = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
};

const x0 = Math.floor(lonToX(BOUNDS.west));
const x1 = Math.floor(lonToX(BOUNDS.east));
const y0 = Math.floor(latToY(BOUNDS.north));
const y1 = Math.floor(latToY(BOUNDS.south));

const tiles = new Map<string, Float32Array>();
const jobs: Promise<void>[] = [];
for (let tx = x0; tx <= x1; tx++) {
  for (let ty = y0; ty <= y1; ty++) {
    jobs.push(
      (async () => {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tx}/${ty}.png`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        const png = PNG.sync.read(Buffer.from(await res.arrayBuffer()));
        const elev = new Float32Array(TILE * TILE);
        for (let i = 0; i < elev.length; i++) {
          const [r, g, b] = [png.data[i * 4], png.data[i * 4 + 1], png.data[i * 4 + 2]];
          elev[i] = r * 256 + g + b / 256 - 32768;
        }
        tiles.set(`${tx}/${ty}`, elev);
      })(),
    );
  }
}
await Promise.all(jobs);
console.log(`fetched ${tiles.size} tiles at z${ZOOM}`);

// Elevation at a fractional global pixel position.
const pixel = (px: number, py: number) => {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  const tile = tiles.get(`${tx}/${ty}`)!;
  return tile[(Math.floor(py) - ty * TILE) * TILE + (Math.floor(px) - tx * TILE)];
};

const sample = (lon: number, lat: number) => {
  const px = lonToX(lon) * TILE - 0.5;
  const py = latToY(lat) * TILE - 0.5;
  const fx = px - Math.floor(px);
  const fy = py - Math.floor(py);
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const top = pixel(ix, iy) * (1 - fx) + pixel(ix + 1, iy) * fx;
  const bottom = pixel(ix, iy + 1) * (1 - fx) + pixel(ix + 1, iy + 1) * fx;
  return top * (1 - fy) + bottom * fy;
};

const out = new Int16Array(WIDTH * HEIGHT);
let max = -Infinity;
for (let row = 0; row < HEIGHT; row++) {
  const lat = BOUNDS.north - ((row + 0.5) / HEIGHT) * (BOUNDS.north - BOUNDS.south);
  for (let col = 0; col < WIDTH; col++) {
    const lon = BOUNDS.west + ((col + 0.5) / WIDTH) * (BOUNDS.east - BOUNDS.west);
    const raw = Math.round(sample(lon, lat));
    const e = isMainland(lon, lat) ? Math.min(raw, -40) : raw;
    out[row * WIDTH + col] = e;
    max = Math.max(max, e);
  }
}

const kmPerCell = ((BOUNDS.north - BOUNDS.south) * 111.32) / HEIGHT;
await mkdir("public", { recursive: true });
await writeFile("public/terrain.bin", Buffer.from(out.buffer));
await writeFile(
  "public/terrain.json",
  JSON.stringify(
    { width: WIDTH, height: HEIGHT, kmPerCell, maxElevation: max, bounds: BOUNDS },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${WIDTH}x${HEIGHT} grid, ${kmPerCell.toFixed(2)} km/cell, max ${max} m`);
