'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

process.env.TZ = 'America/New_York';

const ProgressModel = require('../js/model');
const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
const viewSource = fs.readFileSync('js/view.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const sandbox = { window:{}, Event:class Event {}, queueMicrotask(fn){ fn(); } };
vm.runInNewContext(controllerSource, sandbox);
const Controller = sandbox.window.AppController;

const questions = {
  Q1:{ id:'Q1', category:'仕訳', type:'journal' },
  Q2:{ id:'Q2', category:'帳簿', type:'ledger' }
};
const storage = () => {
  const values = {};
  return {
    getItem(key){ return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value){ values[key] = value; return true; }
  };
};
const time = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
const addAttempt = (model, id, correct, at, delayedSuccess = false) =>
  model.recordAttempt(id, correct, 1000, '', delayedSuccess, at, null, 'unsure');

let model = new ProgressModel(questions, storage(), 'empty');
let summary = model.learningContinuity(time(2026, 3, 9, 18));
assert.strictEqual(summary.currentStreak, 0, '未学習ではstreak 0');
assert.strictEqual(summary.today.attempts, 0, '未学習では今日の回答0');
assert.strictEqual(summary.today.accuracy, null, '未学習の正答率は未定義');
assert.strictEqual(summary.lastLearningAt, 0);

model = new ProgressModel(questions, storage(), 'today');
addAttempt(model, 'Q1', true, time(2026, 3, 9, 9));
addAttempt(model, 'Q1', false, time(2026, 3, 9, 10));
addAttempt(model, 'Q2', true, time(2026, 3, 9, 11), true);
model.state.reviewSchedule.Q1 = { stage:0, dueAt:time(2026, 3, 9, 8) };
const before = JSON.stringify(model.state);
summary = model.learningContinuity(time(2026, 3, 9, 18));
assert.strictEqual(JSON.stringify(model.state), before, 'continuity集計は学習状態を変更しない');
assert.strictEqual(summary.currentStreak, 1, '同一日の複数回答はstreak 1日');
assert.strictEqual(summary.today.attempts, 3);
assert.strictEqual(summary.today.correctCount, 2);
assert.strictEqual(summary.today.incorrectCount, 1);
assert.strictEqual(summary.today.accuracy, 2 / 3);
assert.strictEqual(summary.today.questionCount, 2, 'distinct question数を数える');
assert.strictEqual(summary.today.reviewSuccessCount, 1, 'authoritative delayedSuccessを復習成功として数える');
assert.strictEqual(summary.dueReviewCount, 1, '既存dueReviewIdsを通知件数のauthorityにする');
assert.strictEqual(summary.lastLearningAt, time(2026, 3, 9, 11));

const dstBefore = time(2026, 3, 7);
const dstAfter = time(2026, 3, 8);
assert.strictEqual(dstAfter - dstBefore, 23 * 60 * 60 * 1000, 'DST境界テストが23時間差であること');
model = new ProgressModel(questions, storage(), 'dst');
addAttempt(model, 'Q1', true, dstBefore);
addAttempt(model, 'Q2', true, dstAfter);
summary = model.learningContinuity(time(2026, 3, 8, 18));
assert.strictEqual(summary.currentStreak, 2, '固定24時間差ではなくlocal calendar dayで連続判定する');

model = new ProgressModel(questions, storage(), 'three-days');
addAttempt(model, 'Q1', true, time(2026, 3, 7));
addAttempt(model, 'Q1', true, time(2026, 3, 8));
addAttempt(model, 'Q2', true, time(2026, 3, 9));
summary = model.learningContinuity(time(2026, 3, 9, 18));
assert.strictEqual(summary.currentStreak, 3, '連続3学習日をstreak 3とする');

model = new ProgressModel(questions, storage(), 'missed-day');
addAttempt(model, 'Q1', true, time(2026, 3, 7));
addAttempt(model, 'Q2', true, time(2026, 3, 9));
summary = model.learningContinuity(time(2026, 3, 9, 18));
assert.strictEqual(summary.currentStreak, 1, '前日が欠けたら今日からstreakを再開する');

model = new ProgressModel(questions, storage(), 'yesterday');
addAttempt(model, 'Q1', true, time(2026, 3, 7));
addAttempt(model, 'Q2', true, time(2026, 3, 8));
summary = model.learningContinuity(time(2026, 3, 9, 8));
assert.strictEqual(summary.currentStreak, 2, '昨日までの連続学習は今日が終わるまでは維持する');

model = new ProgressModel(questions, storage(), 'stale');
addAttempt(model, 'Q1', true, time(2026, 3, 6));
addAttempt(model, 'Q2', true, time(2026, 3, 7));
summary = model.learningContinuity(time(2026, 3, 9, 18));
assert.strictEqual(summary.currentStreak, 0, '最新学習が一昨日以前ならcurrent streakは0');

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.hidden = true;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
}
const flatten = node => [node.textContent, ...node.children.flatMap(flatten)].filter(Boolean).join(' ');
const story = new FakeNode('section');
const result = new FakeNode('section');
const documentStub = {
  createElement(tag){ return new FakeNode(tag); },
  getElementById(id){ if (id === 'story-learning-summary') return story; if (id === 'result-learning-summary') return result; return null; }
};
const fixed = {
  currentStreak:3,
  today:{ attempts:4, correctCount:3, incorrectCount:1, accuracy:.75, questionCount:3, reviewSuccessCount:1 },
  dueReviewCount:2,
  lastLearningAt:time(2026, 3, 9, 15)
};
const renderState = { marker:'immutable' };
const context = {
  document:documentStub,
  model:{
    state:renderState,
    learningContinuity(){ return fixed; }
  }
};
const renderBefore = JSON.stringify(renderState);
assert.strictEqual(Controller.prototype.renderLearningContinuity.call(context, 'story-learning-summary', time(2026, 3, 9, 18)), true);
assert.strictEqual(JSON.stringify(renderState), renderBefore, 'summary描画はmodel stateを変更しない');
let text = flatten(story);
for (const expected of ['今日の学習サマリー','連続学習','3日','今日の回答','4回','今日の正答率','75%','学習した問題','3問','復習成功 1回','復習期限 2問']) {
  assert(text.includes(expected), `Story summaryに「${expected}」を表示する`);
}
assert.strictEqual(story.hidden, false);

assert.strictEqual(Controller.prototype.renderLearningContinuity.call(context, 'result-learning-summary', time(2026, 3, 9, 18), '今回までの今日の結果'), true);
text = flatten(result);
assert(text.includes('今回までの今日の結果') && text.includes('75%'), '通常結果画面にも今日の結果を表示する');
assert.strictEqual(result.hidden, false);

assert(html.includes('id="story-learning-summary"') && html.includes('id="result-learning-summary"'), 'Story/resultにsummary surfaceを持つ');
assert(controllerSource.includes("this.renderLearningContinuity('story-learning-summary')"), 'Story再描画時にcontinuity summaryを同期する');
assert(controllerSource.includes("this.renderLearningContinuity('result-learning-summary', answeredAt, '今回までの今日の結果')"), 'authoritative回答後にresult summaryを更新する');
const retryStart = controllerSource.indexOf('    finishCoachingRetry(');
const retryEnd = controllerSource.indexOf('\n    revealAnswer(', retryStart);
const retrySegment = controllerSource.slice(retryStart, retryEnd);
assert(!retrySegment.includes('recordAttempt'), 'coaching retryはauthoritative attemptを増やさない');
assert(!retrySegment.includes('renderLearningContinuity'), 'coaching retryでsummaryを再集計して水増ししない');
assert(viewSource.includes("this.byId('result-learning-summary')"), '次の問題開始時にresult summaryを安全に隠す');
assert(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'), 'desktop summaryは4列のcompact grid');
assert(css.includes('@media (max-width: 720px)') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'), 'mobile summaryは2列化して横スクロールを避ける');

console.log('LEARNING_CONTINUITY_PHASE5_PASS');
