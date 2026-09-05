'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const GOLDEN_PATH=path.resolve(__dirname,'../golden/expected-answers.json');

function loadIndependentExpected(){
  const bytes=fs.readFileSync(GOLDEN_PATH);
  const document=JSON.parse(bytes);
  if(document.authority!=='independent-audit-golden'||!document.answers)throw new Error('INVALID_INDEPENDENT_EXPECTED');
  return {answers:document.answers,sourceHash:crypto.createHash('sha256').update(bytes).digest('hex')};
}

function expectedFor(questionId){
  const golden=loadIndependentExpected();
  return {expected:golden.answers[questionId]||null,sourceHash:golden.sourceHash};
}

module.exports={GOLDEN_PATH,loadIndependentExpected,expectedFor};
