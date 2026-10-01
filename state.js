// ============================================================
// state.js — 存档、全局状态对象
// ============================================================

function loadSaves(){ try{ const s = localStorage.getItem(SAVE_KEY); if(s) return JSON.parse(s); }catch(e){} return [null,null,null]; }
function persistSaves(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SAVES)); }catch(e){} }
let SAVES = loadSaves();
function newSave(){ return { c: { 德: newNationSave('德'), 美: newNationSave('美'), 苏: newNationSave('苏') }, lastNation: '德' }; }
function newNationSave(nation){
  const starter = { 德:'一号A', 美:'M1917', 苏:'t-38' }[nation || '德'];
  return { rp: 0, tank: [{ n: starter, exp: 0 }], slots: 1, chapter: 1, clearMax: 0, lineup: [], tacSlots: 0, tacUnlocked: [...INITIAL_TACTICALS], tacEquipped: [], crewPool: [] };
}
function getCur(){
  const s = SAVES[S.saveIndex]; if(!s) return null;
  const cur = s.c[S.nation];
  if(cur && !cur.crewPool) cur.crewPool = [];
  return cur;
}

let MAP_SAVES = (function(){ try{ const s = localStorage.getItem(MAP_SAVE_KEY); if(s) return JSON.parse(s); }catch(e){} return [null,null,null]; })();
function persistMapSaves(){ try{ localStorage.setItem(MAP_SAVE_KEY, JSON.stringify(MAP_SAVES)); }catch(e){} }

const S = { screen: 'main', saveIndex: -1, nation: '德', baseTab: 'base', compareA: null, compareB: null, codexNat: 'all', codexTy: 'all' };
const F = { team: { p: [], e: [] }, side: 'p', mode: 'hotseat', expanded: {} };
const B = { units: [], log: [], stats: {}, round: 0, stageIdx: 0, ccRound: 0, cur: null, await: null, resolve: null, over: false, result: null, difficulty: 'normal', mode: 'campaign', freeMode: 'hotseat', earned: 0, uid: 0, lastStage: -1, mapCtx: null, aiCallback: null, auto: false, buffs: null, tactical: null, perfect: false, isFirstClear: false, _veteranResult: null, retreatUsedThisTurn: false, retreatSelect: false, retreatPicked: [] };
const M = { screen: 'main', saveIndex: -1, gameIdx: 0, nation: '德', pendingNation: null, selectedUnit: null, moveMode: null, undoStack: [], lastClick: { id: -1, time: 0 }, selectedBaseTab: 'base', editingUnitId: null };
let BATTLE_SPEED = false;
let AUTO_BATTLE_CONTINUOUS = false;

function resetBattleState(mode, difficulty){
  difficulty = difficulty || 'normal';
  B.units = []; B.log = []; B.stats = {}; B.round = 0; B.stageIdx = 0; B.ccRound = 0;
  B.cur = null; B.await = null; B.resolve = null; B.over = false;
  B.result = null; B.difficulty = difficulty; B.uid = 0;
  B.mode = mode; B.earned = 0; B.lastStage = -1; B.mapCtx = null; B.aiCallback = null;
  B.perfect = false; B.isFirstClear = false; B._veteranResult = null;
  B.retreatUsedThisTurn = false; B.retreatSelect = false; B.retreatPicked = [];
  B.auto = AUTO_BATTLE_CONTINUOUS; B.buffs = null; B.tactical = null;
}