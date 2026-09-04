'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),childProcess=require('child_process');
const c=require('../../scripts/qa/audit-core'),runner=require('../../scripts/qa/contract-runner'),predicates=require('../../scripts/qa/question-predicates');
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
assert.strictEqual(complete.PASS,300);assert.strictEqual(complete.FAIL,0);
const productionQuestions=c.loadProduction().questions,worksheetRows=reviews.filter(row=>row.questionType==='worksheet');
assert.strictEqual(worksheetRows.length,20);assert(worksheetRows.every(row=>row.status==='PASS'),'every runtime worksheet subtype must pass its schema audit');
const coverageMutation=structuredClone(productionQuestions.D002);delete coverageMutation.answer.cells[coverageMutation.table.inputCells[0]];assert.strictEqual(predicates.answerCoverage(coverageMutation),false,'missing input answer must fail closed');
const eightColumnMutation=structuredClone(productionQuestions.D001);eightColumnMutation.table.columns.splice(7,2);assert.strictEqual(predicates.supportedWorksheet(eightColumnMutation),false,'missing P/L or B/S columns must fail closed');
const adjustmentMutation=structuredClone(productionQuestions.D002);delete adjustmentMutation.table.rows[0].after;assert.strictEqual(predicates.supportedWorksheet(adjustmentMutation),false,'broken adjustment/after structure must fail closed');
const unknownMutation=structuredClone(productionQuestions.D020);unknownMutation.format='future-worksheet';assert.strictEqual(predicates.supportedWorksheet(unknownMutation),false,'unknown worksheet formats must fail closed');
for(const id of ['C001','C003'])assert.strictEqual(reviews.find(row=>row.questionId===id).status,'PASS',`${id} must pass without surface connective-word exceptions`);
const comprehensiveMutation=structuredClone(productionQuestions.C001),relationCheck=runner.typeQuestionChecks.comprehensive.COMPREHENSIVE_CASH_PROFIT_RELATION,baselineResults=Object.fromEntries(Object.entries(runner.typeQuestionChecks.comprehensive).map(([id,check])=>[id,check(comprehensiveMutation)]));
comprehensiveMutation.explanation=comprehensiveMutation.explanation.split(/[。\n]/u).filter(sentence=>!(sentence.includes('現金')&&/(利益|収益|費用)/u.test(sentence))).join('。');
const mutatedResults=Object.fromEntries(Object.entries(runner.typeQuestionChecks.comprehensive).map(([id,check])=>[id,check(comprehensiveMutation)]));assert(Object.values(baselineResults).every(Boolean));assert.strictEqual(mutatedResults.COMPREHENSIVE_CASH_PROFIT_RELATION,false);for(const id of ['COMPREHENSIVE_CROSS_SOURCE','COMPREHENSIVE_CALCULATION','COMPREHENSIVE_FINAL_ANSWER'])assert.strictEqual(mutatedResults[id],true,`${id} must remain PASS in the focused semantic mutation`);
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
const lockPath=path.join(c.ROOT,'reports/auto-gate/audit-lock.json'),lock=JSON.parse(fs.readFileSync(lockPath));assert.strictEqual(lock.lockSchemaVersion,2);assert.strictEqual(lock.phase,'A_FINAL_IMMUTABLE_BASELINE');assert.strictEqual(lock.baselineVersion,1);assert(!JSON.stringify(lock).includes(c.reachableV2Locks()[0]?.commit||'__NO_COMMIT__'),'tracked evidence must not persist its baseline commit SHA');assert(!fs.readFileSync(lockCreator,'utf8').includes("'--all'"),'lock ancestry must be restricted to HEAD');
const duplicateFinalization=childProcess.spawnSync(process.execPath,[lockCreator,'--finalize-v2'],{cwd:c.ROOT,encoding:'utf8'});assert.notStrictEqual(duplicateFinalization.status,0,'an existing V2 lock must never be regenerated');assert.match(duplicateFinalization.stderr,/V2 audit lock already exists/);
console.log('independent foundation tests: ok');
