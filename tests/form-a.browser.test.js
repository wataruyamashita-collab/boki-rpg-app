'use strict';
const assert=require('assert'),fs=require('fs'),http=require('http'),path=require('path'),{chromium,webkit}=require('playwright');
const scoring=require('../js/form-a-scoring'),good=scoring.blank().map(row=>({...row,...scoring.fixture.key[row.id],amount:String(scoring.fixture.key[row.id].amount)}));
const reports=[];fs.mkdirSync('artifacts/form-a',{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
async function read(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('boki-independent-transfer',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,t=db.transaction('assessment'),v=t.objectStore('assessment').get('voucher-transfer-l050');v.onsuccess=()=>{resolve(v.result??null);db.close();};};}));}
async function open(page,url){await page.goto(url+'/form-a.html');await page.locator('#start').waitFor({state:'visible'});}
async function fill(page,rows){for(const row of rows){await page.locator('#voucher-'+row.id).selectOption(row.voucher);await page.locator('#amount-'+row.id).fill(row.amount);}await page.waitForFunction(()=>document.getElementById('status').textContent==='入力を保存しました。');}
async function submit(page){await page.locator('#submit').click();await page.locator('#result').waitFor({state:'visible'});}
async function seed(page){await page.evaluate(()=>{for(const key of ['boki-rpg-progress-v3','boki-rpg-character-v2'])localStorage.setItem(key,'protected:'+key);});}
async function protectedKeys(page){assert(await page.evaluate(()=>['boki-rpg-progress-v3','boki-rpg-character-v2'].every(key=>localStorage.getItem(key)==='protected:'+key)));}
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch();try{
   for(const width of [320,390,1280])for(const correct of [true,false]){
    const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();await open(page,url);await seed(page);assert.equal(await read(page),null);assert.equal(await page.locator('#materials').innerText(),'');
    await page.locator('#start').click();await page.locator('#exercise').waitFor({state:'visible'});let state=await read(page);assert.equal(state.attempts.length,1);assert(state.firstExposure);assert.equal(state.firstSubmission,null);assert.equal(await page.locator('#explanation').innerText(),'');
    assert.deepEqual(await page.locator('.answer-row legend').allTextContents(),['取引 C','取引 A','取引 D','取引 B']);
    const rows=structuredClone(good);if(!correct)rows[1].voucher='入金伝票';await fill(page,rows);await page.reload();await page.locator('#exercise').waitFor({state:'visible'});assert.equal(await page.locator('#amount-C').inputValue(),'18000');await submit(page);
    state=await read(page);assert.equal(state.attempts.length,1);assert.equal(state.firstSubmission.result.earned,correct?4:3);assert.equal(state.firstSubmission.result.amountCorrect,4);assert.equal(state.firstSubmission.result.classificationCorrect,correct?4:3);assert.equal(state.firstSubmission.initialEligible,false);
    assert((await page.locator('#explanation').innerText()).includes('普通預金'));assert.equal(await page.locator('#result details').first().getAttribute('open'),null);
    await page.locator('#result details').first().locator('summary').click();assert.notEqual(await page.locator('#result details').first().getAttribute('open'),null);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport no overflow');
    await page.screenshot({path:`artifacts/form-a/${engine}-${width}-${correct}.png`,fullPage:true});await protectedKeys(page);
    const first=JSON.stringify(state.firstSubmission);await page.locator('#retry').click();await page.locator('#exercise').waitFor({state:'visible'});await fill(page,good);await submit(page);state=await read(page);assert.equal(state.attempts.length,2);assert.equal(JSON.stringify(state.firstSubmission),first);await protectedKeys(page);
    reports.push({engine,width,correct,case:'UI/input/reload/submit/diagnostics/disclosure/retake/protected',pass:true});await context.close();
   }
   // Actual write failures: abort the real IDB transaction, never manufacture a successful receipt.
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);
    await p.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.restorePut=()=>{IDBObjectStore.prototype.put=put;};IDBObjectStore.prototype.put=function(...a){const r=put.apply(this,a);this.transaction.abort();return r;};});
    await p.locator('#start').click();await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#exercise').isHidden());assert.equal(await read(p),null);await p.evaluate(()=>restorePut());await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});await fill(p,good);
    await p.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.restorePut=()=>{IDBObjectStore.prototype.put=put;};IDBObjectStore.prototype.put=function(...a){const r=put.apply(this,a);this.transaction.abort();return r;};});
    await p.locator('#submit').click();await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#result').isHidden());assert.equal((await read(p)).firstSubmission,null);assert.equal(await p.locator('#amount-C').inputValue(),'18000');await p.evaluate(()=>restorePut());await submit(p);assert.equal((await read(p)).firstSubmission.result.earned,4);
    reports.push({engine,case:'initial/answer transaction abort, recovery, no unsaved result',pass:true});await c.close();
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});await fill(p,good);
    const p2=await c.newPage();await p2.goto(url+'/form-a.html');await p2.locator('#exercise').waitFor({state:'visible'});const original=(await read(p)).attempts[0].id;
    await Promise.all([submit(p),submit(p2)]);let s=await read(p);assert.equal(s.attempts.length,1);assert.equal(s.firstSubmission.attemptId,original);
    await Promise.all([p.locator('#retry').click(),p2.locator('#retry').click()]);await p.locator('#exercise').waitFor({state:'visible'});await p2.locator('#exercise').waitFor({state:'visible'});s=await read(p);assert.equal(s.attempts.length,2);
    await p.locator('#amount-C').fill('1');await p.waitForFunction(()=>document.getElementById('status').textContent==='入力を保存しました。');await p2.locator('#amount-C').fill('2');await p2.locator('#error').waitFor({state:'visible'});assert.equal((await read(p)).attempts[1].draft.find(x=>x.id==='C').amount,'1');assert.equal((await read(p)).firstSubmission.attemptId,original);
    reports.push({engine,case:'concurrent submission/retry idempotency and stale draft refusal',pass:true});await c.close();
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});await fill(p,good);await p.locator('#amount-C').fill('1e4');await p.locator('#submit').click();await p.locator('#error').waitFor({state:'visible'});assert.equal((await read(p)).firstSubmission,null);assert(await p.locator('#result').isHidden());await c.close();reports.push({engine,case:'invalid amount no receipt',pass:true});
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});
    await p.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('boki-independent-transfer');r.onsuccess=()=>{const d=r.result,t=d.transaction('assessment','readwrite');t.objectStore('assessment').put({schema:999,keep:'unchanged'},'voucher-transfer-l050');t.oncomplete=()=>{d.close();resolve();};};}));
    await p.reload();await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#exercise').isHidden());assert.deepEqual(await read(p),{schema:999,keep:'unchanged'});reports.push({engine,case:'unknown schema preserved / fail closed',pass:true});await c.close();
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});
    await p.evaluate(rows=>{for(const r of rows){for(const [prefix,value] of [['voucher-',r.voucher],['amount-',r.amount]]){const e=document.getElementById(prefix+r.id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));}}document.getElementById('answers').requestSubmit();},good);
    await p.locator('#result').waitFor({state:'visible'});assert.equal((await read(p)).firstSubmission.result.earned,4);reports.push({engine,case:'immediate submit serializes all pending draft writes',pass:true});
    const raw=await read(p);raw.firstSubmission.result.classificationCorrect=99;
    await p.evaluate(raw=>new Promise(resolve=>{const r=indexedDB.open('boki-independent-transfer');r.onsuccess=()=>{const db=r.result,t=db.transaction('assessment','readwrite');t.objectStore('assessment').put(raw,'voucher-transfer-l050');t.oncomplete=()=>{db.close();resolve();};};}),raw);
    await p.reload();await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#result').isHidden());assert.deepEqual(await read(p),raw);reports.push({engine,case:'corrupt same-schema first receipt rejected without overwrite',pass:true});await c.close();
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await p.addInitScript(()=>{IDBFactory.prototype.open=()=>{throw new Error('unavailable storage');};});await p.goto(url+'/form-a.html');await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#intro').isHidden());assert(await p.locator('#exercise').isHidden());assert.equal(await p.locator('#materials').innerText(),'');reports.push({engine,case:'IDB open failure cannot expose question',pass:true});await c.close();
   }
   {
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await open(p,url);await p.locator('#start').click();await p.locator('#exercise').waitFor({state:'visible'});await fill(p,good);
    await p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('boki-independent-transfer',2);r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);}));await p.locator('#submit').click();await p.locator('#error').waitFor({state:'visible'});assert(await p.locator('#result').isHidden());assert((await p.locator('#error').innerText()).includes('版が変わりました'));reports.push({engine,case:'old tab closes DB on versionchange and cannot submit',pass:true});await c.close();
   }
  }finally{await browser.close();}
 }
 fs.writeFileSync('artifacts/form-a/browser.json',JSON.stringify(reports,null,2));console.log('Form A product browser PASS',reports.length);server.close();
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
