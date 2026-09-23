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
for(const id of ['L015','L033']){
  const explanation=root.QuestionData[id].explanation;
  assert(explanation.includes('耐用年数5年'),`${id}: pre-unitized useful life is preserved`);
  assert(!explanation.includes('5年年'),`${id}: useful-life unit is not duplicated`);
}
assert(root.QuestionData.L005.explanation.includes('耐用年数5年'),'numeric useful life receives one year unit');
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
const fixedRendererSource=view.slice(view.indexOf('renderFixedAssetLedger'),view.indexOf('positionStickyContextColumns'));
assert(!/semanticType === 'date'[^\n]*inputMode/.test(fixedRendererSource),'slash-form fixed-asset dates do not force a numeric-only keyboard');
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
const legacyBackup={...saved,mode:'story',examSession:null};
assert.strictEqual(root.ProgressModel.validateBackupState(legacyBackup,questions),true,'legacy backup v1 remains importable');
assert.strictEqual(root.ProgressModel.validateBackupState({...legacyBackup,contentRevision:2},questions),true,'revision 2 backup remains importable');
assert.strictEqual(root.ProgressModel.validateBackupState({...legacyBackup,contentRevision:3},questions),true,'current content revision accepted');
assert.strictEqual(root.ProgressModel.validateBackupState({...legacyBackup,contentRevision:4},questions),false,'future content revision rejected');
const futureState={...saved,contentRevision:4,mode:'exam',currentQuestionId:'L033',answeredIds:['L005'],correctIds:['L005'],incorrectIds:['L010'],drafts:{L033:{cells:{future:1}}},examSession:saved.examSession};
stored=JSON.stringify(futureState);let futureWrites=0;
const futureModel=new root.ProgressModel(questions,{getItem:()=>stored,setItem:()=>{futureWrites++;return true;}});
assert.deepStrictEqual(JSON.parse(JSON.stringify(futureModel.state)),{contentRevision:3,mode:'story',currentQuestionId:null,answeredIds:[],correctIds:[],incorrectIds:[],mistakeCounts:{},reviewSchedule:{},reviewAssignments:{},attempts:[],drafts:{},completed:false,placement:null,examAttempt:0,examSession:null,examHistory:[],lastExamReview:null},'future persisted state leaves the safe default state intact');
assert.strictEqual(futureWrites,0,'future persisted state is not silently downgraded or saved');

for(const id of ids){
  const q=root.QuestionData[id];
  assert(!JSON.stringify({question:q.question,table:q.table,explanation:q.explanation}).includes('当期減価償却額'),`${id}: terminology normalized`);
  assert(q.explanation.includes('1年分の減価償却費'),`${id}: annual depreciation terminology`);
}
assert.strictEqual(root.QuestionData.L030.table.inputMetadata.annualDepreciation.label,'1年分の減価償却費');
assert.strictEqual(root.QuestionData.L040.table.inputMetadata.annualA.label,'備品A 1年分の減価償却費');
assert.strictEqual(root.QuestionData.L040.table.inputMetadata.annualB.label,'備品B 1年分の減価償却費');
assert.deepStrictEqual(JSON.parse(JSON.stringify(root.QuestionData.L030.answer.cells)),{annualDepreciation:72000,months:4,currentDepreciation:24000,closingAccumulated:24000,closingBookValue:336000});
assert.deepStrictEqual(Object.keys(root.QuestionData.L015.materials[0]),['資料','取得日','取得原価']);
assert.strictEqual(root.QuestionData.L015.materials[1].資料,'償却条件');
assert(root.QuestionData.L015.question.includes('請求書と償却条件')&&root.QuestionData.L015.explanation.includes('請求書から')&&root.QuestionData.L015.explanation.includes('償却条件から'));
assert(root.QuestionData.L033.question.includes('請求書と償却条件'));
assert(root.QuestionData.L040.explanation.includes('4月から9月までの6か月')&&root.QuestionData.L040.explanation.includes('10月を使用月数に含めない'));
for(const mutate of [
  q=>{q.question=q.question.replace('会計期間は4月1日から翌年3月31日までである。','');},
  q=>{q.question=q.question.replace('備品Aは12月1日に取得した。','備品Aを取得した。');delete q.table.rows[0].acquisitionDate;},
  q=>{q.question=q.question.replace('残存価額0円、','');delete q.table.rows[0].residualValue;},
  q=>{q.question=q.question.replace('耐用年数5年、','');delete q.table.rows[0].life;},
  q=>{q.question=q.question.replace('減価償却方法は定額法である。','');delete q.table.rows[0].method;}
]){
  const candidate=structuredClone(root.QuestionData.L030);mutate(candidate);
  assert.strictEqual(root.deriveAccountingExpected('L030',null,candidate).derivable,false);
}
const revision2State={...saved,contentRevision:2,mode:'exam',drafts:{L005:{cells:{old:1}},L030:{cells:{old:2}},J001:{debit:[],credit:[]}},examSession:{...saved.examSession,ids:root.ExamPoolDefinition.filter(id=>!['L033','L040'].includes(id)).slice(0,15)}};
stored=JSON.stringify(revision2State);
const revision2Model=new root.ProgressModel(questions,storage);
assert.strictEqual(revision2Model.state.drafts.L030,undefined);
assert(revision2Model.state.drafts.L005);
assert(revision2Model.state.drafts.J001);
assert(revision2Model.state.examSession);
assert.strictEqual(revision2Model.state.mode,'exam');
console.log('fixed asset ledger tests: ok');
