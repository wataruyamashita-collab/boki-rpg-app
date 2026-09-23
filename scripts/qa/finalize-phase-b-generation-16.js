'use strict';

const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(
  core.ROOT,
  'reports/auto-gate/audit-locks/phase-b-generation-16.json'
);

const authorityPaths=[
  lifecycle.ROOT_LOCK,
  ...[2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(
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
  '52d1d68c9d798f78fda83ec256a2f30d75eae265020545c67536ce1976d9b2b3',
  '3f9af2837019047b5e8f5ab0ccf84bb7ecd4c89fcd2634ad6b58744f03ca91ae',
  '71366b8ae48b8100df0b7240699c5ddb82a45821b88201fd5651b9c2ba262318'
];

const approvedHead='2335720e6ad5b9e1cb3fe13b94e3256b7ce182d8';
const approvedTree='6781555124a723268ac0ad15afc90827677873a8';

const finalProductionSha256={
  'data/questions.js':'374afc4cbabd9b9d3f8a35c2633aaba419da8341fb29aacb813ea634f704eb57',
  'css/style.css':'0ccd4dc72959fd2af6e43e976413885a13c38821dcff33a7b056b4a5e8c9ce55',
  'index.html':'e2c834b847176362cc2bb59d63602f468d03d952dcd3a5fe030efcb804949ee2',
  'js/controller.js':'2ef86dbe6bc87798fb60a9ecc9a843ae7bde90a076f610ade99d35c633882437',
  'js/model.js':'941ccd7ddfa7e9a91d95976568ba5171b983d69cfea36086783fca19f2609a67',
  'js/view.js':'a6c3324476d0e1b57fd51dd0f87845ada6c7fd3d3a012dabf33fc28a0397a707',
  'pwa-release-manifest.json':'c3baade62daa31dca6afb17c0fe3ba56610c341cfeeb24c55d8c742c0f65c42b',
  'service-worker.js':'9b91c0655225fbe27336c042aa68b237a27ad48a513149241ac044a13d49652a'
};

const requiredDirty=new Set([
  'data/questions.js',
  'independent-audit/golden/expected-answers.json',
  'independent-audit/tests/generation-16-finalizer.test.js',
  'independent-audit/tests/generation-immutability.test.js',
  'index.html',
  'js/model.js',
  'package.json',
  'pwa-release-manifest.json',
  'reports/question-audit-matrix.json',
  'scripts/qa/finalize-phase-b-generation-16.js',
  'scripts/qa/validate-auto-gate.js',
  'service-worker.js',
  'tests/fixed-asset-ledger.test.js',
  'tests/independent-quality-gate.test.js'
]);

const NEW_RELEASE='20260922-89';
const PREVIOUS_RELEASE='20260922-88';

const fail=message=>{
  console.error(`PHASE_B_GENERATION_16_FINALIZATION_REFUSED: ${message}`);
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
      item=>item.document.generation===16
    )
  ){
    return fail('Generation 16 already exists');
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
    return fail('approved Generation 15 successor baseline identity mismatch');
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
    'js/model.js',
    'pwa-release-manifest.json',
    'reports/question-audit-matrix.json',
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
    ) !== JSON.stringify([2,3,4,5,6,7,8,9,10,11,12,13,14,15])
  ){
    return fail(
      'authority sequence must be exactly [2,3,4,5,6,7,8,9,10,11,12,13,14,15]'
    );
  }

  let candidate;

  try{
    candidate=lifecycle.createCandidate();
  }catch(error){
    return fail(error.message);
  }

  if(
    candidate.generation!==16 ||
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
