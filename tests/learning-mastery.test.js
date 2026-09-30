const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const ProgressModel = require('../js/model');
const RPGModel = require('../js/rpg');

const questions = {
  J1:{ id:'J1', category:'仕訳', difficulty:1, type:'journal' },
  J2:{ id:'J2', category:'仕訳', difficulty:2, type:'journal' },
  L1:{ id:'L1', category:'帳簿', difficulty:2, type:'ledger' },
  U1:{ id:'U1', category:'未回答', difficulty:1, type:'journal' }
};
const memoryStorage = () => {
  const values = {};
  return {
    values,
    getItem(key){ return Object.prototype.hasOwnProperty.call(values,key) ? values[key] : null; },
    setItem(key,value){ values[key]=value; return true; }
  };
};

const progress = new ProgressModel(questions, memoryStorage(), 'phase2-accuracy');
assert.deepStrictEqual(progress.questionAccuracy('U1'), {
  correctCount:0, incorrectCount:0, attempts:0, accuracy:null
}, '未回答問題は0%ではなくaccuracy=nullとして区別する');
assert.strictEqual(progress.questionAccuracy('UNKNOWN'), null, '未知の問題IDは分析対象にしない');

progress.recordAttempt('J1', true, 1000, '', false, 1000);
assert.deepStrictEqual(progress.questionAccuracy('J1'), {
  correctCount:1, incorrectCount:0, attempts:1, accuracy:1
}, '1回正解の問題別累積正答率をquestionStatsから導出する');
progress.recordAttempt('J1', false, 1000, 'journal-entry', false, 2000);
progress.recordAttempt('J1', true, 1000, '', false, 3000);
assert.deepStrictEqual(progress.questionAccuracy('J1'), {
  correctCount:2, incorrectCount:1, attempts:3, accuracy:2/3
}, '正解・誤答が混在しても問題別累積正答率を正確に導出する');

progress.recordAttempt('L1', false, 1000, 'table-cell', false, 4000);
progress.recordAttempt('J2', true, 1000, '', false, 5000);
progress.recordAttempt('L1', true, 1000, '', false, 6000);
progress.recordAttempt('J1', false, 1000, 'journal-entry', false, 7000);
progress.recordAttempt('L1', false, 1000, 'table-cell', false, 8000);
progress.recordAttempt('J1', true, 1000, '', false, 9000);

assert.deepStrictEqual(progress.recentAccuracy({ questionId:'J1', limit:2 }), {
  correctCount:1, incorrectCount:1, attempts:2, accuracy:0.5
}, 'recentAccuracyは全attemptsの末尾ではなく問題IDでfilterしてから直近N件を取る');
assert.deepStrictEqual(progress.recentAccuracy({ category:'帳簿', limit:2 }), {
  correctCount:1, incorrectCount:1, attempts:2, accuracy:0.5
}, 'カテゴリ指定もfilter-first / tail-Nで集計する');
assert.deepStrictEqual(progress.recentAccuracy({ questionId:'U1', limit:5 }), {
  correctCount:0, incorrectCount:0, attempts:0, accuracy:null
}, '直近成績も未回答を0%と誤認させない');
assert.deepStrictEqual(progress.recentAccuracy({ questionId:'J1', limit:0 }), progress.recentAccuracy({ questionId:'J1', limit:5 }), '不正limitは安全な既定値5へ戻す');

const bounded = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-buffer');
for (let index = 0; index < 205; index += 1) bounded.recordAttempt('J1', index % 2 === 0, 500, '', false, 10000 + index);
assert.strictEqual(bounded.state.attempts.length, 200, 'recent attemptsは従来どおり200件上限を維持する');
assert.strictEqual(bounded.questionAccuracy('J1').attempts, 205, 'lifetime問題別統計はrecent buffer上限の影響を受けない');
assert.strictEqual(bounded.recentAccuracy({ questionId:'J1', limit:200 }).attempts, 200, 'recentAccuracyは保持中recent bufferだけを使う');

const mastery = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-mastery');
assert.deepStrictEqual(mastery.learningMastery('J1'), {
  correctCount:0, incorrectCount:0, attempts:0, accuracy:null,
  evidenceFactor:0, score:0, state:'未着手',
  correctStreak:0, incorrectStreak:0, lastResult:null, lastAnsweredAt:0
}, '未着手は未着手として明示する');

mastery.recordAttempt('J1', true, 500, '', false, 1);
let result = mastery.learningMastery('J1');
assert.strictEqual(result.score, 33, '1回正解だけではevidenceFactor=1/3のため満点習熟にしない');
assert.strictEqual(result.state, '学習中');
mastery.recordAttempt('J1', true, 500, '', false, 2);
result = mastery.learningMastery('J1');
assert.strictEqual(result.score, 67, '2回正解でもevidenceFactor=2/3を適用する');
assert.strictEqual(result.state, '学習中');
mastery.recordAttempt('J1', true, 500, '', false, 3);
result = mastery.learningMastery('J1');
assert.deepStrictEqual([result.evidenceFactor,result.score,result.state,result.correctStreak], [1,100,'定着',3], '3回以上の証拠でscoreをlifetime accuracyへ一致させ、連続正解を満たせば定着とする');

const lowScore = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-low-score');
lowScore.recordAttempt('J1', false, 500, 'journal-entry', false, 1);
lowScore.recordAttempt('J1', true, 500, '', false, 2);
lowScore.recordAttempt('J1', true, 500, '', false, 3);
result = lowScore.learningMastery('J1');
assert.deepStrictEqual([result.score,result.correctStreak,result.state], [67,2,'学習中'], '連続正解2回でも累積scoreが80未満なら学習中とする');

const shortStreak = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-short-streak');
[true,true,true,false,true].forEach((correct,index) => shortStreak.recordAttempt('J1', correct, 500, correct ? '' : 'journal-entry', false, index + 1));
result = shortStreak.learningMastery('J1');
assert.deepStrictEqual([result.score,result.correctStreak,result.lastResult,result.state], [80,1,true,'学習中'], 'score80以上でも直近連続正解が2未満なら定着にしない');

const settled = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-settled');
[false,true,true,true,true].forEach((correct,index) => settled.recordAttempt('J1', correct, 500, correct ? '' : 'journal-entry', false, index + 1));
result = settled.learningMastery('J1');
assert.deepStrictEqual([result.score,result.correctStreak,result.lastResult,result.state], [80,4,true,'定着'], '累積80以上・連続正解2以上・最終正解で定着とする');
settled.recordAttempt('J1', false, 500, 'journal-entry', false, 6);
assert.strictEqual(settled.learningMastery('J1').state, '要復習', '定着後でも最終回答が誤答なら要復習へ戻す');

const repeatedWrong = new ProgressModel({ J1:questions.J1 }, memoryStorage(), 'phase2-wrong');
repeatedWrong.recordAttempt('J1', false, 500, 'journal-entry', false, 1);
repeatedWrong.recordAttempt('J1', false, 500, 'journal-entry', false, 2);
assert.deepStrictEqual([repeatedWrong.learningMastery('J1').incorrectStreak,repeatedWrong.learningMastery('J1').state], [2,'要復習'], '連続誤答を要復習として説明可能にする');

const beforeRpg = memoryStorage();
const rpg = new RPGModel(beforeRpg, 'phase2-rpg');
rpg.state.xp = 2000;
rpg.recordMastery({ id:'J1', category:'仕訳', type:'journal' }, { earned:8, possible:10, ratio:.8 });
const roleBefore = rpg.role;
const masteryBefore = JSON.stringify(rpg.state.mastery);
progress.questionAccuracy('J1');
progress.recentAccuracy({ category:'仕訳', limit:5 });
progress.learningMastery('J1');
assert.strictEqual(JSON.stringify(rpg.state.mastery), masteryBefore, 'Phase 2分析APIは既存RPG masteryを変更しない');
assert.strictEqual(rpg.role, roleBefore, 'Phase 2分析APIは既存role unlock判定を変更しない');

const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
const retryStart = controllerSource.indexOf('    finishCoachingRetry(');
const retryEnd = controllerSource.indexOf('\n    revealAnswer(', retryStart);
assert(retryStart >= 0 && retryEnd > retryStart, 'coaching retry実装を監査できる');
const retrySource = controllerSource.slice(retryStart, retryEnd);
assert(!retrySource.includes('recordAttempt'), 'coaching retryはauthoritative attemptを追加せず習熟度を水増ししない');
assert(controllerSource.includes("['全体正答率（累積）', percent(overall), evidence(overall)]"), '過去ログ分析に累積正答率を明示する');
assert(controllerSource.includes("['直近5回の正答率', percent(recent), evidence(recent)]"), '過去ログ分析で直近5回を累積と分離する');
assert(controllerSource.includes("this.model.learningMastery(id)"), '問題別表示を説明可能なlearningMasteryへ接続する');
assert(controllerSource.includes("習熟度 ${mastery.state}（指標 ${mastery.score}/100）"), '習熟度指標は状態ラベルと一緒に表示する');

const cssSource = fs.readFileSync('css/style.css', 'utf8');
assert(cssSource.includes('grid-template-columns: repeat(auto-fit, minmax(170px, 1fr))'), '問題別分析は固定横幅テーブルではなく可変gridで表示する');
assert(cssSource.includes('@media (max-width: 560px)') && cssSource.includes('.learning-problem-metrics { grid-template-columns: 1fr; }'), 'モバイルでは問題別指標を1列にして横スクロールを要求しない');

class FakeNode {
  constructor(tagName) { this.tagName=tagName; this.children=[]; this.hidden=true; this.className=''; this.textContent=''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=[...nodes]; }
}
const sandbox = { window:{} };
vm.runInNewContext(controllerSource, sandbox);
const Controller = sandbox.window.AppController;
const panel = new FakeNode('div');
const documentStub = {
  createElement(tagName) { return new FakeNode(tagName); },
  getElementById(id) { return id === 'log-analysis' ? panel : null; }
};
const renderContext = { rpg:{ level:10 }, model:progress, questions, document:documentStub };
assert.strictEqual(Controller.prototype.openLogAnalysis.call(renderContext), true, 'Lv.10以上では学習ログ分析を開ける');
assert.strictEqual(panel.hidden, false, '分析パネルを表示状態にする');
const flattenText = node => [node.textContent, ...node.children.flatMap(flattenText)].filter(Boolean).join(' ');
const renderedText = flattenText(panel);
for (const expected of ['学習ログ分析','全体正答率（累積）','直近5回の正答率','分野別正答率（累積）','問題別の習熟度','習熟度']) {
  assert(renderedText.includes(expected), `分析UIに「${expected}」を表示する`);
}
const lockedPanel = new FakeNode('div');
assert.strictEqual(Controller.prototype.openLogAnalysis.call({ rpg:{ level:9 }, model:progress, questions, document:{...documentStub,getElementById(){return lockedPanel;}} }), false, 'Lv.10未満では既存解放条件を維持する');
assert.strictEqual(lockedPanel.hidden, true, '未解放時は分析パネルを開かない');

const backup = JSON.parse(JSON.stringify(progress.state));
assert.strictEqual(ProgressModel.validateBackupState(backup, questions), true, '派生分析追加後も既存backup schemaを変更しない');

console.log('LEARNING_MASTERY_PHASE2_PASS');
