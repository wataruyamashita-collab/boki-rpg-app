'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','rpg-reward-policy');
const engines={chromium,webkit};
const widths=[320,390,768];
const labels=['復習成功 +6 XP','苦手克服 +8 XP'];
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
          for(const label of labels){
            const page=await browser.newPage({viewport:{width,height:900}});
            const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
            try{
              await page.goto(url,{waitUntil:'load'});
              await page.evaluate(label=>{
                const result=document.getElementById('view-result');
                const anchor=document.getElementById('result-status');
                if(result){result.hidden=false;result.style.display='block';}
                const context={document,byId:id=>document.getElementById(id)};
                window.AppView.prototype.renderAchievement.call(context,anchor,{reward:label});
              },label);
              const report=await page.evaluate(()=>{const banner=document.getElementById('achievement-banner');return{
                text:banner?.textContent||'',
                hidden:banner?.hidden??true,
                bannerOverflow:banner ? banner.scrollWidth>banner.clientWidth+1 : true,
                pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1
              };});
              report.browser=browserName;report.width=width;report.label=label;report.pageErrors=pageErrors;report.violations=[];
              if(report.hidden||report.text!==label)report.violations.push('REWARD_BANNER_MISSING');
              if(report.bannerOverflow||report.pageOverflow)report.violations.push('HORIZONTAL_OVERFLOW');
              if(pageErrors.length)report.violations.push('PAGE_SCRIPT_ERROR');
              evidence.reports.push(report);
              if(report.violations.length)evidence.failures.push(`${browserName}/${width}/${label}: ${report.violations.join(',')}`);
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
              await page.screenshot({path:path.join(OUTPUT,browserName,`${label.includes('復習')?'review':'recovery'}-${width}.png`),fullPage:true});
              write();
            }finally{await page.close();}
          }
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('RPG_REWARD_PHASE4C_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
