'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { detectGeneration10KnownViolation, evaluateVisualMetrics } = require('./gate-core');
const { chromium, webkit } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.join(ROOT, 'artifacts');
const mode = process.argv[2] || 'audit';
if (!['audit','strict'].includes(mode)) throw new Error('mode must be audit or strict');
const engines = { chromium, webkit };
const viewports = [{ width:320,height:568 },{ width:375,height:667 },{ width:390,height:844 },{ width:430,height:932 },{ width:768,height:1024 },{ width:1280,height:800 }];
const mime = { '.css':'text/css', '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const cases = ['fixed-asset','inventory','ledger','journal','worksheet'];
const evidence = { mode,status:'RUNNING',reports:[],smoke:[],failures:[],failure:null };
let activeContext = null;

function writeEvidence() {
  fs.mkdirSync(OUTPUT,{ recursive:true });
  fs.writeFileSync(path.join(OUTPUT,'visual-audit.json'),`${JSON.stringify(evidence,null,2)}\n`);
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const relative = pathname === '/' ? '.github/visual/harness.html' : pathname.slice(1);
  const file = path.resolve(ROOT, relative);
  if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); return response.end('not found'); }
  response.setHeader('content-type', mime[path.extname(file)] || 'application/octet-stream');
  response.end(fs.readFileSync(file));
});

async function measure(page) {
  return page.evaluate(() => {
    const rect = element => { const value = element?.getBoundingClientRect(); return value ? { x:value.x,y:value.y,width:value.width,height:value.height,top:value.top,right:value.right,bottom:value.bottom,left:value.left } : null; };
    const dimensions = element => element ? { rect:rect(element),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight } : null;
    const requiredTextWidth = (element, texts) => {
      const probe = document.createElement('span'), style = getComputedStyle(element);
      Object.assign(probe.style,{ position:'fixed',visibility:'hidden',whiteSpace:'nowrap',font:style.font,letterSpacing:style.letterSpacing });
      document.body.append(probe); let maximum = 0;
      for (const text of texts) { probe.textContent = text; maximum = Math.max(maximum, probe.getBoundingClientRect().width); }
      probe.remove(); return maximum;
    };
    const table = document.querySelector('.answer-table'), wrapper = document.querySelector('#table-container');
    const columns = {};
    for (const header of table?.querySelectorAll('thead [data-column-key]') || []) {
      const key = header.dataset.columnKey, cells = [...table.querySelectorAll(`tbody [data-column-key="${CSS.escape(key)}"]`)];
      const canonical = window.visualHarness.canonicalColumn(key);
      const representative = window.visualHarness.representativeColumn(key);
      const format = value => typeof value === 'number' ? value.toLocaleString('ja-JP') : String(value ?? '');
      const visible = representative.visibleValues.map(format), editableAnswers = representative.editableAnswers.map(format);
      const editableControl = cells.find(cell => cell.querySelector('input,select'))?.querySelector('input,select');
      const headerStyle = getComputedStyle(header), cellStyle = getComputedStyle(cells[0] || header), range = document.createRange(); range.selectNodeContents(header);
      const lineHeight = parseFloat(headerStyle.lineHeight) || parseFloat(headerStyle.fontSize) * 1.2;
      const contentWidth = requiredTextWidth(cells.find(cell => !cell.querySelector('input,select')) || cells[0] || header, visible);
      const editableAnswerWidth = requiredTextWidth(editableControl || cells[0] || header, editableAnswers);
      const headerWidth = requiredTextWidth(header, [header.textContent]);
      const horizontalChrome = parseFloat(cellStyle.paddingLeft) + parseFloat(cellStyle.paddingRight) + parseFloat(cellStyle.borderLeftWidth) + parseFloat(cellStyle.borderRightWidth);
      const inputStyle = editableControl ? getComputedStyle(editableControl) : null;
      const inputChrome = inputStyle ? parseFloat(inputStyle.paddingLeft) + parseFloat(inputStyle.paddingRight) + parseFloat(inputStyle.borderLeftWidth) + parseFloat(inputStyle.borderRightWidth) : 0;
      const semanticRequiredWidth = header.dataset.columnType === 'years'
        ? Math.max(contentWidth + horizontalChrome, editableAnswerWidth + horizontalChrome, parseFloat(headerStyle.fontSize) * 4 + 14)
        : Math.max(contentWidth,editableAnswerWidth,headerWidth) + horizontalChrome;
      const actualWidth = header.getBoundingClientRect().width;
      const headerClipped = header.scrollWidth > header.clientWidth + 1;
      const cellClipped = cells.some(cell => cell.scrollWidth > cell.clientWidth + 1);
      const editableAnswerFitFailure = Boolean(editableControl && editableAnswerWidth > editableControl.clientWidth - inputChrome + 0.5);
      const occupiedWidth = Math.max(headerWidth + horizontalChrome, contentWidth + horizontalChrome, editableControl ? editableControl.clientWidth + horizontalChrome : editableAnswerWidth + horizontalChrome);
      columns[key] = {
        headerText:header.textContent,classification:header.dataset.columnType,canonicalValues:canonical.values,representativeValues:representative.visibleValues,editableAnswers:representative.editableAnswers,editable:representative.editable,
        contentMax:representative.visibleValues.filter(Number.isFinite).reduce((max,value) => Math.max(max,value), Number.NEGATIVE_INFINITY),
        contentLength:Math.max(0,...[...visible,...editableAnswers].map(value => [...value].length)),header:dimensions(header),cell:dimensions(cells[0]),input:dimensions(editableControl),
        width:actualWidth,actualWidth,requiredWidth:semanticRequiredWidth,representativeRequiredWidth:semanticRequiredWidth,
        headerTextWidth:headerWidth,representativeContentWidth:contentWidth,editableAnswerWidth,horizontalChrome,occupiedWidth,contentWaste:Math.max(0,actualWidth-occupiedWidth),
        headerScrollWidth:header.scrollWidth,headerClientWidth:header.clientWidth,cellScrollWidth:Math.max(0,...cells.map(cell => cell.scrollWidth)),cellClientWidth:Math.min(...cells.map(cell => cell.clientWidth)),inputClientWidth:editableControl?.clientWidth || 0,
        computedMinWidth:headerStyle.minWidth,clipped:cellClipped,cellClipped,headerClipped,editableAnswerFitFailure,
        headerLineCount:Math.max(1,Math.round(range.getBoundingClientRect().height / lineHeight)),headerGlyphStacked:header.getBoundingClientRect().width < headerStyle.fontSize.replace('px','') * 1.8 && [...header.textContent].length > 2
      };
    }
    const bodyRows = [...(table?.tBodies[0]?.rows || [])], editableRow = bodyRows.find(row => row.querySelector('input,select')), normalRow = bodyRows.find(row => !row.querySelector('input,select')) || bodyRows[0];
    const representativeCell = editableRow?.cells[0] || normalRow?.cells[0], computedCell = representativeCell ? getComputedStyle(representativeCell) : null;
    const borderTop = computedCell ? parseFloat(computedCell.borderTopWidth) : 0, borderBottom = computedCell ? parseFloat(computedCell.borderBottomWidth) : 0;
    const paddingTop = computedCell ? parseFloat(computedCell.paddingTop) : 0, paddingBottom = computedCell ? parseFloat(computedCell.paddingBottom) : 0;
    const inputHeight = rect(editableRow?.querySelector('input,select'))?.height || 0;
    const lineHeight = computedCell ? parseFloat(computedCell.lineHeight) || parseFloat(computedCell.fontSize) * 1.2 : 0;
    return {
      questionId:document.body.dataset.questionId,
      table:{ ...dimensions(table),wrapper:dimensions(wrapper),horizontalOverflow:Math.max(0,(table?.scrollWidth || 0)-(wrapper?.clientWidth || 0)),requiresHorizontalScroll:(table?.scrollWidth || 0)>(wrapper?.clientWidth || 0),horizontalScrollAvailable:getComputedStyle(wrapper).overflowX !== 'visible',clipped:(wrapper?.scrollWidth || 0) < (table?.scrollWidth || 0) },
      columns,
      rows:{ headerRowHeight:rect(table?.tHead?.rows[0])?.height || 0,normalRowHeight:rect(normalRow)?.height || 0,editableRowHeight:rect(editableRow)?.height || 0,inputVisualHeight:inputHeight,paddingTop:computedCell?.paddingTop || null,paddingBottom:computedCell?.paddingBottom || null,borderTop,borderBottom,totalTableHeight:rect(table)?.height || 0,expectedNormalRowHeight:Math.max(lineHeight,inputHeight)+paddingTop+paddingBottom+borderTop+borderBottom,expectedEditableRowHeight:inputHeight+paddingTop+paddingBottom+borderTop+borderBottom }
    };
  });
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  writeEvidence();
  try {
    for (const [browserName, launcher] of Object.entries(engines)) {
      activeContext = { phase:'launch',browser:browserName };
      const browser = await launcher.launch();
      try {
        for (const caseName of cases) {
          activeContext = { phase:'representative-smoke',browser:browserName,viewport:{ width:390,height:844 },case:caseName };
          const page = await browser.newPage({ viewport:activeContext.viewport });
          try {
            await page.goto(url);
            const dependencies = await page.evaluate(() => window.visualHarness.assertDependencies());
            const representative = await page.evaluate(name => window.visualHarness.render(name),caseName);
            evidence.smoke.push({ ...activeContext,status:'PASS',dependencies,representative }); writeEvidence();
          } finally { await page.close(); }
        }
        for (const viewport of viewports) {
          for (const caseName of ['fixed-asset',...(viewport.width === 390 ? ['inventory','ledger','journal','worksheet'] : [])]) {
            activeContext = { phase:'observation',browser:browserName,viewport,case:caseName };
            const page = await browser.newPage({ viewport });
            try {
              await page.goto(url); await page.evaluate(() => window.visualHarness.assertDependencies());
              const representative = await page.evaluate(name => window.visualHarness.render(name), caseName);
              const directory = path.join(OUTPUT,browserName); fs.mkdirSync(directory,{ recursive:true });
              await page.screenshot({ path:path.join(directory,`${caseName}-${viewport.width}.png`),fullPage:true });
              const metrics = { browser:browserName,viewport,case:caseName,representative,...await measure(page) };
              metrics.violations = evaluateVisualMetrics(metrics); metrics.knownGeneration10Violation = caseName === 'fixed-asset' && detectGeneration10KnownViolation(metrics);
              evidence.reports.push(metrics);
              if (mode === 'audit' && caseName === 'fixed-asset' && !metrics.knownGeneration10Violation) evidence.failures.push(`${browserName}/${viewport.width}: Generation 10 life-width violation not detected`);
              if (mode === 'strict' && metrics.violations.length) evidence.failures.push(`${browserName}/${caseName}/${viewport.width}: ${metrics.violations.map(item => item.code).join(',')}`);
              writeEvidence();
            } finally { await page.close(); }
          }
        }
      } finally { await browser.close(); }
    }
    if (evidence.failures.length) throw new Error(evidence.failures.join('\n'));
    evidence.status = mode === 'audit' ? 'KNOWN_VIOLATION_DETECTED' : 'STRICT_VISUAL_GATE_PASS'; writeEvidence();
    console.log(mode === 'audit' ? 'KNOWN_VIOLATION_DETECTED' : 'STRICT_VISUAL_GATE_PASS');
  } catch (error) {
    evidence.status = 'FAIL'; evidence.failure = { ...activeContext,message:error.message,stack:error.stack }; writeEvidence(); throw error;
  } finally { await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
