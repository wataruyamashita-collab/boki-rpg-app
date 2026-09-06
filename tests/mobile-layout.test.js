'use strict';
const assert = require('assert'); const fs = require('fs'); const vm = require('vm');
const css = fs.readFileSync('css/style.css', 'utf8'); const view = fs.readFileSync('js/view.js', 'utf8');
const questionSandbox = { window: {} }; vm.runInNewContext(fs.readFileSync('data/questions.js', 'utf8'), questionSandbox);
const questions = Object.values(questionSandbox.window.QuestionData);
const ordinary = questions.filter(question => question.table && question.format !== 'eight-column-worksheet');
const visible = key => ordinary.flatMap(question => (question.table.rows || []).filter(row => row[key] !== undefined && row[key] !== '入力').map(row => ({ id:question.id, value:row[key] })));
const numericMaximum = key => visible(key).reduce((maximum, item) => Number(item.value) > Number(maximum.value) ? item : maximum);
const longest = key => visible(key).reduce((maximum, item) => [...String(item.value)].length > [...String(maximum.value)].length ? item : maximum);
const editable = key => ordinary.flatMap(question => {
  let inputIndex = 0; const values = [];
  for (const row of question.table.rows || []) Object.entries(row).forEach(([column, value]) => {
    if (value !== '入力') return;
    const cellId = question.table.inputCells[inputIndex++];
    if (column === key && Number.isFinite(Number(question.answer?.cells?.[cellId]))) values.push({ id:question.id, value:question.answer.cells[cellId] });
  });
  return values;
});
assert.strictEqual(questions.length, 300, 'semantic width audit covers all 300 canonical questions');
assert.deepStrictEqual(longest('date'), { id:'L001', value:'10月15日' }, 'ordinary dates require six mixed ASCII/CJK glyphs');
assert(visible('date').some(item => item.id === 'L004' && item.value === '10月31日'), 'representative longest month-end date remains covered');
assert.deepStrictEqual(longest('description'), { id:'L004', value:'払出（先入先出法）' }, 'longest ordinary description remains known');
assert.deepStrictEqual(numericMaximum('quantity'), { id:'L029', value:69 }, 'quantity sizing is checked against the authored maximum');
assert.deepStrictEqual(numericMaximum('unitPrice'), { id:'L004', value:1500 }, 'unit-price sizing is checked against the authored maximum');
assert.deepStrictEqual(numericMaximum('balance'), { id:'L032', value:460000 }, 'balance sizing is checked against the authored maximum');
assert.deepStrictEqual(editable('amount').reduce((maximum, item) => item.value > maximum.value ? item : maximum), { id:'C001', value:2520000 }, 'amount sizing is checked against the largest formatted editable answer');

const rule = key => css.match(new RegExp(`\\.answer-table:not\\(\\.eight-column-worksheet\\) \\[data-column-key="${key}"\\]\\s*\\{([^}]*)\\}`))?.[1] || '';
const dateRule = rule('date'), descriptionRule = rule('description'), quantityRule = rule('quantity'), unitPriceRule = rule('unitPrice'), amountRule = rule('amount');
assert(/calc\(4em \+ 17px\)/.test(dateRule) && /white-space:\s*nowrap/.test(dateRule) && /box-sizing:\s*border-box/.test(dateRule), 'date width budgets four em of mixed glyph content plus cell chrome on one line');
assert(/min-width:\s*7em/.test(descriptionRule) && !/white-space:\s*nowrap/.test(descriptionRule), 'Generation 8 description minimum and natural Japanese wrapping are preserved');
assert(/calc\(2em \+ 17px\)/.test(quantityRule) && /white-space:\s*nowrap/.test(quantityRule), 'quantity reserves its two-glyph header plus cell chrome without vertical stacking');
assert(/calc\(7ch \+ 26px\)/.test(unitPriceRule) && /white-space:\s*nowrap/.test(unitPriceRule), 'unit price reserves five formatted characters, caret room, input chrome, and cell padding');
assert(/calc\(11ch \+ 26px\)/.test(amountRule) && /white-space:\s*nowrap/.test(amountRule), 'amount reserves the nine-character canonical maximum, caret room, input chrome, and cell padding');
assert(/\[data-column-key="unitPrice"\] \.table-input,[\s\S]*\[data-column-key="amount"\] \.table-input\s*\{[^}]*width:\s*100%[^}]*font-variant-numeric:\s*tabular-nums/.test(css), 'editable numeric controls consume the safe semantic width with stable digits');
assert(/\.answer-table\s*\{[^}]*width:\s*100%/.test(css) && !/\.answer-table\s*\{[^}]*600px/.test(css), 'ordinary tables have no arbitrary 600px floor');
assert(/\.eight-column-worksheet\s*\{[^}]*width:\s*max\(100%,\s*1320px\)/.test(css), 'eight-column worksheets retain their separate intentional wide canvas');
assert(/\.table-question-wrap\s*\{[^}]*overflow-x:\s*auto/.test(css), 'content-required ordinary table overflow remains horizontally scrollable');
assert(/\.answer-table th:first-child,\s*\.answer-table td:first-child\s*\{[^}]*position:\s*sticky[^}]*left:\s*0/s.test(css), 'sticky first-column behavior remains present');
assert(!/answer-table[^\n{]*:nth-child[^\n{]*(?:date|description|quantity|unitPrice|amount)/.test(css), 'ordinary width allocation never depends on a positional selector');
assert(view.includes('th.dataset.columnKey = column') && view.includes('cell.dataset.columnKey = question.table.columns[columnIndex]'), 'headers and cells expose semantic column keys');

const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]);
assert(accountWidth >= 240 && /\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'horizontal journal entry integrity remains protected');
for (const viewport of [320, 375, 390, 430]) assert(accountWidth * 2 + 120 * 2 > viewport, `${viewport}px journals scroll rather than collapse four fields`);
console.log('mobile layout semantic tests (320/375/390/430): ok');
