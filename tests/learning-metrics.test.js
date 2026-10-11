const assert = require('assert');
const ProgressModel = require('../js/model');

const questions = {
  J1:{ id:'J1', category:'仕訳', difficulty:1, type:'journal' },
  J2:{ id:'J2', category:'仕訳', difficulty:2, type:'journal' },
  L1:{ id:'L1', category:'帳簿', difficulty:2, type:'ledger' }
};
const values = {};
const storage = {
  getItem(key){ return Object.prototype.hasOwnProperty.call(values,key) ? values[key] : null; },
  setItem(key,value){ values[key]=value; return true; }
};

const progress = new ProgressModel(questions, storage, 'metrics');
assert.strictEqual(progress.state.learningSchemaVersion, 3, '学習指標スキーマversionを明示する');
assert.deepStrictEqual(progress.state.questionStats, {}, '新規状態では問題統計を空で開始する');
assert.strictEqual(progress.state.lastLearningAt, 0, '新規状態では最終学習日時を未設定で開始する');

progress.recordAttempt('J1', true, 1000, '', false, 10000);
assert.deepStrictEqual(progress.statsForQuestion('J1'), {
  correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, lastResult:true, lastAnsweredAt:10000
});
assert.strictEqual(progress.state.lastLearningAt, 10000, '回答時刻を最終学習日時として保持する');

progress.recordAttempt('J1', true, 1200, '', false, 11000);
assert.deepStrictEqual(progress.statsForQuestion('J1'), {
  correctCount:2, incorrectCount:0, correctStreak:2, incorrectStreak:0, lastResult:true, lastAnsweredAt:11000
}, '連続正解を累積する');

progress.recordAttempt('J1', false, 1400, 'journal-entry', false, 12000);
assert.deepStrictEqual(progress.statsForQuestion('J1'), {
  correctCount:2, incorrectCount:1, correctStreak:0, incorrectStreak:1, lastResult:false, lastAnsweredAt:12000
}, '誤答で正解連続数をリセットし誤答連続数を開始する');

progress.recordAttempt('J1', false, 1500, 'journal-entry', false, 13000);
progress.recordAttempt('J2', true, 900, '', false, 14000);
progress.recordAttempt('L1', false, 1800, 'table-cell', false, 15000);

assert.deepStrictEqual(progress.overallAccuracy(), {
  correctCount:3, incorrectCount:3, attempts:6, accuracy:0.5
}, '全体正答率を問題別累積統計から導出する');
assert.deepStrictEqual(progress.categoryAccuracy('仕訳'), {
  correctCount:3, incorrectCount:2, attempts:5, accuracy:0.6
}, 'カテゴリ正答率を問題別累積統計から導出する');
assert.deepStrictEqual(progress.categoryAccuracy('未回答'), {
  correctCount:0, incorrectCount:0, attempts:0, accuracy:0
}, '未回答カテゴリは0件として安全に扱う');

const reloaded = new ProgressModel(questions, storage, 'metrics');
assert.deepStrictEqual(reloaded.state.questionStats, progress.state.questionStats, '問題別累積統計を再読込後も保持する');
assert.strictEqual(reloaded.state.lastLearningAt, 15000, '最終学習日時を再読込後も保持する');

const legacyAttempts = [
  { questionId:'J1', correct:false, responseMs:1000, timestamp:100 },
  { questionId:'J1', correct:true, responseMs:900, timestamp:200 },
  { questionId:'J2', correct:true, responseMs:800, timestamp:300 }
];
const legacyValues = {
  legacy: JSON.stringify({
    contentRevision:3,
    mode:'story',
    currentQuestionId:'J1',
    answeredIds:['J1','J2'],
    correctIds:['J1','J2'],
    incorrectIds:['J1'],
    mistakeCounts:{J1:9},
    reviewSchedule:{},
    reviewAssignments:{},
    attempts:legacyAttempts,
    drafts:{},
    completed:false,
    placement:null,
    examAttempt:0,
    examSession:null,
    examHistory:[],
    lastExamReview:null
  })
};
const legacyStorage = {
  getItem(key){ return legacyValues[key] || null; },
  setItem(key,value){ legacyValues[key]=value; return true; }
};
const migrated = new ProgressModel(questions, legacyStorage, 'legacy');
assert.strictEqual(migrated.state.learningSchemaVersion, 3, '旧保存データを最新の学習指標schema v3へ移行する');
assert.deepStrictEqual(migrated.statsForQuestion('J1'), {
  correctCount:1, incorrectCount:1, correctStreak:1, incorrectStreak:0, lastResult:true, lastAnsweredAt:200
}, '旧attemptsの実証済み履歴だけから問題統計を移行する');
assert.strictEqual(migrated.statsForQuestion('J1').incorrectCount, 1, 'mistakeCounts=9を過去回答回数として水増ししない');
assert.strictEqual(migrated.state.lastLearningAt, 300, '旧attempt timestampから最終学習日時を移行する');

const backup = JSON.parse(JSON.stringify(migrated.state));
assert.strictEqual(ProgressModel.validateBackupState(backup, questions), true, '新学習指標を含むバックアップを検証できる');
backup.questionStats.J1.correctCount = -1;
assert.strictEqual(ProgressModel.validateBackupState(backup, questions), false, '負の問題別回数をバックアップとして受理しない');

assert.strictEqual(progress.recordAttempt('unknown', true, 100, '', false, 16000), false, '未知Question IDを統計へ混入させない');
assert.strictEqual(progress.recordAttempt('J1', true, 100, '', false, -1), false, '不正な回答日時を統計へ混入させない');

console.log('LEARNING_METRICS_PHASE1A_PASS');