'use strict';

const DEFAULTS = Object.freeze({ widthTolerance: 16, widthRatio: 1.35, maximumRowHeight: 56 });

function evaluateVisualMetrics(metrics, options = {}) {
  const limits = { ...DEFAULTS, ...options };
  const violations = [];
  for (const [key, column] of Object.entries(metrics.columns || {})) {
    const required = Number(column.requiredWidth);
    const actual = Number(column.width);
    const maximum = Math.max(required + limits.widthTolerance, required * limits.widthRatio);
    if (actual + 0.5 < required) violations.push({ code:'COLUMN_TOO_NARROW', column:key, actual, required });
    if (actual - 0.5 > maximum) violations.push({ code:'COLUMN_TOO_WIDE', column:key, actual, reasonableMaximum:maximum });
    if (column.clipped) violations.push({ code:'CONTENT_CLIPPED', column:key });
    if (column.headerLineCount > 2 || column.headerGlyphStacked) violations.push({ code:'UNREADABLE_HEADER_WRAP', column:key, lines:column.headerLineCount });
  }
  const rows = metrics.rows || {};
  for (const key of ['normalRowHeight','editableRowHeight']) if (Number(rows[key]) > limits.maximumRowHeight) violations.push({ code:'ROW_TOO_TALL', row:key, actual:rows[key], maximum:limits.maximumRowHeight });
  if (metrics.table?.requiresHorizontalScroll && !metrics.table?.horizontalScrollAvailable) violations.push({ code:'HORIZONTAL_OVERFLOW_UNAVAILABLE' });
  if (metrics.table?.clipped) violations.push({ code:'TABLE_CLIPPED' });
  return violations;
}

function detectGeneration10KnownViolation(metrics) {
  const life = metrics.columns?.life;
  const money = metrics.columns?.acquisitionCost;
  const values = life?.canonicalValues || [];
  const sharedNumericFloor = life?.classification === 'numeric'
    && money?.classification === 'numeric'
    && life.computedMinWidth === money.computedMinWidth;
  return Boolean(life && money && values.length === 6 && values.every(value => value === 5)
    && life.contentMax === 5 && life.contentLength === 1 && !life.editable && sharedNumericFloor);
}

module.exports = { DEFAULTS, detectGeneration10KnownViolation, evaluateVisualMetrics };
