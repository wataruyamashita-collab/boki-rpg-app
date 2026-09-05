'use strict';

const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('./audit-core');

const ROOT_LOCK='reports/auto-gate/audit-lock.json';
const GENERATION_DIRECTORY='reports/auto-gate/audit-locks';
const GENERATION_PHASE='B_GENERATION';
const gitArguments={rootHistory:['rev-list','HEAD','--',ROOT_LOCK],generationFiles:['ls-tree','-r','--name-only','HEAD','--',GENERATION_DIRECTORY]};
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonicalize=value=>{
  if(Array.isArray(value))return `[${value.map(canonicalize).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const canonicalDocumentHash=document=>digest(canonicalize(document));
const runGit=args=>childProcess.execFileSync('git',args,{cwd:core.ROOT,encoding:'utf8'}).trim();

function phaseARootAuthority(){
  const commits=runGit(gitArguments.rootHistory).split(/\s+/u).filter(Boolean);
  const matches=[];
  for(const commit of commits){
    try{
      const bytes=childProcess.execFileSync('git',['show',`${commit}:${ROOT_LOCK}`],{cwd:core.ROOT});
      const document=JSON.parse(bytes.toString('utf8'));
      if(document.schemaVersion===2&&document.phase==='A_FINAL_IMMUTABLE_BASELINE')matches.push({commit,bytes,document});
    }catch(_){/* A non-JSON ancestor cannot be the Final V2 authority. */}
  }
  if(matches.length!==1)throw new Error(`Phase A Final V2 authority count must be 1 (found ${matches.length})`);
  return matches[0];
}

function generationAuthorities(){
  let output='';
  try{output=runGit(gitArguments.generationFiles);}catch(_){return [];}
  return output.split(/\n/u).filter(Boolean).map(file=>{
    const raw=childProcess.execFileSync('git',['show',`HEAD:${file}`],{cwd:core.ROOT,encoding:'utf8'});
    return {file,document:JSON.parse(raw)};
  });
}

function validateRoot(errors){
  let authority;
  try{authority=phaseARootAuthority();}catch(error){errors.push(error.message);return null;}
  const currentPath=path.join(core.ROOT,ROOT_LOCK);
  if(!fs.existsSync(currentPath)){errors.push('Phase A root missing');return authority;}
  const current=fs.readFileSync(currentPath);
  if(!current.equals(authority.bytes))errors.push('Phase A root raw bytes differ from historical Final V2 authority');
  const root=authority.document;
  if(root.schemaVersion!==2||root.phase!=='A_FINAL_IMMUTABLE_BASELINE'||root.baselineVersion!==1||root.algorithm!=='sha256')errors.push('Phase A root metadata invalid or downgraded');
  if(root.auditHash!==digest(JSON.stringify(root.files||{})))errors.push('Phase A root auditHash mismatch');
  return authority;
}

function identity(document){
  return {phase:document.phase,generation:document.generation??document.baselineVersion,canonicalDocumentSha256:canonicalDocumentHash(document),auditHash:document.auditHash,baselineIdentity:document.baselineIdentity};
}

function validateGenerationShape(document,errors,label){
  if(document.schemaVersion!==3||document.phase!==GENERATION_PHASE||!Number.isInteger(document.generation)||document.generation<2||document.algorithm!=='sha256')errors.push(`${label} generation metadata invalid or downgraded`);
  if(!document.predecessor||typeof document.predecessor!=='object')errors.push(`${label} predecessor missing`);
  if(!document.files||typeof document.files!=='object'||!document.productionHashes||typeof document.productionHashes!=='object')errors.push(`${label} hash maps missing`);
  if(document.auditHash!==digest(JSON.stringify(document.files||{})))errors.push(`${label} auditHash mismatch`);
  if(document.baselineIdentity!==digest(JSON.stringify(document.productionHashes||{})))errors.push(`${label} baselineIdentity mismatch`);
}

function resolveTip(rootDocument,generations,errors){
  const byGeneration=new Map();
  for(const item of generations){
    const document=item.document||item;
    validateGenerationShape(document,errors,item.file||'authority');
    const same=byGeneration.get(document.generation)||[];same.push(document);byGeneration.set(document.generation,same);
  }
  for(const [generation,documents] of byGeneration)if(documents.length!==1)errors.push(`competing generation ${generation} authorities found`);
  let tip=rootDocument;
  for(const generation of [...byGeneration.keys()].sort((a,b)=>a-b)){
    const document=byGeneration.get(generation)[0];
    const expected=(tip.generation??tip.baselineVersion)+1;
    if(generation!==expected)errors.push(`generation skip: expected ${expected}, found ${generation}`);
    const predecessor=identity(tip);
    for(const key of Object.keys(predecessor))if(document.predecessor?.[key]!==predecessor[key])errors.push(`generation ${generation} predecessor ${key} mismatch`);
    tip=document;
  }
  return tip;
}

function currentHashes(){
  const files=[...core.walk('independent-audit'),...core.walk('scripts/qa')].sort();
  const auditFiles=Object.fromEntries(files.map(file=>[file,core.sha(file)]));
  const productionHashes=Object.fromEntries(core.productionFiles().map(file=>[file,core.sha(file)]));
  return {files:auditFiles,productionHashes,auditHash:digest(JSON.stringify(auditFiles)),baselineIdentity:digest(JSON.stringify(productionHashes))};
}

function createCandidate(phase='B_GENERATION',generations=generationAuthorities()){
  const errors=[],root=validateRoot(errors);
  if(!root||errors.length)throw new Error(errors.join('; '));
  const tip=resolveTip(root.document,generations,errors);
  if(errors.length)throw new Error(errors.join('; '));
  const hashes=currentHashes();
  return {schemaVersion:3,phase,generation:(tip.generation??tip.baselineVersion)+1,algorithm:'sha256',predecessor:identity(tip),baselineIdentity:hashes.baselineIdentity,productionHashes:hashes.productionHashes,files:hashes.files,auditHash:hashes.auditHash};
}

function verifyCandidate(candidate,{generations=generationAuthorities()}={}){
  const errors=[],root=validateRoot(errors);
  if(!root)return {ok:false,errors};
  validateGenerationShape(candidate,errors,'candidate');
  const tip=resolveTip(root.document,generations,errors),expectedGeneration=(tip.generation??tip.baselineVersion)+1;
  if(candidate.generation!==expectedGeneration)errors.push(`candidate generation must be exactly ${expectedGeneration}`);
  if(expectedGeneration===2&&candidate.phase!=='B_GENERATION')errors.push('first successor must be B_GENERATION');
  const predecessor=identity(tip);
  for(const key of Object.keys(predecessor))if(candidate.predecessor?.[key]!==predecessor[key])errors.push(`candidate predecessor ${key} mismatch`);
  const hashes=currentHashes();
  if(JSON.stringify(candidate.files)!==JSON.stringify(hashes.files)||candidate.auditHash!==hashes.auditHash)errors.push('candidate audit hashes mismatch');
  if(JSON.stringify(candidate.productionHashes)!==JSON.stringify(hashes.productionHashes)||candidate.baselineIdentity!==hashes.baselineIdentity)errors.push('candidate Production hashes mismatch');
  return {ok:errors.length===0,errors:[...new Set(errors)]};
}

module.exports={ROOT_LOCK,canonicalDocumentHash,createCandidate,generationAuthorities,gitArguments,identity,phaseARootAuthority,verifyCandidate};
