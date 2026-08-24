'use strict';
const fs = require('fs');
const vm = require('vm');

function structureSignature(question) {
  return JSON.stringify({
    type: question.type,
    format: question.format || '',
    columns: question.table?.columns || [],
    materialShapes: (question.materials || []).map(row => Object.keys(row).sort()),
    cellCount: question.table?.inputCells?.length || 0,
    operations: [...new Set((JSON.stringify(question).match(/月割|差額補充|売却|訂正|消費税|貸借|元丁|満期日/g) || []))].sort()
  });
}
function demonstratesTransfer(matched) {
  const signatures = new Set(matched.map(structureSignature));
  const questionForms = new Set(matched.map(q => String(q.question).replace(/[\d０-９,，年月日円%％]+/g, '#')));
  return matched.length >= 2 && signatures.size >= 2 && questionForms.size >= 2;
}
function evaluateRows(questions) {
  const serialized = question => JSON.stringify(question);
  const rows = [
    ['仕訳', q => q.type === 'journal', 20], ['仕訳帳', q => q.category === '仕訳帳', 1],
    ['総勘定元帳', q => /総勘定元帳/.test(q.category), 1], ['受取手形記入帳', q => q.category === '受取手形記入帳', 1],
    ['支払手形記入帳', q => q.category === '支払手形記入帳', 1],
    ['固定資産（月割・売却）', q => /固定資産台帳/.test(q.category) && /月割/.test(serialized(q)) && /売却/.test(serialized(q)), 1],
    ['年利率・月割利息', q => /年利/.test(serialized(q)) && /月/.test(serialized(q)), 1],
    ['決算整理', q => ['worksheet','comprehensive'].includes(q.type), 10], ['P/L・B/S統合', q => q.format === 'exam-question-3', 3],
    ['初見転移', q => ['review','transfer'].includes(q.timelineRole) && q.materials?.length, 20]
  ];
  return rows.map(([topic,predicate,minimum]) => {
    const matched=questions.filter(predicate); const practical=matched.filter(q => q.materials?.length && q.table?.inputCells?.length);
    const transfer=demonstratesTransfer(matched); const grade=matched.length>=minimum && practical.length>=Math.min(minimum,matched.length) ? (transfer?'A':'B') : matched.length?'C':'D';
    return {officialTopic:topic,questions:matched.length,valid:matched.filter(q=>q.answer).length,practical:practical.length,firstTimeTransfer:transfer?'YES':'NO',learnability:grade,pass:grade==='A'};
  });
}
if (require.main === module) {
  const sandbox={window:{}}; vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox);
  const matrix=evaluateRows(Object.values(sandbox.window.QuestionData)); console.table(matrix);
  const failures=matrix.filter(row=>!row.pass); console.log(`Exam Readiness Audit: ${failures.length?'FAIL':'PASS'} (${matrix.length-failures.length}/${matrix.length})`);
  if (failures.length) { console.error(`不足: ${failures.map(row=>`${row.officialTopic}(${row.learnability})`).join('、')}`); process.exitCode=1; }
}
module.exports={structureSignature,demonstratesTransfer,evaluateRows};
