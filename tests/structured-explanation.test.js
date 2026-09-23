const assert = require('assert');
const ExplanationModel = require('../scripts/explanation-model');

const diagnostics = [{
  kind:'cell', title:'残高を見直します', reason:'入力値が正答と異なります。', nextRule:'直前残高から増減を反映します。', cause:'ledger:balance'
}];

const L041 = {
  id:'L041', type:'ledger', category:'総勘定元帳（現金）',
  question:'入出金を現金元帳へ転記した。各取引後の残高を計算し、残高欄を完成させなさい。',
  materials:[],
  table:{
    columns:['date','description','debit','credit','balance'],
    rows:[
      { date:'10月1日', description:'前月繰越', debit:505000, credit:null, balance:505000 },
      { date:'10月8日', description:'売掛金回収', debit:173000, credit:null, balance:'入力' },
      { date:'10月15日', description:'仕入代金支払', debit:null, credit:86500, balance:'入力' }
    ],
    inputCells:['r2_balance','r3_balance']
  },
  answer:{ cells:{ r2_balance:678000, r3_balance:591500 } },
  explanation:'現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に678,000円、591,500円です。'
};

const l041 = ExplanationModel.build(L041, { cells:{ r2_balance:600000, r3_balance:'' } }, { correct:false }, { diagnostics });
assert.strictEqual(ExplanationModel.validate(l041).valid, true);
assert.deepStrictEqual(ExplanationModel.REQUIRED_SECTIONS.every(key => Array.isArray(l041[key])), true);
assert(l041.calculation.some(item => item.expression === '505,000 + 173,000 = 678,000'), 'L041 first running balance must be explicit');
assert(l041.calculation.some(item => item.expression === '678,000 − 86,500 = 591,500'), 'L041 second running balance must use prior answer');
assert.strictEqual(l041.fallback.authoredExplanation, L041.explanation, 'authored prose must remain available as fallback');
assert.strictEqual(l041.mistakes[0].title, diagnostics[0].title, 'wrong-answer diagnostics must be preserved');

const L034 = {
  id:'L034', type:'ledger', category:'商品有高帳',
  question:'商品有高帳を先入先出法で完成させなさい。払出単価、払出額、期末残高を順に求めること。',
  materials:[],
  table:{
    columns:['date','description','quantity','unitPrice','amount'],
    rows:[
      { date:'10月1日', description:'前月繰越', quantity:74, unitPrice:1200, amount:88800 },
      { date:'10月9日', description:'仕入', quantity:20, unitPrice:1500, amount:30000 },
      { date:'10月20日', description:'払出（先入先出法）', quantity:25, unitPrice:'入力', amount:'入力' },
      { date:'10月31日', description:'残高', quantity:69, unitPrice:'内訳', amount:'入力' }
    ],
    inputCells:['r3_unitPrice','r3_amount','r4_amount']
  },
  answer:{ cells:{ r3_unitPrice:1200, r3_amount:30000, r4_amount:88800 } },
  explanation:'先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は49個×1,200円＋20個×1,500円＝88,800円です。'
};

const l034 = ExplanationModel.build(L034, {}, { correct:false }, { diagnostics:[] });
assert(l034.calculation.some(item => item.expression === '25 × 1,200 = 30,000'), 'L034 payout amount must be structured as quantity × unit price');
assert(l034.calculation.some(item => item.result === 88800), 'L034 closing inventory answer remains represented');
assert.strictEqual(l034.fallback.authoredExplanation, L034.explanation);

const authored = ExplanationModel.build({
  ...L041,
  explanationModel:{ summary:[{ text:'現金の増減だけを先に確認する', evidenceRef:'question' }] }
}, {}, { correct:false }, { diagnostics:[] });
assert.strictEqual(authored.source, 'authored');
assert.strictEqual(authored.summary[0].text, '現金の増減だけを先に確認する');
assert(authored.sources.length > 0 && authored.calculation.length > 0, 'authored override must fall back section-by-section to generated data');

assert.strictEqual(ExplanationModel.validate({}).valid, false, 'missing sections must fail schema validation');
console.log('structured explanation model tests: PASS');
