'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const viewSource=fs.readFileSync('js/view.js','utf8');
const controllerSource=fs.readFileSync('js/controller.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/style.css','utf8');

const sandbox={window:{matchMedia(){return{matches:false};}}};
vm.createContext(sandbox);
vm.runInContext(viewSource,sandbox,{filename:'js/view.js'});
const AppView=sandbox.window.AppView;

class FakeNode{
  constructor(tagName='div'){
    this.tagName=tagName;
    this.children=[];
    this.hidden=true;
    this.className='';
    this.textContent='';
    this.dataset={};
    this.attributes={};
    this.id='';
  }
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(name,value){this.attributes[name]=String(value);}
}
const flatten=node=>[node.textContent,...node.children.flatMap(flatten)].filter(Boolean).join(' ');
const narrative=new FakeNode('section');
narrative.id='narrative-result';
const documentStub={
  createElement(tag){return new FakeNode(tag);},
  getElementById(id){return id==='narrative-result'?narrative:null;}
};
const view=new AppView(documentStub);

assert.strictEqual(typeof view.renderNarrativeResult,'function','S3A requires View.renderNarrativeResult');

const headlessView=new AppView({});
assert.doesNotThrow(
  ()=>headlessView.renderNarrativeResult([],{mode:'story',resolved:false}),
  'headless View must safely ignore narrative rendering'
);
assert.strictEqual(
  headlessView.renderNarrativeResult([],{mode:'story',resolved:false}),
  false,
  'headless View returns false when narrative DOM is unavailable'
);

const scene={
  sceneId:'CH01-BOSS',
  chapter:1,
  beat:'BOSS',
  after:'空白だった元帳の最初の行が埋まりました。',
  hook:'営業部から新しい資料束が届きます。',
  dialogue:'水野「次へ進もう。」'
};
assert.strictEqual(
  view.renderNarrativeResult([scene],{mode:'story',resolved:true}),
  true,
  'resolved Story anchor renders narrative result'
);
assert.strictEqual(narrative.hidden,false);
assert.strictEqual(narrative.dataset.sceneId,'CH01-BOSS');
let text=flatten(narrative);
assert(text.includes(scene.after),'After reaction must render after resolution');
assert(text.includes(scene.hook),'Hook must render after resolution');

assert.strictEqual(view.renderNarrativeResult([scene],{mode:'story',resolved:false}),false,'wrong/unresolved Story must not reveal consequence');
assert.strictEqual(narrative.hidden,true,'unresolved narrative surface stays hidden');
assert.strictEqual(view.renderNarrativeResult([scene],{mode:'training',resolved:true}),false,'Training mode must stay isolated');
assert.strictEqual(narrative.hidden,true,'Training mode narrative surface stays hidden');
assert.strictEqual(view.renderNarrativeResult([scene],{mode:'review',resolved:true}),false,'Review mode must stay isolated');
assert.strictEqual(view.renderNarrativeResult([scene],{mode:'exam',resolved:true}),false,'Exam mode must stay isolated');

const finale={...scene,sceneId:'CH12-BOSS',chapter:12,epilogue:true,after:'社長は会社の状態を理解しました。',hook:'次は主人公が最初の一枚を渡す側です。'};
assert.strictEqual(view.renderNarrativeResult([finale],{mode:'story',resolved:true}),true);
assert(narrative.className.includes('narrative-result-epilogue'),'Chapter 12 epilogue must receive unique presentation class');
assert(flatten(narrative).includes('一年の結末'),'Chapter 12 epilogue needs unique heading');

assert(html.includes('id="narrative-result"'),'result view must contain Story narrative result region');
assert(html.includes('aria-labelledby="narrative-result-heading"'),'narrative result region must have accessible heading relation');
assert(css.includes('.narrative-result'),'narrative result requires dedicated responsive styling');
assert(css.includes('overflow-wrap: anywhere'),'narrative prose must wrap rather than force horizontal scrolling');

assert(controllerSource.includes('S3_PILOT_CHAPTERS'),'S3A rollout must remain explicit to representative chapters');
assert(controllerSource.includes('narrativeScenesForQuestion(question)'),'Controller needs Story-only anchor lookup');
assert(controllerSource.includes('renderNarrativeResult'),'Controller must connect grading flow to narrative result');
assert(controllerSource.includes('renderNarrativeResolution(question, resolved = false)'),'Controller must centralize safe Story-mode resolution');
assert(controllerSource.includes('Controller.prototype.renderNarrativeResolution.call(this, question, false)'),'wrong path must keep narrative unresolved');
assert(controllerSource.includes('Controller.prototype.renderNarrativeResolution.call(this, question, true)'),'correct path must resolve narrative');
assert(
  /revealAnswer\(\)[\s\S]{0,1200}renderNarrativeResolution\.call\(this, this\.questions\[this\.currentId\], true\)/u.test(controllerSource),
  'explicit answer reveal must preserve Story continuity by rendering the narrative consequence'
);

console.log('ISSUE179_S3_NARRATIVE_RESULT_PASS');
