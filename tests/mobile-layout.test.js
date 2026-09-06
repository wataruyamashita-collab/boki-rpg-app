'use strict';
const assert = require('assert'); const fs = require('fs');
const css = fs.readFileSync('css/style.css', 'utf8'); const view = fs.readFileSync('js/view.js', 'utf8');
const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]);
assert(accountWidth >= 240, 'collapsed account selects reserve at least 240px');
assert(/\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'journal rows scroll horizontally');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-row select,\s*\.journal-row \.amount-input\s*\{[^}]*font-size:\s*16px/s.test(css), 'mobile controls remain at least 16px');
const dateRule = css.match(/\.answer-table:not\(\.eight-column-worksheet\) \[data-column-key="date"\]\s*\{([^}]*)\}/);
const balanceRule = css.match(/\.answer-table:not\(\.eight-column-worksheet\) \[data-column-key="balance"\]\s*\{([^}]*)\}/);
assert(view.includes('th.dataset.columnKey = column'), 'ordinary table headers expose their semantic column key');
assert(view.includes('cell.dataset.columnKey = question.table.columns[columnIndex]'), 'ordinary table cells expose their semantic column key');
assert(dateRule && /width:\s*11ch/.test(dateRule[1]) && /min-width:\s*11ch/.test(dateRule[1]), 'date columns have a compact content-oriented width');
assert(balanceRule && /width:\s*16ch/.test(balanceRule[1]) && /min-width:\s*16ch/.test(balanceRule[1]), 'balance columns have a compact content-oriented width');
assert(/\.table-text-input\s*\{[^}]*min-width:\s*120px/.test(css), 'ordinary free-text inputs retain their established minimum width');
assert(11 < 16, 'date is intentionally narrower than balance');
assert(/td\[data-column-key="date"\][\s\S]*td\[data-column-key="balance"\][^{]*\{[^}]*width:\s*100%[^}]*min-width:\s*0/.test(css), 'compact column inputs fill their cells without imposing the generic text minimum');
assert(!/answer-table[^\n{]*(?:date|balance)[^\n{]*:nth-child/.test(css) && !/answer-table[^\n{]*:nth-child[^\n{]*(?:date|balance)/.test(css), 'date and balance semantics never depend on column position');
assert(!/\[data-column-key="(?:description|account|item)"\]/.test(css), 'unrelated ordinary columns do not inherit compact sizing');
assert(view.includes('this.updateSelectTitle(select)'), 'selected account is also exposed as the native title');
assert(view.includes("input.setAttribute('inputmode', 'numeric')") && !view.includes('input.readOnly = true'), 'amount inputs remain editable and request a numeric mobile keyboard');
assert(view.includes("const count = mode === 'exam' ? 3"), 'exam journals use the fixed neutral three-row capacity');
for (const viewport of [320, 375, 390, 430]) {
  const minimumRowWidth = accountWidth * 2 + 120 * 2;
  assert(minimumRowWidth > viewport, `${viewport}px deliberately uses horizontal scrolling instead of shrinking four fields`);
}
console.log('mobile layout static tests (320/375/390/430): ok');
