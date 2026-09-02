'use strict';
const { loadQuestions } = require('./audit-matrix');
const { auditExplanations, visibleLength, specificLength, journalIssues, tableIssues } = require('./audit-explanations');
const questions = Object.values(loadQuestions());
const byType = {}; const typeQuality = {};
for (const question of questions) {
  byType[question.type] = (byType[question.type] || 0) + 1;
  const issues = question.type === 'journal' ? journalIssues(question) : tableIssues(question);
  typeQuality[question.type] ||= { pass:0, fail:0 }; typeQuality[question.type][issues.length ? 'fail' : 'pass'] += 1;
}
const journal = questions.filter(question => question.type === 'journal');
const norm = value => String(value ?? '').replace(/[\s,，円]/gu, '');
const rows = question => [...question.answer.debit, ...question.answer.credit];
const accountCoverage = journal.filter(question => rows(question).every(row => question.explanation.includes(row.account))).length;
const amountCoverage = journal.filter(question => rows(question).every(row => norm(question.explanation).includes(norm(row.amount)))).length;
const reasoningCoverage = journal.filter(question => journalIssues(question).every(issue => !issue.includes('理由'))).length;
const lengths = questions.map(question => visibleLength(question.explanation)); const audit = auditExplanations(Object.fromEntries(questions.map(question => [question.id, question])));
const report = { total:questions.length, byType, explanationLength:{ min:Math.min(...lengths), max:Math.max(...lengths), mean:Number((lengths.reduce((a,b)=>a+b,0)/lengths.length).toFixed(1)) }, specificity:{ threshold:100, pass:questions.filter(question => specificLength(question) >= 100).length, fail:questions.filter(question => specificLength(question) < 100).length }, journal:{ total:journal.length, accountCoverage:`${accountCoverage}/${journal.length}`, amountCoverage:`${amountCoverage}/${journal.length}`, debitCreditReasoning:`${reasoningCoverage}/${journal.length}` }, tableAnswerValueCoverage:`${questions.filter(question => question.type !== 'journal' && tableIssues(question).every(issue => !issue.startsWith('回答「'))).length}/${questions.filter(question => question.type !== 'journal').length}`, typeQuality, duplicateProseUnits:audit.duplicatePhrases.length, pass:audit.ok ? questions.length : questions.length - new Set([...audit.journalQuality,...audit.tableQuality,...audit.lengthViolations,...audit.insufficientSpecificText].map(row=>row.id)).size, fail:audit.ok ? 0 : undefined, ok:audit.ok };
console.log(JSON.stringify(report, null, 2)); if (!audit.ok) process.exitCode = 1;
