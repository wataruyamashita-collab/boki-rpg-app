'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const childProcess=require('child_process');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const rootPath=path.join(core.ROOT,lifecycle.ROOT_LOCK);
const productionPath=path.join(core.ROOT,'index.html');
const auditPath=path.join(core.ROOT,'independent-audit/manifest.json');
const unlockedPath=path.join(core.ROOT,'independent-audit/lifecycle-unlocked.tmp');
const savedRoot=fs.readFileSync(rootPath),savedProduction=fs.readFileSync(productionPath),savedAudit=fs.readFileSync(auditPath);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
let count=0;
const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const rejected=(candidate,options={generations:[]})=>assert.strictEqual(lifecycle.verifyCandidate(candidate,options).ok,false);
const mutate=(value,path,valueAtPath)=>{const copy=structuredClone(value);let target=copy;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=valueAtPath;return copy;};

try{
  fs.rmSync(unlockedPath,{force:true});
  const candidate=lifecycle.createCandidate('B_GENERATION',[]);
  const authority=structuredClone(candidate);
  const successor=lifecycle.createCandidate('B_GENERATION',[authority]);

  test('1. Phase A unchanged passes',()=>assert.strictEqual(lifecycle.verifyCandidate(candidate,{generations:[]}).ok,true));
  test('2. Phase A trailing whitespace fails',()=>{fs.writeFileSync(rootPath,Buffer.concat([savedRoot,Buffer.from(' ')]));rejected(candidate);fs.writeFileSync(rootPath,savedRoot);});
  test('3. Phase A extra newline fails',()=>{fs.writeFileSync(rootPath,Buffer.concat([savedRoot,Buffer.from('\n')]));rejected(candidate);fs.writeFileSync(rootPath,savedRoot);});
  test('4. missing predecessor fails',()=>{const mutant=structuredClone(authority);delete mutant.predecessor;rejected(successor,{generations:[mutant]});});
  test('5. wrong predecessor canonical hash fails',()=>rejected(successor,{generations:[mutate(authority,['predecessor','canonicalDocumentSha256'],'0'.repeat(64))]}));
  test('6. wrong predecessor auditHash fails',()=>rejected(successor,{generations:[mutate(authority,['predecessor','auditHash'],'0'.repeat(64))]}));
  test('7. wrong predecessor baselineIdentity fails',()=>rejected(successor,{generations:[mutate(authority,['predecessor','baselineIdentity'],'0'.repeat(64))]}));
  test('8. duplicate generation fails',()=>rejected(successor,{generations:[authority,structuredClone(authority)]}));
  test('9. skipped generation fails',()=>{const mutant=structuredClone(authority);mutant.generation=3;rejected(successor,{generations:[mutant]});});
  test('10. generation downgrade fails',()=>{const mutant=structuredClone(authority);mutant.generation=1;rejected(successor,{generations:[mutant]});});
  test('11. phase downgrade fails',()=>{const mutant=structuredClone(authority);mutant.phase='A_GENERATION';rejected(successor,{generations:[mutant]});});
  test('12. unknown schema fails',()=>rejected(mutate(candidate,['schemaVersion'],4)));
  test('13. unknown phase fails',()=>rejected(mutate(candidate,['phase'],'C_GENERATION')));
  test('14. competing or forked tips fail',()=>{const fork=structuredClone(authority);fork.auditHash='f'.repeat(64);rejected(successor,{generations:[authority,fork]});});
  test('15. audit-file tamper fails',()=>{fs.writeFileSync(auditPath,Buffer.concat([savedAudit,Buffer.from(' ')]));rejected(candidate);fs.writeFileSync(auditPath,savedAudit);});
  test('16. unlocked audit file fails',()=>{fs.writeFileSync(unlockedPath,'not in candidate\n');rejected(candidate);fs.rmSync(unlockedPath);});
  test('17. Production tamper fails',()=>{fs.writeFileSync(productionPath,Buffer.concat([savedProduction,Buffer.from(' ')]));rejected(candidate);fs.writeFileSync(productionPath,savedProduction);});
  test('18. coordinated audit and candidate tamper fails',()=>{const mutant=structuredClone(candidate);mutant.files['independent-audit/manifest.json']='0'.repeat(64);mutant.auditHash=digest(JSON.stringify(mutant.files));rejected(mutant);});
  test('19. candidate wrong predecessor fails',()=>rejected(mutate(successor,['predecessor','canonicalDocumentSha256'],'0'.repeat(64)),{generations:[authority]}));
  test('20. candidate cannot bypass existing authority',()=>{const bypass=lifecycle.createCandidate('B_GENERATION',[]);rejected(bypass,{generations:[authority]});});
  test('21. commit-SHA change alone does not invalidate identity',()=>{const first={commit:'a'.repeat(40),identity:lifecycle.identity(authority)};const second={commit:'b'.repeat(40),identity:lifecycle.identity(authority)};assert.notStrictEqual(first.commit,second.commit);assert.deepStrictEqual(first.identity,second.identity);assert(!Object.hasOwn(first.identity,'commit'));});
  test('22. squash-style tree retaining the Phase A root remains valid',()=>{const historical=lifecycle.phaseARootAuthority();const treeBytes=childProcess.execFileSync('git',['show',`HEAD:${lifecycle.ROOT_LOCK}`],{cwd:core.ROOT});assert(treeBytes.equals(historical.bytes));assert.strictEqual(historical.document.phase,'A_FINAL_IMMUTABLE_BASELINE');});
  test('23. authority discovery is HEAD-only and never uses --all',()=>{assert(lifecycle.gitArguments.rootHistory.includes('HEAD'));assert(lifecycle.gitArguments.generationFiles.includes('HEAD'));assert(!JSON.stringify(lifecycle.gitArguments).includes('--all'));});
}finally{
  fs.writeFileSync(rootPath,savedRoot);
  fs.writeFileSync(productionPath,savedProduction);
  fs.writeFileSync(auditPath,savedAudit);
  fs.rmSync(unlockedPath,{force:true});
}
assert.strictEqual(count,23);
console.log('Phase B lifecycle core regressions: 23/23');
