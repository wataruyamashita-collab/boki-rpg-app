'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const crypto=require('crypto');
const {validateArtifact}=require('../scripts/qa/validate-edu-taxonomy');

const ARTIFACT='reports/edu-quality/question-taxonomy-2026.json';
assert(fs.existsSync(ARTIFACT),'Issue #201 taxonomy sidecar must exist');

const artifact=JSON.parse(fs.readFileSync(ARTIFACT,'utf8'));
assert.strictEqual(artifact.schemaVersion,1);
assert.strictEqual(artifact.syllabusAuthorityVersion,'JCCI_GRADE3_2022_APPLIED_2026');
assert.strictEqual(artifact.source.mainHead,'08d13e806d4983114e44506407ef7b7b109356e6');
assert.strictEqual(artifact.source.generation,109);
assert.strictEqual(artifact.source.release,'20260924-175');

// Issue #199 Design Lock: period-end capitalization of expensed unused supplies,
// not merchandise purchases/cost of sales. Baseline: ef86102d (Generation142).
// Issue #199: rubric v0.3 (#178 comment 6010772012), final executed inputs.
const l031=artifact.rows.find(row=>row.id==='L031');
assert.strictEqual(l031.cognitiveLevel,'Knowledge','L031 scores five recalled terms, not reasons');
assert.strictEqual(l031.explanationLearningObjective.performanceVerb,'IDENTIFY');
const l050=artifact.rows.find(row=>row.id==='L050');
assert.strictEqual(l050.cognitiveLevel,'Application','L050 applies routine voucher classification');
assert.strictEqual(l050.explanationLearningObjective.performanceVerb,'CLASSIFY');
assert.deepStrictEqual(l050.explanationLearningObjective.targetConceptIds,['BOOK_VOUCHER_CLASSIFICATION']);

const j035=artifact.rows.find(row=>row.id==='J035');
assert.strictEqual(j035.primarySyllabusMapping.code,'P3-3','J035 unused stamps are a closing adjustment');
assert.deepStrictEqual(j035.secondarySyllabusMappings,[{code:'P2-21'}]);
assert.deepStrictEqual(artifact.prerequisiteConcepts.ADJ_UNUSED_SUPPLIES,
  ['TX_REVENUE_EXPENSE','FND_ACCOUNT_CLASSIFICATION']);
assert.deepStrictEqual(j035.explanationLearningObjective.targetConceptIds,['ADJ_UNUSED_SUPPLIES','TX_TAX']);
assert.strictEqual(j035.transferGroup,'XFER:unused-revenue-stamp-adjustment');
assert.strictEqual(j035.transferStatus,'TRANSFER_REVIEW_REQUIRED');
assert.strictEqual(j035.cognitiveLevel,'Application');
assert.strictEqual(j035.explanationLearningObjective.performanceVerb,'APPLY');
assert.strictEqual(crypto.createHash('sha256').update(JSON.stringify(artifact.rows.filter(row=>!['L031','L050'].includes(row.id)))).digest('hex'),
  'c47c057125d66e823e4bdd4a8b938baede757faa9f64c53678d391bfeb5ab5f5','L031/L050 correction preserves the other 298 rows including accepted J035 and held L039 (c00bdabd)');

const sandbox={window:{},console:{log(){},warn(){},error(){}}};
vm.runInNewContext(fs.readFileSync('data/questions.js','utf8'),sandbox,{filename:'data/questions.js'});
const questions=sandbox.window.QuestionData;
const ids=Object.keys(questions).sort();
assert.deepStrictEqual(JSON.parse(JSON.stringify(questions.L031.answer.cells)),{
  assetIncreaseSide:'借方',assetDecreaseSide:'貸方',liabilityIncreaseSide:'貸方',liabilityDecreaseSide:'借方',balancePrinciple:'一致'
},'L031 final executed answer requires recalled rules');
assert.deepStrictEqual(JSON.parse(JSON.stringify(questions.L050.answer.cells)),{
  value1:50000,value2:20000,value3:30000
},'L050 final executed answer allocates three transaction amounts');
assert.deepStrictEqual(artifact.prerequisiteConcepts.BOOK_VOUCHER_CLASSIFICATION,['FND_JOURNAL_ENTRY','FND_EVIDENCE_READING']);

assert(Array.isArray(artifact.rows));
assert.strictEqual(artifact.rows.length,300,'taxonomy row count');
const rowIds=artifact.rows.map(row=>row.id);
assert.strictEqual(new Set(rowIds).size,300,'taxonomy IDs unique');
assert.deepStrictEqual([...rowIds].sort(),ids,'taxonomy IDs exactly match canonical QuestionData');

const syllabusCodes=new Set([
  'P1-1','P1-2','P1-3','P1-4','P1-5',
  'P2-1','P2-3','P2-4','P2-5','P2-6','P2-7','P2-9','P2-12','P2-20','P2-21',
  'P3-1','P3-2','P3-3','P3-4','P3-5','P3-6','P3-8','P3-9',
  'P4-1','P4-3','P4-4'
]);
const mappingModes=new Set(['DIRECT','MULTI','ITEM_DERIVED']);
const cognitiveLevels=new Set(['Knowledge','Understanding','Application','Integrated Judgment']);
const errorTags=new Set([
  'ACCOUNT_CLASSIFICATION','SIDE_DIRECTION','AMOUNT_ROLE_OR_CALC','MISSING_ELEMENT',
  'CORRECTION_DIFFERENCE','TABLE_CELL_MEANING','GENERAL_ACCOUNTING_MISMATCH'
]);
const performanceVerbs=new Set([
  'IDENTIFY','CLASSIFY','APPLY','CALCULATE_AND_APPLY','POST','RECONCILE','CONSTRUCT','INTEGRATE','EXPLAIN'
]);
const transferStatuses=new Set(['GROUP_CONFIRMED','CROSS_GROUP_CONFIRMED','TRANSFER_REVIEW_REQUIRED']);

assert(artifact.prerequisiteConcepts&&typeof artifact.prerequisiteConcepts==='object');
const conceptIds=Object.keys(artifact.prerequisiteConcepts);
assert.strictEqual(conceptIds.length,37,'controlled prerequisite concept count');
const conceptSet=new Set(conceptIds);
for(const [id,deps] of Object.entries(artifact.prerequisiteConcepts)){
  assert(Array.isArray(deps),id+': prerequisite DAG deps array');
  for(const dep of deps)assert(conceptSet.has(dep),id+': unknown prerequisite dependency '+dep);
}
const visiting=new Set(),done=new Set();
function visit(id){
  assert(!visiting.has(id),'prerequisite DAG cycle at '+id);
  if(done.has(id))return;
  visiting.add(id);
  for(const dep of artifact.prerequisiteConcepts[id])visit(dep);
  visiting.delete(id);
  done.add(id);
}
conceptIds.forEach(visit);

const mappingCounts={DIRECT:0,MULTI:0,ITEM_DERIVED:0};
const cognitiveCounts={Knowledge:0,Understanding:0,Application:0,'Integrated Judgment':0};
const itemDerived=new Set();
const transferReview=new Set();
for(const row of artifact.rows){
  const q=questions[row.id];
  assert(q,row.id+': missing canonical question');
  assert.strictEqual(row.authoredCategory,q.category,row.id+': authoredCategory drift');
  assert.strictEqual(row.difficulty,q.difficulty,row.id+': difficulty drift');
  assert.strictEqual(row.answerType,q.type,row.id+': answerType drift');
  assert.strictEqual(row.syllabusAuthorityVersion,artifact.syllabusAuthorityVersion,row.id+': syllabus version drift');
  assert(mappingModes.has(row.mappingMode),row.id+': mappingMode');
  mappingCounts[row.mappingMode]++;
  assert(row.primarySyllabusMapping&&syllabusCodes.has(row.primarySyllabusMapping.code),row.id+': primary syllabus code');
  assert(Array.isArray(row.secondarySyllabusMappings),row.id+': secondary syllabus mappings');
  row.secondarySyllabusMappings.forEach(item=>assert(syllabusCodes.has(item.code),row.id+': secondary syllabus code'));
  assert.strictEqual(row.scopeStatus2026,'IN_SCOPE',row.id+': scope status');
  assert(typeof row.mappingRationale==='string'&&row.mappingRationale.trim().length>=12,row.id+': mapping rationale');
  assert(Array.isArray(row.prerequisiteConcepts)&&row.prerequisiteConcepts.length>0,row.id+': prerequisite concepts');
  row.prerequisiteConcepts.forEach(id=>assert(conceptSet.has(id),row.id+': unknown prerequisite '+id));
  assert(Array.isArray(row.sequencingEvidenceQuestionIds),row.id+': sequencing evidence');
  row.sequencingEvidenceQuestionIds.forEach(id=>assert(questions[id],row.id+': unknown sequencing question '+id));
  assert(cognitiveLevels.has(row.cognitiveLevel),row.id+': cognitive level');
  cognitiveCounts[row.cognitiveLevel]++;
  assert(Array.isArray(row.cognitiveEvidence)&&row.cognitiveEvidence.length>0,row.id+': cognitive evidence');
  assert(row.cognitiveEvidence.every(v=>typeof v==='string'&&v.trim().length>=12),row.id+': cognitive evidence text');
  assert(Array.isArray(row.likelyErrorTags)&&row.likelyErrorTags.length>0,row.id+': likely error tags');
  row.likelyErrorTags.forEach(tag=>assert(errorTags.has(tag),row.id+': unknown error tag '+tag));
  const objective=row.explanationLearningObjective;
  assert(objective&&Array.isArray(objective.targetConceptIds)&&objective.targetConceptIds.length>0,row.id+': objective target concepts');
  objective.targetConceptIds.forEach(id=>assert(conceptSet.has(id),row.id+': unknown objective concept '+id));
  assert(performanceVerbs.has(objective.performanceVerb),row.id+': performance verb');
  assert(typeof objective.observableOutcome==='string'&&objective.observableOutcome.trim().length>=12,row.id+': observable outcome');
  assert(typeof row.transferGroup==='string'&&row.transferGroup,row.id+': transferGroup');
  assert(transferStatuses.has(row.transferStatus),row.id+': transferStatus');
  if(row.mappingMode==='ITEM_DERIVED')itemDerived.add(row.id);
  if(row.transferStatus==='TRANSFER_REVIEW_REQUIRED')transferReview.add(row.id);
}
assert.deepStrictEqual(mappingCounts,{DIRECT:219,MULTI:54,ITEM_DERIVED:27},'mappingMode aggregate');
assert.deepStrictEqual(cognitiveCounts,{Knowledge:1,Understanding:0,Application:224,'Integrated Judgment':75},'cognitive aggregate');

const expectedItemDerived=[
  ...Array.from({length:20},(_,i)=>'E'+String(i+1).padStart(3,'0')),
  'J038','J039','J088','J089','J138','J139','J147'
].sort();
assert.deepStrictEqual([...itemDerived].sort(),expectedItemDerived,'item-derived exceptions');

const expectedTransferReview=['J035','J051','J085','J131','J134','J135','J147','L031','L039','L050','D001','F001'].sort();
assert.deepStrictEqual([...transferReview].sort(),expectedTransferReview,'transfer review candidates');

assert(!fs.readFileSync('index.html','utf8').includes(ARTIFACT),'runtime HTML must not load taxonomy sidecar');
assert(!fs.readFileSync('service-worker.js','utf8').includes(ARTIFACT),'service worker must not cache taxonomy sidecar');

assert(validateArtifact(artifact).ok);
for(const [name,mutate] of [
  ['merchandise mapping',a=>a.rows.find(r=>r.id==='J035').primarySyllabusMapping.code='P2-9'],
  ['inventory concept',a=>a.rows.find(r=>r.id==='J035').explanationLearningObjective.targetConceptIds[0]='ADJ_INVENTORY_COST'],
  ['unrelated transfer group',a=>a.rows.find(r=>r.id==='J035').transferGroup='XFER:syllabus:P3-3'],
  ['unsupported transfer confirmation',a=>a.rows.find(r=>r.id==='J035').transferStatus='GROUP_CONFIRMED'],
  ['generic objective',a=>a.rows.find(r=>r.id==='J035').explanationLearningObjective.observableOutcome='取引事実を読み適切な会計処理を選択できる。'],
  ['wrong dependency',a=>a.prerequisiteConcepts.ADJ_UNUSED_SUPPLIES=['TX_INVENTORY_PURCHASE_SALES']],
  ['dependency cycle',a=>a.prerequisiteConcepts.ADJ_UNUSED_SUPPLIES.push('ADJ_UNUSED_SUPPLIES')]
]){
  const broken=JSON.parse(JSON.stringify(artifact));mutate(broken);
  assert.throws(()=>validateArtifact(broken),/J035|ADJ_UNUSED_SUPPLIES|cycle|transfer review candidates/,name);
}

// Keep aggregate counts unchanged in cognitive mutants, so rejection must
// identify the wrong assessed demand rather than merely count totals.
for(const [name,mutate,reason] of [
  ['L031 unsupported application',a=>{a.rows.find(r=>r.id==='L031').cognitiveLevel='Application';a.rows.find(r=>r.id==='J001').cognitiveLevel='Knowledge';},/L031 assessed demand/],
  ['L031 explanation verb',a=>a.rows.find(r=>r.id==='L031').explanationLearningObjective.performanceVerb='EXPLAIN',/L031 assessed demand/],
  ['L031 wrong target',a=>a.rows.find(r=>r.id==='L031').explanationLearningObjective.targetConceptIds=['FND_EVIDENCE_READING'],/L031 account-rule target/],
  ['L050 unsupported integration',a=>{a.rows.find(r=>r.id==='L050').cognitiveLevel='Integrated Judgment';a.rows.find(r=>r.id==='L039').cognitiveLevel='Application';},/L050 assessed demand/],
  ['L050 reconcile verb',a=>a.rows.find(r=>r.id==='L050').explanationLearningObjective.performanceVerb='RECONCILE',/L050 assessed demand/],
  ['L050 generic target',a=>a.rows.find(r=>r.id==='L050').explanationLearningObjective.targetConceptIds=['FND_EVIDENCE_READING'],/L050 voucher target/],
  ['L031 wrong syllabus',a=>a.rows.find(r=>r.id==='L031').primarySyllabusMapping.code='P1-4',/L031 syllabus/],
  ['L050 wrong syllabus',a=>a.rows.find(r=>r.id==='L050').primarySyllabusMapping.code='P1-4',/L050 syllabus/]
]){
  const broken=JSON.parse(JSON.stringify(artifact));mutate(broken);
  assert.throws(()=>validateArtifact(broken),reason,name);
}
console.log('ISSUE201_EDU_TAXONOMY_SIDECAR_PASS');
