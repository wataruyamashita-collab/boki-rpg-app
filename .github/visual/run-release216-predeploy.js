'use strict';
// Temporary exact-SHA predeployment proof. This diagnostic never changes product files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const originalPath = path.join(__dirname,'run-pwa-manual-update.js');
const outputPath = path.join(__dirname,'run-release216-predeploy.generated.js');
let source = fs.readFileSync(originalPath,'utf8');
function replaceExactlyOnce(oldText,newText,label) {
  assert.equal(source.split(oldText).length,2,label+' anchor must occur exactly once');
  source=source.replace(oldText,newText);
}
replaceExactlyOnce("const BASE = 'f1fa72436cf572b5997b81fff5aac0bee39b2be6';",
"const BASE = 'd4a5a7391d36e4e0771f14a1310c9ac172945b96';",'fixed public Release214');
replaceExactlyOnce("assert.strictEqual(oldSource.release,'20260924-202');",
"assert.strictEqual(oldSource.release,'20261014-214');",'assert exact old Release214');
replaceExactlyOnce("c.saveDraft(false);return {j001:j,l031:l};",
"c.saveDraft(false);for(const id of ['L044','L045']){c.model.recordAttempt(id,true,1000,'',false,Date.now());c.model.record(id,true);c.model.setDraft(id,{cells:{value1:123}});}return {j001:j,l031:l};",
'actual old-version L044/L045 first-answer/reward-independent attempt and draft seed');
const begin=source.indexOf('function checkRetained(before,after,contentUpgrade=false) {');
const end=source.indexOf('function checkCache(snapshot,newSource) {',begin);
assert(begin>=0&&end>begin,'verify manual-update harness retaining predicate boundaries');
const replacement=String.raw`function checkRetained(before,after,contentUpgrade=false) {
  if(!contentUpgrade) {
    assert.deepStrictEqual(after.local,before.local,'saved state unchanged on reload/offline');
    assert(after.storedProgressValid);
  } else {
    const old=JSON.parse(before.local[before.progressKey]);
    const current=JSON.parse(after.local[after.progressKey]);
    assert.equal(old.contentRevision,4,'old real Release214 progress revision');
    assert.equal(current.contentRevision,5,'Release216 content revision');
    assert.equal(old.learningEvidenceIntegrity.schemaVersion,10);
    assert.equal(current.learningEvidenceIntegrity.schemaVersion,11);
    assert(after.storedProgressValid,'post-upgrade identity-bound save passes backup validation');
    assert.deepStrictEqual(current.questionContentVersions,
      {...old.questionContentVersions,
        L044:'L044:cash-book-opening-zero-v1',
        L045:'L045:checking-book-opening-zero-v1'});
    for(const id of ['L044','L045']) {
      const archive=current.contentMigrationArchive.questions[id];
      assert(archive,'older '+id+' content must be archived');
      assert.deepStrictEqual(archive.questionStats,old.questionStats[id]);
      assert.deepStrictEqual(archive.draft,old.drafts[id]);
      assert.deepStrictEqual(archive.reviewSchedule,old.reviewSchedule[id]||null);
      assert.deepStrictEqual(archive.learningEvidence,old.learningEffectiveness.questions[id]);
      assert.equal(archive.attempts.length,old.attempts.filter(a=>(a.questionId||a.id)===id).length);
      assert(current.contentRecheckIds.includes(id),'former mastery must require current-content confirmation');
      assert.equal(current.questionStats[id],undefined,'old correctness not promoted');
      assert.equal(current.learningEffectiveness.questions[id],undefined,'old learning evidence not promoted');
      assert.equal(current.drafts[id],undefined,'old draft not applied to new meaning');
    }
    for(const id of ['J001','L031']) {
      assert.deepStrictEqual(current.questionStats[id],old.questionStats[id],id+' unrelated stats preserved');
      assert.deepStrictEqual(current.reviewSchedule[id],old.reviewSchedule[id],id+' unrelated review preserved');
    }
    assert.deepStrictEqual(current.drafts.J035,old.drafts.J035,'unrelated unfinished answer retained');
    assert.deepStrictEqual(current.learningContinuityState,old.learningContinuityState,'lifetime learning retained');
    const oldRest={...before.local};const newRest={...after.local};
    delete oldRest[before.progressKey];delete newRest[after.progressKey];
    assert.deepStrictEqual(newRest,oldRest,'entire non-progress namespace byte-identical');
  }
  assert.equal(after.model.questionStats.L031.incorrectCount,before.model.questionStats.L031.incorrectCount);
  assert.deepStrictEqual(after.model.reviewSchedule.L031,before.model.reviewSchedule.L031);
  assert.deepStrictEqual(after.model.drafts.J035,before.model.drafts.J035);
  assert.equal(after.character.xp,before.character.xp);
  assert.deepStrictEqual(after.character.rewardedIds,before.character.rewardedIds);
}
`;
source=source.slice(0,begin)+replacement+source.slice(end);
fs.writeFileSync(outputPath,source,'utf8');
try{
  const env={...process.env,
    PWA_NEW_SHA:'7655695a3532c8578143966208ece4854846587e',
    PWA_TRIALS:'5',
    PWA_OUTPUT:path.resolve('artifacts/release216-214-to-216')};
  const run=cp.spawnSync(process.execPath,[outputPath],{env,stdio:'inherit'});
  assert.equal(run.status,0,'Release214-to-216 manual same-origin update with migrated user progress');
}finally{
  try{fs.unlinkSync(outputPath);}catch(_){}
}
