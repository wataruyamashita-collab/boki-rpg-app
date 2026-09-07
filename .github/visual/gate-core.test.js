'use strict';
const assert = require('assert');
const { detectGeneration10KnownViolation, evaluateVisualMetrics } = require('./gate-core');

const base = () => ({
  columns:{ value:{ width:100, requiredWidth:90, clipped:false, headerLineCount:1, headerGlyphStacked:false } },
  rows:{ normalRowHeight:44, editableRowHeight:52 },
  table:{ requiresHorizontalScroll:false, horizontalScrollAvailable:true, clipped:false }
});
const codes = input => evaluateVisualMetrics(input).map(item => item.code);
assert.deepStrictEqual(codes(base()), [], 'a reasonably fitted table passes');
let fixture = base(); fixture.columns.value.width = 70; assert(codes(fixture).includes('COLUMN_TOO_NARROW'));
fixture = base(); fixture.columns.value.width = 180; assert(codes(fixture).includes('COLUMN_TOO_WIDE'));
fixture = base(); fixture.rows.editableRowHeight = 72; assert(codes(fixture).includes('ROW_TOO_TALL'));
fixture = base(); fixture.columns.value.clipped = true; assert(codes(fixture).includes('CONTENT_CLIPPED'));
fixture = base(); fixture.table = { requiresHorizontalScroll:true, horizontalScrollAvailable:false }; assert(codes(fixture).includes('HORIZONTAL_OVERFLOW_UNAVAILABLE'));
fixture = base(); fixture.columns.value.headerLineCount = 5; fixture.columns.value.headerGlyphStacked = true; assert(codes(fixture).includes('UNREADABLE_HEADER_WRAP'));
const known = { columns:{ life:{ classification:'numeric',computedMinWidth:'114px',canonicalValues:[5,5,5,5,5,5],contentMax:5,contentLength:1,editable:false },acquisitionCost:{ classification:'numeric',computedMinWidth:'114px' } } };
assert.strictEqual(detectGeneration10KnownViolation(known),true,'Generation 10 shared numeric floor is detected');
known.columns.life.computedMinWidth = '70px'; assert.strictEqual(detectGeneration10KnownViolation(known),false,'a separate life floor is not mislabeled as the known defect');
const fixed = base(); fixed.case = 'fixed-asset'; fixed.viewport = { width:390 }; fixed.columns = { life:{ width:70,requiredWidth:68,clipped:false,headerLineCount:1,headerGlyphStacked:false },acquisitionCost:{ width:120,requiredWidth:110,clipped:false,headerLineCount:1,headerGlyphStacked:false },currentDepreciation:{ width:150,requiredWidth:140,clipped:false,headerLineCount:1,headerGlyphStacked:false } }; fixed.rows = { headerRowHeight:40,normalRowHeight:46,editableRowHeight:48,inputVisualHeight:44 };
assert.deepStrictEqual(codes(fixed), [], 'mobile fixed asset semantic width and density contract passes');
fixture = structuredClone(fixed); fixture.columns.life.width = 120; assert(codes(fixture).includes('YEARS_COLUMN_EXCESSIVE_WIDTH'));
fixture = structuredClone(fixed); fixture.rows.editableRowHeight = 52; assert(codes(fixture).includes('COMPACT_TABLE_DENSITY_FAILURE'));
fixture = structuredClone(fixed); fixture.columns.life.width = 67; assert(codes(fixture).includes('COLUMN_TOO_NARROW'), 'years still fail when narrower than their four-glyph semantic requirement');
console.log('visual gate self-tests: normal, semantic years, compact density, narrow, wide, tall, clipping, overflow, wrapping: ok');
