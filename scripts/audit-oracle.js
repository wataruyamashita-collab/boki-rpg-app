'use strict';
const fs=require('fs');const vm=require('vm');
const load=()=>{const sandbox={window:{}};vm.createContext(sandbox);for(const file of ['data/questions.js','data/accounting-oracle.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});return sandbox.window;};
const root=load();const baseline=root.auditAccountingOracle();
const mutations=[];
for(const [id,item] of Object.entries(root.QuestionData)){
  const mutate=structuredClone(item);
  if(item.type==='journal') mutate.answer.debit[0].amount+=1;
  else {const cell=Object.keys(mutate.answer.cells)[0];mutate.answer.cells[cell]=typeof mutate.answer.cells[cell]==='number'?mutate.answer.cells[cell]+1:`誤:${mutate.answer.cells[cell]}`;}
  mutations.push({id,attack:'answer ±1',question:mutate});
  const coordinated=structuredClone(mutate);coordinated.semantic={questionId:id,visibleInputs:['question'],dependencies:[],reviewed:true};coordinated.reviewedAnswerFingerprint='attacker-recomputed';mutations.push({id,attack:'answer + semantic + fingerprint',question:coordinated});
  const source=structuredClone(coordinated);source.question=`${source.question} 改ざん値999,999円`;if(source.materials?.[0])source.materials[0].改ざん値=999999;mutations.push({id,attack:'answer + coordinated visible source',question:source});
}
let detected=0;for(const mutation of mutations){const data={...root.QuestionData,[mutation.id]:mutation.question};const finding=root.auditAccountingOracle(data).findings[mutation.id];if(!finding.match)detected++;}
const report={coverage:{total:baseline.total,independent:baseline.independent,unknown:baseline.unknown,answerDependent:baseline.answerDependent,fingerprintOnly:baseline.fingerprintOnly,byType:baseline.byType},mutation:{total:mutations.length,detected,missed:mutations.length-detected,rate:`${(detected/mutations.length*100).toFixed(1)}%`},examPool:{questions:root.ExamPoolDefinition.length,independent:root.ExamPoolDefinition.filter(id=>baseline.findings[id]?.match).length}};
console.log(JSON.stringify(report,null,2));if(!baseline.ok||detected!==mutations.length||report.examPool.questions!==report.examPool.independent)process.exitCode=1;
module.exports={report};
