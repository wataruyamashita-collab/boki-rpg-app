'use strict';

const { loadQuestions } = require('./audit-matrix');

const BLACKLIST = [
  '問題文の数字と条件に印を付け',
  '確定した金額と次の資料を照合します',
  '元帳は、仕訳を勘定科目ごとに'
];
const HEADING = /【([^】]+)】/gu;
const normalize = value => String(value ?? '').replace(/\s+/gu, '');
const visibleLength = value => [...normalize(value).replace(HEADING, '')].length;
const significantTokens = question => {
  const source = `${question.category || ''}${question.question || ''}`;
  return [...new Set([
    ...(source.match(/[0-9０-９][0-9０-９,，.]*/gu) || []),
    ...(source.match(/[一-龠々ァ-ヶー]{2,}/gu) || []),
    question.category
  ].filter(Boolean))];
};
const specificLength = question => {
  const tokens = significantTokens(question);
  return String(question.explanation || '').split(/(?<=[。！？\n])/u)
    .filter(sentence => tokens.some(token => sentence.includes(token)))
    .reduce((sum, sentence) => sum + visibleLength(sentence), 0);
};
const duplicateHeadings = explanation => {
  const headings = [...String(explanation || '').matchAll(HEADING)].map(match => match[1]);
  return [...new Set(headings.filter((heading, index) => headings.indexOf(heading) !== index))];
};
const duplicatePhrases = questions => {
  // A phrase is audited as a complete prose unit. Headings and bookkeeping labels
  // are excluded so legitimate terminology does not masquerade as copied prose.
  const owners = new Map();
  for (const question of questions) {
    const units = String(question.explanation || '').split(/[。！？\n]/u)
      .map(normalize).filter(unit => [...unit].length >= 30);
    for (const unit of new Set(units)) {
      const prior = owners.get(unit);
      if (prior && prior !== question.id) return { phrase: unit, ids: [prior, question.id] };
      owners.set(unit, question.id);
    }
  }
  return null;
};

const auditExplanations = questionMap => {
  const questions = Object.values(questionMap);
  const ids = new Set();
  const result = {
    total: questions.length,
    duplicateIds: [], missingAnswerOrExplanation: [], nullishAnomalies: [],
    blacklistedPhrases: [], duplicateHeadings: [], lengthViolations: [],
    insufficientSpecificText: [], ledgerMismatch: [], duplicatePhrase: null
  };
  for (const question of questions) {
    if (!question.id || ids.has(question.id)) result.duplicateIds.push(question.id || '(missing)');
    ids.add(question.id);
    if (!question.answer || !normalize(question.explanation)) result.missingAnswerOrExplanation.push(question.id);
    if (/\b(?:undefined|null)\b/u.test(`${question.id}${question.question}${question.explanation}`)) result.nullishAnomalies.push(question.id);
    for (const phrase of BLACKLIST) if (String(question.explanation).includes(phrase)) result.blacklistedPhrases.push({ id: question.id, phrase });
    const repeated = duplicateHeadings(question.explanation);
    if (repeated.length) result.duplicateHeadings.push({ id: question.id, headings: repeated });
    const length = visibleLength(question.explanation);
    if (length < 150 || length > 350) result.lengthViolations.push({ id: question.id, length });
    const specific = specificLength(question);
    if (specific < 100) result.insufficientSpecificText.push({ id: question.id, length: specific });
    if (question.type === 'ledger' && String(question.explanation).includes('元帳は、仕訳を勘定科目ごとに')) result.ledgerMismatch.push(question.id);
  }
  result.duplicatePhrase = duplicatePhrases(questions);
  result.ok = ['duplicateIds','missingAnswerOrExplanation','nullishAnomalies','blacklistedPhrases','duplicateHeadings','lengthViolations','insufficientSpecificText','ledgerMismatch']
    .every(key => result[key].length === 0) && result.duplicatePhrase === null;
  return result;
};

if (require.main === module) {
  const result = auditExplanations(loadQuestions());
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { auditExplanations, visibleLength, specificLength };
