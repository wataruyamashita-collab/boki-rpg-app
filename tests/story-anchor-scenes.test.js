'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('data/questions.js','utf8');
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'data/questions.js'});

const scenes=sandbox.window.AnchorScenes;
const questions=sandbox.window.QuestionData;
const examIds=new Set(sandbox.window.ExamPoolDefinition||[]);

assert(Array.isArray(scenes),'S2 AnchorScenes authority must be exported');
assert.strictEqual(scenes.length,36,'S2 requires exactly 36 Anchor Scenes');
assert.strictEqual(new Set(scenes.map(scene=>scene.sceneId)).size,36,'Anchor Scene IDs must be unique');

const storyIds=new Set(
  Object.values(questions)
    .filter(question=>question.learningRole!=='review'&&!examIds.has(question.id))
    .map(question=>question.id)
);

const expectedStages={
  1:'Teacher',2:'Teacher',3:'Teacher',
  4:'Questioner',5:'Questioner',6:'Questioner',
  7:'Reviewer',8:'Reviewer',9:'Reviewer',
  10:'Supporter',11:'Supporter',
  12:'Silent witness'
};
const required=['sceneId','chapter','beat','mode','referenceQuestionId','trigger','place','stakeholder','before','after','hook','dialogue','protagonistResponsibility','mizunoRelationshipStage','learningObjective','spoilerGuard'];

for(let chapter=1;chapter<=12;chapter+=1){
  const chapterScenes=scenes.filter(scene=>scene.chapter===chapter);
  assert.strictEqual(chapterScenes.length,3,`Chapter ${chapter} must have exactly 3 anchors`);
  assert.deepStrictEqual(
    Array.from(chapterScenes,scene=>scene.beat).sort(),
    ['BOSS','OPEN','REVERSAL'],
    `Chapter ${chapter} must contain OPEN / REVERSAL / BOSS`
  );

  const expectedIds=['OPEN','REVERSAL','BOSS'].map(beat=>`CH${String(chapter).padStart(2,'0')}-${beat}`);
  assert.deepStrictEqual(
    Array.from(chapterScenes,scene=>scene.sceneId).sort(),
    expectedIds.sort(),
    `Chapter ${chapter} scene IDs must follow the locked authority`
  );

  for(const scene of chapterScenes){
    for(const field of required) assert(scene[field]!==undefined&&scene[field]!==null&&scene[field]!=='',`${scene.sceneId}: missing ${field}`);
    assert.strictEqual(scene.mode,'story',`${scene.sceneId}: Anchor Scenes are Story-only authority`);
    assert.strictEqual(scene.mizunoRelationshipStage,expectedStages[chapter],`${scene.sceneId}: Mizuno stage mismatch`);
    assert.strictEqual(scene.spoilerGuard,'no-answer-before-action',`${scene.sceneId}: spoiler guard must stay explicit`);
    assert(scene.before.length<=120,`${scene.sceneId}: Before exceeds mobile reading contract`);
    assert(scene.after.length<=100,`${scene.sceneId}: After exceeds mobile reading contract`);
    assert(scene.hook.length<=100,`${scene.sceneId}: Hook exceeds mobile reading contract`);
    assert(scene.dialogue.length<=80,`${scene.sceneId}: dialogue exceeds mobile reading contract`);

    const reference=questions[scene.referenceQuestionId];
    assert(reference,`${scene.sceneId}: reference question does not exist`);
    assert.strictEqual(reference.chapter,chapter,`${scene.sceneId}: reference must stay in the same semantic chapter`);
    assert(storyIds.has(scene.referenceQuestionId),`${scene.sceneId}: reference must stay in Story and outside Exam/Review`);

    if(scene.beat==='OPEN'){
      assert.deepStrictEqual(JSON.parse(JSON.stringify(scene.trigger)),{type:'chapterStart'},`${scene.sceneId}: OPEN trigger`);
    }else{
      assert.strictEqual(scene.trigger.type,'afterQuestion',`${scene.sceneId}: non-OPEN trigger must follow a Story question`);
      assert.strictEqual(scene.trigger.questionId,scene.referenceQuestionId,`${scene.sceneId}: trigger/reference mismatch`);
      assert(storyIds.has(scene.trigger.questionId),`${scene.sceneId}: trigger question must stay in Story`);
      assert.strictEqual(questions[scene.trigger.questionId].chapter,chapter,`${scene.sceneId}: trigger must stay in semantic chapter`);
    }

    const answer=reference.answer||{};
    const accounts=[
      ...(answer.debit||[]).map(row=>row.account),
      ...(answer.credit||[]).map(row=>row.account)
    ].filter(Boolean);
    for(const account of accounts){
      assert(!scene.before.includes(account),`${scene.sceneId}: Before leaks answer account ${account}`);
    }

    const amounts=[
      ...(answer.debit||[]).map(row=>row.amount),
      ...(answer.credit||[]).map(row=>row.amount),
      ...Object.values(answer.cells||{})
    ].filter(value=>typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)>=100);
    for(const amount of new Set(amounts)){
      const raw=String(Math.abs(amount));
      const comma=Math.abs(amount).toLocaleString('en-US');
      assert(!scene.before.includes(raw)&&!scene.before.includes(comma),`${scene.sceneId}: Before leaks answer amount ${amount}`);
    }
  }

  const storySequence=Object.values(questions).filter(question=>question.chapter===chapter&&storyIds.has(question.id));
  const open=chapterScenes.find(scene=>scene.beat==='OPEN');
  const boss=chapterScenes.find(scene=>scene.beat==='BOSS');
  assert.strictEqual(open.referenceQuestionId,storySequence[0].id,`Chapter ${chapter}: OPEN reference must be first Story question`);
  assert.strictEqual(boss.referenceQuestionId,storySequence.at(-1).id,`Chapter ${chapter}: BOSS reference must be final Story question`);
}

assert(
  scenes.filter(scene=>scene.referenceQuestionId==='J049').length>=2,
  'Chapter 11 proves Scene identity is independent from globally unique question references'
);
const finale=scenes.find(scene=>scene.sceneId==='CH12-BOSS');
assert.strictEqual(finale.epilogue,true,'Chapter 12 BOSS must carry the unique epilogue marker');
assert(/新人|最初の一枚/u.test(finale.hook),'Chapter 12 epilogue must pay off the Chapter 1 framing');

assert.strictEqual(
  Object.values(questions).some(question=>Object.hasOwn(question,'anchorScene')||Object.hasOwn(question,'anchorScenes')),
  false,
  'S2 authority must not mutate QuestionData; UI integration belongs to S3'
);

console.log('ISSUE179_ANCHOR_SCENE_AUTHORITY_PASS',scenes.length);
