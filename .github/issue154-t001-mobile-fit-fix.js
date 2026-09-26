'use strict';
const fs=require('fs');
const crypto=require('crypto');
const path=require('path');

const read=file=>fs.readFileSync(file,'utf8');
const write=(file,value)=>fs.writeFileSync(file,value);
const replaceOnce=(source,oldValue,newValue,label)=>{
  if(source.split(oldValue).length!==2)throw new Error(label+' anchor mismatch');
  return source.replace(oldValue,newValue);
};

function updateCss(){
  const file='css/style.css';
  let s=read(file);
  const oldBlock=[
    '/* Gate 5-A physical QA: align mobile trial-balance cells while preserving a 44px touch target. */',
    '@media (max-width: 480px) {',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tbody tr {',
    '    height: 44px;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] tbody td {',
    '    height: 44px;',
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
    '    height: 44px;',
    '    min-height: 44px;',
    '    padding: 0 4px;',
    '    border: 0;',
    '    border-radius: 0;',
    '    background: transparent;',
    '    font-size: 16px;',
    '    line-height: 1.25;',
    '  }',
    '}',
    ''
  ].join('\n');
  const newBlock=[
    '/* Gate 5-A physical QA: keep the three-column trial balance inside the mobile viewport. */',
    '@media (max-width: 480px) {',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] {',
    '    box-sizing: border-box;',
    '    width: 100%;',
    '    min-width: 100%;',
    '    max-width: 100%;',
    '    table-layout: fixed;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] th,',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td {',
    '    box-sizing: border-box;',
    '    height: 44px;',
    '    padding: 0 4px;',
    '    vertical-align: middle;',
    '    line-height: 1.25;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] th {',
    '    font-size: .82rem;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td {',
    '    font-size: .85rem;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] th[data-column-key="account"],',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td[data-column-key="account"] {',
    '    width: 40%;',
    '    min-width: 0;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td[data-column-key="account"] {',
    '    text-align: left;',
    '    white-space: nowrap;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] th[data-column-type="numeric"],',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td[data-column-type="numeric"] {',
    '    width: 30%;',
    '    min-width: 0;',
    '  }',
    '  .answer-table:not(.eight-column-worksheet)[data-question-type="trial_balance"] td.amount-cell {',
    '    min-width: 0;',
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
    '    height: 44px;',
    '    min-height: 44px;',
    '    padding: 0 4px;',
    '    border: 0;',
    '    border-radius: 0;',
    '    background: transparent;',
    '    font-size: 16px;',
    '    line-height: 1.25;',
    '  }',
    '}',
    ''
  ].join('\n');
  s=replaceOnce(s,oldBlock,newBlock,'trial-balance compact CSS');
  write(file,s);
}

function updateMobileRegression(){
  const file='tests/mobile-layout.test.js';
  let s=read(file);
  if(s.includes('Gate 5-A T001 mobile-fit regression'))throw new Error('mobile-fit regression already present');
  const block=[
    '',
    '// Gate 5-A T001 mobile-fit regression.',
    'const trialBalanceTableRule = css.match(/\\.answer-table:not\\(\\.eight-column-worksheet\\)\\[data-question-type="trial_balance"\\]\\s*\\{([^}]*)\\}/)?.[1] || "";',
    'assert(/width:\\s*100%/.test(trialBalanceTableRule) && /max-width:\\s*100%/.test(trialBalanceTableRule) && /table-layout:\\s*fixed/.test(trialBalanceTableRule), "three-column trial balance is constrained to the mobile viewport instead of a max-content canvas");',
    'const trialBalanceAccountRule = css.match(/td\\[data-column-key="account"\\]\\s*\\{([^}]*)\\}/)?.[1] || "";',
    'assert(/width:\\s*40%/.test(trialBalanceAccountRule) && /min-width:\\s*0/.test(trialBalanceAccountRule), "trial-balance account column stays visible within a compact 40% budget");',
    'const trialBalanceNumericRule = css.match(/td\\[data-column-type="numeric"\\]\\s*\\{([^}]*)\\}/)?.[1] || "";',
    'assert(/width:\\s*30%/.test(trialBalanceNumericRule) && /min-width:\\s*0/.test(trialBalanceNumericRule), "trial-balance debit and credit columns each use a compact 30% budget");'
  ].join('\n');
  s=s.trimEnd()+block+'\n';
  write(file,s);
}

function updateVisualGate(){
  const file='.github/visual/run-explanation-integration.js';
  let s=read(file);
  s=replaceOnce(
    s,
    "trialTable=document.querySelector('.answer-table[data-question-type=\"trial_balance\"]'),trialRows=",
    "trialTable=document.querySelector('.answer-table[data-question-type=\"trial_balance\"]'),trialWrap=trialTable?.closest('.table-question-wrap')||null,trialRows=",
    'visual wrap measure'
  );
  s=replaceOnce(
    s,
    "trialMetrics={tableCount:trialTable?1:0,normalRowHeight:",
    "trialTableRect=trialTable?rect(trialTable):null,trialWrapRect=trialWrap?rect(trialWrap):null,trialMetrics={tableCount:trialTable?1:0,wrapClientWidth:trialWrap?.clientWidth||0,wrapScrollWidth:trialWrap?.scrollWidth||0,tableWidth:trialTableRect?.width||0,tableLeft:trialTableRect?.left||0,tableRight:trialTableRect?.right||0,wrapLeft:trialWrapRect?.left||0,wrapRight:trialWrapRect?.right||0,normalRowHeight:",
    'visual fit metrics'
  );
  const density="violations.push('TRIAL_BALANCE_INPUT_DENSITY');";
  const fit=density+"if(caseId==='T001'&&width<=480&&(m.trialMetrics.wrapClientWidth<=0||m.trialMetrics.wrapScrollWidth>m.trialMetrics.wrapClientWidth+1||m.trialMetrics.tableWidth>m.trialMetrics.wrapClientWidth+1.5||m.trialMetrics.tableLeft<m.trialMetrics.wrapLeft-1||m.trialMetrics.tableRight>m.trialMetrics.wrapRight+1.5))violations.push('TRIAL_BALANCE_MOBILE_FIT');";
  s=replaceOnce(s,density,fit,'visual mobile fit violation');
  write(file,s);
}

function updateGenerationImmutability(){
  const file='independent-audit/tests/generation-immutability.test.js';
  let s=read(file);
  const seq48='[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]';
  const seq49=seq48.slice(0,-1)+',49]';
  const seq50=seq49.slice(0,-1)+',50]';
  if(!s.includes('const generation49Committed=committed(49);'))throw new Error('Generation 49 immutability anchor missing');
  s=s.replaceAll(seq49,seq50);
  s=replaceOnce(s,': '+seq48,': '+seq49,'Generation 50 pre-commit sequence');
  s=s.replaceAll('generation49Committed','generation50Committed');
  s=s.replaceAll('committed(49)','committed(50)');
  s=s.replaceAll('authorityPath(49)','authorityPath(50)');
  s=s.replaceAll('document.generation<49','document.generation<50');
  s=s.replaceAll('Generation 49','Generation 50');
  s=s.replace('authority sequence is [2..48] before Generation 50 or [2..49] after commit','authority sequence is [2..49] before Generation 50 or [2..50] after commit');
  s=s.replace('stale-predecessor Generation 50 successor is rejected','stale-predecessor Generation 51 successor is rejected');
  s=s.replace('skipped.generation=50;','skipped.generation=51;');
  write(file,s);
}

function updateRelease(){
  const release='20260924-119',previous='20260924-118';
  let index=read('index.html');
  if(!index.includes(previous))throw new Error('index release anchor missing');
  index=index.replaceAll(previous,release);
  write('index.html',index);

  let sw=read('service-worker.js');
  sw=replaceOnce(sw,"const RELEASE = '20260924-118';","const RELEASE = '20260924-119';",'service worker release');
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

function createGeneration50(){
  const lifecycle=require('./scripts/qa/phase-b-lifecycle');
  const file='reports/auto-gate/audit-locks/phase-b-generation-50.json';
  if(fs.existsSync(file))throw new Error('Generation 50 authority already exists');
  const authorities=lifecycle.generationAuthorities();
  if(authorities.at(-1)?.document?.generation!==49)throw new Error('Generation 49 is not the latest authority');
  const candidate=lifecycle.createCandidate();
  if(candidate.generation!==50)throw new Error('expected Generation 50, got '+candidate.generation);
  if(candidate.predecessor.generation!==49)throw new Error('Generation 50 predecessor mismatch');
  const verification=lifecycle.verifyCandidate(candidate);
  if(!verification.ok)throw new Error(verification.errors.join(', '));
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
  console.log('GENERATION_50_CANDIDATE_OK '+candidate.baselineIdentity+' '+candidate.auditHash);
}

updateCss();
updateMobileRegression();
updateVisualGate();
updateGenerationImmutability();
updateRelease();
createGeneration50();
console.log('T001_MOBILE_FIT_FIX_APPLIED');
