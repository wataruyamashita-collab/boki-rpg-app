'use strict';
const fs = require('fs');
const vm = require('vm');
const sandbox = { window:{} };
vm.runInNewContext(fs.readFileSync('data/questions.js', 'utf8'), sandbox);
const questions = Object.values(sandbox.window.QuestionData);
const serialized = question => JSON.stringify(question);
const rows = [
  ['仕訳', q => q.type === 'journal', 20],
  ['仕訳帳', q => q.category === '仕訳帳', 1],
  ['総勘定元帳', q => /総勘定元帳/.test(q.category), 1],
  ['受取手形記入帳', q => q.category === '受取手形記入帳', 1],
  ['支払手形記入帳', q => q.category === '支払手形記入帳', 1],
  ['固定資産（月割・売却）', q => /固定資産台帳/.test(q.category) && /月割/.test(serialized(q)) && /売却/.test(serialized(q)), 1],
  ['年利率・月割利息', q => /年利/.test(serialized(q)) && /月/.test(serialized(q)), 1],
  ['決算整理', q => ['worksheet','comprehensive'].includes(q.type), 10],
  ['P/L・B/S統合', q => q.format === 'exam-question-3', 3],
  ['初見転移', q => q.learningRole === 'transfer', 20]
];
const matrix = rows.map(([topic, predicate, minimum]) => {
  const matched = questions.filter(predicate); const practical = matched.filter(q => q.materials?.length && q.table?.inputCells?.length);
  const transfer = new Set(matched.map(q => q.variantGroup)).size > 1 || topic === '初見転移';
  const grade = matched.length >= minimum && practical.length ? (transfer ? 'A' : 'B') : matched.length ? 'C' : 'D';
  return { officialTopic:topic, questions:matched.length, valid:matched.filter(q => q.answer).length, practical:practical.length, firstTimeTransfer:transfer ? 'YES' : 'NO', learnability:grade, pass:matched.length >= minimum };
});
console.table(matrix);
const failures = matrix.filter(row => !row.pass);
console.log(`Exam Readiness Audit: ${failures.length ? 'FAIL' : 'PASS'} (${matrix.length - failures.length}/${matrix.length})`);
if (failures.length) { console.error(`不足: ${failures.map(row => row.officialTopic).join('、')}`); process.exitCode = 1; }

