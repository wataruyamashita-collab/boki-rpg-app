'use strict';
const assert=require('assert'),crypto=require('crypto'),fs=require('fs'),path=require('path');
const core=require('../../scripts/qa/audit-core');
const lockPath=path.join(core.ROOT,'reports/auto-gate/audit-lock.json'),sourcePath=path.join(core.ROOT,'scripts/qa/audit-core.js');
const lock=JSON.parse(fs.readFileSync(lockPath));let count=0;
function test(name,fn){fn();count++;console.log(`TEST ${count} PASS ${name}`);}
test('schema version is Final V2',()=>assert.strictEqual(lock.lockSchemaVersion,2));
test('phase is immutable Phase A',()=>assert.strictEqual(lock.phase,'A_FINAL_IMMUTABLE_BASELINE'));
test('baseline version is one',()=>assert.strictEqual(lock.baselineVersion,1));
test('algorithm is sha256',()=>assert.strictEqual(lock.algorithm,'sha256'));
test('audit file set is non-empty',()=>assert(Object.keys(lock.files).length>0));
test('audit hash binds the ordered file map',()=>assert.strictEqual(lock.auditHash,crypto.createHash('sha256').update(JSON.stringify(lock.files)).digest('hex')));
test('baseline identity is present',()=>assert.match(lock.baselineIdentity,/^[0-9a-f]{64}$/u));
test('all locked files match',()=>{for(const [file,hash] of Object.entries(lock.files))assert.strictEqual(core.sha(file),hash,file);});
test('verification is fail-closed unless pending bootstrap is explicit',()=>{const result=core.lockCheck();assert.strictEqual(result.ok,process.env.AUDIT_LOCK_ALLOW_PENDING_BASELINE==='1'||result.reachableFinalV2===1);});
test('committed coordinated tamper cannot become authority',()=>{const result=core.lockCheck(),source=fs.readFileSync(sourcePath,'utf8');assert.match(source,/current lock differs from immutable Final V2 authority/u);if(result.reachableFinalV2===1){const saved=fs.readFileSync(lockPath);try{const tampered=structuredClone(lock);tampered.createdBy='coordinated tamper';fs.writeFileSync(lockPath,JSON.stringify(tampered,null,2)+'\n');const rejected=core.lockCheck();assert.strictEqual(rejected.ok,false);assert(rejected.errors.includes('current lock differs from immutable Final V2 authority'));}finally{fs.writeFileSync(lockPath,saved);}}});
assert.strictEqual(count,10);console.log('Audit Lock Final V2: 10/10 PASS');
