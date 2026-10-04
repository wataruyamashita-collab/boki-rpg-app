'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('data/questions.js','utf8');
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'data/questions.js'});

const questions=sandbox.window.QuestionData;
assert(questions,'QuestionData must be exposed for narrative regression');

const expected=[
  {chapter:1,id:'J001',theme:'消えた創業伝票'},
  {chapter:2,id:'J004',theme:'営業部の未精算'},
  {chapter:3,id:'J010',theme:'回収予定表の空白',storyNeedle:'入金・支払予定'},
  {chapter:4,id:'J017',theme:'現金の違和感',storyNeedle:'現金実査額と帳簿'},
  {chapter:5,id:'J021',theme:'業務拡大',storyNeedle:'設備購入・出張精算・借入'},
  {chapter:6,id:'J028',theme:'給与日の混乱',storyNeedle:'給与、控除、会社負担'},
  {chapter:7,id:'J033',theme:'月次締めの壁'},
  {chapter:8,id:'J038',theme:'試算表のずれ',storyNeedle:'試算表と証憑'},
  {chapter:9,id:'J041',theme:'決算前夜'},
  {chapter:10,id:'J045',theme:'年度決算'},
  {chapter:11,id:'J049',theme:'取締役会前の最終照合',storyNeedle:'税区分の集計'},
  {chapter:12,id:'J050',theme:'最後の決算'}
];

for(const item of expected){
  const question=questions[item.id];
  assert(question, `representative question must exist: ${item.id}`);
  assert.strictEqual(question.chapter,item.chapter,`${item.id}: semantic chapter`);
  assert.strictEqual(
    question.chapterArc?.theme,
    item.theme,
    `Chapter ${item.chapter}: Narrative Bible theme must match semantic chapter`
  );
  assert.strictEqual(
    question.scene,
    `${['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'][item.chapter-1]}・${item.theme}`,
    `Chapter ${item.chapter}: runtime scene must use Narrative Bible theme`
  );
  if(item.storyNeedle){
    assert(
      String(question.story).includes(item.storyNeedle),
      `${item.id}: runtime Story copy must reflect the semantic chapter incident`
    );
  }
}

for(let chapter=1;chapter<=12;chapter++){
  const chapterQuestions=Object.values(questions).filter(q=>q.chapter===chapter);
  const expectedTheme=expected.find(item=>item.chapter===chapter).theme;
  assert(chapterQuestions.length>0,`Chapter ${chapter}: authored questions must exist`);
  assert(
    chapterQuestions.every(q=>q.chapterArc?.theme===expectedTheme),
    `Chapter ${chapter}: every runtime question must share the chapter's Narrative Bible theme`
  );
}

console.log('STORY_NARRATIVE_BIBLE_ALIGNMENT_PASS');
