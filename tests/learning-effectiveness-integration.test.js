'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const Model = require('../js/model'), RPG = require('../js/rpg');
const {fixture, questions:canonical, storage:legacyStorage} = require('./helpers/issue207-fixtures');
const clone = value => JSON.parse(JSON.stringify(value));
const questions = { Q:{id:'Q',type:'journal',category:'仕訳',difficulty:1}, R:{id:'R',type:'journal',category:'仕訳',difficulty:1} };
const values = () => ({data:{},getItem(key){return this.data[key] ?? null;},setItem(key,value){this.data[key]=value;return true;},removeItem(key){delete this.data[key];return true;}});
let reloads=0;
const sandbox={window:{ProgressModel:Model,RPGModel:RPG,GradingEngine:{grade:(_q,answer)=>({correct:answer.correct,earned:answer.correct?1:0,possible:1,ratio:answer.correct?1:0})},location:{reload(){reloads++;}}},console};
vm.runInNewContext(fs.readFileSync('js/controller.js','utf8'),sandbox);
const Controller=sandbox.window.AppController;
function context(mode='training') {
  const store=values(),model=new Model(questions,store,'p'),rpg=new RPG(store,'r'),notices=[];
  const node=()=>({hidden:false,focus(){},append(){},replaceChildren(){},classList:{add(){},remove(){}}});
  const ctx=Object.create(Controller.prototype);
  Object.assign(ctx,{questions,ids:Object.keys(questions),model,rpg,reviewMappings:new Map(),
    document:{getElementById:()=>node(),createElement:()=>node(),querySelector:()=>null,querySelectorAll:()=>[]},
    view:{readAnswer:()=>({correct:true}),result(){},updateRpg(){},renderQuestion(){},show(){},showNotice(text){notices.push(text);}},
    resetCalculator(){},renderModes(){},showMode(){},updateExamStatus(){},isExamExpired:()=>false,modeIds:()=>['Q','R'],unansweredExamIds:()=>[]});
  model.state.mode=mode;ctx.start('Q');return {ctx,store,model,rpg,notices};
}
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack);}}

test('controller captures observation receipt and actual hint support',()=>{
  const {ctx,model}=context();ctx.learningFlow.hintStage=2;ctx.submit();
  assert.deepStrictEqual(model.learningEffectivenessForQuestion('Q').firstAttempt,{correct:true,at:model.state.attempts[0].timestamp,mode:'training',support:'hint-2'});
  assert.strictEqual(ctx.learningObservationNumber,1);assert.strictEqual(model.state.attempts[0].observationNumber,1);
});
test('replayed initial submit cannot add accuracy, mastery or RPG rewards',()=>{
  const {ctx,model,rpg}=context();ctx.submit();const progress=JSON.stringify(model.state),character=JSON.stringify(rpg.state);
  ctx.learningFlow.phase='I';ctx.submitting=false;assert.strictEqual(ctx.submit(),false);
  assert.strictEqual(JSON.stringify(model.state),progress);assert.strictEqual(JSON.stringify(rpg.state),character);
});
test('failed persistence stops scoring side effects and retains a retryable receipt',()=>{
  const {ctx,store,model,rpg,notices}=context(),state=JSON.stringify(model.state),character=JSON.stringify(rpg.state),set=store.setItem;
  const bytes=JSON.stringify(store.data);store.setItem=()=>false;
  assert.strictEqual(ctx.submit(),false);assert.strictEqual(JSON.stringify(model.state),state);assert.strictEqual(JSON.stringify(rpg.state),character);
  assert.strictEqual(JSON.stringify(store.data),bytes);assert.strictEqual(ctx.submitting,false);assert(notices.length);
  store.setItem=set;ctx.submit();assert.strictEqual(model.questionAccuracy('Q').attempts,1);assert.strictEqual(model.learningEffectivenessForQuestion('Q').observedAttempts,1);
});
test('partial answer writes roll back finalization and rewards before any result',()=>{
  for(const mode of ['story','training','review','exam']){
    const {ctx,model,rpg,store}=context(mode);
    if(mode==='review'){const now=Date.now();model.state.reviewSchedule.Q={stage:0,dueAt:now-1};model.assignReview('Q','Q',now-1);ctx.start('Q');}
    if(mode==='exam')model.state.examSession={scores:{}};
    model.save();rpg.save();const before=clone(model.state),character=clone(rpg.state),bytes=clone(store.data),set=store.setItem;let writes=0;
    store.setItem=function(key,value){writes++;if(writes===2)return false;return set.call(this,key,value);};
    assert.strictEqual(ctx.submit(),false,mode);assert.deepStrictEqual(clone(model.state),before);assert.deepStrictEqual(clone(rpg.state),character);
    assert.strictEqual(store.data.p,bytes.p);assert.strictEqual(store.data.r,bytes.r);assert.strictEqual(ctx.submitting,false);
    store.setItem=set;ctx.submit();assert.strictEqual(model.learningEffectivenessForQuestion('Q').observedAttempts,1);
    assert(mode==='exam'||model.state.answeredIds.includes('Q'));
  }
});
test('each transaction write and commit failure restores both saved keys',()=>{
  for(const failure of [1,2,3,4]){
    const {ctx,model,rpg,store}=context();model.save();rpg.save();const before=clone(model.state),character=clone(rpg.state),bytes=clone(store.data);
    const set=store.setItem,remove=store.removeItem;let calls=0;
    store.setItem=function(k,v){if(++calls===failure)return false;return set.call(this,k,v);};
    store.removeItem=function(k){if(++calls===failure)return false;return remove.call(this,k);};
    assert.strictEqual(ctx.submit(),false,'failure '+failure);assert.deepStrictEqual(clone(model.state),before);assert.deepStrictEqual(clone(rpg.state),character);
    assert.deepStrictEqual(store.data,bytes);assert.strictEqual(ctx.learningFlow.phase,'I');
  }
});
test('persistent rollback failure is recovered before the next launch loads progress and rewards',()=>{
  const {ctx,model,rpg,store}=context();model.save();rpg.save();const bytes=clone(store.data),set=store.setItem;let calls=0;
  store.setItem=function(k,v){if(++calls>=3)return false;return set.call(this,k,v);};
  assert.strictEqual(ctx.submit(),false);assert.strictEqual(model.storageWriteBlocked,true);assert(store.data['p:pending-answer-v1']);
  assert.strictEqual(JSON.parse(store.data.p).learningEffectiveness.questions.Q.observedAttempts,1,'partial physical write exists only behind the pending journal');
  store.setItem=set;assert(Controller.recoverAnswerTransaction(store,'p','r'));assert.deepStrictEqual(store.data,bytes);
  ctx.model=new Model(questions,store,'p');ctx.rpg=new RPG(store,'r');ctx.start('Q');ctx.submit();
  assert.strictEqual(ctx.model.learningEffectivenessForQuestion('Q').observedAttempts,1);assert.strictEqual(ctx.rpg.state.mastery['仕訳'].possible,1);
  assert.strictEqual(store.data['p:pending-answer-v1'],undefined);
});
test('a corrupted pending before-image cannot overwrite the original saved pair',()=>{
  const {ctx,model,rpg,store}=context();model.save();rpg.save();const set=store.setItem;let calls=0;
  store.setItem=function(k,v){if(++calls>=3)return false;return set.call(this,k,v);};ctx.submit();store.setItem=set;
  const journal=JSON.parse(store.data['p:pending-answer-v1']);journal.progress='{}';store.data['p:pending-answer-v1']=JSON.stringify(journal);const before=clone(store.data);
  assert.strictEqual(Controller.recoverAnswerTransaction(store,'p','r'),false);assert.deepStrictEqual(store.data,before);
});
test('invalid or unreadable transaction journals cannot overwrite saved data',()=>{
  const {store}=context();store.data['p:pending-answer-v1']='{bad';const before=clone(store.data);
  assert.strictEqual(Controller.recoverAnswerTransaction(store,'p','r'),false);assert.deepStrictEqual(store.data,before);
  assert.strictEqual(Controller.recoverAnswerTransaction({getItem(){throw Error('unreadable');},setItem(){throw Error('must not write');}},'p','r'),false);
});
test('exam finalization commits history, mastery and rewards once after a failed write',()=>{
  const {ctx,store}=context('exam'),model=new Model(canonical,values(),'p'),ids=Object.keys(canonical).slice(0,15),now=Date.now(),rpg=new RPG(model.storage,'r');
  ctx.model=model;ctx.rpg=rpg;ctx.questions=canonical;ctx.stopExamTimer=()=>{};let results=0;ctx.view.examResult=()=>{results++;};
  model.state.mode='exam';model.state.examSession={ids,startedAt:now-1000,endAt:now+100000,status:'RUNNING',scores:{}};
  assert(model.recordAttempt(ids[0],true,10,'',false,now,null,'unsure',{mode:'exam',support:'none'}));
  model.state.examSession.scores[ids[0]]={correct:true,earned:1,possible:1,ratio:1,answer:{correct:true}};
  ctx.unansweredExamIds=()=>ids.slice(1);model.save();rpg.save();const progress=clone(model.state),character=clone(rpg.state),saved=clone(model.storage.data),set=model.storage.setItem;let calls=0;
  model.storage.setItem=function(k,v){if(++calls===3)return false;return set.call(this,k,v);};
  assert.strictEqual(ctx.finishExam(true,now),false);assert.deepStrictEqual(clone(model.state),progress);assert.deepStrictEqual(clone(rpg.state),character);assert.deepStrictEqual(model.storage.data,saved);assert.strictEqual(results,0);
  model.storage.setItem=set;assert.strictEqual(ctx.finishExam(true,now),true);assert.strictEqual(model.state.examAttempt,1);assert.strictEqual(model.state.examHistory.length,1);
  assert.strictEqual(model.learningEffectivenessForQuestion(ids[0]).observedAttempts,1);assert.strictEqual(rpg.state.mastery[canonical[ids[0]].category].possible,1);assert.strictEqual(rpg.state.xp,20*canonical[ids[0]].difficulty);
  assert.strictEqual(ctx.finishExam(true,now),false);assert.strictEqual(results,1);assert(Model.validateBackupState(model.state,canonical));
});
test('coaching only persists assisted recovery and remains idempotent',()=>{
  const {ctx,model,rpg}=context();ctx.view.readAnswer=()=>({correct:false});ctx.submit();
  const stats=clone(model.state.questionStats),rows=clone(model.state.attempts),character=JSON.stringify(rpg.state);
  ctx.learningFlow.phase='R';ctx.submitting=false;ctx.view.readAnswer=()=>({correct:true});ctx.submit();
  const error=model.learningEffectivenessForQuestion('Q').misconceptionStats['journal-entry'];
  assert.strictEqual(error.assistedRecoveredCount,1);assert.strictEqual(error.recoveredCount,0);
  assert.deepStrictEqual(model.state.questionStats,stats);assert.deepStrictEqual(model.state.attempts,rows);assert.strictEqual(JSON.stringify(rpg.state),character);
  ctx.submit();assert.strictEqual(model.learningEffectivenessForQuestion('Q').misconceptionStats['journal-entry'].assistedRecoveredCount,1);
});
test('failed coaching persistence cannot report saved recovery or consume the retry',()=>{
  const {ctx,model,store}=context();ctx.view.readAnswer=()=>({correct:false});ctx.submit();
  const before=JSON.stringify(model.state),set=store.setItem;ctx.learningFlow.phase='R';ctx.submitting=false;ctx.view.readAnswer=()=>({correct:true});store.setItem=()=>false;
  assert.strictEqual(ctx.submit(),false);assert.strictEqual(ctx.learningFlow.phase,'R');assert.strictEqual(JSON.stringify(model.state),before);
  store.setItem=set;ctx.submit();assert.strictEqual(model.learningEffectivenessForQuestion('Q').misconceptionStats['journal-entry'].assistedRecoveredCount,1);
});
test('controller supplies due source and keeps review target statistics separate',()=>{
  const {ctx,model}=context('review'),now=Date.now();model.state.reviewSchedule.Q={stage:2,dueAt:now-100};model.assignReview('Q','R',now-100);
  ctx.reviewMappings.set('R',{sourceQuestionId:'Q'});ctx.start('R');ctx.submit();
  const source=model.learningEffectivenessForQuestion('Q'),target=model.learningEffectivenessForQuestion('R');
  assert.strictEqual(source.observedAttempts,0);assert.strictEqual(source.delayedReview.successes,1);assert.strictEqual(source.delayedReview.highestConfirmedStage,3);
  assert.strictEqual(target.firstAttempt.mode,'review');assert.strictEqual(target.observedAttempts,1);
});
test('exam submitted blank is wrong; unsubmitted and expired items add no observation',()=>{
  const {ctx,model}=context('exam');model.state.examSession={scores:{}};ctx.view.readAnswer=()=>({correct:false});ctx.submit();
  assert.strictEqual(model.learningEffectivenessForQuestion('Q').firstAttempt.correct,false);assert.strictEqual(model.learningEffectivenessForQuestion('Q').firstAttempt.mode,'exam');
  assert.strictEqual(model.learningEffectivenessForQuestion('R').observedAttempts,0);
  const before=clone(model.state.learningEffectiveness);ctx.submitting=false;ctx.isExamExpired=()=>true;ctx.finishExam=()=>{};ctx.submit();assert.deepStrictEqual(model.state.learningEffectiveness,before);
});
test('deadline reached during grading cannot leave a recorded unanswered exam item',()=>{
  const {ctx,model}=context('exam');model.state.examSession={scores:{}};let checks=0,finished=0;
  ctx.isExamExpired=()=>++checks>=3;ctx.finishExam=()=>{finished++;};ctx.submit();
  assert.strictEqual(finished,1);assert.strictEqual(model.learningEffectivenessForQuestion('Q').observedAttempts,0);
  assert.strictEqual(model.state.attempts.length,0);assert.deepStrictEqual(model.state.examSession.scores,{});
});
for(const id of ['J051','L031'])for(const kind of ['old','new','mixed'])test(`Accepted #207 ${id}/${kind} keeps archived history and unknown initial coverage`,()=>{
  const initial=fixture(kind,id),store=legacyStorage(JSON.stringify(initial));let model=new Model(canonical,store,'p');
  const archive=clone(model.state.contentMigrationArchive),continuity=clone(model.state.learningContinuityState);
  assert.strictEqual(model.learningEffectivenessForQuestion(id).initialStatus,'unknown');assert.strictEqual(model.learningEffectivenessForQuestion(id).observedAttempts,0);
  assert(model.recordAttempt(id,true,10,'',false,Date.now(),null,'unsure',{support:'none'}));
  model=new Model(canonical,store,'p');assert.deepStrictEqual(model.state.contentMigrationArchive,archive);assert.strictEqual(model.learningEffectivenessForQuestion(id).firstAttempt,null);
  assert.strictEqual(model.learningEffectivenessForQuestion(id).observedAttempts,1);assert(model.state.learningContinuityState.activeDayKeys.length>=continuity.activeDayKeys.length);
  assert(Model.validateBackupState(model.state,canonical));
});
test('revision 1–3 cannot attach current evidence to pre-identity content',()=>{
  const current=new Model(canonical,legacyStorage(),'p');assert(current.recordAttempt('J051',false,10,'journal-entry',false,Date.now()));
  for(const revision of [1,2,3])for(const initialHistory of ['complete','unknown']){
    const mixed=fixture('old','J051');mixed.contentRevision=revision;
    mixed.learningEffectiveness=clone(current.state.learningEffectiveness);mixed.learningEffectiveness.initialHistory=initialHistory;
    if(initialHistory==='unknown')mixed.learningEffectiveness.questions.J051.firstAttempt=null;
    assert.strictEqual(Model.validateBackupState(mixed,canonical),false);assert.strictEqual(Model.prepareBackupState(mixed,canonical),null);
    const bytes=JSON.stringify(mixed),store=legacyStorage(bytes),loaded=new Model(canonical,store,'p');
    assert.strictEqual(loaded.save(),false);assert.strictEqual(store.value,bytes);
  }
});
async function backupTests(){
  const {ctx,model,rpg,store}=context();ctx.view.readAnswer=()=>({correct:false});ctx.submit();
  const payload={format:'boki-rpg-backup',version:1,progress:clone(model.state),character:clone(rpg.state)};
  const file={text:async()=>JSON.stringify(payload)},before=JSON.stringify(store.data),set=store.setItem;
  let failedOnce=false;store.setItem=function(key,value){if(key==='r'&&!failedOnce){failedOnce=true;return false;}return set.call(this,key,value);};
  assert.strictEqual(await ctx.importBackup(file),false);assert.strictEqual(JSON.stringify(store.data),before);assert.strictEqual(reloads,0);
  store.setItem=set;assert.strictEqual(await ctx.importBackup(file),true);assert.strictEqual(reloads,1);
  assert.deepStrictEqual(JSON.parse(store.data.p).learningEffectiveness,payload.progress.learningEffectiveness);
  payload.progress.learningEffectiveness.schemaVersion=99;const saved=JSON.stringify(store.data);assert.strictEqual(await ctx.importBackup(file),false);assert.strictEqual(JSON.stringify(store.data),saved);assert.strictEqual(reloads,1);
  passed++;console.log('PASS real two-key backup transaction preserves evidence and rolls back failures');
}
backupTests().catch(error=>{failed++;console.error(error.stack);}).finally(()=>{console.log(`LEARNING_EFFECTIVENESS_INTEGRATION ${passed}/${passed+failed} PASS; ${failed} FAIL`);if(failed)process.exitCode=1;});
