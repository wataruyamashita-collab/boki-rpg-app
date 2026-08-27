'use strict';

const assert = require('assert');
const fs = require('fs');
const { evidenceStamp, loadQuestions, verifyMatrix } = require('../scripts/audit-matrix');

const matrix = JSON.parse(fs.readFileSync('reports/question-audit-matrix.json', 'utf8'));
const questions = loadQuestions();
assert.strictEqual(verifyMatrix(matrix, questions).ok, true, 'committed audit evidence must match production questions');

const sourceMutation = structuredClone(questions);
sourceMutation.L033.question += ' 改ざん';
let finding = verifyMatrix(matrix, sourceMutation).findings.find(item => item.id === 'L033');
assert.deepStrictEqual(finding, { id: 'L033', status: 'STALE', reasons: ['SOURCE_CHANGED'] });

const schemaMutation = structuredClone(questions);
schemaMutation.L034.table.inputTypes.date1 = 'amount';
finding = verifyMatrix(matrix, schemaMutation).findings.find(item => item.id === 'L034');
assert.ok(finding.reasons.includes('SOURCE_CHANGED'));
assert.ok(finding.reasons.includes('ANSWER_SCHEMA_CHANGED'));

assert.notStrictEqual(evidenceStamp(questions.L033).sourceHash, evidenceStamp(sourceMutation.L033).sourceHash);
console.log('audit matrix freshness tests passed');
