'use strict';

const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(
  core.ROOT,
  'reports/auto-gate/audit-locks/phase-b-generation-11.json'
);

const authorityPaths=[
  lifecycle.ROOT_LOCK,
  ...[2,3,4,5,6,7,8,9,10].map(
    generation=>`reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`
  )
].map(file=>path.join(core.ROOT,file));

const expectedAuthoritySha256=[
  'daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544',
  'cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813',
  'ac622dc4b1c8db35c83f2573f1f0f77af828c2f20256887b454a2d0b85c1f2cd',
  'c46aa8c3ee2b9a895e4afe818ea902995b8b9045f8bd4444254d6f5261066fe7',
  'a3f2f7320665ed8c015d2bd7cb396fbd7993be0850ee8a8347606ab5bbdbf95c',
  '76265d955608506ce71429e30771b06ebf7a15471845a4211df6690e2e649ea8',
  '0f3fc0ae6f5545d160683ca338ec539c2c139406b77ce57923d982552711a179',
  '3aa4af586d7d26e8c3abe96646f98bce50568977c48a1af80081cfa5660bbb58',
  '4d021337c8013ec98bb7a8f9424cef0e66f98b46b09ace039e35b74d458b868d',
  'b96049174b9af9cc71c08c6d9b8624e8693fd4a1fce638260124ec5f03c2abd3'
];

const approvedHead='33ad43d8960681f19a5283c24f9eaa5056e69540';
const approvedTree='998e3d93994828a1ef8fe58989274e366c76d47b';

const finalProductionSha256={
  'css/style.css':'6ac61759721e2b4345a804e972d8d2885a3fe938c423a711c491a125bf52e233',
  'index.html':'d3e1fffee22b5703ed57e6dec6d1c5df290b44ec8a834750572bd6e51e547af3',
  'js/controller.js':'befe50b0e4f889397eb964e25d8b8f30e746a07f6cd6bc282521be51d34e6a4b',
  'js/view.js':'2a0fb3df74b4d5756983c34768dad22ba235824d5be4d6c8b7ef4e8f7c91456b',
  'pwa-release-manifest.json':'da3c8cea398f489adaaa6d7c374637718b15bf4b2593c0684daa5b36b5feca58',
  'service-worker.js':'a8424cf59bb87c57b7abca220792726d4df3b4dcf849f4a22521fdc6d586024d'
};

const requiredDirty=new Set([
  'independent-audit/tests/generation-11-finalizer.test.js',
  'independent-audit/tests/generation-immutability.test.js',
  'package.json',
  'scripts/qa/finalize-phase-b-generation-11.js',
  'scripts/qa/validate-auto-gate.js'
]);

const NEW_RELEASE='20260921-84';
const PREVIOUS_RELEASE='20260906-83';

const fail=message=>{
  console.error(`PHASE_B_GENERATION_11_FINALIZATION_REFUSED: ${message}`);
  process.exitCode=1;
  return false;
};

const digest=bytes=>
  crypto.createHash('sha256').update(bytes).digest('hex');

const git=args=>
  childProcess.execFileSync(
    'git',
    args,
    {cwd:core.ROOT,encoding:'utf8'}
  ).trim();

const changedFiles=()=>
  git(['status','--porcelain','--untracked-files=all'])
    .split(/\n/u)
    .filter(Boolean)
    .map(line=>line.slice(2).trim());

function validateRelease(){
  const manifest=JSON.parse(
    fs.readFileSync(
      path.join(core.ROOT,'pwa-release-manifest.json'),
      'utf8'
    )
  );

  if(
    manifest.release!==NEW_RELEASE ||
    manifest.previousRelease!==PREVIOUS_RELEASE
  ){
    throw new Error('release manifest version mismatch');
  }

  const worker=fs.readFileSync(
    path.join(core.ROOT,'service-worker.js'),
    'utf8'
  );

  const index=fs.readFileSync(
    path.join(core.ROOT,'index.html'),
    'utf8'
  );

  if(!worker.includes(`const RELEASE = '${NEW_RELEASE}';`)){
    throw new Error('service worker release mismatch');
  }

  if(
    index.includes(`?v=${PREVIOUS_RELEASE}`) ||
    (index.match(new RegExp(`\\?v=${NEW_RELEASE}`,'g'))||[]).length!==12
  ){
    throw new Error('index release tokens mismatch');
  }

  const workerAssets=[
    ...worker.matchAll(/'\.\/([^']+)'/g)
  ]
    .map(match=>match[1])
    .filter(file=>Object.hasOwn(manifest.assets,file));

  if(
    JSON.stringify([...new Set(workerAssets)].sort()) !==
    JSON.stringify(Object.keys(manifest.assets).sort())
  ){
    throw new Error('release asset key set mismatch');
  }

  for(const [file,sha] of Object.entries(manifest.assets)){
    if(core.sha(file)!==sha){
      throw new Error(`release asset hash mismatch: ${file}`);
    }
  }
}

function finalize(){
  if(
    fs.existsSync(output) ||
    lifecycle.generationAuthorities().some(
      item=>item.document.generation===11
    )
  ){
    return fail('Generation 11 already exists');
  }

  if(
    authorityPaths.some(
      (file,index)=>
        !fs.existsSync(file) ||
        digest(fs.readFileSync(file))!==expectedAuthoritySha256[index]
    )
  ){
    return fail('historical authority raw bytes changed');
  }

  if(
    git(['rev-parse','HEAD'])!==approvedHead ||
    git(['rev-parse','HEAD^{tree}'])!==approvedTree
  ){
    return fail('approved Generation 10 successor baseline identity mismatch');
  }

  const dirty=changedFiles();

  if(
    dirty.length!==requiredDirty.size ||
    dirty.some(file=>!requiredDirty.has(file)) ||
    [...requiredDirty].some(file=>!dirty.includes(file))
  ){
    return fail(`dirty scope mismatch: ${dirty.join(', ')}`);
  }

  const production=git([
    'diff',
    '--name-only',
    'HEAD',
    '--',
    'data',
    'js',
    'css',
    'types',
    'index.html',
    'manifest.webmanifest',
    'pwa-release-manifest.json',
    'service-worker.js'
  ])
    .split(/\n/u)
    .filter(Boolean);

  if(production.length){
    return fail(`unexpected Production drift: ${production.join(', ')}`);
  }

  try{
    validateRelease();
  }catch(error){
    return fail(error.message);
  }

  for(const [file,sha] of Object.entries(finalProductionSha256)){
    if(core.sha(file)!==sha){
      return fail(`final Production hash mismatch: ${file}`);
    }
  }

  const authorities=lifecycle.generationAuthorities();

  if(
    JSON.stringify(
      authorities.map(item=>item.document.generation)
    ) !== JSON.stringify([2,3,4,5,6,7,8,9,10])
  ){
    return fail(
      'authority sequence must be exactly [2,3,4,5,6,7,8,9,10]'
    );
  }

  let candidate;

  try{
    candidate=lifecycle.createCandidate();
  }catch(error){
    return fail(error.message);
  }

  if(
    candidate.generation!==11 ||
    JSON.stringify(candidate.predecessor) !==
      JSON.stringify(lifecycle.identity(authorities.at(-1).document))
  ){
    return fail('candidate predecessor or generation mismatch');
  }

  const verification=lifecycle.verifyCandidate(candidate);

  if(!verification.ok){
    return fail(verification.errors.join(', '));
  }

  fs.writeFileSync(
    output,
    JSON.stringify(candidate,null,2)+'\n',
    {flag:'wx'}
  );

  console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);
  return true;
}

if(require.main===module){
  if(!finalize()) process.exit(1);
}

module.exports={
  finalProductionSha256,
  NEW_RELEASE,
  PREVIOUS_RELEASE,
  approvedHead,
  approvedTree,
  authorityPaths,
  expectedAuthoritySha256,
  finalize,
  output,
  validateRelease
};
