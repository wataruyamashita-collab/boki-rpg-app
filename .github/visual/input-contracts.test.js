'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { controlHeights, amountControlKeys, textOnlyCells, sameControlKeys } = require('./input-contracts');
const { evaluateVisualMetrics } = require('./gate-core');

const heights = controlHeights([44,51,44,44]);
assert.deepStrictEqual(heights,{ minimum:44,maximum:51 },'native select height controls row fit, while the smallest input controls touch-target safety');
assert.deepStrictEqual(controlHeights([51,44,44,44]),heights,'control order cannot change the measured row requirement');
assert.strictEqual(controlHeights([44,51,30]).minimum,30,'a later undersized control must not be hidden by a taller select');
assert.deepStrictEqual(controlHeights([]),{ minimum:0,maximum:0 });
assert.throws(() => controlHeights([44,NaN]),/INVALID_CONTROL_HEIGHT/);
const rows = { normalRowHeight:64,editableRowHeight:64,inputVisualHeight:heights.minimum,expectedNormalRowHeight:heights.maximum+15,expectedEditableRowHeight:heights.maximum+15 };
assert(!evaluateVisualMetrics({case:'journal-book',rows}).some(item => item.code === 'ROW_TOO_TALL'),'a 51px select with 15px cell chrome fits the measured native row');
assert(evaluateVisualMetrics({case:'journal-book',rows:{...rows,editableRowHeight:71}}).some(item => item.code === 'ROW_TOO_TALL'),'exceeding the actual control plus cell chrome and unchanged 4px tolerance still fails');
assert(evaluateVisualMetrics({case:'journal-book',rows:{...rows,hasEditableControl:true,inputVisualHeight:controlHeights([44,51,30]).minimum}}).some(item => item.code === 'JOURNAL_BOOK_TOUCH_TARGET_FAILURE'),'a later small control still fails the 44px touch requirement');

const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox);
const questions = JSON.parse(JSON.stringify(sandbox.window.QuestionData));
const totals = {};
for (const question of Object.values(questions)) {
  // Independently enumerate answer cells, rather than the helper's inputCells.
  const authoredKeys = question.type === 'journal'
    ? Object.entries(question.answer).flatMap(([side, entries]) => entries.map((_, index) => `${side}:${index}`))
    : Object.keys(question.answer.cells).filter(id => ['amount','unitPrice'].includes(question.table.inputMetadata[id].semanticType));
  const actual = amountControlKeys(question);
  assert(sameControlKeys(authoredKeys,actual),`${question.id}: complete numeric inventory comes from authored answers and semantic metadata`);
  totals[question.type] = (totals[question.type] || 0) + actual.length;
}
assert.deepStrictEqual(amountControlKeys(questions.L031),[]);
assert(sameControlKeys(textOnlyCells(questions.L031),Object.keys(questions.L031.answer.cells)),'all authored text answers remain required without pinning their count or IDs');
const expected = amountControlKeys(questions.L001);
assert(expected.length > 0);
assert(sameControlKeys(expected,[...expected].reverse()),'DOM order is not an input identity');
assert(!sameControlKeys(expected,expected.slice(1)),'a missing amount control fails');
assert(!sameControlKeys(expected,[...expected.slice(1),'wrong-cell']),'a same-count substitution fails');
assert(!sameControlKeys(expected,[...expected,expected[0]]),'a duplicate amount control fails');
assert(!sameControlKeys([],questions.L031.table.inputCells.slice(0,1)),'L031 cannot silently render an amount field');
const removedMetadata = structuredClone(questions.L001);
for (const id of removedMetadata.table.inputCells) {
  removedMetadata.table.inputTypes[id] = 'text';
  if (removedMetadata.table.inputMetadata?.[id]) removedMetadata.table.inputMetadata[id].semanticType = 'text';
}
assert.throws(() => amountControlKeys(removedMetadata),/UNEXPECTED_NON_AMOUNT_QUESTION/,'numeric questions cannot acquire an implicit no-calculator exemption');
for (const mutate of [
  q => q.table.inputCells.pop(),
  q => q.table.inputCells.push(q.table.inputCells[0]),
  q => q.table.inputTypes[q.table.inputCells[0]] = 'amount',
  q => q.table.controlTypes[q.table.inputCells[0]] = 'amount',
  q => q.answer.cells[q.table.inputCells[0]] = 0,
  q => delete q.answer.cells[q.table.inputCells[0]],
  q => q.id = 'unexpected-text-question'
]) {
  const invalid = structuredClone(questions.L031); mutate(invalid);
  assert.throws(() => textOnlyCells(invalid),/UNEXPECTED_NON_AMOUNT_QUESTION/,'malformed or unreviewed text-only questions fail rather than being skipped');
}
const missingType = structuredClone(questions.L001), firstCell = missingType.table.inputCells[0];
delete missingType.table.inputTypes[firstCell]; delete missingType.table.inputMetadata[firstCell];
assert.throws(() => amountControlKeys(missingType),/MISSING_INPUT_TYPE/);
const unknownType = structuredClone(questions.L001);
unknownType.table.inputMetadata[firstCell].semanticType = 'unsupported';
assert.throws(() => amountControlKeys(unknownType),/UNKNOWN_INPUT_TYPE/);
for (const [original, type] of [[questions.L001,'amount'],[questions.L031,'text']]) {
  const expanded = structuredClone(original), extra = 'synthetic-extra-cell';
  expanded.table.rows.push({answer:'入力'});
  expanded.table.inputCells.push(extra);
  expanded.table.inputTypes[extra] = type;
  expanded.table.inputMetadata[extra] = {semanticType:type};
  expanded.table.controlTypes[extra] = type;
  expanded.answer.cells[extra] = type === 'text' ? '追加の文字回答' : 123;
  const enumerate = type === 'text' ? textOnlyCells : amountControlKeys;
  assert(sameControlKeys(enumerate(expanded),[...enumerate(original),extra]),'inventory adapts to authored data instead of a fixed current count');
}
console.log('observed authored inventory:',JSON.stringify({amountByType:totals,textCells:textOnlyCells(questions.L031).length}));
console.log('visual input contract tests: native row heights, full numeric inventory, text-only topology and negative cases: ok');
