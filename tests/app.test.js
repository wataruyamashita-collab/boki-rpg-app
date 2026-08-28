const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const Calculator = require('../js/calculator');
const Engine = require('../js/engine');
const ProgressModel = require('../js/model');
const RPGModel = require('../js/rpg');
const Feedback = require('../js/feedback');

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
assert.strictEqual(Engine.gradeTable({ cells: { due: '６月５日' } }, { cells: { due: '06/05' } }, { due:{ semanticType:'date' } }).correct, true, '日付の全角・月日表記・ゼロ埋めを意味的に正規化する');
assert.strictEqual(Engine.gradeTable({ cells: { due: '6/32' } }, { cells: { due: '6/5' } }, { due:{ semanticType:'date' } }).correct, false, '不正または異なる日付を正解にしない');
assert.strictEqual(Engine.gradeTable({ cells: { entity: ' 北星商事 ' } }, { cells: { entity: '北星商事' } }, { entity:{ semanticType:'text' } }).correct, true, '自由記述のUnicodeと前後空白を正規化する');
assert.strictEqual(Engine.gradeTable({ cells: { entity: '北星物産' } }, { cells: { entity: '北星商事' } }, { entity:{ semanticType:'text' } }).correct, false, '異なる取引先を表記揺れとして許容しない');
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
const dueAt = progress.state.reviewSchedule.J1.dueAt;
progress.record('J1', true, dueAt - 1);
assert(progress.state.incorrectIds.includes('J1'), '直後の正解だけでは克服扱いにしない');
for (let stage = 0; stage < 4; stage += 1) progress.record('J1', true, progress.state.reviewSchedule.J1.dueAt);
assert(!progress.state.incorrectIds.includes('J1') && !progress.state.reviewSchedule.J1, '20分・1日・3日・7日の遅延再生後に克服扱いにする');
const masteryRpg = new RPGModel({ getItem() { return null; }, setItem() {} });
const masteryQuestion = { id: 'M1', difficulty: 1, category: '売掛金', type:'journal' };
masteryRpg.recordMastery(masteryQuestion, { earned: 0, possible: 1 });
masteryRpg.recordMastery(masteryQuestion, { earned: 1, possible: 1 });
assert.deepStrictEqual(masteryRpg.state.mastery['売掛金'], { earned: 1, possible: 2 }, '不正解後の正解を1/2としてmasteryへ記録する');
assert.deepStrictEqual(masteryRpg.state.mastery['@skill:仕訳'], { earned:1, possible:2 }, '役職解放用の技能masteryを問題形式から集計する');
const rpg = new RPGModel(storage); const question = { id: 'J1', difficulty: 2, category: '現金' };
assert.strictEqual(rpg.reward(question, { ratio: 0.5, earned: 1, possible: 2 }), true);
assert.strictEqual(rpg.reward(question, { ratio: 1, earned: 2, possible: 2 }), false, '経験値は二重付与しない');
assert.strictEqual(rpg.state.xp, 20);
const maxXpRpg = new RPGModel({ getItem() { return null; }, setItem() {} });
// Reachability must use reward(), not direct XP injection. Exam candidates use
// the same once-only route when an exam is finished correctly.
for (let index = 0; index < 253; index += 1) maxXpRpg.reward({ id:`reachable-${index}`, difficulty:3, category:'test' }, { ratio:1, earned:1, possible:1 });
assert.strictEqual(maxXpRpg.state.xp, 15180, '実ユーザー報酬経路で正当な到達可能XPを積み上げる');
assert.strictEqual(maxXpRpg.level, 30, '実ユーザー報酬経路でLv.30に到達できる');
maxXpRpg.state.mastery = { '@skill:仕訳':{ earned:10, possible:10 }, '@skill:帳簿':{ earned:10, possible:10 }, '@skill:決算整理':{ earned:10, possible:10 }, '@skill:財務諸表':{ earned:10, possible:10 } };
assert.strictEqual(maxXpRpg.role, '決算責任者', '最終役職はXPと主要技能masteryの両方で解放する');
maxXpRpg.state.mastery['@skill:財務諸表'] = { earned:0, possible:10 };
assert.notStrictEqual(maxXpRpg.role, '決算責任者', 'XPだけで最終役職を解放しない');
assert.strictEqual(rpg.state.companyHP, 100);
rpg.applyAnswer(false, 'sure');
assert.strictEqual(rpg.state.companyHP, 95, '自信ありの誤答でも帳簿信頼度は小さく下がり学習を妨げない');
rpg.applyAnswer(true, 'unsure');
assert.strictEqual(rpg.state.companyHP, 100, '訂正できれば帳簿信頼度を誤答時より速く回復する');
assert.deepStrictEqual(rpg.state.confidenceOutcomes, { sureCorrect:0, sureWrong:1, unsureCorrect:1, unsureWrong:0 }, '確信度と正誤の4象限をメタ認知データとして記録する');
const corruptValues = {
  'boki-rpg-progress-v2': JSON.stringify({ mode: 'invalid', answeredIds: 'J1', incorrectIds: ['unknown'], drafts: [], mistakeCounts: { J1: -2 }, completed: 'yes' }),
  'boki-rpg-character-v1': JSON.stringify({ xp: '999', rewardedIds: null, mastery: { 現金: { earned: 'bad', possible: 1 } }, companyHP: -80, totalTransactionAmount: -1 })
};
const corruptStorage = { getItem(key) { return corruptValues[key] || null; }, setItem() {} };
const recoveredProgress = new ProgressModel({ J1: {} }, corruptStorage);
assert.deepStrictEqual([recoveredProgress.state.mode, recoveredProgress.state.answeredIds.length, recoveredProgress.state.completed], ['story', 0, false], '破損した進捗の各フィールドを安全な初期値へ戻す');
const recoveredRpg = new RPGModel(corruptStorage);
assert.deepStrictEqual([recoveredRpg.state.xp, recoveredRpg.state.rewardedIds.length, recoveredRpg.state.companyHP, recoveredRpg.state.totalTransactionAmount], [0, 0, 0, 0], '破損したRPG状態を型検証し範囲内へ補正する');
const graduationQuestions = { J1:{ type:'journal' } };
for (const [prefix, type] of Object.entries({ L:'ledger', W:'worksheet', F:'financial_statement', C:'comprehensive' })) {
  for (let index = 1; index <= 3; index += 1) graduationQuestions[`${prefix}${index}`] = {
    type, category:index === 1 ? `${type}-foundation` : `${type}-application`, variantGroup:`${type}-structure-${Math.min(index, 2)}`
  };
}
const graduation = new ProgressModel(graduationQuestions, { getItem() { return null; }, setItem() {} }, 'graduation');
graduation.state.answeredIds = Object.keys(graduationQuestions);
graduation.state.correctIds = Object.keys(graduationQuestions);
graduation.state.examHistory = [{ points:80, setSignature:'set-a' }, { points:75, setSignature:'set-b' }];
const graduationRpg = { skillMastery:() => .8 };
assert.strictEqual(graduation.updateCompletion(graduationRpg), true, '主要mastery・実務形式・複数模試合格をすべて卒業条件とする');
graduation.state.correctIds = graduation.state.correctIds.filter(id => id !== 'L3');
assert.strictEqual(graduation.updateCompletion(graduationRpg), false, '各実務形式は異なる3問の正解証拠がなければ卒業扱いにしない');
graduation.state.correctIds.push('L3');
graduationQuestions.L2.category = graduationQuestions.L1.category;
graduationQuestions.L2.variantGroup = graduationQuestions.L1.variantGroup;
graduationQuestions.L3.category = graduationQuestions.L1.category;
graduationQuestions.L3.variantGroup = graduationQuestions.L1.variantGroup;
assert.strictEqual(graduation.updateCompletion(graduationRpg), false, '同一構造の数値違い3問だけでは実務形式の深度を満たさない');
graduationQuestions.L3.category = 'ledger-application';
graduationQuestions.L3.variantGroup = 'ledger-structure-2';
graduation.state.examHistory = [{ points:80, setSignature:'set-a' }];
assert.strictEqual(graduation.updateCompletion(graduationRpg), false, '模試1回だけで卒業扱いにしない');
graduation.state.correctIds = ['J1'];
graduation.state.examHistory = [{ points:80, setSignature:'set-a' }, { points:75, setSignature:'set-b' }];
assert.strictEqual(graduation.updateCompletion(graduationRpg), false, '実務問題は回答済みやmasteryだけでなく正解証拠を要求する');
const brokenJsonStorage = { getItem() { return '{broken'; }, setItem() { throw new Error('quota'); } };
const memoryProgress = new ProgressModel({ J1: {} }, brokenJsonStorage);
const memoryRpg = new RPGModel(brokenJsonStorage);
assert.doesNotThrow(() => { memoryProgress.record('J1', false); memoryRpg.applyAnswer(false); }, '壊れたJSONと書込不能なstorageでもメモリ上で動作を続ける');
assert.deepStrictEqual([memoryProgress.state.incorrectIds[0], memoryRpg.state.companyHP], ['J1', 95], 'storage障害時も現在セッションの状態を保持する');
assert.strictEqual(memoryProgress.record('unknown', false), false, '未定義の問題IDを進捗へ混入させない');
const confidenceProgress = new ProgressModel({ C1:{ category:'売掛金', difficulty:3 }, C2:{ category:'売掛金', difficulty:2 } }, storage, 'confidence-adaptive');
confidenceProgress.recordAttempt('C1', false, 30000, 'journal-entry', false, Date.now(), null, 'sure');
assert.strictEqual(confidenceProgress.state.attempts[0].confidence, 'sure', '回答前の確信度をattemptへ保存する');
assert.strictEqual(confidenceProgress.adaptiveDifficulty('売掛金'), 2, '自信あり誤答を強い思い込みとして次の難度調整へ接続する');

const html = fs.readFileSync('index.html', 'utf8');
const release = fs.readFileSync('service-worker.js', 'utf8').match(/const RELEASE = '([^']+)'/)[1];
assert(!/\sonclick=/.test(html), 'インラインイベントハンドラを置かない');
['story', 'training', 'review', 'exam'].forEach(mode => assert(html.includes(`view-${mode}`), `${mode}ビューが必要`));
assert(/<form id="question-form"[^>]*>[\s\S]*<button class="confirm-button" type="submit">回答を確定する<\/button>[\s\S]*<\/form>/.test(html), '回答欄はEnterキーで送信できるフォームにする');
const localAssets = [...html.matchAll(/(?:href|src)="((?:css|js|data)\/[^"?]+)([^"]*)"/g)];
assert(localAssets.length > 0 && localAssets.every(([, , query]) => query === `?v=${release}`), 'すべてのローカルCSS/JSに最新のキャッシュバスターを付ける');
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
browserSandbox.window.WrongAnswerFeedback = Feedback;
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
const operatorIndicator={textContent:''}; const operatorButtons=['＋','−','×','÷'].map(value=>({dataset:{calc:value},classList:{toggle(_name,on){this.active=on;}},setAttribute(name,value){this[name]=value;}}));
deskCalculator.document={getElementById:id=>id==='calculator-operator'?operatorIndicator:{value:'',textContent:''},querySelectorAll:()=>operatorButtons};
deskCalculator.calcKey('1'); deskCalculator.calcKey('2'); deskCalculator.calcKey('×');
assert.strictEqual(operatorIndicator.textContent,'×','選択中の演算子を表示する');
deskCalculator.calcKey('÷'); assert.strictEqual(operatorIndicator.textContent,'÷','演算子変更は表示と内部stateを同期する');
deskCalculator.resetCalculator=browserSandbox.window.AppController.prototype.resetCalculator; deskCalculator.calculatorTarget={}; deskCalculator.resetCalculator();
assert.deepStrictEqual([deskCalculator.expression,deskCalculator.calculator.operator,operatorIndicator.textContent,deskCalculator.calculatorTarget],['0',null,'',null],'問題遷移resetは表示・演算子・内部状態・転記先を消去する');
const questionDataSource = fs.readFileSync('data/questions.js', 'utf8');
vm.runInNewContext(`${questionDataSource}\nwindow.QuestionDataAudit = validateQuestionData();`, browserSandbox);
for (const [id, authored, mutated] of [['D019','insurance:160000','insurance:200000'],['F001','netIncome:180000','netIncome:220000']]) {
  const sourceMutationSandbox = { window:{} };
  const mutatedSource = questionDataSource.replace(authored, mutated);
  assert.notStrictEqual(mutatedSource, questionDataSource, `${id}のsource mutationが実際に適用される`);
  vm.runInNewContext(mutatedSource, sourceMutationSandbox);
  assert.strictEqual(sourceMutationSandbox.window.validateSemanticQuestionData().findings[id].status, 'INVALID', `${id}のロード前source answer改ざんを独立oracleで検出する`);
}
const sourceAnswerMutations = [
  ['J001', '"account": "現金"', '"account": "普通預金"'],
  ['J005', '"account": "売掛金"', '"account": "未収入金"'],
  ['J141', '"account": "前払保険料",\n          "amount": 50000', '"account": "未収入金",\n          "amount": 50000'],
  ['E002', '"debitAccount": "買掛金"', '"debitAccount": "未払金"'],
  ['J004', '"account": "買掛金"', '"account": "未払金"'],
  ['D020', 'profit:180000', 'profit:160000'],
  ['L039', 'profitTransfer:18000', 'profitTransfer:9000'],
  ['L040', 'lossA:120000', 'lossA:60000'],
  ['L044', "[50000,18000,32000]", "[50000,18000,50000]"],
  ['T001', '"total_debit": 1024000', '"total_debit": 410000'],
  ['E001', '"debitAccount": "広告宣伝費"', '"debitAccount": "備品"']
];
for (const [id, authored, mutated] of sourceAnswerMutations) {
  const mutationSandbox = { window:{} };
  const mutatedSource = questionDataSource.replace(authored, mutated);
  assert.notStrictEqual(mutatedSource, questionDataSource, `${id}のsource answer mutationが適用される`);
  vm.runInNewContext(mutatedSource, mutationSandbox);
  assert.strictEqual(mutationSandbox.window.validateSemanticQuestionData().findings[id].status, 'INVALID', `${id}のロード前source answer改ざんをanswerとは別管理のintegrity基準で検出する`);
}
const narrativeQuestions = Object.values(browserSandbox.window.QuestionData);
assert.strictEqual(new Set(narrativeQuestions.map(question => question.story)).size, narrativeQuestions.length, 'NARRATIVE-01: 全300問に固有の業務場面を持たせる');
assert.deepStrictEqual([...new Set(narrativeQuestions.map(question => question.chapter))].sort((a, b) => a - b), Array.from({ length:12 }, (_, index) => index + 1), 'NARRATIVE-02: 4月から決算までの12章を物語で網羅する');
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
['仕訳帳','受取手形記入帳','支払手形記入帳'].forEach(topic => assert(Object.values(browserSandbox.window.QuestionData).some(q => q.category === topic && q.materials?.length), `COVERAGE-02: ${topic}を資料から実際に完成する問題がある`));
assert.deepStrictEqual(JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.L042.table.inputCells)), ['received1','drawer1','drawn1','due1','bank1','description1','amount1','received2','drawer2','drawn2','due2','bank2','description2','amount2','total'], 'L042は金額だけでなく受取日・振出人・振出日・満期日・支払場所・摘要を2行とも採点する');
assert.deepStrictEqual(JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.L043.table.inputCells)), ['drawn1','payee1','due1','bank1','description1','amount1','drawn2','payee2','due2','bank2','description2','amount2','total'], 'L043は金額だけでなく振出日・受取人・満期日・支払場所・摘要を2行とも採点する');
assert.strictEqual(browserSandbox.window.QuestionData.L042.table.inputMetadata.received1.label, '1行目 受取日', 'L042は内部IDではなく利用者向けラベルを持つ');
assert.strictEqual(browserSandbox.window.QuestionData.L043.table.inputMetadata.due2.semanticType, 'date', 'L043の満期日は日付として採点する');
assert.strictEqual(Engine.grade(browserSandbox.window.QuestionData.L042, { cells:{ ...browserSandbox.window.QuestionData.L042.answer.cells, received1:'６月５日', drawn1:'06/04', due1:'８月３１日' } }).correct, true, 'L042は安全な日付表記揺れを正解にする');
assert.strictEqual(Engine.grade(browserSandbox.window.QuestionData.L042, browserSandbox.window.QuestionData.L042.answer).correct, true, 'L042の本試験型記入欄をすべて完成すると正解になる');
assert.strictEqual(Engine.grade(browserSandbox.window.QuestionData.L042, { cells:{ ...browserSandbox.window.QuestionData.L042.answer.cells, due1:'8/30' } }).correct, false, 'L042は満期日が違えば金額が合っていても不正解にする');
assert.strictEqual(Engine.grade(browserSandbox.window.QuestionData.L043, { cells:{ ...browserSandbox.window.QuestionData.L043.answer.cells, payee2:'北星物産' } }).correct, false, 'L043は受取人が違えば金額が合っていても不正解にする');
assert.strictEqual(browserSandbox.window.QuestionData.L040.answer.cells.lossA, 120000, '固定資産台帳で取得・月割償却・途中売却・売却損まで追跡する');
for (const id of ['C001','C002','C003']) {
  const question = browserSandbox.window.QuestionData[id];
  assert.strictEqual(question.format, 'exam-question-3', `${id}を本試験第3問型として識別する`);
  assert(question.materials.at(-1).内容.split('／').length >= 8, `${id}は8項目以上の決算整理を同時処理する`);
  assert(Object.keys(question.answer.cells).length >= 10, `${id}はP/L・B/S等の主要10項目以上を採点する`);
}
assert.strictEqual(new Set(['C001','C002','C003'].map(id => browserSandbox.window.QuestionData[id].variantGroup)).size, 3, '第3問級総合問題は数字変更でない3系統にする');
assert.strictEqual(browserSandbox.window.QuestionDataAudit.ok, true, `全問題の品質検証を通過する: ${browserSandbox.window.QuestionDataAudit.errors.join(', ')}`);
const semanticAudit = browserSandbox.window.validateSemanticQuestionData();
assert.strictEqual(semanticAudit.ok, true, `SEMANTIC: ${semanticAudit.errors.join(', ')}`);
assert.deepStrictEqual(JSON.parse(JSON.stringify(semanticAudit.counts)), { VALID:300, QUESTIONABLE:0, INVALID:0 }, '全300問のSemantic Auditを分類する');
assert.strictEqual(semanticAudit.eligibleIds.length, 300, '模試対象は自己申告ではなく独立Semantic監査結果から生成する');
const tamperedQuestions = { ...browserSandbox.window.QuestionData, J081: { ...browserSandbox.window.QuestionData.J081, answer: { debit:[{account:'租税公課',amount:58000}], credit:[{account:'現金',amount:58000}] } } };
const tamperedAudit = browserSandbox.window.validateSemanticQuestionData(tamperedQuestions);
assert.strictEqual(tamperedAudit.findings.J081.status, 'INVALID', '表示48,000円に対する正答58,000円を自己申告にかかわらず検出する');
assert(!tamperedAudit.eligibleIds.includes('J081'), 'Semantic不成立問題を模試対象から除外する');
for (const [label, answer] of [
  ['誤勘定', { debit:[{account:'資本金',amount:48000}], credit:[{account:'現金',amount:48000}] }],
  ['重複加算', { debit:[{account:'租税公課',amount:96000}], credit:[{account:'現金',amount:96000}] }],
  ['自己除算', { debit:[{account:'租税公課',amount:1}], credit:[{account:'現金',amount:1}] }],
  ['無関係な乗算', { debit:[{account:'租税公課',amount:2304000000}], credit:[{account:'現金',amount:2304000000}] }]
]) {
  const attacked = { ...browserSandbox.window.QuestionData, J081:{ ...browserSandbox.window.QuestionData.J081, answer } };
  assert.strictEqual(browserSandbox.window.validateSemanticQuestionData(attacked).findings.J081.status, 'INVALID', `SEMANTIC-REDTEAM: ${label}をVALIDにしない`);
}
const fixedAssetSale = browserSandbox.window.QuestionData.J137;
assert(fixedAssetSale.question.includes('取得原価300,000円') && fixedAssetSale.question.includes('減価償却累計額120,000円'), 'J137は間接法の仕訳に必要な取得原価と累計額を表示する');
assert.deepStrictEqual(JSON.parse(JSON.stringify(fixedAssetSale.answer.debit)), [{account:'未収入金',amount:220000},{account:'減価償却累計額',amount:120000}], 'J137は未収入金と減価償却累計額を借方計上する');
const j004Feedback = Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.J004, { debit:[{account:'仕入',amount:240000}], credit:[{account:'未払金',amount:240000}] }, { correct:false });
assert(j004Feedback.some(item => /商品仕入/.test(item.reason) && /買掛金/.test(item.reason) && /未払金/.test(item.reason) && /商品以外/.test(item.reason)), 'WAF-J004: 実際の誤答「未払金」と買掛金の意味の違いを説明する');
const j137Feedback = Feedback.diagnoseWrongAnswer(fixedAssetSale, { debit:[{account:'売掛金',amount:220000},{account:'減価償却累計額',amount:120000}], credit:fixedAssetSale.answer.credit }, { correct:false });
assert(j137Feedback.some(item => /営業取引/.test(item.reason) && /固定資産/.test(item.reason) && /未収入金/.test(item.reason)), 'WAF-J137: 売掛金と固定資産売却の未収入金を区別する');
const reverseFeedback = Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.J001, { debit:[{account:'資本金',amount:3000000}], credit:[{account:'現金',amount:3000000}] }, { correct:false });
assert(reverseFeedback.some(item => item.kind === 'side' && /資産/.test(item.reason) && /借方/.test(item.reason)), 'WAF-SIDE: 貸借逆転を勘定分類と増減ルールまで説明する');
const cashFeedback = Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.J017, { debit:[{account:'現金',amount:5000}], credit:[{account:'現金過不足',amount:5000}] }, { correct:false });
assert(cashFeedback.some(item => /帳簿上の現金/.test(item.reason) && /実際有高/.test(item.reason) && /一時的/.test(item.reason)), 'WAF-CASH: 現金過不足を一般的な資産増減ではなく帳簿と実際有高の差で説明する');
const amountFeedback = Feedback.diagnoseWrongAnswer(fixedAssetSale, { debit:[{account:'未収入金',amount:210000},{account:'減価償却累計額',amount:120000}], credit:fixedAssetSale.answer.credit }, { correct:false });
assert(amountFeedback.some(item => item.kind === 'amount' && /210,000円/.test(item.reason) && /220,000円/.test(item.reason) && /帳簿価額/.test(item.thinking)), 'WAF-AMOUNT: 誤入力・正しい値・計算過程を示す');
const adjustedTrialBalance = browserSandbox.window.QuestionData.D019;
assert.strictEqual(adjustedTrialBalance.answer.cells.debitTotal, adjustedTrialBalance.answer.cells.creditTotal, 'D019は貸借一致する完全な決算整理後残高試算表にする');
const tableFeedback = Feedback.diagnoseWrongAnswer(adjustedTrialBalance, { cells:{ ...adjustedTrialBalance.answer.cells, insurance:200000, prepaid:0 } }, { correct:false });
assert(tableFeedback.some(item => item.kind === 'cell' && /160,000円/.test(item.reason) && /200,000/.test(item.thinking) && /翌期分40,000円/.test(item.thinking) && !/insurance/.test(item.title + item.reason + item.nextRule)), 'WAF-TABLE: 人間向けラベルで正しい値・理由・計算根拠を示す');
const closingFeedback = Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.D020, { cells:{ ...browserSandbox.window.QuestionData.D020.answer.cells, profit:160000 } }, { correct:false });
assert(closingFeedback.some(item => /800,000/.test(item.thinking) && /400,000/.test(item.thinking) && /180,000/.test(item.thinking)), 'WAF-CLOSING: 損益振替の利益計算式を示す');
const correctionFeedback = Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.E001, { cells:{ ...browserSandbox.window.QuestionData.E001.answer.cells, debitAccount:'消耗品費' } }, { correct:false });
assert(correctionFeedback.some(item => /誤仕訳を逆仕訳で取り消し/.test(item.reason) && !/debitAccount/.test(JSON.stringify(item))), 'WAF-CORRECTION: 訂正仕訳固有の手順を内部IDなしで説明する');
assert.deepStrictEqual(Feedback.diagnoseWrongAnswer(browserSandbox.window.QuestionData.J004, browserSandbox.window.QuestionData.J004.answer, { correct:true }), [], 'WAF-CORRECT: 正答時は誤答診断を生成しない');
for (const question of Object.values(browserSandbox.window.QuestionData)) {
  const blank = question.type === 'journal' ? { debit:[], credit:[] } : { cells:{} };
  const diagnostics = Feedback.diagnoseWrongAnswer(question, blank, { correct:false });
  assert(diagnostics.length > 0 && diagnostics.every(item => item.reason && item.thinking && item.nextRule), `WAF-COVERAGE: ${question.id}に理由・考え方・次回ルールがある`);
}
for (const id of ['D019','F001','L044','D020','T001','E001']) {
  const original = browserSandbox.window.QuestionData[id]; const first = Object.keys(original.answer.cells)[0];
  const attacked = { ...browserSandbox.window.QuestionData, [id]:{ ...original, answer:{ cells:{ ...original.answer.cells, [first]:Number(original.answer.cells[first]) + 1 } } } };
  assert.strictEqual(browserSandbox.window.validateSemanticQuestionData(attacked).findings[id].status, 'INVALID', `SEMANTIC-TABLE-REDTEAM: ${id}のセル改ざんをVALIDにしない`);
}
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
const poolContext = { ids: Object.keys(browserSandbox.window.QuestionData), questions: browserSandbox.window.QuestionData };
poolContext.examCandidateIds = browserSandbox.window.AppController.prototype.examCandidateIds;
poolContext.learningIds = browserSandbox.window.AppController.prototype.learningIds;
const storyOrder = browserSandbox.window.AppController.prototype.storyIds.call(poolContext);
assert(storyOrder.length > 0 && storyOrder.every(id => browserSandbox.window.QuestionData[id].learningRole !== 'review'), 'ストーリーはdue前のreview問題を露出しない');
['correction','worksheet','financial_statement','comprehensive'].forEach(type => assert(storyOrder.some(id => browserSandbox.window.QuestionData[id].type === type), `Storyで${type}をExam前に学べる`));
assert(storyOrder.every((id, index) => index === 0 || browserSandbox.window.QuestionData[storyOrder[index - 1]].chapter <= browserSandbox.window.QuestionData[id].chapter), 'ストーリーのChapterが逆行しない');
const examAudit = { ...poolContext, model: { state: { examAttempt: 0 } }, semanticAudit };
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
const poolSeparation={...poolContext,model:{state:{mode:'training'}},reviewIds(){return[];},buildExamIds(){return examIds;},storyIds(){return[];}};
const trainingIds=browserSandbox.window.AppController.prototype.modeIds.call(poolSeparation);
assert.strictEqual(examIds.some(id=>trainingIds.includes(id)),false,'Training PoolとExam Poolで同じQuestion IDを使わない');
assert.strictEqual(examIds.some(id=>storyOrder.includes(id)),false,'Story ExposureとExam Poolで同じQuestion IDを使わない');
assert(trainingIds.every(id=>browserSandbox.window.QuestionData[id].learningRole!=='review'),'Trainingはdue前review問題を露出しない');
['correction','worksheet','financial_statement','comprehensive'].forEach(type => assert(trainingIds.some(id => browserSandbox.window.QuestionData[id].type === type), `Trainingで${type}をExam前に学べる`));
assert(examIds.every(id=>browserSandbox.window.QuestionData[id].learningRole==='transfer'),'Exam Poolは初見転移用Questionへ限定する');
['L034','L035','L036','L041','L042','L043'].forEach(id => {
  const prerequisites = browserSandbox.window.QuestionData[id].curriculumPrerequisites;
  assert(prerequisites.length >= 3, `${id}はCore/Drillから特殊帳簿へ接続する複数の前提演習を持つ`);
  assert(prerequisites.every(prerequisite => ['core','drill'].includes(browserSandbox.window.QuestionData[prerequisite].learningRole)), `${id}の前提演習はExam転移問題を参照しない`);
  assert(prerequisites.every(prerequisite => storyOrder.indexOf(prerequisite) < storyOrder.length), `${id}の前提演習はStoryで模試前に学習できる`);
});
const prerequisiteContext = {
  questions:browserSandbox.window.QuestionData,
  model:{state:{correctIds:[]}},
  examCandidateIds:poolContext.examCandidateIds,
  examPrerequisiteIds:examPrototype.examPrerequisiteIds
};
const requiredBeforeExam = examPrototype.examPrerequisiteIds.call(prerequisiteContext);
assert(requiredBeforeExam.includes('J148') && requiredBeforeExam.includes('J149') && requiredBeforeExam.includes('J150'), '手形の受入・振出・満期決済を模試前の実演習として要求する');
assert.deepStrictEqual(
  examPrototype.unmetExamPrerequisites.call(prerequisiteContext),
  requiredBeforeExam,
  '未正解のCore/Drill前提を実行時の模試ゲートへ接続する'
);
prerequisiteContext.model.state.correctIds = [...requiredBeforeExam];
assert.strictEqual(examPrototype.unmetExamPrerequisites.call(prerequisiteContext).length, 0, '全前提の正解後に模試ゲートを解放する');
assert.strictEqual(examIds.length, 15, '模試は設計通り15問を選出する');
const routeRpg = new RPGModel({ getItem(){ return null; }, setItem(){} }, 'route-xp');
Object.values(browserSandbox.window.QuestionData).forEach(question => routeRpg.reward(question, { correct:true, ratio:1, earned:1, possible:1 }));
const theoreticalXp = Object.values(browserSandbox.window.QuestionData).reduce((sum, question) => sum + 20 * question.difficulty, 0);
assert.strictEqual(routeRpg.state.xp, theoreticalXp, 'Story・Training・Examを共通のreward-once経路で完遂した実到達XPを集計する');
assert(routeRpg.level === 30 && routeRpg.state.xp >= 12615, 'Exam候補を含む正当な全問題完遂でLv.30へ到達できる');
const beforeDuplicate = routeRpg.state.xp;
assert.strictEqual(routeRpg.reward(browserSandbox.window.QuestionData[examIds[0]], { ratio:1, earned:1, possible:1 }), false, 'Exam再受験でも同一問題のXPを二重取得できない');
assert.strictEqual(routeRpg.state.xp, beforeDuplicate, '重複報酬拒否後もXPは不変である');
let relatedStarted=''; let relatedSaved=false;
const relatedContext={questions:browserSandbox.window.QuestionData,model:{state:{mode:'story'},save(){relatedSaved=true;}},examCandidateIds:poolContext.examCandidateIds,ids:poolContext.ids,renderModes(){},start(id){relatedStarted=id;}};
assert.strictEqual(examPrototype.openRelated.call(relatedContext,'J001'),true,'Knowledge Linkが実在する学習問題へ遷移する');
assert.deepStrictEqual([relatedContext.model.state.mode,relatedSaved,relatedStarted],['training',true,'J001'],'Knowledge Linkは実在しないsetModeではなく保存済みstateを更新する');
assert.strictEqual(examPrototype.openRelated.call(relatedContext,examIds[0]),false,'Knowledge Linkから未見Exam Poolを露出しない');
const knowledgeEdges = Object.values(browserSandbox.window.QuestionData).flatMap(source => Object.values(source.knowledgeLinks || {}).flatMap(ids => (Array.isArray(ids) ? ids : [ids]).map(target => ({ source:source.id, target }))));
for (const edge of knowledgeEdges) {
  relatedStarted = '';
  assert.strictEqual(examPrototype.openRelated.call(relatedContext, edge.target), true, `${edge.source}→${edge.target}のKnowledge LinkをController経路で開ける`);
  assert.strictEqual(relatedStarted, edge.target, `${edge.source}→${edge.target}のクリック先が対象問題と一致する`);
}
assert.strictEqual(knowledgeEdges.length, 27, '全27 Knowledge Link edgeをE2E対象にする');
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
assert(controllerSource.includes('this.view.result(question, score, answer, confidence, achievement)'), '採点結果画面へ回答者の仕訳と達成通知を渡す');
assert(controllerSource.includes('writable = false'), 'QuotaExceededErrorの反復を避けてストレージをFail-Safe化する');
assert(viewSource.includes('confidence-feedback') && viewSource.includes('achievement-banner'), '確信度校正とレベル・役職解放を結果画面で強調する');
assert(viewSource.includes("heading.textContent = 'あなたの仕訳（誤答）'"), '回答者が入力した誤答を表示する');
assert(viewSource.includes("heading.textContent = 'なぜ間違えた？'") && viewSource.includes('diagnostic.nextRule'), '誤答理由と次回の判別ポイントを表示する');
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
assert.strictEqual(browserSandbox.window.AppView.prototype.tableLabel('acquisitionCost'), '取得原価', '表の英語見出しを日本語で表示する');
assert.strictEqual(browserSandbox.window.AppView.prototype.tableLabel('debitAccount'), '借方科目', '表内の内部用英語IDを日本語で表示する');
assert.strictEqual(browserSandbox.window.AppView.prototype.tableLabel('現金'), '現金', '日本語の表示値はそのまま保つ');
assert(viewSource.includes('row.append(select, amount)'), 'iPhoneでも4つの入力要素を仕訳行の直下に配置する');
assert(viewSource.includes("inputType === 'amount'") && viewSource.includes("this.makeText('table-input'"), '表セルの明示型に応じて金額入力と日本語文字入力を分ける');
assert(viewSource.includes("this.byId('q-context').textContent = question.story"), 'ストーリーモードで問題の場面と物語を表示する');
assert(!cssSource.includes('display: contents'), 'iPhoneの仕訳配置をdisplay: contentsに依存させない');
assert(html.includes(`css/style.css?v=${release}`) && html.includes(`js/view.js?v=${release}`), 'iPhone Chromeに改修後のCSSとJSを再読み込みさせる');
assert(html.includes('name="format-detection" content="telephone=no"'), 'iPhoneで金額を電話番号リンクとして誤認しない');
assert(!html.includes('maximum-scale=1'), 'ユーザーのピンチズームを制限しない');
assert(html.includes('readonly inputmode="numeric"'), '電卓表示にもiPhone向けの数値入力属性を付ける');
assert(html.includes('id="result-status" class="result-box" role="status" aria-live="polite"'), '動的な採点結果をスクリーンリーダーへ通知する');
assert(!html.includes('資金ショート') && !html.includes('XP 3倍'), '誤答で学習を遮断する資金ショートと確信度ギャンブルを表示しない');
assert(!html.includes('pattern="[0-9]*"'), 'カンマや演算子を表示する入力欄へ不整合なpattern制約を付けない');
assert(controllerSource.includes("querySelector?.('.amount-input.calculator-selected')"), '電卓は選択クラスの付いた金額欄も転記先として復元する');
assert(!controllerSource.includes('confidence === \'bold\' ? 3 : 1'), '確信度をXP倍率へ接続しない');
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
// 第3問は表示資料から独立再計算し、answer改ざんを検出する。
const c001Proof = browserSandbox.window.validateExamQuestion3(browserSandbox.window.QuestionData.C001);
assert.strictEqual(c001Proof.trialBalance.debit, c001Proof.trialBalance.credit, 'C001整理前試算表の貸借が一致する');
assert.strictEqual(c001Proof.statements.bsDebit, c001Proof.statements.bsCredit, 'C001決算後B/Sが一致する');
assert.strictEqual(c001Proof.valid, true, 'C001全answerを独立再計算できる');
assert.strictEqual(browserSandbox.window.validateExamQuestion3(browserSandbox.window.QuestionData.C003).derivedCells.rentRevenue, 80000, 'C003は12月から3月まで4か月を当期収益にする');
const c002Proof = browserSandbox.window.validateExamQuestion3(browserSandbox.window.QuestionData.C002);
assert.deepStrictEqual(JSON.parse(JSON.stringify(browserSandbox.window.journalEffectsForEvent({type:'unrecordedCashSale',netAmount:50000,taxRate:.10,taxMethod:'exclusive'}))), {debit:[{account:'現金',amount:55000}],credit:[{account:'売上',amount:50000},{account:'仮受消費税',amount:5000}],netAmount:50000,taxAmount:5000,cashReceipt:55000}, '税抜未記帳現金売上eventから複数勘定の仕訳効果を一度だけ生成する');
assert.deepStrictEqual(JSON.parse(JSON.stringify({ output:144000 + 50000 * .10, input:96000 + 70000 * .10, payable:c002Proof.derivedCells.vatPayable })), { output:149000, input:103000, payable:46000 }, 'C002は未処理売上・仕入の10%を仮受・仮払へ加えて未払消費税を再計算する');
assert.deepStrictEqual(JSON.parse(JSON.stringify({cashReceipt:Math.round(50000*(1+.10)),cashShortage:c002Proof.derivedCells.cashShortage,netIncome:c002Proof.derivedCells.netIncome})), {cashReceipt:55000,cashShortage:10000,netIncome:-382000}, 'C002は取引イベントを現金55,000円、雑損10,000円、当期純損失382,000円まで波及させる');
for (const id of ['C001','C002','C003']) {
  const original=browserSandbox.window.QuestionData[id]; const first=Object.keys(original.answer.cells)[0];
  const attacked={...original,answer:{cells:{...original.answer.cells,[first]:Number(original.answer.cells[first])+1}}};
  assert.strictEqual(browserSandbox.window.validateExamQuestion3(attacked).valid,false, `${id}の不正answerを第3問validatorが検出する`);
}
const materialAttack=JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.C001));
materialAttack.materials.find(row => row.資料区分 === '整理前残高試算表').借方 = materialAttack.materials.find(row => row.資料区分 === '整理前残高試算表').借方.replace('現金400,000','現金999,999');
assert.strictEqual(browserSandbox.window.validateExamQuestion3(materialAttack).valid,false,'C001の表示materialsだけを改ざんすると明細・合計・貸借の再計算で検出する');
const missingTaxRate=JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.C002));
missingTaxRate.question=missingTaxRate.question.replace('本問の商品は標準税率10%の課税取引であり、','');
assert.strictEqual(browserSandbox.window.validateExamQuestion3(missingTaxRate).valid,false,'C002は問題文から税率を削除するとSemantic INVALIDになる');
const c002MaterialAttack=JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.C002));
c002MaterialAttack.materials.find(row => row.資料区分 === '整理前残高').内容=c002MaterialAttack.materials.find(row => row.資料区分 === '整理前残高').内容.replace('売上1,800,000','売上9,800,000');
assert.strictEqual(browserSandbox.window.validateExamQuestion3(c002MaterialAttack).valid,false,'C002の表示materialsだけの売上改ざんを検出する');
const c003MaterialAttack=JSON.parse(JSON.stringify(browserSandbox.window.QuestionData.C003));
c003MaterialAttack.materials.find(row => row.資料区分 === '整理前残高').内容=c003MaterialAttack.materials.find(row => row.資料区分 === '整理前残高').内容.replace('売掛金400,000','売掛金900,000');
assert.strictEqual(browserSandbox.window.validateExamQuestion3(c003MaterialAttack).valid,false,'C003の表示materialsだけの売掛金改ざんを検出する');
const mutate = (id, change) => { const copy=JSON.parse(JSON.stringify(browserSandbox.window.QuestionData[id])); change(copy); return browserSandbox.window.validateExamQuestion3(copy).valid; };
assert.strictEqual(mutate('C002', q => { q.question=q.question.replace('10%','8%'); }),false,'C002税率変更で必要な現金・VAT・利益が変わるため不整合を検出する');
assert.strictEqual(mutate('C002', q => { q.materials.at(-1).内容=q.materials.at(-1).内容.replace('年10%','年20%'); }),false,'C002減価償却率変更を検出する');
assert.strictEqual(mutate('C001', q => { q.materials.at(-1).内容=q.materials.at(-1).内容.replace('2%','3%'); }),false,'C001貸倒率変更を検出する');
assert.strictEqual(mutate('C001', q => { q.materials.at(-1).内容=q.materials.at(-1).内容.replace('10月1日','11月1日'); }),false,'C001保険開始月変更を検出する');
assert.strictEqual(mutate('C003', q => { q.materials[0].内容=q.materials[0].内容.replace(/3月31日/g,'2月28日'); }),false,'C003決算日変更を検出する');

const reviewQuestions=Object.fromEntries(['A','B','C','X','Y','Z'].map((id,index)=>[id,{id,category:'same-concept',difficulty:2,learningRole:index<3?'core':'review'}]));
const reviewModel=new ProgressModel(reviewQuestions,{getItem(){return null;},setItem(){}},'review-source-redteam');
['A','B','C'].forEach(id=>reviewModel.record(id,false,0));
const reviewController={model:reviewModel,questions:reviewQuestions,reviewMappings:new Map()};
reviewController.reviewIds=browserSandbox.window.AppController.prototype.reviewIds;
const reviewIds=reviewController.reviewIds.call(reviewController);
assert.strictEqual(new Set(reviewIds).size,3,'同conceptの3件同時dueに衝突しない復習問題を割り当てる');
const reverse=[...reviewIds].reverse();
reverse.forEach(id=>{ const mapping=reviewController.reviewMappings.get(id); reviewModel.record(mapping.sourceQuestionId,true,mapping.dueAt); });
assert.deepStrictEqual(['A','B','C'].map(id=>reviewModel.state.reviewSchedule[id].stage),[1,1,1],'B/C/A順でも明示source mappingにより各sourceだけのstageを進める');
// SPACING_CONSTRAINT > ADAPTIVE_RECOMMENDATION: future-due sources are locked,
// even when the adaptive engine ranks them above an unscheduled variant.
const isolationStoreValues={}; const isolationStore={getItem:key=>isolationStoreValues[key]||null,setItem:(key,value)=>{isolationStoreValues[key]=value;}};
const isolationQuestions=Object.fromEntries(['A','B','C','D','V'].map(id=>[id,{id,category:'shared',difficulty:2,learningRole:id==='V'?'review':'core'}]));
const isolationModel=new ProgressModel(isolationQuestions,isolationStore,'spacing-isolation');
const isolationNow=Date.now(); ['A','B','C','D'].forEach(id=>isolationModel.record(id,false,isolationNow));
isolationModel.state.reviewSchedule={A:{stage:0,dueAt:isolationNow-1},B:{stage:1,dueAt:isolationNow+86400000},C:{stage:2,dueAt:isolationNow+259200000},D:{stage:3,dueAt:isolationNow+604800000}};
isolationModel.recommendedIds=()=>['B','C','D','V','A'];
const isolationController={model:isolationModel,questions:isolationQuestions,reviewMappings:new Map(),reviewIds:browserSandbox.window.AppController.prototype.reviewIds};
const isolatedIds=isolationController.reviewIds.call(isolationController);
assert.deepStrictEqual(isolatedIds,['V'],'R1/R2: due Aのvariantにfuture-due B/C/Dを使用しない');
const assignment=isolationModel.state.reviewAssignments.A;
assert.deepStrictEqual([assignment.sourceQuestionId,assignment.reviewQuestionId,assignment.stage,assignment.status],['A','V',0,'assigned'],'明示review assignmentへsource/variant/stage/statusを保存する');
isolationModel.completeReview('A',false,isolationNow);
assert.deepStrictEqual(['B','C','D'].map(id=>isolationModel.state.reviewSchedule[id].stage),[1,2,3],'R3: Aのvariant誤答はfuture-due B/C/Dのstageを変更しない');
isolationModel.state.reviewSchedule.A={stage:0,dueAt:isolationNow-1}; isolationModel.state.incorrectIds=['A','B','C','D'];
isolationController.reviewIds.call(isolationController); isolationModel.save();
const reloadedIsolation=new ProgressModel(isolationQuestions,isolationStore,'spacing-isolation');
assert.strictEqual(reloadedIsolation.state.reviewAssignments.A.reviewQuestionId,'V','R7: reload後も明示review assignmentを復元する');
let reviewNextShown='';
const reviewNextContext={currentId:'V',questions:isolationQuestions,model:isolationModel,modeIds(){return ['D'];},start(id){reviewNextShown=id;},renderModes(){},showMode(){}};
isolationModel.state.mode='review'; isolationModel.recommendedIds=()=>['B'];
browserSandbox.window.AppController.prototype.next.call(reviewNextContext);
assert.strictEqual(reviewNextShown,'D','R4/R5: review modeの次dueをAdaptive推薦より優先する');
const adaptive = new ProgressModel({J001:browserSandbox.window.QuestionData.J001}, storage, 'adaptive-test');
for (let i=0;i<3;i+=1) adaptive.recordAttempt('J001',true,30000,'',i===2);
assert.strictEqual(adaptive.adaptiveDifficulty(browserSandbox.window.QuestionData.J001.category),Math.min(4,browserSandbox.window.QuestionData.J001.difficulty+1),'高速・高正答・遅延成功で難化する');
adaptive.recordAttempt('J001',false,90000,'account'); adaptive.recordAttempt('J001',false,90000,'account');
assert.strictEqual(adaptive.adaptiveDifficulty(browserSandbox.window.QuestionData.J001.category),Math.max(1,browserSandbox.window.QuestionData.J001.difficulty-1),'同concept連続誤答で易化する');
const placementQuestions={
  basic:{id:'basic',chapter:1,difficulty:1,learningRole:'core'},
  middle:{id:'middle',chapter:4,difficulty:2,learningRole:'drill'},
  closing:{id:'closing',chapter:7,difficulty:3,learningRole:'core'}
};
const placement=new ProgressModel(placementQuestions,storage,'placement-test');
const startA=placement.placementStart({foundation:95,closing:30});
const startB=placement.placementStart({foundation:20,closing:10});
assert.notStrictEqual(startA,startB,'初期診断の基礎95・決算30と基礎20・決算10で開始地点を変える');
assert.deepStrictEqual([startA,startB],['closing','basic'],'診断結果を章の開始地点へ接続する');
const placementValues={}; const placementStorage={getItem:key=>placementValues[key]||null,setItem:(key,value)=>{placementValues[key]=value;}};
const firstLaunch=new ProgressModel(placementQuestions,placementStorage,'placement-e2e');
assert.strictEqual(firstLaunch.state.placement,null,'初回起動ではPlacementが未完了である');
assert.strictEqual(firstLaunch.completePlacement({foundation:95,closing:30},1234),'closing','診断完了が実際の開始問題を決める');
const reloadedPlacement=new ProgressModel(placementQuestions,placementStorage,'placement-e2e');
assert.deepStrictEqual([reloadedPlacement.state.placement.startQuestionId,reloadedPlacement.state.currentQuestionId],['closing','closing'],'Placement結果と開始地点をreload後も維持する');
const placementMarkup=html.match(/<form id="placement-form">[\s\S]*?<\/form>/)[0];
const fieldsets=[...placementMarkup.matchAll(/<fieldset data-domain="(foundation|closing)">([\s\S]*?)<\/fieldset>/g)];
assert.strictEqual(fieldsets.length,16,'Placementは基礎・商品売買・債権債務・固定資産・帳簿・試算表・決算整理・財務諸表を測る');
const firstChoiceCorrect=fieldsets.filter(([, ,body])=>body.match(/<input[^>]+value="([^"]+)"/)[1] === 'correct').length;
assert.strictEqual(firstChoiceCorrect,8,'Placementの正答位置を1番目と2番目に均等配置する');
assert(/9\. 期末商品[\s\S]*?value="correct">借：繰越商品／貸：仕入/.test(placementMarkup),'Placement Q9は借方・繰越商品／貸方・仕入を正答とする');
assert.strictEqual(firstChoiceCorrect/fieldsets.length,.5,'常に1番目を選ぶBotは高得点にならない');
const legacyValues={legacy:JSON.stringify({answeredIds:['basic'],attempts:[{questionId:'basic',correct:true,responseMs:1000}],currentQuestionId:'middle'})};
const legacy=new ProgressModel(placementQuestions,{getItem:key=>legacyValues[key]||null,setItem:(key,value)=>{legacyValues[key]=value;}},'legacy');
assert.strictEqual(legacy.migrateLegacyPlacement(2000),true,'学習履歴のある旧ユーザーにPlacementを強制しない');
assert.strictEqual(legacy.state.currentQuestionId,'middle','Migrationは旧ユーザーの現在位置を上書きしない');
legacy.resetPlacement();
assert.deepStrictEqual([legacy.state.placement,legacy.state.answeredIds], [null,['basic']],'再診断は既存の学習履歴を削除しない');
const spacingQuestions={core:{id:'core',category:'concept',chapter:1,difficulty:1,learningRole:'core'},review:{id:'review',category:'concept',chapter:1,difficulty:1,learningRole:'review'},transfer:{id:'transfer',category:'concept',chapter:1,difficulty:2,learningRole:'transfer'}};
const spacingModel=new ProgressModel(spacingQuestions,{getItem(){return null;},setItem(){}},'scheduler-e2e');
spacingModel.record('core',true,1000);
assert.strictEqual(spacingModel.dueReviewIds(1001).length,0,'core正答直後はreviewを解禁しない');
assert.strictEqual(spacingModel.recommendedIds('concept')[0],'core','未回答優先よりRoleとAssessment隔離を優先する');
assert.deepStrictEqual(spacingModel.dueReviewIds(1000+20*60*1000),['core'],'20分後はspacing対象を優先対象にする');
const integrationQuestions=Object.fromEntries(Object.entries(browserSandbox.window.QuestionData).filter(([,q]) => q.category === browserSandbox.window.QuestionData.J001.category));
const integrationModel=new ProgressModel(integrationQuestions,{getItem(){return null;},setItem(){}},'controller-adaptive');
let integrationShown=''; const integrationQuestion=integrationQuestions.J001;
const controllerIntegration={submitting:false,currentId:'J001',questionStartedAt:Date.now()-3600,reviewSourceId:null,questions:integrationQuestions,model:integrationModel,
  view:{readAnswer:()=>integrationQuestion.answer,updateRpg(){},result(){},show(){}},rpg:{state:{companyHP:100},recordMastery(){},reward(){},applyAnswer(){}},
  document:{querySelector(){return null;}},showGameOver(){},start(id){integrationShown=id;},modeIds(){return[];},renderModes(){},showMode(){}};
browserSandbox.window.GradingEngine=Engine;
browserSandbox.window.AppController.prototype.submit.call(controllerIntegration);
assert(integrationModel.state.attempts[0].responseMs >= 3600 && integrationModel.state.attempts[0].responseMs < 5000,'Controllerは問題表示時刻から回答確定時刻までの実時間をrecordAttemptへ渡す');
assert.strictEqual(integrationModel.state.attempts[0].questionId,'J001','Controller回答フローがquestionId・concept・difficultyを含むattemptを保存する');
browserSandbox.window.AppController.prototype.next.call(controllerIntegration);
assert.notStrictEqual(integrationShown,'J051','core正答直後に同conceptのreview問題を表示しない');
const {evaluateRows,demonstratesTransfer}=require('../scripts/audit-exam-readiness.js');
assert.strictEqual(evaluateRows([{type:'journal',category:'x',answer:{},difficulty:1}])[0].pass,false,'learnability Cは問題数だけでPASSしない');
const transferPair=[{type:'ledger',question:'金額を記入',table:{columns:['金額'],inputCells:['a']},materials:[{金額:1}]},{type:'ledger',question:'台帳を完成',table:{columns:['日付','摘要'],inputCells:['a','b']},materials:[{日付:'4/1'}]}];
assert.strictEqual(demonstratesTransfer(transferPair),true,'transfer metadataなしでも構造差から転移を評価する');
console.log('app tests: ok');
