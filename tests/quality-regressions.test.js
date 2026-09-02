'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { loadQuestions } = require('../scripts/audit-matrix');

const source = fs.readFileSync('data/questions.js', 'utf8');
const questions = loadQuestions();
assert(source.includes('item.explanation ||= buildExplanation(item)'), 'authored explanation must not be overwritten');
assert(!source.includes('item.explanation = buildExplanation(item);'), 'unconditional explanation replacement is forbidden');
assert.strictEqual(questions.F001.explanation.startsWith('売上高800,000円－売上原価400,000円'), true, 'authored F001 prose survives runtime enrichment');
const f002 = questions.F002;
['普通預金456,000円','売掛金278,000円','繰越商品150,000円','備品（純額）264,000円','買掛金212,000円','未払給料34,000円','借入金250,000円','1,148,000円','496,000円','資本金500,000円','152,000円','資産＝負債＋純資産','貸借差額'].forEach(token => assert(f002.explanation.includes(token), `F002 explanation: ${token}`));
assert(!/第\d+章・調査\d+.*答え.*確定/u.test(f002.explanation), 'chapter/case template must not determine the answer');
for (let n=2; n<=10; n += 1) {
  const q = questions[`F${String(n).padStart(3,'0')}`];
  assert.strictEqual(q.format, 'balance-sheet');
  assert.strictEqual(JSON.stringify(q.table.inputCells), JSON.stringify(Object.keys(q.answer.cells)), `${q.id}: input and grading cells align`);
}
const viewSource = fs.readFileSync('js/view.js', 'utf8');
assert(viewSource.includes("question.format === 'balance-sheet') this.renderBalanceSheet"));
assert(viewSource.includes("[['資産', 2], ['負債・純資産', 2]]"), 'balance sheet has two side-by-side regions');
assert(viewSource.includes("question.table.rows.filter(row => row.section === '合計')") && viewSource.includes('totals[0]?.inputCellId') && viewSource.includes('totals[1]?.inputCellId'), 'B/S totals use declared mappings');
assert(viewSource.includes("question.format === 'balance-sheet'") && viewSource.includes("this.renderBalanceSheet(question, {}, { user:userAnswer, score })"), 'wrong-answer comparison preserves balance sheet');
const css = fs.readFileSync('css/style.css','utf8');
assert(/\.balance-sheet-table\s*\{[^}]*min-width:\s*680px[^}]*table-layout:\s*fixed/s.test(css));
assert(/\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css));
assert(/\.journal-row\s*\{[^}]*grid-template-columns:\s*minmax\(240px, 3fr\).*minmax\(120px, 2fr\).*minmax\(240px, 3fr\).*minmax\(120px, 2fr\)/s.test(css));
assert(!/\.journal-row select\s*\{[^}]*text-overflow:\s*ellipsis/s.test(css));
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-row select,\s*\.journal-row \.amount-input\s*\{[^}]*font-size:\s*16px/s.test(css));
console.log('quality regression tests: ok');
for (const id of Array.from({ length: 9 }, (_, index) => `F${String(index + 2).padStart(3, '0')}`)) {
  const q = questions[id];
  assert(q.table.rows.filter(row => row.amount === '入力').every(row => row.inputCellId && q.table.inputCells.includes(row.inputCellId)), `${id}: every editable B/S row declares its inputCellId`);
  assert(q.explanation.includes('資産＝負債＋純資産') && /資産合計は.+＋.+＝/su.test(q.explanation), `${id}: B/S explanation shows question-specific arithmetic`);
}
assert(!viewSource.includes("row.account === '繰越利益剰余金'"), 'balance-sheet renderer must not infer input IDs from account names');
assert(viewSource.includes('row.inputCellId'), 'balance-sheet renderer consumes declarative input cell mapping');
assert(css.includes('minmax(240px, 3fr)'), 'account columns reserve enough width for 法人税、住民税及び事業税');
{
  const mutated = structuredClone(questions.F003);
  delete mutated.table.rows.find(row => row.amount === '入力').inputCellId;
  assert.strictEqual(mutated.table.rows.filter(row => row.amount === '入力').every(row => row.inputCellId && mutated.table.inputCells.includes(row.inputCellId)), false, 'B/S mapping mutation is detected');
}
