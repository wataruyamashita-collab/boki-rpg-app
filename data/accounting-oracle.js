(function(root){
'use strict';
const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const freezeExpected=(item,expected)=>Object.freeze(item.type==='journal'
  ? {debit:freezeRows(expected.debit),credit:freezeRows(expected.credit)}
  : {cells:Object.freeze({...expected})});
const clone=value=>JSON.parse(JSON.stringify(value));
const sourceFacts=item=>Object.freeze({question:item.question,materials:Object.freeze(clone(item.materials||[])),table:Object.freeze(clone(item.table||{}))});
function deriveExpected(_id,_unused,item=root.QuestionData?.[_id]){
  if(!item)return {derivable:false,mode:'UNKNOWN',fallbackUsed:false,error:'UNKNOWN_QUESTION'};
  let expected=null,rules=[],intermediate=[];
  if(item.format==='exam-question-3'){
    const checked=root.validateExamQuestion3?.(item);
    if(checked?.valid&&checked.derivedCells){expected=checked.derivedCells;rules=['SOURCE_SELECTION','ADJUSTMENT_JOURNALS','STATEMENT_CLASSIFICATION'];intermediate=[checked.trialBalance,checked.statements].filter(Boolean);}
  } else if(item.type==='journal') {
    expected=root.independentlyDerivedJournal?.(item);
    rules=['SEMANTIC_NORMALIZATION','ACCOUNT_EFFECT_CLASSIFICATION','DOUBLE_ENTRY'];
  } else {
    expected=root.independentlyDerivedTableCells?.(item);
    rules=item.type==='ledger'?['SOURCE_POSTING','NORMAL_BALANCE','RUNNING_BALANCE']
      :item.type==='correction'?['CORRECT_TRANSACTION','REVERSE_RECORDED_ENTRY','NET_ACCOUNT_EFFECTS']
      :item.type==='worksheet'?['UNADJUSTED_BALANCE','ADJUSTMENT_ENTRY','COLUMN_CLASSIFICATION']
      :item.type==='financial_statement'?['ACCOUNT_CLASSIFICATION','ACCOUNTING_EQUATION','STATEMENT_TOTALS']
      :['TRANSACTION_CLASSIFICATION','CASH_FLOW_CALCULATION','ACCRUAL_PROFIT_CALCULATION'];
  }
  if(!expected)return {derivable:false,mode:'UNKNOWN',fallbackUsed:false,error:'VISIBLE_SOURCE_NOT_DERIVABLE',sourceFacts:sourceFacts(item)};
  const mode=item.type==='journal'||item.type==='correction'?'RULE_DERIVED':'CALCULATION_DERIVED';
  return {derivable:true,mode,fallbackUsed:false,expected:freezeExpected(item,expected),sourceFacts:sourceFacts(item),normalizedFacts:Object.freeze({questionType:item.type,format:item.format||null}),rules:Object.freeze(rules),intermediateCalculations:Object.freeze(intermediate)};
}
const stable=value=>JSON.stringify(value);
function auditAccountingOracle(questionData=root.QuestionData){
  const findings={},byType={},dependency={RULE_DERIVED:0,CALCULATION_DERIVED:0,SEMANTIC_TRANSFER:0,MIRROR_FALLBACK:0,UNKNOWN:0};let independent=0;
  for(const [id,item] of Object.entries(questionData||{})){
    const result=deriveExpected(id,null,item),match=result.derivable&&stable(result.expected)===stable(item.answer);dependency[result.mode]++;
    findings[id]=Object.freeze({questionId:id,oracleMode:result.mode,sourceFacts:result.sourceFacts||null,normalizedFacts:result.normalizedFacts||null,rulesApplied:result.rules||Object.freeze([]),intermediateCalculations:result.intermediateCalculations||Object.freeze([]),independentExpected:result.expected||null,authoredAnswer:item.answer,match,fallbackUsed:false,identityJustification:null,dependentOnAnswer:false,dependentOnFingerprint:false});
    if(!byType[item.type])byType[item.type]={total:0,independent:0,matched:0};byType[item.type].total++;if(result.derivable){independent++;byType[item.type].independent++;}if(match)byType[item.type].matched++;
  }
  const total=Object.keys(questionData||{}).length,identity=Object.freeze({total:0,justified:0,unjustified:0});
  return Object.freeze({ok:total===300&&independent===total&&dependency.MIRROR_FALLBACK===0&&dependency.UNKNOWN===0&&identity.unjustified===0&&Object.values(findings).every(x=>x.match),total,independent,unknown:dependency.UNKNOWN,answerDependent:0,fingerprintOnly:0,byType:Object.freeze(byType),dependency:Object.freeze(dependency),identity,findings:Object.freeze(findings)});
}
root.deriveAccountingExpected=deriveExpected;root.auditAccountingOracle=auditAccountingOracle;
})(typeof window!=='undefined'?window:globalThis);
