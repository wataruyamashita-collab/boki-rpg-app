'use strict';
const assert = require('assert'); const fs = require('fs'); const vm = require('vm');
const css = fs.readFileSync('css/style.css', 'utf8'); const view = fs.readFileSync('js/view.js', 'utf8');
const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync('data/questions.js', 'utf8'), sandbox); vm.runInNewContext(view, sandbox);
const questions = Object.values(sandbox.window.QuestionData);
const ordinary = questions.filter(question => question.table && question.format !== 'eight-column-worksheet');
const columns = [...new Set(ordinary.flatMap(question => question.table.columns || []))].sort();
const label = key => sandbox.window.AppView.prototype.tableLabel(key);
const glyphs = value => [...String(value ?? '')].length;
const formatted = value => Number(value).toLocaleString('ja-JP');
const audit = new Map(columns.map(key => [key, { key, label:label(key), visible:[], editable:[], types:new Set() }]));
for (const question of ordinary) {
  let inputIndex = 0;
  for (const row of question.table.rows || []) Object.values(row).forEach((value, columnIndex) => {
    const key = question.table.columns[columnIndex]; const record = audit.get(key); if (!record) return;
    if (value !== '入力') { record.visible.push({ id:question.id, value }); record.types.add(typeof value === 'number' ? 'numeric' : key === 'date' ? 'date' : /account/i.test(key) || key === 'account' ? 'account' : 'text'); return; }
    const cellId = question.table.inputCells[inputIndex++]; const type = question.table.inputTypes?.[cellId] || 'amount'; const answer = question.answer?.cells?.[cellId];
    record.editable.push({ id:question.id, cellId, type, answer }); record.types.add(type === 'amount' ? 'numeric' : type);
  });
}
const maximumEditable = [...audit.values()].flatMap(record => record.editable.map(item => ({ ...item, key:record.key }))).filter(item => item.type === 'amount' && Number.isFinite(Number(item.answer))).reduce((maximum, item) => Math.abs(Number(item.answer)) > Math.abs(Number(maximum.answer)) ? item : maximum, { answer:0 });

assert.strictEqual(questions.length, 300, 'semantic audit covers all 300 canonical questions');
assert(ordinary.length > 0 && columns.length > 0, 'ordinary table columns are extracted from canonical data');
for (const record of audit.values()) {
  assert(record.label && (!/^[A-Za-z]/.test(record.key) || record.label !== record.key), `${record.key}: TABLE_LABELS supplies a user-facing label`);
  record.labelLength = glyphs(record.label);
  record.longestVisible = record.visible.reduce((maximum, item) => glyphs(item.value) > glyphs(maximum.value) ? item : maximum, { value:'' });
  record.largestEditable = record.editable.filter(item => item.type === 'amount' && Number.isFinite(Number(item.answer))).reduce((maximum, item) => Math.abs(Number(item.answer)) > Math.abs(Number(maximum.answer)) ? item : maximum, { answer:0 });
  assert(record.types.size > 0, `${record.key}: semantic type is inferred from authored content or editable metadata`);
}
assert.deepStrictEqual(maximumEditable, { id:'C001', cellId:'sales', type:'amount', answer:2520000, key:'金額' }, 'largest editable canonical amount remains 2,520,000');

const fixedKeys = ['asset','acquisitionCost','life','openingAccumulated','currentDepreciation','closingBookValue'];
const fixed = ordinary.find(question => fixedKeys.every(key => question.table.columns.includes(key)));
assert(fixed, 'a canonical fixed-asset register contains all six semantic columns');
assert.deepStrictEqual(fixedKeys.map(label), ['固定資産','取得原価','耐用年数','期首減価償却累計額','当期減価償却額','期末帳簿価額']);
for (const key of ['currentDepreciation','closingBookValue']) assert(audit.get(key).editable.some(item => item.type === 'amount'), `${key}: fixed-asset amount is editable and included in width budgeting`);
assert(audit.get('life').visible.every(item => Number.isInteger(item.value) && item.value >= 1 && item.value <= 99), 'canonical useful-life values fit the one-to-two digit years contract');

const tableRule = css.match(/\.answer-table\s*\{([^}]*)\}/)?.[1] || '';
const headRule = css.match(/\.answer-table th\s*\{([^}]*)\}/)?.[1] || '';
const numericRule = css.match(/\[data-sizing="semantic-content"\] \[data-column-type="numeric"\]\s*\{([^}]*)\}/)?.[1] || '';
const numericInputRule = css.match(/\[data-sizing="semantic-content"\] \.table-input\[data-input-type="amount"\]\s*\{([^}]*)\}/)?.[1] || '';
assert(/width:\s*max-content/.test(tableRule) && /min-width:\s*100%/.test(tableRule) && !/600px/.test(tableRule), 'ordinary tables fill small containers but grow to content width without a fixed 600px floor');
assert(/overflow-wrap:\s*normal/.test(headRule) && /word-break:\s*keep-all/.test(headRule) && /white-space:\s*nowrap/.test(headRule), 'complete Japanese headers cannot clip, ellipsize, or stack one glyph per line');
assert(!/(?:overflow:\s*hidden|text-overflow:\s*ellipsis)/.test(headRule), 'semantic headers never conceal authored labels');
assert(/white-space:\s*nowrap/.test(numericRule) && !/min-width/.test(numericRule), 'static numeric cells use intrinsic content width instead of inheriting the editable money floor');
assert(/th\[data-column-type="numeric"\]\s*\{[^}]*min-width:\s*max-content/.test(css), 'numeric headers impose their intrinsic rendered label width without per-column pixel constants');
assert(/\[data-column-type="years"\]\s*\{[^}]*width:\s*calc\(4em \+ 14px\)[^}]*max-width:\s*calc\(4em \+ 14px\)/s.test(css), 'years use a dedicated four-glyph header plus cell-chrome width instead of the money floor');
assert(/width:\s*var\(--column-input-ch,\s*9ch\)/.test(numericInputRule) && /min-width:\s*var\(--column-input-ch,\s*9ch\)/.test(numericInputRule) && /max-width:\s*var\(--column-input-ch,\s*9ch\)/.test(numericInputRule), 'editable numeric controls use their exact-column budget with a nine-character fallback');
assert(glyphs(String(maximumEditable.answer)) <= 9 && glyphs(formatted(maximumEditable.answer)) <= 9, 'raw and comma-formatted canonical maxima fit the nine-character numeric content budget');
assert(/td\s*\{\s*padding:\s*0 3px/.test(css) && /\[data-column-type="date"\],[^}]+\[data-column-type="description"\]\s*\{[^}]*padding-right:\s*6px[^}]*padding-left:\s*6px/s.test(css), 'mobile money cells lose excess chrome while accepted date and description spacing remains unchanged');
assert(/\[data-column-type="numeric"\]\s*\{[^}]*padding-right:\s*1px[^}]*padding-left:\s*1px/.test(css), 'static debit and credit amounts retain only the chrome needed to separate cell content');
assert(!/data-column-key="balance"\][^{]+\.table-input\s*\{[^}]*width:\s*100%/s.test(css), 'balance cannot override its exact-column input budget with a cyclic 100% width');
assert(view.includes("table.dataset.sizing = 'semantic-content'") && view.includes('th.dataset.columnType = columnTypes.get(column)') && view.includes('cell.dataset.columnType = columnTypes.get(question.table.columns[columnIndex])'), 'renderer exposes content-derived semantic types on ordinary headers and cells');
assert(view.includes("if (column === 'life') columnTypes.set(column, 'years')"), 'life receives the years semantic type before generic numeric sizing');
assert(view.includes('th.dataset.columnKey = column') && view.includes('cell.dataset.columnKey = question.table.columns[columnIndex]'), 'semantic column keys remain the selector authority');
assert(!/answer-table[^\n{]*:nth-child[^\n{]*(?:date|description|quantity|unitPrice|amount|openingAccumulated|currentDepreciation|closingBookValue)/.test(css), 'ordinary sizing never guesses meaning from column position');
assert(!/\.answer-table th:first-child,[^{]+\{[^}]*min-width:\s*110px/s.test(css), 'sticky first columns use semantic content instead of a global 110px floor');
assert(/\.table-question-wrap\s*\{[^}]*overflow-x:\s*auto/.test(css), 'the existing single wrapper scrolls content-required wide tables');
assert(/\[data-sticky-context="true"\]\s*\{[^}]*position:\s*sticky[^}]*left:\s*var\(--sticky-left\)/s.test(css), 'semantic context columns use rendered cumulative sticky offsets');
assert(view.includes("const keys = ['description','quantity']") && view.includes("--sticky-left") && view.includes('getBoundingClientRect().width'), 'description and quantity sticky offsets derive from rendered widths without pinning date');
assert(view.includes("--column-input-ch") && view.includes('Math.min(9, Math.max(4'), 'renderer supplies exact-question numeric input character budgets with bounded fallback safety');
assert(/\.eight-column-worksheet\s*\{[^}]*width:\s*max\(100%,\s*1320px\)/.test(css), 'eight-column worksheets retain their separate wide-canvas design');
const numericFloor = 11 * 8 + 26; const fixedAssetMinimum = fixedKeys.reduce((sum, key) => sum + (['acquisitionCost','life','openingAccumulated','currentDepreciation','closingBookValue'].includes(key) ? numericFloor : Math.max(8 * 16, glyphs(label(key)) * 16)), 0);
for (const viewport of [320, 375, 390, 430]) assert(fixedAssetMinimum > viewport && /overflow-x:\s*auto/.test(css), `${viewport}px: fixed-asset content remains wider than its viewport and horizontally scrollable`);
const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]);
assert(accountWidth >= 240 && /\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'horizontal journal entry integrity remains protected');
for (const viewport of [320, 375, 390, 430]) assert(accountWidth * 2 + 120 * 2 > viewport, `${viewport}px journals scroll rather than collapse four fields`);
console.log(`mobile layout semantic audit: ${questions.length} questions, ${ordinary.length} ordinary tables, ${columns.length} unique columns (320/375/390/430): ok`);
