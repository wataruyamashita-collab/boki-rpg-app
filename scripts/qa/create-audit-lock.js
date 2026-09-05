'use strict';

const fs=require('fs'),crypto=require('crypto'),path=require('path');
const core=require('./audit-core');
const destination=path.join(core.ROOT,'reports/auto-gate/audit-lock.json');
if(process.argv[2]!=='--finalize-v2'){
  console.error('AUDIT_LOCK_CREATE_REFUSED: pass --finalize-v2 exactly once');
  process.exit(1);
}
const reachable=core.reachableFinalV2();
if(reachable.length!==0){
  console.error(`AUDIT_LOCK_CREATE_REFUSED: reachable Final V2 count is ${reachable.length}`);
  process.exit(1);
}
const files=[...core.walk('independent-audit'),...core.walk('scripts/qa')].sort();
const hashes=Object.fromEntries(files.map(file=>[file,core.sha(file)]));
const productionHashes=Object.fromEntries(core.productionFiles().map(file=>[file,core.sha(file)]));
const auditHash=crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const baselineIdentity=crypto.createHash('sha256').update(JSON.stringify(productionHashes)).digest('hex');
const lock={schemaVersion:2,phase:'A_FINAL_IMMUTABLE_BASELINE',baselineVersion:1,algorithm:'sha256',createdBy:'scripts/qa/create-audit-lock.js --finalize-v2',baselineIdentity,files:hashes,auditHash};
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(lock,null,2)+'\n');
console.log(JSON.stringify({auditHash,baselineIdentity},null,2));
