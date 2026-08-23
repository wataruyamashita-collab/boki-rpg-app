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
assert.strictEqual(progress.state.mistakeCounts.J1, 1, '問題ごとの累積誤答回数を記録する');
progress.record('J1', false);
assert.strictEqual(progress.state.mistakeCounts.J1, 2, '同じ問題の再誤答も頻度へ加算する');
const rpg = new RPGModel(storage); const question = { id: 'J1', difficulty: 2, category: '現金' };
assert.strictEqual(rpg.reward(question, { ratio: 0.5, earned: 1, possible: 2 }), true);
assert.strictEqual(rpg.reward(question, { ratio: 1, earned: 2, possible: 2 }), false, '経験値は二重付与しない');
assert.strictEqual(rpg.state.xp, 20);
assert.strictEqual(rpg.state.companyHP, 100);
rpg.applyAnswer(false, 'bold');
assert.strictEqual(rpg.state.companyHP, 70, '勝負回答の誤答は経営HPを30減らす');
rpg.applyAnswer(true, 'careful');
assert.strictEqual(rpg.state.companyHP, 75, '正解は経営HPを5回復する');

const html = fs.readFileSync('index.html', 'utf8');
assert(!/\sonclick=/.test(html), 'インラインイベントハンドラを置かない');
['story', 'training', 'review', 'exam'].forEach(mode => assert(html.includes(`view-${mode}`), `${mode}ビューが必要`));
assert(/<form id="question-form"[^>]*>[\s\S]*<button class="confirm-button" type="submit">回答を確定する<\/button>[\s\S]*<\/form>/.test(html), '回答欄はEnterキーで送信できるフォームにする');
const localAssets = [...html.matchAll(/(?:href|src)="((?:css|js|data)\/[^"?]+)([^"]*)"/g)];
assert(localAssets.length > 0 && localAssets.every(([, , query]) => query === '?v=20260822-2'), 'すべてのローカルCSS/JSに最新のキャッシュバスターを付ける');
const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
assert(controllerSource.includes("getElementById('question-form').addEventListener('submit'"), 'フォームのsubmitイベントを処理する');
assert(controllerSource.includes('event.preventDefault()'), 'フォーム送信時のページ遷移を防ぐ');
assert(controllerSource.includes('this.document.activeElement?.blur()'), '回答確定前にソフトウェアキーボードを閉じる');
assert(html.includes('data-action="calc-insert"'), '電卓の表示金額を入力するボタンを表示する');
assert(controllerSource.includes("'calc-insert': () => this.insertCalculatorResult(false)"), '電卓の入力ボタンを転記処理へ接続する');
assert(controllerSource.includes("else if (key === '＝') this.calculateEquals()"), 'イコールキーで計算結果を表示する');
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
assert.strictEqual(browserSandbox.window.QuestionDataAudit.ok, true, `全問題の品質検証を通過する: ${browserSandbox.window.QuestionDataAudit.errors.join(', ')}`);
assert.deepStrictEqual([...browserSandbox.window.QuestionDataAudit.warnings], [], '全問題に品質上の警告がない');
Object.values(browserSandbox.window.QuestionData).filter(question => question.type === 'journal').forEach(question => {
  [...question.answer.debit, ...question.answer.credit].forEach(item => {
    const choices = browserSandbox.window.AppController.accountChoices(question, item.account);
    assert.strictEqual(choices.length, 5, `${question.id}の勘定科目は5択にする`);
    assert(choices.includes(item.account), `${question.id}の勘定科目に正答を含める`);
  });
});
const amountInput = { value: '1234', selectionStart: 2, selectionEnd: 3, selectionDirection: 'forward', setSelectionRange(...range) { this.range = range; } };
browserSandbox.window.AppController.prototype.formatAmount(amountInput);
assert.strictEqual(amountInput.value, '1,234', '金額を3桁区切りにする');
assert.deepStrictEqual([...amountInput.range], [3, 4, 'forward'], '整形後も選択範囲を同じ桁位置に保つ');
const viewSource = fs.readFileSync('js/view.js', 'utf8');
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
assert(controllerSource.includes('this.view.result(question, score, answer)'), '採点結果画面へ回答者の仕訳を渡す');
assert(viewSource.includes("heading.textContent = 'あなたの仕訳（誤答）'"), '回答者が入力した誤答を表示する');
assert(viewSource.includes("heading.textContent = 'なぜ間違えたのか'"), '誤答理由の講師解説を表示する');
assert(viewSource.includes("this.byId('explanation').before(container)"), '古いHTMLがキャッシュされていても正しい仕訳の表示領域を補完する');
assert(!/\.journal-header,\s*\.journal-row\s*{[^}]*min-width:\s*520px/s.test(cssSource), 'モバイルの仕訳欄を画面幅より広くしない');
assert(/\.journal-entry-area\s*{[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/s.test(cssSource), '仕訳票自体を画面幅内に収めて横スクロールを発生させない');
assert(/\.answer-table\s*{[^}]*table-layout:\s*fixed/s.test(cssSource), '表を画面幅に収める');
assert(/\.journal-table\s*{[^}]*table-layout:\s*fixed/s.test(cssSource), '正しい仕訳表を画面幅に収める');
assert(/\.journal-row\s*{[^}]*grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\) minmax\(0, 3fr\) minmax\(0, 2fr\)/s.test(cssSource), '仕訳は借方科目・借方金額・貸方科目・貸方金額の4列にする');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-header,\s*\.journal-row\s*{[^}]*grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\) minmax\(0, 3fr\) minmax\(0, 2fr\)/s.test(cssSource), '狭い画面でも仕訳の4列を必ず横並びにする');
assert(/@media \(max-width: 480px\)[\s\S]*?\.journal-row select,\s*\.journal-row \.amount-input\s*{[^}]*font-size:\s*clamp\(11px, 3\.2vw, 14px\)/s.test(cssSource), 'セル寸法を変えずiPhoneの仕訳文字を収める');
assert(!viewSource.includes('dataset.sideLabel'), '横並びの仕訳票に縦並び用ラベルを追加しない');
assert(viewSource.includes("<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>"), '仕訳票の4列見出しを表示する');
assert(viewSource.includes('row.append(select, amount)'), 'iPhoneでも4つの入力要素を仕訳行の直下に配置する');
assert(!cssSource.includes('display: contents'), 'iPhoneの仕訳配置をdisplay: contentsに依存させない');
assert(html.includes('css/style.css?v=20260822-2') && html.includes('js/view.js?v=20260822-2'), 'iPhone Chromeに改修後のCSSとJSを再読み込みさせる');
assert(html.includes('name="format-detection" content="telephone=no"'), 'iPhoneで金額を電話番号リンクとして誤認しない');
assert(html.includes('maximum-scale=1'), 'iPhoneで小さい仕訳文字へフォーカスした際の自動拡大を防ぐ');
assert(html.includes('readonly inputmode="numeric"'), '電卓表示にもiPhone向けの数値入力属性を付ける');
assert(!html.includes('pattern="[0-9]*"'), 'カンマや演算子を表示する入力欄へ不整合なpattern制約を付けない');
assert(controllerSource.includes("querySelector?.('.amount-input.calculator-selected')"), '電卓は選択クラスの付いた金額欄も転記先として復元する');
assert(controllerSource.includes("if (first) this.start(first)"), '資金ショート後のリトライは該当モードの最初の問題から開始する');
assert(/min-height:\s*100svh/.test(cssSource), 'iPhoneの可変ブラウザーバーを考慮した画面高を使う');
assert(/min-height:\s*100dvh/.test(cssSource), 'iPhone Chromeの可変ビューポート高へ追従する');
assert(/env\(safe-area-inset-top\)/.test(cssSource), 'iPhoneの上側セーフエリアを確保する');
assert(!fs.readFileSync('js/app.js', 'utf8').includes('Function('), 'Functionによる式評価を禁止する');
assert(html.includes('rel="manifest" href="manifest.webmanifest"'), 'PWAマニフェストを読み込む');
assert(fs.readFileSync('js/app.js', 'utf8').includes("navigator.serviceWorker.register('./service-worker.js')"), 'Service Workerを登録する');
const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
['./index.html', './data/questions.js', './js/controller.js'].forEach(asset => assert(serviceWorker.includes(asset), `${asset}をオフラインキャッシュ対象にする`));
assert(html.includes('id="filter-query"') && html.includes('id="filter-account"') && html.includes('id="filter-mistakes"'), '問題検索・勘定科目・誤答頻度の絞り込みUIを表示する');
assert(controllerSource.includes('filteredIds(ids)') && controllerSource.includes("this.filters.mistakes === 'frequent'"), '問題一覧を検索し誤答頻度順に並べる');
assert(fs.existsSync('types/domain.d.ts') && fs.existsSync('tsconfig.json'), '段階的TypeScript導入用のドメイン型と設定を提供する');
console.log('app tests: ok');
