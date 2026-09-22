'use strict';
const assert = require('assert'); const fs = require('fs'); const vm = require('vm');
const sandbox = { window:{}, console }; vm.createContext(sandbox);
for (const file of ['data/questions.js','data/accounting-oracle.js','js/engine.js']) vm.runInContext(fs.readFileSync(file,'utf8'), sandbox, {filename:file});
const root = sandbox.window;
const expectedFormats = {
  L034:'bookkeeping-journal-book', L035:'bookkeeping-notes-receivable', L036:'bookkeeping-notes-payable',
  L037:'bookkeeping-general-ledger', L038:'bookkeeping-general-ledger', L039:'bookkeeping-account-ledger',
  L041:'journal-book', L042:'bookkeeping-notes-receivable', L043:'bookkeeping-notes-payable',
  L044:'bookkeeping-cash-book', L045:'bookkeeping-checking-book', L046:'bookkeeping-petty-cash-book',
  L047:'bookkeeping-purchase-book', L048:'bookkeeping-sales-book', L049:'bookkeeping-inventory-ledger', L050:'bookkeeping-voucher-entry'
};
const expectedAnswers = {
  L034:{date1:'8/2',summary1:'掛売上',folio1:'113・401',debitTotal:102000,creditTotal:102000},
  L035:{received:'6/2',due:'10/31',drawer:'青空商店・森物産・星商会',total:200000},
  L036:{issued:'7/3',due:'11/30',payee:'若葉物産・山川商事',total:200000},
  L037:{date:'4/20',counterpart:'現金',side:'貸方',balance:70000},
  L038:{date:'5/27',counterpart:'仕入',balanceSide:'貸方',balance:120000},
  L039:{priorAccrual:9000,reversal:9000,annualPayment:18000,currentAccrual:9000,profitTransfer:18000,nextBalance:0},
  L041:{d1Account:'売掛金',d1Ref:113,d1Amount:90000,c1Account:'売上',c1Ref:401,c1Amount:90000,d2Account:'通信費',d2Ref:521,d2Amount:12000,c2Account:'現金',c2Ref:101,c2Amount:12000},
  L042:{received1:'6/5',drawer1:'青空商店',drawn1:'6/4',due1:'8/31',bank1:'東都銀行',description1:'売掛金回収',amount1:180000,received2:'6/20',drawer2:'港屋',drawn2:'6/20',due2:'9/30',bank2:'中央銀行',description2:'商品売上',amount2:120000,total:300000},
  L043:{drawn1:'7/10',payee1:'若葉物産',due1:'10/31',bank1:'東都銀行',description1:'買掛金支払',amount1:150000,drawn2:'7/25',payee2:'北星商事',due2:'11/30',bank2:'東都銀行',description2:'商品仕入',amount2:90000,total:240000},
  L044:{value1:50000,value2:18000,value3:32000}, L045:{value1:300000,value2:85000,value3:215000},
  L046:{value1:4800,value2:7200,value3:12000}, L047:{value1:120000,value2:20000,value3:100000},
  L048:{value1:180000,value2:30000,value3:150000}, L049:{value1:1100,value2:13200,value3:8800},
  L050:{value1:50000,value2:20000,value3:30000}
};
for (const [id, format] of Object.entries(expectedFormats)) {
  const question = root.QuestionData[id]; assert.strictEqual(question.format, format, `${id}: explicit bookkeeping format`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(question.answer.cells)), expectedAnswers[id], `${id}: reviewed answer schema and values remain unchanged`);
  const derived = root.deriveAccountingExpected(id, null, question);
  assert.strictEqual(derived.sourceValid, true, `${id}: visible evidence remains independently derivable`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(derived.expected.cells)), expectedAnswers[id], `${id}: derivation still matches reviewed answer`);
}
for (const id of ['L034','L035','L036','L037','L038','L042','L043']) {
  const dateCells = Object.entries(root.QuestionData[id].table.inputMetadata).filter(([,meta]) => meta.semanticType === 'date');
  assert(dateCells.length > 0 && dateCells.every(([cell]) => root.QuestionData[id].table.inputTypes[cell] === 'text'), `${id}: dates retain text controls`);
}
for (const cell of ['d1Ref','c1Ref','d2Ref','c2Ref']) {
  assert.strictEqual(root.QuestionData.L041.table.inputMetadata[cell].semanticType, 'folio');
  assert.strictEqual(root.QuestionData.L041.table.controlTypes[cell], 'folio', `L041/${cell}: folio control is never currency semantics`);
}
const dateQuestion = root.QuestionData.L042; for (const value of ['6/5','06/05','6月5日']) assert(root.GradingEngine.grade(dateQuestion,{cells:{...dateQuestion.answer.cells,received1:value}}).correct, `${value}: normalized date accepted`);
assert(!root.GradingEngine.grade(dateQuestion,{cells:{...dateQuestion.answer.cells,received1:'6/6'}}).correct, 'wrong date rejected');
const view = fs.readFileSync('js/view.js','utf8'); const css = fs.readFileSync('css/style.css','utf8');
const journalStart = view.indexOf('    renderJournal(question');
const journal = view.slice(journalStart, view.indexOf('    renderCorrection(question', journalStart));
assert(journal.indexOf("container.append(instruction)") < journal.indexOf("grid.className = 'journal-grid-scroll'"), 'exam instruction precedes and remains outside journal grid scroller');
assert(journal.includes('grid.append(header)') && journal.includes('grid.append(row)') && journal.includes('container.append(grid)'), 'only journal header and rows enter the scroller');
const rendererStart = view.indexOf('    renderBookkeepingForm(question');
const renderer = view.slice(rendererStart, view.indexOf('    accountType(account)', rendererStart));
assert(renderer.includes('metadata.semanticType') && renderer.includes("input.placeholder = '例：6/5'") && renderer.includes("semanticType === 'folio'") && renderer.includes("semanticType === 'account'"), 'field-level semantics choose date, folio, and account affordances');
assert(!/semanticType === 'date'[^\n]*inputMode/.test(renderer), 'slash-form bookkeeping dates keep a text keyboard');
assert(!/semanticType === 'folio'[^\n]*inputMode/.test(renderer), 'compound and individual folios keep a separator-capable text keyboard');
assert(renderer.includes("record.className = 'bookkeeping-record'") && renderer.includes("fields.className = 'bookkeeping-record-fields'"), 'related fields are grouped into coherent bookkeeping records');
assert(renderer.includes("amount:'円', unitPrice:'円', months:'か月', years:'年'") && !renderer.includes('question.answer'), 'external units are semantic and renderer cannot leak answers');
assert(/@media \(max-width: 430px\)[\s\S]*bookkeeping-record-fields[^}]*repeat\(2, minmax\(0, 1fr\)\)/.test(css) && /bookkeeping-input[^}]*min-height:\s*44px/.test(css), '320/375/390/430 preserve coherent record cards and 44px controls');
console.log('bookkeeping form UX tests: ok');
