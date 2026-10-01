// ============================================================
// boot.js — 启动
// ============================================================

(async () => {
  // 外部数据/资源包：失败自动回退内置（file:// 双击也能跑）。
  if (typeof loadDataPack === 'function') await loadDataPack();
  if (typeof loadAssetPack === 'function') await loadAssetPack();
  loadSettings();
  render();
  if (typeof SFX !== 'undefined' && SFX.startBGM) SFX.startBGM();
})();