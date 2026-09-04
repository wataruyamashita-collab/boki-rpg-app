'use strict';

const INPUT='入力';

function answerCoverage(question){
  const inputs=question?.table?.inputCells,answers=question?.answer?.cells;
  return Array.isArray(inputs)&&inputs.length>0&&answers&&typeof answers==='object'&&
    new Set(inputs).size===inputs.length&&inputs.every(key=>Object.hasOwn(answers,key));
}

function numericAnswers(question){
  return answerCoverage(question)&&question.table.inputCells.every(key=>Number.isFinite(question.answer.cells[key]));
}

function columnsAre(columns,patterns){
  return Array.isArray(columns)&&columns.length===patterns.length&&patterns.every((pattern,index)=>pattern.test(String(columns[index])));
}

function inputCoordinates(question,fields){
  const rows=question.table.rows;
  const expected=[];
  rows.forEach((row,index)=>fields.forEach(field=>{if(row[field]===INPUT)expected.push(`${field}_${index+1}`);}));
  return expected.length>0&&expected.length===question.table.inputCells.length&&expected.every((key,index)=>key===question.table.inputCells[index]);
}

const worksheetSchemas={
  'eight-column-worksheet':question=>{
    const fields=['tbDebit','tbCredit','adjDebit','adjCredit','plDebit','plCredit','bsDebit','bsCredit'];
    return columnsAre(question.table.columns,[/勘定科目/,/試算表.*借方/,/試算表.*貸方/,/修正記入.*借方/,/修正記入.*貸方/,/損益計算書.*借方/,/損益計算書.*貸方/,/貸借対照表.*借方/,/貸借対照表.*貸方/])&&
      question.table.rows.length>0&&question.table.rows.every(row=>typeof row.account==='string'&&fields.every(field=>Object.hasOwn(row,field)))&&
      inputCoordinates(question,fields)&&['adjDebit','adjCredit','plDebit','plCredit','bsDebit','bsCredit'].every(field=>question.table.rows.some(row=>row[field]===INPUT));
  },
  'adjustment-calculation':question=>columnsAre(question.table.columns,[/論点/,/計算基礎額/,/決算整理額/,/整理後金額/])&&
    question.table.rows.length>0&&question.table.rows.every(row=>typeof row.item==='string'&&Number.isFinite(row.before)&&row.adjustment===INPUT&&row.after===INPUT)&&
    question.table.inputCells.length===question.table.rows.length*2,
  'adjusted-trial-balance':question=>columnsAre(question.table.columns,[/勘定科目/,/整理後借方/,/整理後貸方/])&&
    question.table.rows.length>0&&question.table.rows.every(row=>typeof row.account==='string'&&Object.hasOwn(row,'debit')&&Object.hasOwn(row,'credit')&&[row.debit,row.credit].includes(INPUT))&&
    question.table.inputCells.some(key=>/debitTotal/i.test(key))&&question.table.inputCells.some(key=>/creditTotal/i.test(key)),
  'closing-entries':question=>columnsAre(question.table.columns,[/締切手続/,/金額/])&&
    question.table.rows.length>0&&question.table.rows.every(row=>typeof row.item==='string'&&row.amount===INPUT)&&question.table.inputCells.length===question.table.rows.length
};

function worksheetSchema(question){
  if(!question?.table||!Array.isArray(question.table.rows))return null;
  if(question.format&&worksheetSchemas[question.format])return question.format;
  if(!question.format&&question.table.rows.every(row=>Object.hasOwn(row,'before')&&Object.hasOwn(row,'adjustment')&&Object.hasOwn(row,'after')))return 'adjustment-calculation';
  return null;
}

function supportedWorksheet(question){
  const schema=worksheetSchema(question);
  return Boolean(schema&&worksheetSchemas[schema](question));
}

function comprehensiveCashProfitRelation(question){
  const sentences=String(question?.explanation||'').split(/[。\n]/u).filter(Boolean);
  return sentences.some(sentence=>/現金/u.test(sentence)&&/(利益|収益|費用)/u.test(sentence)&&/(増や|増え|減ら|減り|含ま|なら|別|分け|一方|対し|ても|ですが|では)/u.test(sentence));
}

module.exports={answerCoverage,numericAnswers,worksheetSchema,supportedWorksheet,comprehensiveCashProfitRelation};
