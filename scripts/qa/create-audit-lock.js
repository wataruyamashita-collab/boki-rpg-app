'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path'),childProcess=require('child_process');
const root=path.resolve(__dirname,'../..');
const destination=path.join(root,'reports/auto-gate/audit-lock.json');
const mode=process.argv[2],lockPath='reports/auto-gate/audit-lock.json',finalPhase='A_FINAL_IMMUTABLE_BASELINE';
if(!['--bootstrap','--finalize-phase-a'].includes(mode)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: pass --bootstrap for an initial lock or --finalize-phase-a for the one-time final baseline');
  process.exit(1);
}
if(mode==='--bootstrap'&&fs.existsSync(destination)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: an audit lock already exists and cannot be overwritten');
  process.exit(1);
}
let trackedLockExists=false,finalBaselineExists=false;
try{const commits=childProcess.execFileSync('git',['rev-list','--all','--reverse','--',lockPath],{cwd:root,encoding:'utf8'}).trim().split(/\s+/u).filter(Boolean);trackedLockExists=commits.length>0;finalBaselineExists=commits.some(commit=>{try{return JSON.parse(childProcess.execFileSync('git',['show',`${commit}:${lockPath}`],{cwd:root,encoding:'utf8'})).phase===finalPhase;}catch(_){return false;}});}catch(_){/* A non-Git bootstrap environment has no historical lock. */}
if(finalBaselineExists){
  console.error('AUDIT_LOCK_CREATE_REFUSED: a Phase A final baseline already exists in Git history');
  process.exit(1);
}
if(mode==='--bootstrap'&&trackedLockExists){
  console.error('AUDIT_LOCK_CREATE_REFUSED: the audit lock already exists in Git history');
  process.exit(1);
}
if(mode==='--finalize-phase-a'&&!fs.existsSync(destination)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: Phase A finalization requires the existing construction lock');
  process.exit(1);
}
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();
const files=[...walk('independent-audit'),...walk('scripts/qa')];
const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const auditHash=crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
fs.mkdirSync(path.dirname(destination),{recursive:true});
const lock={algorithm:'sha256',phase:finalPhase,baselineVersion:1,createdBy:'scripts/qa/create-audit-lock.js --finalize-phase-a',files:hashes,auditHash};
fs.writeFileSync(destination,JSON.stringify(lock,null,2)+'\n',{flag:mode==='--bootstrap'?'wx':'w'});
console.log(auditHash);
