'use strict';
// Real same-page manual update. Observers do not change worker/reload/ownership decisions.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const cp = require('child_process');
const { chromium, webkit } = require('playwright');
const ROOT = path.resolve(process.env.PWA_ROOT || process.cwd());
const OUT = path.resolve(process.env.PWA_OUTPUT || path.join(ROOT, 'artifacts/release214-update'));
const BASE = '7294be99639c31db2e887c634c71578975c985f8';
const NEW_SHA = 'd4a5a7391d36e4e0771f14a1310c9ac172945b96';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const blob = bytes => crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const git = args => cp.execFileSync('git', args, { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
const evidence={status:'RUNNING',oldSHA:BASE,newSHA:NEW_SHA,head:git(['rev-parse','HEAD']).toString().trim(),playwright:require('playwright/package.json').version,node:process.version,reports:[],limitations:['Synthetic isolated same-origin browser evidence, not live HTTPS or physical devices.','Ordinary inputs autosave; coaching inputs are session-only. Save failures require manual transcription before update.','No product behavior, lifecycle or scoring is stubbed. Server returns only new bytes after cutover, even for old query strings.']};
fs.mkdirSync(OUT,{recursive:true});
const write = () => fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'boki-pwa-manual-'));
function snapshot(label, revision) {
  const read = relative => revision ? git(['show',`${revision}:${relative}`]) : fs.readFileSync(path.join(ROOT,relative));
  const manifest = JSON.parse(read('pwa-release-manifest.json'));
  const files = [...new Set(['index.html','service-worker.js','manifest.webmanifest','icons/app-icon.svg','pwa-release-manifest.json',...Object.keys(manifest.assets),...Object.keys(manifest.pages||{})])];
  const target = path.join(temp,label), hashes = {};
  for (const relative of files) {
    const bytes = read(relative), local = path.join(target,relative);
    fs.mkdirSync(path.dirname(local),{recursive:true}); fs.writeFileSync(local,bytes);
    const gitBlob = blob(bytes);
    if (revision) assert.strictEqual(gitBlob,git(['rev-parse',`${revision}:${relative}`]).toString().trim(),`exact historical blob ${relative}`);
    if (manifest.assets[relative]) assert.strictEqual(sha(bytes),manifest.assets[relative],`manifest ${label}/${relative}`);
    if (manifest.pages?.[relative]) assert.strictEqual(sha(bytes),manifest.pages[relative],`manifest page ${label}/${relative}`);
    hashes[relative] = { sha256:sha(bytes), gitBlob };
  }
  const index = fs.readFileSync(path.join(target,'index.html'),'utf8');
  const worker = fs.readFileSync(path.join(target,'service-worker.js'),'utf8');
  assert.strictEqual(index.match(/js\/app\.js\?v=([^"']+)/)[1],manifest.release);
  assert.strictEqual(worker.match(/const RELEASE = '([^']+)'/)[1],manifest.release);
  for (const match of index.matchAll(/(?:src|href)="([^"?#]+)\?v=([^"#]+)"/g)) {
    assert.strictEqual(match[2],manifest.release,'all versioned shell URLs coherent');
    assert(hashes[match[1].replace(/^\.\//,'')],`shell URL has validated file: ${match[1]}`);
  }
  return { target, release:manifest.release, hashes, revision };
}
// This function runs in each new document, before product JS, and only observes.
function installObservers() {
  const doc = `${Date.now()}:${performance.timeOrigin}`;
  const emit = (event,data={}) => console.debug('PWA_OBSERVE:'+JSON.stringify({event,doc,at:Date.now(),monotonic:performance.now(),...data}));
  const ids = new WeakMap(); let next = 0; const id = object => { if (!object) return null; if (!ids.has(object)) ids.set(object,++next); return ids.get(object); };
  const sw = worker => worker ? {id:id(worker),scriptURL:worker.scriptURL,state:worker.state} : null;
  const watched = new WeakSet(); let previous = '';
  const watch = worker => { if(worker && !watched.has(worker)) { watched.add(worker); emit('worker-observed',sw(worker)); worker.addEventListener('statechange',()=>emit('worker-state',sw(worker))); } };
  emit('document-created');
  for (const event of ['pageshow','pagehide','load']) addEventListener(event,e=>emit(event,{persisted:e.persisted,ownership:window.App?.storageOwnership}));
  document.addEventListener('DOMContentLoaded',()=>emit('DOMContentLoaded',{app:!!window.App,controller:!!window.App?.controller}));
  navigator.serviceWorker.addEventListener('controllerchange',()=>emit('controllerchange',{controller:sw(navigator.serviceWorker.controller)}));
  navigator.serviceWorker.ready.then(r=>emit('ready-resolved',{active:sw(r.active),sameController:r.active===navigator.serviceWorker.controller}));
  // Forward all arguments unchanged; no synthetic activation or lifecycle events.
  const post = ServiceWorker.prototype.postMessage;
  ServiceWorker.prototype.postMessage = function(...args) { emit('worker-message',{worker:sw(this),type:args[0]?.type}); return Reflect.apply(post,this,args); };
  if(navigator.locks) {
    const request = navigator.locks.request;
    navigator.locks.request = function(...args) {
      const cbIndex = args.length - 1, callback = args[cbIndex];
      emit('lock-request',{name:args[0],options:typeof args[1]==='object'?args[1]:null});
      if(typeof callback === 'function') args[cbIndex] = function(lock) {
        emit('lock-acquired',{name:lock?.name || null,mode:lock?.mode || null});
        let result; try { result = Reflect.apply(callback,this,arguments); } catch(error) { emit('lock-release',{error:String(error)}); throw error; }
        return Promise.resolve(result).then(value=>{emit('lock-release',{name:lock?.name});return value;},error=>{emit('lock-release',{name:lock?.name,error:String(error)});throw error;});
      };
      return Reflect.apply(request,this,args);
    };
  }
  const inspect = async () => {
    try {
      const r = await navigator.serviceWorker.getRegistration();
      if(r&&!watched.has(r)) { watched.add(r); r.addEventListener('updatefound',()=>{emit('updatefound',{registration:id(r),installing:sw(r.installing)});watch(r.installing);}); }
      for(const worker of [r?.installing,r?.waiting,r?.active,navigator.serviceWorker.controller]) watch(worker);
      const state = {registration:id(r),installing:sw(r?.installing),waiting:sw(r?.waiting),active:sw(r?.active),controller:sw(navigator.serviceWorker.controller),sameController:!!r&&r.active===navigator.serviceWorker.controller,
        app:!!window.App,appController:!!window.App?.controller,status:window.App?.storageClientStatus,ownership:window.App?.storageOwnership,
        shell:document.querySelector('script[src*="js/app.js"]')?.src};
      const value=JSON.stringify(state); if(value!==previous) {previous=value;emit('state',state);}
    } catch(error) {emit('observer-error',{error:String(error)});}
  };
  inspect(); setInterval(inspect,250);
}
async function capture(page) {
  return page.evaluate(async()=>{
    const r = await navigator.serviceWorker.getRegistration(), sw = w=>w?{scriptURL:w.scriptURL,state:w.state}:null;
    const local = {}; for(const key of Object.keys(localStorage).sort()) local[key]=localStorage.getItem(key);
    const cacheRecords = [];
    for(const key of await caches.keys()) {
      const cache=await caches.open(key), entries=[];
      for(const req of await cache.keys()) { const bytes=await(await cache.match(req)).arrayBuffer();entries.push({url:req.url,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')}); }
      cacheRecords.push({key,entries});
    }
    const c=window.App?.controller;
    return {shell:document.querySelector('script[src*="js/app.js"]')?.src,app:!!window.App,appController:!!c,status:window.App?.storageClientStatus,ownership:window.App?.storageOwnership,
      worker:{installing:sw(r?.installing),waiting:sw(r?.waiting),active:sw(r?.active),controller:sw(navigator.serviceWorker.controller),sameController:r?.active===navigator.serviceWorker.controller},local,caches:cacheRecords,
      model:c?JSON.parse(JSON.stringify(c.model.state)):null,character:c?JSON.parse(JSON.stringify(c.rpg.state)):null};
  });
}
async function proof(page) {
  return page.evaluate(async()=>{
    const r=await navigator.serviceWorker.getRegistration(),w=r?.active||navigator.serviceWorker.controller;
    if(!w)return {error:'no-worker'};
    return new Promise(resolve=>{const ch=new MessageChannel(),timer=setTimeout(()=>{ch.port1.close();resolve({error:'proof-timeout',state:w.state});},2000);
      ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve({state:w.state,data:e.data});};w.postMessage({type:'BOKI_STORAGE_CLIENTS'},[ch.port2]);});
  });
}
async function idb(page) {return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('boki-independent-transfer',1);r.onupgradeneeded=()=>{r.transaction.abort();reject(Error('missing Form A DB'));};r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,t=db.transaction('assessment','readonly'),q=t.objectStore('assessment').get('voucher-transfer-l050');t.oncomplete=()=>{resolve(q.result);db.close();};};}));}
async function app(page){await page.waitForFunction(()=>Boolean(window.App?.controller)&&App.storageOwnership.active,null,{timeout:45000});}
async function dismiss(page){if(await page.locator('#app-notice-dialog').isVisible())await page.locator('#app-notice-confirm').click();}
const formRows=[{id:'C',voucher:'入金伝票',amount:'18000'},{id:'A',voucher:'振替伝票',amount:'42000'},{id:'D',voucher:'振替伝票',amount:'6000'},{id:'B',voucher:'出金伝票',amount:'18000'}];
async function fillForm(page,rows){for(const r of rows){await page.locator('#voucher-'+r.id).selectOption(r.voucher);await page.locator('#amount-'+r.id).fill(r.amount);}for(let n=0;n<100;n++){const s=await idb(page);if(rows.every(r=>s.attempts.at(-1).draft.some(x=>x.id===r.id&&x.amount===r.amount&&x.voucher===r.voucher)))return;await page.waitForTimeout(100);}throw Error('Form A durable input mismatch');}
function semantic(s){const p=structuredClone(s.model);delete p.mode;delete p.currentQuestionId;return{learning:p,character:s.character};}
function retained(a,b){assert.deepStrictEqual(semantic(b),semantic(a),'all learning meaning/time/attempt/reward fields retained');}
async function cacheProof(page,source,base){const s=await capture(page),c=s.caches.find(x=>x.key==='boki-rpg-'+source.release);assert(c);assert.deepStrictEqual(s.caches.filter(x=>x.key.startsWith('boki-rpg-')).map(x=>x.key),['boki-rpg-'+source.release]);const regs=await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope));assert.deepStrictEqual(regs,[base]);for(const [file,hash]of Object.entries(source.hashes)){if(['service-worker.js','pwa-release-manifest.json'].includes(file))continue;const entry=c.entries.find(e=>new URL(e.url).pathname===new URL(file,base).pathname&&(!new URL(e.url).searchParams.has('v')||new URL(e.url).searchParams.get('v')===source.release));assert(entry,file);assert.strictEqual(entry.sha256,hash.sha256,file);}return{cache:c.key,entries:c.entries.length};}
async function scenario(engine,launcher,multi,oldSource,newSource){
 const r={engine,scenario:multi?'multiple-old-tabs':'normal',checks:[],timeline:[],errors:[],status:'RUNNING'};evidence.reports.push(r);write();let browser,context,page,oldTab,form,current=false,port;
 const record=(event,data={})=>r.timeline.push({at:Date.now(),event,...data});
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),prefix='/boki-rpg-app/';if(!u.pathname.startsWith(prefix)){res.writeHead(404);return res.end();}const file=u.pathname.slice(prefix.length)||'index.html',s=current?newSource:oldSource;
  if(!s.hashes[file]){res.writeHead(404);return res.end();}const bytes=fs.readFileSync(path.join(s.target,file));record('http',{url:req.url,release:s.release,sha256:sha(bytes)});res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});
 const listen=async()=>{await new Promise(resolve=>server.listen(port||0,'127.0.0.1',resolve));port=server.address().port;};
 const stop=async()=>{if(!server.listening)return;const done=new Promise(resolve=>server.close(resolve));server.closeAllConnections();await done;};
 const check=async(name,fn)=>{try{const result=await fn();r.checks.push({name,status:'PASS',result});write();console.log(engine,r.scenario,name,'PASS');return result;}catch(e){r.checks.push({name,status:'FAIL',error:e.stack});throw e;}};
 try{
  await listen();const base=`http://127.0.0.1:${port}/boki-rpg-app/`,route=base+'?mode=training&question=T001';r.origin=base;
  browser=await launcher.launch();r.browserVersion=browser.version();context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});page=await context.newPage();await page.addInitScript(installObservers);
  page.on('console',m=>{if(m.text().startsWith('PWA_OBSERVE:'))record('sw',JSON.parse(m.text().slice(12)));});page.on('pageerror',e=>r.errors.push(String(e)));page.on('response',res=>{if(res.request().isNavigationRequest())record('navigation-response',{url:res.url(),fromSW:res.fromServiceWorker(),status:res.status()});});
  await check('213-control-and-form-first-retake',async()=>{
   await page.goto(base);await app(page);await page.waitForFunction(()=>navigator.serviceWorker.controller);assert.strictEqual((await proof(page)).data.release,oldSource.release);
   await page.goto(base+'form-a.html');await page.locator('#start').click();await page.locator('#exercise').waitFor({state:'visible'});await fillForm(page,formRows);await page.locator('#submit').click();await page.locator('#result').waitFor({state:'visible'});const first=await idb(page);assert.strictEqual(first.firstSubmission.result.earned,4);assert.strictEqual(first.firstSubmission.result.classificationCorrect,4);assert.strictEqual(first.firstSubmission.result.amountCorrect,4);
   await page.locator('#retry').click();await page.locator('#exercise').waitFor({state:'visible'});await fillForm(page,[{id:'C',voucher:'入金伝票',amount:'17000'}]);r.formBefore=await idb(page);assert.strictEqual(r.formBefore.attempts.length,2);assert.deepStrictEqual(r.formBefore.firstSubmission,first.firstSubmission);await page.goto(route);await app(page);return{worker:oldSource.release,first:4,retake:'issued',identity:r.formBefore.spec};
  });
  await check('213-history-retry-journal-table-autosave',async()=>{
   await page.evaluate(()=>{const c=App.controller;c.skipPlacement();c.showMode('story');c.start('J001');c.view.applyRetryDraft(c.questions.J001,{debit:[{account:'現金',amount:3000000}],credit:[{account:'資本金',amount:3000000}]});c.submit();c.showMode('training');c.start('J003');c.view.applyRetryDraft(c.questions.J003,{debit:[{account:'当座預金',amount:500001}],credit:[{account:'普通預金',amount:500000}]});c.submit();c.beginCoachingRetry();c.view.applyRetryDraft(c.questions.J003,{debit:[{account:'当座預金',amount:500000}],credit:[{account:'普通預金',amount:500000}]});c.submit();c.start('J004');});
   await page.locator('.journal-row select').first().selectOption('仕入');await page.locator('.amount-input').first().fill('1234');await page.locator('[data-action="save"]').click();assert.strictEqual(await page.locator('#save-status').textContent(),'入力内容を保存しました。');
   r.journalInput=await page.evaluate(()=>App.controller.view.readAnswer(QuestionData.J004));await page.evaluate(()=>App.controller.start('T001'));await page.locator('.amount-input').first().fill('1000000');await page.locator('[data-action="save"]').click();assert.strictEqual(await page.locator('#save-status').textContent(),'入力内容を保存しました。');r.tableInput=await page.evaluate(()=>App.controller.view.readAnswer(QuestionData.T001));r.before=await capture(page);
   assert(r.before.model.correctIds.includes('J001'));assert(r.before.model.incorrectIds.includes('J003'));assert(r.before.model.reviewSchedule.J003);assert(r.before.character.rewardedIds.includes('J001'));assert(!r.before.character.rewardedIds.includes('J003'));assert(!r.before.model.answeredIds.includes('J004'));assert(!r.before.model.answeredIds.includes('T001'));return {correct:'J001',wrong:'J003',xp:r.before.character.xp,drafts:['J004','T001'],retry:r.before.model.questionStats.J003};
  });
  if(multi){oldTab=await context.newPage();await oldTab.goto(base);await oldTab.waitForFunction(()=>window.App?.storageOwnership);assert.strictEqual(await oldTab.evaluate(()=>!!App.controller),false);form=await context.newPage();await form.goto(base+'form-a.html');await form.locator('#exercise').waitFor({state:'visible'});r.formTimeOrigin=await form.evaluate(()=>performance.timeOrigin);}
  await check('real-updatefound-installing-waiting-no-auto-reload',async()=>{
   current=true;await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting);await page.locator('#app-toast-action').waitFor({state:'visible'});r.waiting=await capture(page);assert(r.waiting.shell.includes(oldSource.release));retained(r.before,r.waiting);assert.deepStrictEqual(await idb(page),r.formBefore);assert(r.timeline.some(x=>x.event==='updatefound'));assert(r.timeline.some(x=>x.event==='worker-state'&&x.state==='installed'));return{controller:(await proof(page)).data.release,waiting:r.waiting.worker.waiting,formUnchanged:true};
  });
  await check('user-update-and-old-tab-write-boundary',async()=>{
   await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),page.locator('#app-toast-action').click()]);
   if(multi){await page.waitForFunction(()=>window.App?.storageClientStatus==='waiting');const blocked=await capture(page);assert(!blocked.appController&&!blocked.ownership.active);assert.deepStrictEqual(blocked.local,r.before.local);assert.strictEqual(await form.evaluate(()=>performance.timeOrigin),r.formTimeOrigin);assert.strictEqual(await form.locator('#amount-C').inputValue(),'17000');assert.deepStrictEqual(await idb(form),r.formBefore);r.oldTabProof=await proof(page);assert.strictEqual(r.oldTabProof.data.clients.length,3);assert.strictEqual(await oldTab.evaluate(()=>!!App.controller),false);await oldTab.close();await form.close();}
   await app(page);r.after=await capture(page);assert(r.after.shell.includes(newSource.release));assert.strictEqual((await proof(page)).data.release,newSource.release);assert(r.timeline.some(x=>x.event==='controllerchange'));assert(r.timeline.some(x=>x.event==='worker-message'&&x.type==='SKIP_WAITING'));return{newWorker:newSource.release,otherTabs:multi?2:0,noSecondWriter:true};
  });
  await check('semantic-history-rpg-form-identity-preserved',async()=>{retained(r.before,r.after);assert.deepStrictEqual(await idb(page),r.formBefore);assert.deepStrictEqual(r.after.model.drafts.J004,r.journalInput);assert.deepStrictEqual(r.after.model.drafts.T001,r.tableInput);return{allLearningFields:true,entireRPG:true,formFirstAndRetake:true,rawStorageAlsoEqual:JSON.stringify(r.before.local)===JSON.stringify(r.after.local)};});
  await check('214-cache-and-no-asset-mixture',async()=>{const cache=await cacheProof(page,newSource,base);for(const u of await page.locator('script[src]').evaluateAll(ns=>ns.map(n=>n.src))){assert(u.includes('?v='+newSource.release));const file=new URL(u).pathname.slice('/boki-rpg-app/'.length);const digest=await page.evaluate(async u=>{const b=await(await fetch(u)).arrayBuffer();return[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');},u);assert.strictEqual(digest,newSource.hashes[file].sha256);}return cache;});
  await check('draft-dom-id-no-submit-and-new-result-ux',async()=>{
   await dismiss(page);await page.evaluate(()=>App.controller.start('T001'));assert.deepStrictEqual(await page.evaluate(()=>App.controller.view.readAnswer(QuestionData.T001)),r.tableInput);await page.evaluate(()=>App.controller.start('J004'));assert.deepStrictEqual(await page.evaluate(()=>App.controller.view.readAnswer(QuestionData.J004)),r.journalInput);
   assert.strictEqual(await page.evaluate(()=>App.controller.model.state.answeredIds.includes('T001')||App.controller.model.state.answeredIds.includes('J004')),false);
   // Submit the preserved wrong T001 and correct it using the existing coached retry.
   await page.evaluate(()=>{const c=App.controller;c.start('T001');c.submit();});await page.locator('#result-error-summary').waitFor({state:'visible'});const differences=await page.locator('#result-error-summary').innerText();assert(differences.includes('1,024,000'));assert(differences.includes('1,000,000'));assert.strictEqual(await page.locator('#result-learning-summary').count(),0);assert.strictEqual(await page.locator('#story-learning-summary').count(),1);const explanation=await page.locator('#explanation').innerText();assert(/410,000/.test(explanation)&&/289,000/.test(explanation));const first=await capture(page);
   await page.locator('[data-action="coaching-retry-result"]').click();
   // Correct field IDs come from the stored question schema, amounts independently 1,024,000 each.
   await page.evaluate(()=>{const c=App.controller,keys=Object.keys(c.questions.T001.answer.cells);c.view.applyRetryDraft(c.questions.T001,{cells:Object.fromEntries(keys.map(k=>[k,1024000]))});c.submit();});assert.strictEqual(await page.evaluate(()=>App.controller.learningFlow.authoritativeScore.correct),false,'coached success must not rewrite first authoritative wrong grade');assert.strictEqual(await page.evaluate(()=>App.controller.learningFlow.phase),'D','coached correction completed');const retried=await capture(page);for(const k of ['firstAttempt','observedAttempts','correctCount','incorrectCount'])assert.deepStrictEqual(retried.model.learningEffectiveness.questions.T001[k],first.model.learningEffectiveness.questions.T001[k],k+' protected');assert.deepStrictEqual(retried.character,first.character);assert.deepStrictEqual(retried.model.attempts,first.model.attempts);assert.deepStrictEqual(retried.model.reviewSchedule,first.model.reviewSchedule);assert.deepStrictEqual(await idb(page),r.formBefore);return{differences,firstWrongRetained:true,rewardNotDuplicated:true};
  });
  await check('offline-real-origin-stop-save-and-resume',async()=>{
   await page.evaluate(()=>App.controller.start('J004'));const before=await capture(page);await stop();let code;try{await fetch(base);}catch(e){code=e.cause?.code;}assert.strictEqual(code,'ECONNREFUSED');const offlineNavigation=await page.goto(base+'?mode=training&question=J004');assert(offlineNavigation.fromServiceWorker(),'offline document supplied by Service Worker');await app(page);assert.deepStrictEqual(await page.evaluate(()=>App.controller.view.readAnswer(QuestionData.J004)),r.journalInput);retained(before,await capture(page));await page.locator('.amount-input').first().fill('5678');await page.locator('[data-action="save"]').click();assert.strictEqual(await page.locator('#save-status').textContent(),'入力内容を保存しました。');r.offline=await capture(page);const offlineReload=await page.reload();assert(offlineReload.fromServiceWorker(),'offline reload supplied by Service Worker');await app(page);retained(r.offline,await capture(page));assert.strictEqual(Number((await page.locator('.amount-input').first().inputValue()).replaceAll(',','')),5678);return{networkFailure:code,saved:5678,cache:await cacheProof(page,newSource,base)};
  });
  await check('offline-form-retake-first-result-preserved',async()=>{
   const offlineFormNavigation=await page.goto(base+'form-a.html?resume=offline');assert(offlineFormNavigation.fromServiceWorker());await page.locator('#exercise').waitFor({state:'visible'});assert.deepStrictEqual(await idb(page),r.formBefore);await fillForm(page,formRows.map(x=>x.id==='C'?{...x,amount:'17000'}:x));await page.locator('#submit').click();await page.locator('#result').waitFor({state:'visible'});const s=await idb(page);assert.deepStrictEqual(s.firstSubmission,r.formBefore.firstSubmission);assert.strictEqual(s.attempts[1].receipt.result.earned,3);assert.strictEqual(s.attempts[1].receipt.result.classificationCorrect,4);assert.strictEqual(s.attempts[1].receipt.result.amountCorrect,3);r.formAfter=s;await page.goto(base+'?mode=training&question=J004');await app(page);retained(r.offline,await capture(page));return{first:4,retake:3,classification:4,amount:3,firstUnchanged:true};
  });
  await check('online-return-no-loop-history-stable',async()=>{
   const before=await capture(page);await listen();const response=await fetch(base+'js/app.js?probe='+Date.now());assert(response.ok);assert.strictEqual(sha(Buffer.from(await response.arrayBuffer())),newSource.hashes['js/app.js'].sha256);await page.reload();await app(page);retained(before,await capture(page));assert.deepStrictEqual(await idb(page),r.formAfter);assert.strictEqual((await proof(page)).data.release,newSource.release);const timeOrigin=await page.evaluate(()=>performance.timeOrigin);await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});for(let n=0;n<8;n++){await page.waitForTimeout(250);assert.strictEqual(await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return !!(r.waiting||r.installing);}),false);assert.strictEqual(await page.evaluate(()=>performance.timeOrigin),timeOrigin);assert.strictEqual((await proof(page)).data.release,newSource.release);}assert.deepStrictEqual(r.errors,[]);return{uncachedNetwork:true,waiting:false,errors:r.errors};
  });
  r.status='PASS';
 }catch(e){r.status='FAIL';r.error=e.stack;console.error(engine,r.scenario,e.stack);if(page)try{r.failure=await capture(page);}catch(_){} }
 finally{write();fs.writeFileSync(path.join(OUT,engine+'-'+r.scenario+'.json'),JSON.stringify(r,null,2));await context?.close();await browser?.close();await stop();}
}
(async()=>{try{const oldSource=snapshot('213',BASE),newSource=snapshot('214',NEW_SHA);assert.strictEqual(oldSource.release,'20260924-213');assert.strictEqual(newSource.release,'20261014-214');evidence.sources={old:oldSource,new:newSource};
for(const file of ['data/questions.js','data/accounting-oracle.js','js/engine.js','js/model.js','js/rpg.js','js/app.js','data/form-a.json','js/form-a-store.js','js/form-a-scoring.js','js/form-a.js'])assert.deepStrictEqual(oldSource.hashes[file],newSource.hashes[file],file+' protected bytes');
for(const [engine,launcher]of Object.entries({chromium,webkit}))for(const multi of [false,true])await scenario(engine,launcher,multi,oldSource,newSource);
evidence.status=evidence.reports.every(r=>r.status==='PASS')?'PASS':'FAIL';}catch(e){evidence.status='FAIL';evidence.error=e.stack;}finally{write();fs.rmSync(temp,{recursive:true,force:true});}
console.log('UPDATE214_SUMMARY '+JSON.stringify({status:evidence.status,reports:evidence.reports.map(({engine,scenario,status,checks,error})=>({engine,scenario,status,checks:checks.map(({name,status})=>({name,status})),error}))}));process.exitCode=evidence.status==='PASS'?0:1;})();
