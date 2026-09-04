'use strict';

const crypto=require('crypto'),fs=require('fs'),path=require('path'),childProcess=require('child_process');
const LOCK_PATH='reports/auto-gate/audit-lock.json';
const SCHEMA_VERSION=2,PHASE='A_FINAL_IMMUTABLE_BASELINE',BASELINE_VERSION=1;
const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?`[${value.map(canonical).join(',')}]`:`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
const digest=value=>crypto.createHash('sha256').update(Buffer.isBuffer(value)?value:canonical(value)).digest('hex');
function walk(root,directory){const absolute=path.join(root,directory);if(!fs.existsSync(absolute))return [];return fs.readdirSync(absolute,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(root,`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();}
function auditedFiles(root){return [...walk(root,'independent-audit'),...walk(root,'scripts/qa')].sort();}
function snapshot(root){const files=Object.fromEntries(auditedFiles(root).map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),auditHash=digest(files);return {files,auditHash};}
function identityPayload(lock){return {lockSchemaVersion:lock.lockSchemaVersion,phase:lock.phase,baselineVersion:lock.baselineVersion,algorithm:lock.algorithm,files:lock.files,auditHash:lock.auditHash};}
function makeLock(root){const state=snapshot(root),lock={lockSchemaVersion:SCHEMA_VERSION,phase:PHASE,baselineVersion:BASELINE_VERSION,algorithm:'sha256',baselineIdentity:null,...state};lock.baselineIdentity=digest(identityPayload(lock));return lock;}
function git(root,args){return childProcess.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
function reachableLocks(root){let commits=[];try{const output=git(root,['log','--format=%H','HEAD','--',LOCK_PATH]);commits=output?output.split('\n'):[];}catch(_){return [];}return commits.flatMap(commit=>{try{return [{commit,lock:JSON.parse(git(root,['show',`${commit}:${LOCK_PATH}`]))}];}catch(_){return [];}});}
function isFinal(lock){return lock?.lockSchemaVersion===SCHEMA_VERSION&&lock.phase===PHASE&&lock.baselineVersion===BASELINE_VERSION;}
function verify(root){const absolute=path.join(root,LOCK_PATH),errors=[];if(!fs.existsSync(absolute))return {ok:false,errors:['lock missing']};let lock;try{lock=JSON.parse(fs.readFileSync(absolute,'utf8'));}catch(_){return {ok:false,errors:['lock invalid JSON']};}
  if(!isFinal(lock))errors.push('lock metadata');
  const current=makeLock(root);for(const file of new Set([...Object.keys(lock.files||{}),...Object.keys(current.files)]))if(lock.files?.[file]!==current.files[file])errors.push(file in current.files?file:`missing:${file}`);
  if(lock.auditHash!==digest(lock.files||{}))errors.push('auditHash');
  if(lock.baselineIdentity!==digest(identityPayload(lock)))errors.push('baselineIdentity');
  const baselines=reachableLocks(root).filter(item=>isFinal(item.lock));
  const migrationAuthorized=process.env.AUDIT_LOCK_ALLOW_PENDING_BASELINE==='1'&&reachableLocks(root).length>0;
  if(baselines.length===0){if(!migrationAuthorized)errors.push('historical baseline not reachable from HEAD');}
  else if(!baselines.some(item=>item.lock.baselineIdentity===lock.baselineIdentity))errors.push('historical baseline mismatch');
  return {ok:errors.length===0,errors:[...new Set(errors)],hash:lock.auditHash,baselineIdentity:lock.baselineIdentity,historyScope:'HEAD_ANCESTRY',commitShaDependency:'NONE'};
}
function create(root,mode){const absolute=path.join(root,LOCK_PATH),history=reachableLocks(root);if(mode!=='--finalize-v2'){throw new Error('AUDIT_LOCK_CREATE_REFUSED: pass --finalize-v2 to create the Final V2 baseline');}if(history.some(item=>isFinal(item.lock)))throw new Error('AUDIT_LOCK_CREATE_REFUSED: a Final V2 baseline is already reachable from HEAD');if(!fs.existsSync(absolute)&&history.length>0)throw new Error('AUDIT_LOCK_CREATE_REFUSED: a tracked audit lock was deleted');fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,JSON.stringify(makeLock(root),null,2)+'\n');return JSON.parse(fs.readFileSync(absolute));}
module.exports={LOCK_PATH,SCHEMA_VERSION,PHASE,BASELINE_VERSION,canonical,digest,auditedFiles,snapshot,identityPayload,makeLock,reachableLocks,verify,create,isFinal};
