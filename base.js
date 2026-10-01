// ============================================================
// base.js — 基地、科技树、编队、对比、车组、图鉴
// ============================================================

function renderBase(){
  const cur = getCur(); const nc = NAT_COLOR[S.nation]; const slotsMax = playerSlotsMax(cur.chapter);
  let html = `<div class="base-head">
    <div class="line"><span>国家</span><b style="color:${nc.c}">${NAT_NAME[S.nation]}</b></div>
    <div class="line"><span>研发点</span><span class="val" style="color:#ffd76e">${cur.rp}</span></div>
    <div class="line"><span>关卡进度</span><span class="val">第 ${cur.chapter} 关 / 30</span></div>
    <div class="line"><span>出战槽位</span><span class="val">${cur.slots} / ${slotsMax}</span></div>
    <div class="tabs2">
      <button class="${S.baseTab==='base'?'act':''}" onclick="setTab('base')">🏠 基地</button>
      <button class="${S.baseTab==='tree'?'act':''}" onclick="setTab('tree')">🌳 科技树</button>
      <button class="${S.baseTab==='formation'?'act':''}" onclick="setTab('formation')">🚀 编队</button>
      <button class="${S.baseTab==='tactical'?'act':''}" onclick="setTab('tactical')">🎯 指令</button>
      <button class="${S.baseTab==='compare'?'act':''}" onclick="setTab('compare')">⚖️ 对比</button>
      <button class="${S.baseTab==='codex'?'act':''}" onclick="setTab('codex')">📖 图鉴</button>
      <button class="${S.baseTab==='settings'?'act':''}" onclick="setTab('settings')">⚙️ 设置</button>
    </div>
  </div>`;
  if(S.baseTab === 'base'){
    html += `<div class="panel"><h3>出战编队 (${cur.lineup.length}/${cur.slots})</h3>
      ${cur.lineup.length ? cur.lineup.map((i)=>{ const t = cur.tank[i]; if(!t) return ''; return `<span class="tank-chip sel">${tankNameHTML(t.n, (TANKS[t.n]||{}).ty, t.exp, {icon:false})}</span>`; }).join('') : '<div style="color:#5a6a5a;font-size:12px">未设置</div>'}
    </div>`;
    html += `<div class="panel"><h3>已拥有坦克 (${cur.tank.length}/60) · 点击看详情</h3>${cur.tank.length ? renderTankList() : '<div style="color:#5a6a5a;font-size:12px">暂无</div>'}</div>`;
    html += renderCrewSection(false);
    html += `<div class="btns" style="margin-top:auto">
      <button class="btn pri" onclick="startChapter()" ${cur.lineup.length?'':'disabled'}>⚔ 出击 · 第 ${cur.chapter} 关</button>
      <button class="btn" onclick="goNationSelect()">← 切换国家</button>
      <button class="btn" onclick="goSaveSelect()">← 存档管理</button>
    </div>`;
  } else if(S.baseTab === 'tree'){ html += renderTree(); }
  else if(S.baseTab === 'formation'){ html += renderFormation(); }
  else if(S.baseTab === 'tactical'){ html += renderTacticalPanel(false); }
  else if(S.baseTab === 'compare'){ html += renderCompare(); }
  else if(S.baseTab === 'codex'){ html += renderCodex(); }
  else if(S.baseTab === 'settings'){ html += renderSettings(); }
  if(!localStorage.getItem(CAMP_TUTORIAL_KEY) && !document.querySelector('.tutor-modal')){
    setTimeout(showCampaignTutorial, 120);
  }
  return html;
}
function setTab(t){ S.baseTab = t; if(t !== 'compare'){ S.compareA = null; S.compareB = null; } render(); }

function renderTankList(){
  const cur = getCur();
  return `<div class="tank-list">${cur.tank.map((t, i)=>{
    const d = TANKS[t.n]; if(!d) return '';
    const exp = t.exp || 0;
    const st = getStar(exp);
    const pct = expProgressPct(exp);
    const full = st >= 3 ? ' full' : '';
    return `<div class="tank-chip" onclick="showTankDetail(false,${i})"><span class="sell" onclick="event.stopPropagation();confirmSell(${i})">×</span>${tankNameHTML(t.n, d.ty, exp, {iconFallback: TY_ICON[d.ty]})}${barHTML(pct,'exp-bar',full)}</div>`;
  }).join('')}</div>`;
}
function confirmSell(i){
  const cur = getCur(); const t = cur.tank[i]; if(!t) return;
  const lv = TREES[S.nation][t.n] ? TREES[S.nation][t.n].lv : 1;
  const refund = Math.floor(tankCost(lv) * 0.25);
  if(!confirm(`卖出 ${t.n}？回收 +${refund} RP`)) return;
  cur.rp += refund; cur.tank.splice(i, 1);
  const nl = [];
  for(const li of cur.lineup){ if(li === i) continue; nl.push(li > i ? li - 1 : li); }
  cur.lineup = nl; persistSaves(); render(); toast(`已卖出 ${t.n}`);
}

let TREE_ZOOM = 1;
function treeZoom(d){ TREE_ZOOM = Math.max(0.5, Math.min(2.5, Math.round((TREE_ZOOM + d * 0.15) * 100) / 100)); render(); }
function treeZoomReset(){ TREE_ZOOM = 1; render(); }
function renderTreeHTML(tree, hasFn, clickFnName){
  if(!tree) return '';
  const NW = 70, NH = 44, CW = 90, RH = 54, PAD = 20;
  const root = Object.keys(tree).find(k => !Object.values(tree).some(n => n.ch.includes(k)));
  if(!root) return '';
  const lc = {}; (function c(n){ if(tree[n].ch.length === 0){ lc[n] = 1; return; } tree[n].ch.forEach(c); lc[n] = tree[n].ch.reduce((s, x) => s + lc[x], 0); })(root);
  const mc = {}; (function f(n){ const nd = tree[n]; if(nd.ch.length === 0){ mc[n] = null; return; } let b = null, bl = -1; for(const x of nd.ch){ f(x); if(lc[x] > bl){ bl = lc[x]; b = x; } } mc[n] = b; })(root);
  const ro = {}; let nr = 0; (function a(n){ const nd = tree[n]; if(nd.ch.length === 0){ ro[n] = nr++; return; } for(const x of nd.ch) a(x); ro[n] = ro[mc[n]]; })(root);
  const co = lv => Math.round((lv - 1) * 2);
  const pos = {}; for(const n in tree) pos[n] = { x: co(tree[n].lv) * CW + PAD, y: ro[n] * RH + PAD, lv: tree[n].lv };
  const mR = Math.max(...Object.keys(pos).map(n => pos[n].x + NW));
  const cW = mR + PAD, cH = nr * RH + PAD;
  let lines = '';
  for(const n in tree){ const nd = tree[n]; const f = pos[n]; if(!f) continue;
    const fx = f.x + NW, fy = f.y + NH / 2;
    for(const cn of nd.ch){ const t = pos[cn]; if(!t) continue;
      const tx = t.x, ty = t.y + NH / 2;
      if(mc[n] === cn) lines += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="#3a5a3a" stroke-width="1.5"/>`;
      else lines += `<path d="M ${fx} ${fy} L ${fx} ${ty} L ${tx} ${ty}" stroke="#3a5a3a" stroke-width="1.5" fill="none"/>`;
    }
  }
  let nh = '';
  function canB(n){ const ps = Object.keys(tree).filter(k => tree[k].ch.includes(n)); if(ps.length === 0) return true; return ps.some(p => hasFn(p)); }
  for(const n in pos){ const p = pos[n]; const d = TANKS[n]; const ty = d ? d.ty : 'light';
    const own = hasFn(n); const av = !own && canB(n);
    const cls = own ? 'owned' : (av ? 'avail' : 'lock');
    nh += `<div class="tn ${cls} t-${ty}" style="left:${p.x}px;top:${p.y}px;width:${NW}px;height:${NH}px" onclick="${clickFnName}('${esc(n)}')"><div class="tn-lv">${p.lv}</div><div class="tn-nm">${esc(n)}</div></div>`;
  }
  return `<div class="tree-zoom-bar"><button class="tz-btn" onclick="treeZoom(-1)">−</button><span class="tz-lv">${Math.round(TREE_ZOOM * 100)}%</span><button class="tz-btn" onclick="treeZoom(1)">＋</button><button class="tz-btn" onclick="treeZoomReset()">1:1</button></div>
    <div class="tree-scroll"><div class="tree-zoomer" style="width:${cW * TREE_ZOOM}px;height:${cH * TREE_ZOOM}px"><div class="tree-canvas" style="width:${cW}px;height:${cH}px;transform:scale(${TREE_ZOOM});transform-origin:0 0"><svg class="tree-svg" width="${cW}" height="${cH}">${lines}</svg>${nh}</div></div></div>
    <div class="tree-legend"><span><i class="dot owned"></i>已解锁</span><span><i class="dot avail"></i>可解锁</span><span><i class="dot lock"></i>未解锁</span></div>`;
}
document.addEventListener('mousedown', e => {
  if(e.button !== 0) return;
  const sc = e.target.closest && e.target.closest('.tree-scroll'); if(!sc) return;
  if(e.target.closest('.tn')) return;
  const sx = e.clientX, sy = e.clientY, sl = sc.scrollLeft, st = sc.scrollTop;
  const move = ev => { sc.scrollLeft = sl - (ev.clientX - sx); sc.scrollTop = st - (ev.clientY - sy); };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); sc.classList.remove('dragging'); };
  sc.classList.add('dragging');
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
});
document.addEventListener('wheel', e => {
  if(!e.deltaX) return;
  const el = e.target.closest && e.target.closest('.tree-scroll, .map-grid-wrap');
  if(!el) return;
  el.scrollLeft += e.deltaX;
  e.preventDefault();
}, { passive: false });
function renderTree(){
  const cur = getCur(); const tree = TREES[S.nation];
  const has = n => cur.tank.some(t => t.n === n);
  const content = renderTreeHTML(tree, has, 'showNode');
  if(!content) return '<div class="panel">错误</div>';
  return `<div class="panel tree-panel"><div class="tree-head"><h3>${NAT_NAME[S.nation]}科技树</h3></div>
    ${content}
    <div style="padding:8px 12px"><button class="btn" onclick="setTab('base')" style="width:100%">← 返回基地</button></div></div>`;
}
function showNode(name){
  const cur = getCur(); const tree = TREES[S.nation]; const node = tree[name]; const d = TANKS[name];
  if(!d || !node) return;
  const own = cur.tank.filter(t => t.n === name).length;
  const ps = Object.keys(tree).filter(k => tree[k].ch.includes(name));
  const cb = ps.length === 0 || ps.some(p => cur.tank.some(t => t.n === p));
  const cost = tankCost(node.lv);
  const cost2 = Math.floor(cost * 0.5);
  const capT = cur.tank.length >= 60;
  let acts = '';
  if(own >= 3) acts = `<button class="btn" disabled>已达上限</button>`;
  else if(own > 0) acts = `<button class="btn pri" onclick="buyAnother('${name}')" ${(cur.rp >= cost2 && !capT) ? '' : 'disabled'}>购买第${own === 1 ? '二' : '三'}辆 (${cost2})</button>`;
  else if(cb) acts = `<button class="btn pri" onclick="buyTank('${name}')" ${(cur.rp >= cost && !capT) ? '' : 'disabled'}>${cost === 0 ? '免费' : '购买 ('+cost+')'}</button>`;
  else acts = `<button class="btn" disabled>前置未拥有</button>`;
  document.querySelectorAll('.detail').forEach(el=>el.remove());
  document.body.insertAdjacentHTML('beforeend', `<div class="detail" onclick="event.stopPropagation()">
    <h3>${TY_ICON[d.ty]} ${esc(name)} Lv${node.lv} ${TY_CN[d.ty]}</h3>
    <div class="stats"><div><span>火力</span><b>${d.fd}</b></div><div><span>攻击</span><b>${d.at}</b></div>
    <div><span>速度</span><b>${d.s}</b></div><div><span>穿深</span><b>${d.p}${d.heat?'*':''}</b></div>
    <div><span>装甲</span><b>${d.a}</b></div><div><span>活度</span><b>${d.ac}</b></div></div>
    <div class="acts"><button class="btn" onclick="closeDetail()">关闭</button>${acts}</div></div>`);
}
function closeDetail(){ document.querySelectorAll('.detail').forEach(el=>el.remove()); }
function buyTank(name){
  const cur = getCur(); const node = TREES[S.nation][name]; const cost = tankCost(node.lv);
  if(cur.rp < cost || cur.tank.length >= 60 || cur.tank.filter(t => t.n === name).length >= 3) return;
  cur.rp -= cost; cur.tank.push({n: name, exp: 0});
  const sm = playerSlotsMax(cur.chapter);
  if(cur.lineup.length < cur.slots && cur.lineup.length < sm) cur.lineup.push(cur.tank.length - 1);
  persistSaves(); closeDetail(); render(); toast(`已拥有 ${name}`); SFX.coin();
}
function buyAnother(name){
  const cur = getCur();
  const cost = Math.floor(tankCost(TREES[S.nation][name].lv) * 0.5);
  if(cur.rp < cost || cur.tank.length >= 60 || cur.tank.filter(t => t.n === name).length >= 3) return;
  cur.rp -= cost; cur.tank.push({n: name, exp: 0});
  persistSaves(); closeDetail(); render(); toast(`已购买 ${name}`); SFX.coin();
}
function renderFormation(){
  const cur = getCur(); const sm = playerSlotsMax(cur.chapter);
  let html = `<div class="panel"><h3>出战坦克（最多 ${cur.slots}）</h3>
    <div class="tank-list">${cur.tank.map((t,i)=>{ const d = TANKS[t.n]; if(!d) return '';
      const sel = cur.lineup.includes(i);
      return `<div class="tank-chip ${sel?'sel':''}" onclick="toggleLineup(${i})">${tankNameHTML(t.n, d.ty, t.exp, {iconFallback: TY_ICON[d.ty]})}</div>`;
    }).join('')}</div>
    <div style="font-size:12px;color:#8ab88a;margin-top:8px">已选 ${cur.lineup.length}/${cur.slots}</div></div>
  <div class="panel"><h3>出战槽位</h3><div class="slotbar">`;
  for(let i=1;i<=6;i++){
    if(i <= cur.slots) html += `<div class="slot filled">✓</div>`;
    else if(i > sm){ html += `<div class="slot locked">🔒</div>`; }
    else html += `<div class="slot buy" onclick="buySlot(${i})">${slotCost(i)}</div>`;
  }
  html += `</div></div><div class="btns" style="margin-top:auto"><button class="btn pri" onclick="setTab('base')">✓ 完成</button></div>`;
  return html;
}
function toggleLineup(i){ const cur = getCur(); const idx = cur.lineup.indexOf(i); if(idx >= 0) cur.lineup.splice(idx, 1); else if(cur.lineup.length < cur.slots) cur.lineup.push(i); else { toast('已满员'); return; } persistSaves(); render(); }
function buySlot(n){ const cur = getCur(); const c = slotCost(n); if(cur.rp < c || n !== cur.slots + 1) return; cur.rp -= c; cur.slots = n; persistSaves(); render(); toast(`已解锁槽位 ${n}`); }

function renderTacticalPanel(isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return '';
  const maxSlots = isMap ? 2 : (cur.chapter >= 15 ? 2 : cur.chapter >= 6 ? 1 : 0);
  const unlocked = cur.tacUnlocked || [];
  const equipped = cur.tacEquipped || [];
  const slots = cur.tacSlots || 0;
  const rp = cur.rp;
  let html = `<div class="panel"><h3>🎯 战术指令</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:8px">
      已开槽位：<b style="color:#ffd76e">${slots} / ${maxSlots}</b>
      ${maxSlots === 0 ? '<br>第 6 关起可开槽位 1' : ''}
    </div>`;
  if(slots < maxSlots){
    const nextSlot = slots + 1;
    const slotPrice = isMap ? (nextSlot === 1 ? 150 : 300) : (nextSlot === 1 ? 1500 : 3000);
    html += `<button class="btn pri" style="width:100%;margin-bottom:8px" onclick="buyTacSlot(${isMap?'true':'false'})" ${rp >= slotPrice ? '' : 'disabled'}>解锁槽位 ${nextSlot}（${slotPrice} RP）</button>`;
  }
  html += `<div style="margin-bottom:8px"><span style="font-size:12px;color:#8ab88a">已装备：</span>`;
  for(let i=0;i<slots;i++){
    const tid = equipped[i];
    const tac = tid ? TACTICALS.find(t => t.id === tid) : null;
    if(tac) html += `<span class="tank-chip sel" style="margin-left:6px">${tac.icon} ${tac.name}</span>`;
    else html += `<span class="tank-chip" style="margin-left:6px;opacity:.5">空</span>`;
  }
  html += `</div>`;
  html += `<div class="tac-grid">`;
  TACTICALS.forEach(t => {
    const isUn = unlocked.includes(t.id);
    const isEq = equipped.includes(t.id);
    const price = tacPrice(t.tier, isMap);
    const cls = ['tac-card'];
    if(isEq) cls.push('active');
    if(!isUn) cls.push('locked');
    html += `<div class="${cls.join(' ')}" onclick="${isUn ? `toggleTacEquip('${t.id}',${isMap?'true':'false'})` : `buyTac('${t.id}',${isMap?'true':'false'})`}">
      <div class="tc-tier t${t.tier}">T${t.tier}</div>
      <div class="tc-name">${t.icon} ${t.name}${isEq?' ✓':''}</div>
      <div class="tc-desc">${t.desc}</div>
      ${!isUn ? `<div class="tc-price">解锁 ${price} RP</div>` : ''}
    </div>`;
  });
  html += `</div></div>`;
  html += `<div class="btns" style="margin-top:auto"><button class="btn" onclick="${isMap?"M.screen='map'":"setTab('base')"};render()">← 返回</button></div>`;
  return html;
}
function buyTacSlot(isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const maxSlots = isMap ? 2 : (cur.chapter >= 15 ? 2 : cur.chapter >= 6 ? 1 : 0);
  const slots = cur.tacSlots || 0;
  if(slots >= maxSlots){ toast('已达上限'); return; }
  const nextSlot = slots + 1;
  const price = isMap ? (nextSlot === 1 ? 150 : 300) : (nextSlot === 1 ? 1500 : 3000);
  if(cur.rp < price){ toast('研发点不足'); return; }
  if(!confirm(`解锁第 ${nextSlot} 个战术指令槽？消耗 ${price} RP`)) return;
  cur.rp -= price;
  cur.tacSlots = nextSlot;
  if(isMap) persistMapSaves(); else persistSaves();
  render(); toast(`已解锁槽位 ${nextSlot}`); SFX.coin();
}
function buyTac(id, isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const t = TACTICALS.find(x => x.id === id);
  if(!t) return;
  const price = tacPrice(t.tier, isMap);
  if(cur.rp < price){ toast(`研发点不足（需 ${price}）`); return; }
  if(!confirm(`解锁【${t.name}】？消耗 ${price} RP`)) return;
  cur.rp -= price;
  cur.tacUnlocked = cur.tacUnlocked || [];
  cur.tacUnlocked.push(id);
  if(isMap) persistMapSaves(); else persistSaves();
  render(); toast(`已解锁 ${t.name}`); SFX.coin();
}
function toggleTacEquip(id, isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const slots = cur.tacSlots || 0;
  if(slots === 0){ toast('请先解锁指令槽'); return; }
  let eq = cur.tacEquipped || [];
  const idx = eq.indexOf(id);
  if(idx >= 0){ eq.splice(idx, 1); }
  else {
    if(eq.length >= slots){ toast(`已满（${slots} 个槽位）`); return; }
    eq.push(id);
  }
  cur.tacEquipped = eq;
  if(isMap) persistMapSaves(); else persistSaves();
  render();
}

function renderCrewSection(isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return '';
  const pool = cur.crewPool || [];
  const tanks = isMap ? (cur.ownedTanks || []) : (cur.tank || []);
  const isLargeStr = isMap ? 'true' : 'false';
  let html = `<div class="panel"><h3>🎖 车组池 (${pool.length}/${CREW_POOL_MAX})</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      可主动从坦克上取下车组放入池子。装入新坦克时降 1 星。卖车组回收 RP。
    </div>`;
  if(pool.length === 0){
    html += `<div style="color:#5a6a5a;font-size:12px;padding:6px 0">暂无车组</div>`;
  } else {
    pool.forEach(c => {
      const star = getStar(c.exp);
      const price = CREW_SELL_PRICE[star] || 0;
      const stars = '★'.repeat(star) + '☆'.repeat(3 - star);
      const pct = expProgressPct(c.exp);
      const full = star >= 3 ? ' full' : '';
      html += `<div class="crew-item">
        <div class="crew-info">
          <div class="crew-name">${stars} ${esc(c.fromTank)} 车组</div>
          <div class="crew-exp"><span>${c.exp} 经验</span>${barHTML(pct,'exp-bar',full)}</div>
        </div>
        <div class="crew-actions">
          <button class="btn ghost sm" onclick="openInstallCrew('${c.id}',${isLargeStr})">装入坦克</button>
          <button class="btn ghost sm" style="color:#ff8080;border-color:#5a2a2a" onclick="sellCrew('${c.id}',${isLargeStr})">卖 ${price} RP</button>
        </div>
      </div>`;
    });
  }
  html += `</div>`;
  html += `<div class="panel"><h3>从坦克上取下车组</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px">取下后坦克变新兵（经验归 0）。取下车组不降星。</div>`;
  const withExp = tanks.map((t, i) => ({ t, i })).filter(x => (x.t.exp || 0) > 0);
  if(withExp.length === 0){
    html += `<div style="color:#5a6a5a;font-size:12px;padding:6px 0">没有带车组的坦克</div>`;
  } else {
    withExp.forEach(({ t, i }) => {
      const star = getStar(t.exp);
      const stars = '★'.repeat(star) + '☆'.repeat(3 - star);
      const pct = expProgressPct(t.exp);
      const full = star >= 3 ? ' full' : '';
      html += `<div class="crew-item">
        <div class="crew-info">
          <div class="crew-name">${stars} ${esc(t.n)}</div>
          <div class="crew-exp"><span>${t.exp} 经验</span>${barHTML(pct,'exp-bar',full)}</div>
        </div>
        <div class="crew-actions">
          <button class="btn ghost sm" onclick="detachCrew(${isLargeStr},${i})">取下车组</button>
        </div>
      </div>`;
    });
  }
  html += `</div>`;
  return html;
}
function openInstallCrew(crewId, isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const crew = (cur.crewPool || []).find(c => c.id === crewId);
  if(!crew) return;
  const tanks = isMap ? (cur.ownedTanks || []) : (cur.tank || []);
  if(tanks.length === 0){ toast('没有坦克'); return; }
  const isLargeStr = isMap ? 'true' : 'false';
  const oldStar = getStar(crew.exp);
  const newExp = crewDemoteExp(crew.exp);
  const newStar = getStar(newExp);
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  const listHTML = tanks.map((t, i) => {
    const tExp = t.exp || 0;
    const tStar = getStar(tExp);
    const stars = '★'.repeat(tStar) + '☆'.repeat(3 - tStar);
    const warn = tExp > 0 ? '（原车组将被覆盖）' : '';
    return `<div class="cm-card" onclick="installCrewToTank('${crewId}',${i},${isLargeStr})">
      <div class="cm-name">${stars} ${esc(t.n)}</div>
      <div class="cm-desc">当前 ${tExp} 经验 ${warn}</div>
    </div>`;
  }).join('');
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>🎖 装入车组</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      原车组：${esc(crew.fromTank)} · ${crew.exp} 经验 · ${oldStar} 星<br>
      装入后：${newExp} 经验 · ${newStar} 星（降 1 星，保留余量）
    </div>
    <div class="cm-list">${listHTML}</div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="this.closest('.cm-modal').remove()">关闭</button>
  </div>`;
  document.body.appendChild(div);
}
function installCrewToTank(crewId, tankIdx, isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const crewIdx = (cur.crewPool || []).findIndex(c => c.id === crewId);
  if(crewIdx < 0) return;
  const crew = cur.crewPool[crewIdx];
  const tanks = isMap ? (cur.ownedTanks || []) : (cur.tank || []);
  const tank = tanks[tankIdx];
  if(!tank) return;
  const newExp = crewDemoteExp(crew.exp);
  const newStar = getStar(newExp);
  tank.exp = newExp;
  cur.crewPool.splice(crewIdx, 1);
  if(isMap) persistMapSaves(); else persistSaves();
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  render(); toast(`已装入 ${tank.n}（${newStar} 星）`);
}
function sellCrew(crewId, isMap){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const idx = (cur.crewPool || []).findIndex(c => c.id === crewId);
  if(idx < 0) return;
  const crew = cur.crewPool[idx];
  const star = getStar(crew.exp);
  const price = CREW_SELL_PRICE[star] || 0;
  if(!confirm(`卖出 ${crew.fromTank} 车组（${star} 星）？获得 ${price} RP`)) return;
  cur.rp += price;
  cur.crewPool.splice(idx, 1);
  if(isMap) persistMapSaves(); else persistSaves();
  render(); toast(`已卖出车组，+${price} RP`); SFX.coin();
}
function detachCrew(isMap, tankIdx){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const tanks = isMap ? (cur.ownedTanks || []) : (cur.tank || []);
  const t = tanks[tankIdx];
  if(!t) return;
  const exp = t.exp || 0;
  if(exp <= 0){ toast('该坦克没有车组经验'); return; }
  cur.crewPool = cur.crewPool || [];
  if(cur.crewPool.length >= CREW_POOL_MAX){ toast('车组池已满'); return; }
  if(!confirm(`取下 ${t.n} 的车组（${exp} 经验）？坦克将变为新兵。`)) return;
  cur.crewPool.push({ id: makeCrewId(), fromTank: t.n, exp, ts: Date.now() });
  t.exp = 0;
  if(isMap) persistMapSaves(); else persistSaves();
  render(); toast('已取下车组');
}

function showTankDetail(isMap, idx){
  const cur = isMap ? getMapCur() : getCur();
  if(!cur) return;
  const tanks = isMap ? (cur.ownedTanks || []) : (cur.tank || []);
  const t = tanks[idx];
  if(!t) return;
  const d = TANKS[t.n] || ELITE_TANKS[t.n];
  if(!d) return;
  const exp = t.exp || 0;
  const star = getStar(exp);
  const vetMul = veteranMul(star);
  const float = veteranFloat(star);
  const expMul = star === 0 ? 1 : (float.min + float.max) / 2;
  const stars = '★'.repeat(star) + '☆'.repeat(3 - star);
  const threshNext = star < 3 ? VET_THRESHOLD[star + 1] : null;
  const expText = threshNext ? `${exp} / ${threshNext}` : `${exp}（满级）`;
  const pct = expProgressPct(exp);
  const full = star >= 3 ? ' full' : '';
  function statRow(label, base, after){
    if(after === base) return `<div class="row"><span>${label}</span><b>${after}</b></div>`;
    const diff = after - base;
    const sign = diff >= 0 ? '+' : '';
    return `<div class="row"><span>${label}</span><b>${after}<span class="vet">(${base} ${sign}${diff})</span></b></div>`;
  }
  const atkAfter = Math.round(d.at * expMul);
  const penAfter = Math.round(d.p * expMul);
  const spdAfter = Math.round(d.s * vetMul);
  const armAfter = Math.round(d.a * vetMul);
  const acAfter = Math.round(d.ac * vetMul);
  document.querySelectorAll('.tk-detail-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'tk-detail-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="tk-detail-card">
    <h3>${TY_ICON[d.ty]} ${esc(t.n)} ${stars}</h3>
    <div style="font-size:12px;color:#8ab88a;margin-bottom:10px;line-height:1.6">
      <div>车组经验：${expText}</div>
      <div class="exp-bar${full}" style="height:6px;margin:5px 0"><i style="width:${pct}%"></i></div>
      <div>攻击/穿深浮动：${float.min.toFixed(2)} ~ ${float.max.toFixed(2)}</div>
    </div>
    <div class="tk-detail-stats">
      <div class="row"><span>火力</span><b>${d.fd}</b></div>
      ${statRow('攻击', d.at, atkAfter)}
      ${statRow('速度', d.s, spdAfter)}
      ${statRow('穿深', d.p, penAfter)}
      ${statRow('装甲', d.a, armAfter)}
      ${statRow('活度', d.ac, acAfter)}
    </div>
    <div style="font-size:11px;color:#7a9a7a;margin-top:8px;line-height:1.5">
      ★ 攻击/穿深：浮动区间收窄（期望约 +1%/星）· 速度/装甲/活度：每星 +4%
    </div>
    <div class="btns" style="margin-top:12px">
      ${closeBtnHTML('.tk-detail-modal')}
    </div>
  </div>`;
  document.body.appendChild(div);
}

function renderCompare(){
  const cur = getCur();
  const cnt = (S.compareA!=null?1:0) + (S.compareB!=null?1:0);
  let html = `<div class="panel"><h3>对比 (${cnt}/2)</h3>
    ${cur.tank.length < 2 ? '<div class="cmp-tip">至少 2 辆</div>' :
      `<div class="tank-list">${cur.tank.map((t,i)=>{ const d = TANKS[t.n]; if(!d) return '';
        const sel = S.compareA === i || S.compareB === i;
        return `<div class="tank-chip ${sel?'sel':''}" onclick="toggleCompare(${i})">${tankNameHTML(t.n, d.ty, t.exp, {iconFallback: TY_ICON[d.ty]})}</div>`;
      }).join('')}</div>`}</div>`;
  if(cur.tank.length >= 2 && S.compareA != null && S.compareB != null && cur.tank[S.compareA] && cur.tank[S.compareB]){
    const ta = cur.tank[S.compareA], tb = cur.tank[S.compareB];
    const da = TANKS[ta.n], db = TANKS[tb.n];
    const taStar = getStar(ta.exp || 0);
    const tbStar = getStar(tb.exp || 0);
    const taName = ta.n + (taStar > 0 ? ' ' + '★'.repeat(taStar) : '');
    const tbName = tb.n + (tbStar > 0 ? ' ' + '★'.repeat(tbStar) : '');
    const floatA = veteranFloat(taStar), floatB = veteranFloat(tbStar);
    const expMulA = taStar === 0 ? 1 : (floatA.min + floatA.max) / 2;
    const expMulB = tbStar === 0 ? 1 : (floatB.min + floatB.max) / 2;
    const vetMulA = veteranMul(taStar);
    const vetMulB = veteranMul(tbStar);
    function dsp(base, after, suf){
      if(after === base) return `${after}${suf || ''}`;
      const diff = after - base;
      const sign = diff >= 0 ? '+' : '';
      return `${after}${suf || ''}<span class="diff">(${base} ${sign}${diff})</span>`;
    }
    function mkRow(label, baseA, baseB, afterA, afterB, sufA, sufB){
      return { label, dispA: dsp(baseA, afterA, sufA), dispB: dsp(baseB, afterB, sufB), valA: afterA, valB: afterB };
    }
    const rows = [
      { label: '火力', dispA: da.fd, dispB: db.fd, valA: da.fp, valB: db.fp },
      mkRow('攻击', da.at, db.at, Math.round(da.at * expMulA), Math.round(db.at * expMulB)),
      mkRow('速度', da.s, db.s, Math.round(da.s * vetMulA), Math.round(db.s * vetMulB)),
      mkRow('穿深', da.p, db.p, Math.round(da.p * expMulA), Math.round(db.p * expMulB), da.heat?'*':'', db.heat?'*':''),
      mkRow('装甲', da.a, db.a, Math.round(da.a * vetMulA), Math.round(db.a * vetMulB)),
      mkRow('活度', da.ac, db.ac, Math.round(da.ac * vetMulA), Math.round(db.ac * vetMulB)),
    ];
    html += `<div class="panel"><div class="cmp-header"><div class="side">${esc(taName)}</div><div class="vs">VS</div><div class="side">${esc(tbName)}</div></div>
      ${rows.map(r => { const aW = r.valA > r.valB, bW = r.valB > r.valA; const diff = Math.abs(r.valA - r.valB);
        return `<div class="cmp-row"><div class="side ${aW?'win':''}">${r.dispA}${aW?` ↑${diff}`:''}</div><div class="item">${r.label}</div><div class="side ${bW?'win':''}">${r.dispB}${bW?` ↑${diff}`:''}</div></div>`;
      }).join('')}</div>`;
  }
  html += `<div class="btns" style="margin-top:auto"><button class="btn" onclick="setTab('base')">← 返回基地</button></div>`;
  return html;
}
function toggleCompare(i){ if(S.compareA === i){ S.compareA = null; render(); return; } if(S.compareB === i){ S.compareB = null; render(); return; } if(S.compareA == null){ S.compareA = i; } else if(S.compareB == null){ S.compareB = i; } else { S.compareA = S.compareB; S.compareB = i; } render(); }

function getAllTankList(){
  const list = [];
  for(const nat of ['德','美','苏']){
    const tree = TREES[nat];
    for(const name in tree){
      const d = TANKS[name];
      if(!d) continue;
      list.push({ n: name, nat, lv: tree[name].lv, elite: false, ref: d });
    }
  }
  for(const name in ELITE_TANKS){
    const d = ELITE_TANKS[name];
    list.push({ n: name, nat: d.na, lv: 15, elite: true, ref: d });
  }
  return list;
}
function renderCodex(){
  const cur = getCur();
  const owned = new Set((cur.tank || []).map(t => t.n));
  const all = getAllTankList();
  let list = all;
  if(S.codexNat !== 'all') list = list.filter(t => t.nat === S.codexNat);
  if(S.codexTy !== 'all') list = list.filter(t => t.ref.ty === S.codexTy);
  const ord = {德:0, 美:1, 苏:2};
  list.sort((a, b) => {
    if(a.nat !== b.nat) return (ord[a.nat]||0) - (ord[b.nat]||0);
    return a.lv - b.lv;
  });
  const ownedCount = all.filter(t => owned.has(t.n)).length;

  let html = `<div class="panel"><h3>📖 坦克图鉴 · ${ownedCount}/${all.length}</h3>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">
      ${['all','德','美','苏'].map(n => `<button class="filter-btn ${S.codexNat===n?'act':''}" onclick="S.codexNat='${n}';render()">${n==='all'?'全部国家':NAT_NAME[n]}</button>`).join('')}
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">
      ${[['all','全部类型'],['light','轻坦'],['medium','中坦'],['heavy','重坦'],['td','坦歼']].map(([k,v]) => `<button class="filter-btn ${S.codexTy===k?'act':''}" onclick="S.codexTy='${k}';render()">${v}</button>`).join('')}
    </div>
    ${list.length ? `<div class="codex-grid">${list.map(t => {
      const isOwned = owned.has(t.n);
      const natCol = NAT_COLOR[t.nat] || {c:'#8ab88a'};
      return `<div class="codex-card ${isOwned?'owned':''}" onclick="showCodexDetail('${esc(t.n)}')">
        <div class="cc-lv">Lv${t.lv}${t.elite?' ⭐':''}</div>
        <div class="cc-icon">${TY_ICON[t.ref.ty]}</div>
        <div class="cc-name" style="color:${natCol.c}">${esc(t.n)}</div>
        <div class="cc-ty">${TY_CN[t.ref.ty]}</div>
      </div>`;
    }).join('')}</div>` : '<div style="text-align:center;padding:20px;color:#5a6a5a;font-size:12px">没有匹配的坦克</div>'}
  </div>
  <div class="btns" style="margin-top:auto"><button class="btn" onclick="setTab('base')">← 返回基地</button></div>`;
  return html;
}
function showCodexDetail(name){
  const d = TANKS[name] || ELITE_TANKS[name];
  if(!d) return;
  const cur = getCur();
  const owned = (cur.tank || []).some(t => t.n === name);
  const isElite = !!ELITE_TANKS[name];
  let lv = 15;
  for(const nat of ['德','美','苏']){
    if(TREES[nat][name]){ lv = TREES[nat][name].lv; break; }
  }
  const rng = d.fp <= 50 ? '1km' : d.fp <= 100 ? '2km' : '3km';
  document.querySelectorAll('.tk-detail-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'tk-detail-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="tk-detail-card">
    <h3>${isElite?'⭐':''}${TY_ICON[d.ty]} ${esc(name)} ${TY_CN[d.ty]} Lv${lv}</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:10px">
      ${NAT_NAME[d.na]||d.na} · ${owned?'<span style="color:#7bff7b">已拥有</span>':'<span style="color:#5a6a5a">未拥有</span>'}
    </div>
    <div class="tk-detail-stats">
      <div class="row"><span>火力</span><b>${d.fd}</b></div>
      <div class="row"><span>攻击</span><b>${d.at}</b></div>
      <div class="row"><span>速度</span><b>${d.s}</b></div>
      <div class="row"><span>穿深</span><b>${d.p}${d.heat?'（破甲）':''}</b></div>
      <div class="row"><span>装甲</span><b>${d.a}</b></div>
      <div class="row"><span>活度</span><b>${d.ac}</b></div>
    </div>
    <div style="font-size:11px;color:#7a9a7a;margin-top:10px;line-height:1.6">
      射程：${rng}${d.heat?'<br>* 破甲弹：穿深不随距离衰减':''}
    </div>
    <div class="btns" style="margin-top:12px">
      ${closeBtnHTML('.tk-detail-modal')}
    </div>
  </div>`;
  document.body.appendChild(div);
}

function renderSettings(){
  return `<div class="panel"><h3>⚙️ 设置</h3>
  ${settingsRowsHTML()}
  </div>
  <div class="btns" style="margin-top:auto"><button class="btn" onclick="setTab('base')">← 返回基地</button></div>`;
}

function startChapter(){ const cur = getCur(); if(cur.lineup.length === 0){ toast('请先编队'); return; } openDiffModal(); }
function openDiffModal(onCancel){
  document.querySelectorAll('.diff-modal').forEach(el=>el.remove());
  const cur = getCur(); const ch = cur.chapter;
  const stdLv = aiStandardLevel(ch); const slots = aiSlots(ch); const baseReward = levelReward(ch);
  const teams = { easy: generateEnemyTeam(ch, 'easy'), normal: generateEnemyTeam(ch, 'normal'), hard: generateEnemyTeam(ch, 'hard') };
  window._diffTeams = teams; window._diffCancel = onCancel || null;
  function tl(d){ return teams[d].map(n => TY_ICON[TANKS[n].ty] + n).join(' · '); }
  const isFirst = cur.chapter > cur.clearMax;
  const rewardText = isFirst ? `${baseReward} · <span style="color:#7bff7b">首通×1.5</span>` : baseReward;
  const div = document.createElement('div'); div.className = 'diff-modal';
  div.onclick = e => { if(e.target === div) cancelDiffModal(); };
  div.innerHTML = `<div class="diff-card"><h3>第 ${ch} 关</h3>
    <div class="sub2">${slots} 辆 · 奖励 ${rewardText}</div>
    <button class="diff-btn easy" onclick="startBattle('easy')"><div><div class="dname">简单</div><div class="dinfo">AI Lv${Math.max(1,stdLv-1)} · ×1.0</div><div style="font-size:10px;color:#a0b8a0">${tl('easy')}</div></div></button>
    <button class="diff-btn normal" onclick="startBattle('normal')"><div><div class="dname">正常</div><div class="dinfo">AI Lv${stdLv} · ×1.1</div><div style="font-size:10px;color:#a0b8a0">${tl('normal')}</div></div></button>
    <button class="diff-btn hard" onclick="startBattle('hard')"><div><div class="dname">困难</div><div class="dinfo">AI Lv${Math.min(15,stdLv+1)} · ×1.35</div><div style="font-size:10px;color:#a0b8a0">${tl('hard')}</div></div></button>
    <button class="btn" style="width:100%" onclick="closeDiffAndBack()">← 返回编队</button>
    <button class="btn" style="width:100%;margin-top:4px" onclick="cancelDiffModal()">取消</button>
  </div>`;
  document.body.appendChild(div);
}
function closeDiffAndBack(){ document.querySelectorAll('.diff-modal').forEach(el=>el.remove()); window._diffTeams = null; window._diffCancel = null; S.screen = 'base'; S.baseTab = 'formation'; render(); }
function cancelDiffModal(){ document.querySelectorAll('.diff-modal').forEach(el=>el.remove()); const fn = window._diffCancel; window._diffCancel = null; if(fn) fn(); }
function pickAITank(level){
  const otherN = ['德','美','苏'].filter(n => n !== S.nation);
  const pool = [];
  for(const nat of otherN){ const tree = TREES[nat]; for(const name in tree) pool.push({ name, lv: tree[name].lv }); }
  let cs = pool.filter(t => Math.abs(t.lv - level) <= 0.5);
  if(cs.length === 0){ let mD = 999; for(const t of pool) mD = Math.min(mD, Math.abs(t.lv - level)); cs = pool.filter(t => Math.abs(t.lv - level) <= mD + 0.5); }
  return cs[Math.floor(Math.random() * cs.length)].name;
}
function generateEnemyTeam(chapter, diff){
  const stdLv = aiStandardLevel(chapter);
  let off = diff === 'easy' ? -1 : diff === 'hard' ? 1 : 0;
  const tl = Math.max(1, Math.min(15, stdLv + off));
  const slots = aiSlots(chapter); const team = []; const used = new Set();
  for(let i = 0; i < slots; i++){ let n, tr = 0; do { n = pickAITank(tl); tr++; } while(used.has(n) && tr < 20); used.add(n); team.push(n); }
  return team;
}