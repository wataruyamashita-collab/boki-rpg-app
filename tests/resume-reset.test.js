const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
let reloadCount = 0;
const sandbox = {
  window: { location:{ reload(){ reloadCount += 1; } } },
  Event: class Event {},
  queueMicrotask(fn){ fn(); }
};
vm.runInNewContext(controllerSource, sandbox);
const Controller = sandbox.window.AppController;

function initContext(savedMode = 'training', activeExam = false) {
  const calls = [];
  const context = {
    questions:{ L1:{ id:'L1' }, J1:{ id:'J1' } },
    model:{
      state:{ placement:{ completed:true }, mode:savedMode, currentQuestionId:'L1' },
      migrateLegacyPlacement(){ calls.push(['migrate']); }
    },
    rpg:{},
    view:{ updateRpg(){ calls.push(['rpg']); } },
    bindEvents(){ calls.push(['bind']); },
    populateAccountFilter(){ calls.push(['filter']); },
    renderModes(){ calls.push(['render']); },
    hasActiveExamSession(){ return activeExam; },
    showMode(mode){ calls.push(['mode', mode]); this.model.state.mode = mode; return true; },
    offerResume(mode){ calls.push(['resume', mode]); return true; },
    start(id){ calls.push(['start', id]); }
  };
  return { context, calls };
}

{
  const { context, calls } = initContext('training', false);
  Controller.prototype.init.call(context, {});
  assert(calls.some(item => item[0] === 'mode' && item[1] === 'training'), '明示routeがなければ保存済みtrainingモードを復元する');
  assert(calls.some(item => item[0] === 'resume' && item[1] === 'training'), '保存済みモードで前回位置の再開確認を出す');
}
{
  const { context, calls } = initContext('review', false);
  Controller.prototype.init.call(context, { mode:'story' });
  assert(calls.some(item => item[0] === 'mode' && item[1] === 'story'), '明示routeは保存済みモードより優先する');
  assert(!calls.some(item => item[0] === 'resume'), '明示routeでは自動の再開確認を重ねない');
}
{
  const { context, calls } = initContext('exam', false);
  Controller.prototype.init.call(context, {});
  assert(calls.some(item => item[0] === 'mode' && item[1] === 'story'), '終了済みexamモードだけが保存されていても新しい模試を勝手に開始しない');
}
{
  const { context, calls } = initContext('story', true);
  Controller.prototype.init.call(context, {});
  assert(calls.some(item => item[0] === 'mode' && item[1] === 'exam'), '進行中の模試は保存済み通常モードより優先して復元する');
}

const questionMap = {
  J1:{ id:'J1', type:'journal', category:'仕訳', question:'J1問題' },
  J2:{ id:'J2', type:'journal', category:'仕訳', question:'J2問題' },
  L1:{ id:'L1', type:'ledger', category:'帳簿', question:'L1問題' },
  L2:{ id:'L2', type:'ledger', category:'帳簿', question:'L2問題' }
};
function resumeContext(state = {}) {
  return {
    questions:questionMap,
    model:{ state:{ answeredIds:[], currentQuestionId:null, examSession:null, ...state } },
    storyIds(){ return ['J1','J2','L1','L2']; },
    learningIds(){ return ['J1','J2','L1','L2']; },
    reviewIds(){ return ['J2']; },
    unansweredExamIds(){ return ['L2']; }
  };
}
{
  const ctx = resumeContext({ currentQuestionId:'J2', answeredIds:['J1'] });
  assert.strictEqual(Controller.prototype.resumeCandidate.call(ctx, 'story'), 'J2', '途中の未回答問題を最初の未回答より優先して厳密に再開する');
}
{
  const ctx = resumeContext({ currentQuestionId:'J1', answeredIds:['J1'] });
  assert.strictEqual(Controller.prototype.resumeCandidate.call(ctx, 'story'), 'J2', '回答済み問題で閉じた場合は次の未回答へ進める');
}
{
  const ctx = resumeContext({ currentQuestionId:'L1', answeredIds:['J1','J2'] });
  assert.strictEqual(Controller.prototype.resumeCandidate.call(ctx, 'training'), 'L1', 'trainingの未回答位置を復元する');
}
{
  const ctx = resumeContext({ currentQuestionId:'J2', answeredIds:['J1'], examSession:{ ids:['L1','L2'] } });
  assert.strictEqual(Controller.prototype.resumeCandidate.call(ctx, 'exam'), 'L2', '現在IDが模試集合外なら未回答模試問題へ安全に復元する');
  assert.strictEqual(Controller.prototype.resumeCandidate.call(ctx, 'desk'), null, '問題を持たない実務デスクでは再開問題を作らない');
}
{
  let notice;
  let started = null;
  const ctx = resumeContext({ currentQuestionId:'J2', answeredIds:['J1'], lastLearningAt:1000, mode:'story' });
  ctx.resumeCandidate = Controller.prototype.resumeCandidate;
  ctx.view = { showNotice(message, options){ notice={message,options}; return true; } };
  ctx.start = id => { started=id; };
  assert.strictEqual(Controller.prototype.offerResume.call(ctx, 'story'), true);
  assert.match(notice.message, /J2問題/, '再開確認に前回問題を表示する');
  assert.strictEqual(notice.options.confirmLabel, '続きから');
  notice.options.onConfirm();
  assert.strictEqual(started, 'J2', '再開確認の確定で前回問題を開始する');
}

function makeStorage(initial = {}, failRemoveKey = null) {
  const data = { ...initial };
  return {
    data,
    getItem(key){ return Object.prototype.hasOwnProperty.call(data,key) ? data[key] : null; },
    setItem(key,value){ data[key]=value; return true; },
    removeItem(key){ if (key === failRemoveKey) return false; delete data[key]; return true; }
  };
}
function resetContext(storage) {
  const status = { textContent:'', classList:{ add(){ this.error=true; }, remove(){ this.error=false; } } };
  return {
    model:{ storage, key:'progress' },
    rpg:{ storage, key:'character' },
    document:{ getElementById(id){ return id === 'backup-status' ? status : null; } },
    storageRead:Controller.prototype.storageRead,
    storageRemove:Controller.prototype.storageRemove,
    storageRestore:Controller.prototype.storageRestore,
    openSettings(){ this.settingsOpened=true; },
    status
  };
}
{
  reloadCount = 0;
  const storage = makeStorage({ progress:'P', character:'C' });
  const ctx = resetContext(storage);
  assert.strictEqual(Controller.prototype.resetLearningData.call(ctx), true, '2ストアを安全に初期化できる');
  assert.deepStrictEqual(storage.data, {}, 'progressとcharacterの両方を削除する');
  assert.strictEqual(reloadCount, 1, '初期化成功後だけ再読み込みする');
}
{
  reloadCount = 0;
  const storage = makeStorage({ progress:'P', character:'C' }, 'character');
  const ctx = resetContext(storage);
  assert.strictEqual(Controller.prototype.resetLearningData.call(ctx), false, '片側削除失敗を成功扱いしない');
  assert.deepStrictEqual(storage.data, { progress:'P', character:'C' }, '片側削除失敗時は両ストアを元へ戻す');
  assert.strictEqual(reloadCount, 0, 'ロールバック時は再読み込みしない');
  assert.strictEqual(ctx.settingsOpened, true, '失敗内容を設定画面へ戻して確認できる');
}
{
  let closed=false, notice=null, reset=false;
  const ctx={
    closeSettings(){ closed=true; },
    view:{ showNotice(message,options){ notice={message,options}; return true; } },
    resetLearningData(){ reset=true; }
  };
  assert.strictEqual(Controller.prototype.requestFullReset.call(ctx), true);
  assert.strictEqual(closed, true, '確認ダイアログの前に設定dialogを閉じる');
  assert.match(notice.message, /JSONバックアップ/, '破壊的初期化の前にバックアップを案内する');
  assert.strictEqual(notice.options.cancelLabel, '戻る');
  assert.strictEqual(notice.options.confirmLabel, '初期化する');
  notice.options.onConfirm();
  assert.strictEqual(reset, true, '明示確認後だけ初期化を実行する');
}

const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('data-action="reset-learning-data"'), '設定画面から全学習データ初期化へ進める');
assert(/必要な場合は先にJSONバックアップ/.test(html), '初期化UIでバックアップを先に案内する');

console.log('RESUME_RESET_PHASE1B_PASS');
