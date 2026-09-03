'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { loadQuestions } = require('../scripts/audit-matrix');

const FIFO_IDS = ['L004', 'L009', 'L014', 'L019', 'L024', 'L029'];
const FIXED_ASSET_IDS = ['L005', 'L010', 'L015', 'L020', 'L025', 'L030'];
const RAW_KEY = /(?:^|[^A-Za-z])(?:item|recorded|evidence|transaction|account|debit|credit|balance|tbDebit|tbCredit|before)\d*(?=[^A-Za-z]|$)/u;

function independentAudit(questions) {
  const failures = [];
  const fail = (id, rule) => failures.push({ id, rule });
  for (const id of FIFO_IDS) {
    const text = String(questions[id]?.explanation || '');
    if (!/先入先出法/u.test(text) || /移動平均法/u.test(text) || !/(古い|先に入庫).*(払出|払い出)/su.test(text)) fail(id, 'FIFO_METHOD');
  }
  const l040 = questions.L040;
  for (const key of ['depreciationA', 'depreciationB']) if (l040?.table?.inputMetadata?.[key]?.semanticType !== 'amount') fail('L040', `SEMANTIC_${key}`);
  if (!/60,000円/u.test(l040.explanation) || !/45,000円/u.test(l040.explanation) || /(?:60,000|45,000)か月/u.test(l040.explanation)) fail('L040', 'RENDERED_UNIT');
  for (const question of Object.values(questions)) if (RAW_KEY.test(String(question.explanation || ''))) fail(question.id, 'RAW_INTERNAL_KEY');
  if (/(?:113|401|521|101)円/u.test(questions.L041.explanation)) fail('L041', 'FOLIO_YEN');
  for (const id of FIXED_ASSET_IDS) if (!/取得原価.*(?:－|から).*期首減価償却累計額.*(?:－|差し引).*当期減価償却費.*(?:＝|求め).*期末帳簿価額/su.test(questions[id].explanation)) fail(id, 'FIXED_ASSET_PATH');
  return { ok: failures.length === 0, failures };
}

const questions = loadQuestions();
assert.deepStrictEqual(independentAudit(questions).failures, [], 'independent content oracle must pass');

const viewSource = fs.readFileSync('js/view.js', 'utf8');
const sandbox = { window: {}, globalThis: {} }; vm.createContext(sandbox); vm.runInContext(viewSource, sandbox);
const fakeDocument = { createElement: () => ({ className:'', textContent:'', append(){} }) };
const view = new sandbox.window.AppView(fakeDocument);
assert.notStrictEqual(view.accountLabel('現金過不足').textContent, '資産');
assert.strictEqual(view.accountType('現金過不足'), 'temporary');
assert.strictEqual(view.accountType('損益'), 'closing');

const mutatedFifo = structuredClone(questions); mutatedFifo.L004.explanation += '\n移動平均法で計算します。';
assert(independentAudit(mutatedFifo).failures.some(x => x.id === 'L004' && x.rule === 'FIFO_METHOD'), 'FIFO mutation must be killed');
const mutatedSemantic = structuredClone(questions); mutatedSemantic.L040.table.inputMetadata.depreciationA.semanticType = 'months';
assert(independentAudit(mutatedSemantic).failures.some(x => x.rule === 'SEMANTIC_depreciationA'), 'semantic mutation must be killed');
for (const raw of ['item', 'tbDebit300', 'recorded']) {
  const clone = structuredClone(questions); clone.C001.explanation += ` ${raw}`;
  assert(independentAudit(clone).failures.some(x => x.id === 'C001' && x.rule === 'RAW_INTERNAL_KEY'), `${raw} mutation must be killed`);
}
console.log('independent quality gate tests: ok');

module.exports = { independentAudit, RAW_KEY };
