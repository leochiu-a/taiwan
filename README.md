# 台灣花季地圖

台灣的 3D 植物地圖。20 種植物照真實的海拔分布長在島上，拖一年的時間軸，看各地什麼時候開花、轉紅。

```bash
pnpm install
pnpm dev
```

## 資料

`public/` 裡的檔案都由腳本產生，改了腳本要重跑：

| 檔案 | 來源 | 重新產生 |
|---|---|---|
| `terrain.bin`、`terrain.json` | AWS Terrarium 高程圖磚 | `node scripts/fetch-terrain.ts` |
| `map.json` | `taiwan-atlas`（內政部縣市界） | `node scripts/build-map.ts` |
| `trees.glb` | Blender 程式化建模 | `blender --background --factory-startup --python blender/trees.py` |
| `cloud.png` | 分形雜訊程式產生 | `node scripts/build-cloud-texture.ts` |

`map.json` 依 `terrain.json` 的範圍裁切，所以改了地形範圍要先跑 `fetch-terrain` 再跑 `build-map`。

地圖畫成平面。高程只用來決定每種植物種在哪個海拔帶。物種、花期和賞花地點在 `src/species.ts`。
