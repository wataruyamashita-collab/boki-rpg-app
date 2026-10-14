'use strict';
// Audit report validation only. Does not grade or mutate product/learning data.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),reportPath=path.join(__dirname,'question-quality-ledger-20261015.json');
const {loadQuestions,evidenceStamp}=require(path.join(root,'scripts/audit-matrix'));
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>'sha256:'+crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const bytesHash=x=>crypto.createHash('sha256').update(x).digest('hex');
const sandbox={window:{}};vm.createContext(sandbox);for(const file of ['data/accounting-domain.js','data/questions.js','js/explanation-formulas.js','js/explanation-model.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const models=Object.fromEntries(Object.entries(sandbox.window.QuestionData).map(([id,q])=>[id,sandbox.window.ExplanationModel.build(q,q.answer,{correct:true})]));
const taxonomy=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root,'reports/edu-quality/question-taxonomy-2026.json'),'utf8')).rows.map(r=>[r.id,r]));
const statuses=['PASS','FAIL','IMPROVEMENT','UNVERIFIED','NOT APPLICABLE'],overall=['ACCEPTED','DEFECT','IMPROVEMENT CANDIDATE','UNVERIFIED'];
function validate(report,questions=loadQuestions()){
 assert.equal(report.schemaVersion,1);assert.equal(report.rows.length,300);assert.equal(Object.keys(questions).length,300);assert.equal(hash(questions),report.baseline.runtimeHash,'entire runtime content bound, including answers and explanations');
 for(const[file,digest]of Object.entries(report.baseline.codeHashes))assert.equal(bytesHash(fs.readFileSync(path.join(root,file))),digest,'code/taxonomy provenance '+file);
 assert.equal(hash(models),report.baseline.modelHash,'all structured models');
 const ids=new Set(report.rows.map(r=>r.id));assert.equal(ids.size,300);assert.deepEqual([...ids].sort(),Object.keys(questions).sort());assert.equal(hash([...ids].sort()),report.baseline.canonicalIdsHash);
 const counts=Object.fromEntries(overall.map(s=>[s,0]));
 for(const row of report.rows){const q=questions[row.id];assert.equal(row.chapter,q.chapter);assert.equal(row.topic,q.category);assert.equal(row.type,q.type);assert.equal(row.identity.runtimeContentHash,hash(q));assert.equal(row.identity.answerHash,hash(q.answer));assert.equal(row.identity.authoredExplanationHash,hash(q.explanation));const stamp=evidenceStamp(q);assert.equal(row.identity.legacySourceHash,stamp.sourceHash);assert.equal(row.identity.legacyAnswerSchemaHash,stamp.answerSchemaHash);
  assert.equal(row.identity.structuredModelHash,hash(models[row.id]));assert.equal(row.identity.taxonomyRowHash,hash(taxonomy[row.id]));assert.equal(row.cognitiveLevel,taxonomy[row.id].cognitiveLevel);assert.equal(row.learningRole,q.learningRole);assert.equal(row.format,q.format||'default');
  for(const k of ['correctness','judgement_reason','calculation','beginner_explanation','ui_ux','learning_connection']){assert(statuses.includes(row.assessments[k].status));assert(row.assessments[k].note.length>0);}
  assert(q.explanation.includes(row.evidence.C.sourceQuote),'actual authored quote '+row.id);assert.equal(row.evidence.D.status,'UNVERIFIED');assert(overall.includes(row.overall));counts[row.overall]++;
  assert.equal(row.evidence.C.status,{'ACCEPTED':'PASS','DEFECT':'FAIL','IMPROVEMENT CANDIDATE':'IMPROVEMENT','UNVERIFIED':'UNVERIFIED'}[row.overall]);assert.equal(row.evidence.B.status,row.assessments.correctness.status);
  if(row.overall==='ACCEPTED')assert(!Object.values(row.assessments).some(v=>['FAIL','UNVERIFIED','IMPROVEMENT'].includes(v.status)),'accepted with unresolved criterion '+row.id);
  if(row.overall==='DEFECT')assert(Object.values(row.assessments).some(v=>v.status==='FAIL'));if(row.overall==='IMPROVEMENT CANDIDATE')assert(Object.values(row.assessments).some(v=>v.status==='IMPROVEMENT'));
 }
 assert.deepEqual(counts,report.summary.overall);assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),300);for(const[type,group]of Object.entries(report.summary.byType)){const rows=report.rows.filter(r=>r.type===type);assert.equal(rows.length,group.total);for(const[s,n]of Object.entries(group.overall))assert.equal(rows.filter(r=>r.overall===s).length,n);}for(const[chapter,group]of Object.entries(report.summary.byChapter)){const rows=report.rows.filter(r=>r.chapter===Number(chapter));assert.equal(rows.length,group.total);for(const[s,n]of Object.entries(group.overall))assert.equal(rows.filter(r=>r.overall===s).length,n);}
 assert.equal(report.rows.filter(r=>r.newIndependentCalculation).length,report.summary.newIndependentCalculations);assert.equal(report.rows.filter(r=>r.newVerification.visibleRenderer).length,report.summary.newVisibleIds);assert.equal(report.summary.learnerUnverified,300);
 return counts;
}
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));const counts=validate(report);const bundleBytes=fs.readFileSync(path.join(root,report.evidenceBundle.path));assert.equal(bytesHash(bundleBytes),report.evidenceBundle.sha256);const bundle=JSON.parse(zlib.gunzipSync(bundleBytes));for(const[name,text]of Object.entries(bundle)){assert(!path.isAbsolute(name)&&!name.split('/').includes('..'));assert.equal(bytesHash(Buffer.from(text)),report.evidenceBundle.files[name]);}
const visible=JSON.parse(bundle['audit300/visible-explanations.json']);assert.equal(visible.status,'PASS');assert.equal(visible.records.length,724);assert.equal(visible.failures.length,0);assert.equal(new Set(visible.records.map(r=>r.id)).size,181);for(const r of visible.records){assert(r.gradedCorrect&&r.sourceUnchanged&&r.resultVisible&&r.explanationVisible&&r.summaryVisible);assert.equal(r.violations.length,0);}
// Independent arithmetic from visible conditions; no answer generator/GradingEngine.
assert.equal(0+50000-18000,32000);assert.equal(10000+50000-18000,42000);assert.equal(0+300000-85000,215000);assert.equal(10000+300000-85000,225000);assert.equal(20000*12/6,40000);assert.equal(120000-40000,80000);assert.equal(200000-120000-20000-60000,0);
const clone=x=>JSON.parse(JSON.stringify(x));let rejected=0;const negative=mutate=>{const altered=clone(report);mutate(altered);assert.throws(()=>validate(altered));rejected++;};negative(r=>r.rows[0].id=r.rows[1].id);negative(r=>r.summary.overall.ACCEPTED++);negative(r=>r.rows.find(x=>x.id==='L044').overall='ACCEPTED');negative(r=>r.rows[0].evidence.C.sourceQuote='a fabricated explanation quote');negative(r=>r.rows[0].assessments.calculation.status='VERIFIED');
const changed=clone(loadQuestions());changed.L039.explanation+=' tampered';assert.throws(()=>validate(report,changed));rejected++;
negative(r=>r.rows[0].identity.structuredModelHash='sha256:fake');negative(r=>r.rows[0].identity.taxonomyRowHash='sha256:fake');negative(r=>r.rows[0].evidence.C.status='FAIL');negative(r=>r.baseline.modelHash='sha256:fake');
console.log(JSON.stringify({status:'PASS',baseline:report.baseline,total:300,overall:counts,newVisibleCases:visible.records.length,negativeCasesRejected:rejected,learner:'UNVERIFIED'},null,2));
