'use strict';
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-8.json');
const authorityPaths=[lifecycle.ROOT_LOCK,...[2,3,4,5,6,7].map(generation=>`reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`)].map(file=>path.join(core.ROOT,file));
const expectedAuthoritySha256=['daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544','cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813','ac622dc4b1c8db35c83f2573f1f0f77af828c2f20256887b454a2d0b85c1f2cd','c46aa8c3ee2b9a895e4afe818ea902995b8b9045f8bd4444254d6f5261066fe7','a3f2f7320665ed8c015d2bd7cb396fbd7993be0850ee8a8347606ab5bbdbf95c','76265d955608506ce71429e30771b06ebf7a15471845a4211df6690e2e649ea8','0f3fc0ae6f5545d160683ca338ec539c2c139406b77ce57923d982552711a179'];
const approvedHead='c6196b47457ab2613c1faa872d69d5c55a8951e1';
const approvedTree='dce62dad0f5ffd14ac4f9fac74cdc6586a6fe94b';
const approvedBlobs={'index.html':'5bd70743816c6e804040af8c7b9dc4f2cca05509','css/style.css':'453d2782c878d28a43c4f8ffb6323dcc6d267155','js/view.js':'0db8b790a94e25facf9b7264411088a5ecef53ba','tests/mobile-layout.test.js':'0d39cebea67d373db8ff3d261479b7ad441743fb'};
const finalProductionSha256={'css/style.css':'a51fc3a872ef153741daa53a0cbcefb1b5cdcee32d788e9d2e7cb91012a3970f','js/view.js':'60558033db77b428c5274ffbea5ce45866bc03891f58278892faf74c46d047f7'};
const requiredDirty=new Set(['css/style.css','tests/mobile-layout.test.js','index.html','service-worker.js','pwa-release-manifest.json','package.json','scripts/qa/finalize-phase-b-generation-8.js','scripts/qa/validate-auto-gate.js','independent-audit/tests/generation-8-finalizer.test.js','independent-audit/tests/generation-immutability.test.js']);
const NEW_RELEASE='20260906-81',PREVIOUS_RELEASE='20260906-80';
const fail=message=>{console.error(`PHASE_B_GENERATION_8_FINALIZATION_REFUSED: ${message}`);process.exitCode=1;return false;};
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
  if(fs.existsSync(output)||lifecycle.generationAuthorities().some(item=>item.document.generation===8))return fail('Generation 8 already exists');
  if(authorityPaths.some((file,index)=>!fs.existsSync(file)||digest(fs.readFileSync(file))!==expectedAuthoritySha256[index]))return fail('historical authority raw bytes changed');
  if(git(['rev-parse','HEAD'])!==approvedHead||git(['rev-parse','HEAD^{tree}'])!==approvedTree)return fail('approved D2 closure identity mismatch');
  for(const [file,blob] of Object.entries(approvedBlobs))if(git(['rev-parse',`HEAD:${file}`])!==blob)return fail(`approved D2 blob changed: ${file}`);
  const dirty=changedFiles();if(dirty.length!==requiredDirty.size||dirty.some(file=>!requiredDirty.has(file))||[...requiredDirty].some(file=>!dirty.includes(file)))return fail(`dirty scope mismatch: ${dirty.join(', ')}`);
  const production=git(['diff','--name-only','HEAD','--','data','js','css','types','index.html','manifest.webmanifest','pwa-release-manifest.json','service-worker.js']).split(/\n/u).filter(Boolean).sort();
  if(JSON.stringify(production)!==JSON.stringify(['css/style.css','index.html','pwa-release-manifest.json','service-worker.js']))return fail(`unexpected Production drift: ${production.join(', ')}`);
  const expectedIndex=childProcess.execFileSync('git',['show','HEAD:index.html'],{cwd:core.ROOT,encoding:'utf8'}).replaceAll(`?v=${PREVIOUS_RELEASE}`,`?v=${NEW_RELEASE}`);
  if(fs.readFileSync(path.join(core.ROOT,'index.html'),'utf8')!==expectedIndex)return fail('index contains changes beyond release tokens');
  try{validateRelease();}catch(error){return fail(error.message);}
  for(const [file,sha] of Object.entries(finalProductionSha256))if(core.sha(file)!==sha)return fail(`final Production hash mismatch: ${file}`);
  const authorities=lifecycle.generationAuthorities();if(JSON.stringify(authorities.map(item=>item.document.generation))!==JSON.stringify([2,3,4,5,6,7]))return fail('authority sequence must be exactly [2,3,4,5,6,7]');
  let candidate;try{candidate=lifecycle.createCandidate();}catch(error){return fail(error.message);}
  if(candidate.generation!==8||JSON.stringify(candidate.predecessor)!==JSON.stringify(lifecycle.identity(authorities[5].document)))return fail('candidate predecessor or generation mismatch');
  const verification=lifecycle.verifyCandidate(candidate);if(!verification.ok)return fail(verification.errors.join(', '));
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);return true;
}
if(require.main===module){if(!finalize())process.exit(1);}
module.exports={finalProductionSha256,NEW_RELEASE,PREVIOUS_RELEASE,approvedBlobs,approvedHead,approvedTree,authorityPaths,expectedAuthoritySha256,finalize,output,validateRelease};
