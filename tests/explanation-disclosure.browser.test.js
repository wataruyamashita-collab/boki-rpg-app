'use strict';
// Run with the repository's Playwright tooling. Baseline directory is optional.
const assert = require('assert'), fs = require('fs'), path = require('path');
const playwright = require('playwright');
const ids = ['J001','J028','J035','J131','J137','J147','L031','L039','L040','L050','T001','T040','E001','E020','D002','D010','F002','C001','C010'];
const widths = [320,375,390,1280];
const files = ['data/questions.js','js/feedback.js','js/explanation-formulas.js','js/explanation-model.js','js/explanation-design-system.js','js/view.js'];
const baseline = process.env.EXPLANATION_BASELINE_DIR;
async function render(page, id, correct) {
  return page.evaluate(({id,correct}) => {
    const q=window.QuestionData[id], instance=Object.create(window.AppView.prototype);
    instance.document=document;
    const answer=JSON.parse(JSON.stringify(q.answer));
    if(!correct) {
      if(q.type==='journal') answer.debit[0].amount+=1;
      else {const key=Object.keys(answer.cells)[0]; answer.cells[key]=typeof answer.cells[key]==='number'?answer.cells[key]+1:'不正値';}
    }
    instance.renderExplanation(q,{correct},answer);
    const node=document.getElementById('explanation');
    const text=n=>n.nodeType===Node.TEXT_NODE?n.textContent:n.tagName==='DETAILS'&&!n.open?text(n.querySelector('summary')):[...n.childNodes].map(text).join('');
    return {characters:text(node).length,height:node.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,details:node.querySelectorAll('details').length};
  },{id,correct});
}
(async()=>{
  for(const engine of (process.env.EXPLANATION_BROWSERS||'chromium,webkit').split(',')) {
    const browser=await playwright[engine].launch();
    try {
      const page=await browser.newPage();
      await page.setContent('<!doctype html><html lang="ja"><meta name="viewport" content="width=device-width, initial-scale=1"><body><main><div id="explanation"></div></main></body></html>');
      await page.addStyleTag({content:fs.readFileSync('css/style.css','utf8')});
      for(const file of files) await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
      const current=fs.readFileSync('js/view.js','utf8');
      for(const width of widths) {
        await page.setViewportSize({width,height:900});
        for(const id of ids) for(const correct of [true,false]) {
          let before;
          if(baseline) {
            await page.addScriptTag({content:fs.readFileSync(path.join(baseline,'js/view.js'),'utf8')});
            before=await render(page,id,correct);
            await page.addScriptTag({content:current});
          }
          const after=await render(page,id,correct);
          assert(after.details>0,`${engine}/${width}/${id}/${correct}: native disclosure`);
          assert(!after.overflow,`${engine}/${width}/${id}/${correct}: no page horizontal overflow`);
          if(before) assert(after.characters<before.characters,`${id}: initial text is reduced`);
          const disclosures=page.locator('#explanation details.explanation-supplement');
          for(let index=0;index<await disclosures.count();index++) {
          const disclosure=disclosures.nth(index),summary=disclosure.locator('summary').first();
          assert((await summary.boundingBox()).height>=44,'44px disclosure target');
          assert.strictEqual(await disclosure.getAttribute('open'),null,'closed initially');
          await summary.focus(); await page.keyboard.press('Enter');
          assert.notStrictEqual(await disclosure.getAttribute('open'),null,'keyboard opens native disclosure');
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'expanded content fits page');
          await page.keyboard.press('Space');
          assert.strictEqual(await disclosure.getAttribute('open'),null,'keyboard closes native disclosure');
          }
          console.log(JSON.stringify({engine,width,id,correct,before,after}));
        }
      }
    } finally {await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
