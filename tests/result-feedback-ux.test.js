'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('css/style.css','utf8'),controller=fs.readFileSync('js/controller.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('js/view.js','utf8'),sandbox,{filename:'js/view.js'});
const view=Object.create(sandbox.window.AppView.prototype);
class Node {
  constructor(tag) {
    this.tagName=tag;this.children=[];this.hidden=false;this.className='';this.textContent='';this.isConnected=true;
    this.classList={toggle:(cls,on)=>{const set=new Set(this.className.split(/\s+/).filter(Boolean));if(on)set.add(cls);else set.delete(cls);this.className=[...set].join(' ');return on;},contains:cls=>this.className.split(/\s+/).includes(cls)};
  }
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  after(){}
}
const flatten=n=>[n.textContent,...n.children.map(flatten)].join(' ');
const els={'result-error-summary':new Node('section'),'result-status':new Node('div'),'standard-result-actions':new Node('div'),'exam-result-actions':new Node('div'),'top-result-actions':new Node('div'),'explanation':new Node('div')};
const nextAction=new Node('button'),retryAction=new Node('button');
els['standard-result-actions'].querySelector=()=>nextAction;
view.document={createElement:tag=>new Node(tag),querySelector:sel=>sel==='[data-action="coaching-retry-result"]'?retryAction:null,getElementById:id=>els[id]||null};
view.renderAchievement=()=>{};view.renderAnswerComparison=()=>{};view.renderCorrectJournal=()=>{};view.renderExplanation=()=>{};
const journal={type:'journal',answer:{debit:[{account:'未収入金',amount:1000}],credit:[{account:'備品',amount:1000}]}};
const answer={debit:[{account:'売掛金',amount:1000}],credit:[{account:'備品',amount:1000}]};
view.result(journal,{correct:false,details:[]},answer,'unsure',{},true);
const error=els['result-error-summary'];
assert.strictEqual(error.hidden,false);
assert(flatten(error).includes('売掛金')&&flatten(error).includes('未収入金'),'誤った科目と正答科目を先に対比する');
assert.strictEqual(els['top-result-actions'].hidden,true,'誤答時に上部の次へ進むを隠す');
assert.strictEqual(retryAction.hidden,false);
assert(nextAction.classList.contains('secondary-button'),'誤答時は次へ進むを補助操作にする');
view.result(journal,{correct:true,details:[]},journal.answer,'sure',{},false);
assert.strictEqual(error.hidden,true,'正解時に誤答ガイドを出さない');
assert.strictEqual(els['top-result-actions'].hidden,false);
assert.strictEqual(retryAction.hidden,true);
assert(!nextAction.classList.contains('secondary-button'),'正解時は通常の次へ進む');

const table={type:'ledger',table:{inputCells:['a','b'],inputMetadata:{a:{label:'借方金額',semanticType:'amount'},b:{label:'摘要'}}},answer:{cells:{a:1200,b:'現金'}}};
view.renderErrorSummary(table,{correct:false,details:[{cellId:'a',correct:false},{cellId:'b',correct:true}]},{cells:{a:'1,000',b:'現金'}});
const msg=flatten(error);
assert(msg.includes('借方金額')&&msg.includes('1,000円')&&msg.includes('1,200円'),'表の相違セルと金額を表示');
assert(!msg.includes('摘要：'),'一致欄は誤答に含めない');
assert(html.includes('id="story-learning-summary"')&&!html.includes('id="result-learning-summary"'),'進捗はStoryに限定する');
const start=html.indexOf('<div id="standard-result-actions">'),end=html.indexOf('</div>',start),actions=html.slice(start,end);
assert(start>=0&&actions.indexOf('coaching-retry-result')>=0&&actions.indexOf('coaching-retry-result')<actions.indexOf('data-action="next"'),'解き直しを次へ進むより優先する');
assert(!controller.includes("renderLearningContinuity.call(this, 'result-learning-summary'"),'結果画面に進捗を再描画しない');
assert(css.includes('.result-error-summary[hidden]'),'誤答ガイドの非表示を保証');
// Independent bookkeeping expectations: purchase 200,000 plus buyer-paid freight
// 6,000 is inventory cost 206,000, financed by accounts payable 200,000 and cash 6,000.
// These amounts and expected messages are not obtained from the summary generator.
const engine=require('../js/engine');
const purchase={type:'journal',answer:{debit:[{account:'仕入',amount:206000}],credit:[{account:'買掛金',amount:200000},{account:'現金',amount:6000}]}};
const messages=()=>error.children.find(n=>n.tagName==='ul')?.children.map(n=>n.textContent)||[];
let cases=0;
function check(name,q,input,correct,expected,overflow=0){
  const before=JSON.stringify({q,input}),score=engine.grade(q,input),gradeBefore=JSON.stringify(score);
  assert.strictEqual(score.correct,correct,name+' independent correctness');
  view.renderErrorSummary(q,score,input);
  assert.deepStrictEqual(messages(),expected,name+' exact messages and stable order');
  assert.strictEqual(error.hidden,correct,name+' visibility');
  assert.strictEqual(flatten(error).includes(`ほか${overflow}件`),overflow>0,name+' truthful overflow');
  assert.strictEqual(JSON.stringify({q,input}),before,name+' data unchanged');
  assert.strictEqual(JSON.stringify(engine.grade(q,input)),gradeBefore,name+' grading unchanged');
  cases++;
}
check('exact compound reordered',purchase,{debit:[{account:'仕入',amount:206000}],credit:[{account:'現金',amount:6000},{account:'買掛金',amount:200000}]},true,[]);
check('same amount different account',journal,answer,false,['借方の勘定科目・金額：入力 売掛金 1,000円／正答 未収入金 1,000円']);
check('one amount',journal,{debit:[{account:'未収入金',amount:900}],credit:[{account:'備品',amount:1000}]},false,['借方「未収入金」の金額：入力 900円／正答 1,000円']);
check('side reversal',journal,{debit:[{account:'備品',amount:1000}],credit:[{account:'未収入金',amount:1000}]},false,['借方の勘定科目・金額：入力 備品 1,000円／正答 未収入金 1,000円','貸方の勘定科目・金額：入力 未収入金 1,000円／正答 備品 1,000円']);
check('unanswered',journal,{debit:[],credit:[]},false,['借方に必要な「未収入金」1,000円を確認','貸方に必要な「備品」1,000円を確認']);
check('partial amount missing',journal,{debit:[{account:'未収入金',amount:NaN}],credit:[]},false,['借方「未収入金」の金額：入力 未入力／正答 1,000円','貸方に必要な「備品」1,000円を確認']);
const compoundExpected=['貸方の勘定科目・金額：入力 売掛金 199,000円／正答 買掛金 200,000円','貸方「現金」の金額：入力 7,000円／正答 6,000円'];
for(const credit of [[{account:'現金',amount:7000},{account:'売掛金',amount:199000}],[{account:'売掛金',amount:199000},{account:'現金',amount:7000}]])
  check('compound same-account reservation',purchase,{debit:[{account:'仕入',amount:206000}],credit},false,compoundExpected);
check('extra line',journal,{debit:[{account:'未収入金',amount:1000},{account:'現金',amount:1}],credit:[{account:'備品',amount:1000}]},false,['借方の余分な入力：現金 1円']);
// Four explicit table entries are stable in grading-contract order, not educational ranking.
const four={type:'ledger',table:{inputCells:['a','b','c','d'],inputMetadata:Object.fromEntries(['a','b','c','d'].map((id,i)=>[id,{label:`金額${i+1}`,semanticType:'amount'}]))},answer:{cells:{a:100,b:200,c:300,d:400}}};
const tableExpected=['金額1：入力 1円／正答 100円','金額2：入力 2円／正答 200円','金額3：入力 3円／正答 300円'];
check('three differences',four,{cells:{a:1,b:2,c:3,d:400}},false,tableExpected);
check('four differences',four,{cells:{a:1,b:2,c:3,d:4}},false,tableExpected,1);
check('table normalization exact',four,{cells:{a:'１００',b:' 200 ',c:300,d:'400'}},true,[]);
check('partial table',four,{cells:{a:100,b:200,c:300}},false,['金額4：入力 未入力／正答 400円']);
for(const correct of [false,true]){
  let anchor;
  view.renderAchievement=(node)=>{anchor=node;};
  view.result(journal,{correct,details:[]},answer,'sure',{},!correct);
  assert.strictEqual(anchor,els.explanation,'reward follows explanation for both outcomes');
  assert(flatten(els['result-status']).includes(correct?'正解です！':'もう一歩です'));
}
console.log(`RESULT_FEEDBACK_UX_PASS independentCases=${cases}`);
