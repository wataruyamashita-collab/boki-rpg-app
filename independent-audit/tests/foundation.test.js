'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),childProcess=require('child_process');
const c=require('../../scripts/qa/audit-core'),runner=require('../../scripts/qa/contract-runner');
assert.strictEqual(Object.keys(c.loadProduction().questions).length,300);
const preExisting=[{gate:'GATE-10',code:'UNREACHABLE_STORY_QUESTION',id:'C006'}];
const noCausalChange=c.findingDelta(preExisting,structuredClone(preExisting),'UNREACHABLE_STORY_QUESTION');
assert.strictEqual(noCausalChange.causalDeltaConfirmed,false,'a pre-existing failure code cannot kill a mutation without a new finding');
// One integrity invocation must use one authority snapshot, never a global cache.
// Keep the same fail-closed decisions for current, pending and competing tips.
{
  const lifecycle=require('../../scripts/qa/phase-b-lifecycle');
  const saved={verifyCurrent:lifecycle.verifyCurrent,generationAuthorities:lifecycle.generationAuthorities,verifyCandidate:lifecycle.verifyCandidate};
  const directory='reports/auto-gate/audit-locks';
  const files=fs.readdirSync(path.join(c.ROOT,directory)).filter(name=>/^phase-b-generation-\d+\.json$/u.test(name)).sort((a,b)=>Number(a.match(/\d+/u)[0])-Number(b.match(/\d+/u)[0]));
  const authorities=files.map(name=>({file:`${directory}/${name}`}));
  const pending=JSON.parse(fs.readFileSync(path.join(c.ROOT,authorities[authorities.length-1].file),'utf8'));
  let historyCalls=0,candidateCalls=0,selected=authorities.slice(0,-1),candidateOK=true;
  const drift={ok:false,errors:['INTEGRITY_SNAPSHOT_TEST_DRIFT']};
  try{
    lifecycle.verifyCurrent=()=>drift;
    lifecycle.generationAuthorities=()=>{historyCalls++;return selected;};
    lifecycle.verifyCandidate=candidate=>{candidateCalls++;assert.strictEqual(candidate.generation,pending.generation);return {ok:candidateOK,errors:candidateOK?[]:['INVALID_PENDING']};};
    const valid=c.currentIntegrityCheck();
    assert.strictEqual(valid.ok,true,'one valid pending successor remains accepted');
    assert.strictEqual(valid.generation,pending.generation);
    assert.strictEqual(historyCalls,1,'load generation history once per integrity invocation');
    assert.strictEqual(candidateCalls,1,'validate the pending candidate');
    selected=authorities;
    assert.strictEqual(c.currentIntegrityCheck(),drift,'no pending successor retains the current failure');
    assert.strictEqual(historyCalls,2,'a new invocation must re-read authority state');
    assert.strictEqual(candidateCalls,1);
    selected=authorities.slice(0,-2);
    assert.strictEqual(c.currentIntegrityCheck(),drift,'competing pending successors fail closed');
    assert.strictEqual(historyCalls,3);assert.strictEqual(candidateCalls,1);
    selected=authorities.slice(0,-1);candidateOK=false;
    assert.strictEqual(c.currentIntegrityCheck(),drift,'an invalid pending successor cannot hide current drift');
    assert.strictEqual(historyCalls,4);assert.strictEqual(candidateCalls,2);
    const current={ok:true};lifecycle.verifyCurrent=()=>current;
    assert.strictEqual(c.currentIntegrityCheck(),current,'a valid committed authority remains authoritative');
    assert.strictEqual(historyCalls,4,'do not perform pending discovery for a valid committed tip');
  }finally{Object.assign(lifecycle,saved);}
}
const mutations=c.mutations();
assert.strictEqual(mutations.length,19);
assert.strictEqual(mutations.filter(x=>x.status==='SURVIVED').length,0);
assert(mutations.every(x=>x.causalDeltaConfirmed===true),'every required mutation must have a causal finding delta');
assert.strictEqual(c.currentIntegrityCheck().ok,true);
for(const contract of Object.values(runner.loadContracts())){const requirementIds=contract.requirements.map(x=>x.requirementId),checkIds=contract.requirements.map(x=>x.requiredCheckId);assert.strictEqual(new Set(requirementIds).size,requirementIds.length,`${contract.id} requirement IDs must be unique`);assert.strictEqual(new Set(checkIds).size,checkIds.length,`${contract.id} requirements must map one-to-one to checks`);assert.deepStrictEqual(new Set(checkIds),new Set(contract.requiredCheckIds));assert(checkIds.every(id=>typeof runner.executableChecks[id]==='function'),`${contract.id} requirements must all be executable`);}

const baseContract={requirements:[{requirementId:'R1',requiredCheckId:'SEMANTIC_VALUE_UNITS'},{requirementId:'R2',requiredCheckId:'USER_FACING_EXPLANATION_RELATIONS'}],requiredCheckIds:['SEMANTIC_VALUE_UNITS','USER_FACING_EXPLANATION_RELATIONS'],requiredLayers:['ACCOUNTING_SEMANTIC','LEARNING'],notApplicableLayers:['STRUCTURAL','ADVERSARIAL'],dependencies:[],passPolicy:'all-required-checks-layers-and-dependencies-pass',checkLayers:{SEMANTIC_VALUE_UNITS:'ACCOUNTING_SEMANTIC',USER_FACING_EXPLANATION_RELATIONS:'LEARNING'}};
const missingCheck=runner.evaluateContract('TEST',baseContract,{SEMANTIC_VALUE_UNITS:{status:'PASS'}});
assert.strictEqual(missingCheck.status,'FAIL');
assert(missingCheck.findings.some(x=>x.code==='REQUIRED_CHECK_NOT_EXECUTED'));
const zeroChecks=runner.evaluateContract('TEST',{...baseContract,requiredCheckIds:[],checkLayers:{}},{});
assert.strictEqual(zeroChecks.status,'FAIL');
assert(zeroChecks.findings.some(x=>x.code==='CHECK_COUNT_ZERO'));
assert.notStrictEqual(missingCheck.layers.STRUCTURAL,missingCheck.layers.LEARNING,'layers must be independently measured objects');
assert.deepStrictEqual(missingCheck.layers.ACCOUNTING_SEMANTIC.executedCheckIds,['SEMANTIC_VALUE_UNITS']);
assert.deepStrictEqual(missingCheck.layers.LEARNING.executedCheckIds,[]);
const orphanRequirement=runner.evaluateContract('TEST',{...baseContract,requirements:[{requirementId:'ORPHAN',requiredCheckId:'NO_EXECUTABLE_CHECK'}],requiredCheckIds:['NO_EXECUTABLE_CHECK'],checkLayers:{NO_EXECUTABLE_CHECK:'LEARNING'}},{});
assert(orphanRequirement.findings.some(x=>x.code==='REQUIREMENT_WITHOUT_EXECUTABLE_CHECK'));
const dependencyFailure=runner.evaluateContract('TEST',{...baseContract,dependencies:[{gateId:'GATE-X',acceptedStatuses:['PASS']}]},{SEMANTIC_VALUE_UNITS:{status:'PASS'},USER_FACING_EXPLANATION_RELATIONS:{status:'PASS'}},[],{'GATE-X':{status:'FAIL',findings:[{code:'KNOWN_RED'}]}});
assert(dependencyFailure.findings.some(x=>x.code==='DEPENDENCY_NOT_SATISFIED'));

const reviews=runner.questionReview(c.loadProduction().questions,[]),complete=runner.summarizeQuestions(reviews,c.loadProduction().questions),oneUnaudited=runner.summarizeQuestions(reviews.slice(1),c.loadProduction().questions);
assert.strictEqual(complete.TOTAL,300);
assert.strictEqual(complete.DIRECTLY_TESTED,300);
assert.strictEqual(oneUnaudited.DIRECTLY_TESTED,299,'coverage must be computed from review records, not a constant');
assert.strictEqual(oneUnaudited.MISSING,1);
for(const [type,checks] of Object.entries(runner.typeQuestionChecks)){const row=reviews.find(item=>item.questionType===type);assert(row,`missing direct audit record for ${type}`);assert(Object.keys(checks).every(id=>row.requiredCheckIds.includes(id)),`${type} must execute every type-specific check`);}
assert(reviews.every(row=>row.requiredCheckIds.includes('INDEPENDENT_EXPECTED_ANSWER')&&row.executedCheckIds.includes('INDEPENDENT_EXPECTED_ANSWER')));
assert.strictEqual(complete.INDEPENDENT_EXPECTED_CHECKED,300);
const answerCorruptions=runner.answerCorruptionMutations();assert.strictEqual(answerCorruptions.length,9);assert(answerCorruptions.every(x=>x.status==='KILLED'),'every answer corruption, including coordinated answer/explanation corruption, must be killed');
assert.strictEqual(runner.oracleSelfReferenceFindings().length,0);
const oracleFile=path.join(c.ROOT,'independent-audit/oracles/expected-answer-oracle.js'),oracleSource=fs.readFileSync(oracleFile);try{fs.appendFileSync(oracleFile,'\nquestion.answer;\n');assert(runner.oracleSelfReferenceFindings().some(x=>x.code==='ORACLE_SELF_REFERENCE'));}finally{fs.writeFileSync(oracleFile,oracleSource);}

for(const count of [50,20])assert.strictEqual(c.assessStoryMetrics(25,Array.from({length:count},(_,i)=>`Q${i+1}`),Array.from({length:count},(_,i)=>`Q${i+1}`)).displayCountMismatch,1);
assert.strictEqual(c.assessStoryMetrics(3,['Q1','Q2','Q3','Q4'],['Q1','Q2','Q4']).positionGap,1);

const auditedFile=path.join(c.ROOT,'independent-audit/contracts/semantic.json'),lockCreator=path.join(c.ROOT,'scripts/qa/create-audit-lock.js');
for(const target of [auditedFile,lockCreator]){const original=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.strictEqual(c.currentIntegrityCheck().ok,false);assert(c.currentIntegrityCheck().errors.some(error=>error===path.relative(c.ROOT,target)),'one-byte audit tamper must identify the changed file');}finally{fs.writeFileSync(target,original);}}
const relock=childProcess.spawnSync(process.execPath,[lockCreator],{cwd:c.ROOT,encoding:'utf8'});
assert.notStrictEqual(relock.status,0,'an existing lock must never be regenerated');
assert.match(relock.stderr,/AUDIT_LOCK_CREATE_REFUSED/);
assert.strictEqual(c.currentIntegrityCheck().ok,true,'a rejected re-lock must not alter the existing lock');
console.log('independent foundation tests: ok');
