'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function fixture() {
  const listeners = {}, viewportListeners = {}, frames = new Map();
  let nextFrame = 0;
  const root = {
    addEventListener(type, fn) { listeners[type] = fn; },
    visualViewport: { addEventListener(type, fn) { viewportListeners[type] = fn; } },
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); }
  };
  vm.runInNewContext(fs.readFileSync('js/controller.js', 'utf8'), { window: root });
  const panel = { open:true, classList:{ contains:()=>true }, addEventListener() {} };
  const input = { alive:true, disabled:false, value:'12,345' };
  const controller = Object.create(root.AppController.prototype);
  Object.assign(controller, {
    document: { addEventListener() {}, querySelector:()=>panel,
      getElementById:()=>({ addEventListener() {} }), body:{ contains:node=>Boolean(node?.alive) } },
    calculatorTarget:input, calculatorPositionFrame:null,
    expression:'67', calculator:{ accumulator:12, operator:'＋', waitingForOperand:false }
  });
  const positioned = [];
  controller.positionCalculatorNearTarget = (target, activePanel) => positioned.push([target, activePanel]);
  controller.bindEvents();
  return { controller, input, panel, frames, positioned, listeners, viewportListeners,
    flush() { for (const [id, fn] of [...frames]) { frames.delete(id); fn(); } } };
}

const f = fixture();
assert.equal(typeof f.listeners.resize, 'function', 'window resize must reflow the open calculator');
assert.equal(typeof f.viewportListeners.resize, 'function', 'visual viewport resize must reflow the open calculator');
const before = JSON.stringify([f.input.value, f.controller.expression, f.controller.calculator]);
f.listeners.resize(); f.viewportListeners.resize(); f.listeners.resize();
assert.equal(f.frames.size, 1, 'one layout per animation frame for duplicate resize events');
f.flush();
assert.equal(f.positioned.length, 1);
assert.strictEqual(f.positioned[0][0], f.input);
assert.strictEqual(f.positioned[0][1], f.panel);
assert.equal(JSON.stringify([f.input.value, f.controller.expression, f.controller.calculator]), before,
  'layout must not reselect/reset the calculation or alter the draft');
assert.equal(f.listeners.scroll, undefined, 'ordinary scroll must not chase the calculator');
assert.equal(f.viewportListeners.scroll, undefined, 'visual viewport scrolling must not change the scroll contract');

for (const reason of ['closed', 'removed', 'disabled', 'no-target']) {
  const g = fixture(); g.listeners.resize();
  if (reason === 'closed') g.panel.open = false;
  if (reason === 'removed') g.input.alive = false;
  if (reason === 'disabled') g.input.disabled = true;
  if (reason === 'no-target') g.controller.calculatorTarget = null;
  g.flush();
  assert.equal(g.positioned.length, 0, reason + ' must not reposition or reopen a stale calculator');
}
const switched = fixture(); switched.listeners.resize();
const second = { alive:true, disabled:false, value:'88' };
switched.controller.calculatorTarget = second; switched.flush();
assert.strictEqual(switched.positioned[0][0], second, 'scheduled layout uses the current target, not a stale cell');
console.log('CALCULATOR_VIEWPORT 8 contract cases PASS');
