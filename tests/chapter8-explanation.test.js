'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ExplanationModel=require('../js/explanation-model');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});
const questions=Object.values(sandbox.window.QuestionData).filter(q=>q.chapter===8);
assert.strictEqual(questions.length,25,'Chapter 8は25問');
assert(questions.every(q=>q.type==='ledger'),'Chapter 8は全問ledger');
assert(questions.every(q=>q.explanationModel),'Chapter 8全25問にstructured explanationを持たせる');
const noArithmetic=new Set(['L034','L041','L050']);
for(const q of questions){
  const wrong={cells:Object.fromEntries((q.table?.inputCells||[]).map(id=>[id,'']))};
  const model=ExplanationModel.build(q,wrong,{correct:false});
  assert.strictEqual(ExplanationModel.validate(model).valid,true,`${q.id}: model valid`);
  assert(model.sources.length>0,`${q.id}: sources`);
  assert(model.summary.length>0,`${q.id}: summary`);
  assert(model.transfer.length>0,`${q.id}: transfer`);
  assert(model.checks.length>0,`${q.id}: checks`);
  assert(model.mistakes.length>0,`${q.id}: mistakes`);
  const meaningful=model.calculation.some(item=>/[×÷＋+−\-＝=]/u.test(String(item.expression||'')));
  assert.strictEqual(meaningful,!noArithmetic.has(q.id),`${q.id}: arithmetic visibility`);
}
const formulas={
  L028:'440,000 + 134,000 = 574,000',
  L029:'(69 − 25) × 1,200 + 20 × 1,500 = 82,800',
  L030:'72,000 × 4 ÷ 12 = 24,000',
  L035:'70,000 + 85,000 + 45,000 = 200,000',
  L037:'40,000 + 120,000 − 90,000 = 70,000',
  L039:'600,000 × 3% = 18,000',
  L040:'540,000 − 420,000 = 120,000',
  L042:'180,000 + 120,000 = 300,000',
  L044:'50,000 − 18,000 = 32,000',
  L046:'4,800 + 7,200 = 12,000',
  L047:'120,000 − 20,000 = 100,000',
  L049:'12 × 1,100 = 13,200'
};
for(const [id,formula] of Object.entries(formulas)){
  const model=ExplanationModel.build(sandbox.window.QuestionData[id],{cells:{}},{correct:false});
  assert(model.calculation.some(item=>item.expression===formula),`${id}: expected formula ${formula}`);
}
console.log('Chapter 8 structured explanation tests: PASS');
