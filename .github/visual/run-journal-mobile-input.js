'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUTPUT=path.join(ROOT,'artifacts','journal-mobile-input');
const engines={chromium,webkit},widths=[320,375,390,430],cases=[['J001','journal-basic'],['J128','journal-multi'],['E001','correction'],['J101','journal-max-amount'],['J135','journal-longest-account']];
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json'};
const evidence={status:'RUNNING',reports:[],failures:[]};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,relative=pathname==='/'?'.github/visual/calculator-dock-harness.html':pathname.slice(1),file=path.resolve(ROOT,relative);if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';write();
  try{
    for(const [browserName,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true});
          const page=await context.newPage();
          try{
            await page.goto(url,{waitUntil:'load'});
            await page.evaluate(()=>{
              const ensure=(tag,id)=>{let node=document.getElementById(id);if(!node){node=document.createElement(tag);node.id=id;node.hidden=true;document.body.append(node);}return node;};
              ensure('input','filter-query');ensure('select','filter-account');ensure('select','filter-mistakes');ensure('form','placement-form');
              window.calculatorDockHarness.render('J001');
              const proto=window.AppController.prototype,controller=window.__dockController;
              controller.view=new window.AppView(document);controller.filters={query:'',account:'',mistakes:'all'};controller.saveDraft=()=>{};controller.renderModes=()=>{};
              proto.bindEvents.call(controller);
              window.__targetController=controller;
            });
            for(const [id,label] of cases){
              await page.evaluate(id=>{
                const q=window.QuestionData[id];
                const panel=document.querySelector('.calculator'),form=document.getElementById('question-form');
                panel.open=false;panel.classList.remove('calculator-contextual-float','calculator-placement-above');
                form.classList.remove('calculator-workspace-active');
                window.__targetController.calculatorTarget=null;
                document.querySelectorAll('.amount-input.calculator-selected').forEach(field=>field.classList.remove('calculator-selected'));
                const draft=q.type==='journal'?{debit:(q.answer?.debit||[]).map(item=>({account:item.account,amount:item.amount})),credit:(q.answer?.credit||[]).map(item=>({account:item.account,amount:item.amount}))}:q.type==='correction'?{cells:{...(q.answer?.cells||{})}}:{};
                new window.AppView(document).renderQuestion(q,draft,'training');
              },id);
              const layout=await page.evaluate(id=>{
                const q=window.QuestionData[id],root=q.type==='journal'?document.querySelector('.journal-grid-scroll'):document.querySelector('.correction-entry'),header=q.type==='journal'?document.querySelector('.journal-header'):document.querySelector('.correction-header'),rows=[...(q.type==='journal'?document.querySelectorAll('.journal-row'):document.querySelectorAll('.correction-row'))];
                const accountDisplays=[...root.querySelectorAll('.journal-account-display')].map(display=>{const r=display.getBoundingClientRect(),style=getComputedStyle(display);return {text:display.textContent,clientWidth:display.clientWidth,scrollWidth:display.scrollWidth,clientHeight:display.clientHeight,scrollHeight:display.scrollHeight,left:r.left,right:r.right,fontSize:style.fontSize,lineHeight:style.lineHeight};});
                const amountValues=[...root.querySelectorAll('.amount-input:not(:disabled), .correction-amount:not(:disabled)')].map(input=>input.value);
                return {rootClientWidth:root?.clientWidth||0,rootScrollWidth:root?.scrollWidth||0,headerWidth:header?.getBoundingClientRect().width||0,viewportWidth:innerWidth,accountDisplays,amountValues,rowReports:rows.map(row=>{const controls=[...row.querySelectorAll('select,input')],rects=controls.map(control=>{const r=control.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,fontSize:getComputedStyle(control).fontSize};});return {controlCount:controls.length,rects,rowWidth:row.getBoundingClientRect().width};})};
              },id);
              const violations=[];
              if(layout.rootScrollWidth>layout.rootClientWidth+1)violations.push('HORIZONTAL_SCROLL_'+layout.rootScrollWidth+'>'+layout.rootClientWidth);
              if(layout.headerWidth>layout.rootClientWidth+1)violations.push('HEADER_OVERFLOW');
              for(const [ri,row] of layout.rowReports.entries()){
                if(row.controlCount!==4)violations.push('ROW_'+ri+'_CONTROL_COUNT_'+row.controlCount);
                for(let ci=1;ci<row.rects.length;ci++)if(row.rects[ci].left<row.rects[ci-1].right-1)violations.push('ROW_'+ri+'_CONTROL_OVERLAP_'+ci);
                const last=row.rects.at(-1);if(last&&last.right>layout.viewportWidth+1)violations.push('ROW_'+ri+'_RIGHT_OVERFLOW');if(row.rects[0]&&row.rects[0].left<-1)violations.push('ROW_'+ri+'_LEFT_OVERFLOW');
              }
              for(const [di,display] of layout.accountDisplays.entries()){
                if(display.scrollWidth>display.clientWidth+1||display.scrollHeight>display.clientHeight+1)violations.push('ACCOUNT_DISPLAY_CLIPPED_'+di);
                if(display.left<-1||display.right>layout.viewportWidth+1)violations.push('ACCOUNT_DISPLAY_OFFSCREEN_'+di);
              }
              if(id==='J135'&&!layout.accountDisplays.some(display=>display.text==='法人税、住民税及び事業税'))violations.push('LONGEST_ACCOUNT_NOT_FULLY_RENDERED');
              if(id==='J101'&&!layout.amountValues.some(value=>String(value).replace(/,/g,'')==='3020000'))violations.push('MAX_AMOUNT_NOT_RENDERED');
              let targeting=null;
              if(id==='J001'){
                targeting=await page.evaluate(async()=>{const inputs=[...document.querySelectorAll('.journal-row .amount-input:not(:disabled)')];if(inputs.length<2)return {error:'MISSING_AMOUNT_INPUTS'};inputs[0].focus();await new Promise(r=>requestAnimationFrame(r));const selected=document.querySelector('.amount-input.calculator-selected');return {selectedAfterFocusIndex:selected?inputs.indexOf(selected):-1};});
                if(targeting.error)violations.push(targeting.error);if(targeting.selectedAfterFocusIndex!==-1)violations.push('READONLY_FOCUS_SELECTED_BEFORE_CLICK');
                const inputs=page.locator('.journal-row .amount-input:not(:disabled)');
                await inputs.nth(0).tap();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
                const debitSelected=await page.evaluate(()=>{const all=[...document.querySelectorAll('.journal-row .amount-input:not(:disabled)')],selected=document.querySelector('.amount-input.calculator-selected');return {index:all.indexOf(selected),targetIsSelected:window.__targetController.calculatorTarget===selected};});
                if(debitSelected.index!==0||!debitSelected.targetIsSelected)violations.push('DEBIT_TAP_WRONG_TARGET_'+debitSelected.index);
                await inputs.nth(1).tap();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
                const creditSelected=await page.evaluate(()=>{const all=[...document.querySelectorAll('.journal-row .amount-input:not(:disabled)')],selected=document.querySelector('.amount-input.calculator-selected');return {index:all.indexOf(selected),targetIsSelected:window.__targetController.calculatorTarget===selected,count:document.querySelectorAll('.amount-input.calculator-selected').length};});
                if(creditSelected.index!==1||!creditSelected.targetIsSelected||creditSelected.count!==1)violations.push('CREDIT_TAP_WRONG_TARGET_'+creditSelected.index+'_COUNT_'+creditSelected.count);
                targeting={...targeting,debitSelected,creditSelected};
              }
              evidence.reports.push({browser:browserName,width,id,label,layout,targeting,violations});if(violations.length)evidence.failures.push(browserName+'/'+width+'/'+id+': '+violations.join(','));
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});await page.screenshot({path:path.join(OUTPUT,browserName,id+'-'+width+'.png'),fullPage:true});write();
            }
          }finally{await context.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));evidence.status='PASS';write();console.log('JOURNAL_MOBILE_INPUT_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
