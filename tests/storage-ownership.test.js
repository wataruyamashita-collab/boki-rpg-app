'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const {MessageChannel} = require('worker_threads');
const Model = require('../js/model'), RPG = require('../js/rpg');
const questions = {Q:{id:'Q',type:'journal',category:'仕訳',difficulty:1}};
const progressKey = 'boki-rpg-progress-v2', characterKey = 'boki-rpg-character-v1';
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const data = {}, storage = {reads:0,getItem(k){this.reads++;return data[k]??null;},setItem(k,v){data[k]=v;},removeItem(k){delete data[k];}};
  let tail = Promise.resolve();
  const locks = {request(_name,_options,fn){const next=tail.then(()=>fn({name:_name}));tail=next.catch(()=>{});return next;}};
  return {data,storage,locks,clients:new Set(),nextClient:0};
}
function tab(f, locks=f.locks) {
  const events = {}, warning = {hidden:true,textContent:'original warning'}, document = {addEventListener(){},getElementById:id=>id==='storage-warning'?warning:null};
  const clientId='client-'+(++f.nextClient);
  const worker={state:'activated',postMessage(message,ports){if(message.type==='BOKI_STORAGE_CLIENTS')ports[0].postMessage({protocol:1,release:'test',requester:clientId,clients:[...f.clients]});}};
  const registration={active:worker,waiting:null,installing:null,addEventListener(){},async update(){return this;}};
  const serviceWorker={controller:worker,async getRegistration(){f.clients.add(clientId);return registration;},async register(){f.clients.add(clientId);return registration;},addEventListener(){}};
  let reloads=0;
  const root = {localStorage:f.storage,navigator:{locks,serviceWorker},location:{protocol:'file:',reload(){reloads++;}},QuestionData:questions,ProgressModel:Model,RPGModel:RPG,
    AppView:class{},validateSemanticQuestionData:()=>({}),addEventListener(name,fn){(events[name] ||= []).push(fn);},dispatchEvent(event){for(const fn of events[event.type]||[])fn(event);}};
  const sandbox = {window:root,document,navigator:root.navigator,location:root.location,console,URLSearchParams,queueMicrotask,Event,MessageChannel,setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync('js/controller.js','utf8'),sandbox);
  root.AppController.prototype.init=function(){};
  vm.runInNewContext(fs.readFileSync('js/app.js','utf8'),sandbox);
  return {app:root.App,root,warning,fire(name,event={}){if(name==='pagehide')f.clients.delete(clientId);for(const fn of events[name]||[])fn(event);},get reloads(){return reloads;}};
}
let passed=0,failed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
(async()=>{
  await test('another tab cannot recover the live journal between progress and reward writes',async()=>{
    const f=fixture(),a=tab(f),b=tab(f);await a.app.init();await tick();const c=a.app.controller;
    c.model.save();c.rpg.save();const set=f.storage.setItem;let started=false;
    f.storage.setItem=function(k,v){set.call(this,k,v);if(k===progressKey&&!started){started=true;b.app.init();}};
    assert(c.learningTransaction(()=>{assert(c.model.recordAttempt('Q',true,10,'',false,Date.now()));c.rpg.state.xp+=20;return true;}));
    await tick();assert.strictEqual(b.app.controller,undefined,'second tab must not load or restore a live journal');
    assert.strictEqual(JSON.parse(f.data[progressKey]).learningEffectiveness.questions.Q.observedAttempts,1);
    assert.strictEqual(JSON.parse(f.data[characterKey]).xp,20);assert(!f.data[progressKey+':pending-answer-v1']);
    a.fire('pagehide');await tick();assert.strictEqual(b.app.controller.model.learningEffectivenessForQuestion('Q').observedAttempts,1);
    assert.strictEqual(b.app.controller.rpg.state.xp,20);b.fire('pagehide');
  });
  await test('missing Web Locks never reads, restores or writes saved data',async()=>{
    const f=fixture(),a=tab(f,null);f.data[progressKey]='existing';await a.app.init();await tick();
    assert.strictEqual(a.app.controller,undefined);assert.strictEqual(f.storage.reads,0);assert.deepStrictEqual(f.data,{[progressKey]:'existing'});
    assert.strictEqual(a.warning.hidden,false);assert(a.warning.textContent.includes('ブラウザ'));
  });
  await test('a queued page closed before ownership cannot initialize later',async()=>{
    const f=fixture(),a=tab(f),b=tab(f);await a.app.init();await tick();b.app.init();b.fire('pagehide');a.fire('pagehide');await tick();
    assert.strictEqual(b.app.controller,undefined);
  });
  await test('pagehide revokes the old adapter before ownership moves and bfcache restore reloads',async()=>{
    const f=fixture(),a=tab(f),b=tab(f);await a.app.init();await tick();const old=a.app.controller;old.model.save();old.rpg.save();
    b.app.init();a.fire('pagehide');await tick();assert(b.app.controller);const bytes=JSON.stringify(f.data);
    assert.strictEqual(old.model.save(),false);assert.strictEqual(old.rpg.save(),false);
    assert.strictEqual(old.model.storage.removeItem(progressKey),false);assert.strictEqual(old.model.storage.restoreItem(progressKey,'{}'),false);
    assert.strictEqual(old.model.storage.readItem(progressKey).ok,false);assert.strictEqual(JSON.stringify(f.data),bytes);
    a.fire('pageshow',{persisted:true});assert.strictEqual(a.reloads,1);b.fire('pagehide');
  });
  await test('duplicate initialization keeps one controller and a rejected lock fails closed',async()=>{
    const f=fixture(),a=tab(f);await a.app.init();await tick();const c=a.app.controller;a.app.init();await tick();assert.strictEqual(a.app.controller,c);a.fire('pagehide');
    const broken=fixture(),b=tab(broken,{request(){return Promise.reject(Error('denied'));}});await b.app.init();await tick();
    assert.strictEqual(b.app.controller,undefined);assert.strictEqual(broken.storage.reads,0);assert.strictEqual(b.warning.hidden,false);
  });
  await test('offline registration failure is reported without rejecting the running learning session',async()=>{
    const f=fixture(),a=tab(f),notices=[];a.root.location.protocol='https:';
    a.root.navigator.serviceWorker={...a.root.navigator.serviceWorker,register:()=>Promise.reject(Error('registration unavailable'))};
    a.app.showToast=message=>notices.push(message);
    await a.app.init();await tick();
    assert(a.app.controller);assert.strictEqual(a.app.storageOwnership.active,true);
    assert.strictEqual(notices.length,1);assert(notices[0].includes('オフライン'));
    assert.strictEqual(a.app.controller.model.save(),true);a.fire('pagehide');
  });
  await test('corrupt startup journal shows the warning after event binding without touching either saved key',async()=>{
    const f=fixture(),a=tab(f);f.data[progressKey+':pending-answer-v1']='{bad';f.data[progressKey]='original progress';f.data[characterKey]='original character';
    const before=JSON.stringify(f.data);a.root.AppController.prototype.init=function(){a.root.addEventListener('boki-storage-error',()=>{a.warning.hidden=false;});};
    await a.app.init();await tick();
    try{assert.strictEqual(a.app.controller.model.storageWriteBlocked,true);assert.strictEqual(a.warning.hidden,false);assert.strictEqual(JSON.stringify(f.data),before);}
    finally{a.fire('pagehide');}
  });
  await test('an uncooperative prior-release client prevents all startup storage access until it closes',async()=>{
    const f=fixture(),a=tab(f);f.clients.add('legacy-without-web-lock');a.app.init();await tick();
    try{
      assert.strictEqual(a.app.controller,undefined);assert.strictEqual(f.storage.reads,0);
      for(let i=0;i<100&&a.app.storageClientStatus!=='waiting';i++)await new Promise(resolve=>setTimeout(resolve,10));
      assert.strictEqual(a.app.storageClientStatus,'waiting');assert.strictEqual(a.warning.hidden,false);
      f.clients.delete('legacy-without-web-lock');await a.app.ready;assert(a.app.controller);assert.strictEqual(a.app.storageOwnership.active,true);
    }finally{f.clients.delete('legacy-without-web-lock');a.fire('pagehide');}
  });
  await test('a missing coordinator that cannot be installed does not guess that no legacy tab exists',async()=>{
    const f=fixture(),a=tab(f);f.data[progressKey]='original';
    a.root.navigator.serviceWorker={async getRegistration(){return undefined;},async register(){throw Error('cannot install coordinator');}};
    await a.app.init();await tick();
    try{assert.strictEqual(a.app.controller,undefined);assert.strictEqual(f.storage.reads,0);assert.deepStrictEqual(f.data,{[progressKey]:'original'});assert.strictEqual(a.warning.hidden,false);}
    finally{a.fire('pagehide');}
  });
  console.log(`STORAGE_OWNERSHIP ${passed}/${passed+failed} PASS; ${failed} FAIL`);if(failed)process.exitCode=1;
})();
