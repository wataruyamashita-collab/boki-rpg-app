'use strict';
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-4.json');
const phaseAPath=path.join(core.ROOT,lifecycle.ROOT_LOCK);
const generation2Path=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const generation3Path=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-3.json');
const expectedPhaseASha256='daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544';
const expectedGeneration2Sha256='cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813';
const expectedGeneration3Sha256='ac622dc4b1c8db35c83f2573f1f0f77af828c2f20256887b454a2d0b85c1f2cd';
const phaseC='05f04f20db9d5f2a1249f3cbde058a0d9c487702';
const frozenTree='da6a2a9f861227f60df2f01c3beba82b5893a8a5';
const frozenBlobs={
  'index.html':'1caf37682b7cd1dcea049a340fd405cf21656b7b','js/controller.js':'11bf287ba8cd1183bf1a082b7c98ea96e20c8ee6','js/model.js':'ad003682d1a7814533fc0d199ccd98462143d6d8','js/rpg.js':'dfc0bc9c0d0d8641cee90a9bb7dbfd9ba1ca17d7','js/view.js':'d9a362b927427ec325b28bda88bc09b65c10654c','tests/app.test.js':'e8b831647bc74570130180bb4b2a6839fc1ac2cc','tests/mobile-layout.test.js':'cb72bd8ac3b6e1d573d65a5882c15b555f2afd0c'
};
const requiredDirty=new Set(['index.html','pwa-release-manifest.json','service-worker.js','package.json','scripts/qa/finalize-phase-b-generation-4.js','scripts/qa/validate-auto-gate.js','independent-audit/tests/generation-4-finalizer.test.js','independent-audit/tests/generation-immutability.test.js','independent-audit/tests/generation-3-finalizer.test.js']);
const fail=message=>{console.error(`PHASE_B_GENERATION_4_FINALIZATION_REFUSED: ${message}`);process.exitCode=1;return false;};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const rawSha=file=>digest(fs.readFileSync(file));
const git=args=>childProcess.execFileSync('git',args,{cwd:core.ROOT,encoding:'utf8'}).trim();
const changedFiles=()=>git(['status','--porcelain','--untracked-files=all']).split(/\n/u).filter(Boolean).map(line=>line.slice(2).trim());
function validateRelease(){
  const manifest=JSON.parse(fs.readFileSync(path.join(core.ROOT,'pwa-release-manifest.json'),'utf8'));
  if(manifest.release!=='20260905-77'||manifest.previousRelease!=='20260905-76')throw new Error('release manifest version mismatch');
  const worker=fs.readFileSync(path.join(core.ROOT,'service-worker.js'),'utf8');
  if(!worker.includes("const RELEASE = '20260905-77';"))throw new Error('service worker release mismatch');
  const index=fs.readFileSync(path.join(core.ROOT,'index.html'),'utf8');
  if(index.includes('?v=20260905-76')||(index.match(/\?v=20260905-77/g)||[]).length!==12)throw new Error('index release tokens mismatch');
  const workerAssets=[...worker.matchAll(/'\.\/([^']+)'/g)].map(match=>match[1]).filter(file=>Object.hasOwn(manifest.assets,file));
  if(JSON.stringify([...new Set(workerAssets)].sort())!==JSON.stringify(Object.keys(manifest.assets).sort()))throw new Error('release asset key set mismatch');
  for(const [file,sha] of Object.entries(manifest.assets))if(core.sha(file)!==sha)throw new Error(`release asset hash mismatch: ${file}`);
}
function finalize(){
  if(fs.existsSync(output)||lifecycle.generationAuthorities().some(item=>item.document.generation===4))return fail('Generation 4 already exists');
  if(rawSha(phaseAPath)!==expectedPhaseASha256||rawSha(generation2Path)!==expectedGeneration2Sha256||rawSha(generation3Path)!==expectedGeneration3Sha256)return fail('historical authority raw bytes changed');
  if(git(['rev-parse','HEAD^'])!==phaseC||git(['rev-parse','HEAD^{tree}'])!==frozenTree||git(['rev-list','--count',`${phaseC}..HEAD`])!=='1')return fail('frozen D1 commit ancestry or tree mismatch');
  for(const [file,blob] of Object.entries(frozenBlobs))if(git(['rev-parse',`HEAD:${file}`])!==blob)return fail(`frozen D1 blob changed: ${file}`);
  const dirty=changedFiles();
  if(dirty.length!==requiredDirty.size||dirty.some(file=>!requiredDirty.has(file))||[...requiredDirty].some(file=>!dirty.includes(file)))return fail(`dirty scope mismatch: ${dirty.join(', ')}`);
  const production=git(['diff','--name-only','HEAD','--','data','js','css','types','index.html','manifest.webmanifest','pwa-release-manifest.json','service-worker.js']).split(/\n/u).filter(Boolean);
  if(JSON.stringify(production.sort())!==JSON.stringify(['index.html','pwa-release-manifest.json','service-worker.js']))return fail(`unexpected Production drift: ${production.join(', ')}`);
  const expectedIndex=childProcess.execFileSync('git',['show','HEAD:index.html'],{cwd:core.ROOT,encoding:'utf8'}).replaceAll('?v=20260905-76','?v=20260905-77');
  if(fs.readFileSync(path.join(core.ROOT,'index.html'),'utf8')!==expectedIndex)return fail('index contains changes beyond release tokens');
  try{validateRelease();}catch(error){return fail(error.message);}
  const authorities=lifecycle.generationAuthorities();
  if(JSON.stringify(authorities.map(item=>item.document.generation))!==JSON.stringify([2,3]))return fail('authority sequence must be exactly [2,3]');
  let candidate;try{candidate=lifecycle.createCandidate();}catch(error){return fail(error.message);}
  if(candidate.schemaVersion!==3||candidate.phase!=='B_GENERATION'||candidate.generation!==4||candidate.algorithm!=='sha256'||JSON.stringify(candidate.predecessor)!==JSON.stringify(lifecycle.identity(authorities[1].document)))return fail('candidate metadata or predecessor mismatch');
  const verification=lifecycle.verifyCandidate(candidate);if(!verification.ok)return fail(verification.errors.join(', '));
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
  console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);return true;
}
if(require.main===module){if(!finalize())process.exit(1);}
module.exports={expectedGeneration2Sha256,expectedGeneration3Sha256,expectedPhaseASha256,finalize,frozenBlobs,output,phaseAPath,generation2Path,generation3Path};
