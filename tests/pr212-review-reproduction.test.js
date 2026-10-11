'use strict';
// Run against the exact restored PR HEAD before changing production code.
const assert=require('assert'),fs=require('fs'),vm=require('vm'),cp=require('child_process');
const Model=require('../js/model'),Engine=require('../js/engine');
const clone=x=>JSON.parse(JSON.stringify(x));
const store=()=>({data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;return true;},removeItem(k){delete this.data[k];return true;}});
const data={window:{}};vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),data);
const catalog=data.window.QuestionData,pool=Array.from(data.window.ExamPoolDefinition);
const questions={Q:{id:'Q',type:'journal',category:'仕訳',difficulty:1},R:{id:'R',type:'journal',category:'仕訳',difficulty:1,learningRole:'review'},T:{id:'T',type:'ledger',category:'帳簿',difficulty:1,table:{inputCells:['a']}}};
const oldClass=sha=>{const module={exports:{}};vm.runInNewContext(cp.execFileSync('git',['show',sha+':js/model.js'],{encoding:'utf8'}),{module,console});return module.exports;};
const refs={v3:'bd558e21b3aa68ddccde3216d5ba89da105884cf',v4:'f7b86ac51be1b25ca32b50ac28d5efaa6ff26fa3',v5:'2cf70526f3cdc18560f151d4d32134a49aef79cb',v6:'8fd91a400b9f80502bc16e40e2701ce8e1e04669',v7:'86135e34047c7356aa2a020d5221ca14f205c4d9',v8:'d6da732f57e8a46717f67620b5a2761caa685872'};
let failed=0,passed=0;
const test=(name,fn)=>{try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}};
const observe=(m,id,correct,at,context={})=>assert(m.recordAttempt(id,correct,10,'',false,at,null,'unsure',{mode:m.state.mode,support:'none',...context}));
test('1 newer-day counters survive backward answer, reload and return',()=>{
 const s=store(),m=new Model(questions,s,'p'),later=new Date(2026,0,2,12).getTime(),earlier=new Date(2026,0,1,12).getTime();
 observe(m,'Q',true,later);observe(m,'Q',false,later+1);const expected=clone(m.learningContinuity(later).today);
 observe(m,'T',true,earlier);const restored=new Model(questions,s,'p');
 assert.deepStrictEqual(restored.learningContinuity(later).today,expected);
 observe(restored,'Q',true,later+2);assert.strictEqual(restored.learningContinuity(later).today.attempts,3);
});
test('2 v8 changed/deleted drafts remain unverified until current-input approval',()=>{
 const Old=oldClass(refs.v8),old=new Old(questions,store(),'p');assert(old.setDraft('T',{cells:{a:'12'}}));const original=clone(old.state);
 assert.strictEqual(original.learningEvidenceIntegrity.schemaVersion,8);assert(Model.prepareBackupState(original,questions));
 for(const mutate of [v=>v.drafts.T.cells.a='99',v=>delete v.drafts.T]){
  const bad=clone(original);mutate(bad);assert(Old.validateBackupState(bad,questions));assert.deepStrictEqual(bad.learningEvidenceIntegrity,original.learningEvidenceIntegrity);
  // Approved migration policy: indistinguishable old bytes must be preserved,
  // with explicit provenance, rather than rejected or silently authenticated.
  const migrated=Model.prepareBackupState(bad,questions);assert(migrated);
  assert.deepStrictEqual(JSON.parse(migrated.legacyProvenance.original),bad);
  assert(migrated.legacyProvenance.unsignedFields.includes('drafts'));
  assert.deepStrictEqual(migrated.drafts,bad.drafts);
  assert.deepStrictEqual(migrated.legacyProvenance.pending.drafts,Object.keys(bad.drafts));
  assert.deepStrictEqual(Model.prepareBackupState(migrated,questions),migrated);
  if(bad.drafts.T){
   const s=store();s.setItem('p',JSON.stringify(migrated));let restored=new Model(questions,s,'p');
   assert(restored.isUnverified('drafts','T'));assert(restored.setDraft('T',{cells:{a:'101'}}));
   restored=new Model(questions,s,'p');assert(restored.isUnverified('drafts','T'));
   assert(restored.approveDraft('T',{cells:{a:'101'}},1000));assert(!restored.isUnverified('drafts','T'));
   assert.deepStrictEqual(JSON.parse(restored.state.legacyProvenance.original),bad);
  }
 }
});
test('3 genuine v5 L033 1/6 answer rejects internally consistent altered 5/6 score',()=>{
 const Old=oldClass(refs.v5),old=new Old(catalog,store(),'p',pool),id='L033',cells=catalog[id].answer.cells,first=Object.keys(cells)[0],answer={cells:{[first]:cells[first]}},grade=Engine.grade(catalog[id],answer);
 assert.strictEqual(grade.earned,1);assert.strictEqual(grade.possible,6);
 old.state.mode='exam';old.state.examSession={ids:[id,...pool.filter(q=>q!==id).slice(0,14)],startedAt:100,endAt:2000,status:'RUNNING',evidenceVersion:1,scores:{}};
 observe(old,id,false,1000);old.state.examSession.scores[id]={...grade,answer,observationNumber:1};old.save();const original=clone(old.state);
 assert(Model.prepareBackupState(original,catalog,pool));const bad=clone(original);Object.assign(bad.examSession.scores[id],{earned:5,ratio:5/6});
 assert(Old.validateBackupState(bad,catalog));assert.strictEqual(Engine.grade(catalog[id],bad.examSession.scores[id].answer).earned,1);
 assert(Model.prepareBackupState(bad,catalog,pool)===null,'altered legacy value was resealed');
});
test('4 v7 finalized exam mistake remains protected after reviews and row eviction',()=>{
 const Old=oldClass(refs.v7),old=new Old(catalog,store(),'p',pool),id=pool.find(q=>catalog[q].type==='journal'),ids=[id,...pool.filter(q=>q!==id).slice(0,14)];
 old.state.mode='exam';old.state.examSession={ids,startedAt:100,endAt:2000,status:'RUNNING',evidenceVersion:1,scores:{}};observe(old,id,false,1000);
 old.state.examSession.scores[id]={correct:false,earned:0,possible:1,ratio:0,answer:{debit:[],credit:[]},observationNumber:1};old.refreshEvidenceIntegrity();
 const sandbox={window:{ProgressModel:Old,RPGModel:require('../js/rpg')},console};vm.runInNewContext(cp.execFileSync('git',['show',refs.v7+':js/controller.js'],{encoding:'utf8'}),sandbox);
 const ctx=Object.create(sandbox.window.AppController.prototype),node=()=>({focus(){},classList:{remove(){}}});
 Object.assign(ctx,{model:old,rpg:new sandbox.window.RPGModel(old.storage,'r'),questions:catalog,unansweredExamIds:()=>ids.slice(1),stopExamTimer(){},view:{examResult(){},show(){},showNotice(){}},document:{body:node(),getElementById:node}});
 assert(ctx.finishExam(true,2000));assert.strictEqual(old.state.mistakeCounts[id],1);assert.strictEqual(old.state.examAttempt,1);
 old.state.mode='training';for(let i=0;i<4;i++){const due=old.state.reviewSchedule[id].dueAt;observe(old,id,true,due);assert(old.record(id,true,due));}
 assert(!old.state.incorrectIds.includes(id));for(let i=0;i<201;i++)observe(old,'J001',true,old.state.lastLearningAt+1);
 assert(!old.state.attempts.some(r=>r.id===id));const original=clone(old.state);assert(Model.prepareBackupState(original,catalog,pool));
 const bad=clone(original);delete bad.mistakeCounts[id];assert(Old.validateBackupState(bad,catalog));assert(Model.prepareBackupState(bad,catalog,pool)===null,'altered legacy value was resealed');
});
for(const version of ['v3','v4','v6'])test('5 '+version+' unsigned authority cannot be silently resealed',()=>{
 const Old=oldClass(refs[version]),old=new Old(questions,store(),'p');
 if(version==='v3'){observe(old,'Q',false,1000);old.record('Q',false,1000);old.assignReview('Q','R',1001);}
 if(version==='v4'){observe(old,'Q',true,1000);old.state.examHistory=[{finishedAt:2000,points:80,setSignature:'set-a'}];old.updateCompletion({});}
 if(version==='v6')old.completePlacement({foundation:80,closing:70},1000);
 const original=clone(old.state),bad=clone(original);assert(Model.prepareBackupState(original,questions));
 if(version==='v3')delete bad.reviewSchedule.Q;if(version==='v4')bad.examHistory[0].points=99;if(version==='v6')bad.placement=null;
 assert.deepStrictEqual(bad.learningEvidenceIntegrity,original.learningEvidenceIntegrity);assert(Old.validateBackupState(bad,questions));
 const migrated=Model.prepareBackupState(bad,questions);assert(migrated);
 assert.deepStrictEqual(JSON.parse(migrated.legacyProvenance.original),bad);
 const field={v3:'reviewSchedule',v4:'examHistory',v6:'placement'}[version];
 assert(migrated.legacyProvenance.unsignedFields.includes(field));
 assert.deepStrictEqual(migrated[field],bad[field]);
 assert.deepStrictEqual(Model.prepareBackupState(migrated,questions),migrated);
 const s=store();s.setItem('p',JSON.stringify(migrated));const loaded=new Model(questions,s,'p');
 if(version==='v4'){assert.deepStrictEqual(loaded.verifiedExamHistory(),[]);assert.deepStrictEqual(loaded.state.examHistory,bad.examHistory);}
 if(version==='v6')assert(loaded.isUnverified('placement'));
});
test('6 v1 deleted progression flags are corroborated from signed ordinary completions',()=>{
 const Old=oldClass('ed21218967958e42e67ba9aafe9c333a5bbccc55'),old=new Old(questions,store(),'p');
 observe(old,'Q',true,1000);old.record('Q',true,1000);
 const original=clone(old.state),bad=clone(original);bad.correctIds=[];bad.answeredIds=[];
 assert.strictEqual(original.learningEvidenceIntegrity.schemaVersion,1);
 assert.deepStrictEqual(bad.learningEvidenceIntegrity,original.learningEvidenceIntegrity);
 assert(Old.validateBackupState(bad,questions));
 const migrated=Model.prepareBackupState(bad,questions);assert(migrated);
 assert(migrated.correctIds.includes('Q'),'signed correct completion was lost');
 assert(migrated.answeredIds.includes('Q'),'signed answered completion was lost');
 assert.deepStrictEqual(JSON.parse(migrated.legacyProvenance.original),bad);
 assert.deepStrictEqual(Model.prepareBackupState(migrated,questions),migrated);
});
test('7 abandoned v10 preview exam cannot borrow a retry timeout to authenticate old flags',()=>{
 const Old=oldClass('ed21218967958e42e67ba9aafe9c333a5bbccc55'),Preview=oldClass('05c147e0edf15f4441e18fed54ea396c7b3d8c4c'),EarlierFix=oldClass('cfaeb11e13cb5ae2f9980bcecce1af6b7bbca306');
 const id=pool.find(q=>catalog[q].type==='journal'),ids=[id,...pool.filter(q=>q!==id).slice(0,14)];
 for(const retryCorrect of [null,false,true])for(const late of [0,5000])for(const rollback of [false,true])for(const originalFlag of [true,false]){
  const firstStart=rollback?10000:100,retryStart=rollback?100:10000,finishedAt=retryStart+3600000+late+(rollback?9900:0);
  const old=new Old(catalog,store(),'p',pool);old.state.learningEffectiveness.initialHistory='unknown';old.state.correctIds=originalFlag?[id]:[];old.refreshEvidenceIntegrity();
  const s=store();s.setItem('p',JSON.stringify(old.state));const preview=new Preview(catalog,s,'p',pool);preview.state.mode='exam';
  preview.state.examSession={ids,startedAt:firstStart,endAt:firstStart+3600000,status:'RUNNING',evidenceVersion:1,scores:{}};
  observe(preview,id,true,firstStart+400,{mode:'exam'});
  preview.state.examSession={ids,startedAt:retryStart,endAt:retryStart+3600000,status:'RUNNING',evidenceVersion:1,scores:{}};
  if(retryCorrect!==null){
   observe(preview,id,retryCorrect,retryStart+1000,{mode:'exam'});
   preview.state.examSession.scores[id]={correct:retryCorrect,earned:retryCorrect?1:0,possible:1,ratio:retryCorrect?1:0,answer:retryCorrect?catalog[id].answer:{debit:[],credit:[]},observationNumber:2};
  }
  const sandbox={window:{ProgressModel:Preview,RPGModel:require('../js/rpg')},console};
  vm.runInNewContext(cp.execFileSync('git',['show','05c147e0edf15f4441e18fed54ea396c7b3d8c4c:js/controller.js'],{encoding:'utf8'}),sandbox);
  const ctx=Object.create(sandbox.window.AppController.prototype),node=()=>({focus(){},classList:{remove(){}}});
  Object.assign(ctx,{model:preview,rpg:new sandbox.window.RPGModel(preview.storage,'r'),questions:catalog,unansweredExamIds:()=>retryCorrect===null?ids:ids.slice(1),stopExamTimer(){},view:{examResult(){},show(){},showNotice(){}},document:{body:node(),getElementById:node}});
  preview.refreshEvidenceIntegrity();preview.save();assert(Preview.validateBackupState(preview.state,catalog,pool));
  assert(ctx.finishExam(true,finishedAt));
  assert(Preview.validateBackupState(preview.state,catalog,pool));const before=clone(preview.state);
  const model=new Model(catalog,s,'p',pool);assert(!model.storageWriteBlocked);
  assert.strictEqual(model.verifiedCorrectIds().includes(id),retryCorrect===true,'abandoned session was promoted');
  assert.strictEqual(model.state.correctIds.includes(id),originalFlag||retryCorrect===true,'historical candidate was changed');
  assert.strictEqual(model.state.legacyProvenance.original,before.legacyProvenance.original);
  assert.deepStrictEqual(model.state.examHistory,before.examHistory);assert.deepStrictEqual(model.state.mistakeCounts,before.mistakeCounts);
  assert.deepStrictEqual(Model.prepareBackupState(model.state,catalog,pool),model.state);
  assert.deepStrictEqual(new Model(catalog,s,'p',pool).state,model.state);
  const earlierStore=store();earlierStore.setItem('p',JSON.stringify(before));new EarlierFix(catalog,earlierStore,'p',pool);
  const repaired=new Model(catalog,earlierStore,'p',pool);assert(!repaired.storageWriteBlocked);
  assert.strictEqual(repaired.verifiedCorrectIds().includes(id),retryCorrect===true);
  assert.deepStrictEqual(repaired.state.mistakeCounts,before.mistakeCounts);
 }
});
test('8 multiple post-preview completed exams keep earlier corroborated correct progress',()=>{
 const Old=oldClass('ed21218967958e42e67ba9aafe9c333a5bbccc55'),Preview=oldClass('cfaeb11e13cb5ae2f9980bcecce1af6b7bbca306');
 const idsToAnswer=['J128','J129'],old=new Old(catalog,store(),'p',pool);
 old.state.learningEffectiveness.initialHistory='unknown';old.state.correctIds=idsToAnswer;old.refreshEvidenceIntegrity();
 const s=store();s.setItem('p',JSON.stringify(old.state));const preview=new Preview(catalog,s,'p',pool);
 const sandbox={window:{ProgressModel:Preview,RPGModel:require('../js/rpg')},console};
 vm.runInNewContext(cp.execFileSync('git',['show','cfaeb11e13cb5ae2f9980bcecce1af6b7bbca306:js/controller.js'],{encoding:'utf8'}),sandbox);
 const character=new sandbox.window.RPGModel(s,'r');
 for(const [n,id] of idsToAnswer.entries()){
  const ids=[id,...pool.filter(q=>q!==id&&catalog[q].category!==catalog[id].category).slice(0,14)],startedAt=10000+n*4000000;
  preview.state.mode='exam';preview.state.examSession={ids,startedAt,endAt:startedAt+3600000,status:'RUNNING',evidenceVersion:1,scores:{}};
  observe(preview,id,true,startedAt+500,{mode:'exam'});
  preview.state.examSession.scores[id]={...Engine.grade(catalog[id],catalog[id].answer),answer:catalog[id].answer,observationNumber:1};preview.refreshEvidenceIntegrity();preview.save();
  const ctx=Object.create(sandbox.window.AppController.prototype),node=()=>({focus(){},classList:{remove(){}}});
  Object.assign(ctx,{model:preview,rpg:character,questions:catalog,unansweredExamIds:()=>ids.slice(1),stopExamTimer(){},view:{examResult(){},show(){},showNotice(){}},document:{body:node(),getElementById:node}});
  assert(ctx.finishExam(true,startedAt+3600000+5000));
 }
 assert.deepStrictEqual(Array.from(preview.verifiedCorrectIds()).sort(),idsToAnswer.slice().sort());
 const before=clone(preview.state),rewards=s.getItem('r'),model=new Model(catalog,s,'p',pool);assert(!model.storageWriteBlocked);
 assert.deepStrictEqual(model.verifiedCorrectIds().sort(),idsToAnswer.slice().sort(),'earlier completed correct progress was relocked');
 assert.deepStrictEqual(model.state.examHistory,before.examHistory);assert.strictEqual(model.state.legacyProvenance.original,before.legacyProvenance.original);assert.strictEqual(s.getItem('r'),rewards);
 assert.deepStrictEqual(Model.prepareBackupState(model.state,catalog,pool),model.state);assert.deepStrictEqual(new Model(catalog,s,'p',pool).state,model.state);
});
console.log(`PR212_REPRODUCTION ${passed}/${passed+failed} PASS; ${failed} FAIL`);if(failed)process.exitCode=1;
