'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const core=require('../scripts/qa/audit-core');

const source=fs.readFileSync('data/questions.js','utf8');
const marker='const ExamPoolIds = new Set(ExamPoolDefinition);';
assert(source.includes(marker),'Issue #180 probe marker must remain available');

const instrumented=source.replace(
  marker,
  `if (typeof window !== 'undefined') {
  window.__AuthoredChapterSnapshot = Object.fromEntries(
    Object.values(QuestionData).map(item => [item.id, item.chapter])
  );
}
${marker}`
);

const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(instrumented,sandbox,{filename:'data/questions.js'});
const runtimeQuestions=sandbox.window.QuestionData;
const authoredChapters=sandbox.window.__AuthoredChapterSnapshot;
const runtimeIds=Object.keys(runtimeQuestions);

assert.strictEqual(runtimeIds.length,300,'canonical question corpus remains 300');
assert.strictEqual(Object.keys(authoredChapters||{}).length,300,'authored chapter snapshot covers all 300 questions');

const chapterMismatches=runtimeIds.filter(id=>runtimeQuestions[id].chapter!==authoredChapters[id]);
assert.deepStrictEqual(
  chapterMismatches,
  [],
  `runtime must preserve authored semantic chapter; mismatched IDs: ${chapterMismatches.slice(0,20).join(',')}`
);

assert(
  !/item\.chapter\s*=\s*Math\.floor\(index\s*\/\s*25\)\s*\+\s*1/u.test(source),
  'semantic chapter must not be overwritten from raw object insertion index'
);
assert(
  !/const chapter\s*=\s*Math\.floor\(index\s*\/\s*25\)\s*\+\s*1/u.test(source),
  'Story chapter grouping must not be derived from raw 25-item insertion buckets'
);

const explanationFormulaSource=fs.readFileSync('js/explanation-formulas.js','utf8');
const explanationModelSource=fs.readFileSync('js/explanation-model.js','utf8');
assert(
  !/type===['"]ledger['"][^\n;]{0,120}chapter\s*===\s*8/u.test(explanationFormulaSource),
  'ledger formula routing must not depend on semantic Chapter 8'
);
assert(
  !/type===['"]ledger['"][^\n;]{0,120}chapter\s*===\s*8/u.test(explanationModelSource),
  'ledger explanation routing must not depend on semantic Chapter 8'
);

const production=core.loadProduction();
const Controller=production.Controller.prototype;
const fake={
  questions:production.questions,
  ids:Object.keys(production.questions),
  examCandidateIds:Controller.examCandidateIds,
  learningIds:Controller.learningIds
};
const storyIds=Controller.storyIds.call(fake);
const examIds=new Set(Controller.examCandidateIds.call(fake));
const counts=Array.from({length:12},(_,index)=>{
  const chapter=index+1;
  return storyIds.filter(id=>production.questions[id].chapter===chapter).length;
});

assert.strictEqual(storyIds.some(id=>production.questions[id].learningRole==='review'),false,'review-only questions stay out of Story');
assert.strictEqual(storyIds.some(id=>examIds.has(id)),false,'Story and Exam remain disjoint');
assert(counts.every(count=>count>0),`Story must keep all 12 chapters reachable; counts=${counts.join(',')}`);
assert(counts[2]>0 && counts[3]>0,`Chapter 3 and 4 must not be empty; counts=${counts.join(',')}`);

console.log('ISSUE180_STORY_CHAPTER_AUTHORITY_PASS',counts.join(','));
