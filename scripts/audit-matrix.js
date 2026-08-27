'use strict';

const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
};

const hash = value => `sha256:${crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}`;

const evidenceStamp = question => ({
  sourceHash: hash({
    id: question.id,
    type: question.type,
    category: question.category,
    chapter: question.chapter,
    scene: question.scene,
    story: question.story,
    question: question.question,
    materials: question.materials,
    table: question.table
  }),
  answerSchemaHash: hash({
    type: question.type,
    inputCells: question.table?.inputCells,
    inputTypes: question.table?.inputTypes,
    inputMetadata: question.table?.inputMetadata,
    answerShape: stable(Object.fromEntries(Object.keys(question.answer?.cells || question.answer || {}).map(key => [key, typeof (question.answer?.cells || question.answer)[key]])))
  })
});

const loadQuestions = () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('data/questions.js', 'utf8'), sandbox, { filename: 'data/questions.js' });
  return sandbox.window.QuestionData;
};

const verifyMatrix = (matrix, questions) => {
  const findings = matrix.rows.map(row => {
    const question = questions[row.id];
    if (!question) return { id: row.id, status: 'STALE', reasons: ['QUESTION_MISSING'] };
    const current = evidenceStamp(question);
    const reasons = [];
    if (row.sourceHash !== current.sourceHash) reasons.push('SOURCE_CHANGED');
    if (row.answerSchemaHash !== current.answerSchemaHash) reasons.push('ANSWER_SCHEMA_CHANGED');
    if (row.type !== question.type || row.category !== question.category || row.chapter !== question.chapter) reasons.push('IDENTITY_CHANGED');
    return { id: row.id, status: reasons.length ? 'STALE' : 'CURRENT', reasons };
  });
  const represented = new Set(matrix.rows.map(row => row.id));
  for (const id of Object.keys(questions)) if (!represented.has(id)) findings.push({ id, status: 'STALE', reasons: ['REPORT_ROW_MISSING'] });
  return { ok: findings.every(item => item.status === 'CURRENT'), total: findings.length, stale: findings.filter(item => item.status === 'STALE'), findings };
};

if (require.main === module) {
  const result = verifyMatrix(JSON.parse(fs.readFileSync('reports/question-audit-matrix.json', 'utf8')), loadQuestions());
  console.log(JSON.stringify({ ok: result.ok, total: result.total, staleCount: result.stale.length, stale: result.stale }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { evidenceStamp, loadQuestions, verifyMatrix };
