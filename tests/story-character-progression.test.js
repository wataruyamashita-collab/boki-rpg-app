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
const story=Object.values(questions).filter(question=>
  question.learningRole!=='review'&&!examIds.has(question.id)
);
const nonStory=Object.values(questions).filter(question=>
  question.learningRole==='review'||examIds.has(question.id)
);

const expectedStageByChapter={
  1:'Teacher',2:'Teacher',3:'Teacher',
  4:'Questioner',5:'Questioner',6:'Questioner',
  7:'Reviewer',8:'Reviewer',9:'Reviewer',
  10:'Supporter',11:'Supporter',
  12:'Silent witness'
};

assert.strictEqual(story.length,166,'S4 must preserve the accepted Story population');

for(const question of story){
  assert.strictEqual(
    question.mizunoRelationshipStage,
    expectedStageByChapter[question.chapter],
    `${question.id}: Story relationship stage must follow the locked chapter ladder`
  );
}

for(const question of nonStory){
  assert.strictEqual(
    Object.hasOwn(question,'mizunoRelationshipStage'),
    false,
    `${question.id}: Review/Exam must stay outside Story character-progression metadata`
  );
}

const storyByChapter=chapter=>story.filter(question=>question.chapter===chapter);
const dialogues=chapter=>storyByChapter(chapter).map(question=>String(question.npcDialogue||'')).filter(Boolean);

for(const chapter of [1,2,3]){
  const text=dialogues(chapter).join(' ');
  assert(text.includes('水野先輩'),'Teacher chapters must visibly retain Mizuno guidance');
  assert(/証憑|根拠|整理|確認/u.test(text),'Teacher chapters should give concrete evidence-reading guidance');
}

for(const chapter of [4,5,6]){
  const text=dialogues(chapter).join(' ');
  assert(text.includes('水野先輩'),'Questioner chapters must retain Mizuno as a questioning presence');
  assert(/[？?]/u.test(text),'Questioner chapters must lead with questions rather than answer-like instruction');
  assert(!/結論より先に、証憑が示す事実を読んで/u.test(text),'Questioner chapters must not fall back to the early Teacher line');
}

for(const chapter of [7,8,9]){
  const text=dialogues(chapter).join(' ');
  assert(/レビュー|確認する側|任せ/u.test(text),'Reviewer chapters must put the learner in the lead and Mizuno in review');
  assert(!/結論より先に、証憑が示す事実を読んで/u.test(text),'Reviewer chapters must not use early tutorial guidance');
}

for(const chapter of [10,11]){
  const text=dialogues(chapter).join(' ');
  assert(/補足|先に説明|君の説明/u.test(text),'Supporter chapters must put explanation ownership on the protagonist');
  assert(!/結論より先に、証憑が示す事実を読んで/u.test(text),'Supporter chapters must not use early tutorial guidance');
}

for(const question of storyByChapter(12)){
  assert.strictEqual(
    String(question.npcDialogue||''),
    '',
    `${question.id}: Chapter 12 Silent witness must not inject generic Mizuno guidance`
  );
}

console.log('ISSUE179_S4_CHARACTER_PROGRESSION_PASS');
