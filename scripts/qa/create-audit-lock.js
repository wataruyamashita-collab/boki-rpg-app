'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path'),childProcess=require('child_process');
const root=path.resolve(__dirname,'../..');
const destination=path.join(root,'reports/auto-gate/audit-lock.json');
if(process.argv[2]!=='--bootstrap'){
  console.error('AUDIT_LOCK_CREATE_REFUSED: pass --bootstrap for the initial lock only');
  process.exit(1);
}
if(fs.existsSync(destination)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: an audit lock already exists and cannot be overwritten');
  process.exit(1);
}
let trackedLockExists=false;
try{trackedLockExists=childProcess.execFileSync('git',['log','--all','--format=%H','--','reports/auto-gate/audit-lock.json'],{cwd:root,encoding:'utf8'}).trim().length>0;}catch(_){/* A non-Git bootstrap environment has no historical lock. */}
if(trackedLockExists){
  console.error('AUDIT_LOCK_CREATE_REFUSED: the audit lock already exists in Git history');
  process.exit(1);
}
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();
const files=[...walk('independent-audit'),...walk('scripts/qa')];
const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const auditHash=crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify({algorithm:'sha256',createdBy:'scripts/qa/create-audit-lock.js --bootstrap',files:hashes,auditHash},null,2)+'\n',{flag:'wx'});
console.log(auditHash);
