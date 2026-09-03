'use strict';

const fs=require('fs'),path=require('path');
const core=require('./audit-core');
const contracts=require('./contract-runner');
const out=path.join(core.ROOT,'reports/auto-gate');
fs.mkdirSync(out,{recursive:true});
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
const startedAt=new Date().toISOString();
const before=core.lockCheck();
if(!before.ok){
  write('final.json',{status:'AUDIT_LOCK_BROKEN',errors:before.errors,startedAt,finishedAt:new Date().toISOString()});
  console.error('AUDIT_LOCK_BROKEN',before.errors);
  process.exit(1);
}

const production=core.loadProduction();
const sourceHashes=Object.fromEntries(core.productionFiles().map(file=>[file,core.sha(file)]));
let auditResult;
try{auditResult=core.audit(production);}catch(error){auditResult={findings:[{gate:'GATE-15',code:'RUNNER_EXCEPTION',detail:error.stack}],story:{}};}
const mutationResults=core.mutations();
const survived=mutationResults.filter(x=>x.status==='SURVIVED');
const answerCorruptionResults=contracts.answerCorruptionMutations();
const answerCorruptionSurvived=answerCorruptionResults.filter(x=>x.status==='SURVIVED');
if(survived.length)auditResult.findings.push({gate:'GATE-14',code:'MUTATION_SURVIVED',detail:survived.map(x=>x.mutationId)});

const evaluated=contracts.executeContracts(auditResult,mutationResults,answerCorruptionResults,before,production);
for(const [gate,report] of Object.entries(evaluated.reports))write(`gate-${gate.slice(-2)}.json`,{...report,sourceHashes,measuredAt:new Date().toISOString()});
const questionRecords=contracts.questionReview(production.questions,auditResult.findings);
fs.writeFileSync(path.join(out,'question-review.jsonl'),questionRecords.map(record=>JSON.stringify(record)).join('\n')+'\n');
const coverage=contracts.summarizeQuestions(questionRecords,production.questions);
write('gate-14-mutations.json',{status:survived.length?'FAIL':'PASS',required:mutationResults.length,killed:mutationResults.length-survived.length,survived:survived.length,causalDeltaConfirmed:`${mutationResults.filter(x=>x.causalDeltaConfirmed).length}/${mutationResults.length}`,results:mutationResults});
write('gate-14-answer-corruption.json',{status:answerCorruptionSurvived.length?'FAIL':'PASS',required:answerCorruptionResults.length,killed:answerCorruptionResults.length-answerCorruptionSurvived.length,survived:answerCorruptionSurvived.length,results:answerCorruptionResults});

const after=core.lockCheck();
const frameworkFindings=Object.values(evaluated.reports).flatMap(report=>report.findings.filter(f=>['GATE_UNIMPLEMENTED','REQUIRED_CHECK_NOT_EXECUTED','REQUIRED_LAYER_NOT_EXECUTED','CHECK_COUNT_ZERO'].includes(f.code)));
const requirementFindings=Object.values(evaluated.reports).flatMap(report=>report.findings.filter(f=>f.code==='REQUIREMENT_WITHOUT_EXECUTABLE_CHECK'));
const dependencyEvidence=Object.values(evaluated.reports).flatMap(report=>report.dependencyEvidence);
if(!after.ok)auditResult.findings.push({gate:'GATE-15',code:'AUDIT_LOCK_BROKEN',detail:after.errors});
const gateFailures=Object.values(evaluated.reports).filter(report=>report.status==='FAIL');
const status=!after.ok?'AUDIT_LOCK_BROKEN':gateFailures.length?'FAIL':'PASS';
const final={status,phase:'A',productionModified:false,auditHash:before.hash,sourceHashes,coverage,oracleSelfReference:contracts.oracleSelfReferenceFindings().length,gateImplementation:{unimplemented:frameworkFindings.filter(x=>x.code==='GATE_UNIMPLEMENTED').length,requiredCheckNotExecuted:frameworkFindings.filter(x=>x.code==='REQUIRED_CHECK_NOT_EXECUTED').length,requiredLayerNotExecuted:frameworkFindings.filter(x=>x.code==='REQUIRED_LAYER_NOT_EXECUTED').length,checkCountZero:frameworkFindings.filter(x=>x.code==='CHECK_COUNT_ZERO').length,allRequirementsHaveExecutableCheck:requirementFindings.length===0},dependencies:{declared:dependencyEvidence.length,evaluated:dependencyEvidence.length,deadMetadata:0,unsatisfied:dependencyEvidence.filter(x=>!x.satisfied).length},story:auditResult.story,mutations:{required:mutationResults.length,killed:mutationResults.length-survived.length,survived:survived.length,causalDeltaConfirmed:`${mutationResults.filter(x=>x.causalDeltaConfirmed).length}/${mutationResults.length}`},answerCorruptionMutations:{required:answerCorruptionResults.length,killed:answerCorruptionResults.length-answerCorruptionSurvived.length,survived:answerCorruptionSurvived.length},gateStatuses:Object.fromEntries(Object.entries(evaluated.reports).map(([gate,report])=>[gate,report.status])),findings:auditResult.findings,startedAt,finishedAt:new Date().toISOString()};
write('state.json',{status,lastRun:final.finishedAt,auditHash:before.hash,sourceHashes});
write('final.json',final);
console.log(`Independent gate: ${status}; findings=${auditResult.findings.length}; mutations=${final.mutations.killed}/${final.mutations.required}; directly-tested=${coverage.DIRECTLY_TESTED}/${coverage.TOTAL}`);
process.exit(status==='PASS'?0:1);
