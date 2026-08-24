(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WrongAnswerFeedback = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const yen = value => Number(value).toLocaleString('ja-JP');
  const normalize = value => String(value ?? '').replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)).replace(/[，,\s]/g, '');
  const sameValue = (actual, expected) => typeof expected === 'number'
    ? normalize(actual) !== '' && Number(normalize(actual)) === expected
    : String(actual ?? '').trim() === String(expected).trim();
  const all = answer => [...(answer?.debit || []), ...(answer?.credit || [])];

  // Directional pairs describe common misconceptions, not merely synonymous labels.
  const MISCONCEPTIONS = Object.freeze({
    '未払金→買掛金': ['「未払金」は商品以外の物品・サービスを後払いした債務です。今回は営業用の商品仕入による掛代金なので「買掛金」です。', '後払いという語だけでなく、商品仕入なら買掛金、商品以外なら未払金と判別します。'],
    '買掛金→未払金': ['「買掛金」は営業用商品の掛仕入から生じる債務です。商品以外の備品などの未払いには「未払金」を使います。', '債務の原因が商品売買か、それ以外かを先に確認します。'],
    '売掛金→未収入金': ['「売掛金」は商品の掛売上など本来の営業取引による債権です。固定資産売却など商品売買以外の未回収代金は「未収入金」です。', 'あとで受け取るという点だけでなく、商品売買なら売掛金、それ以外なら未収入金と判別します。'],
    '未収入金→売掛金': ['「未収入金」は商品売買以外から生じる未回収代金です。商品の掛売上は本来の営業取引なので「売掛金」です。', '未回収代金が営業用商品の販売から生じたかを確認します。'],
    '売掛金→受取手形': ['売掛金は通常の掛代金ですが、約束手形を受け取った債権は「受取手形」です。', '証憑に手形の受取りがあれば受取手形、通常の掛けなら売掛金と判別します。'],
    '買掛金→支払手形': ['買掛金は通常の掛代金ですが、約束手形を振り出した債務は「支払手形」です。', '手形を振り出したか、通常の掛けのままかを確認します。'],
    '売上→固定資産売却益': ['「売上」は営業用商品の販売収益です。固定資産の売却額と帳簿価額との差益は「固定資産売却益」です。', '売却したものが商品か固定資産かを判別し、固定資産では売却額と帳簿価額を比較します。'],
    '雑損→固定資産売却損': ['固定資産の売却額が帳簿価額を下回る差額は、一般的な雑損ではなく「固定資産売却損」です。', '固定資産売却では、取得原価－累計額＝帳簿価額を求めて売却額と比較します。']
  });
  const accountKinds = {
    asset: new Set(['現金','普通預金','当座預金','売掛金','受取手形','繰越商品','備品','電子記録債権','クレジット売掛金','未収入金','前払金','小口現金','仮払金','立替金','仮払消費税','前払保険料','受取商品券','差入保証金','未収利息','貯蔵品','貸付金']),
    contraAsset: new Set(['貸倒引当金','減価償却累計額','備品減価償却累計額']),
    liability: new Set(['買掛金','支払手形','借入金','電子記録債務','未払金','前受金','所得税預り金','社会保険料預り金','仮受消費税','仮受金','前受家賃','未払利息','未払法人税等','未払消費税']),
    equity: new Set(['資本金','繰越利益剰余金','損益']),
    revenue: new Set(['売上','受取利息','受取家賃','固定資産売却益','償却債権取立益','雑益']),
    expense: new Set(['仕入','発送費','消耗品費','減価償却費','固定資産売却損','支払手数料','通信費','水道光熱費','旅費交通費','支払利息','給料','法定福利費','租税公課','貸倒引当金繰入','保険料','法人税、住民税及び事業税','雑損'])
  };
  const kind = account => Object.keys(accountKinds).find(key => accountKinds[key].has(account));
  const directionReason = (account, expectedSide) => {
    const type = kind(account); const increase = expectedSide === 'debit' ? ['asset','expense'].includes(type) : ['liability','equity','revenue','contraAsset'].includes(type);
    const label = { asset:'資産', expense:'費用', liability:'負債', equity:'純資産', revenue:'収益', contraAsset:'資産の控除項目' }[type] || '勘定';
    return `${account}は${label}です。この取引では${increase ? '増加（または発生）' : '減少（または取消し）'}するため${expectedSide === 'debit' ? '借方' : '貸方'}に記入します。資産・費用の増加は借方、負債・純資産・収益の増加は貸方（減少は反対側）が原則です。`;
  };
  const context = question => {
    const base = String(question.explanation || '').replace(/【[^】]+】/g, '').trim();
    const rows = all(question.answer); const cost = rows.find(row => row.account === '備品')?.amount;
    const accumulated = rows.find(row => /減価償却累計額/.test(row.account))?.amount;
    const proceeds = rows.find(row => ['現金','普通預金','未収入金'].includes(row.account))?.amount;
    const gain = rows.find(row => row.account === '固定資産売却益')?.amount;
    const loss = rows.find(row => row.account === '固定資産売却損')?.amount;
    if (cost && accumulated && proceeds && (gain || loss)) {
      const book = cost - accumulated;
      return `${base}\n計算過程：取得原価${yen(cost)}円－減価償却累計額${yen(accumulated)}円＝帳簿価額${yen(book)}円。${gain ? `売却額${yen(proceeds)}円－帳簿価額${yen(book)}円＝固定資産売却益${yen(gain)}円` : `帳簿価額${yen(book)}円－売却額${yen(proceeds)}円＝固定資産売却損${yen(loss)}円`}です。`;
    }
    return base;
  };
  const entry = (kindName, title, reason, thinking, nextRule) => ({ kind: kindName, title, reason, thinking, nextRule });

  function diagnoseJournal(question, answer) {
    const expected = question.answer; const result = []; const entered = all(answer); const correct = all(expected);
    for (const side of ['debit','credit']) for (const item of expected[side] || []) {
      const opposite = side === 'debit' ? 'credit' : 'debit';
      const reversed = (answer?.[opposite] || []).find(row => row.account === item.account);
      if (reversed) result.push(entry('side', `${item.account}の貸借が逆です`, directionReason(item.account, side), context(question), `まず科目を資産・負債・純資産・収益・費用に分類し、増減から${side === 'debit' ? '借方' : '貸方'}を決めます。`));
      const sameAccount = entered.find(row => row.account === item.account);
      if (sameAccount && Number(sameAccount.amount) !== item.amount) result.push(entry('amount', `${item.account}の金額が違います`, `入力した${yen(sameAccount.amount)}円ではなく正しい金額は${yen(item.amount)}円です。`, context(question), '問題文の各金額が、取引総額・控除額・差額のどれかを式にしてから記入します。'));
      if (!sameAccount) result.push(entry('missing', `${item.account}が未記入です`, `${side === 'debit' ? '借方' : '貸方'}に${item.account} ${yen(item.amount)}円が必要です。複合仕訳では一つの金額を構成する科目を省略できません。`, context(question), '取引を資産・負債・純資産・収益・費用の増減へ分解し、全要素を記入します。'));
    }
    const expectedAccounts = new Set(correct.map(row => row.account));
    for (const wrong of entered.filter(row => row.account && !expectedAccounts.has(row.account))) {
      const candidates = correct.filter(row => !entered.some(value => value.account === row.account));
      const target = candidates.find(row => MISCONCEPTIONS[`${wrong.account}→${row.account}`]) || candidates[0];
      if (!target) continue;
      const known = MISCONCEPTIONS[`${wrong.account}→${target.account}`];
      result.push(entry('account', `${wrong.account}ではなく${target.account}です`, known?.[0] || `${wrong.account}はこの取引の実態を表しません。問題文では「${question.question}」という取引であり、${target.account}を使います。`, context(question), known?.[1] || `名称の似方ではなく、取引の対象・決済手段・発生原因から${target.account}と判別します。`));
    }
    return result;
  }

  function diagnoseTable(question, answer) {
    return Object.entries(question.answer.cells).filter(([id, expected]) => !sameValue(answer?.cells?.[id], expected)).map(([id, expected]) => {
      const actual = answer?.cells?.[id]; const shown = actual == null || String(actual).trim() === '' ? '未入力' : String(actual);
      const correct = typeof expected === 'number' ? `${yen(expected)}円` : `「${expected}」`;
      const inputIndex = question.table.inputCells.indexOf(id); let cursor = -1; let sourceRow;
      for (const row of question.table.rows) for (const value of Object.values(row)) if (value === '入力' && ++cursor === inputIndex) sourceRow = row;
      const label = sourceRow && Object.values(sourceRow)[0];
      const material = (question.materials || []).find(row => Object.values(row)[0] === label);
      const evidence = material ? `資料の${label}は、${Object.entries(material).slice(1).map(([key, value]) => `${key} ${typeof value === 'number' ? `${yen(value)}円` : value}`).join('、')}です。` : '';
      return entry('cell', `${id}の入力が違います`, `${id}は${shown}ではなく${correct}です。このセルは「${label || question.category}」の行と指定された借方・貸方列を反映する位置です。`, `${evidence}${context(question)}`, `行見出し「${label || question.category}」と列見出しを交差させ、資料の計算・振替を確認してから${id}へ${correct}を記入します。`);
    });
  }

  function diagnoseWrongAnswer(question, answer, score) {
    if (!question || score?.correct) return [];
    const diagnostics = question.type === 'journal' ? diagnoseJournal(question, answer || {}) : diagnoseTable(question, answer || {});
    return diagnostics.length ? diagnostics : [entry('general', '正解との差を確認します', '入力内容と正解の科目・金額・位置の組合せが一致していません。', context(question), '各入力欄について、資料から求めた値と正解を一つずつ照合します。')];
  }
  return Object.freeze({ diagnoseWrongAnswer, MISCONCEPTIONS });
});
