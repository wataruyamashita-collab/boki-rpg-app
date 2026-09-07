'use strict';
const assert = require('assert'); const fs = require('fs'); const vm = require('vm');
const css = fs.readFileSync('css/style.css', 'utf8'); const view = fs.readFileSync('js/view.js', 'utf8');
const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync('data/questions.js', 'utf8'), sandbox); vm.runInNewContext(view, sandbox);
const questions = Object.values(sandbox.window.QuestionData); const ordinary = questions.filter(question => question.table && question.format !== 'eight-column-worksheet');
const columns = [...new Set(ordinary.flatMap(question => question.table.columns || []))].sort();
const records = new Map(columns.map(key => [key, { key, values:[], answers:[], inputTypes:[], numeric:false, maximumIntegerLength:0, maximumTextLength:0 }]));
const formatted = value => Number(value).toLocaleString('ja-JP');
for (const question of ordinary) {
  let inputIndex = 0;
  for (const row of question.table.rows || []) for (let index = 0; index < question.table.columns.length; index += 1) {
    const key = question.table.columns[index], value = Object.values(row)[index], record = records.get(key);
    if (value === '入力') { const cellId = question.table.inputCells[inputIndex++], type = question.table.inputTypes?.[cellId] || 'amount', answer = question.answer?.cells?.[cellId]; record.inputTypes.push(type); record.answers.push(answer); if (Number.isFinite(Number(answer))) record.maximumIntegerLength = Math.max(record.maximumIntegerLength, formatted(answer).length); }
    else if (typeof value === 'number') { record.numeric = true; record.values.push(value); record.maximumIntegerLength = Math.max(record.maximumIntegerLength, formatted(value).length); }
    else { record.values.push(value); record.maximumTextLength = Math.max(record.maximumTextLength, [...String(value ?? '')].length); }
  }
}
for (const record of records.values()) record.type = sandbox.window.AppView.semanticColumnType(record.key, record);
const unclassified = [...records.values()].filter(record => !['money','quantity','years','date','account','short-integer','text','long-text'].includes(record.type));
assert.strictEqual(questions.length, 300, 'semantic audit covers all 300 canonical questions');
assert(ordinary.length > 0 && columns.length > 0, 'ordinary tables and their columns are extracted from canonical data');
assert.deepStrictEqual(unclassified, [], 'every canonical ordinary-table column has a supported semantic display type');
assert.strictEqual(records.get('life').type, 'years'); assert.strictEqual(records.get('quantity').type, 'quantity');
for (const key of ['acquisitionCost','unitPrice','amount','openingAccumulated','currentDepreciation','closingBookValue','debit','credit','balance']) assert.strictEqual(records.get(key).type, 'money', `${key} uses the money budget`);
assert.strictEqual(records.get('description').type, 'long-text'); assert.strictEqual(records.get('date').type, 'date'); assert.strictEqual(records.get('account').type, 'account');
const years = records.get('life'); assert.deepStrictEqual(years.values, [5,5,5,5,5,5]); assert.strictEqual(Math.min(...years.values),5); assert.strictEqual(Math.max(...years.values),5); assert.strictEqual(years.maximumIntegerLength,1);
const money = [...records.values()].filter(record => record.type === 'money'); const quantity = records.get('quantity'); const dates = records.get('date'); const texts = [...records.values()].filter(record => record.type === 'text' || record.type === 'long-text');
assert(Math.max(...money.map(record => record.maximumIntegerLength)) >= 9, 'money profile includes the full comma-formatted canonical answer range');
assert.strictEqual(quantity.maximumIntegerLength,2); assert(dates.maximumTextLength >= 5); assert(Math.max(...texts.map(record => record.maximumTextLength)) >= 10);
const tableRule = css.match(/\.answer-table\s*\{([^}]*)\}/)?.[1] || '', headRule = css.match(/\.answer-table th\s*\{([^}]*)\}/)?.[1] || '';
assert(/width:\s*max-content/.test(tableRule) && /min-width:\s*0/.test(tableRule), 'ordinary tables use compact intrinsic width instead of unconditional container stretching');
assert(/word-break:\s*keep-all/.test(headRule) && /white-space:\s*nowrap/.test(headRule) && !/(?:overflow:\s*hidden|text-overflow:\s*ellipsis)/.test(headRule), 'headers remain complete, readable, and untruncated');
for (const type of ['money','quantity','years','short-integer','account','date','long-text']) assert(css.includes(`data-column-type="${type}"`), `${type}: semantic CSS contract is present`);
assert(view.includes('semanticColumnType') && view.includes('th.dataset.columnType = columnTypes.get(column)') && view.includes('cell.dataset.columnType = columnTypes.get(column)'), 'renderer exposes reusable semantic types on headers and cells');
assert(!/data-column-key="(?:life|acquisitionCost|openingAccumulated|currentDepreciation|closingBookValue|quantity|unitPrice|amount|description|date)"/.test(css), 'ordinary width policy is semantic rather than a list of fixed column exceptions');
assert(/\.table-question-wrap\s*\{[^}]*overflow-x:\s*auto/.test(css)); assert(/\.answer-table th:first-child,\s*\.answer-table td:first-child\s*\{[^}]*position:\s*sticky[^}]*left:\s*0/s.test(css));
assert(/\.eight-column-worksheet\s*\{[^}]*width:\s*max\(100%,\s*1320px\)/.test(css), 'worksheet retains its dedicated wide-canvas policy');
const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]); assert(accountWidth >= 240 && /\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'horizontal journal integrity remains protected');
console.log(JSON.stringify({ totalQuestions:questions.length, ordinaryTableCount:ordinary.length, uniqueColumnKeys:columns.length, semanticCoverage:records.size, unclassifiedColumns:unclassified.length, maxMoneyDisplayLength:Math.max(...money.map(record => record.maximumIntegerLength)), maxQuantityDisplayLength:quantity.maximumIntegerLength, yearsProfile:{ values:years.values,min:5,max:5,maximumDisplayLength:1,editable:years.inputTypes.length>0 }, dateProfile:{ maximumDisplayLength:dates.maximumTextLength }, textProfile:{ maximumDisplayLength:Math.max(...texts.map(record => record.maximumTextLength)) } }));
