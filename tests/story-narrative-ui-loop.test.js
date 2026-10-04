'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const questionsSource=fs.readFileSync('data/questions.js','utf8');
const questionsSandbox={window:{},console};
vm.createContext(questionsSandbox);
vm.runInContext(questionsSource,questionsSandbox,{filename:'data/questions.js'});
const scenes=questionsSandbox.window.AnchorScenes;
assert(Array.isArray(scenes)&&scenes.length===36,'S3 requires accepted 36-scene authority');

const controllerSource=fs.readFileSync('js/controller.js','utf8');
const controllerSandbox={
  window:{
    AnchorScenes:scenes,
    AppView:class {},
    ProgressModel:class {},
    RPGModel:class {}
  },
  console,
  Event:class {},
  queueMicrotask() {}
};
vm.createContext(controllerSandbox);
vm.runInContext(controllerSource,controllerSandbox,{filename:'js/controller.js'});
const Controller=controllerSandbox.window.AppController;

assert.strictEqual(typeof Controller.anchorBeforeScene,'function','S3 must provide Story-only Before selector');
assert.strictEqual(typeof Controller.anchorResultScene,'function','S3 must provide Story-only After/Hook selector');

const sceneId=scene=>scene?.sceneId||null;

assert.strictEqual(sceneId(Controller.anchorBeforeScene(scenes,'J001','story')),'CH01-OPEN');
assert.strictEqual(sceneId(Controller.anchorBeforeScene(scenes,'J003','story')),'CH01-REVERSAL');
assert.strictEqual(sceneId(Controller.anchorBeforeScene(scenes,'J103','story')),'CH01-BOSS');
assert.strictEqual(sceneId(Controller.anchorBeforeScene(scenes,'J049','story')),'CH11-OPEN','duplicate Chapter 11 reference must prefer OPEN before action');

assert.strictEqual(sceneId(Controller.anchorResultScene(scenes,'J001','story')),'CH01-OPEN','OPEN may provide the first-case reaction when no afterQuestion trigger exists');
assert.strictEqual(sceneId(Controller.anchorResultScene(scenes,'J003','story')),'CH01-REVERSAL');
assert.strictEqual(sceneId(Controller.anchorResultScene(scenes,'J049','story')),'CH11-REVERSAL','afterQuestion trigger must win for Chapter 11');
assert.strictEqual(sceneId(Controller.anchorResultScene(scenes,'J149','story')),'CH11-BOSS');
assert.strictEqual(sceneId(Controller.anchorResultScene(scenes,'C005','story')),'CH12-BOSS');

for(const mode of ['training','review','exam','desk']){
  assert.strictEqual(Controller.anchorBeforeScene(scenes,'J001',mode),null,`${mode}: Before must stay Story-only`);
  assert.strictEqual(Controller.anchorResultScene(scenes,'J001',mode),null,`${mode}: After/Hook must stay Story-only`);
}

const viewSource=fs.readFileSync('js/view.js','utf8');
const viewSandbox={window:{},console};
vm.createContext(viewSandbox);
vm.runInContext(viewSource,viewSandbox,{filename:'js/view.js'});
const AppView=viewSandbox.window.AppView;
assert.strictEqual(typeof AppView.prototype.renderStoryResult,'function','S3 must render Story result consequence/hook');

const elements={
  'story-result':{hidden:true,dataset:{}},
  'story-result-after':{textContent:'STALE_AFTER'},
  'story-result-dialogue':{textContent:'STALE_DIALOGUE'},
  'story-result-hook':{textContent:'STALE_HOOK'}
};
const view={byId:id=>elements[id]};
const boss=scenes.find(scene=>scene.sceneId==='CH12-BOSS');

AppView.prototype.renderStoryResult.call(view,boss);
assert.strictEqual(elements['story-result'].hidden,false,'Anchor result card must be visible for an authorized scene');
assert.strictEqual(elements['story-result'].dataset.sceneId,'CH12-BOSS');
assert.strictEqual(elements['story-result-after'].textContent,boss.after);
assert.strictEqual(elements['story-result-dialogue'].textContent,boss.dialogue);
assert(elements['story-result-hook'].textContent.includes(boss.hook),'Hook must be rendered');

AppView.prototype.renderStoryResult.call(view,null);
assert.strictEqual(elements['story-result'].hidden,true,'missing/unauthorized scene hides Story result card');
assert.strictEqual(elements['story-result-after'].textContent,'','stale After must be cleared');
assert.strictEqual(elements['story-result-dialogue'].textContent,'','stale dialogue must be cleared');
assert.strictEqual(elements['story-result-hook'].textContent,'','stale Hook must be cleared');

assert(
  /anchorBeforeScene/u.test(controllerSource)&&/anchorResultScene/u.test(controllerSource),
  'Controller source must wire Anchor selectors into the runtime path'
);
assert(
  /renderStoryResult/u.test(viewSource),
  'View source must own Story result rendering/clearing'
);

console.log('ISSUE179_NARRATIVE_UI_LOOP_CONTRACT_PASS');