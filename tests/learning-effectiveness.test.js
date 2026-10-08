'use strict';
const assert = require('assert');
const Model = require('../js/model');
const clone = value => JSON.parse(JSON.stringify(value));
const questions = {
  Q:{id:'Q',type:'journal',category:'仕訳',difficulty:1},
  R:{id:'R',type:'journal',category:'仕訳',difficulty:1,learningRole:'review'},
  T:{id:'T',type:'ledger',category:'帳簿',difficulty:2,table:{inputCells:['a','b']}}
};
const storage = (value = null) => ({value,writes:0,getItem(){return this.value;},setItem(_key,next){this.value=next;this.writes++;return true;}});
const fresh = value => {const store=storage(value);return {model:new Model(questions,store,'test'),store};};
const evidence = (model,id='Q') => {
  assert(model.state.learningEffectiveness,'Durable learning evidence is absent');
  return model.learningEffectivenessForQuestion(id);
};
const answer = (model,id,correct,at,options={}) => {
  const mode=options.mode || model.state.mode;
  model.state.mode=mode;
  return model.recordAttempt(id,correct,1000,correct?'':options.tag || (id==='T'?'a':'journal-entry'),Boolean(options.reviewSourceId&&correct),at,options.stage??null,'unsure',{
    mode,support:options.support || 'none',observationNumber:options.number ?? model.nextLearningObservation?.(id),reviewSourceId:options.reviewSourceId || null
  });
};
const schedule = (model,source='Q',target='R',stage=1,dueAt=2000) => {
  model.state.reviewSchedule[source]={stage,dueAt};model.assignReview(source,target,dueAt-1);model.state.mode='review';
};
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack);}}

test('fresh unanswered is distinct from unknown and wrong',()=>{
  const {model}=fresh();const value=evidence(model);
  assert.strictEqual(value.initialStatus,'unanswered');assert.strictEqual(value.firstAttempt,null);
  assert.strictEqual(value.observedAttempts,0);assert.strictEqual(value.delayedReview.highestConfirmedStage,null);
  assert.strictEqual(model.learningEffectivenessForQuestion('missing'),null);
});
test('first result/time/mode/support survive 200-row eviction and reload',()=>{
  let {model,store}=fresh();assert(answer(model,'Q',false,1000,{mode:'training',support:'hint-1'}));
  for(let i=0;i<250;i++)assert(answer(model,'Q',true,2000+i,{mode:'story'}));
  model=new Model(questions,store,'test');const value=evidence(model);
  assert.strictEqual(model.state.attempts.length,200);assert(!model.state.attempts.some(x=>x.timestamp===1000));
  assert.deepStrictEqual(value.firstAttempt,{correct:false,at:1000,mode:'training',support:'hint-1'});
  assert.strictEqual(value.initialStatus,'observed');assert.strictEqual(value.observedAttempts,251);
  assert.deepStrictEqual([value.correctCount,value.incorrectCount],[250,1]);
  assert.deepStrictEqual(value.modes.training,{attempts:1,successes:0});assert.deepStrictEqual(value.modes.story,{attempts:250,successes:250});
  assert.strictEqual(model.questionAccuracy('Q').attempts,251);
});
test('detailed attempts persist mode/support and observation number',()=>{
  const {model}=fresh();assert(answer(model,'T',true,1000,{mode:'exam',support:'unknown'}));
  const row=model.state.attempts.at(-1);assert.strictEqual(row.mode,'exam');assert.strictEqual(row.support,'unknown');assert.strictEqual(row.observationNumber,1);
});
test('all modes have separate bounded counters',()=>{
  const {model}=fresh();for(const [i,mode] of ['story','training','review','exam','desk'].entries())assert(answer(model,'Q',i%2===0,1000+i,{mode}));
  const value=evidence(model);assert.strictEqual(value.observedAttempts,5);
  for(const [i,mode] of ['story','training','review','exam','desk'].entries())assert.deepStrictEqual(value.modes[mode],{attempts:1,successes:i%2===0?1:0});
  assert.strictEqual(value.delayedReview.attempts,0,'Review mode alone is not delayed retention');
});
test('due review measures source retention and target initial performance separately',()=>{
  const {model}=fresh();schedule(model);assert(answer(model,'R',true,2000,{mode:'review',reviewSourceId:'Q',stage:1}));
  assert.deepStrictEqual(evidence(model,'R').firstAttempt,{correct:true,at:2000,mode:'review',support:'none'});
  const source=evidence(model);assert.strictEqual(source.observedAttempts,0);assert.strictEqual(source.firstAttempt,null);
  assert.deepStrictEqual([source.delayedReview.attempts,source.delayedReview.successes,source.delayedReview.lastAt,source.delayedReview.highestConfirmedStage],[1,1,2000,2]);
  assert.deepStrictEqual(source.delayedReview.stages[1],{attempts:1,successes:1});
  assert(model.completeReview('Q',true,2000,'R'));assert.strictEqual(evidence(model).delayedReview.attempts,1);
  assert.strictEqual(model.completeReview('Q',true,2000,'R'),false);
});
test('failed due review counts once without a confirmed success stage',()=>{
  const {model}=fresh();schedule(model,'Q','R',2);assert(answer(model,'R',false,2000,{mode:'review',reviewSourceId:'Q',stage:2}));
  const value=evidence(model).delayedReview;assert.strictEqual(value.attempts,1);assert.strictEqual(value.successes,0);assert.strictEqual(value.highestConfirmedStage,null);
  assert(model.completeReview('Q',false,2000,'R'));assert.strictEqual(model.state.reviewSchedule.Q.stage,0);
});
for(const kind of ['early','wrong-target','stale-schedule','wrong-mode','missing-assignment'])test(kind+' is not delayed-retention evidence',()=>{
  const {model}=fresh();schedule(model);
  if(kind==='stale-schedule')model.state.reviewSchedule.Q.stage=2;
  if(kind==='missing-assignment')delete model.state.reviewAssignments.Q;
  assert(answer(model,kind==='wrong-target'?'T':'R',true,kind==='early'?1999:2000,{mode:kind==='wrong-mode'?'training':'review',reviewSourceId:'Q',stage:1}));
  assert.strictEqual(evidence(model).delayedReview.attempts,0);
});
test('delayed failure/success totals and stages persist beyond 200 attempts',()=>{
  let {model,store}=fresh();
  for(let i=0;i<220;i++){schedule(model,'Q','R',i%4,1000+i);assert(answer(model,'R',i%3!==0,1000+i,{mode:'review',reviewSourceId:'Q',stage:i%4}));assert(model.completeReview('Q',i%3!==0,1000+i,'R'));}
  model=new Model(questions,store,'test');const value=evidence(model).delayedReview;
  assert.strictEqual(value.attempts,220);assert.strictEqual(value.successes,146);assert.strictEqual(value.highestConfirmedStage,4);
  assert.strictEqual(value.stages.reduce((n,x)=>n+x.attempts,0),220);assert.strictEqual(value.stages.reduce((n,x)=>n+x.successes,0),146);
});
test('wrong patterns and unassisted recovery are durable and not counted twice',()=>{
  let {model,store}=fresh();answer(model,'Q',false,1000);answer(model,'Q',false,1001);answer(model,'Q',true,1002);answer(model,'Q',true,1003);
  for(let i=0;i<205;i++)answer(model,'R',true,2000+i);
  model=new Model(questions,store,'test');const pattern=evidence(model).misconceptionStats['journal-entry'];
  assert.strictEqual(pattern.occurrences,2);assert.strictEqual(pattern.recoveredCount,1);assert.strictEqual(pattern.pending,false);assert.strictEqual(pattern.lastOccurredAt,1001);assert.strictEqual(pattern.lastRecoveredAt,1002);
});
test('assisted correction is separate from unassisted recovery and ordinary scores',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);const stats=clone(model.state.questionStats),continuity=clone(model.state.learningContinuityState),rows=clone(model.state.attempts);
  assert(model.recordAssistedRecovery('Q',1,1100));assert.strictEqual(model.recordAssistedRecovery('Q',1,1101),false);
  let pattern=evidence(model).misconceptionStats['journal-entry'];assert.strictEqual(pattern.assistedRecoveredCount,1);assert.strictEqual(pattern.recoveredCount,0);assert.strictEqual(pattern.pending,true);
  assert.deepStrictEqual(model.state.questionStats,stats);assert.deepStrictEqual(model.state.attempts,rows);assert.deepStrictEqual(model.state.learningContinuityState,continuity);
  answer(model,'Q',true,1200);pattern=evidence(model).misconceptionStats['journal-entry'];assert.strictEqual(pattern.recoveredCount,1);assert.strictEqual(pattern.assistedRecoveredCount,1);assert.strictEqual(pattern.pending,false);
});
test('hinted correct and unknown support do not manufacture unassisted recovery',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);answer(model,'Q',true,1100,{support:'hint-2'});answer(model,'Q',true,1200,{support:'unknown'});
  const pattern=evidence(model).misconceptionStats['journal-entry'];assert.strictEqual(pattern.assistedRecoveredCount,1);assert.strictEqual(pattern.recoveredCount,0);assert.strictEqual(pattern.pending,true);
});
test('old coaching receipt cannot resolve a later wrong observation',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);answer(model,'Q',false,1100);
  assert.strictEqual(model.recordAssistedRecovery('Q',1,1200),false);assert.strictEqual(evidence(model).misconceptionStats['journal-entry'].assistedRecoveredCount,0);
});
test('error tags are restricted to authored cells or generic classes',()=>{
  const {model}=fresh();answer(model,'T',false,1000,{tag:'a'});answer(model,'T',false,1001,{tag:'__proto__'});answer(model,'T',false,1002,{tag:'invented-diagnosis'});
  assert.deepStrictEqual(Object.keys(evidence(model,'T').misconceptionStats).sort(),['cell:a','table-cell']);
  assert.strictEqual(evidence(model,'T').misconceptionStats['table-cell'].occurrences,2);
});
test('replay is rejected after reload and after its detail row is evicted',()=>{
  let {model,store}=fresh();assert(answer(model,'Q',false,1000,{number:1}));for(let i=0;i<205;i++)answer(model,'R',true,2000+i);
  model=new Model(questions,store,'test');const before=JSON.stringify(model.state);
  assert.strictEqual(answer(model,'Q',false,1000,{number:1,mode:model.state.mode}),false);assert.strictEqual(JSON.stringify(model.state),before);
  assert(answer(model,'Q',true,3000,{number:2}));const newer=JSON.stringify(model.state);assert.strictEqual(answer(model,'Q',false,1000,{number:1}),false);assert.strictEqual(JSON.stringify(model.state),newer);
});
test('failed attempt save rolls back counters and allows one successful retry',()=>{
  const {model,store}=fresh();model.save();const bytes=store.value,state=JSON.stringify(model.state),set=store.setItem;
  store.setItem=()=>false;assert.strictEqual(answer(model,'Q',false,1000,{number:1}),false);assert.strictEqual(store.value,bytes);assert.strictEqual(JSON.stringify(model.state),state);
  store.setItem=set;assert(answer(model,'Q',false,1000,{number:1}));assert.strictEqual(evidence(model).observedAttempts,1);assert.strictEqual(model.questionAccuracy('Q').attempts,1);
});
test('failed assisted save is retryable without duplicate recovery',()=>{
  const {model,store}=fresh();answer(model,'Q',false,1000);const bytes=store.value,state=JSON.stringify(model.state),set=store.setItem;
  store.setItem=()=>{throw Error('quota');};assert.strictEqual(model.recordAssistedRecovery('Q',1,1100),false);assert.strictEqual(store.value,bytes);assert.strictEqual(JSON.stringify(model.state),state);
  store.setItem=set;assert(model.recordAssistedRecovery('Q',1,1100));assert.strictEqual(evidence(model).misconceptionStats['journal-entry'].assistedRecoveredCount,1);
});
test('legacy migration preserves old aggregates without inventing a first observation',()=>{
  const {model:old}=fresh();answer(old,'Q',false,1000);for(let i=0;i<250;i++)answer(old,'Q',true,2000+i);
  const legacy=clone(old.state);delete legacy.learningEffectiveness;for(const row of legacy.attempts){delete row.mode;delete row.support;delete row.observationNumber;}
  const oldStats=clone(legacy.questionStats);let {model,store}=fresh(JSON.stringify(legacy));
  assert.strictEqual(model.state.learningEffectiveness.initialHistory,'unknown');assert.strictEqual(evidence(model).initialStatus,'unknown');assert.strictEqual(evidence(model).firstAttempt,null);assert.strictEqual(evidence(model).observedAttempts,0);assert.deepStrictEqual(model.state.questionStats,oldStats);
  assert(answer(model,'Q',true,5000));assert.strictEqual(evidence(model).firstAttempt,null);assert.strictEqual(evidence(model).observedAttempts,1);
  assert.strictEqual(evidence(model,'T').initialStatus,'unknown','Missing legacy evidence does not prove never attempted');
  const before=JSON.stringify(model.state);model=new Model(questions,store,'test');assert.strictEqual(JSON.stringify(model.state),before);
});
test('legacy migration save failure preserves old bytes and can retry safely',()=>{
  const old=clone(fresh().model.state);delete old.learningEffectiveness;const bytes=JSON.stringify(old),store=storage(bytes),set=store.setItem;store.setItem=()=>false;
  const model=new Model(questions,store,'test');assert.strictEqual(store.value,bytes);assert.strictEqual(model.state.learningEffectiveness.initialHistory,'unknown');store.setItem=set;assert(model.save());assert.strictEqual(JSON.parse(store.value).learningEffectiveness.initialHistory,'unknown');
});
test('backup preparation round-trips current and old states without mutation',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);model.recordAssistedRecovery('Q',1,1100);schedule(model);answer(model,'R',true,2000,{mode:'review',reviewSourceId:'Q'});
  const before=JSON.stringify(model.state);assert(Model.validateBackupState(model.state,questions));const result=Model.prepareBackupState(model.state,questions);assert.deepStrictEqual(result,model.state);assert.strictEqual(JSON.stringify(model.state),before);
  const legacy=clone(model.state);delete legacy.learningEffectiveness;
  for(const row of legacy.attempts){delete row.mode;delete row.support;delete row.observationNumber;}
  assert(Model.validateBackupState(legacy,questions));const migrated=Model.prepareBackupState(legacy,questions);assert.strictEqual(migrated.learningEffectiveness.initialHistory,'unknown');assert.deepStrictEqual(Model.prepareBackupState(migrated,questions),migrated);
});
test('present corrupt/future evidence rejects import and blocks destructive load/save',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);const valid=clone(model.state);
  for(const mutate of [v=>v.learningEffectiveness.schemaVersion=2,v=>v.learningEffectiveness.questions.Q.observedAttempts=-1,v=>v.learningEffectiveness.questions.Q.modes.story.successes=99,v=>v.learningEffectiveness.questions.Q.firstAttempt=null,v=>v.learningEffectiveness.questions.Q.delayedReview.successes=1,v=>v.learningEffectiveness.questions.Q.misconceptionStats['journal-entry'].recoveredCount=2,v=>v.learningEffectiveness.questions.missing=clone(v.learningEffectiveness.questions.Q),v=>v.learningEffectiveness=null]){
    const bad=clone(valid);mutate(bad);assert.strictEqual(Model.validateBackupState(bad,questions),false);assert.strictEqual(Model.prepareBackupState(bad,questions),null);
    const bytes=JSON.stringify(bad),loaded=fresh(bytes);assert.strictEqual(loaded.store.value,bytes);assert.strictEqual(loaded.model.save(),false);assert.strictEqual(loaded.store.value,bytes);
  }
});
test('corrupt or unreadable stores never become fabricated new-history coverage',()=>{
  const {model,store}=fresh('{broken');assert.strictEqual(model.save(),false);assert.strictEqual(store.value,'{broken');
  const broken={getItem(){throw Error('read denied');},setItem(){throw Error('must not write');}};const denied=new Model(questions,broken,'test');assert.strictEqual(denied.save(),false);assert.strictEqual(answer(denied,'Q',true,1000),false);
  const wrapped={getItem(){return null;},readItem(){return {ok:false,value:null};},setItem(){throw Error('must not write');}};assert.strictEqual(new Model(questions,wrapped,'test').save(),false);
});
test('invalid input, support, mode, stale sequence and overflow do not mutate evidence',()=>{
  const {model}=fresh();answer(model,'Q',true,1000);const before=JSON.stringify(model.state);
  for(const [id,at,context] of [['missing',1100,{}],['Q',-1,{}],['Q',Infinity,{}],['Q',1100,{support:'invented'}],['Q',1100,{mode:'not-a-mode'}],['Q',1100,{observationNumber:999}]])assert.strictEqual(model.recordAttempt(id,true,1,'',false,at,null,'unsure',{mode:'story',support:'none',...context}),false);
  assert.strictEqual(JSON.stringify(model.state),before);
  model.state.questionStats.Q.correctCount=Number.MAX_SAFE_INTEGER;const maximum=JSON.stringify(model.state);assert.strictEqual(answer(model,'Q',true,1100),false);assert.strictEqual(JSON.stringify(model.state),maximum);
});
test('record/finalization and reads cannot add observations or mutate returned data',()=>{
  const {model}=fresh();answer(model,'Q',true,1000);const before=clone(model.state.learningEffectiveness);model.record('Q',true,1000);model.save();assert.deepStrictEqual(model.state.learningEffectiveness,before);
  const value=evidence(model);value.observedAttempts=999;value.modes.story.attempts=999;assert.deepStrictEqual(model.state.learningEffectiveness,before);
});
test('contradictory first-result and error-recovery aggregates reject a backup',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);const original=clone(model.state);
  for(const mutate of [
    v=>v.learningEffectiveness.questions.Q.firstAttempt.correct=true,
    v=>v.learningEffectiveness.questions.Q.firstAttempt.mode='exam',
    v=>{const e=v.learningEffectiveness.questions.Q.misconceptionStats['journal-entry'];e.recoveredCount=1;e.lastRecoveredAt=1001;e.pending=false;}
  ]){const value=clone(original);mutate(value);assert.strictEqual(Model.validateBackupState(value,questions),false);}
});
test('missing or reset complete-history entries cannot fabricate a new first answer',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);model.record('Q',false,1000);answer(model,'R',true,1100);
  for(let i=0;i<205;i++)answer(model,'R',true,1200+i);
  const original=clone(model.state);
  for(const mutate of [
    v=>delete v.learningEffectiveness.questions.Q,
    v=>v.learningEffectiveness.questions={},
    v=>delete v.questionStats.Q,
    v=>{v.questionStats.Q.correctCount=1;},
    v=>{delete v.learningEffectiveness.questions.Q;delete v.questionStats.Q;}
  ]){
    const bad=clone(original);mutate(bad);assert.strictEqual(Model.validateBackupState(bad,questions),false);assert.strictEqual(Model.prepareBackupState(bad,questions),null);
    const bytes=JSON.stringify(bad),loaded=fresh(bytes);assert.strictEqual(loaded.model.save(),false);assert.strictEqual(loaded.store.value,bytes);
    assert.strictEqual(answer(loaded.model,'Q',true,2000),false);
  }
});
test('legacy observed evidence cannot lose its receipt while retaining a tagged detail',()=>{
  const legacy=clone(fresh().model.state);delete legacy.learningEffectiveness;const {model}=fresh(JSON.stringify(legacy));answer(model,'Q',false,1000);
  const bad=clone(model.state);delete bad.learningEffectiveness.questions.Q;assert.strictEqual(Model.validateBackupState(bad,questions),false);
});
test('a missing evidence root with new observation receipts is corruption, not a legacy save',()=>{
  const {model}=fresh();answer(model,'Q',false,1000);const bad=clone(model.state);delete bad.learningEffectiveness;
  assert.strictEqual(Model.validateBackupState(bad,questions),false);assert.strictEqual(Model.prepareBackupState(bad,questions),null);
  const loaded=fresh(JSON.stringify(bad));assert.strictEqual(loaded.model.save(),false);
});
test('source finalization alone survives reload without becoming a graded first answer',()=>{
  let {model,store}=fresh();assert(model.record('Q',true,1000));model=new Model(questions,store,'test');
  assert.strictEqual(model.state.answeredIds[0],'Q');assert(Model.validateBackupState(model.state,questions));
  assert.strictEqual(evidence(model).observedAttempts,0);assert.strictEqual(evidence(model).firstAttempt,null);
});
test('modern evidence cannot invoke legacy aggregation or continuity reconstruction',()=>{
  const {model}=fresh();for(let i=0;i<250;i++)answer(model,'Q',true,1000+i);const original=clone(model.state);
  for(const mutate of [v=>delete v.learningSchemaVersion,v=>v.learningSchemaVersion=1,v=>v.learningSchemaVersion=0,
    v=>delete v.learningContinuityState,v=>v.learningContinuityState={activeDayKeys:[],today:{}},v=>delete v.lastLearningAt]){
    const bad=clone(original);mutate(bad);assert.strictEqual(Model.validateBackupState(bad,questions),false);assert.strictEqual(Model.prepareBackupState(bad,questions),null);
    const bytes=JSON.stringify(bad),loaded=fresh(bytes);assert.strictEqual(loaded.model.save(),false);assert.strictEqual(loaded.store.value,bytes);
  }
});
console.log(`LEARNING_EFFECTIVENESS ${passed}/${passed+failed} PASS; ${failed} FAIL`);
if(failed)process.exitCode=1;
