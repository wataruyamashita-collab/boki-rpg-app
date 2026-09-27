'use strict';
const fs=require('fs');
const http=require('http');
const path=require('path');
const {chromium,webkit}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','calculator-dock-all-questions');
const engines={chromium,webkit};
const widths=[320,375,390,430,820];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json'};
const evidence={status:'RUNNING',reports:[],failures:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'.github/visual/harness.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});

async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+server.address().port+'/';
  write();
  try{
    for(const [browserName,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:true});
          const page=await context.newPage();
          try{
            await page.goto(url,{waitUntil:'load'});
            const setup=await page.evaluate(()=>{
              if(!window.matchMedia?.('(hover: none) and (pointer: coarse)').matches) return {coarse:false};
              const main=document.querySelector('main.container');
              const form=document.createElement('form'); form.id='question-form'; form.autocomplete='off';
              main.parentNode.insertBefore(form,main); form.append(main);
              const panel=document.createElement('details'); panel.className='calculator';
              panel.innerHTML='<summary>計算機を使う</summary><div class="calculator-body"><div class="calculator-readout"><input id="calculator-display" class="calculator-display" value="0" readonly><output id="calculator-operator" class="calculator-operator-indicator"></output></div><div class="calculator-transfer"><span id="calculator-target">金額欄を選ぶと入力できます</span><button type="button">表示中の金額を反映</button></div><div class="calculator-keys"></div></div>';
              const keys=panel.querySelector('.calculator-keys');
              ['AC','C','÷','×','7','8','9','−','4','5','6','＋','1','2','3','＝','0','00','.'].forEach(value=>{
                const button=document.createElement('button'); button.type='button'; button.dataset.action='calc'; button.dataset.calc=value; button.textContent=value; keys.append(button);
              });
              form.append(panel);
              return {coarse:true,count:Object.keys(window.QuestionData).length};
            });
            if(!setup.coarse) throw new Error(browserName+'/'+width+': COARSE_POINTER_MEDIA_FALSE');
            if(setup.count!==300) throw new Error(browserName+'/'+width+': QUESTION_COUNT_'+setup.count);
            const report=await page.evaluate(async()=>{
              const ids=Object.keys(window.QuestionData);
              const failures=[];
              let amountInputsSeen=0;
              const byType={};
              const proto=window.AppController.prototype;
              const controller={
                document,
                expression:'0',
                calculator:{accumulator:null,operator:null,waitingForOperand:false,lastOperator:null,lastOperand:null},
                clearCalculator:proto.clearCalculator,
                updateCalculatorDisplay:proto.updateCalculatorDisplay,
                formatCalculatorExpression:proto.formatCalculatorExpression,
                positionCalculatorNearTarget:proto.positionCalculatorNearTarget
              };
              const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              for(const id of ids){
                const question=window.QuestionData[id];
                const panel=document.querySelector('.calculator');
                const form=document.getElementById('question-form');
                panel.open=false; panel.classList.remove('calculator-contextual-float'); form.classList.remove('calculator-dock-active'); form.classList.remove('calculator-workspace-active');
                window.scrollTo(0,0);
                new window.AppView(document).renderQuestion(question,{},'training');
                const activeAnswerRoot=document.getElementById(question.type==='journal'?'journal-container':'table-container');
                const inputs=[...(activeAnswerRoot?.querySelectorAll('.amount-input:not(:disabled)')||[])];
                amountInputsSeen+=inputs.length;
                byType[question.type]=(byType[question.type]||0)+inputs.length;
                if(!inputs.length){failures.push(id+':NO_AMOUNT_INPUT');continue;}
                for(let inputIndex=0;inputIndex<inputs.length;inputIndex+=1){
                  const input=inputs[inputIndex];
                  panel.open=false; panel.classList.remove('calculator-contextual-float'); form.classList.remove('calculator-dock-active'); form.classList.remove('calculator-workspace-active');
                  if(!input.readOnly){failures.push(id+'#'+(inputIndex+1)+':AMOUNT_NOT_READONLY_ON_COARSE_POINTER');continue;}
                  controller.expression='0'; controller.calculatorTarget=null;
                  controller.calculator={accumulator:null,operator:null,waitingForOperand:false,lastOperator:null,lastOperand:null};
                  proto.selectCalculatorTarget.call(controller,input);
                  await raf();
                  const inputRect=input.getBoundingClientRect();
                  const panelRect=panel.getBoundingClientRect();
                  const style=getComputedStyle(panel);
                  const issues=[];
                  if(!panel.open)issues.push('PANEL_NOT_OPEN');
                  if(!panel.classList.contains('calculator-contextual-float'))issues.push('DOCK_CLASS_MISSING');
                  if(form.classList.contains('calculator-dock-active'))issues.push('UNEXPECTED_FORM_BOTTOM_RESERVE');
                  if(!form.classList.contains('calculator-workspace-active'))issues.push('WORKSPACE_RUNWAY_MISSING');
                  if(style.position!=='fixed')issues.push('PANEL_NOT_FIXED');
                  if(panelRect.left<-1||panelRect.right>innerWidth+1)issues.push('PANEL_HORIZONTAL_OVERFLOW');
                  const placement=panel.dataset.placement;
                  const overlap=!(panelRect.bottom<=inputRect.top||panelRect.top>=inputRect.bottom||panelRect.right<=inputRect.left||panelRect.left>=inputRect.right);
                  if(overlap)issues.push('INPUT_OVERLAPPED_BY_CALCULATOR');
                  if(placement==='below'&&Math.abs(panelRect.top-(inputRect.bottom+8))>3)issues.push('CALCULATOR_NOT_ANCHORED_BELOW');
                  else if(placement==='above'&&Math.abs(panelRect.bottom-(inputRect.top-8))>3)issues.push('CALCULATOR_NOT_ANCHORED_ABOVE');
                  else if(!['below','above'].includes(placement))issues.push('CALCULATOR_PLACEMENT_MISSING');
                  if(inputRect.left<-1||inputRect.right>innerWidth+1)issues.push('INPUT_OFFSCREEN_HORIZONTAL');
                  if(issues.length)failures.push(id+'#'+(inputIndex+1)+':'+issues.join(','));
                }
              }
              return {questionCount:ids.length,amountInputsSeen,byType,failures};
            });
            evidence.reports.push({browser:browserName,width,...report});
            if(report.questionCount!==300)evidence.failures.push(browserName+'/'+width+':QUESTION_COUNT');
            const expectedByType={journal:349,ledger:131,trial_balance:80,correction:40,worksheet:104,financial_statement:31,comprehensive:46};
            if(report.amountInputsSeen!==781)evidence.failures.push(browserName+'/'+width+':AMOUNT_INPUT_COUNT_'+report.amountInputsSeen);
            for(const [type,expected] of Object.entries(expectedByType)){
              if(report.byType[type]!==expected)evidence.failures.push(browserName+'/'+width+':'+type.toUpperCase()+'_AMOUNT_INPUT_COUNT_'+report.byType[type]);
            }
            if(report.failures.length)evidence.failures.push(...report.failures.map(item=>browserName+'/'+width+':'+item));
            write();
          }finally{await context.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.slice(0,80).join('\n'));
    evidence.status='PASS';write();console.log('CALCULATOR_DOCK_ALL_QUESTIONS_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
