'use strict';
const assert = require('assert');
const ProgressModel = require('../js/model');

process.env.TZ = 'America/New_York';

const questions = {
  Q1:{ id:'Q1', category:'仕訳', type:'journal', difficulty:1 },
  Q2:{ id:'Q2', category:'帳簿', type:'ledger', difficulty:1 }
};
const storage = (initial = {}) => {
  const values = { ...initial };
  return {
    values,
    getItem(key){ return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value){ values[key] = value; return true; }
  };
};
const at = (dayOffset, hour = 12) => {
  const date = new Date(2026, 0, 1 + dayOffset, hour, 0, 0, 0);
  return date.getTime();
};

const longStore = storage();
let model = new ProgressModel(questions, longStore, 'long-streak');
for (let day = 0; day < 30; day += 1) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.strictEqual(model.recordAttempt(attempt % 2 ? 'Q1' : 'Q2', true, 1000, '', false, at(day, 9 + (attempt % 8)), null, 'unsure'), true);
  }
}
assert.strictEqual(model.state.attempts.length, 200, 'detail attempt log remains capped at 200');
let summary = model.learningContinuity(at(29, 20));
assert.strictEqual(summary.currentStreak, 30, '30-day streak must survive the rolling 200-attempt detail cap');
assert.strictEqual(summary.activeDays, 30, 'all 30 active learning days must remain available to continuity reporting');
model = new ProgressModel(questions, longStore, 'long-streak');
summary = model.learningContinuity(at(29, 20));
assert.strictEqual(summary.currentStreak, 30, '30-day streak must survive save/load, not only one in-memory session');
assert.strictEqual(model.state.attempts.length, 200, 'reload keeps the rolling detail log capped at 200');
assert.strictEqual(model.state.learningSchemaVersion, 3, 'durable continuity uses schema v3');

model = new ProgressModel(questions, storage(), 'busy-day');
for (let attempt = 0; attempt < 201; attempt += 1) {
  assert.strictEqual(model.recordAttempt(attempt % 2 ? 'Q1' : 'Q2', attempt % 3 !== 0, 1000, '', attempt % 17 === 0, at(0, 12), null, 'unsure'), true);
}
summary = model.learningContinuity(at(0, 20));
assert.strictEqual(model.state.attempts.length, 200, 'detail log cap must not be removed to fix continuity');
assert.strictEqual(summary.today.attempts, 201, 'today summary must not lose the oldest same-day answer after 200 attempts');
assert.strictEqual(summary.today.questionCount, 2, 'today distinct question count remains de-duplicated');


const v1Attempts = [];
for (let day = 0; day < 3; day += 1) {
  v1Attempts.push({
    questionId:'Q1', id:'Q1', concept:'仕訳', category:'仕訳', difficulty:1,
    correct:true, confidence:'unsure', responseMs:1000, wrongType:'',
    reviewStage:null, delayedSuccess:false, timestamp:at(day), at:at(day)
  });
}
const v1State = {
  contentRevision:3,
  learningSchemaVersion:1,
  lastLearningAt:at(2),
  questionStats:{
    Q1:{ correctCount:500, incorrectCount:20, correctStreak:4, incorrectStreak:0, lastResult:true, lastAnsweredAt:at(2) }
  },
  mode:'story',
  currentQuestionId:null,
  answeredIds:['Q1'],
  correctIds:['Q1'],
  incorrectIds:[],
  mistakeCounts:{},
  reviewSchedule:{},
  reviewAssignments:{},
  attempts:v1Attempts,
  drafts:{},
  completed:false,
  placement:null,
  examAttempt:0,
  examSession:null,
  examHistory:[],
  lastExamReview:null
};
const v1Store = storage({ legacy:JSON.stringify(v1State) });
const migrated = new ProgressModel(questions, v1Store, 'legacy');
assert.strictEqual(migrated.state.learningSchemaVersion, 3, 'v1 state migrates explicitly to schema v3');
assert.strictEqual(migrated.state.questionStats.Q1.correctCount, 500, 'v1 durable lifetime questionStats must not be rebuilt from the rolling attempt subset');
assert.strictEqual(migrated.state.questionStats.Q1.incorrectCount, 20, 'v1 lifetime incorrect count survives migration');
assert.deepStrictEqual(migrated.state.learningContinuityState.activeDayKeys.length, 3, 'v1 migration seeds only continuity evidence recoverable from retained attempts');
assert.strictEqual(migrated.learningContinuity(at(2, 20)).currentStreak, 3, 'migrated retained days drive continuity without inventing lost history');
assert.strictEqual(JSON.parse(v1Store.values.legacy).learningSchemaVersion, 3, 'successful v1 migration is persisted immediately');

assert.strictEqual(ProgressModel.validateBackupState(v1State, questions), true, 'explicit schema v1 backup remains importable');
assert.strictEqual(ProgressModel.validateBackupState(migrated.state, questions), true, 'canonical schema v3 backup remains importable');
const corruptContinuity = JSON.parse(JSON.stringify(migrated.state));
corruptContinuity.learningContinuityState.activeDayKeys = ['2026-01-02','2026-01-01'];
assert.strictEqual(ProgressModel.validateBackupState(corruptContinuity, questions), false, 'schema v3 backup rejects unsorted/ambiguous historical day keys');
const duplicateContinuity = JSON.parse(JSON.stringify(migrated.state));
duplicateContinuity.learningContinuityState.activeDayKeys.push(duplicateContinuity.learningContinuityState.activeDayKeys[0]);
assert.strictEqual(ProgressModel.validateBackupState(duplicateContinuity, questions), false, 'schema v3 backup rejects duplicate historical day keys');
const missingContinuity = JSON.parse(JSON.stringify(migrated.state));
delete missingContinuity.learningContinuityState;
assert.strictEqual(ProgressModel.validateBackupState(missingContinuity, questions), false, 'schema v3 backup requires continuity evidence');

console.log('LEARNING_CONTINUITY_DURABILITY_ISSUE175_PASS');