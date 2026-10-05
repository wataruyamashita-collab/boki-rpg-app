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

assert(authority,'S5A WorkCaseNarratives authority must be exported');
assert(Object.isFrozen(authority),'S5A WorkCaseNarratives authority must be immutable');

const expectedIds=[
  'J002','J101','J102',
  'J005','J006','J007','J008','J104','J105','J106','J107','J108',
  'J011','J012','J013','J014','J015','J110','J111','J112','J113','J114','J115'
].sort();

assert.deepStrictEqual(
  Object.keys(authority).sort(),
  expectedIds,
  'S5A authority must target exactly the 23 locked Chapters 1-3 non-anchor Story cases'
);

const anchorRefs=new Set(anchors.map(scene=>scene.referenceQuestionId));
const story=Object.values(questions).filter(question=>
  question.learningRole!=='review'&&!examIds.has(question.id)
);

assert.strictEqual(story.length,166,'S5A must preserve the accepted Story population');
assert.strictEqual(anchors.length,36,'S5A must preserve the accepted 36 AnchorScenes');

const beforeTexts=[];
for(const id of expectedIds){
  const question=questions[id];
  const entry=authority[id];

  assert(question, `${id}: target question must exist`);
  assert(!anchorRefs.has(id), `${id}: S5A must never overwrite an Anchor reference question`);
  assert(question.learningRole!=='review', `${id}: S5A target must remain outside Review`);
  assert(!examIds.has(id), `${id}: S5A target must remain outside Exam`);

  assert.deepStrictEqual(
    Object.keys(entry),
    ['before'],
    `${id}: S5A authority must stay Before-only and must not extend non-anchor After/Hook behavior`
  );

  const before=String(entry.before||'').trim();
  assert(before.length>0, `${id}: authored Before must be non-empty`);
  assert(before.length<=120, `${id}: authored Before must stay within the 120-character mobile reading bound`);
  assert(!/[0-9０-９]/u.test(before), `${id}: authored Before must not reveal numeric answer values`);
  assert(!/[円￥¥]/u.test(before), `${id}: authored Before must not reveal answer amounts`);
  assert(!/借方|貸方/u.test(before), `${id}: authored Before must not coach the journal direction`);

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
    `${id}: runtime Story must use the authored S5A Before context`
  );
  assert(
    String(question.story||'').includes('〔調査 '),
    `${id}: runtime Story must preserve Story progress context`
  );

  beforeTexts.push(before);
}

assert.strictEqual(
  new Set(beforeTexts).size,
  expectedIds.length,
  'S5A must not replace the old five-beat repetition with duplicated authored Before text'
);

console.log('ISSUE179_S5A_WORK_CASE_NARRATIVE_PASS');
