'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');

const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});
const questions=sandbox.window.QuestionData;
const examPool=new Set(sandbox.window.ExamPoolDefinition||[]);
const inventory=JSON.parse(fs.readFileSync('reports/issue-161/question-inventory.json','utf8'));

const ids=Object.keys(questions);
assert.strictEqual(inventory.issue,161,'inventory belongs to Issue 161');
assert.strictEqual(inventory.totalQuestions,300,'inventory must cover all 300 questions');
assert.strictEqual(ids.length,300,'question corpus remains 300 questions');
assert.strictEqual(inventory.questions.length,300,'inventory contains exactly one row per question');

const rendererOf=q=>{
  const cells=q.table?.inputCells||[];
  if(q.type==='journal') return 'renderJournal';
  if(q.type==='correction') return 'renderCorrection';
  if(q.format==='journal-book'&&cells.includes('d1Account')) return 'renderJournalBook';
  if(String(q.format||'').startsWith('bookkeeping-')) return 'renderBookkeepingForm';
  if(q.format==='balance-sheet') return 'renderBalanceSheet';
  if(q.format==='fixed-asset-ledger') return 'renderFixedAssetLedger';
  return 'renderTable';
};

const rows=new Map(inventory.questions.map(row=>[row.id,row]));
assert.strictEqual(rows.size,300,'question IDs are unique in inventory');
for(const id of ids){
  const q=questions[id],row=rows.get(id);
  assert(row,`${id}: inventory row exists`);
  assert.strictEqual(row.type,q.type,`${id}: type`);
  assert.strictEqual(row.format,q.format||null,`${id}: format`);
  assert.strictEqual(row.renderer,rendererOf(q),`${id}: renderer`);
  assert.strictEqual(row.chapter,q.chapter,`${id}: chapter`);
  assert.strictEqual(row.category,q.category,`${id}: category`);
  assert.strictEqual(row.learningRole,q.learningRole||null,`${id}: learningRole`);
  assert.strictEqual(row.examPool,examPool.has(id),`${id}: exam pool`);
  assert.strictEqual(row.explanation.hasAuthored,Boolean(String(q.explanation||'').trim()),`${id}: authored explanation flag`);
  assert.strictEqual(row.explanation.hasModel,Boolean(q.explanationModel),`${id}: explanation model flag`);
  assert.strictEqual(row.inputs.cellCount,(q.table?.inputCells||[]).length,`${id}: input cell count`);
}

assert.strictEqual(inventory.summary.questionsWithExplanationModel,300,'all questions expose explanation models');
assert.strictEqual(inventory.summary.questionsWithAuthoredExplanation,300,'all questions have authored explanation prose');
assert.strictEqual(inventory.summary.examPoolCount,74,'explicit exam pool size');
assert.strictEqual(inventory.summary.reviewRoleCount,60,'review-role inventory count');
assert.strictEqual(inventory.summary.totalTableInputCells,533,'table input-cell census');
assert.strictEqual([...rows.values()].filter(row=>!row.renderer).length,0,'no unknown renderer');
console.log('ISSUE161_GATE1_INVENTORY_PASS');
