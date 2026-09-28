'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ExplanationModel=require('../js/explanation-model');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});
const data=sandbox.window.QuestionData,questions=Object.values(data);
assert.strictEqual(questions.length,300,'question count');

const normalizeNumber=value=>String(value??'').replace(/[,\s円]/g,'');
for(const q of questions){
  const answer=q.type==='journal'?{}:{cells:{}};
  const model=ExplanationModel.build(q,answer,{correct:false},{diagnostics:[]});
  assert(model.sources.length>0,q.id+': sources must exist');
  assert(model.summary.length>=2,q.id+': learner strategy must state goal and decision rule');
  assert(String(model.summary[0]?.text||'').startsWith('この問題で求めるのは'),q.id+': strategy starts from the requested output');

  if(q.type==='comprehensive')assert.strictEqual(model.transfer.length,0,q.id+': comprehensive transfer cards must not repeat final answers');

  const meaningfulResults=new Set((model.calculation||[])
    .filter(item=>/[×÷＋+−\-＝=]/u.test(String(item?.expression||'')))
    .map(item=>normalizeNumber(item?.result))
    .filter(Boolean));
  if(!['journal','correction','worksheet'].includes(q.type)){
    for(const transfer of model.transfer){
      const value=normalizeNumber(transfer?.value);
      assert(!meaningfulResults.has(value),q.id+': transfer must not repeat a value already explained by calculation');
    }
  }

  const answerValues=new Set(Object.values(q.answer?.cells||{}).filter(Number.isFinite).map(value=>String(value)));
  for(const check of model.checks){
    const expected=String(check.expected??'');
    const bare=normalizeNumber(expected);
    assert(!(answerValues.has(bare)&&!/[=＝→／/]/u.test(expected)),q.id+': check must be independent, not a bare answer echo');
  }
}

const c1=ExplanationModel.build(data.C001,{cells:{}},{correct:false},{diagnostics:[]});
assert(c1.summary.some(item=>item.text.includes('整理前残高→未処理取引→決算整理')),'C001 strategy explains the solving order');
assert.strictEqual(c1.transfer.length,0,'C001 transfer deduplication');
assert.deepStrictEqual(c1.checks.map(item=>item.checkKind),['independent-balance'],'C001 keeps only independent balance check');

const c2=ExplanationModel.build(data.C002,{cells:{}},{correct:false},{diagnostics:[]});
assert.strictEqual(c2.transfer.length,0,'C002 transfer deduplication');
assert.strictEqual(c2.checks.length,0,'C002 omits fake final check');

const c4=ExplanationModel.build(data.C004,{cells:{}},{correct:false},{diagnostics:[]});
assert(c4.summary.some(item=>item.text.includes('現金は入出金、利益は収益・費用')),'C004 cash/profit decision rule');
assert.strictEqual(c4.transfer.length,0,'C004 transfer deduplication');
assert(c4.checks.some(item=>item.checkKind==='concept-separation'),'C004 conceptual check');

const view=fs.readFileSync('js/view.js','utf8');
assert(view.includes("].filter(([,key]) => (model[key] || []).length > 0)"),'empty sections are omitted');
assert(view.indexOf("[teachingProfile.summary,'summary']")<view.indexOf("['使う資料を整理する','sources']"),'learner strategy is shown before source review');
assert(!view.includes('explanation-flow-empty'),'no filler text for empty sections');
console.log('explanation redundancy tests: PASS');
