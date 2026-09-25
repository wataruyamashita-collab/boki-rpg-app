'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ExplanationModel=require('../js/explanation-model');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});
const data=sandbox.window.QuestionData,values=Object.values(data);
const expected={journal:150,ledger:50,trial_balance:40,correction:20};
for(const pair of Object.entries(expected)){
  const type=pair[0],count=pair[1],qs=values.filter(q=>q.type===type);
  assert.strictEqual(qs.length,count,type+': question count');
  assert.strictEqual(qs.filter(q=>q.explanationModel).length,count,type+': all questions use structured explanation');
  for(const q of qs){
    const model=ExplanationModel.build(q,q.type==='journal'?{}:{cells:{}},{correct:false});
    assert.strictEqual(ExplanationModel.validate(model).valid,true,q.id+': valid model');
    assert(model.sources.length>0,q.id+': sources');
    assert(model.summary.length>0,q.id+': summary');
    assert(model.transfer.length>0,q.id+': transfer');
    assert(model.checks.length>0,q.id+': checks');
    const raw=model.sources.flatMap(source=>(source.values||[]).map(value=>String(value.label||'')));
    assert(!raw.some(label=>/^(?:date|description|transaction|account|item|value|answer|recorded|evidence|quantity|unitPrice|amount)$/u.test(label)),q.id+': no raw internal source labels');
    assert(!/正答値|資料の項目と数値|帳簿値|対応づける/u.test(JSON.stringify({sources:model.sources,summary:model.summary,checks:model.checks})),q.id+': no system-facing learner wording');
  }
}
const j=ExplanationModel.build(data.J001,{}, {correct:false});
assert(j.summary.some(x=>x.text==='取引で何が増え、何が減ったかを確認し、勘定科目を決めて借方・貸方に分けます。'),'J001 summary');
assert(j.checks.some(x=>x.label==='借方合計と貸方合計が合っているか確認する'),'J001 check');
const t=ExplanationModel.build(data.T001,{cells:{}},{correct:false});
assert(t.calculation.some(x=>x.expression==='410,000 + 175,000 + 60,000 + 289,000 + 90,000 = 1,024,000'),'T001 debit total');
assert(t.calculation.some(x=>x.expression==='134,000 + 400,000 + 490,000 = 1,024,000'),'T001 credit total');
assert.strictEqual(t.checks[0].label,'借方合計と貸方合計が一致しているか確認する','T001 final check');
assert.strictEqual(t.checks[0].expected,'1,024,000 = 1,024,000','T001 equality');
const e=ExplanationModel.build(data.E001,{cells:{}},{correct:false});
assert.deepStrictEqual(JSON.parse(JSON.stringify(e.sources[0].values.map(x=>x.label))),['帳簿の記録','証ひょう'],'E001 labels');
assert.strictEqual(e.sources[0].focus,'帳簿の記録と証ひょうを比べる','E001 focus');
assert.strictEqual(e.transfer.length,2,'E001 transfer pair');
assert.deepStrictEqual(JSON.parse(JSON.stringify(e.transfer.map(x=>[x.to,x.value]))),[['借方','広告宣伝費 22,500円'],['貸方','備品 22,500円']],'E001 entry');
assert(e.checks.some(x=>x.label==='訂正する部分だけを直せているか確認する'),'E001 keep correct portion');
assert(e.checks.some(x=>x.expected==='22,500 = 22,500'),'E001 debit credit check');
assert(data.L001.explanationModel,'L001 structured explanation');
console.log('Gate 5-A structured explanation tests: PASS');
