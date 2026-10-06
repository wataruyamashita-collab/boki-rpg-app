'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const sandbox={window:{},console:{log(){},warn(){},error(){}}};
vm.runInNewContext(fs.readFileSync('data/accounting-domain.js','utf8'),sandbox,{filename:'data/accounting-domain.js'});
const domain=sandbox.window.AccountingDomain;
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});

const questions=sandbox.window.QuestionData;
const examPool=sandbox.window.ExamPoolDefinition;

assert(questions,'QuestionData must load');
assert.strictEqual(Object.keys(questions).length,300,'canonical question count remains 300');
assert.strictEqual(new Set(Object.keys(questions)).size,300,'canonical IDs remain unique');

const typeCounts=Object.values(questions).reduce((out,item)=>{
  out[item.type]=(out[item.type]||0)+1;
  return out;
},{});
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(typeCounts)),
  {journal:150,ledger:50,trial_balance:40,correction:20,worksheet:20,financial_statement:10,comprehensive:10},
  'question type counts remain unchanged'
);

assert.strictEqual(examPool.length,74,'ExamPool membership count remains unchanged');
assert(!examPool.includes('J101'),'J101 remains outside ExamPool');
assert(!examPool.includes('L031'),'L031 remains outside ExamPool');

assert.strictEqual(questions.J001.category,'資本金・追加出資','P4-1 core coverage remains');
assert.strictEqual(questions.J101.category,'資本金・追加出資','P4-1 accepted Story transfer coverage remains');
assert.strictEqual(questions.J101.learningRole,'transfer','J101 accepted Story role remains');
assert(String(questions.J101.story||'').startsWith(String(sandbox.window.WorkCaseNarratives?.J101?.before||'')),'J101 accepted S5A Story Before remains intact');

const dividend=questions.J051;
assert.strictEqual(dividend.type,'journal');
assert.strictEqual(dividend.category,'剰余金の配当');
assert.strictEqual(dividend.learningRole,'review');
assert(dividend.question.includes('追加積立は不要'),'Grade-3 dividend case must exclude reserve-amount calculation');
assert(/配当/u.test(`${dividend.scene} ${dividend.story} ${dividend.category}`),'J051 review context must match the dividend task');
assert(!/追加出資|追加払込み|会社に入った資金/u.test(`${dividend.scene} ${dividend.story} ${dividend.chapterArc?.problem||''} ${dividend.chapterArc?.goal||''} ${dividend.mission||''}`),'J051 must not retain the replaced capital-contribution context');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(dividend.answer)),
  {
    debit:[{account:'繰越利益剰余金',amount:300000}],
    credit:[{account:'未払配当金',amount:300000}]
  },
  'J101 reviewed dividend answer'
);
assert.strictEqual(domain.accountType('未払配当金'),'liability','未払配当金 must be a recognized Grade-3 liability');
const independentGolden=JSON.parse(fs.readFileSync('independent-audit/golden/expected-answers.json','utf8')).answers;
assert.deepStrictEqual(independentGolden.J051,{debit:[{account:'繰越利益剰余金',amount:300000}],credit:[{account:'未払配当金',amount:300000}]},'J051 independent golden authority');
assert.deepStrictEqual(independentGolden.J101,{debit:[{account:'現金',amount:3020000}],credit:[{account:'資本金',amount:3020000}]},'J101 accepted independent golden authority remains');

const accountRule=questions.L031;
assert.strictEqual(accountRule.type,'ledger');
assert.strictEqual(accountRule.category,'勘定記入法則');
assert.strictEqual(accountRule.format,'bookkeeping-account-rule');
assert(accountRule.question.includes('貸借平均'),'P1-3 item must directly assess the balance principle');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(accountRule.answer.cells)),
  {
    assetIncreaseSide:'借方',
    assetDecreaseSide:'貸方',
    liabilityIncreaseSide:'貸方',
    liabilityDecreaseSide:'借方',
    balancePrinciple:'一致'
  },
  'L031 reviewed account-rule answers'
);
assert.deepStrictEqual(independentGolden.L031,{cells:{assetIncreaseSide:'借方',assetDecreaseSide:'貸方',liabilityIncreaseSide:'貸方',liabilityDecreaseSide:'借方',balancePrinciple:'一致'}},'L031 independent golden authority');
assert(!/期首残高|期末残高|日付・相手先・金額/u.test(`${accountRule.story} ${accountRule.explanation}`),'L031 must not retain the replaced numeric-ledger walkthrough');
assert(/資産.*借方|借方.*資産/u.test(accountRule.explanation)&&/負債.*貸方|貸方.*負債/u.test(accountRule.explanation),'L031 explanation must teach account-entry direction');

const taxonomy=JSON.parse(fs.readFileSync('reports/edu-quality/question-taxonomy-2026.json','utf8'));
assert.strictEqual(taxonomy.rows.length,300,'taxonomy remains 300 rows');
assert.strictEqual(Object.keys(taxonomy.prerequisiteConcepts||{}).length,36,'controlled concepts include dividend concept');

const j051=taxonomy.rows.find(row=>row.id==='J051');
assert(j051,'J051 taxonomy row');
assert.strictEqual(j051.authoredCategory,'剰余金の配当');
assert.strictEqual(j051.primarySyllabusMapping.code,'P4-4');
assert(j051.explanationLearningObjective.targetConceptIds.includes('EQ_DIVIDEND'));
const j101=taxonomy.rows.find(row=>row.id==='J101');
assert(j101,'J101 taxonomy row');
assert.strictEqual(j101.authoredCategory,'資本金・追加出資');
assert.strictEqual(j101.primarySyllabusMapping.code,'P4-1');

const l031=taxonomy.rows.find(row=>row.id==='L031');
assert(l031,'L031 taxonomy row');
assert.strictEqual(l031.authoredCategory,'勘定記入法則');
assert.strictEqual(l031.primarySyllabusMapping.code,'P1-3');
assert.strictEqual(l031.cognitiveLevel,'Understanding');
assert(l031.explanationLearningObjective.targetConceptIds.includes('FND_DEBIT_CREDIT'));

console.log('ISSUE199_GRADE3_COVERAGE_PASS');
