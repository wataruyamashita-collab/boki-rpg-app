'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const ROOT=path.resolve(__dirname,'../..');
const ARTIFACT=path.join(ROOT,'reports/edu-quality/question-taxonomy-2026.json');
function validate(){
  if(!fs.existsSync(ARTIFACT))throw new Error('taxonomy sidecar missing');
  const artifact=JSON.parse(fs.readFileSync(ARTIFACT,'utf8'));
  const sandbox={window:{},console:{log(){},warn(){},error(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'data/questions.js'),'utf8'),sandbox,{filename:'data/questions.js'});
  const questions=sandbox.window.QuestionData||{};
  const ids=Object.keys(questions).sort();
  const rows=artifact.rows||[];
  if(rows.length!==300)throw new Error('taxonomy row count must be 300');
  if(new Set(rows.map(r=>r.id)).size!==300)throw new Error('taxonomy IDs must be unique');
  if(JSON.stringify(rows.map(r=>r.id).sort())!==JSON.stringify(ids))throw new Error('taxonomy IDs must exactly match QuestionData');
  const concepts=artifact.prerequisiteConcepts||{};
  if(Object.keys(concepts).length!==35)throw new Error('prerequisite concept count must be 35');
  const conceptSet=new Set(Object.keys(concepts));
  const visiting=new Set(),done=new Set();
  const visit=id=>{if(visiting.has(id))throw new Error('prerequisite DAG cycle '+id);if(done.has(id))return;visiting.add(id);for(const dep of concepts[id]||[]){if(!conceptSet.has(dep))throw new Error('unknown prerequisite dependency '+dep);visit(dep);}visiting.delete(id);done.add(id);};
  Object.keys(concepts).forEach(visit);
  for(const row of rows){
    const q=questions[row.id];
    if(!q)throw new Error(row.id+': missing question');
    if(row.authoredCategory!==q.category)throw new Error(row.id+': category drift');
    if(row.difficulty!==q.difficulty)throw new Error(row.id+': difficulty drift');
    if(row.answerType!==q.type)throw new Error(row.id+': answer type drift');
    for(const id of row.prerequisiteConcepts||[])if(!conceptSet.has(id))throw new Error(row.id+': unknown prerequisite '+id);
    for(const id of row.explanationLearningObjective?.targetConceptIds||[])if(!conceptSet.has(id))throw new Error(row.id+': unknown objective concept '+id);
    for(const id of row.sequencingEvidenceQuestionIds||[])if(!questions[id])throw new Error(row.id+': unknown sequencing evidence '+id);
  }
  if(fs.readFileSync(path.join(ROOT,'index.html'),'utf8').includes('question-taxonomy-2026.json'))throw new Error('runtime must not load taxonomy sidecar');
  if(fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8').includes('question-taxonomy-2026.json'))throw new Error('service worker must not cache taxonomy sidecar');
  return {ok:true,rows:rows.length,concepts:Object.keys(concepts).length};
}
if(require.main===module){const result=validate();console.log('EDU_TAXONOMY_VALIDATOR_PASS',result.rows,result.concepts);}
module.exports={validate};
