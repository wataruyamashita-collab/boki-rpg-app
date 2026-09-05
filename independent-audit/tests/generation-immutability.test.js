'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const childProcess=require('child_process');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const authorityPath=generation=>path.join(core.ROOT,`reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`);
const auditPath=path.join(core.ROOT,'independent-audit/manifest.json');
const authorityBytes=new Map([2,3,4].filter(generation=>fs.existsSync(authorityPath(generation))).map(generation=>[generation,fs.readFileSync(authorityPath(generation))]));
const auditBytes=fs.readFileSync(auditPath);
const committed=generation=>childProcess.spawnSync('git',['cat-file','-e',`HEAD:reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`],{cwd:core.ROOT}).status===0;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
let count=0;
const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const currentErrors=()=>lifecycle.verifyCurrent().errors;
const rawDifferenceDetected=file=>currentErrors().includes(`${file} raw bytes differ from immutable historical authority`);
const rejectCandidate=(candidate,generations)=>assert.strictEqual(lifecycle.verifyCandidate(candidate,{generations}).ok,false);

try{
  const authorities=lifecycle.generationAuthorities();
  const generations=authorities.map(item=>item.document.generation);
  const generation4Committed=committed(4);
  test('1. authority sequence is exactly [2,3] before Generation 4 or [2,3,4] after commit',()=>assert.deepStrictEqual(generations,generation4Committed?[2,3,4]:[2,3]));
  for(const generation of [2,3])test(`Generation ${generation} worktree bytes remain immutable`,()=>assert(authorities.find(item=>item.document.generation===generation).bytes.equals(authorityBytes.get(generation))));
  if(generation4Committed)test('Generation 4 worktree bytes remain immutable',()=>assert(authorities.find(item=>item.document.generation===4).bytes.equals(authorityBytes.get(4))));
  for(let index=1;index<authorities.length;index+=1)test(`Generation ${generations[index]} predecessor is exact Generation ${generations[index-1]} identity`,()=>assert.deepStrictEqual(authorities[index].document.predecessor,lifecycle.identity(authorities[index-1].document)));
  test('authority identities are content-based and exclude commit SHA',()=>{for(const authority of authorities){const identity=lifecycle.identity(authority.document);assert.strictEqual(identity.canonicalDocumentSha256,lifecycle.canonicalDocumentHash(authority.document));assert(!Object.hasOwn(identity,'commit'));}});
  for(const generation of generations)test(`Generation ${generation} trailing-byte tamper is rejected`,()=>{const target=authorityPath(generation),saved=authorityBytes.get(generation);fs.writeFileSync(target,Buffer.concat([saved,Buffer.from(' ')]));assert(rawDifferenceDetected(`reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`));fs.writeFileSync(target,saved);});
  const generation2=authorities.find(item=>item.document.generation===2).document;
  const generation3=authorities.find(item=>item.document.generation===3).document;
  const generation4=generation4Committed?authorities.find(item=>item.document.generation===4).document:lifecycle.createCandidate();
  test('duplicate Generation 2 is rejected',()=>rejectCandidate(generation4,[generation2,structuredClone(generation2),generation3]));
  test('duplicate Generation 3 is rejected',()=>rejectCandidate(generation4,[generation2,generation3,structuredClone(generation3)]));
  test('duplicate Generation 4 is rejected',()=>rejectCandidate(generation4,[generation2,generation3,generation4,structuredClone(generation4)]));
  test('skipped Generation 4 is rejected',()=>{const skipped=structuredClone(generation4);skipped.generation=5;rejectCandidate(skipped,[generation2,generation3]);});
  test('competing or forked Generation 4 is rejected',()=>{const fork=structuredClone(generation4);fork.auditHash='f'.repeat(64);rejectCandidate(generation4,[generation2,generation3,fork]);});
  test('broken Generation 4 predecessor is rejected',()=>{const broken=structuredClone(generation4);broken.predecessor.canonicalDocumentSha256='0'.repeat(64);rejectCandidate(broken,[generation2,generation3]);});
  test('coordinated audit and historical authority tamper is rejected',()=>{fs.writeFileSync(auditPath,Buffer.concat([auditBytes,Buffer.from(' ')]));const target=authorityPath(2),value=JSON.parse(authorityBytes.get(2)),relative='independent-audit/manifest.json';value.files[relative]=digest(fs.readFileSync(auditPath));value.auditHash=digest(JSON.stringify(value.files));fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');const errors=currentErrors();assert(errors.includes('reports/auto-gate/audit-locks/phase-b-generation-2.json raw bytes differ from immutable historical authority'));assert(errors.includes(relative));fs.writeFileSync(target,authorityBytes.get(2));fs.writeFileSync(auditPath,auditBytes);});
  if(generation4Committed)test('committed linear Generation 4 chain passes current integrity',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
}finally{
  fs.writeFileSync(auditPath,auditBytes);
  for(const [generation,bytes] of authorityBytes)fs.writeFileSync(authorityPath(generation),bytes);
}
console.log(`Generation authority successor-aware immutability regressions: ${count}/${count}`);
