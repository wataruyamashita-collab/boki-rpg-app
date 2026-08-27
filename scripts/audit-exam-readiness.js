'use strict';
const fs = require('fs');
const vm = require('vm');

function loadRuntime() {
  const sandbox={ window:{} }; vm.createContext(sandbox);
  for (const file of ['data/questions.js','js/controller.js']) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
  return sandbox.window;
}
function structuralProfile(q) {
  const materialSchema=[...new Set((q.materials||[]).flatMap(row=>Object.keys(row)))].sort();
  const inputSchema=(q.table?.inputCells||[]).map(cell=>q.table?.inputMetadata?.[cell]?.semanticType||q.table?.inputTypes?.[cell]||'amount');
  const visible=JSON.stringify({question:q.question,materials:q.materials,table:q.table?.rows});
  const operations=['棚卸','貸倒','消費税','減価償却','月割','訂正','元丁','満期','移動平均'].filter(term=>visible.includes(term));
  const authoredPath=q.structuralProfile?.reasoningSteps ? [...q.structuralProfile.reasoningSteps, q.structuralProfile.calculationPath].filter(Boolean) : null;
  const reasoningPath=authoredPath||[
    materialSchema.length?'source-selection':'transaction-recognition',
    q.type==='journal'?'double-entry':q.format||q.type,
    ...operations,
    (q.table?.inputCells||[]).length>2?'multi-step':'single-step'
  ];
  return { concept:q.structuralProfile?.concept||q.category, bookType:/帳|元帳|台帳/.test(q.category)?q.category:'', materialSchema, inputSchema, reasoningPath, numberOfSteps:reasoningPath.length, businessContext:q.structuralProfile?.context||q.scene||'' };
}
function structureSignature(q) { return JSON.stringify(structuralProfile(q)); }
function demonstratesTransfer(items) { return items.length>=2 && new Set(items.map(structureSignature)).size>=2; }
function hasRealInput(q) { return (q.materials?.length||0)>0 && (q.table?.inputCells?.length||0)>0; }
function predicates() {
  return [
    ['仕訳',q=>q.type==='journal'],
    ['仕訳帳',q=>/仕訳帳/.test(q.category)&&hasRealInput(q)],
    ['総勘定元帳',q=>/総勘定元帳/.test(q.category)&&hasRealInput(q)],
    ['受取手形記入帳',q=>/受取手形記入帳/.test(q.category)&&hasRealInput(q)],
    ['支払手形記入帳',q=>/支払手形記入帳/.test(q.category)&&hasRealInput(q)],
    ['固定資産',q=>hasRealInput(q)&&(/取得原価|耐用年数|減価償却/.test(q.question)||q.materials.some(row=>'取得原価' in row||'取得日' in row))],
    ['年利率・月割利息',q=>hasRealInput(q)&&/年利/.test(JSON.stringify({question:q.question,materials:q.materials}))&&/(月割|か月|月分|月1日|月31日)/.test(JSON.stringify({question:q.question,materials:q.materials}))],
    ['決算整理',q=>hasRealInput(q)&&['worksheet','comprehensive'].includes(q.type)],
    ['P/L・B/S統合',q=>hasRealInput(q)&&q.format==='exam-question-3'],
    ['初見転移',q=>hasRealInput(q)&&q.learningRole==='transfer']
  ];
}
function evaluateRows(candidateQuestions,attemptQuestions=candidateQuestions) {
  return predicates().map(([topic,predicate])=>{
    const candidates=candidateQuestions.filter(predicate); const appeared=attemptQuestions.filter(predicate);
    const signatures=new Set(candidates.map(structureSignature));
    const paths=new Set(candidates.map(q=>JSON.stringify(structuralProfile(q).reasoningPath)));
    const pass=candidates.length>=2&&signatures.size>=2&&paths.size>=2&&appeared.length>=2;
    return {officialTopic:topic,questions:candidates.length,appeared:appeared.length,structuralSignatures:signatures.size,reasoningPaths:paths.size,pass};
  });
}
function runAudit() {
  const root=loadRuntime(), Controller=root.AppController, questions=root.QuestionData;
  const base={questions,ids:Object.keys(questions),semanticAudit:root.validateSemanticQuestionData(questions),model:{state:{examAttempt:0}}};
  base.examCandidateIds=Controller.prototype.examCandidateIds;
  const candidateIds=base.examCandidateIds();
  const attempts=Array.from({length:20},(_,attempt)=>{base.model.state.examAttempt=attempt;const ids=Controller.prototype.buildExamIds.call(base);return {attempt,questionIds:ids,structuralSignatures:ids.map(id=>structureSignature(questions[id]))};});
  const appearedIds=[...new Set(attempts.flatMap(row=>row.questionIds))];
  const rows=evaluateRows(candidateIds.map(id=>questions[id]),appearedIds.map(id=>questions[id]));
  const exactSets=new Set(attempts.map(row=>row.questionIds.join(','))).size;
  const structuralSets=new Set(attempts.map(row=>row.structuralSignatures.join('|'))).size;
  const poolConsistent=JSON.stringify(candidateIds)===JSON.stringify(root.ExamPoolDefinition);
  const failures=rows.filter(row=>!row.pass);
  return {actualCandidateCount:candidateIds.length,actualCandidateIds:candidateIds,attemptCountAudited:attempts.length,uniqueExactSets:exactSets,uniqueStructuralSets:structuralSets,poolConsistent,attempts,rows,ok:poolConsistent&&exactSets>2&&structuralSets>2&&!failures.length};
}
if(require.main===module){const report=runAudit();console.log(JSON.stringify(report,null,2));console.log(`Exam Readiness Audit: ${report.ok?'PASS':'FAIL'} (${report.rows.filter(x=>x.pass).length}/10)`);if(!report.ok)process.exitCode=1;}
module.exports={structuralProfile,structureSignature,demonstratesTransfer,evaluateRows,runAudit};
