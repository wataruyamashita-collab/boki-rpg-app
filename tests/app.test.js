const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const Calculator = require('../js/calculator');
const Engine = require('../js/engine');
const ProgressModel = require('../js/model');
const RPGModel = require('../js/rpg');

assert.strictEqual(Calculator.evaluate('1,200'.replace(',', '') + '＋300×2'), 1800);
assert.strictEqual(Calculator.evaluate('(10＋2)÷3'), 4);
assert.throws(() => Calculator.evaluate('globalThis.alert(1)'), /invalid/);
assert.throws(() => Calculator.evaluate('1÷0'), /invalid/);

const table = Engine.gradeTable({ cells: { cash: '1,000', sales: '500' } }, { cells: { cash: 1000, sales: 700 } });
assert.deepStrictEqual([table.correct, table.earned, table.possible, table.ratio], [false, 1, 2, 0.5]);
assert.strictEqual(Engine.gradeTable({ cells: { cash: '１,０００' } }, { cells: { cash: 1000 } }).correct, true, '表形式の全角数字を正しく採点する');
assert.strictEqual(Engine.gradeTable({ cells: { cash: '１，0００' } }, { cells: { cash: 1000 } }).correct, true, '全角・半角数字と全角カンマの混在を正規化する');
assert.strictEqual(Engine.gradeTable({ cells: { cash: '0' } }, { cells: { cash: 0 } }).correct, true, '明示的に入力した0は正答として扱う');
assert.strictEqual(Engine.gradeTable({ cells: { cash: '-1' } }, { cells: { cash: 0 } }).correct, false, '負数を0へ暗黙変換しない');
assert.strictEqual(Engine.gradeTable({ cells: { cash: '' } }, { cells: { cash: 0 } }).correct, false, '空欄を数値0の正答として扱わない');
assert.strictEqual(Engine.gradeJournalEntry({ debit: [{ account: '現金', amount: 100 }], credit: [{ account: '売上', amount: 100 }] }, { debit: [{ account: '現金', amount: 100 }], credit: [{ account: '売上', amount: 100 }] }), true);
assert.strictEqual(Engine.gradeJournalEntry({ debit: [{ account: '現金', amount: NaN }], credit: [{ account: '売上', amount: NaN }] }, { debit: [{ account: '現金', amount: NaN }], credit: [{ account: '売上', amount: NaN }] }), false, '非有限金額を仕訳として受理しない');
assert.strictEqual(Engine.gradeJournalEntry({}, { debit: [], credit: [] }), false, '壊れた回答データでも採点を例外終了しない');
assert.deepStrictEqual(Engine.grade(undefined, undefined), { correct: false, earned: 0, possible: 0, ratio: 0, details: [] }, '問題データが欠けても採点を例外終了しない');

const values = {};
const storage = { getItem(key) { return values[key] || null; }, setItem(key, value) { values[key] = value; } };
const progress = new ProgressModel({ J1: {} }, storage); progress.record('J1', false);
assert.deepStrictEqual(progress.state.incorrectIds, ['J1']);
assert.strictEqual(progress.state.mistakeCounts.J1, 1, '問題ごとの累積誤答回数を記録する');
progress.record('J1', false);
assert.strictEqual(progress.state.mistakeCounts.J1, 2, '同じ問題の再誤答も頻度へ加算する');
const masteryRpg = new RPGModel({ getItem() { return null; }, setItem() {} });
const masteryQuestion = { id: 'M1', difficulty: 1, category: '売掛金' };
masteryRpg.recordMastery(masteryQuestion, { earned: 0, possible: 1 });
masteryRpg.recordMastery(masteryQuestion, { earned: 1, possible: 1 });
assert.deepStrictEqual(masteryRpg.state.mastery['売掛金'], { earned: 1, possible: 2 }, '不正解後の正解を1/2としてmasteryへ記録する');
const rpg = new RPGModel(storage); const question = { id: 'J1', difficulty: 2, category: '現金' };
assert.strictEqual(rpg.reward(question, { ratio: 0.5, earned: 1, possible: 2 }), true);
assert.strictEqual(rpg.reward(question, { ratio: 1, earned: 2, possible: 2 }), false, '経験値は二重付与しない');
assert.strictEqual(rpg.state.xp, 20);
assert.strictEqual(rpg.state.companyHP, 100);
rpg.applyAnswer(false, 'bold');
assert.strictEqual(rpg.state.companyHP, 70, '勝負回答の誤答は経営HPを30減らす');
rpg.applyAnswer(true, 'careful');
assert.strictEqual(rpg.state.companyHP, 75, '正解は経営HPを5回復する');
const corruptValues = {
  'boki-rpg-progress-v2': JSON.stringify({ mode: 'invalid', answeredIds: 'J1', incorrectIds: ['unknown'], drafts: [], mistakeCounts: { J1: -2 }, completed: 'yes' }),
  'boki-rpg-character-v1': JSON.stringify({ xp: '999', rewardedIds: null, mastery: { 現金: { earned: 'bad', possible: 1 } }, companyHP: -80, totalTransactionAmount: -1 })
};
const corruptStorage = { getItem(key) { return corruptValues[key] || null; }, setItem() {} };
const recoveredProgress = new ProgressModel({ J1: {} }, corruptStorage);
assert.deepStrictEqual([recoveredProgress.state.mode, recoveredProgress.state.answeredIds.length, recoveredProgress.state.completed], ['story', 0, false], '破損した進捗の各フィールドを安全な初期値へ戻す');
const recoveredRpg = new RPGModel(corruptStorage);
assert.deepStrictEqual([recoveredRpg.state.xp, recoveredRpg.state.rewardedIds.length, recoveredRpg.state.companyHP, recoveredRpg.state.totalTransactionAmount], [0, 0, 0, 0], '破損したRPG状態を型検証し範囲内へ補正する');
const brokenJsonStorage = { getItem() { return '{broken'; }, setItem() { throw new Error('quota'); } };
const memoryProgress = new ProgressModel({ J1: {} }, brokenJsonStorage);
const memoryRpg = new RPGModel(brokenJsonStorage);
assert.doesNotThrow(() => { memoryProgress.record('J1', false); memoryRpg.applyAnswer(false); }, '壊れたJSONと書込不能なstorageでもメモリ上で動作を続ける');
assert.deepStrictEqual([memoryProgress.state.incorrectIds[0], memoryRpg.state.companyHP], ['J1', 90], 'storage障害時も現在セッションの状態を保持する');
assert.strictEqual(memoryProgress.record('unknown', false), false, '未定義の問題IDを進捗へ混入させない');

const html = fs.readFileSync('index.html', 'utf8');
assert(!/\sonclick=/.test(html), 'インラインイベントハンドラを置かない');
['story', 'training', 'review', 'exam'].forEach(mode => assert(html.includes(`view-${mode}`), `${mode}ビューが必要`));
assert(/<form id="question-form"[^>]*>[\s\S]*<button class="confirm-button" type="submit">回答を確定する<\/button>[\s\S]*<\/form>/.test(html), '回答欄はEnterキーで送信できるフォームにする');
const localAssets = [...html.matchAll(/(?:href|src)="((?:css|js|data)\/[^"?]+)([^"]*)"/g)];
assert(localAssets.length > 0 && localAssets.every(([, , query]) => query === '?v=20260824-8'), 'すべてのローカルCSS/JSに最新のキャッシュバスターを付ける');
const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
assert(controllerSource.includes("getElementById('question-form').addEventListener('submit'"), 'フォームのsubmitイベントを処理する');
assert(controllerSource.includes('event.preventDefault()'), 'フォーム送信時のページ遷移を防ぐ');
assert(controllerSource.includes('this.document.activeElement?.blur()'), '回答確定前にソフトウェアキーボードを閉じる');
assert(controllerSource.includes('if (this.submitting || !this.currentId') && controllerSource.includes('this.submitting = true'), '連続submitによるHP・進捗の二重更新を防ぐ');
assert(html.includes('data-action="calc-insert"'), '電卓の表示金額を入力するボタンを表示する');
assert(controllerSource.includes("'calc-insert': () => this.insertCalculatorResult(false)"), '電卓の入力ボタンを転記処理へ接続する');
assert(controllerSource.includes("else if (key === '＝') this.calculateEquals()"), 'イコールキーで計算結果を表示する');
assert(controllerSource.includes("addEventListener('focusin'"), '選択した金額欄を電卓の転記先にする');
const browserSandbox = { window: {} };
vm.runInNewContext(controllerSource, browserSandbox);
browserSandbox.window.SafeCalculator = Calculator;
browserSandbox.window.GradingEngine = { grade: () => ({ correct: false, earned: 0, possible: 1, ratio: 0 }) };
const submitAudit = {
  submitting: false, currentId: 'J1', questions: { J1: { id: 'J1' } },
  view: { readAnswer: () => ({}), updateRpg() {}, result() {}, show() {} },
  model: { state: { mode: 'story' }, record() { this.calls = (this.calls || 0) + 1; } },
  rpg: { state: { companyHP: 100 }, applyAnswer() { this.calls = (this.calls || 0) + 1; } },
  document: { querySelector: () => null }
};
browserSandbox.window.AppController.prototype.submit.call(submitAudit);
browserSandbox.window.AppController.prototype.submit.call(submitAudit);
assert.deepStrictEqual([submitAudit.model.calls, submitAudit.rpg.calls], [1, 1], '連続submitでも進捗とHPを一度だけ更新する');
const calculatorTarget = { value: '', getAttribute() { return '借方 1行目の金額'; }, setSelectionRange() {} };
const calculatorElements = { 'calculator-target': { textContent: '' }, 'calculator-display': { value: '' } };
const calculatorController = {
  calculatorTarget,
  expression: '1200＋300',
  document: { body: { contains: element => element === calculatorTarget }, getElementById: id => calculatorElements[id] },
  formatAmount: browserSandbox.window.AppController.prototype.formatAmount,
  formatCalculatorExpression: browserSandbox.window.AppController.prototype.formatCalculatorExpression,
  updateCalculatorDisplay: browserSandbox.window.AppController.prototype.updateCalculatorDisplay,
  saveDraft() { this.saved = true; }
};
browserSandbox.window.AppController.prototype.insertCalculatorResult.call(calculatorController, true);
assert.strictEqual(calculatorTarget.value, '1,500', '電卓の計算結果を選択中の仕訳金額欄へ転記する');
assert.strictEqual(calculatorElements['calculator-display'].value, '1,500', '電卓の計算結果にも3桁区切りのカンマを表示する');
assert.strictEqual(calculatorController.saved, true, '電卓から転記した金額を下書きへ保存する');
assert.strictEqual(browserSandbox.window.AppController.prototype.formatCalculatorExpression('1234567＋8900.5'), '1,234,567＋8,900.5', '計算途中の各数値にもカンマを表示する');
const deskCalculator = {
  expression: '0',
  calculator: { accumulator: null, operator: null, waitingForOperand: false, lastOperator: null, lastOperand: null },
  document: { getElementById: () => ({ value: '' }) }
};
['clearCalculator', 'inputCalculatorDigit', 'operate', 'setOperator', 'calculateEquals', 'updateCalculatorDisplay', 'formatCalculatorExpression', 'calcKey'].forEach(method => { deskCalculator[method] = browserSandbox.window.AppController.prototype[method]; });
['1', '2', '＋', '3', '×', '4', '＝'].forEach(key => deskCalculator.calcKey(key));
assert.strictEqual(deskCalculator.expression, '60', '演算子入力のたびに左から順に計算する卓上電卓方式にする');
deskCalculator.calcKey('＝');
assert.strictEqual(deskCalculator.expression, '240', 'イコールの連続入力で直前の演算を繰り返す');
deskCalculator.calcKey('C');
assert.strictEqual(deskCalculator.expression, '0', 'Cは表示値だけを0に戻す');
deskCalculator.calcKey('AC');
assert.deepStrictEqual([deskCalculator.expression, deskCalculator.calculator.accumulator, deskCalculator.calculator.operator], ['0', null, null], 'ACは計算状態をすべて消去する');
const questionDataSource = fs.readFileSync('data/questions.js', 'utf8');
vm.runInNewContext(`${questionDataSource}\nwindow.QuestionDataAudit = validateQuestionData();`, browserSandbox);
assert.strictEqual(browserSandbox.window.QuestionData.J001.id, 'J001', '問題データをブラウザーのwindowに公開する');
const eightColumn = browserSandbox.window.QuestionData.D001;
assert.strictEqual(eightColumn.format, 'eight-column-worksheet', 'WORKSHEET-01: D001を本物の8桁精算表として識別する');
assert.strictEqual(eightColumn.table.columns.length, 9, 'WORKSHEET-01: 科目列と8つの借貸列を持つ');
const perfectWorksheet = Engine.grade(eightColumn, eightColumn.answer);
assert.deepStrictEqual([perfectWorksheet.correct, perfectWorksheet.earned, perfectWorksheet.possible], [true, 18, 18], 'WORKSHEET-02: 元試算表とゼロ欄を固定し、意味のある18セルだけ採点する');
const zeroWorksheet = Engine.grade(eightColumn, { cells: Object.fromEntries(eightColumn.table.inputCells.map(id => [id, 0])) });
assert(zeroWorksheet.ratio < 0.7 && zeroWorksheet.earned === 0, 'WORKSHEET-ZERO: 全セル0で合格相当または部分点にならない');
assert(eightColumn.materials.some(row => row['勘定科目'] === '現金' && row['借方'] === 300000), 'SEMANTIC-D001: 元試算表をvisible materialsに持つ');
const incomeStatement = browserSandbox.window.QuestionData.F001;
assert.deepStrictEqual(JSON.parse(JSON.stringify(incomeStatement.materials.map(row => row['金額']))), [800000,400000,160000,60000], 'SEMANTIC-F001: 直接開始で必要な決算整理後データを再掲する');
assert.strictEqual(incomeStatement.answer.cells.sales - incomeStatement.answer.cells.costOfSales - incomeStatement.answer.cells.expenses, incomeStatement.answer.cells.netIncome, 'PL-01: 収益－売上原価－費用が当期純利益に一致する');
assert(JSON.stringify(browserSandbox.window.QuestionData).includes('商品有高帳を先入先出法で完成'), 'INVENTORY-01: 既存の先入先出法問題を維持する');
assert.deepStrictEqual(JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.L049.answer.cells)), { value1:1100, value2:13200, value3:8800 }, 'INVENTORY-02: 移動平均単価・払出額・残高額を学習する');
['現金出納帳','当座預金出納帳','小口現金出納帳','仕入帳','売上帳','入金伝票','出金伝票','振替伝票'].forEach(topic => assert(JSON.stringify(browserSandbox.window.QuestionData).includes(topic), `COVERAGE-01: ${topic}を実問題へ対応付ける`));
assert.strictEqual(browserSandbox.window.QuestionDataAudit.ok, true, `全問題の品質検証を通過する: ${browserSandbox.window.QuestionDataAudit.errors.join(', ')}`);
const semanticAudit = browserSandbox.window.validateSemanticQuestionData();
assert.strictEqual(semanticAudit.ok, true, `SEMANTIC: ${semanticAudit.errors.join(', ')}`);
assert.deepStrictEqual(JSON.parse(JSON.stringify(semanticAudit.counts)), { VALID:300, QUESTIONABLE:0, INVALID:0 }, '全300問のSemantic Auditを分類する');
assert.strictEqual(semanticAudit.eligibleIds.length, 300, '模試対象は自己申告ではなく独立Semantic監査結果から生成する');
const tamperedQuestions = { ...browserSandbox.window.QuestionData, J081: { ...browserSandbox.window.QuestionData.J081, answer: { debit:[{account:'租税公課',amount:58000}], credit:[{account:'現金',amount:58000}] } } };
const tamperedAudit = browserSandbox.window.validateSemanticQuestionData(tamperedQuestions);
assert.strictEqual(tamperedAudit.findings.J081.status, 'INVALID', '表示48,000円に対する正答58,000円を自己申告にかかわらず検出する');
assert(!tamperedAudit.eligibleIds.includes('J081'), 'Semantic不成立問題を模試対象から除外する');
[['L044',50000,18000],['L045',300000,85000],['L046',4800,7200]].forEach(([id, first, second]) => { const visible = JSON.stringify(browserSandbox.window.QuestionData[id].materials); assert(visible.includes(String(first)) && visible.includes(String(second)), `SEMANTIC-${id}: 根拠金額をvisible materialsに持つ`); });
assert.deepStrictEqual([...browserSandbox.window.QuestionDataAudit.warnings], [], '全問題に品質上の警告がない');
for (let number = 1; number <= 20; number += 1) {
  const question = browserSandbox.window.QuestionData[`E${String(number).padStart(3, '0')}`];
  assert.deepStrictEqual(JSON.parse(JSON.stringify(question.table.inputTypes)), { debitAccount: 'account', debitAmount: 'amount', creditAccount: 'account', creditAmount: 'amount' }, `${question.id}は勘定科目と金額の入力型を明示する`);
  Object.entries(question.answer.cells).forEach(([cellId, value]) => assert.strictEqual(question.table.inputTypes[cellId] === 'amount', typeof value === 'number', `${question.id}/${cellId}の入力型と正答型を一致させる`));
}
const correction = browserSandbox.window.QuestionData.E001;
assert.strictEqual(Engine.grade(correction, { cells: { debitAccount: '広告宣伝費', debitAmount: '22,500', creditAccount: '備品', creditAmount: '22,500' } }).correct, true, 'E001の科目・金額を入力して正解にできる');
assert.strictEqual(Engine.grade(correction, { cells: { debitAccount: '消耗品費', debitAmount: '22,500', creditAccount: '備品', creditAmount: '22,500' } }).correct, false, 'E001の誤った科目は不正解にする');
const correctionProgress = new ProgressModel({ E001: correction }, storage);
correctionProgress.setDraft('E001', { cells: { debitAccount: '広告宣伝費', debitAmount: '22,500', creditAccount: '備品', creditAmount: '22,500' } });
assert.deepStrictEqual(new ProgressModel({ E001: correction }, storage).state.drafts.E001.cells, correctionProgress.state.drafts.E001.cells, '記帳訂正の文字列と金額の下書きを再表示用に復元する');
Object.values(browserSandbox.window.QuestionData).filter(question => question.type === 'journal').forEach(question => {
  [...question.answer.debit, ...question.answer.credit].forEach(item => {
    const choices = browserSandbox.window.AppController.accountChoices(question, item.account);
    assert.strictEqual(choices.length, 5, `${question.id}の勘定科目は5択にする`);
    assert(choices.includes(item.account), `${question.id}の勘定科目に正答を含める`);
  });
});
const correctPositions = [0, 0, 0, 0, 0];
Object.values(browserSandbox.window.QuestionData).filter(question => question.type === 'journal').forEach(question => {
  [...question.answer.debit, ...question.answer.credit].forEach(item => correctPositions[browserSandbox.window.AppController.accountChoices(question, item.account).indexOf(item.account)] += 1);
});
assert(correctPositions.every(count => count > 0), `仕訳の正解が5位置すべてに現れる: ${correctPositions.join(',')}`);
assert(Math.max(...correctPositions) / Math.min(...correctPositions) < 1.5, `正解位置分布に異常な偏りがない: ${correctPositions.join(',')}`);
assert.deepStrictEqual([...browserSandbox.window.AppController.accountChoices(browserSandbox.window.QuestionData.J001, '現金')], [...browserSandbox.window.AppController.accountChoices(browserSandbox.window.QuestionData.J001, '現金')], '同一問題とseedの選択肢順は常に同じ');
const allJournalAccounts = [...new Set(Object.values(browserSandbox.window.QuestionData).filter(question => question.type === 'journal').flatMap(question => [...question.answer.debit, ...question.answer.credit].map(item => item.account)))];
const examQuestion = browserSandbox.window.QuestionData.J001;
assert.deepStrictEqual([...browserSandbox.window.AppController.accountChoices(examQuestion, '現金', 'exam')], [...allJournalAccounts].sort((a, b) => a.localeCompare(b, 'ja')), '模擬試験では全仕訳科目を五十音順で選択できる');
['story', 'training', 'review'].forEach(mode => assert.strictEqual(browserSandbox.window.AppController.accountChoices(examQuestion, '現金', mode).length, 5, `${mode}では既存の5択を維持する`));
const amountInput = { value: '1234', selectionStart: 2, selectionEnd: 3, selectionDirection: 'forward', setSelectionRange(...range) { this.range = range; } };
browserSandbox.window.AppController.prototype.formatAmount(amountInput);
assert.strictEqual(amountInput.value, '1,234', '金額を3桁区切りにする');
assert.deepStrictEqual([...amountInput.range], [3, 4, 'forward'], '整形後も選択範囲を同じ桁位置に保つ');
const fullWidthAmountInput = { value: '１２３４', selectionStart: 4, selectionEnd: 4, setSelectionRange(...range) { this.range = range; } };
browserSandbox.window.AppController.prototype.formatAmount(fullWidthAmountInput);
assert.strictEqual(fullWidthAmountInput.value, '1,234', 'iOS IMEの全角数字を半角へ正規化して整形する');
const mixedAmountInput = { value: '１，2３４', selectionStart: 5, selectionEnd: 5, setSelectionRange(...range) { this.range = range; } };
browserSandbox.window.AppController.prototype.formatAmount(mixedAmountInput);
assert.strictEqual(mixedAmountInput.value, '1,234', '全角カンマを含む混在入力も整形する');
const viewSource = fs.readFileSync('js/view.js', 'utf8');
assert(!viewSource.includes("createElement('pre')"), 'IOS-REVIEW-03: 模試レビューへ内部JSON用preを生成しない');
assert(viewSource.includes("answerReviewBlock('自分の回答'") && viewSource.includes('this.journalTable(answer)'), 'IOS-REVIEW-02: 長い仕訳回答を意味のある仕訳表で表示する');
vm.runInNewContext(viewSource, browserSandbox);
class FakeElement {
  constructor(tagName = 'div') { this.tagName = tagName; this.children = []; this.hidden = false; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  createTHead() { const section = new FakeElement('thead'); section.insertRow = () => { const row = new FakeElement('tr'); section.append(row); return row; }; this.append(section); return section; }
  createTBody() { const section = new FakeElement('tbody'); section.insertRow = () => { const row = new FakeElement('tr'); row.insertCell = () => { const cell = new FakeElement('td'); row.append(cell); return cell; }; section.append(row); return row; }; this.append(section); return section; }
}
const materialElements = { 'question-materials': new FakeElement('section') };
const materialView = new browserSandbox.window.AppView({ getElementById: id => materialElements[id], createElement: tag => new FakeElement(tag) });
materialView.renderMaterials(browserSandbox.window.QuestionData.E001);
assert.strictEqual(materialElements['question-materials'].hidden, false, 'materialsを持つ訂正問題で資料DOMを表示する');
assert.strictEqual(materialElements['question-materials'].children[1].children[0].children[1].children.length, 1, 'materialsの全行をDOMに描画する');
materialView.renderMaterials(browserSandbox.window.QuestionData.J001);
assert.strictEqual(materialElements['question-materials'].hidden, true, 'materialsがない問題で古い資料を残さない');
const answerFields = {
  '.debit-account': [{ value: '現金' }], '.debit-amount': [{ value: '１,０００' }],
  '.credit-account': [{ value: '売上' }], '.credit-amount': [{ value: '１,０００' }]
};
const answerView = new browserSandbox.window.AppView({ querySelectorAll: selector => answerFields[selector] || [] });
assert.deepStrictEqual(JSON.parse(JSON.stringify(answerView.readAnswer({ type: 'journal' }))), { debit: [{ account: '現金', amount: 1000 }], credit: [{ account: '売上', amount: 1000 }] }, '仕訳入力の全角数字を数値として読み取る');
const comparison = { hidden: false, children: [], replaceChildren(...children) { this.children = children; }, append(...children) { this.children.push(...children); } };
const comparisonDocument = { getElementById: () => comparison, createElement: tagName => ({ tagName, textContent: '' }) };
const comparisonView = new browserSandbox.window.AppView(comparisonDocument);
comparisonView.journalTable = () => ({ tagName: 'table' });
comparisonView.renderAnswerComparison({ type: 'journal' }, { correct: true }, { debit: [], credit: [] });
assert.strictEqual(comparison.hidden, true, '正解時は空の誤答比較欄をhiddenにする');
comparisonView.renderAnswerComparison({ type: 'journal' }, { correct: false }, { debit: [], credit: [] });
assert.strictEqual(comparison.hidden, false, '仕訳の誤答時だけ比較欄を表示する');
allJournalAccounts.forEach(account => assert.notStrictEqual(comparisonView.accountType(account), 'unknown', `${account}を簿記の5要素へ分類する`));
assert.strictEqual(comparisonView.accountType('減価償却累計額'), 'contraAsset', '減価償却累計額は負債ではなく資産の控除項目とする');
assert.strictEqual(comparisonView.accountType('貸倒引当金'), 'contraAsset', '貸倒引当金は資産の控除項目とする');
const storyOrder = browserSandbox.window.AppController.prototype.storyIds.call({ ids: Object.keys(browserSandbox.window.QuestionData), questions: browserSandbox.window.QuestionData });
assert.strictEqual(storyOrder.length, 300, 'ストーリーは全300問で簿記フローを体験できる');
assert(storyOrder.every((id, index) => index === 0 || browserSandbox.window.QuestionData[storyOrder[index - 1]].chapter <= browserSandbox.window.QuestionData[id].chapter), 'ストーリーのChapterが逆行しない');
const examAudit = { ids: Object.keys(browserSandbox.window.QuestionData), questions: browserSandbox.window.QuestionData, model: { state: { examAttempt: 0 } } };
const examPrototype = browserSandbox.window.AppController.prototype;
const expirySession = { ids: [], startedAt: 1000, endAt: 2000, status: 'RUNNING', scores: {} };
const expiryContext = { model: { state: { examSession: expirySession } } };
assert.strictEqual(examPrototype.isExamExpired.call(expiryContext, 1999), false, 'CASE A: 終了1ms前は採点可能');
assert.strictEqual(examPrototype.isExamExpired.call(expiryContext, 2000), true, 'CASE B: 終了時刻ちょうどは採点不可');
assert.strictEqual(examPrototype.isExamExpired.call(expiryContext, 2001), true, 'CASE C: 終了1ms後は採点不可');
assert.strictEqual(examPrototype.isExamExpired.call(expiryContext, 3000), true, 'CASE D: 終了1秒後は採点不可');
['EXPIRED', 'FINISHING', 'FINISHED'].forEach(status => assert.strictEqual(examPrototype.isExamExpired.call({ model: { state: { examSession: { ...expirySession, status } } } }, 1500), true, `${status}からSCORE_UPDATEへ遷移できない`));
let forcedFinishes = 0; let grades = 0;
const lateSubmit = {
  submitting: false, currentId: 'Q1', questions: { Q1: { id: 'Q1' } },
  model: { state: { mode: 'exam', examSession: { ids: ['Q1'], startedAt: 1, endAt: 2, status: 'RUNNING', scores: {} } } },
  isExamExpired: () => true, finishExam(force) { assert.strictEqual(force, true); forcedFinishes += 1; }, document: { querySelector: () => null }
};
browserSandbox.window.GradingEngine.grade = () => { grades += 1; return { correct: true, earned: 1, possible: 1, ratio: 1 }; };
for (let attack = 0; attack < 3; attack += 1) { lateSubmit.submitting = false; examPrototype.submit.call(lateSubmit); }
assert.deepStrictEqual([grades, Object.keys(lateSubmit.model.state.examSession.scores).length, forcedFinishes], [0, 0, 3], 'CASE E/F: callback遅延後の復帰とsubmit連打でも回答取得・採点・score更新をしない');
lateSubmit.currentId = 'Q2'; lateSubmit.questions.Q2 = { id: 'Q2' }; lateSubmit.model.state.examSession.ids.push('Q2'); lateSubmit.submitting = false;
examPrototype.submit.call(lateSubmit);
assert.strictEqual(Object.keys(lateSubmit.model.state.examSession.scores).length, 0, 'CASE G: 時間切れ後に別問題へ移動しても採点不可');
const fifteenIds = Array.from({ length: 15 }, (_, index) => `Q${index + 1}`);
const examState = { ids: fifteenIds, startedAt: 1, endAt: 3600001, scores: {} };
assert.strictEqual(examPrototype.unansweredExamIds.call({ model: { state: { examSession: examState } } }).length, 15, 'CASE 1: 15問目だけ回答する前は15問が未回答である');
examState.scores.Q15 = { correct: true, earned: 1, possible: 1, ratio: 1 };
assert.strictEqual(examPrototype.unansweredExamIds.call({ model: { state: { examSession: examState } } }).length, 14, 'CASE 1: 15問目だけ正解しても未回答14問を認識する');
examState.scores.Q8 = { correct: true, earned: 1, possible: 1, ratio: 1 };
assert.strictEqual(examPrototype.unansweredExamIds.call({ model: { state: { examSession: examState } } }).length, 13, 'CASE 2: 途中問題を直接回答しても完了扱いにしない');
let warned = ''; let redirected = '';
const incompleteExam = {
  model: { state: { examSession: examState } }, unansweredExamIds: examPrototype.unansweredExamIds,
  start(id) { redirected = id; }, startExamTimer() {}, questions: {}, rpg: {}, view: {}
};
browserSandbox.window.alert = message => { warned = message; };
assert.strictEqual(examPrototype.finishExam.call(incompleteExam, false, 2), false, 'CASE 3: 1問でも未回答なら終了を拒否する');
assert(warned.includes('未回答が13問') && redirected === 'Q1', 'CASE 3: 未回答数を警告し最初の未回答へ移動する');
const completeScores = Object.fromEntries(fifteenIds.map(id => [id, { correct: true, earned: 1, possible: 1, ratio: 1 }]));
const completedSession = { ids: fifteenIds, startedAt: 1, endAt: 3600001, scores: completeScores };
let resultScore; const completeExam = {
  model: { state: { examSession: completedSession, examAttempt: 0 }, record() {}, save() {} },
  unansweredExamIds: examPrototype.unansweredExamIds, questions: Object.fromEntries(fifteenIds.map(id => [id, { category: id }])),
  rpg: { recordMastery() {} }, stopExamTimer() {}, view: { examResult(review) { resultScore = { correct: review.passed, earned: review.points, possible: 100 }; }, show() {} }, document: { body: { classList: { remove() {} } } }
};
browserSandbox.window.confirm = () => true;
assert.strictEqual(examPrototype.finishExam.call(completeExam, false, 2), true, 'CASE 4: 全15問回答後に初めて正式採点する');
assert.deepStrictEqual(JSON.parse(JSON.stringify(resultScore)), { correct: true, earned: 100, possible: 100 }, '明示配点の合計を100点として採点する');
const examIds = browserSandbox.window.AppController.prototype.buildExamIds.call(examAudit);
assert.strictEqual(examIds.length, 15, '模試は設計通り15問を選出する');
examIds.forEach(id => { const question = browserSandbox.window.QuestionData[id]; assert(question.type === 'journal' || (question.table && question.table.inputCells.every(cell => cell in question.answer.cells)), `${id}は必要な入力欄と正答を持つ`); if (question.materials?.length) assert(viewSource.includes('this.renderMaterials(question)'), `${id}の資料を問題表示で描画する`); });
examIds.forEach(id => assert.strictEqual(semanticAudit.findings[id].status, 'VALID', `EXAM-VALIDITY: ${id}は独立Semantic監査でVALIDである`));
assert.deepStrictEqual(JSON.parse(JSON.stringify(comparisonView.explanationSections('【処理の根拠】\n資産が増えます。\n【試験のポイント】ここに注意。'))), [
  { label: '実務MEMO', kind: 'memo', text: '資産が増えます。' },
  { label: '試験POINT', kind: 'point', text: 'ここに注意。' }
], '解説見出しを実務MEMO・試験POINTのカード構造へ正規化する');
assert(viewSource.includes("score.correct ? '正解です！' : 'もう一歩です'"), '採点結果は従来どおり正解またはもう一歩と表示する');
assert(!viewSource.includes('部分点'), 'ユーザー向けの採点結果に部分点を表示しない');
assert(viewSource.includes("input.type = 'text'; input.setAttribute('inputmode', 'numeric')"), '金額欄ではモバイル端末の数字キーパッドを呼び出す');
assert(viewSource.includes("input.setAttribute('pattern', '[0-9,]*')"), '桁区切り済みの金額もフォームの入力書式として許可する');
assert(viewSource.includes("input.setAttribute('enterkeyhint', 'done')"), 'iPhoneのキーボードに完了キーを表示する');
assert(viewSource.includes('select.title = select.selectedOptions[0]?.textContent'), '選択中の勘定科目をtitleに反映する');
const cssSource = fs.readFileSync('css/style.css', 'utf8');
assert(/button,\s*select,\s*input\s*{[^}]*min-height:\s*44px/s.test(cssSource), 'フォーム部品のタップ領域を44px以上にする');
assert(html.includes('id="correct-journal"'), '採点結果に正しい仕訳の表示領域を設ける');
assert(viewSource.includes('this.renderCorrectJournal(question)'), '正解・不正解のどちらでも正しい仕訳を表示する');
assert(viewSource.includes("heading.textContent = '正しい仕訳'"), '正しい仕訳の見出しを表示する');
assert(html.includes('id="answer-comparison"'), '誤答した仕訳を正答と比較する表示領域を設ける');
assert(/\.answer-comparison:empty\s*{[^}]*display:\s*none/s.test(cssSource), '空の誤答比較欄は赤枠ごと非表示にする');
assert(/\.answer-comparison\[hidden\][\s\S]*?display:\s*none/s.test(cssSource), 'hidden属性でも誤答比較欄を確実に非表示にする');
assert(viewSource.includes('container.hidden = true') && viewSource.includes('container.hidden = false'), '誤答比較欄は誤答時だけ表示する');
assert(controllerSource.includes('this.view.result(question, score, answer)'), '採点結果画面へ回答者の仕訳を渡す');
assert(viewSource.includes("heading.textContent = 'あなたの仕訳（誤答）'"), '回答者が入力した誤答を表示する');
assert(viewSource.includes("heading.textContent = 'なぜ間違えたのか'"), '誤答理由の講師解説を表示する');
assert(viewSource.includes("this.byId('explanation').before(container)"), '古いHTMLがキャッシュされていても正しい仕訳の表示領域を補完する');
assert(!/\.journal-header,\s*\.journal-row\s*{[^}]*min-width:\s*520px/s.test(cssSource), 'モバイルの仕訳欄を画面幅より広くしない');
assert(/\.journal-entry-area\s*{[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/s.test(cssSource), '仕訳票自体を画面幅内に収めて横スクロールを発生させない');
assert(/\.table-question-wrap\s*{[^}]*overflow-x:\s*auto/s.test(cssSource), '大きな表は小型画面で横スクロールできる');
assert(/\.answer-table th:first-child, \.answer-table td:first-child\s*{[^}]*position:\s*sticky[^}]*left:\s*0/s.test(cssSource), '横スクロール中も表の先頭列を固定する');
assert(/\.journal-table\s*{[^}]*table-layout:\s*fixed/s.test(cssSource), '正しい仕訳表を画面幅に収める');
assert(/\.journal-row\s*{[^}]*grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\) minmax\(0, 3fr\) minmax\(0, 2fr\)/s.test(cssSource), '仕訳は借方科目・借方金額・貸方科目・貸方金額の4列にする');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-header,\s*\.journal-row\s*{[^}]*grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\) minmax\(0, 3fr\) minmax\(0, 2fr\)/s.test(cssSource), '狭い画面でも仕訳の4列を必ず横並びにする');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-row select,\s*\.journal-row \.amount-input\s*{[^}]*font-size:\s*16px/s.test(cssSource), 'iPhoneの仕訳コントロールを16px以上にして自動ズームを防ぐ');
assert(!viewSource.includes('dataset.sideLabel'), '横並びの仕訳票に縦並び用ラベルを追加しない');
assert(viewSource.includes("<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>"), '仕訳票の4列見出しを表示する');
assert(viewSource.includes('row.append(select, amount)'), 'iPhoneでも4つの入力要素を仕訳行の直下に配置する');
assert(viewSource.includes("inputType === 'amount'") && viewSource.includes("this.makeText('table-input'"), '表セルの明示型に応じて金額入力と日本語文字入力を分ける');
assert(viewSource.includes("this.byId('q-context').textContent = question.story"), 'ストーリーモードで問題の場面と物語を表示する');
assert(!cssSource.includes('display: contents'), 'iPhoneの仕訳配置をdisplay: contentsに依存させない');
assert(html.includes('css/style.css?v=20260824-8') && html.includes('js/view.js?v=20260824-8'), 'iPhone Chromeに改修後のCSSとJSを再読み込みさせる');
assert(html.includes('name="format-detection" content="telephone=no"'), 'iPhoneで金額を電話番号リンクとして誤認しない');
assert(!html.includes('maximum-scale=1'), 'ユーザーのピンチズームを制限しない');
assert(html.includes('readonly inputmode="numeric"'), '電卓表示にもiPhone向けの数値入力属性を付ける');
assert(html.includes('id="result-status" class="result-box" role="status" aria-live="polite"'), '動的な採点結果をスクリーンリーダーへ通知する');
assert(html.includes('aria-labelledby="game-over-title" aria-describedby="game-over-description"'), '資金ショートダイアログの名前と説明を関連付ける');
assert(!html.includes('pattern="[0-9]*"'), 'カンマや演算子を表示する入力欄へ不整合なpattern制約を付けない');
assert(controllerSource.includes("querySelector?.('.amount-input.calculator-selected')"), '電卓は選択クラスの付いた金額欄も転記先として復元する');
assert(controllerSource.includes("if (first) this.start(first)"), '資金ショート後のリトライは該当モードの最初の問題から開始する');
assert(/min-height:\s*100svh/.test(cssSource), 'iPhoneの可変ブラウザーバーを考慮した画面高を使う');
assert(/min-height:\s*100dvh/.test(cssSource), 'iPhone Chromeの可変ビューポート高へ追従する');
assert(/env\(safe-area-inset-top\)/.test(cssSource), 'iPhoneの上側セーフエリアを確保する');
assert(!fs.readFileSync('js/app.js', 'utf8').includes('Function('), 'Functionによる式評価を禁止する');
const appSource = fs.readFileSync('js/app.js', 'utf8');
const appSandbox = {
  window: { location: { search: '' }, SafeCalculator: Calculator },
  document: { addEventListener() {} }, navigator: {}, location: { protocol: 'file:' }, URLSearchParams
};
vm.runInNewContext(appSource, appSandbox);
assert.deepStrictEqual(JSON.parse(JSON.stringify(appSandbox.window.App.initialRoute('?mode=review&question=J001'))), { mode: 'review', questionId: 'J001' }, '有効なURLパラメータを初期表示候補として読み取る');
assert.deepStrictEqual(JSON.parse(JSON.stringify(appSandbox.window.App.initialRoute('%E0%A4%A'))), { mode: null, questionId: null }, '不正なURLパラメータでも初期化を停止しない');
assert(controllerSource.includes("this.questions[route.questionId] && (mode !== 'exam' || this.modeIds().includes(route.questionId))"), '未定義IDと模試選出外IDは開始せず安全なモード一覧に留まる');
assert(html.includes('rel="manifest" href="manifest.webmanifest"'), 'PWAマニフェストを読み込む');
assert(fs.readFileSync('js/app.js', 'utf8').includes("navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })"), 'Service Worker本体をHTTP cacheに依存せず更新確認する');
const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
['./index.html', './data/questions.js', './js/controller.js'].forEach(asset => assert(serviceWorker.includes(asset), `${asset}をオフラインキャッシュ対象にする`));
assert(!serviceWorker.includes('ignoreSearch'), 'query versionを正規のcache keyとして扱う');
assert(serviceWorker.includes("event.request.mode === 'navigate'") && serviceWorker.includes("cache: 'no-store'"), 'HTML navigationをNetwork Firstで更新する');
assert(serviceWorker.includes("key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME"), 'activate時に旧リリースcacheを削除する');
assert(html.includes('id="exam-result-actions"') && !/id="exam-result-actions"[^>]*>[\s\S]*?data-action="next"/.test(html), '模試結果は通常学習の次へ進む導線を使わない');
assert(controllerSource.includes("if (this.model.state.mode === 'exam' && !this.model.state.examSession) return this.leaveExamResult('story')"), '模試sessionなしで回答可能画面へ進む遷移を防ぐ');
assert(html.includes('id="filter-query"') && html.includes('id="filter-account"') && html.includes('id="filter-mistakes"'), '問題検索・勘定科目・誤答頻度の絞り込みUIを表示する');
assert(controllerSource.includes('filteredIds(ids)') && controllerSource.includes("this.filters.mistakes === 'frequent'"), '問題一覧を検索し誤答頻度順に並べる');
assert(fs.existsSync('types/domain.d.ts') && fs.existsSync('tsconfig.json'), '段階的TypeScript導入用のドメイン型と設定を提供する');
console.log('app tests: ok');
