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
  return { controller, input, panel, root, frames, positioned, listeners, viewportListeners,
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

const geometry = fixture();
delete geometry.controller.positionCalculatorNearTarget;
Object.assign(geometry.root.visualViewport, {width:390, height:844});
Object.assign(geometry.panel, {style:{}, dataset:{}});
geometry.panel.classList.toggle = () => {};
let inputTop = 245;
geometry.input.getBoundingClientRect = () => ({right:360, top:inputTop, bottom:inputTop+44});
geometry.panel.getBoundingClientRect = () => {
  const s=geometry.panel.style, left=parseFloat(s.left)||0, top=parseFloat(s.top)||0;
  const width=parseFloat(s.width)||374, height=Math.min(371,parseFloat(s.maxHeight)||380);
  return {left,top,right:left+width,bottom:top+height,width,height};
};
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel);
const anchored = geometry.panel.getBoundingClientRect();
inputTop -= 100;
geometry.root.visualViewport.height += 60;
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel, true);
assert.equal(geometry.panel.getBoundingClientRect().top, anchored.top,
  'height-only toolbar resize must not undo the viewport-fixed scroll position');
geometry.root.visualViewport.height = 520;
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel, true);
assert(geometry.panel.getBoundingClientRect().bottom<=512, 'keyboard-height reduction must clamp inside the viewport');
const clampedTop=geometry.panel.getBoundingClientRect().top;
geometry.root.visualViewport.height = 844;
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel, true);
assert.equal(geometry.panel.getBoundingClientRect().top,clampedTop,'height restoration does not re-anchor');
geometry.root.visualViewport.offsetTop = 180;
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel, true);
assert(geometry.panel.getBoundingClientRect().top>=188,'nonzero visual viewport offset must be respected');
geometry.root.visualViewport.offsetTop = 0;
geometry.root.visualViewport.height = 520;
geometry.root.visualViewport.width = 320;
geometry.controller.positionCalculatorNearTarget(geometry.input, geometry.panel, true);
assert.equal(geometry.panel.getBoundingClientRect().width,304,'width changes must still reflow');
assert.equal(geometry.panel.getBoundingClientRect().top,inputTop+52,'width changes re-anchor to the current target');
const otherInput={getBoundingClientRect:()=>({right:200,top:60,bottom:104})};
geometry.controller.positionCalculatorNearTarget(otherInput,geometry.panel,true);
assert.equal(geometry.panel.getBoundingClientRect().top,112,'a different target must re-anchor even at the same width');
geometry.panel.style.left=''; geometry.panel.style.top='';
otherInput.getBoundingClientRect=()=>({right:200,top:90,bottom:134});
geometry.controller.positionCalculatorNearTarget(otherInput,geometry.panel,true);
assert.equal(geometry.panel.getBoundingClientRect().top,142,'cleared/reopened positioning must re-anchor');
console.log('CALCULATOR_VIEWPORT contract cases PASS');
