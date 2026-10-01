// ============================================================
// battle.js — 战斗系统
// ============================================================

function initBattleBuffs(){
  B.buffs = {
    playerAtkBonus: 0, playerPenBonus: 0, playerIronCurtain: 0, playerArmorBonus: 0,
    smokeDebuff: 0, playerDesperate: 0, enemySuppress: 0, playerNextFullDmg: false,
    enemyAtkBonus: 0, enemyPenBonus: 0, enemyIronCurtain: 0, enemyArmorBonus: 0,
    playerSuppress: 0, enemyNextFullDmg: false,
  };
}
function resetBuffsTurn(){ initBattleBuffs(); }
function showRoundBanner(round, stgName){
  const el = document.createElement('div');
  el.className = 'round-banner';
  el.innerHTML = `第 ${round} 回合<br><span style="font-size:13px;opacity:.95;letter-spacing:2px">📍 ${stgName}</span>`;
  document.body.appendChild(el);
  const dur = BATTLE_SPEED ? 450 : 1300;
  el.style.animationDuration = dur + 'ms';
  setTimeout(() => el.remove(), dur + 100);
}
function makeBattleUnit(name, side, idx, hpOverride, exp, tankUid){
  const t = TANKS[name] || ELITE_TANKS[name];
  const star = getStar(exp || 0);
  const float = veteranFloat(star);
  const vetMul = veteranMul(star);
  const baseMaxHp = t.ac;
  const maxHp = Math.round(baseMaxHp * vetMul);
  let hp;
  if(typeof hpOverride === 'number' && hpOverride > 0){
    const ratio = Math.max(0, Math.min(1, hpOverride / baseMaxHp));
    hp = Math.max(1, Math.round(maxHp * ratio));
  } else {
    hp = maxHp;
  }
  const u = { uid: 'bu' + (B.uid++), name, icon: TY_ICON[t.ty], ty: t.ty, fp: t.fp, fd: t.fd, at: t.at, s: Math.round(t.s * vetMul), p: t.p, a: Math.round(t.a * vetMul), heat: !!t.heat, maxHp, hp, side, idx, alive: true, actedThisTurn: false, usedTacticalThisTurn: false, skipTurn: false, vetMin: float.min, vetMax: float.max, star, exp: exp || 0, baseMaxHp, tankUid: tankUid || null };
  B.stats[u.uid] = { name: u.name, icon: u.icon, side, dmg: 0, kills: 0, alive: true, taken: 0 };
  return u;
}
function addBLog(html){ B.log.push(html); if(B.log.length > 140) B.log.shift(); }
function renderBattle(){
  const en = B.units.filter(u => u.side === 'enemy');
  const pl = B.units.filter(u => u.side === 'player');
  const stg = STG[B.stageIdx];
  let banner = '';
  if(B.over) banner = `<div class="bbanner done">战斗结束</div>`;
  else if(B.cur){ const side = B.cur.side === 'player' ? 'p' : 'e'; banner = `<div class="bbanner ${side}">${B.cur.side === 'player' ? '🔵 蓝方' : '🔴 红方'} · ${B.cur.name}</div>`; }
  return `<div class="bwrap">
    <div class="bteam bteam-top">${en.map(renderBUnit).join('')}</div>
    <div class="bdist">📍 <b>${stg.n}</b>${B.stageIdx === 4 ? ` · 近身${B.ccRound}` : ''}
      <div class="speed-stack">
        <button class="speed-btn ${BATTLE_SPEED?'on':''}" onclick="toggleBattleSpeed()">${BATTLE_SPEED?'⏩3×':'⏩1×'}</button>
        <button class="speed-btn ${B.auto?'on':''}" onclick="toggleAuto()">${B.auto?'⏹停止':'🤖自动'}</button>
      </div>
    </div>
    <div class="bbanner-slot">${banner}</div>
    <div id="blog">${B.log.map(l => `<div>${l}</div>`).join('')}</div>
    <div class="bteam bteam-bot">${pl.map(renderBUnit).join('')}</div>
    <div id="tacticalBar">${tacticalBarHTML()}</div>
    <div id="bact">${battleActionHTML()}</div>
  </div>`;
}
function getAlivePlayerUnits(){ return B.units.filter(u => u.alive && u.side === 'player'); }
function getRetreatNeeded(){ return Math.floor(getAlivePlayerUnits().length / 2); }
function getRetreatEligible(){ return getAlivePlayerUnits().filter(u => !u.actedThisTurn); }
function canRetreat(){
  if(B.over) return false;
  if(B.round <= 1) return false;
  if(B.stageIdx <= 0) return false;
  if(B.retreatUsedThisTurn) return false;
  if(!B.cur || B.cur.side !== 'player') return false;
  if(B.await !== 'target') return false;
  const need = getRetreatNeeded();
  if(need <= 0) return false;
  if(getRetreatEligible().length < need) return false;
  return true;
}
function startRetreat(){ if(!canRetreat()) return; B.retreatSelect = true; B.retreatPicked = []; render(); }
function cancelRetreat(){ B.retreatSelect = false; B.retreatPicked = []; render(); }
function toggleRetreatPick(uid){
  if(!B.retreatSelect) return;
  const u = B.units.find(x => x.uid === uid);
  if(!u || !u.alive || u.side !== 'player' || u.actedThisTurn) return;
  const idx = B.retreatPicked.indexOf(uid);
  if(idx >= 0) B.retreatPicked.splice(idx, 1); else B.retreatPicked.push(uid);
  const need = getRetreatNeeded();
  if(B.retreatPicked.length >= need) executeRetreat(); else render();
}
function executeRetreat(){
  const need = getRetreatNeeded();
  if(B.retreatPicked.length < need) return;
  const picked = [...B.retreatPicked];
  picked.forEach(uid => { const u = B.units.find(x => x.uid === uid); if(u) u.actedThisTurn = true; });
  B.stageIdx--;
  if(B.stageIdx < 4) B.ccRound = 0;
  B.retreatUsedThisTurn = true;
  B.retreatSelect = false;
  B.retreatPicked = [];
  const tankNames = picked.map(uid => B.units.find(x => x.uid === uid)).filter(Boolean).map(u => u.name).join('、');
  addBLog(`<div class="round-sep">🔙 我方撤退至 ${STG[B.stageIdx].n}（放弃行动：${tankNames}）</div>`);
  SFX.move(); B.lastStage = -1;
  const curUid = B.cur ? B.cur.uid : null;
  const curRetreated = curUid && picked.includes(curUid);
  render();
  if(curRetreated && B.resolve){
    const r = B.resolve; B.resolve = null; B.await = null; r({ __retreat: true });
  }
}
function tacticalBarHTML(){
  if(B.over) return '';
  const cur = B.cur;
  if(!cur){ return '<div class="bhint" style="width:100%">—</div>'; }
  const isHotseat = B.mode === 'free' && B.freeMode === 'hotseat';
  const isP = cur.side === 'player';
  const canControl = isP || isHotseat;
  const buttons = [];
  if(canControl && B.tactical){
    const eq = isP ? (B.tactical.playerEquipped || []) : (B.tactical.enemyEquipped || []);
    if(eq.length === 0){
      buttons.push('<div class="bhint" style="width:100%">未装备指令</div>');
    } else {
      const used = isP ? (B.tactical.playerUsed || []) : (B.tactical.enemyUsed || []);
      const isMap = B.mode === 'map';
      const unitBlocked = cur.usedTacticalThisTurn;
      const noSlots = used.length >= eq.length;
      eq.forEach(tid => {
        const t = TACTICALS.find(x => x.id === tid);
        if(!t) return;
        const isUsed = used.includes(tid);
        const cls = ['tbtn', 'tier-' + t.tier];
        if(isUsed || unitBlocked || noSlots) cls.push('used');
        const price = isMap ? tacCarryPrice(t.tier) : 0;
        const priceHtml = isMap ? `<span class="tprice">${price} RP</span>` : '';
        buttons.push(`<button class="${cls.join(' ')}" onclick="useTactical('${t.id}')" title="${t.desc}"><span class="ttier">T${t.tier}</span>${t.icon} ${t.name}${priceHtml}</button>`);
      });
    }
  } else {
    buttons.push('<div class="bhint" style="width:100%">—</div>');
  }
  if(B.retreatSelect){
    const need = getRetreatNeeded();
    buttons.push(`<button class="tbtn retreat-btn active" onclick="cancelRetreat()">✖ 取消 (${B.retreatPicked.length}/${need})</button>`);
  } else if(canRetreat()){
    buttons.push(`<button class="tbtn retreat-btn" onclick="startRetreat()">🔙 撤退</button>`);
  }
  return buttons.join('');
}
function renderBUnit(u){
  const pct = Math.max(0, u.hp / u.maxHp * 100);
  let cls = 'bunit ' + u.side;
  if(!u.alive) cls += ' dead';
  else if(B.cur === u && !B.over) cls += ' act';
  else if(u.actedThisTurn && !B.over) cls += ' acted';
  if(B.retreatSelect && B.retreatPicked.includes(u.uid) && u.alive) cls += ' retreat-picked';
  let badge = '';
  if(B.await === 'target' && !B.retreatSelect && u.alive && u.side !== B.cur.side){
    const r = calcDamageRange(B.cur, u, STG[B.stageIdx].d, B.ccRound);
    if(r.max > 0){ cls += ' tgt'; badge = `<div class="bbadge">-${fmtDmgRange(r)}</div>`; }
  }
  let actMark = '';
  if(u.alive && !B.over){
    if(u.actedThisTurn) actMark = '<span class="bact-mark">✓</span>';
    else if(B.cur === u) actMark = '<span class="bact-mark" style="color:#ffd76e">▶</span>';
  }
  const st = u.star || 0;
  const starStr = st > 0 ? ' ' + '★'.repeat(st) : '';
  return `<div class="${cls}" data-uid="${u.uid}" onclick="clickBUnit('${u.uid}')">${badge}${actMark}
    <div class="bnm">${u.icon}<span class="tank-name" data-star="${st}">${u.name}${starStr}</span></div>
    <div class="bhp"><i style="width:${pct}%"></i></div>
    <div class="bnum">${u.hp}/${u.maxHp}</div>
    <div class="bst"><span style="color:#ff8a6b">${u.at}</span><span style="color:#4dd0ff">${u.s}</span><span style="color:#c86bff">${u.p}${u.heat?'*':''}</span><span style="color:#ffb84d">${u.a}</span></div></div>`;
}
function battleActionHTML(){
  if(B.over) return '<div class="bhint">战斗结束</div>';
  if(B.retreatSelect){
    const need = getRetreatNeeded();
    return `<div class="bhint" style="color:#a8c8e8">🔙 撤退：点选 ${need} 辆坦克放弃攻击（已选 ${B.retreatPicked.length}）</div>`;
  }
  if(B.await === 'target'){
    if(B.auto) return '<div class="bhint">🤖 自动战斗中…</div>';
    const u = B.cur; const dist = STG[B.stageIdx].d;
    const foes = B.units.filter(x => x.alive && x.side !== u.side);
    const sideTag = (B.mode === 'free' && B.freeMode === 'hotseat') ? (u.side === 'player' ? '🔵 蓝方' : '🔴 红方') + ' · ' : '';
    if(!foes.some(f => canAtk(u, dist))){
      return `<div class="bhint">${sideTag}射程不足</div>
        <div style="text-align:center;margin-top:6px"><button class="btn sm" onclick="skipPlayerTurn()">⏭ 跳过本回合</button></div>`;
    }
    return `<div class="bhint">${sideTag}点击敌方</div>
      <div class="bdl">${foes.map(f => { const r = calcDamageRange(u, f, dist, B.ccRound);
        if(r.max <= 0) return `<div class="bdi">${f.icon}${f.name} 射程外</div>`;
        return `<div class="bdi" onclick="clickBUnit('${f.uid}')">${f.icon}${f.name}<b>-${fmtDmgRange(r)}</b></div>`; }).join('')}</div>`;
  }
  return '<div class="bhint">等待中…</div>';
}

function skipPlayerTurn(){
  if(B.await !== 'target') return;
  const r = B.resolve;
  B.resolve = null; B.await = null;
  if(r) r({ __skip: true });
}

function buildBattleOrder(){
  const alive = B.units.filter(u => u.alive);
  const groups = new Map();
  alive.forEach(u => { const k = u.s; if(!groups.has(k)) groups.set(k, []); groups.get(k).push(u); });
  const sp = [...groups.keys()].sort((a, b) => b - a); const o = [];
  sp.forEach(s => {
    const grp = groups.get(s);
    const ps = grp.filter(u => u.side === 'player').sort((a, b) => a.idx - b.idx);
    const es = grp.filter(u => u.side === 'enemy').sort((a, b) => a.idx - b.idx);
    if(ps.length && es.length){ let pi = 0, ei = 0;
      for(let i = 0; i < ps.length + es.length; i++){ const t = thueMorse(i);
        if(t === 0 && pi < ps.length) o.push(ps[pi++]);
        else if(t === 1 && ei < es.length) o.push(es[ei++]);
        else if(pi < ps.length) o.push(ps[pi++]);
        else if(ei < es.length) o.push(es[ei++]); } }
    else o.push(...grp.sort((a, b) => a.idx - b.idx));
  });
  return o;
}
function clickBUnit(uid){
  const u = B.units.find(x => x.uid === uid); if(!u) return;
  if(B.retreatSelect){ toggleRetreatPick(uid); return; }
  if(B.await === 'target' && u.alive && u.side !== B.cur.side){
    if(B.auto) return;
    const dist = STG[B.stageIdx].d; if(!canAtk(B.cur, dist)) return;
    const r = B.resolve; B.resolve = null; B.await = null; r(u); return;
  }
  showBattleDetail(u);
}
function showBattleDetail(u){
  document.querySelectorAll('.detail').forEach(el => el.remove());
  const m = document.createElement('div'); m.className = 'detail';
  m.onclick = e => { if(e.target === m) m.remove(); };
  const st = u.star || 0;
  const stars = st > 0 ? ' ' + '★'.repeat(st) : '';
  m.innerHTML = `<h3>${u.icon}<span class="tank-name" data-star="${st}">${u.name}${stars}</span> ${TY_CN[u.ty]}</h3>
    <div class="stats"><div><span>火力</span><b>${u.fd}</b></div><div><span>攻击</span><b>${u.at}</b></div>
    <div><span>速度</span><b>${u.s}</b></div><div><span>穿深</span><b>${u.p}${u.heat?'*':''}</b></div>
    <div><span>装甲</span><b>${u.a}</b></div><div><span>活度</span><b>${u.hp}/${u.maxHp}</b></div></div>
    <div class="acts"><button class="btn" onclick="this.closest('.detail').remove()">关闭</button></div>`;
  document.body.appendChild(m);
}
function waitPlayerTarget(u){ return new Promise(r => { B.resolve = r; B.await = 'target'; render(); }); }

function useTactical(tacId){
  if(!B.cur || B.over || B.auto) return;
  const isHotseat = B.mode === 'free' && B.freeMode === 'hotseat';
  const side = B.cur.side;
  if(side !== 'player' && !isHotseat) return;
  const u = B.cur;
  if(u.usedTacticalThisTurn){ toast('本回合已使用过指令'); return; }
  const isP = side === 'player';
  const eq = isP ? (B.tactical.playerEquipped || []) : (B.tactical.enemyEquipped || []);
  const used = isP ? (B.tactical.playerUsed || []) : (B.tactical.enemyUsed || []);
  if(!eq.includes(tacId)){ toast('未装备该指令'); return; }
  if(used.includes(tacId)){ toast('该指令已用过'); return; }
  if(used.length >= eq.length){ toast('指令已用尽'); return; }
  const t = TACTICALS.find(x => x.id === tacId);
  if(!t) return;
  if(B.mode === 'map' && isP){
    const sv = getMapCur();
    if(!sv) return;
    const price = tacCarryPrice(t.tier);
    if(sv.rp < price){ toast(`RP不足（需 ${price}）`); return; }
    sv.rp -= price;
    persistMapSaves();
  }
  SFX.tac();
  applyTactical(t, u, side);
  u.usedTacticalThisTurn = true;
  used.push(tacId);
  render();
}
function applyTactical(tac, u, side){
  const b = B.buffs;
  const isP = side === 'player';
  const allyPrefix = isP ? 'player' : 'enemy';
  switch(tac.id){
    case 'volley': b[allyPrefix + 'AtkBonus'] = 0.20; break;
    case 'apround': b[allyPrefix + 'PenBonus'] = 0.30; break;
    case 'smoke': b.smokeDebuff = 0.30; break;
    case 'iron': b[allyPrefix + 'IronCurtain'] = 0.50; break;
    case 'cover': b[allyPrefix + 'ArmorBonus'] = 0.30; break;
    case 'desperate': if(isP) b.playerDesperate = 0.50; else b.enemyDesperate = 0.50; break;
    case 'suppress': if(isP) b.enemySuppress = 0.50; else b.playerSuppress = 0.50; break;
    case 'pierce': if(isP) b.playerNextFullDmg = true; else b.enemyNextFullDmg = true; break;
    case 'repair': {
      const allies = B.units.filter(x => x.alive && x.side === side);
      if(!allies.length) break;
      allies.sort((a, c) => (a.hp/a.maxHp) - (c.hp/c.maxHp));
      const tgt = allies[0];
      const heal = Math.round(tgt.maxHp * 0.30);
      tgt.hp = Math.min(tgt.maxHp, tgt.hp + heal);
      addBLog(`<div class="tac">${isP?'🔵':'🔴'} ${tac.icon} ${tgt.name} 恢复 ${heal} 血量</div>`);
      floatDamage(tgt, heal, 1, true);
      break;
    }
    case 'fieldfix': {
      const allies = B.units.filter(x => x.alive && x.side === side && !x.actedThisTurn);
      allies.forEach(a => { const heal = Math.round(a.maxHp * 0.10); a.hp = Math.min(a.maxHp, a.hp + heal); floatDamage(a, heal, 1, true); });
      addBLog(`<div class="tac">${isP?'🔵':'🔴'} ${tac.icon} 全体战场修复 · ${allies.length} 辆坦克各恢复 10% 血量</div>`);
      break;
    }
    case 'artillery': {
      const foes = B.units.filter(x => x.alive && x.side !== side);
      if(!foes.length) break;
      foes.sort((a, c) => (a.hp/a.maxHp) - (c.hp/c.maxHp));
      const tgt = foes[0];
      const dist = STG[B.stageIdx].d;
      const coef = 1 - dist/3000 * 0.5;
      const dmg = Math.max(1, Math.round(150 * coef));
      tgt.hp = Math.max(0, tgt.hp - dmg);
      floatDamage(tgt, dmg, 1);
      if(tgt.hp <= 0){ tgt.alive = false; if(B.stats[tgt.uid]) B.stats[tgt.uid].alive = false; }
      addBLog(`<div class="tac">${isP?'🔵':'🔴'} ${tac.icon} 炮火支援 · ${tgt.name} 受到 ${dmg} 伤害</div>`);
      break;
    }
    case 'jam': {
      const foes = B.units.filter(x => x.alive && x.side !== side && !x.actedThisTurn);
      if(!foes.length) break;
      const tgt = foes[Math.floor(Math.random() * foes.length)];
      tgt.skipTurn = true;
      addBLog(`<div class="tac">${isP?'🔵':'🔴'} ${tac.icon} 电子干扰 · ${tgt.name} 本回合被跳过</div>`);
      break;
    }
  }
}
function aiPickTactical(u){
  const side = u.side;
  const eq = side === 'player' ? (B.tactical.playerEquipped || []) : (B.tactical.enemyEquipped || []);
  const used = side === 'player' ? (B.tactical.playerUsed || []) : (B.tactical.enemyUsed || []);
  const avail = eq.filter(id => !used.includes(id));
  if(avail.length === 0) return null;
  if(u.usedTacticalThisTurn) return null;
  const allies = B.units.filter(x => x.alive && x.side === side);
  const foes = B.units.filter(x => x.alive && x.side !== side);
  if(allies.length === 0 || foes.length === 0) return null;
  const myHpPct = allies.reduce((s, a) => s + a.hp/a.maxHp, 0) / allies.length;
  const foeHpPct = foes.reduce((s, a) => s + a.hp/a.maxHp, 0) / foes.length;
  const myLowHp = allies.some(a => a.hp/a.maxHp < 0.4);
  const has = (id) => avail.includes(id);
  if(myLowHp && has('repair')) return TACTICALS.find(t => t.id === 'repair');
  if(myLowHp && has('fieldfix')) return TACTICALS.find(t => t.id === 'fieldfix');
  if(foeHpPct > myHpPct + 0.15){
    if(has('smoke')) return TACTICALS.find(t => t.id === 'smoke');
    if(has('iron')) return TACTICALS.find(t => t.id === 'iron');
    if(has('cover')) return TACTICALS.find(t => t.id === 'cover');
  }
  if(myHpPct > foeHpPct + 0.15){
    if(has('volley')) return TACTICALS.find(t => t.id === 'volley');
    if(has('apround')) return TACTICALS.find(t => t.id === 'apround');
    if(has('desperate')) return TACTICALS.find(t => t.id === 'desperate');
  }
  const weakFoe = foes.find(f => f.hp/f.maxHp < 0.4);
  if(weakFoe && has('artillery')) return TACTICALS.find(t => t.id === 'artillery');
  const r = avail[Math.floor(Math.random() * avail.length)];
  return TACTICALS.find(t => t.id === r);
}
async function tryAIUseTactical(u){
  if(!B.tactical) return false;
  const side = u.side;
  const eq = side === 'player' ? (B.tactical.playerEquipped || []) : (B.tactical.enemyEquipped || []);
  const used = side === 'player' ? (B.tactical.playerUsed || []) : (B.tactical.enemyUsed || []);
  if(used.length >= eq.length) return false;
  const tac = aiPickTactical(u);
  if(!tac) return false;
  if(B.mode === 'map' && side === 'player'){
    const sv = getMapCur();
    if(!sv) return false;
    const price = tacCarryPrice(tac.tier);
    if(sv.rp < price) return false;
    sv.rp -= price;
    persistMapSaves();
  }
  applyTactical(tac, u, side);
  u.usedTacticalThisTurn = true;
  used.push(tac.id);
  render(); await bsleep(400);
  return true;
}
function getAITacticalSlotsForBattle(){
  if(B.mode === 'campaign'){
    const ch = getCur() ? getCur().chapter : 1;
    return ch >= 21 ? 2 : ch >= 11 ? 1 : 0;
  }
  if(B.mode === 'map'){
    const sv = getMapCur(); if(!sv) return 0;
    let maxLv = 0;
    (sv.aiUnits || []).forEach(u => {
      (u.tanks || []).forEach(t => {
        const name = tankName(t);
        for(const nat of ['德','美','苏']){
          const tr = TREES[nat][name];
          if(tr){ maxLv = Math.max(maxLv, tr.lv); return; }
        }
        if(ELITE_TANKS[name]) maxLv = Math.max(maxLv, 15);
      });
    });
    return maxLv >= 11 ? 2 : maxLv >= 7 ? 1 : 0;
  }
  return 0;
}
function setupAITacticalPool(slots){
  if(slots <= 0){ B.tactical.enemyEquipped = []; return; }
  const pool = TACTICALS.filter(t => t.tier === 1).map(t => t.id);
  const picked = [];
  for(let i = 0; i < slots && pool.length > 0; i++){
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]); pool.splice(idx, 1);
  }
  B.tactical.enemyEquipped = picked;
}

async function doBattleAttack(att, target, dist, cc){
  let r;
  const vmin = att.vetMin != null ? att.vetMin : 0.9;
  const vmax = att.vetMax != null ? att.vetMax : 1.1;
  const vRnd = () => vmin + Math.random() * (vmax - vmin);
  if(att.side === 'player' && B.buffs && B.buffs.playerNextFullDmg){
    const mods = getTacticalMods(att, target);
    const atkMul = vRnd() * mods.atkMul;
    r = { dmg: Math.max(1, Math.round(att.at * atkMul * mods.dmgTakenMul)), mul: 1 };
    B.buffs.playerNextFullDmg = false;
  } else if(att.side === 'enemy' && B.buffs && B.buffs.enemyNextFullDmg){
    const mods = getTacticalMods(att, target);
    const atkMul = vRnd() * mods.atkMul;
    r = { dmg: Math.max(1, Math.round(att.at * atkMul * mods.dmgTakenMul)), mul: 1 };
    B.buffs.enemyNextFullDmg = false;
  } else {
    r = calcDamageDetail(att, target, dist, B.ccRound);
  }
  if(r.dmg <= 0) return;
  SFX.fire(att.fp);
  const wasFull = (target.hp === target.maxHp);
  target.hp = Math.max(0, target.hp - r.dmg);
  floatDamage(target, r.dmg, r.mul);
  const ac = att.side === 'player' ? 'pl' : 'en';
  const dc = target.side === 'player' ? 'pl' : 'en';
  const info = r.mul >= 1 ? { w:'击穿', e:'💥', c:'crit', sfx:'pierce' }
             : r.mul >= 0.5 ? { w:'半穿', e:'⚡', c:'half', sfx:'half' }
             : r.mul >= 0.25 ? { w:'擦伤', e:'💢', c:'graze', sfx:'graze' }
             : { w:'跳弹', e:'🛡️', c:'bounce', sfx:'bounce' };
  SFX.hit(info.sfx);
  const s1 = B.stats[att.uid]; if(s1) s1.dmg += r.dmg;
  const s2 = B.stats[target.uid]; if(s2) s2.taken += r.dmg;
  if(target.hp <= 0){
    target.alive = false; if(s1) s1.kills += 1; if(s2) s2.alive = false;
    SFX.explode();
    if(r.mul >= 1 && wasFull) addBLog(`<div class="oneshot">${info.e} <b class="${ac}">${att.name}</b> 一炮摧毁了 <b class="${dc}">${target.name}</b>！</div>`);
    else addBLog(`<span class="${info.c}">${info.e} <b class="${ac}">${att.name}</b> ${info.w} <b class="${dc}">${target.name}</b>，${r.dmg} 伤害 <span class="kill-word">【击毁】</span></span>`);
  } else {
    addBLog(`<span class="${info.c}">${info.e} <b class="${ac}">${att.name}</b> ${info.w} <b class="${dc}">${target.name}</b>，<span class="dmg">${r.dmg}</span> 伤害</span>`);
  }
  render(); await bsleep(350);
}
function aiBattleChoose(u){
  const foes = B.units.filter(x => x.alive && x.side !== u.side);
  const dist = STG[B.stageIdx].d;
  let best = null, bs = -1;
  for(const f of foes){
    const d = calcDamage(u, f, dist, B.ccRound);
    if(d <= 0) continue;
    const sc = d + (f.maxHp - f.hp) * 0.3;
    if(sc > bs){ bs = sc; best = f; }
  }
  if(best) return best;
  return foes[Math.floor(Math.random() * foes.length)];
}
function checkBattleOver(){
  const p = B.units.some(u => u.side === 'player' && u.alive);
  const e = B.units.some(u => u.side === 'enemy' && u.alive);
  if(!p || !e){ B.over = true; B.result = p ? 'win' : (e ? 'lose' : 'draw'); }
}
async function runBattle(){
  while(!B.over){
    B.round++;
    const stg = STG[B.stageIdx]; const dist = stg.d; const cc = B.stageIdx === 4;
    if(cc) B.ccRound++;
    addBLog(`<div class="round-sep">⚔️ 第 ${B.round} 回合 · 📍 ${stg.n}${cc?` · 近身${B.ccRound}`:''}</div>`);
    showRoundBanner(B.round, stg.n + (cc ? ` · 近身${B.ccRound}` : ''));
    B.units.forEach(u => { u.actedThisTurn = false; u.usedTacticalThisTurn = false; });
    B.retreatUsedThisTurn = false;
    B.retreatSelect = false;
    B.retreatPicked = [];
    resetBuffsTurn();
    render(); await bsleep(700);
    const order = buildBattleOrder();
    for(const u of order){
      if(B.over) break; if(!u.alive) continue;
      if(u.actedThisTurn) continue;
      B.cur = u; B.await = null; render(); await bsleep(150);
      if(u.skipTurn){
        u.skipTurn = false;
        addBLog(`📡 <b class="${u.side === 'player' ? 'pl' : 'en'}">${u.name}</b> 被电子干扰跳过`);
        u.actedThisTurn = true; render(); await bsleep(300); continue;
      }
      if(cc && u.ty === 'td' && B.ccRound % 2 === 1){
        addBLog(`⏳ <b class="${u.side === 'player' ? 'pl' : 'en'}">${u.name}</b> 装填中`);
        SFX.reload(); u.actedThisTurn = true; render(); await bsleep(200); continue;
      }
      if(!canAtk(u, dist)){
        addBLog(`🚗 <b class="${u.side === 'player' ? 'pl' : 'en'}">${u.name}</b> 射程不足`);
        u.actedThisTurn = true; render(); await bsleep(150); continue;
      }
      let isAI;
      if(B.mode === 'free' && B.freeMode === 'hotseat'){
        isAI = B.auto;
      } else {
        isAI = (u.side === 'enemy') || B.auto;
      }
      if(isAI){
        if(B.tactical){ await tryAIUseTactical(u); }
        await bsleep(300);
        const target = aiBattleChoose(u);
        if(target){ await doBattleAttack(u, target, dist, cc); }
      } else {
        let target = await waitPlayerTarget(u);
        if(B.over) break;
        if(target && target.__retreat){ continue; }
        if(target && target.__skip){
          u.actedThisTurn = true;
          render(); await bsleep(200);
          continue;
        }
        if(target && target.__auto){
          await tryAIUseTactical(u);
          const t2 = aiBattleChoose(u);
          if(t2) await doBattleAttack(u, t2, dist, cc);
        } else if(target){
          await doBattleAttack(u, target, dist, cc);
        }
      }
      u.actedThisTurn = true;
      checkBattleOver();
    }
    if(B.over) break;
    if(B.stageIdx < 4){
      B.stageIdx++;
      addBLog(`📦 双方移动至 <b>${STG[B.stageIdx].n}</b>`);
      SFX.move(); render(); await bsleep(800);
    }
  }
  B.cur = null; B.auto = false;
  B.perfect = B.units.filter(u => u.side === 'player' && !u.alive).length === 0;
  render(); await sleep(400);
  if(B.mode === 'campaign'){
    const cur = getCur();
    const fullReward = levelReward(cur.chapter);
    let mult = 1;
    if(B.difficulty === 'normal') mult = 1.1; else if(B.difficulty === 'hard') mult = 1.35;
    const firstClear = (B.result === 'win' && cur.chapter > cur.clearMax);
    if(B.result === 'win'){
      let base = Math.round(fullReward * mult);
      if(firstClear) base = Math.round(base * 1.5);
      if(B.perfect) base = Math.round(base * 1.3);
      B.earned = base; B.isFirstClear = firstClear;
      if(cur.chapter === cur.clearMax + 1) cur.clearMax = cur.chapter;
    } else {
      B.earned = Math.round(fullReward * 0.65 * mult);
      B.isFirstClear = false;
    }
    cur.rp += B.earned;
    applyCampaignVeteranResult(cur);
    persistSaves(); SFX.coin();
  }
  showBattleResult();
}
function toggleAuto(){
  B.auto = !B.auto;
  if(B.auto && B.await === 'target'){
    if(B.resolve) B.resolve({ __auto: true });
    B.resolve = null; B.await = null;
  }
  render();
}
function renderStatsHTML(){
  try{
    const stats = B.stats || {}; const arr = Object.values(stats);
    if(!arr.length) return '';
    const blue = arr.filter(s => s.side === 'player'); const red = arr.filter(s => s.side === 'enemy');
    const bS = { dmg: blue.reduce((s,x) => s + (x.dmg||0), 0), kills: blue.reduce((s,x) => s + (x.kills||0), 0), lost: blue.filter(x => !x.alive).length };
    const rS = { dmg: red.reduce((s,x) => s + (x.dmg||0), 0), kills: red.reduce((s,x) => s + (x.kills||0), 0), lost: red.filter(x => !x.alive).length };
    let mvp = null;
    for(const s of arr){ if(!mvp || (s.dmg||0) > (mvp.dmg||0) || ((s.dmg||0) === (mvp.dmg||0) && (s.kills||0) > (mvp.kills||0))) mvp = s; }
    if(!mvp) return '';
    const ms = mvp.side === 'player' ? '🔵' : '🔴';
    return `<div class="res-card" style="margin-top:8px"><div style="font-size:13px;color:#8ab88a;margin-bottom:8px">📊 战斗统计</div>
      <div class="stat-mvp"><div style="font-size:12px;font-weight:800;color:#ffd76e">🏆 MVP</div>
        <div style="font-size:14px;font-weight:700">${ms} ${mvp.icon || ''} ${esc(mvp.name)}</div>
        <div style="font-size:11px;color:#8ab88a">伤害 <b style="color:#ffd76e">${mvp.dmg||0}</b> · 击毁 <b style="color:#ffd76e">${mvp.kills||0}</b></div></div>
      <div style="display:flex;gap:8px;margin-top:10px;font-size:12px">
        <div style="flex:1;background:rgba(77,255,123,.08);padding:8px;border-radius:8px;line-height:1.6">
          <div style="color:#7bff7b;font-weight:700">🔵 蓝方</div><div>伤害 ${bS.dmg}</div><div>击毁 ${bS.kills}</div><div>损失 ${bS.lost}</div></div>
        <div style="flex:1;background:rgba(255,107,107,.08);padding:8px;border-radius:8px;line-height:1.6">
          <div style="color:#ff9c9c;font-weight:700">🔴 红方</div><div>伤害 ${rS.dmg}</div><div>击毁 ${rS.kills}</div><div>损失 ${rS.lost}</div></div>
      </div></div>`;
  }catch(e){ return ''; }
}
function applyCampaignVeteranResult(cur){
  const updates = [];
  B.units.filter(u => u.side === 'player').forEach(u => {
    const kills = (B.stats[u.uid] && B.stats[u.uid].kills) || 0;
    const tankIdx = cur.lineup[u.idx];
    if(tankIdx === undefined || !cur.tank[tankIdx]) return;
    const gain = u.alive ? (kills * 100 + 150) : (kills * 75 + 75);
    const oldExp = cur.tank[tankIdx].exp || 0;
    const newExp = oldExp + gain;
    cur.tank[tankIdx].exp = newExp;
    updates.push({ name: cur.tank[tankIdx].n, gain, oldExp, newExp, alive: u.alive, starBefore: u.star || 0, starAfter: getStar(newExp) });
  });
  B._veteranResult = updates;
}
function applyMapVeteranResult(unit){
  const sv = getMapCur();
  if(!sv || !unit) return;
  const originalTanks = unit.tanks || [];
  const newTanks = [];
  const updates = [];
  const ownedList = sv.ownedTanks || [];
  B.units.filter(u => u.side === 'player').forEach(u => {
    const kills = (B.stats[u.uid] && B.stats[u.uid].kills) || 0;
    const orig = originalTanks[u.idx];
    if(!orig) return;
    const gain = u.alive ? (kills * 100 + 150) : (kills * 75 + 75);
    const oldExp = orig.exp || 0;
    const newExp = oldExp + gain;
    updates.push({ name: orig.n, gain, oldExp, newExp, alive: u.alive, starBefore: u.star, starAfter: getStar(newExp) });
    const origUid = orig.tankUid || u.tankUid || null;
    if(u.alive){
      const baseMax = tankMaxHpByName(orig.n);
      const ratio = u.maxHp > 0 ? (u.hp / u.maxHp) : 1;
      const newHp = Math.max(1, Math.round(baseMax * ratio));
      newTanks.push({ tankUid: origUid, n: orig.n, hp: newHp, maxHp: baseMax, exp: newExp });
      if(origUid){
        const ot = ownedList.find(x => x.uid === origUid);
        if(ot) ot.exp = newExp;
      } else {
        let synced = false;
        for(const ot of ownedList){
          if(ot.n === orig.n && (ot.exp || 0) === oldExp){ ot.exp = newExp; synced = true; break; }
        }
        if(!synced){
          for(const ot of ownedList){
            if(ot.n === orig.n && (ot.exp || 0) < newExp){ ot.exp = newExp; break; }
          }
        }
      }
    } else {
      if((sv.crewPool || []).length < CREW_POOL_MAX){
        sv.crewPool = sv.crewPool || [];
        sv.crewPool.push({ id: makeCrewId(), fromTank: orig.n, exp: newExp, ts: Date.now() });
      }
    }
  });
  unit.tanks = newTanks;
  B._veteranResult = updates;
}
function renderVeteranResultHTML(){
  const arr = B._veteranResult;
  if(!arr || !arr.length) return '';
  const items = arr.map(x => {
    const name = x.tankName || x.name;
    const starAfter = x.starAfter != null ? x.starAfter : getStar(x.newExp);
    const starBefore = x.starBefore != null ? x.starBefore : 0;
    if(!x.alive){ return `💀 ${esc(name)} 被击毁（+${x.gain} exp）`; }
    if(starAfter > starBefore){ return `⭐ ${esc(name)} 升至 ${starAfter} 星（+${x.gain} exp）`; }
    return `✔ ${esc(name)} +${x.gain} exp`;
  });
  return `<div class="res-card" style="margin-top:8px">
    <div style="font-size:12px;color:#8ab88a;margin-bottom:6px">🎖 车组结算</div>
    ${items.map(x => `<div style="font-size:12px;color:#c8d4ee;padding:3px 0;line-height:1.5">${x}</div>`).join('')}
  </div>`;
}
let showBattleResult = function(){
  const win = B.result === 'win';
  if(win) SFX.win(); else SFX.lose();
  const div = document.createElement('div'); div.className = 'res-modal'; div.id = 'battleResult';
  if(B.mode === 'rogue'){ showRogueBattleResult(); return; }
  if(B.mode === 'free'){
    div.innerHTML = `<div class="res-title ${win?'win':'lose'}">${win?'蓝方胜利':'红方胜利'}</div>${renderStatsHTML()}
      <div class="res-btns"><button class="btn pri" onclick="freeRestart()">🔁 再打一次</button><button class="btn" onclick="backToFreeSelect()">← 返回选人</button><button class="btn" onclick="backMain()">🏠 主菜单</button></div>`;
    document.body.appendChild(div); return;
  }
  if(B.mode === 'map'){ if(B.mapCtx && B.mapCtx.aiAttack) showAIDefenseResult(); else showMapBattleResult(); return; }
  const cur = getCur(); const isLast = cur.chapter >= 30;
  const perfect = B.perfect && win;
  div.innerHTML = `<div class="res-title ${win?'win':'lose'}">${win?'胜 利':'败 北'}</div>
    ${win && perfect ? `<div style="font-size:14px;font-weight:900;color:#7bff7b;letter-spacing:2px;margin-top:-8px">✨ 完美通关 ✨</div>` : ''}
    <div class="res-card">
      <div class="res-row"><span>关卡</span><b>第 ${cur.chapter} 关</b></div>
      ${win ? `<div class="res-row"><span>基础奖励</span><b>${levelReward(cur.chapter)}</b></div>` : ''}
      ${B.isFirstClear ? `<div class="res-row"><span>首通加成</span><b class="bonus">×1.5</b></div>` : ''}
      ${perfect ? `<div class="res-row"><span>完美通关</span><b class="bonus">×1.3</b></div>` : ''}
      <div class="res-row"><span>${win ? '获得' : '败北奖励'}</span><b>+${B.earned}</b></div>
      <div class="res-row"><span>当前</span><b>${cur.rp}</b></div>
    </div>
    ${renderStatsHTML()}
    ${renderVeteranResultHTML()}
    <div class="res-btns">
      ${win && !isLast ? `<button class="btn pri" onclick="nextChapter()">▶ 下一关</button>` : ''}
      ${win && isLast ? `<button class="btn pri" onclick="endCampaign()">🎉 通关</button>` : ''}
      <button class="btn" onclick="retryChapter()">🔁 再打一次</button>
      <button class="btn" onclick="backToBase()">🏠 返回基地</button>
    </div>`;
  document.body.appendChild(div);
};
function nextChapter(){ const cur = getCur(); cur.chapter++; persistSaves(); document.getElementById('battleResult')?.remove(); backToBase(); }
function endCampaign(){ const cur = getCur(); cur.clearMax = cur.chapter; persistSaves(); document.getElementById('battleResult')?.remove(); toast('🎉 通关！'); backToBase(); }
function retryChapter(){ document.getElementById('battleResult')?.remove(); const cur = getCur(); if(cur.lineup.length === 0){ toast('请先编队'); backToBase(); return; } openDiffModal(backToBase); }
function backToBase(){ document.querySelectorAll('.res-modal,.diff-modal,.detail,.cm-modal,.tk-detail-modal').forEach(el => el.remove()); S.screen = 'base'; S.baseTab = 'base'; M.screen = 'none'; document.documentElement.style.setProperty('--boff', '0px'); render(); }

function startBattle(diff){
  document.querySelectorAll('.diff-modal').forEach(el=>el.remove()); window._diffCancel = null;
  const cur = getCur(); const pn = cur.lineup.map(i => cur.tank[i].n);
  const cached = window._diffTeams && window._diffTeams[diff];
  const en = cached || generateEnemyTeam(cur.chapter, diff); window._diffTeams = null;
  resetBattleState('campaign', diff);
  initBattleBuffs();
  const playerEq = cur.chapter >= 6 ? (cur.tacEquipped || []).slice(0, cur.tacSlots || 0) : [];
  B.tactical = { playerEquipped: playerEq, playerUsed: [], enemyEquipped: [], enemyUsed: [] };
  setupAITacticalPool(getAITacticalSlotsForBattle());
  pn.forEach((n, i) => B.units.push(makeBattleUnit(n, 'player', i, null, cur.tank[cur.lineup[i]].exp || 0)));
  en.forEach((n, i) => B.units.push(makeBattleUnit(n, 'enemy', i)));
  addBLog(`<span class="rd">⚔ 第 ${cur.chapter} 关 · ${diff === 'easy' ? '简单' : diff === 'hard' ? '困难' : '正常'}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
  S.screen = 'battle'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
  render(); setTimeout(runBattle, 500);
}