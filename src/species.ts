/** One colour change across the year: flowers, fruit or new leaves. Months are 1–12. */
export type Phase = {
  label: string;
  color: string;
  start: number;
  peak: number;
  end: number;
};

export type Kind = "tree" | "flower";

export const KINDS: { kind: Kind; label: string }[] = [
  { kind: "tree", label: "樹" },
  { kind: "flower", label: "花" },
];

export type Species = {
  /** Mesh name in public/trees.glb */
  id: string;
  name: string;
  latin: string;
  endemic: boolean;
  kind: Kind;
  /** Elevation band it is planted in, metres */
  minElevation: number;
  maxElevation: number;
  count: number;
  scale: number;
  note: string;
  phases: Phase[];
};

export const SPECIES: Species[] = [
  {
    id: "pandanus",
    name: "林投",
    latin: "Pandanus odorifer",
    endemic: false,
    kind: "tree",
    minElevation: 1,
    maxElevation: 40,
    count: 250,
    scale: 1,
    note: "海岸防風林的主角，葉緣帶刺，果實長得像鳳梨。",
    phases: [],
  },
  {
    id: "areca",
    name: "檳榔",
    latin: "Areca catechu",
    endemic: false,
    kind: "tree",
    minElevation: 40,
    maxElevation: 700,
    count: 250,
    scale: 0.9,
    note: "西部淺山丘陵最常見的栽培作物，細長樹幹一眼就認得。",
    phases: [],
  },
  {
    id: "goldenrain",
    name: "台灣欒樹",
    latin: "Koelreuteria elegans subsp. formosana",
    endemic: true,
    kind: "tree",
    minElevation: 10,
    maxElevation: 500,
    count: 350,
    scale: 1,
    note: "台灣特有亞種。秋天先開黃花、再結紅色蒴果，一棵樹上同時有好幾種顏色。",
    phases: [
      { label: "黃花", color: "#f2c230", start: 8.5, peak: 9.5, end: 10.3 },
      { label: "紅色蒴果", color: "#d9534a", start: 9.8, peak: 10.7, end: 11.8 },
    ],
  },
  {
    id: "acacia",
    name: "相思樹",
    latin: "Acacia confusa",
    endemic: false,
    kind: "tree",
    minElevation: 50,
    maxElevation: 900,
    count: 300,
    scale: 1,
    note: "低海拔山坡的造林樹種，過去燒成相思炭，四五月開滿黃色小球花。",
    phases: [{ label: "黃色小球花", color: "#e8c62a", start: 3.7, peak: 4.6, end: 5.5 }],
  },
  {
    id: "tung",
    name: "油桐",
    latin: "Vernicia fordii",
    endemic: false,
    kind: "tree",
    minElevation: 200,
    maxElevation: 900,
    count: 250,
    scale: 1,
    note: "早年為了榨桐油引進。四五月白花滿山，落花鋪滿步道，是客家桐花季的主角。",
    phases: [{ label: "白色桐花", color: "#f6f3ea", start: 3.8, peak: 4.8, end: 5.6 }],
  },
  {
    id: "cherry",
    name: "山櫻花",
    latin: "Prunus campanulata",
    endemic: false,
    kind: "tree",
    minElevation: 500,
    maxElevation: 2000,
    count: 250,
    scale: 1,
    note: "原生櫻花，早春開出下垂的緋紅色花，是台灣最常見的原生櫻。",
    phases: [{ label: "緋紅色花", color: "#e0457b", start: 1, peak: 2.2, end: 3.4 }],
  },
  {
    id: "red_cypress",
    name: "紅檜",
    latin: "Chamaecyparis formosensis",
    endemic: true,
    kind: "tree",
    minElevation: 1500,
    maxElevation: 2500,
    count: 225,
    scale: 1.1,
    note: "台灣特有種，阿里山神木和拉拉山神木都是紅檜，樹齡可達兩千年以上。",
    phases: [],
  },
  {
    id: "taiwania",
    name: "台灣杉",
    latin: "Taiwania cryptomerioides",
    endemic: false,
    kind: "tree",
    minElevation: 1800,
    maxElevation: 2600,
    count: 150,
    scale: 1,
    note: "以台灣命名的屬，是台灣最高的樹種，可長到八十公尺以上。",
    phases: [],
  },
  {
    id: "fir",
    name: "台灣冷杉",
    latin: "Abies kawakamii",
    endemic: true,
    kind: "tree",
    minElevation: 2800,
    maxElevation: 3500,
    count: 130,
    scale: 1,
    note: "台灣特有種，構成高山上大片的冷杉純林，是台灣分布最高的森林。",
    phases: [],
  },
  {
    id: "juniper",
    name: "玉山圓柏",
    latin: "Juniperus morrisonicola",
    endemic: true,
    kind: "tree",
    minElevation: 3200,
    maxElevation: 4000,
    count: 40,
    scale: 1.2,
    note: "台灣分布海拔最高的樹。森林界線以上受強風吹襲，長成匍匐扭曲的灌木狀。",
    phases: [],
  },
  {
    id: "rhododendron",
    name: "玉山杜鵑",
    latin: "Rhododendron pseudochrysanthum",
    endemic: true,
    kind: "flower",
    minElevation: 2900,
    maxElevation: 4000,
    count: 80,
    scale: 1.3,
    note: "台灣特有種，五六月在高山箭竹草原上開出粉白色的花。",
    phases: [{ label: "粉白色花", color: "#f7c9d8", start: 4.3, peak: 5.6, end: 6.6 }],
  },
  {
    id: "hinoki",
    name: "台灣扁柏",
    latin: "Chamaecyparis obtusa var. formosana",
    endemic: true,
    kind: "tree",
    minElevation: 1500,
    maxElevation: 2500,
    count: 180,
    scale: 1.1,
    note: "台灣特有變種，和紅檜合稱「檜木」。長在雲霧帶，棲蘭和馬告一帶是扁柏林最集中的地方。",
    phases: [],
  },
  {
    id: "hemlock",
    name: "台灣鐵杉",
    latin: "Tsuga chinensis var. formosana",
    endemic: true,
    kind: "tree",
    minElevation: 2500,
    maxElevation: 3000,
    count: 140,
    scale: 1.1,
    note: "台灣特有變種，接在檜木林之上、冷杉林之下，樹冠層層平展，頂部像一把撐開的傘。",
    phases: [],
  },
  {
    id: "pine",
    name: "台灣二葉松",
    latin: "Pinus taiwanensis",
    endemic: true,
    kind: "tree",
    minElevation: 700,
    maxElevation: 3500,
    count: 200,
    scale: 1,
    note: "台灣特有種，針葉兩針一束。耐旱耐火，常是崩塌地和火燒跡地上最先長回來的樹。",
    phases: [],
  },
  {
    id: "incense_cedar",
    name: "台灣肖楠",
    latin: "Calocedrus formosana",
    endemic: true,
    kind: "tree",
    minElevation: 300,
    maxElevation: 1900,
    count: 140,
    scale: 1,
    note: "台灣特有種，分布在北部和中部山地，是針葉樹一級木「五木」之一，木材帶香氣。",
    phases: [],
  },
  {
    id: "maple",
    name: "台灣紅榨槭",
    latin: "Acer morrisonense",
    endemic: true,
    kind: "tree",
    minElevation: 1600,
    maxElevation: 2600,
    count: 160,
    scale: 1,
    note: "台灣特有種，枝條和葉柄帶紅色。秋冬葉子轉成橘紅，是中海拔山區的秋色主角。",
    phases: [{ label: "橘紅秋葉", color: "#d0582c", start: 10.2, peak: 11.5, end: 12.95 }],
  },
  {
    id: "hibiscus",
    name: "山芙蓉",
    latin: "Hibiscus taiwanensis",
    endemic: true,
    kind: "flower",
    minElevation: 30,
    maxElevation: 1800,
    count: 140,
    scale: 1.3,
    note: "台灣特有種，低中海拔的灌木。秋天開大朵花，早上白色、傍晚轉成粉紅。",
    phases: [{ label: "粉白色花", color: "#f4d3e0", start: 8.6, peak: 10, end: 11.5 }],
  },
  {
    id: "lily",
    name: "台灣百合",
    latin: "Lilium formosanum",
    endemic: true,
    kind: "flower",
    minElevation: 1,
    maxElevation: 3500,
    count: 220,
    scale: 1.5,
    note: "台灣特有種，從海岸到三千多公尺的草坡都有。春末到夏天開出帶香氣的白色喇叭花。",
    phases: [{ label: "白色喇叭花", color: "#f8f6ee", start: 4.3, peak: 6, end: 8.3 }],
  },
  {
    id: "orchid",
    name: "台灣一葉蘭",
    latin: "Pleione formosana",
    endemic: true,
    kind: "flower",
    minElevation: 1500,
    maxElevation: 2500,
    count: 70,
    scale: 2.2,
    note: "台灣特有的蘭花，長在中海拔潮濕的岩壁和樹幹上，一顆假球莖只長一片大葉。",
    phases: [{ label: "粉紫色花", color: "#e19ad0", start: 2.3, peak: 3.5, end: 4.6 }],
  },
  {
    id: "hypericum",
    name: "玉山金絲桃",
    latin: "Hypericum nagasawae",
    endemic: true,
    kind: "flower",
    minElevation: 2500,
    maxElevation: 3500,
    count: 80,
    scale: 2,
    note: "台灣特有種，高山上的矮灌叢，開金黃色的花。",
    phases: [{ label: "金黃色花", color: "#f2c230", start: 5.8, peak: 7, end: 8.5 }],
  },
];

/** null shows everything; otherwise one kind or one species. */
export type Filter = { kind: Kind } | { species: string } | null;

export const isShown = (filter: Filter, s: Species) =>
  filter === null || ("kind" in filter ? filter.kind === s.kind : filter.species === s.id);

/** How far into a phase `month` is: 0 outside it, 1 at its peak. */
function phaseAmount(p: Phase, month: number) {
  if (month <= p.start || month >= p.end) return 0;
  const x =
    month < p.peak ? (month - p.start) / (p.peak - p.start) : (p.end - month) / (p.end - p.peak);
  return x * x * (3 - 2 * x);
}

/** The dominant phase at `month` and how strongly it shows. */
export function bloomAt(s: Species, month: number) {
  let best: { phase: Phase; amount: number } | null = null;
  for (const phase of s.phases) {
    const amount = phaseAmount(phase, month);
    if (amount > 0 && (!best || amount > best.amount)) best = { phase, amount };
  }
  return best;
}

/** A place worth pointing at while a species is in bloom. */
export type Hotspot = {
  speciesId: string;
  place: string;
  lon: number;
  lat: number;
  caption: string;
};

export const HOTSPOTS: Hotspot[] = [
  {
    speciesId: "cherry",
    place: "武陵農場",
    lon: 121.31,
    lat: 24.36,
    caption: "中部山區的山櫻花開到最盛",
  },
  {
    speciesId: "tung",
    place: "苗栗",
    lon: 120.82,
    lat: 24.56,
    caption: "客家庄的油桐花像下雪一樣落滿山徑",
  },
  {
    speciesId: "rhododendron",
    place: "合歡山",
    lon: 121.27,
    lat: 24.14,
    caption: "玉山杜鵑在三千公尺的箭竹草原上綻放",
  },
  {
    speciesId: "orchid",
    place: "阿里山",
    lon: 120.8,
    lat: 23.51,
    caption: "台灣一葉蘭在潮濕的岩壁上開花",
  },
  {
    speciesId: "goldenrain",
    place: "台北",
    lon: 121.53,
    lat: 25.04,
    caption: "街頭的台灣欒樹由黃轉紅",
  },
];
