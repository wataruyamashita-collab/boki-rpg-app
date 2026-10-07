'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..'), cases=require('./fixtures/foundation-extension-cases');
const clone=value=>JSON.parse(JSON.stringify(value));
const storage=()=>{const data=new Map();return{data,getItem:key=>data.get(key)??null,setItem:(key,value)=>{data.set(key,String(value));return true;},removeItem:key=>data.delete(key)};};
const store=storage(), root={localStorage:store,dispatchEvent(){},console};
const context=vm.createContext({window:root,console,queueMicrotask,Event:class Event{}});
for(const file of ['data/accounting-domain.js','data/questions.js','data/accounting-oracle.js','js/calculator.js','js/engine.js','js/model.js','js/rpg.js','js/view.js','js/controller.js','tests/helpers/foundation-extension-adapter.js']) vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context,{filename:file});
const api=root.FoundationExtensionAdapter,questions=api.catalog(cases),canonical=JSON.stringify(root.QuestionData);
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
for(const question of Object.values(questions)) {
  test(question.id+' correct',()=>assert(root.GradingEngine.grade(question,clone(question.answer)).correct));
  test(question.id+' wrong',()=>{const wrong=clone(question.answer);if(question.type==='journal')wrong.debit[0].amount++;else wrong.cells[Object.keys(wrong.cells)[0]]='wrong';assert(!root.GradingEngine.grade(question,wrong).correct);});
  for(const [name,answer] of [['blank',question.type==='journal'?{debit:[],credit:[]}:{cells:{}}],['missing',undefined]])test(question.id+' '+name,()=>assert(!root.GradingEngine.grade(question,answer).correct));
}
for(const whole of [0,1,2,9,99,1200])for(const fraction of ['004','005','006','014','015','016','674','675','676','994','995','996']) {
  // Separate integer-minor-unit oracle; never use the helper's decimal parser or toFixed.
  const cents=whole*100+Math.floor((Number(fraction)+5)/10);
  const expected=Math.floor(cents/100)+'.'+String(cents%100).padStart(2,'0');
  test('HALF_UP '+whole+'.'+fraction,()=>assert.strictEqual(api.roundHalfUp(whole+'.'+fraction,2),expected));
}
for(const [value,precision,expected] of [['-1.005',2,'-1.01'],['-2.675',2,'-2.68'],['-0.004',2,'0.00'],['-5870',0,'-5870'],['0',0,'0'],['4130',0,'4130']])test('signed '+value,()=>assert.strictEqual(api.roundHalfUp(value,precision),expected));
for(const value of ['', 'NaN','Infinity','1e3','1,00','--1','0x10'])test('reject '+JSON.stringify(value),()=>assert.throws(()=>api.roundHalfUp(value,2)));
const input=(value,precision=2,signed=false)=>({value,dataset:{cellId:'unitCost',extensionPrecision:String(precision),extensionSigned:String(signed),extensionQuestion:cases.cost.id},selectionStart:2,selectionEnd:2,selectionDirection:'none',disabled:false,error:'',setCustomValidity(value){this.error=value;},setSelectionRange(start,end,direction){this.selectionStart=start;this.selectionEnd=end;this.selectionDirection=direction;},getAttribute(){return '1個当たり原価（円/個）';}});
for(const [value,start,end,direction] of [['1,200.01',2,2,'none'],['-5,870',1,3,'backward'],['12,345.67',4,7,'forward']])test('caret '+value,()=>{const field=input(value,2,true);field.selectionStart=start;field.selectionEnd=end;field.selectionDirection=direction;assert(api.formatDecimal(field));assert.deepStrictEqual([field.selectionStart,field.selectionEnd,field.selectionDirection],[start,end,direction]);});
test('new grouping preserves logical selection',()=>{const field=input('1234.50');assert(api.formatDecimal(field));assert.strictEqual(field.value,'1,234.50');assert.strictEqual(field.selectionStart,3);});
for(const value of ['1,00','1.234','-1','1e3'])test('invalid field '+value,()=>{const field=input(value);assert.strictEqual(api.formatDecimal(field),false);assert(field.error);assert.strictEqual(field.value,value);});
test('blank is not zero',()=>{const field=input('');assert(api.formatDecimal(field));assert.strictEqual(field.value,'');});
const fields=[{...input('240001',0),dataset:{cellId:'totalCost'}},input('')];
const elements=new Map();
const doc={body:{contains:item=>fields.includes(item)},querySelectorAll:selector=>selector==='.table-input'?fields:[],querySelector:()=>null,getElementById:id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{add(){},remove(){},toggle(){}}});return elements.get(id);}};
const protectedKeys=['boki-rpg-progress-v2','boki-rpg-character-v1'];for(const key of protectedKeys)store.setItem(key,'canonical sentinel '+key);
const originalDescriptor=Object.getOwnPropertyDescriptor(root,'localStorage');
const controller=new api.ExtensionController(doc,questions,store,'foundation-ext:node:');
controller.currentId=cases.cost.id;controller.learningFlow={phase:'I'};controller.model.state.mode='training';
test('real superclass and store captured during construction',()=>{assert(controller instanceof root.AppController);assert(controller.view instanceof root.AppView);assert.deepStrictEqual(Object.getOwnPropertyDescriptor(root,'localStorage'),originalDescriptor);});
test('calculator to actual controller saveDraft and ProgressModel',()=>{
  controller.calculatorTarget=fields[1];controller.expression='1200.005';assert.strictEqual(controller.insertCalculatorResult(false),true);
  assert.strictEqual(fields[1].value,'1,200.01');const saved=JSON.parse(store.getItem('foundation-ext:node:'+controller.model.key));
  assert.strictEqual(saved.drafts[cases.cost.id].cells.unitCost,'1,200.01');assert(root.GradingEngine.grade(cases.cost,saved.drafts[cases.cost.id]).correct);
  assert(root.ProgressModel.validateBackupState(saved,questions));const fresh=new api.ExtensionController(doc,questions,store,'foundation-ext:node:');assert.deepStrictEqual(clone(fresh.model.state.drafts),saved.drafts);
});
test('unsigned calculator rejection preserves draft',()=>{const before=store.getItem('foundation-ext:node:'+controller.model.key);controller.expression='-2';assert.strictEqual(controller.insertCalculatorResult(false),false);assert.strictEqual(store.getItem('foundation-ext:node:'+controller.model.key),before);});
test('detached/stale numeric field is rejected',()=>{const before=store.getItem('foundation-ext:node:'+controller.model.key);fields[1].dataset.extensionQuestion='EXT-STALE';controller.expression='10';assert.strictEqual(controller.insertCalculatorResult(false),false);assert.strictEqual(store.getItem('foundation-ext:node:'+controller.model.key),before);fields[1].dataset.extensionQuestion=cases.cost.id;});
test('unmarked positive-integer behavior is unchanged',()=>{const ordinary=fields[0];ordinary.value='1234';controller.formatAmount(ordinary);assert.strictEqual(ordinary.value,'1,234');ordinary.value='1.23';assert.strictEqual(controller.formatAmount(ordinary),false);controller.calculatorTarget=ordinary;controller.expression='1.6';controller.insertCalculatorResult(false);assert.strictEqual(ordinary.value,'2');});
test('real controller review assignment and model completion',()=>{const q=cases.cost,now=Date.now();controller.model.record(q.id,false,now);controller.model.state.reviewSchedule[q.id].dueAt=now-1;controller.model.state.mode='review';const ids=controller.reviewIds();assert(ids.includes(q.id));assert.strictEqual(controller.model.state.reviewAssignments[q.id].status,'assigned');assert(controller.model.completeReview(q.id,true,now,q.id));assert.strictEqual(controller.model.state.reviewAssignments[q.id],undefined);const saved=JSON.parse(store.getItem('foundation-ext:node:'+controller.model.key));assert(saved.correctIds.includes(q.id));assert.strictEqual(saved.reviewSchedule[q.id].stage,1);});
test('backup preparation is isolated and idempotent',()=>{const saved=clone(controller.model.state),bytes=JSON.stringify(saved),prepared=root.ProgressModel.prepareBackupState(saved,questions);assert(prepared);assert.strictEqual(JSON.stringify(saved),bytes);assert.deepStrictEqual(clone(root.ProgressModel.prepareBackupState(prepared,questions)),clone(prepared));});
test('canonical catalog, progress and rewards untouched',()=>{assert.strictEqual(Object.keys(root.QuestionData).length,300);assert.strictEqual(JSON.stringify(root.QuestionData),canonical);for(const key of protectedKeys)assert.strictEqual(store.getItem(key),'canonical sentinel '+key);assert(Object.keys(questions).every(id=>!root.QuestionData[id]));});
test('independent fixture arithmetic',()=>{assert.strictEqual(1000*150,150000);assert.strictEqual(149000+1000,140000+10000);assert.strictEqual(120000+80000+40001,240001);assert.strictEqual(120001*200-240001*100,100);assert.deepStrictEqual([60000*9091/10000,60000*8264/10000],[54546,49584]);assert.deepStrictEqual([104130-100000,104130-110000,104130-104130],[4130,-5870,0]);});
test('distinct NPV text and explicit scope',()=>{assert.strictEqual(new Set(['npvPositive','npvNegative','npvZero'].map(key=>cases[key].question)).size,3);for(const key of ['npvPositive','npvNegative','npvZero'])assert.strictEqual(cases[key].extension.scope,'cost:nineteenth2');assert(!cases.cost.question.includes('240,001'));assert(cases.cost.explanation.includes('240,002'));});
console.log('FOUNDATION_EXTENSION_CONTRACT '+passed+'/'+passed+' PASS');
console.log('FIXTURE_SHA256 '+crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'fixtures/foundation-extension-cases.js'))).digest('hex'));
