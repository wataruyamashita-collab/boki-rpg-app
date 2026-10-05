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
const acceptedS5C=require('./fixtures/story-work-case-s5c-accepted.json');

const journalIds=['J039','J040'];
const correctionIds=Array.from({length:13},(_,index)=>`E${String(index+1).padStart(3,'0')}`);
const s5d1Ids=[...journalIds,...correctionIds].sort();
const allExpected=[...Object.keys(acceptedS5C),...s5d1Ids].sort();

assert(authority,'S5D1 WorkCaseNarratives authority must be exported');
assert(Object.isFrozen(authority),'S5D1 WorkCaseNarratives authority must remain immutable');
assert.strictEqual(Object.keys(acceptedS5C).length,65,'S5C accepted snapshot must remain exactly 65 entries');
assert.strictEqual(journalIds.length,2,'S5D1 journal population must remain 2');
assert.strictEqual(correctionIds.length,13,'S5D1 correction population must remain 13');
assert.strictEqual(s5d1Ids.length,15,'S5D1 locked population must remain 15');
assert.strictEqual(allExpected.length,80,'S5D1 total authority must be exactly 80 entries');

assert.deepStrictEqual(
  Object.keys(authority).sort(),
  allExpected,
  'S5D1 must extend WorkCaseNarratives from exactly 65 accepted S5A/S5B/S5C entries to exactly 80 entries'
);

const anchorRefs=new Set(anchors.map(scene=>scene.referenceQuestionId));
for(const id of ['J038','T022','E014']){
  assert(anchorRefs.has(id),`${id}: S5D1 must recognize the Chapter 8 Anchor reference`);
  assert(!s5d1Ids.includes(id),`${id}: S5D1 must exclude the Chapter 8 Anchor reference`);
}

const story=Object.values(questions).filter(question=>
  question.learningRole!=='review'&&!examIds.has(question.id)
);
assert.strictEqual(story.length,166,'S5D1 must preserve the accepted Story population');
assert.strictEqual(anchors.length,36,'S5D1 must preserve the accepted 36 AnchorScenes');

for(const [id,before] of Object.entries(acceptedS5C)){
  assert.strictEqual(
    authority[id]?.before,
    before,
    `${id}: S5D1 must preserve accepted S5A/S5B/S5C Before text byte-for-byte`
  );
}

const beforeTexts=[];
for(const id of s5d1Ids){
  const question=questions[id];
  const entry=authority[id];

  assert(question,`${id}: S5D1 target question must exist`);
  assert(!anchorRefs.has(id),`${id}: S5D1 must never overwrite an Anchor reference question`);
  assert(question.learningRole!=='review',`${id}: S5D1 target must remain outside Review`);
  assert(!examIds.has(id),`${id}: S5D1 target must remain outside Exam`);
  assert(entry,`${id}: S5D1 authored Before entry must exist`);

  assert.deepStrictEqual(
    Object.keys(entry),
    ['before'],
    `${id}: S5D1 authority must stay Before-only and must not extend non-anchor After/Hook behavior`
  );

  const before=String(entry.before||'').trim();
  assert(before.length>0,`${id}: authored Before must be non-empty`);
  assert(before.length<=120,`${id}: authored Before must stay within the 120-character mobile reading bound`);
  assert(!/[0-9０-９]/u.test(before),`${id}: authored Before must not reveal numeric answer values`);
  assert(!/[円￥¥]/u.test(before),`${id}: authored Before must not reveal answer amounts`);
  assert(!/借方|貸方/u.test(before),`${id}: authored Before must not coach journal direction`);
  assert(/(?:あなた|自分で)/u.test(before),`${id}: authored Before must keep the reader in the protagonist viewpoint`);
  assert(/(?:確認|確かめ|照合|比べ|見極め|追う|整理|突き合わせ)/u.test(before),`${id}: authored Before must contain an explicit reader action`);

  const answer=question.answer||{};
  const answerAccounts=[
    ...(answer.debit||[]).map(line=>line&&line.account),
    ...(answer.credit||[]).map(line=>line&&line.account),
    ...Object.entries(answer.cells||{})
      .filter(([key])=>/Account$/u.test(key))
      .map(([,value])=>value)
  ].filter(Boolean);
  for(const account of new Set(answerAccounts)){
    assert(
      !before.includes(account),
      `${id}: authored Before must not leak correct account name "${account}"`
    );
  }

  assert(
    String(question.story||'').startsWith(before),
    `${id}: runtime Story must use the authored S5D1 Before context`
  );
  assert(
    String(question.story||'').includes('〔調査 '),
    `${id}: runtime Story must preserve Story progress context`
  );

  beforeTexts.push(before);
}

assert.strictEqual(
  new Set(beforeTexts).size,
  s5d1Ids.length,
  'S5D1 must not replace generic repetition with duplicated authored Before text'
);

const evidenceGrounding={
  J039:/(?:支払記録|記帳額|帳簿金額|差額)/u,
  J040:/(?:発送|受領|未記帳|納品)/u,
  E001:/(?:広告|掲載|領収)/u,
  E002:/(?:振込|支払|銀行)/u,
  E003:/(?:事務用品|領収)/u,
  E004:/(?:前月|回収|入金)/u,
  E005:/(?:複合機|長期使用|納品)/u,
  E006:/(?:銀行|振込|支払)/u,
  E007:/(?:掛け|販売|納品)/u,
  E008:/(?:利息|入金|通知)/u,
  E009:/(?:領収書|帳簿金額|支払記録)/u,
  E010:/(?:元本返済|銀行記録|返済記録)/u,
  E011:/(?:火災保険|支払通知)/u,
  E012:/(?:商品引渡前|内金|得意先)/u,
  E013:/(?:商品受領前|内金|発注先)/u
};
for(const [id,pattern] of Object.entries(evidenceGrounding)){
  assert(pattern.test(authority[id].before),`${id}: authored Before must be grounded in the case-specific question/material evidence`);
}

console.log('ISSUE179_S5D1_WORK_CASE_NARRATIVE_PASS');
