// ============================================================
// rogue.js — 远征模式（Roguelike）
// ============================================================

const ROGUE_TOTAL = 15;
const ROGUE_LAYER_H = 76;
const ROGUE_SETTINGS_KEY = 'tank_rogue_settings_v1';

const ROGUE_EVENTS = [
  {
    id: 'gambler', title: '🎲 赌徒商人',
    desc: '一个神秘人摊开牌："敢赌吗？赢了你拿走，输了一场空。"',
    choices: [
      { label: '🎲 赌 100 RP 得随机坦克', cost: 100, effect: 'gambleTank' },
      { label: '🎲 赌 200 RP 得精英坦克', cost: 200, effect: 'gambleElite' },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
  {
    id: 'wreck', title: '🔧 废弃坦克',
    desc: '路边有一辆半埋的坦克，炮管还完好，也许能修。',
    choices: [
      { label: '🔧 花 80 RP 修复，加入队伍', cost: 80, effect: 'getTank' },
      { label: '💰 拆解卖零件 (+60 RP)', effect: 'gainRp', args: { amount: 60 } },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
  {
    id: 'veteran', title: '🎖 老兵',
    desc: '一位退役老兵想加入你的队伍，他说他见过所有战场。',
    choices: [
      { label: '🎖 接受（随机一辆 +300 exp）', effect: 'starUp' },
      { label: '💰 请他喝酒 (+80 RP)', effect: 'gainRp', args: { amount: 80 } },
      { label: '🚶 婉拒', effect: 'none' },
    ],
  },
  {
    id: 'spring', title: '💧 神秘泉水',
    desc: '一汪泛着微光的泉水，附近的草地格外翠绿。',
    choices: [
      { label: '❤️ 饮下（全队回满血，-100 RP）', cost: 100, effect: 'healAll' },
      { label: '🎁 打捞（随机得 1 个指令）', effect: 'getTactic' },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
  {
    id: 'arms', title: '🛒 军火商',
    desc: '背着大包的商人拦住你："兄弟，要货吗？"',
    choices: [
      { label: '🎯 花 60 RP 买随机指令', cost: 60, effect: 'getTactic' },
      { label: '💰 花 40 RP 赌一把 (+100 RP)', cost: 40, effect: 'gambleRp', args: { amount: 100 } },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
  {
    id: 'hospital', title: '💊 战地医院',
    desc: '一个废弃的野战医疗站，器材还能用。',
    choices: [
      { label: '💊 花 100 RP 全队回血 80%', cost: 100, effect: 'healAllPct', args: { pct: 0.8 } },
      { label: '🩹 花 50 RP 血量最低的回满', cost: 50, effect: 'healLowest' },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
  {
    id: 'airdrop', title: '📦 补给空投',
    desc: '天上掉下一个补给箱，还冒着烟。',
    choices: [
      { label: '💰 打开 (+150 RP)', effect: 'gainRp', args: { amount: 150 } },
      { label: '🎯 撬开（随机得 1 个指令）', effect: 'getTactic' },
      { label: '🎓 研究（全队 +500 exp）', effect: 'expAll', args: { amount: 500 } },
    ],
  },
  {
    id: 'scout', title: '🕵️ 侦察情报',
    desc: '抓到一个落单的敌军侦察兵。',
    choices: [
      { label: '🔍 审问（全队 +400 exp）', effect: 'expAll', args: { amount: 400 } },
      { label: '🎖 招降（获得 Lv8 坦克）', effect: 'getTank', args: { lv: 8 } },
      { label: '🔪 处理 (+50 RP)', effect: 'gainRp', args: { amount: 50 } },
    ],
  },
  {
    id: 'workshop', title: '🔧 修理厂',
    desc: '一个废弃的修理厂，工具散落一地。',
    choices: [
      { label: '🔧 修血量最低的一辆（免费回满）', effect: 'healLowest' },
      { label: '💰 拆零件 (+80 RP)', effect: 'gainRp', args: { amount: 80 } },
      { label: '🎁 翻找（30% 得指令）', effect: 'chanceTactic', args: { chance: 0.3 } },
    ],
  },
  {
    id: 'blackmarket', title: '🌑 黑市',
    desc: '有人悄悄拉你进巷子："用一辆换一辆，怎么样？"',
    choices: [
      { label: '🔄 用最低血的换随机精英', effect: 'swapLowestForElite' },
      { label: '💰 花 300 RP 买随机精英', cost: 300, effect: 'getElite' },
      { label: '🚶 离开', effect: 'none' },
    ],
  },
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
  seed: 0,
  layers: [],
  nodeMap: {},
  progress: { current: null, visited: [], cleared: false, failed: false },
  nation: '德',
  team: [],
  rp: 0,
  tacOwned: [],
  tacEquipped: [],
  _uid: 0,
  battleCtx: null,
  shopStock: null,
  currentEvent: null,
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
    const prevLayer = layers[L - 1];
    const nextLayer = layers[L];
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

  // 分配节点类型
  layers[0][0].type = 'start';
  layers[ROGUE_TOTAL - 1][0].type = 'boss';
  let lastElite = -99, lastShop = -99, lastRest = -99;
  for(let L = 1; L < ROGUE_TOTAL - 1; L++){
    const layer = layers[L];
    if(L >= 4 && L - lastElite >= 2 && rng() < 0.4){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){
        const n = cands[Math.floor(rng() * cands.length)];
        n.type = 'elite'; lastElite = L;
      }
    }
    if(L >= 3 && L - lastShop >= 3 && rng() < 0.45){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){
        const n = cands[Math.floor(rng() * cands.length)];
        n.type = 'shop'; lastShop = L;
      }
    }
    if(L >= 2 && L - lastRest >= 3 && rng() < 0.45){
      const cands = layer.filter(n => n.type === 'battle');
      if(cands.length > 0){
        const n = cands[Math.floor(rng() * cands.length)];
        n.type = 'rest'; lastRest = L;
      }
    }
    for(const n of layer){
      if(n.type === 'battle' && rng() < 0.25){
        n.type = 'event';
      }
    }
  }
  // 保证至少 1 商店 1 篝火
  const hasType = t => layers.some(layer => layer.some(n => n.type === t));
  if(!hasType('shop')){
    for(let L = 5; L < ROGUE_TOTAL - 2; L++){
      const cands = layers[L].filter(n => n.type === 'battle');
      if(cands.length > 0){ cands[0].type = 'shop'; break; }
    }
  }
  if(!hasType('rest')){
    for(let L = 5; L < ROGUE_TOTAL - 2; L++){
      const cands = layers[L].filter(n => n.type === 'battle' || n.type === 'event');
      if(cands.length > 0){ cands[0].type = 'rest'; break; }
    }
  }

  const nodeMap = {};
  for(const layer of layers) for(const n of layer) nodeMap[n.id] = n;
  return { seed, layers, nodeMap };
}

// ---------- 开局 ----------
function goRogue(){ S.screen = 'rogueStart'; M.screen = 'none'; render(); }

function selectRogueNation(n){
  RG.nation = n;
  RG.seed = Math.floor(Math.random() * 1e9);
  const map = generateRogueMap(RG.seed);
  RG.layers = map.layers;
  RG.nodeMap = map.nodeMap;
  RG.progress = { current: 'L0N0', visited: ['L0N0'], cleared: false, failed: false };
  RG.rp = ROGUE_SETTINGS.startRp;
  RG._uid = 0;
  RG.tacOwned = ['volley','apround','smoke','repair'];
  RG.tacEquipped = ['volley','smoke'];
  RG.team = pickRogueStarterTanks(n);
  RG.battleCtx = null;
  RG.shopStock = null;
  RG.currentEvent = null;
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
function leaveRogueRun(){
  if(!confirm('离开远征？本局进度将丢失。')) return;
  S.screen = 'main'; M.screen = 'main';
  render();
}

function renderRogueStart(){
  const lvOff = ROGUE_SETTINGS.lvOff;
  const cntOff = ROGUE_SETTINGS.cntOff;
  const startRp = ROGUE_SETTINGS.startRp;
  const rewardMul = ROGUE_SETTINGS.rewardMul;
  let html = `<h1>🎲 远征 · Roguelike</h1>
  <div class="sub">15 层分支路线 · 全灭即失败 · 不写回全局存档</div>
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
    · 从起点出发，每步只能走连线相邻的节点<br>
    · 战斗/精英/Boss 节点直接开战 · 商店/篝火/事件进入对应面板<br>
    · 战斗中阵亡的坦克本局永久失去<br>
    · 全队全灭 = 本局失败<br>
    · 临时 RP 局末清零，不影响战役存档
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
      pos[n.id] = {
        x: startX + i * spacing,
        y: (TOTAL - 1 - n.layer) * LAYER_H + 40,
        r: isBoss ? 35 : NODE_R,
      };
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
      const icon = ICON[n.type] || '⚔️';
      const label = LABEL[n.type] || '战斗';
      nodeHTML += `<div class="${rogueNodeClass(n)}" style="left:${p.x}px;top:${p.y}px;width:${p.r*2}px;height:${p.r*2}px;margin-left:-${p.r}px;margin-top:-${p.r}px" onclick="clickRogueNode('${n.id}')">
        <div class="rn-icon">${icon}</div>
        <div class="rn-label">${label}</div>
      </div>`;
    }
  }

  const curLayer = RG.nodeMap[RG.progress.current] ? RG.nodeMap[RG.progress.current].layer : 0;
  const tacNames = RG.tacEquipped.map(id => { const t = TACTICALS.find(x => x.id === id); return t ? t.name : '?'; }).join(' · ');
  const lvStr = ROGUE_SETTINGS.lvOff !== 0 ? ` · Lv${ROGUE_SETTINGS.lvOff>0?'+':''}${ROGUE_SETTINGS.lvOff}` : '';

  let html = `<div class="rogue-hud">
    <div><b style="color:#c86bff">第 ${curLayer + 1} / ${ROGUE_TOTAL} 层</b> · 💰 <b>${RG.rp}</b> 临时RP${lvStr}</div>
    <div>队伍 ${RG.team.length} 辆</div>
  </div>
  <div class="panel" style="padding:0;overflow:hidden">
    <div class="rogue-map-wrap" style="height:56vh">
      <div class="rogue-map-canvas" style="width:${canvasW}px;height:${canvasH}px;position:relative;margin:0 auto">
        <svg class="rogue-svg" width="${canvasW}" height="${canvasH}">${svgLines}</svg>
        ${nodeHTML}
      </div>
    </div>
  </div>
  <div class="panel"><h3>我的远征队</h3>
    <div class="rogue-team-list">${RG.team.map((t) => {
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
    }).join('')}</div>
  </div>
  <div class="panel"><h3>🎯 当前指令</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:8px">已装备：<b style="color:#ffd76e">${tacNames || '无'}</b></div>
    <button class="btn ghost" style="width:100%" onclick="openRogueTacticalModal()">⚙ 编辑指令（已拥有 ${RG.tacOwned.length}/12）</button>
  </div>
  <div class="btns" style="margin-top:auto">
    <button class="btn" onclick="leaveRogueRun()">← 放弃远征</button>
  </div>`;
  setTimeout(() => {
    const wrap = document.querySelector('.rogue-map-wrap');
    const curNode = document.querySelector('.rogue-node.current');
    if(wrap && curNode){
      const target = curNode.offsetTop - wrap.clientHeight / 2;
      wrap.scrollTop = Math.max(0, target);
    }
  }, 30);
  return html;
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
  const lv = ((RG.nodeMap[RG.progress.current]?.layer) || 0) + 1;
  const tankLv = Math.max(1, Math.min(15, lv + ROGUE_SETTINGS.lvOff));
  const tankCost = 100 + tankLv * 15;
  return [
    { id: 'repair_full', icon: '🔧', label: '全队修理', desc: '所有坦克回满血', cost: 150, action: 'shopHealAll' },
    { id: 'repair_one', icon: '🩹', label: '单辆修理', desc: '血量最低的坦克回满', cost: 60, action: 'shopHealLowest' },
    { id: 'tactic', icon: '🎯', label: '随机指令', desc: '获得一个未拥有的战术指令', cost: 80, action: 'shopGetTactic' },
    { id: 'star', icon: '🎖', label: '车组强化', desc: '随机一辆坦克 +300 exp', cost: 200, action: 'shopStarUp' },
    { id: 'tank', icon: '🚀', label: `随机坦克 Lv${tankLv}`, desc: '加入远征队', cost: tankCost, action: 'shopGetTank' },
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
    const btn = it.sold
      ? '<span class="shop-tag">已售</span>'
      : `<button class="btn ghost sm" ${canAfford?'':'disabled'} onclick="buyRogueShopItem(${i})">${it.cost} RP</button>`;
    return `<div class="${cls.join(' ')}">
      <div class="shop-icon">${it.icon}</div>
      <div class="shop-info">
        <div class="shop-name">${it.label}</div>
        <div class="shop-desc">${it.desc}</div>
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
  RG.rp -= it.cost;
  it.sold = true;
  applyRogueShopEffect(it.action);
  renderRogueShopModal();
  render();
}
function applyRogueShopEffect(action){
  const lv = ((RG.nodeMap[RG.progress.current]?.layer) || 0) + 1;
  switch(action){
    case 'shopHealAll':
      RG.team.forEach(t => t.hp = t.maxHp);
      toast('全队回满血'); break;
    case 'shopHealLowest':
      if(RG.team.length > 0){
        const t = RG.team.slice().sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
        t.hp = t.maxHp; toast(`${t.n} 回满血`);
      }
      break;
    case 'shopGetTactic': {
      const t = pickRandomNewRogueTactic();
      if(t){ RG.tacOwned.push(t); toast(`获得指令：${TACTICALS.find(x=>x.id===t).name}`); }
      else toast('没有未拥有的指令了');
      break;
    }
    case 'shopStarUp':
      if(RG.team.length > 0){
        const t = RG.team[Math.floor(Math.random() * RG.team.length)];
        t.exp = (t.exp || 0) + 300;
        toast(`${t.n} +300 exp`);
      }
      break;
    case 'shopGetTank': {
      const n = pickRandomRogueTank(lv + ROGUE_SETTINGS.lvOff);
      if(n){ RG.team.push(makeRogueTankObj(n)); toast(`获得 ${n}`); }
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

// ---------- 篝火 ----------
function openRogueRest(){
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal rogue-rest-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🔥 篝火</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:12px">休整一下，二选一：</div>
    <div class="rest-choices">
      <button class="btn rest-choice" onclick="pickRogueRest('heal')">
        <div class="rc-icon">❤️</div>
        <div class="rc-name">全队恢复 50%</div>
        <div class="rc-desc">每辆坦克恢复 50% 最大血量</div>
      </button>
      <button class="btn rest-choice" onclick="pickRogueRest('exp')">
        <div class="rc-icon">🎖</div>
        <div class="rc-name">全队 +400 exp</div>
        <div class="rc-desc">每辆坦克 +400 经验</div>
      </button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function pickRogueRest(kind){
  if(kind === 'heal'){
    RG.team.forEach(t => t.hp = Math.min(t.maxHp, Math.round(t.hp + t.maxHp * 0.5)));
    toast('全队恢复 50%');
  } else if(kind === 'exp'){
    RG.team.forEach(t => t.exp = (t.exp || 0) + 400);
    toast('全队 +400 exp');
  }
  document.querySelectorAll('.rogue-rest-modal').forEach(el => el.remove());
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
  const layerLv = ((RG.nodeMap[RG.progress.current]?.layer) || 0) + 1;
  switch(c.effect){
    case 'none': break;
    case 'gainRp': {
      const amt = (c.args && c.args.amount) || 0;
      RG.rp += amt; toast(`+${amt} 临时RP`);
      break;
    }
    case 'getTank': {
      const lv = (c.args && c.args.lv) || (layerLv + ROGUE_SETTINGS.lvOff);
      const n = pickRandomRogueTank(lv);
      if(n){ RG.team.push(makeRogueTankObj(n)); toast(`获得 ${n}`); }
      break;
    }
    case 'getElite': {
      const n = pickRandomRogueEliteTank();
      if(n){ RG.team.push(makeRogueTankObj(n)); toast(`获得精英 ${n}`); }
      break;
    }
    case 'getTactic': {
      const t = pickRandomNewRogueTactic();
      if(t){ RG.tacOwned.push(t); toast(`获得指令：${TACTICALS.find(x=>x.id===t).name}`); }
      else toast('没有未拥有的指令了');
      break;
    }
    case 'healAll':
      RG.team.forEach(t => t.hp = t.maxHp);
      toast('全队回满血'); break;
    case 'healAllPct': {
      const pct = (c.args && c.args.pct) || 0.5;
      RG.team.forEach(t => t.hp = Math.min(t.maxHp, Math.round(t.hp + t.maxHp * pct)));
      toast(`全队恢复 ${Math.round(pct*100)}%`); break;
    }
    case 'healLowest':
      if(RG.team.length > 0){
        const t = RG.team.slice().sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
        t.hp = t.maxHp; toast(`${t.n} 回满血`);
      }
      break;
    case 'starUp':
      if(RG.team.length > 0){
        const t = RG.team[Math.floor(Math.random() * RG.team.length)];
        t.exp = (t.exp || 0) + 300; toast(`${t.n} +300 exp`);
      }
      break;
    case 'expAll': {
      const amt = (c.args && c.args.amount) || 300;
      RG.team.forEach(t => t.exp = (t.exp || 0) + amt);
      toast(`全队 +${amt} exp`); break;
    }
    case 'gambleTank':
      if(Math.random() < 0.5){
        const n = pickRandomRogueTank(layerLv + ROGUE_SETTINGS.lvOff);
        if(n){ RG.team.push(makeRogueTankObj(n)); toast(`赌赢了！获得 ${n}`); }
      } else toast('赌输了...');
      break;
    case 'gambleElite':
      if(Math.random() < 0.5){
        const n = pickRandomRogueEliteTank();
        if(n){ RG.team.push(makeRogueTankObj(n)); toast(`赌赢了！获得精英 ${n}`); }
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
      if(RG.team.length <= 1){ toast('至少保留 1 辆'); break; }
      const t = RG.team.slice().sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
      const idx = RG.team.indexOf(t);
      RG.team.splice(idx, 1);
      const n = pickRandomRogueEliteTank();
      if(n){ RG.team.push(makeRogueTankObj(n)); toast(`用 ${t.n} 换了 ${n}`); }
      break;
    }
  }
}

// ---------- 敌人生成 ----------
function rogueEnemyLv(layer, type){
  let base = layer + 1;
  let off = 0;
  if(type === 'elite') off = 2;
  else if(type === 'boss') return 15;
  off += ROGUE_SETTINGS.lvOff;
  return Math.max(1, Math.min(15, base + off));
}
function rogueEnemyCount(layer, type){
  if(type === 'boss') return 6;
  let base = Math.max(2, Math.min(6, Math.ceil(1 + (layer + 1) * 0.35)));
  base += ROGUE_SETTINGS.cntOff;
  return Math.max(2, Math.min(6, base));
}
function generateRogueEnemyTeam(layer, type){
  const count = rogueEnemyCount(layer, type);
  const otherNats = ['德','美','苏'].filter(n => n !== RG.nation);
  const team = [];
  const used = new Set();
  if(type === 'elite' || type === 'boss'){
    const nat = otherNats[Math.floor(Math.random() * otherNats.length)];
    const eliteList = NATION_ELITE[nat] || [];
    if(eliteList.length > 0){
      const elite = eliteList[Math.floor(Math.random() * eliteList.length)];
      team.push(elite); used.add(elite);
    }
  }
  const lv = type === 'elite' ? Math.max(1, Math.min(15, layer + 1 + 2 + ROGUE_SETTINGS.lvOff)) : rogueEnemyLv(layer, type);
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

// ---------- 战斗启动 ----------
function startRogueBattle(nodeId){
  document.querySelectorAll('.diff-modal').forEach(el => el.remove());
  const node = RG.nodeMap[nodeId];
  if(!node) return;
  const enNames = generateRogueEnemyTeam(node.layer, node.type);

  B.units = []; B.log = []; B.stats = {}; B.round = 0; B.stageIdx = 0; B.ccRound = 0;
  B.cur = null; B.await = null; B.resolve = null; B.over = false;
  B.result = null; B.difficulty = 'normal'; B.uid = 0;
  B.mode = 'rogue'; B.earned = 0; B.lastStage = -1; B.mapCtx = null; B.aiCallback = null;
  B.perfect = false; B.isFirstClear = false; B._veteranResult = null;
  B.retreatUsedThisTurn = false; B.retreatSelect = false; B.retreatPicked = [];
  B.auto = AUTO_BATTLE_CONTINUOUS;
  initBattleBuffs();
  B.tactical = { playerEquipped: RG.tacEquipped.slice(0, 2), playerUsed: [], enemyEquipped: [], enemyUsed: [] };
  setupAITacticalPool(node.type === 'boss' ? 2 : node.type === 'elite' ? 1 : 0);

  RG.team.forEach((t, i) => B.units.push(makeBattleUnit(t.n, 'player', i, t.hp, t.exp || 0, t.tankUid)));
  enNames.forEach((n, i) => B.units.push(makeBattleUnit(n, 'enemy', i)));

  RG.battleCtx = {
    nodeId,
    enemyNames: enNames,
    isBoss: node.type === 'boss',
    isElite: node.type === 'elite',
  };

  addBLog(`<span class="rd">🎲 远征 · 第 ${node.layer + 1} 层 · ${node.type === 'boss' ? 'Boss' : node.type === 'elite' ? '精英' : '普通战'}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
  S.screen = 'battle'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
  render(); setTimeout(runBattle, 500);
}

function showRogueBattleResult(){
  const win = B.result === 'win';
  if(win) SFX.win(); else SFX.lose();
  const ctx = RG.battleCtx;
  const div = document.createElement('div'); div.className = 'res-modal'; div.id = 'battleResult';

  const survivors = [];
  const deaths = [];
  const updates = [];
  B.units.filter(u => u.side === 'player').forEach(u => {
    const kills = (B.stats[u.uid] && B.stats[u.uid].kills) || 0;
    const orig = RG.team[u.idx];
    if(!orig) return;
    const gain = u.alive ? (kills * 100 + 150) : (kills * 75 + 75);
    const oldExp = orig.exp || 0;
    const newExp = oldExp + gain;
    updates.push({ name: orig.n, gain, oldExp, newExp, alive: u.alive, starBefore: u.star || 0, starAfter: getStar(newExp) });
    if(u.alive){
      const baseMax = tankMaxHpByName(orig.n);
      const ratio = u.maxHp > 0 ? (u.hp / u.maxHp) : 1;
      survivors.push({ tankUid: orig.tankUid, n: orig.n, hp: Math.max(1, Math.round(baseMax * ratio)), maxHp: baseMax, exp: newExp });
    } else deaths.push(orig.n);
  });
  RG.team = survivors;
  B._veteranResult = updates;

  const mul = ROGUE_SETTINGS.rewardMul;
  let rewardNote = [];
  if(win){
    let rpBase = ctx.isBoss ? 150 : ctx.isElite ? 80 : 50;
    const rpGain = Math.round(rpBase * mul);
    RG.rp += rpGain;
    rewardNote.push(`+${rpGain} 临时RP`);
    if(ctx.isElite){
      RG.team.forEach(t => { t.exp = (t.exp || 0) + 300; });
      rewardNote.push('全队 +300 exp');
    }
    RG.progress.current = ctx.nodeId;
    RG.progress.visited.push(ctx.nodeId);
    if(ctx.isBoss) RG.progress.cleared = true;
  } else {
    if(RG.team.length === 0) RG.progress.failed = true;
  }

  let bodyHTML = '';
  if(RG.progress.cleared){
    bodyHTML = `<div class="res-title win">🎉 远征完成</div>
      <div class="res-card">
        <div class="res-row"><span>抵达</span><b>第 ${ROGUE_TOTAL} 层 Boss</b></div>
        <div class="res-row"><span>存活</span><b>${RG.team.length} 辆</b></div>
        <div class="res-row"><span>临时RP</span><b>${RG.rp}</b></div>
      </div>
      ${renderVeteranResultHTML()}
      <div class="res-btns">
        <button class="btn pri" onclick="leaveRogueRunFinal()">🏠 返回主菜单</button>
      </div>`;
  } else if(RG.progress.failed){
    bodyHTML = `<div class="res-title lose">💀 远征失败</div>
      <div class="res-card">
        <div class="res-row"><span>抵达</span><b>第 ${((RG.nodeMap[ctx.nodeId] || {}).layer || 0) + 1} 层</b></div>
        <div class="res-row"><span>队伍</span><b>全灭</b></div>
      </div>
      ${renderVeteranResultHTML()}
      <div class="res-btns">
        <button class="btn pri" onclick="leaveRogueRunFinal()">🏠 返回主菜单</button>
      </div>`;
  } else {
    bodyHTML = `<div class="res-title ${win?'win':'lose'}">${win?'胜 利':'败 北'}</div>
      <div class="res-card">
        <div class="res-row"><span>层数</span><b>第 ${((RG.nodeMap[ctx.nodeId] || {}).layer || 0) + 1} 层</b></div>
        <div class="res-row"><span>存活</span><b>${survivors.length} 辆</b></div>
        ${deaths.length ? `<div class="res-row"><span>损失</span><b style="color:#ff8080">${deaths.map(d=>esc(d)).join('、')}</b></div>` : ''}
        ${rewardNote.length ? `<div class="res-row"><span>奖励</span><b>${rewardNote.join(' · ')}</b></div>` : ''}
        <div class="res-row"><span>临时RP</span><b>${RG.rp}</b></div>
      </div>
      ${renderVeteranResultHTML()}
      <div class="res-btns">
        <button class="btn pri" onclick="closeRogueBattleResult()">▶ 继续远征</button>
        <button class="btn" onclick="leaveRogueRunFinal()">🏠 返回主菜单</button>
      </div>`;
  }
  div.innerHTML = bodyHTML;
  document.body.appendChild(div);
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
  RG.battleCtx = null;
  S.screen = 'main'; M.screen = 'main';
  document.documentElement.style.setProperty('--boff', '0px');
  render();
}