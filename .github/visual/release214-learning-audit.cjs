'use strict';
// Audit only: real controls and synthetic contexts, fixed product checkout.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium,webkit}=require('playwright');
const ROOT=process.env.PRODUCT_ROOT||'/workspace/work/release214/browser-product';
const OUT=process.env.AUDIT_OUTPUT||'/workspace/work/release214/evidence';
const HEAD='d4a5a7391d36e4e0771f14a1310c9ac172945b96',TREE='26abadab092fea1eaaf0c8163f34b302bb2cf6cd';
fs.mkdirSync(OUT,{recursive:true});
const git=(...args)=>cp.execFileSync('git',['-C',ROOT,...args],{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),HEAD);assert.equal(git('rev-parse','HEAD^{tree}'),TREE);assert.equal(git('diff','--name-only','HEAD'),'');
const row=(account,amount)=>({account,amount});
// Expected answers calculated separately from renderer/grader/QuestionData.
const fixtures={
 J001:{mode:'story',good:{debit:[row('現金',3000000)],credit:[row('資本金',3000000)]},wrong:{debit:[row('普通預金',3000000)],credit:[row('資本金',3000000)]},terms:['現金','資産','資本金','純資産','3,000,000','借方','貸方'],differences:1},
 J006:{mode:'story',good:{debit:[row('仕入',206000)],credit:[row('買掛金',200000),row('現金',6000)]},wrong:{debit:[row('仕入',200000)],credit:[row('買掛金',199000),row('現金',7000)]},terms:['仕入諸掛','取得原価','206,000','買掛金','現金'],differences:3},
 T001:{mode:'training',good:{cells:{total_debit:1024000,total_credit:1024000}},wrong:{cells:{total_debit:1000000,total_credit:1024000}},terms:['410,000','175,000','60,000','289,000','90,000','134,000','400,000','490,000','1,024,000'],differences:1},
 L039:{mode:'training',good:{cells:{priorAccrual:9000,reversal:9000,annualPayment:18000,currentAccrual:9000,profitTransfer:18000,nextBalance:0}},wrong:{cells:{priorAccrual:9000,reversal:9000,annualPayment:18000,currentAccrual:9000,profitTransfer:27000,nextBalance:9000}},terms:['前期に費用計上済み','二重計上','−9,000 ＋ 18,000 ＋ 9,000 = 18,000','支払利息勘定の貸方','損益勘定の借方','次期繰越0円'],differences:2}
};
assert.equal(200000+6000,206000);assert.equal(410000+175000+60000+289000+90000,1024000);assert.equal(134000+400000+490000,1024000);assert.equal(600000*3/100,18000);assert.equal(18000*6/12,9000);assert.equal(-9000+18000+9000,18000);assert.equal(18000+9000-9000-18000,0);
const evidence={head:HEAD,tree:TREE,started:new Date().toISOString(),status:'RUNNING',fixtures,reports:[],failures:[],method:'Actual UI input and submit. 320/390 touch-enabled desktop viewport emulation, 1280 mouse/keyboard. Height900. Clock advances to saved dueAt only for scheduled review; no schedule mutation. Not physical-device or learner evidence.'};
const write=()=>fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(evidence,null,2));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.resolve(ROOT,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
function diff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return [];if(a&&b&&typeof a==='object'&&typeof b==='object')return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p?p+'.'+k:k));return [p];}
async function snapshot(page){return page.evaluate(()=>({model:structuredClone(App.controller.model.state),rpg:structuredClone(App.controller.rpg.state),storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))}));}
function protectedState(s){const m=structuredClone(s.model);for(const k of ['mode','currentQuestionId','drafts','reviewAssignments','learningEvidenceIntegrity'])delete m[k];return {model:m,rpg:s.rpg};}
async function layout(page){return page.evaluate(()=>{const box=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,documentY:r.y+scrollY,width:r.width,height:r.height};};return {scrollY,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,focus:{id:document.activeElement.id,tag:document.activeElement.tagName,label:document.activeElement.getAttribute('aria-label')},regions:Object.fromEntries(['q-text','journal-container','table-container','result-status','result-error-summary','answer-comparison','explanation','standard-result-actions','review-list'].map(id=>[id,box(document.getElementById(id))])),horizontal:[...document.querySelectorAll('#view-question *,#view-result *')].filter(n=>n.getBoundingClientRect().height&&n.scrollWidth>n.clientWidth+2&&['auto','scroll'].includes(getComputedStyle(n).overflowX)).map(n=>({tag:n.tagName,id:n.id,class:n.className,overflow:n.scrollWidth-n.clientWidth}))};});}
async function formA(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('boki-independent-transfer',1);r.onupgradeneeded=()=>r.result.createObjectStore('assessment');r.onerror=()=>reject(String(r.error));r.onsuccess=()=>{const db=r.result,t=db.transaction('assessment'),q=t.objectStore('assessment').get('voucher-transfer-l050');q.onsuccess=()=>{resolve(q.result??null);db.close();};};}));}
async function audit(browser,engine,width,id){
 const f=fixtures[id],context=await browser.newContext({viewport:{width,height:900},hasTouch:width<500,serviceWorkers:'allow'}),page=await context.newPage();page.setDefaultTimeout(12000);
 const r={engine,browserVersion:browser.version(),width,id,status:'RUNNING',steps:[],states:{},layouts:{},deltas:{},screenshots:[]},errors=[];evidence.reports.push(r);page.on('pageerror',e=>errors.push(String(e)));
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 const step=async(label,fn)=>{const before=await page.evaluate(()=>({scrollY,view:[...document.querySelectorAll('.view')].find(n=>n.getBoundingClientRect().height)?.id}));const detail=await fn();const after=await page.evaluate(()=>({scrollY,view:[...document.querySelectorAll('.view')].find(n=>n.getBoundingClientRect().height)?.id,focus:document.activeElement.id||document.activeElement.getAttribute('aria-label')||document.activeElement.tagName}));r.steps.push({n:r.steps.length+1,label,before,after,detail});};
 const click=async(selector,label)=>step(label||selector,()=>page.locator(selector).click());
 const shot=async(name)=>{const file=`${engine}-${width}-${id}-${name}.png`;await page.screenshot({path:path.join(OUT,file),fullPage:true});r.screenshots.push(file);};
 const amount=async(loc,value,label)=>{if(await loc.isDisabled()){assert.equal(Number((await loc.inputValue()).replaceAll(',','')),value);return;}
  if(await loc.getAttribute('readonly')!==null){await step('金額欄 '+label,()=>loc.click());await click('[data-calc="AC"]','電卓 AC');for(const digit of String(value))await click(`[data-calc="${digit}"]`,'電卓 '+digit);await click('[data-action="calc-insert"]','表示中の金額を反映');}
  else await step('金額入力 '+label,()=>loc.fill(String(value)));assert.equal(Number((await loc.inputValue()).replaceAll(',','')),value);};
 const fill=async(answer)=>{if(answer.cells){for(const [k,v]of Object.entries(answer.cells))await amount(page.locator(`.table-input[data-cell-id="${k}"]:visible`).first(),v,k);}
  else for(const side of ['debit','credit'])for(let i=0;i<answer[side].length;i++){const a=page.locator('.'+side+'-account').nth(i);if(!await a.isDisabled())await step('科目選択 '+side+i,()=>a.selectOption(answer[side][i].account));await amount(page.locator('.'+side+'-amount').nth(i),answer[side][i].amount,side+i);}};
 const checkpoint=async(name)=>{r.states[name]=await snapshot(page);r.layouts[name]=await layout(page);assert(r.layouts[name].documentWidth<=width+1,'page overflow '+name);};
 try{
  // Create genuine isolated Form A evidence using its public controls; preserve it throughout RPG.
  await page.goto(base+'/form-a.html');await click('#start','Form A 合成初回開始');r.formABefore=await formA(page);
  await page.goto(base+'/?mode='+f.mode);await page.waitForFunction(()=>window.App?.controller);
  if(await page.locator('[data-action="placement-skip"]').isVisible())await click('[data-action="placement-skip"]','任意診断をスキップ');
  await click(`.mode-nav [data-action="mode"][data-mode="${f.mode}"]`,f.mode+'一覧');
  if(f.mode==='story')await click('#view-story details > summary','問題を選んで学ぶ');
  await click('#question-filters > summary','問題を検索・絞り込む');await step('ID検索 '+id,()=>page.locator('#filter-query').fill(id));
  if(id==='L039'){
   r.entryContract='L039 is exam-only, absent from ordinary Training. Synthetic prerequisite answers and examAttempt selection prepare the real 15-question Exam route; no product membership is changed.';
   assert.equal(await page.locator('#training-list [data-question-id="L039"]').count(),0);
   r.examFixture=await page.evaluate(()=>{const c=App.controller;c.showMode('story');const prerequisites=c.examPrerequisiteIds();for(const qid of prerequisites){c.start(qid,{fresh:true});c.view.applyRetryDraft(c.questions[qid],c.questions[qid].answer);document.getElementById('question-form').requestSubmit();}let attempt=0;for(;attempt<100;attempt++){c.model.state.examAttempt=attempt;if(c.buildExamIds().includes('L039'))break;}if(attempt===100)throw new Error('no L039 exam fixture');c.model.refreshEvidenceIntegrity();c.model.save();return {prerequisites,attempt,ids:c.buildExamIds()};});
   await click('.mode-nav [data-action="mode"][data-mode="exam"]','総合演習模試');await click('#exam-list [data-question-id="L039"]','模試 L039開始');
  }else await click(`#${f.mode}-list [data-question-id="${id}"]`,id+'開始');
  await page.locator('#view-question').waitFor({state:'visible'});
  r.problem=await page.evaluate(id=>structuredClone(QuestionData[id]),id);assert.deepEqual(r.problem.answer,f.good,'independent answer');assert.equal(await page.evaluate(()=>Object.keys(QuestionData).length),300);
  await checkpoint('beforeInput');await shot('question');await fill(f.wrong);await checkpoint('beforeSubmit');
  await click('#question-form button[type="submit"]','回答を確定する');
  if(id==='L039'){
   await checkpoint('examWrongSubmitted');assert(await page.locator('#view-result').isHidden(),'no exam answer leak');
   r.otherExamAnswers=await page.evaluate(()=>{const c=App.controller,ids=c.unansweredExamIds();for(const qid of ids){c.start(qid);c.view.applyRetryDraft(c.questions[qid],c.questions[qid].answer);document.getElementById('question-form').requestSubmit();}return ids;});
   await click('[data-action="finish-exam"]','試験を終了して採点');await click('#app-notice-confirm','採点する');await page.locator('#view-result').waitFor({state:'visible'});await checkpoint('examResult');
   const detail=page.locator('#explanation > details').filter({hasText:'支払利息勘定（複数年度・再振替）'});assert.equal(await detail.count(),1);
   const summary=detail.locator('summary');const n0=r.steps.length;
   await step('TabでL039問題別レビューへ',async()=>{await page.locator('#result-status').focus();let n=0;while(!await summary.evaluate(n=>n===document.activeElement)&&n++<100)await page.keyboard.press('Tab');assert(n<=100);return {tabPresses:n};});await step('EnterでL039問題別レビューを開く',()=>page.keyboard.press('Enter'));
   r.examExplanation=await detail.innerText();r.examExplanationActivations=1;r.examExplanationNavigationActions=r.steps.length-n0;
   const normalize=s=>s.replace(/\s/g,'').replaceAll('−','-').replaceAll('＝','=');for(const term of ['前期に費用計上済み','二重計上','−9,000＋18,000＋9,000＝18,000','支払利息は費用勘定なので貸方に損益18,000円','損益勘定の借方','次期繰越0円'])assert(normalize(r.examExplanation).includes(normalize(term)),'exam L039 '+term);
   for(const value of ['27,000','18,000','9,000','0'])assert(r.examExplanation.includes(value));
   await checkpoint('examExplanationRead');assert.deepEqual(r.states.examResult,r.states.examExplanationRead,'exam explanation inert');await shot('exam-explanation');
   const due=r.states.examResult.model.reviewSchedule.L039.dueAt;r.examToReviewDelayMs=due-r.states.examResult.model.lastExamReview.finishedAt;
   await click('[data-action="exam-review"]','結果を復習する');r.examImmediateReviewCount=await page.locator('#review-list button').count();r.examImmediateReviewText=await page.locator('#view-review').innerText();assert.equal(r.examImmediateReviewCount,0);
   await page.clock.setFixedTime(new Date(due+1000));await click('.mode-nav [data-action="mode"][data-mode="review"]','期限後に復習一覧');await click('#review-list [data-question-id="L039"]','L039復習開始');await page.locator('#view-question').waitFor({state:'visible'});await checkpoint('examReviewQuestion');
   assert.deepEqual(protectedState(r.states.examResult),protectedState(r.states.examReviewQuestion),'exam review navigation authority');
   await fill(f.wrong);await click('#question-form button[type="submit"]','復習で誤答を確定');
  }
  await page.locator('#view-result').waitFor({state:'visible'});await checkpoint('wrong');await shot('wrong');
  assert.equal(await page.locator('.result-headline').innerText(),'もう一歩です');assert.equal(r.layouts.wrong.focus.id,'result-status');
  r.differences=await page.locator('#result-error-summary li').allTextContents();assert.equal(r.differences.length,f.differences);
  r.explanationInitial=await page.locator('#explanation').innerText();for(const term of f.terms)assert(r.explanationInitial.includes(term),id+' missing '+term);
  const resultStep=r.steps.length;
  await step('解説までスクロール',()=>page.locator('#explanation').scrollIntoViewIfNeeded());r.layouts.explanation=await layout(page);r.explanationNavigationActions=r.steps.length-resultStep;r.explanationActivations=0;
  r.supplements=[];const summaries=page.locator('#explanation details.explanation-supplement > summary');
  for(let i=0;i<await summaries.count();i++){const s=summaries.nth(i),label=await s.innerText();await step('Tabで補足へ '+label,async()=>{if(i===0)await page.locator('#result-status').focus();let n=0;while(!await s.evaluate(n=>n===document.activeElement)&&n++<80)await page.keyboard.press('Tab');assert(n<=80,'keyboard disclosure reachable');return {tabPresses:n};});await step('Enterで補足を開く',()=>page.keyboard.press('Enter'));assert(await s.evaluate(n=>n.parentElement.open));r.supplements.push({label,text:await s.locator('..').innerText(),layout:await layout(page)});await step('Spaceで補足を閉じる',()=>page.keyboard.press('Space'));assert(!await s.evaluate(n=>n.parentElement.open));}
  await checkpoint('explanationRead');assert.deepEqual(r.states.explanationRead,r.states.wrong,'display/disclosure must be storage inert');
  await step('再挑戦へTab移動',async()=>{let n=0;while(!await page.locator('#standard-result-actions [data-action="coaching-retry-result"]').evaluate(n=>n===document.activeElement)&&n++<100)await page.keyboard.press('Tab');assert(n<=100);return {tabPresses:n};});await step('Enterで再挑戦',()=>page.keyboard.press('Enter'));await page.locator('#view-question').waitFor({state:'visible'});await checkpoint('retryStarted');
  assert.deepEqual(r.states.retryStarted,r.states.wrong,'retry entry must be storage inert');r.retryInputs=await page.locator('#question-form input:visible,#question-form select:visible').evaluateAll(ns=>ns.map(n=>({label:n.getAttribute('aria-label'),cell:n.dataset.cellId,value:n.value,disabled:n.disabled,readOnly:n.readOnly})));
  await fill(f.good);await click('#question-form button[type="submit"]','練習回答を確認する');await page.locator('#view-result').waitFor({state:'visible'});await checkpoint('retryDone');await shot('retry-done');
  assert((await page.locator('#result-status').innerText()).includes('最初の回答は誤答'));
  const a=r.states.wrong,b=r.states.retryDone;assert.deepEqual(a.rpg,b.rpg,'retry XP/reward/mastery protection');
  const recoveryPrefix=`learningEffectiveness.questions.${id}.misconceptionStats.`;
  r.retryModelChanges=diff(a.model,b.model);assert(r.retryModelChanges.every(p=>p==='learningEvidenceIntegrity.signature'||(p.startsWith(recoveryPrefix)&&/\.(assistedRecoveredCount|lastAssistedRecoveredAt|assisted)$/.test(p))),'only specified assisted recovery fields may change');
  for(const k of ['answeredIds','correctIds','incorrectIds','mistakeCounts','reviewSchedule','attemptLog','learningStats','continuity'])assert.deepEqual(a.model[k],b.model[k],'retry '+k);
  assert.equal(b.model.learningEffectiveness.questions[id].observedAttempts,a.model.learningEffectiveness.questions[id].observedAttempts);assert.equal(b.model.learningEffectiveness.questions[id].firstAttempt.correct,false);r.deltas.retry=diff(a,b);
  await click('#standard-result-actions [data-action="next"]','次へ進む');await checkpoint('continued');r.continuation={view:r.steps.at(-1).after.view,id:await page.evaluate(()=>App.controller.currentId)};assert.deepEqual(protectedState(b),protectedState(r.states.continued),'continue learning authority');
  // Active ID search is explicitly reset through the existing global filter control.
  await click('.mode-nav [data-action="mode"][data-mode="review"]','復習モード');await checkpoint('reviewBeforeDue');r.beforeDueReviewText=await page.locator('#view-review').innerText();r.beforeDueReviewIds=await page.locator('#review-list button').evaluateAll(ns=>ns.map(n=>n.dataset.questionId));assert(!r.beforeDueReviewIds.includes(id),'target scheduled review not yet due');
  const due=b.model.reviewSchedule[id].dueAt;r.reviewDelayMs=due-b.model.learningEffectiveness.questions[id].lastObservedAt;
  // Advancing browser Date is a fixture, not a user action or a changed learning schedule.
  await page.clock.setFixedTime(new Date(due+1000));
  const reviewStep=r.steps.length;
  await click('.mode-nav [data-action="mode"][data-mode="story"]','ストーリーへ');await click('[data-action="filter-reset"]','条件をクリア');r.recommendations=await page.locator('#story-recommendations').innerText();
  await click('#story-recommendations [data-action="mode"][data-mode="review"]','おすすめの復習モードへ');await checkpoint('reviewDue');r.reviewIds=await page.locator('#review-list button').evaluateAll(ns=>ns.map(n=>n.dataset.questionId));const assigned=r.states.reviewDue.model.reviewAssignments[id].reviewQuestionId;assert(r.reviewIds.includes(assigned));
  await click(`#review-list [data-question-id="${assigned}"]`,'復習対象 '+assigned+'開始');await page.locator('#view-question').waitFor({state:'visible'});await checkpoint('reviewQuestion');await shot('review');
  r.reviewNavigationActions=r.steps.length-reviewStep;r.reviewMapping=await page.evaluate(()=>({questionId:App.controller.currentId,sourceId:App.controller.reviewSourceId,category:QuestionData[App.controller.currentId].category}));assert.equal(r.reviewMapping.sourceId,id);assert.equal(r.reviewMapping.category,r.problem.category);
  assert.deepEqual(protectedState(b),protectedState(r.states.reviewQuestion),'navigation must not count as review answer or reward');
  await page.goto(base+'/?mode=review');await page.waitForFunction(()=>window.App?.controller);await checkpoint('reloaded');assert.deepEqual(protectedState(r.states.reviewQuestion),protectedState(r.states.reloaded),'reload learning authority');
  r.formAAfter=await formA(page);assert.deepEqual(r.formAAfter,r.formABefore,'Form A isolation');assert.deepEqual(errors,[]);r.status='PASS';
 }catch(e){r.status='FAIL';r.error=String(e.stack||e);r.pageErrors=errors;await shot('FAIL').catch(()=>{});evidence.failures.push({engine,width,id,error:r.error});}
 finally{for(const [name,s]of Object.entries(r.states))r.deltas[name]=diff(r.states.beforeInput||{},s);await context.tracing.stop({path:path.join(OUT,`${engine}-${width}-${id}-trace.zip`)});await context.close();write();console.log(engine,width,id,r.status,r.error?.split('\n')[0]||'');}
}
let base;
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;try{for(const [engine,type]of Object.entries({chromium,webkit})){if(process.env.ENGINE&&engine!==process.env.ENGINE)continue;const browser=await type.launch();try{for(const width of (process.env.WIDTH?[Number(process.env.WIDTH)]:[320,390,1280]))for(const id of (process.env.QUESTION?[process.env.QUESTION]:Object.keys(fixtures)))await audit(browser,engine,width,id);}finally{await browser.close();}}}finally{await new Promise(resolve=>server.close(resolve));evidence.finished=new Date().toISOString();evidence.status=evidence.failures.length?'FAIL':'PASS';assert.equal(git('diff','--name-only','HEAD'),'');write();}if(evidence.failures.length)process.exitCode=1;})().catch(e=>{console.error(e);evidence.status='ERROR';evidence.error=String(e.stack||e);write();server.close();process.exitCode=1;});
