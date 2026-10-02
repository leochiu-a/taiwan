import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { type Tree, plantForest } from "./planting";
import { rainCaption } from "./rain";
import { type MapLines, Scene } from "./Scene";
import { type Filter, HOTSPOTS, KINDS, SPECIES, bloomAt, isShown } from "./species";
import { type Terrain, loadTerrain } from "./terrain";

const MONTH_MAX = 12.99;

/** Seconds of autoplay per month. */
const SECONDS_PER_MONTH = 2.5;

type MapData = { terrain: Terrain; borders: MapLines };

function caption(month: number) {
  let best: { text: string; amount: number } | null = null;
  for (const h of HOTSPOTS) {
    const bloom = bloomAt(SPECIES.find((s) => s.id === h.speciesId)!, month);
    if (bloom && bloom.amount > 0.3 && (!best || bloom.amount > best.amount))
      best = { text: `${h.place}：${h.caption}`, amount: bloom.amount };
  }
  return best?.text ?? rainCaption(month) ?? "常綠的檜木和冷杉，一整年守著中央山脈";
}

const monthLabel = (month: number) => {
  const m = Math.floor(month);
  const day = Math.min(30, Math.floor((month - m) * 30) + 1);
  return `${m} 月 ${day} 日`;
};

export default function App() {
  const [data, setData] = useState<MapData | null>(null);
  const [month, setMonth] = useState(2.2);
  const [playing, setPlaying] = useState(false);
  const [filter, setFilter] = useState<Filter>(null);
  const [picked, setPicked] = useState<Tree | null>(null);

  useEffect(() => {
    Promise.all([loadTerrain(), fetch("/map.json").then((r) => r.json() as Promise<MapLines>)]).then(
      ([terrain, borders]) => setData({ terrain, borders }),
    );
  }, []);

  const forest = useMemo(() => (data ? plantForest(data.terrain) : null), [data]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setMonth((m) => {
        const next = m + dt / SECONDS_PER_MONTH;
        return next >= 13 ? next - 12 : next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const visibleCount = forest
    ? SPECIES.reduce((n, s) => n + (isShown(filter, s) ? forest.get(s.id)!.length : 0), 0)
    : 0;

  return (
    <main>
      {data && forest ? (
        <Scene
          terrain={data.terrain}
          borders={data.borders}
          forest={forest}
          month={month}
          filter={filter}
          picked={picked}
          onPick={setPicked}
        />
      ) : (
        <p className="loading">載入中…</p>
      )}

      <header className="card title">
        <h1>
          台灣的花季
          <br />
          開到你那裡了嗎
        </h1>
      </header>


      <footer className="bottom">
        <p className="caption">{caption(month)}</p>
        <nav className="card controls">
          <div className="chips">
            <button
              type="button"
              className={filter === null ? "on" : undefined}
              onClick={() => setFilter(null)}
            >
              全部
            </button>
          </div>
          {KINDS.map(({ kind, label }) => {
            const kindOn = filter !== null && "kind" in filter && filter.kind === kind;
            return (
              <div className="chips" key={kind}>
                <button
                  type="button"
                  className={kindOn ? "group on" : "group"}
                  onClick={() => setFilter(kindOn ? null : { kind })}
                >
                  {label}
                </button>
                {SPECIES.filter((s) => s.kind === kind).map((s) => {
                  const on = filter !== null && "species" in filter && filter.species === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={on ? "on" : undefined}
                      onClick={() => setFilter(on ? null : { species: s.id })}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="row">
            <span className="stat">拖曳移動 · Shift＋拖曳或右鍵旋轉 · 滾輪縮放</span>
            <span className="stat">{visibleCount.toLocaleString()} 株</span>
          </div>
        </nav>
      </footer>

      <section className="timebar">
        <button type="button" className="play" onClick={() => setPlaying(!playing)} aria-label={playing ? "暫停" : "播放一整年"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <output>{monthLabel(month)}</output>
        <div className="track">
          <input
            type="range"
            min={1}
            max={MONTH_MAX}
            step={0.01}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            aria-label="月份"
            style={{ "--progress": `${((month - 1) / (MONTH_MAX - 1)) * 100}%` } as CSSProperties}
          />
          <ol className="ticks" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i} style={{ left: `${(i / (MONTH_MAX - 1)) * 100}%` }}>
                {i + 1} 月
              </li>
            ))}
          </ol>
        </div>
      </section>

      {picked && (
        <article className="card info">
          <button type="button" className="close" onClick={() => setPicked(null)} aria-label="關閉">
            ×
          </button>
          <h2>
            {picked.species.name}
            {picked.species.endemic && <span className="badge">特有</span>}
          </h2>
          <p className="latin">{picked.species.latin}</p>
          <p>{picked.species.note}</p>
          <p className="meta">
            海拔約 {Math.round(picked.elevation)} m
            {bloomAt(picked.species, month) && ` · 正值${bloomAt(picked.species, month)!.phase.label}`}
          </p>
        </article>
      )}
    </main>
  );
}
