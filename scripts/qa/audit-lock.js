'use strict';

const crypto=require('crypto'),fs=require('fs'),path=require('path'),childProcess=require('child_process');
const LOCK_PATH='reports/auto-gate/audit-lock.json';
const FINAL_PHASE='A_FINAL_IMMUTABLE_BASELINE';
const SCHEMA_VERSION=2;
const BASELINE_VERSION=1;
const CREATED_BY='scripts/qa/create-audit-lock.js --finalize-phase-a';

function canonical(value){
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest=value=>crypto.createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:canonical(value)).digest('hex');
const sortedFiles=files=>Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)));
const computeAuditHash=files=>digest(Object.entries(sortedFiles(files)).map(([file,hash])=>({path:file,hash})));
function identityPayload(lock){return {algorithm:lock.algorithm,lockSchemaVersion:lock.lockSchemaVersion,phase:lock.phase,baselineVersion:lock.baselineVersion,createdBy:lock.createdBy,files:sortedFiles(lock.files||{}),auditHash:lock.auditHash};}
const computeBaselineIdentity=lock=>digest(identityPayload(lock));
function makeLock(files){const lock={algorithm:'sha256',lockSchemaVersion:SCHEMA_VERSION,phase:FINAL_PHASE,baselineVersion:BASELINE_VERSION,createdBy:CREATED_BY,files:sortedFiles(files)};lock.auditHash=computeAuditHash(lock.files);lock.baselineIdentity=computeBaselineIdentity(lock);return lock;}
function isFinal(lock){return lock?.phase===FINAL_PHASE&&lock?.lockSchemaVersion===SCHEMA_VERSION;}
function git(root,args){return childProcess.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
function discoverHistoricalBaseline(root,ref='HEAD'){
  let commits=[];try{const output=git(root,['rev-list','--reverse',ref,'--',LOCK_PATH]);commits=output?output.split('\n'):[];}catch(_){return null;}
  for(const commit of commits){try{const lock=JSON.parse(git(root,['show',`${commit}:${LOCK_PATH}`]));if(isFinal(lock))return {lock,diagnosticCommit:commit};}catch(_){/* A malformed/non-final historical lock is not an authority. */}}
  return null;
}
function validateSelf(lock){const errors=[];if(lock?.algorithm!=='sha256')errors.push('algorithm');if(!isFinal(lock))errors.push('final metadata');if(lock?.baselineVersion!==BASELINE_VERSION)errors.push('baselineVersion');if(lock?.createdBy!==CREATED_BY)errors.push('createdBy');if(lock?.auditHash!==computeAuditHash(lock?.files||{}))errors.push('auditHash');if(lock?.baselineIdentity!==computeBaselineIdentity(lock||{}))errors.push('baselineIdentity');return errors;}
function verifyAuditLock({root,ref='HEAD'}={}){
  const lockFile=path.join(root,LOCK_PATH);if(!fs.existsSync(lockFile))return {ok:false,errors:['lock missing'],historicalBaselineValid:false,currentLockMatches:false};
  let current;try{current=JSON.parse(fs.readFileSync(lockFile,'utf8'));}catch(error){return {ok:false,errors:[`lock parse: ${error.message}`],historicalBaselineValid:false,currentLockMatches:false};}
  const errors=validateSelf(current),historical=discoverHistoricalBaseline(root,ref),authority=historical?.lock||current;
  const historicalErrors=validateSelf(authority);if(historicalErrors.length)errors.push(...historicalErrors.map(x=>`historical:${x}`));
  const fields=['baselineIdentity','auditHash','phase','lockSchemaVersion','baselineVersion','createdBy'];
  if(historical)for(const field of fields)if(current[field]!==authority[field])errors.push(`historical mismatch:${field}`);
  if(historical&&canonical(current.files)!==canonical(authority.files))errors.push('historical mismatch:files');
  for(const [file,hash] of Object.entries(authority.files||{})){const target=path.join(root,file);if(!fs.existsSync(target)||digest(fs.readFileSync(target))!==hash)errors.push(file);}
  const auditDirs=['independent-audit','scripts/qa'],walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${dir}/${entry.name}`):[`${dir}/${entry.name}`]);
  for(const file of auditDirs.flatMap(walk).sort())if(!(file in (authority.files||{})))errors.push(`unlocked:${file}`);
  return {ok:errors.length===0,errors:[...new Set(errors)],hash:current.auditHash,auditLock:{type:'GIT_ANCESTOR_BASELINE',historyScope:'HEAD_ANCESTRY',phase:current.phase,lockSchemaVersion:current.lockSchemaVersion,baselineVersion:current.baselineVersion,baselineIdentity:current.baselineIdentity,auditHash:current.auditHash,historicalBaselineValid:historicalErrors.length===0,currentLockMatches:errors.length===0},diagnosticCommit:historical?.diagnosticCommit||null};
}

module.exports={LOCK_PATH,FINAL_PHASE,SCHEMA_VERSION,BASELINE_VERSION,CREATED_BY,canonical,digest,computeAuditHash,computeBaselineIdentity,makeLock,isFinal,discoverHistoricalBaseline,validateSelf,verifyAuditLock};
