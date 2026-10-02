// Builds public/cloud.png: one soft, ragged cloud puff (white, detail in the
// alpha channel) for drei's <Clouds>, so the page doesn't fetch drei's default
// texture from a third-party CDN.
// Run: node scripts/build-cloud-texture.ts
import { writeFile } from "node:fs/promises";
import { PNG } from "pngjs";

const SIZE = 256;

// Seeded value noise on a lattice, smoothly interpolated.
const LATTICE = 64;
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const grid = Array.from({ length: LATTICE * LATTICE }, random);
const at = (x: number, y: number) =>
  grid[(((y % LATTICE) + LATTICE) % LATTICE) * LATTICE + (((x % LATTICE) + LATTICE) % LATTICE)];
const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
  const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bottom * fy;
}
const fbm = (x: number, y: number) => {
  let sum = 0;
  let amp = 0.5;
  for (let octave = 0; octave < 5; octave++) {
    sum += amp * noise(x, y);
    x *= 2;
    y *= 2;
    amp /= 2;
  }
  return sum;
};

const png = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const u = (x / SIZE) * 2 - 1;
    const v = (y / SIZE) * 2 - 1;
    // Noise pushes the edge in and out, so the puff isn't a clean disc.
    const n = fbm(x / 32, y / 32);
    const r = Math.hypot(u, v);
    const edge = r + (n - 0.5) * 0.7;
    const falloff = Math.min(1, Math.max(0, 1 - edge) * 2.2) ** 1.2;
    // Hard zero before the square's border, wherever the noise pushed the edge.
    const mask = smooth(Math.min(1, Math.max(0, (1 - r) / 0.3)));
    const alpha = Math.min(1, falloff * (0.35 + n * 0.8)) * mask;
    const i = (y * SIZE + x) * 4;
    png.data[i] = png.data[i + 1] = png.data[i + 2] = 255;
    png.data[i + 3] = Math.round(alpha * 255);
  }
}
await writeFile("public/cloud.png", PNG.sync.write(png));
console.log(`wrote public/cloud.png (${SIZE}x${SIZE})`);
