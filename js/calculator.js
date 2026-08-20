(function (root) {
  'use strict';

  const operators = { '＋': '+', '−': '-', '×': '*', '÷': '/' };
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

  /** Evaluates arithmetic without eval/Function. Only decimal numbers and four operators are accepted. */
  function evaluate(expression) {
    const source = String(expression).replace(/[＋−×÷]/g, token => operators[token]);
    const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/]/g) || [];
    if (!source.trim() || tokens.join('') !== source.replace(/\s/g, '')) throw new Error('invalid expression');
    const output = [];
    const stack = [];
    let expectsValue = true;
    tokens.forEach(token => {
      if (/^(?:\d|\.)/.test(token)) {
        if (!expectsValue) throw new Error('missing operator');
        output.push(Number(token));
        expectsValue = false;
      } else if (token === '(') {
        if (!expectsValue) throw new Error('missing operator');
        stack.push(token);
      } else if (token === ')') {
        if (expectsValue) throw new Error('invalid parenthesis');
        while (stack.length && stack.at(-1) !== '(') output.push(stack.pop());
        if (stack.pop() !== '(') throw new Error('invalid parenthesis');
      } else {
        if (expectsValue) throw new Error('invalid operator');
        while (stack.length && precedence[stack.at(-1)] >= precedence[token]) output.push(stack.pop());
        stack.push(token);
        expectsValue = true;
      }
    });
    if (expectsValue) throw new Error('incomplete expression');
    while (stack.length) {
      const token = stack.pop();
      if (token === '(') throw new Error('invalid parenthesis');
      output.push(token);
    }
    const values = [];
    output.forEach(token => {
      if (typeof token === 'number') return values.push(token);
      const right = values.pop(); const left = values.pop();
      if (left === undefined || right === undefined || (token === '/' && right === 0)) throw new Error('invalid calculation');
      values.push(token === '+' ? left + right : token === '-' ? left - right : token === '*' ? left * right : left / right);
    });
    if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error('invalid result');
    return Math.round((values[0] + Number.EPSILON) * 1e10) / 1e10;
  }

  root.SafeCalculator = { evaluate };
  if (typeof module !== 'undefined') module.exports = root.SafeCalculator;
}(typeof window !== 'undefined' ? window : globalThis));
