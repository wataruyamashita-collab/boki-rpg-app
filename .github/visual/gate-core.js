'use strict';

const DEFAULTS = Object.freeze({ maximumYearsWidth: 80, maximumCompactHeaderHeight: 48, maximumCompactNormalRowHeight: 48, maximumCompactEditableRowHeight: 50, minimumTouchTargetHeight: 44, maximumMoneyInputCharacters: 9.5, rowRoundingTolerance: 1, journalBookRowLayoutTolerance: 4, browserRoundingTolerance: 0.5, minimumWasteTolerance: 48, wasteRatio: 0.75 });

function evaluateVisualMetrics(metrics, options = {}) {
  const limits = { ...DEFAULTS, ...options };
  const violations = [];
  for (const [key, column] of Object.entries(metrics.columns || {})) {
    const actual = Number(column.actualWidth ?? column.width);
    const headerTextWidth = Number(column.headerTextWidth), headerHorizontalChrome = Number(column.headerHorizontalChrome);
    const requiredHeaderWidth = headerTextWidth + headerHorizontalChrome;
    const headerWidthDeficit = Number.isFinite(requiredHeaderWidth) && actual + limits.browserRoundingTolerance < requiredHeaderWidth;
    const actualClipping = column.headerClipped || column.cellClipped || column.clipped || column.editableAnswerFitFailure;
    const narrowEvidence = headerWidthDeficit || actualClipping;
    if (narrowEvidence) violations.push({ code:'COLUMN_TOO_NARROW', column:key, actualWidth:actual, headerTextWidth, headerHorizontalChrome, requiredHeaderWidth, deficit:Number.isFinite(requiredHeaderWidth) ? Math.max(0,requiredHeaderWidth-actual) : null, representativeRequiredWidth:column.representativeRequiredWidth, evidence:{ headerClipped:Boolean(column.headerClipped),headerWidthDeficit,cellClipped:Boolean(column.cellClipped || column.clipped),editableAnswerFitFailure:Boolean(column.editableAnswerFitFailure) } });
    const occupied = Number(column.occupiedWidth || column.representativeRequiredWidth || column.requiredWidth);
    const waste = Number.isFinite(Number(column.contentWaste)) ? Number(column.contentWaste) : actual - occupied;
    const excessiveWaste = Math.max(limits.minimumWasteTolerance, occupied * limits.wasteRatio);
    if (metrics.table?.requiresHorizontalScroll && waste > excessiveWaste && column.classification !== 'years') violations.push({ code:'COLUMN_TOO_WIDE', column:key, actual,occupiedWidth:occupied,contentWaste:waste,maximumUsefulWaste:excessiveWaste });
    const fixedAssetCellFill = metrics.case === 'fixed-asset' && !metrics.cardLayout && ['currentDepreciation','closingBookValue'].includes(key);
    if (column.classification === 'numeric' && column.editable && !fixedAssetCellFill && Number(column.inputCharacterCapacity) > limits.maximumMoneyInputCharacters) violations.push({ code:'COLUMN_TOO_WIDE', column:key, actual,inputCharacterCapacity:column.inputCharacterCapacity,maximumInputCharacters:limits.maximumMoneyInputCharacters });
    if (fixedAssetCellFill && column.editable) {
      const cellOuterWidth = Number(column.cell?.rect?.width);
      const cellHorizontalChrome = Number(column.cellHorizontalChrome);
      const inputOuterWidth = Number(column.input?.rect?.width);
      const expectedInputWidth = cellOuterWidth - cellHorizontalChrome;
      const inputCellWidthDelta = Math.abs(inputOuterWidth - expectedInputWidth);
      if (!Number.isFinite(cellOuterWidth) || !Number.isFinite(cellHorizontalChrome) || !Number.isFinite(inputOuterWidth) || !Number.isFinite(expectedInputWidth) || inputCellWidthDelta > 1.5) {
        violations.push({
          code:'INPUT_CELL_WIDTH_MISMATCH',
          column:key,
          cellOuterWidth,
          cellHorizontalChrome,
          inputOuterWidth,
          expectedInputWidth,
          delta:inputCellWidthDelta
        });
      }
    }
    if (actualClipping) violations.push({ code:'CONTENT_CLIPPED', column:key });
    if (column.headerLineCount > 2 || column.headerGlyphStacked) violations.push({ code:'UNREADABLE_HEADER_WRAP', column:key, lines:column.headerLineCount });
  }
  if (metrics.case === 'fixed-asset' && !metrics.cardLayout) {
    const currentDepreciation = metrics.columns?.currentDepreciation;
    const closingBookValue = metrics.columns?.closingBookValue;
    if (currentDepreciation && closingBookValue) {
      const currentColumnWidth = Number(currentDepreciation.actualWidth ?? currentDepreciation.width);
      const closingColumnWidth = Number(closingBookValue.actualWidth ?? closingBookValue.width);
      const currentInputWidth = Number(currentDepreciation.input?.rect?.width);
      const closingInputWidth = Number(closingBookValue.input?.rect?.width);
      const columnDelta = Math.abs(currentColumnWidth - closingColumnWidth);
      const inputDelta = Math.abs(currentInputWidth - closingInputWidth);
      if (!Number.isFinite(currentColumnWidth) || !Number.isFinite(closingColumnWidth) || !Number.isFinite(currentInputWidth) || !Number.isFinite(closingInputWidth) || columnDelta > limits.browserRoundingTolerance || inputDelta > limits.browserRoundingTolerance) {
        violations.push({
          code:'FIXED_ASSET_EDITABLE_WIDTH_MISMATCH',
          currentColumnWidth,
          closingColumnWidth,
          currentInputWidth,
          closingInputWidth,
          columnDelta,
          inputDelta
        });
      }
    }
  }
  if (metrics.case === 'fixed-asset' && !metrics.cardLayout && Number(metrics.viewport?.width) <= 430) {
    const life = metrics.columns?.life;
    if (life && (life.width > limits.maximumYearsWidth || life.headerClipped || life.cellClipped || life.clipped || life.editableAnswerFitFailure || life.headerGlyphStacked || life.headerLineCount > 1)) {
      violations.push({ code:'YEARS_COLUMN_EXCESSIVE_WIDTH', actual:life.width, maximum:limits.maximumYearsWidth,evidence:{ headerClipped:Boolean(life.headerClipped),cellClipped:Boolean(life.cellClipped || life.clipped),editableAnswerFitFailure:Boolean(life.editableAnswerFitFailure),headerGlyphStacked:Boolean(life.headerGlyphStacked),headerLineCount:life.headerLineCount } });
    }
    const rows = metrics.rows || {};
    if (Number(rows.headerRowHeight) > limits.maximumCompactHeaderHeight || Number(rows.normalRowHeight) > limits.maximumCompactNormalRowHeight || Number(rows.editableRowHeight) > limits.maximumCompactEditableRowHeight || Number(rows.inputVisualHeight) < limits.minimumTouchTargetHeight) {
      violations.push({ code:'COMPACT_TABLE_DENSITY_FAILURE', rows, limits:{ header:limits.maximumCompactHeaderHeight, normal:limits.maximumCompactNormalRowHeight, editable:limits.maximumCompactEditableRowHeight, inputMinimum:limits.minimumTouchTargetHeight } });
    }
  }
  const rows = metrics.rows || {};
  if (metrics.case === 'journal-book') {
    if (!rows.hasEditableControl || Number(rows.inputVisualHeight) < limits.minimumTouchTargetHeight) violations.push({ code:'JOURNAL_BOOK_TOUCH_TARGET_FAILURE', minimum:limits.minimumTouchTargetHeight, actual:rows.inputVisualHeight });
    if (Number(rows.headerCellCount) !== 5) violations.push({ code:'JOURNAL_BOOK_COLUMN_STRUCTURE_FAILURE', expected:5, actual:rows.headerCellCount });
    if (Number(rows.controlCount) !== 14) violations.push({ code:'JOURNAL_BOOK_CONTROL_STRUCTURE_FAILURE', expected:14, actual:rows.controlCount });
    if (Number(rows.journalBookAmountContextCount) !== 4) violations.push({ code:'JOURNAL_BOOK_AMOUNT_CONTEXT_FAILURE', expected:4, actual:rows.journalBookAmountContextCount });
    if (Number(rows.journalBookFolioHelpCount) !== 1) violations.push({ code:'JOURNAL_BOOK_FOLIO_HELP_FAILURE', expected:1, actual:rows.journalBookFolioHelpCount });
    if (!rows.journalBookScrollNoteVisible) violations.push({ code:'JOURNAL_BOOK_SCROLL_GUIDANCE_FAILURE' });
  }
  if (metrics.cardLayout) {
    if (!rows.hasEditableControl || Number(rows.inputVisualHeight) < limits.minimumTouchTargetHeight) violations.push({ code:'CARD_TOUCH_TARGET_FAILURE', minimum:limits.minimumTouchTargetHeight, actual:rows.inputVisualHeight });
    if (!Number(metrics.cards?.count) || metrics.cards?.clipped) violations.push({ code:'CARD_CONTENT_CLIPPED', cards:metrics.cards });
    if (metrics.table?.requiresHorizontalScroll || metrics.table?.horizontalOverflow > 1) violations.push({ code:'CARD_HORIZONTAL_OVERFLOW', overflow:metrics.table.horizontalOverflow });
  }
  const rowHeightTolerance = metrics.case === 'journal-book' ? limits.journalBookRowLayoutTolerance : limits.rowRoundingTolerance;
  for (const [key, expectedKey] of [['normalRowHeight','expectedNormalRowHeight'],['editableRowHeight','expectedEditableRowHeight']]) {
    const actual = Number(rows[key]), expected = Number(rows[expectedKey]);
    if (Number.isFinite(actual) && Number.isFinite(expected) && expected > 0 && actual > expected + rowHeightTolerance) violations.push({ code:'ROW_TOO_TALL', row:key, actual,expected,tolerance:rowHeightTolerance,chrome:{ paddingTop:rows.paddingTop,paddingBottom:rows.paddingBottom,borderTop:rows.borderTop,borderBottom:rows.borderBottom,inputHeight:rows.inputVisualHeight } });
  }
  const stickyColumns = ['description','quantity'].filter(key => metrics.columns?.[key]); let expectedLeft = 0;
  const date = metrics.columns?.date;
  if (date?.sticky) violations.push({ code:'STICKY_CONTEXT_FAILURE',column:'date',sticky:true,expectedSticky:false });
  for (const key of stickyColumns) {
    const column = metrics.columns[key];
    const offsetMismatch = Math.abs(Number(column.stickyLeft)-expectedLeft) > 1.5;
    const naturalLeft = Number(column.naturalViewportLeft), scrollLeft = Number(metrics.sticky?.scrollLeft) || 0;
    const expectedViewportLeft = Math.max(expectedLeft, naturalLeft-scrollLeft);
    const scrollMismatch = Number.isFinite(naturalLeft) && Math.abs(Number(column.stickyViewportLeft)-expectedViewportLeft) > 2;
    if (!column.sticky || offsetMismatch || !Number.isFinite(naturalLeft) || scrollMismatch) violations.push({ code:'STICKY_CONTEXT_FAILURE',column:key,sticky:column.sticky,actualLeft:column.stickyLeft,naturalViewportLeft:column.naturalViewportLeft,actualViewportLeft:column.stickyViewportLeft,expectedViewportLeft,expectedLeft,scrollLeft });
    expectedLeft += Number(column.renderedWidth || column.width);
  }
  if (stickyColumns.length && Number(metrics.sticky?.contextWidth) > Number(metrics.sticky?.viewportWidth)-limits.minimumTouchTargetHeight) violations.push({ code:'STICKY_CONTEXT_OCCUPIES_VIEWPORT',contextWidth:metrics.sticky.contextWidth,viewportWidth:metrics.sticky.viewportWidth,minimumEditableArea:limits.minimumTouchTargetHeight });
  if (metrics.table?.requiresHorizontalScroll && !metrics.table?.horizontalScrollAvailable) violations.push({ code:'HORIZONTAL_OVERFLOW_UNAVAILABLE' });
  if (metrics.table?.clipped) {
    violations.push({ code:'TABLE_CLIPPED' });
    violations.push({ code:'CONTENT_CLIPPED', scope:'table' });
  }
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
