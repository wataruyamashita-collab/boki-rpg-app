'use strict';

const { loadQuestions } = require('./audit-matrix');

const INTERNAL_LABEL = /(?:案件|業務記録)[A-Z][0-9]{3,}/u;
const ROUGH_PUNCTUATION = /[。、]{2,}/u;
const DUPLICATED_PARTICLE = /(?:(?<!も)のの|をを|がが|はは|にに)/u;
const ABSTRACT_STORY_CLICHE = /(?:締切が迫る|ここでの判断が.+数字を直接動かす|この取引を正しく記録するしかない|鍵は「.+」だ)/u;
const READER_ACTION = /(?:確認|確かめ|分け|決め|記入|集計|比べ|作っ|埋め|確定)/u;

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
    if (ABSTRACT_STORY_CLICHE.test(question.story || '')) findings.push({ id: question.id, field: 'story', reason: 'ABSTRACT_STORY_CLICHE' });
    if (!/(?:あなた|自分で)/u.test(question.story || '')) findings.push({ id: question.id, field: 'story', reason: 'MISSING_READER_VIEWPOINT' });
    if (!READER_ACTION.test(question.story || '')) findings.push({ id: question.id, field: 'story', reason: 'MISSING_READER_ACTION' });
    if (!/【業務の結果】/u.test(question.explanation || '')) findings.push({ id: question.id, field: 'explanation', reason: 'MISSING_STORY_RESULT' });
  }
  return { ok: findings.length === 0, total: Object.keys(questions).length, findings };
};

if (require.main === module) {
  const result = auditEditorial(loadQuestions());
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { auditEditorial };
