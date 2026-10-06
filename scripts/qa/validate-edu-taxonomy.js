'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const ROOT=path.resolve(__dirname,'../..');
const ARTIFACT_REL='reports/edu-quality/question-taxonomy-2026.json';
const ARTIFACT=path.join(ROOT,ARTIFACT_REL);

const SYLLABUS_CODES=new Set([
  'P1-1','P1-2','P1-3','P1-4','P1-5',
  'P2-1','P2-3','P2-4','P2-5','P2-6','P2-7','P2-9','P2-12','P2-20','P2-21',
  'P3-1','P3-2','P3-3','P3-4','P3-5','P3-6','P3-8','P3-9',
  'P4-1','P4-3','P4-4'
]);
const MAPPING_MODES=new Set(['DIRECT','MULTI','ITEM_DERIVED']);
const COGNITIVE_LEVELS=new Set(['Knowledge','Understanding','Application','Integrated Judgment']);
const ERROR_TAGS=new Set([
  'ACCOUNT_CLASSIFICATION','SIDE_DIRECTION','AMOUNT_ROLE_OR_CALC','MISSING_ELEMENT',
  'CORRECTION_DIFFERENCE','TABLE_CELL_MEANING','GENERAL_ACCOUNTING_MISMATCH'
]);
const PERFORMANCE_VERBS=new Set([
  'IDENTIFY','CLASSIFY','APPLY','CALCULATE_AND_APPLY','POST','RECONCILE','CONSTRUCT','INTEGRATE','EXPLAIN'
]);
const TRANSFER_STATUSES=new Set(['GROUP_CONFIRMED','CROSS_GROUP_CONFIRMED','TRANSFER_REVIEW_REQUIRED']);

function loadQuestions(){
  const sandbox={window:{},console:{log(){},warn(){},error(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'data/questions.js'),'utf8'),sandbox,{filename:'data/questions.js'});
  return sandbox.window.QuestionData||{};
}
function fail(message){throw new Error(message);}
function requireArray(value,message){if(!Array.isArray(value))fail(message);}
function requireText(value,message,min=1){if(typeof value!=='string'||value.trim().length<min)fail(message);}

function validateArtifact(artifact,questions=loadQuestions()){
  if(!artifact||typeof artifact!=='object')fail('taxonomy artifact must be an object');
  if(artifact.schemaVersion!==1)fail('schemaVersion must be 1');
  if(artifact.syllabusAuthorityVersion!=='JCCI_GRADE3_2022_APPLIED_2026')fail('syllabus authority version drift');

  const authority=artifact.officialSyllabusAuthority;
  if(!authority||typeof authority!=='object')fail('official syllabus authority missing');
  if(authority.organization!=='日本商工会議所')fail('official syllabus organization mismatch');
  if(authority.effectiveDate!=='2022-04-01')fail('official syllabus effective date mismatch');
  if(authority.appliesToExamYear!==2026)fail('official syllabus 2026 applicability mismatch');
  if(!/^https:\/\/www\.kentei\.ne\.jp\//.test(authority.authorityPageUrl||''))fail('official syllabus authority page URL invalid');
  if(!/^https:\/\/www\.kentei\.ne\.jp\//.test(authority.pdfUrl||''))fail('official syllabus PDF URL invalid');

  const legend=artifact.syllabusCodeLegend;
  if(!legend||typeof legend!=='object')fail('syllabus code legend missing');
  for(const code of SYLLABUS_CODES){
    if(!legend[code])fail('syllabus code legend missing '+code);
    requireText(legend[code],'syllabus legend text missing '+code,5);
  }

  const ids=Object.keys(questions).sort();
  const rows=artifact.rows||[];
  if(rows.length!==300)fail('taxonomy row count must be 300');
  if(new Set(rows.map(r=>r.id)).size!==300)fail('taxonomy IDs must be unique');
  if(JSON.stringify(rows.map(r=>r.id).sort())!==JSON.stringify(ids))fail('taxonomy IDs must exactly match QuestionData');

  const concepts=artifact.prerequisiteConcepts||{};
  if(Object.keys(concepts).length!==35)fail('prerequisite concept count must be 35');
  const conceptSet=new Set(Object.keys(concepts));
  const visiting=new Set(),done=new Set();
  const visit=id=>{
    if(visiting.has(id))fail('prerequisite DAG cycle '+id);
    if(done.has(id))return;
    visiting.add(id);
    const deps=concepts[id];
    requireArray(deps,id+': prerequisite DAG deps array');
    for(const dep of deps){
      if(!conceptSet.has(dep))fail('unknown prerequisite dependency '+dep);
      visit(dep);
    }
    visiting.delete(id);done.add(id);
  };
  Object.keys(concepts).forEach(visit);

  const mappingCounts={DIRECT:0,MULTI:0,ITEM_DERIVED:0};
  const cognitiveCounts={Knowledge:0,Understanding:0,Application:0,'Integrated Judgment':0};
  const itemDerived=new Set();
  const transferReview=new Set();

  for(const row of rows){
    const q=questions[row.id];
    if(!q)fail(row.id+': missing question');
    if(row.syllabusAuthorityVersion!==artifact.syllabusAuthorityVersion)fail(row.id+': syllabus version drift');
    if(row.authoredCategory!==q.category)fail(row.id+': category drift');
    if(row.difficulty!==q.difficulty)fail(row.id+': difficulty drift');
    if(row.answerType!==q.type)fail(row.id+': answer type drift');

    if(!MAPPING_MODES.has(row.mappingMode))fail(row.id+': mappingMode');
    mappingCounts[row.mappingMode]++;
    if(!row.primarySyllabusMapping||!SYLLABUS_CODES.has(row.primarySyllabusMapping.code))fail(row.id+': primary syllabus mapping invalid');
    requireArray(row.secondarySyllabusMappings,row.id+': secondary syllabus mappings');
    for(const item of row.secondarySyllabusMappings)if(!item||!SYLLABUS_CODES.has(item.code))fail(row.id+': secondary syllabus code');
    if(row.scopeStatus2026!=='IN_SCOPE')fail(row.id+': scope status');
    requireText(row.mappingRationale,row.id+': mapping rationale',12);

    requireArray(row.prerequisiteConcepts,row.id+': prerequisite concepts');
    if(row.prerequisiteConcepts.length===0)fail(row.id+': prerequisite concepts empty');
    for(const id of row.prerequisiteConcepts)if(!conceptSet.has(id))fail(row.id+': unknown prerequisite '+id);

    requireArray(row.sequencingEvidenceQuestionIds,row.id+': sequencing evidence');
    for(const id of row.sequencingEvidenceQuestionIds)if(!questions[id])fail(row.id+': unknown sequencing evidence '+id);

    if(!COGNITIVE_LEVELS.has(row.cognitiveLevel))fail(row.id+': cognitive level');
    cognitiveCounts[row.cognitiveLevel]++;
    requireArray(row.cognitiveEvidence,row.id+': cognitive evidence');
    if(row.cognitiveEvidence.length===0||!row.cognitiveEvidence.every(v=>typeof v==='string'&&v.trim().length>=12))fail(row.id+': cognitive evidence text');

    requireArray(row.likelyErrorTags,row.id+': likely error tags');
    if(row.likelyErrorTags.length===0)fail(row.id+': likely error tags empty');
    for(const tag of row.likelyErrorTags)if(!ERROR_TAGS.has(tag))fail(row.id+': unknown error tag '+tag);

    const objective=row.explanationLearningObjective;
    if(!objective||typeof objective!=='object')fail(row.id+': learning objective missing');
    requireArray(objective.targetConceptIds,row.id+': objective target concepts');
    if(objective.targetConceptIds.length===0)fail(row.id+': objective target concepts empty');
    for(const id of objective.targetConceptIds)if(!conceptSet.has(id))fail(row.id+': unknown objective concept '+id);
    if(!PERFORMANCE_VERBS.has(objective.performanceVerb))fail(row.id+': performance verb');
    requireText(objective.observableOutcome,row.id+': observable outcome',12);

    requireText(row.transferGroup,row.id+': transferGroup');
    if(!TRANSFER_STATUSES.has(row.transferStatus))fail(row.id+': transferStatus');

    if(row.mappingMode==='ITEM_DERIVED')itemDerived.add(row.id);
    if(row.transferStatus==='TRANSFER_REVIEW_REQUIRED')transferReview.add(row.id);
  }

  const expectedMapping={DIRECT:218,MULTI:55,ITEM_DERIVED:27};
  if(JSON.stringify(mappingCounts)!==JSON.stringify(expectedMapping))fail('mappingMode aggregate mismatch');
  const expectedCognitive={Knowledge:0,Understanding:0,Application:224,'Integrated Judgment':76};
  if(JSON.stringify(cognitiveCounts)!==JSON.stringify(expectedCognitive))fail('cognitive aggregate mismatch');

  const expectedItemDerived=[
    ...Array.from({length:20},(_,i)=>'E'+String(i+1).padStart(3,'0')),
    'J038','J039','J088','J089','J138','J139','J147'
  ].sort();
  if(JSON.stringify([...itemDerived].sort())!==JSON.stringify(expectedItemDerived))fail('item-derived exceptions mismatch');

  const expectedTransferReview=['J035','J085','J131','J134','J135','J147','L039','L050','D001','F001'].sort();
  if(JSON.stringify([...transferReview].sort())!==JSON.stringify(expectedTransferReview))fail('transfer review candidates mismatch');

  const f001=rows.find(row=>row.id==='F001');
  if(!f001||JSON.stringify(f001.explanationLearningObjective.targetConceptIds)!==JSON.stringify(['FS_INCOME_STATEMENT']))fail('F001 income statement learning target mismatch');

  return {ok:true,rows:rows.length,concepts:Object.keys(concepts).length,mappingCounts,cognitiveCounts};
}

function validate(){
  if(!fs.existsSync(ARTIFACT))fail('taxonomy sidecar missing');
  const artifact=JSON.parse(fs.readFileSync(ARTIFACT,'utf8'));
  const result=validateArtifact(artifact);
  if(fs.readFileSync(path.join(ROOT,'index.html'),'utf8').includes('question-taxonomy-2026.json'))fail('runtime must not load taxonomy sidecar');
  if(fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8').includes('question-taxonomy-2026.json'))fail('service worker must not cache taxonomy sidecar');
  return result;
}

if(require.main===module){const result=validate();console.log('EDU_TAXONOMY_VALIDATOR_PASS',result.rows,result.concepts);}
module.exports={ARTIFACT_REL,validate,validateArtifact};
