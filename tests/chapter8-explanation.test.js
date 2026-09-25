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
const voucherModel=ExplanationModel.build(sandbox.window.QuestionData.L050,{cells:{}},{correct:false});
assert.strictEqual(voucherModel.sources.length,3,'L050は3取引を資料として表示する');
assert.deepStrictEqual(JSON.parse(JSON.stringify(voucherModel.sources.map(source=>source.title))),['取引1','取引2','取引3'],'L050の資料見出しは取引1〜3');
assert(voucherModel.sources.some(source=>source.values.some(value=>value.value==='商品を現金で販売')),'L050は現金売上取引を資料に含む');
assert(voucherModel.sources.some(source=>source.values.some(value=>value.value==='備品を現金で購入')),'L050は備品現金購入を資料に含む');
assert(voucherModel.sources.some(source=>source.values.some(value=>value.value==='商品を掛けで仕入')),'L050は掛仕入取引を資料に含む');
assert(!/\b(?:item|account):/u.test(JSON.stringify(voucherModel.sources)),'L050の資料表示へ内部英語キーを漏らさない');
assert(voucherModel.checks.some(item=>item.label==='取引ごとに現金の動きと伝票の種類を対応づける'),'L050は伝票専用の最終確認を表示する');
assert(voucherModel.checks.some(item=>item.expected==='現金の受取＝入金伝票 / 現金の支払＝出金伝票 / 現金を伴わない取引＝振替伝票'),'L050は現金の動きと伝票の対応関係を確認する');
assert(!voucherModel.checks.some(item=>/残高または帳簿値|次の行の計算/u.test(`${item.label} ${item.expected}`)),'L050へ元帳用の残高更新チェックを表示しない');
assert.deepStrictEqual(JSON.parse(JSON.stringify(sandbox.window.QuestionData.L050.answer.cells)),{value1:50000,value2:20000,value3:30000},'L050の正答金額は変更しない');
console.log('Chapter 8 structured explanation tests: PASS');
