'use strict';
const assert = require('assert');
const { loadQuestions } = require('../scripts/audit-matrix');
const { auditExplanations } = require('../scripts/audit-explanations');
const fresh = () => structuredClone(loadQuestions());
const mustFail = (name, mutate, expectedId) => {
  const questions = fresh(); mutate(questions);
  const result = auditExplanations(questions);
  assert.strictEqual(result.ok, false, `${name}: audit must fail closed`);
  assert([...result.journalQuality, ...result.tableQuality, ...result.lengthViolations, ...result.insufficientSpecificText].some(entry => entry.id === expectedId), `${name}: ${expectedId} must be reported`);
};
mustFail('generic J149', q => { q.J149.explanation = '問題文を確認して正しい仕訳を完成させます。'; }, 'J149');
mustFail('missing debit account', q => { q.J149.explanation = q.J149.explanation.replaceAll('仕入', '商品購入科目'); }, 'J149');
mustFail('missing credit account', q => { q.J149.explanation = q.J149.explanation.replaceAll('支払手形', '手形債務科目'); }, 'J149');
mustFail('missing answer amount', q => { q.J149.explanation = q.J149.explanation.replaceAll('60,000円', '取引金額').replaceAll('60000', '取引金額'); }, 'J149');
mustFail('missing side reasoning', q => { q.J149.explanation = q.J149.explanation.replace(/【この問題への当てはめ】[\s\S]*?【この問題の仕訳】/u, '【この問題の仕訳】'); }, 'J149');
mustFail('generic F003', q => { q.F003.explanation = '資産から負債と資本金を差し引けば求められます。'; }, 'F003');
mustFail('missing F003 calculation', q => { q.F003.explanation = q.F003.explanation.replace(/【計算と転記】[\s\S]*?【検算】/u, '【検算】'); }, 'F003');
mustFail('generic T039', q => { q.T039.explanation = '借方と貸方を合計すると同額です。'; }, 'T039');
{
  const questions = fresh(); for (const q of Object.values(questions)) if (q.id !== 'F002') q.explanation = `${q.id}の問題では、問題文と表の条件を確認し、適切な勘定科目と金額を判断して正しい答えを完成させます。`;
  const result = auditExplanations(questions); const failures = new Set([...result.journalQuality, ...result.tableQuality, ...result.lengthViolations, ...result.insufficientSpecificText].map(entry => entry.id));
  assert(failures.size >= 299, `299-question generic mutation must produce at least 299 failures, got ${failures.size}`);
}
console.log('explanation audit regression tests: ok');
