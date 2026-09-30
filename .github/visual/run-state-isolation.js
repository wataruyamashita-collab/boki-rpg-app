'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','issue161-state-isolation');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'reports/issue-161/question-inventory.json'),'utf8'));
const engines={chromium,webkit};
const mobileWidths=[320,375,390,430];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const evidence={status:'RUNNING',baseline:inventory.baselineMainSha,totalQuestions:inventory.totalQuestions,reports:[],mobile:[],failures:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const progressState={
  contentRevision:3,learningSchemaVersion:1,lastLearningAt:0,questionStats:{},
  mode:'story',currentQuestionId:null,answeredIds:[],correctIds:[],incorrectIds:[],
  mistakeCounts:{},reviewSchedule:{},reviewAssignments:{},attempts:[],drafts:{},
  completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},
  examAttempt:0,examSession:null,examHistory:[],lastExamReview:null
};
const characterState={xp:0,rewardedIds:[],mastery:{},companyHP:100,totalTransactionAmount:0,confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}};

async function newSeededPage(browser,viewport){
  const page=await browser.newPage({viewport});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
  await page.addInitScript(({progressState,characterState})=>{
    localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progressState));
    localStorage.setItem('boki-rpg-character-v1',JSON.stringify(characterState));
  },{progressState,characterState});
  return {page,pageErrors};
}

async function all300(page,browserName){
  const ids=inventory.questions.map(row=>row.id);
  return page.evaluate(async ids=>{
    const controller=window.App?.controller;
    if(!controller) throw new Error('APP_CONTROLLER_MISSING');
    const reports=[];
    const failures=[];
    const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    const digits=value=>String(value??'').replace(/\D/g,'');
    const values=()=>[...document.querySelectorAll('#question-form input, #question-form select')]
      .filter(el=>!el.disabled&&el.type!=='hidden'&&el.type!=='radio'&&el.type!=='button'&&el.type!=='submit'&&!el.closest('.calculator'))
      .map(el=>String(el.value??''));
    for(let index=0;index<ids.length;index++){
      const id=ids[index],next=ids[(index+1)%ids.length],sentinel=String(92000000+index*1000+17);
      const row={id,violations:[]};
      try{
        controller.start(id,{fresh:true});
        await nextFrame();
        const target=document.querySelector('#question-form .amount-input:not(:disabled), #question-form .table-text-input:not(:disabled), #question-form input.table-input:not(:disabled)');
        if(!target){row.violations.push('NO_EDITABLE_SENTINEL_TARGET');}
        else{
          target.value=sentinel;
          target.dispatchEvent(new Event('input',{bubbles:true}));
          const serialized=JSON.stringify(controller.model.state.drafts[id]||{});
          if(!serialized.includes(sentinel)) row.violations.push('DRAFT_NOT_PERSISTED');

          controller.start(id);
          await nextFrame();
          if(!values().some(value=>digits(value)===sentinel)) row.violations.push('SAME_QUESTION_RESUME_LOST');

          controller.start(next,{fresh:true});
          await nextFrame();
          if(values().some(value=>digits(value)===sentinel)) row.violations.push('CROSS_QUESTION_SENTINEL_LEAK');

          controller.start(id,{fresh:true});
          await nextFrame();
          if(controller.model.state.drafts[id]!==undefined) row.violations.push('FRESH_START_DRAFT_REMAINS');
          if(values().some(value=>digits(value)===sentinel)) row.violations.push('FRESH_START_DOM_SENTINEL_REMAINS');
        }
      }catch(error){row.violations.push('EXCEPTION:'+String(error?.message||error));}
      if(row.violations.length) failures.push(id+':'+row.violations.join(','));
      reports.push(row);
    }
    return {reports,failures};
  },ids).then(result=>({...result,browser:browserName}));
}

async function mobileRepresentatives(browser,browserName,url){
  const reps=[];
  const seen=new Set();
  for(const row of inventory.questions) if(!seen.has(row.renderer)){seen.add(row.renderer);reps.push(row);}
  for(const width of mobileWidths){
    const {page,pageErrors}=await newSeededPage(browser,{width,height:900});
    try{
      await page.goto(url,{waitUntil:'load'});
      await page.waitForFunction(()=>Boolean(window.App?.controller));
      const result=await page.evaluate(async reps=>{
        const c=window.App.controller;
        const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
        const digits=value=>String(value??'').replace(/\D/g,'');
        const failures=[];
        for(let i=0;i<reps.length;i++){
          const row=reps[i],sentinel=String(97000000+i*1000+31);
          c.start(row.id,{fresh:true});await nextFrame();
          const target=document.querySelector('#question-form .amount-input:not(:disabled), #question-form .table-text-input:not(:disabled), #question-form input.table-input:not(:disabled)');
          if(!target){failures.push(row.id+':NO_TARGET');continue;}
          target.value=sentinel;target.dispatchEvent(new Event('input',{bubbles:true}));
          const next=reps[(i+1)%reps.length].id;
          c.start(next,{fresh:true});await nextFrame();
          const leaked=[...document.querySelectorAll('#question-form input, #question-form select')].some(el=>digits(el.value)===sentinel);
          if(leaked)failures.push(row.id+':MOBILE_CROSS_QUESTION_LEAK');
        }
        return {rendererCount:reps.length,failures};
      },reps);
      evidence.mobile.push({browser:browserName,width,pageErrors,rendererCount:result.rendererCount,failures:result.failures});
      if(pageErrors.length)evidence.failures.push(browserName+'/'+width+':PAGE_ERROR');
      for(const failure of result.failures)evidence.failures.push(browserName+'/'+width+':'+failure);
    }finally{await page.close();}
  }
}

async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';
  write();
  try{
    for(const[browserName,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        const {page,pageErrors}=await newSeededPage(browser,{width:390,height:900});
        try{
          await page.goto(url,{waitUntil:'load'});
          await page.waitForFunction(()=>Boolean(window.App?.controller));
          const result=await all300(page,browserName);
          evidence.reports.push({browser:browserName,total:result.reports.length,failures:result.failures,pageErrors});
          if(result.failures.length)evidence.failures.push(...result.failures.map(item=>browserName+':'+item));
          if(pageErrors.length)evidence.failures.push(browserName+':PAGE_ERROR');
          if(result.failures.length||pageErrors.length){
            fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
            await page.screenshot({path:path.join(OUTPUT,browserName,'all300-failure.png'),fullPage:true});
          }
          write();
        }finally{await page.close();}
        await mobileRepresentatives(browser,browserName,url);
        write();
      }finally{await browser.close();}
    }
    if(evidence.reports.some(row=>row.total!==300))evidence.failures.push('ALL300_COVERAGE_INCOMPLETE');
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('ISSUE161_ALL300_BROWSER_STATE_ISOLATION_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=String(error?.stack||error);write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
