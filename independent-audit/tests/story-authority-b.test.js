'use strict';
const assert=require('assert');
const core=require('../../scripts/qa/audit-core');

const production=core.loadProduction();
const Controller=production.Controller.prototype;
const fake={questions:production.questions,ids:Object.keys(production.questions),examCandidateIds:Controller.examCandidateIds,learningIds:Controller.learningIds};
const storyIds=Controller.storyIds.call(fake);
const examIds=Controller.examCandidateIds.call(fake);
const chapter=12;
const eligible=storyIds.filter(id=>production.questions[id].chapter===chapter);
const examOnly=['C006','C007','C008','C009','C010'];

assert.deepStrictEqual(eligible,['F004','F005','F006','F007','C004','C005']);
assert(examOnly.every(id=>examIds.includes(id)),'C006-C010 must remain in the Exam pool');
assert(examOnly.every(id=>!storyIds.includes(id)),'C006-C010 must remain absent from Story');
assert.strictEqual(storyIds.filter(id=>examIds.includes(id)).length,0,'Story and Exam membership must be disjoint');
eligible.forEach((id,index)=>assert.match(production.questions[id].story,new RegExp(`〔調査 ${index+1}/${eligible.length}〕$`)));

const result=core.audit(production);
assert.strictEqual(result.story.expectedDisplayedCount,eligible.length);
assert.strictEqual(result.story.reachableCount,eligible.length);
assert.strictEqual(result.story.prematureTermination,0);
assert.strictEqual(result.story.unexpectedLoop,0);
assert.deepStrictEqual(result.story.unreachable,[]);
assert(!result.findings.some(finding=>finding.gate==='GATE-10'));

console.log('Story Authority B regression: PASS');
