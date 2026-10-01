'use strict';
const assert = require('assert');
const ProgressModel = require('../js/model');

const DAY = 24 * 60 * 60 * 1000;
const now = 20 * DAY;
const questions = {
  due:{ id:'due', category:'shared', difficulty:2, learningRole:'core' },
  wrong:{ id:'wrong', category:'shared', difficulty:2, learningRole:'core' },
  weak:{ id:'weak', category:'shared', difficulty:2, learningRole:'core' },
  inactive:{ id:'inactive', category:'shared', difficulty:2, learningRole:'core' },
  unseen:{ id:'unseen', category:'shared', difficulty:2, learningRole:'core' },
  stable:{ id:'stable', category:'shared', difficulty:2, learningRole:'core' },
  boundary:{ id:'boundary', category:'boundary', difficulty:2, learningRole:'core' },
  future:{ id:'future', category:'shared', difficulty:2, learningRole:'core' },
  reviewOnly:{ id:'reviewOnly', category:'shared', difficulty:2, learningRole:'review' },
  transferOnly:{ id:'transferOnly', category:'shared', difficulty:2, learningRole:'transfer' },
  examOnly:{ id:'examOnly', category:'shared', difficulty:2, learningRole:'exam' }
};
const storage = { getItem(){ return null; }, setItem(){ return true; } };
const model = new ProgressModel(questions, storage, 'phase3-priority');

model.recordAttempt('due', true, 1000, '', false, now - DAY);
model.state.reviewSchedule.due = { stage:1, dueAt:now - 1000 };

model.recordAttempt('wrong', true, 1000, '', false, now - 3000);
model.recordAttempt('wrong', false, 1000, 'journal-entry', false, now - 2000);
model.recordAttempt('wrong', false, 1000, 'journal-entry', false, now - 1000);

model.recordAttempt('weak', false, 1000, 'table-cell', false, now - 3000);
model.recordAttempt('weak', true, 1000, '', false, now - 1000);

for (let i = 0; i < 3; i += 1) model.recordAttempt('inactive', true, 1000, '', false, now - 7 * DAY);
for (let i = 0; i < 3; i += 1) model.recordAttempt('stable', true, 1000, '', false, now - DAY + i);

[false,false,true,true,true].forEach((correct,index) => model.recordAttempt('boundary', correct, 1000, correct ? '' : 'table-cell', false, now - 100 + index));

model.recordAttempt('future', false, 1000, 'table-cell', false, now - 1000);
model.state.reviewSchedule.future = { stage:0, dueAt:now + DAY };

const due = model.studyPriority('due', now);
assert.strictEqual(due.tier, 0, '期限到来済みreviewは最優先P0');
assert.strictEqual(due.due, true);
assert(due.reasons.some(reason => reason.includes('復習期限')));

const wrong = model.studyPriority('wrong', now);
assert.strictEqual(wrong.tier, 1, '直近誤答 / 連続誤答はP1');
assert(wrong.reasons.some(reason => reason.includes('連続誤答2回')));

const weak = model.studyPriority('weak', now);
assert.strictEqual(weak.tier, 2, '正答率60%未満はP2');
assert.strictEqual(weak.lifetime.accuracy, .5);
assert(weak.reasons.some(reason => reason.includes('60%未満')));

const inactive = model.studyPriority('inactive', now);
assert.strictEqual(inactive.tier, 3, '最終回答からちょうど7日でP3');
assert.strictEqual(inactive.inactiveMs, 7 * DAY);

const unseen = model.studyPriority('unseen', now);
assert.strictEqual(unseen.tier, 4, '未回答問題はP4');
assert.strictEqual(unseen.lifetime.attempts, 0);

const stable = model.studyPriority('stable', now);
assert.strictEqual(stable.tier, 5, '定着済み・期限前・非休眠は通常P5');

const boundary = model.studyPriority('boundary', now);
assert.strictEqual(boundary.lifetime.accuracy, .6, '60%境界を正確に保持');
assert.strictEqual(boundary.tier, 5, '正答率ちょうど60%は弱点P2にしない');

assert.strictEqual(model.studyPriority('reviewOnly', now), null, 'review専用variantは通常優先順位から除外');
assert.strictEqual(model.studyPriority('transferOnly', now), null, 'transfer問題は通常優先順位から除外');
assert.strictEqual(model.studyPriority('examOnly', now), null, 'exam専用問題は通常優先順位から除外');
assert.strictEqual(model.studyPriority('unknown', now), null, '未知Question IDはfail-closed');
assert.deepStrictEqual(model.priorityStudyIds({ now:-1 }), [], '不正な時刻はfail-closed');

const priority = model.priorityStudyIds({ now, category:'shared' });
assert.deepStrictEqual(priority.slice(0,5), ['due','wrong','weak','inactive','unseen'], 'P0→P1→P2→P3→P4の順で推薦する');
assert(!priority.includes('future'), '期限前spaced-reviewを通常推薦で前倒ししない');
assert(!priority.includes('reviewOnly') && !priority.includes('transferOnly') && !priority.includes('examOnly'), '専用roleを推薦キューへ混入させない');

const limited = model.priorityStudyIds({ now, category:'shared', limit:2 });
assert.deepStrictEqual(limited, ['due','wrong'], 'limitは優先順位適用後に効く');

const recommended = model.recommendedIds('shared', now);
assert(recommended.indexOf('wrong') < recommended.indexOf('unseen'), '同一concept推薦では説明可能な弱点を未回答より先に扱う');

const tieQuestions = {
  first:{ id:'first', category:'tie', difficulty:2, learningRole:'core' },
  second:{ id:'second', category:'tie', difficulty:2, learningRole:'core' }
};
const tieModel = new ProgressModel(tieQuestions, storage, 'phase3-tie');
assert.deepStrictEqual(tieModel.priorityStudyIds({ now, category:'tie' }), ['first','second'], '同tierは著者定義順で決定論的に並ぶ');

const adaptiveQuestions = {
  A:{ id:'A', category:'adaptive', difficulty:3, learningRole:'core' },
  B:{ id:'B', category:'adaptive', difficulty:2, learningRole:'core' }
};
const adaptive = new ProgressModel(adaptiveQuestions, storage, 'phase3-adaptive');
adaptive.recordAttempt('A', false, 30000, 'journal-entry', false, now - 1, null, 'sure');
assert.strictEqual(adaptive.adaptiveDifficulty('adaptive'), 2, 'Phase 3でも既存の自信あり誤答による難度調整を維持');

const snapshot = JSON.stringify(model.state);
model.studyPriority('weak', now);
model.priorityStudyIds({ now, category:'shared' });
assert.strictEqual(JSON.stringify(model.state), snapshot, 'priority分析は永続stateを変更しない');

console.log('LEARNING_PRIORITY_PHASE3A_PASS');
