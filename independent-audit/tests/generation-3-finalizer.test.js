'use strict';
const assert=require('assert');
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');
const finalizer=require('../../scripts/qa/finalize-phase-b-generation-3');

const script=path.join(core.ROOT,'scripts/qa/finalize-phase-b-generation-3.js');
const generation2=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const phaseA=path.join(core.ROOT,lifecycle.ROOT_LOCK);
const output=finalizer.output;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const generation2Bytes=fs.readFileSync(generation2),phaseABytes=fs.readFileSync(phaseA);
const run=()=>childProcess.spawnSync(process.execPath,[script],{cwd:core.ROOT,encoding:'utf8'});
let count=0;const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
try{
  const committedOutput=childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-3.json'],{cwd:core.ROOT}).status===0;
  if(committedOutput){
    const issued=fs.readFileSync(output),issuedDocument=JSON.parse(issued),authorities=lifecycle.generationAuthorities();
    test('1. committed Generation 3 is discovered',()=>assert.strictEqual(authorities.at(-1).document.generation,3));
    test('2. predecessor is exact Generation 2 content identity',()=>assert.deepStrictEqual(issuedDocument.predecessor,lifecycle.identity(authorities[0].document)));
    test('3. committed Generation 3 passes current integrity',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
    test('4. duplicate Generation 3 issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('5. Generation 2 remains byte-identical',()=>assert(fs.readFileSync(generation2).equals(generation2Bytes)));
    test('6. Phase A remains byte-identical',()=>assert(fs.readFileSync(phaseA).equals(phaseABytes)));
    test('7. squash-style commit movement does not affect identity',()=>assert(!Object.hasOwn(issuedDocument.predecessor,'commit')));
  }else{
    fs.rmSync(output,{force:true});
    const candidate=lifecycle.createCandidate();
    const authorities=lifecycle.generationAuthorities();
    test('1. candidate is Generation 3',()=>assert.strictEqual(candidate.generation,3));
    test('2. predecessor is exact Generation 2 content identity',()=>assert.deepStrictEqual(candidate.predecessor,lifecycle.identity(authorities[0].document)));
    test('3. valid Generation 3 candidate passes',()=>assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true));
    test('4. generation skip fails',()=>{const mutant=structuredClone(candidate);mutant.generation=4;assert.strictEqual(lifecycle.verifyCandidate(mutant).ok,false);});
    test('5. squash-style commit movement does not affect content identity',()=>assert(!Object.hasOwn(candidate.predecessor,'commit')));
    test('6. finalizer targets only Generation 3 authority',()=>assert.strictEqual(path.basename(output),'phase-b-generation-3.json'));
    test('7. finalizer preserves historical authority hashes',()=>{assert.strictEqual(digest(phaseABytes),finalizer.expectedPhaseASha256);assert.strictEqual(digest(generation2Bytes),finalizer.expectedGeneration2Sha256);});
    test('8. unexpected Production drift fails',()=>{const target=path.join(core.ROOT,'manifest.webmanifest'),saved=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.notStrictEqual(run().status,0);}finally{fs.writeFileSync(target,saved);}});
    test('9. unexpected audit drift fails',()=>{const target=path.join(core.ROOT,'independent-audit/unapproved-generation-3.tmp');try{fs.writeFileSync(target,'unexpected\n');assert.notStrictEqual(run().status,0);}finally{fs.rmSync(target,{force:true});}});
    test('10. one-use issuance succeeds',()=>{const result=run();assert.strictEqual(result.status,0,result.stderr||result.stdout);assert(fs.existsSync(output));});
    const issued=fs.readFileSync(output),issuedDocument=JSON.parse(issued);
    test('11. issued bytes equal reproducible candidate bytes',()=>assert(issued.equals(Buffer.from(JSON.stringify(candidate,null,2)+'\n'))));
    test('12. duplicate Generation 3 issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('13. Generation 2 cannot be overwritten',()=>assert(fs.readFileSync(generation2).equals(generation2Bytes)));
    test('14. Phase A cannot be changed',()=>assert(fs.readFileSync(phaseA).equals(phaseABytes)));
    test('15. issued candidate passes explicit verification',()=>assert.strictEqual(lifecycle.verifyCandidate(issuedDocument).ok,true));
  }
}finally{
  const committedOutput=childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-3.json'],{cwd:core.ROOT}).status===0;
  if(!committedOutput)fs.rmSync(output,{force:true});
  assert(fs.readFileSync(generation2).equals(generation2Bytes));
  assert(fs.readFileSync(phaseA).equals(phaseABytes));
}
assert([7,15].includes(count));
console.log(`Generation 3 finalizer regressions: ${count}/${count}`);
