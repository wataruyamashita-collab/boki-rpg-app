'use strict';
const assert=require('assert'),fs=require('fs'),http=require('http'),path=require('path'),cp=require('child_process');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'artifacts/storage-upgrade');
const BASE='81088e2ad3bc96a6ff5bd995e6dfcfb58a4fd62f',legacyFiles=new Map();
let legacy=true;
const evidence={status:'RUNNING',head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),legacyHead:BASE,reports:[]};
const write=()=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const relative=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  try{
    if(legacy&&!legacyFiles.has(relative))legacyFiles.set(relative,cp.execFileSync('git',['show',BASE+':'+relative],{cwd:ROOT}));
    res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('cache-control','no-store');
    res.end(legacy?legacyFiles.get(relative):fs.readFileSync(file));
  }catch(error){res.writeHead(500);res.end(String(error));}
});
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const [engine,launcher] of Object.entries({chromium,webkit})){
      const browser=await launcher.launch();
      try{
        const context=await browser.newContext({viewport:{width:390,height:844}}),old=await context.newPage(),errors=[];
        try{
          old.on('pageerror',error=>errors.push(String(error)));legacy=true;
          await old.goto(url,{waitUntil:'load'});await old.waitForFunction(()=>Boolean(window.App?.controller));
          await old.evaluate(()=>navigator.serviceWorker.ready);await old.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
          const partial=await old.evaluate(()=>{
            const c=window.App.controller;c.skipPlacement();c.model.state.mode='training';c.start('J001',{fresh:true});c.view.applyRetryDraft(c.questions.J001,c.questions.J001.answer);c.model.save();c.rpg.save();
            const set=Storage.prototype.setItem;
            Storage.prototype.setItem=function(key,value){if(key===c.rpg.key){window.pendingOldCharacter=value;return;}return set.call(this,key,value);};
            try{c.submit();}finally{Storage.prototype.setItem=set;}
            return {progress:localStorage.getItem(c.model.key),character:localStorage.getItem(c.rpg.key),finalCharacter:window.pendingOldCharacter,
              stats:c.model.state.questionStats.J001,release:document.querySelector('script[src*="js/app.js"]').getAttribute('src'),lockHeld:Boolean(window.App.storageOwnership)};
          });
          assert(partial.release.includes('20260924-179'));assert.strictEqual(partial.lockHeld,false);
          assert(partial.finalCharacter&&partial.character!==partial.finalCharacter,'real old progress/RPG save gap must exist');
          legacy=false;const current=await context.newPage();current.on('pageerror',error=>errors.push(String(error)));
          await current.goto(url+'?upgrade=1',{waitUntil:'load'});
          const early=await current.evaluate(()=>({initialized:Boolean(window.App?.controller),progress:localStorage.getItem('boki-rpg-progress-v2'),character:localStorage.getItem('boki-rpg-character-v1')}));
          console.log(JSON.stringify({engine,oldRelease:partial.release,newInitializedDuringOldWrite:early.initialized,oldProgressChanged:early.progress!==partial.progress}));
          assert.strictEqual(early.initialized,false,'new release must not initialize while the prior release can write');
          await current.waitForFunction(()=>window.App?.storageClientStatus==='waiting');
          const waiting=await current.evaluate(()=>({initialized:Boolean(window.App.controller),progress:localStorage.getItem('boki-rpg-progress-v2'),character:localStorage.getItem('boki-rpg-character-v1')}));
          assert.strictEqual(waiting.initialized,false);assert.strictEqual(waiting.progress,partial.progress);assert.strictEqual(waiting.character,partial.character);
          await old.evaluate(()=>localStorage.setItem(window.App.controller.rpg.key,window.pendingOldCharacter));await old.close();
          await current.waitForFunction(()=>Boolean(window.App?.controller));
          const migrated=await current.evaluate(()=>{const c=window.App.controller;return {stats:c.model.state.questionStats.J001,character:c.rpg.state,metric:c.model.learningEffectivenessForQuestion('J001')};});
          assert.deepStrictEqual(migrated.stats,partial.stats);assert.deepStrictEqual(migrated.character,JSON.parse(partial.finalCharacter));
          assert.strictEqual(migrated.metric.initialStatus,'unknown');assert.strictEqual(migrated.metric.firstAttempt,null);
          await current.evaluate(()=>{const c=window.App.controller;c.model.state.mode='training';c.start('J002',{fresh:true});c.view.applyRetryDraft(c.questions.J002,c.questions.J002.answer);c.submit();});
          const saved=await current.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J002'),character:c.rpg.state};});assert.strictEqual(saved.metric.observedAttempts,1);
          // Remove the real origin, including existing connections. This tests
          // cache fallback without relying on a browser-driver offline flag.
          const port=server.address().port,stopped=new Promise(resolve=>server.close(resolve));server.closeAllConnections();await stopped;
          let networkFailure=null;try{await fetch(url);}catch(error){networkFailure=error.cause?.code;}
          assert.strictEqual(networkFailure,'ECONNREFUSED','the origin must actually be unreachable');
          await current.reload({waitUntil:'load'});await current.waitForFunction(()=>Boolean(window.App?.controller));
          const offline=await current.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J002'),character:c.rpg.state};});
          assert.deepStrictEqual(offline,saved);assert.deepStrictEqual(errors,[]);
          await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
          evidence.reports.push({engine,priorRelease:'20260924-179',partialWriteProtected:true,legacyStatsPreserved:true,rewardsPreserved:true,firstRemainsUnknown:true,networkUnavailableReload:true,networkFailure,browserOfflineFlagUsed:false,pageErrors:errors});write();
        }finally{await context.close();}
      }finally{await browser.close();}
    }
    assert.strictEqual(evidence.reports.length,2);evidence.status='PASS';write();console.log('STORAGE_UPGRADE_BROWSER 2/2 PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.stack;write();throw error;}
  finally{if(server.listening)await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
