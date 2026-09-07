'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const lifecycle = require('../../scripts/qa/phase-b-lifecycle');
const finalizer = require('../../scripts/qa/finalize-phase-b-generation-11');
const committed = childProcess.spawnSync('git',['cat-file','-e','HEAD:reports/auto-gate/audit-locks/phase-b-generation-11.json']).status === 0;
const authorities = lifecycle.generationAuthorities(), generation10 = authorities.find(item => item.document.generation === 10);
const generation11 = authorities.find(item => item.document.generation === 11) || (fs.existsSync(finalizer.output) ? { document:JSON.parse(fs.readFileSync(finalizer.output,'utf8')) } : null);
assert(generation10, 'Generation 10 predecessor exists');
if (generation11) {
  assert.deepStrictEqual(generation11.document.predecessor, lifecycle.identity(generation10.document));
  assert.strictEqual(committed ? lifecycle.verifyCurrent().ok : lifecycle.verifyCandidate(generation11.document).ok, true);
} else {
  const candidate = lifecycle.createCandidate(); assert.strictEqual(candidate.generation, 11);
  assert.deepStrictEqual(candidate.predecessor, lifecycle.identity(generation10.document)); assert.strictEqual(lifecycle.verifyCandidate(candidate).ok, true);
}
for (const item of authorities) assert(fs.readFileSync(item.file).equals(item.bytes));
assert.strictEqual(finalizer.approvedHead, '0c66980429d2c368d7a16862c3ad95c9c444fc31');
assert.strictEqual(finalizer.approvedTree, '88b501b37e9b639e390d199a973663995e8f7979');
console.log('Generation 11 finalizer regressions: clean PR #151 baseline, successor, and immutability: ok');
