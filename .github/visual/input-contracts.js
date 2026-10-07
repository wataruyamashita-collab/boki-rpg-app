'use strict';
(function(root) {
  // Measure native controls without assuming that an input and a select have
  // the same height. Keep the smallest target separate from the row's minimum.
  function controlHeights(heights) {
    if (heights.some(height => !Number.isFinite(height) || height < 0)) throw new Error('INVALID_CONTROL_HEIGHT');
    return { minimum:heights.length ? Math.min(...heights) : 0, maximum:heights.length ? Math.max(...heights) : 0 };
  }

  function textOnlyCells(question) {
    const cells = question.table?.inputCells || [];
    const answerCells = Object.keys(question.answer?.cells || {});
    const authoredSlots = (question.table?.rows || []).flatMap(row => Object.values(row)).filter(value => value === '入力').length;
    if (question.id !== 'L031' || question.type !== 'ledger' || question.format !== 'bookkeeping-account-rule'
      || !Array.isArray(cells) || !cells.length || new Set(cells).size !== cells.length
      || cells.length !== authoredSlots || !sameControlKeys(cells, answerCells)
      || cells.some(id => question.table.inputTypes?.[id] !== 'text'
        || question.table.inputMetadata?.[id]?.semanticType !== 'text'
        || question.table.controlTypes?.[id] !== 'text'
        || typeof question.answer?.cells?.[id] !== 'string' || !question.answer.cells[id])) {
      throw new Error(`${question.id}:UNEXPECTED_NON_AMOUNT_QUESTION`);
    }
    return cells;
  }

  const semanticTypes = new Set(['account','amount','date','folio','months','text','unitPrice']);
  // The expected inventory comes from authored answer metadata, never from the
  // DOM under test. Check cell identity as well as counts to catch substitutions.
  function amountControlKeys(question) {
    if (question.type === 'journal') {
      return ['debit','credit'].flatMap(side => question.answer[side].map((_, index) => `${side}:${index}`));
    }
    const cells = question.table?.inputCells;
    if (!Array.isArray(cells) || !cells.length || new Set(cells).size !== cells.length) throw new Error(`${question.id}:INVALID_INPUT_CELLS`);
    const keys = cells.filter(id => {
      const type = question.table.inputMetadata?.[id]?.semanticType || question.table.inputTypes?.[id];
      if (!type) throw new Error(`${question.id}:${id}:MISSING_INPUT_TYPE`);
      if (!semanticTypes.has(type)) throw new Error(`${question.id}:${id}:UNKNOWN_INPUT_TYPE`);
      return type === 'amount' || type === 'unitPrice';
    });
    if (!keys.length) textOnlyCells(question);
    return keys;
  }

  function sameControlKeys(expected, actual) {
    return JSON.stringify([...expected].sort()) === JSON.stringify([...actual].sort());
  }

  const api = { controlHeights, amountControlKeys, textOnlyCells, sameControlKeys };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.visualInputContracts = api;
})(globalThis);
