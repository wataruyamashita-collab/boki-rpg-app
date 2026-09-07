'use strict';

const DEFAULTS = Object.freeze({ widthTolerance: 16, widthRatio: 1.35, maximumRowHeight: 56, maximumYearsWidth: 80, maximumCompactHeaderHeight: 48, maximumCompactNormalRowHeight: 48, maximumCompactEditableRowHeight: 50, minimumTouchTargetHeight: 44 });

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
  if (metrics.case === 'fixed-asset' && Number(metrics.viewport?.width) <= 430) {
    const life = metrics.columns?.life;
    const acquisition = metrics.columns?.acquisitionCost;
    const depreciation = metrics.columns?.currentDepreciation;
    if (life && (life.clipped || life.headerLineCount > 1 || life.width > limits.maximumYearsWidth || life.width >= acquisition?.width || life.width >= depreciation?.width)) {
      violations.push({ code:'YEARS_COLUMN_EXCESSIVE_WIDTH', actual:life.width, maximum:limits.maximumYearsWidth, acquisitionCost:acquisition?.width, currentDepreciation:depreciation?.width });
    }
    const rows = metrics.rows || {};
    if (Number(rows.headerRowHeight) > limits.maximumCompactHeaderHeight || Number(rows.normalRowHeight) > limits.maximumCompactNormalRowHeight || Number(rows.editableRowHeight) > limits.maximumCompactEditableRowHeight || Number(rows.inputVisualHeight) < limits.minimumTouchTargetHeight) {
      violations.push({ code:'COMPACT_TABLE_DENSITY_FAILURE', rows, limits:{ header:limits.maximumCompactHeaderHeight, normal:limits.maximumCompactNormalRowHeight, editable:limits.maximumCompactEditableRowHeight, inputMinimum:limits.minimumTouchTargetHeight } });
    }
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
