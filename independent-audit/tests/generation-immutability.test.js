'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const generation2Path=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const generation3Path=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-3.json');
const auditPath=path.join(core.ROOT,'independent-audit/manifest.json');
const generation2Bytes=fs.readFileSync(generation2Path),auditBytes=fs.readFileSync(auditPath);
const generation3Committed=fs.existsSync(generation3Path)&&require('child_process').spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-3.json'],{cwd:core.ROOT}).status===0;
const generation3Bytes=generation3Committed?fs.readFileSync(generation3Path):null;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
let count=0;
const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const currentErrors=()=>lifecycle.verifyCurrent().errors;
const rawDifferenceDetected=file=>currentErrors().includes(`${file} raw bytes differ from immutable historical authority`);
const rejectCandidate=(candidate,generations)=>assert.strictEqual(lifecycle.verifyCandidate(candidate,{generations}).ok,false);

try{
  const authorities=lifecycle.generationAuthorities();
  const generations=authorities.map(item=>item.document.generation);
  test('1. successor-aware authority sequence is exactly [2] before issuance or [2,3] after issuance',()=>assert.deepStrictEqual(generations,generation3Committed?[2,3]:[2]));
  test('2. Generation 2 worktree bytes equal immutable historical authority',()=>assert(authorities[0].bytes.equals(generation2Bytes)));
  test('3. Generation 2 canonical identity is content-based and excludes commit SHA',()=>{const identity=lifecycle.identity(authorities[0].document);assert.strictEqual(identity.canonicalDocumentSha256,lifecycle.canonicalDocumentHash(authorities[0].document));assert(!Object.hasOwn(identity,'commit'));});
  if(generation3Committed){
    test('4. Generation 3 worktree bytes equal immutable historical authority',()=>assert(authorities[1].bytes.equals(generation3Bytes)));
    test('5. Generation 3 predecessor is exactly Generation 2 identity',()=>assert.deepStrictEqual(authorities[1].document.predecessor,lifecycle.identity(authorities[0].document)));
  }
  test('Generation 2 trailing-byte tamper is rejected',()=>{fs.writeFileSync(generation2Path,Buffer.concat([generation2Bytes,Buffer.from(' ')]));assert(rawDifferenceDetected('reports/auto-gate/audit-locks/phase-b-generation-2.json'));fs.writeFileSync(generation2Path,generation2Bytes);});
  test('Generation 2 metadata tamper is rejected',()=>{const value=JSON.parse(generation2Bytes);value.algorithm='sha512';fs.writeFileSync(generation2Path,JSON.stringify(value,null,2)+'\n');assert(rawDifferenceDetected('reports/auto-gate/audit-locks/phase-b-generation-2.json'));fs.writeFileSync(generation2Path,generation2Bytes);});
  test('Generation 2 overwrite tamper is rejected',()=>{const value=JSON.parse(generation2Bytes);value.baselineIdentity='0'.repeat(64);fs.writeFileSync(generation2Path,JSON.stringify(value,null,2)+'\n');assert(rawDifferenceDetected('reports/auto-gate/audit-locks/phase-b-generation-2.json'));fs.writeFileSync(generation2Path,generation2Bytes);});
  test('coordinated audit and Generation 2 tamper is rejected',()=>{fs.writeFileSync(auditPath,Buffer.concat([auditBytes,Buffer.from(' ')]));const value=JSON.parse(generation2Bytes),relative='independent-audit/manifest.json';value.files[relative]=digest(fs.readFileSync(auditPath));value.auditHash=digest(JSON.stringify(value.files));fs.writeFileSync(generation2Path,JSON.stringify(value,null,2)+'\n');const errors=currentErrors();assert(errors.includes('reports/auto-gate/audit-locks/phase-b-generation-2.json raw bytes differ from immutable historical authority'));assert(errors.includes(relative));fs.writeFileSync(generation2Path,generation2Bytes);fs.writeFileSync(auditPath,auditBytes);});
  const generation2=authorities[0].document;
  const validSuccessor=generation3Committed?authorities[1].document:lifecycle.createCandidate();
  test('duplicate Generation 2 is rejected',()=>rejectCandidate(validSuccessor,[generation2,structuredClone(generation2)]));
  test('duplicate Generation 3 is rejected',()=>rejectCandidate(validSuccessor,[generation2,validSuccessor,structuredClone(validSuccessor)]));
  test('Generation 4 without explicit future evolution is rejected',()=>{const generation4=structuredClone(validSuccessor);generation4.generation=4;rejectCandidate(generation4,[generation2]);});
  test('competing or forked successor is rejected',()=>{const fork=structuredClone(validSuccessor);fork.auditHash='f'.repeat(64);rejectCandidate(validSuccessor,[generation2,fork]);});
  test('broken Generation 3 predecessor identity is rejected',()=>{const broken=structuredClone(validSuccessor);broken.predecessor.canonicalDocumentSha256='0'.repeat(64);rejectCandidate(broken,[generation2]);});
  if(generation3Committed){
    test('Generation 3 trailing-byte tamper is rejected',()=>{fs.writeFileSync(generation3Path,Buffer.concat([generation3Bytes,Buffer.from(' ')]));assert(rawDifferenceDetected('reports/auto-gate/audit-locks/phase-b-generation-3.json'));fs.writeFileSync(generation3Path,generation3Bytes);});
    test('committed linear Generation 3 chain passes current integrity',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
  }
}finally{
  fs.writeFileSync(generation2Path,generation2Bytes);
  fs.writeFileSync(auditPath,auditBytes);
  if(generation3Committed)fs.writeFileSync(generation3Path,generation3Bytes);
}
assert.strictEqual(count,generation3Committed?16:12);
console.log(`Generation authority successor-aware immutability regressions: ${count}/${count}`);
