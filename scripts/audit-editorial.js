'use strict';

const { loadQuestions } = require('./audit-matrix');

const INTERNAL_LABEL = /(?:案件|業務記録)[A-Z][0-9]{3,}/u;
const ROUGH_PUNCTUATION = /[。、]{2,}/u;
const DUPLICATED_PARTICLE = /(?:(?<!も)のの|をを|がが|はは|にに)/u;

const auditEditorial = questions => {
  const findings = [];
  for (const question of Object.values(questions)) {
    for (const field of ['scene', 'story', 'question', 'explanation']) {
      const value = question[field];
      if (typeof value !== 'string') continue;
      if (INTERNAL_LABEL.test(value)) findings.push({ id: question.id, field, reason: 'INTERNAL_LABEL' });
      if (ROUGH_PUNCTUATION.test(value)) findings.push({ id: question.id, field, reason: 'ROUGH_PUNCTUATION' });
      if (DUPLICATED_PARTICLE.test(value)) findings.push({ id: question.id, field, reason: 'DUPLICATED_PARTICLE' });
      if (value !== value.trim()) findings.push({ id: question.id, field, reason: 'OUTER_WHITESPACE' });
    }
  }
  return { ok: findings.length === 0, total: Object.keys(questions).length, findings };
};

if (require.main === module) {
  const result = auditEditorial(loadQuestions());
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { auditEditorial };
