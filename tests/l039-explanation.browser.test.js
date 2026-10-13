'use strict';
const assert=require('assert'),fs=require('fs'),{chromium,webkit}=require('playwright');
const files=['data/questions.js','js/feedback.js','js/explanation-formulas.js','js/explanation-model.js','js/explanation-design-system.js','js/view.js'];
(async()=>{
 for(const [name,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch();
  try{
   const page=await browser.newPage();
   await page.setContent('<!doctype html><html lang="ja"><meta name="viewport" content="width=device-width,initial-scale=1"><body><main><input id="retained" value="9,000"><div id="explanation"></div></main></body></html>');
   await page.addStyleTag({content:fs.readFileSync('css/style.css','utf8')});
   for(const file of files)await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
   for(const width of [320,375,390,1280])for(const correct of [true,false]){
    await page.setViewportSize({width,height:900});
    const visible=await page.evaluate(correct=>{
     const q=window.QuestionData.L039,view=Object.create(window.AppView.prototype);view.document=document;
     const answer=structuredClone(q.answer);if(!correct)answer.cells.profitTransfer=9000;
     view.renderExplanation(q,{correct},answer);
     const text=n=>n.nodeType===Node.TEXT_NODE?n.textContent:n.tagName==='DETAILS'&&!n.open?text(n.querySelector('summary')):[...n.childNodes].map(text).join('');
     return text(document.getElementById('explanation'));
    },correct);
    console.log(JSON.stringify({name,width,correct,visible}));
    for(const term of ['前期に費用計上済み','二重計上','前期10月〜3月','当期4月〜9月','−9,000 ＋ 18,000 ＋ 9,000 = 18,000','当期10月〜3月','負債','支払利息勘定の貸方','損益勘定の借方','未払利息勘定','次期繰越0円'])assert(visible.includes(term),`initial DOM missing: ${term}`);
    assert.strictEqual(await page.locator('#retained').inputValue(),'9,000');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    const details=page.locator('details.explanation-supplement');assert(await details.count()>0);
    for(let i=0;i<await details.count();i++){
     const d=details.nth(i),s=d.locator('summary').first();assert.strictEqual(await d.getAttribute('open'),null);
     assert((await s.boundingBox()).height>=44);await s.focus();await page.keyboard.press('Enter');assert.notStrictEqual(await d.getAttribute('open'),null);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.keyboard.press('Space');assert.strictEqual(await d.getAttribute('open'),null);
    }
   }
  }finally{await browser.close();}
 }
 console.log('L039 DOM / disclosure: PASS (16 cases)');
})().catch(e=>{console.error(e);process.exitCode=1;});
