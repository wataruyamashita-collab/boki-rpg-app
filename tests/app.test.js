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
assert.strictEqual(Engine.gradeJournalEntry({ debit: [{ account: '現金', amount: 100 }], credit: [{ account: '売上', amount: 100 }] }, { debit: [{ account: '現金', amount: 100 }], credit: [{ account: '売上', amount: 100 }] }), true);

const values = {};
const storage = { getItem(key) { return values[key] || null; }, setItem(key, value) { values[key] = value; } };
const progress = new ProgressModel({ J1: {} }, storage); progress.record('J1', false);
assert.deepStrictEqual(progress.state.incorrectIds, ['J1']);
const rpg = new RPGModel(storage); const question = { id: 'J1', difficulty: 2, category: '現金' };
assert.strictEqual(rpg.reward(question, { ratio: 0.5, earned: 1, possible: 2 }), true);
assert.strictEqual(rpg.reward(question, { ratio: 1, earned: 2, possible: 2 }), false, '経験値は二重付与しない');
assert.strictEqual(rpg.state.xp, 20);

const html = fs.readFileSync('index.html', 'utf8');
assert(!/\sonclick=/.test(html), 'インラインイベントハンドラを置かない');
['story', 'training', 'review', 'exam'].forEach(mode => assert(html.includes(`view-${mode}`), `${mode}ビューが必要`));
assert(/<form id="question-form">[\s\S]*<button class="confirm-button" type="submit">回答を確定する<\/button>[\s\S]*<\/form>/.test(html), '回答欄はEnterキーで送信できるフォームにする');
const localAssets = [...html.matchAll(/(?:href|src)="((?:css|js|data)\/[^"?]+)([^"]*)"/g)];
assert(localAssets.length > 0 && localAssets.every(([, , query]) => query === '?v=20260820-4'), 'すべてのローカルCSS/JSに最新のキャッシュバスターを付ける');
const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
assert(controllerSource.includes("getElementById('question-form').addEventListener('submit'"), 'フォームのsubmitイベントを処理する');
assert(controllerSource.includes('event.preventDefault()'), 'フォーム送信時のページ遷移を防ぐ');
assert(controllerSource.includes('this.document.activeElement?.blur()'), '回答確定前にソフトウェアキーボードを閉じる');
assert(html.includes('data-action="calc-insert"'), '電卓の表示金額を入力するボタンを表示する');
assert(controllerSource.includes("'calc-insert': () => this.insertCalculatorResult(true)"), '電卓の入力ボタンを転記処理へ接続する');
assert(controllerSource.includes("if (key === '＝') { this.insertCalculatorResult(true); return; }"), 'イコールキーで計算結果を選択中の金額欄へ転記する');
assert(controllerSource.includes("addEventListener('focusin'"), '選択した金額欄を電卓の転記先にする');
const browserSandbox = { window: {} };
vm.runInNewContext(controllerSource, browserSandbox);
browserSandbox.window.SafeCalculator = Calculator;
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
const questionDataSource = fs.readFileSync('data/questions.js', 'utf8');
vm.runInNewContext(questionDataSource, browserSandbox);
assert.strictEqual(browserSandbox.window.QuestionData.J001.id, 'J001', '問題データをブラウザーのwindowに公開する');
const amountInput = { value: '1234', selectionStart: 2, selectionEnd: 3, selectionDirection: 'forward', setSelectionRange(...range) { this.range = range; } };
browserSandbox.window.AppController.prototype.formatAmount(amountInput);
assert.strictEqual(amountInput.value, '1,234', '金額を3桁区切りにする');
assert.deepStrictEqual([...amountInput.range], [3, 4, 'forward'], '整形後も選択範囲を同じ桁位置に保つ');
const viewSource = fs.readFileSync('js/view.js', 'utf8');
assert(viewSource.includes("input.type = 'text'; input.setAttribute('inputmode', 'numeric')"), '金額欄ではモバイル端末の数字キーパッドを呼び出す');
assert(viewSource.includes('select.title = select.selectedOptions[0]?.textContent'), '選択中の勘定科目をtitleに反映する');
const cssSource = fs.readFileSync('css/style.css', 'utf8');
assert(/button,\s*select,\s*input\s*{[^}]*min-height:\s*44px/s.test(cssSource), 'フォーム部品のタップ領域を44px以上にする');
assert(html.includes('id="correct-journal"'), '採点結果に正しい仕訳の表示領域を設ける');
assert(viewSource.includes('this.renderCorrectJournal(question)'), '正解・不正解のどちらでも正しい仕訳を表示する');
assert(viewSource.includes("heading.textContent = '正しい仕訳'"), '正しい仕訳の見出しを表示する');
assert(viewSource.includes("this.byId('explanation').before(container)"), '古いHTMLがキャッシュされていても正しい仕訳の表示領域を補完する');
assert(!/\.journal-header,\s*\.journal-row\s*{[^}]*min-width:\s*520px/s.test(cssSource), 'モバイルの仕訳欄を画面幅より広くしない');
assert(/\.journal-entry-area\s*{[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/s.test(cssSource), '仕訳票自体を画面幅内に収めて横スクロールを発生させない');
assert(/\.answer-table\s*{[^}]*table-layout:\s*fixed/s.test(cssSource), '表を画面幅に収める');
assert(/\.journal-table\s*{[^}]*table-layout:\s*fixed/s.test(cssSource), '正しい仕訳表を画面幅に収める');
assert(!fs.readFileSync('js/app.js', 'utf8').includes('Function('), 'Functionによる式評価を禁止する');
console.log('app tests: ok');
