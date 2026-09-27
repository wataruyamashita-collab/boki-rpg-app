'use strict';
const fs=require('fs');
const http=require('http');
const path=require('path');
const {chromium,webkit}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','calculator-dock-all-types');
const engines={chromium,webkit};
const widths=[320,375,390,430,820];
const cases=[
  ['J001','journal'],
  ['L040','ledger'],
  ['T001','trial_balance'],
  ['E001','correction'],
  ['D019','worksheet'],
  ['F001','financial_statement'],
  ['C001','comprehensive'],
  ['D001','worksheet-eight-column']
];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json'};
const evidence={status:'RUNNING',reports:[],failures:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'.github/visual/calculator-dock-harness.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream'); res.end(fs.readFileSync(file));
});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r)); const url='http://127.0.0.1:'+server.address().port+'/'; write();
  try{
    for(const [browserName,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const context=await browser.newContext({viewport:{width,height:844},hasTouch:true});
          const page=await context.newPage();
          try{
            await page.goto(url,{waitUntil:'load'});
            for(const [id,label] of cases){
              await page.evaluate(id=>{
                document.querySelector('.calculator')?.classList.remove('calculator-contextual-float');
                document.querySelector('.calculator')?.removeAttribute('open');
                document.getElementById('question-form')?.classList.remove('calculator-dock-active');
                document.getElementById('question-form')?.classList.remove('calculator-workspace-active');
                window.calculatorDockHarness.render(id);
              },id);
              const result=await page.evaluate(async({id})=>{
                const input=document.querySelector('.amount-input:not(:disabled)');
                const calculator=document.querySelector('.calculator');
                const form=document.getElementById('question-form');
                if(!input) return {id,error:'NO_AMOUNT_INPUT'};
                const coarse=matchMedia('(hover: none) and (pointer: coarse)').matches;
                input.readOnly=true;
                const readonly=input.readOnly;
                window.__dockController.selectCalculatorTarget(input);
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const ir=input.getBoundingClientRect(),cr=calculator.getBoundingClientRect();
                const style=getComputedStyle(calculator);
                const selected=input.classList.contains('calculator-selected');
                const beforeValue=input.value;
                window.__dockController.expression='12345';
                window.__dockController.insertCalculatorResult(false);
                const afterValue=input.value;
                return {
                  id,coarse,readonly,open:calculator.open,
                  contextualClass:calculator.classList.contains('calculator-contextual-float'),
                  formActive:form.classList.contains('calculator-dock-active'),
                  workspaceActive:form.classList.contains('calculator-workspace-active'),
                  position:style.position,
                  selected,
                  inputTop:ir.top,inputBottom:ir.bottom,
                  calcTop:cr.top,calcBottom:cr.bottom,
                  placement:calculator.dataset.placement||'',
                  nonOverlapping:cr.bottom<=ir.top||cr.top>=ir.bottom||cr.right<=ir.left||cr.left>=ir.right,
                  anchored:calculator.dataset.placement==='below'
                    ? Math.abs(cr.top-(ir.bottom+8))<=3
                    : calculator.dataset.placement==='above'
                      ? Math.abs(cr.bottom-(ir.top-8))<=3
                      : false,
                  beforeValue,afterValue,
                  targetText:document.getElementById('calculator-target')?.textContent||'',
                  viewportHeight:innerHeight,
                  workZoneRatio:innerHeight?ir.top/innerHeight:null
                };
              },{id});
              const frozen=await page.evaluate(async()=>{
                const calculator=document.querySelector('.calculator');
                const before=calculator.getBoundingClientRect();
                const beforeY=scrollY;
                const maxScroll=Math.max(0,document.documentElement.scrollHeight-innerHeight);
                window.scrollBy(0,Math.min(120,Math.max(0,maxScroll-beforeY)));
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const after=calculator.getBoundingClientRect();
                return {
                  beforeTop:before.top,beforeLeft:before.left,
                  afterTop:after.top,afterLeft:after.left,
                  stable:Math.abs(after.top-before.top)<=1&&Math.abs(after.left-before.left)<=1,
                  didScroll:Math.abs(scrollY-beforeY)>1
                };
              });
              const violations=[];
              if(result.error)violations.push(result.error);
              if(!result.readonly)violations.push('AMOUNT_NOT_READONLY');
              if(!result.open)violations.push('CALCULATOR_NOT_OPEN');
              if(!result.contextualClass)violations.push('CONTEXTUAL_FLOAT_CLASS_MISSING');
              if(result.formActive)violations.push('UNEXPECTED_FORM_BOTTOM_RESERVE');
              if(!result.workspaceActive)violations.push('WORKSPACE_RUNWAY_MISSING');
              if(result.position!=='fixed')violations.push('CALCULATOR_NOT_FIXED');
              if(!result.selected)violations.push('TARGET_NOT_SELECTED');
              if(!result.nonOverlapping)violations.push('TARGET_OVERLAPPED_BY_CALCULATOR');
              if(!result.anchored)violations.push('CALCULATOR_NOT_ANCHORED_TO_TARGET');
              if(!frozen.stable)violations.push('CALCULATOR_MOVED_DURING_SCROLL');
              if(id==='C001'&&result.workZoneRatio!==null&&(result.workZoneRatio<0.18||result.workZoneRatio>0.42))violations.push('C001_TARGET_NOT_IN_WORK_ZONE_'+String(result.workZoneRatio));
              if(result.afterValue!=='12,345')violations.push('INSERT_RESULT_FAILED');
              evidence.reports.push({browser:browserName,width,id,label,...result,frozen,coarsePointerObserved:result.coarse,violations});
              if(violations.length)evidence.failures.push(browserName+'/'+width+'/'+id+': '+violations.join(','));
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
              await page.screenshot({path:path.join(OUTPUT,browserName,id+'-'+width+'.png'),fullPage:true});
              write();
            }
          } finally { await context.close(); }
        }
      } finally { await browser.close(); }
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('CALCULATOR_DOCK_ALL_TYPES_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
