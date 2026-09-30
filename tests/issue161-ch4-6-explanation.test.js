'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/explanation-formulas.js','js/feedback.js','js/explanation-model.js','js/explanation-design-system.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const root=sandbox.window;
const target=Object.values(root.QuestionData).filter(q=>q.chapter>=4&&q.chapter<=6);
assert.strictEqual(target.length,75,'Chapter 4-6 contains 75 questions');
assert(target.every(q=>q.type==='journal'),'Chapter 4-6 PR-D scope stays journal-only');
assert(target.every(q=>q.teachingPresentation==='structured-always'),'all Chapter 4-6 questions opt into structured teaching flow');
assert(target.every(q=>q.explanationModel),'all Chapter 4-6 questions expose explanationModel');

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
assert.strictEqual(audit.chapter4to6.count,75,'audit tracks Chapter 4-6 batch');
assert.strictEqual(audit.chapter4to6.proseWallRisk,75,'all Chapter 4-6 questions were flagged for prose-wall presentation risk');
console.log('ISSUE161_CH4_6_EXPLANATION_PASS');
