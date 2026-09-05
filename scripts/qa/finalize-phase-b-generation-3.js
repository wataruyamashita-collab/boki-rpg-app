'use strict';

const childProcess=require('child_process');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-3.json');
const predecessorPath=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const phaseARootPath=path.join(core.ROOT,lifecycle.ROOT_LOCK);
const expectedPhaseASha256='daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544';
const expectedGeneration2Sha256='cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813';
const approvedBlobs={
  'data/questions.js':'acbe726e7124a5e285eff7845a1f54a3211c9bc6',
  'index.html':'600a305ebae44aae1b24943a45b87d999ac1e3cf',
  'pwa-release-manifest.json':'24f60c45242d44eec9ad6047e5ff601fd50d6457',
  'service-worker.js':'5d1cb08967b0796664959a2c2e30ebc7ddc0ed92',
  'independent-audit/golden/expected-answers.json':'712913148e53b7177179eaf757262d2d15c9c01c',
  'tests/app.test.js':'05d6f25fa7c6dcfbb83cbd6ef94fc76ab067c53d',
  'reports/question-audit-matrix.json':'b8916c74e8d6583838b03f1f2e0a7a6567558405',
  'package.json':'f939ff44274d8e38b8cc9a4437cb3133c3390d10',
  'independent-audit/tests/generation-3-finalizer.test.js':'3a893450891b906bf5d76cb1a1af9ea8bfef0cd3',
  'independent-audit/tests/generation-immutability.test.js':'5bd668ff749dad838ceb15f556d3a008dbde0375',
  'scripts/qa/contract-runner.js':'bdc6472d66a5bbba4b28bb213a79642cd013f2a5',
  'scripts/qa/validate-auto-gate.js':'2ccf44d508470e5b8a522bf87686f2a2d8fc83ff',
};
const generatedEvidence=new Set([
  'reports/auto-gate/question-review.jsonl',
  ...Array.from({length:15},(_,index)=>`reports/auto-gate/gate-${String(index+1).padStart(2,'0')}.json`),
  'reports/auto-gate/gate-14-mutations.json','reports/auto-gate/gate-14-answer-corruption.json',
  'reports/auto-gate/state.json','reports/auto-gate/final.json'
]);
const self='scripts/qa/finalize-phase-b-generation-3.js';
const fail=message=>{console.error(`PHASE_B_GENERATION_3_FINALIZATION_REFUSED: ${message}`);process.exitCode=1;return false;};
const sha256=file=>core.sha(path.relative(core.ROOT,file));
const gitBlob=file=>childProcess.execFileSync('git',['hash-object',file],{cwd:core.ROOT,encoding:'utf8'}).trim();
const changedFiles=()=>childProcess.execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:core.ROOT,encoding:'utf8'}).trim().split(/\n/u).filter(Boolean).map(line=>line.slice(2).trim());

function finalize(){
  if(fs.existsSync(output)||lifecycle.generationAuthorities().some(item=>item.document.generation===3))return fail('Generation 3 already exists');
  if(!fs.existsSync(predecessorPath)||sha256(predecessorPath)!==expectedGeneration2Sha256)return fail('Generation 2 raw bytes changed or are missing');
  if(!fs.existsSync(phaseARootPath)||sha256(phaseARootPath)!==expectedPhaseASha256)return fail('Phase A root raw bytes changed or are missing');
  const allowed=new Set([...Object.keys(approvedBlobs),...generatedEvidence,self]);
  const unexpected=changedFiles().filter(file=>file!==path.relative(core.ROOT,output)&&!allowed.has(file));
  if(unexpected.length)return fail(`unexpected dirty files: ${unexpected.join(', ')}`);
  for(const [file,approved] of Object.entries(approvedBlobs)){
    if(!fs.existsSync(path.join(core.ROOT,file))||gitBlob(file)!==approved)return fail(`approved ${file} blob changed`);
  }
  const changedProduction=childProcess.execFileSync('git',['diff','--name-only','HEAD','--','data','js','css','types','index.html','manifest.webmanifest','pwa-release-manifest.json','service-worker.js'],{cwd:core.ROOT,encoding:'utf8'}).trim().split(/\n/u).filter(Boolean);
  const expectedProduction=new Set(['data/questions.js','index.html','pwa-release-manifest.json','service-worker.js']);
  const unexpectedProduction=changedProduction.filter(file=>!expectedProduction.has(file));
  if(unexpectedProduction.length)return fail(`unexpected Production drift: ${unexpectedProduction.join(', ')}`);
  if([...expectedProduction].some(file=>!changedProduction.includes(file)))return fail('approved Production remediation is incomplete');
  let candidate;
  try{candidate=lifecycle.createCandidate();}catch(error){return fail(error.message);}
  const authorities=lifecycle.generationAuthorities();
  if(authorities.length!==1||authorities[0].document.generation!==2)return fail('Generation 2 must be the sole exact successor predecessor');
  if(candidate.generation!==3||candidate.phase!=='B_GENERATION'||candidate.predecessor.canonicalDocumentSha256!==lifecycle.canonicalDocumentHash(authorities[0].document))return fail('wrong predecessor or generation skip');
  const verification=lifecycle.verifyCandidate(candidate);
  if(!verification.ok)return fail(verification.errors.join(', '));
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
  console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);
  return true;
}

if(require.main===module){if(!finalize())process.exit(1);}
module.exports={approvedBlobs,expectedGeneration2Sha256,expectedPhaseASha256,finalize,generatedEvidence,output};
