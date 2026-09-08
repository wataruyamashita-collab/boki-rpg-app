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
fixture = base(); fixture.columns.value.editable = true; fixture.columns.value.inputCharacterCapacity = 11; assert(codes(fixture).includes('COLUMN_TOO_WIDE'), 'generic money controls wider than the canonical character budget fail');
fixture = base(); fixture.columns.value.editable = true; fixture.columns.value.inputCharacterCapacity = 9; assert(!codes(fixture).includes('COLUMN_TOO_WIDE'), 'nine-character money controls pass');
fixture = base(); fixture.columns = { date:{ width:75,renderedWidth:75,sticky:true,stickyLeft:0,stickyViewportLeft:0 },description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:75,stickyViewportLeft:75 },quantity:{ width:40,renderedWidth:40,sticky:true,stickyLeft:172,stickyViewportLeft:172 } }; fixture.sticky={ contextWidth:212,viewportWidth:300,scrollLeft:120 }; assert.deepStrictEqual(codes(fixture), [], 'semantic sticky columns remain at cumulative rendered offsets after horizontal scroll');
fixture = base(); fixture.columns = { description:{ width:97,renderedWidth:97,sticky:false,stickyLeft:0 } }; fixture.sticky={ contextWidth:97,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'missing description sticky context fails');
fixture = base(); fixture.columns = { date:{ width:75,renderedWidth:75,sticky:true,stickyLeft:0 },description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:70 } }; fixture.sticky={ contextWidth:172,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'overlapping sticky offsets fail');
fixture = base(); fixture.columns = { description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:0,stickyViewportLeft:-20 } }; fixture.sticky={ contextWidth:97,viewportWidth:300,scrollLeft:120 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'a context column that scrolls out of view fails');
fixture = base(); fixture.columns = { date:{ width:75,renderedWidth:75,sticky:true,stickyLeft:0 },description:{ width:190,renderedWidth:190,sticky:true,stickyLeft:75 } }; fixture.sticky={ contextWidth:265,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_OCCUPIES_VIEWPORT'), 'sticky context must leave a touch-target-wide editable area');

const fixed = base(); fixed.case = 'fixed-asset'; fixed.columns = {
  life:{ width:68.390625,actualWidth:68.390625,representativeRequiredWidth:68.4,occupiedWidth:68.390625,contentWaste:0,classification:'years',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  acquisitionCost:{ width:63,occupiedWidth:63,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  currentDepreciation:{ width:105,occupiedWidth:105,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false }
};
fixed.rows = { headerRowHeight:25.75,normalRowHeight:48,editableRowHeight:48,inputVisualHeight:44,paddingTop:'1.5px',paddingBottom:'1.5px',borderTop:0,borderBottom:1,expectedNormalRowHeight:48,expectedEditableRowHeight:48 };
assert.deepStrictEqual(codes(fixed), [], 'readable 68.39px years and exact mobile density pass');
fixture = structuredClone(fixed); fixture.columns.life.width = 81; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'years width above the 80px semantic maximum fails');
fixture = structuredClone(fixed); fixture.columns.life.headerClipped = true; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'years header clipping fails');
fixture = structuredClone(fixed); fixture.columns.life.headerGlyphStacked = true; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'stacked years header glyphs fail');
fixture = structuredClone(fixed); fixture.rows.normalRowHeight = 49; assert(codes(fixture).includes('COMPACT_TABLE_DENSITY_FAILURE'), 'mobile density excessive fails');

const known = { columns:{ life:{ classification:'numeric',computedMinWidth:'114px',canonicalValues:[5,5,5,5,5,5],contentMax:5,contentLength:1,editable:false },acquisitionCost:{ classification:'numeric',computedMinWidth:'114px' } } };
assert.strictEqual(detectGeneration10KnownViolation(known),true,'Generation 10 shared numeric floor is detected');
known.columns.life.computedMinWidth = '70px'; assert.strictEqual(detectGeneration10KnownViolation(known),false,'a separate life floor is not mislabeled as the known defect');
console.log('visual gate self-tests: representative isolation, clipping, editable fit, content waste, years, mobile density, desktop chrome: ok');
