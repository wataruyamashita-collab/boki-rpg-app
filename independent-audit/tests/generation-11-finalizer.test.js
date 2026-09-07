'use strict';
const assert=require('assert'),childProcess=require('child_process'),fs=require('fs');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle'),finalizer=require('../../scripts/qa/finalize-phase-b-generation-11');
const committed=childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-11.json']).status===0;
const authorities=lifecycle.generationAuthorities(),generation10=authorities.find(item=>item.document.generation===10);
const generation11=authorities.find(item=>item.document.generation===11)||(fs.existsSync(finalizer.output)?{document:JSON.parse(fs.readFileSync(finalizer.output))}:null);
if(generation11){assert.deepStrictEqual(generation11.document.predecessor,lifecycle.identity(generation10.document));assert.strictEqual(committed?lifecycle.verifyCurrent().ok:lifecycle.verifyCandidate(generation11.document).ok,true);}
else {const candidate=lifecycle.createCandidate();assert.strictEqual(candidate.generation,11);assert.deepStrictEqual(candidate.predecessor,lifecycle.identity(generation10.document));assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true);}
for(const item of authorities)assert(fs.readFileSync(item.file).equals(item.bytes));
console.log('Generation 11 finalizer regressions: successor, predecessor, candidate and historical immutability: ok');
