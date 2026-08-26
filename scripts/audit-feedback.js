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
for (const question of questions) {
  testedByType[question.type] = (testedByType[question.type] || 0) + 1;
  if (question.type !== 'journal') {
    const [cell] = question.table.inputCells; const answer = { cells:{ ...question.answer.cells, [cell]:typeof question.answer.cells[cell] === 'number' ? question.answer.cells[cell] + 1 : '誤った科目' } };
    const diagnostics = Feedback.diagnoseWrongAnswer(question, answer, { correct:false });
    if (!diagnostics.length || diagnostics.some(item => !item.reason || !item.thinking || !item.nextRule)) throw new Error(`${question.id}: non-journal feedback incomplete`);
    continue;
  }
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
const report = { questions:questions.length, testedByType, misconceptionPairs:{ total:pairs.size, specific:pairs.size - fallback.length, fallback:fallback.length, coverage:`${((pairs.size - fallback.length) / pairs.size * 100).toFixed(1)}%`, genericPairs:fallback }, semantic:semantic.counts };
console.log(JSON.stringify(report, null, 2));
if (fallback.length || !semantic.ok) process.exitCode = 1;
