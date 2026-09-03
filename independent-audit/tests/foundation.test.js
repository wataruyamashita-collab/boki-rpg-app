'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),childProcess=require('child_process');
const c=require('../../scripts/qa/audit-core'),runner=require('../../scripts/qa/contract-runner');
assert.strictEqual(Object.keys(c.loadProduction().questions).length,300);
const preExisting=[{gate:'GATE-10',code:'UNREACHABLE_STORY_QUESTION',id:'C006'}];
const noCausalChange=c.findingDelta(preExisting,structuredClone(preExisting),'UNREACHABLE_STORY_QUESTION');
assert.strictEqual(noCausalChange.causalDeltaConfirmed,false,'a pre-existing failure code cannot kill a mutation without a new finding');
const mutations=c.mutations();
assert.strictEqual(mutations.length,19);
assert.strictEqual(mutations.filter(x=>x.status==='SURVIVED').length,0);
assert(mutations.every(x=>x.causalDeltaConfirmed===true),'every required mutation must have a causal finding delta');
assert.strictEqual(c.lockCheck().ok,true);

const baseContract={requiredCheckIds:['S','L'],requiredLayers:['STRUCTURAL','LEARNING'],notApplicableLayers:['ACCOUNTING_SEMANTIC','ADVERSARIAL'],dependencies:[],passPolicy:'all-required-checks-and-layers-pass',checkLayers:{S:'STRUCTURAL',L:'LEARNING'}};
const missingCheck=runner.evaluateContract('TEST',baseContract,{S:{status:'PASS'}});
assert.strictEqual(missingCheck.status,'FAIL');
assert(missingCheck.findings.some(x=>x.code==='REQUIRED_CHECK_NOT_EXECUTED'));
const zeroChecks=runner.evaluateContract('TEST',{...baseContract,requiredCheckIds:[],checkLayers:{}},{});
assert.strictEqual(zeroChecks.status,'FAIL');
assert(zeroChecks.findings.some(x=>x.code==='CHECK_COUNT_ZERO'));
assert.notStrictEqual(missingCheck.layers.STRUCTURAL,missingCheck.layers.LEARNING,'layers must be independently measured objects');
assert.deepStrictEqual(missingCheck.layers.STRUCTURAL.executedCheckIds,['S']);
assert.deepStrictEqual(missingCheck.layers.LEARNING.executedCheckIds,[]);

const reviews=runner.questionReview(c.loadProduction().questions,[]),complete=runner.summarizeQuestions(reviews,c.loadProduction().questions),oneUnaudited=runner.summarizeQuestions(reviews.slice(1),c.loadProduction().questions);
assert.strictEqual(complete.TOTAL,300);
assert.strictEqual(complete.DIRECTLY_TESTED,300);
assert.strictEqual(oneUnaudited.DIRECTLY_TESTED,299,'coverage must be computed from review records, not a constant');
assert.strictEqual(oneUnaudited.MISSING,1);

for(const count of [50,20])assert.strictEqual(c.assessStoryMetrics(25,Array.from({length:count},(_,i)=>`Q${i+1}`),Array.from({length:count},(_,i)=>`Q${i+1}`)).displayCountMismatch,1);
assert.strictEqual(c.assessStoryMetrics(3,['Q1','Q2','Q3','Q4'],['Q1','Q2','Q4']).positionGap,1);

const auditedFile=path.join(c.ROOT,'independent-audit/contracts/semantic.json'),lockCreator=path.join(c.ROOT,'scripts/qa/create-audit-lock.js');
for(const target of [auditedFile,lockCreator]){const original=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.strictEqual(c.lockCheck().ok,false);assert(c.lockCheck().errors.some(error=>error===path.relative(c.ROOT,target)),'one-byte audit tamper must identify the changed file');}finally{fs.writeFileSync(target,original);}}
const relock=childProcess.spawnSync(process.execPath,[lockCreator],{cwd:c.ROOT,encoding:'utf8'});
assert.notStrictEqual(relock.status,0,'an existing lock must never be regenerated');
assert.match(relock.stderr,/AUDIT_LOCK_CREATE_REFUSED/);
assert.strictEqual(c.lockCheck().ok,true,'a rejected re-lock must not alter the existing lock');
console.log('independent foundation tests: ok');
