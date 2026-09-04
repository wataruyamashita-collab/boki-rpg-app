'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path'),childProcess=require('child_process');
const root=path.resolve(__dirname,'../..');
const destination=path.join(root,'reports/auto-gate/audit-lock.json'),mode=process.argv[2];
if(!['--bootstrap','--finalize-v2'].includes(mode)){console.error('AUDIT_LOCK_CREATE_REFUSED: pass --bootstrap for the initial lock or --finalize-v2 once');process.exit(1);}
let trackedLockExists=false;
try{trackedLockExists=childProcess.execFileSync('git',['log','--all','--format=%H','--','reports/auto-gate/audit-lock.json'],{cwd:root,encoding:'utf8'}).trim().length>0;}catch(_){/* A non-Git bootstrap environment has no historical lock. */}
if(mode==='--bootstrap'&&(fs.existsSync(destination)||trackedLockExists)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: the audit lock already exists in Git history');
  process.exit(1);
}
if(mode==='--finalize-v2'){
 let finalV2Count=0;try{for(const commit of childProcess.execFileSync('git',['log','--format=%H','--','reports/auto-gate/audit-lock.json'],{cwd:root,encoding:'utf8'}).trim().split(/\s+/u).filter(Boolean)){try{if(JSON.parse(childProcess.execFileSync('git',['show',`${commit}:reports/auto-gate/audit-lock.json`],{cwd:root,encoding:'utf8'})).lockSchemaVersion===2)finalV2Count++;}catch(_){/* Ignore versions before valid JSON locks. */}}}catch(_){/* No reachable history. */}
 if(finalV2Count!==0){console.error(`AUDIT_LOCK_CREATE_REFUSED: reachable Final V2 count is ${finalV2Count}`);process.exit(1);}
}
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();
const files=[...walk('independent-audit'),...walk('scripts/qa')];
const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const auditHash=crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const productionFiles=['data','js','css','types'].flatMap(walk).concat(['index.html','service-worker.js']).sort(),productionHashes=Object.fromEntries(productionFiles.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const baselineIdentity=crypto.createHash('sha256').update(JSON.stringify({auditHash,productionHashes})).digest('hex');
fs.mkdirSync(path.dirname(destination),{recursive:true});
const lock=mode==='--finalize-v2'?{lockSchemaVersion:2,phase:'A_FINAL_IMMUTABLE_BASELINE',baselineVersion:1,algorithm:'sha256',createdBy:'scripts/qa/create-audit-lock.js --finalize-v2',baselineIdentity,files:hashes,auditHash}:{algorithm:'sha256',createdBy:'scripts/qa/create-audit-lock.js --bootstrap',files:hashes,auditHash};
fs.writeFileSync(destination,JSON.stringify(lock,null,2)+'\n',mode==='--bootstrap'?{flag:'wx'}:undefined);
console.log(auditHash);
