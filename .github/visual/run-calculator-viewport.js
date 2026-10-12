'use strict';
const assert = require('assert');
const fs = require('fs'), http = require('http'), path = require('path');
const { chromium, webkit } = require('playwright');
const ROOT = path.resolve(process.env.VIEWPORT_ROOT || path.join(__dirname, '../..'));
const OUT = path.resolve(process.env.VIEWPORT_OUTPUT || path.join(ROOT, 'artifacts/calculator-viewport'));
const evidence = { status:'RUNNING', reports:[], limitations:['Automated viewport/touch evidence, not physical iPhone Chrome or native keyboard evidence.'] };
fs.mkdirSync(OUT, { recursive:true });
const write = () => fs.writeFileSync(path.join(OUT, 'evidence.json'), JSON.stringify(evidence, null, 2)+'\n');
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html');
  if (!file.startsWith(ROOT+path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.setHeader('content-type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const settled = page => page.evaluate(() => new Promise(resolve => {
  let frames = 5; const tick = () => --frames ? requestAnimationFrame(tick) : resolve(); requestAnimationFrame(tick);
}));
async function snapshot(page) {
  return page.evaluate(() => {
    const c = App.controller, box = document.querySelector('.calculator').getBoundingClientRect();
    return { rect:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},
      viewport:{width:innerWidth,height:innerHeight}, expression:c.expression, calculator:{...c.calculator},
      values:[...document.querySelectorAll('.amount-input')].map(e=>e.value),
      target:[...document.querySelectorAll('.amount-input')].indexOf(c.calculatorTarget),
      draft:JSON.stringify(c.model.state.drafts.J128),
      buttons:[...document.querySelectorAll('.calculator button')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right};}) };
  });
}
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:'+server.address().port;
  try {
    for (const [engine, launcher] of Object.entries({chromium, webkit})) {
      const browser = await launcher.launch();
      try {
        for (const scenario of [
          {name:'430-to-320',from:{width:430,height:844},to:{width:320,height:844}},
          {name:'390-to-375',from:{width:390,height:844},to:{width:375,height:844}},
          {name:'320-to-430',from:{width:320,height:844},to:{width:430,height:844}},
          {name:'landscape-to-portrait',from:{width:844,height:390},to:{width:390,height:844}}
        ]) {
          const context = await browser.newContext({viewport:scenario.from,hasTouch:true,isMobile:true});
          const page = await context.newPage(), errors = [];
          page.on('pageerror', e=>errors.push(String(e)));
          const report = {engine,browserVersion:browser.version(),questionId:'J128',scenario:scenario.name,status:'RUNNING'};
          evidence.reports.push(report); write();
          try {
            await page.goto(url); await page.waitForFunction(()=>!!window.App?.controller);
            await page.evaluate(()=>{App.controller.skipPlacement();App.controller.showMode('training');App.controller.start('J128',{fresh:true});});
            const fields = page.locator('.amount-input:not(:disabled)');
            await fields.nth(0).tap(); await settled(page);
            for (const key of ['1','2','3']) await page.locator(`[data-calc="${key}"]`).tap();
            await page.locator('[data-action="calc-insert"]').tap();
            await fields.nth(1).tap(); await settled(page);
            for (const key of ['7','×']) await page.locator(`[data-calc="${key}"]`).tap();
            report.before = await snapshot(page);
            await page.setViewportSize(scenario.to); await settled(page);
            report.after = await snapshot(page);
            await page.screenshot({path:path.join(OUT,engine+'-'+scenario.name+'.png'),fullPage:true});
            const a = report.after, b = report.before;
            assert(a.rect.left>=-1 && a.rect.right<=scenario.to.width+1, 'calculator must fit after viewport resize');
            assert(a.buttons.every(button=>button.left>=-1 && button.right<=scenario.to.width+1), 'all operation and transfer buttons remain horizontally visible');
            for (const key of ['expression','calculator','values','target','draft']) assert.deepStrictEqual(a[key], b[key], key+' must survive layout-only resize');
            await page.locator('[data-calc="8"]').tap(); await page.locator('[data-calc="＝"]').tap();
            await page.locator('[data-action="calc-insert"]').tap();
            assert.equal(await fields.nth(1).inputValue(), '56');
            assert.equal(await fields.nth(0).inputValue(), '123', 'peer cell must remain unchanged');
            // Ordinary scrolling must preserve the existing viewport-fixed behavior.
            report.scroll = await page.evaluate(() => {
              const panel=document.querySelector('.calculator'); const before=panel.getBoundingClientRect().top;
              const oldY=scrollY; scrollBy(0,100);
              return new Promise(resolve=>requestAnimationFrame(()=>resolve({delta:scrollY-oldY,before,after:panel.getBoundingClientRect().top})));
            });
            assert(Math.abs(report.scroll.delta)>1, 'scroll contract is tested only after real scrolling');
            assert(Math.abs(report.scroll.before-report.scroll.after)<2, 'calculator must not chase scrolling');
            await page.locator('.calculator summary').tap();
            await page.setViewportSize(scenario.from); await settled(page);
            assert.equal(await page.locator('.calculator').evaluate(e=>e.open), false, 'resize must not reopen a closed calculator');
            assert.deepStrictEqual(errors, []); report.status='PASS';
          } catch(error) { report.status='FAIL'; report.error=error.stack||String(error); }
          finally { await context.close(); write(); }
        }
      } finally { await browser.close(); }
    }
    evidence.status=evidence.reports.every(r=>r.status==='PASS')?'PASS':'FAIL';write();
    console.log(JSON.stringify({status:evidence.status,cases:evidence.reports.length,failures:evidence.reports.filter(r=>r.status==='FAIL').map(r=>[r.engine,r.scenario,r.error])}));
    if(evidence.status!=='PASS')process.exitCode=1;
  } finally { server.close(); }
}
run().catch(error=>{console.error(error);evidence.status='FAIL';evidence.error=String(error);write();server.close();process.exitCode=1;});
