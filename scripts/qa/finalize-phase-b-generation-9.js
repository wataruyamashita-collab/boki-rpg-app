'use strict';
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-9.json');
const authorityPaths=[lifecycle.ROOT_LOCK,...[2,3,4,5,6,7,8].map(generation=>`reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`)].map(file=>path.join(core.ROOT,file));
const expectedAuthoritySha256=['daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544','cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813','ac622dc4b1c8db35c83f2573f1f0f77af828c2f20256887b454a2d0b85c1f2cd','c46aa8c3ee2b9a895e4afe818ea902995b8b9045f8bd4444254d6f5261066fe7','a3f2f7320665ed8c015d2bd7cb396fbd7993be0850ee8a8347606ab5bbdbf95c','76265d955608506ce71429e30771b06ebf7a15471845a4211df6690e2e649ea8','0f3fc0ae6f5545d160683ca338ec539c2c139406b77ce57923d982552711a179','3aa4af586d7d26e8c3abe96646f98bce50568977c48a1af80081cfa5660bbb58'];
const approvedHead='222ddad46f6f7bb066ac48e8d872cf3d0b15898f';
const approvedTree='734b54e4b2446a93ad0531879a80fa2ef64ab8a1';
const approvedBlobs={'css/style.css':'7e50ec52034362f8b1d65d26934d0fa6cbdc77a8','js/view.js':'0db8b790a94e25facf9b7264411088a5ecef53ba','js/controller.js':'2f1b19f8769abeee7302422b394e679f30453be1','tests/app.test.js':'3ffa31a6297b04f7c4c40625d9a40199f319e3fc','tests/mobile-layout.test.js':'55f8e2016fefe06b17bfc00d25aa46f75080ae9d'};
const finalProductionSha256={'css/style.css':'ff29f70ae1a4728e6dfc0ed3fb3f5bb042e1794c25b9c91607e8e2861f3e59e8','js/view.js':'26e746677def41c09e1651b96798742b8bd50781c530e6b77c0bae99e5fbf342','js/controller.js':'4b2b79ce216cb2d78709f72835a1983efb9d4bfe8920584f840a24dd8b1a2894'};
const requiredDirty=new Set(['css/style.css','js/view.js','js/controller.js','tests/app.test.js','tests/mobile-layout.test.js','index.html','service-worker.js','pwa-release-manifest.json','package.json','scripts/qa/audit-core.js','scripts/qa/finalize-phase-b-generation-9.js','scripts/qa/validate-auto-gate.js','independent-audit/tests/generation-9-finalizer.test.js','independent-audit/tests/generation-immutability.test.js']);
const NEW_RELEASE='20260906-82',PREVIOUS_RELEASE='20260906-81';
const fail=message=>{console.error(`PHASE_B_GENERATION_9_FINALIZATION_REFUSED: ${message}`);process.exitCode=1;return false;};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>childProcess.execFileSync('git',args,{cwd:core.ROOT,encoding:'utf8'}).trim();
const changedFiles=()=>git(['status','--porcelain','--untracked-files=all']).split(/\n/u).filter(Boolean).map(line=>line.slice(2).trim());
function validateRelease(){
  const manifest=JSON.parse(fs.readFileSync(path.join(core.ROOT,'pwa-release-manifest.json'),'utf8'));
  if(manifest.release!==NEW_RELEASE||manifest.previousRelease!==PREVIOUS_RELEASE)throw new Error('release manifest version mismatch');
  const worker=fs.readFileSync(path.join(core.ROOT,'service-worker.js'),'utf8'),index=fs.readFileSync(path.join(core.ROOT,'index.html'),'utf8');
  if(!worker.includes(`const RELEASE = '${NEW_RELEASE}';`))throw new Error('service worker release mismatch');
  if(index.includes(`?v=${PREVIOUS_RELEASE}`)||(index.match(new RegExp(`\\?v=${NEW_RELEASE}`,'g'))||[]).length!==12)throw new Error('index release tokens mismatch');
  const workerAssets=[...worker.matchAll(/'\.\/([^']+)'/g)].map(match=>match[1]).filter(file=>Object.hasOwn(manifest.assets,file));
  if(JSON.stringify([...new Set(workerAssets)].sort())!==JSON.stringify(Object.keys(manifest.assets).sort()))throw new Error('release asset key set mismatch');
  for(const [file,sha] of Object.entries(manifest.assets))if(core.sha(file)!==sha)throw new Error(`release asset hash mismatch: ${file}`);
}
function finalize(){
  if(fs.existsSync(output)||lifecycle.generationAuthorities().some(item=>item.document.generation===9))return fail('Generation 9 already exists');
  if(authorityPaths.some((file,index)=>!fs.existsSync(file)||digest(fs.readFileSync(file))!==expectedAuthoritySha256[index]))return fail('historical authority raw bytes changed');
  if(git(['rev-parse','HEAD'])!==approvedHead||git(['rev-parse','HEAD^{tree}'])!==approvedTree)return fail('approved Generation 8 baseline identity mismatch');
  for(const [file,blob] of Object.entries(approvedBlobs))if(git(['rev-parse',`HEAD:${file}`])!==blob)return fail(`approved D2 blob changed: ${file}`);
  const dirty=changedFiles();if(dirty.length!==requiredDirty.size||dirty.some(file=>!requiredDirty.has(file))||[...requiredDirty].some(file=>!dirty.includes(file)))return fail(`dirty scope mismatch: ${dirty.join(', ')}`);
  const production=git(['diff','--name-only','HEAD','--','data','js','css','types','index.html','manifest.webmanifest','pwa-release-manifest.json','service-worker.js']).split(/\n/u).filter(Boolean).sort();
  if(JSON.stringify(production)!==JSON.stringify(['css/style.css','index.html','js/controller.js','js/view.js','pwa-release-manifest.json','service-worker.js']))return fail(`unexpected Production drift: ${production.join(', ')}`);
  const expectedIndex=childProcess.execFileSync('git',['show','HEAD:index.html'],{cwd:core.ROOT,encoding:'utf8'}).replaceAll(`?v=${PREVIOUS_RELEASE}`,`?v=${NEW_RELEASE}`);
  if(fs.readFileSync(path.join(core.ROOT,'index.html'),'utf8')!==expectedIndex)return fail('index contains changes beyond release tokens');
  try{validateRelease();}catch(error){return fail(error.message);}
  for(const [file,sha] of Object.entries(finalProductionSha256))if(core.sha(file)!==sha)return fail(`final Production hash mismatch: ${file}`);
  const authorities=lifecycle.generationAuthorities();if(JSON.stringify(authorities.map(item=>item.document.generation))!==JSON.stringify([2,3,4,5,6,7,8]))return fail('authority sequence must be exactly [2,3,4,5,6,7,8]');
  let candidate;try{candidate=lifecycle.createCandidate();}catch(error){return fail(error.message);}
  if(candidate.generation!==9||JSON.stringify(candidate.predecessor)!==JSON.stringify(lifecycle.identity(authorities[6].document)))return fail('candidate predecessor or generation mismatch');
  const verification=lifecycle.verifyCandidate(candidate);if(!verification.ok)return fail(verification.errors.join(', '));
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);return true;
}
if(require.main===module){if(!finalize())process.exit(1);}
module.exports={finalProductionSha256,NEW_RELEASE,PREVIOUS_RELEASE,approvedBlobs,approvedHead,approvedTree,authorityPaths,expectedAuthoritySha256,finalize,output,validateRelease};
