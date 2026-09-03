'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path');
const auditLock=require('./audit-lock');
const root=path.resolve(__dirname,'../..');
const destination=path.join(root,'reports/auto-gate/audit-lock.json');
const mode=process.argv[2];
if(!['--finalize-phase-a','--bootstrap'].includes(mode)){
  console.error('AUDIT_LOCK_CREATE_REFUSED: pass --finalize-phase-a for the final Phase A lock');
  process.exit(1);
}
if(auditLock.discoverHistoricalBaseline(root,'HEAD')){
  console.error('AUDIT_LOCK_CREATE_REFUSED: a final Phase A baseline exists in HEAD ancestry');
  process.exit(1);
}
if(mode==='--bootstrap'){console.error('AUDIT_LOCK_CREATE_REFUSED: bootstrap cannot replace Phase A finalization');process.exit(1);}
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]).sort();
const files=[...walk('independent-audit'),...walk('scripts/qa')];
const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
fs.mkdirSync(path.dirname(destination),{recursive:true});
const lock=auditLock.makeLock(hashes);
fs.writeFileSync(destination,JSON.stringify(lock,null,2)+'\n');
console.log(lock.baselineIdentity);
