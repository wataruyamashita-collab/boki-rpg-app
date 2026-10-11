'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','rpg-strategy-board');
const engines={chromium,webkit};
const widths=[320,390,768];
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
const baseProgress={
  contentRevision:3,learningSchemaVersion:1,lastLearningAt:5000,
  questionStats:{J001:{correctCount:0,incorrectCount:1,correctStreak:0,incorrectStreak:1,lastResult:false,lastAnsweredAt:5000}},
  mode:'desk',currentQuestionId:'J001',answeredIds:['J001'],correctIds:[],incorrectIds:['J001'],
  mistakeCounts:{J001:1},reviewSchedule:{},reviewAssignments:{},
  attempts:[{questionId:'J001',id:'J001',concept:'資本金・追加出資',category:'資本金・追加出資',difficulty:1,correct:false,confidence:'unsure',responseMs:1000,wrongType:'journal-entry',reviewStage:null,delayedSuccess:false,timestamp:5000,at:5000}],
  drafts:{},completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},
  examAttempt:0,examSession:null,examHistory:[],lastExamReview:null
};
const characterState={
  xp:540,rewardedIds:[],mastery:{'@skill:仕訳':{earned:8,possible:10}},
  companyHP:100,totalTransactionAmount:0,
  confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}
};
const clone=value=>JSON.parse(JSON.stringify(value));
async function inspect(page){
  return page.evaluate(()=>{
    const panel=document.querySelector('#rpg-mission');
    const card=panel?.querySelector('.rpg-mission-card');
    return {
      text:panel?.textContent||'',
      panelOverflow:panel ? panel.scrollWidth>panel.clientWidth+1 : true,
      cardOverflow:card ? card.scrollWidth>card.clientWidth+1 : true,
      pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,
      reviewCtas:panel?.querySelectorAll('[data-action="mode"][data-mode="review"]').length||0,
      missionCtas:panel?.querySelectorAll('[data-action="start-rpg-mission"]').length||0
    };
  });
}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const[browserName,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          for(const scenario of ['normal','due']){
            const page=await browser.newPage({viewport:{width,height:900}});
            const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
            try{
              const progress=clone(baseProgress);
              if(scenario==='due')progress.reviewSchedule.J001={stage:0,dueAt:1};
              await page.addInitScript(({progress,characterState})=>{
                localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progress));
                localStorage.setItem('boki-rpg-character-v1',JSON.stringify(characterState));
              },{progress,characterState});
              await page.goto(url,{waitUntil:'load'});
              await page.waitForFunction(()=>Boolean(window.App?.controller));
              const report={browser:browserName,width,scenario,...await inspect(page),pageErrors,violations:[]};
              if(!report.text.includes('攻略ミッション'))report.violations.push('MISSING_MISSION_HEADING');
              if(!report.text.includes('対応スキル：仕訳 80%'))report.violations.push('MISSING_SKILL_LINK');
              if(!report.text.includes('現在：Lv.7 経理担当'))report.violations.push('MISSING_ROLE_CONTEXT');
              if(report.panelOverflow||report.cardOverflow||report.pageOverflow)report.violations.push('HORIZONTAL_OVERFLOW');
              if(scenario==='due'){
                if(!report.text.includes('再戦：復習期限')||report.reviewCtas!==1||report.missionCtas!==0)report.violations.push('DUE_REVIEW_MISSION_ROUTING');
              }else{
                if(!report.text.includes('攻略対象')||!report.text.includes('直近の回答が誤答です')||!report.text.includes('習熟度：要復習'))report.violations.push('NORMAL_MISSION_CONTENT');
                if(report.missionCtas!==1||report.reviewCtas!==0)report.violations.push('NORMAL_MISSION_CTA');
              }
              if(pageErrors.length)report.violations.push('PAGE_SCRIPT_ERROR');
              evidence.reports.push(report);
              if(report.violations.length)evidence.failures.push(`${browserName}/${width}/${scenario}: ${report.violations.join(',')}`);
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
              await page.screenshot({path:path.join(OUTPUT,browserName,`${scenario}-${width}.png`),fullPage:true});
              write();
            }finally{await page.close();}
          }
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('RPG_STRATEGY_PHASE4A_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
