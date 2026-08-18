// =========================================
// 問題データ (仕様書35, 12, 17)
// =========================================
const QuestionData = {
  "J001": {
    id: "J001",
    type: "journal",
    category: "資本金・開始記帳",
    difficulty: 1,
    chapter: 1,
    question: "会社設立にあたり、現金 3,000,000円 を出資し、営業を開始した。",
    answer: {
      debit:  [{ account: "現金", amount: 3000000 }],
      credit: [{ account: "資本金", amount: 3000000 }]
    },
    explanation: "【なぜその勘定科目なのか】\n現金を受け取ったため資産の増加として借方に「現金」、出資を受けたため純資産の増加として貸方に「資本金」を計上します。\n【実務MEMO】実際の会社設立では別段預金等が使われますが、試験上は指示に従い現金を処理します。"
  },
  "J002": {
    id: "J002",
    type: "journal",
    category: "現金・預金",
    difficulty: 1,
    chapter: 1,
    question: "手許にある現金 100,000円 を普通預金口座に預け入れた。",
    answer: {
      debit:  [{ account: "普通預金", amount: 100000 }],
      credit: [{ account: "現金", amount: 100000 }]
    },
    explanation: "【なぜその勘定科目なのか】\n現金を銀行へ預け入れたため、資産の増加として借方に「普通預金」を計上し、同時に手許の現金が減ったため、資産の減少として貸方に「現金」を計上します。"
  },
  "J003": {
    id: "J003",
    type: "journal",
    category: "商品売買",
    difficulty: 1,
    chapter: 2,
    question: "商品 200,000円 を仕入れ、代金は掛けとした。",
    answer: {
      debit:  [{ account: "仕入", amount: 200000 }],
      credit: [{ account: "買掛金", amount: 200000 }]
    },
    explanation: "【なぜその勘定科目なのか】\n商品を仕入れたため費用の発生として借方に「仕入」を計上します。代金を後で支払う義務（ツケ）が生じたため、負債の増加として貸方に「買掛金」を計上します。"
  },
  "J004": {
    id: "J004",
    type: "journal",
    category: "商品売買",
    difficulty: 1,
    chapter: 2,
    question: "商品 300,000円 を売り上げ、代金は掛けとした。",
    answer: {
      debit:  [{ account: "売掛金", amount: 300000 }],
      credit: [{ account: "売上", amount: 300000 }]
    },
    explanation: "【なぜその勘定科目なのか】\n商品を販売したため収益の発生として貸方に「売上」を計上します。代金を後で受け取る権利が生じたため、資産の増加として借方に「売掛金」を計上します。"
  },
  "J005": {
    id: "J005",
    type: "journal",
    category: "商品売買（諸掛り）",
    difficulty: 2,
    chapter: 2,
    question: "商品 150,000円 を売り上げ、代金は掛けとした。なお、当店が負担する発送費 5,000円 は現金で支払った。",
    answer: {
      debit:  [
        { account: "売掛金", amount: 150000 },
        { account: "発送費", amount: 5000 }
      ],
      credit: [
        { account: "売上", amount: 150000 },
        { account: "現金", amount: 5000 }
      ]
    },
    explanation: "【複合仕訳の考え方】\n商品販売分（売掛金/売上 150,000円）と、当店負担の発送費の支払い分（発送費/現金 5,000円）を合わせて処理します。当店負担の発送費は、売上から差し引かず「発送費」という費用科目で処理するのがポイントです。"
  },
  "J006": {
    id: "J006",
    type: "journal",
    category: "クレジットカード",
    difficulty: 2,
    chapter: 2,
    question: "商品 100,000円 を売り上げ、代金は顧客名義のクレジットカードで決済された。なお、信販会社への手数料（売上代金の2％）は販売時に計上する。",
    answer: {
      debit:  [
        { account: "クレジット売掛金", amount: 98000 },
        { account: "支払手数料", amount: 2000 }
      ],
      credit: [
        { account: "売上", amount: 100000 }
      ]
    },
    explanation: "【試験POINT】\nクレジットカード払いの売上時は、手数料（100,000円 × 2％ ＝ 2,000円）を「支払手数料」（費用）として借方に計上し、売上から手数料を差し引いた残額（98,000円）を「クレジット売掛金」（資産）として処理します。"
  },
  "J007": {
    id: "J007",
    type: "journal",
    category: "固定資産",
    difficulty: 1,
    chapter: 3,
    question: "営業用のパソコン 250,000円 を購入し、代金は月末に支払うこととした。",
    answer: {
      debit:  [{ account: "備品", amount: 250000 }],
      credit: [{ account: "未払金", amount: 250000 }]
    },
    explanation: "【よくある間違い】\n後払いの取引ですが、商品以外の物品（パソコンなど）を購入した場合は「買掛金」ではなく「未払金」（負債）を使用します。パソコンは長期間使用するため「備品」（資産）として計上します。"
  },
  "J008": {
    id: "J008",
    type: "journal",
    category: "仮払金・仮受金",
    difficulty: 1,
    chapter: 3,
    question: "従業員の出張にあたり、旅費の概算額 50,000円 を現金で前渡しした。",
    answer: {
      debit:  [{ account: "仮払金", amount: 50000 }],
      credit: [{ account: "現金", amount: 50000 }]
    },
    explanation: "【なぜその勘定科目なのか】\n用途や金額が未確定の段階で現金を渡したため、一時的な処理として「仮払金」（資産）を借方に計上します。後日、出張から戻り精算を行った際に正しい勘定科目へ振り替えます。"
  },
  "J009": {
    id: "J009",
    type: "journal",
    category: "給与と税金",
    difficulty: 2,
    chapter: 3,
    question: "従業員の給与 400,000円 から、所得税の源泉徴収分 20,000円 を差し引き、残額を普通預金口座から振り込んだ。",
    answer: {
      debit:  [
        { account: "給料", amount: 400000 }
      ],
      credit: [
        { account: "所得税預り金", amount: 20000 },
        { account: "普通預金", amount: 380000 }
      ]
    },
    explanation: "【金額の算出と科目】\n給与の総額400,000円は「給料」（費用）として借方に計上します。差し引いた所得税20,000円は会社が一時的に預かり、後日税務署へ納付する義務があるため「所得税預り金」（負債）として処理し、差額の380,000円が普通預金の減少となります。"
  },
  "J010": {
    id: "J010",
    type: "journal",
    category: "資金の借入",
    difficulty: 2,
    chapter: 3,
    question: "取引銀行から 1,000,000円 を借り入れ、利息 10,000円 を差し引かれた残額が当座預金口座に振り込まれた。",
    answer: {
      debit:  [
        { account: "当座預金", amount: 990000 },
        { account: "支払利息", amount: 10000 }
      ],
      credit: [
        { account: "借入金", amount: 1000000 }
      ]
    },
    explanation: "【複合仕訳の考え方】\n借入総額の1,000,000円を「借入金」（負債）の増加として貸方に計上します。天引きされた利息10,000円は「支払利息」（費用）として借方に計上し、実際の入金額である990,000円が当座預金の増加となります。"
  },
  "J011": {
    id: "J011",
    type: "journal",
    category: "小口現金",
    difficulty: 1,
    chapter: 4,
    question: "小口現金係へ、今週の小口現金として 30,000円 を小切手を振り出して前渡した。",
    answer: {
      debit:  [{ account: "小口現金", amount: 30000 }],
      credit: [{ account: "当座預金", amount: 30000 }]
    },
    explanation: "【なぜ貸方が当座預金なのか】\n小口現金を前渡したため借方に「小口現金」（資産）を計上します。また、小切手を振り出して支払った場合は、すぐに当座預金口座から引き落とされると考えるため、貸方は「当座預金」の減少として処理します。"
  }
};
