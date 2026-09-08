'use strict';

const DEFAULTS = Object.freeze({ maximumYearsWidth: 80, maximumCompactHeaderHeight: 48, maximumCompactNormalRowHeight: 48, maximumCompactEditableRowHeight: 50, minimumTouchTargetHeight: 44, maximumMoneyInputCharacters: 9.5, rowRoundingTolerance: 1, minimumWasteTolerance: 48, wasteRatio: 0.75 });

function evaluateVisualMetrics(metrics, options = {}) {
  const limits = { ...DEFAULTS, ...options };
  const violations = [];
  for (const [key, column] of Object.entries(metrics.columns || {})) {
    const actual = Number(column.width);
    const narrowEvidence = column.headerClipped || column.cellClipped || column.clipped || column.editableAnswerFitFailure;
    if (narrowEvidence) violations.push({ code:'COLUMN_TOO_NARROW', column:key, actual, representativeRequiredWidth:column.representativeRequiredWidth, evidence:{ headerClipped:Boolean(column.headerClipped),cellClipped:Boolean(column.cellClipped || column.clipped),editableAnswerFitFailure:Boolean(column.editableAnswerFitFailure) } });
    const occupied = Number(column.occupiedWidth || column.representativeRequiredWidth || column.requiredWidth);
    const waste = Number.isFinite(Number(column.contentWaste)) ? Number(column.contentWaste) : actual - occupied;
    const excessiveWaste = Math.max(limits.minimumWasteTolerance, occupied * limits.wasteRatio);
    if (metrics.table?.requiresHorizontalScroll && waste > excessiveWaste && column.classification !== 'years') violations.push({ code:'COLUMN_TOO_WIDE', column:key, actual,occupiedWidth:occupied,contentWaste:waste,maximumUsefulWaste:excessiveWaste });
    if (column.classification === 'numeric' && column.editable && Number(column.inputCharacterCapacity) > limits.maximumMoneyInputCharacters) violations.push({ code:'COLUMN_TOO_WIDE', column:key, actual,inputCharacterCapacity:column.inputCharacterCapacity,maximumInputCharacters:limits.maximumMoneyInputCharacters });
    if (narrowEvidence) violations.push({ code:'CONTENT_CLIPPED', column:key });
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
  for (const [key, expectedKey] of [['normalRowHeight','expectedNormalRowHeight'],['editableRowHeight','expectedEditableRowHeight']]) {
    const actual = Number(rows[key]), expected = Number(rows[expectedKey]);
    if (Number.isFinite(actual) && Number.isFinite(expected) && expected > 0 && actual > expected + limits.rowRoundingTolerance) violations.push({ code:'ROW_TOO_TALL', row:key, actual,expected,chrome:{ paddingTop:rows.paddingTop,paddingBottom:rows.paddingBottom,borderTop:rows.borderTop,borderBottom:rows.borderBottom,inputHeight:rows.inputVisualHeight } });
  }
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
