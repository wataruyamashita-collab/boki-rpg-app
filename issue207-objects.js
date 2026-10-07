'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert'),crypto=require('crypto');
const mode=process.argv[2],temp=process.env.RUNNER_TEMP;
const first=['.github/visual/run-content-progress-migration.js','.github/workflows/visual-gate.yml','independent-audit/tests/generation-immutability.test.js','index.html','js/controller.js','js/model.js','package.json','pwa-release-manifest.json','reports/auto-gate/audit-locks/phase-b-generation-118.json','service-worker.js','tests/content-progress-integration.test.js','tests/content-progress-migration.test.js','tests/fixed-asset-ledger.test.js','tests/helpers/issue207-fixtures.js'];
const second=['.github/visual/run-content-progress-migration.js','independent-audit/tests/generation-immutability.test.js','index.html','js/model.js','pwa-release-manifest.json','reports/auto-gate/audit-locks/phase-b-generation-119.json','service-worker.js','tests/content-progress-integration.test.js'];
const blob=(path,bytes)=>({path,sha:crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'),content:bytes.toString('base64')});
assert(['capture','publish'].includes(mode));
const paths=mode==='capture'?first:second;
cp.execFileSync('git',['add','--',...paths]);cp.execFileSync('git',['diff','--exit-code']);cp.execFileSync('git',['diff','--cached','--check']);
const tree=cp.execFileSync('git',['write-tree'],{encoding:'utf8'}).trim();
assert.strictEqual(tree,mode==='capture'?'173d5c747353183b9a57f9effc3fb0f677c1c664':'d218a125e8df73cdb2e36a2c6d0824afc7d03229');
let objects=paths.map(path=>blob(path,fs.readFileSync(path)));
if(mode==='capture'){
  const testPackage=Buffer.from(fs.readFileSync('package.json','utf8').replace('node tests/content-progress-integration.test.js && ',''));
  const testBlob=blob('package.json',testPackage);assert.strictEqual(testBlob.sha,'4a9d063e2f3b2c05db6e7133d87472240994d47f');objects.push(testBlob);
  fs.writeFileSync(temp+'/issue207-objects.json',JSON.stringify(objects));console.log('IMMUTABLE_PREDECESSOR_TREE '+tree);
}else{
  const lifecycle=require(process.cwd()+'/scripts/qa/phase-b-lifecycle');
  for(const a of lifecycle.generationAuthorities())assert(fs.readFileSync(a.file).equals(a.bytes),a.file);
  assert(lifecycle.verifyCandidate(JSON.parse(fs.readFileSync('reports/auto-gate/audit-locks/phase-b-generation-119.json'))).ok);
  objects=[...JSON.parse(fs.readFileSync(temp+'/issue207-objects.json')),...objects];
  (async()=>{
    const unique=new Map(objects.map(object=>[object.sha,object]));
    for(const {sha,content}of unique.values()){
      const response=await fetch('https://api.github.com/repos/wataruyamashita-collab/boki-rpg-app/git/blobs',{method:'POST',headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({content,encoding:'base64'})});
      if(!response.ok)throw new Error('Blob storage failed: '+response.status);assert.strictEqual((await response.json()).sha,sha);
    }
    const metadata=objects.map(({path,sha})=>({path,sha}));fs.writeFileSync(temp+'/issue207-verified-objects.json',JSON.stringify({tree,objects:metadata},null,2));console.log('ISSUE207_VERIFIED_TREE '+tree);console.log('ISSUE207_VERIFIED_OBJECTS '+JSON.stringify(metadata));
  })().catch(error=>{console.error(error.stack);process.exitCode=1;});
}
