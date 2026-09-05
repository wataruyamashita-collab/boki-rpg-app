'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const rootPath=path.join(core.ROOT,lifecycle.ROOT_LOCK);
const productionPath=path.join(core.ROOT,'index.html');
const savedRoot=fs.readFileSync(rootPath),savedProduction=fs.readFileSync(productionPath);
let count=0;
const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const rejected=candidate=>assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,false);

try{
  const candidate=lifecycle.createCandidate();
  test('unchanged Phase A root passes',()=>assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true));
  test('Phase A root trailing whitespace tamper fails',()=>{fs.writeFileSync(rootPath,Buffer.concat([savedRoot,Buffer.from(' ')]));rejected(candidate);fs.writeFileSync(rootPath,savedRoot);});
  test('Phase A root extra newline tamper fails',()=>{fs.writeFileSync(rootPath,Buffer.concat([savedRoot,Buffer.from('\n')]));rejected(candidate);fs.writeFileSync(rootPath,savedRoot);});
  test('wrong predecessor fails',()=>{const mutant=structuredClone(candidate);mutant.predecessor.auditHash='0'.repeat(64);rejected(mutant);});
  test('Production one-byte tamper fails',()=>{fs.writeFileSync(productionPath,Buffer.concat([savedProduction,Buffer.from(' ')]));rejected(candidate);fs.writeFileSync(productionPath,savedProduction);});
  test('candidate cannot bypass existing authority',()=>{const authority=lifecycle.createCandidate();const bypass=lifecycle.createCandidate('B_GENERATION',[]);assert.strictEqual(lifecycle.verifyCandidate(bypass,{generations:[authority]}).ok,false);});
  test('authority discovery is HEAD-only and never uses --all',()=>{assert(lifecycle.gitArguments.rootHistory.includes('HEAD'));assert(lifecycle.gitArguments.generationFiles.includes('HEAD'));assert(!JSON.stringify(lifecycle.gitArguments).includes('--all'));});
  test('Phase A root remains byte-for-byte unchanged',()=>assert(fs.readFileSync(rootPath).equals(savedRoot)));
}finally{
  fs.writeFileSync(rootPath,savedRoot);
  fs.writeFileSync(productionPath,savedProduction);
}
assert.strictEqual(count,8);
console.log('Phase B lifecycle core regressions: 8/8');
