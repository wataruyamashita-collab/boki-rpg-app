const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const confirmPosition = html.indexOf('>仕訳を確定する</button>');
const savePosition = html.indexOf('>ここまで保存する</button>');
assert(confirmPosition >= 0, '「仕訳を確定する」ボタンが必要です');
assert(savePosition >= 0, '「ここまで保存する」ボタンが必要です');
assert(confirmPosition < savePosition, '確定ボタンは保存ボタンより先に配置してください');
assert(/question-actions[\s\S]*confirm-button[\s\S]*save-button/.test(html), '操作ボタンの順序を固定するクラスが必要です');

let calculatorClick;
let inputEvents = 0;
const amountInput = {
  value: '',
  focus() {},
  getAttribute() { return '借方 1行目の金額'; },
  dispatchEvent(event) { if (event.type === 'input') inputEvents += 1; }
};
const elements = {
  'calculator-keys': {
    addEventListener(type, listener) { if (type === 'click') calculatorClick = listener; }
  },
  'calculator-insert': { addEventListener() {} },
  'calculator-target': { textContent: '' },
  'calculator-display': { value: '' }
};
const context = {
  console,
  Event,
  window: {},
  document: {
    addEventListener() {},
    body: { contains(element) { return element === amountInput; } },
    getElementById(id) { return elements[id]; },
    querySelectorAll() { return []; }
  }
};
vm.createContext(context);
vm.runInContext(`${fs.readFileSync('js/app.js', 'utf8')};this.testApp = App;`, context);
assert.strictEqual(context.window.App, context.testApp, 'Appをwindowへ公開してください');

context.testApp.calculatorTarget = amountInput;
context.testApp.calculatorExpression = '1200＋300';
context.testApp.setupCalculator();
const equalsButton = { dataset: { calc: '＝' }, parentElement: elements['calculator-keys'] };
calculatorClick({ target: equalsButton, currentTarget: elements['calculator-keys'] });
assert.strictEqual(amountInput.value, '1,500', '計算結果を仕訳金額欄へ転記してください');
assert.strictEqual(inputEvents, 1, '転記時にinputイベントを発火してください');
assert.strictEqual(elements['calculator-display'].value, '1,500', '電卓の計算結果を3桁カンマ付きで表示してください');

context.testApp.calculatorExpression = '1234567＋8900.5';
context.testApp.updateCalculatorDisplay();
assert.strictEqual(elements['calculator-display'].value, '1,234,567＋8,900.5', '計算途中の各数値にも3桁カンマを表示してください');

console.log('app tests: ok');
