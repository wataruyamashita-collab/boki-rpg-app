'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { loadQuestions } = require('../scripts/audit-matrix');
const { auditExplanations } = require('../scripts/audit-explanations');
const questions = loadQuestions();
for (const mutate of [
  q => { q.J001.explanation = q.J001.explanation.replace(/【この問題の仕訳】[\s\S]*/u, ''); },
  q => { q.J045.explanation = q.J045.explanation.replace(/【金額の計算】[^\n]*/u, ''); },
  q => { q.L041.explanation += ' 元丁113円'; },
  q => { q.J017.explanation += ' 現金過不足は資産です。'; }
]) { const clone = structuredClone(questions); mutate(clone); assert.strictEqual(auditExplanations(clone).ok, false, 'cross-layer content mutation must be killed'); }
const view = fs.readFileSync('js/view.js', 'utf8');
assert(view.includes("semanticType === 'amount' || semanticType === 'unitPrice'"), 'comparison formatter must be semantic-driven');
assert(!view.includes("inputType === 'amount' || semanticType === 'amount'"), 'input control kind must not determine displayed unit');
const domainSandbox = { window:{} }; vm.runInNewContext(fs.readFileSync('data/accounting-domain.js', 'utf8'), domainSandbox);
assert.strictEqual(domainSandbox.window.AccountingDomain.accountType('現金過不足'), 'temporary');
assert.strictEqual(domainSandbox.window.AccountingDomain.accountType('損益'), 'closing');
const sectionCounts = questions.F002.table.rows.filter(row => ['資産','負債','純資産'].includes(row.section)).reduce((counts, row) => ({ ...counts, [row.section]:(counts[row.section] || 0) + 1 }), {});
for (const section of ['資産','負債','純資産']) assert(sectionCounts[section] > 0, `${section} section contract must remain present`);
const brokenBalanceSheet = structuredClone(questions.F002); brokenBalanceSheet.table.rows.forEach(row => { if (row.section === '純資産') row.section = '負債'; });
assert(!brokenBalanceSheet.table.rows.some(row => row.section === '純資産'), 'B/S section mutation must be observable');
assert(view.includes('section.textContent = `${row.section}の部`'), 'renderer must derive each section heading from row domain data');
console.log('cross-layer mutation tests: ok');
