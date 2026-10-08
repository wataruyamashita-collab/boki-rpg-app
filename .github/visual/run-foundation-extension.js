'use strict';
const fs=require('fs'),http=require('http'),path=require('path'),cp=require('child_process'),assert=require('assert'),crypto=require('crypto');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'artifacts/foundation-extension');
const fixtures=require('../../tests/fixtures/foundation-extension-cases');
const widths=[320,390,768],engines={chromium,webkit},prefix='foundation-ext:browser:';
const keys=['boki-rpg-progress-v2','boki-rpg-character-v1'];
const explanationRequirements={
  equipment:['備品','現金','100,000円','貸借差額は0円'],
  fx:['USD1,000×150円＝150,000円','普通預金149,000円','支払手数料1,000円','売掛金140,000円','為替差益10,000円'],
  cost:['120,000＋80,000＋40,001＝240,001円','1,200.005円/個','1,200.01円/個','240,002円','1円多い'],
  npvPositive:['54,546円','49,584円','104,130円','104,130－100,000＝4,130円'],
  npvNegative:['54,546円','49,584円','104,130円','104,130－110,000＝-5,870円'],
  npvZero:['54,546円','49,584円','104,130円','104,130－104,130＝0円'],
  accrual:['発生主義','当月','支払前でも当月の費用','現金主義なら支払った翌月']
};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
const git=(...args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
// HEAD^{tree} is the committed baseline, not proof of an uncommitted candidate.
// Seed runner inputs, then record every actual local HTTP response body below.
const sourceFiles={
  browserRunner:'.github/visual/run-foundation-extension.js',
  adapter:'tests/helpers/foundation-extension-adapter.js',
  contract:'tests/foundation-extension-contract.test.js',
  fixtures:'tests/fixtures/foundation-extension-cases.js',
  controller:'js/controller.js',
  calculator:'js/calculator.js',
  entrypoint:'index.html'
};
function recordSourceBlob(records,file,bytes){
  const sha=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const previous=Object.values(records).find(source=>source.path===file);
  if(previous)assert.strictEqual(sha,previous.sha,'Source changed during browser run: '+file);
  else records[file]={path:file,sha};
  return bytes;
}
const evidence={
  status:'RUNNING',
  testedHead:git('rev-parse','HEAD'),
  testedTree:git('rev-parse','HEAD^{tree}'),
  testedTreeMeaning:'HEAD committed baseline; testedSourceBlobs records runner inputs and every served local dependency from actual bytes',
  testedSourceBlobs:Object.fromEntries(Object.entries(sourceFiles).map(([label,file])=>[label,{path:file,sha:git('hash-object','--no-filters',file)}])),
  fixtureSha256:hash('tests/fixtures/foundation-extension-cases.js'),
  adapterSha256:hash('tests/helpers/foundation-extension-adapter.js'),
  reports:[]
};
fs.mkdirSync(OUT,{recursive:true});
const write=()=>fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
const bootstrap=`<script src="/tests/fixtures/foundation-extension-cases.js"></script><script src="/tests/helpers/foundation-extension-adapter.js"></script><script>
const requested=new URL(location.href).searchParams.get('fixture');
const reviewRoute=new URL(location.href).searchParams.get('mode')==='review';
if(!Object.hasOwn(FoundationExtensionCases,requested))throw new Error('Unknown fixture');
const rawFixtureStorage=window.localStorage;
const extensionController=new FoundationExtensionAdapter.ExtensionController(document,FoundationExtensionAdapter.catalog(FoundationExtensionCases),rawFixtureStorage,'${prefix}');
window.extensionController=extensionController;
extensionController.model.state.placement ||= {completed:true,foundation:0,closing:0,startQuestionId:FoundationExtensionCases[requested].id,completedAt:1};
extensionController.model.state.mode=reviewRoute?'review':'training';
extensionController.bindEvents();extensionController.view.updateRpg(extensionController.rpg);
let startId=FoundationExtensionCases[requested].id;
if(extensionController.model.state.mode==='review'){
  const dueIds=extensionController.reviewIds();
  startId=dueIds[0]||null;
  if(!startId){
    extensionController.currentId=null;extensionController.reviewSourceId=null;
    // This isolated catalog has no full Story/Exam pools. Render the empty
    // due-review list without invoking the unrelated full-catalog renderer.
    document.getElementById('review-list').replaceChildren();
    extensionController.view.show('view-review');
  }
}
if(startId)extensionController.start(startId);
</script>`;
const html=recordSourceBlob(evidence.testedSourceBlobs,'index.html',fs.readFileSync(path.join(ROOT,'index.html'))).toString('utf8').replace(/<script src="js\/app\.js[^"]*"><\/script>/u,'').replace('</body>',bootstrap+'</body>');
evidence.servedHtmlSha256=crypto.createHash('sha256').update(html).digest('hex');
assert(!html.includes('src="js/app.js'),'Original application must not also bootstrap');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};
let sourceError=null;
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/foundation-extension.html'){res.setHeader('content-type','text/html');return res.end(html);}
  const file=path.resolve(ROOT,pathname.slice(1));
  if(!/^\/(?:js|data|css|icons|tests\/fixtures|tests\/helpers)\//u.test(pathname)||!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  try{
    const bytes=recordSourceBlob(evidence.testedSourceBlobs,path.relative(ROOT,file),fs.readFileSync(file));
    res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(bytes);
  }catch(error){sourceError=error;res.writeHead(500);res.end('Source changed during browser run');}
});
async function amount(page,selector,expression,equals=true){
  const field=page.locator(selector);if(page.viewportSize().width<500)await field.tap();else await field.click();
  assert(await field.evaluate(el=>window.extensionController.calculatorTarget===el),'Wrong calculator target');
  if(!await page.locator('.calculator').evaluate(el=>el.open))await page.locator('.calculator > summary').click();
  for(const key of ['AC',...String(expression),...(equals?['＝']:[])])await page.locator(`[data-action="calc"][data-calc="${key}"]`).click();
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
          const exactProbe=await page.evaluate(()=>({
            large:FoundationExtensionAdapter.roundHalfUp(FoundationExtensionAdapter.evaluateDecimalExpression('115308668+0.005'),2),
            division:FoundationExtensionAdapter.evaluateDecimalExpression('240001/200'),
            signed:FoundationExtensionAdapter.evaluateDecimalExpression('0-5870'),
            grouped:FoundationExtensionAdapter.evaluateDecimalExpression('(1.005+1.67)*2')
          }));
          assert.deepStrictEqual(exactProbe,{large:'115308668.01',division:'1200.005',signed:'-5870',grouped:'5.35'});
          const decimalSelector=key==='cost'?'[data-cell-id="unitCost"]':key.startsWith('npv')?'[data-cell-id="npv"]':null;
          if(decimalSelector){
            for(const equals of [true,false]){
              await amount(page,decimalSelector,'1.',equals);
              if(equals)assert.strictEqual(await page.evaluate(()=>extensionController.expression),'1','Operator-free equals must normalize a trailing decimal');
              assert.strictEqual(await page.locator(decimalSelector).inputValue(),key==='cost'?'1.00':'1','Trailing decimal must insert with or without equals');
              await page.evaluate(id=>extensionController.start(id,{fresh:true}),q.id);
              assert.strictEqual(await page.locator(decimalSelector).inputValue(),'','Trailing-decimal probe must not affect the graded answer');
            }
          }
          if(key==='cost'){
            await amount(page,'[data-cell-id="unitCost"]','1.＋2.');
            assert.strictEqual(await page.locator('[data-cell-id="unitCost"]').inputValue(),'3.00','Trailing decimal keys must remain usable across operators and equals');
            await page.evaluate(id=>extensionController.start(id,{fresh:true}),q.id);
            await amount(page,'[data-cell-id="unitCost"]','115308668＋0.005');
            assert.strictEqual(await page.locator('[data-cell-id="unitCost"]').inputValue(),'115,308,668.01');
            await page.evaluate(id=>extensionController.start(id,{fresh:true}),q.id);
          }
          if(key==='equipment'){
            // Exercise the ordinary, unmarked Grade-3 calculator with real clicks.
            // A decimal-only extension override must not break the inherited 10 / 3 path.
            const ordinaryField=page.locator('.debit-amount').first();
            if(width<500)await ordinaryField.tap();else await ordinaryField.click();
            if(!await page.locator('.calculator').evaluate(el=>el.open))await page.locator('.calculator > summary').click();
            for(const digit of ['AC','1','0','÷','3','＝'])await page.locator(`[data-action="calc"][data-calc="${digit}"]`).click();
            assert.strictEqual(await page.evaluate(()=>extensionController.expression),'3.3333333333','Ordinary 10÷3 calculator regression');
            await page.locator('[data-action="calc-insert"]').click();
            assert.strictEqual(await ordinaryField.inputValue(),'3','Ordinary integer insertion must round like the base controller');
            await page.evaluate(id=>extensionController.start(id,{fresh:true}),q.id);
            assert.strictEqual(await page.locator('.debit-amount').first().inputValue(),'','Probe must not affect the graded answer');
          }
          await fill(page,key);
          if(key==='cost'&&width===768){const field=page.locator('[data-cell-id="unitCost"]');await field.evaluate(el=>el.setSelectionRange(2,2));await field.dispatchEvent('input');assert.strictEqual(await field.evaluate(el=>el.selectionStart),2,'Interior caret moved');}
          const draft=await inspect(page,q.id);
          assert(draft.backupValid);assert(!draft.overflow&&draft.clipCount===0);assert(draft.noOriginalApp);assert.strictEqual(draft.canonicalCount,300);
          assert.deepStrictEqual(draft.originals,keys.map(key=>'sentinel:'+key));
          if(key==='cost')assert.strictEqual(draft.stored.drafts[q.id].cells.unitCost,'1,200.01');
          if(key==='npvNegative')assert.strictEqual(draft.stored.drafts[q.id].cells.npv,'-5,870');
          await page.reload({waitUntil:'load'});const restored=await inspect(page,q.id);assert.deepStrictEqual(restored.answer,draft.answer,'Draft must survive real reload');
          if(key==='npvNegative'){
            const retained=page.locator('[data-cell-id="npv"]');if(width<500)await retained.tap();else await retained.click();
            assert.strictEqual(await page.evaluate(()=>extensionController.expression),'-5870','Reloaded signed calculator target must retain -5870');
            // Finish the retap probe through the normal UI before submitting.
            if(await page.locator('.calculator').evaluate(el=>el.open))await page.locator('.calculator > summary').click();
            assert.strictEqual(await page.locator('.calculator').evaluate(el=>el.open),false,'Close the calculator before confirming the retained answer');
          }
          await page.locator('.confirm-button').click();const result=await inspect(page,q.id);
          assert(result.score.correct);assert.strictEqual(result.stored.questionStats[q.id].correctCount,1);assert.strictEqual(result.stored.questionStats[q.id].incorrectCount,1);
          for(const text of explanationRequirements[key])assert(result.explanation.includes(text),'Missing independently required topic teaching: '+text);
          assert(!result.overflow&&result.clipCount===0);assert.deepStrictEqual(result.originals,keys.map(key=>'sentinel:'+key));
          await page.screenshot({path:path.join(OUT,`${engine}-${width}-${key}.png`),fullPage:true});
          // Time setup only; assignment and completion use the real controller/submit path.
          await page.evaluate(id=>{const c=extensionController;c.model.state.reviewSchedule[id].dueAt=Date.now()-1;c.model.state.mode='review';c.model.save();const ids=c.reviewIds();if(!ids.includes(id))throw new Error('Missing due review');c.start(id);},q.id);
          // Reload while the persisted review is still due; this exercises the actual
          // browser bootstrap and assignment restoration, not just in-memory reviewIds().
          await page.goto(url+'&mode=review',{waitUntil:'load'});
          const dueReload=await page.evaluate(id=>{
            const c=window.extensionController;
            return {
              mode:c.model.state.mode,currentId:c.currentId,reviewSourceId:c.reviewSourceId,
              assignment:c.model.state.reviewAssignments[id],due:c.reviewIds(),
              questionViewActive:document.getElementById('view-question').classList.contains('active')
            };
          },q.id);
          assert.strictEqual(dueReload.mode,'review');
          assert.strictEqual(dueReload.currentId,q.id);
          assert.strictEqual(dueReload.reviewSourceId,q.id);
          assert.strictEqual(dueReload.assignment?.status,'assigned');
          assert(dueReload.due.includes(q.id),'Persisted review must still be due after reload');
          assert(dueReload.questionViewActive,'Persisted due review must open the question view');
          await fill(page,key);await page.locator('.confirm-button').click();
          const reviewed=await inspect(page,q.id);assert(reviewed.score.correct);assert.strictEqual(reviewed.stored.reviewSchedule[q.id].stage,1);assert.strictEqual(reviewed.stored.reviewAssignments[q.id],undefined);assert(reviewed.backupValid);
          await page.goto(url+'&mode=review',{waitUntil:'load'});
          const end=await page.evaluate(({id,prefix,keys})=>{const c=extensionController,stored=JSON.parse(localStorage.getItem(prefix+c.model.key));return{
            stored,due:c.reviewIds(),currentId:c.currentId,reviewSourceId:c.reviewSourceId,
            reviewViewActive:document.getElementById('view-review').classList.contains('active'),
            reviewEntryCount:document.querySelectorAll('#review-list [data-action="start"]').length,
            originals:keys.map(key=>localStorage.getItem(key))
          };},{id:q.id,prefix,keys});
          assert.deepStrictEqual(errors,[],'Review reload must not throw while rendering an isolated fixture catalog');
          assert.strictEqual(end.stored.questionStats[q.id].correctCount,2);assert.strictEqual(end.stored.questionStats[q.id].incorrectCount,1);
          assert.deepStrictEqual(end.due,[]);assert.strictEqual(end.currentId,null);assert.strictEqual(end.reviewSourceId,null);assert(end.reviewViewActive);assert.strictEqual(end.reviewEntryCount,0);
          assert.deepStrictEqual(end.originals,keys.map(key=>'sentinel:'+key));assert.deepStrictEqual(errors,[]);
          evidence.reports.push({engine,width,key,id:q.id,blankRejected:true,draftReload:true,correct:true,topicExplanation:true,reviewCompleted:true,reviewReloadNoDue:true,reviewReloadDue:true,ordinaryCalculatorChecked:key==='equipment',trailingDecimalChecked:key==='cost',trailingDecimalEqualsAndDirectInsertChecked:Boolean(decimalSelector),canonicalUnchanged:true,overflow:false,pageErrors:errors});write();
        }finally{await context.close();}
      }}finally{await browser.close();}
    }
    assert.strictEqual(evidence.reports.length,Object.keys(engines).length*widths.length*Object.keys(fixtures).length);
    assert.ifError(sourceError);
    for(const source of Object.values(evidence.testedSourceBlobs))recordSourceBlob(evidence.testedSourceBlobs,source.path,fs.readFileSync(path.join(ROOT,source.path)));
    evidence.status='PASS';write();console.log('FOUNDATION_EXTENSION_BROWSER '+evidence.reports.length+' PASS');
  }catch(error){evidence.status='FAIL';evidence.error=String(error.stack||error);write();throw error;}
  finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
