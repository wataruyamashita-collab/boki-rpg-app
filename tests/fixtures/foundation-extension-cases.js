(function (root, factory) {
  const cases = factory();
  if (typeof module === 'object' && module.exports) module.exports = cases;
  root.FoundationExtensionCases = cases;
}(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  // Original engineering fixtures, not canonical additions or released curriculum.
  const extension = (scope, grade) => ({ isolated:true, classification:'B',
    reason:'Fixture-only entry/storage boundary and topic-specific result adapter; no production Core change.', scope, grade, syllabusYear:2026 });
  const common = { chapter:1, difficulty:2, learningRole:'training' };
  const journal = (id, category, scope, grade, question, debit, credit, explanation) =>
    ({ ...common,id,category,type:'journal',question,answer:{debit,credit},explanation,extension:extension(scope,grade) });
  const table = (id,category,scope,grade,question,fields,explanation) => ({ ...common,id,category,
    type:'comprehensive',format:'foundation-extension-table',question,explanation,extension:extension(scope,grade),
    table:{ columns:['項目','解答'],rows:fields.map(f => ({項目:f.label,解答:'入力'})),inputCells:fields.map(f=>f.key),
      inputTypes:Object.fromEntries(fields.map(f=>[f.key,typeof f.answer==='number'?'amount':'text'])),
      inputMetadata:Object.fromEntries(fields.map(f=>[f.key,{semanticType:typeof f.answer==='number'?'amount':'text',label:f.label,unit:f.unit||'',...f.metadata}])) },
    answer:{cells:Object.fromEntries(fields.map(f=>[f.key,f.answer]))} });
  const cases = {
    equipment:journal('EXT-G3-EQUIPMENT','備品購入','commercial:second12a',3,
      '業務用の備品を現金100,000円で購入した。仕訳しなさい。',
      [{account:'備品',amount:100000}],[{account:'現金',amount:100000}],
      '【考え方】備品という資産の増加は借方、現金という資産の減少は貸方に記入する。\n【答え】借方は備品100,000円、貸方は現金100,000円。貸借差額は0円。'),
    fx:journal('EXT-G2-FX','外貨建売掛金の回収','commercial:second18a',2,
      'USD1,000の売掛金（帳簿価額140,000円）を1USD＝150円で回収し、送金手数料1,000円を差し引かれて普通預金に入金された。手数料を別建てで仕訳しなさい。',
      [{account:'普通預金',amount:149000},{account:'支払手数料',amount:1000}],
      [{account:'売掛金',amount:140000},{account:'為替差益',amount:10000}],
      '【計算】USD1,000×150円＝150,000円。売掛金の帳簿価額140,000円との差10,000円は為替差益。手数料を引いた入金額は149,000円。\n【考え方】普通預金という資産の増加と支払手数料という費用の発生は借方、売掛金という資産の減少と為替差益という収益の発生は貸方に記入する。\n【答え】借方は普通預金149,000円と支払手数料1,000円。貸方は売掛金140,000円と為替差益10,000円。両側とも150,000円。\n【注意】手数料は為替差益と相殺しない。'),
    cost:table('EXT-G2-COST','製造原価と単位原価','cost:tenth2',2,
      '直接材料費120,000円、直接労務費80,000円、製造間接費40,001円。期首・期末仕掛品と仕損はなく、完成品は200個。総製造原価と1個当たり原価を求めなさい。単位原価は小数第3位を四捨五入して小数第2位まで記入する。',
      [{key:'totalCost',label:'総製造原価',unit:'円',answer:240001},{key:'unitCost',label:'1個当たり原価',unit:'円/個',answer:1200.01,metadata:{extensionNumeric:true,precision:2,signed:false,rounding:'HALF_UP'}}],
      '【計算】総製造原価は120,000＋80,000＋40,001＝240,001円。200個で割ると1,200.005円/個。\n【答え】指定された四捨五入により、単位原価は1,200.01円/個。\n【注意】丸めた単価×200＝240,002円は、総製造原価240,001円より1円多い。丸め後の単価から総製造原価を逆算しない。')
  };
  for (const [key,suffix,initial,answer] of [['npvPositive','POS',100000,4130],['npvNegative','NEG',110000,-5870],['npvZero','ZERO',104130,0]]) {
    cases[key]=table(`EXT-G1-NPV-${suffix}`,'正味現在価値','cost:nineteenth2',1,
      `第1期末・第2期末に各60,000円のキャッシュフローを得る。現価係数は第1期0.9091、第2期0.8264を与えられた値のまま使用する。初期投資は${initial.toLocaleString('ja-JP')}円、他の収支はない。正味現在価値を求めなさい。`,
      [{key:'npv',label:'正味現在価値',unit:'円',answer,metadata:{extensionNumeric:true,precision:0,signed:true}}],
      `【計算】第1期は60,000×0.9091＝54,546円、第2期は60,000×0.8264＝49,584円。現在価値の合計は104,130円。\n【答え】104,130－${initial.toLocaleString('ja-JP')}＝${answer.toLocaleString('ja-JP')}円。${answer<0?'割引後の収入が初期投資を下回るため、指定条件では採用しない。':answer===0?'投資の正味現在価値はゼロである。':'指定条件では正の正味現在価値となる。'}\n【注意】単純な2期分の入金合計ではなく、時点をそろえた現在価値から初期投資を引く。`);
  }
  cases.accrual=table('EXT-CONCEPT-ACCRUAL','期間損益と現金収支','commercial:seventh1',1,
    '当月に使用した電力の料金10,000円は翌月に支払う。当月の費用を、支払時点ではなく使用した期間に計上する考え方を「発生主義」「現金主義」から選んで入力しなさい。',
    [{key:'basis',label:'費用を計上する考え方',answer:'発生主義',metadata:{extensionText:true}}],
    '【考え方】発生主義では費用が発生した期間に計上する。電力を使用したのは当月なので、支払前でも当月の費用となる。\n【答え】発生主義。現金主義なら支払った翌月に計上する。\n【注意】この設問は費用の期間帰属を問う。収益認識の条件すべてを説明する問題ではない。');
  return Object.freeze(cases);
}));
