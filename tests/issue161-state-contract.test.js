'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');

const sandbox={window:{},console,setTimeout,clearTimeout};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/model.js','js/controller.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const {QuestionData,ProgressModel,AppController}=sandbox.window;
assert(QuestionData&&ProgressModel&&AppController,'production model/controller load');

const fixedAssetIds=['L005','L010','L015','L020','L025','L030','L033','L040'];
for(const id of fixedAssetIds) assert.strictEqual(QuestionData[id].format,'fixed-asset-ledger',`${id}: fixed asset ledger inventory`);

const storage=()=>{
  const values={};
  return {
    values,
    getItem:key=>Object.prototype.hasOwnProperty.call(values,key)?values[key]:null,
    setItem:(key,value)=>{values[key]=String(value);return true;},
    removeItem:key=>{delete values[key];return true;}
  };
};

const makeContext=(model,id,rendered)=>{
  const docNode=()=>({focus(){},hidden:false});
  return {
    questions:QuestionData,
    model,
    currentId:null,
    questionStartedAt:null,
    reviewSourceId:null,
    learningFlow:null,
    submitting:false,
    resetCalculator(){},
    modeIds(){return [id];},
    view:{
      resetLearningSurfaces(){},
      renderQuestion(question,draft,mode){rendered.push({id:question.id,draft,mode});},
      setAnswerMode(){},
      show(){}
    },
    document:{
      getElementById(){return docNode();}
    }
  };
};

// Gate 2 contract A: a normal/fresh start must never silently restore an old draft.
for(const id of fixedAssetIds){
  const store=storage();
  const model=new ProgressModel(QuestionData,store,`gate2-fresh-${id}`);
  model.state.placement={completed:true,startQuestionId:id,foundation:0,closing:0};
  model.state.mode='story';
  const sentinel={cells:{annualDepreciation:987654321,currentDepreciation:123456789,closingBookValue:111111111}};
  model.setDraft(id,sentinel);
  const rendered=[];
  AppController.prototype.start.call(makeContext(model,id,rendered),id);
  assert.strictEqual(model.state.drafts[id],undefined,`${id}: normal start clears stale draft`);
  assert.strictEqual(rendered.at(-1).draft,undefined,`${id}: normal start renders blank inputs`);
}

// Gate 2 contract B: only an explicit resume action may restore the unfinished same-question draft.
{
  const id='L005',store=storage(),model=new ProgressModel(QuestionData,store,'gate2-resume');
  model.state.placement={completed:true,startQuestionId:id,foundation:0,closing:0};
  model.state.mode='story';
  const sentinel={cells:{annualDepreciation:444444,currentDepreciation:555555,closingBookValue:666666}};
  model.setDraft(id,sentinel);
  const rendered=[];
  AppController.prototype.start.call(makeContext(model,id,rendered),id,{resume:true});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendered.at(-1).draft)),sentinel,'explicit resume restores same-question draft');
  assert(model.state.drafts[id],'explicit resume keeps draft persisted');
}

// Gate 2 contract C: active exam navigation preserves per-question drafts until exam completion.
{
  const id='J128',store=storage(),model=new ProgressModel(QuestionData,store,'gate2-exam');
  model.state.placement={completed:true,startQuestionId:id,foundation:0,closing:0};
  model.state.mode='exam';
  const sentinel={debit:[{account:'現金',amount:101}],credit:[{account:'資本金',amount:101}]};
  model.setDraft(id,sentinel);
  const rendered=[];
  AppController.prototype.start.call(makeContext(model,id,rendered),id);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rendered.at(-1).draft)),sentinel,'exam navigation restores current attempt draft');
  assert(model.state.drafts[id],'exam draft remains before exam finish');
}

// Gate 2 contract D: authoritative ordinary completion removes the draft.
{
  const id='L005',store=storage(),model=new ProgressModel(QuestionData,store,'gate2-record');
  model.setDraft(id,{cells:{annualDepreciation:777}});
  model.record(id,true,1000);
  assert.strictEqual(model.state.drafts[id],undefined,'ordinary completion clears draft');
}

// Gate 2 contract E: review completion clears both source and assigned variant drafts.
{
  const source='L005';
  const variant=Object.keys(QuestionData).find(id=>id!==source&&QuestionData[id].category===QuestionData[source].category&&QuestionData[id].learningRole==='review');
  assert(variant,'fixed-asset category has a review variant');
  const store=storage(),model=new ProgressModel(QuestionData,store,'gate2-review');
  const now=1000000;
  model.state.reviewSchedule[source]={stage:0,dueAt:now-1};
  model.state.reviewAssignments[source]={sourceQuestionId:source,reviewQuestionId:variant,conceptId:QuestionData[source].category,stage:0,dueAt:now-1,assignedAt:now-100,status:'assigned'};
  model.setDraft(source,{cells:{annualDepreciation:1}});
  model.setDraft(variant,{cells:{annualDepreciation:2}});
  assert.strictEqual(model.completeReview(source,true,now,variant),true,'review completion accepted');
  assert.strictEqual(model.state.drafts[source],undefined,'review source draft cleared');
  assert.strictEqual(model.state.drafts[variant],undefined,'review variant draft cleared');
}

// Gate 2 contract F/G: exam finish/retry and explicit resume wiring remain present in production controller/UI.
const controllerSource=fs.readFileSync('js/controller.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(controllerSource.includes("const restoreDraft = this.model.state.mode === 'exam' || options.resume === true"),'restore authority is explicit');
assert(controllerSource.includes("onConfirm:() => this.start(id, { resume:true })"),'resume notice explicitly restores draft');
assert(html.includes('data-resume-draft="true" id="resume-button"'),'story resume button explicitly marks restore intent');
assert(controllerSource.includes('this.model.clearDrafts?.(session.ids);'),'exam completion clears attempt drafts');
assert(controllerSource.includes('this.model.clearDrafts?.(previousIds);'),'exam retry clears previous attempt drafts');
assert(!controllerSource.includes('dataset.startFresh'),'legacy inverse fresh flag removed');

console.log('ISSUE161_GATE2_STATE_CONTRACT_PASS');
