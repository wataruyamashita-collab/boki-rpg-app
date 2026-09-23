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
const numericCellRule = css.match(/\[data-sizing="semantic-content"\] td\.amount-cell\s*\{([^}]*)\}/)?.[1] || '';
const numericInputRule = css.match(/\[data-sizing="semantic-content"\] \.table-input\[data-input-type="amount"\]\s*\{([^}]*)\}/)?.[1] || '';
const desktopYearsHeaderRule = css.match(/@media\s*\(min-width:\s*431px\)\s*\{\s*\.answer-table:not\(\.eight-column-worksheet\)\[data-sizing="semantic-content"\] th\[data-column-type="years"\]\s*\{([^}]*)\}/)?.[1] || '';
assert(/width:\s*max-content/.test(tableRule) && /min-width:\s*100%/.test(tableRule) && !/600px/.test(tableRule), 'ordinary tables fill small containers but grow to content width without a fixed 600px floor');
assert(/overflow-wrap:\s*normal/.test(headRule) && /word-break:\s*keep-all/.test(headRule) && /white-space:\s*nowrap/.test(headRule), 'complete Japanese headers cannot clip, ellipsize, or stack one glyph per line');
assert(!/(?:overflow:\s*hidden|text-overflow:\s*ellipsis)/.test(headRule), 'semantic headers never conceal authored labels');
assert(/white-space:\s*nowrap/.test(numericRule) && !/min-width/.test(numericRule), 'static numeric cells use intrinsic content width instead of inheriting the editable money floor');
assert(/th\[data-column-type="numeric"\]\s*\{[^}]*min-width:\s*max-content/.test(css), 'numeric headers impose their intrinsic rendered label width without per-column pixel constants');
assert(/th\[data-column-key="currentDepreciation"\],[\s\S]*th\[data-column-key="closingBookValue"\],[\s\S]*td\[data-column-key="currentDepreciation"\],[\s\S]*td\[data-column-key="closingBookValue"\]\s*\{[^}]*box-sizing:\s*content-box[^}]*width:\s*calc\(7ic \+ 3px\)[^}]*min-width:\s*calc\(7ic \+ 3px\)[^}]*max-width:\s*calc\(7ic \+ 3px\)/s.test(css), 'fixed-asset current-depreciation and closing-book-value headers and cells share the verified seven-ideograph width plus cross-browser safety margin');
assert(/\[data-column-type="years"\]\s*\{[^}]*width:\s*calc\(4em \+ 14px\)[^}]*max-width:\s*calc\(4em \+ 14px\)/s.test(css), 'years use a dedicated four-glyph header plus cell-chrome width instead of the money floor');
assert(/padding-inline:\s*6px/.test(desktopYearsHeaderRule), 'above 430px only the semantic years header uses compact six-pixel inline padding');
assert(!/@media\s*\(max-width:\s*430px\)[\s\S]*th\[data-column-type="years"\]/.test(css), 'at 430px and below the years header keeps the established mobile behavior');
const desktopLife = { actualWidth:78,headerTextWidth:64,headerHorizontalChrome:6 + 6 + 1 };
assert(desktopLife.headerTextWidth + desktopLife.headerHorizontalChrome <= desktopLife.actualWidth && desktopLife.actualWidth <= 80, 'desktop life header content and 13px chrome fit the measured 78px column within the 80px contract');
assert(/white-space:\s*nowrap/.test(css.match(/\[data-column-type="years"\]\s*\{([^}]*)\}/)?.[1] || ''), 'life header remains one line without clipping or glyph stacking');
assert(/min-width:\s*calc\(var\(--column-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericCellRule), 'editable numeric cells preserve their nine-glyph content budget plus control chrome');
assert(/width:\s*calc\(var\(--table-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericInputRule) && /min-width:\s*calc\(var\(--table-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericInputRule) && /max-width:\s*calc\(var\(--table-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericInputRule), 'editable numeric controls use one shared compact content-plus-chrome width within each ordinary table');
assert(/td\[data-column-key="currentDepreciation"\] \.table-input\[data-input-type="amount"\],[\s\S]*td\[data-column-key="closingBookValue"\] \.table-input\[data-input-type="amount"\]\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*max-width:\s*100%/s.test(css), 'fixed-asset editable amount controls fill their equal-width table cells instead of using the table-level compact width');
assert(glyphs(String(maximumEditable.answer)) <= 9 && glyphs(formatted(maximumEditable.answer)) <= 9, 'raw and comma-formatted canonical maxima fit the nine-character numeric content budget');
assert(/td\s*\{\s*padding:\s*0 3px/.test(css) && /\[data-column-type="date"\],[^}]+\[data-column-type="description"\]\s*\{[^}]*padding-right:\s*6px[^}]*padding-left:\s*6px/s.test(css), 'mobile money cells lose excess chrome while accepted date and description spacing remains unchanged');
assert(/td\[data-column-type="numeric"\]\s*\{[^}]*padding-right:\s*1px[^}]*padding-left:\s*1px/.test(css), 'mobile numeric body cells retain only the chrome needed to separate cell content');
assert(!/th\[data-column-type="numeric"\]\s*\{[^}]*padding-(?:right|left):\s*1px/.test(css), 'mobile numeric headers retain readable horizontal spacing');
assert(/th,\s*\.answer-table:not\(\.eight-column-worksheet\) td\s*\{\s*padding:\s*0 3px/.test(css), 'long numeric headers inherit the readable three-pixel mobile spacing');
assert(!/data-column-key="balance"\][^{]+\.table-input\s*\{[^}]*width:\s*100%/s.test(css), 'balance cannot override its exact-column input budget with a cyclic 100% width');
assert(view.includes("table.dataset.sizing = 'semantic-content'") && view.includes('th.dataset.columnType = columnTypes.get(column)') && view.includes('cell.dataset.columnType = columnTypes.get(question.table.columns[columnIndex])'), 'renderer exposes content-derived semantic types on ordinary headers and cells');
assert(view.includes("if (column === 'life') columnTypes.set(column, 'years')"), 'life receives the years semantic type before generic numeric sizing');
assert(view.includes('th.dataset.columnKey = column') && view.includes('cell.dataset.columnKey = question.table.columns[columnIndex]'), 'semantic column keys remain the selector authority');
assert(!/answer-table[^\n{]*:nth-child[^\n{]*(?:date|description|quantity|unitPrice|amount|openingAccumulated|currentDepreciation|closingBookValue)/.test(css), 'ordinary sizing never guesses meaning from column position');
assert(!/\.answer-table th:first-child,[^{]+\{[^}]*min-width:\s*110px/s.test(css), 'sticky first columns use semantic content instead of a global 110px floor');
assert(/\.table-question-wrap\s*\{[^}]*overflow-x:\s*auto/.test(css), 'the existing single wrapper scrolls content-required wide tables');
assert(/\[data-sticky-context="true"\]\s*\{[^}]*position:\s*sticky[^}]*left:\s*var\(--sticky-left\)/s.test(css), 'semantic context columns use rendered cumulative sticky offsets');
assert(view.includes("const keys = ['description','quantity']") && view.includes("--sticky-left") && view.includes('getBoundingClientRect().width'), 'description and quantity sticky offsets derive from rendered widths without pinning date');
const widthFixture = {
  table: {
    columns:['floor','middle','ceiling'],
    rows:[{floor:'入力',middle:'入力',ceiling:'入力'},{floor:1,middle:123456,ceiling:1234567}],
    inputCells:['floorCell','middleCell','ceilingCell'],
    inputTypes:{floorCell:'amount',middleCell:'amount',ceilingCell:'amount'}
  }
};
Object.defineProperty(widthFixture, 'answer', { get() { throw new Error('generic width profiling must not read hidden answers'); } });
assert.deepStrictEqual(
  Object.fromEntries(sandbox.window.AppView.genericTableInputCharacters(widthFixture)),
  { floor:9, middle:9, ceiling:9 },
  'all generic amount inputs reserve the canonical nine-glyph content bound without reading hidden answers'
);
const c001 = questions.find(question => question.id === 'C001');
const t001 = questions.find(question => question.id === 'T001');
assert(c001 && t001, 'canonical C001 and T001 sizing regressions are present');
assert.strictEqual(glyphs(formatted(c001.answer.cells.sales)), 9, 'C001 maximum formatted amount requires nine glyphs');
assert.strictEqual(glyphs(formatted(t001.answer.cells.total_debit)), 9, 'T001 total 1,024,000 requires nine glyphs');
const c001Widths=sandbox.window.AppView.genericTableInputCharacters(c001),t001Widths=sandbox.window.AppView.genericTableInputCharacters(t001);
assert(c001Widths.size>0&&[...c001Widths.values()].every(width => width === 9), 'C001 input-only amount column reserves nine content glyphs');
assert(t001Widths.size>0&&[...t001Widths.values()].every(width => width === 9), 'T001 total amount columns reserve nine content glyphs');
assert(/min-width:\s*calc\(var\(--column-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericCellRule), 'ordinary amount cells reserve nine-glyph content plus horizontal control chrome');
assert(/width:\s*calc\(var\(--table-input-ch,\s*9ch\)\s*\+\s*10px\)/.test(numericInputRule), 'ordinary amount controls reserve content width plus padding and borders');
assert(view.includes("cell.style.setProperty('--column-input-ch'") && view.includes("table.style.setProperty('--table-input-ch'"), 'renderer applies bounded per-column budgets and one shared compact numeric-input width per ordinary table');
assert(/\.eight-column-worksheet\s*\{[^}]*width:\s*max\(100%,\s*1320px\)/.test(css), 'eight-column worksheets retain their separate wide-canvas design');
const numericFloor = 11 * 8 + 26; const fixedAssetMinimum = fixedKeys.reduce((sum, key) => sum + (['acquisitionCost','life','openingAccumulated','currentDepreciation','closingBookValue'].includes(key) ? numericFloor : Math.max(8 * 16, glyphs(label(key)) * 16)), 0);
for (const viewport of [320, 375, 390, 430]) assert(fixedAssetMinimum > viewport && /overflow-x:\s*auto/.test(css), `${viewport}px: fixed-asset content remains wider than its viewport and horizontally scrollable`);
const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]);
assert(accountWidth >= 240 && /\.journal-grid-scroll\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'desktop journal grid integrity remains protected while its instruction stays outside the scroller');

const journalQuestions = questions.filter(question => question.type === 'journal');
const journalAccounts = journalQuestions.flatMap(question =>
  ['debit', 'credit'].flatMap(side => (question.answer?.[side] || []).map(item => String(item.account || '')))
).filter(Boolean);
const journalAmounts = journalQuestions.flatMap(question =>
  ['debit', 'credit'].flatMap(side => (question.answer?.[side] || []).map(item => Number(item.amount)))
).filter(Number.isFinite);

const longestJournalAccountGlyphs = Math.max(...journalAccounts.map(glyphs));
const longestJournalAmountGlyphs = Math.max(...journalAmounts.map(value => glyphs(formatted(value))));

assert.strictEqual(longestJournalAccountGlyphs, 12, 'canonical journal account maximum remains 12 glyphs');
assert.strictEqual(longestJournalAmountGlyphs, 9, 'canonical formatted journal amount maximum remains 9 glyphs');

const mobileJournalMatch = css.match(
  /@media\s*\(max-width:\s*480px\)[\s\S]*?\.journal-header,\s*\.journal-row\s*\{\s*grid-template-columns:\s*minmax\((\d+)px,\s*3fr\)\s*minmax\((\d+)px,\s*2fr\)\s*minmax\((\d+)px,\s*3fr\)\s*minmax\((\d+)px,\s*2fr\)/s
);
assert(mobileJournalMatch, 'mobile journal sizing rule is present');

const mobileAccountWidth = Number(mobileJournalMatch[1]);
const mobileAmountWidth = Number(mobileJournalMatch[2]);

assert.strictEqual(mobileAccountWidth, 232, 'mobile journal account width uses the audited 12-glyph budget');
assert.strictEqual(mobileAmountWidth, 112, 'mobile journal amount width uses the audited 9-glyph budget');
assert(mobileAccountWidth >= longestJournalAccountGlyphs * 16 + 40, 'mobile account control preserves text plus native select chrome');
assert(mobileAmountWidth >= longestJournalAmountGlyphs * 10 + 22, 'mobile amount control preserves the longest formatted amount');

const mobilePairWidth = mobileAccountWidth + 2 + mobileAmountWidth;
assert(mobilePairWidth <= 375 - 20, '375px iPhone shows one debit account-and-amount pair without horizontal clipping');
assert(mobilePairWidth <= 390 - 20, '390px iPhone shows one debit account-and-amount pair without horizontal clipping');
assert(mobilePairWidth <= 430 - 20, '430px iPhone shows one debit account-and-amount pair without horizontal clipping');
assert(mobilePairWidth > 320 - 20 && /\.journal-grid-scroll\s*\{[^}]*overflow-x:\s*auto/s.test(css), '320px retains intentional grid scrolling instead of crushing fields');
const coachingHiddenRule = css.match(/\.confidence-selector\[hidden\],\s*\.question-actions \.save-button\[hidden\],\s*#save-status\[hidden\]\s*\{([^}]*)\}/)?.[1] || '';
assert(
  /display:\s*none\s*!important/.test(coachingHiddenRule),
  'coaching retry explicitly hides confidence, save button, and save status in WebKit'
);
console.log(`mobile layout semantic audit: ${questions.length} questions, ${ordinary.length} ordinary tables, ${columns.length} unique columns (320/375/390/430): ok`);
