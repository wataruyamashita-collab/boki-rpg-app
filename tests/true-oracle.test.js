'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{}};vm.createContext(sandbox);for(const file of ['data/questions.js','data/accounting-oracle.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const root=sandbox.window,baseline=root.auditAccountingOracle();
assert.strictEqual(baseline.independent,300,'all questions are source-derived');
assert.deepStrictEqual(JSON.parse(JSON.stringify(baseline.dependency)),{RULE_DERIVED:170,CALCULATION_DERIVED:130,SEMANTIC_TRANSFER:0,MIRROR_FALLBACK:0,UNKNOWN:0});
assert.deepStrictEqual(JSON.parse(JSON.stringify(baseline.identity)),{total:0,justified:0,unjustified:0});
for(const id of ['C001','C002','C003']){
  const question=structuredClone(root.QuestionData[id]);
  question.answer.cells[Object.keys(question.answer.cells)[0]]+=1;
  const derived=root.deriveAccountingExpected(id,null,question);
  assert.strictEqual(derived.derivable,true,`${id}: authored-answer mutation must not control derivation`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(derived.expected)),JSON.parse(JSON.stringify(root.deriveAccountingExpected(id).expected)),`${id}: expected value remains source-derived`);
  assert.strictEqual(root.validateExamQuestion3(question).valid,false,`${id}: separate authored-answer validation detects the mutation`);
}
for(const id of ['J001','J101','L001','D001','C004']){
  const question=structuredClone(root.QuestionData[id]);
  if(question.type==='journal')question.answer.debit[0].amount+=123;else question.answer.cells[Object.keys(question.answer.cells)[0]]+=123;
  question.reviewedAnswerFingerprint='attacker-recomputed';question.semantic={questionId:id,visibleInputs:['attacker'],dependencies:[]};question.oracleMirror=structuredClone(question.answer);
  const finding=root.auditAccountingOracle({...root.QuestionData,[id]:question}).findings[id];
  assert.strictEqual(finding.match,false,`${id}: coordinated answer/mirror/fingerprint/semantic mutation must be detected`);
  assert.strictEqual(finding.fallbackUsed,false,`${id}: mutation detection must not use fallback`);
}
for(const phrase of ['株主から現金3,020,000円の追加払込みを受けた。','株主からの払込みとして現金3,020,000円を受けた。','増資として現金3,020,000円が払い込まれた。']){
  const q=structuredClone(root.QuestionData.J101);q.question=phrase;assert.strictEqual(root.deriveAccountingExpected('J101',null,q).expected.debit[0].account,'現金');
}
{
  const folio=structuredClone(root.QuestionData.L034);folio.question=folio.question.replace('売掛金113','売掛金999');
  assert.strictEqual(root.deriveAccountingExpected('L034',null,folio).expected.cells.folio1,'999・401','L034 folio follows the source account code');
  const cash=structuredClone(root.QuestionData.L034);cash.materials[0].内容=cash.materials[0].内容.replace('掛販売','現金販売');
  const expected=root.deriveAccountingExpected('L034',null,cash).expected.cells;
  assert.strictEqual(expected.summary1,'現金売上','L034 summary follows transaction semantics');
  assert.strictEqual(expected.folio1,'101・401','L034 accounts and folios follow transaction semantics');
}
{
  const question=structuredClone(root.QuestionData.L037),last=question.materials.at(-1);
  last.借方=last.貸方;last.貸方='—';
  assert.strictEqual(root.deriveAccountingExpected('L037',null,question).expected.cells.side,'借方','L037 side follows the final posting direction');
}
console.log('true oracle tests: ok');
