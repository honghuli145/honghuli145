// ============================================================
// util.js — 工具、伤害公式、音效、设置
// ============================================================

function esc(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getStar(exp){
  if(!exp || exp < VET_THRESHOLD[1]) return 0;
  if(exp < VET_THRESHOLD[2]) return 1;
  if(exp < VET_THRESHOLD[3]) return 2;
  return 3;
}
function starToExpFloor(star){
  return VET_THRESHOLD[Math.max(0, Math.min(3, star))] || 0;
}
function crewDemoteExp(exp){
  exp = Math.max(0, exp || 0);
  const oldStar = getStar(exp);
  const newStar = Math.max(0, oldStar - 1);
  const floor = starToExpFloor(newStar);
  const oldFloor = starToExpFloor(oldStar);
  const surplus = Math.max(0, exp - oldFloor);
  let newExp = floor + surplus;
  const cap = newStar < 3 ? VET_THRESHOLD[newStar + 1] - 1 : Infinity;
  return Math.max(floor, Math.min(newExp, cap));
}
function veteranFloat(star){
  return VET_FLOAT[Math.max(0, Math.min(3, star))] || VET_FLOAT[0];
}
function veteranMul(star){
  return 1 + Math.max(0, Math.min(3, star)) * VET_STAT_BONUS;
}
function expProgressPct(exp){
  exp = Math.max(0, exp || 0);
  const star = getStar(exp);
  if(star >= 3) return 100;
  const curr = VET_THRESHOLD[star];
  const next = VET_THRESHOLD[star + 1];
  if(next <= curr) return 100;
  return Math.max(0, Math.min(100, Math.round((exp - curr) / (next - curr) * 100)));
}
function makeCrewId(){ return 'crew_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }
function makeTankUid(){ return 'tk_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 100000).toString(36); }

function tankCost(lv){
  const table = [[1,0],[1.5,600],[2,900],[2.5,1300],[3,1700],[3.5,2200],[4,2700],[4.5,3300],[5,3900],[5.5,4600],[6,5300],[6.5,6100],[7,6900],[7.5,7800],[8,8700],[8.5,9700],[9,10700],[9.5,11800],[10,12900],[10.5,14100],[11,15300],[11.5,16600],[12,17900],[12.5,19300],[13,20700],[13.5,22200],[14,23700],[14.5,25300],[15,27000]];
  for(const [l,c] of table) if(lv<=l) return c;
  return 27000;
}
function tankCostMap(lv){ return Math.round(tankCost(lv) * 0.1); }
function slotCost(n){ return [0,0,400,800,1400,2200,3500][n] || 99999; }
function levelReward(chapter){ return 300 + chapter * 100 + Math.floor(chapter * chapter * 8); }
function aiStandardLevel(chapter){ const lv = 1 + (chapter - 1) * 0.5; return Math.min(15, Math.round(lv * 2) / 2); }
function aiSlots(chapter){ return Math.min(6, Math.ceil(chapter / 5)); }
function playerSlotsMax(chapter){ return Math.min(6, Math.max(1, Math.ceil(chapter / 5) + 1)); }

function aiSlotsForReinforce(n){
  if(n <= 0) return 1;
  if(n > AI_SLOTS_TABLE.length) return AI_SLOTS_TABLE[AI_SLOTS_TABLE.length - 1];
  return AI_SLOTS_TABLE[n - 1];
}
function getAICfg(sv){
  const d = DEFAULT_AI_CONFIG;
  const c = sv && sv.aiConfig ? sv.aiConfig : {};
  return {
    growthRate: typeof c.growthRate === 'number' ? c.growthRate : d.growthRate,
    maxLevel: typeof c.maxLevel === 'number' ? c.maxLevel : d.maxLevel,
    reinforceInterval: typeof c.reinforceInterval === 'number' ? c.reinforceInterval : d.reinforceInterval,
    reinforceMax: typeof c.reinforceMax === 'number' ? c.reinforceMax : d.reinforceMax,
  };
}
function tankData(name){ return TANKS[name] || ELITE_TANKS[name] || null; }
function tankMaxHpByName(name){ const d = tankData(name); return d ? d.ac : 100; }
function tankName(t){ return typeof t === 'string' ? t : (t && t.n) || ''; }
function normalizeTank(t){
  if(typeof t === 'string'){ const ac = tankMaxHpByName(t); return { n: t, hp: ac, maxHp: ac, exp: 0, tankUid: null }; }
  if(t && typeof t === 'object'){
    const ac = t.maxHp || tankMaxHpByName(t.n);
    return { n: t.n, hp: typeof t.hp === 'number' ? Math.max(0, Math.min(ac, t.hp)) : ac, maxHp: ac, exp: typeof t.exp === 'number' ? t.exp : 0, tankUid: t.tankUid || null };
  }
  return { n: '', hp: 1, maxHp: 1, exp: 0, tankUid: null };
}
function normalizeTankArray(arr){ return (arr || []).map(normalizeTank); }
function unitHpPct(u){
  const tanks = u.tanks || [];
  if(tanks.length === 0) return 0;
  let sum = 0, sumMax = 0;
  tanks.forEach(t => { const o = normalizeTank(t); sum += o.hp; sumMax += o.maxHp; });
  if(sumMax === 0) return 0;
  return Math.max(0, Math.min(1, sum / sumMax));
}
function tacPrice(tier, isMap){
  const base = tier === 1 ? 800 : tier === 2 ? 1200 : 1600;
  return isMap ? Math.floor(base * 0.1) : base;
}
function tacCarryPrice(tier){
  const base = tier === 1 ? 100 : tier === 2 ? 150 : 200;
  return Math.floor(base * 0.1);
}

function charToCell(ch){
  switch(ch){
    case '.': return { terrain:'plain',    type:'neutral',  owner:'neutral' };
    case 'r': return { terrain:'road',     type:'neutral',  owner:'neutral' };
    case 'b': return { terrain:'bridge',   type:'neutral',  owner:'neutral' };
    case 'M': return { terrain:'mountain', type:'neutral',  owner:'neutral' };
    case '~': return { terrain:'river',    type:'neutral',  owner:'neutral' };
    case 's': return { terrain:'swamp',    type:'neutral',  owner:'neutral' };
    case 'c': case 'C': return { terrain:'plain', type:'city',    owner:'neutral' };
    case 'u': case 'U': return { terrain:'plain', type:'supply',  owner:'neutral' };
    case 'v': case 'V': return { terrain:'plain', type:'village', owner:'neutral' };
    case 'E': return { terrain:'plain', type:'elite',    owner:'ai' };
    case 'H': return { terrain:'plain', type:'hq',       owner:'ai' };
    case 'A': return { terrain:'plain', type:'ai_spawn', owner:'ai' };
    case 'P': return { terrain:'plain', type:'start',    owner:'player' };
    default:  return { terrain:'plain', type:'neutral',  owner:'neutral' };
  }
}
function parseMapTemplate(mapId){
  const rows = MAP_TEMPLATES[mapId]; if(!rows) return [];
  const cells = []; let id = 0;
  for(let r = 0; r < rows.length; r++){
    for(let c = 0; c < rows[r].length; c++){
      const info = charToCell(rows[r][c]);
      cells.push({ id, terrain:info.terrain, type:info.type, owner:info.owner, looted:false });
      id++;
    }
  }
  return cells;
}
function findCellsByChar(mapId, ch){
  const rows = MAP_TEMPLATES[mapId]; if(!rows) return [];
  const cols = rows[0].length; const res = [];
  for(let r = 0; r < rows.length; r++) for(let c = 0; c < rows[r].length; c++) if(rows[r][c] === ch) res.push(r * cols + c);
  return res;
}
function findCellByChar(mapId, ch){ const a = findCellsByChar(mapId, ch); return a.length ? a[0] : null; }
function getTerrainMP(terrain){ return TERRAIN_INFO[terrain] ? TERRAIN_INFO[terrain].mp : 1; }
function isCellPassable(cell){ return !!(cell && TERRAIN_INFO[cell.terrain] && TERRAIN_INFO[cell.terrain].pass); }

function getTacticalMods(att, def){
  const b = B.buffs;
  if(!b) return { atkMul:1, penMul:1, defArmorMul:1, dmgTakenMul:1 };
  const attIsP = att.side === 'player';
  const defIsP = def.side === 'player';
  const attNotActed = !att.actedThisTurn;
  let atkMul = 1, penMul = 1, defArmorMul = 1, dmgTakenMul = 1;
  if(attNotActed && b.smokeDebuff) atkMul *= (1 - b.smokeDebuff);
  if(attIsP && attNotActed){
    if(b.playerAtkBonus) atkMul *= (1 + b.playerAtkBonus);
    if(b.playerPenBonus) penMul *= (1 + b.playerPenBonus);
    if(b.playerDesperate) atkMul *= (1 + b.playerDesperate);
  }
  if(!attIsP && attNotActed && b.enemySuppress) atkMul *= (1 - b.enemySuppress);
  if(!attIsP && attNotActed && b.playerSuppress) atkMul *= (1 - b.playerSuppress);
  if(!attIsP && attNotActed && b.enemyAtkBonus) atkMul *= (1 + b.enemyAtkBonus);
  if(!attIsP && attNotActed && b.enemyPenBonus) penMul *= (1 + b.enemyPenBonus);
  if(defIsP){
    if(b.playerIronCurtain) dmgTakenMul *= (1 - b.playerIronCurtain);
    if(b.playerArmorBonus) defArmorMul *= (1 + b.playerArmorBonus);
    if(b.playerDesperate) dmgTakenMul *= (1 + b.playerDesperate);
  }
  if(!defIsP && b.enemySuppress) defArmorMul *= 1.2;
  if(!defIsP){
    if(b.enemyIronCurtain) dmgTakenMul *= (1 - b.enemyIronCurtain);
    if(b.enemyArmorBonus) defArmorMul *= (1 + b.enemyArmorBonus);
  }
  return { atkMul, penMul, defArmorMul, dmgTakenMul };
}
function calcDamageDetail(att, def, dist, cc){
  if(!canAtk(att, dist)) return { dmg: 0, mul: 0 };
  const mods = getTacticalMods(att, def);
  const cm = B.modifiers || {};
  const cmAtk = 1 + (cm.atkMod || 0);
  const cmPen = 1 + (cm.penMod || 0);
  const f = cm.floatRange || 0;
  const baseVmin = att.vetMin != null ? att.vetMin : 0.9;
  const baseVmax = att.vetMax != null ? att.vetMax : 1.1;
  const vmin = baseVmin - f;
  const vmax = baseVmax + f;
  const atkMul = (vmin + Math.random() * (vmax - vmin)) * mods.atkMul * cmAtk;
  const penMul = (vmin + Math.random() * (vmax - vmin)) * mods.penMul * cmPen;
  let ar = def.a * mods.defArmorMul;
  if(dist === 0 && cc >= 1) ar = ar * Math.pow(0.5, cc - 1);
  const km = dist / 1000;
  const epBase = att.heat ? att.p : att.p * (1 - 0.15 * km);
  const ep = epBase * penMul;
  const df = ar - ep;
  let m;
  if(att.fp <= 50) m = df <= 0 ? 1 : df <= 5 ? 0.5 : df <= 10 ? 0.25 : 0.125;
  else m = df <= 0 ? 1 : df <= 10 ? 0.5 : df <= 20 ? 0.25 : 0.125;
  return { dmg: Math.max(1, Math.round(att.at * atkMul * m * mods.dmgTakenMul)), mul: m };
}
function calcDamage(att, def, dist, cc){ return calcDamageDetail(att, def, dist, cc).dmg; }
function calcDamageRange(att, def, dist, cc){
  if(!canAtk(att, dist)) return { min: 0, max: 0 };
  const mods = getTacticalMods(att, def);
  const cm = B.modifiers || {};
  const cmAtk = 1 + (cm.atkMod || 0);
  const cmPen = 1 + (cm.penMod || 0);
  const f = cm.floatRange || 0;
  const baseVmin = att.vetMin != null ? att.vetMin : 0.9;
  const baseVmax = att.vetMax != null ? att.vetMax : 1.1;
  const vmin = baseVmin - f;
  const vmax = baseVmax + f;
  let ar = def.a * mods.defArmorMul;
  if(dist === 0 && cc >= 1) ar = ar * Math.pow(0.5, cc - 1);
  const km = dist / 1000;
  const epBase = att.heat ? att.p : att.p * (1 - 0.15 * km);
  let minD = Infinity, maxD = 0;
  for(const aMul0 of [vmin, vmax]){
    for(const pMul0 of [vmin, vmax]){
      const ep = epBase * pMul0 * cmPen;
      const df = ar - ep;
      let m;
      if(att.fp <= 50) m = df <= 0 ? 1 : df <= 5 ? 0.5 : df <= 10 ? 0.25 : 0.125;
      else m = df <= 0 ? 1 : df <= 10 ? 0.5 : df <= 20 ? 0.25 : 0.125;
      const d = Math.max(1, Math.round(att.at * aMul0 * cmAtk * mods.atkMul * m * mods.dmgTakenMul));
      if(d < minD) minD = d;
      if(d > maxD) maxD = d;
    }
  }
  return { min: minD, max: maxD };
}
function fmtDmgRange(r){ if(r.min === r.max) return String(r.min); return r.min + '~' + r.max; }

function thueMorse(i){ let b = 0, x = i; while(x > 0){ b += x & 1; x >>= 1; } return b & 1; }
function bsleep(ms){ if(BATTLE_SPEED) return sleep(Math.max(30, Math.round(ms / 3))); return sleep(ms); }
function floatDamage(unit, dmg, mul, isHeal){
  const el = document.querySelector(`[data-uid="${unit.uid}"]`);
  if(!el) return;
  const r = el.getBoundingClientRect();
  const cls = mul >= 1 ? 'crit' : mul >= 0.5 ? 'half' : mul >= 0.25 ? 'graze' : 'bounce';
  const div = document.createElement('div');
  div.className = 'dmg-float ' + (isHeal ? 'heal' : cls);
  div.textContent = (isHeal ? '+' : '-') + dmg;
  div.style.left = (r.left + r.width / 2) + 'px';
  div.style.top = (r.top + r.height * 0.3) + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1000);
  if(!isHeal){
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 250);
  }
}
function toast(msg){
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#4dff4d;color:#0a1f0a;padding:10px 20px;border-radius:10px;font-weight:800;z-index:999;font-size:14px;max-width:80vw;text-align:center';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1400);
}

const SFX = {
  ctx: null, enabled: false, volume: 0.6,
  init(){ if(this.ctx) return; try{ this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} },
  resume(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  noiseBuffer(dur){ const sr = this.ctx.sampleRate; const len = Math.max(1, Math.floor(sr * dur)); const buf = this.ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0); for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return buf; },
  _guard(){ return this.enabled && this.ctx; },
  fire(cal){
    if(!this._guard()) return; this.resume();
    const t = this.ctx.currentTime, v = this.volume; let c;
    if(cal <= 20) c = { o:[900,500,.12], n:{dur:.06,freq:3000}, sub:0 };
    else if(cal <= 50) c = { o:[400,150,.25], n:{dur:.15,freq:1600}, sub:0 };
    else if(cal <= 100) c = { o:[150,55,.6], n:{dur:.3,freq:800}, sub:70 };
    else c = { o:[75,28,1.2], n:{dur:.5,freq:400}, sub:42 };
    const osc = this.ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(c.o[0], t); osc.frequency.exponentialRampToValueAtTime(c.o[1], t + c.o[2]);
    const og = this.ctx.createGain(); og.gain.setValueAtTime(v, t); og.gain.exponentialRampToValueAtTime(.001, t + c.o[2]);
    osc.connect(og); og.connect(this.ctx.destination); osc.start(t); osc.stop(t + c.o[2] + .05);
    const n = this.ctx.createBufferSource(); n.buffer = this.noiseBuffer(c.n.dur);
    const nf = this.ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = c.n.freq;
    const ng = this.ctx.createGain(); ng.gain.setValueAtTime(v * .85, t); ng.gain.exponentialRampToValueAtTime(.001, t + c.n.dur);
    n.connect(nf); nf.connect(ng); ng.connect(this.ctx.destination); n.start(t);
    if(c.sub){ const s = this.ctx.createOscillator(); s.type = 'sine'; s.frequency.value = c.sub;
      const sg = this.ctx.createGain(); sg.gain.setValueAtTime(v * 1.1, t); sg.gain.exponentialRampToValueAtTime(.001, t + c.o[2] * 1.3);
      s.connect(sg); sg.connect(this.ctx.destination); s.start(t); s.stop(t + c.o[2] * 1.3 + .05); }
  },
  hit(type){
    if(!this._guard()) return; this.resume();
    const t = this.ctx.currentTime, v = this.volume;
    if(type === 'pierce'){ const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(280, t + .28); const g = this.ctx.createGain(); g.gain.setValueAtTime(v * .55, t); g.gain.exponentialRampToValueAtTime(.001, t + .28); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + .3); }
    else if(type === 'half'){ const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + .22); const g = this.ctx.createGain(); g.gain.setValueAtTime(v * .5, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + .25); }
    else if(type === 'graze'){ const n = this.ctx.createBufferSource(); n.buffer = this.noiseBuffer(.16); const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800; const g = this.ctx.createGain(); g.gain.setValueAtTime(v * .35, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); n.connect(f); f.connect(g); g.connect(this.ctx.destination); n.start(t); }
    else { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(2200, t); o.frequency.exponentialRampToValueAtTime(1400, t + .12); const g = this.ctx.createGain(); g.gain.setValueAtTime(v * .4, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + .18); }
  },
  explode(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(28, t + 1);
    const og = this.ctx.createGain(); og.gain.setValueAtTime(v * 1.2, t); og.gain.exponentialRampToValueAtTime(.001, t + 1);
    o.connect(og); og.connect(this.ctx.destination); o.start(t); o.stop(t + 1.05);
    const n = this.ctx.createBufferSource(); n.buffer = this.noiseBuffer(.9);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const ng = this.ctx.createGain(); ng.gain.setValueAtTime(v * .85, t); ng.gain.exponentialRampToValueAtTime(.001, t + .9);
    n.connect(f); f.connect(ng); ng.connect(this.ctx.destination); n.start(t); },
  move(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    const n = this.ctx.createBufferSource(); n.buffer = this.noiseBuffer(1.5);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 6;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(v * .4, t + .25); g.gain.linearRampToValueAtTime(v * .4, t + 1.05); g.gain.linearRampToValueAtTime(.001, t + 1.5);
    n.connect(f); f.connect(g); g.connect(this.ctx.destination); n.start(t); },
  tac(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    [800,1200].forEach((fr, i) => { const o = this.ctx.createOscillator(); o.type='triangle'; o.frequency.value=fr; const g = this.ctx.createGain(); const s = t+i*.1; g.gain.setValueAtTime(.001,s); g.gain.linearRampToValueAtTime(v*.4,s+.03); g.gain.exponentialRampToValueAtTime(.001,s+.35); o.connect(g); g.connect(this.ctx.destination); o.start(s); o.stop(s+.4); }); },
  win(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    [523.25,659.25,783.99,1046.5].forEach((fr, i) => { const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr; const g = this.ctx.createGain(); const s = t + i * .13; g.gain.setValueAtTime(.001, s); g.gain.linearRampToValueAtTime(v * .45, s + .04); g.gain.exponentialRampToValueAtTime(.001, s + .6); o.connect(g); g.connect(this.ctx.destination); o.start(s); o.stop(s + .65); }); },
  lose(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    [329.63,311.13,246.94].forEach((fr, i) => { const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; const g = this.ctx.createGain(); const s = t + i * .28; g.gain.setValueAtTime(.001, s); g.gain.linearRampToValueAtTime(v * .35, s + .04); g.gain.exponentialRampToValueAtTime(.001, s + .7); o.connect(g); g.connect(this.ctx.destination); o.start(s); o.stop(s + .75); }); },
  click(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 900;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(this.volume * .18, t); g.gain.exponentialRampToValueAtTime(.001, t + .05);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + .06); },
  coin(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    [1200,1600,2000].forEach((fr, i) => { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr; const g = this.ctx.createGain(); const s = t + i * .07; g.gain.setValueAtTime(v * .28, s); g.gain.exponentialRampToValueAtTime(.001, s + .2); o.connect(g); g.connect(this.ctx.destination); o.start(s); o.stop(s + .22); }); },
  reload(){ if(!this._guard()) return; this.resume(); const t = this.ctx.currentTime, v = this.volume;
    [0,.15].forEach((d, i) => { const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 500 + i * 200; const g = this.ctx.createGain(); const s = t + d; g.gain.setValueAtTime(v * .3, s); g.gain.exponentialRampToValueAtTime(.001, s + .12); o.connect(g); g.connect(this.ctx.destination); o.start(s); o.stop(s + .15); }); }
};

function loadSettings(){
  try{ const s = localStorage.getItem(SETTINGS_KEY);
    if(s){ const o = JSON.parse(s); SFX.enabled = !!o.sfxOn; SFX.volume = typeof o.sfxVolume === 'number' ? o.sfxVolume : .6; BATTLE_SPEED = !!o.battleSpeed; AUTO_BATTLE_CONTINUOUS = !!o.autoContinuous; }
  }catch(e){}
}
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sfxOn: SFX.enabled, sfxVolume: SFX.volume, battleSpeed: BATTLE_SPEED, autoContinuous: AUTO_BATTLE_CONTINUOUS })); }catch(e){} }
function toggleSfx(){ if(!SFX.enabled){ SFX.init(); SFX.resume(); SFX.enabled = true; SFX.click(); } else { SFX.enabled = false; } saveSettings(); render(); }
function setSfxVolume(v){ SFX.volume = v / 100; saveSettings(); const el = document.getElementById('volVal'); if(el) el.textContent = Math.round(v) + '%'; }
function toggleBattleSpeed(){ BATTLE_SPEED = !BATTLE_SPEED; saveSettings(); render(); }
function toggleAutoContinuous(){ AUTO_BATTLE_CONTINUOUS = !AUTO_BATTLE_CONTINUOUS; saveSettings(); render(); }