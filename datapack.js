// ============================================================
// datapack.js — 外部数据包（运行时覆盖，改数据不必重编译）
// ------------------------------------------------------------
// 启动时尝试加载同目录下的 data.pack.json（或 window.__TANK_DATA_PACK__ 指定的路径），
// 按「名称/键」**增量覆盖**内置数据（data.js）。
// - 加载失败（例如 file:// 双击、无该文件）→ 静默回退到内置数据，游戏照常运行。
// - 只覆盖 data.pack.json 里出现的条目，未提及的保持内置值。
// - 支持覆盖：坦克 / 科技树 / 地图模板 / 地形 / 战术 / 指挥官 / 精英坦克 / 精英价格 / 版本号。
// ============================================================

const DATA_PACK_URL =
  (typeof window !== 'undefined' && window.__TANK_DATA_PACK__) || 'data.pack.json';

async function loadDataPack() {
  try {
    const res = await fetch(DATA_PACK_URL, { cache: 'no-store' });
    if (!res.ok) return { ok: false, reason: 'http ' + res.status };
    const pack = await res.json();
    applyDataPack(pack);
    return { ok: true, pack };
  } catch (e) {
    // file:// 下 fetch 会被 CORS 拦截，属预期；直接回退内置数据。
    return { ok: false, reason: String((e && e.message) || e) };
  }
}

// 按 n / id / key 增量覆盖；数组类按主键匹配，匹配到则替换，未匹配则追加。
function applyDataPack(pack) {
  if (!pack || typeof pack !== 'object') return;

  if (Array.isArray(pack.tanks)) {
    for (const t of pack.tanks) {
      if (!t || !t.n) continue;
      const i = RAW.findIndex(x => x.n === t.n);
      if (i >= 0) RAW[i] = t; else RAW.push(t);
      TANKS[t.n] = t;
    }
  }

  if (pack.trees) for (const n of Object.keys(pack.trees)) TREES[n] = pack.trees[n];

  if (pack.mapTemplates) for (const k of Object.keys(pack.mapTemplates)) MAP_TEMPLATES[k] = pack.mapTemplates[k];

  if (pack.terrain) for (const k of Object.keys(pack.terrain)) TERRAIN_INFO[k] = pack.terrain[k];

  if (Array.isArray(pack.tacticals)) {
    for (const t of pack.tacticals) {
      if (!t || !t.id) continue;
      const i = TACTICALS.findIndex(x => x.id === t.id);
      if (i >= 0) TACTICALS[i] = t; else TACTICALS.push(t);
    }
  }

  if (Array.isArray(pack.commanders)) {
    for (const c of pack.commanders) {
      if (!c || !c.id) continue;
      const i = COMMANDERS.findIndex(x => x.id === c.id);
      if (i >= 0) COMMANDERS[i] = c; else COMMANDERS.push(c);
    }
  }

  if (pack.eliteTanks) for (const k of Object.keys(pack.eliteTanks)) ELITE_TANKS[k] = pack.eliteTanks[k];
  if (pack.elitePrices) for (const k of Object.keys(pack.elitePrices)) ELITE_PRICES[k] = pack.elitePrices[k];

  if (typeof pack.version === 'string' && typeof window !== 'undefined') {
    window.__TANK_VERSION__ = pack.version;
  }
}
