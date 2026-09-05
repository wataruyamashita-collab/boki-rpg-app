'use strict';

const childProcess=require('child_process');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');
const lifecycle=require('./phase-b-lifecycle');

const output=path.join(core.ROOT,'reports/auto-gate/audit-locks/phase-b-generation-2.json');
const fail=message=>{console.error(`PHASE_B_FINALIZATION_REFUSED: ${message}`);process.exit(1);};
if(fs.existsSync(output)||lifecycle.generationAuthorities().some(item=>item.document.generation===2))fail('Generation 2 already exists');
const changed=childProcess.execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:core.ROOT,encoding:'utf8'}).trim().split(/\n/u).filter(Boolean);
const approvedBlobs={
  'data/questions.js':'3c25c8f61c9227cf309240079704e4040bd7cb0d',
  'service-worker.js':'ceaac3e7bea4c2e6f0fe85f10827ee95b5d91173',
  'pwa-release-manifest.json':'681a431b41a6fb3b1b3540e9820dcc5faca68e6e',
  'index.html':'eff8127aebb5eb2a4d446717632f3c06d9803320'
};
const approvedEvidence={'reports/question-audit-matrix.json':'e0b834f1ee22cc03d3f8903e7a2a399d7f1e315d'};
const allowed=file=>Object.hasOwn(approvedBlobs,file)||Object.hasOwn(approvedEvidence,file)||file==='package.json'||file.startsWith('scripts/qa/')||file.startsWith('independent-audit/');
const unexpected=changed.map(line=>line.slice(2).trim()).filter(file=>!allowed(file));
if(unexpected.length)fail(`unexpected dirty files: ${unexpected.join(', ')}`);
for(const [file,approved] of Object.entries(approvedBlobs))if(childProcess.execFileSync('git',['hash-object',file],{cwd:core.ROOT,encoding:'utf8'}).trim()!==approved)fail(`approved ${file} blob changed`);
for(const [file,approved] of Object.entries(approvedEvidence))if(childProcess.execFileSync('git',['hash-object',file],{cwd:core.ROOT,encoding:'utf8'}).trim()!==approved)fail(`approved ${file} blob changed`);
const changedProduction=childProcess.execFileSync('git',['diff','--name-only','HEAD','--','data','js','css','types','index.html','manifest.webmanifest','pwa-release-manifest.json','service-worker.js'],{cwd:core.ROOT,encoding:'utf8'}).trim().split(/\n/u).filter(Boolean);
const unexpectedProduction=changedProduction.filter(file=>!Object.hasOwn(approvedBlobs,file));
if(unexpectedProduction.length)fail(`unexpected Production drift: ${unexpectedProduction.join(', ')}`);
let candidate;
try{candidate=lifecycle.createCandidate();}catch(error){fail(error.message);}
if(candidate.generation!==2||candidate.predecessor.phase!=='A_FINAL_IMMUTABLE_BASELINE'||candidate.predecessor.generation!==1)fail('wrong predecessor or generation skip');
const verification=lifecycle.verifyCandidate(candidate);
if(!verification.ok)fail(verification.errors.join(', '));
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
console.log(`FINALIZED ${path.relative(core.ROOT,output)}`);
