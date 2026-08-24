'use strict';
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('data/questions.js', 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const questions = Object.values(sandbox.window.QuestionData);
const normalize = value => String(value || '')
  .normalize('NFKC')
  .replace(/\d{1,4}年|\d{1,2}月|\d{1,2}日/g, '<DATE>')
  .replace(/[\d,]+(?:円|個|枚|台|年|か月|ヶ月|%)/g, '<VALUE>')
  .replace(/[\d,]+/g, '<NUMBER>')
  .replace(/[A-Z][A-Z0-9]*(?:商店|株式会社|社)?/g, '<ENTITY>')
  .replace(/\s+/g, ' ').trim();
const signature = field => new Set(questions.map(q => normalize(q[field]))).size;
const groups = field => {
  const counts = new Map();
  questions.forEach(q => { const key = normalize(q[field]); counts.set(key, (counts.get(key) || 0) + 1); });
  return [...counts.values()].filter(count => count > 1).reduce((sum, count) => sum + count, 0);
};
const chapters = questions.reduce((out, q) => ((out[q.chapter] = (out[q.chapter] || 0) + 1), out), {});
const topics = ['手形','入金伝票','出金伝票','振替伝票','移動平均','現金出納帳','当座預金出納帳','小口現金出納帳','仕入帳','売上帳','損益計算書','8桁精算表'];
const topicCounts = Object.fromEntries(topics.map(topic => [topic, questions.filter(q => JSON.stringify(q).includes(topic)).length]));
const report = { total: questions.length, uniqueTemplates: { question: signature('question'), explanation: signature('explanation'), story: signature('story') }, questionsInRepeatedGroups: { question: groups('question'), explanation: groups('explanation'), story: groups('story') }, chapters, topicMentions: topicCounts };
console.log(JSON.stringify(report, null, 2));
if (questions.length !== new Set(questions.map(q => q.id)).size) process.exitCode = 1;
