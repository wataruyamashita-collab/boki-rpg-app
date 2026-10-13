'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),{grade,fixture:f,question}=require('../js/form-a-scoring');
const Engine=require('../js/engine'),Model=require('../js/model');
const clone=x=>JSON.parse(JSON.stringify(x)),good=f.answerOrder.map(id=>({id,...f.key[id]}));
const results=[];function check(name,rows,earned){const actual=grade(rows);assert.equal(actual.earned,earned,name);assert.equal(actual.correct,earned===4,name);results.push({name,expected:earned,actual});}
check('all correct',good,4);check('answer array order irrelevant; ID authoritative',good.toReversed(),4);
check('full-width and comma input',good.map(x=>({...x,amount:x.amount.toLocaleString('en-US').replace(/[0-9]/g,d=>String.fromCharCode(d.charCodeAt(0)+65248))})),4);
let full=0;for(const a of f.choices)for(const b of f.choices)for(const c of f.choices)for(const d of f.choices){const rows=good.map((x,i)=>({...x,voucher:[a,b,c,d][i]}));const expected=rows.filter(x=>x.voucher===f.key[x.id].voucher).length;check('classification '+[a,b,c,d].join('/'),rows,expected);if(grade(rows).correct)full++;}assert.equal(full,1);
check('source-order amounts with oracle-correct vouchers',good.map((x,i)=>({...x,amount:f.materials[i].amount})),0);
check('amounts only, ID matched',good.map(({id,amount})=>({id,amount})),0);
check('all deposits and withdrawals mistaken for cash',good.map(x=>({...x,voucher:x.id==='A'?'入金伝票':x.id==='D'?'出金伝票':x.voucher})),2);
check('same amount B/C swapped categories',good.map(x=>({...x,voucher:x.id==='B'?'入金伝票':x.id==='C'?'出金伝票':x.voucher})),2);
let memory=0;for(const a of [50000,20000,30000])for(const b of [50000,20000,30000])for(const c of [50000,20000,30000])for(const d of [50000,20000,30000]){check('L050 memorized amounts '+[a,b,c,d],good.map((x,i)=>({...x,amount:[a,b,c,d][i]})),0);memory++;}
for(const id of f.answerOrder){for(const raw of [undefined,null,'',' ',0,-1,1.5,NaN,Infinity,'18,00','0x4650','1.8e4',true,{},[],f.key[id].amount+1])check('amount wrong '+id+' '+String(raw),good.map(x=>x.id===id?{...x,amount:raw}:x),3);check('voucher blank '+id,good.map(x=>x.id===id?{...x,voucher:''}:x),3);}
for(const bad of [[],good.slice(1),[...good,good[0]],[good[0],good[0],good[2],good[3]],good.map((x,i)=>i?x:{...x,id:'X'}),good.map((x,i)=>i?x:{...x,unexpected:'x'})]){assert.equal(grade(bad).valid,false);results.push({name:'invalid shape',expected:'invalid',actual:grade(bad)});}
// Actual existing engine returns 8 components; design adapter must NOT call 7/8 a correct transaction.
const one=clone(good);one[0].voucher='出金伝票';assert.equal(grade(one).components.earned,7);assert.equal(grade(one).earned,3);
const s={window:{}};vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),s);assert.equal(Object.keys(s.window.QuestionData).length,300);assert(!s.window.QuestionData[question.id]);
let saved={};const storage={getItem:k=>saved[k]??null,setItem:(k,v)=>{saved[k]=v;}};
const model=new Model(s.window.QuestionData,storage);const before=JSON.stringify(model.state);assert.equal(model.recordAttempt(question.id,true,500,'',false,1000,null,'unsure',{mode:model.state.mode,support:'none',observationNumber:1}),false);assert.equal(JSON.stringify(model.state),before);assert.equal(model.nextLearningObservation(question.id),null);
// L050 record reuse would contaminate canonical evidence: show in an isolated in-memory model, never production.
assert.equal(model.recordAttempt('L050',true,500,'',false,1000,null,'unsure',{mode:model.state.mode,support:'none',observationNumber:1}),true);assert.equal(model.learningEffectivenessForQuestion('L050').firstAttempt.correct,true);assert.equal(model.state.questionStats.L050.correctCount,1);
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/form-a-grade-results.json',JSON.stringify({cases:results.length,classificationVectors:81,classificationFull:full,memoryVectors:memory,results},null,2));
console.log(JSON.stringify({status:'PASS',cases:results.length,classificationVectors:81,classificationFull:full,memoryVectors:memory,existingEngine:'8 components; isolated adapter4 pair rows',progress:'unknown ID rejected; L050 reuse contaminates; no production mutation'}));
