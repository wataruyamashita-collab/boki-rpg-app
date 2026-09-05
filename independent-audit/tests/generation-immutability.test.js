'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const generationPath=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const auditPath=path.join(core.ROOT,'independent-audit/manifest.json');
const generationBytes=fs.readFileSync(generationPath),auditBytes=fs.readFileSync(auditPath);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
let count=0;
const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const rejects=()=>assert.strictEqual(lifecycle.verifyCurrent().ok,false);

try{
  test('1. committed generation unchanged passes',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
  test('2. generation trailing byte tamper fails',()=>{fs.writeFileSync(generationPath,Buffer.concat([generationBytes,Buffer.from(' ')]));rejects();fs.writeFileSync(generationPath,generationBytes);});
  test('3. generation metadata tamper fails',()=>{const value=JSON.parse(generationBytes);value.algorithm='sha512';fs.writeFileSync(generationPath,JSON.stringify(value,null,2)+'\n');rejects();fs.writeFileSync(generationPath,generationBytes);});
  test('4. generation overwrite fails',()=>{const value=JSON.parse(generationBytes);value.baselineIdentity='0'.repeat(64);fs.writeFileSync(generationPath,JSON.stringify(value,null,2)+'\n');rejects();fs.writeFileSync(generationPath,generationBytes);});
  test('5. audit and generation coordinated tamper fails',()=>{fs.writeFileSync(auditPath,Buffer.concat([auditBytes,Buffer.from(' ')]));const value=JSON.parse(generationBytes),relative='independent-audit/manifest.json';value.files[relative]=digest(fs.readFileSync(auditPath));value.auditHash=digest(JSON.stringify(value.files));fs.writeFileSync(generationPath,JSON.stringify(value,null,2)+'\n');rejects();fs.writeFileSync(generationPath,generationBytes);fs.writeFileSync(auditPath,auditBytes);});
  test('6. squash-style retained Generation 2 passes',()=>{const authorities=lifecycle.generationAuthorities();assert.strictEqual(authorities.length,1);assert(authorities[0].bytes.equals(generationBytes));assert.strictEqual(lifecycle.canonicalDocumentHash(authorities[0].document),lifecycle.identity(authorities[0].document).canonicalDocumentSha256);});
}finally{fs.writeFileSync(generationPath,generationBytes);fs.writeFileSync(auditPath,auditBytes);}
assert.strictEqual(count,6);
console.log('Generation authority immutability regressions: 6/6');
