'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'artifacts','issue161-explanation-design-system');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'reports/issue-161/question-inventory.json'),'utf8'));
const engines={chromium,webkit},widths=[320,375,430,768];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const evidence={status:'RUNNING',all300:[],representatives:[],failures:[]};
const write=()=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const progress={
  contentRevision:3,learningSchemaVersion:1,lastLearningAt:0,questionStats:{},mode:'story',currentQuestionId:null,
  answeredIds:[],correctIds:[],incorrectIds:[],mistakeCounts:{},reviewSchedule:{},reviewAssignments:{},attempts:[],drafts:{},
  completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},
  examAttempt:0,examSession:null,examHistory:[],lastExamReview:null
};
const character={xp:0,rewardedIds:[],mastery:{},companyHP:100,totalTransactionAmount:0,confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}};
const formatKey=row=>row.type+'/'+(row.format||'default');
const reps=[...new Map(inventory.questions.map(row=>[formatKey(row),row])).values()];
async function pageFor(browser,width,url){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
  await page.addInitScript(({progress,character})=>{
    localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progress));
    localStorage.setItem('boki-rpg-character-v1',JSON.stringify(character));
  },{progress,character});
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>Boolean(window.App?.controller));
  return {page,errors};
}
async function renderIds(page,ids){
  return page.evaluate(ids=>{
    const view=window.App.controller.view,rows=[],failures=[];
    for(const id of ids){
      const q=window.QuestionData[id],score=window.GradingEngine.grade(q,q.answer);
      try{
        view.renderExplanation(q,score,q.answer);
        const route=document.querySelector('#explanation > .explanation-route');
        const violation=[];
        if(!score.correct)violation.push('REFERENCE_ANSWER_NOT_CORRECT');
        if(!route)violation.push('ROUTE_MISSING');
        else{
          if(!route.dataset.explanationProfile)violation.push('PROFILE_MISSING');
          if(!route.textContent.includes('解答までの道筋'))violation.push('HEADING_MISSING');
          if(route.textContent.includes('[object Object]'))violation.push('RAW_OBJECT');
          if(route.scrollWidth>route.clientWidth+1)violation.push('ROUTE_HORIZONTAL_OVERFLOW');
          if(route.querySelectorAll('.explanation-route-step').length<5)violation.push('TOO_FEW_STEPS');
        }
        if(violation.length)failures.push(id+':'+violation.join(','));
        rows.push({id,profile:route?.dataset.explanationProfile||null,violations:violation});
      }catch(error){failures.push(id+':EXCEPTION:'+String(error?.message||error));}
    }
    return {rows,failures};
  },ids);
}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const [browserName,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        const base=await pageFor(browser,390,url);
        try{
          const result=await renderIds(base.page,inventory.questions.map(row=>row.id));
          evidence.all300.push({browser:browserName,total:result.rows.length,failures:result.failures,pageErrors:base.errors});
          result.failures.forEach(f=>evidence.failures.push(browserName+':'+f));
          base.errors.forEach(e=>evidence.failures.push(browserName+':PAGE_ERROR:'+e));
        }finally{await base.page.close();}
        for(const width of widths){
          const current=await pageFor(browser,width,url);
          try{
            const result=await renderIds(current.page,reps.map(row=>row.id));
            const layout=await current.page.evaluate(()=>({
              overflow:document.querySelector('#explanation > .explanation-route')?.scrollWidth>document.querySelector('#explanation > .explanation-route')?.clientWidth+1,
              columns:getComputedStyle(document.querySelector('.explanation-route-list')).gridTemplateColumns.split(' ').filter(Boolean).length
            }));
            const failures=[...result.failures];
            if(layout.overflow)failures.push('REPRESENTATIVE_ROUTE_OVERFLOW');
            if(width<=600&&layout.columns!==1)failures.push('MOBILE_ROUTE_NOT_SINGLE_COLUMN');
            current.errors.forEach(e=>failures.push('PAGE_ERROR:'+e));
            evidence.representatives.push({browser:browserName,width,count:result.rows.length,layout,failures});
            failures.forEach(f=>evidence.failures.push(browserName+'/'+width+':'+f));
          }finally{await current.page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.all300.some(row=>row.total!==300))evidence.failures.push('ALL300_COVERAGE_INCOMPLETE');
    if(evidence.representatives.some(row=>row.count!==26))evidence.failures.push('FORMAT_REPRESENTATIVE_COVERAGE_INCOMPLETE');
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('ISSUE161_EXPLANATION_DESIGN_SYSTEM_BROWSER_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=String(error?.stack||error);write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
