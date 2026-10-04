'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','issue161-ch7-8-explanations');
const engines={chromium,webkit};
const widths=[320,375,390,430];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const evidence={status:'RUNNING',reports:[],failures:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const progress={contentRevision:3,learningSchemaVersion:1,lastLearningAt:0,questionStats:{},mode:'story',currentQuestionId:null,answeredIds:[],correctIds:[],incorrectIds:[],mistakeCounts:{},reviewSchedule:{},reviewAssignments:{},attempts:[],drafts:{},completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},examAttempt:0,examSession:null,examHistory:[],lastExamReview:null};
const character={xp:0,rewardedIds:[],mastery:{},companyHP:100,totalTransactionAmount:0,confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}};
async function seeded(browser,width){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
  await page.addInitScript(({progress,character})=>{localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progress));localStorage.setItem('boki-rpg-character-v1',JSON.stringify(character));},{progress,character});
  return{page,errors};
}
async function auditAll(page){
  return page.evaluate(async()=>{
    const c=window.App?.controller;if(!c)throw new Error('APP_CONTROLLER_MISSING');
    const questions=Object.values(window.QuestionData).filter(q=>/^L\d{3}$/u.test(q.id));
    const reports=[],failures=[];
    for(const q of questions){
      const violations=[];
      c.start(q.id,{fresh:true});
      c.view.renderExplanation(q,{correct:true},q.answer);
      const exp=document.getElementById('explanation'),text=exp.textContent||'';
      const correctModel=window.ExplanationModel.build(q,q.answer,{correct:true});
      const plan=window.ExplanationDesignSystem.planFor(q,{model:correctModel,correct:true});
      if(!exp.querySelector('.explanation-route'))violations.push('NO_SOLUTION_ROUTE');
      if(!exp.querySelector('.explanation-flow'))violations.push('NO_STRUCTURED_FLOW_CORRECT');
      if(!exp.querySelector('.explanation-flow-section[data-section="transfer"]'))violations.push('NO_TRANSFER_SECTION');
      if(!exp.querySelector('.explanation-flow-section[data-section="checks"]'))violations.push('NO_CHECK_SECTION');
      if(!text.includes('この問題の解き方を確認'))violations.push('CORRECT_HEADING_MISSING');
      if(exp.querySelector('.solution-steps'))violations.push('DUPLICATE_GENERIC_SOLUTION');
      if(exp.querySelector('.explanation-card:not(.explanation-takeaway)'))violations.push('AUTHORED_PROSE_DUPLICATED_ON_CORRECT');
      if(/\b(?:value\d+|annualA|monthsA|depreciationA|bookA|lossA|annualB|monthsB|depreciationB|bookB)\b/u.test(text))violations.push('RAW_INTERNAL_KEY');
      if(q.format==='fixed-asset-ledger'&&plan.profileId!=='fixedAsset')violations.push('FIXED_ASSET_PROFILE');
      if((q.format||'default')==='default'&&/商品有高帳/u.test(String(q.category||''))&&plan.profileId!=='inventory')violations.push('INVENTORY_PROFILE');
      if(exp.scrollWidth>exp.clientWidth+1||document.documentElement.scrollWidth>window.innerWidth+1)violations.push('HORIZONTAL_OVERFLOW');

      const wrongAnswer={cells:Object.fromEntries((q.table?.inputCells||[]).map(id=>[id,'']))};
      const wrong=window.GradingEngine.grade(q,wrongAnswer);
      c.view.renderExplanation(q,wrong,wrongAnswer);
      const wrongText=exp.textContent||'';
      if(!exp.querySelector('.explanation-flow'))violations.push('NO_STRUCTURED_FLOW_WRONG');
      if(!wrongText.includes('この問題をもう一度解く手順'))violations.push('WRONG_HEADING_MISSING');
      if(!wrongText.includes('間違えやすいところ'))violations.push('MISTAKE_SECTION_MISSING');
      if(!wrongText.includes('最後に確認'))violations.push('CHECK_HEADING_MISSING');
      if(exp.scrollWidth>exp.clientWidth+1||document.documentElement.scrollWidth>window.innerWidth+1)violations.push('WRONG_HORIZONTAL_OVERFLOW');
      reports.push({id:q.id,format:q.format||'default',profileId:plan.profileId,violations});
      if(violations.length)failures.push(q.id+':'+violations.join(','));
    }
    return{total:questions.length,reports,failures};
  });
}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const[name,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const{page,errors}=await seeded(browser,width);
          try{
            await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>Boolean(window.App?.controller));
            const result=await auditAll(page);
            const report={browser:name,width,total:result.total,failures:result.failures,pageErrors:errors};
            evidence.reports.push(report);
            if(result.total!==50)evidence.failures.push(name+'/'+width+':COVERAGE_'+result.total);
            if(errors.length)evidence.failures.push(name+'/'+width+':PAGE_ERRORS');
            evidence.failures.push(...result.failures.map(f=>name+'/'+width+':'+f));
            if(result.failures.length||errors.length){fs.mkdirSync(path.join(OUTPUT,name),{recursive:true});await page.screenshot({path:path.join(OUTPUT,name,'failure-'+width+'.png'),fullPage:true});}
            write();
          }finally{await page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('ISSUE161_CH7_8_EXPLANATION_BROWSER_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=String(error?.stack||error);write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
