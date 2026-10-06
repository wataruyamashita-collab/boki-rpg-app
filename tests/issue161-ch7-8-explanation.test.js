'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/explanation-formulas.js','js/feedback.js','js/explanation-model.js','js/explanation-design-system.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const root=sandbox.window;
const target=Object.values(root.QuestionData).filter(q=>/^L\d{3}$/u.test(q.id));
assert.strictEqual(target.length,50,'Issue 161 PR-E retains all 50 ledger questions');
assert(target.every(q=>q.type==='ledger'),'Issue 161 PR-E stays ledger-only');
assert(target.every(q=>q.teachingPresentation==='structured-always'),'all Issue 161 PR-E questions opt into structured teaching flow');
assert(target.every(q=>q.explanationModel),'all Issue 161 PR-E questions expose explanationModel');

const profiles={};
for(const q of target){
  const wrong={cells:Object.fromEntries((q.table?.inputCells||[]).map(id=>[id,'']))};
  const model=root.ExplanationModel.build(q,wrong,{correct:false});
  const plan=root.ExplanationDesignSystem.planFor(q,{model,correct:false});
  profiles[plan.profileId]=(profiles[plan.profileId]||0)+1;
  assert(model.sources?.length,q.id+': source evidence');
  assert(model.summary?.length>=2,q.id+': learner strategy');
  assert(model.transfer?.length,q.id+': destination/transfer guidance');
  assert(model.checks?.length,q.id+': independent check');
  assert(model.mistakes?.length,q.id+': wrong-answer diagnostic');
  assert(plan.components.some(item=>item.id==='goal'),q.id+': goal component');
  assert(plan.components.some(item=>item.id==='source'),q.id+': source component');
  assert(plan.components.some(item=>item.id==='decision'),q.id+': decision component');
  assert(plan.components.some(item=>item.id==='transfer'),q.id+': transfer component');
  assert(plan.components.some(item=>item.id==='check'),q.id+': check component');
  assert(!model.transfer.some(item=>/^(?:value\d+|annualA|monthsA|depreciationA|bookA|lossA|annualB|monthsB|depreciationB|bookB)$/u.test(String(item.to||''))),q.id+': no raw input key as transfer destination');
}
assert.deepStrictEqual(JSON.parse(JSON.stringify(profiles)),{
  ledger:22,
  inventory:7,
  fixedAsset:8,
  journalBook:2,
  notes:4,
  cashBook:2,
  pettyCash:1,
  purchaseSales:2,
  voucher:1,
  accountRule:1
},'format-specific teaching profile distribution');

for(const id of ['L005','L010','L015','L020','L025','L030','L033','L040']){
  const q=root.QuestionData[id],model=root.ExplanationModel.build(q,{cells:{}},{correct:false});
  assert(model.checks.some(item=>/^fixed-asset-/u.test(String(item.checkKind))),id+': fixed-asset independent reconciliation');
}
const l46=root.ExplanationModel.build(root.QuestionData.L046,{cells:{}},{correct:false});
assert(l46.checks.some(item=>item.expected==='4,800 + 7,200 = 12,000'),'L046 petty-cash replenishment reconciliation');
const l47=root.ExplanationModel.build(root.QuestionData.L047,{cells:{}},{correct:false});
assert(l47.checks.some(item=>item.expected==='120,000 − 20,000 = 100,000'),'L047 net purchases reconciliation');
const l48=root.ExplanationModel.build(root.QuestionData.L048,{cells:{}},{correct:false});
assert(l48.checks.some(item=>item.expected==='180,000 − 30,000 = 150,000'),'L048 net sales reconciliation');

for(const id of ['L004','L009','L014','L019','L024','L029','L049']){
  const q=root.QuestionData[id],model=root.ExplanationModel.build(q,{cells:{}},{correct:false});
  assert.strictEqual(root.ExplanationDesignSystem.planFor(q,{model,correct:false}).profileId,'inventory',id+': inventory teaching profile');
}
const audit=JSON.parse(fs.readFileSync('reports/issue-161/tac-curriculum-audit.json','utf8'));
assert.strictEqual(audit.reviewedQuestions,300,'TAC first-pass covers all 300');
assert.strictEqual(audit.unreviewedQuestions,0,'no unreviewed questions');
assert.strictEqual(audit.chapter7to8.count,50,'audit tracks Chapter 7-8 batch');
assert.strictEqual(audit.chapter7to8.proseWallRisk,50,'all Chapter 7-8 questions were flagged for prose-wall presentation risk');
console.log('ISSUE161_CH7_8_EXPLANATION_PASS');