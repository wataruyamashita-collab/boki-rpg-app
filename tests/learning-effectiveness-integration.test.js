'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const Model = require('../js/model'), RPG = require('../js/rpg');
const {fixture, questions:canonical, storage:legacyStorage} = require('./helpers/issue207-fixtures');
const clone = value => JSON.parse(JSON.stringify(value));
const questions = { Q:{id:'Q',type:'journal',category:'仕訳',difficulty:1}, R:{id:'R',type:'journal',category:'仕訳',difficulty:1} };
const values = () => ({data:{},getItem(key){return this.data[key] ?? null;},setItem(key,value){this.data[key]=value;return true;}});
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
