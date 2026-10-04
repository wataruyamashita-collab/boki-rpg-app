'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','story-narrative-result');
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
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const[browserName,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const page=await browser.newPage({viewport:{width,height:900}});
          const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
          try{
            await page.goto(url,{waitUntil:'load'});
            const report=await page.evaluate(()=>{
              document.querySelectorAll('.view').forEach(node=>{node.hidden=true;node.style.display='none';});
              const result=document.getElementById('view-result');result.hidden=false;result.style.display='block';
              const view=new window.AppView(document);
              const baselinePageWidth=document.documentElement.scrollWidth;
              const scene={sceneId:'CH12-BOSS',chapter:12,beat:'BOSS',after:'社長は「やっと、うちの会社が見えた」と答えました。',hook:'次は主人公が最初の一枚を渡す側です。',dialogue:'社長「やっと、うちの会社が見えた。」',epilogue:true};
              const storyResolved=view.renderNarrativeResult([scene],{mode:'story',resolved:true});
              const node=document.getElementById('narrative-result');
              const visibleText=node.textContent;
              const sceneId=node.dataset.sceneId;
              const epilogueClass=node.classList.contains('narrative-result-epilogue');
              const containerOverflow=node.scrollWidth>node.clientWidth+1;
              const pageOverflowAdded=document.documentElement.scrollWidth>baselinePageWidth+1;
              const wrongHidden=view.renderNarrativeResult([scene],{mode:'story',resolved:false})===false&&node.hidden===true;
              const trainingHidden=view.renderNarrativeResult([scene],{mode:'training',resolved:true})===false&&node.hidden===true;
              return{storyResolved,visibleText,sceneId,epilogueClass,containerOverflow,pageOverflowAdded,baselinePageWidth,finalPageWidth:document.documentElement.scrollWidth,wrongHidden,trainingHidden};
            });
            report.browser=browserName;report.width=width;report.pageErrors=pageErrors;report.violations=[];
            if(!report.storyResolved)report.violations.push('STORY_RESULT_NOT_RENDERED');
            if(!report.visibleText.includes('やっと、うちの会社が見えた'))report.violations.push('AFTER_MISSING');
            if(!report.visibleText.includes('最初の一枚'))report.violations.push('HOOK_MISSING');
            if(report.sceneId!=='CH12-BOSS')report.violations.push('SCENE_ID_MISSING');
            if(!report.epilogueClass)report.violations.push('EPILOGUE_CLASS_MISSING');
            if(!report.wrongHidden)report.violations.push('WRONG_REVEALS_RESULT');
            if(!report.trainingHidden)report.violations.push('TRAINING_MODE_LEAK');
            if(report.containerOverflow)report.violations.push('NARRATIVE_CONTAINER_OVERFLOW');
            if(report.pageOverflowAdded)report.violations.push('NARRATIVE_ADDED_PAGE_OVERFLOW');
            if(pageErrors.length)report.violations.push('PAGE_SCRIPT_ERROR');
            evidence.reports.push(report);
            if(report.violations.length)evidence.failures.push(`${browserName}/${width}: ${report.violations.join(',')}`);
            fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
            await page.screenshot({path:path.join(OUTPUT,browserName,`result-${width}.png`),fullPage:true});
            write();
          }finally{await page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('ISSUE179_S3_NARRATIVE_RESULT_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
