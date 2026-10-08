'use strict';
const assert=require('assert'),fs=require('fs'),http=require('http'),path=require('path'),cp=require('child_process');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUTPUT=path.join(ROOT,'artifacts/learning-effectiveness');
const evidence={status:'RUNNING',head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reports:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const [engine,launcher] of Object.entries({chromium,webkit})){
      const browser=await launcher.launch();
      try{
        for(const width of [320,390,768]){
          const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
          page.on('pageerror',error=>errors.push(error.stack||String(error)));
          try{
            await page.goto(url,{waitUntil:'load'});
            await page.evaluate(()=>{const c=window.App.controller;c.skipPlacement();c.model.state.mode='training';c.start('J001',{fresh:true});});
            // Submit a real blank form; coaching corrects it without changing the
            // first score, mastery, or reward ledger.
            await page.click('#question-form .confirm-button');
            const wrong=await page.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J001'),rpg:c.rpg.state,stats:c.model.state.questionStats.J001};});
            assert.strictEqual(wrong.metric.firstAttempt.correct,false);assert.strictEqual(wrong.metric.firstAttempt.mode,'training');
            await page.click('[data-action="coaching-retry-result"]');
            await page.evaluate(()=>{const c=window.App.controller;c.view.applyRetryDraft(c.questions.J001,c.questions.J001.answer);});
            await page.click('#question-form .confirm-button');
            const coached=await page.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J001'),rpg:c.rpg.state,stats:c.model.state.questionStats.J001};});
            assert.deepStrictEqual(coached.rpg,wrong.rpg);assert.deepStrictEqual(coached.stats,wrong.stats);
            assert.strictEqual(coached.metric.misconceptionStats['journal-entry'].assistedRecoveredCount,1);
            assert.strictEqual(coached.metric.misconceptionStats['journal-entry'].recoveredCount,0);
            await page.evaluate(()=>{const c=window.App.controller;c.model.state.mode='story';c.start('J001',{fresh:true});c.view.applyRetryDraft(c.questions.J001,c.questions.J001.answer);});
            await page.click('#question-form .confirm-button');
            const current=await page.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J001'),rpg:c.rpg.state};});
            assert.strictEqual(current.metric.observedAttempts,2);assert.strictEqual(current.metric.misconceptionStats['journal-entry'].recoveredCount,1);
            assert(current.rpg.xp>wrong.rpg.xp);
            const beforeReload=await page.evaluate(()=>{
              const c=window.App.controller,m=c.model,now=Date.now();
              for(let i=0;i<220;i++){
                m.state.mode='review';m.state.reviewSchedule.J001={stage:i%4,dueAt:now+i};m.assignReview('J001','J001',now+i-1);
                if(!m.recordAttempt('J001',i%3!==0,10,'journal-entry',i%3!==0,now+i,i%4,'unsure',
                  {mode:'review',support:'none',observationNumber:m.nextLearningObservation('J001'),reviewSourceId:'J001'}))throw Error('durability record '+i);
                m.completeReview('J001',i%3!==0,now+i,'J001');
              }
              m.state.mode='desk';m.save();return {metric:m.learningEffectivenessForQuestion('J001'),rows:m.state.attempts.length,character:localStorage.getItem(c.rpg.key)};
            });
            assert.strictEqual(beforeReload.rows,200);assert.strictEqual(beforeReload.metric.observedAttempts,222);
            assert.strictEqual(beforeReload.metric.delayedReview.attempts,220);assert.strictEqual(beforeReload.metric.delayedReview.successes,146);
            assert.strictEqual(beforeReload.metric.delayedReview.highestConfirmedStage,4);assert.deepStrictEqual(beforeReload.metric.firstAttempt,wrong.metric.firstAttempt);
            await page.reload({waitUntil:'load'});
            const persisted=await page.evaluate(()=>{const c=window.App.controller;return {metric:c.model.learningEffectivenessForQuestion('J001'),rows:c.model.state.attempts.length,character:localStorage.getItem(c.rpg.key),valid:window.ProgressModel.validateBackupState(c.model.state,c.questions)};});
            assert(persisted.valid);assert.deepStrictEqual(persisted.metric,beforeReload.metric);assert.strictEqual(persisted.character,beforeReload.character);
            await page.evaluate(()=>{
              const c=window.App.controller,progress=JSON.parse(JSON.stringify(c.model.state)),character=JSON.parse(JSON.stringify(c.rpg.state));
              const legacyInput=JSON.parse(JSON.stringify(progress));delete legacyInput.learningEffectiveness;
              for(const row of legacyInput.attempts){delete row.mode;delete row.support;delete row.observationNumber;}
              const legacy=window.ProgressModel.prepareBackupState(legacyInput,c.questions);
              if(legacy.learningEffectiveness.initialHistory!=='unknown')throw Error('legacy coverage');
              const missing=JSON.parse(JSON.stringify(progress));delete missing.learningEffectiveness.questions.J001;
              if(window.ProgressModel.prepareBackupState(missing,c.questions)!==null)throw Error('missing complete evidence accepted');
              const wrongRevision=JSON.parse(JSON.stringify(progress));wrongRevision.contentRevision=3;
              delete wrongRevision.questionContentVersions;delete wrongRevision.contentMigrationArchive;delete wrongRevision.contentRecheckIds;
              if(window.ProgressModel.prepareBackupState(wrongRevision,c.questions)!==null)throw Error('pre-identity evidence accepted');
              progress.currentQuestionId='J003';
              window.evidenceBackup={format:'boki-rpg-backup',version:1,progress,character};
            });
            // Import intentionally reloads. Wait for that navigation rather than
            // trying to return an evaluate result from a destroyed WebKit context.
            await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.evaluate(()=>{
              setTimeout(()=>window.App.controller.importBackup({text:async()=>JSON.stringify(window.evidenceBackup)}),100);
            })]);
            await page.waitForFunction(()=>Boolean(window.App?.controller));
            assert.strictEqual(await page.evaluate(()=>window.App.controller.model.state.currentQuestionId),'J003');
            assert.deepStrictEqual(await page.evaluate(()=>window.App.controller.model.learningEffectivenessForQuestion('J001')),beforeReload.metric);
            const failure=await page.evaluate(()=>{
              const c=window.App.controller;c.model.state.mode='training';c.start('J002',{fresh:true});c.view.applyRetryDraft(c.questions.J002,c.questions.J002.answer);
              const before=JSON.stringify(c.model.state),character=JSON.stringify(c.rpg.state),stored=localStorage.getItem(c.model.key),set=c.model.storage.setItem;
              c.model.storage.setItem=()=>false;const result=c.submit();c.model.storage.setItem=set;
              return {rejected:result===false,stateSame:before===JSON.stringify(c.model.state),characterSame:character===JSON.stringify(c.rpg.state),bytesSame:stored===localStorage.getItem(c.model.key)};
            });
            assert(Object.values(failure).every(Boolean));assert.deepStrictEqual(errors,[]);
            evidence.reports.push({engine,width,observedAttempts:222,retained:200,delayedAttempts:220,delayedSuccesses:146,initialPreserved:true,assistedSeparated:true,reload:true,backup:true,saveFailure:failure,pageErrors:errors});write();
          }finally{await context.close();}
        }
      }finally{await browser.close();}
    }
    assert.strictEqual(evidence.reports.length,6);evidence.status='PASS';write();console.log('LEARNING_EFFECTIVENESS_BROWSER 6/6 PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.stack;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
