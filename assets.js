// ============================================================
// assets.js — 外部媒体资源包（图片 + 音频），改美术不必重编译
// ------------------------------------------------------------
// 与 data.pack.json 同模式：启动时尝试 fetch assets.pack.json 并按需覆盖；
// 缺失 / 失败（含 file:// 双击）静默回退内置表现（emoji + 合成音效）。
// 可用键：
//   images: 坦克名 / 类型(light|medium|heavy|td) / "icon:坦克名"
//   audio : fire, hit, hit:pierce, hit:half, hit:graze, explode, move,
//           tac, win, lose, click, coin, reload, bgm
// 可用 window.__TANK_ASSET_BASE__ 指定资源前缀、window.__TANK_ASSET_PACK__ 指定清单路径。
// ============================================================

const ASSET_PACK = { images: {}, audio: {} };
const ASSET_BASE = (window.__TANK_ASSET_BASE__) || '';
const ASSET_PACK_URL = (window.__TANK_ASSET_PACK__) || 'assets.pack.json';

async function loadAssetPack() {
  try {
    const res = await fetch(ASSET_PACK_URL, { cache: 'no-store' });
    if (!res.ok) return { ok: false, reason: 'http ' + res.status };
    const pack = await res.json();
    if (pack && typeof pack.images === 'object') Object.assign(ASSET_PACK.images, pack.images);
    if (pack && typeof pack.audio === 'object') Object.assign(ASSET_PACK.audio, pack.audio);
    return { ok: true, pack };
  } catch (e) {
    return { ok: false, reason: String((e && e.message) || e) };
  }
}

function assetUrl(rel){ return rel ? ASSET_BASE + rel : null; }
function tankImage(name, ty){
  return assetUrl(ASSET_PACK.images[name])
      || (ty ? assetUrl(ASSET_PACK.images[ty]) : null)
      || assetUrl(ASSET_PACK.images['icon:' + name]);
}
function tankIconHTML(name, ty, fallback){
  const url = tankImage(name, ty);
  return url ? `<img class="tk-img" src="${url}" alt="">` : (fallback || '');
}
function tankImgOnly(name, ty){
  const url = tankImage(name, ty);
  return url ? `<img class="tn-img" src="${url}" alt="">` : '';
}
function audioFor(key){
  if (!key) return null;
  const base = key.split(':')[0];
  return assetUrl(ASSET_PACK.audio[key] || ASSET_PACK.audio[base]);
}

// ---- 外部音频优先（由 assets.pack.json 驱动） --------------------------------
// 若资源包登记了对应音频文件则播放文件，否则回退到 util.js 的合成音效。
(function(){
  const simple = ['fire','explode','move','tac','win','lose','click','coin','reload'];
  const play = function(sfx, url){
    try{ const a = new Audio(url); a.volume = Math.max(0, Math.min(1, sfx.volume)); a.play().catch(()=>{}); return true; }catch(e){ return false; }
  };
  for(const name of simple){
    const orig = SFX[name].bind(SFX);
    SFX[name] = function(arg){
      if(this.enabled){
        const url = (typeof audioFor === 'function') ? audioFor(name) : null;
        if(url && play(this, url)) return;
      }
      return orig(arg);
    };
  }
  const origHit = SFX.hit.bind(SFX);
  SFX.hit = function(type){
    if(this.enabled){
      const url = (typeof audioFor === 'function') ? (audioFor('hit:' + type) || audioFor('hit')) : null;
      if(url && play(this, url)) return;
    }
    return origHit(type);
  };
  SFX.bgmEl = null;
  SFX.startBGM = function(){
    if(!this.enabled) return;
    const url = (typeof audioFor === 'function') ? audioFor('bgm') : null;
    if(!url) return;
    if(this.bgmEl){ this.bgmEl.play().catch(()=>{}); return; }
    try{
      const a = new Audio(url); a.loop = true; a.volume = Math.max(0, Math.min(1, this.volume * 0.6));
      this.bgmEl = a;
      a.play().catch(()=>{});
      // 浏览器自动播放策略：首次交互时再试一次。
      const kick = () => { a.play().catch(()=>{}); document.removeEventListener('pointerdown', kick); };
      document.addEventListener('pointerdown', kick);
    }catch(e){}
  };
  SFX.stopBGM = function(){ try{ if(this.bgmEl) this.bgmEl.pause(); }catch(e){} };
  SFX.setBGMVolume = function(){ if(this.bgmEl) this.bgmEl.volume = Math.max(0, Math.min(1, this.volume * 0.6)); };
})();
