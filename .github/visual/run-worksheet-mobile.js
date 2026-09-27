'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUTPUT=path.join(ROOT,'artifacts','worksheet-mobile');
const viewports=[320,375,390,430];
const engines={chromium,webkit};
const evidence={status:'RUNNING',reports:[],failures:[]};
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript'};
const write=()=>{fs.mkdirSync(OUTPUT,{recursive:true});fs.writeFileSync(path.join(OUTPUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'?'.github/visual/worksheet-mobile.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function measure(page,width){
  return page.evaluate(width=>{
    const qs=s=>[...document.querySelectorAll(s)];
    const rect=e=>e.getBoundingClientRect();
    const materialsWrap=document.querySelector('.materials-table-wrap');
    const materialsTable=document.querySelector('.materials-table');
    const container=document.getElementById('table-container');
    const sections=qs('.worksheet-mobile-section');
    const tables=qs('.worksheet-mobile-table');
    const inputs=qs('.worksheet-mobile-input');
    const references=qs('.worksheet-mobile-reference');
    const comparisonHost=document.getElementById('visual-answer-comparison');
    const comparisonFlow=document.querySelector('.worksheet-comparison-mobile-flow');
    const comparisonSections=qs('.worksheet-comparison-mobile-section');
    const comparisonTables=qs('.worksheet-comparison-mobile-table');
    const comparisonPairs=qs('.worksheet-comparison-mobile-table .worksheet-comparison-pair');
    const calculator=document.querySelector('.calculator');
    const selected=document.querySelector('.worksheet-mobile-input.calculator-selected');
    const form=document.getElementById('question-form');
    const calculatorRect=calculator&&calculator.open?rect(calculator):null;
    const selectedRect=selected?rect(selected):null;
    return {
      width,
      pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1||document.body.scrollWidth>window.innerWidth+1,
      questionText:document.getElementById('q-text')?.textContent||'',
      materialHeading:document.querySelector('#question-materials>h3')?.textContent||'',
      materialScroll:materialsWrap?materialsWrap.scrollWidth-materialsWrap.clientWidth:999,
      materialRight:materialsTable?rect(materialsTable).right:999,
      materialWrapRight:materialsWrap?rect(materialsWrap).right:0,
      adjustments:qs('.question-adjustments li').map(e=>e.textContent),
      containerScroll:container?container.scrollWidth-container.clientWidth:999,
      containerClass:container?.className||'',
      desktopWorksheetCount:qs('.eight-column-worksheet').length,
      sectionTitles:sections.map(e=>e.dataset.worksheetGroup),
      sectionCount:sections.length,
      tableCount:tables.length,
      tableFit:tables.every(table=>{const section=table.closest('.worksheet-mobile-section');return rect(table).left>=rect(section).left-1&&rect(table).right<=rect(section).right+1;}),
      inputCount:inputs.length,
      inputFit:inputs.every(input=>{const cell=input.closest('td');return rect(input).left>=rect(cell).left-1&&rect(input).right<=rect(cell).right+1&&parseFloat(getComputedStyle(input).fontSize)>=16;}),
      inputIds:inputs.map(e=>e.dataset.cellId),
      referenceCount:references.length,
      referenceLabels:references.map(e=>e.querySelector('strong')?.textContent||''),
      referenceTexts:references.map(e=>e.querySelector('p')?.textContent||''),
      comparisonHostScroll:comparisonHost?comparisonHost.scrollWidth-comparisonHost.clientWidth:999,
      comparisonFlowPresent:Boolean(comparisonFlow),
      desktopComparisonCount:qs('.worksheet-answer-comparison').length,
      comparisonSectionCount:comparisonSections.length,
      comparisonSectionTitles:comparisonSections.map(e=>e.dataset.worksheetComparisonGroup),
      comparisonTableCount:comparisonTables.length,
      comparisonTableFit:comparisonTables.every(table=>{const section=table.closest('.worksheet-comparison-mobile-section');return rect(table).left>=rect(section).left-1&&rect(table).right<=rect(section).right+1;}),
      comparisonPairFit:comparisonPairs.every(pair=>{const cell=pair.closest('td');return rect(pair).left>=rect(cell).left-1&&rect(pair).right<=rect(cell).right+1;}),
      calculatorOpen:Boolean(calculator?.open),
      calculatorDocked:Boolean(calculator?.classList.contains('calculator-mobile-dock')),
      calculatorPosition:calculator?getComputedStyle(calculator).position:'',
      calculatorBottom:calculator?getComputedStyle(calculator).bottom:'',
      formDockActive:Boolean(form?.classList.contains('calculator-dock-active')),
      formPaddingBottom:form?parseFloat(getComputedStyle(form).paddingBottom)||0:0,
      selectedVisibleAboveDock:Boolean(selectedRect&&calculatorRect&&selectedRect.bottom<=calculatorRect.top+1),
      selectedScrollY:selectedRect?.top||0
    };
  },width);
}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port+'/.github/visual/worksheet-mobile.html';
  write();
  try{
    for(const[name,launcher]of Object.entries(engines)){
      const browser=await launcher.launch();
      try{
        for(const width of viewports){
          const page=await browser.newPage({viewport:{width,height:900}});
          const errors=[];
          page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
          try{
            await page.goto(base,{waitUntil:'load'});
            await page.waitForTimeout(80);
            const m=await measure(page,width);
            m.pageErrors=errors;
            const expectedIds=await page.evaluate(()=>window.QuestionData.D001.table.inputCells);
            const violations=[];
            if(m.pageOverflow)violations.push('PAGE_HORIZONTAL_OVERFLOW');
            if(m.materialScroll>1||m.materialRight>m.materialWrapRight+1.5)violations.push('SOURCE_TABLE_HORIZONTAL_SCROLL');
            if(m.adjustments.length!==2||!m.adjustments[0].includes('40,000円')||!m.adjustments[1].includes('60,000円'))violations.push('ADJUSTMENTS_NOT_SEPARATE');
            if(m.questionText.includes('（保険料')||!m.questionText.includes('元試算表と決算整理事項'))violations.push('QUESTION_WORDING');
            if(m.materialHeading!=='元試算表')violations.push('SOURCE_HEADING');
            if(m.containerScroll>1||!/worksheet-mobile-mode/.test(m.containerClass))violations.push('WORKSHEET_CONTAINER_SCROLL');
            if(m.desktopWorksheetCount!==0)violations.push('DESKTOP_WORKSHEET_RENDERED_ON_MOBILE');
            if(m.sectionCount!==4||m.tableCount!==4||JSON.stringify(m.sectionTitles)!==JSON.stringify(['試算表','修正記入','損益計算書','貸借対照表']))violations.push('WORKSHEET_STEP_STRUCTURE');
            if(!m.tableFit)violations.push('WORKSHEET_TABLE_OVERFLOW');
            if(!m.inputFit)violations.push('WORKSHEET_INPUT_OVERFLOW');
            if(m.inputCount!==expectedIds.length||JSON.stringify([...m.inputIds].sort())!==JSON.stringify([...expectedIds].sort()))violations.push('WORKSHEET_INPUT_IDENTITY');
            if(m.referenceCount!==4||m.referenceLabels.some(label=>label!=='ここを見る'))violations.push('WORKSHEET_REFERENCE_CUES');
            if(!m.referenceTexts[0]?.includes('元試算表')||!m.referenceTexts[1]?.includes('決算整理事項')||!m.referenceTexts[2]?.includes('売上・仕入・保険料')||!m.referenceTexts[3]?.includes('損益計算書の貸借差額'))violations.push('WORKSHEET_REFERENCE_CONTENT');
            if(m.comparisonHostScroll>1||!m.comparisonFlowPresent||m.desktopComparisonCount!==0)violations.push('EXPLANATION_COMPARISON_HORIZONTAL_SCROLL');
            if(m.comparisonSectionCount!==4||m.comparisonTableCount!==4||JSON.stringify(m.comparisonSectionTitles)!==JSON.stringify(['試算表','修正記入','損益計算書','貸借対照表']))violations.push('EXPLANATION_COMPARISON_STRUCTURE');
            if(!m.comparisonTableFit||!m.comparisonPairFit)violations.push('EXPLANATION_COMPARISON_OVERFLOW');
            if(!m.calculatorOpen||!m.calculatorDocked||m.calculatorPosition!=='fixed'||!m.formDockActive||m.formPaddingBottom<350)violations.push('WORKSHEET_CALCULATOR_DOCK');
            if(!m.selectedVisibleAboveDock)violations.push('WORKSHEET_SELECTED_INPUT_COVERED');
            if(errors.length)violations.push('PAGE_SCRIPT_ERROR');
            fs.mkdirSync(path.join(OUTPUT,name),{recursive:true});
            await page.screenshot({path:path.join(OUTPUT,name,'D001-'+width+'.png'),fullPage:true});
            evidence.reports.push({browser:name,...m,violations});
            if(violations.length)evidence.failures.push(name+'/D001/'+width+': '+violations.join(','));
            write();
          }finally{await page.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('WORKSHEET_MOBILE_VISUAL_PASS');
  }catch(error){
    evidence.status='FAIL';evidence.error=error.message;write();throw error;
  }finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
