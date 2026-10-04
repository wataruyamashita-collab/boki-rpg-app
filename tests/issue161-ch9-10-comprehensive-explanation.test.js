'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/explanation-formulas.js','js/feedback.js','js/explanation-model.js','js/explanation-design-system.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const root=sandbox.window;
const target=Object.values(root.QuestionData).filter(q=>/^T\d{3}$/u.test(q.id)||(/^E\d{3}$/u.test(q.id)&&Number(q.id.slice(1))<=10)||/^C\d{3}$/u.test(q.id));
assert.strictEqual(target.length,60,'formal Batch D contains 60 questions');
assert.strictEqual(target.filter(q=>q.type==='trial_balance').length,40,'Batch D trial-balance count');
assert.strictEqual(target.filter(q=>q.type==='correction').length,10,'Batch D correction count');
assert.strictEqual(target.filter(q=>q.type==='comprehensive').length,10,'Batch D comprehensive count');
assert(target.every(q=>q.teachingPresentation==='structured-always'),'all Batch D questions opt into structured teaching flow');
assert(target.every(q=>q.explanationModel),'all Batch D questions expose explanationModel');
const profiles={};
for(const q of target){
  const wrong={cells:Object.fromEntries((q.table?.inputCells||[]).map(id=>[id,'']))};
  const model=root.ExplanationModel.build(q,wrong,{correct:false});
  const plan=root.ExplanationDesignSystem.planFor(q,{model,correct:false});
  profiles[plan.profileId]=(profiles[plan.profileId]||0)+1;
  assert(model.sources?.length,q.id+': source evidence');
  assert(model.summary?.length>=2,q.id+': learner strategy');
  if(q.type!=='comprehensive')assert(model.transfer?.length,q.id+': destination/transfer guidance');
  if(q.type!=='comprehensive')assert(model.checks?.length,q.id+': independent check');
  assert(model.mistakes?.length,q.id+': wrong-answer diagnostic');
  for(const id of q.table?.inputCells||[])assert(!model.transfer.some(item=>String(item.to||'')===id),q.id+': no raw transfer key');
  assert(plan.components.some(item=>item.id==='goal'),q.id+': goal component');
  assert(plan.components.some(item=>item.id==='source'),q.id+': source component');
  assert(plan.components.some(item=>item.id==='decision'),q.id+': decision component');
  if(q.type!=='comprehensive')assert(plan.components.some(item=>item.id==='transfer'),q.id+': transfer component');
  if(model.checks?.length)assert(plan.components.some(item=>item.id==='check'),q.id+': check component');
}
assert.deepStrictEqual(JSON.parse(JSON.stringify(profiles)),{trialBalance:40,correction:10,comprehensiveClosing:3,comprehensive:7},'Batch D teaching-profile distribution');
for(const q of target.filter(q=>q.type==='trial_balance')){
  const model=root.ExplanationModel.build(q,{cells:{}},{correct:false});
  assert.strictEqual(model.transfer.length,2,q.id+': debit/credit total destinations');
  assert(model.transfer.every(item=>item.value==='上で求めた合計'),q.id+': no duplicate numeric total cards');
}
for(const q of target.filter(q=>q.type==='comprehensive')){
  const model=root.ExplanationModel.build(q,{cells:{}},{correct:false});
  assert.strictEqual(model.transfer.length,0,q.id+': comprehensive does not repeat final answers as transfer cards');
}
assert.strictEqual(root.ExplanationModel.build(root.QuestionData.C002,{cells:{}},{correct:false}).checks.length,0,'C002 omits answer-echo pseudo check');
assert(root.ExplanationModel.build(root.QuestionData.C003,{cells:{}},{correct:false}).checks.some(item=>item.checkKind==='accrual-reconciliation'),'C003 accrual reconciliation');
const audit=JSON.parse(fs.readFileSync('reports/issue-161/tac-curriculum-audit.json','utf8'));
assert.strictEqual(audit.reviewedQuestions,300);
assert.strictEqual(audit.unreviewedQuestions,0);
assert.deepStrictEqual(audit.chapter9to10,{count:50,proseWallRisk:50});
assert.deepStrictEqual(audit.comprehensive,{count:10,proseWallRisk:10});
assert.deepStrictEqual(audit.batchD,{count:60,proseWallRisk:60});
console.log('ISSUE161_CH9_10_COMPREHENSIVE_EXPLANATION_PASS');