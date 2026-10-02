'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const RPGModel = require('../js/rpg');

const controllerSource = fs.readFileSync('js/controller.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const sandbox = { window:{ RPGModel }, Event:class Event {}, queueMicrotask(fn){ fn(); } };
vm.runInNewContext(controllerSource, sandbox);
const Controller = sandbox.window.AppController;

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.className = '';
    this.textContent = '';
    this.attributes = {};
    this.max = 0;
    this.value = 0;
    this.type = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
}
const flatten = node => [node.textContent, ...node.children.flatMap(flatten)].filter(Boolean).join(' ');
const findAll = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...node.children.flatMap(child => findAll(child, predicate))
];

const questions = {
  A1:{id:'A1',type:'journal',category:'現金',learningRole:'core'},
  A2:{id:'A2',type:'journal',category:'現金',learningRole:'review'},
  B1:{id:'B1',type:'ledger',category:'帳簿',learningRole:'core'},
  C1:{id:'C1',type:'worksheet',category:'決算整理',learningRole:'core'},
  C2:{id:'C2',type:'worksheet',category:'決算整理',learningRole:'drill'},
  C3:{id:'C3',type:'worksheet',category:'決算整理',learningRole:'transfer'},
  D1:{id:'D1',type:'journal',category:'商品売買',learningRole:'core'},
  E1:{id:'E1',type:'financial_statement',category:'財務諸表',learningRole:'core'},
  E2:{id:'E2',type:'financial_statement',category:'財務諸表',learningRole:'exam'}
};

const mastery = {
  A1:{attempts:0,state:'未着手'},
  B1:{attempts:1,state:'学習中'},
  C1:{attempts:3,state:'定着'},
  C2:{attempts:3,state:'定着'},
  D1:{attempts:2,state:'学習中'},
  E1:{attempts:3,state:'定着'}
};
const priorities = {
  A1:{tier:4,reasons:['まだ回答していない問題です']},
  B1:{tier:5,reasons:['現在の学習順で進められます']},
  C1:{tier:5,reasons:['現在の学習順で進められます']},
  C2:{tier:5,reasons:['現在の学習順で進められます']},
  D1:{tier:1,reasons:['直近の回答が誤答です']},
  E1:{tier:0,reasons:['復習期限を過ぎています']}
};
let due = ['E1'];
const priorityByCategory = {
  現金:['A1'],
  帳簿:['B1'],
  決算整理:['C1','C2'],
  商品売買:['D1'],
  財務諸表:['E1']
};
const model = {
  state:{marker:'progress-immutable'},
  dueReviewIds(){ return [...due]; },
  learningMastery(id){ return mastery[id] || null; },
  studyPriority(id){ return priorities[id] || null; },
  priorityStudyIds({category}){ return [...(priorityByCategory[category] || [])]; }
};
const storage = { getItem(){ return null; }, setItem(){ return true; } };
const rpg = new RPGModel(storage, 'phase4b-rpg');
rpg.state.mastery = {
  '@skill:仕訳':{earned:8,possible:10},
  '@skill:帳簿':{earned:1,possible:2},
  '@skill:決算整理':{earned:3,possible:4},
  '@skill:財務諸表':{earned:9,possible:10}
};

const areaNode = new FakeNode('section');
const documentStub = {
  createElement(tagName){ return new FakeNode(tagName); },
  getElementById(id){ return id === 'rpg-areas' ? areaNode : null; }
};
const context = { document:documentStub, model, rpg, questions };
context.rpgAreas = now => Controller.prototype.rpgAreas.call(context, now);

let areas = Controller.prototype.rpgAreas.call(context, 1000);
assert.deepStrictEqual(Array.from(areas, area => area.category), ['現金','帳簿','決算整理','商品売買','財務諸表'], 'authored category orderを維持する');

const cash = areas.find(area => area.category === '現金');
assert.strictEqual(cash.total, 1, 'review roleを攻略エリア母数から除外する');
assert.strictEqual(cash.state, '未着手');
assert.strictEqual(cash.settledCount, 0);
assert.strictEqual(cash.percent, 0);

const ledger = areas.find(area => area.category === '帳簿');
assert.strictEqual(ledger.state, '攻略中');
assert.strictEqual(ledger.skill, '帳簿');
assert.strictEqual(ledger.skillMastery, .5);

const closing = areas.find(area => area.category === '決算整理');
assert.strictEqual(closing.total, 2, 'transfer roleを攻略エリア母数から除外する');
assert.strictEqual(closing.state, '定着');
assert.strictEqual(closing.settledCount, 2);
assert.strictEqual(closing.percent, 100);

const sales = areas.find(area => area.category === '商品売買');
assert.strictEqual(sales.state, '要再戦');
assert.strictEqual(sales.reason, '直近の回答が誤答です');
assert.strictEqual(sales.priorityId, 'D1');

const fsArea = areas.find(area => area.category === '財務諸表');
assert.strictEqual(fsArea.total, 1, 'exam roleを攻略エリア母数から除外する');
assert.strictEqual(fsArea.state, '要再戦', 'due reviewは現在定着でも要再戦を優先する');
assert.strictEqual(fsArea.dueCount, 1);

const beforeProgress = JSON.stringify(model.state);
const beforeRpg = JSON.stringify(rpg.state);
assert.strictEqual(Controller.prototype.renderRpgAreas.call(context, 1000), true);
assert.strictEqual(JSON.stringify(model.state), beforeProgress, '攻略エリア描画はProgressModelを変更しない');
assert.strictEqual(JSON.stringify(rpg.state), beforeRpg, '攻略エリア描画はRPGModelを変更しない');

let text = flatten(areaNode);
for (const expected of ['攻略エリア','定着 1 / 5エリア','現金','未着手','帳簿','攻略中','決算整理','定着 2 / 2（100%）','商品売買','要再戦','財務諸表','対応スキル：財務諸表 90%']) {
  assert(text.includes(expected), `攻略エリアに「${expected}」を表示する`);
}
let buttons = findAll(areaNode, node => node.tagName === 'button');
assert(buttons.some(button => button.dataset.action === 'mode' && button.dataset.mode === 'review' && button.textContent.includes('復習へ')), 'due area CTAはReview modeへ接続する');
assert(buttons.some(button => button.dataset.action === 'start-rpg-mission' && button.dataset.questionId === 'D1'), '非due要再戦はPhase 3優先問題へ接続する');
assert(buttons.some(button => button.dataset.action === 'start-rpg-mission' && button.dataset.questionId === 'A1'), '未着手エリアはPhase 3優先問題から開始する');

due = [];
priorities.C1 = {tier:1,reasons:['直近の回答が誤答です']};
priorityByCategory['決算整理'] = ['C1','C2'];
areas = Controller.prototype.rpgAreas.call(context, 2000);
const regressed = areas.find(area => area.category === '決算整理');
assert.strictEqual(regressed.state, '要再戦', '現在の権威ある弱点証拠により定着エリアも要再戦へ戻れる');
assert.strictEqual(regressed.reason, '直近の回答が誤答です');

assert(html.includes('id="rpg-areas"') && html.includes('aria-label="攻略エリア"'), '実務デスクに攻略エリア領域を持つ');
assert(controllerSource.includes('this.renderRpgAreas();'), '問題一覧再描画と攻略エリアを同期する');
assert(css.includes('.rpg-area-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));'), 'デスクトップは可変grid');
assert(css.includes('.rpg-area-grid { grid-template-columns: 1fr; }'), 'モバイルは1列');

console.log('RPG_AREA_PHASE4B_PASS');
