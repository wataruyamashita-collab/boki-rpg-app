'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');
const root=path.resolve(__dirname,'../..');
const stable=value=>JSON.stringify(value);
const expectedGates=Array.from({length:15},(_,index)=>`GATE-${String(index+1).padStart(2,'0')}`);

function validateEvidence({authorities,final,rows,gateReports,integrity,currentSourceHashes}){
  const generations=authorities.map(item=>(item.document||item).generation);
  assert(generations.length===1||generations.length===2,'supported successor authority count must be one or two');
  assert.deepStrictEqual(generations,generations.length===1?[2]:[2,3],'supported successor sequence must be exactly [2] or [2,3]');
  if(generations.length===2)assert.deepStrictEqual((authorities[1].document||authorities[1]).predecessor,lifecycle.identity(authorities[0].document||authorities[0]),'Generation 3 predecessor must be exact Generation 2 identity');
  assert.strictEqual(rows.length,300);
  assert.strictEqual(new Set(rows.map(row=>row.questionId)).size,300);
  assert(rows.every(row=>row.questionType&&row.requiredCheckIds.length>3&&row.requiredCheckIds.every(id=>row.executedCheckIds.includes(id))));
  assert.strictEqual(final.coverage.TOTAL,300);assert.strictEqual(final.coverage.DIRECTLY_TESTED,300);assert.strictEqual(final.coverage.MISSING,0);assert.strictEqual(final.coverage.DUPLICATE,0);
  assert.strictEqual(final.coverage.INDEPENDENT_EXPECTED_CHECKED,300);assert.strictEqual(final.oracleSelfReference,0);
  assert.deepStrictEqual(final.gateImplementation,{unimplemented:0,requiredCheckNotExecuted:0,requiredLayerNotExecuted:0,checkCountZero:0,allRequirementsHaveExecutableCheck:true});
  assert.strictEqual(final.dependencies.deadMetadata,0);assert.strictEqual(final.dependencies.declared,final.dependencies.evaluated);assert(final.dependencies.declared>0);
  assert.strictEqual(final.productionModified,false);
  assert.deepStrictEqual(final.mutations,{required:19,killed:19,survived:0,causalDeltaConfirmed:'19/19'});
  assert.deepStrictEqual(final.answerCorruptionMutations,{required:9,killed:9,survived:0});
  assert.strictEqual(final.story.ROUTING_INTEGRATION,'TESTED');assert.strictEqual(final.story.BROWSER_E2E,'UNVERIFIED');
  assert.strictEqual(integrity.ok,true,'current committed authority integrity must pass');
  assert.strictEqual(final.auditHash,integrity.hash,'auto-gate audit hash must match current authority');
  assert.strictEqual(stable(final.sourceHashes),stable(currentSourceHashes),'auto-gate Production hashes must match current bytes');
  if(generations.length===1){
    assert.strictEqual(final.status,'FAIL','Generation 2 historical evidence must remain RED');
  }else{
    assert.strictEqual(final.status,'PASS','Generation 3 evidence must be GREEN');
    assert.strictEqual(final.dependencies.unsatisfied,0);
    assert.deepStrictEqual(final.findings,[]);
    assert(rows.every(row=>row.requiredCheckIds.every(id=>row.passedCheckIds.includes(id))&&row.status==='PASS'),'all 300 direct reviews must pass every required check');
    assert.deepStrictEqual(Object.keys(final.gateStatuses).sort(),expectedGates.slice().sort());
    assert(expectedGates.every(gate=>final.gateStatuses[gate]==='PASS'),'all 15 final gate statuses must pass');
    assert.deepStrictEqual(Object.keys(gateReports).sort(),expectedGates.slice().sort(),'all 15 gate reports must be present');
    for(const gate of expectedGates){const report=gateReports[gate];assert.strictEqual(report.status,'PASS',`${gate} report must pass`);assert.strictEqual(stable(report.sourceHashes),stable(final.sourceHashes),`${gate} source hashes must match final evidence`);}
  }
  return true;
}

function loadCurrentEvidence(){
  const report=name=>JSON.parse(fs.readFileSync(path.join(root,'reports/auto-gate',name),'utf8'));
  const final=report('final.json');
  const rows=fs.readFileSync(path.join(root,'reports/auto-gate/question-review.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const gateReports=Object.fromEntries(expectedGates.map(gate=>[gate,report(`gate-${gate.slice(-2)}.json`)]));
  const currentSourceHashes=Object.fromEntries(core.productionFiles().map(file=>[file,core.sha(file)]));
  return {authorities:lifecycle.generationAuthorities(),final,rows,gateReports,integrity:core.currentIntegrityCheck(),currentSourceHashes};
}

if(require.main===module){
  const state=loadCurrentEvidence();validateEvidence(state);
  const generations=state.authorities.map(item=>item.document.generation).join(',');
  console.log(`auto-gate state validator: ok (successor authorities [${generations}])`);
}
module.exports={expectedGates,loadCurrentEvidence,validateEvidence};
