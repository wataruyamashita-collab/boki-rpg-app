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
assert(viewSource.includes('isSectionStart(left, index)') && viewSource.includes('isSectionStart(right, index)'), 'B/S section starts are computed independently for each side');
assert(!viewSource.includes('right.indexOf(row)'), 'left-side rows are never looked up in the right-side array');
assert(viewSource.includes("[['資産', 2], ['負債・純資産', 2]]"), 'balance sheet has two side-by-side regions');
assert(viewSource.includes("question.table.rows.filter(row => row.section === '合計')") && viewSource.includes('totals[0]?.inputCellId') && viewSource.includes('totals[1]?.inputCellId'), 'B/S totals use declared mappings');
assert(viewSource.includes("question.format === 'balance-sheet'") && viewSource.includes("this.renderBalanceSheet(question, {}, { user:userAnswer, score })"), 'wrong-answer comparison preserves balance sheet');
const css = fs.readFileSync('css/style.css','utf8');
assert(/\.balance-sheet-table\s*\{[^}]*min-width:\s*680px[^}]*table-layout:\s*fixed/s.test(css));
assert(/\.journal-grid-scroll\s*\{[^}]*overflow-x:\s*auto/s.test(css));
assert(/\.journal-row\s*\{[^}]*grid-template-columns:\s*200px\s+120px\s+200px\s+120px/s.test(css), 'journal columns use the compact symmetric desktop contract');
assert(!/\.journal-row select\s*\{[^}]*text-overflow:\s*ellipsis/s.test(css));
assert(/\.journal-row select\s*\{[^}]*text-align:\s*center[^}]*text-align-last:\s*center[^}]*font-size:\s*var\(--journal-account-font-size,\s*16px\)/s.test(css), 'selected journal accounts are centered and adapt their display size');
assert(/\.journal-row select:focus,[\s\S]*?\.journal-row select:active\s*\{[^}]*font-size:\s*16px/s.test(css), 'focused or tapped journal accounts remain 16px for iPhone zoom safety');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-header,\s*\.journal-row\s*\{[^}]*grid-template-columns:\s*184px\s+112px\s+184px\s+112px/s.test(css), 'mobile journal uses the compact 184/112 pair');
console.log('quality regression tests: ok');
for (const id of Array.from({ length: 9 }, (_, index) => `F${String(index + 2).padStart(3, '0')}`)) {
  const q = questions[id];
  assert(q.table.rows.filter(row => row.amount === '入力').every(row => row.inputCellId && q.table.inputCells.includes(row.inputCellId)), `${id}: every editable B/S row declares its inputCellId`);
  assert(q.explanation.includes('資産＝負債＋純資産') && /資産合計は.+＋.+＝/su.test(q.explanation), `${id}: B/S explanation shows question-specific arithmetic`);
}
{
  const rows = questions.F002.table.rows.filter(row => row.section !== '合計');
  const labels = ['資産','負債','純資産'].flatMap(section => {
    const side = rows.filter(row => row.section === section);
    return side.filter((row,index) => index === 0 || row.section !== side[index-1].section).map(row => `${row.section}の部`);
  });
  for (const label of ['資産の部','負債の部','純資産の部']) assert.strictEqual(labels.filter(value => value === label).length, 1, `F002 DOM section plan renders ${label} once`);
}
assert(!viewSource.includes("row.account === '繰越利益剰余金'"), 'balance-sheet renderer must not infer input IDs from account names');
assert(viewSource.includes('row.inputCellId'), 'balance-sheet renderer consumes declarative input cell mapping');
assert(viewSource.includes('journalAccountFontSize') && viewSource.includes('if (glyphs <= 8) return 15') && viewSource.includes('if (glyphs <= 10) return 14') && viewSource.includes('return 13'), 'long journal account names use bounded 13-16px adaptive sizing instead of widening every account column');
{
  const mutated = structuredClone(questions.F003);
  delete mutated.table.rows.find(row => row.amount === '入力').inputCellId;
  assert.strictEqual(mutated.table.rows.filter(row => row.amount === '入力').every(row => row.inputCellId && mutated.table.inputCells.includes(row.inputCellId)), false, 'B/S mapping mutation is detected');
}
