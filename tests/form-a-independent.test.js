'use strict';
const assert=require('assert'),fs=require('fs'),crypto=require('crypto'),{grade,fixture}=require('../js/form-a-scoring');
// Accounting expectation is derived from the locked transaction statements,
// independently of the product key and the canonical accounting Oracle.
const journals=[
 {id:'A',debit:'普通預金',credit:'売掛金',amount:42000},
 {id:'B',debit:'買掛金',credit:'現金',amount:18000},
 {id:'C',debit:'現金',credit:'売掛金',amount:18000},
 {id:'D',debit:'通信費',credit:'普通預金',amount:6000}
];
const expected=Object.fromEntries(journals.map(j=>{const cash=(j.debit==='現金'?j.amount:0)-(j.credit==='現金'?j.amount:0);return [j.id,{amount:j.amount,voucher:cash>0?'入金伝票':cash<0?'出金伝票':'振替伝票',cash}];}));
assert.equal(journals.reduce((s,j)=>s+j.amount,0),84000);assert.equal(Object.values(expected).reduce((s,x)=>s+x.cash,0),0);
assert.equal(journals.reduce((s,j)=>s+(j.debit==='普通預金'?j.amount:0)-(j.credit==='普通預金'?j.amount:0),0),36000);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('data/form-a.json')).digest('hex'),'8d980909e2dccd532bb9f23b6908bcd49fb8b9fdef7fc661afc72799d2a77bc1','approved fixture bytes and identity remain exact');
const order=['C','A','D','B'];assert.deepEqual(fixture.answerOrder,order);
for(const id of order)assert.deepEqual(fixture.key[id],{voucher:expected[id].voucher,amount:expected[id].amount});
function permutations(values){if(!values.length)return [[]];return [...new Set(values)].flatMap(v=>{const rest=values.slice();rest.splice(rest.indexOf(v),1);return permutations(rest).map(p=>[v,...p]);});}
let count=0,full=0;
for(const amounts of permutations([42000,18000,18000,6000]))for(let n=0;n<81;n++){
 let code=n;const rows=order.map((id,i)=>{const voucher=['入金伝票','出金伝票','振替伝票'][code%3];code=Math.floor(code/3);return{id,voucher,amount:amounts[i]};});
 const correct=rows.filter(row=>row.amount===expected[row.id].amount && row.voucher===expected[row.id].voucher).length,result=grade(rows);
 assert.equal(result.earned,correct);assert.equal(result.correct,correct===4);count++;if(result.correct)full++;
}
assert.equal(count,972);assert.equal(full,1);
console.log('Form A independent journals: debit=credit84,000; cash0; bank36,000; product adapter972/972 PASS');
