'use strict';

const crypto=require('crypto');
const core=require('./audit-core');

const LAYERS=['STRUCTURAL','ACCOUNTING_SEMANTIC','LEARNING','ADVERSARIAL'];
const gateContracts=[
  ['GATE-01','semantic'],['GATE-02','user-facing'],['GATE-03','journal'],['GATE-04','ledger'],
  ['GATE-05','trial-balance'],['GATE-06','correction'],['GATE-07','worksheet'],
  ['GATE-08','financial-statements'],['GATE-09','comprehensive'],['GATE-10','story-progression'],
  ['GATE-11','question-variety'],['GATE-12','ui'],['GATE-13','mobile'],
  ['GATE-14','mutation'],['GATE-15','final-integrity']
];

function loadContracts(){
  return Object.fromEntries(gateContracts.map(([gate,name])=>[gate,core.json(`independent-audit/contracts/${name}.json`)]));
}

function validateContract(contract){
  const errors=[];
  if(!Array.isArray(contract.requiredCheckIds)||contract.requiredCheckIds.length===0)errors.push('GATE_UNIMPLEMENTED');
  if(!Array.isArray(contract.requiredLayers)||contract.requiredLayers.length===0)errors.push('REQUIRED_LAYER_NOT_EXECUTED');
  if(!Array.isArray(contract.dependencies))errors.push('GATE_UNIMPLEMENTED');
  if(contract.passPolicy!=='all-required-checks-and-layers-pass')errors.push('GATE_UNIMPLEMENTED');
  for(const layer of contract.requiredLayers||[])if(!LAYERS.includes(layer))errors.push('REQUIRED_LAYER_NOT_EXECUTED');
  return errors;
}

function evaluateContract(gate,contract,checks,auditFindings=[]){
  const required=contract.requiredCheckIds||[],executed=required.filter(id=>checks[id]);
  const missing=required.filter(id=>!checks[id]),layers={};
  for(const layer of LAYERS){
    const layerRequired=required.filter(id=>contract.checkLayers?.[id]===layer);
    const layerExecuted=layerRequired.filter(id=>checks[id]);
    const passedCheckIds=layerExecuted.filter(id=>checks[id].status==='PASS');
    const failedCheckIds=layerExecuted.filter(id=>checks[id].status==='FAIL');
    const explicitNA=(contract.notApplicableLayers||[]).includes(layer);
    const status=explicitNA?'N/A':layerRequired.length===0?'FAIL':layerExecuted.length!==layerRequired.length||failedCheckIds.length?'FAIL':'PASS';
    layers[layer]={requiredCheckIds:layerRequired,executedCheckIds:layerExecuted,passedCheckIds,failedCheckIds,status};
  }
  const frameworkFindings=[];
  if(required.length===0)frameworkFindings.push({gate,code:'CHECK_COUNT_ZERO'});
  if(missing.length)frameworkFindings.push({gate,code:'REQUIRED_CHECK_NOT_EXECUTED',detail:missing});
  for(const layer of contract.requiredLayers||[])if(layers[layer].executedCheckIds.length===0)frameworkFindings.push({gate,code:'REQUIRED_LAYER_NOT_EXECUTED',detail:layer});
  for(const code of validateContract(contract))frameworkFindings.push({gate,code});
  const failed=executed.filter(id=>checks[id].status==='FAIL');
  const status=required.length>0&&missing.length===0&&frameworkFindings.length===0&&failed.length===0&&(contract.requiredLayers||[]).every(x=>layers[x].status==='PASS')?'PASS':'FAIL';
  return {gate,status,requiredCheckIds:required,executedCheckIds:executed,passedCheckIds:executed.filter(id=>checks[id].status==='PASS'),failedCheckIds:failed,layers,findings:[...auditFindings,...frameworkFindings]};
}

function executeContracts(auditResult,mutationResults,lockResult){
  const contracts=loadContracts();
  const checks={};
  const run=(id,layer,test,failures=[])=>{
    let passed=false,error=null;
    try{passed=Boolean(test());}catch(reason){error=reason.message;}
    checks[id]={id,layer,status:passed?'PASS':'FAIL',failures,error};
  };
  for(const [gate,name] of gateContracts){
    const contract=contracts[gate];
    const contractErrors=validateContract(contract);
    run(`${gate}.CONTRACT`, 'STRUCTURAL',()=>contractErrors.length===0,contractErrors);
    const gateFindings=auditResult.findings.filter(f=>f.gate===gate);
    if(gate==='GATE-14')run(`${gate}.MUTATIONS`,'ADVERSARIAL',()=>mutationResults.length>0&&mutationResults.every(x=>x.status==='KILLED'&&x.causalDeltaConfirmed),mutationResults.filter(x=>x.status!=='KILLED'||!x.causalDeltaConfirmed).map(x=>x.mutationId));
    else if(gate==='GATE-15')run(`${gate}.INTEGRITY`,'ADVERSARIAL',()=>lockResult.ok,lockResult.errors);
    else run(`${gate}.AUDIT`,contract.requiredLayers.find(x=>x!=='STRUCTURAL')||'STRUCTURAL',()=>gateFindings.length===0,gateFindings.map(x=>x.code));
  }
  const reports={};
  for(const [gate,name] of gateContracts){
    reports[gate]={...evaluateContract(gate,contracts[gate],checks,auditResult.findings.filter(x=>x.gate===gate)),contract:name};
  }
  return {reports,checks};
}

function questionReview(questions,auditFindings){
  const expected=core.json('independent-audit/golden/question-ids.json').ids;
  const raw=core.read('data/questions.js');
  const authoredIds=[...raw.matchAll(/^  "([A-Z]\d{3})": \{/gmu)].map(match=>match[1]);
  const duplicates=new Set(authoredIds.filter((id,index)=>authoredIds.indexOf(id)!==index));
  return expected.map(questionId=>{
    const question=questions[questionId];
    const requiredCheckIds=['QUESTION_PRESENT','QUESTION_STRUCTURE','QUESTION_EXPLANATION','QUESTION_GATE_FINDINGS'];
    const results=[];
    const check=(id,pass)=>results.push({id,pass:Boolean(pass)});
    check('QUESTION_PRESENT',question&&!duplicates.has(questionId));
    check('QUESTION_STRUCTURE',question&&typeof question.question==='string'&&question.answer&&typeof question.answer==='object');
    check('QUESTION_EXPLANATION',question&&typeof question.explanation==='string'&&question.explanation.trim().length>0);
    check('QUESTION_GATE_FINDINGS',question&&!auditFindings.some(f=>f.id===questionId));
    const executedCheckIds=results.map(x=>x.id),passedCheckIds=results.filter(x=>x.pass).map(x=>x.id),failedCheckIds=results.filter(x=>!x.pass).map(x=>x.id);
    const sourceHash=question?crypto.createHash('sha256').update(JSON.stringify(question)).digest('hex'):null;
    return {questionId,requiredCheckIds,executedCheckIds,passedCheckIds,failedCheckIds,sourceHash,status:requiredCheckIds.every(id=>executedCheckIds.includes(id))&&failedCheckIds.length===0?'PASS':'FAIL'};
  });
}

function summarizeQuestions(records,questions){
  const expectedIds=core.json('independent-audit/golden/question-ids.json').ids,expected=new Set(expectedIds),reviewed=new Set(records.map(x=>x.questionId)),actual=Object.keys(questions);
  const duplicates=actual.length-new Set(actual).size;
  return {TOTAL:expectedIds.length,DIRECTLY_TESTED:records.filter(x=>x.requiredCheckIds.length>0&&x.requiredCheckIds.every(id=>x.executedCheckIds.includes(id))).length,PASS:records.filter(x=>x.status==='PASS').length,FAIL:records.filter(x=>x.status==='FAIL').length,MISSING:expectedIds.filter(id=>!reviewed.has(id)||!records.find(x=>x.questionId===id)?.sourceHash).length,DUPLICATE:duplicates+actual.filter(id=>!expected.has(id)).length};
}

module.exports={LAYERS,gateContracts,loadContracts,validateContract,evaluateContract,executeContracts,questionReview,summarizeQuestions};
