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
console.log('RESULT_FEEDBACK_UX_PASS');
