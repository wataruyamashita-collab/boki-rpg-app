'use strict';

const { loadQuestions } = require('./audit-matrix');

const BLACKLIST = ['問題文の数字と条件に印を付け','確定した金額と次の資料を照合します','元帳は、仕訳を勘定科目ごとに','だから答えが確定します','章・調査'];
const HEADING = /【([^】]+)】/gu;
const normalize = value => String(value ?? '').replace(/[\s,，円]/gu, '');
const visibleLength = value => [...String(value ?? '').replace(/\s+/gu, '').replace(HEADING, '')].length;
const significantTokens = question => {
  const source = `${question.category || ''}${question.question || ''}${JSON.stringify(question.materials || [])}${JSON.stringify(question.table?.rows || [])}`;
  return [...new Set([...(source.match(/[0-9０-９][0-9０-９,，.]*/gu) || []), ...(source.match(/[一-龠々ァ-ヶー]{2,}/gu) || []), question.category].filter(Boolean))];
};
const specificLength = question => String(question.explanation || '').split(/(?<=[。！？\n])/u)
  .filter(sentence => significantTokens(question).some(token => normalize(sentence).includes(normalize(token))))
  .reduce((sum, sentence) => sum + visibleLength(sentence), 0);
const duplicateHeadings = explanation => {
  const headings = [...String(explanation || '').matchAll(HEADING)].map(match => match[1]);
  return [...new Set(headings.filter((heading, index) => headings.indexOf(heading) !== index))];
};
const duplicatePhrases = questions => {
  const owners = new Map(); const duplicates = [];
  for (const question of questions) for (const unit of new Set(String(question.explanation || '').split(/[。！？\n]/u).map(value => value.trim()).filter(unit => [...unit].length >= 45))) {
    const key = normalize(unit); const prior = owners.get(key);
    if (prior && prior !== question.id) duplicates.push({ phrase:unit, ids:[prior, question.id] }); else owners.set(key, question.id);
  }
  return duplicates;
};
const answerRows = question => [...(question.answer?.debit || []), ...(question.answer?.credit || [])];
const includesAmount = (text, amount) => normalize(text).includes(normalize(amount));
const explanationSentences = question => String(question.explanation || '').split(/(?<=[。！？\n])/u);
const accountReasonPresent = (question, side, row) => explanationSentences(question).some(sentence => sentence.includes(row.account) && sentence.includes(side) && /(増加|減少)/u.test(sentence) && /(資産|負債|純資産|収益|費用|資産の控除|勘定)/u.test(sentence));
const journalIssues = question => {
  const text = String(question.explanation || ''); const issues = [];
  for (const row of answerRows(question)) {
    if (!text.includes(row.account)) issues.push(`正答科目「${row.account}」がない`);
    if (!includesAmount(text, row.amount)) issues.push(`正答金額「${row.amount}」がない`);
  }
  for (const [key, label] of [['debit','借方'],['credit','貸方']]) for (const row of question.answer?.[key] || []) {
    if (!accountReasonPresent(question, label, row)) issues.push(`${label}の理由が「${row.account}」と結び付いていない`);
    const finalSection = text.split('【この問題の仕訳】')[1] || '';
    if (!finalSection.includes(row.account) || !includesAmount(finalSection, row.amount)) issues.push(`最終仕訳に「${row.account} ${row.amount}」がない`);
  }
  return issues;
};
const tableIssues = question => {
  const text = String(question.explanation || ''); const issues = [];
  for (const [key, value] of Object.entries(question.answer?.cells || {})) {
    if (!includesAmount(text, value)) issues.push(`回答「${key}=${value}」がない`);
  }
  if (!text.includes('【使用する資料】') || !text.includes('【計算と転記】')) issues.push('資料から計算へ進む説明構造がない');
  if (question.type === 'ledger' && !/(前残|期首|元データ).*(増加|加え|足し).*(減少|引い|差し引)/su.test(text)) issues.push('前残＋増加－減少の残高計算がない');
  if (question.type === 'trial_balance' && !/(借方).*(貸方).*(集め|加算|合計)/su.test(text)) issues.push('借方・貸方へ集計する根拠がない');
  if (question.type === 'worksheet' && !/(整理前|元データ).*(調整|決算整理).*(整理後|最終値)/su.test(text)) issues.push('整理前→調整→整理後の経路がない');
  if (question.format === 'balance-sheet') {
    const fixed = question.table.rows.filter(row => ['資産','負債','純資産'].includes(row.section) && row.amount !== '入力');
    for (const row of fixed) if (!text.includes(row.account) || !includesAmount(text, row.amount)) issues.push(`貸借対照表の根拠「${row.account} ${row.amount}」がない`);
    if (!/(資産＝負債＋純資産|資産.*負債.*純資産)/su.test(text)) issues.push('貸借対照表等式の説明がない');
  }
  return issues;
};

const auditExplanations = questionMap => {
  const questions = Object.values(questionMap); const ids = new Set();
  const result = { total:questions.length, duplicateIds:[], missingAnswerOrExplanation:[], nullishAnomalies:[], blacklistedPhrases:[], duplicateHeadings:[], duplicateExplanations:[], lengthViolations:[], insufficientSpecificText:[], journalQuality:[], tableQuality:[], ledgerMismatch:[], duplicatePhrases:[] };
  for (const question of questions) {
    if (!question.id || ids.has(question.id)) result.duplicateIds.push(question.id || '(missing)'); ids.add(question.id);
    if (!question.answer || !normalize(question.explanation)) result.missingAnswerOrExplanation.push(question.id);
    if (/\b(?:undefined|null)\b/u.test(`${question.id}${question.question}${question.explanation}`)) result.nullishAnomalies.push(question.id);
    for (const phrase of BLACKLIST) if (String(question.explanation).includes(phrase)) result.blacklistedPhrases.push({ id:question.id, phrase });
    const repeated = duplicateHeadings(question.explanation); if (repeated.length) result.duplicateHeadings.push({ id:question.id, headings:repeated });
    const length = visibleLength(question.explanation); if (length < 150 || length > 5000) result.lengthViolations.push({ id:question.id, length });
    const specific = specificLength(question); if (specific < 100) result.insufficientSpecificText.push({ id:question.id, specific });
    const issues = question.type === 'journal' ? journalIssues(question) : tableIssues(question); if (issues.length) result[question.type === 'journal' ? 'journalQuality' : 'tableQuality'].push({ id:question.id, issues });
    if (question.type === 'ledger' && String(question.explanation).includes('元帳は、仕訳を勘定科目ごとに')) result.ledgerMismatch.push(question.id);
  }
  result.duplicatePhrases = duplicatePhrases(questions);
  const explanationOwners = new Map();
  for (const question of questions) { const key = normalize(question.explanation); const prior = explanationOwners.get(key); if (prior) result.duplicateExplanations.push({ ids:[prior, question.id] }); else explanationOwners.set(key, question.id); }
  result.ok = ['duplicateIds','missingAnswerOrExplanation','nullishAnomalies','blacklistedPhrases','duplicateHeadings','duplicateExplanations','lengthViolations','insufficientSpecificText','journalQuality','tableQuality','ledgerMismatch'].every(key => result[key].length === 0);
  return result;
};

if (require.main === module) {
  const result = auditExplanations(loadQuestions());
  const output = { ...result, duplicatePhrases:{ count:result.duplicatePhrases.length, samples:result.duplicatePhrases.slice(0, 5) } };
  console.log(JSON.stringify(output, null, 2)); if (!result.ok) process.exitCode = 1;
}
module.exports = { auditExplanations, visibleLength, specificLength, journalIssues, tableIssues };
