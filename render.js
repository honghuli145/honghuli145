// ============================================================
// render.js — 渲染帮助函数（集中散落的 HTML 拼接）
// 在 util.js 之后、各渲染脚本之前加载。
// 依赖：util.js 的 getStar / esc；assets.js 的 tankIconHTML（可选，运行时才调用）。
// ============================================================

// 星级计数（接受经验值）
function starCount(exp){ return (typeof getStar === 'function') ? getStar(exp || 0) : 0; }
// 星级后缀（接受「星数」）：'' 或 ' ★★'
function starSuffix(st){ return st > 0 ? ' ' + '★'.repeat(st) : ''; }
// 星级后缀（接受「经验」）
function starText(exp){ return starSuffix(starCount(exp)); }

// 坦克名 + 星级（含可选图标）
// opts: { icon:true(默认), iconFallback:'⚡', star:<星数,覆盖 exp>, attrs:'data-x' }
function tankNameHTML(name, ty, exp, opts){
  opts = opts || {};
  const st = (opts.star != null) ? opts.star : starCount(exp);
  let pre = '';
  if(opts.icon !== false){
    const fb = opts.iconFallback || '';
    pre = (typeof tankIconHTML === 'function') ? tankIconHTML(name, ty, fb) : fb;
  }
  const attrs = opts.attrs ? ' ' + opts.attrs : '';
  return `${pre}<span class="tank-name" data-star="${st}"${attrs}>${esc(name)}${starSuffix(st)}</span>`;
}

// 通用条（血条 / 经验条）：pct 0-100，cls 为完整类名，extraCls 追加（含前导空格）
function barHTML(pct, cls, extraCls){
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return `<div class="${cls}${extraCls || ''}"><i style="width:${p}%"></i></div>`;
}

// 按钮
function btnHTML(label, onclick, opts){
  opts = opts || {};
  const cls = 'btn' + (opts.cls ? ' ' + opts.cls : '');
  const oc = onclick ? ` onclick="${onclick}"` : '';
  const style = opts.style ? ` style="${opts.style}"` : '';
  const dis = opts.disabled ? ' disabled' : '';
  return `<button class="${cls}"${oc}${style}${dis}>${label}</button>`;
}
// btns 包裹层
function btnsHTML(inner, style){
  return `<div class="btns"${style ? ` style="${style}"` : ''}>${inner}</div>`;
}
// 关闭按钮（模态 / 详情面板）
function closeBtnHTML(sel, label){
  return btnHTML(label || '关闭', `this.closest('${sel}').remove()`);
}

// 全部模态类名（集中清理用）
const MODAL_SEL = '.res-modal,.diff-modal,.detail,.cm-modal,.tk-detail-modal,.calc-modal,.tutor-modal,.rogue-tac-modal,.rogue-shop-modal,.rogue-rest-modal,.rogue-event-modal';

// 模态脚手架：className 可含多个类（如 'cm-modal rogue-shop-modal'）
function openModal(className, html, id){
  const sel = '.' + String(className).trim().split(/\s+/).join('.');
  document.querySelectorAll(sel).forEach(el => el.remove());
  const m = document.createElement('div');
  m.className = className;
  if(id) m.id = id;
  m.innerHTML = html;
  document.body.appendChild(m);
  return m;
}
// 按选择器移除模态
function closeModals(sel){
  document.querySelectorAll(sel).forEach(el => el.remove());
}
// 移除全部模态
function closeAllModals(){ closeModals(MODAL_SEL); }
