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
const acceptedS5A=require('./fixtures/story-work-case-s5a-accepted.json');

const s5bIds=[
  'J018','J019','J117','J118','J119',
  'J022','J023','J024','J025','J026','J121','J122','J123','J124','J125','J126',
  'J029','J031'
].sort();
const allExpected=[...Object.keys(acceptedS5A),...s5bIds].sort();

assert(authority,'S5B WorkCaseNarratives authority must be exported');
assert(Object.isFrozen(authority),'S5B WorkCaseNarratives authority must remain immutable');
assert.strictEqual(s5bIds.length,18,'S5B locked population must remain 18');
assert.deepStrictEqual(
  Object.keys(authority).sort(),
  allExpected,
  'S5B must extend WorkCaseNarratives to exactly 41 accepted S5A + S5B entries'
);

const anchorRefs=new Set(anchors.map(scene=>scene.referenceQuestionId));
const story=Object.values(questions).filter(question=>
  question.learningRole!=='review'&&!examIds.has(question.id)
);
assert.strictEqual(story.length,166,'S5B must preserve the accepted Story population');
assert.strictEqual(anchors.length,36,'S5B must preserve the accepted 36 AnchorScenes');

for(const [id,before] of Object.entries(acceptedS5A)){
  assert.strictEqual(
    authority[id]?.before,
    before,
    `${id}: S5B must preserve accepted S5A Before text byte-for-byte`
  );
}

const beforeTexts=[];
for(const id of s5bIds){
  const question=questions[id];
  const entry=authority[id];

  assert(question, `${id}: S5B target question must exist`);
  assert(!anchorRefs.has(id), `${id}: S5B must never overwrite an Anchor reference question`);
  assert(question.learningRole!=='review', `${id}: S5B target must remain outside Review`);
  assert(!examIds.has(id), `${id}: S5B target must remain outside Exam`);

  assert.deepStrictEqual(
    Object.keys(entry),
    ['before'],
    `${id}: S5B authority must stay Before-only and must not extend non-anchor After/Hook behavior`
  );

  const before=String(entry.before||'').trim();
  assert(before.length>0, `${id}: authored Before must be non-empty`);
  assert(before.length<=120, `${id}: authored Before must stay within the 120-character mobile reading bound`);
  assert(!/[0-9０-９]/u.test(before), `${id}: authored Before must not reveal numeric answer values`);
  assert(!/[円￥¥]/u.test(before), `${id}: authored Before must not reveal answer amounts`);
  assert(!/借方|貸方/u.test(before), `${id}: authored Before must not coach journal direction`);
  assert(/(?:あなた|自分で)/u.test(before), `${id}: authored Before must keep the reader in the protagonist viewpoint`);
  assert(/(?:確認|確かめ|分け|決め|整理|追う|見極め)/u.test(before), `${id}: authored Before must contain an explicit reader action`);

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
    `${id}: runtime Story must use the authored S5B Before context`
  );
  assert(
    String(question.story||'').includes('〔調査 '),
    `${id}: runtime Story must preserve Story progress context`
  );

  beforeTexts.push(before);
}

assert.strictEqual(
  new Set(beforeTexts).size,
  s5bIds.length,
  'S5B must not replace generic repetition with duplicated authored Before text'
);

console.log('ISSUE179_S5B_WORK_CASE_NARRATIVE_PASS');
