'use strict';
const fs = require('fs');
const vm = require('vm');
const Feedback = require('../js/feedback');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('data/questions.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/controller.js', 'utf8'), sandbox);
const questions = Object.values(sandbox.window.QuestionData);
const pairs = new Set(); const fallback = []; const testedByType = {};
const brokenCopy = /未入力円|未入力です円|undefined|null|NaN|\[object Object\]|円円|[。、]{2}/;
let generatedCases = 0;
const inspect = (question, answer, label) => {
  const diagnostics = Feedback.diagnoseWrongAnswer(question, answer, { correct:false });
  if (!diagnostics.length) throw new Error(`${question.id}/${label}: feedback missing`);
  for (const item of diagnostics) {
    const text = [item.title, item.reason, item.thinking, item.nextRule].join('\n');
    if (brokenCopy.test(text)) throw new Error(`${question.id}/${label}: broken feedback: ${text}`);
    if ([item.title, item.reason, item.thinking, item.nextRule].some(value => !String(value || '').trim())) throw new Error(`${question.id}/${label}: empty feedback field`);
  }
  generatedCases += 1;
  return diagnostics;
};
for (const question of questions) {
  testedByType[question.type] = (testedByType[question.type] || 0) + 1;
  if (question.type !== 'journal') {
    const [cell] = question.table.inputCells; const expected = question.answer.cells[cell];
    const variants = expected === undefined ? [''] : (typeof expected === 'number' ? ['', 0, expected - 1, expected + 1, -expected, '不正値'] : ['', '不正な科目']);
    let diagnostics;
    for (const value of variants) diagnostics = inspect(question, { cells:{ ...question.answer.cells, [cell]:value } }, `cell:${String(value)}`);
    if (question.table.inputCells.length > 1) diagnostics = inspect(question, { cells:{ ...question.answer.cells, [question.table.inputCells.at(-1)]:'' } }, 'partial');
    if (!diagnostics.length || diagnostics.some(item => !item.reason || !item.thinking || !item.nextRule)) throw new Error(`${question.id}: non-journal feedback incomplete`);
    continue;
  }
  inspect(question, { debit:[], credit:[] }, 'blank');
  inspect(question, { debit:question.answer.credit.map(row => ({ ...row })), credit:question.answer.debit.map(row => ({ ...row })) }, 'reversed');
  for (const side of ['debit','credit']) for (const correct of question.answer[side]) {
    const choices = sandbox.window.AppController.accountChoices(question, correct.account, 'story');
    for (const wrong of choices.filter(account => account !== correct.account)) {
      const key = `${wrong}→${correct.account}`; if (pairs.has(key)) continue; pairs.add(key);
      const answer = { debit:question.answer.debit.map(row => ({ ...row })), credit:question.answer.credit.map(row => ({ ...row })) };
      answer[side].find(row => row.account === correct.account).account = wrong;
      const diagnostic = Feedback.diagnoseWrongAnswer(question, answer, { correct:false }).find(item => item.kind === 'account');
      const combined = diagnostic ? `${diagnostic.reason}\n${diagnostic.thinking}\n${diagnostic.nextRule}` : '';
      const circular = /として認識すべき原因・対象|正解は.+なので|この場合は.+だから|定義を登録できていない/.test(combined);
      const distinguishes = /一方|ではなく|異な|区別|判別|反対|増加|減少|資産|負債|収益|費用|純資産|原因|対象|決済|商品|期間|発生|将来|当期|会社|株主|税/.test(combined);
      const reusableRule = /確認|特定|照合|判別|区別|計算|先に|分けて/.test(diagnostic?.nextRule || '');
      if (!diagnostic || !diagnostic.reason.includes(wrong) || !diagnostic.reason.includes(correct.account) || !distinguishes || !reusableRule || circular) fallback.push(key);
    }
  }
}
const semantic = sandbox.window.validateSemanticQuestionData();
const report = { questions:questions.length, generatedCases, testedByType, misconceptionPairs:{ total:pairs.size, specific:pairs.size - fallback.length, fallback:fallback.length, coverage:`${((pairs.size - fallback.length) / pairs.size * 100).toFixed(1)}%`, genericPairs:fallback }, semantic:semantic.counts };
console.log(JSON.stringify(report, null, 2));
if (fallback.length || !semantic.ok) process.exitCode = 1;
