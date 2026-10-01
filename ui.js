// ============================================================
// ui.js — 主菜单、存档、指南、自由模式、引导弹窗、render
// ============================================================

function render(){
  if(S.screen !== 'battle' && M.screen !== 'battle'){
    document.querySelectorAll('.detail').forEach(el => el.remove());
  }
  const app = document.getElementById('app');
  if(M.screen !== 'main' && M.screen !== 'none'){
    const map = {
      mapSaveSelect: renderMapSaveSelect,
      mapGamesList: renderMapGamesList,
      mapNationSelect: renderMapNationSelect,
      mapTemplateSelect: renderMapTemplateSelect,
      map: renderMap,
      mapBase: renderMapBase,
      mapTactical: renderMapTactical,
      mapTree: renderMapTree,
      mapSettings: renderMapSettings,
      battle: renderBattle,
      guide: renderGuide,
    };
    const fn = map[M.screen];
    if(fn){
      app.innerHTML = fn();
      if(M.screen === 'battle'){
        const lb = document.getElementById('blog');
        if(lb) lb.scrollTop = lb.scrollHeight;
        if(B.lastStage !== B.stageIdx){
          document.documentElement.style.setProperty('--boff', (B.stageIdx * 73) + 'px');
          B.lastStage = B.stageIdx;
        }
      } else {
        document.documentElement.style.setProperty('--boff', '0px');
      }
      return;
    }
  }
  const map2 = {
    main: renderMain, saveSelect: renderSaveSelect, nationSelect: renderNationSelect,
    base: renderBase, battle: renderBattle,
    freeModeSelect: renderFreeModeSelect, freeSelect: renderFreeSelect,
    guide: renderGuide,
    rogueStart: renderRogueStart, rogueMap: renderRogueMap,
  };
  app.innerHTML = (map2[S.screen] || renderMain)();
  if(S.screen === 'battle'){
    const lb = document.getElementById('blog');
    if(lb) lb.scrollTop = lb.scrollHeight;
    if(B.lastStage !== B.stageIdx){
      document.documentElement.style.setProperty('--boff', (B.stageIdx * 73) + 'px');
      B.lastStage = B.stageIdx;
    }
  } else {
    document.documentElement.style.setProperty('--boff', '0px');
  }
}

function renderMain(){
  return `<h1>🛡️ 坦克战役</h1>
  <div class="sub">研发点科技树 · 三国独立 · 三种模式</div>
  <div class="btns">
    <button class="btn pri" onclick="goSaveSelect()">⚔ 战役模式</button>
    <button class="btn warn" onclick="M.screen='mapSaveSelect';S.screen='none';render()">🗺 地区模式</button>
    <button class="btn rogue-btn" onclick="goRogue()">🎲 远征（Roguelike）</button>
    <button class="btn" onclick="goFreeModeSelect()">🎮 自由模式</button>
    <button class="btn info" onclick="goGuide()">📖 游戏指南</button>
  </div>
  <div class="ver">v${VERSION}</div>`;
}
function goSaveSelect(){ S.screen = 'saveSelect'; M.screen = 'none'; render(); }
function goFreeModeSelect(){ S.screen = 'freeModeSelect'; M.screen = 'none'; render(); }
function backMain(){ S.screen = 'main'; M.screen = 'main'; render(); }

function showCampaignTutorial(){
  if(localStorage.getItem(CAMP_TUTORIAL_KEY)) return;
  if(document.querySelector('.tutor-modal')) return;
  const div = document.createElement('div');
  div.className = 'tutor-modal';
  div.innerHTML = `<div class="tutor-card">
    <h3><span class="tutor-icon">🎖️</span>欢迎指挥官！</h3>
    <p><b>🎯 目标</b>：30 关线性推进，攒研发点（RP）开科技树。</p>
    <p style="background:rgba(255,215,110,.1);border-left:3px solid #ffd76e;padding:6px 10px;border-radius:6px;color:#ffd76e;font-weight:700">🎁 初始赠送：德（一号A）· 美（M1917）· 苏（t-38）</p>
    <p><b>🚀 第一步</b>：去【编队】把赠送的坦克放入出战位，然后出击！</p>
    <p><b>💰 RP</b>：战斗获得，用来买坦克、开槽位、解锁战术指令。</p>
    <p><b>🌳 科技树</b>：点节点买坦克。<span style="color:#9cff9c">绿</span>=已拥有 · <span style="color:#ffd76e">黄</span>=可购买 · <span style="color:#5a6a5a">灰</span>=前置未满。</p>
    <p><b>⚔️ 战斗</b>：每回合距离按 <span style="color:#ffd76e">3km→2km→1km→100m→0m</span> 推进，点敌方单位开火。</p>
    <p><b>🎖 车组</b>：战斗涨经验升星，攻击/穿深浮动收窄，装甲/速度/活度 +4%/星。</p>
    <p><b>🎯 战术指令</b>：第 6 关开 1 槽、第 15 关开 2 槽。</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn pri" onclick="closeCampTutorial(true)" style="flex:1">开始战斗</button>
      <button class="btn" onclick="closeCampTutorial(false)" style="flex:1">看指南</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function closeCampTutorial(setFlag){
  localStorage.setItem(CAMP_TUTORIAL_KEY, '1');
  document.querySelectorAll('.tutor-modal').forEach(el => el.remove());
  if(!setFlag) goGuide();
}

const GUIDE_CHAPTERS = [
  { id: 'basics', title: '基础规则', icon: '📖', content: `
<h3>坦克的 5 项属性</h3>
<ul><li><span class="hl">火力</span>：决定射程档位</li><li><span class="hl">攻击</span>：伤害基础</li>
<li><span class="hl">穿深</span>：能否击穿敌方装甲</li><li><span class="hl">装甲</span>：减少受到的伤害</li><li><span class="hl">活度</span>：生命值</li></ul>
<h3>射程</h3>
<ul><li>火力 ≤ 50 → 1km</li><li>火力 51-100 → 2km</li><li>火力 > 100 → 3km</li></ul>
<h3>伤害公式</h3>
<p><span class="formula">伤害 = 攻击 × 随机(±10%) × m</span></p>
<p>m 为击穿系数（穿深减装甲的差值 df）：df ≤ 0 → ×1.0；df 较小 → ×0.5；df 中等 → ×0.25；df 很大 → ×0.125（跳弹）。</p>`},
  { id: 'battle', title: '战斗机制', icon: '⚔️', content: `
<h3>距离阶段</h3>
<p>每回合推进：<span class="hl">3km → 2km → 1km → 100m → 0m</span>。</p>
<h3>撤退</h3>
<p>第 2 回合起，我方坦克行动时，可花"一半存活坦克放弃本回合攻击"的代价，全队后撤一档。每回合限 1 次。</p>
<h3>穿深衰减</h3>
<p><span class="formula">实际穿深 = 穿深 × (1 - 0.15 × 距离km)</span></p>
<h3>伤害分级</h3>
<ul><li>满伤 → ×1.0</li><li>半穿 → ×0.5</li><li>擦伤 → ×0.25</li><li>跳弹 → ×0.125</li></ul>
<div class="demo-btn" onclick="openDamageCalc()">🎯 打开伤害模拟器</div>`},
  { id: 'tactical', title: '战术指令', icon: '🎯', content: `
<h3>指令系统</h3>
<p>战斗开始前可携带最多 2 个战术指令。战斗中用掉一场就消耗掉，下一场重新携带。</p>
<h3>触发时机</h3>
<p>轮到我方坦克行动时，除攻击外还能额外用 1 个指令。<span class="hl">每辆坦克每回合最多用 1 个</span>。</p>
<h3>解锁</h3>
<ul><li>初始赠送 4 个：集火、穿甲、烟雾弹、紧急维修</li>
<li>其余 8 个花 RP 一次性解锁</li>
<li>战役第 6 关开槽 1、第 15 关开槽 2（花 1500/3000 RP）</li></ul>`},
  { id: 'veteran', title: '车组熟练度', icon: '🎖', content: `
<h3>星级</h3>
<p>每辆坦克有独立车组。战斗获得经验，累积到阈值升星（★0→★3）。</p>
<h3>经验</h3>
<ul><li>存活：击杀 ×100 + 150</li>
<li>被击毁：击杀 ×75 + 75（战役的坦克不会被删，经验照给）</li></ul>
<h3>加成</h3>
<ul><li>攻击/穿深浮动区间：★0(0.90~1.10) → ★3(0.95~1.13)</li>
<li>装甲 / 速度 / 活度：每星 +4%</li></ul>
<h3>车组池</h3>
<p>可主动从坦克上取下车组放入池子，再装入别的坦克（降 1 星）。也可卖出换 RP。</p>`},
  { id: 'modes', title: '三种模式', icon: '🎮', content: `
<h3>⚔ 战役模式</h3><p>30 关线性，攒研发点开科技树。</p>
<h3>🗺 地区模式</h3><p>每个存档可包含多个战役（国家 + 地图自由组合）。</p>
<h3>🎮 自由模式</h3><p>全解锁沙盒，支持重复坦克。</p>`},
  { id: 'map', title: '地区模式', icon: '🗺️', content: `
<h3>胜利条件</h3>
<p>占领 <span class="hl">AI 总部（🎯）</span>，或占领地图上<span class="hl">所有 AI 格</span>。</p>
<h3>血量与修理</h3>
<ul><li>地图模式坦克有血量，战斗后保留</li>
<li>每回合自动恢复 <span class="hl">5% 最大血量</span></li>
<li>修理消耗 = 缺失血量 × 0.1 补给</li></ul>
<h3>车组</h3>
<p>地图模式坦克有车组，被击毁后车组进入池子，坦克从池中删除。</p>
<h3>指挥官 / 精英坦克</h3>
<p>每国 3 指挥官、2 精英坦克，打赢精锐格解锁。</p>`},
  { id: 'tips', title: '进阶技巧', icon: '💡', content: `
<h3>战斗技巧</h3>
<ul><li><span class="hl">集火</span>：优先打残血</li><li><span class="hl">克制</span>：坦歼怕近身，轻坦怕中坦</li></ul>
<h3>收益最大化</h3>
<ul><li><span class="hl">完美通关</span>（零损失）额外 +30% 奖励</li>
<li>首次通关额外 +50% 奖励</li>
<li>两者叠加最高可达 ×1.95</li></ul>`},
];
let guideTab = 'basics';
function goGuide(){ S.screen = 'guide'; M.screen = 'none'; guideTab = 'basics'; render(); }
function renderGuide(){
  const ch = GUIDE_CHAPTERS.find(c => c.id === guideTab) || GUIDE_CHAPTERS[0];
  return `<h1>📖 游戏指南</h1>
  <div class="sub">点击标签切换章节</div>
  <div class="guide-wrap">
    <div class="guide-tabs">
      ${GUIDE_CHAPTERS.map(c => `<button class="${guideTab === c.id ? 'act' : ''}" onclick="guideTab='${c.id}';render()">${c.icon} ${c.title}</button>`).join('')}
    </div>
    <div class="guide-content">${ch.content}</div>
    <div class="btns"><button class="btn" onclick="backMain()">← 返回主菜单</button></div>
  </div>`;
}
function openDamageCalc(){
  document.querySelectorAll('.calc-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'calc-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="calc-card">
    <h3>🎯 伤害模拟器</h3>
    <div class="calc-row"><label>攻击力</label><input type="number" id="dcAtk" value="200" min="1"></div>
    <div class="calc-row"><label>穿深</label><input type="number" id="dcPen" value="150" min="0"></div>
    <div class="calc-row"><label>目标装甲</label><input type="number" id="dcArmor" value="80" min="0"></div>
    <div class="calc-row"><label>火力</label><input type="number" id="dcFP" value="75" min="1"></div>
    <div class="calc-row"><label>距离(km)</label><input type="number" id="dcDist" value="1" min="0" max="3" step="0.1"></div>
    <div class="calc-row"><label>破甲弹</label><input type="checkbox" id="dcHeat"></div>
    <div class="calc-result" id="dcResult"></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn" onclick="this.closest('.calc-modal').remove()" style="flex:1">关闭</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  ['dcAtk','dcPen','dcArmor','dcFP','dcDist','dcHeat'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateDamageCalc);
  });
  updateDamageCalc();
}
function updateDamageCalc(){
  const atk = +document.getElementById('dcAtk').value || 0;
  const pen = +document.getElementById('dcPen').value || 0;
  const armor = +document.getElementById('dcArmor').value || 0;
  const fp = +document.getElementById('dcFP').value || 1;
  const dist = +document.getElementById('dcDist').value || 0;
  const heat = document.getElementById('dcHeat').checked;
  const effPen = heat ? pen : pen * (1 - 0.15 * dist);
  const diff = armor - effPen;
  let mul;
  if(fp <= 50) mul = diff <= 0 ? 1 : diff <= 5 ? 0.5 : diff <= 10 ? 0.25 : 0.125;
  else mul = diff <= 0 ? 1 : diff <= 10 ? 0.5 : diff <= 20 ? 0.25 : 0.125;
  const dmgBase = Math.max(1, Math.round(atk * mul));
  const epBase = heat ? pen : pen * (1 - 0.15 * dist);
  let minD = Infinity, maxD = 0;
  for(const aMul of [0.9, 1.1]){
    for(const pMul of [0.9, 1.1]){
      const ep = epBase * pMul;
      const df = armor - ep;
      let m;
      if(fp <= 50) m = df <= 0 ? 1 : df <= 5 ? 0.5 : df <= 10 ? 0.25 : 0.125;
      else m = df <= 0 ? 1 : df <= 10 ? 0.5 : df <= 20 ? 0.25 : 0.125;
      const d = Math.max(1, Math.round(atk * aMul * m));
      if(d < minD) minD = d;
      if(d > maxD) maxD = d;
    }
  }
  const grade = mul >= 1 ? '满伤' : mul >= 0.5 ? '半穿' : mul >= 0.25 ? '擦伤' : '跳弹';
  document.getElementById('dcResult').innerHTML = `
    基础穿深：<b>${Math.round(effPen)}</b><br>
    甲-穿差：<b>${Math.round(diff)}</b><br>
    判定：<b>${grade}</b> (×${mul})<br>
    基础伤害：<b style="color:#ff8080;font-size:15px">${dmgBase}</b><br>
    随机范围(±10%)：<b style="color:#ffd76e">${minD} ~ ${maxD}</b>`;
}

function renderSaveSelect(){
  let html = `<h1>选择存档</h1><div class="sub">3 个独立存档位</div><div class="saves">`;
  for(let i=0;i<3;i++){
    const sv = SAVES[i];
    if(!sv){
      html += `<div class="save empty" onclick="pickSave(${i})"><h3>存档 ${i+1}</h3><p>空</p></div>`;
    } else {
      const d = sv.c.德, m = sv.c.美, s = sv.c.苏;
      html += `<div class="save" onclick="pickSave(${i})">
        <span class="sell" onclick="event.stopPropagation();confirmDeleteSave(${i})">×</span>
        <h3>存档 ${i+1}</h3>
        <div class="row"><span class="tag">德 ${d.chapter}关</span><span class="tag">美 ${m.chapter}关</span><span class="tag">苏 ${s.chapter}关</span></div>
      </div>`;
    }
  }
  html += `</div>
  <div class="row" style="gap:8px;margin-top:12px">
    <button class="btn ghost" style="flex:1" onclick="openSaveExport()">📤 导出存档</button>
    <button class="btn ghost" style="flex:1" onclick="openSaveImport()">📥 导入存档</button>
  </div>
  <div class="btns" style="margin-top:auto"><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
  return html;
}
function confirmDeleteSave(i){ if(!SAVES[i]) return; if(!confirm(`删除存档 ${i+1}？`)) return; SAVES[i] = null; persistSaves(); render(); toast(`已删除`); }
function pickSave(i){
  if(!SAVES[i]){ if(!confirm('创建新存档？')) return; SAVES[i] = newSave(); persistSaves(); }
  S.saveIndex = i; S.nation = SAVES[i].lastNation || '德'; S.screen = 'nationSelect'; render();
}
function encodeSaveData(obj){
  try{ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  catch(e){ return ''; }
}
function decodeSaveData(b64){
  try{ return JSON.parse(decodeURIComponent(escape(atob(b64.trim())))); }
  catch(e){ return null; }
}
function openSaveExport(){
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  const data = {
    version: VERSION,
    exportAt: new Date().toISOString(),
    saves: SAVES,
    mapSaves: MAP_SAVES,
  };
  const b64 = encodeSaveData(data);
  if(!b64){ toast('导出失败'); return; }
  const div = document.createElement('div');
  div.className = 'cm-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>📤 导出存档</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      复制下面的字符串保存到安全的地方（聊天记录、笔记等）。<br>
      包含：战役存档 ×3 + 地区存档 ×3
    </div>
    <textarea id="exportText" readonly style="width:100%;height:160px;background:#0a1210;color:#9cff9c;border:1.5px solid #2a4a2a;border-radius:8px;padding:10px;font-family:monospace;font-size:10px;resize:none;outline:none;word-break:break-all">${esc(b64)}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn pri" style="flex:1" onclick="copyExportText()">📋 复制</button>
      <button class="btn" style="flex:1" onclick="this.closest('.cm-modal').remove()">关闭</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  setTimeout(() => {
    const ta = document.getElementById('exportText');
    if(ta){ ta.focus(); ta.select(); }
  }, 50);
}
function copyExportText(){
  const ta = document.getElementById('exportText');
  if(!ta) return;
  ta.select();
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(ta.value)
        .then(() => toast('已复制到剪贴板'))
        .catch(() => { document.execCommand('copy'); toast('已复制'); });
    } else {
      document.execCommand('copy');
      toast('已复制');
    }
  }catch(e){ toast('复制失败，请手动长按选择'); }
}
function openSaveImport(){
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'cm-modal';
  div.onclick = e => { if(e.target === div) div.remove(); };
  div.innerHTML = `<div class="cm-card-wrap">
    <h3>📥 导入存档</h3>
    <div style="font-size:11px;color:#8ab88a;margin-bottom:8px;line-height:1.6">
      ⚠️ 导入会<span style="color:#ff8080">覆盖</span>当前所有存档（战役 + 地区）。<br>
      粘贴之前导出的字符串。
    </div>
    <textarea id="importText" placeholder="粘贴存档字符串..." style="width:100%;height:140px;background:#0a1210;color:#e0e8e0;border:1.5px solid #2a4a2a;border-radius:8px;padding:10px;font-family:monospace;font-size:10px;resize:none;outline:none;word-break:break-all"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn pri" style="flex:1" onclick="doImportSave()">确认导入</button>
      <button class="btn" style="flex:1" onclick="this.closest('.cm-modal').remove()">取消</button>
    </div>
  </div>`;
  document.body.appendChild(div);
}
function doImportSave(){
  const ta = document.getElementById('importText');
  if(!ta) return;
  const txt = ta.value.trim();
  if(!txt){ toast('请先粘贴存档字符串'); return; }
  const obj = decodeSaveData(txt);
  if(!obj || typeof obj !== 'object'){ toast('格式错误'); return; }
  if(!obj.saves && !obj.mapSaves){ toast('数据无效'); return; }
  if(!confirm('确认导入？将覆盖当前所有存档。')) return;
  if(Array.isArray(obj.saves)){
    const s = [null, null, null];
    for(let i = 0; i < 3; i++) if(obj.saves[i]) s[i] = obj.saves[i];
    SAVES = s;
  }
  if(Array.isArray(obj.mapSaves)){
    const m = [null, null, null];
    for(let i = 0; i < 3; i++) if(obj.mapSaves[i]) m[i] = obj.mapSaves[i];
    MAP_SAVES = m;
  }
  S.saveIndex = -1;
  M.saveIndex = -1;
  persistSaves();
  persistMapSaves();
  document.querySelectorAll('.cm-modal').forEach(el => el.remove());
  render();
  toast('✅ 导入成功');
}
function renderNationSelect(){
  const sv = SAVES[S.saveIndex];
  let html = `<h1>选择国家</h1><div class="sub">三国独立科技树</div><div class="nations">`;
  ['德','美','苏'].forEach(n => {
    const nc = NAT_COLOR[n]; const ns = sv.c[n];
    html += `<div class="nation" style="border-color:${nc.c};--c1:${nc.c1};--c2:${nc.c2}" onclick="pickNation('${n}')">
      <h3 style="color:${nc.c}">${NAT_NAME[n]}</h3>
      <p>第 ${ns.chapter} 关 · 拥有 ${ns.tank.length} 辆 · 研发点 ${ns.rp}</p>
    </div>`;
  });
  html += `</div><div class="btns" style="margin-top:auto"><button class="btn" onclick="goSaveSelect()">← 返回存档</button><button class="btn" onclick="backMain()">← 主菜单</button></div>`;
  return html;
}
function pickNation(n){ S.nation = n; SAVES[S.saveIndex].lastNation = n; persistSaves(); S.screen = 'base'; S.baseTab = 'base'; S.compareA = null; S.compareB = null; render(); }
function goNationSelect(){ S.screen = 'nationSelect'; render(); }

function renderFreeModeSelect(){
  return `<h1>🎮 自由模式</h1><div class="sub">全解锁 · 支持重复</div>
  <div class="btns">
    <button class="btn pri" onclick="goFreeHotseat()">👥 热座</button>
    <button class="btn pri" onclick="goFreeAI()">🤖 打 AI</button>
    <button class="btn" onclick="backMain()">← 主菜单</button>
  </div>`;
}
function goFreeHotseat(){ F.mode = 'hotseat'; F.team = { p: [], e: [] }; F.side = 'p'; F.expanded = {}; S.screen = 'freeSelect'; M.screen = 'none'; render(); }
function goFreeAI(){ F.mode = 'ai'; F.team = { p: [], e: [] }; F.side = 'p'; F.expanded = {}; S.screen = 'freeSelect'; M.screen = 'none'; render(); }
function renderFreeSelect(){
  const P = F.team.p, E = F.team.e;
  const curTeam = F.side === 'p' ? P : E;
  const isAI = F.mode === 'ai';
  const groups = {};
  for(const n of ['德','美','苏']) groups[n] = { light: [], medium: [], heavy: [], td: [] };
  for(const name in TANKS){ const t = TANKS[name]; if(groups[t.na] && groups[t.na][t.ty]) groups[t.na][t.ty].push(name); }
  function gH(nat, ty){
    const key = nat + '-' + ty; const list = groups[nat][ty];
    const open = F.expanded[key] !== false;
    let h = `<div class="free-group-head" onclick="toggleFreeGroup('${key}')"><span class="arw">${open?'▼':'▶'}</span><span class="nm" style="color:${NAT_COLOR[nat].c}">${NAT_NAME[nat]} · ${TY_CN[ty]}</span><span class="cnt">${list.length}</span></div>`;
    if(open) h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px;padding:4px 0 8px 12px">${list.map(n => `<div class="tank-chip" style="font-size:10.5px" onclick="toggleFreePick('${esc(n)}')">${TY_ICON[TANKS[n].ty]}<span class="n">${esc(n)}</span></div>`).join('')}</div>`;
    return h;
  }
  let html = `<h1>🎮 自由模式 · ${isAI ? 'AI' : '热座'}</h1><div class="sub">每方最多 6 辆</div>`;
  if(!isAI) html += `<div class="tabs2"><button class="${F.side === 'p' ? 'act' : ''}" onclick="setFreeSide('p')">🔵 蓝方 ${P.length}/6</button><button class="${F.side === 'e' ? 'act' : ''}" onclick="setFreeSide('e')">🔴 红方 ${E.length}/6</button></div>`;
  else html += `<div class="tabs2"><button class="act">🔵 蓝方 ${P.length}/6</button><button style="opacity:.5">🤖 AI</button></div>`;
  html += `<div class="panel" style="max-height:40vh;overflow-y:auto">`;
  for(const n of ['德','美','苏']){ html += `<h3 style="color:${NAT_COLOR[n].c}">${NAT_NAME[n]}</h3>`; for(const ty of ['light','medium','heavy','td']) html += gH(n, ty); }
  html += `</div>`;
  html += `<div class="panel"><h3>${F.side === 'p' ? '🔵 蓝方' : '🔴 红方'}已选 (${curTeam.length}/6)</h3>
    ${curTeam.length ? `<div class="tank-list">${curTeam.map((n, i) => `<div class="tank-chip sel" onclick="removeFreeTank(${i})">${TY_ICON[TANKS[n].ty]}${esc(n)} ×</div>`).join('')}</div>` : '<div style="color:#5a6a5a;font-size:12px">点击上方加入</div>'}
  </div>`;
  html += `<div class="btns" style="margin-top:auto">
    <button class="btn pri" onclick="startFreeBattle()" ${(P.length && (isAI || E.length)) ? '' : 'disabled'}>开始战斗</button>
    ${!isAI ? `<button class="btn" onclick="clearFreeTeam()">清空</button>` : ''}
    <button class="btn" onclick="goFreeModeSelect()">← 切换模式</button>
    <button class="btn" onclick="backMain()">← 主菜单</button>
  </div>`;
  return html;
}
function toggleFreeGroup(key){ F.expanded[key] = F.expanded[key] === false ? true : false; render(); }
function toggleFreePick(name){
  const team = F.side === 'p' ? F.team.p : F.team.e;
  if(team.length >= 6){ toast('最多 6 辆'); return; }
  team.push(name); render();
}
function setFreeSide(s){ F.side = s; render(); }
function removeFreeTank(i){ const team = F.side === 'p' ? F.team.p : F.team.e; team.splice(i, 1); render(); }
function clearFreeTeam(){ if(F.side === 'p') F.team.p = []; else F.team.e = []; render(); }
function generateFreeAITeam(pn){
  const lvs = pn.map(n => { for(const nat of ['德','美','苏']){ const t = TREES[nat][n]; if(t) return t.lv; } return 1; });
  const avg = lvs.reduce((a, b) => a + b, 0) / lvs.length;
  const pool = [];
  for(const nat of ['德','美','苏']){ const tree = TREES[nat]; for(const name in tree) pool.push({ name, lv: tree[name].lv }); }
  const count = pn.length; const team = [];
  for(let i = 0; i < count; i++){
    let cs = pool.filter(t => Math.abs(t.lv - avg) <= 0.5);
    if(cs.length === 0) cs = pool;
    team.push(cs[Math.floor(Math.random() * cs.length)].name);
  }
  return team;
}
function startFreeBattle(){
  const isAI = F.mode === 'ai'; const P = F.team.p; let E = F.team.e;
  if(isAI){ if(P.length === 0){ toast('请先选蓝方'); return; } E = generateFreeAITeam(P); }
  else { if(P.length === 0 || E.length === 0){ toast('双方都需至少 1 辆'); return; } }
  B.units = []; B.log = []; B.stats = {}; B.round = 0; B.stageIdx = 0; B.ccRound = 0;
  B.cur = null; B.await = null; B.resolve = null; B.over = false;
  B.result = null; B.difficulty = 'normal'; B.uid = 0;
  B.mode = 'free'; B.freeMode = isAI ? 'ai' : 'hotseat'; B.earned = 0; B.lastStage = -1; B.mapCtx = null; B.aiCallback = null;
  B.perfect = false; B.isFirstClear = false; B._veteranResult = null;
  B.retreatUsedThisTurn = false; B.retreatSelect = false; B.retreatPicked = [];
  B.auto = AUTO_BATTLE_CONTINUOUS;
  initBattleBuffs();
  B.tactical = { playerEquipped: ['volley','smoke'], playerUsed: [], enemyEquipped: [], enemyUsed: [] };
  P.forEach((n, i) => B.units.push(makeBattleUnit(n, 'player', i)));
  E.forEach((n, i) => B.units.push(makeBattleUnit(n, 'enemy', i)));
  addBLog(`<span class="rd">⚔ 自由对战 · 蓝 ${P.length} vs 红 ${E.length}${isAI ? '（AI）' : ''}${AUTO_BATTLE_CONTINUOUS?' · 自动':''}</span>`);
  S.screen = 'battle'; M.screen = 'none';
  document.documentElement.style.setProperty('--boff', '0px'); B.lastStage = -1;
  render(); setTimeout(runBattle, 500);
}
function freeRestart(){ document.getElementById('battleResult')?.remove(); startFreeBattle(); }
function backToFreeSelect(){ document.querySelectorAll('.res-modal,.diff-modal,.detail,.cm-modal,.tk-detail-modal').forEach(el => el.remove()); S.screen = 'freeSelect'; M.screen = 'none'; document.documentElement.style.setProperty('--boff', '0px'); render(); }