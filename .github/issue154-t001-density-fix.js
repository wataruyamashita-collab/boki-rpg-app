'use strict';
const fs=require('fs');
const crypto=require('crypto');

const read=file=>fs.readFileSync(file,'utf8');
const write=(file,value)=>fs.writeFileSync(file,value);
const replaceOnce=(source,oldValue,newValue,label)=>{
  if(source.split(oldValue).length!==2)throw new Error(label+' anchor mismatch');
  return source.replace(oldValue,newValue);
};

function updateView(){
  const file='js/view.js';
  let s=read(file);
  const tick=String.fromCharCode(96);
  const templateText='answer-table$'+'{question.format === \'eight-column-worksheet\' ? \' eight-column-worksheet\' : \'\'}';
  const oldTable="const table = this.document.createElement('table'); table.className = "+tick+templateText+tick+";\n      const columnTypes";
  const newTable="const table = this.document.createElement('table'); table.className = "+tick+templateText+tick+";\n      table.dataset.questionType = question.type;\n      const columnTypes";
  s=replaceOnce(s,oldTable,newTable,'view question-type');
  s=replaceOnce(
    s,
    "const row = body.insertRow(); if (question.format === 'eight-column-worksheet') row.setAttribute('role', 'row'); Object.values(rowData).forEach((value, columnIndex) => {",
    "const row = body.insertRow(); if (question.type === 'trial_balance' && Object.values(rowData).includes('入力')) row.classList.add('trial-balance-total-row'); if (question.format === 'eight-column-worksheet') row.setAttribute('role', 'row'); Object.values(rowData).forEach((value, columnIndex) => {",
    'view trial-balance total row'
  );
  write(file,s);
}

function updateCss(){
  const file='css/style.css';
  let s=read(file);
  if(s.includes('Gate 5-A physical QA: keep mobile trial-balance'))throw new Error('trial-balance CSS already present');
  const anchor="@media (max-width: 680px) {\n  .app-header {";
  const block=[
    '/* Gate 5-A physical QA: keep mobile trial-balance cells and total inputs on one compact row rhythm. */',
    '@media (max-width: 480px) {',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tbody tr {',
    '    height: 34px;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tbody td {',
    '    height: 34px;',
    '    padding-top: 0;',
    '    padding-bottom: 0;',
    '    vertical-align: middle;',
    '    line-height: 1.25;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tr.trial-balance-total-row td.amount-cell {',
    '    padding: 0;',
    '    background: #fffdf3;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tr.trial-balance-total-row .table-input[data-input-type="amount"] {',
    '    display: block;',
    '    box-sizing: border-box;',
    '    width: 100%;',
    '    min-width: 0;',
    '    max-width: 100%;',
    '    height: 32px;',
    '    min-height: 32px;',
    '    padding: 0 4px;',
    '    border: 0;',
    '    border-radius: 0;',
    '    background: transparent;',
    '    font-size: 16px;',
    '    line-height: 1.25;',
    '  }',
    '}',
    '',
    ''
  ].join('\n');
  s=replaceOnce(s,anchor,block+anchor,'trial-balance CSS');
  write(file,s);
}

function updateMobileRegression(){
  const file='tests/mobile-layout.test.js';
  let s=read(file);
  if(s.includes('Gate 5-A T001 physical density regression'))throw new Error('mobile regression already present');
  const block=[
    '',
    '// Gate 5-A T001 physical density regression.',
    'assert(view.includes("table.dataset.questionType = question.type"), "ordinary table renderer exposes the canonical question type for scoped responsive rules");',
    'assert(view.includes("row.classList.add(\'trial-balance-total-row\')"), "trial-balance input row receives a stable semantic class without inspecting answer values");',
    'const trialBalanceDensityTokens = [',
    '  \'[data-question-type="trial_balance"] tbody tr\',',
    '  \'height: 34px;\',',
    '  \'tr.trial-balance-total-row td.amount-cell\',',
    '  \'background: #fffdf3;\',',
    '  \'tr.trial-balance-total-row .table-input[data-input-type="amount"]\',',
    '  \'box-sizing: border-box;\',',
    '  \'width: 100%;\',',
    '  \'min-width: 0;\',',
    '  \'max-width: 100%;\',',
    '  \'height: 32px;\',',
    '  \'min-height: 32px;\',',
    '  \'border: 0;\',',
    '  \'font-size: 16px;\'',
    '];',
    'for (const token of trialBalanceDensityTokens) assert(css.includes(token), "trial-balance physical-density CSS keeps required token: "+token);'
  ].join('\n');
  s=s.trimEnd()+block+'\n';
  write(file,s);
}

function updateVisualFixture(){
  const file='.github/visual/explanation-integration.html';
  let s=read(file);
  s=replaceOnce(
    s,
    '<main class="visual-shell"><section id="explanation"></section></main>',
    '<main class="visual-shell"><section id="table-container" class="table-question-wrap" hidden></section><section id="explanation"></section></main>',
    'visual table container'
  );
  s=replaceOnce(
    s,
    "const question=window.QuestionData[caseId];\nconst wrong=question.type==='journal'?{debit:[],credit:[]}:{cells:Object.fromEntries((question.table?.inputCells||[]).map(id=>[id,'']))};\nnew window.AppView(document).renderExplanation(question,{correct:false},wrong);",
    "const question=window.QuestionData[caseId];\nconst wrong=question.type==='journal'?{debit:[],credit:[]}:{cells:Object.fromEntries((question.table?.inputCells||[]).map(id=>[id,'']))};\nconst view=new window.AppView(document),tableContainer=document.getElementById('table-container');\nif(caseId==='T001'){tableContainer.hidden=false;view.renderTable(question,{cells:{}});}\nview.renderExplanation(question,{correct:false},wrong);",
    'visual T001 render'
  );
  write(file,s);
}

function updateVisualGate(){
  const file='.github/visual/run-explanation-integration.js';
  let s=read(file);
  const measureAnchor="const qs=s=>[...document.querySelectorAll(s)],rect=e=>e.getBoundingClientRect(),sections=qs('.explanation-flow-section'),formulas=qs('.explanation-formula strong');return{caseId,width,headings:";
  const measureNew="const qs=s=>[...document.querySelectorAll(s)],rect=e=>e.getBoundingClientRect(),sections=qs('.explanation-flow-section'),formulas=qs('.explanation-formula strong'),trialTable=document.querySelector('.answer-table[data-question-type=\\"trial_balance\\"]'),trialRows=trialTable?[...trialTable.querySelectorAll('tbody tr')]:[],trialTotalRow=trialTable?.querySelector('tr.trial-balance-total-row')||null,trialInputs=trialTotalRow?[...trialTotalRow.querySelectorAll('.table-input[data-input-type=\\"amount\\"]')]:[],trialMetrics={tableCount:trialTable?1:0,normalRowHeight:trialRows[0]?rect(trialRows[0]).height:0,totalRowHeight:trialTotalRow?rect(trialTotalRow).height:0,inputs:trialInputs.map(input=>{const cell=input.closest('td'),ir=rect(input),cr=rect(cell);return{inputWidth:ir.width,cellWidth:cr.width,inputHeight:ir.height,fontSize:parseFloat(getComputedStyle(input).fontSize)};})};return{caseId,width,trialMetrics,headings:";
  s=replaceOnce(s,measureAnchor,measureNew,'visual metrics');
  const violationAnchor="if(caseId==='T001'&&(!m.formulaTexts.join(' ').includes('410,000 + 175,000 + 60,000 + 289,000 + 90,000 = 1,024,000')||!m.checkText.includes('借方合計と貸方合計が一致しているか確認する')))violations.push('TRIAL_BALANCE_GUIDANCE');";
  const violationNew=violationAnchor+"if(caseId==='T001'&&(m.trialMetrics.tableCount!==1||m.trialMetrics.normalRowHeight<=0||m.trialMetrics.totalRowHeight<=0||Math.abs(m.trialMetrics.totalRowHeight-m.trialMetrics.normalRowHeight)>1.5||m.trialMetrics.totalRowHeight>36||m.trialMetrics.inputs.length!==2||m.trialMetrics.inputs.some(item=>Math.abs(item.inputWidth-item.cellWidth)>2.5||item.inputHeight>34||item.fontSize<16)))violations.push('TRIAL_BALANCE_INPUT_DENSITY');";
  s=replaceOnce(s,violationAnchor,violationNew,'visual density violation');
  write(file,s);
}

function updateGenerationImmutability(){
  const file='independent-audit/tests/generation-immutability.test.js';
  let s=read(file);
  const through47='[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47]';
  const through48=through47.slice(0,-1)+',48]';
  const through49=through48.slice(0,-1)+',49]';
  if(!s.includes('const generation48Committed=committed(48);'))throw new Error('generation 48 immutability anchor missing');
  s=s.replaceAll(through48,through49);
  s=replaceOnce(s,': '+through47,': '+through48,'generation 49 pre-commit sequence');
  s=s.replaceAll('generation48Committed','generation49Committed');
  s=s.replaceAll('committed(48)','committed(49)');
  s=s.replaceAll('Generation 48','Generation 49');
  s=s.replaceAll('authorityPath(48)','authorityPath(49)');
  s=s.replaceAll('document.generation<48','document.generation<49');
  s=s.replace("stale-predecessor Generation 49 successor is rejected","stale-predecessor Generation 50 successor is rejected");
  s=s.replace('skipped.generation=49;','skipped.generation=50;');
  s=s.replace("authority sequence is [2..47] before Generation 49 or [2..48] after commit","authority sequence is [2..48] before Generation 49 or [2..49] after commit");
  write(file,s);
}

function updateRelease(){
  const release='20260924-118',previous='20260924-117';
  let index=read('index.html');
  if(!index.includes(previous))throw new Error('index release anchor missing');
  index=index.replaceAll(previous,release);
  write('index.html',index);

  let sw=read('service-worker.js');
  sw=replaceOnce(sw,"const RELEASE = '20260924-117';","const RELEASE = '20260924-118';",'service worker release');
  write('service-worker.js',sw);

  const manifest=JSON.parse(read('pwa-release-manifest.json'));
  if(manifest.release!==previous)throw new Error('manifest release anchor mismatch');
  manifest.release=release;
  manifest.previousRelease=previous;
  for(const file of Object.keys(manifest.assets)){
    manifest.assets[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  write('pwa-release-manifest.json',JSON.stringify(manifest,null,2)+'\n');
}

updateView();
updateCss();
updateMobileRegression();
updateVisualFixture();
updateVisualGate();
updateGenerationImmutability();
updateRelease();
console.log('T001_DENSITY_FIX_APPLIED');
