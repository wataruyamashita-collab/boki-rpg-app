'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/explanation-formulas.js','js/feedback.js','js/explanation-model.js','js/explanation-design-system.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const root=sandbox.window;
const target=Object.values(root.QuestionData).filter(q=>q.chapter>=1&&q.chapter<=3);
assert.strictEqual(target.length,75,'Chapter 1-3 contains 75 questions');
assert(target.every(q=>q.type==='journal'),'Chapter 1-3 PR-C scope stays journal-only');
assert(target.every(q=>q.teachingPresentation==='structured-always'),'all Chapter 1-3 questions opt into structured teaching flow');
assert(target.every(q=>q.explanationModel),'all Chapter 1-3 questions expose explanationModel');

for(const q of target){
  const correctModel=root.ExplanationModel.build(q,q.answer,{correct:true});
  assert(correctModel.sources?.length, q.id+': source evidence');
  assert(correctModel.summary?.length, q.id+': decision summary');
  assert(correctModel.transfer?.length, q.id+': transfer evidence');
  assert(correctModel.checks?.length, q.id+': independent check');
  const plan=root.ExplanationDesignSystem.planFor(q,{model:correctModel,correct:true});
  assert.strictEqual(plan.profileId,'journal',q.id+': journal profile');
  for(const component of ['goal','source','decision','transfer','check','takeaway']){
    assert(plan.components.some(item=>item.id===component),q.id+': component '+component);
  }
}
const view=fs.readFileSync('js/view.js','utf8');
assert(view.includes("question.teachingPresentation === 'structured-always'"),'correct-path structured contract is wired');
assert(view.includes("score.correct ? 'この問題の解き方を確認' : 'この問題をもう一度解く手順'"),'correct/wrong headings differ naturally');
const audit=JSON.parse(fs.readFileSync('reports/issue-161/tac-curriculum-audit.json','utf8'));
assert.strictEqual(audit.reviewedQuestions,300,'TAC first-pass covers all 300');
assert.strictEqual(audit.unreviewedQuestions,0,'no unreviewed questions');
assert.strictEqual(audit.chapter1to3.count,75,'audit tracks Chapter 1-3 batch');
console.log('ISSUE161_CH1_3_EXPLANATION_PASS');
