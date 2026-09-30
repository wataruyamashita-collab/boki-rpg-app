'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');

const sandbox={window:{},console,Event:class Event{},queueMicrotask(fn){fn();}};
vm.createContext(sandbox);
for(const file of ['js/model.js','js/controller.js']) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const ProgressModel=sandbox.window.ProgressModel;
const Controller=sandbox.window.AppController;

const questions={
  Q1:{id:'Q1',type:'ledger',category:'同一カテゴリ'},
  Q2:{id:'Q2',type:'ledger',category:'同一カテゴリ',learningRole:'review'},
  Q3:{id:'Q3',type:'ledger',category:'別カテゴリ'}
};
const storage={getItem(){return null;},setItem(){return true;}};

{
  const model=new ProgressModel(questions,storage);
  model.state.drafts.Q1={cells:{a:111}};
  model.record('Q1',true,1000);
  assert.strictEqual(model.state.drafts.Q1,undefined,'authoritative ordinary submit clears its question draft');
}

{
  const rendered=[];
  const cleared=[];
  const ctx={
    questions,
    model:{state:{mode:'story',currentQuestionId:null,drafts:{Q1:{cells:{a:111}},Q2:{cells:{a:222}}}},save(){return true;},clearDraft(id){cleared.push(id);delete this.state.drafts[id];return true;}},
    view:{resetLearningSurfaces(){},renderQuestion(q,draft){rendered.push({id:q.id,draft});},setAnswerMode(){},show(){}},
    resetCalculator(){},modeIds(){return ['Q1','Q2','Q3'];},
    document:{getElementById(){return {hidden:false,focus(){}};}}
  };
  Controller.prototype.start.call(ctx,'Q1');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendered.pop().draft)),{cells:{a:111}},'explicit resume restores the same unfinished question draft');
  assert.deepStrictEqual(cleared,[],'resume does not clear the saved draft');

  Controller.prototype.start.call(ctx,'Q2',{fresh:true});
  assert(cleared.includes('Q2'),'fresh start explicitly clears the selected question draft before rendering');
  assert.strictEqual(rendered.pop().draft,undefined,'fresh start never silently renders stale saved input');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.model.state.drafts.Q1)),{cells:{a:111}},'fresh start never clears another question draft');
}

{
  const model=new ProgressModel(questions,storage);
  model.state.reviewSchedule.Q1={stage:0,dueAt:100};
  model.state.reviewAssignments.Q1={sourceQuestionId:'Q1',reviewQuestionId:'Q2',conceptId:'同一カテゴリ',stage:0,dueAt:100,assignedAt:1,status:'assigned'};
  model.state.drafts.Q1={cells:{a:111}};
  model.state.drafts.Q2={cells:{a:222}};
  assert.strictEqual(model.completeReview('Q1',true,200,'Q2'),true,'review completes');
  assert.strictEqual(model.state.drafts.Q1,undefined,'review completion clears source draft');
  assert.strictEqual(model.state.drafts.Q2,undefined,'review completion also clears the actual review-variant draft');
}

{
  const ids=Array.from({length:15},(_,i)=>'E'+String(i+1).padStart(2,'0'));
  const q=Object.fromEntries(ids.map(id=>[id,{id,type:'ledger',category:id}]));
  const draftIds=new Set(ids);
  let clearedIds=[];
  const state={
    examSession:{ids,startedAt:100,endAt:1000,status:'RUNNING',scores:{
      [ids[0]]:{correct:true,earned:1,possible:1,ratio:1,answer:{cells:{a:1}}}
    }},
    drafts:Object.fromEntries(ids.map((id,i)=>[id,{cells:{a:9000+i}}])),
    examHistory:[],lastExamReview:null,examAttempt:0
  };
  const ctx={
    model:{
      state,
      record(id){delete state.drafts[id];return true;},
      clearDrafts(list){clearedIds=[...list];for(const id of list)delete state.drafts[id];return true;},
      updateCompletion(){return false;},save(){return true;}
    },
    rpg:{level:1,role:'新人',recordMastery(){},reward(){},progressCompleted:false},
    questions:q,currentId:ids[1],
    unansweredExamIds(){return ids.filter(id=>!Object.hasOwn(state.examSession.scores,id));},
    stopExamTimer(){},document:{body:{classList:{remove(){}}},getElementById(){return {focus(){}};}},
    view:{examResult(){},show(){}}
  };
  assert.strictEqual(Controller.prototype.finishExam.call(ctx,true,1000),true,'timed-out exam finishes');
  assert.deepStrictEqual(clearedIds,ids,'exam finish clears drafts for the complete exam set, including unanswered partial inputs');
  assert.strictEqual(Object.keys(state.drafts).length,0,'new exam attempt cannot inherit prior exam inputs');
}

const controllerSource=fs.readFileSync('js/controller.js','utf8');
assert(controllerSource.includes("dataset.startFresh = 'true'") || controllerSource.includes('dataset.startFresh="true"'),'question-list entries must explicitly request fresh start rather than silently resume stale input');
assert(/clearDrafts\?\.\(session\.ids\)|clearDrafts\(session\.ids\)/.test(controllerSource),'exam lifecycle must clear the full session draft set');
console.log('ISSUE161_INPUT_STATE_CONTRACT_PASS');
