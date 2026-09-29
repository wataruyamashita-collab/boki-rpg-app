'use strict';

const assert = require('assert');
const ProgressModel = require('../js/model.js');

const questions = {
  J1: { id:'J1', category:'仕訳', difficulty:1, type:'journal' },
  J2: { id:'J2', category:'現金', difficulty:2, type:'journal' }
};

const memoryStorage = () => {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); return true; }
  };
};

const storage = memoryStorage();
const model = new ProgressModel(questions, storage, 'metrics');
assert.strictEqual(model.state.contentRevision, 4, 'learner metrics schema uses contentRevision 4');
assert.deepStrictEqual(model.state.questionStats, {}, 'new learner starts with no invented question statistics');
assert.strictEqual(model.state.lastLearningAt, 0, 'new learner has no invented last-learning timestamp');

model.record('J1', false, 1000);
model.record('J1', false, 2000);
model.record('J1', true, 3000);
model.record('J1', true, 4000);
model.record('J1', false, 5000);
assert.deepStrictEqual(model.state.questionStats.J1, {
  correctCount:2,
  incorrectCount:3,
  lastAnsweredAt:5000,
  correctStreak:0,
  incorrectStreak:1,
  lastResult:false,
  historyComplete:true
}, 'authoritative record() maintains durable counts, streaks, last result and timestamp');
assert.strictEqual(model.state.lastLearningAt, 5000, 'authoritative answer advances lastLearningAt');

model.recordAttempt('J2', true, 1200, '', false, 6000);
assert.strictEqual(model.state.lastLearningAt, 6000, 'a real attempt advances lastLearningAt even before aggregate authority is committed');
assert.strictEqual(model.state.questionStats.J2, undefined, 'recent attempt telemetry does not double-count durable question statistics');
model.record('J2', true, 7000);
assert.deepStrictEqual(model.state.questionStats.J2, {
  correctCount:1,
  incorrectCount:0,
  lastAnsweredAt:7000,
  correctStreak:1,
  incorrectStreak:0,
  lastResult:true,
  historyComplete:true
}, 'fresh durable statistics begin from the authoritative result only');
assert.strictEqual(model.state.lastLearningAt, 7000, 'later authoritative answer remains the last learning event');

const legacy = {
  contentRevision:3,
  mode:'story',
  currentQuestionId:'J1',
  answeredIds:['J1','J2'],
  correctIds:['J1'],
  incorrectIds:['J1','J2'],
  mistakeCounts:{ J1:3, J2:1 },
  reviewSchedule:{},
  reviewAssignments:{},
  attempts:[
    { questionId:'J1', id:'J1', correct:true, responseMs:1000, timestamp:8000, at:8000 },
    { questionId:'J2', id:'J2', correct:false, responseMs:1100, timestamp:9000, at:9000 }
  ],
  drafts:{},
  completed:false,
  placement:null,
  examAttempt:0,
  examSession:null,
  examHistory:[{ finishedAt:9500, points:80 }],
  lastExamReview:null
};
assert.strictEqual(ProgressModel.validateBackupState(legacy, questions), true, 'revision 3 backup remains importable for migration');

const legacyStorage = memoryStorage();
legacyStorage.values.set('legacy', JSON.stringify(legacy));
const migrated = new ProgressModel(questions, legacyStorage, 'legacy');
assert.strictEqual(migrated.state.contentRevision, 4, 'revision 3 state migrates to revision 4');
assert.deepStrictEqual(migrated.state.questionStats.J1, {
  correctCount:1,
  incorrectCount:3,
  lastAnsweredAt:0,
  correctStreak:0,
  incorrectStreak:0,
  lastResult:null,
  historyComplete:false
}, 'migration preserves only known J1 lifetime evidence and marks historical completeness false');
assert.deepStrictEqual(migrated.state.questionStats.J2, {
  correctCount:0,
  incorrectCount:1,
  lastAnsweredAt:0,
  correctStreak:0,
  incorrectStreak:0,
  lastResult:null,
  historyComplete:false
}, 'migration preserves known J2 mistake evidence without inventing a prior result order');
assert.strictEqual(migrated.state.lastLearningAt, 9500, 'migration derives lastLearningAt from factual retained attempt/exam timestamps');
assert.strictEqual(ProgressModel.validateBackupState(migrated.state, questions), true, 'migrated revision 4 state passes backup validation');

const persisted = JSON.parse(legacyStorage.values.get('legacy'));
assert.strictEqual(persisted.contentRevision, 4, 'migration is persisted immediately');
assert.strictEqual(persisted.questionStats.J1.historyComplete, false, 'persisted migrated statistics retain incomplete-history marker');

const invalidNegative = structuredClone(migrated.state);
invalidNegative.questionStats.J1.correctCount = -1;
assert.strictEqual(ProgressModel.validateBackupState(invalidNegative, questions), false, 'negative aggregate counts are rejected');

const invalidUnknown = structuredClone(migrated.state);
invalidUnknown.questionStats.UNKNOWN = structuredClone(invalidUnknown.questionStats.J1);
assert.strictEqual(ProgressModel.validateBackupState(invalidUnknown, questions), false, 'unknown question IDs are rejected from aggregate statistics');

const invalidRevision4 = structuredClone(migrated.state);
delete invalidRevision4.lastLearningAt;
assert.strictEqual(ProgressModel.validateBackupState(invalidRevision4, questions), false, 'revision 4 backup requires lastLearningAt');

const invalidStreak = structuredClone(migrated.state);
invalidStreak.questionStats.J1 = {
  correctCount:1,
  incorrectCount:1,
  lastAnsweredAt:100,
  correctStreak:1,
  incorrectStreak:1,
  lastResult:true,
  historyComplete:true
};
assert.strictEqual(ProgressModel.validateBackupState(invalidStreak, questions), false, 'mutually inconsistent streak state is rejected');

console.log('Learner metrics schema regressions: PASS');
