'use strict';
// Real product DOM and handlers on an isolated localhost origin; synthetic answers only.
// Browser automation is not physical-device or learner-effectiveness evidence.
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium, webkit } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'artifacts', 'result-feedback-ux');
const evidence = { status:'RUNNING', reports:[], failures:[] };
const write = () => { fs.mkdirSync(OUTPUT, {recursive:true}); fs.writeFileSync(path.join(OUTPUT, 'evidence.json'), JSON.stringify(evidence,null,2)+'\n'); };
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = path.resolve(ROOT,pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!file.startsWith(ROOT+path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const row = (account,amount) => ({account,amount});
const capital = {debit:[row('現金',3000000)],credit:[row('資本金',3000000)]};
const capitalWrong = {debit:[row('普通預金',3000000)],credit:[row('資本金',3000000)]};
// Independent bookkeeping: J020 4,800+3,200+6,000=14,000; all four lines below are wrong.
const fourWrong = {debit:[row('旅費交通費',4801),row('通信費',3201),row('消耗品費',6001)],credit:[row('当座預金',14003)]};
// J006 purchase 200,000 + inbound freight 6,000; two residual differences, irrespective of input order.
const compoundWrong = {debit:[row('仕入',206000)],credit:[row('現金',7000),row('売掛金',199000)]};
async function render(page,id,answer,expectedCorrect) {
  const result = await page.evaluate(({id,answer}) => {
    const c=App.controller,q=QuestionData[id],before=JSON.stringify(answer);
    const storage=JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));
    const score=GradingEngine.grade(q,answer),scoreBefore=JSON.stringify(score);
    c.view.result(q,score,answer,'unsure',{reward:'検証用報酬'},!score.correct);
    c.view.show('view-result');
    return {
      correct:score.correct,earned:score.earned,
      untouched:before===JSON.stringify(answer)&&scoreBefore===JSON.stringify(score),
      storageUnchanged:storage===JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),
      list:[...document.querySelectorAll('#result-error-summary li')].map(n=>n.textContent),
      text:document.getElementById('result-error-summary').textContent,
      explanationBeforeReward:Boolean(document.getElementById('explanation').compareDocumentPosition(document.getElementById('achievement-banner'))&Node.DOCUMENT_POSITION_FOLLOWING),
      summaryBeforeExplanation:Boolean(document.getElementById('result-error-summary').compareDocumentPosition(document.getElementById('explanation'))&Node.DOCUMENT_POSITION_FOLLOWING)
    };
  },{id,answer});
  assert.strictEqual(result.correct,expectedCorrect,id+' independently expected grade');
  assert(result.untouched && result.storageUnchanged,'presentation does not change answers, grades or storage');
  assert(result.explanationBeforeReward,'achievement follows explanation for both outcomes');
  assert(result.summaryBeforeExplanation,'difference summary precedes explanation');
  assert.strictEqual(await page.locator('#result-learning-summary').count(),0,'result daily card removed');
  assert.strictEqual(await page.locator('#story-learning-summary').count(),1,'Story card retained');
  return result;
}
async function visibleExplanation(page) {
  return page.locator('#explanation').evaluate(node => {
    const text=n=>n.nodeType===Node.TEXT_NODE?n.textContent:n.tagName==='DETAILS'&&!n.open?text(n.querySelector('summary')):[...n.childNodes].map(text).join('');
    return text(node);
  });
}
async function fits(page) {
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page fits viewport');
  const controls=await page.locator('#standard-result-actions button:visible').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,width:innerWidth};}));
  assert(controls.every(r=>r.left>=-1&&r.right<=r.width+1&&r.height>=44),'actions fit viewport and retain touch target');
}
async function contrast(page,selector) {
  return page.locator(selector).evaluate(node=>{
    const s=getComputedStyle(node),lum=color=>{
      const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
      return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
    };
    const a=lum(s.color),b=lum(s.backgroundColor);
    return {foreground:s.color,background:s.backgroundColor,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
}
async function start(page,id) {
  await page.evaluate(id=>{const c=App.controller;c.model.state.mode='training';c.start(id);},id);
  await page.locator('#view-question').waitFor({state:'visible'});
}
async function fillJournal(page,answer) {
  for(const side of ['debit','credit']) for(let i=0;i<answer[side].length;i++) {
    const account=page.locator('.'+side+'-account').nth(i),amount=page.locator('.'+side+'-amount').nth(i);
    if(await account.isDisabled()) assert.strictEqual(await account.inputValue(),answer[side][i].account,'correct retry account remains fixed');
    else await account.selectOption(answer[side][i].account);
    if(await amount.isDisabled()) assert.strictEqual(Number((await amount.inputValue()).replace(/,/g,'')),answer[side][i].amount,'correct retry amount remains fixed');
    else await amount.fill(String(answer[side][i].amount));
  }
}
async function submit(page) {
  await page.locator('#question-form button[type="submit"]').click();
  await page.locator('#view-result').waitFor({state:'visible'});
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;write();
  try {
    for(const [engine,launcher] of Object.entries({chromium,webkit})) {
      const browser=await launcher.launch();
      try {
        for(const width of [320,390,1280]) {
          const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'allow'});
          const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
          let phase='load';
          const record=(name,details={})=>{evidence.reports.push({engine,width,case:name,pass:true,...details});write();};
          try {
            await page.goto(url);await page.waitForFunction(()=>Boolean(window.App?.controller));
            phase='one difference and desktop hover';
            const wrong=await render(page,'J001',capitalWrong,false);
            assert.strictEqual(wrong.list.length,1);assert(wrong.list[0].includes('普通預金')&&wrong.list[0].includes('現金'));
            assert.strictEqual(await page.locator('.result-headline').innerText(),'もう一歩です');
            assert(await page.locator('#top-result-actions').isHidden());
            const next='#standard-result-actions [data-action="next"]';
            assert((await page.locator(next).getAttribute('class')).includes('secondary-button'));
            await page.locator(next).hover();const colors=await contrast(page,next);assert(colors.ratio>=4.5,'hover text contrast >=4.5: '+JSON.stringify(colors));
            await page.locator(next).focus();
            assert(await page.locator(next).evaluate(n=>document.activeElement===n&&parseFloat(getComputedStyle(n).outlineWidth)>0),'keyboard focus visible');
            await fits(page);record(phase,{colors});
            phase='four differences capped without hiding total';
            const four=await render(page,'J020',fourWrong,false);
            assert.strictEqual(four.list.length,3);assert(four.text.includes('ほか1件'));
            for(const amount of ['4,800','3,200','6,000','14,000']) assert((await page.locator('#explanation').innerText()).includes(amount),amount+' original accounting explanation');
            await fits(page);record(phase);
            phase='compound residual matches independent of entered order';
            const a=await render(page,'J006',compoundWrong,false);
            const b=await render(page,'J006',{...compoundWrong,credit:[...compoundWrong.credit].reverse()},false);
            assert.deepStrictEqual(a.list,b.list);assert.strictEqual(a.list.length,2);
            assert(a.list.some(x=>x.includes('現金')&&x.includes('7,000')&&x.includes('6,000')));
            assert(a.list.some(x=>x.includes('売掛金')&&x.includes('買掛金')));
            const purchase=await page.locator('#explanation').innerText();
            for(const term of ['仕入諸掛','取得原価','206,000','買掛金','現金']) assert(purchase.includes(term),'J006 reasoning '+term);record(phase);
            phase='correct result explanation reward and keyboard disclosure';
            await render(page,'J001',capital,true);
            assert(await page.locator('#result-error-summary').isHidden());assert(await page.locator('#top-result-actions').isVisible());
            assert(!((await page.locator(next).getAttribute('class'))||'').includes('secondary-button'));
            const initial=await visibleExplanation(page);for(const term of ['現金','資産','資本金','純資産','3,000,000']) assert(initial.includes(term),'initial explanation '+term);
            const details=page.locator('#explanation details.explanation-supplement').first();
            assert.strictEqual(await details.getAttribute('open'),null);
            const summary=details.locator('summary').first();assert((await summary.boundingBox()).height>=44);
            await summary.focus();await page.keyboard.press('Enter');assert.notStrictEqual(await details.getAttribute('open'),null);
            await fits(page);await page.keyboard.press('Space');assert.strictEqual(await details.getAttribute('open'),null);record(phase);
            phase='accepted L039 L050 and trial-balance reasoning preserved';
            await page.evaluate(()=>{const c=App.controller,q=QuestionData.L039;c.view.result(q,GradingEngine.grade(q,q.answer),q.answer);});
            const interest=await visibleExplanation(page);
            for(const term of ['前期に費用計上済み','二重計上','−9,000 ＋ 18,000 ＋ 9,000 = 18,000','負債','次期繰越0円']) assert(interest.includes(term),'L039 '+term);
            await render(page,'L050',{cells:{value1:50000,value2:20000,value3:30000}},true);
            const voucher=await page.locator('#explanation').innerText();
            for(const term of ['現金','入金伝票','出金伝票','振替伝票','50,000','20,000','30,000']) assert(voucher.includes(term),'L050 '+term);
            await render(page,'T001',{cells:{total_debit:1024001,total_credit:1024000}},false);
            const balance=await page.locator('#explanation').innerText();
            // Independently total the given five debit / three credit amounts.
            assert.strictEqual(410000+175000+60000+289000+90000,1024000);
            assert.strictEqual(134000+400000+490000,1024000);
            for(const term of ['410,000','175,000','60,000','289,000','90,000','134,000','400,000','490,000','1,024,000']) assert(balance.includes(term),'T001 derivation '+term);
            assert.strictEqual(await page.locator('#result-error-summary li').count(),1);
            await fits(page);record(phase);
            phase='real retry retains authoritative mistake and optional continue';
            await start(page,'J001');await fillJournal(page,capitalWrong);await submit(page);
            const before=await page.evaluate(()=>({attempts:App.controller.model.state.learningEffectiveness.questions.J001.observedAttempts,xp:App.controller.rpg.state.xp}));
            const retry=page.locator('#standard-result-actions [data-action="coaching-retry-result"]');
            await retry.focus();await page.keyboard.press('Enter');await page.locator('#view-question').waitFor({state:'visible'});
            await fillJournal(page,capital);await submit(page);
            assert((await page.locator('#result-status').innerText()).includes('最初の回答は誤答'));
            assert(await page.evaluate(before=>App.controller.model.state.learningEffectiveness.questions.J001.observedAttempts===before.attempts&&App.controller.rpg.state.xp===before.xp,before),'retry does not overwrite initial evidence or farm XP');
            // Separate wrong attempt: learner can leave without being forced to retry.
            await start(page,'J002');await fillJournal(page,{debit:[row('現金',180000)],credit:[row('普通預金',180000)]});await submit(page);
            assert.strictEqual(await page.locator('.result-headline').innerText(),'もう一歩です');
            await page.locator(next).focus();await page.keyboard.press('Enter');
            assert(await page.locator('#view-result').isHidden(),'continue remains available without retry');
            // Correct answer retains the original top next action route.
            await start(page,'J001');await fillJournal(page,capital);await submit(page);
            await page.locator('#top-result-actions [data-action="next"]').click();assert(await page.locator('#view-result').isHidden());
            assert.deepStrictEqual(errors,[],'no product page errors');record(phase);
            await render(page,'J020',fourWrong,false);
            await page.screenshot({path:path.join(OUTPUT,engine+'-'+width+'.png'),fullPage:true});
          } catch(error) {
            evidence.failures.push({engine,width,phase,error:String(error.stack||error),pageErrors:errors});write();
            await page.screenshot({path:path.join(OUTPUT,engine+'-'+width+'-FAIL.png'),fullPage:true}).catch(()=>{});throw error;
          } finally {await context.close();}
        }
      } finally {await browser.close();}
    }
    assert.strictEqual(evidence.reports.length,36);evidence.status='PASS';write();console.log('RESULT_FEEDBACK_UX_BROWSER_PASS (36 cases, Chromium/WebKit x 320/390/1280)');
  } catch(error) {evidence.status='FAIL';write();throw error;}
  finally {await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
