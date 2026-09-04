'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path'),childProcess=require('child_process');
const root=path.resolve(__dirname,'../..');
const destination=path.join(root,'reports/auto-gate/audit-lock.json');
if(process.argv[2]!=='--finalize-v2'){
  console.error('AUDIT_LOCK_CREATE_REFUSED: pass --finalize-v2 for the one-time V2 baseline');
  process.exit(1);
}
let trackedLockExists=false;
if(fs.existsSync(destination)){
  try{if(JSON.parse(fs.readFileSync(destination,'utf8')).lockSchemaVersion===2){console.error('AUDIT_LOCK_CREATE_REFUSED: the V2 audit lock already exists');process.exit(1);}}catch(_){console.error('AUDIT_LOCK_CREATE_REFUSED: the existing audit lock is invalid');process.exit(1);}
}
try{trackedLockExists=childProcess.execFileSync('git',['log','--format=%H','--','reports/auto-gate/audit-lock.json'],{cwd:root,encoding:'utf8'}).trim().split(/\s+/u).filter(Boolean).some(commit=>{try{return JSON.parse(childProcess.execFileSync('git',['show',`${commit}:reports/auto-gate/audit-lock.json`],{cwd:root,encoding:'utf8'})).lockSchemaVersion===2;}catch(_){return false;}});}catch(_){/* A non-Git bootstrap environment has no historical V2 lock. */}
if(trackedLockExists){
  console.error('AUDIT_LOCK_CREATE_REFUSED: the audit lock already exists in Git history');
  process.exit(1);
}
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();
const files=[...walk('independent-audit'),...walk('scripts/qa')];
const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const canonical=value=>{if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;return JSON.stringify(value);};
const auditHash=crypto.createHash('sha256').update(canonical(hashes)).digest('hex');
const identityFields={algorithm:'sha256',lockSchemaVersion:2,phase:'A_FINAL_IMMUTABLE_BASELINE',baselineVersion:1,files:hashes};
const baselineIdentity=crypto.createHash('sha256').update(canonical(identityFields)).digest('hex');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify({...identityFields,createdBy:'scripts/qa/create-audit-lock.js --finalize-v2',baselineIdentity,auditHash},null,2)+'\n');
console.log(baselineIdentity);
