'use strict';

const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(
  core.ROOT,
  'reports/auto-gate/audit-locks/phase-b-generation-14.json'
);

const authorityPaths=[
  lifecycle.ROOT_LOCK,
  ...[2,3,4,5,6,7,8,9,10,11,12,13].map(
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
  'b96049174b9af9cc71c08c6d9b8624e8693fd4a1fce638260124ec5f03c2abd3',
  '9e3d8919bcea801158983aef537c13962059085ba1f58de23194d3f80dc287a9',
  '1fe990df744f2b5abf97f238ecc044a6b76d20d4efc981bf89edeccff5188ca5',
  '52d1d68c9d798f78fda83ec256a2f30d75eae265020545c67536ce1976d9b2b3'
];

const approvedHead='300a076882bc60a86720e66c556fc99572008064';
const approvedTree='02ff85d760213397305a222ebdcf13eb53bba2e9';

const finalProductionSha256={
  'data/questions.js':'0ca00226094bc1c13fafd90219671f510c7275e9f54aee31dd372308390d8dd7',
  'css/style.css':'0ccd4dc72959fd2af6e43e976413885a13c38821dcff33a7b056b4a5e8c9ce55',
  'index.html':'a34cc3862d89867d7696eba91691b060384309475ddf77463e0abacd0b7e2b65',
  'js/controller.js':'befe50b0e4f889397eb964e25d8b8f30e746a07f6cd6bc282521be51d34e6a4b',
  'js/model.js':'5b0960651ab936c4404c460171e37c45b087cde7469d012f73b6fb66d9e4b71e',
  'js/view.js':'a6c3324476d0e1b57fd51dd0f87845ada6c7fd3d3a012dabf33fc28a0397a707',
  'pwa-release-manifest.json':'30b4ac26687c9218f7162e8bcc40241e85ee3268f2e273055e1de591ddadfb38',
  'service-worker.js':'65b76381787ecce6cc08e8c7103d3746980f9c399bccd0c6ce7a678b7e26247a'
};

const requiredDirty=new Set([
  'independent-audit/tests/generation-14-finalizer.test.js',
  'independent-audit/tests/generation-immutability.test.js',
  'data/questions.js',
  'index.html',
  'package.json',
  'pwa-release-manifest.json',
  'reports/auto-gate/final.json',
  'reports/auto-gate/gate-01.json',
  'reports/auto-gate/gate-02.json',
  'reports/auto-gate/gate-03.json',
  'reports/auto-gate/gate-04.json',
  'reports/auto-gate/gate-05.json',
  'reports/auto-gate/gate-06.json',
  'reports/auto-gate/gate-07.json',
  'reports/auto-gate/gate-08.json',
  'reports/auto-gate/gate-09.json',
  'reports/auto-gate/gate-10.json',
  'reports/auto-gate/gate-11.json',
  'reports/auto-gate/gate-12.json',
  'reports/auto-gate/gate-13.json',
  'reports/auto-gate/gate-14-mutations.json',
  'reports/auto-gate/gate-14.json',
  'reports/auto-gate/gate-15.json',
  'reports/auto-gate/question-review.jsonl',
  'reports/auto-gate/state.json',
  'scripts/qa/finalize-phase-b-generation-14.js',
  'scripts/qa/validate-auto-gate.js',
  'service-worker.js',
  'tests/fixed-asset-ledger.test.js'
]);

const NEW_RELEASE='20260922-87';
const PREVIOUS_RELEASE='20260922-86';

const fail=message=>{
  console.error(`PHASE_B_GENERATION_14_FINALIZATION_REFUSED: ${message}`);
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
      item=>item.document.generation===14
    )
  ){
    return fail('Generation 14 already exists');
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
    return fail('approved Generation 13 successor baseline identity mismatch');
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
  'reports/question-audit-matrix.json',
    'service-worker.js'
  ])
    .split(/\n/u)
    .filter(Boolean);

  const expectedProductionDrift=[
    'data/questions.js',
    'index.html',
    'pwa-release-manifest.json',
    'service-worker.js'
  ];

  if(JSON.stringify(production)!==JSON.stringify(expectedProductionDrift)){
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
    ) !== JSON.stringify([2,3,4,5,6,7,8,9,10,11,12,13])
  ){
    return fail(
      'authority sequence must be exactly [2,3,4,5,6,7,8,9,10,11,12,13]'
    );
  }

  let candidate;

  try{
    candidate=lifecycle.createCandidate();
  }catch(error){
    return fail(error.message);
  }

  if(
    candidate.generation!==14 ||
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
