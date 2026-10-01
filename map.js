// ============================================================
// map.js — 地区模式
// ============================================================

function newMapSave(mapId, nation){
  const info = MAP_ID_INFO[mapId] || MAP_ID_INFO.small;
  const size = MAP_SIZES[info.size];
  const cells = parseMapTemplate(mapId);
  return {
    mapId, nation: nation || '德', cols: size.cols, rows: size.rows,
    turn: 1, rp: 800, supply: 20, cells,
    playerUnits: [], aiUnits: [],
    unlockedCommanders: [], unlockedEliteTanks: [], ownedTanks: [],
    techProgress: {}, cleared: false, lost: false,
    aiReinforceCount: 0,
    aiConfig: { ...DEFAULT_AI_CONFIG },
    tacSlots: 0, tacUnlocked: [...INITIAL_TACTICALS], tacEquipped: [],
    crewPool: [],
  };
}
function getMapCur(){
  const save = MAP_SAVES[M.saveIndex];
  if(!save || !save.games) return null;
  const g = save.games[M.gameIdx];
  if(!g) return null;
  if(!g.tacUnlocked) g.tacUnlocked = [...INITIAL_TACTICALS];
  if(!g.tacEquipped) g.tacEquipped = [];
  if(typeof g.tacSlots !== 'number') g.tacSlots = 0;
  if(!g.crewPool) g.crewPool = [];
  if(g._tanksMigrated !== true){
    (g.playerUnits || []).forEach(u => { u.tanks = normalizeTankArray(u.tanks); });
    (g.aiUnits || []).forEach(u => { u.tanks = normalizeTankArray(u.tanks); });
    g._tanksMigrated = true;
    try{ persistMapSaves(); }catch(e){}
  }
  if(g._tanksUidMigrated !== true){
    const owned = g.ownedTanks || [];
    owned.forEach(t => { if(!t.uid) t.uid = makeTankUid(); });
    const usedUids = new Set();
    (g.playerUnits || []).forEach(u => {
      (u.tanks || []).forEach(t => { if(t.tankUid) usedUids.add(t.tankUid); });
    });
    (g.playerUnits || []).forEach(u => {
      (u.tanks || []).forEach(t => {
        if(t.tankUid) return;
        const cand = owned.find(o => !usedUids.has(o.uid) && o.n === t.n && (o.exp || 0) === (t.exp || 0));
        if(cand){ t.tankUid = cand.uid; usedUids.add(cand.uid); }
      });
    });
    g._tanksUidMigrated = true;
    try{ persistMapSaves(); }catch(e){}
  }
  return g;
}
function getMapCols(){ const sv = getMapCur(); return sv ? sv.cols : 7; }
function getMapRows(){ const sv = getMapCur(); return sv ? sv.rows : 5; }
function mapIdxToRC(id){ const cols = getMapCols(); return { r: Math.floor(id / cols), c: id % cols }; }
function mapRCToIdx(r, c){ return r * getMapCols() + c; }
function mapAdjacentAll(id){
  const sv = getMapCur(); if(!sv) return [];
  const cols = sv.cols, rows = sv.rows;
  const r = Math.floor(id / cols), c = id % cols;
  const res = [];
  if(r > 0) res.push(id - cols);
  if(r < rows - 1) res.push(id + cols);
  if(c > 0) res.push(id - 1);
  if(c < cols - 1) res.push(id + 1);
  return res;
}
function mapAdjacentMovable(id){
  const sv = getMapCur(); if(!sv) return [];
  return mapAdjacentAll(id).filter(nid => isCellPassable(sv.cells[nid]));
}
function getMapCellLoot(cell){
  const t = cell.type;
  if(t === 'city') return { rp: 30, supply: 0 };
  if(t === 'village') return { rp: 20, supply: 0 };
  if(t === 'supply') return { rp: 0, supply: 50 };
  if(t === 'start' || t === 'hq' || t === 'elite' || t === 'ai_spawn') return null;
  return { rp: 10, supply: 2 };
}
function pickAITankInNation(nation, lv){
  const tree = TREES[nation]; const pool = [];
  for(const name in tree) pool.push({ name, lv: tree[name].lv });
  let candidates = pool.filter(t => Math.abs(t.lv - lv) <= 0.5);
  if(candidates.length === 0){ let minD = 999; for(const t of pool) minD = Math.min(minD, Math.abs(t.lv - lv)); candidates = pool.filter(t => Math.abs(t.lv - lv) <= minD + 0.5); }
  return candidates[Math.floor(Math.random() * candidates.length)].name;
}
function generateMapAIUnit(cellId, lv, playerNation, forceSlots){
  const pn = playerNation || (getMapCur() && getMapCur().nation) || '德';
  const otherNations = ['德','美','苏'].filter(n => n !== pn);
  const n = otherNations[Math.floor(Math.random() * otherNations.length)];
  const slots = forceSlots != null ? forceSlots : Math.max(2, Math.min(6, Math.ceil(lv / 3)));
  const team = []; const used = new Set();
  for(let i = 0; i < slots; i++){ let tries = 0, name; do { name = pickAITankInNation(n, lv); tries++; } while(used.has(name) && tries < 20); used.add(name); team.push(name); }
  return team.map(name => { const ac = tankMaxHpByName(name); return { n: name, hp: ac, maxHp: ac, exp: 0 }; });
}
function genPlayerInitialTanks(nation){
  const pools = {
    德: [['一号A','一号B'], ['一号A','一号C']],
    美: [['M1917','M1'],    ['M1917','M1']],
    苏: [['t-38','t-38T'],  ['t-38','t-38T']],
  };
  return pools[nation] || pools['德'];
}
function pickOtherNationLv1Tank(playerNation){
  const others = ['德','美','苏'].filter(n => n !== playerNation);
  const pool = [];
  for(const nat of others){ for(const name in TREES[nat]){ if(TREES[nat][name].lv === 1) pool.push(name); } }
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderMapSaveSelect(){
  let html = `<h1>🗺 地区模式 · 选择存档</h1><div class="sub">每个存档可包含多个战役</div><div class="saves">`;
  for(let i=0;i<3;i++){
    const save = MAP_SAVES[i];
    const hasGames = save && save.games && save.games.length > 0;
    if(!hasGames){
      html += `<div class="save empty" onclick="pickMapSave(${i})"><h3>存档 ${i+1}</h3><p>空 · 点击创建</p></div>`;
    } else {
      const games = save.games;
      const nations = [...new Set(games.map(g => g.nation))];
      const wonCount = games.filter(g => g.cleared).length;
      html += `<div class="save" onclick="pickMapSave(${i})">
        <span class="sell" onclick="event.stopPropagation();confirmDeleteMapSave(${i})">×</span>
        <h3>存档 ${i+1}</h3>
        <div class="row">
          <span class="tag">${games.length} 个战役</span>
          <span class="tag">${nations.join(' / ')}</span>
          ${wonCount > 0 ? `<span class="tag">✅ ${wonCount} 通关</span>` : ''}
        </div>
      </div>`;
    }
  }
  html += `</div><div class="btns" style="margin-top:auto"><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
  return html;
}
function confirmDeleteMapSave(i){
  if(!MAP_SAVES[i]) return;
  if(!confirm(`删除存档 ${i+1}（含所有战役）？`)) return;
  MAP_SAVES[i] = null;
  persistMapSaves(); render(); toast('已删除');
}
function pickMapSave(i){
  if(!MAP_SAVES[i]){
    if(!confirm('创建新地区存档？')) return;
    MAP_SAVES[i] = { games: [], lastGameIdx: 0 };
    persistMapSaves();
  } else if(!MAP_SAVES[i].games){
    const old = MAP_SAVES[i];
    if(old.needSetup || !old.mapId){
      MAP_SAVES[i] = { games: [], lastGameIdx: 0 };
    } else {
      MAP_SAVES[i] = { games: [old], lastGameIdx: 0 };
    }
    persistMapSaves();
  }
  M.saveIndex = i;
  M.screen = 'mapGamesList';
  render();
}
function renderMapGamesList(){
  const save = MAP_SAVES[M.saveIndex];
  const games = (save && save.games) || [];
  let html = `<h1>🗺 战役列表</h1>
  <div class="sub">存档 ${M.saveIndex+1} · ${games.length} 个战役</div>`;
  if(games.length === 0){
    html += `<div class="panel" style="text-align:center;padding:24px;color:#8ab88a">还没有战役<br><span style="font-size:11px">点击下方"新建战役"开始</span></div>`;
  } else {
    games.forEach((g, i) => {
      const info = MAP_ID_INFO[g.mapId] || MAP_ID_INFO.small;
      const pc = g.cells.filter(c => c.owner === 'player').length;
      const total = g.cells.length;
      const st = g.cleared ? '✅ 通关' : g.lost ? '💀 失败' : `第 ${g.turn} 回合`;
      const nc = NAT_COLOR[g.nation] || {c:'#8ab88a'};
      html += `<div class="save" onclick="pickMapGame(${i})">
        <span class="sell" onclick="event.stopPropagation();deleteMapGame(${i})">×</span>
        <h3 style="color:${nc.c}">${NAT_NAME[g.nation] || g.nation} · ${info.name}</h3>
        <div class="row">
          <span class="tag">${st}</span>
          <span class="tag">占领 ${pc}/${total}</span>
          <span class="tag">RP ${g.rp}</span>
        </div>
      </div>`;
    });
  }
  html += `<div class="btns" style="margin-top:auto">
    <button class="btn pri" onclick="newMapGame()">+ 新建战役</button>
    <button class="btn" onclick="M.screen='mapSaveSelect';render()">← 返回存档</button>
    <button class="btn" onclick="backMain()">← 主菜单</button>
  </div>`;
  return html;
}
function pickMapGame(idx){
  const save = MAP_SAVES[M.saveIndex];
  if(!save || !save.games || !save.games[idx]) return;
  M.gameIdx = idx;
  save.lastGameIdx = idx;
  M.nation = save.games[idx].nation;
  persistMapSaves();
  M.screen = 'map'; M.selectedUnit = null; M.moveMode = null; M.undoStack = [];
  render();
}
function deleteMapGame(idx){
  const save = MAP_SAVES[M.saveIndex];
  if(!save || !save.games || !save.games[idx]) return;
  const g = save.games[idx];
  const info = MAP_ID_INFO[g.mapId] || MAP_ID_INFO.small;
  if(!confirm(`删除战役「${NAT_NAME[g.nation] || g.nation} · ${info.name}」？`)) return;
  save.games.splice(idx, 1);
  if(save.games.length === 0) save.lastGameIdx = 0;
  else if(save.lastGameIdx >= save.games.length) save.lastGameIdx = save.games.length - 1;
  persistMapSaves();
  render();
}
function newMapGame(){ M.pendingNation = null; M.screen = 'mapNationSelect'; render(); }
function renderMapNationSelect(){
  let html = `<h1>🗺 新建战役 · 选择国家</h1>
  <div class="sub">仅影响当前新建的战役 · 同一存档可建多个</div><div class="nations">`;
  ['德','美','苏'].forEach(n => {
    const nc = NAT_COLOR[n];
    const ic = COMMANDERS.find(c => c.id === NATION_COMMANDERS[n].initial);
    html += `<div class="nation" style="border-color:${nc.c};--c1:${nc.c1};--c2:${nc.c2}" onclick="pickMapNation('${n}')">
      <h3 style="color:${nc.c}">${NAT_NAME[n]}</h3>
      <p>初始 2 支部队 · 每支 2 辆 · 初始指挥官：${ic ? ic.name : '?'}</p>
    </div>`;
  });
  html += `</div><div class="btns" style="margin-top:auto">
    <button class="btn" onclick="M.screen='mapGamesList';render()">← 返回战役列表</button>
    <button class="btn" onclick="backMain()">← 主菜单</button>
  </div>`;
  return html;
}
function pickMapNation(n){ M.pendingNation = n; M.screen = 'mapTemplateSelect'; render(); }
function renderMapTemplateSelect(){
  const n = M.pendingNation || '德';
  const cmCfg = NATION_COMMANDERS[n];
  const cmI = COMMANDERS.find(c => c.id === cmCfg.initial);
  const cmS = COMMANDERS.find(c => c.id === cmCfg.second);
  let html = `<h1>🗺 新建战役 · 选择地图</h1>
  <div class="sub">${NAT_NAME[n]}</div>`;
  ['small','medium','largeB','largeC'].forEach(k => {
    const info = MAP_ID_INFO[k];
    const size = MAP_SIZES[info.size];
    const isLarge = size.cols >= 12;
    const cmText = isLarge ? `初始指挥官：${cmI.name} + ${cmS.name}` : `初始指挥官：${cmI.name}`;
    html += `<div class="map-pick" onclick="pickMapTemplate('${k}')">
      <h3>${info.name}</h3>
      <p>${info.desc} · ${size.cols}×${size.rows} = ${size.cols * size.rows} 格</p>
      <p style="color:#9cff9c;margin-top:4px">${cmText}</p>
    </div>`;
  });
  html += `<div class="btns" style="margin-top:8px">
    <button class="btn" onclick="M.screen='mapNationSelect';render()">← 返回国家</button>
    <button class="btn" onclick="M.screen='mapGamesList';render()">← 战役列表</button>
  </div>`;
  return html;
}
function pickMapTemplate(mapId){
  const save = MAP_SAVES[M.saveIndex];
  if(!save) return;
  const nation = M.pendingNation || '德';
  const g = newMapSave(mapId, nation);
  const size = MAP_SIZES[MAP_ID_INFO[mapId].size];
  const isLarge = size.cols >= 12;
  const tree = TREES[nation];
  for(const name in tree){ if(tree[name].lv <= 2) g.techProgress[name] = true; }
  const init = genPlayerInitialTanks(nation);
  const startCells = findCellsByChar(mapId, 'P');
  const c1 = startCells[0] != null ? startCells[0] : 0;
  const c2 = startCells[1] != null ? startCells[1] : c1;
  const cmCfg = NATION_COMMANDERS[nation];
  const wrap = arr => arr.map(nm => {
    const ac = tankMaxHpByName(nm);
    const tkUid = makeTankUid();
    g.ownedTanks.push({ uid: tkUid, n: nm, exp: 0 });
    return { tankUid: tkUid, n: nm, hp: ac, maxHp: ac, exp: 0 };
  });
  g.playerUnits = [
    { id:'u1', cell:c1, commander:cmCfg.initial, tanks: wrap(init[0]), mp:1, acted:false },
    { id:'u2', cell:c2, commander: isLarge ? cmCfg.second : null, tanks: wrap(init[1]), mp:1, acted:false },
  ];
  g.unlockedCommanders = [cmCfg.initial];
  if(isLarge) g.unlockedCommanders.push(cmCfg.second);
  const eliteCell = findCellByChar(mapId, 'E');
  const hqCell = findCellByChar(mapId, 'H');
  const aiSpawns = findCellsByChar(mapId, 'A');
  g.aiUnits = [];
  if(eliteCell != null) g.aiUnits.push({ id:'e1', cell:eliteCell, tanks:generateMapAIUnit(eliteCell, AI_ELITE_LV, nation), elite:true, fixed:true });
  if(hqCell != null) g.aiUnits.push({ id:'hq', cell:hqCell, tanks:generateMapAIUnit(hqCell, AI_HQ_LV, nation), fixed:true, hq:true });
  aiSpawns.forEach((cell, i) => {
    const t = pickOtherNationLv1Tank(nation);
    const ac = tankMaxHpByName(t);
    g.aiUnits.push({ id:'a'+(i+1), cell, tanks:[{ n: t, hp: ac, maxHp: ac, exp: 0 }], roam:true });
  });
  save.games.push(g);
  M.gameIdx = save.games.length - 1;
  save.lastGameIdx = M.gameIdx;
  M.nation = nation;
  M.pendingNation = null;
  persistMapSaves();
  M.screen = 'map'; M.selectedUnit = null; M.moveMode = null; M.undoStack = [];
  showTutorialIfNeeded();
}
function showTutorialIfNeeded(){
  const done = localStorage.getItem(TUTORIAL_KEY);
  if(done){ render(); return; }
  render();
  const div = document.createElement('div');
  div.className = 'tutor-modal';
  div.innerHTML = `<div class="tutor-card">
    <h3><span class="tutor-icon">🗺</span>欢迎来到地区模式！</h3>
    <p><b>🎯 目标</b>：占领 HQ，或占领地图上所有 AI 格。</p>
    <p><b>⚔️ 操作</b>：点我方部队，再点相邻高亮格移动/进攻。</p>
    <p><b>❤️ 血量</b>：坦克有血量，战后保留。每回合 +5%，修理补满。</p>
    <p><b>🎯 战术指令</b>：基地可解锁指令，战斗中用掉按次花 RP。</p>
    <p><b>🎖 车组</b>：坦克经验累积升星，被击毁时车组进池可回收。</p>
    <p><b>⭐ 精英坦克</b>：打赢精锐解锁（含反杀）。</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn pri" onclick="closeTutorial(true)" style="flex:1">明白了</button>
      <button class="btn" onclick="closeTutorial(false)" style="flex:1">看指南</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function closeTutorial(setFlag){
  localStorage.setItem(TUTORIAL_KEY, '1');
  document.querySelectorAll('.tutor-modal').forEach(el => el.remove());
  if(!setFlag) goGuide();
  else render();
}

function unitLvRange(u){
  if(!u.tanks || u.tanks.length === 0) return null;
  const lvs = u.tanks.map(t => {
    const name = tankName(t);
    for(const nat of ['德','美','苏']){
      const tr = TREES[nat][name]; if(tr) return tr.lv;
    }
    if(ELITE_TANKS[name]) return 15;
    return 1;
  }).sort((a, b) => a - b);
  const min = lvs[0], max = lvs[lvs.length - 1];
  if(min === max) return `Lv${min}`;
  return `Lv${min}-${max}`;
}
function unitStarRange(u){
  if(!u.tanks || u.tanks.length === 0) return '';
  const stars = u.tanks.map(t => getStar((typeof t === 'object' ? t.exp : 0) || 0));
  const max = Math.max(...stars);
  if(max <= 0) return '';
  return ' ' + '★'.repeat(max);
}
function renderHpBar(u){
  const pct = Math.round(unitHpPct(u) * 100);
  const cls = pct < 30 ? 'low' : pct < 70 ? 'mid' : '';
  return `<div class="mini-hp ${cls}"><i style="width:${pct}%"></i></div>`;
}
function renderMapCell(id, sv){
  const cell = sv.cells[id]; const owner = cell.owner;
  const info = CELL_TYPE_INFO[cell.type] || {icon:'', label:''};
  const ter = TERRAIN_INFO[cell.terrain] || TERRAIN_INFO.plain;
  const pu = sv.playerUnits.find(u => u.cell === id);
  const au = sv.aiUnits.find(u => u.cell === id);
  const cls = ['map-cell', `owner-${owner}`, ter.cls];
  if(M.selectedUnit){
    const sel = sv.playerUnits.find(u => u.id === M.selectedUnit);
    if(sel && sel.cell !== id){
      const isAdj = mapAdjacentAll(sel.cell).includes(id);
      if(isAdj){
        const isEnemy = au && au.tanks.length > 0;
        if(isEnemy){
          if(!sel.acted && sel.tanks.length > 0) cls.push('can-attack');
        } else {
          if(sel.tanks.length > 0 && isCellPassable(cell) && sel.mp >= getTerrainMP(cell.terrain)) cls.push('can-move');
        }
      }
    }
  }
  if(pu && M.selectedUnit === pu.id) cls.push('selected');
  let bc = '';
  if(pu){
    const cm = COMMANDERS.find(c => c.id === pu.commander);
    const done = pu.mp <= 0 && pu.acted;
    const lv = unitLvRange(pu);
    const starStr = unitStarRange(pu);
    bc = `<div class="troop"><div class="troop-icon" style="color:#7bff7b">⚔️</div><div class="troop-name pl">${cm ? cm.name : '无'}${starStr}</div><div class="count">×${pu.tanks.length || 0}</div>${lv ? `<div class="troop-lv pl">${lv}</div>` : ''}${renderHpBar(pu)}</div><div class="tick ${done?'done':'todo'}">${done?'✓':'⏳'}</div>`;
  } else if(au){
    const isE = au.elite, isH = au.hq;
    const lv = unitLvRange(au);
    const starStr = unitStarRange(au);
    const nm = isE ? '精锐' : isH ? '总部' : 'AI';
    bc = `<div class="troop"><div class="troop-icon" style="color:#ff8080">⚔️</div><div class="troop-name ai">${nm}${starStr}</div><div class="count">×${au.tanks.length}</div>${lv ? `<div class="troop-lv ai">${lv}</div>` : ''}${renderHpBar(au)}</div>`;
  } else {
    bc = `<div class="cell-icon">${info.icon}</div>${info.label ? `<div class="cell-label">${info.label}</div>` : ''}`;
  }
  let terIcon = '';
  if(cell.terrain === 'mountain') terIcon = '⛰';
  else if(cell.terrain === 'swamp') terIcon = '🌫';
  else if(cell.terrain === 'river') terIcon = '🌊';
  const corner = info.icon ? `<div class="cell-icon-corner">${info.icon}</div>` : '';
  return `<div class="${cls.join(' ')}" data-cell="${id}" onclick="clickMapCell(${id})">
    ${corner}${terIcon ? `<div class="ter-icon">${terIcon}</div>` : ''}
    <div class="strip"></div><div class="body">${bc}</div>
  </div>`;
}
function renderMap(){
  const sv = getMapCur();
  if(!sv) return '<div class="panel">存档错误</div>';
  if(sv.cleared) return renderMapCleared();
  if(sv.lost) return renderMapLost();
  const cols = sv.cols, rows = sv.rows;
  const totalCells = cols * rows;
  const pc = sv.cells.filter(c => c.owner === 'player').length;
  const mapName = (MAP_ID_INFO[sv.mapId] || MAP_ID_INFO.small).name;
  const cfg = getAICfg(sv);
  const GAP = 4;
  const appW = Math.min(window.innerWidth, 900) - 20;
  const availW = appW - 12;
  const isScroll = cols >= 10;
  const cellSize = isScroll ? 48 : Math.min(64, Math.max(38, Math.floor((availW - GAP * (cols - 1)) / cols)));
  let html = `<div class="map-header">
    <div><b style="color:#7bff7b">第 ${sv.turn} 回合</b> <span style="color:#8ab88a">占领 ${pc}/${totalCells}</span><br><span style="color:#8ab88a;font-size:10px">${NAT_NAME[sv.nation]} · ${mapName} · AI Lv↑${cfg.growthRate.toFixed(2)}/回</span></div>
    <div class="res"><span>💰 <b>${sv.rp}</b></span><span>📦 <b>${sv.supply}</b></span></div>
  </div>`;
  const gridStyle = `--cell-size:${cellSize}px;grid-template-columns:repeat(${cols}, ${cellSize}px);grid-auto-rows:${cellSize}px`;
  html += `<div class="map-grid-wrap"><div class="map-grid" style="${gridStyle}">`;
  for(let id = 0; id < totalCells; id++) html += renderMapCell(id, sv);
  html += `</div></div>`;
  html += `<div class="panel"><h3>我的部队 (${sv.playerUnits.length}/5)</h3>`;
  sv.playerUnits.forEach(u => {
    const cm = COMMANDERS.find(c => c.id === u.commander);
    const hT = u.tanks.length > 0;
    const done = u.mp <= 0 && u.acted;
    const lv = unitLvRange(u);
    const starStr = unitStarRange(u);
    const hpPct = Math.round(unitHpPct(u) * 100);
    const hpColor = hpPct < 30 ? '#e03e3e' : hpPct < 70 ? '#ffb84d' : '#3ddc84';
    const cls = ['unit-chip'];
    if(M.selectedUnit === u.id) cls.push('active');
    if(done) cls.push('done');
    let status = done ? '已行动' : (u.mp <= 0 ? '可进攻' : (u.acted ? '可移动' : `MP ${u.mp}`));
    html += `<div class="${cls.join(' ')}" onclick="selectMapUnit('${u.id}')">
      <div class="uinfo"><div class="uname">🔵 ${u.id} ${cm ? '· ' + cm.name : ''}${starStr}</div>
      <div class="ustats">${hT ? u.tanks.length + ' 辆 · ' + (lv || '') + ' · 血量 <span style="color:'+hpColor+';font-weight:800">'+hpPct+'%</span>' : '⚠ 空编制'}</div></div>
      <div class="ustatus">${status}</div>
    </div>`;
  });
  if(sv.playerUnits.length < 5) html += `<button class="btn ghost" onclick="addMapUnit()" style="width:100%">+ 新建部队（500 RP）</button>`;
  html += `</div>`;
  if(M.selectedUnit){
    const u = sv.playerUnits.find(x => x.id === M.selectedUnit);
    if(u){
      const cm = COMMANDERS.find(c => c.id === u.commander);
      html += `<div class="panel"><h3>操作${cm ? ` · ${cm.name}（${cm.desc}）` : ''}</h3>
        <div style="font-size:12px;color:#8ab88a;margin-bottom:8px">🖱 点高亮格移动/进攻 · 剩余 MP ${u.mp.toFixed(1)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn ghost" onclick="openMapEditUnit('${u.id}')">🎛 编辑</button>
          <button class="btn ghost" onclick="openMapCommanderSelect('${u.id}')">🔄 换指挥官</button>
          ${u.tanks.length > 0 ? `<button class="btn ghost" onclick="openMapRepair('${u.id}')">🔧 修理</button>` : ''}
          <button class="btn ghost" onclick="undoMapStep()">↩️ 撤销</button>
        </div>
      </div>`;
    }
  }
  html += `<div class="btns" style="margin-top:auto">
    <button class="btn pri" onclick="endMapTurn()">▶ 结束回合</button>
    <div class="row" style="gap:6px">
      <button class="btn ghost" style="flex:1" onclick="M.screen='mapBase';render()">🏠 基地</button>
      <button class="btn ghost" style="flex:1" onclick="M.screen='mapTree';render()">🌳 科技树</button>
      <button class="btn ghost" style="flex:1" onclick="M.screen='mapTactical';render()">🎯 指令</button>
    </div>
    <div class="row" style="gap:6px">
      <button class="btn ghost" style="flex:1" onclick="M.screen='mapSettings';render()">⚙️ 设置</button>
      <button class="btn ghost" style="flex:1" onclick="openAIConfig()">🎚️ AI难度</button>
      <button class="btn ghost" style="flex:1" onclick="M.screen='mapGamesList';render()">📁 战役列表</button>
    </div>
    <button class="btn" onclick="backMain()">← 主菜单</button>
  </div>`;
  return html;
}
function renderMapCleared(){ return `<h1 style="font-size:28px;color:#ffd76e">🎉 通关</h1><div class="sub">你已占领所有 AI 格或 HQ</div><div class="btns" style="margin-top:30px"><button class="btn pri" onclick="M.screen='map';render()">查看地图</button><button class="btn" onclick="M.screen='mapGamesList';render()">📁 战役列表</button><button class="btn" onclick="backMain()">← 主菜单</button></div>`; }
function renderMapLost(){ return `<h1 style="font-size:28px;color:#ff6b6b">💀 失败</h1><div class="sub">你失去了所有格子</div><div class="btns" style="margin-top:30px"><button class="btn pri" onclick="M.screen='mapGamesList';render()">📁 战役列表</button><button class="btn" onclick="backMain()">← 主菜单</button></div>`; }

function clickMapCell(id){
  const sv = getMapCur();
  const ownU = sv.playerUnits.find(u => u.cell === id);
  if(ownU){
    if(M.selectedUnit === ownU.id){ M.selectedUnit = null; M.moveMode = null; render(); return; }
    M.selectedUnit = ownU.id; M.moveMode = null; render(); return;
  }
  if(!M.selectedUnit){ showMapCellInfo(id); return; }
  const sel = sv.playerUnits.find(u => u.id === M.selectedUnit); if(!sel) return;
  const adj = mapAdjacentAll(sel.cell); if(!adj.includes(id)){ showMapCellInfo(id); return; }
  executeMapAction(id);
}
function executeMapAction(id){
  const sv = getMapCur();
  const sel = sv.playerUnits.find(u => u.id === M.selectedUnit); if(!sel) return;
  if(sel.tanks.length === 0){ toast('空编制不能行动'); return; }
  const adj = mapAdjacentAll(sel.cell); if(!adj.includes(id)){ toast('只能操作相邻格'); return; }
  const cell = sv.cells[id];
  const au = sv.aiUnits.find(u => u.cell === id);
  const isEnemy = !!au && au.tanks.length > 0;
  M.undoStack.push(JSON.stringify({
    cell: { ...cell },
    sel: { ...sel, tanks: sel.tanks.map(t => ({...t})) },
    playerUnits: sv.playerUnits.map(u => ({...u, tanks: u.tanks.map(t => ({...t}))})),
    rp: sv.rp, supply: sv.supply,
    aiUnits: sv.aiUnits.map(u => ({...u, tanks: u.tanks.map(t => ({...t}))})),
    cleared: !!sv.cleared, lost: !!sv.lost,
    aiReinforceCount: sv.aiReinforceCount,
    ownedTanks: (sv.ownedTanks || []).map(t => ({...t})),
    crewPool: (sv.crewPool || []).map(c => ({...c}))
  }));
  if(M.undoStack.length > 20) M.undoStack.shift();
  if(isEnemy){
    if(sel.acted){ toast('本回合已进攻'); M.undoStack.pop(); return; }
    startMapBattle(sel, id); return;
  }
  if(!isCellPassable(cell)){ toast('该地形不可通行'); M.undoStack.pop(); return; }
  const cost = getTerrainMP(cell.terrain);
  if(sel.mp < cost){ toast(`MP 不足（需 ${cost}）`); M.undoStack.pop(); return; }
  sel.mp = Math.round((sel.mp - cost) * 10) / 10;
  sel.cell = id;
  if(cell.owner !== 'player'){
    cell.owner = 'player';
    if(!cell.looted){
      const loot = getMapCellLoot(cell);
      if(loot){ sv.rp += loot.rp || 0; sv.supply += loot.supply || 0; cell.looted = true; }
    }
  }
  M.moveMode = null;
  checkMapVictory(sv);
  persistMapSaves();
  if(sv.cleared){ render(); return; }
  render();
  toast(`移动到格 ${id}（剩 ${sel.mp} MP）`);
}
function undoMapStep(){
  if(M.undoStack.length === 0){ toast('无可撤销'); return; }
  const snap = JSON.parse(M.undoStack.pop());
  const sv = getMapCur();
  sv.cells[snap.cell.id] = snap.cell;
  if(snap.playerUnits) sv.playerUnits = snap.playerUnits.map(u => ({...u, tanks: u.tanks.map(t => ({...t}))}));
  else {
    const idx = sv.playerUnits.findIndex(u => u.id === snap.sel.id);
    if(idx >= 0) sv.playerUnits[idx] = snap.sel;
  }
  sv.rp = snap.rp; sv.supply = snap.supply;
  sv.aiUnits = snap.aiUnits.map(u => ({...u, tanks: u.tanks.map(t => ({...t}))}));
  if(snap.cleared !== undefined) sv.cleared = snap.cleared;
  if(snap.lost !== undefined) sv.lost = snap.lost;
  if(snap.aiReinforceCount !== undefined) sv.aiReinforceCount = snap.aiReinforceCount;
  if(snap.ownedTanks) sv.ownedTanks = snap.ownedTanks;
  if(snap.crewPool) sv.crewPool = snap.crewPool;
  persistMapSaves(); render(); toast('已撤销');
}
function showMapCellInfo(id){
  const sv = getMapCur(); const cell = sv.cells[id];
  const pU = sv.playerUnits.find(u => u.cell === id);
  const aU = sv.aiUnits.find(u => u.cell === id);
  const info = CELL_TYPE_INFO[cell.type] || {icon:'',label:''};
  const ter = cell.terrain === 'plain' ? '' : ' · ' + cell.terrain;
  let msg = `格${id} · ${info.label || '普通'}${ter} · ${cell.owner === 'player' ? '我方' : cell.owner === 'ai' ? 'AI' : '中立'}`;
  if(pU) msg += ` · 我方 ${pU.tanks.length} 辆`;
  if(aU) msg += ` · AI ${aU.tanks.length} 辆`;
  toast(msg);
}
function selectMapUnit(id){ M.selectedUnit = M.selectedUnit === id ? null : id; M.moveMode = null; render(); }

function unlockEliteRewards(sv){
  const unlocked = [];
  const eliteList = NATION_ELITE[sv.nation] || [];
  eliteList.forEach(t => {
    if(!sv.unlockedEliteTanks.includes(t)){ sv.unlockedEliteTanks.push(t); unlocked.push(`⭐${t}`); }
  });
  const cmCfg = NATION_COMMANDERS[sv.nation];
  if(cmCfg && cmCfg.elite && !sv.unlockedCommanders.includes(cmCfg.elite)){
    sv.unlockedCommanders.push(cmCfg.elite);
    const cmObj = COMMANDERS.find(c => c.id === cmCfg.elite);
    if(cmObj) unlocked.push(`🎖 ${cmObj.name}`);
  }
  return unlocked;
}
function checkMapVictory(sv){
  if(!sv || sv.cleared || sv.lost) return;
  const hasAiCell = sv.cells.some(c => c.owner === 'ai');
  if(!hasAiCell) sv.cleared = true;
}
function startMapBattle(attackerUnit, targetCellId){
  const sv = getMapCur();
  const cell = sv.cells[targetCellId];
  const au = sv.aiUnits.find(u => u.cell === targetCellId);
  if(!au || au.tanks.length === 0){
    if(au) sv.aiUnits = sv.aiUnits.filter(u => u.id !== au.id);
    cell.owner = 'player';
    if(!cell.looted){
      const loot = getMapCellLoot(cell);
      if(loot){ sv.rp += loot.rp || 0; sv.supply += loot.supply || 0; cell.looted = true; }
    }
    attackerUnit.cell = targetCellId;
    attackerUnit.acted = true;
    attackerUnit.mp = 0;
    checkMapVictory(sv);
    persistMapSaves(); render(); toast(`占领格 ${targetCellId}`); return;
  }
  M.undoStack = [];
  const en = au.tanks.map(t => normalizeTank(t));
  const pn = attackerUnit.tanks.map(t => normalizeTank(t));
  resetBattleState('map');
  initBattleBuffs();
  B.tactical = { playerEquipped: (sv.tacEquipped || []).slice(0, sv.tacSlots || 0), playerUsed: [], enemyEquipped: [], enemyUsed: [] };
  setupAITacticalPool(getAITacticalSlotsForBattle());
  B.mapCtx = { attackerUnitId: attackerUnit.id, targetCellId, aiUnitId: au.id, playerNames: pn.map(t => t.n), aiAttack: false };
  const cm = COMMANDERS.find(c => c.id === attackerUnit.commander);
  const pu = pn.map((t, i) => makeBattleUnit(t.n, 'player', i, t.hp, t.exp || 0, t.tankUid));
  if(cm) applyCommanderBuff(pu, cm);
  pu.forEach(u => B.units.push(u));
  en.forEach((t, i) => B.units.push(makeBattleUnit(t.n, 'enemy', i, t.hp, t.exp || 0)));
  addBLog(`<span class="rd">⚔ 地区战斗 · 蓝 ${pn.length} vs 红 ${en.length}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
  M.screen = 'battle'; S.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
  render(); setTimeout(runBattle, 500);
}
function applyCommanderBuff(units, cm){
  const e = cm.effect || {};
  units.forEach(u => {
    const t = TANKS[u.name] || ELITE_TANKS[u.name]; if(!t) return;
    if(e.nation && t.na !== e.nation) return;
    if(e.medium_type && u.ty !== 'medium') return;
    if(e.heavy_type && u.ty !== 'heavy') return;
    if(e.light_type && u.ty !== 'light') return;
    if(e.td_type && u.ty !== 'td') return;
    if(e.spd) u.s = Math.round(u.s * (1 + e.spd));
    if(e.atk) u.at = Math.round(u.at * (1 + e.atk));
    if(e.pen) u.p = Math.round(u.p * (1 + e.pen));
    if(e.armor) u.a = Math.round(u.a * (1 + e.armor));
    if(e.hp){ const add = Math.round(u.maxHp * e.hp); u.maxHp += add; u.hp += add; }
  });
}
function returnUnitToStart(sv, unit){
  if(!unit || unit.tanks.length > 0) return;
  const sc = sv.cells.filter(c => c.type === 'start' && c.owner === 'player');
  if(sc.length > 0){ unit.cell = sc[0].id; return; }
  const pcs = sv.cells.filter(c => c.owner === 'player');
  if(pcs.length > 0) unit.cell = pcs[0].id;
}
function removeKilledFromPool(sv, killedTanks){
  killedTanks.forEach(k => {
    let idx = -1;
    if(k.tankUid){ idx = (sv.ownedTanks || []).findIndex(t => t.uid === k.tankUid); }
    if(idx < 0){ idx = (sv.ownedTanks || []).findIndex(t => t.n === k.n && (t.exp || 0) === (k.exp || 0)); }
    if(idx >= 0) sv.ownedTanks.splice(idx, 1);
  });
}
function showMapBattleResult(){
  const sv = getMapCur(); const ctx = B.mapCtx;
  const win = B.result === 'win';
  if(win) SFX.win(); else SFX.lose();
  const pUnitsAlive = B.units.filter(u => u.side === 'player' && u.alive);
  const pSurv = pUnitsAlive.map(u => ({ n: u.name, hp: u.hp, maxHp: u.maxHp }));
  const pDead = B.units.filter(u => u.side === 'player' && !u.alive).map(u => ({ tankUid: u.tankUid, n: u.name, exp: u.exp }));
  const eUnitsAlive = B.units.filter(u => u.side === 'enemy' && u.alive);
  const eSurv = eUnitsAlive.map(u => ({ n: u.name, hp: u.hp, maxHp: u.maxHp }));
  const eDead = B.units.filter(u => u.side === 'enemy' && !u.alive).length;
  const attacker = sv.playerUnits.find(u => u.id === ctx.attackerUnitId);
  removeKilledFromPool(sv, pDead);
  if(attacker){
    attacker.acted = true; attacker.mp = 0;
    applyMapVeteranResult(attacker);
    if(attacker.tanks.length === 0) returnUnitToStart(sv, attacker);
  }
  const cell = sv.cells[ctx.targetCellId];
  let unlockedNote = [];
  if(win){
    cell.owner = 'player';
    if(!cell.looted){
      const loot = getMapCellLoot(cell);
      if(loot){ sv.rp += loot.rp || 0; sv.supply += loot.supply || 0; cell.looted = true; }
    }
    sv.rp += 500;
    if(cell.type === 'elite') unlockedNote = unlockEliteRewards(sv);
    if(ctx.aiUnitId){
      const au = sv.aiUnits.find(u => u.id === ctx.aiUnitId);
      if(au){
        if(eSurv.length > 0){ au.tanks = eSurv; }
        else { sv.aiUnits = sv.aiUnits.filter(u => u.id !== ctx.aiUnitId); }
      }
    }
    if(cell.type === 'hq') sv.cleared = true;
  } else {
    if(ctx.aiUnitId){
      const au = sv.aiUnits.find(u => u.id === ctx.aiUnitId);
      if(au){
        if(eSurv.length > 0) au.tanks = eSurv;
        else sv.aiUnits = sv.aiUnits.filter(u => u.id !== ctx.aiUnitId);
      }
    }
  }
  checkMapVictory(sv);
  persistMapSaves();
  const div = document.createElement('div'); div.className = 'res-modal'; div.id = 'battleResult';
  div.innerHTML = `<div class="res-title ${win?'win':'lose'}">${win?'胜 利':'败 北'}</div>
    <div class="res-card">
      <div class="res-row"><span>结果</span><b>${win ? '占领' : '失败'}</b></div>
      <div class="res-row"><span>存活</span><b>${pSurv.length}/${ctx.playerNames.length}</b></div>
      <div class="res-row"><span>击毁</span><b>${eDead}</b></div>
      <div class="res-row"><span>损失</span><b>${pDead.length}</b></div>
      ${win ? `<div class="res-row"><span>研发点</span><b>+500</b></div>` : ''}
      ${unlockedNote.length ? `<div class="res-row"><span>解锁</span><b>${unlockedNote.join('、')}</b></div>` : ''}
    </div>
    ${renderVeteranResultHTML()}
    <div class="res-btns"><button class="btn pri" onclick="closeMapBattleResult()">🏠 返回地图</button></div>`;
  document.body.appendChild(div);
}
function closeMapBattleResult(){
  document.getElementById('battleResult')?.remove();
  B.mapCtx = null; B.aiCallback = null;
  M.screen = 'map'; M.selectedUnit = null; M.moveMode = null;
  document.documentElement.style.setProperty('--boff', '0px'); render();
}

async function endMapTurn(){
  const sv = getMapCur();
  if(sv.cleared || sv.lost){ render(); return; }
  const pc = sv.cells.filter(c => c.owner === 'player').length;
  sv.rp += pc * 10;
  sv.supply += 5;
  sv.playerUnits.forEach(u => { u.mp = 1; u.acted = false; });
  const healArr = arr => (arr || []).forEach(u => {
    (u.tanks || []).forEach(t => {
      const o = normalizeTank(t);
      const maxHp = o.maxHp;
      const add = Math.max(1, Math.round(maxHp * 0.05));
      o.hp = Math.min(maxHp, o.hp + add);
      if(typeof t === 'object'){ t.hp = o.hp; t.maxHp = o.maxHp; }
    });
  });
  healArr(sv.playerUnits);
  healArr(sv.aiUnits);
  const cfg = getAICfg(sv);
  const roamCount = sv.aiUnits.filter(u => u.roam).length;
  const isFirstReinforce = (sv.turn === AI_REINFORCE_FIRST);
  const isLaterReinforce = (sv.turn > AI_REINFORCE_FIRST && (sv.turn - AI_REINFORCE_FIRST) % cfg.reinforceInterval === 0);
  if((isFirstReinforce || isLaterReinforce) && roamCount < cfg.reinforceMax){
    const spawns = sv.cells.filter(c => c.type === 'ai_spawn' && c.owner === 'ai' && !sv.aiUnits.some(u => u.cell === c.id));
    if(spawns.length > 0){
      const sp = spawns[Math.floor(Math.random() * spawns.length)];
      sv.aiReinforceCount = (sv.aiReinforceCount || 0) + 1;
      const slots = aiSlotsForReinforce(sv.aiReinforceCount);
      const lvRaw = 2 + sv.turn * cfg.growthRate;
      const lv = Math.min(cfg.maxLevel, Math.round(lvRaw * 2) / 2);
      sv.aiUnits.push({
        id: 'a' + Date.now() + Math.floor(Math.random()*1000),
        cell: sp.id,
        tanks: generateMapAIUnit(sp.id, lv, sv.nation, slots),
        roam: true,
      });
    }
  }
  sv.turn++;
  persistMapSaves();
  render();
  await runAITurn();
}
async function runAITurn(){
  const sv = getMapCur();
  const order = [...sv.aiUnits];
  for(const aiU of order){
    if(sv.cleared || sv.lost) break;
    if(!sv.aiUnits.find(u => u.id === aiU.id)) continue;
    if(aiU.tanks.length === 0){ sv.aiUnits = sv.aiUnits.filter(u => u.id !== aiU.id); continue; }
    if(aiU.fixed || aiU.elite || aiU.hq){
      const adj = mapAdjacentAll(aiU.cell);
      const near = sv.playerUnits.find(u => adj.includes(u.cell) && u.tanks.length > 0);
      if(near){ await triggerMapBattle(near, aiU); await sleep(400); }
      continue;
    }
    const adj = mapAdjacentAll(aiU.cell);
    const pNear = sv.playerUnits.find(u => adj.includes(u.cell) && u.tanks.length > 0);
    if(pNear){ await triggerMapBattle(pNear, aiU); await sleep(400); continue; }
    const pCells = adj.filter(id => sv.cells[id].owner === 'player');
    if(pCells.length > 0){
      const tid = pCells[0];
      const defU = sv.playerUnits.find(u => u.cell === tid);
      if(defU && defU.tanks.length > 0){ await triggerMapBattle(defU, aiU); }
      else {
        sv.cells[tid].owner = 'ai'; sv.cells[tid].looted = false; aiU.cell = tid;
        if(!sv.cells.some(c => c.owner === 'player')) sv.lost = true;
      }
      render(); await sleep(400); continue;
    }
    const movable = mapAdjacentMovable(aiU.cell);
    const nNear = movable.filter(id => sv.cells[id].owner === 'neutral' && !sv.playerUnits.some(u => u.cell === id) && !sv.aiUnits.some(u => u.cell === id && u.id !== aiU.id));
    if(nNear.length > 0){
      const cid = nNear[Math.floor(Math.random() * nNear.length)];
      aiU.cell = cid; sv.cells[cid].owner = 'ai';
      render(); await sleep(300); continue;
    }
    const pcs = sv.cells.filter(c => c.owner === 'player');
    if(pcs.length === 0) continue;
    const step = findNextStepToNearestPlayer(sv, aiU);
    if(step != null && step !== aiU.cell){
      aiU.cell = step;
      if(sv.cells[step].owner === 'neutral') sv.cells[step].owner = 'ai';
      render(); await sleep(300);
    }
  }
  persistMapSaves();
}
function findNextStepToNearestPlayer(sv, aiU){
  const cols = sv.cols, rows = sv.rows;
  const total = cols * rows;
  const targetSet = new Set(sv.cells.filter(c => c.owner === 'player').map(c => c.id));
  if(targetSet.size === 0) return null;
  const passable = new Array(total);
  for(let i = 0; i < total; i++) passable[i] = isCellPassable(sv.cells[i]) && !sv.playerUnits.some(u => u.cell === i);
  const dist = new Array(total).fill(-1);
  const prev = new Array(total).fill(-1);
  const q = [aiU.cell]; dist[aiU.cell] = 0;
  let found = -1;
  while(q.length){
    const cur = q.shift();
    if(targetSet.has(cur)){ found = cur; break; }
    const r = Math.floor(cur / cols), c = cur % cols;
    const nbrs = [];
    if(r > 0) nbrs.push(cur - cols);
    if(r < rows - 1) nbrs.push(cur + cols);
    if(c > 0) nbrs.push(cur - 1);
    if(c < cols - 1) nbrs.push(cur + 1);
    for(const nb of nbrs){
      if(!passable[nb] && !targetSet.has(nb)) continue;
      if(dist[nb] >= 0) continue;
      dist[nb] = dist[cur] + 1;
      prev[nb] = cur;
      q.push(nb);
    }
  }
  if(found < 0) return null;
  let node = found;
  while(prev[node] !== -1 && prev[node] !== aiU.cell) node = prev[node];
  return node;
}
async function triggerMapBattle(playerU, aiU){
  return new Promise(resolve => {
    const pn = playerU.tanks.map(t => normalizeTank(t));
    const en = aiU.tanks.map(t => normalizeTank(t));
    resetBattleState('map');
    initBattleBuffs();
    const sv = getMapCur();
    B.tactical = { playerEquipped: sv ? (sv.tacEquipped || []).slice(0, sv.tacSlots || 0) : [], playerUsed: [], enemyEquipped: [], enemyUsed: [] };
    setupAITacticalPool(getAITacticalSlotsForBattle());
    B.mapCtx = { aiAttack: true, playerUnitId: playerU.id, aiUnitId: aiU.id, playerNames: pn.map(t => t.n) };
    B.aiCallback = resolve;
    const cm = COMMANDERS.find(c => c.id === playerU.commander);
    const pu = pn.map((t, i) => makeBattleUnit(t.n, 'player', i, t.hp, t.exp || 0, t.tankUid));
    if(cm) applyCommanderBuff(pu, cm);
    pu.forEach(u => B.units.push(u));
    en.forEach((t, i) => B.units.push(makeBattleUnit(t.n, 'enemy', i, t.hp, t.exp || 0)));
    addBLog(`<span class="rd">⚔ AI 进攻 · 蓝 ${pn.length} vs 红 ${en.length}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
    M.screen = 'battle'; S.screen = 'none';
    document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
    render();
    setTimeout(runBattle, 400);
  });
}
function showAIDefenseResult(){
  const ctx = B.mapCtx;
  const win = B.result === 'win';
  if(win) SFX.win(); else SFX.lose();
  const sv = getMapCur();
  const pU = sv.playerUnits.find(u => u.id === ctx.playerUnitId);
  const aU = sv.aiUnits.find(u => u.id === ctx.aiUnitId);
  const pUnitsAlive = B.units.filter(u => u.side === 'player' && u.alive);
  const pS = pUnitsAlive.map(u => ({ n: u.name, hp: u.hp, maxHp: u.maxHp }));
  const pD = B.units.filter(u => u.side === 'player' && !u.alive).map(u => ({ tankUid: u.tankUid, n: u.name, exp: u.exp }));
  const eUnitsAlive = B.units.filter(u => u.side === 'enemy' && u.alive);
  const eS = eUnitsAlive.map(u => ({ n: u.name, hp: u.hp, maxHp: u.maxHp }));
  removeKilledFromPool(sv, pD);
  if(pU){
    applyMapVeteranResult(pU);
    if(pU.tanks.length === 0) returnUnitToStart(sv, pU);
  }
  let unlockedNote2 = [];
  if(aU){
    if(eS.length > 0){ aU.tanks = eS; }
    else {
      const cell = sv.cells[aU.cell];
      if(cell){
        cell.owner = 'player';
        if(cell.type === 'elite') unlockedNote2 = unlockEliteRewards(sv);
        if(cell.type === 'hq') sv.cleared = true;
      }
      sv.aiUnits = sv.aiUnits.filter(u => u.id !== aU.id);
    }
  }
  checkMapVictory(sv);
  persistMapSaves();
  const div = document.createElement('div'); div.className = 'res-modal'; div.id = 'battleResult';
  div.innerHTML = `<div class="res-title ${win?'win':'lose'}">${win?'防守成功':'防守失败'}</div>
    <div class="res-card">
      <div class="res-row"><span>我方剩余</span><b>${pS.length}/${ctx.playerNames.length}</b></div>
      <div class="res-row"><span>敌方剩余</span><b>${eS.length}</b></div>
      ${unlockedNote2.length ? `<div class="res-row"><span>解锁</span><b>${unlockedNote2.join('、')}</b></div>` : ''}
    </div>
    ${renderVeteranResultHTML()}
    <div class="res-btns"><button class="btn pri" onclick="closeAIAtkResult()">继续</button></div>`;
  document.body.appendChild(div);
}
function closeAIAtkResult(){
  document.getElementById('battleResult')?.remove();
  const cb = B.aiCallback;
  B.aiCallback = null; B.mapCtx = null;
  M.screen = 'map';
  document.documentElement.style.setProperty('--boff', '0px');
  render();
  if(cb) cb();
}

function openMapEditUnit(uid){ M.screen = 'mapBase'; M.selectedBaseTab = 'edit'; M.editingUnitId = uid; render(); }
function renderMapBase(){
  const sv = getMapCur();
  let html = `<div class="base-head">
    <div class="line"><span>国家</span><b style="color:${(NAT_COLOR[sv.nation]||{c:'#fff'}).c}">${NAT_NAME[sv.nation]}</b></div>
    <div class="line"><span>回合</span><b style="color:#ffd76e">${sv.turn}</b></div>
    <div class="line"><span>研发点</span><span class="val" style="color:#ffd76e">${sv.rp}</span></div>
    <div class="line"><span>补给</span><span class="val" style="color:#7bff7b">${sv.supply}</span></div>
    <div class="tabs2">
      <button class="${M.selectedBaseTab === 'base' ? 'act' : ''}" onclick="M.selectedBaseTab='base';render()">🏠 基地</button>
      <button class="${M.selectedBaseTab === 'edit' ? 'act' : ''}" onclick="M.selectedBaseTab='edit';render()">🎛 编辑</button>
    </div>
  </div>`;
  if(M.selectedBaseTab === 'base'){
    const owned = sv.ownedTanks || [];
    html += `<div class="panel"><h3>已拥有坦克 (${owned.length}/60) · 点击看详情</h3>
      ${owned.length ? `<div class="tank-list">${owned.map((t, i) => {
        const d = TANKS[t.n] || ELITE_TANKS[t.n]; if(!d) return '';
        const isE = !!ELITE_TANKS[t.n];
        const exp = t.exp || 0;
        const st = getStar(exp);
        const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
        const pct = expProgressPct(exp);
        const full = st >= 3 ? ' full' : '';
        const sellBtn = isE ? '' : `<span class="sell" onclick="event.stopPropagation();confirmSellMapTank(${i})">×</span>`;
        return `<div class="tank-chip" onclick="showTankDetail(true,${i})">${sellBtn}${isE?'⭐':TY_ICON[d.ty]}<span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span><div class="exp-bar${full}"><i style="width:${pct}%"></i></div></div>`;
      }).join('')}</div>` : '<div style="color:#5a6a5a;font-size:12px">暂无</div>'}
    </div>`;
    const eliteList = NATION_ELITE[sv.nation] || [];
    const av = eliteList.filter(n => (sv.unlockedEliteTanks||[]).includes(n) && !owned.some(t => t.n === n));
    if(av.length > 0){
      html += `<div class="panel"><h3>⭐ 精英坦克</h3><div class="tank-list">${av.map(n => `<div class="tank-chip" onclick="buyEliteMapTank('${n}')">⭐${esc(n)} ${ELITE_PRICES[n]} RP</div>`).join('')}</div></div>`;
    }
    html += renderCrewSection(true);
    html += `<div class="btns" style="margin-top:auto"><button class="btn pri" onclick="M.screen='map';render()">← 返回地图</button></div>`;
  } else if(M.selectedBaseTab === 'edit'){
    html += renderMapEditContent();
  }
  return html;
}
function renderMapTactical(){ return `<h1>🎯 战术指令</h1>` + renderTacticalPanel(true); }
function renderMapEditContent(){
  const sv = getMapCur();
  const uid = M.editingUnitId || (sv.playerUnits[0] && sv.playerUnits[0].id);
  const u = sv.playerUnits.find(x => x.id === uid);
  if(!u){ return `<div class="panel"><h3>🎛 编辑</h3><div style="padding:12px;color:#8ab88a">没有部队</div><div class="btns"><button class="btn" onclick="M.screen='map';render()">← 返回地图</button></div></div>`; }
  const uc = {}; sv.playerUnits.forEach(x => x.tanks.forEach(t => { const nm = tankName(t); uc[nm] = (uc[nm]||0)+1; }));
  const to = {}; (sv.ownedTanks||[]).forEach(t => { to[t.n] = (to[t.n]||0)+1; });
  const pa = [];
  for(const n in to){ const a = to[n] - (uc[n] || 0); for(let i = 0; i < a; i++) pa.push(n); }
  let html = `<div class="panel"><h3>选择部队</h3><div class="tank-list">${sv.playerUnits.map(x => `<div class="tank-chip ${x.id === uid ? 'sel' : ''}" onclick="M.editingUnitId='${x.id}';render()">🔵 ${x.id} · ${x.tanks.length} 辆</div>`).join('')}</div></div>`;
  html += `<div class="panel"><h3>部队 ${u.id} 编队 (${u.tanks.length}/6)</h3>
    ${u.tanks.length ? `<div class="tank-list">${u.tanks.map((t, i) => { const nm = tankName(t); const d = TANKS[nm] || ELITE_TANKS[nm]; if(!d) return ''; const isE = !!ELITE_TANKS[nm]; const o = normalizeTank(t); const pct = Math.round(o.hp / o.maxHp * 100); const hpCls = pct < 30 ? 'low' : pct < 70 ? 'mid' : ''; const st = getStar(o.exp || 0); const stars = st > 0 ? ' ' + '★'.repeat(st) : ''; return `<div class="tank-chip sel" onclick="removeTankFromUnit('${u.id}',${i})">${isE?'⭐':TY_ICON[d.ty]}${esc(nm)}${stars} <span style="font-size:10px;color:#8ab88a">${pct}%</span> ×<span class="hpbar ${hpCls}"><i style="width:${pct}%"></i></span></div>`; }).join('')}</div>` : '<div style="color:#5a6a5a;font-size:12px">空编制</div>'}
  </div>`;
  html += `<div class="panel"><h3>可加入的坦克</h3>
    ${pa.length ? `<div class="tank-list">${pa.map(n => { const d = TANKS[n] || ELITE_TANKS[n]; if(!d) return ''; const isE = !!ELITE_TANKS[n]; const exp = (sv.ownedTanks.find(x => x.n === n && (x.exp||0) >= 0) || {}).exp || 0; const st = getStar(exp); const stars = st > 0 ? ' ' + '★'.repeat(st) : ''; return `<div class="tank-chip" onclick="addTankToUnit('${u.id}','${esc(n)}')">${isE?'⭐':TY_ICON[d.ty]}${esc(n)}${stars} ＋</div>`; }).join('')}</div>` : '<div style="color:#5a6a5a;font-size:12px">无可用</div>'}
  </div>`;
  html += `<div class="btns" style="margin-top:auto"><button class="btn pri" onclick="M.screen='map';render()">✓ 完成</button></div>`;
  return html;
}
function addTankToUnit(uid, name){
  const sv = getMapCur(); const u = sv.playerUnits.find(x => x.id === uid); if(!u) return;
  if(u.tanks.length >= 6){ toast('最多 6 辆'); return; }
  const uc = {}; sv.playerUnits.forEach(x => x.tanks.forEach(t => { const nm = tankName(t); uc[nm] = (uc[nm]||0)+1; }));
  const to = {}; (sv.ownedTanks||[]).forEach(t => { to[t.n] = (to[t.n]||0)+1; });
  if((uc[name]||0) >= (to[name]||0)){ toast('池子里没有了'); return; }
  const ac = tankMaxHpByName(name);
  const usedTankUids = new Set();
  sv.playerUnits.forEach(pu => pu.tanks.forEach(t => { if(t.tankUid) usedTankUids.add(t.tankUid); }));
  const owned = (sv.ownedTanks || []).find(x => x.n === name && !usedTankUids.has(x.uid));
  let exp = 0, tankUid = null;
  if(owned){ exp = owned.exp || 0; tankUid = owned.uid; }
  u.tanks.push({ tankUid, n: name, hp: ac, maxHp: ac, exp });
  persistMapSaves(); render();
}
function removeTankFromUnit(uid, i){ const sv = getMapCur(); const u = sv.playerUnits.find(x => x.id === uid); if(!u) return; u.tanks.splice(i, 1); persistMapSaves(); render(); }
function confirmSellMapTank(idx){
  const sv = getMapCur();
  const owned = sv.ownedTanks || [];
  const t = owned[idx]; if(!t) return;
  const name = t.n;
  if(ELITE_TANKS[name]){ toast('精英坦克不可回收'); return; }
  const lv = (TREES[sv.nation][name] && TREES[sv.nation][name].lv) || 1;
  const refund = Math.floor(tankCostMap(lv) * 0.25);
  const inUnitIds = [];
  sv.playerUnits.forEach(u => {
    if(u.tanks.some(ut => ut.tankUid === t.uid)) inUnitIds.push(u.id);
  });
  let msg = `卖出 ${name}？回收 +${refund} RP`;
  if(inUnitIds.length > 0){ msg = `⚠ ${name} 正在部队 ${inUnitIds.join('、')} 中\n\n卖出会同时从部队移除该坦克\n\n确认卖出？回收 +${refund} RP`; }
  if(!confirm(msg)) return;
  for(const u of sv.playerUnits){
    const i = u.tanks.findIndex(ut => ut.tankUid === t.uid);
    if(i >= 0){ u.tanks.splice(i, 1); break; }
  }
  owned.splice(idx, 1);
  sv.rp += refund;
  persistMapSaves(); render(); toast(`已卖出 ${name}`); SFX.coin();
}
function openMapRepair(uid){
  const sv = getMapCur(); const u = sv.playerUnits.find(x => x.id === uid);
  if(!u || u.tanks.length === 0){ toast('无坦克'); return; }
  let missingTotal = 0;
  u.tanks.forEach(t => { const o = normalizeTank(t); missingTotal += Math.max(0, o.maxHp - o.hp); });
  if(missingTotal <= 0){ toast('所有坦克满血，无需修理'); return; }
  const cost = Math.ceil(missingTotal * 0.1);
  if(sv.supply < cost){ toast(`补给不足（需 ${cost}）`); return; }
  if(!confirm(`修理全部坦克？\n缺失 ${missingTotal} 血，消耗 ${cost} 补给`)) return;
  u.tanks.forEach(t => { const o = normalizeTank(t); if(typeof t === 'object'){ t.hp = o.maxHp; t.maxHp = o.maxHp; } });
  sv.supply -= cost;
  persistMapSaves(); render(); toast(`已修理，消耗 ${cost} 补给`);
}
function openMapCommanderSelect(uid){
  const sv = getMapCur();
  const u = sv.playerUnits.find(x => x.id === uid);
  if(!u) return;
  const cmCfg = NATION_COMMANDERS[sv.nation] || {};
  const allCms = COMMANDERS.filter(c => c.nation === sv.nation);
  const unlocked = sv.unlockedCommanders || [];
  const isLarge = sv.cols >= 12;
  const isUnlocked = (c) => unlocked.includes(c.id) || c.id === cmCfg.initial || (isLarge && c.id === cmCfg.second);
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const listHTML = allCms.map(c => {
    const uo = isUnlocked(c);
    const active = u.commander === c.id;
    const usedBy = sv.playerUnits.filter(x => x.id !== uid && x.commander === c.id).map(x => x.id);
    const usedStr = usedBy.length ? `（当前 ${usedBy.join('/')}）` : '';
    const cls = ['cm-card'];
    if(active) cls.push('active');
    if(!uo) cls.push('locked');
    let descText;
    if(uo){ descText = c.desc + ' ' + usedStr; }
    else if(c.id === cmCfg.elite){ descText = '🔒 打赢精锐格解锁'; }
    else if(c.id === cmCfg.second){ descText = '🔒 仅大型地图（12×9）开局解锁'; }
    else { descText = '🔒 未解锁'; }
    const click = uo ? `onclick="setMapUnitCommander('${uid}','${c.id}')"` : '';
    return `<div class="${cls.join(' ')}" ${click}>
      <div class="cm-name">${c.name}${active?' ✓':''}</div>
      <div class="cm-desc">${descText}</div>
    </div>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🔄 换指挥官 · 部队 ${u.id}</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      指挥官来源：<br>
      · 开局赠送（小型/中型 1 个，大型 2 个）<br>
      · 打赢精锐格解锁第 3 个<br>
      切换时若被其他部队占用，将自动从原部队转移
    </div>
    <div class="cm-list">${listHTML}</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.cm-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function setMapUnitCommander(uid, cmId){
  const sv = getMapCur();
  const u = sv.playerUnits.find(x => x.id === uid);
  if(!u) return;
  const cm = COMMANDERS.find(c => c.id === cmId);
  if(!cm) return;
  sv.playerUnits.forEach(x => { if(x.id !== uid && x.commander === cmId) x.commander = null; });
  u.commander = cmId;
  persistMapSaves();
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  render(); toast(`已切换为 ${cm.name}`);
}
function addMapUnit(){
  const sv = getMapCur();
  if(sv.playerUnits.length >= 5){ toast('最多 5 支部队'); return; }
  if(sv.rp < 500){ toast('研发点不足（需 500）'); return; }
  if(!confirm('花费 500 RP 建立新部队？')) return;
  sv.rp -= 500;
  const sc = sv.cells.filter(c => c.type === 'start' && c.owner === 'player' && !sv.playerUnits.some(u => u.cell === c.id));
  const fallback = sv.cells.find(c => c.owner === 'player' && isCellPassable(c) && !sv.playerUnits.some(u => u.cell === c.id));
  const target = sc[0] || fallback;
  if(!target){ toast('找不到位置'); return; }
  let maxN = 0;
  sv.playerUnits.forEach(u => {
    const m = /^u(\d+)$/.exec(u.id);
    if(m) maxN = Math.max(maxN, parseInt(m[1], 10));
  });
  const newId = 'u' + (maxN + 1);
  sv.playerUnits.push({ id: newId, cell: target.id, commander: null, tanks: [], mp: 1, acted: false });
  persistMapSaves(); render(); toast(`已建立部队 ${newId}（空编制）`);
}
function openAIConfig(){
  const sv = getMapCur();
  if(!sv) return;
  const cfg = getAICfg(sv);
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🎚️ AI 难度设置</h3>
    <div class="settings-row"><span class="lbl">成长速度（级/回合）</span><input type="range" class="vol-slider" min="10" max="50" value="${Math.round(cfg.growthRate*100)}" oninput="setAICfg('growthRate', this.value/100)"><span class="vol-val" id="aiCfgGrowthVal">${cfg.growthRate.toFixed(2)}</span></div>
    <div class="settings-row"><span class="lbl">等级上限</span><input type="range" class="vol-slider" min="5" max="15" value="${cfg.maxLevel}" oninput="setAICfg('maxLevel', +this.value)"><span class="vol-val" id="aiCfgMaxLvVal">${cfg.maxLevel}</span></div>
    <div class="settings-row"><span class="lbl">增援间隔（回合）</span><input type="range" class="vol-slider" min="3" max="10" value="${cfg.reinforceInterval}" oninput="setAICfg('reinforceInterval', +this.value)"><span class="vol-val" id="aiCfgIntVal">${cfg.reinforceInterval}</span></div>
    <div class="settings-row"><span class="lbl">增援上限（支）</span><input type="range" class="vol-slider" min="1" max="5" value="${cfg.reinforceMax}" oninput="setAICfg('reinforceMax', +this.value)"><span class="vol-val" id="aiCfgMaxVal">${cfg.reinforceMax}</span></div>
    <div style="font-size:11px;color:#8ab88a;margin-top:8px">修改立即生效，已生成部队不受影响</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.cm-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function setAICfg(k, v){
  const sv = getMapCur();
  if(!sv) return;
  if(!sv.aiConfig) sv.aiConfig = { ...DEFAULT_AI_CONFIG };
  sv.aiConfig[k] = v;
  persistMapSaves();
  const idMap = { growthRate:'aiCfgGrowthVal', maxLevel:'aiCfgMaxLvVal', reinforceInterval:'aiCfgIntVal', reinforceMax:'aiCfgMaxVal' };
  const el = document.getElementById(idMap[k]);
  if(el) el.textContent = k === 'growthRate' ? v.toFixed(2) : v;
}
function renderMapTree(){
  let html = `<h1>🌳 地区 · 科技树</h1><div class="sub">独立解锁</div><div class="panel" style="padding:0">`;
  html += renderMapTreeContent();
  html += `<div class="btns" style="margin-top:8px"><button class="btn" onclick="M.screen='map';render()">← 返回地图</button><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
  return html;
}
function renderMapTreeContent(){
  const sv = getMapCur(); const tree = TREES[sv.nation]; if(!tree) return '';
  const has = n => !!sv.techProgress[n];
  return renderTreeHTML(tree, has, 'showMapTreeNode');
}
function showMapTreeNode(name){
  const sv = getMapCur(); const tree = TREES[sv.nation]; const node = tree[name]; const d = TANKS[name];
  if(!d || !node) return;
  const own = !!sv.techProgress[name];
  const ps = Object.keys(tree).filter(k => tree[k].ch.includes(name));
  const cb = ps.length === 0 || ps.some(p => sv.techProgress[p]);
  const baseCost = tankCostMap(node.lv);
  const halfCost = Math.floor(baseCost * 0.5);
  const oc = (sv.ownedTanks || []).filter(t => t.n === name).length;
  let acts = '';
  if(!own && cb) acts = `<button class="btn pri" onclick="buyMapTech('${name}')" ${sv.rp >= baseCost ? '' : 'disabled'}>解锁 (${baseCost} RP)</button>`;
  else if(own && oc < 3 && (sv.ownedTanks||[]).length < 60) acts = `<button class="btn pri" onclick="buyMapTech('${name}',true)" ${sv.rp >= halfCost ? '' : 'disabled'}>购买第${oc === 1 ? '二' : '三'}辆 (${halfCost})</button>`;
  else if(own) acts = `<div style="color:#8ab88a;font-size:12px">已解锁，${oc} 辆</div>`;
  else acts = `<div style="color:#ff8080;font-size:12px">前置未解锁</div>`;
  document.querySelectorAll('.detail').forEach(el=>el.remove());
  document.body.insertAdjacentHTML('beforeend', `<div class="detail" onclick="event.stopPropagation()">
    <h3>${TY_ICON[d.ty]} ${esc(name)} Lv${node.lv} ${TY_CN[d.ty]}</h3>
    <div class="stats"><div><span>火力</span><b>${d.fd}</b></div><div><span>攻击</span><b>${d.at}</b></div>
    <div><span>速度</span><b>${d.s}</b></div><div><span>穿深</span><b>${d.p}${d.heat?'*':''}</b></div>
    <div><span>装甲</span><b>${d.a}</b></div><div><span>活度</span><b>${d.ac}</b></div></div>
    <div class="acts"><button class="btn" onclick="closeDetail()">关闭</button>${acts}</div></div>`);
}
function buyMapTech(name, justBuy){
  const sv = getMapCur(); const node = TREES[sv.nation][name];
  const base = tankCostMap(node.lv);
  const cost = justBuy ? Math.floor(base * 0.5) : base;
  if(sv.rp < cost){ toast('研发点不足'); return; }
  if((sv.ownedTanks||[]).length >= 60){ toast('达上限'); return; }
  if(justBuy && (sv.ownedTanks||[]).filter(t => t.n === name).length >= 3){ toast('单车上限 3 辆'); return; }
  sv.rp -= cost; sv.techProgress[name] = true;
  sv.ownedTanks = sv.ownedTanks || []; sv.ownedTanks.push({ uid: makeTankUid(), n: name, exp: 0 });
  persistMapSaves(); closeDetail(); render(); toast(`已拥有 ${name}`); SFX.coin();
}
function buyEliteMapTank(name){
  const sv = getMapCur(); const p = ELITE_PRICES[name];
  if(!p) return;
  if(!(NATION_ELITE[sv.nation] || []).includes(name)){ toast('非本国精英'); return; }
  if((sv.ownedTanks||[]).some(t => t.n === name)){ toast('已拥有，被击毁后可再买'); return; }
  if(sv.rp < p){ toast(`研发点不足（需 ${p}）`); return; }
  if((sv.ownedTanks||[]).length >= 60){ toast('达上限'); return; }
  sv.rp -= p; sv.ownedTanks = sv.ownedTanks || []; sv.ownedTanks.push({ uid: makeTankUid(), n: name, exp: 0 });
  persistMapSaves(); render(); toast(`已购买 ${name}`); SFX.coin();
}
function renderMapSettings(){
  return `<div class="panel"><h3>⚙️ 设置</h3>
  ${settingsRowsHTML()}
  </div>
  <div class="btns" style="margin-top:auto"><button class="btn" onclick="M.screen='map';render()">← 返回地图</button><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
}