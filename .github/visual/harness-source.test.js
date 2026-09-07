'use strict';
const assert = require('assert');
const fs = require('fs');

const harness = fs.readFileSync('.github/visual/harness.html','utf8');
const order = ['data/accounting-domain.js','data/questions.js','js/view.js','js/controller.js'].map(source => harness.indexOf(`src="/${source}"`));
assert(order.every(position => position >= 0),'harness loads every required production dependency');
assert.deepStrictEqual(order,[...order].sort((left,right) => left-right),'production dependencies load in deterministic order');
for (const dependency of ['QuestionData','AccountingDomain','AppView','AppController','AppController.accountChoices']) assert(harness.includes(dependency),`${dependency} has an explicit dependency check`);
for (const representative of ['fixed-asset','inventory','ledger','journal','worksheet']) assert(harness.includes(representative),`${representative} has a canonical selector`);
assert(harness.includes('HARNESS_DEPENDENCY_MISSING:'),'missing dependencies fail with the stable diagnostic');
assert(harness.includes("question.answer?.cells?.[cellId]"), 'editable canonical answers participate in intrinsic width measurement');
console.log('visual harness source checks: dependencies, order, diagnostics, representatives: ok');
