'use strict';

const assert=require('assert'),fs=require('fs'),path=require('path');
const core=require('../../scripts/qa/audit-core');
const runner=require('../../scripts/qa/contract-runner');
const lockPath=path.join(core.ROOT,'reports/auto-gate/audit-lock.json');
const saved=fs.readFileSync(lockPath);
let count=0;const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};

test('Final lock uses schema version 2',()=>assert.strictEqual(JSON.parse(saved).schemaVersion,2));
test('Final lock names the immutable Phase A baseline',()=>assert.strictEqual(JSON.parse(saved).phase,'A_FINAL_IMMUTABLE_BASELINE'));
test('Final lock uses baseline version 1',()=>assert.strictEqual(JSON.parse(saved).baselineVersion,1));
test('Final lock uses sha256',()=>assert.strictEqual(JSON.parse(saved).algorithm,'sha256'));
test('baseline identity is production-bound',()=>assert.match(JSON.parse(saved).baselineIdentity,/^[0-9a-f]{64}$/u));
test('audit hash is present',()=>assert.match(JSON.parse(saved).auditHash,/^[0-9a-f]{64}$/u));
test('all current audit files are locked',()=>{const lock=JSON.parse(saved);for(const file of [...core.walk('independent-audit'),...core.walk('scripts/qa')])assert(file in lock.files,file);});
test('final integrity has seven executable adversarial requirements',()=>{const contract=core.json('independent-audit/contracts/final-integrity.json');assert.strictEqual(contract.requirements.length,7);assert.strictEqual(contract.requiredCheckIds.length,7);assert(contract.requiredCheckIds.every(id=>contract.checkLayers[id]==='ADVERSARIAL'&&typeof runner.executableChecks[id]==='function'));});
test('current immutable lock passes',()=>assert.strictEqual(core.lockCheck().ok,true));
test('metadata tamper and schema downgrade are rejected',()=>{
  const reachable=core.reachableFinalV2().length;
  assert.strictEqual(reachable,1);
  try{
    const metadata=JSON.parse(saved);metadata.createdBy='tampered';fs.writeFileSync(lockPath,JSON.stringify(metadata,null,2)+'\n');let rejected=core.lockCheck();assert.strictEqual(rejected.ok,false);assert.strictEqual(rejected.reachableFinalV2,1);
    const downgrade=JSON.parse(saved);downgrade.schemaVersion=1;downgrade.phase='legacy';fs.writeFileSync(lockPath,JSON.stringify(downgrade,null,2)+'\n');rejected=core.lockCheck();assert.strictEqual(rejected.ok,false);assert.strictEqual(rejected.reachableFinalV2,1);
  }finally{fs.writeFileSync(lockPath,saved);}
});
assert.strictEqual(count,10);console.log('Audit Lock tests: 10/10');
