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
    const targetBox=c.calculatorTarget?.getBoundingClientRect(), v=visualViewport;
    return { rect:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},
      visual:{left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||innerWidth,height:v?.height||innerHeight},
      targetRect:targetBox && {top:targetBox.top,bottom:targetBox.bottom}, scroll:{x:scrollX,y:scrollY},
      viewport:{width:innerWidth,height:innerHeight}, expression:c.expression, calculator:{...c.calculator},
      values:[...document.querySelectorAll('.amount-input')].map(e=>e.value),
      target:[...document.querySelectorAll('.amount-input')].indexOf(c.calculatorTarget),
      draft:JSON.stringify(c.model.state.drafts.J128),
      buttons:[...document.querySelectorAll('.calculator button')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right};}) };
  });
}
async function rotationCases(browser, engine, url) {
  for (const width of [320,375,390,430]) for (const offscreen of ['below','above']) {
    const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const report={engine,browserVersion:browser.version(),questionId:'J128',scenario:`rotation-${width}-${offscreen}`,status:'RUNNING',rotations:[]};
    evidence.reports.push(report);write();
    try {
      await page.goto(url);await page.waitForFunction(()=>!!window.App?.controller);
      await page.evaluate(()=>{App.controller.skipPlacement();App.controller.showMode('training');App.controller.start('J128',{fresh:true});});
      const fields=page.locator('.amount-input:not(:disabled)');
      for (const [index,keys] of [[0,['9','9']],[1,['5','6']]]) {
        await fields.nth(index).tap();await settled(page);
        for(const key of ['AC',...keys])await page.locator(`[data-calc="${key}"]`).tap();
        await page.locator('[data-action="calc-insert"]').tap();
      }
      for(const key of ['AC','7','×'])await page.locator(`[data-calc="${key}"]`).tap();
      report.before=await snapshot(page);
      assert.deepStrictEqual(report.before.values.slice(0,2),['99','56']);
      // Move the actual selected cell with real document scrolling, without selecting it again.
      await page.evaluate(side=>{
        const r=App.controller.calculatorTarget.getBoundingClientRect();
        scrollTo(0,Math.max(0,scrollY+r.top-(side==='below'?innerHeight+100:-100)));
      },offscreen);await settled(page);
      report.offscreen=await snapshot(page);
      assert(offscreen==='below'?report.offscreen.targetRect.top>=width:report.offscreen.targetRect.bottom<=0,
        'fixture must put the real input beyond the upcoming landscape boundary');
      const assertVisible = s => {
        const v=s.visual,r=s.rect;
        assert(r.left>=v.left+7 && r.right<=v.left+v.width-7,'rotation: calculator horizontal bounds');
        assert(r.top>=v.top+7 && r.bottom<=v.top+v.height-7,'rotation: calculator vertical bounds');
        for(const key of ['expression','calculator','values','target','draft'])assert.deepStrictEqual(s[key],report.before[key],key+' retained without retapping');
      };
      for(let cycle=0;cycle<2;cycle++)for(const viewport of [{width:844,height:width},{width,height:844}]) {
        await page.setViewportSize(viewport);await settled(page);
        const s=await snapshot(page);report.rotations.push(s);
        if(cycle===0 && viewport.width===844)assert(offscreen==='below'
          ? s.targetRect.bottom>=s.visual.top+s.visual.height : s.targetRect.bottom<=s.visual.top,
          'selected input is outside or crosses the visible boundary after rotation');
        await page.screenshot({path:path.join(OUT,`${engine}-${report.scenario}-${cycle}-${viewport.width}.png`)});
        assertVisible(s);
      }
      // Very short landscape: buttons may scroll inside the panel but must remain reachable.
      await page.setViewportSize({width:844,height:160});await settled(page);
      report.short=await snapshot(page);assertVisible(report.short);
      const controls=page.locator('.calculator button');
      for(let i=0;i<await controls.count();i++) {
        await controls.nth(i).scrollIntoViewIfNeeded();
        assert(await controls.nth(i).evaluate(button=>{
          const r=button.getBoundingClientRect(),v=visualViewport;
          const x=r.left+r.width/2,y=r.top+r.height/2;
          return x>=v.offsetLeft && x<=v.offsetLeft+v.width && y>=v.offsetTop && y<=v.offsetTop+v.height &&
            button.contains(document.elementFromPoint(x,y));
        }),'each calculator control is visible and hit-testable through internal scrolling');
      }
      assert.deepStrictEqual((await snapshot(page)).scroll,report.short.scroll,'internal scrolling must not jump the document');
      for(const key of ['9','＝'])await page.locator(`[data-calc="${key}"]`).tap();
      await page.locator('[data-action="calc-insert"]').tap();
      assert.equal(await fields.nth(0).inputValue(),'99');assert.equal(await fields.nth(1).inputValue(),'63');
      // Switch targets after rotation and transfer only to the newly selected cell.
      await page.setViewportSize({width,height:844});await settled(page);
      await fields.nth(0).tap();await settled(page);
      for(const key of ['AC','1','0','1'])await page.locator(`[data-calc="${key}"]`).tap();
      await page.locator('[data-action="calc-insert"]').tap();
      assert.equal(await fields.nth(0).inputValue(),'101');assert.equal(await fields.nth(1).inputValue(),'63');
      await page.locator('.calculator summary').tap();
      await page.setViewportSize({width:844,height:width});await settled(page);
      assert.equal(await page.locator('.calculator').evaluate(e=>e.open),false,'closed panel stays closed after rotation');
      await fields.nth(1).tap();await settled(page);
      assert.equal(await page.locator('.calculator').evaluate(e=>e.open),true,'explicit retap can reopen');
      assert.deepStrictEqual(errors,[]);report.status='PASS';
    }catch(error){report.status='FAIL';report.error=error.stack||String(error);}
    finally{await context.close();write();}
  }
}
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:'+server.address().port;
  try {
    for (const [engine, launcher] of Object.entries({chromium, webkit})) {
      const browser = await launcher.launch();
      try {
        await rotationCases(browser,engine,url);
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
            const beforeToolbar = await snapshot(page);
            // Mobile browser toolbars can change height as the document scrolls.
            await page.setViewportSize({width:scenario.to.width,height:scenario.to.height+60}); await settled(page);
            report.toolbarResize = await snapshot(page);
            await page.screenshot({path:path.join(OUT,engine+'-'+scenario.name+'-toolbar.png'),fullPage:true});
            assert(Math.abs(report.toolbarResize.rect.top-report.scroll.after)<2,
              'height-only toolbar resize after scrolling must preserve the fixed screen position');
            for (const key of ['expression','calculator','values','target','draft']) assert.deepStrictEqual(report.toolbarResize[key],beforeToolbar[key]);
            // A smaller visual area is a keyboard-height proxy, not a native iOS keyboard test.
            await page.setViewportSize({width:scenario.to.width,height:520}); await settled(page);
            report.heightReduction = await snapshot(page);
            assert(report.heightReduction.rect.top>=7 && report.heightReduction.rect.bottom<=513,
              'height reduction must keep the calculator within the visible area');
            for (const key of ['expression','calculator','values','target','draft']) assert.deepStrictEqual(report.heightReduction[key],beforeToolbar[key]);
            for (const key of ['AC','9','×','9','＝']) await page.locator(`[data-calc="${key}"]`).tap();
            await page.locator('[data-action="calc-insert"]').tap();
            assert.equal(await fields.nth(1).inputValue(),'81');
            assert.equal(await fields.nth(0).inputValue(),'123');
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
