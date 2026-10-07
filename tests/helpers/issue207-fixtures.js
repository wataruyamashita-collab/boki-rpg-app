'use strict';
// Immutable pre-repair sources: never generate legacy evidence with the migration under test.
const fs=require('fs'),vm=require('vm'),cp=require('child_process');
const BASE='04b2f27c7dce31ace0f6f33fd27bf8431036c3a4';
const OLD='08d13e806d4983114e44506407ef7b7b109356e6';
const fromGit=file=>cp.execFileSync('git',['show',`${file}`],{encoding:'utf8'});
const evaluate=(source,key)=>{const s={window:{},console:{log(){},warn(){},error(){}}};vm.runInNewContext(source,s);return s.window[key];};
const oldQuestions=evaluate(fromGit(`${OLD}:data/questions.js`),'QuestionData');
const questions=evaluate(fs.readFileSync('data/questions.js','utf8'),'QuestionData');
const LegacyModel=evaluate(fromGit(`${BASE}:js/model.js`),'ProgressModel');
const clone=value=>JSON.parse(JSON.stringify(value));
const NOW=Date.UTC(2026,9,6,12);
function storage(value=null){return {value,writes:0,getItem(){return this.value;},setItem(k,v){this.value=v;this.writes++;return true;}};}
function fixture(kind='old',id='J051'){
  const store=storage();let model=new LegacyModel(kind==='new'?questions:oldQuestions,store,'test');
  for(const qid of [id,'J001']){
    for(let n=0;n<3;n++)model.recordAttempt(qid,true,1000,'',false,NOW+n*60000);
    model.record(qid,true,NOW+120000);
    model.setDraft(qid,clone((kind==='new'?questions:oldQuestions)[qid].answer));
  }
  if(kind==='mixed'){
    model=new LegacyModel(questions,store,'test');
    for(const [i,correct]of [false,true].entries()){
      model.recordAttempt(id,correct,1000,'',false,NOW+180000+i*60000);
      model.record(id,correct,NOW+180000+i*60000);
    }
  }
  if(kind==='evicted')for(let n=0;n<201;n++)model.recordAttempt('J001',true,1000,'',false,NOW+300000+n*60000);
  const value=clone(model.state);
  if(kind==='stats')value.attempts=[];
  return value;
}
module.exports={BASE,OLD,NOW,questions,oldQuestions,LegacyModel,clone,storage,fixture};
