'use strict';
const assert = require('assert');
const ProgressModel = require('../js/model');

process.env.TZ = 'America/New_York';

const questions = {
  Q1:{ id:'Q1', category:'仕訳', type:'journal', difficulty:1 },
  Q2:{ id:'Q2', category:'帳簿', type:'ledger', difficulty:1 }
};
const storage = () => {
  const values = {};
  return {
    getItem(key){ return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value){ values[key] = value; return true; }
  };
};
const at = (dayOffset, hour = 12) => {
  const date = new Date(2026, 0, 1 + dayOffset, hour, 0, 0, 0);
  return date.getTime();
};

let model = new ProgressModel(questions, storage(), 'long-streak');
for (let day = 0; day < 30; day += 1) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.strictEqual(model.recordAttempt(attempt % 2 ? 'Q1' : 'Q2', true, 1000, '', false, at(day, 9 + (attempt % 8)), null, 'unsure'), true);
  }
}
assert.strictEqual(model.state.attempts.length, 200, 'detail attempt log remains capped at 200');
let summary = model.learningContinuity(at(29, 20));
assert.strictEqual(summary.currentStreak, 30, '30-day streak must survive the rolling 200-attempt detail cap');
assert.strictEqual(summary.activeDays, 30, 'all 30 active learning days must remain available to continuity reporting');

model = new ProgressModel(questions, storage(), 'busy-day');
for (let attempt = 0; attempt < 201; attempt += 1) {
  assert.strictEqual(model.recordAttempt(attempt % 2 ? 'Q1' : 'Q2', attempt % 3 !== 0, 1000, '', attempt % 17 === 0, at(0, 12), null, 'unsure'), true);
}
summary = model.learningContinuity(at(0, 20));
assert.strictEqual(model.state.attempts.length, 200, 'detail log cap must not be removed to fix continuity');
assert.strictEqual(summary.today.attempts, 201, 'today summary must not lose the oldest same-day answer after 200 attempts');
assert.strictEqual(summary.today.questionCount, 2, 'today distinct question count remains de-duplicated');

console.log('LEARNING_CONTINUITY_DURABILITY_ISSUE175_PASS');
