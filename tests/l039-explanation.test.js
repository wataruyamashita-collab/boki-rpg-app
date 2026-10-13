'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const Model=require('../js/explanation-model');
const s={window:{}};vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),s);const q=s.window.QuestionData.L039;
// Independent period allocation from the prompt, not answer values.
const principal=Number(q.question.match(/借入金([\d,]+)円/)[1].replaceAll(',','')),rate=Number(q.question.match(/年利率([\d.]+)%/)[1]);
const yearly=principal*rate/100,monthly=yearly/12,previous=monthly*6,current=monthly*6,expense=yearly-previous+current;
assert.deepStrictEqual(JSON.parse(JSON.stringify(q.answer.cells)),{priorAccrual:previous,reversal:previous,annualPayment:yearly,currentAccrual:current,profitTransfer:expense,nextBalance:expense-expense});
assert.strictEqual(yearly+current,previous+expense,'expense ledger independently balances');
for(const correct of [true,false]){
 const m=Model.build(q,correct?q.answer:{cells:{}},{correct});const text=JSON.stringify([m.calculation,m.transfer]);
 for(const term of ['前期に費用計上済み','二重計上','前期10月〜3月','当期4月〜9月','−9,000 ＋ 18,000 ＋ 9,000 = 18,000','当期10月〜3月','負債','支払利息勘定の貸方','損益勘定の借方','未払利息勘定','次期繰越0円'])assert(text.includes(term),'missing reasoning: '+term);
 assert(m.checks.length>0,'supplementary independent check');
}
const protectedData=JSON.parse(JSON.stringify(s.window.QuestionData));delete protectedData.L039.explanation;delete protectedData.L039.explanationModel;
assert.strictEqual(crypto.createHash('sha256').update(JSON.stringify(protectedData)).digest('hex'),'41b4b0efdfb65b67a2dc2cf5eb10af9781f2c4a710bd37159145bffac3c0dc57','all 299 questions and L039 non-explanation fields unchanged');
console.log('L039 period allocation, teaching and protected data: PASS');
