'use strict';
const assert = require('assert');
const { detectGeneration10KnownViolation, evaluateVisualMetrics } = require('./gate-core');

const base = () => ({
  viewport:{ width:390 }, case:'ledger',
  columns:{ value:{ width:100,actualWidth:100,representativeRequiredWidth:90,occupiedWidth:90,contentWaste:10,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false } },
  rows:{ normalRowHeight:61,editableRowHeight:61,inputVisualHeight:44,paddingTop:'8px',paddingBottom:'8px',borderTop:0,borderBottom:1,expectedNormalRowHeight:61,expectedEditableRowHeight:61 },
  table:{ requiresHorizontalScroll:false,horizontalScrollAvailable:true,clipped:false }
});
const codes = input => evaluateVisualMetrics(input).map(item => item.code);

assert.deepStrictEqual(codes(base()), [], 'representative content and desktop measured chrome fit');
let fixture = base(); fixture.columns.value.globalCanonicalRequiredWidth = 200; assert.deepStrictEqual(codes(fixture), [], 'an unrelated global canonical value cannot fail this representative');
fixture = base(); fixture.columns.value.headerClipped = true; assert(codes(fixture).includes('COLUMN_TOO_NARROW') && codes(fixture).includes('CONTENT_CLIPPED'), 'actual header clipping fails');
fixture = base(); fixture.columns.value.cellClipped = true; assert(codes(fixture).includes('COLUMN_TOO_NARROW') && codes(fixture).includes('CONTENT_CLIPPED'), 'actual body clipping fails');
fixture = base(); fixture.columns.value.editableAnswerFitFailure = true; assert(codes(fixture).includes('COLUMN_TOO_NARROW'), 'representative editable answer overflow fails');
fixture = base(); fixture.table.requiresHorizontalScroll = true; fixture.columns.value.width = 220; fixture.columns.value.contentWaste = 130; assert(codes(fixture).includes('COLUMN_TOO_WIDE'), 'large content waste that contributes to scrolling fails');
fixture = base(); fixture.table.requiresHorizontalScroll = true; fixture.columns.value.width = 112; fixture.columns.value.contentWaste = 22; assert(!codes(fixture).includes('COLUMN_TOO_WIDE'), 'small form-control whitespace does not fail by generic ratio');

const fixed = base(); fixed.case = 'fixed-asset'; fixed.columns = {
  life:{ width:68.39,actualWidth:68.39,representativeRequiredWidth:68.4,occupiedWidth:68.39,contentWaste:0,classification:'years',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  acquisitionCost:{ width:69,occupiedWidth:69,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  currentDepreciation:{ width:111,occupiedWidth:111,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false }
};
fixed.rows = { headerRowHeight:25.75,normalRowHeight:48,editableRowHeight:48,inputVisualHeight:44,paddingTop:'1.5px',paddingBottom:'1.5px',borderTop:0,borderBottom:1,expectedNormalRowHeight:48,expectedEditableRowHeight:48 };
assert.deepStrictEqual(codes(fixed), [], 'readable 68.39px years and exact mobile density pass');
fixture = structuredClone(fixed); fixture.columns.life.width = 120; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'years excessive width fails');
fixture = structuredClone(fixed); fixture.rows.normalRowHeight = 49; assert(codes(fixture).includes('COMPACT_TABLE_DENSITY_FAILURE'), 'mobile density excessive fails');

const known = { columns:{ life:{ classification:'numeric',computedMinWidth:'114px',canonicalValues:[5,5,5,5,5,5],contentMax:5,contentLength:1,editable:false },acquisitionCost:{ classification:'numeric',computedMinWidth:'114px' } } };
assert.strictEqual(detectGeneration10KnownViolation(known),true,'Generation 10 shared numeric floor is detected');
known.columns.life.computedMinWidth = '70px'; assert.strictEqual(detectGeneration10KnownViolation(known),false,'a separate life floor is not mislabeled as the known defect');
console.log('visual gate self-tests: representative isolation, clipping, editable fit, content waste, years, mobile density, desktop chrome: ok');
