'use strict';
const assert = require('assert');
const { loadQuestions } = require('../scripts/audit-matrix');
const { auditExplanations } = require('../scripts/audit-explanations');
const fresh = () => structuredClone(loadQuestions());
const mustFail = (name, mutate, expectedId) => {
  const questions = fresh(); mutate(questions);
  const result = auditExplanations(questions);
  assert.strictEqual(result.ok, false, `${name}: audit must fail closed`);
  assert([...result.journalQuality, ...result.tableQuality, ...result.semanticErrors, ...result.lengthViolations, ...result.insufficientSpecificText].some(entry => entry.id === expectedId), `${name}: ${expectedId} must be reported`);
};
mustFail('generic J149', q => { q.J149.explanation = '問題文を確認して正しい仕訳を完成させます。'; }, 'J149');
mustFail('missing debit account', q => { q.J149.explanation = q.J149.explanation.replaceAll('仕入', '商品購入科目'); }, 'J149');
mustFail('missing credit account', q => { q.J149.explanation = q.J149.explanation.replaceAll('支払手形', '手形債務科目'); }, 'J149');
mustFail('missing answer amount', q => { q.J149.explanation = q.J149.explanation.replaceAll('60,000円', '取引金額').replaceAll('60000', '取引金額'); }, 'J149');
mustFail('missing side reasoning', q => { q.J149.explanation = q.J149.explanation.replace(/【この問題への当てはめ】[\s\S]*?【この問題の仕訳】/u, '【この問題の仕訳】'); }, 'J149');
mustFail('generic F003', q => { q.F003.explanation = '資産から負債と資本金を差し引けば求められます。'; }, 'F003');
mustFail('missing F003 calculation', q => { q.F003.explanation = q.F003.explanation.replace(/【計算と転記】[\s\S]*?【検算】/u, '【検算】'); }, 'F003');
mustFail('generic T039', q => { q.T039.explanation = '借方と貸方を合計すると同額です。'; }, 'T039');
mustFail('Mutation A: quantity rendered as yen', q => { q.L004.explanation = q.L004.explanation.replace('数量44個', '数量44円'); }, 'L004');
mustFail('Mutation B: useful life rendered as yen', q => { q.L005.explanation = q.L005.explanation.replace('耐用年数5年', '耐用年数5円'); }, 'L005');
mustFail('Mutation C: folio rendered as yen', q => { q.L041.explanation += '元丁113円。'; }, 'L041');
mustFail('Mutation D: internal ID exposed', q => { q.L005.explanation += ' closingBookValue'; }, 'L005');
mustFail('Mutation E: profit-and-loss classified as equity', q => { q.J050.explanation += '損益は純資産です。'; }, 'J050');
mustFail('Mutation F: cash over-short classified as asset', q => { q.J017.explanation += '現金過不足は資産です。'; }, 'J017');
mustFail('Mutation G: J045 calculation removed', q => { q.J045.explanation = q.J045.explanation.replace(/【金額の計算】[^\n]*/u, ''); }, 'J045');
mustFail('Mutation H: T039 arithmetic removed', q => { q.T039.explanation = q.T039.explanation.replace(/【計算と転記】[^\n]*/u, '【計算と転記】合計します。'); }, 'T039');
mustFail('Mutation I: ledger subtype mismatch', q => { q.L035.explanation = '【使用する資料】帳簿を見ます。\n【計算と転記】前残に増加を足し、減少を引きます。'; }, 'L035');
{
  const questions = fresh(); for (const q of Object.values(questions)) if (q.id !== 'F002') q.explanation = `${q.id}の問題では、問題文と表の条件を確認し、適切な勘定科目と金額を判断して正しい答えを完成させます。`;
  const result = auditExplanations(questions); const failures = new Set([...result.journalQuality, ...result.tableQuality, ...result.lengthViolations, ...result.insufficientSpecificText].map(entry => entry.id));
  assert(failures.size >= 299, `299-question generic mutation must produce at least 299 failures, got ${failures.size}`);
}
console.log('explanation audit regression tests: ok');
