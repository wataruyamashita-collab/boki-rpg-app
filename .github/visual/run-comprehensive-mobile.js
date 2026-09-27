'use strict';
const fs=require('fs');
const http=require('http');
const path=require('path');
const {chromium,webkit}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','comprehensive-mobile');
const engines={chromium,webkit};
const widths=[320,375,390,430];
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
const close=(a,b,t=1.5)=>Math.abs(a-b)<=t;

async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+server.address().port+'/';
  write();
  try{
    for(const [browserName,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of widths){
          const page=await browser.newPage({viewport:{width,height:844}});
          try{
            await page.goto(url,{waitUntil:'load'});
            await page.evaluate(()=>new window.AppView(document).renderQuestion(window.QuestionData.C001,{},'training'));
            await page.waitForTimeout(25);
            const metrics=await page.evaluate(()=>{
              const rect=e=>e.getBoundingClientRect();
              const materials=document.querySelector('#question-materials');
              const flow=document.querySelector('.comprehensive-material-flow');
              const cards=[...(flow?.querySelectorAll('.comprehensive-material-card')||[])];
              const fields=[...(flow?.querySelectorAll('.comprehensive-material-field')||[])];
              const adjustmentItems=[...(flow?.querySelectorAll('.comprehensive-adjustment-list li')||[])];
              const titles=cards.map(card=>card.querySelector('h4')?.textContent||'');
              const fieldLabels=fields.map(field=>field.querySelector('strong')?.textContent||'');
              const answerWrap=document.querySelector('#table-container');
              const answerTable=document.querySelector('.answer-table[data-question-type="comprehensive"]');
              const rows=[...(answerTable?.tBodies?.[0]?.rows||[])].map(row=>{
                const item=row.cells[0],amount=row.cells[1],input=amount?.querySelector('.table-input[data-input-type="amount"]');
                const style=amount?getComputedStyle(amount):null;
                const contentWidth=amount?amount.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight):0;
                return {
                  itemWidth:item?rect(item).width:0,
                  amountWidth:amount?rect(amount).width:0,
                  inputWidth:input?rect(input).width:0,
                  inputHeight:input?rect(input).height:0,
                  amountContentWidth:contentWidth
                };
              });
              return {
                materials:{
                  clientWidth:materials?.clientWidth||0,
                  scrollWidth:materials?.scrollWidth||0,
                  flowWidth:flow?rect(flow).width:0,
                  cardCount:cards.length,
                  titles,fieldLabels,
                  adjustmentCount:adjustmentItems.length,
                  cardOverflow:cards.some(card=>card.scrollWidth>card.clientWidth+1),
                  fieldOverflow:fields.some(field=>field.scrollWidth>field.clientWidth+1),
                  legacyTablePresent:Boolean(materials?.querySelector('.materials-table'))
                },
                answer:{
                  wrapClientWidth:answerWrap?.clientWidth||0,
                  wrapScrollWidth:answerWrap?.scrollWidth||0,
                  tableWidth:answerTable?rect(answerTable).width:0
                },
                rows
              };
            });
            const violations=[];
            if(metrics.materials.scrollWidth>metrics.materials.clientWidth+1||metrics.materials.flowWidth>metrics.materials.clientWidth+1.5)violations.push('MATERIALS_HORIZONTAL_SCROLL');
            if(metrics.materials.cardOverflow||metrics.materials.fieldOverflow)violations.push('MATERIAL_CARD_OVERFLOW');
            if(metrics.materials.legacyTablePresent)violations.push('LEGACY_MATERIAL_TABLE_PRESENT');
            if(metrics.materials.cardCount!==3)violations.push('MATERIAL_CARD_COUNT');
            if(JSON.stringify(metrics.materials.titles)!==JSON.stringify(['会計期間','整理前残高試算表','決算整理事項']))violations.push('MATERIAL_TITLES');
            for(const label of ['内容','借方','貸方','借方合計','貸方合計'])if(!metrics.materials.fieldLabels.includes(label))violations.push('MISSING_FIELD_'+label);
            if(metrics.materials.adjustmentCount!==9)violations.push('ADJUSTMENT_COUNT');
            if(metrics.answer.wrapScrollWidth>metrics.answer.wrapClientWidth+1||metrics.answer.tableWidth>metrics.answer.wrapClientWidth+1.5)violations.push('ANSWER_HORIZONTAL_SCROLL');
            if(metrics.rows.length!==10)violations.push('ANSWER_ROW_COUNT');
            if(metrics.rows.some(row=>!close(row.inputWidth,row.amountContentWidth,2)))violations.push('INPUT_CELL_WIDTH_MISMATCH');
            if(metrics.rows.some(row=>Math.abs(row.inputHeight-44)>1))violations.push('INPUT_HEIGHT_MISMATCH');
            const itemWidths=metrics.rows.map(row=>row.itemWidth),amountWidths=metrics.rows.map(row=>row.amountWidth),inputWidths=metrics.rows.map(row=>row.inputWidth);
            if(itemWidths.length&&(Math.max(...itemWidths)-Math.min(...itemWidths)>1.5||Math.max(...amountWidths)-Math.min(...amountWidths)>1.5||Math.max(...inputWidths)-Math.min(...inputWidths)>1.5))violations.push('ROW_COLUMN_WIDTH_MISMATCH');
            const report={browser:browserName,width,...metrics,violations};
            evidence.reports.push(report);
            if(violations.length)evidence.failures.push(browserName+'/'+width+': '+violations.join(','));
            fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});
            await page.screenshot({path:path.join(OUTPUT,browserName,'C001-'+width+'.png'),fullPage:true});
            write();
          }finally{await page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('COMPREHENSIVE_MOBILE_VISUAL_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}
  finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
