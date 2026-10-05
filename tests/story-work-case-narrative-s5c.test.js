'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('data/questions.js','utf8');
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'data/questions.js'});

const questions=sandbox.window.QuestionData;
const examIds=new Set(sandbox.window.ExamPoolDefinition||[]);
const anchors=sandbox.window.AnchorScenes||[];
const authority=sandbox.window.WorkCaseNarratives;
const acceptedS5B=require('./fixtures/story-work-case-s5b-accepted.json');
const acceptedS5C=require('./fixtures/story-work-case-s5c-accepted.json');

const journalIds=['J034','J035','J036','J037'];
const cashIds=['L001','L006','L011','L016'];
const receivableIds=['L002','L007','L012','L017'];
const payableIds=['L003','L008','L013','L018'];
const inventoryIds=['L004','L014','L019'];
const fixedAssetIds=['L005','L010','L015','L020','L025'];
const ledgerIds=[...cashIds,...receivableIds,...payableIds,...inventoryIds,...fixedAssetIds];
const s5cIds=[...journalIds,...ledgerIds].sort();
const allExpected=[...Object.keys(acceptedS5B),...s5cIds].sort();

assert(authority,'S5C WorkCaseNarratives authority must be exported');
assert(Object.isFrozen(authority),'S5C WorkCaseNarratives authority must remain immutable');
assert.strictEqual(Object.keys(acceptedS5B).length,41,'S5B accepted snapshot must remain exactly 41 entries');
assert.strictEqual(journalIds.length,4,'S5C journal population must remain 4');
assert.strictEqual(ledgerIds.length,20,'S5C ledger population must remain 20');
assert.strictEqual(s5cIds.length,24,'S5C locked population must remain 24');
assert.strictEqual(allExpected.length,65,'S5C total authority must be exactly 65 entries');

assert.deepStrictEqual(
  Object.keys(acceptedS5C).sort(),
  allExpected,
  'S5C accepted snapshot must cover exactly the 65 locked S5A/S5B/S5C entries'
);
for(const [id,before] of Object.entries(acceptedS5C)){
  assert(authority[id], `${id}: accepted S5C authority entry must remain present during later S5 batches`);
  assert.strictEqual(
    authority[id].before,
    before,
    `${id}: later S5 batches must preserve accepted S5C Before text byte-for-byte`
  );
}

const anchorRefs=new Set(anchors.map(scene=>scene.referenceQuestionId));
assert(anchorRefs.has('L009'),'S5C must recognize L009 as an Anchor reference');
assert(anchorRefs.has('L030'),'S5C must recognize L030 as an Anchor reference');
assert(!s5cIds.includes('L009'),'S5C must exclude Anchor L009');
assert(!s5cIds.includes('L030'),'S5C must exclude Anchor L030');

const story=Object.values(questions).filter(question=>
  question.learningRole!=='review'&&!examIds.has(question.id)
);
assert.strictEqual(story.length,166,'S5C must preserve the accepted Story population');
assert.strictEqual(anchors.length,36,'S5C must preserve the accepted 36 AnchorScenes');

for(const [id,before] of Object.entries(acceptedS5B)){
  assert.strictEqual(
    authority[id]?.before,
    before,
    `${id}: S5C must preserve accepted S5A/S5B Before text byte-for-byte`
  );
}

const beforeTexts=[];
for(const id of s5cIds){
  const question=questions[id];
  const entry=authority[id];

  assert(question,`${id}: S5C target question must exist`);
  assert(!anchorRefs.has(id),`${id}: S5C must never overwrite an Anchor reference question`);
  assert(question.learningRole!=='review',`${id}: S5C target must remain outside Review`);
  assert(!examIds.has(id),`${id}: S5C target must remain outside Exam`);
  assert(entry,`${id}: S5C authored Before entry must exist`);

  assert.deepStrictEqual(
    Object.keys(entry),
    ['before'],
    `${id}: S5C authority must stay Before-only and must not extend non-anchor After/Hook behavior`
  );

  const before=String(entry.before||'').trim();
  assert(before.length>0,`${id}: authored Before must be non-empty`);
  assert(before.length<=120,`${id}: authored Before must stay within the 120-character mobile reading bound`);
  assert(!/[0-9０-９]/u.test(before),`${id}: authored Before must not reveal numeric answer values`);
  assert(!/[円￥¥]/u.test(before),`${id}: authored Before must not reveal answer amounts`);
  assert(!/借方|貸方/u.test(before),`${id}: authored Before must not coach journal direction`);
  assert(/(?:あなた|自分で)/u.test(before),`${id}: authored Before must keep the reader in the protagonist viewpoint`);
  assert(/(?:確認|確かめ|照合|追う|整理|見極め|つなげ)/u.test(before),`${id}: authored Before must contain an explicit reader action`);

  const answer=question.answer||{};
  const answerLines=[...(answer.debit||[]),...(answer.credit||[])];
  const answerAccounts=[...new Set(answerLines.map(line=>line&&line.account).filter(Boolean))];
  for(const account of answerAccounts){
    assert(
      !before.includes(account),
      `${id}: authored Before must not leak correct account name "${account}"`
    );
  }

  assert(
    String(question.story||'').startsWith(before),
    `${id}: runtime Story must use the authored S5C Before context`
  );
  assert(
    String(question.story||'').includes('〔調査 '),
    `${id}: runtime Story must preserve Story progress context`
  );

  beforeTexts.push(before);
}

assert.strictEqual(
  new Set(beforeTexts).size,
  s5cIds.length,
  'S5C must not replace generic repetition with duplicated authored Before text'
);

for(const id of cashIds){
  assert(/(?:入出金|手許|残高|つながり|連続)/u.test(authority[id].before),`${id}: cash-ledger context must express cash-balance continuity`);
}
for(const id of receivableIds){
  assert(/(?:得意先|回収|未回収)/u.test(authority[id].before),`${id}: receivables context must express customer-by-customer recovery balance`);
}
for(const id of payableIds){
  assert(/(?:仕入先|支払|未払)/u.test(authority[id].before),`${id}: payables context must express supplier-by-supplier payment balance`);
}
for(const id of inventoryIds){
  assert(/(?:数量|単価|在庫|払出)/u.test(authority[id].before),`${id}: inventory context must express quantity/cost flow and ending inventory`);
}
for(const id of fixedAssetIds){
  assert(/(?:取得|使用|償却|帳簿価額|台帳)/u.test(authority[id].before),`${id}: fixed-asset context must express acquisition/use/depreciation continuity`);
}

assert(/(?:貸付|入金|利息)/u.test(authority.J034.before),'J034: journal context must be grounded in the late-arriving interest evidence');
assert(/(?:未使用|印紙|前期|棚卸)/u.test(authority.J035.before),'J035: journal context must be grounded in the prior-period unused-stamp evidence');
assert(/(?:他店|発行|券|販売)/u.test(authority.J036.before),'J036: journal context must be grounded in the other-store voucher evidence');
assert(/(?:倉庫|契約|敷金|返還)/u.test(authority.J037.before),'J037: journal context must be grounded in the warehouse lease evidence');

console.log('ISSUE179_S5C_WORK_CASE_NARRATIVE_PASS');
