'use strict';
const assert = require('assert'); const fs = require('fs');
const css = fs.readFileSync('css/style.css', 'utf8'); const view = fs.readFileSync('js/view.js', 'utf8');
const accountWidth = Number(css.match(/\.journal-row\s*\{[^}]*minmax\((\d+)px, 3fr\)/s)?.[1]);
assert(accountWidth >= 240, 'collapsed account selects reserve at least 240px');
assert(/\.journal-entry-area\s*\{[^}]*overflow-x:\s*auto/s.test(css), 'journal rows scroll horizontally');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-row select,\s*\.journal-row \.amount-input\s*\{[^}]*font-size:\s*16px/s.test(css), 'mobile controls remain at least 16px');
assert(view.includes('this.updateSelectTitle(select)'), 'selected account is also exposed as the native title');
for (const viewport of [320, 375, 390, 430]) {
  const minimumRowWidth = accountWidth * 2 + 120 * 2;
  assert(minimumRowWidth > viewport, `${viewport}px deliberately uses horizontal scrolling instead of shrinking four fields`);
}
console.log('mobile layout static tests (320/375/390/430): ok');
