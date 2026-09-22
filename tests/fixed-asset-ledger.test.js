'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},console};vm.createContext(sandbox);
for(const file of ['data/questions.js','data/accounting-oracle.js','js/engine.js','js/model.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const root=sandbox.window,ids=['L005','L010','L015','L020','L025','L030','L033','L040'];
for(const id of ids){
  const q=root.QuestionData[id],derived=root.deriveAccountingExpected(id,null,q);
  assert.strictEqual(q.format,'fixed-asset-ledger',`${id}: semantic renderer format`);
  assert.strictEqual(derived.sourceValid,true,`${id}: visible facts are sufficient`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(derived.expected)),JSON.parse(JSON.stringify(q.answer)),`${id}: independently recomputed answer`);
  for(const cell of q.table.inputCells)assert(q.table.inputMetadata[cell]?.label&&q.table.inputMetadata[cell]?.semanticType,`${id}/${cell}: labeled semantic control`);
}
for(const missing of ['定額法','残存価額','耐用年数']){
  const q=structuredClone(root.QuestionData.L033);
  q.question=q.question.replace(missing,''); q.materials=q.materials.map(row=>Object.fromEntries(Object.entries(row).filter(([key,value])=>key!==missing&&value!==missing)));
  assert.strictEqual(root.deriveAccountingExpected('L033',null,q).derivable,false,`missing ${missing} fails closed`);
}
const l033=root.QuestionData.L033;
for(const value of ['7/1','07/01','7月1日'])assert.strictEqual(root.GradingEngine.grade(l033,{cells:{...l033.answer.cells,acquisitionDate:value}}).correct,true,`${value} date variant`);
assert.strictEqual(root.GradingEngine.grade(l033,{cells:{...l033.answer.cells,acquisitionDate:'7/2'}}).correct,false,'wrong date rejected');
assert(root.ExamPoolDefinition.includes('L033')&&root.ExamPoolDefinition.includes('L040'),'redesigned exam questions remain in pool');
const view=fs.readFileSync('js/view.js','utf8'),css=fs.readFileSync('css/style.css','utf8');
assert(view.includes("question.format === 'fixed-asset-ledger'")&&view.includes("input.placeholder = '例：7/1'")&&!view.includes("input.type = 'date'"),'renderer uses compact text dates');
assert(view.includes("unit.textContent = semanticType === 'amount' ? '円' : 'か月'")&&view.includes("label.htmlFor = `fixed-asset-"),'visible labels and external units');
const fixedRenderer=view.slice(view.lastIndexOf('renderFixedAssetLedger(question'),view.indexOf('positionStickyContextColumns(table)',view.indexOf('renderFixedAssetLedger(question'))); assert(!fixedRenderer.includes('question.answer'),'renderer does not read answers or leak them in exam mode');
assert(/@media \(max-width: 430px\)[\s\S]*fixed-asset-fields/.test(css)&&/min-height: 44px/.test(css),'phone card reflow and touch targets');
const questions=Object.fromEntries(root.ExamPoolDefinition.map(id=>[id,root.QuestionData[id]])); Object.assign(questions,Object.fromEntries(ids.map(id=>[id,root.QuestionData[id]])),{J001:root.QuestionData.J001});
const examIds=root.ExamPoolDefinition.slice(0,15); if(!examIds.includes('L033'))examIds[0]='L033';
const saved={mode:'exam',currentQuestionId:'L033',answeredIds:['L005'],correctIds:['L005'],incorrectIds:[],mistakeCounts:{},reviewSchedule:{},reviewAssignments:{},attempts:[{questionId:'L005',correct:true,responseMs:10}],drafts:{L005:{cells:{old:1}},L033:{cells:{old:2}},J001:{debit:[],credit:[]}},completed:false,placement:null,examAttempt:1,examSession:{ids:examIds,startedAt:1,endAt:2,status:'RUNNING',scores:{}},examHistory:[],lastExamReview:null};
let stored=JSON.stringify(saved);const storage={getItem:()=>stored,setItem:(_k,v)=>{stored=v;return true;}};
const model=new root.ProgressModel(questions,storage);
assert.strictEqual(model.state.drafts.L005,undefined);assert.strictEqual(model.state.drafts.L033,undefined);assert(model.state.drafts.J001,'unrelated draft preserved');
assert.strictEqual(JSON.stringify(model.state.answeredIds),JSON.stringify(['L005']));assert.strictEqual(JSON.stringify(model.state.correctIds),JSON.stringify(['L005']));assert.strictEqual(model.state.attempts.length,1,'progress and attempts preserved');
assert.strictEqual(model.state.examSession,null);assert.strictEqual(model.state.mode,'story','schema-incompatible exam invalidated safely');
const compatible={...saved,mode:'exam',drafts:{J001:{debit:[],credit:[]}},examSession:{...saved.examSession,ids:root.ExamPoolDefinition.filter(id=>!['L033','L040'].includes(id)).slice(0,15)}};stored=JSON.stringify(compatible);const compatibleModel=new root.ProgressModel(questions,storage);assert(compatibleModel.state.examSession,'unaffected active exam preserved');
assert.strictEqual(root.ProgressModel.validateBackupState({...saved,mode:'story',examSession:null},questions),true,'legacy backup v1 remains importable');
assert.strictEqual(root.ProgressModel.validateBackupState({...saved,mode:'story',examSession:null,contentRevision:2},questions),true,'optional content revision accepted');
console.log('fixed asset ledger tests: ok');
