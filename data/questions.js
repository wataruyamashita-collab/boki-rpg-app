// 日商簿記3級 経理シミュレーションRPG 問題データ（全300問・再校閲版）
// dataVersion: 2026.08.20-r2
// 既存ID・type・入力キー互換を維持しつつ、物語時間・問題文の自己完結性・類題多様性を再設計。
// type: journal / ledger / trial_balance / correction / worksheet / financial_statement / comprehensive

const QuestionData = {
  "J001": {
    "id": "J001",
    "type": "journal",
    "category": "資本金・追加出資",
    "difficulty": 1,
    "chapter": 1,
    "scene": "4月・帳簿の出発点",
    "story": "入社初日、先輩の水野と証憑を日付順に整え、会社の数字を帳簿へ移す最初の仕事に取りかかる。",
    "question": "事業拡大のため、株主から現金3,000,000円の追加出資を受けた。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 3000000
        }
      ],
      "credit": [
        {
          "account": "資本金",
          "amount": 3000000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受け取った現金は資産の増加、株主からの払込みは純資産である資本金の増加として処理します。\n【金額確認】借方合計・貸方合計はいずれも3,000,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "資本金・追加出資"
  },
  "J002": {
    "id": "J002",
    "type": "journal",
    "category": "現金・預金",
    "difficulty": 1,
    "chapter": 1,
    "scene": "4月・帳簿の出発点",
    "story": "入社初日、先輩の水野と証憑を日付順に整え、会社の数字を帳簿へ移す最初の仕事に取りかかる。",
    "question": "手許現金180,000円を普通預金口座へ預け入れた。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 180000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 180000
        }
      ]
    },
    "explanation": "【処理の根拠】\n普通預金が増え、同額だけ手許現金が減る、資産内部の振替です。\n【金額確認】借方合計・貸方合計はいずれも180,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "現金・預金"
  },
  "J003": {
    "id": "J003",
    "type": "journal",
    "category": "当座預金",
    "difficulty": 1,
    "chapter": 1,
    "scene": "4月・帳簿の出発点",
    "story": "入社初日、先輩の水野と証憑を日付順に整え、会社の数字を帳簿へ移す最初の仕事に取りかかる。",
    "question": "当座預金口座を開設し、普通預金から500,000円を振り替えた。",
    "answer": {
      "debit": [
        {
          "account": "当座預金",
          "amount": 500000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 500000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当座預金の増加を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも500,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "当座預金"
  },
  "J004": {
    "id": "J004",
    "type": "journal",
    "category": "掛仕入",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "若葉物産から商品240,000円を仕入れ、代金は掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 240000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 240000
        }
      ]
    },
    "explanation": "【処理の根拠】\n三分法では、商品の購入額を「仕入」（費用）として処理し、商品代金を後日支払う義務を「買掛金」として計上します。\n【金額確認】借方合計・貸方合計はいずれも240,000円です。\n【試験のポイント】営業用の商品に生じる債務なので未払金ではありません。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "掛仕入"
  },
  "J005": {
    "id": "J005",
    "type": "journal",
    "category": "掛売上",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "みなと商店へ商品360,000円を販売し、代金は掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 360000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 360000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金を後日受け取る権利は売掛金、商品の販売による収益は売上です。\n【金額確認】借方合計・貸方合計はいずれも360,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "掛売上"
  },
  "J006": {
    "id": "J006",
    "type": "journal",
    "category": "仕入諸掛",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "若葉物産から商品200,000円を仕入れ、商品代金は掛けとした。なお、商品代金とは別に、当店負担の引取運賃6,000円を現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 206000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 200000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金は掛け、引取運賃は現金払いですが、当店負担の仕入諸掛は商品の取得原価に含めるため、両者を「仕入」に集計します。\n【金額確認】借方合計・貸方合計はいずれも206,000円です。\n【試験のポイント】当店負担の仕入諸掛を独立した運賃科目にしない点に注意します。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "仕入諸掛"
  },
  "J007": {
    "id": "J007",
    "type": "journal",
    "category": "売上諸掛",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "みなと商店へ商品170,000円を販売し、商品代金は掛けとした。なお、商品代金とは別に、当店負担の発送運賃5,000円を現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 170000
        },
        {
          "account": "発送費",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 170000
        },
        {
          "account": "現金",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金の掛販売と、当店負担の発送運賃の現金払いは別々の取引として考えます。当店が負担する発送運賃は「発送費」（費用）です。\n【金額確認】借方合計・貸方合計はいずれも175,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "売上諸掛"
  },
  "J008": {
    "id": "J008",
    "type": "journal",
    "category": "仕入返品",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "先週若葉物産から掛けで仕入れた商品のうち、品違いのため30,000円分を返品した。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "仕入",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け仕入れの取り消しに当たるため、買掛金と仕入をそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。\n【試験のポイント】返品時は当初の仕訳を逆にします。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "仕入返品"
  },
  "J009": {
    "id": "J009",
    "type": "journal",
    "category": "売上返品",
    "difficulty": 1,
    "chapter": 2,
    "scene": "5月・仕入と販売",
    "story": "営業担当の高橋が新規受注を増やし、在庫補充の仕入と販売の双方が増え始める。取引ごとに代金と付随費用を切り分けて確認する。",
    "question": "みなと商店へ掛けで販売した商品のうち、破損品24,000円分が返品された。",
    "answer": {
      "debit": [
        {
          "account": "売上",
          "amount": 24000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 24000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け売上げの取り消しに当たるため、売上を借方で、売掛金を貸方でそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも24,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "売上返品"
  },
  "J010": {
    "id": "J010",
    "type": "journal",
    "category": "売掛金回収",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "みなと商店に対する売掛金280,000円が普通預金口座へ振り込まれた。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 280000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 280000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、代金回収による売掛金の減少を記録します。\n【金額確認】借方合計・貸方合計はいずれも280,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "売掛金回収"
  },
  "J011": {
    "id": "J011",
    "type": "journal",
    "category": "買掛金支払",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "若葉物産に対する買掛金190,000円を普通預金口座から振り込んだ。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 190000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 190000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払義務である買掛金の減少を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも190,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "買掛金支払"
  },
  "J012": {
    "id": "J012",
    "type": "journal",
    "category": "電子記録債務",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "若葉物産に対する買掛金150,000円について、取引先との合意に基づき電子記録債務の発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 150000
        }
      ],
      "credit": [
        {
          "account": "電子記録債務",
          "amount": 150000
        }
      ]
    },
    "explanation": "【処理の根拠】\n既存の買掛金を消滅させ、新たに電子記録債務を計上します。\n【金額確認】借方合計・貸方合計はいずれも150,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "電子記録債務"
  },
  "J013": {
    "id": "J013",
    "type": "journal",
    "category": "電子記録債権",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "みなと商店に対する売掛金210,000円について、取引先との合意に基づき電子記録債権の発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "電子記録債権",
          "amount": 210000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 210000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売掛金を電子記録債権へ振り替える取引です。債権総額は変わりません。\n【金額確認】借方合計・貸方合計はいずれも210,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "電子記録債権"
  },
  "J014": {
    "id": "J014",
    "type": "journal",
    "category": "クレジット売掛金",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "商品125,000円をクレジットカードで販売した。信販会社の手数料は販売額の2％で、販売時に計上する。",
    "answer": {
      "debit": [
        {
          "account": "クレジット売掛金",
          "amount": 122500
        },
        {
          "account": "支払手数料",
          "amount": 2500
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 125000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売上は販売額の全額を計上します。信販会社への手数料は「支払手数料」（費用）、差引入金予定額は「クレジット売掛金」として処理します。\n【金額確認】借方合計・貸方合計はいずれも125,000円です。\n【試験のポイント】販売額×2％が手数料です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "クレジット売掛金"
  },
  "J015": {
    "id": "J015",
    "type": "journal",
    "category": "前払金",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "若葉物産へ商品を注文し、商品受領前の内金50,000円を現金で支払った。商品はまだ受け取っていない。",
    "answer": {
      "debit": [
        {
          "account": "前払金",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品を受け取る前の支払いであるため、仕入ではなく、後日商品を受け取る権利として「前払金」を計上します。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "前払金"
  },
  "J016": {
    "id": "J016",
    "type": "journal",
    "category": "前受金",
    "difficulty": 1,
    "chapter": 3,
    "scene": "6月・掛取引の管理",
    "story": "取引量の増加で入金日と支払日が複雑になった。売掛金・買掛金・電子記録債権債務を一覧にし、資金繰りの見通しを立てる。",
    "question": "みなと商店から商品の注文を受け、商品引渡前の内金70,000円を現金で受け取った。商品はまだ引き渡していない。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 70000
        }
      ],
      "credit": [
        {
          "account": "前受金",
          "amount": 70000
        }
      ]
    },
    "explanation": "【処理の根拠】\n引渡し前なので売上ではなく、商品を引き渡す義務である前受金を計上します。\n【金額確認】借方合計・貸方合計はいずれも70,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "前受金"
  },
  "J017": {
    "id": "J017",
    "type": "journal",
    "category": "現金過不足",
    "difficulty": 1,
    "chapter": 4,
    "scene": "7月・現金の違和感",
    "story": "現金実査で差額が見つかった。総務担当の森と証憑をたどり、原因が分かるまで事実と推測を分けて処理する。",
    "question": "現金実査額が帳簿残高より5,000円少なかった。原因は調査中である。",
    "answer": {
      "debit": [
        {
          "account": "現金過不足",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n実際の現金に帳簿を合わせ、不足額は原因判明まで現金過不足で仮処理します。\n【金額確認】借方合計・貸方合計はいずれも5,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "現金過不足"
  },
  "J018": {
    "id": "J018",
    "type": "journal",
    "category": "現金過不足判明",
    "difficulty": 1,
    "chapter": 4,
    "scene": "7月・現金の違和感",
    "story": "現金実査で差額が見つかった。総務担当の森と証憑をたどり、原因が分かるまで事実と推測を分けて処理する。",
    "question": "現金不足額のうち3,000円は通信費の記帳漏れと判明した。現金過不足で処理済みである。",
    "answer": {
      "debit": [
        {
          "account": "通信費",
          "amount": 3000
        }
      ],
      "credit": [
        {
          "account": "現金過不足",
          "amount": 3000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮に借方計上していた現金過不足を減らし、判明した費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも3,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "現金過不足判明"
  },
  "J019": {
    "id": "J019",
    "type": "journal",
    "category": "小口現金",
    "difficulty": 1,
    "chapter": 4,
    "scene": "7月・現金の違和感",
    "story": "現金実査で差額が見つかった。総務担当の森と証憑をたどり、原因が分かるまで事実と推測を分けて処理する。",
    "question": "小口現金係へ定額資金として40,000円の小切手を振り出して前渡しした。",
    "answer": {
      "debit": [
        {
          "account": "小口現金",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n小口現金を増やし、自己振出小切手により当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "小口現金"
  },
  "J020": {
    "id": "J020",
    "type": "journal",
    "category": "小口現金精算",
    "difficulty": 1,
    "chapter": 4,
    "scene": "7月・現金の違和感",
    "story": "現金実査で差額が見つかった。総務担当の森と証憑をたどり、原因が分かるまで事実と推測を分けて処理する。",
    "question": "小口現金係から、交通費4,800円、通信費3,200円、消耗品費6,000円の報告を受け、直ちに同額の小切手を振り出して補給した。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 4800
        },
        {
          "account": "通信費",
          "amount": 3200
        },
        {
          "account": "消耗品費",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 14000
        }
      ]
    },
    "explanation": "【処理の根拠】\nインプレスト・システムで補給時に報告された費用を計上し、支出合計額だけ当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも14,000円です。\n【試験のポイント】4,800＋3,200＋6,000＝14,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "小口現金精算"
  },
  "J021": {
    "id": "J021",
    "type": "journal",
    "category": "固定資産購入",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "業務用パソコン280,000円を購入し、代金は翌月払いとした。",
    "answer": {
      "debit": [
        {
          "account": "備品",
          "amount": 280000
        }
      ],
      "credit": [
        {
          "account": "未払金",
          "amount": 280000
        }
      ]
    },
    "explanation": "【処理の根拠】\n長期使用するパソコンは備品、商品以外の購入による後払い義務は未払金です。\n【金額確認】借方合計・貸方合計はいずれも280,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "固定資産購入"
  },
  "J022": {
    "id": "J022",
    "type": "journal",
    "category": "固定資産売却",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "取得原価300,000円、減価償却累計額180,000円の備品を100,000円で売却し、代金は普通預金へ入金された。間接法による。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 100000
        },
        {
          "account": "減価償却累計額",
          "amount": 180000
        },
        {
          "account": "固定資産売却損",
          "amount": 20000
        }
      ],
      "credit": [
        {
          "account": "備品",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n帳簿価額120,000円と売却額との差額を固定資産売却損とします。取得原価と累計額も取り崩します。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。\n【試験のポイント】帳簿価額＝300,000－180,000です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "固定資産売却"
  },
  "J023": {
    "id": "J023",
    "type": "journal",
    "category": "仮払金",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "営業担当の高橋へ出張旅費の概算額60,000円を現金で前渡しした。",
    "answer": {
      "debit": [
        {
          "account": "仮払金",
          "amount": 60000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 60000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支出内容と確定額が未確定なので、一時的な資産である仮払金として処理します。\n【金額確認】借方合計・貸方合計はいずれも60,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "仮払金"
  },
  "J024": {
    "id": "J024",
    "type": "journal",
    "category": "仮払金精算",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "高橋が出張から戻り、旅費54,000円の領収書と、未使用の現金6,000円を返却した。概算額は仮払金で処理済みである。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 54000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "仮払金",
          "amount": 60000
        }
      ]
    },
    "explanation": "【処理の根拠】\n確定した旅費を費用にし、返金分は現金の増加、前渡額全額は仮払金の減少とします。\n【金額確認】借方合計・貸方合計はいずれも60,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "仮払金精算"
  },
  "J025": {
    "id": "J025",
    "type": "journal",
    "category": "立替金",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "従業員が負担すべき生命保険料18,000円を会社が現金で立て替えた。",
    "answer": {
      "debit": [
        {
          "account": "立替金",
          "amount": 18000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 18000
        }
      ]
    },
    "explanation": "【処理の根拠】\n会社の費用ではなく従業員への債権が生じるため、立替金を計上します。\n【金額確認】借方合計・貸方合計はいずれも18,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "立替金"
  },
  "J026": {
    "id": "J026",
    "type": "journal",
    "category": "借入金",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "銀行から1,000,000円を借り入れ、全額が普通預金へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 1000000
        }
      ],
      "credit": [
        {
          "account": "借入金",
          "amount": 1000000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金という資産と、返済義務である借入金という負債が同額増加します。\n【金額確認】借方合計・貸方合計はいずれも1,000,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "借入金"
  },
  "J027": {
    "id": "J027",
    "type": "journal",
    "category": "借入金返済",
    "difficulty": 1,
    "chapter": 5,
    "scene": "8月・業務拡大",
    "story": "備品購入や出張が増え、商品以外の債権・債務も増えてきた。経理は支出の目的と回収義務を確認しながら処理する。",
    "question": "借入金元本200,000円と利息6,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "借入金",
          "amount": 200000
        },
        {
          "account": "支払利息",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 206000
        }
      ]
    },
    "explanation": "【処理の根拠】\n元本返済は借入金の減少、利息は当期の費用です。両者を合計した額だけ預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも206,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "借入金返済"
  },
  "J028": {
    "id": "J028",
    "type": "journal",
    "category": "給与",
    "difficulty": 1,
    "chapter": 6,
    "scene": "9月・給与と税金",
    "story": "従業員が増え、給与控除や社会保険、税金の納付が重なった。会社負担と従業員からの預り分を混同しないことが課題になる。",
    "question": "給与総額420,000円から所得税預り金20,000円と社会保険料預り金50,000円を控除し、差額を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "給料",
          "amount": 420000
        }
      ],
      "credit": [
        {
          "account": "所得税預り金",
          "amount": 20000
        },
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "普通預金",
          "amount": 350000
        }
      ]
    },
    "explanation": "【処理の根拠】\n給与総額を費用とし、控除額は会社の預り金、差額は実際の支払額として処理します。\n【金額確認】借方合計・貸方合計はいずれも420,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "給与"
  },
  "J029": {
    "id": "J029",
    "type": "journal",
    "category": "預り金納付",
    "difficulty": 1,
    "chapter": 6,
    "scene": "9月・給与と税金",
    "story": "従業員が増え、給与控除や社会保険、税金の納付が重なった。会社負担と従業員からの預り分を混同しないことが課題になる。",
    "question": "従業員から預かっていた所得税20,000円を普通預金から税務署へ納付した。",
    "answer": {
      "debit": [
        {
          "account": "所得税預り金",
          "amount": 20000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 20000
        }
      ]
    },
    "explanation": "【処理の根拠】\n納付により預り金という負債が消滅し、普通預金が減少します。\n【金額確認】借方合計・貸方合計はいずれも20,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "預り金納付"
  },
  "J030": {
    "id": "J030",
    "type": "journal",
    "category": "法定福利費",
    "difficulty": 1,
    "chapter": 6,
    "scene": "9月・給与と税金",
    "story": "従業員が増え、給与控除や社会保険、税金の納付が重なった。会社負担と従業員からの預り分を混同しないことが課題になる。",
    "question": "社会保険料について、従業員預り分50,000円と会社負担分50,000円を普通預金から納付した。",
    "answer": {
      "debit": [
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "法定福利費",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 100000
        }
      ]
    },
    "explanation": "【処理の根拠】\n従業員分は預り金の消滅、会社負担分は法定福利費です。支払総額は両者の合計です。\n【金額確認】借方合計・貸方合計はいずれも100,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "法定福利費"
  },
  "J031": {
    "id": "J031",
    "type": "journal",
    "category": "租税公課",
    "difficulty": 1,
    "chapter": 6,
    "scene": "9月・給与と税金",
    "story": "従業員が増え、給与控除や社会保険、税金の納付が重なった。会社負担と従業員からの預り分を混同しないことが課題になる。",
    "question": "店舗に係る固定資産税48,000円を、納付書により現金で納付した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 48000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 48000
        }
      ]
    },
    "explanation": "【処理の根拠】\n事業に係る固定資産税は租税公課として費用計上し、現金を減らします。\n【金額確認】借方合計・貸方合計はいずれも48,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "租税公課"
  },
  "J032": {
    "id": "J032",
    "type": "journal",
    "category": "収入印紙",
    "difficulty": 1,
    "chapter": 6,
    "scene": "9月・給与と税金",
    "story": "従業員が増え、給与控除や社会保険、税金の納付が重なった。会社負担と従業員からの預り分を混同しないことが課題になる。",
    "question": "契約書に貼付する収入印紙10,000円を現金で購入し、直ちに使用した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 10000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 10000
        }
      ]
    },
    "explanation": "【処理の根拠】\n使用した収入印紙は租税公課として処理します。\n【金額確認】借方合計・貸方合計はいずれも10,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "収入印紙"
  },
  "J033": {
    "id": "J033",
    "type": "journal",
    "category": "貸付金",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、補助簿と総勘定元帳を照合する。水野は前期の決算資料も取り出し、日常処理が決算へどうつながるかを確認させる。",
    "question": "取引先へ300,000円を貸し付け、普通預金から送金した。",
    "answer": {
      "debit": [
        {
          "account": "貸付金",
          "amount": 300000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返済を受ける権利は貸付金という資産です。送金により普通預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "貸付金"
  },
  "J034": {
    "id": "J034",
    "type": "journal",
    "category": "利息受取",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、補助簿と総勘定元帳を照合する。水野は前期の決算資料も取り出し、日常処理が決算へどうつながるかを確認させる。",
    "question": "貸付金の利息9,000円が普通預金口座へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 9000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 9000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、貸付けによる収益である受取利息を計上します。\n【金額確認】借方合計・貸方合計はいずれも9,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "利息受取"
  },
  "J035": {
    "id": "J035",
    "type": "journal",
    "category": "貯蔵品",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、補助簿と総勘定元帳を照合する。水野は前期の決算資料も取り出し、日常処理が決算へどうつながるかを確認させる。",
    "question": "前期末の決算資料を確認したところ、購入時に「租税公課」として処理していた収入印紙のうち5,000円分が未使用であった。未使用分を「貯蔵品」へ振り替える仕訳を確認しなさい。",
    "answer": {
      "debit": [
        {
          "account": "貯蔵品",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "租税公課",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n購入時に費用処理していた収入印紙の未使用分は、次期以降に使用できる資産です。そこで「租税公課」を取り崩し、「貯蔵品」へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも5,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "貯蔵品"
  },
  "J036": {
    "id": "J036",
    "type": "journal",
    "category": "受取商品券",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、補助簿と総勘定元帳を照合する。水野は前期の決算資料も取り出し、日常処理が決算へどうつながるかを確認させる。",
    "question": "商品80,000円を販売し、代金として他店発行の商品券を受け取った。",
    "answer": {
      "debit": [
        {
          "account": "受取商品券",
          "amount": 80000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 80000
        }
      ]
    },
    "explanation": "【処理の根拠】\n換金または決済に使える他店発行券は受取商品券という資産です。\n【金額確認】借方合計・貸方合計はいずれも80,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "受取商品券"
  },
  "J037": {
    "id": "J037",
    "type": "journal",
    "category": "差入保証金",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、補助簿と総勘定元帳を照合する。水野は前期の決算資料も取り出し、日常処理が決算へどうつながるかを確認させる。",
    "question": "倉庫の賃貸借契約に伴い、返還される敷金200,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "差入保証金",
          "amount": 200000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 200000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返還予定の敷金は費用ではなく、差入保証金という資産です。\n【金額確認】借方合計・貸方合計はいずれも200,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "差入保証金"
  },
  "J038": {
    "id": "J038",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 1,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、試算表のずれをきっかけに記帳内容を点検する。数字が合わないときは、責任追及より先に証憑と帳簿を照合する。",
    "question": "消耗品費12,000円の現金支払いを、誤って通信費として記帳していた。訂正仕訳を行う。",
    "answer": {
      "debit": [
        {
          "account": "消耗品費",
          "amount": 12000
        }
      ],
      "credit": [
        {
          "account": "通信費",
          "amount": 12000
        }
      ]
    },
    "explanation": "【処理の根拠】\n現金の減少は既に正しいため触れず、誤った費用から正しい費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも12,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "訂正仕訳"
  },
  "J039": {
    "id": "J039",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 1,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、試算表のずれをきっかけに記帳内容を点検する。数字が合わないときは、責任追及より先に証憑と帳簿を照合する。",
    "question": "買掛金75,000円の普通預金による支払いを、借方・貸方とも57,000円と記帳していた。差額を訂正する。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 18000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 18000
        }
      ]
    },
    "explanation": "【処理の根拠】\n科目と方向は正しく、記帳額だけが18,000円不足しているため差額を追加します。\n【金額確認】借方合計・貸方合計はいずれも18,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "訂正仕訳"
  },
  "J040": {
    "id": "J040",
    "type": "journal",
    "category": "未記帳取引",
    "difficulty": 1,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、試算表のずれをきっかけに記帳内容を点検する。数字が合わないときは、責任追及より先に証憑と帳簿を照合する。",
    "question": "前期末の記帳資料を点検したところ、決算日前に発送し得意先が受領済みの商品140,000円について、掛売上が未記帳であった。必要な仕訳を確認しなさい。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 140000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 140000
        }
      ]
    },
    "explanation": "【処理の根拠】\n前期中に商品の引渡しが完了しているため、前期の売上として計上する必要があります。未記帳の掛売上140,000円を追加します。\n【金額確認】借方合計・貸方合計はいずれも140,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "未記帳取引"
  },
  "J041": {
    "id": "J041",
    "type": "journal",
    "category": "前払費用",
    "difficulty": 1,
    "chapter": 9,
    "scene": "12月・決算への準備",
    "story": "12月、3月決算に備えて前期の決算資料を使った予行演習を行う。現金の動きと収益・費用の期間帰属を切り分ける。",
    "question": "当期中に保険料120,000円を支払い、全額を「保険料」として処理していた。決算整理により、このうち次期分30,000円を繰り延べる。",
    "answer": {
      "debit": [
        {
          "account": "前払保険料",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "保険料",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払時に全額を「保険料」として費用処理しているため、次期分30,000円を当期費用から除き、「前払保険料」（資産）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "前払費用"
  },
  "J042": {
    "id": "J042",
    "type": "journal",
    "category": "未払費用",
    "difficulty": 1,
    "chapter": 9,
    "scene": "12月・決算への準備",
    "story": "12月、3月決算に備えて前期の決算資料を使った予行演習を行う。現金の動きと収益・費用の期間帰属を切り分ける。",
    "question": "決算日に、当期分の借入金利息15,000円が未払いであることが判明した。",
    "answer": {
      "debit": [
        {
          "account": "支払利息",
          "amount": 15000
        }
      ],
      "credit": [
        {
          "account": "未払利息",
          "amount": 15000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生した利息を費用計上し、未払額を負債として認識します。\n【金額確認】借方合計・貸方合計はいずれも15,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "未払費用"
  },
  "J043": {
    "id": "J043",
    "type": "journal",
    "category": "前受収益",
    "difficulty": 1,
    "chapter": 9,
    "scene": "12月・決算への準備",
    "story": "12月、3月決算に備えて前期の決算資料を使った予行演習を行う。現金の動きと収益・費用の期間帰属を切り分ける。",
    "question": "当期中に家賃90,000円を受け取り、全額を「受取家賃」として処理していた。決算整理により、このうち次期分30,000円を繰り延べる。",
    "answer": {
      "debit": [
        {
          "account": "受取家賃",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "前受家賃",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受取時に全額を「受取家賃」として収益処理しているため、次期分30,000円を当期収益から除き、「前受家賃」（負債）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "前受収益"
  },
  "J044": {
    "id": "J044",
    "type": "journal",
    "category": "未収収益",
    "difficulty": 1,
    "chapter": 9,
    "scene": "12月・決算への準備",
    "story": "12月、3月決算に備えて前期の決算資料を使った予行演習を行う。現金の動きと収益・費用の期間帰属を切り分ける。",
    "question": "貸付金について、当期分の利息12,000円が決算日現在未収である。",
    "answer": {
      "debit": [
        {
          "account": "未収利息",
          "amount": 12000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 12000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生済みの収益を計上し、未回収額を資産として認識します。\n【金額確認】借方合計・貸方合計はいずれも12,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "未収収益"
  },
  "J045": {
    "id": "J045",
    "type": "journal",
    "category": "貸倒引当金",
    "difficulty": 1,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、3月決算に備えて前期資料で決算整理を演習する。棚卸し、減価償却、貸倒れの見積りを根拠から確認する。",
    "question": "決算日の売掛金残高800,000円に対し2％の貸倒れを見積もる。貸倒引当金の決算整理前残高は6,000円（貸方）である。差額補充法による。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金繰入",
          "amount": 10000
        }
      ],
      "credit": [
        {
          "account": "貸倒引当金",
          "amount": 10000
        }
      ]
    },
    "explanation": "【処理の根拠】\n必要額（売掛金×2％）から既存の貸方残高を差し引き、不足額だけ繰り入れます。\n【金額確認】借方合計・貸方合計はいずれも10,000円です。\n【試験のポイント】差額補充法では必要額全額を重ねて計上しません。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "貸倒引当金"
  },
  "J046": {
    "id": "J046",
    "type": "journal",
    "category": "貸倒れ",
    "difficulty": 1,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、3月決算に備えて前期資料で決算整理を演習する。棚卸し、減価償却、貸倒れの見積りを根拠から確認する。",
    "question": "前期に発生した売掛金30,000円が回収不能となった。貸倒引当金残高は十分にある。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n前期発生債権の貸倒れは、設定済みの貸倒引当金を取り崩します。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "貸倒れ"
  },
  "J047": {
    "id": "J047",
    "type": "journal",
    "category": "減価償却",
    "difficulty": 1,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、3月決算に備えて前期資料で決算整理を演習する。棚卸し、減価償却、貸倒れの見積りを根拠から確認する。",
    "question": "備品（取得原価600,000円、残存価額ゼロ、耐用年数5年）を期首から使用している。定額法・間接法で決算整理を行う。",
    "answer": {
      "debit": [
        {
          "account": "減価償却費",
          "amount": 120000
        }
      ],
      "credit": [
        {
          "account": "減価償却累計額",
          "amount": 120000
        }
      ]
    },
    "explanation": "【処理の根拠】\n取得原価を耐用年数で割った1年分を減価償却費とし、間接法なので累計額を貸方計上します。\n【金額確認】借方合計・貸方合計はいずれも120,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "減価償却"
  },
  "J048": {
    "id": "J048",
    "type": "journal",
    "category": "売上原価",
    "difficulty": 1,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、3月決算に備えて前期資料で決算整理を演習する。棚卸し、減価償却、貸倒れの見積りを根拠から確認する。",
    "question": "期首商品棚卸高180,000円、期末商品棚卸高230,000円である。仕入勘定で売上原価を算定するため、期首商品と期末商品について必要な決算整理仕訳をまとめて入力しなさい。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 180000
        },
        {
          "account": "繰越商品",
          "amount": 230000
        }
      ],
      "credit": [
        {
          "account": "繰越商品",
          "amount": 180000
        },
        {
          "account": "仕入",
          "amount": 230000
        }
      ]
    },
    "explanation": "【処理の根拠】\n期首商品180,000円は「仕入」へ振り替え、期末商品230,000円は次期へ繰り越す資産として「繰越商品」に戻します。\n【仕訳の確認】借方は「仕入」180,000円と「繰越商品」230,000円、貸方は「繰越商品」180,000円と「仕入」230,000円です。\n【試験のポイント】いわゆる「し・くり・くり・し」の2本を、意味とセットで確認します。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "売上原価"
  },
  "J049": {
    "id": "J049",
    "type": "journal",
    "category": "消費税",
    "difficulty": 1,
    "chapter": 11,
    "scene": "2月・精算表",
    "story": "2月、前期の精算表を使い、決算整理仕訳が財務諸表へ反映される流れを確認する。",
    "question": "決算日に、仮払消費税85,000円と仮受消費税132,000円を相殺し、未払額を計上する。税抜方式による。",
    "answer": {
      "debit": [
        {
          "account": "仮受消費税",
          "amount": 132000
        }
      ],
      "credit": [
        {
          "account": "仮払消費税",
          "amount": 85000
        },
        {
          "account": "未払消費税",
          "amount": 47000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮受消費税から仮払消費税を差し引いた47,000円が納付予定額です。\n【金額確認】借方合計・貸方合計はいずれも132,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "消費税"
  },
  "J050": {
    "id": "J050",
    "type": "journal",
    "category": "当期純利益",
    "difficulty": 1,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、年度決算本番。主人公は一年かけて整えた帳簿を基に、社長へ会社の成果と財政状態を数字で説明する。",
    "question": "決算振替後、損益勘定の貸方残高が420,000円となった。当期純利益を繰越利益剰余金へ振り替える。",
    "answer": {
      "debit": [
        {
          "account": "損益",
          "amount": 420000
        }
      ],
      "credit": [
        {
          "account": "繰越利益剰余金",
          "amount": 420000
        }
      ]
    },
    "explanation": "【処理の根拠】\n収益が費用を上回った貸方残高は当期純利益です。損益を借方で閉鎖し、純資産へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも420,000円です。",
    "learningRole": "core",
    "timelineRole": "main",
    "variantGroup": "当期純利益"
  },
  "J051": {
    "id": "J051",
    "type": "journal",
    "category": "資本金・追加出資",
    "difficulty": 1,
    "chapter": 1,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が基礎取引の復習カードを渡した。以前と同じ結論を覚えるのではなく、資産・負債・純資産の増減からもう一度判断する。",
    "question": "事業拡大のため、株主から現金3,010,000円の追加出資を受けた。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 3010000
        }
      ],
      "credit": [
        {
          "account": "資本金",
          "amount": 3010000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受け取った現金は資産の増加、株主からの払込みは純資産である資本金の増加として処理します。\n【金額確認】借方合計・貸方合計はいずれも3,010,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "資本金・追加出資"
  },
  "J052": {
    "id": "J052",
    "type": "journal",
    "category": "現金・預金",
    "difficulty": 1,
    "chapter": 1,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が基礎取引の復習カードを渡した。以前と同じ結論を覚えるのではなく、資産・負債・純資産の増減からもう一度判断する。",
    "question": "手許現金190,000円を普通預金口座へ預け入れた。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 190000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 190000
        }
      ]
    },
    "explanation": "【処理の根拠】\n普通預金が増え、同額だけ手許現金が減る、資産内部の振替です。\n【金額確認】借方合計・貸方合計はいずれも190,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "現金・預金"
  },
  "J053": {
    "id": "J053",
    "type": "journal",
    "category": "当座預金",
    "difficulty": 1,
    "chapter": 1,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が基礎取引の復習カードを渡した。以前と同じ結論を覚えるのではなく、資産・負債・純資産の増減からもう一度判断する。",
    "question": "当座預金口座を開設し、普通預金から510,000円を振り替えた。",
    "answer": {
      "debit": [
        {
          "account": "当座預金",
          "amount": 510000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 510000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当座預金の増加を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも510,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "当座預金"
  },
  "J054": {
    "id": "J054",
    "type": "journal",
    "category": "掛仕入",
    "difficulty": 1,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "北斗物産から商品250,000円を仕入れ、代金は掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 250000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 250000
        }
      ]
    },
    "explanation": "【処理の根拠】\n三分法では、商品の購入額を「仕入」（費用）として処理し、商品代金を後日支払う義務を「買掛金」として計上します。\n【金額確認】借方合計・貸方合計はいずれも250,000円です。\n【試験のポイント】営業用の商品に生じる債務なので未払金ではありません。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "掛仕入"
  },
  "J055": {
    "id": "J055",
    "type": "journal",
    "category": "掛売上",
    "difficulty": 1,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "港南商店へ商品370,000円を販売し、代金は掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 370000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 370000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金を後日受け取る権利は売掛金、商品の販売による収益は売上です。\n【金額確認】借方合計・貸方合計はいずれも370,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "掛売上"
  },
  "J056": {
    "id": "J056",
    "type": "journal",
    "category": "仕入諸掛",
    "difficulty": 2,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "北斗物産から商品210,000円を仕入れ、商品代金は掛けとした。なお、商品代金とは別に、当店負担の引取運賃6,000円を現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 216000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 210000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金は掛け、引取運賃は現金払いですが、当店負担の仕入諸掛は商品の取得原価に含めるため、両者を「仕入」に集計します。\n【金額確認】借方合計・貸方合計はいずれも216,000円です。\n【試験のポイント】当店負担の仕入諸掛を独立した運賃科目にしない点に注意します。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "仕入諸掛"
  },
  "J057": {
    "id": "J057",
    "type": "journal",
    "category": "売上諸掛",
    "difficulty": 2,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "港南商店へ商品180,000円を販売し、商品代金は掛けとした。なお、商品代金とは別に、当店負担の発送運賃5,000円を現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 180000
        },
        {
          "account": "発送費",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 180000
        },
        {
          "account": "現金",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金の掛販売と、当店負担の発送運賃の現金払いは別々の取引として考えます。当店が負担する発送運賃は「発送費」（費用）です。\n【金額確認】借方合計・貸方合計はいずれも185,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "売上諸掛"
  },
  "J058": {
    "id": "J058",
    "type": "journal",
    "category": "仕入返品",
    "difficulty": 2,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "先週北斗物産から掛けで仕入れた商品のうち、品違いのため40,000円分を返品した。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "仕入",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け仕入れの取り消しに当たるため、買掛金と仕入をそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。\n【試験のポイント】返品時は当初の仕訳を逆にします。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "仕入返品"
  },
  "J059": {
    "id": "J059",
    "type": "journal",
    "category": "売上返品",
    "difficulty": 2,
    "chapter": 2,
    "scene": "復習編・水野先輩の確認",
    "story": "水野先輩が仕入・販売の類似ケースを並べた。商品代金と付随費用、負担者と支払者を分けて読むことが復習の狙いだ。",
    "question": "港南商店へ掛けで販売した商品のうち、破損品34,000円分が返品された。",
    "answer": {
      "debit": [
        {
          "account": "売上",
          "amount": 34000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 34000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け売上げの取り消しに当たるため、売上を借方で、売掛金を貸方でそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも34,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "売上返品"
  },
  "J060": {
    "id": "J060",
    "type": "journal",
    "category": "売掛金回収",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "港南商店に対する売掛金290,000円が普通預金口座へ振り込まれた。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 290000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 290000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、代金回収による売掛金の減少を記録します。\n【金額確認】借方合計・貸方合計はいずれも290,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "売掛金回収"
  },
  "J061": {
    "id": "J061",
    "type": "journal",
    "category": "買掛金支払",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "北斗物産に対する買掛金200,000円を普通預金口座から振り込んだ。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 200000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 200000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払義務である買掛金の減少を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも200,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "買掛金支払"
  },
  "J062": {
    "id": "J062",
    "type": "journal",
    "category": "電子記録債務",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "北斗物産に対する買掛金160,000円について、取引先との合意に基づき電子記録債務の発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 160000
        }
      ],
      "credit": [
        {
          "account": "電子記録債務",
          "amount": 160000
        }
      ]
    },
    "explanation": "【処理の根拠】\n既存の買掛金を消滅させ、新たに電子記録債務を計上します。\n【金額確認】借方合計・貸方合計はいずれも160,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "電子記録債務"
  },
  "J063": {
    "id": "J063",
    "type": "journal",
    "category": "電子記録債権",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "港南商店に対する売掛金220,000円について、取引先との合意に基づき電子記録債権の発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "電子記録債権",
          "amount": 220000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 220000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売掛金を電子記録債権へ振り替える取引です。債権総額は変わりません。\n【金額確認】借方合計・貸方合計はいずれも220,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "電子記録債権"
  },
  "J064": {
    "id": "J064",
    "type": "journal",
    "category": "クレジット売掛金",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "商品135,000円をクレジットカードで販売した。信販会社の手数料は販売額の2％で、販売時に計上する。",
    "answer": {
      "debit": [
        {
          "account": "クレジット売掛金",
          "amount": 132300
        },
        {
          "account": "支払手数料",
          "amount": 2700
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 135000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売上は販売額の全額を計上します。信販会社への手数料は「支払手数料」（費用）、差引入金予定額は「クレジット売掛金」として処理します。\n【金額確認】借方合計・貸方合計はいずれも135,000円です。\n【試験のポイント】販売額×2％が手数料です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "クレジット売掛金"
  },
  "J065": {
    "id": "J065",
    "type": "journal",
    "category": "前払金",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "北斗物産へ商品を注文し、商品受領前の内金60,000円を現金で支払った。商品はまだ受け取っていない。",
    "answer": {
      "debit": [
        {
          "account": "前払金",
          "amount": 60000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 60000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品を受け取る前の支払いであるため、仕入ではなく、後日商品を受け取る権利として「前払金」を計上します。\n【金額確認】借方合計・貸方合計はいずれも60,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "前払金"
  },
  "J066": {
    "id": "J066",
    "type": "journal",
    "category": "前受金",
    "difficulty": 2,
    "chapter": 3,
    "scene": "復習編・水野先輩の確認",
    "story": "掛取引と決済の復習。債権・債務が別の決済手段へ変わっても、何が増え何が減るかを追跡する。",
    "question": "港南商店から商品の注文を受け、商品引渡前の内金80,000円を現金で受け取った。商品はまだ引き渡していない。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 80000
        }
      ],
      "credit": [
        {
          "account": "前受金",
          "amount": 80000
        }
      ]
    },
    "explanation": "【処理の根拠】\n引渡し前なので売上ではなく、商品を引き渡す義務である前受金を計上します。\n【金額確認】借方合計・貸方合計はいずれも80,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "前受金"
  },
  "J067": {
    "id": "J067",
    "type": "journal",
    "category": "現金過不足",
    "difficulty": 2,
    "chapter": 4,
    "scene": "復習編・水野先輩の確認",
    "story": "現金管理の復習。差額の発生、原因判明、小口現金の補給を、処理時点ごとに切り分ける。",
    "question": "現金実査額が帳簿残高より6,000円少なかった。原因は調査中である。",
    "answer": {
      "debit": [
        {
          "account": "現金過不足",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 6000
        }
      ]
    },
    "explanation": "【処理の根拠】\n実際の現金に帳簿を合わせ、不足額は原因判明まで現金過不足で仮処理します。\n【金額確認】借方合計・貸方合計はいずれも6,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "現金過不足"
  },
  "J068": {
    "id": "J068",
    "type": "journal",
    "category": "現金過不足判明",
    "difficulty": 2,
    "chapter": 4,
    "scene": "復習編・水野先輩の確認",
    "story": "現金管理の復習。差額の発生、原因判明、小口現金の補給を、処理時点ごとに切り分ける。",
    "question": "現金不足額のうち4,000円は通信費の記帳漏れと判明した。現金過不足で処理済みである。",
    "answer": {
      "debit": [
        {
          "account": "通信費",
          "amount": 4000
        }
      ],
      "credit": [
        {
          "account": "現金過不足",
          "amount": 4000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮に借方計上していた現金過不足を減らし、判明した費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも4,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "現金過不足判明"
  },
  "J069": {
    "id": "J069",
    "type": "journal",
    "category": "小口現金",
    "difficulty": 2,
    "chapter": 4,
    "scene": "復習編・水野先輩の確認",
    "story": "現金管理の復習。差額の発生、原因判明、小口現金の補給を、処理時点ごとに切り分ける。",
    "question": "小口現金係へ定額資金として50,000円の小切手を振り出して前渡しした。",
    "answer": {
      "debit": [
        {
          "account": "小口現金",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n小口現金を増やし、自己振出小切手により当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "小口現金"
  },
  "J070": {
    "id": "J070",
    "type": "journal",
    "category": "小口現金精算",
    "difficulty": 2,
    "chapter": 4,
    "scene": "復習編・水野先輩の確認",
    "story": "現金管理の復習。差額の発生、原因判明、小口現金の補給を、処理時点ごとに切り分ける。",
    "question": "小口現金係から、交通費4,800円、通信費3,200円、消耗品費6,000円の報告を受け、直ちに同額の小切手を振り出して補給した。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 4800
        },
        {
          "account": "通信費",
          "amount": 3200
        },
        {
          "account": "消耗品費",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 14000
        }
      ]
    },
    "explanation": "【処理の根拠】\nインプレスト・システムで補給時に報告された費用を計上し、支出合計額だけ当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも14,000円です。\n【試験のポイント】4,800＋3,200＋6,000＝14,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "小口現金精算"
  },
  "J071": {
    "id": "J071",
    "type": "journal",
    "category": "固定資産購入",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "業務用パソコン290,000円を購入し、代金は翌月払いとした。",
    "answer": {
      "debit": [
        {
          "account": "備品",
          "amount": 290000
        }
      ],
      "credit": [
        {
          "account": "未払金",
          "amount": 290000
        }
      ]
    },
    "explanation": "【処理の根拠】\n長期使用するパソコンは備品、商品以外の購入による後払い義務は未払金です。\n【金額確認】借方合計・貸方合計はいずれも290,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "固定資産購入"
  },
  "J072": {
    "id": "J072",
    "type": "journal",
    "category": "固定資産売却",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "取得原価300,000円、減価償却累計額180,000円の備品を105,000円で売却し、代金は普通預金へ入金された。間接法による。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 105000
        },
        {
          "account": "減価償却累計額",
          "amount": 180000
        },
        {
          "account": "固定資産売却損",
          "amount": 15000
        }
      ],
      "credit": [
        {
          "account": "備品",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n帳簿価額120,000円と売却額との差額を固定資産売却損とします。取得原価と累計額も取り崩します。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。\n【試験のポイント】帳簿価額＝300,000－180,000です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "固定資産売却"
  },
  "J073": {
    "id": "J073",
    "type": "journal",
    "category": "仮払金",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "営業担当の高橋へ出張旅費の概算額70,000円を現金で前渡しした。",
    "answer": {
      "debit": [
        {
          "account": "仮払金",
          "amount": 70000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 70000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支出内容と確定額が未確定なので、一時的な資産である仮払金として処理します。\n【金額確認】借方合計・貸方合計はいずれも70,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "仮払金"
  },
  "J074": {
    "id": "J074",
    "type": "journal",
    "category": "仮払金精算",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "高橋が出張から戻り、旅費64,000円の領収書と、未使用の現金6,000円を返却した。概算額は仮払金で処理済みである。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 64000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "仮払金",
          "amount": 70000
        }
      ]
    },
    "explanation": "【処理の根拠】\n確定した旅費を費用にし、返金分は現金の増加、前渡額全額は仮払金の減少とします。\n【金額確認】借方合計・貸方合計はいずれも70,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "仮払金精算"
  },
  "J075": {
    "id": "J075",
    "type": "journal",
    "category": "立替金",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "従業員が負担すべき生命保険料28,000円を会社が現金で立て替えた。",
    "answer": {
      "debit": [
        {
          "account": "立替金",
          "amount": 28000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 28000
        }
      ]
    },
    "explanation": "【処理の根拠】\n会社の費用ではなく従業員への債権が生じるため、立替金を計上します。\n【金額確認】借方合計・貸方合計はいずれも28,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "立替金"
  },
  "J076": {
    "id": "J076",
    "type": "journal",
    "category": "借入金",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "銀行から1,010,000円を借り入れ、全額が普通預金へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 1010000
        }
      ],
      "credit": [
        {
          "account": "借入金",
          "amount": 1010000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金という資産と、返済義務である借入金という負債が同額増加します。\n【金額確認】借方合計・貸方合計はいずれも1,010,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "借入金"
  },
  "J077": {
    "id": "J077",
    "type": "journal",
    "category": "借入金返済",
    "difficulty": 2,
    "chapter": 5,
    "scene": "復習編・水野先輩の確認",
    "story": "商品以外の資産・債務の復習。支払ったという事実だけで費用と決めず、会社に残る権利や回収可能性を確認する。",
    "question": "借入金元本210,000円と利息6,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "借入金",
          "amount": 210000
        },
        {
          "account": "支払利息",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 216000
        }
      ]
    },
    "explanation": "【処理の根拠】\n元本返済は借入金の減少、利息は当期の費用です。両者を合計した額だけ預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも216,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "借入金返済"
  },
  "J078": {
    "id": "J078",
    "type": "journal",
    "category": "給与",
    "difficulty": 2,
    "chapter": 6,
    "scene": "復習編・水野先輩の確認",
    "story": "給与・税金の復習。会社負担、従業員からの預り、国等への納付という三者の関係を整理する。",
    "question": "給与総額430,000円から所得税預り金20,000円と社会保険料預り金50,000円を控除し、差額を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "給料",
          "amount": 430000
        }
      ],
      "credit": [
        {
          "account": "所得税預り金",
          "amount": 20000
        },
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "普通預金",
          "amount": 360000
        }
      ]
    },
    "explanation": "【処理の根拠】\n給与総額を費用とし、控除額は会社の預り金、差額は実際の支払額として処理します。\n【金額確認】借方合計・貸方合計はいずれも430,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "給与"
  },
  "J079": {
    "id": "J079",
    "type": "journal",
    "category": "預り金納付",
    "difficulty": 2,
    "chapter": 6,
    "scene": "復習編・水野先輩の確認",
    "story": "給与・税金の復習。会社負担、従業員からの預り、国等への納付という三者の関係を整理する。",
    "question": "従業員から預かっていた所得税30,000円を普通預金から税務署へ納付した。",
    "answer": {
      "debit": [
        {
          "account": "所得税預り金",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n納付により預り金という負債が消滅し、普通預金が減少します。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "預り金納付"
  },
  "J080": {
    "id": "J080",
    "type": "journal",
    "category": "法定福利費",
    "difficulty": 2,
    "chapter": 6,
    "scene": "復習編・水野先輩の確認",
    "story": "給与・税金の復習。会社負担、従業員からの預り、国等への納付という三者の関係を整理する。",
    "question": "社会保険料について、従業員預り分50,000円と会社負担分50,000円を普通預金から納付した。",
    "answer": {
      "debit": [
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "法定福利費",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 100000
        }
      ]
    },
    "explanation": "【処理の根拠】\n従業員分は預り金の消滅、会社負担分は法定福利費です。支払総額は両者の合計です。\n【金額確認】借方合計・貸方合計はいずれも100,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "法定福利費"
  },
  "J081": {
    "id": "J081",
    "type": "journal",
    "category": "租税公課",
    "difficulty": 2,
    "chapter": 6,
    "scene": "復習編・水野先輩の確認",
    "story": "給与・税金の復習。会社負担、従業員からの預り、国等への納付という三者の関係を整理する。",
    "question": "店舗に係る固定資産税48,000円を、納付書により現金で納付した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 58000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 58000
        }
      ]
    },
    "explanation": "【処理の根拠】\n事業に係る固定資産税は租税公課として費用計上し、現金を減らします。\n【金額確認】借方合計・貸方合計はいずれも58,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "租税公課"
  },
  "J082": {
    "id": "J082",
    "type": "journal",
    "category": "収入印紙",
    "difficulty": 2,
    "chapter": 6,
    "scene": "復習編・水野先輩の確認",
    "story": "給与・税金の復習。会社負担、従業員からの預り、国等への納付という三者の関係を整理する。",
    "question": "契約書に貼付する収入印紙20,000円を現金で購入し、直ちに使用した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 20000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 20000
        }
      ]
    },
    "explanation": "【処理の根拠】\n使用した収入印紙は租税公課として処理します。\n【金額確認】借方合計・貸方合計はいずれも20,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "収入印紙"
  },
  "J083": {
    "id": "J083",
    "type": "journal",
    "category": "貸付金",
    "difficulty": 2,
    "chapter": 7,
    "scene": "復習編・水野先輩の確認",
    "story": "日常取引と補助簿の復習。過去の処理を別条件で確かめ、勘定科目の選択理由を言葉にする。",
    "question": "取引先へ310,000円を貸し付け、普通預金から送金した。",
    "answer": {
      "debit": [
        {
          "account": "貸付金",
          "amount": 310000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 310000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返済を受ける権利は貸付金という資産です。送金により普通預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも310,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "貸付金"
  },
  "J084": {
    "id": "J084",
    "type": "journal",
    "category": "利息受取",
    "difficulty": 2,
    "chapter": 7,
    "scene": "復習編・水野先輩の確認",
    "story": "日常取引と補助簿の復習。過去の処理を別条件で確かめ、勘定科目の選択理由を言葉にする。",
    "question": "貸付金の利息19,000円が普通預金口座へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 19000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 19000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、貸付けによる収益である受取利息を計上します。\n【金額確認】借方合計・貸方合計はいずれも19,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "利息受取"
  },
  "J085": {
    "id": "J085",
    "type": "journal",
    "category": "仮受金",
    "difficulty": 2,
    "chapter": 7,
    "scene": "復習編・水野先輩の確認",
    "story": "日常取引と補助簿の復習。過去の処理を別条件で確かめ、勘定科目の選択理由を言葉にする。",
    "question": "普通預金への入金30,000円について内容が不明であったため、仮受金として処理した。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "仮受金",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n内容が確定していない入金は、判明するまで仮受金という負債で処理します。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "仮受金"
  },
  "J086": {
    "id": "J086",
    "type": "journal",
    "category": "受取商品券",
    "difficulty": 2,
    "chapter": 7,
    "scene": "復習編・水野先輩の確認",
    "story": "日常取引と補助簿の復習。過去の処理を別条件で確かめ、勘定科目の選択理由を言葉にする。",
    "question": "商品90,000円を販売し、代金として他店発行の商品券を受け取った。",
    "answer": {
      "debit": [
        {
          "account": "受取商品券",
          "amount": 90000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 90000
        }
      ]
    },
    "explanation": "【処理の根拠】\n換金または決済に使える他店発行券は受取商品券という資産です。\n【金額確認】借方合計・貸方合計はいずれも90,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "受取商品券"
  },
  "J087": {
    "id": "J087",
    "type": "journal",
    "category": "差入保証金",
    "difficulty": 2,
    "chapter": 7,
    "scene": "復習編・水野先輩の確認",
    "story": "日常取引と補助簿の復習。過去の処理を別条件で確かめ、勘定科目の選択理由を言葉にする。",
    "question": "倉庫の賃貸借契約に伴い、返還される敷金210,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "差入保証金",
          "amount": 210000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 210000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返還予定の敷金は費用ではなく、差入保証金という資産です。\n【金額確認】借方合計・貸方合計はいずれも210,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "差入保証金"
  },
  "J088": {
    "id": "J088",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "復習編・水野先輩の確認",
    "story": "訂正の復習。誤り全体を消すのではなく、すでに正しい部分を残して差分だけ直す。",
    "question": "消耗品費22,000円の現金支払いを、誤って通信費として記帳していた。訂正仕訳を行う。",
    "answer": {
      "debit": [
        {
          "account": "消耗品費",
          "amount": 22000
        }
      ],
      "credit": [
        {
          "account": "通信費",
          "amount": 22000
        }
      ]
    },
    "explanation": "【処理の根拠】\n現金の減少は既に正しいため触れず、誤った費用から正しい費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも22,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "訂正仕訳"
  },
  "J089": {
    "id": "J089",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "復習編・水野先輩の確認",
    "story": "訂正の復習。誤り全体を消すのではなく、すでに正しい部分を残して差分だけ直す。",
    "question": "買掛金85,000円の普通預金による支払いを、借方・貸方とも67,000円と記帳していた。差額を訂正する。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 18000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 18000
        }
      ]
    },
    "explanation": "【処理の根拠】\n科目と方向は正しく、記帳額だけが18,000円不足しているため差額を追加します。\n【金額確認】借方合計・貸方合計はいずれも18,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "訂正仕訳"
  },
  "J090": {
    "id": "J090",
    "type": "journal",
    "category": "未記帳取引",
    "difficulty": 2,
    "chapter": 8,
    "scene": "復習編・水野先輩の確認",
    "story": "訂正の復習。誤り全体を消すのではなく、すでに正しい部分を残して差分だけ直す。",
    "question": "決算点検で、決算日前に発送し得意先が受領済みの商品150,000円について、掛売上が未記帳であることが判明した。必要な仕訳を行いなさい。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 150000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 150000
        }
      ]
    },
    "explanation": "【処理の根拠】\n引渡しが完了した当期の売上なので、未記帳の掛売上を追加します。\n【金額確認】借方合計・貸方合計はいずれも150,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "未記帳取引"
  },
  "J091": {
    "id": "J091",
    "type": "journal",
    "category": "前払費用",
    "difficulty": 2,
    "chapter": 9,
    "scene": "復習編・水野先輩の確認",
    "story": "経過勘定の復習。支払日・受取日ではなく、当期に属する収益・費用かどうかを基準に判断する。",
    "question": "当期中に保険料120,000円を支払い、全額を「保険料」として処理していた。決算整理により、このうち次期分40,000円を繰り延べる。",
    "answer": {
      "debit": [
        {
          "account": "前払保険料",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "保険料",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払時に全額を「保険料」として費用処理しているため、次期分40,000円を当期費用から除き、「前払保険料」（資産）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "前払費用"
  },
  "J092": {
    "id": "J092",
    "type": "journal",
    "category": "未払費用",
    "difficulty": 2,
    "chapter": 9,
    "scene": "復習編・水野先輩の確認",
    "story": "経過勘定の復習。支払日・受取日ではなく、当期に属する収益・費用かどうかを基準に判断する。",
    "question": "決算日に、当期分の借入金利息25,000円が未払いであることが判明した。",
    "answer": {
      "debit": [
        {
          "account": "支払利息",
          "amount": 25000
        }
      ],
      "credit": [
        {
          "account": "未払利息",
          "amount": 25000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生した利息を費用計上し、未払額を負債として認識します。\n【金額確認】借方合計・貸方合計はいずれも25,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "未払費用"
  },
  "J093": {
    "id": "J093",
    "type": "journal",
    "category": "前受収益",
    "difficulty": 2,
    "chapter": 9,
    "scene": "復習編・水野先輩の確認",
    "story": "経過勘定の復習。支払日・受取日ではなく、当期に属する収益・費用かどうかを基準に判断する。",
    "question": "当期中に家賃90,000円を受け取り、全額を「受取家賃」として処理していた。決算整理により、このうち次期分40,000円を繰り延べる。",
    "answer": {
      "debit": [
        {
          "account": "受取家賃",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "前受家賃",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受取時に全額を「受取家賃」として収益処理しているため、次期分40,000円を当期収益から除き、「前受家賃」（負債）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "前受収益"
  },
  "J094": {
    "id": "J094",
    "type": "journal",
    "category": "未収収益",
    "difficulty": 2,
    "chapter": 9,
    "scene": "復習編・水野先輩の確認",
    "story": "経過勘定の復習。支払日・受取日ではなく、当期に属する収益・費用かどうかを基準に判断する。",
    "question": "貸付金について、当期分の利息22,000円が決算日現在未収である。",
    "answer": {
      "debit": [
        {
          "account": "未収利息",
          "amount": 22000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 22000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生済みの収益を計上し、未回収額を資産として認識します。\n【金額確認】借方合計・貸方合計はいずれも22,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "未収収益"
  },
  "J095": {
    "id": "J095",
    "type": "journal",
    "category": "貸倒引当金",
    "difficulty": 2,
    "chapter": 10,
    "scene": "復習編・水野先輩の確認",
    "story": "決算整理の復習。計算式だけでなく、なぜ期末に調整するのかを説明できるか確認する。",
    "question": "決算日の売掛金残高810,000円に対し2％の貸倒れを見積もる。貸倒引当金の決算整理前残高は6,000円（貸方）である。差額補充法による。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金繰入",
          "amount": 10200
        }
      ],
      "credit": [
        {
          "account": "貸倒引当金",
          "amount": 10200
        }
      ]
    },
    "explanation": "【処理の根拠】\n必要額（売掛金×2％）から既存の貸方残高を差し引き、不足額だけ繰り入れます。\n【金額確認】借方合計・貸方合計はいずれも10,200円です。\n【試験のポイント】差額補充法では必要額全額を重ねて計上しません。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "貸倒引当金"
  },
  "J096": {
    "id": "J096",
    "type": "journal",
    "category": "貸倒れ",
    "difficulty": 2,
    "chapter": 10,
    "scene": "復習編・水野先輩の確認",
    "story": "決算整理の復習。計算式だけでなく、なぜ期末に調整するのかを説明できるか確認する。",
    "question": "前期に発生した売掛金40,000円が回収不能となった。貸倒引当金残高は十分にある。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n前期発生債権の貸倒れは、設定済みの貸倒引当金を取り崩します。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "貸倒れ"
  },
  "J097": {
    "id": "J097",
    "type": "journal",
    "category": "減価償却",
    "difficulty": 2,
    "chapter": 10,
    "scene": "復習編・水野先輩の確認",
    "story": "決算整理の復習。計算式だけでなく、なぜ期末に調整するのかを説明できるか確認する。",
    "question": "備品（取得原価610,000円、残存価額ゼロ、耐用年数5年）を期首から使用している。定額法・間接法で決算整理を行う。",
    "answer": {
      "debit": [
        {
          "account": "減価償却費",
          "amount": 122000
        }
      ],
      "credit": [
        {
          "account": "減価償却累計額",
          "amount": 122000
        }
      ]
    },
    "explanation": "【処理の根拠】\n取得原価を耐用年数で割った1年分を減価償却費とし、間接法なので累計額を貸方計上します。\n【金額確認】借方合計・貸方合計はいずれも122,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "減価償却"
  },
  "J098": {
    "id": "J098",
    "type": "journal",
    "category": "売上原価",
    "difficulty": 2,
    "chapter": 10,
    "scene": "復習編・水野先輩の確認",
    "story": "決算整理の復習。計算式だけでなく、なぜ期末に調整するのかを説明できるか確認する。",
    "question": "期首商品棚卸高190,000円、期末商品棚卸高240,000円である。仕入勘定で売上原価を算定するため、期首商品と期末商品について必要な決算整理仕訳をまとめて入力しなさい。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 190000
        },
        {
          "account": "繰越商品",
          "amount": 240000
        }
      ],
      "credit": [
        {
          "account": "繰越商品",
          "amount": 190000
        },
        {
          "account": "仕入",
          "amount": 240000
        }
      ]
    },
    "explanation": "【処理の根拠】\n期首商品190,000円は「仕入」へ振り替え、期末商品240,000円は次期へ繰り越す資産として「繰越商品」に戻します。\n【仕訳の確認】借方は「仕入」190,000円と「繰越商品」240,000円、貸方は「繰越商品」190,000円と「仕入」240,000円です。\n【試験のポイント】いわゆる「し・くり・くり・し」の2本を、意味とセットで確認します。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "売上原価"
  },
  "J099": {
    "id": "J099",
    "type": "journal",
    "category": "消費税",
    "difficulty": 2,
    "chapter": 11,
    "scene": "復習編・水野先輩の確認",
    "story": "消費税の決算処理を復習し、仮払・仮受の相殺と未払額の意味を確認する。",
    "question": "決算日に、仮払消費税95,000円と仮受消費税142,000円を相殺し、未払額を計上する。税抜方式による。",
    "answer": {
      "debit": [
        {
          "account": "仮受消費税",
          "amount": 142000
        }
      ],
      "credit": [
        {
          "account": "仮払消費税",
          "amount": 95000
        },
        {
          "account": "未払消費税",
          "amount": 47000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮受消費税から仮払消費税を差し引いた47,000円が納付予定額です。\n【金額確認】借方合計・貸方合計はいずれも142,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "消費税"
  },
  "J100": {
    "id": "J100",
    "type": "journal",
    "category": "当期純利益",
    "difficulty": 2,
    "chapter": 12,
    "scene": "復習編・水野先輩の確認",
    "story": "決算振替の復習。利益がどのように純資産へつながるかを確認する。",
    "question": "決算振替後、損益勘定の貸方残高が430,000円となった。当期純利益を繰越利益剰余金へ振り替える。",
    "answer": {
      "debit": [
        {
          "account": "損益",
          "amount": 430000
        }
      ],
      "credit": [
        {
          "account": "繰越利益剰余金",
          "amount": 430000
        }
      ]
    },
    "explanation": "【処理の根拠】\n収益が費用を上回った貸方残高は当期純利益です。損益を借方で閉鎖し、純資産へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも430,000円です。",
    "learningRole": "review",
    "timelineRole": "review",
    "variantGroup": "当期純利益"
  },
  "J101": {
    "id": "J101",
    "type": "journal",
    "category": "資本金・追加出資",
    "difficulty": 2,
    "chapter": 1,
    "scene": "応用編・実務判断",
    "story": "応用ケース。別の取引条件でも、勘定科目の属性から仕訳を組み立てられるかを確認する。",
    "question": "新しい物流拠点への投資資金として、株主から現金3,020,000円の追加払込みを受けた。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 3020000
        }
      ],
      "credit": [
        {
          "account": "資本金",
          "amount": 3020000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受け取った現金は資産の増加、株主からの払込みは純資産である資本金の増加として処理します。\n【金額確認】借方合計・貸方合計はいずれも3,020,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "資本金・追加出資"
  },
  "J102": {
    "id": "J102",
    "type": "journal",
    "category": "現金・預金",
    "difficulty": 2,
    "chapter": 1,
    "scene": "応用編・実務判断",
    "story": "応用ケース。別の取引条件でも、勘定科目の属性から仕訳を組み立てられるかを確認する。",
    "question": "レジ保管額を減らすため、手許現金200,000円を普通預金口座へ預け入れた。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 200000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 200000
        }
      ]
    },
    "explanation": "【処理の根拠】\n普通預金が増え、同額だけ手許現金が減る、資産内部の振替です。\n【金額確認】借方合計・貸方合計はいずれも200,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "現金・預金"
  },
  "J103": {
    "id": "J103",
    "type": "journal",
    "category": "当座預金",
    "difficulty": 2,
    "chapter": 1,
    "scene": "応用編・実務判断",
    "story": "応用ケース。別の取引条件でも、勘定科目の属性から仕訳を組み立てられるかを確認する。",
    "question": "仕入代金の決済口座として当座預金を開設し、普通預金から520,000円を振り替えた。",
    "answer": {
      "debit": [
        {
          "account": "当座預金",
          "amount": 520000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 520000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当座預金の増加を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも520,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "当座預金"
  },
  "J104": {
    "id": "J104",
    "type": "journal",
    "category": "掛仕入",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "繁忙期に備え、東雲物産から販売用商品260,000円を仕入れた。商品代金は翌月払いの掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 260000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 260000
        }
      ]
    },
    "explanation": "【処理の根拠】\n三分法では、商品の購入額を「仕入」（費用）として処理し、商品代金を後日支払う義務を「買掛金」として計上します。\n【金額確認】借方合計・貸方合計はいずれも260,000円です。\n【試験のポイント】営業用の商品に生じる債務なので未払金ではありません。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "掛仕入"
  },
  "J105": {
    "id": "J105",
    "type": "journal",
    "category": "掛売上",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "法人顧客である桜井商店へ商品380,000円を納品し、商品代金は翌月回収の掛けとした。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 380000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 380000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金を後日受け取る権利は売掛金、商品の販売による収益は売上です。\n【金額確認】借方合計・貸方合計はいずれも380,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "掛売上"
  },
  "J106": {
    "id": "J106",
    "type": "journal",
    "category": "仕入諸掛",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "東雲物産から販売用商品220,000円を掛けで仕入れた。当店負担の引取運賃6,000円は運送会社へ現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 226000
        }
      ],
      "credit": [
        {
          "account": "買掛金",
          "amount": 220000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金は掛け、引取運賃は現金払いですが、当店負担の仕入諸掛は商品の取得原価に含めるため、両者を「仕入」に集計します。\n【金額確認】借方合計・貸方合計はいずれも226,000円です。\n【試験のポイント】当店負担の仕入諸掛を独立した運賃科目にしない点に注意します。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "仕入諸掛"
  },
  "J107": {
    "id": "J107",
    "type": "journal",
    "category": "売上諸掛",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "桜井商店へ商品190,000円を掛けで販売した。納品に伴う当店負担の発送運賃5,000円は現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 190000
        },
        {
          "account": "発送費",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 190000
        },
        {
          "account": "現金",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品代金の掛販売と、当店負担の発送運賃の現金払いは別々の取引として考えます。当店が負担する発送運賃は「発送費」（費用）です。\n【金額確認】借方合計・貸方合計はいずれも195,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "売上諸掛"
  },
  "J108": {
    "id": "J108",
    "type": "journal",
    "category": "仕入返品",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "東雲物産から掛けで仕入れた商品の検品で仕様違いが見つかり、50,000円分を返品した。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "仕入",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け仕入れの取り消しに当たるため、買掛金と仕入をそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。\n【試験のポイント】返品時は当初の仕訳を逆にします。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "仕入返品"
  },
  "J109": {
    "id": "J109",
    "type": "journal",
    "category": "売上返品",
    "difficulty": 2,
    "chapter": 2,
    "scene": "応用編・実務判断",
    "story": "応用ケース。商品売買の条件を読み、商品代金・返品・諸掛りを一つずつ切り分ける。",
    "question": "桜井商店へ掛けで販売した商品の一部に不具合があり、44,000円分の返品を受けた。",
    "answer": {
      "debit": [
        {
          "account": "売上",
          "amount": 44000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 44000
        }
      ]
    },
    "explanation": "【処理の根拠】\n掛け売上げの取り消しに当たるため、売上を借方で、売掛金を貸方でそれぞれ減額します。\n【金額確認】借方合計・貸方合計はいずれも44,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "売上返品"
  },
  "J110": {
    "id": "J110",
    "type": "journal",
    "category": "売掛金回収",
    "difficulty": 2,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "桜井商店から、既存の売掛金300,000円が普通預金口座へ振り込まれた。新たな売上ではなく債権回収として処理する。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 300000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、代金回収による売掛金の減少を記録します。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "売掛金回収"
  },
  "J111": {
    "id": "J111",
    "type": "journal",
    "category": "買掛金支払",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "東雲物産に対する買掛金210,000円を、普通預金口座から振り込んで支払った。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 210000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 210000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払義務である買掛金の減少を借方、普通預金の減少を貸方に記録します。\n【金額確認】借方合計・貸方合計はいずれも210,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "買掛金支払"
  },
  "J112": {
    "id": "J112",
    "type": "journal",
    "category": "電子記録債務",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "東雲物産への買掛金170,000円について、双方の合意に基づき電子記録債務へ切り替える発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 170000
        }
      ],
      "credit": [
        {
          "account": "電子記録債務",
          "amount": 170000
        }
      ]
    },
    "explanation": "【処理の根拠】\n既存の買掛金を消滅させ、新たに電子記録債務を計上します。\n【金額確認】借方合計・貸方合計はいずれも170,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "電子記録債務"
  },
  "J113": {
    "id": "J113",
    "type": "journal",
    "category": "電子記録債権",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "桜井商店への売掛金230,000円について、双方の合意に基づき電子記録債権へ切り替える発生記録を行った。",
    "answer": {
      "debit": [
        {
          "account": "電子記録債権",
          "amount": 230000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 230000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売掛金を電子記録債権へ振り替える取引です。債権総額は変わりません。\n【金額確認】借方合計・貸方合計はいずれも230,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "電子記録債権"
  },
  "J114": {
    "id": "J114",
    "type": "journal",
    "category": "クレジット売掛金",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "店頭で商品145,000円をクレジットカード販売した。信販会社の手数料は販売額の2％で、販売時に計上する。",
    "answer": {
      "debit": [
        {
          "account": "クレジット売掛金",
          "amount": 142100
        },
        {
          "account": "支払手数料",
          "amount": 2900
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 145000
        }
      ]
    },
    "explanation": "【処理の根拠】\n売上は販売額の全額を計上します。信販会社への手数料は「支払手数料」（費用）、差引入金予定額は「クレジット売掛金」として処理します。\n【金額確認】借方合計・貸方合計はいずれも145,000円です。\n【試験のポイント】販売額×2％が手数料です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "クレジット売掛金"
  },
  "J115": {
    "id": "J115",
    "type": "journal",
    "category": "前払金",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "東雲物産へ新商品の仕入注文を出し、商品受領前の内金70,000円を現金で支払った。",
    "answer": {
      "debit": [
        {
          "account": "前払金",
          "amount": 70000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 70000
        }
      ]
    },
    "explanation": "【処理の根拠】\n商品を受け取る前の支払いであるため、仕入ではなく、後日商品を受け取る権利として「前払金」を計上します。\n【金額確認】借方合計・貸方合計はいずれも70,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "前払金"
  },
  "J116": {
    "id": "J116",
    "type": "journal",
    "category": "前受金",
    "difficulty": 3,
    "chapter": 3,
    "scene": "応用編・実務判断",
    "story": "応用ケース。複数の決済手段が登場しても、債権・債務の変化を追って判断する。",
    "question": "桜井商店から特注商品の注文を受け、引渡前の内金90,000円を現金で受け取った。",
    "answer": {
      "debit": [
        {
          "account": "現金",
          "amount": 90000
        }
      ],
      "credit": [
        {
          "account": "前受金",
          "amount": 90000
        }
      ]
    },
    "explanation": "【処理の根拠】\n引渡し前なので売上ではなく、商品を引き渡す義務である前受金を計上します。\n【金額確認】借方合計・貸方合計はいずれも90,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "前受金"
  },
  "J117": {
    "id": "J117",
    "type": "journal",
    "category": "現金過不足",
    "difficulty": 3,
    "chapter": 4,
    "scene": "応用編・実務判断",
    "story": "応用ケース。現金管理の証憑を読み、仮処理と確定処理を混同しない。",
    "question": "営業終了後の現金実査で、実際有高が帳簿残高より7,000円少なかった。原因はまだ判明していない。",
    "answer": {
      "debit": [
        {
          "account": "現金過不足",
          "amount": 7000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 7000
        }
      ]
    },
    "explanation": "【処理の根拠】\n実際の現金に帳簿を合わせ、不足額は原因判明まで現金過不足で仮処理します。\n【金額確認】借方合計・貸方合計はいずれも7,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "現金過不足"
  },
  "J118": {
    "id": "J118",
    "type": "journal",
    "category": "現金過不足判明",
    "difficulty": 3,
    "chapter": 4,
    "scene": "応用編・実務判断",
    "story": "応用ケース。現金管理の証憑を読み、仮処理と確定処理を混同しない。",
    "question": "借方で仮処理していた現金過不足のうち5,000円が、通信費の記帳漏れであると判明した。",
    "answer": {
      "debit": [
        {
          "account": "通信費",
          "amount": 5000
        }
      ],
      "credit": [
        {
          "account": "現金過不足",
          "amount": 5000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮に借方計上していた現金過不足を減らし、判明した費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも5,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "現金過不足判明"
  },
  "J119": {
    "id": "J119",
    "type": "journal",
    "category": "小口現金",
    "difficulty": 3,
    "chapter": 4,
    "scene": "応用編・実務判断",
    "story": "応用ケース。現金管理の証憑を読み、仮処理と確定処理を混同しない。",
    "question": "小口現金を定額資金前渡法で運用するため、当座預金口座の小切手60,000円を振り出し、小口現金係へ前渡しした。",
    "answer": {
      "debit": [
        {
          "account": "小口現金",
          "amount": 60000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 60000
        }
      ]
    },
    "explanation": "【処理の根拠】\n小口現金を増やし、自己振出小切手により当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも60,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "小口現金"
  },
  "J120": {
    "id": "J120",
    "type": "journal",
    "category": "小口現金精算",
    "difficulty": 3,
    "chapter": 4,
    "scene": "応用編・実務判断",
    "story": "応用ケース。現金管理の証憑を読み、仮処理と確定処理を混同しない。",
    "question": "小口現金係から交通費4,800円、通信費3,200円、消耗品費6,000円の月末報告を受けた。直ちに支出合計14,000円の小切手を振り出して補給した。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 4800
        },
        {
          "account": "通信費",
          "amount": 3200
        },
        {
          "account": "消耗品費",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "当座預金",
          "amount": 14000
        }
      ]
    },
    "explanation": "【処理の根拠】\nインプレスト・システムで補給時に報告された費用を計上し、支出合計額だけ当座預金を減らします。\n【金額確認】借方合計・貸方合計はいずれも14,000円です。\n【試験のポイント】4,800＋3,200＋6,000＝14,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "小口現金精算"
  },
  "J121": {
    "id": "J121",
    "type": "journal",
    "category": "固定資産購入",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "管理部で長期使用する業務用複合機300,000円を購入し、代金は翌月払いとした。",
    "answer": {
      "debit": [
        {
          "account": "備品",
          "amount": 300000
        }
      ],
      "credit": [
        {
          "account": "未払金",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n長期使用するパソコンは備品、商品以外の購入による後払い義務は未払金です。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "固定資産購入"
  },
  "J122": {
    "id": "J122",
    "type": "journal",
    "category": "固定資産売却",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "取得原価300,000円、減価償却累計額180,000円の古い備品を110,000円で売却し、代金は普通預金へ入金された。間接法による。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 110000
        },
        {
          "account": "減価償却累計額",
          "amount": 180000
        },
        {
          "account": "固定資産売却損",
          "amount": 10000
        }
      ],
      "credit": [
        {
          "account": "備品",
          "amount": 300000
        }
      ]
    },
    "explanation": "【処理の根拠】\n帳簿価額120,000円と売却額との差額を固定資産売却損とします。取得原価と累計額も取り崩します。\n【金額確認】借方合計・貸方合計はいずれも300,000円です。\n【試験のポイント】帳簿価額＝300,000－180,000です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "固定資産売却"
  },
  "J123": {
    "id": "J123",
    "type": "journal",
    "category": "仮払金",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "高橋の地方出張に先立ち、旅費の概算額80,000円を現金で前渡しした。実際額は帰社後に精算する。",
    "answer": {
      "debit": [
        {
          "account": "仮払金",
          "amount": 80000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 80000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支出内容と確定額が未確定なので、一時的な資産である仮払金として処理します。\n【金額確認】借方合計・貸方合計はいずれも80,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "仮払金"
  },
  "J124": {
    "id": "J124",
    "type": "journal",
    "category": "仮払金精算",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "出張精算で旅費74,000円が確定し、高橋から未使用現金6,000円の返却を受けた。前渡しした仮払金は80,000円である。",
    "answer": {
      "debit": [
        {
          "account": "旅費交通費",
          "amount": 74000
        },
        {
          "account": "現金",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "仮払金",
          "amount": 80000
        }
      ]
    },
    "explanation": "【処理の根拠】\n確定した旅費を費用にし、返金分は現金の増加、前渡額全額は仮払金の減少とします。\n【金額確認】借方合計・貸方合計はいずれも80,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "仮払金精算"
  },
  "J125": {
    "id": "J125",
    "type": "journal",
    "category": "立替金",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "従業員本人が負担すべき団体生命保険料38,000円について、会社がいったん現金で立替払いした。",
    "answer": {
      "debit": [
        {
          "account": "立替金",
          "amount": 38000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 38000
        }
      ]
    },
    "explanation": "【処理の根拠】\n会社の費用ではなく従業員への債権が生じるため、立替金を計上します。\n【金額確認】借方合計・貸方合計はいずれも38,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "立替金"
  },
  "J126": {
    "id": "J126",
    "type": "journal",
    "category": "借入金",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "運転資金として銀行から1,020,000円を借り入れ、借入金全額が普通預金口座へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 1020000
        }
      ],
      "credit": [
        {
          "account": "借入金",
          "amount": 1020000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金という資産と、返済義務である借入金という負債が同額増加します。\n【金額確認】借方合計・貸方合計はいずれも1,020,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "借入金"
  },
  "J127": {
    "id": "J127",
    "type": "journal",
    "category": "借入金返済",
    "difficulty": 3,
    "chapter": 5,
    "scene": "応用編・実務判断",
    "story": "応用ケース。固定資産、仮払金、立替金、借入金を、支出の目的と回収・返済義務から見分ける。",
    "question": "借入金の元本220,000円と当期利息6,000円を、普通預金から同時に支払った。",
    "answer": {
      "debit": [
        {
          "account": "借入金",
          "amount": 220000
        },
        {
          "account": "支払利息",
          "amount": 6000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 226000
        }
      ]
    },
    "explanation": "【処理の根拠】\n元本返済は借入金の減少、利息は当期の費用です。両者を合計した額だけ預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも226,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "借入金返済"
  },
  "J128": {
    "id": "J128",
    "type": "journal",
    "category": "給与",
    "difficulty": 3,
    "chapter": 6,
    "scene": "応用編・実務判断",
    "story": "応用ケース。給与・税金を、費用・預り金・納付の三つの視点から整理する。",
    "question": "給与総額440,000円から所得税20,000円と社会保険料50,000円を預かり、差引支給額370,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "給料",
          "amount": 440000
        }
      ],
      "credit": [
        {
          "account": "所得税預り金",
          "amount": 20000
        },
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "普通預金",
          "amount": 370000
        }
      ]
    },
    "explanation": "【処理の根拠】\n給与総額を費用とし、控除額は会社の預り金、差額は実際の支払額として処理します。\n【金額確認】借方合計・貸方合計はいずれも440,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "給与"
  },
  "J129": {
    "id": "J129",
    "type": "journal",
    "category": "預り金納付",
    "difficulty": 3,
    "chapter": 6,
    "scene": "応用編・実務判断",
    "story": "応用ケース。給与・税金を、費用・預り金・納付の三つの視点から整理する。",
    "question": "給与支給時に従業員から預かっていた所得税40,000円を、普通預金から税務署へ納付した。",
    "answer": {
      "debit": [
        {
          "account": "所得税預り金",
          "amount": 40000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 40000
        }
      ]
    },
    "explanation": "【処理の根拠】\n納付により預り金という負債が消滅し、普通預金が減少します。\n【金額確認】借方合計・貸方合計はいずれも40,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "預り金納付"
  },
  "J130": {
    "id": "J130",
    "type": "journal",
    "category": "法定福利費",
    "difficulty": 3,
    "chapter": 6,
    "scene": "応用編・実務判断",
    "story": "応用ケース。給与・税金を、費用・預り金・納付の三つの視点から整理する。",
    "question": "社会保険料について、従業員からの預り分50,000円と会社負担分50,000円を合わせた100,000円を普通預金から納付した。",
    "answer": {
      "debit": [
        {
          "account": "社会保険料預り金",
          "amount": 50000
        },
        {
          "account": "法定福利費",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 100000
        }
      ]
    },
    "explanation": "【処理の根拠】\n従業員分は預り金の消滅、会社負担分は法定福利費です。支払総額は両者の合計です。\n【金額確認】借方合計・貸方合計はいずれも100,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "法定福利費"
  },
  "J131": {
    "id": "J131",
    "type": "journal",
    "category": "租税公課",
    "difficulty": 3,
    "chapter": 6,
    "scene": "応用編・実務判断",
    "story": "応用ケース。給与・税金を、費用・預り金・納付の三つの視点から整理する。",
    "question": "事業用店舗に係る固定資産税68,000円を納付書により現金で納付した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 68000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 68000
        }
      ]
    },
    "explanation": "【処理の根拠】\n事業に係る固定資産税は租税公課として費用計上し、現金を減らします。\n【金額確認】借方合計・貸方合計はいずれも68,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "租税公課"
  },
  "J132": {
    "id": "J132",
    "type": "journal",
    "category": "収入印紙",
    "difficulty": 3,
    "chapter": 6,
    "scene": "応用編・実務判断",
    "story": "応用ケース。給与・税金を、費用・預り金・納付の三つの視点から整理する。",
    "question": "取引基本契約書に貼付する収入印紙30,000円を現金で購入し、その場で使用した。",
    "answer": {
      "debit": [
        {
          "account": "租税公課",
          "amount": 30000
        }
      ],
      "credit": [
        {
          "account": "現金",
          "amount": 30000
        }
      ]
    },
    "explanation": "【処理の根拠】\n使用した収入印紙は租税公課として処理します。\n【金額確認】借方合計・貸方合計はいずれも30,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "収入印紙"
  },
  "J133": {
    "id": "J133",
    "type": "journal",
    "category": "貸付金",
    "difficulty": 3,
    "chapter": 7,
    "scene": "応用編・実務判断",
    "story": "応用ケース。日常取引に加えて法人税等も扱い、勘定科目の性質から判断する。",
    "question": "取引先の短期資金需要に応じて320,000円を貸し付け、普通預金口座から送金した。",
    "answer": {
      "debit": [
        {
          "account": "貸付金",
          "amount": 320000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 320000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返済を受ける権利は貸付金という資産です。送金により普通預金が減ります。\n【金額確認】借方合計・貸方合計はいずれも320,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "貸付金"
  },
  "J134": {
    "id": "J134",
    "type": "journal",
    "category": "利息受取",
    "difficulty": 3,
    "chapter": 7,
    "scene": "応用編・実務判断",
    "story": "応用ケース。日常取引に加えて法人税等も扱い、勘定科目の性質から判断する。",
    "question": "取引先への貸付金について、利息29,000円が普通預金口座へ入金された。",
    "answer": {
      "debit": [
        {
          "account": "普通預金",
          "amount": 29000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 29000
        }
      ]
    },
    "explanation": "【処理の根拠】\n預金の増加と、貸付けによる収益である受取利息を計上します。\n【金額確認】借方合計・貸方合計はいずれも29,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "利息受取"
  },
  "J135": {
    "id": "J135",
    "type": "journal",
    "category": "法人税等",
    "difficulty": 3,
    "chapter": 7,
    "scene": "応用編・実務判断",
    "story": "応用ケース。日常取引に加えて法人税等も扱い、勘定科目の性質から判断する。",
    "question": "決算により、法人税、住民税及び事業税120,000円を当期負担額として計上した。中間納付はない。",
    "answer": {
      "debit": [
        {
          "account": "法人税、住民税及び事業税",
          "amount": 120000
        }
      ],
      "credit": [
        {
          "account": "未払法人税等",
          "amount": 120000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期負担の法人税等を費用として計上し、未納額を未払法人税等とします。\n【金額確認】借方合計・貸方合計はいずれも120,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "法人税等"
  },
  "J136": {
    "id": "J136",
    "type": "journal",
    "category": "受取商品券",
    "difficulty": 3,
    "chapter": 7,
    "scene": "応用編・実務判断",
    "story": "応用ケース。日常取引に加えて法人税等も扱い、勘定科目の性質から判断する。",
    "question": "商品100,000円を販売し、代金として換金可能な他店発行の商品券を受け取った。",
    "answer": {
      "debit": [
        {
          "account": "受取商品券",
          "amount": 100000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 100000
        }
      ]
    },
    "explanation": "【処理の根拠】\n換金または決済に使える他店発行券は受取商品券という資産です。\n【金額確認】借方合計・貸方合計はいずれも100,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "受取商品券"
  },
  "J137": {
    "id": "J137",
    "type": "journal",
    "category": "差入保証金",
    "difficulty": 3,
    "chapter": 7,
    "scene": "応用編・実務判断",
    "story": "応用ケース。日常取引に加えて法人税等も扱い、勘定科目の性質から判断する。",
    "question": "新倉庫の賃貸借契約に伴い、契約終了時に返還される敷金220,000円を普通預金から支払った。",
    "answer": {
      "debit": [
        {
          "account": "差入保証金",
          "amount": 220000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 220000
        }
      ]
    },
    "explanation": "【処理の根拠】\n返還予定の敷金は費用ではなく、差入保証金という資産です。\n【金額確認】借方合計・貸方合計はいずれも220,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "差入保証金"
  },
  "J138": {
    "id": "J138",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "応用編・実務判断",
    "story": "応用ケース。訂正仕訳では、正しい部分を残して誤りだけを反転・追加する。",
    "question": "消耗品費32,000円の現金支払いを、誤って通信費として記帳していた。現金の記帳は正しいものとして訂正しなさい。",
    "answer": {
      "debit": [
        {
          "account": "消耗品費",
          "amount": 32000
        }
      ],
      "credit": [
        {
          "account": "通信費",
          "amount": 32000
        }
      ]
    },
    "explanation": "【処理の根拠】\n現金の減少は既に正しいため触れず、誤った費用から正しい費用へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも32,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "訂正仕訳"
  },
  "J139": {
    "id": "J139",
    "type": "journal",
    "category": "訂正仕訳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "応用編・実務判断",
    "story": "応用ケース。訂正仕訳では、正しい部分を残して誤りだけを反転・追加する。",
    "question": "買掛金95,000円を普通預金から支払ったが、借方・貸方とも77,000円と記帳していた。不足額だけを訂正しなさい。",
    "answer": {
      "debit": [
        {
          "account": "買掛金",
          "amount": 18000
        }
      ],
      "credit": [
        {
          "account": "普通預金",
          "amount": 18000
        }
      ]
    },
    "explanation": "【処理の根拠】\n科目と方向は正しく、記帳額だけが18,000円不足しているため差額を追加します。\n【金額確認】借方合計・貸方合計はいずれも18,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "訂正仕訳"
  },
  "J140": {
    "id": "J140",
    "type": "journal",
    "category": "未記帳取引",
    "difficulty": 3,
    "chapter": 8,
    "scene": "応用編・実務判断",
    "story": "応用ケース。訂正仕訳では、正しい部分を残して誤りだけを反転・追加する。",
    "question": "決算点検で、決算日前に発送して得意先の受領も完了していた商品160,000円の掛売上が未記帳と判明した。必要な仕訳を行いなさい。",
    "answer": {
      "debit": [
        {
          "account": "売掛金",
          "amount": 160000
        }
      ],
      "credit": [
        {
          "account": "売上",
          "amount": 160000
        }
      ]
    },
    "explanation": "【処理の根拠】\n引渡しが完了した当期の売上なので、未記帳の掛売上を追加します。\n【金額確認】借方合計・貸方合計はいずれも160,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "未記帳取引"
  },
  "J141": {
    "id": "J141",
    "type": "journal",
    "category": "前払費用",
    "difficulty": 3,
    "chapter": 9,
    "scene": "応用編・実務判断",
    "story": "応用ケース。経過勘定を、現金の動きではなく発生期間から判断する。",
    "question": "保険料120,000円を支払時に全額費用処理していた。決算整理で次期分50,000円を前払保険料へ振り替える。",
    "answer": {
      "debit": [
        {
          "account": "前払保険料",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "保険料",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n支払時に全額を「保険料」として費用処理しているため、次期分50,000円を当期費用から除き、「前払保険料」（資産）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "前払費用"
  },
  "J142": {
    "id": "J142",
    "type": "journal",
    "category": "未払費用",
    "difficulty": 3,
    "chapter": 9,
    "scene": "応用編・実務判断",
    "story": "応用ケース。経過勘定を、現金の動きではなく発生期間から判断する。",
    "question": "決算日に、当期に発生している借入金利息35,000円がまだ支払われていない。未払計上しなさい。",
    "answer": {
      "debit": [
        {
          "account": "支払利息",
          "amount": 35000
        }
      ],
      "credit": [
        {
          "account": "未払利息",
          "amount": 35000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生した利息を費用計上し、未払額を負債として認識します。\n【金額確認】借方合計・貸方合計はいずれも35,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "未払費用"
  },
  "J143": {
    "id": "J143",
    "type": "journal",
    "category": "前受収益",
    "difficulty": 3,
    "chapter": 9,
    "scene": "応用編・実務判断",
    "story": "応用ケース。経過勘定を、現金の動きではなく発生期間から判断する。",
    "question": "家賃90,000円を受取時に全額収益処理していた。決算整理で次期分50,000円を前受家賃へ振り替える。",
    "answer": {
      "debit": [
        {
          "account": "受取家賃",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "前受家賃",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n受取時に全額を「受取家賃」として収益処理しているため、次期分50,000円を当期収益から除き、「前受家賃」（負債）へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "前受収益"
  },
  "J144": {
    "id": "J144",
    "type": "journal",
    "category": "未収収益",
    "difficulty": 3,
    "chapter": 9,
    "scene": "応用編・実務判断",
    "story": "応用ケース。経過勘定を、現金の動きではなく発生期間から判断する。",
    "question": "貸付金利息のうち、当期に発生済みで未収となっている32,000円を決算で計上する。",
    "answer": {
      "debit": [
        {
          "account": "未収利息",
          "amount": 32000
        }
      ],
      "credit": [
        {
          "account": "受取利息",
          "amount": 32000
        }
      ]
    },
    "explanation": "【処理の根拠】\n当期に発生済みの収益を計上し、未回収額を資産として認識します。\n【金額確認】借方合計・貸方合計はいずれも32,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "未収収益"
  },
  "J145": {
    "id": "J145",
    "type": "journal",
    "category": "貸倒引当金",
    "difficulty": 3,
    "chapter": 10,
    "scene": "応用編・実務判断",
    "story": "応用ケース。決算整理事項を複数の根拠から読み取り、期末残高へつなげる。",
    "question": "決算日の売掛金残高820,000円に対し2％の貸倒れを見積もる。貸倒引当金の決算整理前貸方残高は6,000円である。差額補充法で必要額を計上しなさい。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金繰入",
          "amount": 10400
        }
      ],
      "credit": [
        {
          "account": "貸倒引当金",
          "amount": 10400
        }
      ]
    },
    "explanation": "【処理の根拠】\n必要額（売掛金×2％）から既存の貸方残高を差し引き、不足額だけ繰り入れます。\n【金額確認】借方合計・貸方合計はいずれも10,400円です。\n【試験のポイント】差額補充法では必要額全額を重ねて計上しません。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "貸倒引当金"
  },
  "J146": {
    "id": "J146",
    "type": "journal",
    "category": "貸倒れ",
    "difficulty": 3,
    "chapter": 10,
    "scene": "応用編・実務判断",
    "story": "応用ケース。決算整理事項を複数の根拠から読み取り、期末残高へつなげる。",
    "question": "前期に発生した売掛金50,000円が回収不能となった。貸倒引当金残高はこの金額以上ある。",
    "answer": {
      "debit": [
        {
          "account": "貸倒引当金",
          "amount": 50000
        }
      ],
      "credit": [
        {
          "account": "売掛金",
          "amount": 50000
        }
      ]
    },
    "explanation": "【処理の根拠】\n前期発生債権の貸倒れは、設定済みの貸倒引当金を取り崩します。\n【金額確認】借方合計・貸方合計はいずれも50,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "貸倒れ"
  },
  "J147": {
    "id": "J147",
    "type": "journal",
    "category": "減価償却",
    "difficulty": 3,
    "chapter": 10,
    "scene": "応用編・実務判断",
    "story": "応用ケース。決算整理事項を複数の根拠から読み取り、期末残高へつなげる。",
    "question": "期首から使用している備品（取得原価620,000円、残存価額ゼロ、耐用年数5年）について、定額法・間接法で1年分の減価償却を計上する。",
    "answer": {
      "debit": [
        {
          "account": "減価償却費",
          "amount": 124000
        }
      ],
      "credit": [
        {
          "account": "減価償却累計額",
          "amount": 124000
        }
      ]
    },
    "explanation": "【処理の根拠】\n取得原価を耐用年数で割った1年分を減価償却費とし、間接法なので累計額を貸方計上します。\n【金額確認】借方合計・貸方合計はいずれも124,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "減価償却"
  },
  "J148": {
    "id": "J148",
    "type": "journal",
    "category": "売上原価",
    "difficulty": 3,
    "chapter": 10,
    "scene": "応用編・実務判断",
    "story": "応用ケース。決算整理事項を複数の根拠から読み取り、期末残高へつなげる。",
    "question": "期首商品棚卸高200,000円、期末商品棚卸高250,000円である。仕入勘定で売上原価を算定するため、期首商品と期末商品について必要な決算整理仕訳をまとめて入力しなさい。",
    "answer": {
      "debit": [
        {
          "account": "仕入",
          "amount": 200000
        },
        {
          "account": "繰越商品",
          "amount": 250000
        }
      ],
      "credit": [
        {
          "account": "繰越商品",
          "amount": 200000
        },
        {
          "account": "仕入",
          "amount": 250000
        }
      ]
    },
    "explanation": "【処理の根拠】\n期首商品200,000円は「仕入」へ振り替え、期末商品250,000円は次期へ繰り越す資産として「繰越商品」に戻します。\n【仕訳の確認】借方は「仕入」200,000円と「繰越商品」250,000円、貸方は「繰越商品」200,000円と「仕入」250,000円です。\n【試験のポイント】いわゆる「し・くり・くり・し」の2本を、意味とセットで確認します。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "売上原価"
  },
  "J149": {
    "id": "J149",
    "type": "journal",
    "category": "消費税",
    "difficulty": 3,
    "chapter": 11,
    "scene": "応用編・実務判断",
    "story": "応用ケース。消費税の仮勘定を相殺し、決算時点の納付義務を判断する。",
    "question": "税抜方式の決算で、仮受消費税152,000円と仮払消費税105,000円を相殺し、差額47,000円を未払消費税として計上する。",
    "answer": {
      "debit": [
        {
          "account": "仮受消費税",
          "amount": 152000
        }
      ],
      "credit": [
        {
          "account": "仮払消費税",
          "amount": 105000
        },
        {
          "account": "未払消費税",
          "amount": 47000
        }
      ]
    },
    "explanation": "【処理の根拠】\n仮受消費税から仮払消費税を差し引いた47,000円が納付予定額です。\n【金額確認】借方合計・貸方合計はいずれも152,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "消費税"
  },
  "J150": {
    "id": "J150",
    "type": "journal",
    "category": "当期純利益",
    "difficulty": 3,
    "chapter": 12,
    "scene": "応用編・実務判断",
    "story": "応用ケース。損益勘定から純資産への振替を、決算の締めとして確認する。",
    "question": "決算振替後、損益勘定に当期純利益440,000円の貸方残高が残った。この利益を繰越利益剰余金へ振り替える。",
    "answer": {
      "debit": [
        {
          "account": "損益",
          "amount": 440000
        }
      ],
      "credit": [
        {
          "account": "繰越利益剰余金",
          "amount": 440000
        }
      ]
    },
    "explanation": "【処理の根拠】\n収益が費用を上回った貸方残高は当期純利益です。損益を借方で閉鎖し、純資産へ振り替えます。\n【金額確認】借方合計・貸方合計はいずれも440,000円です。",
    "learningRole": "transfer",
    "timelineRole": "timeless_case",
    "variantGroup": "当期純利益"
  },
  "L001": {
    "id": "L001",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "現金元帳の残高欄を完成させなさい。現金は資産なので、借方記入で増加し、貸方記入で減少します。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 305000,
          "credit": null,
          "balance": 305000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 53000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 26500,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 358000,
        "r3_balance": 331500
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に358,000円、331,500円です。",
    "learningRole": "drill",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L002": {
    "id": "L002",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "売掛金元帳の取引後残高を求めなさい。得意先への掛販売と回収を混同しないこと。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 310000,
          "credit": null,
          "balance": 310000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 56000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 66000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 366000,
        "r3_balance": 300000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は310,000＋56,000－66,000＝300,000円です。",
    "learningRole": "drill",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L003": {
    "id": "L003",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "仕入先別残高を照合する。掛仕入と支払を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 315000,
          "balance": 315000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 59000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 29500,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 374000,
        "r3_balance": 344500
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に374,000円、344,500円です。",
    "learningRole": "drill",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L004": {
    "id": "L004",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "商品有高帳を先入先出法で完成させなさい。払出単価、払出額、期末残高を順に求めること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 44,
          "unitPrice": 1200,
          "amount": 52800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 39,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 52800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は19個×1,200円＋20個×1,500円＝52,800円です。",
    "learningRole": "drill",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L005": {
    "id": "L005",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "固定資産台帳を更新する。取得原価・耐用年数・期首減価償却累計額から、当期償却額と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 425000,
          "life": 5,
          "openingAccumulated": 85000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 85000,
        "r1_closingBookValue": 255000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝85,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した255,000円です。",
    "learningRole": "drill",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L006": {
    "id": "L006",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "水野先輩と現金元帳を照合する。取引ごとの増減を反映し、連続する残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 330000,
          "credit": null,
          "balance": 330000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 68000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 34000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 398000,
        "r3_balance": 364000
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に398,000円、364,000円です。",
    "learningRole": "drill",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L007": {
    "id": "L007",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "得意先別の売掛金元帳を確認する。掛売上で増加、回収で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 335000,
          "credit": null,
          "balance": 335000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 71000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 81000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 406000,
        "r3_balance": 325000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は335,000＋71,000－81,000＝325,000円です。",
    "learningRole": "drill",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L008": {
    "id": "L008",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "買掛金元帳の取引後残高を求めなさい。負債は貸方で増え、借方で減る点に注意すること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 340000,
          "balance": 340000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 74000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 37000,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 414000,
        "r3_balance": 377000
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に414,000円、377,000円です。",
    "learningRole": "drill",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L009": {
    "id": "L009",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "商品有高帳を確認する。数量だけでなく単価の層を追い、先入先出法による払出額と残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 49,
          "unitPrice": 1200,
          "amount": 58800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 44,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 58800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は24個×1,200円＋20個×1,500円＝58,800円です。",
    "learningRole": "drill",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L010": {
    "id": "L010",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "備品は残存価額ゼロ、定額法で償却している。1年分の減価償却費と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 450000,
          "life": 5,
          "openingAccumulated": 90000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 90000,
        "r1_closingBookValue": 270000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝90,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した270,000円です。",
    "learningRole": "drill",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L011": {
    "id": "L011",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "入出金を現金元帳へ転記した。各取引後の残高を計算し、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 355000,
          "credit": null,
          "balance": 355000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 83000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 41500,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 438000,
        "r3_balance": 396500
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に438,000円、396,500円です。",
    "learningRole": "drill",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L012": {
    "id": "L012",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "得意先別残高を照合する。売掛金の増減を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 360000,
          "credit": null,
          "balance": 360000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 86000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 96000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 446000,
        "r3_balance": 350000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は360,000＋86,000－96,000＝350,000円です。",
    "learningRole": "drill",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L013": {
    "id": "L013",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "仕入先別の買掛金元帳を確認する。掛仕入で増加、支払で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 365000,
          "balance": 365000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 89000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 44500,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 454000,
        "r3_balance": 409500
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に454,000円、409,500円です。",
    "learningRole": "drill",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L014": {
    "id": "L014",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "先入先出法では古い仕入単価から払い出します。表の払出額と残高を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 54,
          "unitPrice": 1200,
          "amount": 64800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 49,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 64800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は29個×1,200円＋20個×1,500円＝64,800円です。",
    "learningRole": "drill",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L015": {
    "id": "L015",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "定額法による固定資産台帳の更新を行う。1年分の償却額を計算し、累計額控除後の期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 475000,
          "life": 5,
          "openingAccumulated": 95000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 95000,
        "r1_closingBookValue": 285000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝95,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した285,000円です。",
    "learningRole": "drill",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L016": {
    "id": "L016",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "現金元帳の残高欄を完成させなさい。現金は資産なので、借方記入で増加し、貸方記入で減少します。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 380000,
          "credit": null,
          "balance": 380000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 98000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 49000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 478000,
        "r3_balance": 429000
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に478,000円、429,000円です。",
    "learningRole": "drill",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L017": {
    "id": "L017",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "売掛金元帳の取引後残高を求めなさい。得意先への掛販売と回収を混同しないこと。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 385000,
          "credit": null,
          "balance": 385000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 101000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 111000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 486000,
        "r3_balance": 375000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は385,000＋101,000－111,000＝375,000円です。",
    "learningRole": "drill",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L018": {
    "id": "L018",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "仕入先別残高を照合する。掛仕入と支払を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 390000,
          "balance": 390000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 104000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 52000,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 494000,
        "r3_balance": 442000
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に494,000円、442,000円です。",
    "learningRole": "drill",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L019": {
    "id": "L019",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "商品有高帳を先入先出法で完成させなさい。払出単価、払出額、期末残高を順に求めること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 59,
          "unitPrice": 1200,
          "amount": 70800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 54,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 70800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は34個×1,200円＋20個×1,500円＝70,800円です。",
    "learningRole": "drill",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L020": {
    "id": "L020",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 1,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月、元帳の残高を自分で追えるようになった。水野は「転記したら残高まで確認する」と繰り返す。",
    "question": "固定資産台帳を更新する。取得原価・耐用年数・期首減価償却累計額から、当期償却額と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 500000,
          "life": 5,
          "openingAccumulated": 100000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 100000,
        "r1_closingBookValue": 300000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝100,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した300,000円です。",
    "learningRole": "drill",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L021": {
    "id": "L021",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 2,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "水野先輩と現金元帳を照合する。取引ごとの増減を反映し、連続する残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 405000,
          "credit": null,
          "balance": 405000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 113000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 56500,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 518000,
        "r3_balance": 461500
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に518,000円、461,500円です。",
    "learningRole": "review",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L022": {
    "id": "L022",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 2,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "得意先別の売掛金元帳を確認する。掛売上で増加、回収で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 410000,
          "credit": null,
          "balance": 410000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 116000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 126000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 526000,
        "r3_balance": 400000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は410,000＋116,000－126,000＝400,000円です。",
    "learningRole": "review",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L023": {
    "id": "L023",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 2,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "買掛金元帳の取引後残高を求めなさい。負債は貸方で増え、借方で減る点に注意すること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 415000,
          "balance": 415000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 119000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 59500,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 534000,
        "r3_balance": 474500
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に534,000円、474,500円です。",
    "learningRole": "review",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L024": {
    "id": "L024",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 2,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "商品有高帳を確認する。数量だけでなく単価の層を追い、先入先出法による払出額と残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 64,
          "unitPrice": 1200,
          "amount": 76800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 59,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 76800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は39個×1,200円＋20個×1,500円＝76,800円です。",
    "learningRole": "review",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L025": {
    "id": "L025",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 2,
    "chapter": 7,
    "scene": "10月・帳簿の照合",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "備品は残存価額ゼロ、定額法で償却している。1年分の減価償却費と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 525000,
          "life": 5,
          "openingAccumulated": 105000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 105000,
        "r1_closingBookValue": 315000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝105,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した315,000円です。",
    "learningRole": "review",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L026": {
    "id": "L026",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "入出金を現金元帳へ転記した。各取引後の残高を計算し、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 430000,
          "credit": null,
          "balance": 430000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 128000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 64000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 558000,
        "r3_balance": 494000
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に558,000円、494,000円です。",
    "learningRole": "review",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L027": {
    "id": "L027",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "得意先別残高を照合する。売掛金の増減を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 435000,
          "credit": null,
          "balance": 435000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 131000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 141000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 566000,
        "r3_balance": 425000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は435,000＋131,000－141,000＝425,000円です。",
    "learningRole": "review",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L028": {
    "id": "L028",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "仕入先別の買掛金元帳を確認する。掛仕入で増加、支払で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 440000,
          "balance": 440000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 134000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 67000,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 574000,
        "r3_balance": 507000
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に574,000円、507,000円です。",
    "learningRole": "review",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L029": {
    "id": "L029",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "先入先出法では古い仕入単価から払い出します。表の払出額と残高を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 69,
          "unitPrice": 1200,
          "amount": 82800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 64,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 82800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は44個×1,200円＋20個×1,500円＝82,800円です。",
    "learningRole": "review",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L030": {
    "id": "L030",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "定額法による固定資産台帳の更新を行う。1年分の償却額を計算し、累計額控除後の期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 550000,
          "life": 5,
          "openingAccumulated": 110000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 110000,
        "r1_closingBookValue": 330000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝110,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した330,000円です。",
    "learningRole": "review",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L031": {
    "id": "L031",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "現金元帳の残高欄を完成させなさい。現金は資産なので、借方記入で増加し、貸方記入で減少します。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 455000,
          "credit": null,
          "balance": 455000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 143000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 71500,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 598000,
        "r3_balance": 526500
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に598,000円、526,500円です。",
    "learningRole": "review",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L032": {
    "id": "L032",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "売掛金元帳の取引後残高を求めなさい。得意先への掛販売と回収を混同しないこと。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 460000,
          "credit": null,
          "balance": 460000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 146000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 156000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 606000,
        "r3_balance": 450000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は460,000＋146,000－156,000＝450,000円です。",
    "learningRole": "review",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L033": {
    "id": "L033",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "仕入先別残高を照合する。掛仕入と支払を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 465000,
          "balance": 465000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 149000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 74500,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 614000,
        "r3_balance": 539500
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に614,000円、539,500円です。",
    "learningRole": "review",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L034": {
    "id": "L034",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "商品有高帳を先入先出法で完成させなさい。払出単価、払出額、期末残高を順に求めること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 74,
          "unitPrice": 1200,
          "amount": 88800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 69,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 88800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は49個×1,200円＋20個×1,500円＝88,800円です。",
    "learningRole": "review",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L035": {
    "id": "L035",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "固定資産台帳を更新する。取得原価・耐用年数・期首減価償却累計額から、当期償却額と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 575000,
          "life": 5,
          "openingAccumulated": 115000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 115000,
        "r1_closingBookValue": 345000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝115,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した345,000円です。",
    "learningRole": "review",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L036": {
    "id": "L036",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "水野先輩と現金元帳を照合する。取引ごとの増減を反映し、連続する残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 480000,
          "credit": null,
          "balance": 480000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 158000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 79000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 638000,
        "r3_balance": 559000
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に638,000円、559,000円です。",
    "learningRole": "review",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L037": {
    "id": "L037",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "得意先別の売掛金元帳を確認する。掛売上で増加、回収で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 485000,
          "credit": null,
          "balance": 485000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 161000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 171000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 646000,
        "r3_balance": 475000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は485,000＋161,000－171,000＝475,000円です。",
    "learningRole": "review",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L038": {
    "id": "L038",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "買掛金元帳の取引後残高を求めなさい。負債は貸方で増え、借方で減る点に注意すること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 490000,
          "balance": 490000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 164000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 82000,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 654000,
        "r3_balance": 572000
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に654,000円、572,000円です。",
    "learningRole": "review",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L039": {
    "id": "L039",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "商品有高帳を確認する。数量だけでなく単価の層を追い、先入先出法による払出額と残高を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 79,
          "unitPrice": 1200,
          "amount": 94800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 74,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 94800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は54個×1,200円＋20個×1,500円＝94,800円です。",
    "learningRole": "review",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L040": {
    "id": "L040",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "10月後半、補助簿と総勘定元帳の照合を任される。残高の変化を取引の原因までたどる練習を重ねる。",
    "question": "備品は残存価額ゼロ、定額法で償却している。1年分の減価償却費と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 600000,
          "life": 5,
          "openingAccumulated": 120000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 120000,
        "r1_closingBookValue": 360000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝120,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した360,000円です。",
    "learningRole": "review",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L041": {
    "id": "L041",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "入出金を現金元帳へ転記した。各取引後の残高を計算し、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 505000,
          "credit": null,
          "balance": 505000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 173000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 86500,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 678000,
        "r3_balance": 591500
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に678,000円、591,500円です。",
    "learningRole": "transfer",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L042": {
    "id": "L042",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "得意先別残高を照合する。売掛金の増減を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 510000,
          "credit": null,
          "balance": 510000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 176000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 186000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 686000,
        "r3_balance": 500000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は510,000＋176,000－186,000＝500,000円です。",
    "learningRole": "transfer",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L043": {
    "id": "L043",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "仕入先別の買掛金元帳を確認する。掛仕入で増加、支払で減少することを踏まえ、残高欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 515000,
          "balance": 515000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 179000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 89500,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 694000,
        "r3_balance": 604500
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に694,000円、604,500円です。",
    "learningRole": "transfer",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L044": {
    "id": "L044",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "先入先出法では古い仕入単価から払い出します。表の払出額と残高を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 84,
          "unitPrice": 1200,
          "amount": 100800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 79,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 100800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は59個×1,200円＋20個×1,500円＝100,800円です。",
    "learningRole": "transfer",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L045": {
    "id": "L045",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "定額法による固定資産台帳の更新を行う。1年分の償却額を計算し、累計額控除後の期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 625000,
          "life": 5,
          "openingAccumulated": 125000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 125000,
        "r1_closingBookValue": 375000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝125,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した375,000円です。",
    "learningRole": "transfer",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "L046": {
    "id": "L046",
    "type": "ledger",
    "category": "総勘定元帳（現金）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "現金元帳の残高欄を完成させなさい。現金は資産なので、借方記入で増加し、貸方記入で減少します。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 530000,
          "credit": null,
          "balance": 530000
        },
        {
          "date": "10月8日",
          "description": "売掛金回収",
          "debit": 188000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月15日",
          "description": "仕入代金支払",
          "debit": null,
          "credit": 94000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 718000,
        "r3_balance": 624000
      }
    },
    "explanation": "現金は資産なので、借方記入で増加し、貸方記入で減少します。したがって残高は順に718,000円、624,000円です。",
    "learningRole": "transfer",
    "variantGroup": "総勘定元帳（現金）",
    "timelineRole": "main"
  },
  "L047": {
    "id": "L047",
    "type": "ledger",
    "category": "売掛金元帳（みなと商店）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "売掛金元帳の取引後残高を求めなさい。得意先への掛販売と回収を混同しないこと。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": 535000,
          "credit": null,
          "balance": 535000
        },
        {
          "date": "10月10日",
          "description": "掛売上",
          "debit": 191000,
          "credit": null,
          "balance": "入力"
        },
        {
          "date": "10月25日",
          "description": "回収",
          "debit": null,
          "credit": 201000,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 726000,
        "r3_balance": 525000
      }
    },
    "explanation": "掛売上で売掛金が増え、回収で減ります。期末残高は535,000＋191,000－201,000＝525,000円です。",
    "learningRole": "transfer",
    "variantGroup": "売掛金元帳（みなと商店）",
    "timelineRole": "main"
  },
  "L048": {
    "id": "L048",
    "type": "ledger",
    "category": "買掛金元帳（若葉物産）",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "仕入先別残高を照合する。掛仕入と支払を反映し、各時点の残高を入力しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "debit",
        "credit",
        "balance"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "debit": null,
          "credit": 540000,
          "balance": 540000
        },
        {
          "date": "10月12日",
          "description": "掛仕入",
          "debit": null,
          "credit": 194000,
          "balance": "入力"
        },
        {
          "date": "10月28日",
          "description": "支払",
          "debit": 97000,
          "credit": null,
          "balance": "入力"
        }
      ],
      "inputCells": [
        "r2_balance",
        "r3_balance"
      ]
    },
    "answer": {
      "cells": {
        "r2_balance": 734000,
        "r3_balance": 637000
      }
    },
    "explanation": "買掛金は負債なので貸方で増え、借方で減ります。残高は順に734,000円、637,000円です。",
    "learningRole": "transfer",
    "variantGroup": "買掛金元帳（若葉物産）",
    "timelineRole": "main"
  },
  "L049": {
    "id": "L049",
    "type": "ledger",
    "category": "商品有高帳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "商品有高帳を先入先出法で完成させなさい。払出単価、払出額、期末残高を順に求めること。",
    "materials": [],
    "table": {
      "columns": [
        "date",
        "description",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "rows": [
        {
          "date": "10月1日",
          "description": "前月繰越",
          "quantity": 89,
          "unitPrice": 1200,
          "amount": 106800
        },
        {
          "date": "10月9日",
          "description": "仕入",
          "quantity": 20,
          "unitPrice": 1500,
          "amount": 30000
        },
        {
          "date": "10月20日",
          "description": "払出（先入先出法）",
          "quantity": 25,
          "unitPrice": "入力",
          "amount": "入力"
        },
        {
          "date": "10月31日",
          "description": "残高",
          "quantity": 84,
          "unitPrice": "内訳",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "r3_unitPrice",
        "r3_amount",
        "r4_amount"
      ]
    },
    "answer": {
      "cells": {
        "r3_unitPrice": 1200,
        "r3_amount": 30000,
        "r4_amount": 106800
      }
    },
    "explanation": "先入先出法では古い単価1,200円の商品から払い出します。払出額は25×1,200＝30,000円、残高は64個×1,200円＋20個×1,500円＝106,800円です。",
    "learningRole": "transfer",
    "variantGroup": "商品有高帳",
    "timelineRole": "main"
  },
  "L050": {
    "id": "L050",
    "type": "ledger",
    "category": "固定資産台帳",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの点検で元帳を再確認する。数字だけでなく、増減の理由を説明できることが求められる。",
    "question": "固定資産台帳を更新する。取得原価・耐用年数・期首減価償却累計額から、当期償却額と期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "asset",
        "acquisitionCost",
        "life",
        "openingAccumulated",
        "currentDepreciation",
        "closingBookValue"
      ],
      "rows": [
        {
          "asset": "備品A",
          "acquisitionCost": 650000,
          "life": 5,
          "openingAccumulated": 130000,
          "currentDepreciation": "入力",
          "closingBookValue": "入力"
        }
      ],
      "inputCells": [
        "r1_currentDepreciation",
        "r1_closingBookValue"
      ]
    },
    "answer": {
      "cells": {
        "r1_currentDepreciation": 130000,
        "r1_closingBookValue": 390000
      }
    },
    "explanation": "残存価額ゼロ・定額法の年額は取得原価÷5年＝130,000円です。期末帳簿価額は取得原価から前期までと当期の償却額を控除した390,000円です。",
    "learningRole": "transfer",
    "variantGroup": "固定資産台帳",
    "timelineRole": "main"
  },
  "T001": {
    "id": "T001",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 410000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 175000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 134000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 490000
        },
        {
          "account": "仕入",
          "debit": 289000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1024000,
        "total_credit": 1024000
      }
    },
    "explanation": "借方残高を合計すると1,024,000円、貸方残高も1,024,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T002": {
    "id": "T002",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 420000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 138000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 510000
        },
        {
          "account": "仕入",
          "debit": 298000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1048000,
        "total_credit": 1048000
      }
    },
    "explanation": "借方残高を合計すると1,048,000円、貸方残高も1,048,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T003": {
    "id": "T003",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 430000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 185000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 142000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 530000
        },
        {
          "account": "仕入",
          "debit": 307000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1072000,
        "total_credit": 1072000
      }
    },
    "explanation": "借方残高を合計すると1,072,000円、貸方残高も1,072,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T004": {
    "id": "T004",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 440000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 190000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 146000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 550000
        },
        {
          "account": "仕入",
          "debit": 316000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1096000,
        "total_credit": 1096000
      }
    },
    "explanation": "借方残高を合計すると1,096,000円、貸方残高も1,096,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T005": {
    "id": "T005",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 450000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 195000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 150000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 570000
        },
        {
          "account": "仕入",
          "debit": 325000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1120000,
        "total_credit": 1120000
      }
    },
    "explanation": "借方残高を合計すると1,120,000円、貸方残高も1,120,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T006": {
    "id": "T006",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 460000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 200000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 154000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 590000
        },
        {
          "account": "仕入",
          "debit": 334000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1144000,
        "total_credit": 1144000
      }
    },
    "explanation": "借方残高を合計すると1,144,000円、貸方残高も1,144,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T007": {
    "id": "T007",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 470000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 205000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 158000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 610000
        },
        {
          "account": "仕入",
          "debit": 343000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1168000,
        "total_credit": 1168000
      }
    },
    "explanation": "借方残高を合計すると1,168,000円、貸方残高も1,168,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T008": {
    "id": "T008",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 480000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 210000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 162000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 630000
        },
        {
          "account": "仕入",
          "debit": 352000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1192000,
        "total_credit": 1192000
      }
    },
    "explanation": "借方残高を合計すると1,192,000円、貸方残高も1,192,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T009": {
    "id": "T009",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 490000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 215000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 166000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 650000
        },
        {
          "account": "仕入",
          "debit": 361000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1216000,
        "total_credit": 1216000
      }
    },
    "explanation": "借方残高を合計すると1,216,000円、貸方残高も1,216,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T010": {
    "id": "T010",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の基本的な勘定残高を集計した。借方・貸方をそれぞれ縦に合計し、残高試算表の合計欄を完成させなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 500000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 220000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 60000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 170000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 400000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 670000
        },
        {
          "account": "仕入",
          "debit": 370000,
          "credit": null
        },
        {
          "account": "雑費",
          "debit": 90000,
          "credit": null
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1240000,
        "total_credit": 1240000
      }
    },
    "explanation": "借方残高を合計すると1,240,000円、貸方残高も1,240,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_1",
    "timelineRole": "main"
  },
  "T011": {
    "id": "T011",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 372000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 224000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 317000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 153000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 11000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 419000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1213000,
        "total_credit": 1213000
      }
    },
    "explanation": "借方残高を合計すると1,213,000円、貸方残高も1,213,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T012": {
    "id": "T012",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 384000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 228000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 324000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 156000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 12000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 438000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1236000,
        "total_credit": 1236000
      }
    },
    "explanation": "借方残高を合計すると1,236,000円、貸方残高も1,236,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T013": {
    "id": "T013",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 396000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 232000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 331000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 159000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 13000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 457000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1259000,
        "total_credit": 1259000
      }
    },
    "explanation": "借方残高を合計すると1,259,000円、貸方残高も1,259,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T014": {
    "id": "T014",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 408000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 236000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 338000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 162000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 14000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 476000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1282000,
        "total_credit": 1282000
      }
    },
    "explanation": "借方残高を合計すると1,282,000円、貸方残高も1,282,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T015": {
    "id": "T015",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 420000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 240000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 345000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 165000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 15000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 495000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1305000,
        "total_credit": 1305000
      }
    },
    "explanation": "借方残高を合計すると1,305,000円、貸方残高も1,305,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T016": {
    "id": "T016",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 432000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 244000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 352000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 168000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 16000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 514000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1328000,
        "total_credit": 1328000
      }
    },
    "explanation": "借方残高を合計すると1,328,000円、貸方残高も1,328,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T017": {
    "id": "T017",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 444000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 248000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 359000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 171000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 17000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 533000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1351000,
        "total_credit": 1351000
      }
    },
    "explanation": "借方残高を合計すると1,351,000円、貸方残高も1,351,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T018": {
    "id": "T018",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 456000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 252000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 366000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 174000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 18000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 552000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1374000,
        "total_credit": 1374000
      }
    },
    "explanation": "借方残高を合計すると1,374,000円、貸方残高も1,374,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T019": {
    "id": "T019",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 468000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 256000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 373000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 177000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 19000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 571000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1397000,
        "total_credit": 1397000
      }
    },
    "explanation": "借方残高を合計すると1,397,000円、貸方残高も1,397,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T020": {
    "id": "T020",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "月末の残高には預金・借入金・受取利息も含まれている。勘定の性質を確認しながら、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 480000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 260000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 180000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 380000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 120000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "借入金",
          "debit": null,
          "credit": 180000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 450000
        },
        {
          "account": "受取利息",
          "debit": null,
          "credit": 20000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 590000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1420000,
        "total_credit": 1420000
      }
    },
    "explanation": "借方残高を合計すると1,420,000円、貸方残高も1,420,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "drill",
    "variantGroup": "trial_balance_2",
    "timelineRole": "main"
  },
  "T021": {
    "id": "T021",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 509000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 306000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 428000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 184000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 10500
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 868500
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1623000,
        "total_credit": 1623000
      }
    },
    "explanation": "借方残高を合計すると1,623,000円、貸方残高も1,623,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T022": {
    "id": "T022",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 518000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 312000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 436000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 188000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 11000
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 887000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1646000,
        "total_credit": 1646000
      }
    },
    "explanation": "借方残高を合計すると1,646,000円、貸方残高も1,646,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T023": {
    "id": "T023",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 527000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 318000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 444000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 192000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 11500
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 905500
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1669000,
        "total_credit": 1669000
      }
    },
    "explanation": "借方残高を合計すると1,669,000円、貸方残高も1,669,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T024": {
    "id": "T024",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 536000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 324000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 452000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 196000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 12000
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 924000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1692000,
        "total_credit": 1692000
      }
    },
    "explanation": "借方残高を合計すると1,692,000円、貸方残高も1,692,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T025": {
    "id": "T025",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 545000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 330000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 460000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 200000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 12500
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 942500
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1715000,
        "total_credit": 1715000
      }
    },
    "explanation": "借方残高を合計すると1,715,000円、貸方残高も1,715,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T026": {
    "id": "T026",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 554000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 336000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 468000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 204000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 13000
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 961000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1738000,
        "total_credit": 1738000
      }
    },
    "explanation": "借方残高を合計すると1,738,000円、貸方残高も1,738,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T027": {
    "id": "T027",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 563000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 342000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 476000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 208000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 13500
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 979500
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1761000,
        "total_credit": 1761000
      }
    },
    "explanation": "借方残高を合計すると1,761,000円、貸方残高も1,761,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T028": {
    "id": "T028",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 572000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 348000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 484000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 212000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 14000
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 998000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1784000,
        "total_credit": 1784000
      }
    },
    "explanation": "借方残高を合計すると1,784,000円、貸方残高も1,784,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T029": {
    "id": "T029",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 581000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 354000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 492000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 216000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 14500
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 1016500
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1807000,
        "total_credit": 1807000
      }
    },
    "explanation": "借方残高を合計すると1,807,000円、貸方残高も1,807,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T030": {
    "id": "T030",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "決算整理前の残高には評価勘定も含まれている。貸倒引当金と減価償却累計額が貸方残高であることに注意し、試算表の合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "現金",
          "debit": 590000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 360000,
          "credit": null
        },
        {
          "account": "備品",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 500000,
          "credit": null
        },
        {
          "account": "支払家賃",
          "debit": 80000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 220000
        },
        {
          "account": "貸倒引当金",
          "debit": null,
          "credit": 15000
        },
        {
          "account": "備品減価償却累計額",
          "debit": null,
          "credit": 60000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 500000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 1035000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1830000,
        "total_credit": 1830000
      }
    },
    "explanation": "借方残高を合計すると1,830,000円、貸方残高も1,830,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_3",
    "timelineRole": "main"
  },
  "T031": {
    "id": "T031",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 531000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 265000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 31000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 437000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 193000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 21000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 780000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1554000,
        "total_credit": 1554000
      }
    },
    "explanation": "借方残高を合計すると1,554,000円、貸方残高も1,554,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T032": {
    "id": "T032",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 542000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 270000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 32000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 444000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 196000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 22000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 800000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1578000,
        "total_credit": 1578000
      }
    },
    "explanation": "借方残高を合計すると1,578,000円、貸方残高も1,578,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T033": {
    "id": "T033",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 553000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 275000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 33000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 451000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 199000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 23000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 820000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1602000,
        "total_credit": 1602000
      }
    },
    "explanation": "借方残高を合計すると1,602,000円、貸方残高も1,602,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T034": {
    "id": "T034",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 564000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 280000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 34000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 458000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 202000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 24000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 840000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1626000,
        "total_credit": 1626000
      }
    },
    "explanation": "借方残高を合計すると1,626,000円、貸方残高も1,626,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T035": {
    "id": "T035",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 575000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 285000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 35000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 465000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 205000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 25000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 860000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1650000,
        "total_credit": 1650000
      }
    },
    "explanation": "借方残高を合計すると1,650,000円、貸方残高も1,650,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T036": {
    "id": "T036",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 586000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 290000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 36000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 472000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 208000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 26000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 880000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1674000,
        "total_credit": 1674000
      }
    },
    "explanation": "借方残高を合計すると1,674,000円、貸方残高も1,674,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T037": {
    "id": "T037",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 597000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 295000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 37000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 479000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 211000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 27000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 900000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1698000,
        "total_credit": 1698000
      }
    },
    "explanation": "借方残高を合計すると1,698,000円、貸方残高も1,698,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T038": {
    "id": "T038",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 608000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 300000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 38000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 486000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 214000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 28000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 920000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1722000,
        "total_credit": 1722000
      }
    },
    "explanation": "借方残高を合計すると1,722,000円、貸方残高も1,722,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T039": {
    "id": "T039",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 619000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 305000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 39000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 493000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 217000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 29000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 940000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1746000,
        "total_credit": 1746000
      }
    },
    "explanation": "借方残高を合計すると1,746,000円、貸方残高も1,746,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "T040": {
    "id": "T040",
    "type": "trial_balance",
    "category": "残高試算表",
    "difficulty": 3,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの残高試算表を使って、勘定の性質と貸借一致の意味を確認する。",
    "question": "経過勘定を含む残高試算表を確認する。前払は資産、未払・前受は負債であることを踏まえ、借方合計と貸方合計を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "account",
        "debit",
        "credit"
      ],
      "rows": [
        {
          "account": "普通預金",
          "debit": 630000,
          "credit": null
        },
        {
          "account": "売掛金",
          "debit": 310000,
          "credit": null
        },
        {
          "account": "前払保険料",
          "debit": 40000,
          "credit": null
        },
        {
          "account": "繰越商品",
          "debit": 140000,
          "credit": null
        },
        {
          "account": "仕入",
          "debit": 500000,
          "credit": null
        },
        {
          "account": "給料",
          "debit": 150000,
          "credit": null
        },
        {
          "account": "買掛金",
          "debit": null,
          "credit": 220000
        },
        {
          "account": "未払給料",
          "debit": null,
          "credit": 30000
        },
        {
          "account": "前受家賃",
          "debit": null,
          "credit": 40000
        },
        {
          "account": "資本金",
          "debit": null,
          "credit": 520000
        },
        {
          "account": "売上",
          "debit": null,
          "credit": 960000
        },
        {
          "account": "合計",
          "debit": "入力",
          "credit": "入力"
        }
      ],
      "inputCells": [
        "total_debit",
        "total_credit"
      ]
    },
    "answer": {
      "cells": {
        "total_debit": 1770000,
        "total_credit": 1770000
      }
    },
    "explanation": "借方残高を合計すると1,770,000円、貸方残高も1,770,000円です。貸借一致は集計・転記の点検に有効ですが、取引の記帳漏れや同額の誤仕訳まで正しいことを保証するものではありません。",
    "learningRole": "transfer",
    "variantGroup": "trial_balance_4",
    "timelineRole": "main"
  },
  "E001": {
    "id": "E001",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）備品 22,500／（貸）現金 22,500",
        "evidence": "広告掲載料22,500円の領収書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "広告宣伝費",
        "debitAmount": 22500,
        "creditAccount": "備品",
        "creditAmount": 22500
      }
    },
    "explanation": "現金の減少は正しく記帳済みです。誤って資産計上した「備品」を取り消し、広告掲載料を「広告宣伝費」へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_01",
    "timelineRole": "main"
  },
  "E002": {
    "id": "E002",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）買掛金 20,000／（貸）普通預金 20,000",
        "evidence": "買掛金25,000円を普通預金から支払った振込記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "買掛金",
        "debitAmount": 5000,
        "creditAccount": "普通預金",
        "creditAmount": 5000
      }
    },
    "explanation": "科目と借貸は正しいものの5,000円不足しています。不足分だけを追加記帳します。",
    "learningRole": "transfer",
    "variantGroup": "correction_02",
    "timelineRole": "main"
  },
  "E003": {
    "id": "E003",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）通信費 18,000／（貸）現金 18,000",
        "evidence": "事務用品18,000円を現金購入した領収書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "消耗品費",
        "debitAmount": 18000,
        "creditAccount": "通信費",
        "creditAmount": 18000
      }
    },
    "explanation": "現金の減少は正しいため触れません。誤って計上した通信費を取り消し、消耗品費へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_03",
    "timelineRole": "main"
  },
  "E004": {
    "id": "E004",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）普通預金 80,000／（貸）売上 80,000",
        "evidence": "前月に計上済みの売掛金80,000円を回収した入金記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "売上",
        "debitAmount": 80000,
        "creditAccount": "売掛金",
        "creditAmount": 80000
      }
    },
    "explanation": "普通預金の増加は正しい一方、これは新たな売上ではなく売掛金の回収です。誤計上した売上を取り消し、売掛金を減額します。",
    "learningRole": "transfer",
    "variantGroup": "correction_04",
    "timelineRole": "main"
  },
  "E005": {
    "id": "E005",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）消耗品費 120,000／（貸）未払金 120,000",
        "evidence": "長期使用する業務用複合機120,000円の納品書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "備品",
        "debitAmount": 120000,
        "creditAccount": "消耗品費",
        "creditAmount": 120000
      }
    },
    "explanation": "未払金は正しく、借方科目だけが誤っています。長期使用する複合機は備品なので、消耗品費から備品へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_05",
    "timelineRole": "main"
  },
  "E006": {
    "id": "E006",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）買掛金 60,000／（貸）現金 60,000",
        "evidence": "買掛金60,000円を普通預金から振り込んだ銀行記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "現金",
        "debitAmount": 60000,
        "creditAccount": "普通預金",
        "creditAmount": 60000
      }
    },
    "explanation": "買掛金の減少は正しいためそのまま残します。支払手段だけが誤っているので、誤って減らした現金を戻し、普通預金を減額します。",
    "learningRole": "transfer",
    "variantGroup": "correction_06",
    "timelineRole": "main"
  },
  "E007": {
    "id": "E007",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）現金 90,000／（貸）売上 90,000",
        "evidence": "商品90,000円を掛けで販売した納品書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "売掛金",
        "debitAmount": 90000,
        "creditAccount": "現金",
        "creditAmount": 90000
      }
    },
    "explanation": "売上の計上は正しい一方、代金は現金受領ではなく掛けです。現金を取り消し、売掛金へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_07",
    "timelineRole": "main"
  },
  "E008": {
    "id": "E008",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）普通預金 12,000／（貸）売上 12,000",
        "evidence": "貸付金利息12,000円の入金通知"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "売上",
        "debitAmount": 12000,
        "creditAccount": "受取利息",
        "creditAmount": 12000
      }
    },
    "explanation": "普通預金の増加は正しいため触れず、収益科目を売上から受取利息へ訂正します。",
    "learningRole": "transfer",
    "variantGroup": "correction_08",
    "timelineRole": "main"
  },
  "E009": {
    "id": "E009",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）通信費 35,000／（貸）現金 35,000",
        "evidence": "通信費30,000円を現金で支払った領収書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "現金",
        "debitAmount": 5000,
        "creditAccount": "通信費",
        "creditAmount": 5000
      }
    },
    "explanation": "5,000円を過大に記帳しています。過大分について現金を戻し、通信費を減額します。",
    "learningRole": "transfer",
    "variantGroup": "correction_09",
    "timelineRole": "main"
  },
  "E010": {
    "id": "E010",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）買掛金 100,000／（貸）普通預金 100,000",
        "evidence": "借入金元本100,000円を普通預金から返済した銀行記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "借入金",
        "debitAmount": 100000,
        "creditAccount": "買掛金",
        "creditAmount": 100000
      }
    },
    "explanation": "普通預金の減少は正しいため触れません。減少させる負債を買掛金から借入金へ訂正します。",
    "learningRole": "transfer",
    "variantGroup": "correction_10",
    "timelineRole": "main"
  },
  "E011": {
    "id": "E011",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）支払家賃 24,000／（貸）普通預金 24,000",
        "evidence": "店舗の火災保険料24,000円の支払通知"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "保険料",
        "debitAmount": 24000,
        "creditAccount": "支払家賃",
        "creditAmount": 24000
      }
    },
    "explanation": "普通預金の減少は正しいため、費用科目だけを支払家賃から保険料へ訂正します。",
    "learningRole": "transfer",
    "variantGroup": "correction_11",
    "timelineRole": "main"
  },
  "E012": {
    "id": "E012",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）現金 50,000／（貸）売上 50,000",
        "evidence": "商品引渡前に得意先から受け取った内金50,000円"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "売上",
        "debitAmount": 50000,
        "creditAccount": "前受金",
        "creditAmount": 50000
      }
    },
    "explanation": "現金受領は正しいものの、商品引渡前なので売上ではありません。売上を取り消し、前受金へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_12",
    "timelineRole": "main"
  },
  "E013": {
    "id": "E013",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）仕入 70,000／（貸）普通預金 70,000",
        "evidence": "商品受領前に仕入先へ支払った内金70,000円"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "前払金",
        "debitAmount": 70000,
        "creditAccount": "仕入",
        "creditAmount": 70000
      }
    },
    "explanation": "普通預金の減少は正しいものの、商品未受領なので仕入ではありません。前払金へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_13",
    "timelineRole": "main"
  },
  "E014": {
    "id": "E014",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）旅費交通費 60,000／（貸）現金 60,000",
        "evidence": "未精算の出張旅費として従業員へ60,000円を概算前渡しした記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "仮払金",
        "debitAmount": 60000,
        "creditAccount": "旅費交通費",
        "creditAmount": 60000
      }
    },
    "explanation": "現金の減少は正しい一方、費用額はまだ確定していません。旅費交通費を取り消して仮払金へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_14",
    "timelineRole": "main"
  },
  "E015": {
    "id": "E015",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）保険料 18,000／（貸）現金 18,000",
        "evidence": "従業員負担の生命保険料18,000円を会社が立替払いした記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "立替金",
        "debitAmount": 18000,
        "creditAccount": "保険料",
        "creditAmount": 18000
      }
    },
    "explanation": "会社自身の費用ではなく従業員に対する回収債権です。保険料を取り消し、立替金へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_15",
    "timelineRole": "main"
  },
  "E016": {
    "id": "E016",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）消耗品費 10,000／（貸）現金 10,000",
        "evidence": "契約書へ直ちに貼付した収入印紙10,000円の領収書"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "租税公課",
        "debitAmount": 10000,
        "creditAccount": "消耗品費",
        "creditAmount": 10000
      }
    },
    "explanation": "現金の減少は正しいため、費用科目だけを消耗品費から租税公課へ訂正します。",
    "learningRole": "transfer",
    "variantGroup": "correction_16",
    "timelineRole": "main"
  },
  "E017": {
    "id": "E017",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）支払利息 3,000／（貸）普通預金 3,000",
        "evidence": "振込手数料3,000円の銀行明細"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "支払手数料",
        "debitAmount": 3000,
        "creditAccount": "支払利息",
        "creditAmount": 3000
      }
    },
    "explanation": "普通預金の減少は正しい一方、振込手数料は支払利息ではありません。支払手数料へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_17",
    "timelineRole": "main"
  },
  "E018": {
    "id": "E018",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）仕入 280,000／（貸）未払金 280,000",
        "evidence": "業務用パソコン280,000円の納品書。長期使用する目的で購入"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "備品",
        "debitAmount": 280000,
        "creditAccount": "仕入",
        "creditAmount": 280000
      }
    },
    "explanation": "未払金は正しい一方、営業用商品ではなく長期使用する固定資産です。仕入を取り消し、備品へ振り替えます。",
    "learningRole": "transfer",
    "variantGroup": "correction_18",
    "timelineRole": "main"
  },
  "E019": {
    "id": "E019",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）普通預金 40,000／（貸）売掛金 40,000",
        "evidence": "得意先から売掛金40,000円を現金で回収した受領記録"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "現金",
        "debitAmount": 40000,
        "creditAccount": "普通預金",
        "creditAmount": 40000
      }
    },
    "explanation": "売掛金の減少は正しいため触れません。受取手段を普通預金から現金へ訂正します。",
    "learningRole": "transfer",
    "variantGroup": "correction_19",
    "timelineRole": "main"
  },
  "E020": {
    "id": "E020",
    "type": "correction",
    "category": "記帳訂正",
    "difficulty": 2,
    "chapter": 8,
    "scene": "11月・残高の点検",
    "story": "11月、月次締めの照合で記帳ミスを発見した。水野は「全部をやり直すのではなく、正しい部分を残して差分だけ直す」と教える。",
    "question": "証憑と帳簿を照合したところ相違が見つかった。すでに正しく記帳されている部分は残し、必要な訂正仕訳だけを入力しなさい。",
    "materials": [
      {
        "recorded": "（借）給料 330,000／（貸）普通預金 330,000",
        "evidence": "控除なしの給与総額300,000円を普通預金から支払った給与資料"
      }
    ],
    "table": {
      "columns": [
        "item",
        "value"
      ],
      "rows": [
        {
          "item": "debitAccount",
          "value": "入力"
        },
        {
          "item": "debitAmount",
          "value": "入力"
        },
        {
          "item": "creditAccount",
          "value": "入力"
        },
        {
          "item": "creditAmount",
          "value": "入力"
        }
      ],
      "inputCells": [
        "debitAccount",
        "debitAmount",
        "creditAccount",
        "creditAmount"
      ]
    },
    "answer": {
      "cells": {
        "debitAccount": "普通預金",
        "debitAmount": 30000,
        "creditAccount": "給料",
        "creditAmount": 30000
      }
    },
    "explanation": "30,000円を過大に記帳しています。過大分について普通預金を戻し、給料を減額します。",
    "learningRole": "transfer",
    "variantGroup": "correction_20",
    "timelineRole": "main"
  },
  "D001": {
    "id": "D001",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料123,000円のうち4分の1が次期分である。また、備品246,000円は期首取得、残存価額ゼロ、耐用年数4年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 123000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 246000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 30750,
        "insurance_expense_after": 92250,
        "depreciation_expense": 61500,
        "equipment_book_value_after": 184500
      }
    },
    "explanation": "【保険料】次期分は123,000×1/4＝30,750円です。当期費用は123,000－30,750＝92,250円です。\n【減価償却】年額は246,000÷4年＝61,500円、期末帳簿価額は246,000－61,500＝184,500円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_1",
    "timelineRole": "main"
  },
  "D002": {
    "id": "D002",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料126,000円のうち4分の1が次期分である。また、備品252,000円は期首取得、残存価額ゼロ、耐用年数4年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 126000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 252000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 31500,
        "insurance_expense_after": 94500,
        "depreciation_expense": 63000,
        "equipment_book_value_after": 189000
      }
    },
    "explanation": "【保険料】次期分は126,000×1/4＝31,500円です。当期費用は126,000－31,500＝94,500円です。\n【減価償却】年額は252,000÷4年＝63,000円、期末帳簿価額は252,000－63,000＝189,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_1",
    "timelineRole": "main"
  },
  "D003": {
    "id": "D003",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料129,000円のうち4分の1が次期分である。また、備品258,000円は期首取得、残存価額ゼロ、耐用年数4年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 129000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 258000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 32250,
        "insurance_expense_after": 96750,
        "depreciation_expense": 64500,
        "equipment_book_value_after": 193500
      }
    },
    "explanation": "【保険料】次期分は129,000×1/4＝32,250円です。当期費用は129,000－32,250＝96,750円です。\n【減価償却】年額は258,000÷4年＝64,500円、期末帳簿価額は258,000－64,500＝193,500円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_1",
    "timelineRole": "main"
  },
  "D004": {
    "id": "D004",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料132,000円のうち4分の1が次期分である。また、備品264,000円は期首取得、残存価額ゼロ、耐用年数4年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 132000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 264000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 33000,
        "insurance_expense_after": 99000,
        "depreciation_expense": 66000,
        "equipment_book_value_after": 198000
      }
    },
    "explanation": "【保険料】次期分は132,000×1/4＝33,000円です。当期費用は132,000－33,000＝99,000円です。\n【減価償却】年額は264,000÷4年＝66,000円、期末帳簿価額は264,000－66,000＝198,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_1",
    "timelineRole": "main"
  },
  "D005": {
    "id": "D005",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料135,000円のうち4分の1が次期分である。また、備品270,000円は期首取得、残存価額ゼロ、耐用年数4年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 135000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 270000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 33750,
        "insurance_expense_after": 101250,
        "depreciation_expense": 67500,
        "equipment_book_value_after": 202500
      }
    },
    "explanation": "【保険料】次期分は135,000×1/4＝33,750円です。当期費用は135,000－33,750＝101,250円です。\n【減価償却】年額は270,000÷4年＝67,500円、期末帳簿価額は270,000－67,500＝202,500円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_1",
    "timelineRole": "main"
  },
  "D006": {
    "id": "D006",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料138,000円のうち3分の1が次期分である。また、備品276,000円は期首取得、残存価額ゼロ、耐用年数5年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 138000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 276000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 46000,
        "insurance_expense_after": 92000,
        "depreciation_expense": 55200,
        "equipment_book_value_after": 220800
      }
    },
    "explanation": "【保険料】次期分は138,000×1/3＝46,000円です。当期費用は138,000－46,000＝92,000円です。\n【減価償却】年額は276,000÷5年＝55,200円、期末帳簿価額は276,000－55,200＝220,800円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_2",
    "timelineRole": "main"
  },
  "D007": {
    "id": "D007",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料141,000円のうち3分の1が次期分である。また、備品282,000円は期首取得、残存価額ゼロ、耐用年数5年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 141000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 282000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 47000,
        "insurance_expense_after": 94000,
        "depreciation_expense": 56400,
        "equipment_book_value_after": 225600
      }
    },
    "explanation": "【保険料】次期分は141,000×1/3＝47,000円です。当期費用は141,000－47,000＝94,000円です。\n【減価償却】年額は282,000÷5年＝56,400円、期末帳簿価額は282,000－56,400＝225,600円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_2",
    "timelineRole": "main"
  },
  "D008": {
    "id": "D008",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料144,000円のうち3分の1が次期分である。また、備品288,000円は期首取得、残存価額ゼロ、耐用年数5年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 144000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 288000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 48000,
        "insurance_expense_after": 96000,
        "depreciation_expense": 57600,
        "equipment_book_value_after": 230400
      }
    },
    "explanation": "【保険料】次期分は144,000×1/3＝48,000円です。当期費用は144,000－48,000＝96,000円です。\n【減価償却】年額は288,000÷5年＝57,600円、期末帳簿価額は288,000－57,600＝230,400円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_2",
    "timelineRole": "main"
  },
  "D009": {
    "id": "D009",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料147,000円のうち3分の1が次期分である。また、備品294,000円は期首取得、残存価額ゼロ、耐用年数5年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 147000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 294000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 49000,
        "insurance_expense_after": 98000,
        "depreciation_expense": 58800,
        "equipment_book_value_after": 235200
      }
    },
    "explanation": "【保険料】次期分は147,000×1/3＝49,000円です。当期費用は147,000－49,000＝98,000円です。\n【減価償却】年額は294,000÷5年＝58,800円、期末帳簿価額は294,000－58,800＝235,200円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_2",
    "timelineRole": "main"
  },
  "D010": {
    "id": "D010",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料150,000円のうち3分の1が次期分である。また、備品300,000円は期首取得、残存価額ゼロ、耐用年数5年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 150000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 300000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 50000,
        "insurance_expense_after": 100000,
        "depreciation_expense": 60000,
        "equipment_book_value_after": 240000
      }
    },
    "explanation": "【保険料】次期分は150,000×1/3＝50,000円です。当期費用は150,000－50,000＝100,000円です。\n【減価償却】年額は300,000÷5年＝60,000円、期末帳簿価額は300,000－60,000＝240,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_2",
    "timelineRole": "main"
  },
  "D011": {
    "id": "D011",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料153,000円のうち6分の1が次期分である。また、備品306,000円は期首取得、残存価額ゼロ、耐用年数6年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 153000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 306000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 25500,
        "insurance_expense_after": 127500,
        "depreciation_expense": 51000,
        "equipment_book_value_after": 255000
      }
    },
    "explanation": "【保険料】次期分は153,000×1/6＝25,500円です。当期費用は153,000－25,500＝127,500円です。\n【減価償却】年額は306,000÷6年＝51,000円、期末帳簿価額は306,000－51,000＝255,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_3",
    "timelineRole": "main"
  },
  "D012": {
    "id": "D012",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料156,000円のうち6分の1が次期分である。また、備品312,000円は期首取得、残存価額ゼロ、耐用年数6年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 156000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 312000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 26000,
        "insurance_expense_after": 130000,
        "depreciation_expense": 52000,
        "equipment_book_value_after": 260000
      }
    },
    "explanation": "【保険料】次期分は156,000×1/6＝26,000円です。当期費用は156,000－26,000＝130,000円です。\n【減価償却】年額は312,000÷6年＝52,000円、期末帳簿価額は312,000－52,000＝260,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_3",
    "timelineRole": "main"
  },
  "D013": {
    "id": "D013",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料159,000円のうち6分の1が次期分である。また、備品318,000円は期首取得、残存価額ゼロ、耐用年数6年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 159000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 318000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 26500,
        "insurance_expense_after": 132500,
        "depreciation_expense": 53000,
        "equipment_book_value_after": 265000
      }
    },
    "explanation": "【保険料】次期分は159,000×1/6＝26,500円です。当期費用は159,000－26,500＝132,500円です。\n【減価償却】年額は318,000÷6年＝53,000円、期末帳簿価額は318,000－53,000＝265,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_3",
    "timelineRole": "main"
  },
  "D014": {
    "id": "D014",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料162,000円のうち6分の1が次期分である。また、備品324,000円は期首取得、残存価額ゼロ、耐用年数6年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 162000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 324000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 27000,
        "insurance_expense_after": 135000,
        "depreciation_expense": 54000,
        "equipment_book_value_after": 270000
      }
    },
    "explanation": "【保険料】次期分は162,000×1/6＝27,000円です。当期費用は162,000－27,000＝135,000円です。\n【減価償却】年額は324,000÷6年＝54,000円、期末帳簿価額は324,000－54,000＝270,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_3",
    "timelineRole": "main"
  },
  "D015": {
    "id": "D015",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料165,000円のうち6分の1が次期分である。また、備品330,000円は期首取得、残存価額ゼロ、耐用年数6年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 165000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 330000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 27500,
        "insurance_expense_after": 137500,
        "depreciation_expense": 55000,
        "equipment_book_value_after": 275000
      }
    },
    "explanation": "【保険料】次期分は165,000×1/6＝27,500円です。当期費用は165,000－27,500＝137,500円です。\n【減価償却】年額は330,000÷6年＝55,000円、期末帳簿価額は330,000－55,000＝275,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_3",
    "timelineRole": "main"
  },
  "D016": {
    "id": "D016",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料168,000円のうち5分の1が次期分である。また、備品336,000円は期首取得、残存価額ゼロ、耐用年数3年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 168000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 336000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 33600,
        "insurance_expense_after": 134400,
        "depreciation_expense": 112000,
        "equipment_book_value_after": 224000
      }
    },
    "explanation": "【保険料】次期分は168,000×1/5＝33,600円です。当期費用は168,000－33,600＝134,400円です。\n【減価償却】年額は336,000÷3年＝112,000円、期末帳簿価額は336,000－112,000＝224,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_4",
    "timelineRole": "main"
  },
  "D017": {
    "id": "D017",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料171,000円のうち5分の1が次期分である。また、備品342,000円は期首取得、残存価額ゼロ、耐用年数3年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 171000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 342000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 34200,
        "insurance_expense_after": 136800,
        "depreciation_expense": 114000,
        "equipment_book_value_after": 228000
      }
    },
    "explanation": "【保険料】次期分は171,000×1/5＝34,200円です。当期費用は171,000－34,200＝136,800円です。\n【減価償却】年額は342,000÷3年＝114,000円、期末帳簿価額は342,000－114,000＝228,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_4",
    "timelineRole": "main"
  },
  "D018": {
    "id": "D018",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料174,000円のうち5分の1が次期分である。また、備品348,000円は期首取得、残存価額ゼロ、耐用年数3年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 174000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 348000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 34800,
        "insurance_expense_after": 139200,
        "depreciation_expense": 116000,
        "equipment_book_value_after": 232000
      }
    },
    "explanation": "【保険料】次期分は174,000×1/5＝34,800円です。当期費用は174,000－34,800＝139,200円です。\n【減価償却】年額は348,000÷3年＝116,000円、期末帳簿価額は348,000－116,000＝232,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_4",
    "timelineRole": "main"
  },
  "D019": {
    "id": "D019",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料177,000円のうち5分の1が次期分である。また、備品354,000円は期首取得、残存価額ゼロ、耐用年数3年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 177000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 354000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 35400,
        "insurance_expense_after": 141600,
        "depreciation_expense": 118000,
        "equipment_book_value_after": 236000
      }
    },
    "explanation": "【保険料】次期分は177,000×1/5＝35,400円です。当期費用は177,000－35,400＝141,600円です。\n【減価償却】年額は354,000÷3年＝118,000円、期末帳簿価額は354,000－118,000＝236,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_4",
    "timelineRole": "main"
  },
  "D020": {
    "id": "D020",
    "type": "worksheet",
    "category": "決算整理・計算問題",
    "difficulty": 3,
    "chapter": 10,
    "scene": "1月・決算整理",
    "story": "1月、水野先輩が前期資料を使い、3月決算に向けた予行演習を行う。期間配分と固定資産の評価を同じ表で混同しないことが課題だ。",
    "question": "3月決算の予行演習として、決算整理前の保険料180,000円のうち5分の1が次期分である。また、備品360,000円は期首取得、残存価額ゼロ、耐用年数3年、定額法・間接法で処理する。前払振替額、当期保険料、当期減価償却費、期末帳簿価額を求めなさい。",
    "materials": [],
    "table": {
      "columns": [
        "論点",
        "計算基礎額",
        "決算整理額",
        "整理後金額"
      ],
      "rows": [
        {
          "item": "保険料（次期分の繰延べ）",
          "before": 180000,
          "adjustment": "入力",
          "after": "入力"
        },
        {
          "item": "備品（減価償却）",
          "before": 360000,
          "adjustment": "入力",
          "after": "入力"
        }
      ],
      "inputCells": [
        "insurance_adjustment",
        "insurance_expense_after",
        "depreciation_expense",
        "equipment_book_value_after"
      ]
    },
    "answer": {
      "cells": {
        "insurance_adjustment": 36000,
        "insurance_expense_after": 144000,
        "depreciation_expense": 120000,
        "equipment_book_value_after": 240000
      }
    },
    "explanation": "【保険料】次期分は180,000×1/5＝36,000円です。当期費用は180,000－36,000＝144,000円です。\n【減価償却】年額は360,000÷3年＝120,000円、期末帳簿価額は360,000－120,000＝240,000円です。\n【表示上の注意】間接法では備品勘定そのものを減額しません。この表の「決算整理額」は当期減価償却費、「整理後金額」は取得原価から減価償却累計額を控除した期末帳簿価額を示します。",
    "learningRole": "transfer",
    "variantGroup": "worksheet_4",
    "timelineRole": "main"
  },
  "F001": {
    "id": "F001",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 520000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 310000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 315000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 227000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 300000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 118000,
        "assetsTotal": 1145000,
        "liabilitiesEquityTotal": 1145000
      }
    },
    "explanation": "資産合計は1,145,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,145,000－負債527,000－資本金500,000＝118,000円と求められます。したがって負債・純資産合計も1,145,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_2",
    "timelineRole": "main"
  },
  "F002": {
    "id": "F002",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 456000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 278000
        },
        {
          "section": "資産",
          "account": "繰越商品",
          "amount": 150000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 264000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 212000
        },
        {
          "section": "負債",
          "account": "未払給料",
          "amount": 34000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 250000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 152000,
        "assetsTotal": 1148000,
        "liabilitiesEquityTotal": 1148000
      }
    },
    "explanation": "資産合計は1,148,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,148,000－負債496,000－資本金500,000＝152,000円と求められます。したがって負債・純資産合計も1,148,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_3",
    "timelineRole": "main"
  },
  "F003": {
    "id": "F003",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 425000
        },
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 286000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 304000
        },
        {
          "section": "資産",
          "account": "前払保険料",
          "amount": 46000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 195000
        },
        {
          "section": "負債",
          "account": "前受家賃",
          "amount": 50000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 316000,
        "assetsTotal": 1061000,
        "liabilitiesEquityTotal": 1061000
      }
    },
    "explanation": "資産合計は1,061,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,061,000－負債245,000－資本金500,000＝316,000円と求められます。したがって負債・純資産合計も1,061,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_1",
    "timelineRole": "main"
  },
  "F004": {
    "id": "F004",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 580000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 340000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 360000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 248000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 300000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 232000,
        "assetsTotal": 1280000,
        "liabilitiesEquityTotal": 1280000
      }
    },
    "explanation": "資産合計は1,280,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,280,000－負債548,000－資本金500,000＝232,000円と求められます。したがって負債・純資産合計も1,280,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_2",
    "timelineRole": "main"
  },
  "F005": {
    "id": "F005",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 510000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 305000
        },
        {
          "section": "資産",
          "account": "繰越商品",
          "amount": 165000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 300000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 230000
        },
        {
          "section": "負債",
          "account": "未払給料",
          "amount": 40000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 250000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 260000,
        "assetsTotal": 1280000,
        "liabilitiesEquityTotal": 1280000
      }
    },
    "explanation": "資産合計は1,280,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,280,000－負債520,000－資本金500,000＝260,000円と求められます。したがって負債・純資産合計も1,280,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_3",
    "timelineRole": "main"
  },
  "F006": {
    "id": "F006",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 470000
        },
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 322000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 328000
        },
        {
          "section": "資産",
          "account": "前払保険料",
          "amount": 52000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 210000
        },
        {
          "section": "負債",
          "account": "前受家賃",
          "amount": 50000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 412000,
        "assetsTotal": 1172000,
        "liabilitiesEquityTotal": 1172000
      }
    },
    "explanation": "資産合計は1,172,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,172,000－負債260,000－資本金500,000＝412,000円と求められます。したがって負債・純資産合計も1,172,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_1",
    "timelineRole": "main"
  },
  "F007": {
    "id": "F007",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 640000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 370000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 405000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 269000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 300000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 346000,
        "assetsTotal": 1415000,
        "liabilitiesEquityTotal": 1415000
      }
    },
    "explanation": "資産合計は1,415,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,415,000－負債569,000－資本金500,000＝346,000円と求められます。したがって負債・純資産合計も1,415,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_2",
    "timelineRole": "main"
  },
  "F008": {
    "id": "F008",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 564000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 332000
        },
        {
          "section": "資産",
          "account": "繰越商品",
          "amount": 180000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 336000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 248000
        },
        {
          "section": "負債",
          "account": "未払給料",
          "amount": 46000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 250000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 368000,
        "assetsTotal": 1412000,
        "liabilitiesEquityTotal": 1412000
      }
    },
    "explanation": "資産合計は1,412,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,412,000－負債544,000－資本金500,000＝368,000円と求められます。したがって負債・純資産合計も1,412,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_3",
    "timelineRole": "main"
  },
  "F009": {
    "id": "F009",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 515000
        },
        {
          "section": "資産",
          "account": "普通預金",
          "amount": 358000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 352000
        },
        {
          "section": "資産",
          "account": "前払保険料",
          "amount": 58000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 225000
        },
        {
          "section": "負債",
          "account": "前受家賃",
          "amount": 50000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 508000,
        "assetsTotal": 1283000,
        "liabilitiesEquityTotal": 1283000
      }
    },
    "explanation": "資産合計は1,283,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,283,000－負債275,000－資本金500,000＝508,000円と求められます。したがって負債・純資産合計も1,283,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_1",
    "timelineRole": "main"
  },
  "F010": {
    "id": "F010",
    "type": "financial_statement",
    "category": "貸借対照表",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "年度決算を完成させ、社長へ会社の成果と財政状態を報告する。",
    "question": "年度末の貸借対照表を作成している。表に示した項目以外の資産・負債・純資産はないものとする。空欄を補い、資産合計と負債・純資産合計が一致することを確認しなさい。",
    "materials": [],
    "table": {
      "columns": [
        "section",
        "account",
        "amount"
      ],
      "rows": [
        {
          "section": "資産",
          "account": "現金",
          "amount": 700000
        },
        {
          "section": "資産",
          "account": "売掛金",
          "amount": 400000
        },
        {
          "section": "資産",
          "account": "備品（純額）",
          "amount": 450000
        },
        {
          "section": "負債",
          "account": "買掛金",
          "amount": 290000
        },
        {
          "section": "負債",
          "account": "借入金",
          "amount": 300000
        },
        {
          "section": "純資産",
          "account": "資本金",
          "amount": 500000
        },
        {
          "section": "純資産",
          "account": "繰越利益剰余金",
          "amount": "入力"
        },
        {
          "section": "合計",
          "account": "資産合計／負債純資産合計",
          "amount": "入力"
        }
      ],
      "inputCells": [
        "retainedEarnings",
        "assetsTotal",
        "liabilitiesEquityTotal"
      ]
    },
    "answer": {
      "cells": {
        "retainedEarnings": 460000,
        "assetsTotal": 1550000,
        "liabilitiesEquityTotal": 1550000
      }
    },
    "explanation": "資産合計は1,550,000円です。表に示した以外の項目はないため、繰越利益剰余金は1,550,000－負債590,000－資本金500,000＝460,000円と求められます。したがって負債・純資産合計も1,550,000円です。繰越利益剰余金は本来、利益の累積から形成される純資産であり、常に単なる差額科目として求めるものではありません。",
    "learningRole": "transfer",
    "variantGroup": "financial_statement_2",
    "timelineRole": "main"
  },
  "C001": {
    "id": "C001",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 310,000円"
      },
      {
        "date": "3月5日",
        "transaction": "商品を現金で93,000円仕入"
      },
      {
        "date": "3月12日",
        "transaction": "商品を現金で155,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費21,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 351000,
        "profit": 41000
      }
    },
    "explanation": "期末現金残高は351,000円、3月の利益は41,000円です。売上155,000円から売上原価93,000円と通信費21,000円を控除した利益は41,000円です。現金取引だけの基本ケースです。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_01",
    "timelineRole": "main"
  },
  "C002": {
    "id": "C002",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 320,000円"
      },
      {
        "date": "3月5日",
        "transaction": "商品を現金で96,000円仕入"
      },
      {
        "date": "3月12日",
        "transaction": "商品160,000円を掛けで販売（期末未回収）"
      },
      {
        "date": "3月25日",
        "transaction": "通信費22,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 202000,
        "profit": 42000
      }
    },
    "explanation": "期末現金残高は202,000円、3月の利益は42,000円です。掛売上160,000円は利益に含まれますが、まだ現金は増えません。利益は160,000－96,000－22,000＝42,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_02",
    "timelineRole": "main"
  },
  "C003": {
    "id": "C003",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 330,000円"
      },
      {
        "date": "3月3日",
        "transaction": "前月の売掛金80,000円を現金で回収"
      },
      {
        "date": "3月8日",
        "transaction": "商品を現金で99,000円仕入"
      },
      {
        "date": "3月15日",
        "transaction": "商品を現金で165,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費23,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 453000,
        "profit": 43000
      }
    },
    "explanation": "期末現金残高は453,000円、3月の利益は43,000円です。前月売掛金の回収80,000円は現金を増やしますが、当月の収益ではありません。利益は165,000－99,000－23,000＝43,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_03",
    "timelineRole": "main"
  },
  "C004": {
    "id": "C004",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 340,000円"
      },
      {
        "date": "3月2日",
        "transaction": "銀行から100,000円を借り入れ、現金で受け取った"
      },
      {
        "date": "3月7日",
        "transaction": "商品を現金で102,000円仕入"
      },
      {
        "date": "3月14日",
        "transaction": "商品を現金で170,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費24,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 484000,
        "profit": 44000
      }
    },
    "explanation": "期末現金残高は484,000円、3月の利益は44,000円です。借入100,000円は現金を増やしますが収益ではありません。利益は170,000－102,000－24,000＝44,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_04",
    "timelineRole": "main"
  },
  "C005": {
    "id": "C005",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 350,000円"
      },
      {
        "date": "3月5日",
        "transaction": "業務用備品120,000円を現金で購入（当月の減価償却は考慮しない）"
      },
      {
        "date": "3月8日",
        "transaction": "商品を現金で105,000円仕入"
      },
      {
        "date": "3月15日",
        "transaction": "商品を現金で175,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費25,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 275000,
        "profit": 45000
      }
    },
    "explanation": "期末現金残高は275,000円、3月の利益は45,000円です。備品購入120,000円は現金を減らしますが、購入時点で全額を費用にはしません。利益は175,000－105,000－25,000＝45,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_05",
    "timelineRole": "main"
  },
  "C006": {
    "id": "C006",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 360,000円"
      },
      {
        "date": "3月6日",
        "transaction": "商品を現金で108,000円仕入"
      },
      {
        "date": "3月13日",
        "transaction": "商品を現金で180,000円販売"
      },
      {
        "date": "3月20日",
        "transaction": "翌月分の家賃30,000円を現金で前払い"
      },
      {
        "date": "3月25日",
        "transaction": "通信費26,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 376000,
        "profit": 46000
      }
    },
    "explanation": "期末現金残高は376,000円、3月の利益は46,000円です。翌月分家賃30,000円は現金を減らしますが当月費用ではなく前払費用です。利益は180,000－108,000－26,000＝46,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_06",
    "timelineRole": "main"
  },
  "C007": {
    "id": "C007",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 370,000円"
      },
      {
        "date": "3月5日",
        "transaction": "商品を現金で111,000円仕入"
      },
      {
        "date": "3月12日",
        "transaction": "商品を現金で185,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費27,000円を現金払い"
      },
      {
        "date": "3月31日",
        "transaction": "当月分給料10,000円が未払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 417000,
        "profit": 37000
      }
    },
    "explanation": "期末現金残高は417,000円、3月の利益は37,000円です。未払給料10,000円は現金を減らしていなくても当月費用です。利益は185,000－111,000－27,000－10,000＝37,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_07",
    "timelineRole": "main"
  },
  "C008": {
    "id": "C008",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 380,000円"
      },
      {
        "date": "3月5日",
        "transaction": "商品を現金で114,000円仕入"
      },
      {
        "date": "3月12日",
        "transaction": "商品を現金で190,000円販売"
      },
      {
        "date": "3月20日",
        "transaction": "来月引き渡す商品の内金50,000円を現金で受け取った"
      },
      {
        "date": "3月25日",
        "transaction": "通信費28,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 478000,
        "profit": 48000
      }
    },
    "explanation": "期末現金残高は478,000円、3月の利益は48,000円です。内金50,000円は現金を増やしますが、商品未引渡しなので前受金であり当月売上ではありません。利益は190,000－114,000－28,000＝48,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_08",
    "timelineRole": "main"
  },
  "C009": {
    "id": "C009",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 390,000円"
      },
      {
        "date": "3月4日",
        "transaction": "前月に計上済みの買掛金40,000円を現金で支払った"
      },
      {
        "date": "3月8日",
        "transaction": "商品を現金で117,000円仕入"
      },
      {
        "date": "3月15日",
        "transaction": "商品を現金で195,000円販売"
      },
      {
        "date": "3月25日",
        "transaction": "通信費29,000円を現金払い"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 399000,
        "profit": 49000
      }
    },
    "explanation": "期末現金残高は399,000円、3月の利益は49,000円です。前月買掛金40,000円の支払は現金を減らしますが、当月費用ではありません。利益は195,000－117,000－29,000＝49,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_09",
    "timelineRole": "main"
  },
  "C010": {
    "id": "C010",
    "type": "comprehensive",
    "category": "複数資料読み取り",
    "difficulty": 3,
    "chapter": 12,
    "scene": "3月・数字で会社を語る",
    "story": "3月、社長への月次・年度報告を前に、主人公は「現金」と「利益」が同じものではないことを複数資料から説明する。",
    "question": "社長から「3月末の現金はいくら残り、3月の利益はいくらか」と尋ねられた。現金の増減と収益・費用の発生を分けて考え、二つの金額を答えなさい。",
    "materials": [
      {
        "date": "3月1日",
        "transaction": "現金残高 400,000円"
      },
      {
        "date": "3月5日",
        "transaction": "商品を現金で120,000円仕入"
      },
      {
        "date": "3月12日",
        "transaction": "商品200,000円を掛けで販売（期末未回収）"
      },
      {
        "date": "3月25日",
        "transaction": "通信費30,000円を現金払い"
      },
      {
        "date": "3月31日",
        "transaction": "備品の当月減価償却費20,000円を計上"
      },
      {
        "date": "決算整理事項",
        "transaction": "期首商品棚卸高・期末商品棚卸高はいずれも0円。当月仕入商品はすべて当月中に販売済み"
      }
    ],
    "table": {
      "columns": [
        "item",
        "answer"
      ],
      "rows": [
        {
          "item": "期末現金残高",
          "answer": "入力"
        },
        {
          "item": "3月の利益（他の取引なし）",
          "answer": "入力"
        }
      ],
      "inputCells": [
        "endingCash",
        "profit"
      ]
    },
    "answer": {
      "cells": {
        "endingCash": 250000,
        "profit": 30000
      }
    },
    "explanation": "期末現金残高は250,000円、3月の利益は30,000円です。掛売上は利益に含まれますが現金は増えず、減価償却費は費用でも現金を減らしません。利益は200,000－120,000－30,000－20,000＝30,000円です。 現金が動くかどうかと、当月の収益・費用になるかどうかは別々に判断します。",
    "learningRole": "transfer",
    "variantGroup": "comprehensive_10",
    "timelineRole": "main"
  }
};

const QuestionDataMeta = Object.freeze({
  "datasetId": "boki3-accounting-rpg-300",
  "dataVersion": "2026.08.20-r2",
  "examScopeVersion": "2026",
  "questionCount": 300,
  "typeCounts": {
    "journal": 150,
    "ledger": 50,
    "trial_balance": 40,
    "correction": 20,
    "worksheet": 20,
    "financial_statement": 10,
    "comprehensive": 10
  },
  "timelinePolicy": {
    "J001-J050": "本編。4月から3月へ一方向に進む。",
    "J051-J100": "復習編。物語上の月を巻き戻さず、水野先輩の確認ケースとして扱う。",
    "J101-J150": "応用編。特定月に固定しない独立ケース。"
  },
  "editorialPolicy": [
    "問題文だけで正答を一意に判断できる条件を記載する。",
    "商品代金と付随費用、負担者と支払者、決議と支払など時点・主体を分離して記述する。",
    "ヒントや解説にしか存在しない正答前提を作らない。",
    "同一原則の反復は数値変更だけでなく、文脈・資料・判断条件を変えて転移学習を促す。",
    "決算前の月に決算論点を扱う場合は、前期資料または予行演習であることをStory Layerに明示する。"
  ]
});

function validateQuestionData(questionData = QuestionData) {
  const errors = [];
  const warnings = [];
  const entries = Object.entries(questionData || {});
  const expectedTypeCounts = {
    journal: 150,
    ledger: 50,
    trial_balance: 40,
    correction: 20,
    worksheet: 20,
    financial_statement: 10,
    comprehensive: 10
  };

  if (entries.length !== 300) {
    errors.push(`問題数が300件ではありません: ${entries.length}`);
  }

  const typeCounts = {};
  const seenIds = new Set();

  for (const [key, item] of entries) {
    if (!item || typeof item !== 'object') {
      errors.push(`${key}: 問題オブジェクトが不正です`);
      continue;
    }
    if (item.id !== key) {
      errors.push(`${key}: キーとidが一致しません (${item.id})`);
    }
    if (seenIds.has(item.id)) {
      errors.push(`${key}: idが重複しています (${item.id})`);
    }
    seenIds.add(item.id);
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;

    for (const field of ['id', 'type', 'category', 'difficulty', 'chapter', 'scene', 'story', 'question', 'answer', 'explanation']) {
      if (!(field in item)) errors.push(`${key}: ${field} がありません`);
    }

    if (item.type === 'journal') {
      const debit = Array.isArray(item.answer?.debit) ? item.answer.debit : [];
      const credit = Array.isArray(item.answer?.credit) ? item.answer.credit : [];
      const debitTotal = debit.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
      const creditTotal = credit.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
      if (!debit.length || !credit.length) {
        errors.push(`${key}: 借方または貸方の正答が空です`);
      }
      if (debitTotal !== creditTotal) {
        errors.push(`${key}: 貸借不一致 ${debitTotal} != ${creditTotal}`);
      }
      for (const row of [...debit, ...credit]) {
        if (!row?.account || !Number.isFinite(Number(row?.amount)) || Number(row.amount) <= 0) {
          errors.push(`${key}: 仕訳行が不正です`);
        }
      }
    } else {
      const inputCells = Array.isArray(item.table?.inputCells) ? item.table.inputCells : [];
      const answerCells = item.answer?.cells && typeof item.answer.cells === 'object' ? item.answer.cells : {};
      for (const cell of inputCells) {
        if (!(cell in answerCells)) {
          errors.push(`${key}: 入力セル ${cell} の正答がありません`);
        }
      }
    }
  }

  for (const [type, expected] of Object.entries(expectedTypeCounts)) {
    if ((typeCounts[type] || 0) !== expected) {
      errors.push(`${type}: 件数が不正です ${(typeCounts[type] || 0)} / ${expected}`);
    }
  }

  // Story timeline: J051以降で「入社初日」や月表示へ戻さない。
  for (let n = 51; n <= 150; n += 1) {
    const id = `J${String(n).padStart(3, '0')}`;
    const item = questionData[id];
    if (!item) continue;
    if (String(item.story || '').includes('入社初日')) {
      errors.push(`${id}: 復習・応用編で入社初日に戻っています`);
    }
    if (/^\d+月・/.test(String(item.scene || ''))) {
      errors.push(`${id}: 復習・応用編で物語月が巻き戻っています`);
    }
  }

  // 決算整理表: 間接法なのに「備品（取得原価）」を直接調整するように見せない。
  for (let n = 1; n <= 20; n += 1) {
    const id = `D${String(n).padStart(3, '0')}`;
    const item = questionData[id];
    if (!item) continue;
    const text = JSON.stringify(item);
    if (text.includes('備品（取得原価）')) {
      errors.push(`${id}: 間接法の表に旧ラベル「備品（取得原価）」が残っています`);
    }
    if (!String(item.explanation || '').includes('備品勘定そのものを減額しません')) {
      warnings.push(`${id}: 間接法の表示上の注意がありません`);
    }
  }

  // 貸借対照表: 差額計算が成立する限定条件を明示する。
  for (let n = 1; n <= 10; n += 1) {
    const id = `F${String(n).padStart(3, '0')}`;
    const item = questionData[id];
    if (!item) continue;
    if (!String(item.question || '').includes('表に示した項目以外')) {
      errors.push(`${id}: 他の項目がないという限定条件がありません`);
    }
  }

  // 総合問題: 10問すべて同一資料になっていないことを確認。
  const comprehensiveSignatures = [];
  for (let n = 1; n <= 10; n += 1) {
    const id = `C${String(n).padStart(3, '0')}`;
    const item = questionData[id];
    if (item) comprehensiveSignatures.push(JSON.stringify(item.materials || []));
  }
  if (new Set(comprehensiveSignatures).size !== comprehensiveSignatures.length) {
    errors.push('C001-C010: 総合問題の資料が重複しています');
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    counts: Object.freeze({ total: entries.length, ...typeCounts })
  });
}

// Top-level `const` declarations are not added to `window` in classic scripts.
// Expose the data explicitly because the application bootstrap reads it there.
if (typeof window !== 'undefined') {
  window.QuestionData = QuestionData;
}
