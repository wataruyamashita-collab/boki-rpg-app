'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const RPGModel = require('../js/rpg');

const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
const sandbox = { window:{ RPGModel }, Event:class Event {}, queueMicrotask(fn){ fn(); } };
vm.runInNewContext(controllerSource, sandbox);
const Controller = sandbox.window.AppController;

const values = {};
const storage = {
  getItem(key){ return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
  setItem(key, value){ values[key] = value; return true; }
};
const questions = {
  normal:{ id:'normal', type:'journal', category:'通常', difficulty:2, learningRole:'core', answer:{debit:[],credit:[]} },
  weak:{ id:'weak', type:'journal', category:'弱点', difficulty:2, learningRole:'core', answer:{debit:[],credit:[]} },
  reviewSource:{ id:'reviewSource', type:'ledger', category:'復習元', difficulty:3, learningRole:'core', answer:{cells:{}} },
  reviewVariant:{ id:'reviewVariant', type:'ledger', category:'復習元', difficulty:2, learningRole:'review', answer:{cells:{}} },
  wrong:{ id:'wrong', type:'journal', category:'誤答', difficulty:1, learningRole:'core', answer:{debit:[],credit:[]} }
};
const correctScore = { correct:true, ratio:1, earned:1, possible:1 };
const wrongScore = { correct:false, ratio:0, earned:0, possible:1 };
const rpg = new RPGModel(storage, 'phase4c-rpg');
const context = { rpg, questions };
const apply = args => Controller.prototype.rewardLearningOutcome.call(context, args);

let outcome = apply({
  question:questions.normal,
  score:correctScore,
  beforePriority:{tier:4},
  afterPriority:{tier:5}
});
assert.strictEqual(outcome.baseRewarded, true, '通常正解は既存base XPを一度だけ受ける');
assert.strictEqual(outcome.bonusXp, 0, '通常正解だけではPhase 4C bonusを付けない');
assert.strictEqual(rpg.state.xp, 40, 'base XP式 20×difficulty×ratio は変更しない');
assert(rpg.state.rewardedIds.includes('normal'), 'base rewardは既存question IDを保持する');

outcome = apply({
  question:questions.weak,
  score:correctScore,
  beforePriority:{tier:1},
  afterPriority:{tier:5}
});
assert.strictEqual(outcome.baseRewarded, true);
assert.strictEqual(outcome.bonusXp, 8, 'P1/P2から脱した正解は4×difficultyの苦手克服bonus');
assert.strictEqual(outcome.bonusLabel, '苦手克服 +8 XP');
assert(rpg.state.rewardedIds.includes('@event:weak-recovery:weak'));

const weakXp = rpg.state.xp;
outcome = apply({
  question:questions.weak,
  score:correctScore,
  beforePriority:{tier:2},
  afterPriority:{tier:5}
});
assert.strictEqual(outcome.baseRewarded, false, '同じ問題のbase XPは再取得できない');
assert.strictEqual(outcome.bonusXp, 0, '苦手克服bonusは問題ごとに一度だけ');
assert.strictEqual(rpg.state.xp, weakXp, '弱点化→再正解の反復でXP farmingできない');

outcome = apply({
  question:questions.reviewVariant,
  score:correctScore,
  reviewSourceId:'reviewSource',
  reviewStage:1,
  reviewCompleted:true
});
assert.strictEqual(outcome.baseRewarded, true, 'review variantの初回正解base rewardは従来どおり');
assert.strictEqual(outcome.bonusXp, 6, 'authoritative review成功は2×source difficultyのbonus');
assert.strictEqual(outcome.bonusLabel, '復習成功 +6 XP');
assert(rpg.state.rewardedIds.includes('@event:review-success:reviewSource:stage:1'));

const stageOneXp = rpg.state.xp;
outcome = apply({
  question:questions.reviewVariant,
  score:correctScore,
  reviewSourceId:'reviewSource',
  reviewStage:1,
  reviewCompleted:true
});
assert.strictEqual(outcome.baseRewarded, false);
assert.strictEqual(outcome.bonusXp, 0, '同じsource/stageのreview bonusは再取得できない');
assert.strictEqual(rpg.state.xp, stageOneXp);

outcome = apply({
  question:questions.reviewVariant,
  score:correctScore,
  reviewSourceId:'reviewSource',
  reviewStage:2,
  reviewCompleted:true
});
assert.strictEqual(outcome.bonusXp, 6, '次の正規spaced-review stageは別の有限bonus対象');
assert(rpg.state.rewardedIds.includes('@event:review-success:reviewSource:stage:2'));

const beforeInvalidReview = rpg.state.xp;
outcome = apply({
  question:questions.reviewVariant,
  score:correctScore,
  reviewSourceId:'reviewSource',
  reviewStage:3,
  reviewCompleted:false
});
assert.strictEqual(outcome.bonusXp, 0, 'completeReviewが成立しない回答はreview bonus対象外');
assert.strictEqual(rpg.state.xp, beforeInvalidReview);

const beforeWrong = rpg.state.xp;
outcome = apply({
  question:questions.wrong,
  score:wrongScore,
  beforePriority:{tier:1},
  afterPriority:{tier:1}
});
assert.strictEqual(outcome.baseRewarded, false);
assert.strictEqual(outcome.bonusXp, 0, '誤答はbase/bonusとも付与しない');
assert.strictEqual(rpg.state.xp, beforeWrong);

const weakStillWeak = new RPGModel({ getItem(){ return null; }, setItem(){ return true; } }, 'still-weak');
const stillContext = { rpg:weakStillWeak, questions };
outcome = Controller.prototype.rewardLearningOutcome.call(stillContext, {
  question:questions.weak,
  score:correctScore,
  beforePriority:{tier:2},
  afterPriority:{tier:2}
});
assert.strictEqual(outcome.bonusXp, 0, '正解してもP2のままなら苦手克服bonusはまだ付けない');

assert.strictEqual(RPGModel.validateBackupState(JSON.parse(JSON.stringify(rpg.state))), true, 'namespaced event rewardを含む既存backup schemaは有効');
assert(rpg.state.rewardedIds.some(id => id === 'normal'), 'ordinary question IDを維持');
assert(rpg.state.rewardedIds.some(id => id.startsWith('@event:')), 'event rewardは予約namespaceで共存する');

assert.strictEqual(rpg.reviewSuccessBonus(questions.reviewSource, -1), 0, '不正review stageはfail-closed');
assert.strictEqual(rpg.rewardEvent('not-reserved', 5), 0, '予約namespace外のevent keyは拒否する');
assert.strictEqual(rpg.rewardEvent('@event:manual', 0), 0, '非正XP eventは拒否する');

const retryStart = controllerSource.indexOf('    finishCoachingRetry(');
const retryEnd = controllerSource.indexOf('\n    revealAnswer(', retryStart);
const retrySegment = retryEnd > retryStart ? controllerSource.slice(retryStart, retryEnd) : controllerSource.slice(retryStart);
assert(!retrySegment.includes('rewardLearningOutcome'), 'coaching retryはauthoritative reward policyを呼ばない');

console.log('RPG_REWARD_PHASE4C_PASS');
