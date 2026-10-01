// ============================================================
// rogue.js — 远征模式（Roguelike）
// ============================================================

const ROGUE_TOTAL = 15;
const ROGUE_LAYER_H = 66;
const ROGUE_SETTINGS_KEY = 'tank_rogue_settings_v1';
const ROGUE_SAVE_KEY = 'tank_rogue_save_v1';
const ROGUE_DEAD_MAX = 60;
const ROGUE_ACTIVE_MAX = 6;
const ROGUE_BENCH_MAX = 60;

const ROGUE_EVENTS = [
  { id: 'gambler', title: '🎲 赌徒商人', desc: '一个神秘人摊开牌："敢赌吗？赢了你拿走，输了一场空。"',
    choices: [
      { label: '🎲 赌 100 RP 得随机坦克', cost: 100, effect: 'gambleTank' },
      { label: '🎲 赌 200 RP 得精英坦克', cost: 200, effect: 'gambleElite' },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'wreck', title: '🔧 废弃坦克', desc: '路边有一辆半埋的坦克，炮管还完好，也许能修。',
    choices: [
      { label: '🔧 花 80 RP 修复，加入仓库', cost: 80, effect: 'getTank' },
      { label: '💰 拆解卖零件 (+60 RP)', effect: 'gainRp', args: { amount: 60 } },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'veteran', title: '🎖 老兵', desc: '一位退役老兵想加入你的队伍。',
    choices: [
      { label: '🎖 接受（出战随机一辆 +300 exp）', effect: 'starUp' },
      { label: '💰 请他喝酒 (+80 RP)', effect: 'gainRp', args: { amount: 80 } },
      { label: '🚶 婉拒', effect: 'none' },
    ] },
  { id: 'spring', title: '💧 神秘泉水', desc: '一汪泛着微光的泉水，附近的草地格外翠绿。',
    choices: [
      { label: '❤️ 饮下（出战队伍回满血，-100 RP）', cost: 100, effect: 'healAll' },
      { label: '🎁 打捞（随机得 1 个指令）', effect: 'getTactic' },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'arms', title: '🛒 军火商', desc: '背着大包的商人拦住你："兄弟，要货吗？"',
    choices: [
      { label: '🎯 花 60 RP 买随机指令', cost: 60, effect: 'getTactic' },
      { label: '💰 花 40 RP 赌一把 (+100 RP)', cost: 40, effect: 'gambleRp', args: { amount: 100 } },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'hospital', title: '💊 战地医院', desc: '一个废弃的野战医疗站，器材还能用。',
    choices: [
      { label: '💊 花 100 RP 出战队伍回血 80%', cost: 100, effect: 'healAllPct', args: { pct: 0.8 } },
      { label: '🩹 花 50 RP 血量最低的回满', cost: 50, effect: 'healLowest' },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'airdrop', title: '📦 补给空投', desc: '天上掉下一个补给箱，还冒着烟。',
    choices: [
      { label: '💰 打开 (+150 RP)', effect: 'gainRp', args: { amount: 150 } },
      { label: '🎯 撬开（随机得 1 个指令）', effect: 'getTactic' },
      { label: '🎓 研究（出战队伍 +500 exp）', effect: 'expAll', args: { amount: 500 } },
    ] },
  { id: 'scout', title: '🕵️ 侦察情报', desc: '抓到一个落单的敌军侦察兵。',
    choices: [
      { label: '🔍 审问（出战队伍 +400 exp）', effect: 'expAll', args: { amount: 400 } },
      { label: '🎖 招降（获得 Lv8 坦克）', effect: 'getTank', args: { lv: 8 } },
      { label: '🔪 处理 (+50 RP)', effect: 'gainRp', args: { amount: 50 } },
    ] },
  { id: 'workshop', title: '🔧 修理厂', desc: '一个废弃的修理厂，工具散落一地。',
    choices: [
      { label: '🔧 修血量最低的一辆（免费回满）', effect: 'healLowest' },
      { label: '💰 拆零件 (+80 RP)', effect: 'gainRp', args: { amount: 80 } },
      { label: '🎁 翻找（30% 得指令）', effect: 'chanceTactic', args: { chance: 0.3 } },
    ] },
  { id: 'blackmarket', title: '🌑 黑市', desc: '有人悄悄拉你进巷子："用一辆换一辆，怎么样？"',
    choices: [
      { label: '🔄 用最低血的换随机精英', effect: 'swapLowestForElite' },
      { label: '💰 花 300 RP 买随机精英', cost: 300, effect: 'getElite' },
      { label: '🚶 离开', effect: 'none' },
    ] },
  { id: 'valhalla', title: '🕯 英灵殿', desc: '一座古老的神殿，据说能让亡者重生。',
    choices: [
      { label: '💰 花 200 RP 复活 1 辆（随机）', cost: 200, effect: 'reviveOne' },
      { label: '🎲 赌一把（50% 复活 1 辆）', effect: 'gambleRevive' },
      { label: '🚶 离开', effect: 'none' },
    ] },
];

let ROGUE_SETTINGS = (function(){
  try{
    const s = localStorage.getItem(ROGUE_SETTINGS_KEY);
    if(s){
      const o = JSON.parse(s);
      return {
        lvOff: typeof o.lvOff === 'number' ? o.lvOff : 0,
        cntOff: typeof o.cntOff === 'number' ? o.cntOff : 0,
        startRp: typeof o.startRp === 'number' ? o.startRp : 50,
        rewardMul: typeof o.rewardMul === 'number' ? o.rewardMul : 1.0,
      };
    }
  }catch(e){}
  return { lvOff: 0, cntOff: 0, startRp: 50, rewardMul: 1.0 };
})();
function saveRogueSettings(){ try{ localStorage.setItem(ROGUE_SETTINGS_KEY, JSON.stringify(ROGUE_SETTINGS)); }catch(e){} }
function setRogueSetting(k, v){
  ROGUE_SETTINGS[k] = v;
  saveRogueSettings();
  const idMap = { lvOff: 'rogLvOffVal', cntOff: 'rogCntOffVal', startRp: 'rogStartRpVal', rewardMul: 'rogRewardMulVal' };
  const el = document.getElementById(idMap[k]);
  if(el){
    if(k === 'lvOff' || k === 'cntOff') el.textContent = (v > 0 ? '+' : '') + v;
    else if(k === 'rewardMul') el.textContent = '×' + v.toFixed(1);
    else el.textContent = v;
  }
}

const RG = {
  seed: 0, phase: 1,
  layers: [], nodeMap: {},
  progress: { current: null, visited: [], cleared: false, failed: false },
  nation: '德',
  active: [], bench: [], dead: [],
  rp: 0, tacOwned: [], tacEquipped: [],
  _uid: 0,
  battleCtx: null, shopStock: null, currentEvent: null,
};

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rogueRand(seed){ return mulberry32(seed); }

// ---------- 地图生成 ----------
function generateRogueMap(seed){
  const rng = rogueRand(seed);
  const counts = [];
  for(let L = 0; L < ROGUE_TOTAL; L++){
    if(L === 0 || L === ROGUE_TOTAL - 1) counts.push(1);
    else counts.push(2 + Math.floor(rng() * 4));
  }
  const layers = [];
  for(let L = 0; L < ROGUE_TOTAL; L++){
    const count = counts[L];
    const nodes = [];
    for(let i = 0; i < count; i++){
      nodes.push({ id: `L${L}N${i}`, layer: L, idx: i, type: 'battle', next: [], prev: [] });
    }
    layers.push(nodes);
  }
  for(let L = 1; L < ROGUE_TOTAL; L++){
    const prevLayer = layers[L - 1], nextLayer = layers[L];
    const aCount = prevLayer.length, bCount = nextLayer.length;
    for(let i = 0; i < aCount; i++){
      const a = prevLayer[i];
      const lo = Math.floor(i * bCount / aCount);
      const hi = Math.ceil((i + 1) * bCount / aCount) - 1;
      const cands = [];
      for(let j = lo; j <= hi; j++) if(nextLayer[j]) cands.push(nextLayer[j]);
      if(cands.length === 0) cands.push(nextLayer[Math.min(bCount - 1, Math.max(0, lo))]);
      const numEdges = Math.min(cands.length, 1 + Math.floor(rng() * 2));
      const pool = cands.slice();
      for(let k = 0; k < numEdges && pool.length > 0; k++){
        const pickIdx = Math.floor(rng() * pool.length);
        const b = pool[pickIdx];
        pool.splice(pickIdx, 1);
        if(!a.next.includes(b.id)) a.next.push(b.id);
        if(!b.prev.includes(a.id)) b.prev.push(a.id);
      }
    }
    for(let j = 0; j < bCount; j++){
      const b = nextLayer[j];
      if(b.prev.length === 0){
        const iLo = Math.floor(j * aCount / bCount);
        const iHi = Math.ceil((j + 1) * aCount / bCount) - 1;
        const cands = [];
        for(let i = iLo; i <= iHi; i++) if(prevLayer[i]) cands.push(prevLayer[i]);
        if(cands.length === 0) cands.push(prevLayer[Math.min(aCount - 1, Math.max(0, iLo))]);
        const from = cands[Math.floor(rng() * cands.length)];
        if(!from.next.includes(b.id)) from.next.push(b.id);
        if(!b.prev.includes(from.id)) b.prev.push(from.id);
      }
    }
  }
  layers[0][0].type = 'start';
  layers[ROGUE_TOTAL - 1][0].type = 'boss';
  for(const n of layers[13]) n.type = 'rest';
  let lastElite = -99, lastShop = -99, lastRest = -99;
  for(let L = 1; L < ROGUE_TOTAL - 1; L++){
    if(L === 13) continue;
    const layer = layers[L];
    if(L >= 4 && L <= 12 && L - lastElite >= 2 && rng() < 0.4){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){ cands[Math.floor(rng() * cands.length)].type = 'elite'; lastElite = L; }
    }
    if(L >= 3 && L <= 13 && L - lastShop >= 3 && rng() < 0.45){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){ cands[Math.floor(rng() * cands.length)].type = 'shop'; lastShop = L; }
    }
    if(L >= 2 && L <= 12 && L - lastRest >= 3 && rng() < 0.45){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){ cands[Math.floor(rng() * cands.length)].type = 'rest'; lastRest = L; }
    }
    for(const n of layer) if(n.type === 'battle' && rng() < 0.25) n.type = 'event';
  }
  const hasType = t => layers.some(layer => layer.some(n => n.type === t));
  if(!hasType('shop')){
    for(let L = 5; L < 12; L++){
      const cands = layers[L].filter(n => n.type === 'battle');
      if(cands.length > 0){ cands[0].type = 'shop'; break; }
    }
  }
  if(!hasType('rest')){
    for(let L = 5; L < 12; L++){
      const cands = layers[L].filter(n => n.type === 'battle' || n.type === 'event');
      if(cands.length > 0){ cands[0].type = 'rest'; break; }
    }
  }
  const nodeMap = {};
  for(const layer of layers) for(const n of layer) nodeMap[n.id] = n;
  return { seed, layers, nodeMap };
}

// ---------- 开局 / 暂离 ----------
function goRogue(){
  const saved = loadRogueRun();
  if(saved){
    const total = (saved.active || []).length + (saved.bench || []).length;
    const msg = `检测到暂离的远征\n\n第 ${saved.phase || 1} 面 · 队伍 ${total} 辆 · ${saved.rp || 0} RP\n\n【确定】继续远征\n【取消】新开一局（旧进度丢失）`;
    if(confirm(msg)){ restoreRogueRun(saved); return; }
    clearRogueRun();
  }
  S.screen = 'rogueStart'; M.screen = 'none'; render();
}
function saveRogueRun(){
  try{
    const data = {
      seed: RG.seed, phase: RG.phase,
      layers: RG.layers, nodeMap: RG.nodeMap,
      progress: RG.progress, nation: RG.nation,
      active: RG.active, bench: RG.bench, dead: RG.dead,
      rp: RG.rp, tacOwned: RG.tacOwned, tacEquipped: RG.tacEquipped,
      _uid: RG._uid, savedAt: Date.now(),
    };
    localStorage.setItem(ROGUE_SAVE_KEY, JSON.stringify(data));
    return true;
  }catch(e){ return false; }
}
function loadRogueRun(){
  try{
    const s = localStorage.getItem(ROGUE_SAVE_KEY);
    if(!s) return null;
    return JSON.parse(s);
  }catch(e){ return null; }
}
function restoreRogueRun(data){
  RG.seed = data.seed || 0;
  RG.phase = data.phase || 1;
  RG.layers = data.layers || [];
  RG.nodeMap = data.nodeMap || {};
  RG.progress = data.progress || { current: 'L0N0', visited: ['L0N0'], cleared: false, failed: false };
  RG.nation = data.nation || '德';
  RG.active = data.active || [];
  RG.bench = data.bench || [];
  RG.dead = data.dead || [];
  RG.rp = data.rp || 0;
  RG.tacOwned = data.tacOwned || [];
  RG.tacEquipped = data.tacEquipped || [];
  RG._uid = data._uid || 0;
  RG.battleCtx = null; RG.shopStock = null; RG.currentEvent = null;
  S.screen = 'rogueMap'; M.screen = 'none';
  render();
  toast('已恢复远征');
  if(RG.phase === 1.5){
    RG.phase = 1;
    setTimeout(() => {
      if(confirm('第一面已完成，进入第二面？')) enterPhase2();
      else { clearRogueRun(); S.screen = 'rogueStart'; render(); }
    }, 200);
  }
}
function clearRogueRun(){ try{ localStorage.removeItem(ROGUE_SAVE_KEY); }catch(e){} }
function suspendRogueRun(){
  if(saveRogueRun()){
    toast('已暂离 · 下次进远征可继续');
    S.screen = 'main'; M.screen = 'main'; render();
  } else toast('暂离失败');
}

function selectRogueNation(n){
  RG.nation = n;
  RG.phase = 1;
  RG.seed = Math.floor(Math.random() * 1e9);
  const map = generateRogueMap(RG.seed);
  RG.layers = map.layers;
  RG.nodeMap = map.nodeMap;
  RG.progress = { current: 'L0N0', visited: ['L0N0'], cleared: false, failed: false };
  RG.rp = ROGUE_SETTINGS.startRp;
  RG._uid = 0;
  RG.tacOwned = ['volley','apround','smoke','repair'];
  RG.tacEquipped = ['volley','smoke'];
  RG.active = pickRogueStarterTanks(n);
  RG.bench = []; RG.dead = [];
  RG.battleCtx = null; RG.shopStock = null; RG.currentEvent = null;
  clearRogueRun();
  S.screen = 'rogueMap';
  render();
}
function pickRogueStarterTanks(nation){
  const tree = TREES[nation];
  const pool = [];
  for(const name in tree){ if(tree[name].lv <= 2) pool.push(name); }
  const team = [];
  const used = new Set();
  for(let i = 0; i < 3; i++){
    let tries = 0, name;
    do { name = pool[Math.floor(Math.random() * pool.length)]; tries++; } while(used.has(name) && tries < 30);
    used.add(name);
    team.push(makeRogueTankObj(name));
  }
  return team;
}
function makeRogueTankObj(n){
  const ac = tankMaxHpByName(n);
  return { tankUid: 'rg' + (RG._uid++), n, hp: ac, maxHp: ac, exp: 0 };
}
function addToDead(tank){
  RG.dead.push(tank);
  while(RG.dead.length > ROGUE_DEAD_MAX) RG.dead.shift();
}
function addToBench(t){
  if(RG.bench.length >= ROGUE_BENCH_MAX){ return false; }
  RG.bench.push(t);
  return true;
}
function leaveRogueRun(){
  if(!confirm('放弃远征？本局进度将丢失。')) return;
  clearRogueRun();
  S.screen = 'main'; M.screen = 'main';
  render();
}

// ---------- 开局页 ----------
function renderRogueStart(){
  const lvOff = ROGUE_SETTINGS.lvOff;
  const cntOff = ROGUE_SETTINGS.cntOff;
  const startRp = ROGUE_SETTINGS.startRp;
  const rewardMul = ROGUE_SETTINGS.rewardMul;
  let html = `<h1>🎲 远征 · Roguelike</h1>
  <div class="sub">双面 · 共 30 层 · 全灭即失败 · 不写回全局存档</div>
  <div class="panel" style="margin-top:14px">
    <h3>选择出征国家（决定开局 3 辆坦克的国籍）</h3>
    <div class="nations">`;
  ['德','美','苏'].forEach(n => {
    const nc = NAT_COLOR[n];
    const tree = TREES[n];
    const lv12 = Object.keys(tree).filter(k => tree[k].lv <= 2).slice(0, 4).join(' / ');
    html += `<div class="nation" style="border-color:${nc.c};--c1:${nc.c1};--c2:${nc.c2}" onclick="selectRogueNation('${n}')">
      <h3 style="color:${nc.c}">${NAT_NAME[n]}</h3>
      <p>开局：3 辆 ${NAT_NAME[n]} Lv1-2 坦克</p>
      <p style="font-size:11px;opacity:.6;margin-top:4px">例：${lv12}</p>
    </div>`;
  });
  html += `</div></div>
  <div class="panel"><h3>难度设置</h3>
    <div class="settings-row">
      <span class="lbl">敌人等级偏移</span>
      <input type="range" class="vol-slider" min="-2" max="2" step="1" value="${lvOff}" oninput="setRogueSetting('lvOff', +this.value)">
      <span class="vol-val" id="rogLvOffVal">${lvOff > 0 ? '+' : ''}${lvOff}</span>
    </div>
    <div class="settings-row">
      <span class="lbl">敌人数量偏移</span>
      <input type="range" class="vol-slider" min="-1" max="1" step="1" value="${cntOff}" oninput="setRogueSetting('cntOff', +this.value)">
      <span class="vol-val" id="rogCntOffVal">${cntOff > 0 ? '+' : ''}${cntOff}</span>
    </div>
    <div class="settings-row">
      <span class="lbl">开局临时 RP</span>
      <input type="range" class="vol-slider" min="0" max="150" step="10" value="${startRp}" oninput="setRogueSetting('startRp', +this.value)">
      <span class="vol-val" id="rogStartRpVal">${startRp}</span>
    </div>
    <div class="settings-row">
      <span class="lbl">战斗奖励倍率</span>
      <input type="range" class="vol-slider" min="50" max="200" step="10" value="${Math.round(rewardMul*100)}" oninput="setRogueSetting('rewardMul', +this.value/100)">
      <span class="vol-val" id="rogRewardMulVal">×${rewardMul.toFixed(1)}</span>
    </div>
  </div>
  <div class="panel" style="font-size:12px;color:#8ab88a;line-height:1.7">
    <b style="color:#ffd76e">规则</b><br>
    · 双面结构：第一面 Lv1-8，第二面 Lv6-15<br>
    · 每面第 14 层固定整层篝火，第 15 层 Boss<br>
    · 战斗中阵亡的坦克进入阵亡池，可通过篝火/事件/商店复活<br>
    · 打赢后可从被击毁的敌人中俘获坦克（半血 · 进仓库）<br>
    · 全队全灭 = 本局失败<br>
    · 可暂离保存进度
  </div>
  <div class="btns" style="margin-top:auto"><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
  return html;
}

// ---------- 地图渲染 ----------
function rogueNodeClass(n){
  const p = RG.progress;
  const cls = ['rogue-node', n.type];
  if(p.visited.includes(n.id)) cls.push('visited');
  if(p.current === n.id) cls.push('current');
  const cur = RG.nodeMap[p.current];
  if(cur && cur.next.includes(n.id)) cls.push('available');
  return cls.join(' ');
}
function renderRogueMap(){
  const TOTAL = ROGUE_TOTAL;
  const LAYER_H = ROGUE_LAYER_H;
  const canvasH = TOTAL * LAYER_H + 40;
  const appW = Math.min(window.innerWidth, 900) - 40;
  const canvasW = Math.max(280, appW);
  const NODE_R = 23;
  const MAX_NODES = 5;
  const NODE_SPACING_MAX = 94;
  const maxW = canvasW - 16;
  const maxSpacing = (maxW - NODE_R * 2) / (MAX_NODES - 1);
  const spacing = Math.max(46, Math.min(NODE_SPACING_MAX, maxSpacing));
  const pos = {};
  for(const layer of RG.layers){
    const count = layer.length;
    const layerWidth = (count - 1) * spacing;
    const startX = (canvasW - layerWidth) / 2;
    for(let i = 0; i < count; i++){
      const n = layer[i];
      const isBoss = n.type === 'boss';
      pos[n.id] = { x: startX + i * spacing, y: (TOTAL - 1 - n.layer) * LAYER_H + 40, r: isBoss ? 35 : NODE_R };
    }
  }
  let svgLines = '';
  const visitedEdges = new Set();
  for(let i = 0; i < RG.progress.visited.length - 1; i++){
    visitedEdges.add(RG.progress.visited[i] + '>' + RG.progress.visited[i + 1]);
  }
  for(const layer of RG.layers){
    for(const n of layer){
      for(const nid of n.next){
        const a = pos[n.id], b = pos[nid];
        if(!a || !b) continue;
        const isVisited = visitedEdges.has(n.id + '>' + nid);
        const isActive = RG.progress.current === n.id;
        const cls = 'rogue-edge' + (isVisited ? ' visited' : (isActive ? ' active' : ''));
        const midY = (a.y + b.y) / 2;
        const d = `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
        svgLines += `<path d="${d}" class="${cls}"/>`;
      }
    }
  }
  let nodeHTML = '';
  const ICON = { start:'🚩', battle:'⚔️', elite:'💀', boss:'👑', shop:'🏪', rest:'🔥', event:'🎁' };
  const LABEL = { start:'起点', battle:'战斗', elite:'精英', boss:'Boss', shop:'商店', rest:'篝火', event:'事件' };
  for(const layer of RG.layers){
    for(const n of layer){
      const p = pos[n.id];
      nodeHTML += `<div class="${rogueNodeClass(n)}" style="left:${p.x}px;top:${p.y}px;width:${p.r*2}px;height:${p.r*2}px;margin-left:-${p.r}px;margin-top:-${p.r}px" onclick="clickRogueNode('${n.id}')">
        <div class="rn-icon">${ICON[n.type] || '⚔️'}</div>
        <div class="rn-label">${LABEL[n.type] || '战斗'}</div>
      </div>`;
    }
  }
  const curLayer = RG.nodeMap[RG.progress.current] ? RG.nodeMap[RG.progress.current].layer : 0;
  const tacNames = RG.tacEquipped.map(id => { const t = TACTICALS.find(x => x.id === id); return t ? t.name : '?'; }).join(' · ');
  const lvStr = ROGUE_SETTINGS.lvOff !== 0 ? ` · Lv${ROGUE_SETTINGS.lvOff>0?'+':''}${ROGUE_SETTINGS.lvOff}` : '';
  let html = `<div class="rogue-hud">
    <div><b style="color:#c86bff">第 ${RG.phase} 面 · ${curLayer + 1}/${ROGUE_TOTAL} 层</b> · 💰 <b>${RG.rp}</b>${lvStr}</div>
    <div>出战 ${RG.active.length}/${ROGUE_ACTIVE_MAX}</div>
  </div>
  <div class="panel" style="padding:0;overflow:hidden;flex-shrink:0">
    <div class="rogue-map-wrap" style="height:52vh;min-height:340px">
      <div class="rogue-map-canvas" style="width:${canvasW}px;height:${canvasH}px;position:relative;margin:0 auto">
        <svg class="rogue-svg" width="${canvasW}" height="${canvasH}">${svgLines}</svg>
        ${nodeHTML}
      </div>
    </div>
  </div>
  <div class="panel"><h3>出战队伍 (${RG.active.length}/${ROGUE_ACTIVE_MAX})</h3>
    <div class="rogue-team-list">${RG.active.map(renderRogueTeamChip).join('') || '<div class="empty-hint">没有出战坦克</div>'}</div>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="openRogueTeamModal()">⚙ 编队 · 仓库 ${RG.bench.length} · 阵亡 ${RG.dead.length}</button>
  </div>
  <div class="panel"><h3>🎯 当前指令</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:8px">已装备：<b style="color:#ffd76e">${tacNames || '无'}</b></div>
    <button class="btn ghost" style="width:100%" onclick="openRogueTacticalModal()">⚙ 编辑指令（已拥有 ${RG.tacOwned.length}/12）</button>
  </div>
  <div class="btns" style="margin-top:auto">
    <button class="btn pri" onclick="suspendRogueRun()">💾 暂离</button>
    <button class="btn ghost" onclick="openRogueSettings()">⚙ 设置</button>
    <button class="btn" onclick="leaveRogueRun()">← 放弃远征</button>
  </div>`;
  setTimeout(() => {
    const wrap = document.querySelector('.rogue-map-wrap');
    const curNode = document.querySelector('.rogue-node.current');
    if(!wrap || !curNode) return;
    const nodeTop = curNode.offsetTop;
    const wrapH = wrap.clientHeight;
    const bottomPad = 60;
    let target = nodeTop + bottomPad - wrapH;
    if(nodeTop < wrapH - bottomPad) target = 0;
    const maxScroll = wrap.scrollHeight - wrapH;
    wrap.scrollTop = Math.max(0, Math.min(maxScroll, target));
  }, 80);
  return html;
}
function openRogueSettings(){
  document.querySelectorAll('.rogue-set-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-set-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const vp = Math.round(SFX.volume * 100);
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>⚙ 设置</h3>
    <div class="settings-row"><span class="lbl">音效</span><div class="toggle ${SFX.enabled?'on':''}" onclick="rogueToggleSfx()"></div></div>
    <div class="settings-row"><span class="lbl">音量</span><input type="range" class="vol-slider" min="0" max="100" value="${vp}" oninput="setSfxVolume(this.value)" ${SFX.enabled?'':'disabled'}><span class="vol-val" id="volVal">${vp}%</span></div>
    <div class="settings-row"><span class="lbl">战斗倍速</span><div class="toggle ${BATTLE_SPEED?'on':''}" onclick="rogueToggleSpeed()"></div></div>
    <div class="settings-row"><span class="lbl">战斗自动</span><div class="toggle ${AUTO_BATTLE_CONTINUOUS?'on':''}" onclick="rogueToggleAuto()"></div></div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.cm-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function rogueToggleSfx(){
  if(!SFX.enabled){ SFX.init(); SFX.resume(); SFX.enabled = true; SFX.click(); }
  else SFX.enabled = false;
  saveSettings();
  openRogueSettings();
}
function rogueToggleSpeed(){ BATTLE_SPEED = !BATTLE_SPEED; saveSettings(); openRogueSettings(); }
function rogueToggleAuto(){ AUTO_BATTLE_CONTINUOUS = !AUTO_BATTLE_CONTINUOUS; saveSettings(); openRogueSettings(); }
function renderRogueTeamChip(t){
  const d = TANKS[t.n] || ELITE_TANKS[t.n];
  if(!d) return '';
  const st = getStar(t.exp || 0);
  const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
  const hpPct = Math.round(t.hp / t.maxHp * 100);
  const hpCls = hpPct < 30 ? 'low' : hpPct < 70 ? 'mid' : '';
  const expPct = expProgressPct(t.exp || 0);
  const expFull = st >= 3 ? ' full' : '';
  return `<div class="rogue-team-chip">
    <div class="rtc-header">
      <span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span>
      <span class="rtc-hp">${t.hp}/${t.maxHp}</span>
    </div>
    <div class="rtc-bars">
      <div class="mini-hp ${hpCls}"><i style="width:${hpPct}%"></i></div>
      <div class="exp-bar${expFull}"><i style="width:${expPct}%"></i></div>
    </div>
  </div>`;
}

function clickRogueNode(id){
  if(RG.progress.cleared || RG.progress.failed){ toast('本局已结束'); return; }
  const n = RG.nodeMap[id];
  if(!n) return;
  const p = RG.progress;
  if(p.visited.includes(id)){ toast('已经走过这个节点'); return; }
  const cur = RG.nodeMap[p.current];
  if(!cur || !cur.next.includes(id)){ toast('不可达，只能走连线相邻节点'); return; }
  if(n.type === 'battle' || n.type === 'elite' || n.type === 'boss'){
    startRogueBattle(id);
    return;
  }
  p.current = id;
  p.visited.push(id);
  render();
  if(n.type === 'shop') setTimeout(() => openRogueShop(), 40);
  else if(n.type === 'rest') setTimeout(() => openRogueRest(), 40);
  else if(n.type === 'event') setTimeout(() => openRogueEvent(), 40);
}

// ---------- 编队弹窗 ----------
function openRogueTeamModal(){
  document.querySelectorAll('.rogue-team-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-team-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const activeHTML = RG.active.length > 0
    ? `<div class="tank-list">${RG.active.map((t) => {
        const d = TANKS[t.n] || ELITE_TANKS[t.n]; if(!d) return '';
        const st = getStar(t.exp || 0);
        const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
        return `<div class="tank-chip sel" onclick="moveRogueTank('${t.tankUid}','bench')"><span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span> ×</div>`;
      }).join('')}</div>`
    : '<div class="empty-hint">没有出战坦克</div>';
  const benchHTML = RG.bench.length > 0
    ? `<div class="tank-list">${RG.bench.map((t) => {
        const d = TANKS[t.n] || ELITE_TANKS[t.n]; if(!d) return '';
        const st = getStar(t.exp || 0);
        const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
        return `<div class="tank-chip" onclick="moveRogueTank('${t.tankUid}','active')"><span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span> ＋</div>`;
      }).join('')}</div>`
    : '<div class="empty-hint">仓库为空</div>';
  const deadHTML = RG.dead.length > 0
    ? `<div class="tank-list">${RG.dead.map(t => {
        const d = TANKS[t.n] || ELITE_TANKS[t.n]; if(!d) return '';
        const st = getStar(t.exp || 0);
        const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
        return `<div class="tank-chip" style="cursor:default;opacity:.7;border-color:#5a2a2a"><span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span></div>`;
      }).join('')}</div>
      <div style="font-size:11px;color:#5a6a5a;margin-top:6px">可通过篝火、事件或商店复活</div>`
    : '<div class="empty-hint">没有阵亡坦克</div>';
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>⚙ 编队</h3>
    <div class="rogue-team-section">
      <h4>出战队伍 (${RG.active.length}/${ROGUE_ACTIVE_MAX}) · 点击移回仓库</h4>
      ${activeHTML}
    </div>
    <div class="rogue-team-section">
      <h4>仓库 (${RG.bench.length}/${ROGUE_BENCH_MAX}) · 点击加入出战</h4>
      ${benchHTML}
    </div>
    <div class="rogue-team-section">
      <h4>阵亡池 (${RG.dead.length}/${ROGUE_DEAD_MAX})</h4>
      ${deadHTML}
    </div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.cm-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function moveRogueTank(uid, target){
  const srcArr = target === 'active' ? RG.bench : RG.active;
  const dstArr = target === 'active' ? RG.active : RG.bench;
  const idx = srcArr.findIndex(t => t.tankUid === uid);
  if(idx < 0){ toast('找不到该坦克'); return; }
  if(target === 'active' && RG.active.length >= ROGUE_ACTIVE_MAX){ toast('出战已满，先移出一辆'); return; }
  if(target === 'bench' && RG.active.length <= 1){ toast('至少保留 1 辆出战'); return; }
  const t = srcArr.splice(idx, 1)[0];
  dstArr.push(t);
  toast(target === 'active' ? `↑ ${t.n} 加入出战` : `↓ ${t.n} 移回仓库`);
  openRogueTeamModal();
  render();
}

// ---------- 指令面板 ----------
function openRogueTacticalModal(){
  document.querySelectorAll('.rogue-tac-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-tac-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const eqSet = new Set(RG.tacEquipped);
  const ownedSet = new Set(RG.tacOwned);
  const cards = TACTICALS.map(t => {
    const isOwned = ownedSet.has(t.id);
    const isEq = eqSet.has(t.id);
    const cls = ['tac-card'];
    if(isEq) cls.push('active');
    if(!isOwned) cls.push('locked');
    const click = isOwned ? `onclick="rogueToggleTac('${t.id}')"` : '';
    return `<div class="${cls.join(' ')}" ${click}>
      <div class="tc-tier t${t.tier}">T${t.tier}</div>
      <div class="tc-name">${t.icon} ${t.name}${isEq?' ✓':''}</div>
      <div class="tc-desc">${t.desc}</div>
      ${!isOwned ? `<div class="tc-price">未拥有</div>` : ''}
    </div>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🎯 战术指令 · ${RG.tacEquipped.length}/2</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      每场战斗最多装备 2 个。战斗中用一次即消耗（本场），下场重新可用。<br>
      <span style="color:#ffd76e">拥有的指令：${RG.tacOwned.length}/12</span>
    </div>
    <div class="tac-grid">${cards}</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.rogue-tac-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function rogueToggleTac(id){
  if(!RG.tacOwned.includes(id)) return;
  const idx = RG.tacEquipped.indexOf(id);
  if(idx >= 0){ RG.tacEquipped.splice(idx, 1); }
  else {
    if(RG.tacEquipped.length >= 2){ toast('最多装备 2 个'); return; }
    RG.tacEquipped.push(id);
  }
  openRogueTacticalModal();
  render();
}

// ---------- 商店 ----------
function generateRogueShopStock(){
  const lv = (RG.nodeMap[RG.progress.current]?.layer || 0) + 1;
  const tankLv = Math.max(1, Math.min(15, lv + ROGUE_SETTINGS.lvOff));
  const tankCost = 100 + tankLv * 15;
  return [
    { id: 'repair_full', icon: '🔧', label: '全队修理', desc: '出战队伍全部回满血', cost: 150, action: 'shopHealAll' },
    { id: 'revive', icon: '🕯', label: '复活券', desc: '从阵亡池复活 1 辆到仓库', cost: 250, action: 'shopRevive' },
    { id: 'tactic', icon: '🎯', label: '随机指令', desc: '获得一个未拥有的战术指令', cost: 80, action: 'shopGetTactic' },
    { id: 'star', icon: '🎖', label: '车组强化', desc: '出战队伍随机 1 辆 +300 exp', cost: 200, action: 'shopStarUp' },
    { id: 'tank', icon: '🚀', label: `随机坦克 Lv${tankLv}`, desc: '加入仓库', cost: tankCost, action: 'shopGetTank' },
  ].map(it => ({ ...it, sold: false }));
}
function openRogueShop(){
  RG.shopStock = generateRogueShopStock();
  renderRogueShopModal();
}
function renderRogueShopModal(){
  document.querySelectorAll('.rogue-shop-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-shop-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const itemsHTML = RG.shopStock.map((it, i) => {
    const canAfford = RG.rp >= it.cost;
    const cls = ['shop-item'];
    if(it.sold) cls.push('sold');
    if(!canAfford && !it.sold) cls.push('disabled');
    const isRevive = it.action === 'shopRevive';
    const reviveDisabled = isRevive && RG.dead.length === 0;
    const btn = it.sold
      ? '<span class="shop-tag">已售</span>'
      : `<button class="btn ghost sm" ${(canAfford && !reviveDisabled)?'':'disabled'} onclick="buyRogueShopItem(${i})">${it.cost} RP</button>`;
    return `<div class="${cls.join(' ')}">
      <div class="shop-icon">${it.icon}</div>
      <div class="shop-info">
        <div class="shop-name">${it.label}</div>
        <div class="shop-desc">${it.desc}${reviveDisabled?'（阵亡池为空）':''}</div>
      </div>
      <div class="shop-action">${btn}</div>
    </div>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🏪 补给站</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px">临时 RP：<b style="color:#ffd76e">${RG.rp}</b></div>
    <div class="shop-list">${itemsHTML}</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.rogue-shop-modal').remove()">离开商店</button>
  </div>`;
  document.body.appendChild(div);
}
function buyRogueShopItem(i){
  const it = RG.shopStock[i];
  if(!it || it.sold) return;
  if(RG.rp < it.cost){ toast('临时RP不足'); return; }
  if(it.action === 'shopRevive' && RG.dead.length === 0){ toast('阵亡池为空'); return; }
  RG.rp -= it.cost;
  it.sold = true;
  applyRogueShopEffect(it.action);
  renderRogueShopModal();
  render();
}
function applyRogueShopEffect(action){
  const lv = (RG.nodeMap[RG.progress.current]?.layer || 0) + 1;
  switch(action){
    case 'shopHealAll':
      RG.active.forEach(t => t.hp = t.maxHp);
      toast('出战队伍回满血'); break;
    case 'shopRevive': {
      const i = Math.floor(Math.random() * RG.dead.length);
      const t = RG.dead.splice(i, 1)[0];
      const ac = tankMaxHpByName(t.n);
      addToBench({ tankUid: t.tankUid, n: t.n, hp: ac, maxHp: ac, exp: t.exp || 0 });
      toast(`复活 ${t.n} → 仓库`);
      break;
    }
    case 'shopGetTactic': {
      const t = pickRandomNewRogueTactic();
      if(t){ RG.tacOwned.push(t); toast(`获得指令：${TACTICALS.find(x=>x.id===t).name}`); }
      else toast('没有未拥有的指令了');
      break;
    }
    case 'shopStarUp':
      if(RG.active.length > 0){
        const t = RG.active[Math.floor(Math.random() * RG.active.length)];
        t.exp = (t.exp || 0) + 300;
        toast(`${t.n} +300 exp`);
      }
      break;
    case 'shopGetTank': {
      const n = pickRandomRogueTank(lv + ROGUE_SETTINGS.lvOff);
      if(n){
        if(!addToBench(makeRogueTankObj(n))) toast('仓库已满');
        else toast(`获得 ${n} → 仓库`);
      }
      break;
    }
  }
}
function pickRandomNewRogueTactic(){
  const owned = new Set(RG.tacOwned);
  const avail = TACTICALS.filter(t => !owned.has(t.id)).map(t => t.id);
  if(avail.length === 0) return null;
  return avail[Math.floor(Math.random() * avail.length)];
}
function pickRandomRogueTank(lv){
  const pool = [];
  for(const nat of ['德','美','苏']){
    const tree = TREES[nat];
    for(const name in tree){
      if(Math.abs(tree[name].lv - lv) <= 1.5) pool.push(name);
    }
  }
  if(pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickRandomRogueEliteTank(){
  const elites = [];
  for(const nat of ['德','美','苏']){
    for(const name of (NATION_ELITE[nat] || [])) elites.push(name);
  }
  return elites[Math.floor(Math.random() * elites.length)];
}

// ---------- 篝火（三选一） ----------
function openRogueRest(){
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
  const canRevive = RG.dead.length > 0;
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-rest-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🔥 篝火</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:12px">休整一下，三选一：</div>
    <div class="rest-choices">
      <button class="btn rest-choice" onclick="pickRogueRest('heal')">
        <div class="rc-icon">❤️</div>
        <div class="rc-name">出战队伍恢复 50%</div>
        <div class="rc-desc">每辆出战坦克恢复 50% 最大血量</div>
      </button>
      <button class="btn rest-choice" onclick="pickRogueRest('exp')">
        <div class="rc-icon">🎖</div>
        <div class="rc-name">出战队伍 +400 exp</div>
        <div class="rc-desc">每辆出战坦克 +400 经验</div>
      </button>
      <button class="btn rest-choice" ${canRevive?'':'disabled'} onclick="pickRogueRest('revive')">
        <div class="rc-icon">🕯</div>
        <div class="rc-name">复活 1 辆阵亡坦克</div>
        <div class="rc-desc">${canRevive ? '从阵亡池选择 1 辆复活到仓库（满血）' : '阵亡池为空'}</div>
      </button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function pickRogueRest(kind){
  if(kind === 'heal'){
    RG.active.forEach(t => t.hp = Math.min(t.maxHp, Math.round(t.hp + t.maxHp * 0.5)));
    toast('出战队伍恢复 50%');
    document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
    render();
  } else if(kind === 'exp'){
    RG.active.forEach(t => t.exp = (t.exp || 0) + 400);
    toast('出战队伍 +400 exp');
    document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
    render();
  } else if(kind === 'revive'){
    if(RG.dead.length === 0){ toast('阵亡池为空'); return; }
    if(RG.dead.length === 1){ restReviveTank(0); return; }
    openRogueRestRevivePicker();
  }
}
function openRogueRestRevivePicker(){
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-rest-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const listHTML = RG.dead.map((t, i) => {
    const d = TANKS[t.n] || ELITE_TANKS[t.n];
    if(!d) return '';
    const st = getStar(t.exp || 0);
    const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
    return `<div class="cm-card" onclick="restReviveTank(${i})">
      <div class="cm-name"><span class="tank-name" data-star="${st}">${esc(t.n)}${stars}</span></div>
      <div class="cm-desc">${t.exp || 0} 经验</div>
    </div>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🕯 复活阵亡坦克</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px">选择 1 辆复活到仓库（满血）</div>
    <div class="cm-list">${listHTML}</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="openRogueRest()">← 返回</button>
  </div>`;
  document.body.appendChild(div);
}
function restReviveTank(i){
  const t = RG.dead[i];
  if(!t) return;
  if(RG.bench.length >= ROGUE_BENCH_MAX){ toast('仓库已满'); return; }
  RG.dead.splice(i, 1);
  const ac = tankMaxHpByName(t.n);
  addToBench({ tankUid: t.tankUid, n: t.n, hp: ac, maxHp: ac, exp: t.exp || 0 });
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
  toast(`复活 ${t.n} → 仓库`);
  render();
}

// ---------- 事件 ----------
function openRogueEvent(){
  RG.currentEvent = ROGUE_EVENTS[Math.floor(Math.random() * ROGUE_EVENTS.length)];
  renderRogueEventModal();
}
function renderRogueEventModal(){
  document.querySelectorAll('.rogue-event-modal').forEach(el => el.remove());
  const ev = RG.currentEvent;
  if(!ev) return;
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-event-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const choicesHTML = ev.choices.map((c, i) => {
    const canAfford = !c.cost || RG.rp >= c.cost;
    const costStr = c.cost ? ` <span style="color:#ffd76e">(${c.cost} RP)</span>` : '';
    return `<button class="btn event-choice" ${canAfford?'':'disabled'} onclick="pickRogueEventChoice(${i})">${c.label}${costStr}</button>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>${ev.title}</h3>
    <div style="font-size:13px;color:#c8d4ee;line-height:1.6;margin-bottom:12px">${ev.desc}</div>
    <div class="event-choices">${choicesHTML}</div>
  </div>`;
  document.body.appendChild(div);
}
function pickRogueEventChoice(i){
  const ev = RG.currentEvent;
  if(!ev) return;
  const c = ev.choices[i];
  if(!c) return;
  if(c.cost && RG.rp < c.cost){ toast('临时RP不足'); return; }
  if(c.cost) RG.rp -= c.cost;
  applyRogueEventEffect(c);
  document.querySelectorAll('.rogue-event-modal').forEach(el => el.remove());
  RG.currentEvent = null;
  render();
}
function applyRogueEventEffect(c){
  const layerLv = (RG.nodeMap[RG.progress.current]?.layer || 0) + 1;
  switch(c.effect){
    case 'none': break;
    case 'gainRp': {
      const amt = (c.args && c.args.amount) || 0;
      RG.rp += amt; toast(`+${amt} 临时RP`); break;
    }
    case 'getTank': {
      const lv = (c.args && c.args.lv) || (layerLv + ROGUE_SETTINGS.lvOff);
      const n = pickRandomRogueTank(lv);
      if(n){
        if(!addToBench(makeRogueTankObj(n))) toast('仓库已满');
        else toast(`获得 ${n} → 仓库`);
      }
      break;
    }
    case 'getElite': {
      const n = pickRandomRogueEliteTank();
      if(n){
        if(!addToBench(makeRogueTankObj(n))) toast('仓库已满');
        else toast(`获得精英 ${n} → 仓库`);
      }
      break;
    }
    case 'getTactic': {
      const t = pickRandomNewRogueTactic();
      if(t){ RG.tacOwned.push(t); toast(`获得指令：${TACTICALS.find(x=>x.id===t).name}`); }
      else toast('没有未拥有的指令了');
      break;
    }
    case 'healAll':
      RG.active.forEach(t => t.hp = t.maxHp);
      toast('出战队伍回满血'); break;
    case 'healAllPct': {
      const pct = (c.args && c.args.pct) || 0.5;
      RG.active.forEach(t => t.hp = Math.min(t.maxHp, Math.round(t.hp + t.maxHp * pct)));
      toast(`出战队伍恢复 ${Math.round(pct*100)}%`); break;
    }
    case 'healLowest':
      if(RG.active.length > 0){
        const t = RG.active.slice().sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
        t.hp = t.maxHp; toast(`${t.n} 回满血`);
      }
      break;
    case 'starUp':
      if(RG.active.length > 0){
        const t = RG.active[Math.floor(Math.random() * RG.active.length)];
        t.exp = (t.exp || 0) + 300; toast(`${t.n} +300 exp`);
      }
      break;
    case 'expAll': {
      const amt = (c.args && c.args.amount) || 300;
      RG.active.forEach(t => t.exp = (t.exp || 0) + amt);
      toast(`出战队伍 +${amt} exp`); break;
    }
    case 'gambleTank':
      if(Math.random() < 0.5){
        const n = pickRandomRogueTank(layerLv + ROGUE_SETTINGS.lvOff);
        if(n){
          if(!addToBench(makeRogueTankObj(n))) toast('仓库已满');
          else toast(`赌赢了！获得 ${n}`);
        }
      } else toast('赌输了...');
      break;
    case 'gambleElite':
      if(Math.random() < 0.5){
        const n = pickRandomRogueEliteTank();
        if(n){
          if(!addToBench(makeRogueTankObj(n))) toast('仓库已满');
          else toast(`赌赢了！获得精英 ${n}`);
        }
      } else toast('赌输了...');
      break;
    case 'gambleRp': {
      const amt = (c.args && c.args.amount) || 100;
      if(Math.random() < 0.6){ RG.rp += amt; toast(`赌赢了！+${amt} RP`); }
      else toast('赌输了...');
      break;
    }
    case 'chanceTactic': {
      const ch = (c.args && c.args.chance) || 0.3;
      if(Math.random() < ch){
        const t = pickRandomNewRogueTactic();
        if(t){ RG.tacOwned.push(t); toast(`找到指令：${TACTICALS.find(x=>x.id===t).name}`); }
        else toast('没有未拥有的指令');
      } else toast('什么都没找到');
      break;
    }
    case 'swapLowestForElite': {
      if(RG.active.length <= 1){ toast('至少保留 1 辆'); break; }
      const t = RG.active.slice().sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
      const idx = RG.active.indexOf(t);
      RG.active.splice(idx, 1);
      addToDead(t);
      const n = pickRandomRogueEliteTank();
      if(n) RG.active.push(makeRogueTankObj(n));
      toast(`用 ${t.n} 换了 ${n}`);
      break;
    }
    case 'reviveOne': {
      if(RG.dead.length === 0){ toast('阵亡池为空'); break; }
      const i = Math.floor(Math.random() * RG.dead.length);
      restReviveTank(i);
      break;
    }
    case 'gambleRevive': {
      if(RG.dead.length === 0){ toast('阵亡池为空'); break; }
      if(Math.random() < 0.5){
        const i = Math.floor(Math.random() * RG.dead.length);
        restReviveTank(i);
      } else toast('赌输了...');
      break;
    }
  }
}

// ---------- 敌人生成 ----------
function rogueEnemyLv(layer, type){
  if(type === 'boss') return RG.phase === 1 ? 8 : 15;
  let base;
  if(RG.phase === 1) base = 1 + layer * (7 / 14);
  else base = 6 + layer * (9 / 14);
  const off = type === 'elite' ? 1 : 0;
  const total = base + off + ROGUE_SETTINGS.lvOff;
  return Math.max(1, Math.min(15, Math.round(total)));
}
function rogueEnemyCount(layer, type){
  if(type === 'boss'){
    return RG.phase === 1 ? 4 : 6;
  }
  let base;
  if(RG.phase === 1){
    base = Math.min(3, 1 + Math.floor(layer / 5));
  } else {
    base = Math.min(5, 2 + Math.floor(layer / 4));
  }
  base += ROGUE_SETTINGS.cntOff;
  if(RG.phase === 1) return Math.max(1, Math.min(3, base));
  return Math.max(2, Math.min(5, base));
}
function generateRogueEnemyTeam(layer, type){
  const count = rogueEnemyCount(layer, type);
  const otherNats = ['德','美','苏'].filter(n => n !== RG.nation);
  const team = [];
  const used = new Set();
  if(RG.phase === 2 && (type === 'elite' || type === 'boss')){
    const nat = otherNats[Math.floor(Math.random() * otherNats.length)];
    const eliteList = NATION_ELITE[nat] || [];
    if(eliteList.length > 0){
      const elite = eliteList[Math.floor(Math.random() * eliteList.length)];
      team.push(elite); used.add(elite);
    }
  }
  const lv = rogueEnemyLv(layer, type);
  let tries = 0;
  while(team.length < count && tries < 100){
    tries++;
    const nat = otherNats[Math.floor(Math.random() * otherNats.length)];
    const tree = TREES[nat];
    const pool = [];
    for(const name in tree){
      if(Math.abs(tree[name].lv - lv) <= 1.5) pool.push(name);
    }
    if(pool.length === 0) continue;
    const name = pool[Math.floor(Math.random() * pool.length)];
    if(used.has(name)) continue;
    used.add(name); team.push(name);
  }
  while(team.length < count){
    const nat = otherNats[Math.floor(Math.random() * otherNats.length)];
    const pool = Object.keys(TREES[nat]);
    team.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return team;
}

// ---------- 战斗 ----------
function startRogueBattle(nodeId){
  document.querySelectorAll('.diff-modal').forEach(el => el.remove());
  const node = RG.nodeMap[nodeId];
  if(!node) return;
  if(RG.active.length === 0){ toast('没有出战坦克'); return; }
  const enNames = generateRogueEnemyTeam(node.layer, node.type);

  resetBattleState('rogue');
  initBattleBuffs();
  B.tactical = { playerEquipped: RG.tacEquipped.slice(0, 2), playerUsed: [], enemyEquipped: [], enemyUsed: [] };
  setupAITacticalPool(node.type === 'boss' ? 2 : node.type === 'elite' ? 1 : 0);

  RG.active.forEach((t, i) => B.units.push(makeBattleUnit(t.n, 'player', i, t.hp, t.exp || 0, t.tankUid)));
  enNames.forEach((n, i) => B.units.push(makeBattleUnit(n, 'enemy', i)));

  RG.battleCtx = {
    nodeId, enemyNames: enNames,
    isBoss: node.type === 'boss',
    isElite: node.type === 'elite',
    _capture: null,
  };

  addBLog(`<span class="rd">🎲 第 ${RG.phase} 面 · 第 ${node.layer + 1} 层 · ${node.type === 'boss' ? 'Boss' : node.type === 'elite' ? '精英' : '普通战'}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
  S.screen = 'battle'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
  render(); setTimeout(runBattle, 500);
}

function showRogueBattleResult(){
  const win = B.result === 'win';
  const ctx = RG.battleCtx;
  document.getElementById('battleResult')?.remove();

  // 首次结算（只执行一次）
  if(!ctx._finalized){
    ctx._finalized = true;

    const survivors = [];
    const newDeaths = [];
    const updates = [];
    B.units.filter(u => u.side === 'player').forEach(u => {
      const kills = (B.stats[u.uid] && B.stats[u.uid].kills) || 0;
      const orig = RG.active[u.idx];
      if(!orig) return;
      const gain = u.alive ? (kills * 100 + 150) : (kills * 75 + 75);
      const oldExp = orig.exp || 0;
      const newExp = oldExp + gain;
      updates.push({ name: orig.n, gain, oldExp, newExp, alive: u.alive, starBefore: u.star || 0, starAfter: getStar(newExp) });
      if(u.alive){
        const baseMax = tankMaxHpByName(orig.n);
        const ratio = u.maxHp > 0 ? (u.hp / u.maxHp) : 1;
        survivors.push({ tankUid: orig.tankUid, n: orig.n, hp: Math.max(1, Math.round(baseMax * ratio)), maxHp: baseMax, exp: newExp });
      } else {
        newDeaths.push({ tankUid: orig.tankUid, n: orig.n, hp: 0, maxHp: tankMaxHpByName(orig.n), exp: newExp });
      }
    });
    RG.active = survivors;
    newDeaths.forEach(t => addToDead(t));
    B._veteranResult = updates;

    // 俘获（只生成一次）
    let capture = null;
    if(win){
      const deadEnemies = B.units.filter(u => u.side === 'enemy' && !u.alive).map(u => u.name);
      if(deadEnemies.length > 0){
        if(ctx.isElite || ctx.isBoss){
          const unique = [...new Set(deadEnemies)];
          const opts = unique.slice().sort(() => Math.random() - 0.5).slice(0, 3);
          capture = { mode: 'choose', options: opts, chosen: null };
        } else {
          const pick = deadEnemies[Math.floor(Math.random() * deadEnemies.length)];
          const added = addCaptiveToBench(pick);
          capture = { mode: 'give', tank: pick, added };
        }
      }
    }
    ctx._capture = capture;

    // RP / 进度
    const mul = ROGUE_SETTINGS.rewardMul;
    const rewardNote = [];
    ctx._rewardNote = rewardNote;
    if(win){
      let rpBase = ctx.isBoss ? 150 : ctx.isElite ? 100 : 60;
      const rpGain = Math.round(rpBase * mul);
      RG.rp += rpGain;
      rewardNote.push(`+${rpGain} 临时RP`);
      if(ctx.isElite){
        RG.active.forEach(t => { t.exp = (t.exp || 0) + 300; });
        rewardNote.push('出战队伍 +300 exp');
      }
      RG.progress.current = ctx.nodeId;
      RG.progress.visited.push(ctx.nodeId);
      if(ctx.isBoss){
        if(RG.phase === 1) ctx._phase2Ready = true;
        else RG.progress.cleared = true;
      }
    } else {
      if(RG.active.length === 0) RG.progress.failed = true;
    }
  }

  const capture = ctx._capture;
  const rewardNote = ctx._rewardNote || [];
  const phase2Ready = !!ctx._phase2Ready;
  if(win) SFX.win(); else SFX.lose();
  const div = document.createElement('div'); div.className = 'res-modal'; div.id = 'battleResult';

  // 俘获 HTML
  let captureHTML = '';
  if(capture){
    if(capture.mode === 'give'){
      captureHTML = capture.added
        ? `<div class="res-card" style="margin-top:8px;border-color:#4dff7b">
             <div style="font-size:12px;color:#7bff7b;margin-bottom:6px">🎖 俘获</div>
             <div style="font-size:13px;color:#c8d4ee"><b class="tank-name" data-star="0">${esc(capture.tank)}</b> 加入了仓库（半血 · 新兵）</div>
           </div>`
        : `<div class="res-card" style="margin-top:8px;border-color:#5a3a1a">
             <div style="font-size:12px;color:#8ab88a;margin-bottom:6px">🎖 俘获</div>
             <div style="font-size:12px;color:#8ab88a">仓库已满，无法接收战利品</div>
           </div>`;
    } else if(capture.mode === 'choose'){
      captureHTML = capture.chosen
        ? `<div class="res-card" style="margin-top:8px;border-color:#4dff7b">
             <div style="font-size:12px;color:#7bff7b;margin-bottom:6px">🎖 俘获</div>
             <div style="font-size:13px;color:#c8d4ee"><b class="tank-name" data-star="0">${esc(capture.chosen)}</b> 加入了仓库（半血 · 新兵）</div>
           </div>`
        : `<div class="res-card" style="margin-top:8px;border-color:#ffd76e">
             <div style="font-size:12px;color:#ffd76e;margin-bottom:8px">🎖 俘获 · 选择 1 辆加入仓库（半血）</div>
             <div class="tank-list">
               ${capture.options.map(nm => `<div class="tank-chip" onclick="chooseRogueCapture('${esc(nm)}')"><span class="tank-name" data-star="0">${esc(nm)}</span></div>`).join('')}
             </div>
           </div>`;
    }
  }
  const needChoose = capture && capture.mode === 'choose' && !capture.chosen;
  const btnDis = needChoose ? 'disabled' : '';

  const survivorCount = RG.active.length;
  const newDeathsNames = B.units.filter(u => u.side === 'player' && !u.alive).map(u => u.name);

  let bodyHTML = '';
  if(phase2Ready){
    bodyHTML = `<div class="res-title win">🏆 第一面完成</div>
      <div class="res-card">
        <div class="res-row"><span>战果</span><b>击败第一面 Boss</b></div>
        <div class="res-row"><span>出战</span><b>${RG.active.length} 辆</b></div>
        <div class="res-row"><span>仓库</span><b>${RG.bench.length} 辆</b></div>
        <div class="res-row"><span>阵亡</span><b>${RG.dead.length} 辆</b></div>
        <div class="res-row"><span>临时RP</span><b>${RG.rp}</b></div>
      </div>
      ${renderVeteranResultHTML()}
      ${captureHTML}
      <div class="res-btns">
        <button class="btn pri" onclick="enterPhase2()" ${btnDis}>▶ 进入第二面</button>
        <button class="btn" onclick="suspendAfterBoss()" ${btnDis}>💾 暂离（保存进度）</button>
      </div>`;
  } else if(RG.progress.cleared){
    bodyHTML = `<div class="res-title win">🎉 远征完成</div>
      <div class="res-card">
        <div class="res-row"><span>抵达</span><b>最终 Boss 击败</b></div>
        <div class="res-row"><span>出战</span><b>${RG.active.length} 辆</b></div>
        <div class="res-row"><span>临时RP</span><b>${RG.rp}</b></div>
      </div>
      ${renderVeteranResultHTML()}
      ${captureHTML}
      <div class="res-btns">
        <button class="btn pri" onclick="leaveRogueRunFinal()" ${btnDis}>🏠 返回主菜单</button>
      </div>`;
  } else if(RG.progress.failed){
    bodyHTML = `<div class="res-title lose">💀 远征失败</div>
      <div class="res-card">
        <div class="res-row"><span>面</span><b>第 ${RG.phase} 面</b></div>
        <div class="res-row"><span>层</span><b>第 ${((RG.nodeMap[ctx.nodeId] || {}).layer || 0) + 1} 层</b></div>
        <div class="res-row"><span>出战队伍</span><b>全灭</b></div>
      </div>
      ${renderVeteranResultHTML()}
      <div class="res-btns">
        <button class="btn pri" onclick="leaveRogueRunFinal()">🏠 返回主菜单</button>
      </div>`;
  } else {
    bodyHTML = `<div class="res-title ${win?'win':'lose'}">${win?'胜 利':'败 北'}</div>
      <div class="res-card">
        <div class="res-row"><span>面/层</span><b>第 ${RG.phase} 面 · 第 ${((RG.nodeMap[ctx.nodeId] || {}).layer || 0) + 1} 层</b></div>
        <div class="res-row"><span>出战</span><b>${survivorCount} 辆</b></div>
        ${newDeathsNames.length ? `<div class="res-row"><span>阵亡</span><b style="color:#ff8080">${newDeathsNames.map(n=>esc(n)).join('、')}</b></div>` : ''}
        ${rewardNote.length ? `<div class="res-row"><span>奖励</span><b>${rewardNote.join(' · ')}</b></div>` : ''}
        <div class="res-row"><span>临时RP</span><b>${RG.rp}</b></div>
      </div>
      ${renderVeteranResultHTML()}
      ${captureHTML}
      <div class="res-btns">
        <button class="btn pri" onclick="closeRogueBattleResult()" ${btnDis}>▶ 继续远征</button>
        <button class="btn" onclick="leaveRogueRunFinal()" ${btnDis}>🏠 返回主菜单</button>
      </div>`;
  }
  div.innerHTML = bodyHTML;
  document.body.appendChild(div);
}
function addCaptiveToBench(name){
  if(RG.bench.length >= ROGUE_BENCH_MAX){ toast('仓库已满'); return false; }
  const maxHp = tankMaxHpByName(name);
  RG.bench.push({
    tankUid: 'rg' + (RG._uid++),
    n: name,
    hp: Math.max(1, Math.round(maxHp * 0.5)),
    maxHp: maxHp,
    exp: 0,
  });
  return true;
}
function chooseRogueCapture(name){
  const capture = RG.battleCtx && RG.battleCtx._capture;
  if(!capture || capture.mode !== 'choose' || capture.chosen) return;
  if(RG.bench.length >= ROGUE_BENCH_MAX){ toast('仓库已满'); return; }
  const added = addCaptiveToBench(name);
  if(!added) return;
  capture.chosen = name;
  toast(`俘获 ${name} → 仓库（半血）`);
  showRogueBattleResult();
}

function enterPhase2(){
  document.getElementById('battleResult')?.remove();
  RG.phase = 2;
  RG.seed = Math.floor(Math.random() * 1e9);
  const map = generateRogueMap(RG.seed);
  RG.layers = map.layers;
  RG.nodeMap = map.nodeMap;
  RG.progress = { current: 'L0N0', visited: ['L0N0'], cleared: false, failed: false };
  RG.battleCtx = null;
  S.screen = 'rogueMap'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px');
  render();
  setTimeout(() => openPhase2Rest(), 100);
}
function openPhase2Rest(){
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
  const canRevive = RG.dead.length > 0;
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-rest-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🔥 进入第二面 · 地图外火堆</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:12px">第二面 Lv6→15 · 选择一项加成：</div>
    <div class="rest-choices">
      <button class="btn rest-choice" onclick="pickRogueRest('heal')">
        <div class="rc-icon">❤️</div>
        <div class="rc-name">出战队伍恢复 50%</div>
        <div class="rc-desc">每辆出战坦克恢复 50% 最大血量</div>
      </button>
      <button class="btn rest-choice" onclick="pickRogueRest('exp')">
        <div class="rc-icon">🎖</div>
        <div class="rc-name">出战队伍 +400 exp</div>
        <div class="rc-desc">每辆出战坦克 +400 经验</div>
      </button>
      <button class="btn rest-choice" ${canRevive?'':'disabled'} onclick="pickRogueRest('revive')">
        <div class="rc-icon">🕯</div>
        <div class="rc-name">复活 1 辆阵亡坦克</div>
        <div class="rc-desc">${canRevive ? '从阵亡池选择 1 辆复活到仓库（满血）' : '阵亡池为空'}</div>
      </button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function suspendAfterBoss(){
  document.getElementById('battleResult')?.remove();
  RG.phase = 1.5;
  if(saveRogueRun()){
    RG.battleCtx = null;
    toast('已暂离 · 下次进入远征可继续');
    S.screen = 'main'; M.screen = 'main';
    document.documentElement.style.setProperty('--boff', '0px');
    render();
  } else toast('暂离失败');
}
function closeRogueBattleResult(){
  document.getElementById('battleResult')?.remove();
  RG.battleCtx = null;
  S.screen = 'rogueMap'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px');
  render();
}
function leaveRogueRunFinal(){
  document.getElementById('battleResult')?.remove();
  clearRogueRun();
  RG.battleCtx = null;
  S.screen = 'main'; M.screen = 'main';
  document.documentElement.style.setProperty('--boff', '0px');
  render();
}