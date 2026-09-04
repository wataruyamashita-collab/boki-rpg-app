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
assert.strictEqual(complete.records,300);assert.strictEqual(complete.unique,300);
const finalContract=runner.loadContracts()['GATE-15'];
const finalStatuses=records=>Object.fromEntries(finalContract.requiredCheckIds.map(id=>[id,{status:(runner.executableChecks[id]({questionRecords:records,production:c.loadProduction(),lockResult:{ok:true},auditResult:{findings:[]}})||[]).length?'FAIL':'PASS'}]));
assert.strictEqual(finalStatuses(reviews).INDEPENDENT_EXPECTED_ALL_PASS.status,'PASS','CASE A1 baseline');
const corruptedQuestions=structuredClone(c.loadProduction().questions);corruptedQuestions.J001.answer.debit[0].amount+=1;const corruptedReviews=runner.questionReview(corruptedQuestions);
const corruptFinal=runner.evaluateContract('GATE-15',finalContract,finalStatuses(corruptedReviews));assert(corruptFinal.failedCheckIds.includes('INDEPENDENT_EXPECTED_ALL_PASS'),'CASE A1 corruption must fail final-integrity');
assert.strictEqual(finalStatuses(reviews).DIRECT_AUDIT_COMPLETE.status,'PASS','CASE A2 baseline');
const missingFinal=runner.evaluateContract('GATE-15',finalContract,finalStatuses(reviews.slice(1)));assert(missingFinal.failedCheckIds.includes('DIRECT_AUDIT_COMPLETE'),'CASE A2 missing record must fail final-integrity');
const worksheets=Object.values(c.loadProduction().questions).filter(q=>q.type==='worksheet');assert(worksheets.every(q=>runner.worksheetSchema(q).valid),'D001-D020 worksheet baseline');assert.deepStrictEqual(new Set(worksheets.map(q=>runner.worksheetSchema(q).kind)),new Set(['eight-column-worksheet','adjustment-calculation','adjusted-trial-balance','closing-entries']));
const worksheetMutations=[q=>{delete q.answer.cells[q.table.inputCells[0]];},q=>{q.table.columns=q.table.columns.filter(column=>!column.includes('損益計算書'));},q=>{delete q.table.rows[0].after;},q=>{q.format='unknown-worksheet';}];for(const [index,mutate] of worksheetMutations.entries()){const q=structuredClone(worksheets[index===1?0:1]);mutate(q);assert.strictEqual(runner.worksheetSchema(q).valid,false,`worksheet predicate mutation ${index+1}`);}
for(const id of ['C001','C003'])assert(runner.cashPerformanceRelation(c.loadProduction().questions[id].explanation),`${id} relation baseline`);
const relationMutation=structuredClone(c.loadProduction().questions.C001);relationMutation.explanation=relationMutation.explanation.replace('現金の増減と収益・費用の発生を分けてから、','');assert.strictEqual(runner.typeQuestionChecks.comprehensive.COMPREHENSIVE_CROSS_SOURCE(relationMutation),true);assert.strictEqual(runner.typeQuestionChecks.comprehensive.COMPREHENSIVE_CALCULATION(relationMutation),true);assert.strictEqual(runner.typeQuestionChecks.comprehensive.COMPREHENSIVE_FINAL_ANSWER(relationMutation),true);assert.strictEqual(runner.typeQuestionChecks.comprehensive.COMPREHENSIVE_RELATION(relationMutation),false,'relation-only mutation must be killed');
const answerCorruptions=runner.answerCorruptionMutations();assert.strictEqual(answerCorruptions.length,9);assert(answerCorruptions.every(x=>x.status==='KILLED'),'every answer corruption, including coordinated answer/explanation corruption, must be killed');
assert.strictEqual(runner.oracleSelfReferenceFindings().length,0);
const oracleFile=path.join(c.ROOT,'independent-audit/oracles/expected-answer-oracle.js'),oracleSource=fs.readFileSync(oracleFile);try{fs.appendFileSync(oracleFile,'\nquestion.answer;\n');assert(runner.oracleSelfReferenceFindings().some(x=>x.code==='ORACLE_SELF_REFERENCE'));}finally{fs.writeFileSync(oracleFile,oracleSource);}

for(const count of [50,20])assert.strictEqual(c.assessStoryMetrics(25,Array.from({length:count},(_,i)=>`Q${i+1}`),Array.from({length:count},(_,i)=>`Q${i+1}`)).displayCountMismatch,1);
assert.strictEqual(c.assessStoryMetrics(3,['Q1','Q2','Q3','Q4'],['Q1','Q2','Q4']).positionGap,1);

const auditedFile=path.join(c.ROOT,'independent-audit/contracts/semantic.json'),lockCreator=path.join(c.ROOT,'scripts/qa/create-audit-lock.js');
for(const target of [auditedFile,lockCreator]){const original=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.strictEqual(c.lockCheck().ok,false);assert(c.lockCheck().errors.some(error=>error===path.relative(c.ROOT,target)),'one-byte audit tamper must identify the changed file');}finally{fs.writeFileSync(target,original);}}
const relock=childProcess.spawnSync(process.execPath,[lockCreator],{cwd:c.ROOT,encoding:'utf8'});
assert.notStrictEqual(relock.status,0,'an existing lock must never be regenerated');
assert.match(relock.stderr,/AUDIT_LOCK_CREATE_REFUSED/);
assert.strictEqual(c.lockCheck().ok,true,'a rejected re-lock must not alter the existing lock');
const lockPath=path.join(c.ROOT,'reports/auto-gate/audit-lock.json'),savedLock=fs.readFileSync(lockPath);try{fs.unlinkSync(lockPath);const deletedBootstrap=childProcess.spawnSync(process.execPath,[lockCreator,'--bootstrap'],{cwd:c.ROOT,encoding:'utf8'});assert.notStrictEqual(deletedBootstrap.status,0,'deleting a tracked lock must not restore bootstrap eligibility');assert.match(deletedBootstrap.stderr,/AUDIT_LOCK_CREATE_REFUSED/);assert.strictEqual(fs.existsSync(lockPath),false,'rejected bootstrap must not create a replacement lock');}finally{fs.writeFileSync(lockPath,savedLock);}
console.log('independent foundation tests: ok');
