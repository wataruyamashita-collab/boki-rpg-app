'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','learning-continuity');
const engines={chromium,webkit};
const widths=[320,390,768];
const surfaces=[
  { id:'story-learning-summary', title:'今日の学習サマリー', view:'view-story' },
  { id:'result-learning-summary', title:'今回までの今日の結果', view:'view-result' }
];
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
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const[browserName,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          for(const surface of surfaces){
            const page=await browser.newPage({viewport:{width,height:900}});
            const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
            try{
              await page.goto(url,{waitUntil:'load'});
              await page.evaluate(surface=>{
                document.querySelectorAll('.view').forEach(node=>{node.hidden=true;node.style.display='none';});
                const view=document.getElementById(surface.view);if(view){view.hidden=false;view.style.display='block';}
                const context={
                  document,
                  model:{learningContinuity(){return{
                    currentStreak:7,
                    activeDays:14,
                    today:{attempts:6,correctCount:5,incorrectCount:1,accuracy:5/6,questionCount:5,reviewSuccessCount:2},
                    dueReviewCount:3,
                    lastLearningAt:Date.now()
                  };}}
                };
                window.AppController.prototype.renderLearningContinuity.call(context,surface.id,Date.now(),surface.title);
              },surface);
              const report=await page.evaluate(surface=>{
                const node=document.getElementById(surface.id);
                return{
                  text:node?.textContent||'',
                  hidden:node?.hidden??true,
                  containerOverflow:node ? node.scrollWidth>node.clientWidth+1 : true,
                  pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1
                };
              },surface);
              report.browser=browserName;report.width=width;report.surface=surface.id;report.pageErrors=pageErrors;report.violations=[];
              for(const expected of [surface.title,'連続学習','7日','今日の回答','6回','83%','復習期限 3問']){
                if(!report.text.includes(expected))report.violations.push('MISSING_'+expected);
              }
              if(report.hidden)report.violations.push('SUMMARY_HIDDEN');
              if(report.containerOverflow||report.pageOverflow)report.violations.push('HORIZONTAL_OVERFLOW');
              if(pageErrors.length)report.violations.push('PAGE_SCRIPT_ERROR');
              evidence.reports.push(report);
              if(report.violations.length)evidence.failures.push(`${browserName}/${width}/${surface.id}: ${report.violations.join(',')}`);
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
              await page.screenshot({path:path.join(OUTPUT,browserName,`${surface.id}-${width}.png`),fullPage:true});
              write();
            }finally{await page.close();}
          }
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('LEARNING_CONTINUITY_PHASE5_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
