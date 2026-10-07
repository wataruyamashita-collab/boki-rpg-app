'use strict';
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUTPUT=path.join(ROOT,'artifacts','journal-explanation-ticket');
const engines={chromium,webkit},widths=[320,375,390,430],cases=['J001','J128','J101','J051','J135'];
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
            for(const id of cases){
              await page.evaluate(id=>{
                document.getElementById('journal-explanation-ticket-host')?.remove();
                const host=document.createElement('section');host.id='journal-explanation-ticket-host';
                const view=new window.AppView(document),question=window.QuestionData[id];
                host.append(view.journalTable(question.answer));document.body.append(host);
              },id);
              const report=await page.evaluate(id=>{
                const host=document.getElementById('journal-explanation-ticket-host'),ticket=host.querySelector('.journal-review-mobile'),table=host.querySelector('.journal-table'),header=ticket?.querySelector('.journal-review-header'),rows=[...(ticket?.querySelectorAll('.journal-review-row')||[])],rect=e=>e?.getBoundingClientRect();
                const visible=e=>e&&getComputedStyle(e).display!=='none'&&rect(e).width>0&&rect(e).height>0;
                const headerLabels=[...(header?.children||[])].map(cell=>cell.textContent);
                const rowReports=rows.map(row=>({cellCount:row.children.length,cells:[...row.children].map(cell=>{const r=rect(cell);return{text:cell.textContent,width:r.width,height:r.height,clientWidth:cell.clientWidth,scrollWidth:cell.scrollWidth,clientHeight:cell.clientHeight,scrollHeight:cell.scrollHeight};})}));
                return{id,ticketVisible:visible(ticket),desktopTableVisible:visible(table),headerLabels,rowReports,hostClientWidth:host.clientWidth,hostScrollWidth:host.scrollWidth,bodyOverflow:document.documentElement.scrollWidth>innerWidth+1||document.body.scrollWidth>innerWidth+1};
              },id);
              const violations=[];
              if(!report.ticketVisible)violations.push('TICKET_NOT_VISIBLE');
              if(report.desktopTableVisible)violations.push('DESKTOP_TABLE_VISIBLE_ON_MOBILE');
              if(JSON.stringify(report.headerLabels)!==JSON.stringify(['借方科目','借方金額','貸方科目','貸方金額']))violations.push('HEADER_ORDER');
              if(report.hostScrollWidth>report.hostClientWidth+1||report.bodyOverflow)violations.push('HORIZONTAL_SCROLL');
              for(const [ri,row] of report.rowReports.entries()){
                if(row.cellCount!==4)violations.push('ROW_'+ri+'_CELL_COUNT_'+row.cellCount);
                for(const [ci,cell] of row.cells.entries()){
                  if(Math.abs(cell.height-44)>1)violations.push('ROW_'+ri+'_CELL_'+ci+'_HEIGHT_'+cell.height);
                  if(cell.scrollWidth>cell.clientWidth+1||cell.scrollHeight>cell.clientHeight+1)violations.push('ROW_'+ri+'_CELL_'+ci+'_CLIPPED');
                }
              }
              if(id==='J135'&&!report.rowReports.some(row=>row.cells.some(cell=>cell.text==='法人税、住民税及び事業税')))violations.push('LONGEST_ACCOUNT_MISSING');
              if(id==='J001'&&!report.rowReports.some(row=>row.cells.some(cell=>cell.text==='3,000,000')))violations.push('MAX_AMOUNT_MISSING');
              if(id==='J101'&&!report.rowReports.some(row=>row.cells.some(cell=>cell.text==='3,020,000')))violations.push('MAX_AMOUNT_MISSING');
              if(id==='J128'){
                const structuralRows=report.rowReports.slice(1);
                if(structuralRows.some(row=>row.cells[0]?.text!==''||row.cells[1]?.text!==''))violations.push('STRUCTURAL_BLANK_MARKER');
                if(report.rowReports.some(row=>row.cells.some(cell=>cell.text==='（未入力）')))violations.push('FALSE_MISSING_LABEL');
              }
              evidence.reports.push({browser:browserName,width,...report,violations});
              if(violations.length)evidence.failures.push(browserName+'/'+width+'/'+id+':'+violations.join(','));
              fs.mkdirSync(path.join(OUTPUT,browserName),{recursive:true});await page.screenshot({path:path.join(OUTPUT,browserName,id+'-'+width+'.png'),fullPage:true});write();
            }
          }finally{await context.close();}
        }
      }finally{await browser.close();}
    }
    if(evidence.failures.length)throw new Error(evidence.failures.join('\n'));
    evidence.status='PASS';write();console.log('JOURNAL_EXPLANATION_TICKET_PASS');
  }catch(error){evidence.status='FAIL';evidence.error=error.message;write();throw error;}finally{await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
