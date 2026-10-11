'use strict';
const assert=require('assert'),fs=require('fs'),http=require('http'),path=require('path'),cp=require('child_process'),vm=require('vm');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUTPUT=path.join(ROOT,'artifacts/pr212-migration');
const legacy={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'data/questions.js'),'utf8'),legacy);
vm.runInNewContext(cp.execFileSync('git',['show','d6da732f57e8a46717f67620b5a2761caa685872:js/model.js'],{cwd:ROOT,encoding:'utf8'}),legacy);
const old=new legacy.window.ProgressModel(legacy.window.QuestionData,{getItem:()=>null,setItem:()=>true});
old.completePlacement({foundation:80,closing:70},1000);old.setDraft('J003',legacy.window.QuestionData.J003.answer);const original=JSON.stringify(old.state);
vm.runInNewContext(cp.execFileSync('git',['show','2cf70526f3cdc18560f151d4d32134a49aef79cb:js/model.js'],{cwd:ROOT,encoding:'utf8'}),legacy);
const oldExam=new legacy.window.ProgressModel(legacy.window.QuestionData,{getItem:()=>null,setItem:()=>true}),startedAt=Date.now(),examId=legacy.window.ExamPoolDefinition[0];
oldExam.completePlacement({foundation:80,closing:70},1000);oldExam.state.mode='exam';oldExam.state.examSession={ids:legacy.window.ExamPoolDefinition.slice(0,15),startedAt,endAt:startedAt+3600000,status:'RUNNING',evidenceVersion:1,scores:{}};
oldExam.recordAttempt(examId,false,10,'',false,startedAt+1,null,'unsure',{mode:'exam'});oldExam.state.examSession.scores[examId]={correct:false,earned:0,possible:1,ratio:0,observationNumber:1};oldExam.save();const originalExam=JSON.stringify(oldExam.state);
vm.runInNewContext(cp.execFileSync('git',['show','ed21218967958e42e67ba9aafe9c333a5bbccc55:js/model.js'],{cwd:ROOT,encoding:'utf8'}),legacy);
const prerequisiteId=legacy.window.ExamPoolDefinition.flatMap(id=>legacy.window.QuestionData[id].curriculumPrerequisites||[])
 .find(id=>['core','drill'].includes(legacy.window.QuestionData[id]?.learningRole));assert(prerequisiteId);
const oldFlags=new legacy.window.ProgressModel(legacy.window.QuestionData,{getItem:()=>null,setItem:()=>true});
oldFlags.recordAttempt(prerequisiteId,true,10,'',false,1000);oldFlags.record(prerequisiteId,true,1000);oldFlags.state.correctIds=[];oldFlags.state.answeredIds=[];oldFlags.save();const originalFlags=JSON.stringify(oldFlags.state);
const unknownFlags=new legacy.window.ProgressModel(legacy.window.QuestionData,{getItem:()=>null,setItem:()=>true});
unknownFlags.state.learningEffectiveness.initialHistory='unknown';unknownFlags.state.correctIds=[prerequisiteId];unknownFlags.state.answeredIds=[prerequisiteId];unknownFlags.refreshEvidenceIntegrity();unknownFlags.save();const originalUnknownFlags=JSON.stringify(unknownFlags.state);
for(const bytes of [originalFlags,originalUnknownFlags])assert(legacy.window.ProgressModel.validateBackupState(JSON.parse(bytes),legacy.window.QuestionData));
const report={status:'RUNNING',reports:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'evidence.json'),JSON.stringify(report,null,2)+'\n');};
const server=http.createServer((req,res)=>{const file=path.resolve(ROOT,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/`;write();
 try{for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();try{for(const width of [320,390,768]){
   const context=await browser.newContext({viewport:{width,height:900}});try{
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto(url);await page.waitForFunction(()=>Boolean(window.App?.controller));
    await page.evaluate(bytes=>{const c=App.controller;c.model.storage.setItem(c.model.key,bytes);c.rpg.save();},original);
    await page.reload();await page.waitForFunction(()=>Boolean(window.App?.controller));
    if(await page.locator('#app-notice-dialog').evaluate(el=>el.open)){const cancel=page.locator('#app-notice-cancel');await (await cancel.isVisible()?cancel:page.locator('#app-notice-confirm')).click();}
    await page.evaluate(()=>{const c=App.controller;c.showMode('story');c.start('J003');});
    const snapshot=()=>page.evaluate(()=>{const c=App.controller;return {pair:[localStorage.getItem(c.model.key),localStorage.getItem(c.rpg.key)],attempts:c.model.state.attempts.length,rpg:c.rpg.state,pending:c.model.isUnverified('drafts','J003'),original:c.model.state.legacyProvenance.original};});
    const before=await snapshot();assert(before.pending);assert.strictEqual(before.attempts,0);
    await page.locator('#question-form .confirm-button').click();assert.match(await page.locator('#app-notice-title').textContent(),/途中入力/);
    await page.locator('#app-notice-cancel').click();assert.deepStrictEqual(await snapshot(),before);
    await page.locator('#question-form .confirm-button').click();await page.keyboard.press('Escape');assert.deepStrictEqual(await snapshot(),before);
    await page.locator('#question-form .confirm-button').click();await page.locator('#app-notice-confirm').click();
    const after=await snapshot();assert(!after.pending);assert.strictEqual(after.attempts,1);assert(after.rpg.xp>before.rpg.xp);assert.strictEqual(after.original,original);
    await page.reload();await page.waitForFunction(()=>Boolean(window.App?.controller));const restored=await snapshot();assert.strictEqual(restored.attempts,1);assert.deepStrictEqual(restored.rpg,after.rpg);assert(!restored.pending);assert.strictEqual(restored.original,original);
    await page.evaluate(bytes=>{const c=App.controller;c.model.storage.setItem(c.model.key,bytes);},originalExam);
    await page.reload();await page.waitForFunction(()=>Boolean(window.App?.controller));
    if(await page.locator('#app-notice-dialog').evaluate(el=>el.open)){const cancel=page.locator('#app-notice-cancel');await (await cancel.isVisible()?cancel:page.locator('#app-notice-confirm')).click();}
    assert.strictEqual(await page.evaluate(()=>Boolean(App.controller.model.storageWriteBlocked)),false);
    const earnedBeforeArchive=await page.evaluate(()=>App.controller.rpg.state);
    await page.evaluate(()=>App.controller.finishExam(true));assert.strictEqual(await page.evaluate(()=>App.controller.examTimerId),null);
    await page.locator('#app-notice-cancel').click();assert.notStrictEqual(await page.evaluate(()=>App.controller.examTimerId),null);
    await page.evaluate(()=>App.controller.finishExam(true));await page.keyboard.press('Escape');assert.notStrictEqual(await page.evaluate(()=>App.controller.examTimerId),null);
    await page.evaluate(()=>App.controller.finishExam(true));await page.locator('#app-notice-confirm').click();
    assert.strictEqual(await page.evaluate(()=>App.controller.model.state.examSession),null);
    assert.strictEqual(await page.evaluate(()=>App.controller.model.state.legacyProvenance.archivedExams.length),1);
    assert.deepStrictEqual(await page.evaluate(()=>App.controller.rpg.state),earnedBeforeArchive);
    const earnedBeforeFlags=await page.evaluate(()=>App.controller.rpg.state);
    for(const [bytes,verified] of [[originalFlags,true],[originalUnknownFlags,false]]){
      await page.evaluate(bytes=>{const c=App.controller;c.model.storage.setItem(c.model.key,bytes);},bytes);
      await page.reload();await page.waitForFunction(()=>Boolean(window.App?.controller));
      if(await page.locator('#app-notice-dialog').evaluate(el=>el.open)){const cancel=page.locator('#app-notice-cancel');await (await cancel.isVisible()?cancel:page.locator('#app-notice-confirm')).click();}
      const flags=await page.evaluate(id=>{const c=App.controller;return {blocked:Boolean(c.model.storageWriteBlocked),correct:c.model.state.correctIds.includes(id),unmet:c.unmetExamPrerequisites().includes(id),original:c.model.state.legacyProvenance.original,rpg:c.rpg.state};},prerequisiteId);
      assert(!flags.blocked);assert(flags.correct);assert.strictEqual(flags.unmet,!verified);assert.strictEqual(flags.original,bytes);assert.deepStrictEqual(flags.rpg,earnedBeforeFlags);
      if(!verified){await page.evaluate(()=>App.controller.showMode('exam'));assert.match(await page.locator('#app-notice-dialog').textContent(),/旧版の正答記録は保持/);await page.locator('#app-notice-confirm').click();}
    }
    const clock=await page.evaluate(()=>{const m=new ProgressModel(QuestionData,{getItem:()=>null,setItem:()=>true}),days=[3,1,2].map(d=>new Date(2026,0,d,12).getTime());
      for(let i=0;i<303;i++)if(!m.recordAttempt('J001',true,10,'',false,days[i%3]+i))throw Error('clock record');
      return days.map(at=>m.learningContinuity(at).today.attempts);});assert.deepStrictEqual(clock,[101,101,101]);
    assert.deepStrictEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(OUTPUT,`${engine}-${width}.png`),fullPage:true});
    report.reports.push({engine,width,version:browser.version(),v1VerifiedProgressionRecovered:true,v1UnverifiedPrerequisiteExplained:true,v1OriginalAndRewardsPreserved:true,cancelAndEscapePreserveBytes:true,examTimerResumesAfterCancelAndEscape:true,unknownExamArchivePreservesRewards:true,currentApprovalOnce:true,reloadPreservesRewards:true,originalPreserved:true,clockAfterEviction:clock,pageErrors:errors});write();
   }finally{await context.close();}
  }}finally{await browser.close();}
 }assert.strictEqual(report.reports.length,6);report.status='PASS';write();console.log('PR212_MIGRATION_BROWSER 6/6 PASS');
 }catch(e){report.status='FAIL';report.error=e.stack;write();throw e;}finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
