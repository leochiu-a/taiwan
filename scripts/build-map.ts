// Builds public/map.json from the Ministry of the Interior county data:
// the coastline and county borders as lon/lat polylines, plus one label point
// per county. Everything is clipped to the terrain bounds, so Kinmen and Matsu
// drop out.
// Run: node scripts/build-map.ts
import { readFile, writeFile } from "node:fs/promises";
import polylabel from "polylabel";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

type County = { COUNTYNAME: string };

const topo = JSON.parse(
  await readFile("node_modules/taiwan-atlas/counties-10t.json", "utf8"),
) as Topology<{ counties: GeometryCollection<County> }>;
const { bounds } = JSON.parse(await readFile("public/terrain.json", "utf8"));

const inside = ([lon, lat]: number[]) =>
  lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;
const round = ([lon, lat]: number[]) => [+lon.toFixed(4), +lat.toFixed(4)];

const lines = (filter: (a: unknown, b: unknown) => boolean) =>
  mesh(topo, topo.objects.counties, filter)
    .coordinates.filter((line) => line.every(inside))
    .map((line) => line.map(round));

// Shoelace area of a ring, for picking a county's main island.
const ringArea = (ring: number[][]) =>
  Math.abs(ring.reduce((sum, [x, y], i) => {
    const [nx, ny] = ring[(i + 1) % ring.length];
    return sum + x * ny - nx * y;
  }, 0)) / 2;

const labels = feature(topo, topo.objects.counties).features.flatMap((f) => {
  const g = f.geometry;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  const main = polygons.reduce((a, b) => (ringArea(b[0]) > ringArea(a[0]) ? b : a));
  // The pole of inaccessibility, not the centroid: New Taipei wraps around
  // Taipei, so its centroid would land inside Taipei.
  const point = polylabel(main as [number, number][][], 0.001);
  if (!inside(point)) return [];
  return [{ name: f.properties!.COUNTYNAME.replace("臺", "台"), lon: point[0], lat: point[1] }].map(
    (l) => ({ ...l, lon: +l.lon.toFixed(4), lat: +l.lat.toFixed(4) }),
  );
});

const coast = lines((a, b) => a === b);
const counties = lines((a, b) => a !== b);
await writeFile("public/map.json", JSON.stringify({ coast, counties, labels }) + "\n");
console.log(
  `wrote ${coast.length} coast lines, ${counties.length} county lines, ${labels.length} labels`,
);
