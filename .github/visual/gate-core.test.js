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
fixture = base(); Object.assign(fixture.columns.value,{ headerTextWidth:112,horizontalChrome:3,actualWidth:101,headerClipped:false }); let violation = evaluateVisualMetrics(fixture).find(item => item.code === 'COLUMN_TOO_NARROW'); assert(violation && violation.requiredHeaderWidth === 115 && violation.deficit === 14, '101px rendered column fails its 115px intrinsic header requirement with complete evidence');
fixture = base(); Object.assign(fixture.columns.value,{ headerTextWidth:112,horizontalChrome:3,actualWidth:115,headerClipped:false }); assert(!codes(fixture).includes('COLUMN_TOO_NARROW'), '115px rendered column satisfies its 115px intrinsic header requirement');
fixture = base(); Object.assign(fixture.columns.value,{ headerTextWidth:144,horizontalChrome:3,actualWidth:129,headerClipped:false }); assert(codes(fixture).includes('COLUMN_TOO_NARROW'), '129px rendered column fails its 147px intrinsic long-header requirement');
fixture = base(); Object.assign(fixture.columns.value,{ headerTextWidth:96,horizontalChrome:3,actualWidth:87,headerClipped:false }); assert(codes(fixture).includes('COLUMN_TOO_NARROW'), '87px rendered column fails its 99px intrinsic header requirement');
fixture = base(); fixture.table.requiresHorizontalScroll = true; fixture.columns.value.width = 220; fixture.columns.value.contentWaste = 130; assert(codes(fixture).includes('COLUMN_TOO_WIDE'), 'large content waste that contributes to scrolling fails');
fixture = base(); fixture.table.requiresHorizontalScroll = true; fixture.columns.value.width = 112; fixture.columns.value.contentWaste = 22; assert(!codes(fixture).includes('COLUMN_TOO_WIDE'), 'small form-control whitespace does not fail by generic ratio');
fixture = base(); fixture.columns.value.editable = true; fixture.columns.value.inputCharacterCapacity = 11; assert(codes(fixture).includes('COLUMN_TOO_WIDE'), 'generic money controls wider than the canonical character budget fail');
fixture = base(); fixture.columns.value.editable = true; fixture.columns.value.inputCharacterCapacity = 9; assert(!codes(fixture).includes('COLUMN_TOO_WIDE'), 'nine-character money controls pass');
fixture = base(); fixture.columns = { date:{ width:75,renderedWidth:75,sticky:false },description:{ width:139,renderedWidth:139,sticky:true,stickyLeft:0,naturalViewportLeft:76,stickyViewportLeft:0 },quantity:{ width:44.1875,renderedWidth:44.1875,sticky:true,stickyLeft:139,naturalViewportLeft:215,stickyViewportLeft:139 } }; fixture.sticky={ contextWidth:183.1875,viewportWidth:300,scrollLeft:120 }; assert.deepStrictEqual(codes(fixture), [], 'inventory context excludes date, keeps description and quantity at rendered offsets, and leaves at least 44px editable space at 320px');
for (const viewportWidth of [300,355,370,410]) { fixture.sticky.viewportWidth = viewportWidth; assert(!codes(fixture).includes('STICKY_CONTEXT_OCCUPIES_VIEWPORT'), `${viewportWidth + 20}px inventory viewport retains a touch-target-wide editable area`); }
fixture = base(); fixture.columns = { description:{ width:139,renderedWidth:139,sticky:true,stickyLeft:0,naturalViewportLeft:76,stickyViewportLeft:47 } }; fixture.sticky={ contextWidth:139,viewportWidth:355,scrollLeft:29 }; assert.deepStrictEqual(codes(fixture), [], 'description follows its natural position before reaching the sticky threshold at 375px');
fixture.columns.description.stickyViewportLeft = 62; fixture.sticky.scrollLeft = 14; assert.deepStrictEqual(codes(fixture), [], 'description follows its natural position before reaching the sticky threshold at 390px');
fixture.columns.description.stickyViewportLeft = 0; fixture.sticky.scrollLeft = 84; assert.deepStrictEqual(codes(fixture), [], 'description pins at zero after crossing its sticky threshold at 320px');
fixture = base(); fixture.columns = { description:{ width:139,renderedWidth:139,sticky:true,stickyLeft:0,naturalViewportLeft:76,stickyViewportLeft:47 },quantity:{ width:44,renderedWidth:44,sticky:true,stickyLeft:139,naturalViewportLeft:215,stickyViewportLeft:186 } }; fixture.sticky={ contextWidth:183,viewportWidth:355,scrollLeft:29 }; assert.deepStrictEqual(codes(fixture), [], 'quantity preserves its cumulative offset while both sticky columns are pre-threshold');
fixture.columns.quantity.stickyLeft = 142; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'incorrect cumulative CSS sticky offset still fails');
fixture = base(); fixture.columns = { date:{ width:75,renderedWidth:75,sticky:true,stickyLeft:0 },description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:0 } }; fixture.sticky={ contextWidth:97,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'date must scroll instead of joining the sticky context');
fixture = base(); fixture.columns = { description:{ width:97,renderedWidth:97,sticky:false,stickyLeft:0 } }; fixture.sticky={ contextWidth:97,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'missing description sticky context fails');
fixture = base(); fixture.columns = { description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:0 },quantity:{ width:40,renderedWidth:40,sticky:true,stickyLeft:70 } }; fixture.sticky={ contextWidth:137,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'overlapping sticky offsets fail');
fixture = base(); fixture.columns = { description:{ width:97,renderedWidth:97,sticky:true,stickyLeft:0,stickyViewportLeft:-20 } }; fixture.sticky={ contextWidth:97,viewportWidth:300,scrollLeft:120 }; assert(codes(fixture).includes('STICKY_CONTEXT_FAILURE'), 'a context column that scrolls out of view fails');
fixture = base(); fixture.columns = { description:{ width:220,renderedWidth:220,sticky:true,stickyLeft:0 },quantity:{ width:45,renderedWidth:45,sticky:true,stickyLeft:220 } }; fixture.sticky={ contextWidth:265,viewportWidth:300 }; assert(codes(fixture).includes('STICKY_CONTEXT_OCCUPIES_VIEWPORT'), 'sticky context must leave a touch-target-wide editable area');

const fixed = base(); fixed.case = 'fixed-asset'; fixed.columns = {
  life:{ width:68.390625,actualWidth:68.390625,representativeRequiredWidth:68.4,occupiedWidth:68.390625,contentWaste:0,classification:'years',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  acquisitionCost:{ width:63,occupiedWidth:63,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false },
  currentDepreciation:{ width:105,occupiedWidth:105,classification:'numeric',headerClipped:false,cellClipped:false,editableAnswerFitFailure:false,headerLineCount:1,headerGlyphStacked:false }
};
fixed.rows = { headerRowHeight:25.75,normalRowHeight:48,editableRowHeight:48,inputVisualHeight:44,paddingTop:'1.5px',paddingBottom:'1.5px',borderTop:0,borderBottom:1,expectedNormalRowHeight:48,expectedEditableRowHeight:48 };
assert.deepStrictEqual(codes(fixed), [], 'readable 68.39px years and exact mobile density pass');
fixture = structuredClone(fixed); fixture.columns.life.width = 81; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'years width above the 80px semantic maximum fails');
fixture = structuredClone(fixed); fixture.columns.life.width = 68.4; fixture.columns.life.actualWidth = 68.4; assert(!codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), '68.4px years width remains within the 80px semantic maximum');
fixture = structuredClone(fixed); fixture.columns.life.headerClipped = true; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'years header clipping fails');
fixture = structuredClone(fixed); fixture.columns.life.headerGlyphStacked = true; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'), 'stacked years header glyphs fail');
fixture = structuredClone(fixed); fixture.rows.normalRowHeight = 49; assert(codes(fixture).includes('COMPACT_TABLE_DENSITY_FAILURE'), 'mobile density excessive fails');

const known = { columns:{ life:{ classification:'numeric',computedMinWidth:'114px',canonicalValues:[5,5,5,5,5,5],contentMax:5,contentLength:1,editable:false },acquisitionCost:{ classification:'numeric',computedMinWidth:'114px' } } };
assert.strictEqual(detectGeneration10KnownViolation(known),true,'Generation 10 shared numeric floor is detected');
known.columns.life.computedMinWidth = '70px'; assert.strictEqual(detectGeneration10KnownViolation(known),false,'a separate life floor is not mislabeled as the known defect');
console.log('visual gate self-tests: representative isolation, clipping, editable fit, content waste, years, mobile density, desktop chrome: ok');
