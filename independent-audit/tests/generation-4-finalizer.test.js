'use strict';
const assert=require('assert');
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');
const finalizer=require('../../scripts/qa/finalize-phase-b-generation-4');
const script=path.join(core.ROOT,'scripts/qa/finalize-phase-b-generation-4.js');
const output=finalizer.output;
const historical=[finalizer.phaseAPath,finalizer.generation2Path,finalizer.generation3Path];
const savedHistorical=new Map(historical.map(file=>[file,fs.readFileSync(file)]));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const run=()=>childProcess.spawnSync(process.execPath,[script],{cwd:core.ROOT,encoding:'utf8'});
let count=0;const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const committed=childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-4.json'],{cwd:core.ROOT}).status===0;
try{
  const authorities=lifecycle.generationAuthorities(),generation3=authorities.find(item=>item.document.generation===3);
  if(committed){
    const generation4=authorities.find(item=>item.document.generation===4);
    test('committed Generation 4 is discoverable',()=>assert(generation4));
    test('Generation 4 predecessor is exact Generation 3',()=>assert.deepStrictEqual(generation4.document.predecessor,lifecycle.identity(generation3.document)));
    test('current integrity passes',()=>assert.strictEqual(core.currentIntegrityCheck().ok,true));
    test('duplicate Generation 4 issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('historical authorities remain byte-identical',()=>{for(const [file,bytes] of savedHistorical)assert(fs.readFileSync(file).equals(bytes));});
    test('commit SHA is excluded from authority identity',()=>assert(!Object.hasOwn(generation4.document.predecessor,'commit')));
  }else{
    fs.rmSync(output,{force:true});
    const candidate=lifecycle.createCandidate();
    test('candidate is Generation 4',()=>assert.strictEqual(candidate.generation,4));
    test('predecessor is exact Generation 3 identity',()=>assert.deepStrictEqual(candidate.predecessor,lifecycle.identity(generation3.document)));
    test('valid candidate passes',()=>assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true));
    test('generation skip fails',()=>{const mutant=structuredClone(candidate);mutant.generation=5;assert.strictEqual(lifecycle.verifyCandidate(mutant).ok,false);});
    test('historical raw SHA values are pinned',()=>assert.deepStrictEqual(historical.map(file=>digest(fs.readFileSync(file))),[finalizer.expectedPhaseASha256,finalizer.expectedGeneration2Sha256,finalizer.expectedGeneration3Sha256]));
    test('unexpected Production drift fails',()=>{const target=path.join(core.ROOT,'manifest.webmanifest'),saved=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.notStrictEqual(run().status,0);}finally{fs.writeFileSync(target,saved);}});
    test('unexpected audit drift fails',()=>{const target=path.join(core.ROOT,'independent-audit/unapproved-generation-4.tmp');try{fs.writeFileSync(target,'unexpected\n');assert.notStrictEqual(run().status,0);}finally{fs.rmSync(target,{force:true});}});
    test('one-use issuance succeeds',()=>{const result=run();assert.strictEqual(result.status,0,result.stderr||result.stdout);assert(fs.existsSync(output));});
    const issued=fs.readFileSync(output),document=JSON.parse(issued);
    test('issued bytes equal reproducible candidate bytes',()=>assert(issued.equals(Buffer.from(JSON.stringify(candidate,null,2)+'\n'))));
    test('duplicate Generation 4 issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('historical A/2/3 remain byte-identical',()=>{for(const [file,bytes] of savedHistorical)assert(fs.readFileSync(file).equals(bytes));});
    test('issued candidate passes explicit verification without itself in predecessor set',()=>assert.strictEqual(lifecycle.verifyCandidate(document).ok,true));
    test('commit SHA is excluded from authority identity',()=>assert(!Object.hasOwn(document.predecessor,'commit')));
  }
}finally{
  if(!committed)fs.rmSync(output,{force:true});
  for(const [file,bytes] of savedHistorical){assert(fs.readFileSync(file).equals(bytes));}
}
console.log(`Generation 4 finalizer regressions: ${count}/${count}`);
