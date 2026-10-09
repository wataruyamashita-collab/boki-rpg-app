'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','study-recommendation');
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
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const baseProgress={
  contentRevision:3,learningSchemaVersion:1,lastLearningAt:5000,
  questionStats:{
    J001:{correctCount:0,incorrectCount:1,correctStreak:0,incorrectStreak:1,lastResult:false,lastAnsweredAt:5000},
    J002:{correctCount:1,incorrectCount:2,correctStreak:0,incorrectStreak:1,lastResult:false,lastAnsweredAt:4000},
    J003:{correctCount:1,incorrectCount:1,correctStreak:1,incorrectStreak:0,lastResult:true,lastAnsweredAt:3000}
  },
  mode:'story',currentQuestionId:'J003',answeredIds:['J001','J002','J003'],correctIds:['J002','J003'],incorrectIds:['J001','J002'],
  mistakeCounts:{J001:1,J002:2,J003:1},reviewSchedule:{},reviewAssignments:{},
  attempts:[
    {questionId:'J001',id:'J001',concept:'資本金・追加出資',category:'資本金・追加出資',difficulty:1,correct:false,confidence:'unsure',responseMs:1000,wrongType:'journal-entry',reviewStage:null,delayedSuccess:false,timestamp:5000,at:5000},
    {questionId:'J002',id:'J002',concept:'現金・預金',category:'現金・預金',difficulty:1,correct:true,confidence:'unsure',responseMs:900,wrongType:'',reviewStage:null,delayedSuccess:false,timestamp:2000,at:2000},
    {questionId:'J002',id:'J002',concept:'現金・預金',category:'現金・預金',difficulty:1,correct:false,confidence:'unsure',responseMs:1100,wrongType:'journal-entry',reviewStage:null,delayedSuccess:false,timestamp:4000,at:4000},
    {questionId:'J003',id:'J003',concept:'売掛金・回収',category:'売掛金・回収',difficulty:1,correct:true,confidence:'sure',responseMs:800,wrongType:'',reviewStage:null,delayedSuccess:false,timestamp:3000,at:3000}
  ],
  drafts:{},completed:false,placement:{completed:true,foundation:0,closing:0,startQuestionId:'J001',completedAt:1},
  examAttempt:0,examSession:null,examHistory:[],lastExamReview:null
};
const characterState={xp:0,rewardedIds:[],mastery:{},companyHP:100,totalTransactionAmount:0,confidenceOutcomes:{sureCorrect:0,sureWrong:0,unsureCorrect:0,unsureWrong:0}};
const clone=value=>JSON.parse(JSON.stringify(value));
async function inspect(page,selector){
  return page.evaluate(selector=>{
    const panel=document.querySelector(selector);
    const cards=[...panel.querySelectorAll('.study-recommendation-card')];
    return {
      text:panel.textContent,
      cardCount:cards.length,
      panelOverflow:panel.scrollWidth>panel.clientWidth+1,
      pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,
      cardsFit:cards.every(card=>card.scrollWidth<=card.clientWidth+1),
      starts:[...panel.querySelectorAll('[data-action="start"]')].map(button=>button.dataset.questionId),
      reviewCtas:[...panel.querySelectorAll('[data-action="mode"][data-mode="review"]')].length
    };
  },selector);
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
              if(scenario==='due') progress.reviewSchedule.J001={stage:0,dueAt:1};
              await page.addInitScript(({progress,characterState})=>{
                localStorage.setItem('boki-rpg-progress-v2',JSON.stringify(progress));
                localStorage.setItem('boki-rpg-character-v1',JSON.stringify(characterState));
              },{progress,characterState});
              await page.goto(url,{waitUntil:'load'});
              await page.waitForFunction(()=>Boolean(window.App?.controller));
              const noticeDialog=page.locator('#app-notice-dialog[open]');
              if(await noticeDialog.count()) await page.click('#app-notice-confirm');
              await page.click('[data-mode="story"]');
              const story=await inspect(page,'#story-recommendations');
              await page.click('[data-mode="training"]');
              const training=await inspect(page,'#training-recommendations');
              const report={browser:browserName,width,scenario,story,training,pageErrors,violations:[]};
              for(const result of [story,training]){
                if(!result.text.includes('今日のおすすめ'))report.violations.push('MISSING_RECOMMENDATION_HEADING');
                if(result.panelOverflow||result.pageOverflow||!result.cardsFit)report.violations.push('HORIZONTAL_OVERFLOW');
              }
              if(scenario==='due'){
                if(!story.text.includes('復習期限')||story.reviewCtas!==1||story.starts.length!==0)report.violations.push('DUE_REVIEW_ROUTING');
                if(!training.text.includes('復習期限')||training.reviewCtas!==1||training.starts.length!==0)report.violations.push('DUE_REVIEW_TRAINING_ROUTING');
              }else{
                if(story.cardCount<1||story.cardCount>3||story.starts.length!==story.cardCount)report.violations.push('STORY_RECOMMENDATION_COUNT');
                if(training.cardCount<1||training.cardCount>3||training.starts.length!==training.cardCount)report.violations.push('TRAINING_RECOMMENDATION_COUNT');
                if(!story.text.includes('直近の回答が誤答です'))report.violations.push('MISSING_EXPLAINABLE_REASON');
                if(!story.text.includes('習熟度：'))report.violations.push('MISSING_MASTERY_STATE');
                const trainingTypes=await page.evaluate(ids=>ids.map(id=>window.QuestionData[id]?.type),training.starts);
                if(trainingTypes.includes('journal'))report.violations.push('TRAINING_JOURNAL_LEAK');
              }
              if(pageErrors.length)report.violations.push('PAGE_SCRIPT_ERROR');
              evidence.reports.push(report);
              if(report.violations.length)evidence.failures.push(`${browserName}/${width}/${scenario}: ${report.violations.join(',')}`);
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
              await page.click('[data-mode="story"]');
              await page.screenshot({path:path.join(OUTPUT,browserName,`${scenario}-${width}.png`),fullPage:true});
              write();
            }finally{await page.close();}
          }
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('LEARNING_RECOMMENDATION_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
