'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const file of ['data/questions.js','js/model.js']) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const root=sandbox.window,questions=root.QuestionData,ProgressModel=root.ProgressModel;
const ids=Object.keys(questions);
assert.strictEqual(ids.length,300,'state-isolation corpus is exactly 300 questions');

const storage={getItem(){return null;},setItem(){return true;}};
const model=new ProgressModel(questions,storage);
const sentinelBase=91000000;
let tableQuestions=0,fixedAssets=0,journals=0;

function draftFor(q,n){
  if(q.type==='journal'){
    const debit=(q.answer?.debit||[]).map((row,i)=>({account:row.account||'',amount:n+i}));
    const credit=(q.answer?.credit||[]).map((row,i)=>({account:row.account||'',amount:n+100+i}));
    return {debit,credit};
  }
  const cells={};
  for(const [i,cell] of (q.table?.inputCells||[]).entries()) cells[cell]=n+i;
  return {cells};
}

ids.forEach((id,index)=>{
  const q=questions[id],cells=q.table?.inputCells||[];
  assert.strictEqual(new Set(cells).size,cells.length,`${id}: duplicate input cell IDs are forbidden`);
  if(cells.length)tableQuestions++;
  if(q.format==='fixed-asset-ledger')fixedAssets++;
  if(q.type==='journal')journals++;

  const sentinel=sentinelBase+index*1000;
  const draft=draftFor(q,sentinel);
  const beforeKeys=Object.keys(model.state.drafts);
  assert.strictEqual(model.setDraft(id,draft),true,`${id}: draft persists`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(model.state.drafts[id])),JSON.parse(JSON.stringify(draft)),`${id}: same-question resume authority preserves exact draft`);
  for(const other of beforeKeys) assert(model.state.drafts[other],`${id}: saving a draft does not erase another question`);

  const next=ids[(index+1)%ids.length];
  if(next!==id){
    const nextDraft=draftFor(questions[next],sentinel+500);
    model.setDraft(next,nextDraft);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(model.state.drafts[id])),JSON.parse(JSON.stringify(draft)),`${id}: another question cannot overwrite this draft`);
    model.clearDraft(next);
    assert(model.state.drafts[id],`${id}: clearing another question cannot clear this draft`);
  }

  assert.strictEqual(model.record(id,true,1000000+index),true,`${id}: authoritative completion records`);
  assert.strictEqual(model.state.drafts[id],undefined,`${id}: authoritative completion clears its draft`);
});

assert.strictEqual(tableQuestions,150,'150 questions use table input cells');
assert.strictEqual(fixedAssets,8,'all 8 fixed-asset-ledger questions are in the state-isolation sweep');
assert.strictEqual(journals,150,'all 150 journal questions are in the state-isolation sweep');
assert.strictEqual(Object.keys(model.state.drafts).length,0,'all-300 sweep ends with no residual draft');
console.log('ISSUE161_ALL300_STATE_ISOLATION_PASS');
