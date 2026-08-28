'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{}};vm.createContext(sandbox);for(const file of ['data/questions.js','data/accounting-oracle.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const root=sandbox.window, evidence=[];
const record=(id,mutationClass,mutate,verify)=>{const original=structuredClone(root.QuestionData[id]),mutated=structuredClone(original);mutate(mutated);const before=root.deriveAccountingExpected(id,null,original),after=root.deriveAccountingExpected(id,null,mutated);const pass=verify(before,after);evidence.push({questionId:id,mutationClass,originalSource:before.sourceFacts,mutatedSource:after.sourceFacts,originalExpected:before.expected||null,mutatedExpected:after.expected||null,status:after.status,sourceValid:after.sourceValid,pass});assert.ok(pass,`${id} ${mutationClass}`);};
record('L038','SIGN_REVERSAL',q=>{q.materials.at(-1).減少=300000},(_b,a)=>a.expected.cells.balanceSide==='借方'&&a.expected.cells.balance===165000);
record('L038','ZERO',q=>{q.materials.at(-1).減少=135000},(_b,a)=>a.expected.cells.balanceSide==='貸方'&&a.expected.cells.balance===0);
record('L041','TRANSACTION_SEMANTIC',q=>{q.materials[0].取引=q.materials[0].取引.replace('掛販売','現金販売')},(_b,a)=>a.expected.cells.d1Account==='現金'&&a.expected.cells.c1Account==='売上');
record('L041','UNKNOWN_SEMANTIC',q=>{q.materials[0].取引='商品90,000円を未対応決済'},(_b,a)=>a.status==='UNKNOWN_SOURCE'&&!a.derivable);
record('C001','CONSISTENCY_BREAK',q=>{q.materials.find(x=>x.資料区分==='整理前残高試算表').借方合計+=137},(_b,a)=>a.status==='INVALID_SOURCE'&&a.sourceValid===false);
// Every authored archetype and all 300 questions are guarded against answer-key tampering.
for (const id of Object.keys(root.QuestionData)) {
  const original=structuredClone(root.QuestionData[id]), mutated=structuredClone(original);
  if (mutated.answer?.cells) Object.keys(mutated.answer.cells).forEach(key=>{ mutated.answer.cells[key]='TAMPERED'; });
  if (mutated.answer?.debit) mutated.answer={debit:[{account:'改ざん',amount:1}],credit:[{account:'改ざん',amount:1}]};
  const before=root.deriveAccountingExpected(id,null,original), after=root.deriveAccountingExpected(id,null,mutated);
  const pass=JSON.stringify(before.expected)===JSON.stringify(after.expected)&&after.derivable!==false;
  evidence.push({questionId:id,mutationClass:'ANSWER_TAMPER',status:after.status,sourceValid:after.sourceValid,pass});
  assert.ok(pass,`${id} ANSWER_TAMPER`);
}
const baseline=root.auditAccountingOracle(), invalidFinding=(()=>{const q=structuredClone(root.QuestionData.C001);q.materials.find(x=>x.資料区分==='整理前残高試算表').借方合計+=137;return root.auditAccountingOracle({...root.QuestionData,C001:q}).findings.C001})();
assert.strictEqual(invalidFinding.overallPass,false);
const byClass=Object.fromEntries([...new Set(evidence.map(x=>x.mutationClass))].map(kind=>{const rows=evidence.filter(x=>x.mutationClass===kind);return [kind,{passed:rows.filter(x=>x.pass).length,total:rows.length}]}));
console.log(JSON.stringify({totalQuestions:baseline.total,answerIndependent:baseline.independent,sourceSensitiveTested:new Set(evidence.map(x=>x.questionId)).size,sourceSensitivePassed:new Set(evidence.filter(x=>x.pass).map(x=>x.questionId)).size,invalidSourceDetection:{passed:evidence.filter(x=>x.mutationClass==='CONSISTENCY_BREAK'&&x.pass).length,total:evidence.filter(x=>x.mutationClass==='CONSISTENCY_BREAK').length},unknownSourceFailClosed:{passed:evidence.filter(x=>x.mutationClass==='UNKNOWN_SEMANTIC'&&x.pass).length,total:evidence.filter(x=>x.mutationClass==='UNKNOWN_SEMANTIC').length},byClass,evidence},null,2));
