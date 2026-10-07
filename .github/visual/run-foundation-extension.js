'use strict';
const fs=require('fs'),http=require('http'),path=require('path'),cp=require('child_process'),assert=require('assert'),crypto=require('crypto');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'artifacts/foundation-extension');
const fixtures=require('../../tests/fixtures/foundation-extension-cases');
const widths=[320,390,768],engines={chromium,webkit},prefix='foundation-ext:browser:';
const keys=['boki-rpg-progress-v2','boki-rpg-character-v1'];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
const git=(...args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
const evidence={status:'RUNNING',testedHead:git('rev-parse','HEAD'),testedTree:git('rev-parse','HEAD^{tree}'),fixtureSha256:hash('tests/fixtures/foundation-extension-cases.js'),adapterSha256:hash('tests/helpers/foundation-extension-adapter.js'),reports:[]};
fs.mkdirSync(OUT,{recursive:true});
const write=()=>fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
const bootstrap=`<script src="/tests/fixtures/foundation-extension-cases.js"></script><script src="/tests/helpers/foundation-extension-adapter.js"></script><script>
const requested=new URL(location.href).searchParams.get('fixture');
if(!Object.hasOwn(FoundationExtensionCases,requested))throw new Error('Unknown fixture');
const rawFixtureStorage=window.localStorage;
const extensionController=new FoundationExtensionAdapter.ExtensionController(document,FoundationExtensionAdapter.catalog(FoundationExtensionCases),rawFixtureStorage,'${prefix}');
window.extensionController=extensionController;
extensionController.model.state.placement ||= {completed:true,foundation:0,closing:0,startQuestionId:FoundationExtensionCases[requested].id,completedAt:1};
if(extensionController.model.state.mode!=='review')extensionController.model.state.mode='training';
extensionController.bindEvents();extensionController.view.updateRpg(extensionController.rpg);
if(extensionController.model.state.mode==='review')extensionController.reviewIds();
extensionController.start(FoundationExtensionCases[requested].id);
</script>`;
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').replace(/<script src="js\/app\.js[^"]*"><\/script>/u,'').replace('</body>',bootstrap+'</body>');
assert(!html.includes('src="js/app.js'),'Original application must not also bootstrap');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/foundation-extension.html'){res.setHeader('content-type','text/html');return res.end(html);}
  const file=path.resolve(ROOT,pathname.slice(1));
  if(!/^\/(?:js|data|css|icons|tests\/fixtures|tests\/helpers)\//u.test(pathname)||!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
async function amount(page,selector,expression){
  const field=page.locator(selector);if(page.viewportSize().width<500)await field.tap();else await field.click();
  assert(await field.evaluate(el=>window.extensionController.calculatorTarget===el),'Wrong calculator target');
  if(!await page.locator('.calculator').evaluate(el=>el.open))await page.locator('.calculator > summary').click();
  for(const key of ['AC',...String(expression),'＝'])await page.locator(`[data-action="calc"][data-calc="${key}"]`).click();
  await page.locator('[data-action="calc-insert"]').click();
  assert(await field.evaluate(el=>el.checkValidity()),'Invalid inserted amount');
}
async function fill(page,key){
  const q=fixtures[key];
  if(q.type==='journal'){
    for(const side of ['debit','credit'])for(const [index,line] of q.answer[side].entries()){
      await page.locator('.'+side+'-account').nth(index).selectOption(line.account);
      await amount(page,`.${side}-amount >> nth=${index}`,String(line.amount));
    }
  }else for(const [cellId,value] of Object.entries(q.answer.cells)){
    const selector=`[data-cell-id="${cellId}"]`;
    if(typeof value==='string')await page.locator(selector).fill(value);
    else await amount(page,selector,key==='cost'&&cellId==='unitCost'?'240001÷200':String(value<0?`0−${-value}`:value));
  }
}
async function inspect(page,id){return page.evaluate(({id,prefix,keys})=>{
  const c=window.extensionController,stored=JSON.parse(localStorage.getItem(prefix+c.model.key));
  const visible=el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
  const clips=[...document.querySelectorAll('.journal-grid-scroll,#table-container,#explanation')].filter(visible).filter(el=>el.scrollWidth>el.clientWidth+1);
  return {question:document.getElementById('q-text').textContent,answer:c.view.readAnswer(c.questions[id]),stored,
    backupValid:ProgressModel.validateBackupState(stored,c.questions),score:c.learningFlow?.authoritativeScore||null,
    explanation:document.getElementById('explanation').textContent,canonicalCount:Object.keys(QuestionData).length,
    originals:keys.map(key=>localStorage.getItem(key)),noOriginalApp:typeof window.App==='undefined',
    overflow:document.documentElement.scrollWidth>innerWidth+1,clipCount:clips.length};
},{id,prefix,keys});}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));write();
  try{
    for(const [engine,launcher] of Object.entries(engines)){
      const browser=await launcher.launch();
      try{for(const width of widths)for(const [key,q] of Object.entries(fixtures)){
        const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<500});
        const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
        try{
          await page.addInitScript(keys=>{for(const key of keys)if(localStorage.getItem(key)===null)localStorage.setItem(key,'sentinel:'+key);},keys);
          const url=`http://127.0.0.1:${server.address().port}/foundation-extension.html?fixture=${key}`;
          await page.goto(url,{waitUntil:'load'});assert.strictEqual(await page.locator('#q-text').textContent(),q.question);
          assert.strictEqual(await page.locator('.journal-row').count(),q.type==='journal'?Math.max(q.answer.debit.length,q.answer.credit.length):0);
          await page.locator('.confirm-button').click();
          assert.strictEqual((await inspect(page,q.id)).score.correct,false,'Blank answer must fail');
          await page.evaluate(id=>extensionController.start(id,{fresh:true}),q.id);
          await fill(page,key);
          if(key==='cost'&&width===768){const field=page.locator('[data-cell-id="unitCost"]');await field.evaluate(el=>el.setSelectionRange(2,2));await field.dispatchEvent('input');assert.strictEqual(await field.evaluate(el=>el.selectionStart),2,'Interior caret moved');}
          const draft=await inspect(page,q.id);
          assert(draft.backupValid);assert(!draft.overflow&&draft.clipCount===0);assert(draft.noOriginalApp);assert.strictEqual(draft.canonicalCount,300);
          assert.deepStrictEqual(draft.originals,keys.map(key=>'sentinel:'+key));
          if(key==='cost')assert.strictEqual(draft.stored.drafts[q.id].cells.unitCost,'1,200.01');
          if(key==='npvNegative')assert.strictEqual(draft.stored.drafts[q.id].cells.npv,'-5,870');
          await page.reload({waitUntil:'load'});const restored=await inspect(page,q.id);assert.deepStrictEqual(restored.answer,draft.answer,'Draft must survive real reload');
          await page.locator('.confirm-button').click();const result=await inspect(page,q.id);
          assert(result.score.correct);assert.strictEqual(result.stored.questionStats[q.id].correctCount,1);assert.strictEqual(result.stored.questionStats[q.id].incorrectCount,1);
          for(const text of q.explanation.split('\n').map(line=>line.replace(/^【[^】]+】/u,'')))assert(result.explanation.includes(text),'Missing topic-specific teaching');
          assert(!result.overflow&&result.clipCount===0);assert.deepStrictEqual(result.originals,keys.map(key=>'sentinel:'+key));
          await page.screenshot({path:path.join(OUT,`${engine}-${width}-${key}.png`),fullPage:true});
          // Time setup only; assignment and completion use the real controller/submit path.
          await page.evaluate(id=>{const c=extensionController;c.model.state.reviewSchedule[id].dueAt=Date.now()-1;c.model.state.mode='review';c.model.save();const ids=c.reviewIds();if(!ids.includes(id))throw new Error('Missing due review');c.start(id);},q.id);
          const assigned=await page.evaluate(id=>extensionController.model.state.reviewAssignments[id]?.status,q.id);assert.strictEqual(assigned,'assigned');
          await fill(page,key);await page.locator('.confirm-button').click();
          const reviewed=await inspect(page,q.id);assert(reviewed.score.correct);assert.strictEqual(reviewed.stored.reviewSchedule[q.id].stage,1);assert.strictEqual(reviewed.stored.reviewAssignments[q.id],undefined);assert(reviewed.backupValid);
          await page.reload({waitUntil:'load'});const end=await inspect(page,q.id);assert.strictEqual(end.stored.questionStats[q.id].correctCount,2);assert.strictEqual(end.stored.questionStats[q.id].incorrectCount,1);assert.deepStrictEqual(end.originals,keys.map(key=>'sentinel:'+key));assert.deepStrictEqual(errors,[]);
          evidence.reports.push({engine,width,key,id:q.id,blankRejected:true,draftReload:true,correct:true,topicExplanation:true,reviewCompleted:true,reviewReload:true,canonicalUnchanged:true,overflow:false,pageErrors:errors});write();
        }finally{await context.close();}
      }}finally{await browser.close();}
    }
    assert.strictEqual(evidence.reports.length,Object.keys(engines).length*widths.length*Object.keys(fixtures).length);
    evidence.status='PASS';write();console.log('FOUNDATION_EXTENSION_BROWSER '+evidence.reports.length+' PASS');
  }catch(error){evidence.status='FAIL';evidence.error=String(error.stack||error);write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
