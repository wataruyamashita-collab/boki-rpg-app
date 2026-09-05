'use strict';

const fs=require('fs');
const path=require('path');
const lifecycle=require('./phase-b-lifecycle');

const candidatePath=process.argv[2];
if(!candidatePath){
  console.error('AUDIT_CANDIDATE_REFUSED: pass an explicit candidate JSON path');
  process.exit(2);
}
let candidate;
try{candidate=JSON.parse(fs.readFileSync(path.resolve(candidatePath),'utf8'));}
catch(error){console.error(`AUDIT_CANDIDATE_INVALID: ${error.message}`);process.exit(2);}
const result=lifecycle.verifyCandidate(candidate);
console.log(result.ok?'PASS PHASE_B_CANDIDATE':`AUDIT_CANDIDATE_BROKEN ${result.errors.join(', ')}`);
process.exit(result.ok?0:1);
