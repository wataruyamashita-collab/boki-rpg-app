'use strict';
const assert=require('assert');
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');
const finalizer=require('../../scripts/qa/finalize-phase-b-generation-10');
const script=path.join(core.ROOT,'scripts/qa/finalize-phase-b-generation-10.js'),output=finalizer.output;
const historical=new Map(finalizer.authorityPaths.map(file=>[file,fs.readFileSync(file)]));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const run=()=>childProcess.spawnSync(process.execPath,[script],{cwd:core.ROOT,encoding:'utf8'});
let count=0;const test=(name,fn)=>{fn();count++;console.log(`ok ${count} - ${name}`);};
const committed=childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-10.json'],{cwd:core.ROOT}).status===0;
const issuedBeforeTest=fs.existsSync(output);
try{
  const authorities=lifecycle.generationAuthorities(),generation9=authorities.find(item=>item.document.generation===9);
  if(committed||issuedBeforeTest){
    const generation10=committed?authorities.find(item=>item.document.generation===10):{document:JSON.parse(fs.readFileSync(output,'utf8'))};
    test('committed Generation 10 is discoverable',()=>assert(generation10));
    test('Generation 10 predecessor is exact Generation 9',()=>assert.deepStrictEqual(generation10.document.predecessor,lifecycle.identity(generation9.document)));
    if(committed)test('current integrity passes',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
    else test('uncommitted issued candidate verifies',()=>assert.strictEqual(lifecycle.verifyCandidate(generation10.document).ok,true));
    test('duplicate Generation 10 issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('historical authorities remain byte-identical',()=>{for(const [file,bytes] of historical)assert(fs.readFileSync(file).equals(bytes));});
  }else{
    fs.rmSync(output,{force:true});const candidate=lifecycle.createCandidate();
    test('candidate is Generation 10',()=>assert.strictEqual(candidate.generation,10));
    test('predecessor is exact Generation 9',()=>assert.deepStrictEqual(candidate.predecessor,lifecycle.identity(generation9.document)));
    test('valid candidate passes',()=>assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true));
    test('generation skip fails',()=>{const mutant=structuredClone(candidate);mutant.generation=11;assert.strictEqual(lifecycle.verifyCandidate(mutant).ok,false);});
    test('historical raw SHA values are pinned',()=>assert.deepStrictEqual(finalizer.authorityPaths.map(file=>digest(fs.readFileSync(file))),finalizer.expectedAuthoritySha256));
    test('approved Generation 9 identity is pinned',()=>assert.deepStrictEqual([finalizer.approvedHead,finalizer.approvedTree],['3706f7d24e1d75fdba517695f2de2be3a6ee84b6','9bdc95fd5c389eb8f8a7f57d74b0e11d1cf9ba60']));
    test('tested final UI hashes are pinned',()=>{for(const [file,sha] of Object.entries(finalizer.finalProductionSha256))assert.strictEqual(core.sha(file),sha);});
    test('unexpected Production drift fails',()=>{const target=path.join(core.ROOT,'manifest.webmanifest'),saved=fs.readFileSync(target);try{fs.appendFileSync(target,' ');assert.notStrictEqual(run().status,0);}finally{fs.writeFileSync(target,saved);}});
    test('unexpected audit drift fails',()=>{const target=path.join(core.ROOT,'independent-audit/unapproved-generation-10.tmp');try{fs.writeFileSync(target,'unexpected\n');assert.notStrictEqual(run().status,0);}finally{fs.rmSync(target,{force:true});}});
    test('one-use issuance succeeds',()=>{const result=run();assert.strictEqual(result.status,0,result.stderr||result.stdout);assert(fs.existsSync(output));});
    const issued=fs.readFileSync(output),document=JSON.parse(issued);
    test('issued bytes equal candidate bytes',()=>assert(issued.equals(Buffer.from(JSON.stringify(candidate,null,2)+'\n'))));
    test('duplicate issuance fails',()=>assert.notStrictEqual(run().status,0));
    test('historical authorities remain byte-identical',()=>{for(const [file,bytes] of historical)assert(fs.readFileSync(file).equals(bytes));});
    test('issued candidate verifies without itself as predecessor',()=>assert.strictEqual(lifecycle.verifyCandidate(document).ok,true));
  }
}finally{if(!committed&&!issuedBeforeTest)fs.rmSync(output,{force:true});for(const [file,bytes] of historical)fs.writeFileSync(file,bytes);}
console.log(`Generation 10 finalizer regressions: ${count}/${count}`);
