'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','learning-analysis');
const engines={chromium,webkit};
const widths=[320,375,390,430,768];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const evidence={status:'RUNNING',reports:[],failures:[]};
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
  contentRevision:3,learningSchemaVersion:1,lastLearningAt:5000,
  questionStats:{
    J001:{correctCount:4,incorrectCount:1,correctStreak:3,incorrectStreak:0,lastResult:true,lastAnsweredAt:5000},
    J002:{correctCount:1,incorrectCount:2,correctStreak:0,incorrectStreak:1,lastResult:false,lastAnsweredAt:4000}
  },
  mode:'desk',currentQuestionId:'J002',answeredIds:['J001','J002'],correctIds:['J001','J002'],incorrectIds:['J002'],
  mistakeCounts:{J001:1,J002:2},reviewSchedule:{},reviewAssignments:{},
  attempts:[
    {questionId:'J001',id:'J001',concept:'資本金・追加出資',category:'資本金・追加出資',difficulty:1,correct:false,confidence:'unsure',responseMs:1000,wrongType:'journal-entry',reviewStage:null,delayedSuccess:false,timestamp:1000,at:1000},
    {questionId:'J001',id:'J001',concept:'資本金・追加出資',category:'資本金・追加出資',difficulty:1,correct:true,confidence:'sure',responseMs:900,wrongType:'',reviewStage:null,delayedSuccess:false,timestamp:2000,at:2000},
    {questionId:'J002',id:'J002',concept:'現金・預金',category:'現金・預金',difficulty:1,correct:true,confidence:'unsure',responseMs:900,wrongType:'',reviewStage:null,delayedSuccess:false,timestamp:3000,at:3000},
    {questionId:'J002',id:'J002',concept:'現金・預金',category:'現金・預金',difficulty:1,correct:false,confidence:'unsure',responseMs:1100,wrongType:'journal-entry',reviewStage:null,delayedSuccess:false,timestamp:4000,at:4000},
    {questionId:'J001',id:'J001',concept:'資本金・追加出資',category:'資本金・追加出資',difficulty:1,correct:true,confidence:'sure',responseMs:800,wrongType:'',reviewStage:null,delayedSuccess:false,timestamp:5000,at:5000}
  ],
  drafts:{},completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},
  examAttempt:0,examSession:null,examHistory:[],lastExamReview:null
};
const characterState={xp:2000,rewardedIds:[],mastery:{},companyHP:100,totalTransactionAmount:0,confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}};
async function measure(page,width){
  return page.evaluate(width=>{
    const panel=document.getElementById('log-analysis');
    const rect=e=>e?.getBoundingClientRect();
    const panelRect=rect(panel);
    const cards=[...panel.querySelectorAll('.learning-metric-card,.learning-analysis-item,.learning-problem-card')];
    const problemMetrics=[...panel.querySelectorAll('.learning-problem-metrics')];
    return {
      width,
      hidden:panel.hidden,
      text:panel.textContent,
      panelOverflow:panel.scrollWidth>panel.clientWidth+1,
      pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,
      cardsFit:cards.every(card=>{const r=rect(card);return r.left>=panelRect.left-1&&r.right<=panelRect.right+1;}),
      problemMetricsFit:problemMetrics.every(grid=>grid.scrollWidth<=grid.clientWidth+1),
      problemColumnCounts:problemMetrics.map(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length),
      metricCards:panel.querySelectorAll('.learning-metric-card').length,
      categoryRows:panel.querySelectorAll('.learning-analysis-item').length,
      problemCards:panel.querySelectorAll('.learning-problem-card').length
    };
  },width);
}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';
  write();
  try{
    for(const[browserName,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const page=await browser.newPage({viewport:{width,height:900}});
          const pageErrors=[];
          page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
          try{
            await page.addInitScript(({progressState,characterState})=>{
              localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progressState));
              localStorage.setItem('boki-rpg-character-v1',JSON.stringify(characterState));
            },{progressState,characterState});
            await page.goto(url,{waitUntil:'load'});
            await page.click('[data-mode="desk"]');
            const button=page.locator('[data-action="open-log-analysis"]');
            if(await button.isDisabled())throw new Error('LOG_ANALYSIS_LOCKED_AT_EXPECTED_LEVEL');
            await button.click();
            await page.waitForFunction(()=>document.getElementById('log-analysis')?.hidden===false);
            const report=await measure(page,width);
            report.browser=browserName;report.pageErrors=pageErrors;
            const violations=[];
            for(const expected of ['学習ログ分析','全体正答率（累積）','直近5回の正答率','分野別正答率（累積）','問題別の習熟度','定着','要復習']){
              if(!report.text.includes(expected))violations.push('MISSING_TEXT:'+expected);
            }
            if(report.hidden)violations.push('ANALYSIS_HIDDEN');
            if(report.panelOverflow)violations.push('ANALYSIS_PANEL_HORIZONTAL_OVERFLOW');
            if(report.pageOverflow)violations.push('PAGE_HORIZONTAL_OVERFLOW');
            if(!report.cardsFit)violations.push('ANALYSIS_CARD_OUTSIDE_PANEL');
            if(!report.problemMetricsFit)violations.push('PROBLEM_METRICS_OVERFLOW');
            if(width<=560&&report.problemColumnCounts.some(count=>count!==1))violations.push('MOBILE_PROBLEM_METRICS_NOT_SINGLE_COLUMN');
            if(report.metricCards!==2)violations.push('SUMMARY_CARD_COUNT');
            if(report.categoryRows<2)violations.push('CATEGORY_ROWS_MISSING');
            if(report.problemCards!==2)violations.push('PROBLEM_CARD_COUNT');
            if(pageErrors.length)violations.push('PAGE_SCRIPT_ERROR');
            report.violations=violations;
            evidence.reports.push(report);
            if(violations.length)evidence.failures.push(browserName+'/'+width+': '+violations.join(','));
            fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
            await page.screenshot({path:path.join(OUTPUT,browserName,'analysis-'+width+'.png'),fullPage:true});
            write();
          }finally{await page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('LEARNING_ANALYSIS_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
