# PROFESSIONAL EDITORIAL AUDIT FINAL REPORT

監査日: 2026-08-26  
Truth Source: `data/questions.js` の配列順（150 journal / 50 ledger / 40 trial_balance / 20 correction / 20 worksheet / 10 financial_statement / 10 comprehensive）

## 1. Status

```text
Professional Editorial Audit:
98 / 100 (2026年度公式一次資料だけが EXTERNAL-UNVERIFIED)

Questions audited:
300 / 300

Final PASS (internal editorial/accounting gate):
300 / 300

UNVERIFIED:
0

NOT-DONE:
0

EXTERNAL-UNVERIFIED:
300 / 300 (examRelevanceの外部公式照合だけ)
```

300問を25問ずつ、ソース順に、Story、設問、表示資料、可解性、独立会計計算、著者解、解説、誤答feedback、用語、日本語、曖昧性、試験関連性、転移、重複、knowledge link、game meaningの17観点で実査した。各問固有の根拠・再計算値は `question-audit-matrix.json` に記録した。行の存在を監査完了とは扱わず、表示事実から独立導出できる60問は独立関数とも比較し、残り240問は資料の加減算・貸借関係を個別に再構成した。

外部検索はHTTP 401となり、日本商工会議所の2026年度一次資料本文を取得できなかった。このため、内部教材の会計・校閲監査は300問PASSである一方、公式年度適合を含む総合点を100とは断定しない。この外部Evidenceは本ミッションの停止許容条件に該当する。

## 2. Batch Results

| Batch | Source positions | Audited | Fixed | PASS after recheck | Remaining |
|---:|---:|---:|---:|---:|---:|
| 1 | 1–25 | 25 | 0 | 25 | 0 |
| 2 | 26–50 | 25 | 0 | 25 | 0 |
| 3 | 51–75 | 25 | 0 | 25 | 0 |
| 4 | 76–100 | 25 | 0 | 25 | 0 |
| 5 | 101–125 | 25 | 1 (J121) | 25 | 0 |
| 6 | 126–150 | 25 | 0 | 25 | 0 |
| 7 | 151–175 | 25 | 0 | 25 | 0 |
| 8 | 176–200 | 25 | 0 | 25 | 0 |
| 9 | 201–225 | 25 | 0 | 25 | 0 |
| 10 | 226–250 | 25 | 0 | 25 | 0 |
| 11 | 251–275 | 25 | 0 | 25 | 0 |
| 12 | 276–300 | 25 | 10 (C001–C010) | 25 | 0 |

各Batchで25/25の本文と表示資料をanswerを起点にせず再計算し、その時点までの全問題にsemantic validator、data audit、feedback auditを再適用した。共通コード、UI、状態機械は変更していない。

## 3. Accounting Findings

- **重大な会計誤り: 0**。仕訳150問は貸借科目・方向・金額・合計を取引事実から再構成した。
- 帳簿50問、試算表40問、訂正20問、精算表20問、財務諸表10問、総合10問は表示materialsと固定セルだけから残高・合計・利益を再計算した。
- J121の著者解（備品／未払金300,000円）は正しかった。誤りは解説内の資産名だけだったため、会計値を変更していない。
- Gate A（重大会計誤り）、D（答えと解説の矛盾）、E（資料と答えの矛盾）は修正後0件。

## 4. Solvability Findings

- 入力キーと表示入力欄を全非仕訳150問で照合し、資料がDOM表示対象であることをsemantic契約で確認した。
- 日付、決済方法、税率、月数、残高方向など、計算に必要な条件を問題ごとに確認した。合理的複数解および情報不足は0件。
- L041–L046、F001、C001–C010など、設問本文だけでは数値が見えない問題は `materials` の内容まで追跡し、著者解なしで解けることを再確認した。

## 5. Explanation Findings

- J121は問題が「業務用複合機」であるのに解説が「パソコン」と述べるStory/設問不一致を再現した。テンプレート再利用時に資産名が残ったことが原因であり、該当語だけを「業務用複合機」へ修正した。
- その他299問は取引の意味・勘定の増減または計算過程・結論を個別に照合し、著者解と矛盾する説明はなかった。
- generic/circular explanationの重大残存は0件。短い解説も問題固有の科目、数値または判断規則を含むことを確認した。

## 6. Wrong Answer Feedback Findings

- `audit-feedback.js` が生成する252 misconception pairを、借貸逆転、類似科目、金額差、入力セル別の誤りとして問題に照合した。specific 252、fallback 0。
- feedbackが存在しない入力候補を「文字列があるからspecific」とは数えず、問題別レコードには実際の生成経路と判断対象を記録した。
- 誤概念を強化する重大な誤誘導は0件。

## 7. Japanese Editorial Findings

- `。 `（句点直後ASCII空白）を全件検索し、C001–C010の解説に各1件、合計10件を再現した。共通後半文の前に残った不要空白だけを削除し、全文formatは行っていない。
- J121の対象物表現を設問に一致させた。
- 修正後、句点後ASCII空白は0件。円表記、日付表記、助詞、主述、全半角、試験用語を全300問で実査した。

## 8. Duplication Findings

- 反復群は同一概念の数値再計算、章をまたいだspacing、core→review→transferの定着を目的とするものとして保持した。各問は数値を個別再計算しており、コピーを根拠にPASSしていない。
- `question-audit-matrix.json` の各行に正規化同型群の件数と `WHY_THIS_REPETITION_EXISTS` 相当の判断を記録した。
- Storyの反復は同一月・同一業務の連続性を示す範囲で保持した。無意味な言い換えによるunique率操作は行っていない。
- 外部試験への転移強度については既存 `audit:exam` が3/10でFAILする。これは300問の個別校閲PASSとは別のカリキュラム配分上の既知P1であり、今回禁止された大規模問題再設計を行わなかった。

## 9. Changed Files

### `data/questions.js`

- **WHY_CHANGE:** J121の対象物不一致とC001–C010の句点後ASCII空白。
- **EVIDENCE:** `rg -n 'パソコンは備品|。 +' data/questions.js` で該当箇所を再現。
- **ROOT_CAUSE:** 類題テンプレートの対象物残存、および共通説明文連結時の空白。
- **MINIMUM_PATCH:** 1語の対象物修正と10個のASCII空白削除。
- **REGRESSION_RISK:** 低。ID、type、answer、入力キー、計算、UIは不変更。

### `reports/question-audit-matrix.json`

- **WHY_CHANGE:** baselineのUNVERIFIED行を、実査した各問固有の17観点Evidenceへ置換するため。
- **EVIDENCE:** 300問を12 Batchで本文・資料・著者解・解説まで照合。
- **ROOT_CAUSE:** 従来matrixは自動検査の存在しか示さず、人間相当の個別校閲証跡を持たなかった。
- **MINIMUM_PATCH:** ID順・300行を維持し、各観点にstatusと固有findingを追加。
- **REGRESSION_RISK:** 実行時コードへの影響なし。

### `reports/professional-editorial-audit.md`

- **WHY_CHANGE:** Batch集計、finding、修正根拠、テスト、mutation、Red Team、外部blockerを再現可能に残すため。
- **REGRESSION_RISK:** 実行時コードへの影響なし。

## 10. Tests

- `npm test`: PASS（app、service worker、engagement、data 300問、feedback）。
- `npm run typecheck`: PASS。
- `node scripts/audit-data.js`: PASS。total 300、ID重複なし。
- `node scripts/audit-feedback.js`: PASS。全type合計300、semantic VALID 300、specific 252/252。
- `node scripts/audit-engagement.js`: PASS。
- `rg -n '。 +' data/questions.js`: PASS（該当0）。
- `npm run audit:exam`: **FAIL 3/10**。テストを緩和せず、仕訳・帳簿・初見転移等のカリキュラム配分不足をそのままEvidence化した。個別問題の会計・文章誤りではなく、今回の「No unrelated/broad rewrite」制約外の既知課題である。
- 2026年度公式一次資料Web照合: **EXTERNAL-UNVERIFIED**（検索API HTTP 401）。

## 11. Content-specific Mutation

一時VM内で原本ファイルを変更せず、代表11種（wrong account / debit / credit / amount / balance / total / date / rate / tax / depreciation / profit）を1件ずつ変異させ、semantic validatorを実行した。account、debit、credit、amount、balance、total、rate、tax、depreciation、profitの10/11はINVALIDとして検出した。元帳行の日付だけを変えたmutationは見逃したため、**validator独立性不足（P2-VALIDATOR-DATE）**として記録する。著者解の正しさは今回の個別実査で確認したが、validatorが日付の意味を独立検証できるとは主張しない。リポジトリのsourceへmutationは保存していない。

## 12. Red Team

Round 1（「100でない理由」だけを探索）:

```text
NEW P0 = 0
NEW P1 = 1  (2026年度公式一次資料を取得できず、年度適合がEXTERNAL-UNVERIFIED)
NEW P2 = 11 (J121対象語1件、句点後ASCII空白10件。全件修正・再監査済み)
```

Round 1でJ121とC001–C010をREOPENし、最小修正、再計算、全文検索、全回帰テストを実施した。

Round 2（修正後ゼロベース再検索）:

```text
NEW P0 = 0
NEW P1 = 0 (内部教材監査)
NEW P2 = 1 (P2-VALIDATOR-DATE: date mutation未検出。教材内容ではなくvalidator独立性)
CARRIED EXTERNAL BLOCKER = 1 (公式一次資料HTTP 401)
```

## 13. WHY NOT 100

内部Professional Editorial Auditについては、300/300の各観点を実査し、重大な会計誤り、解答不能、複数解、資料・答え・解説の矛盾、重大な日本語不備、generic feedback誤誘導、未監査問題はいずれも0である。

ただし、2026年度の試験範囲適合は日本商工会議所一次資料本文を取得できず、全300問の `examRelevance` を `EXTERNAL-UNVERIFIED` とした。既存の試験準備度auditも3/10であり、第三者が100未満を付ける合理的根拠が残る。これを隠して100とすることはEvidence Before ConclusionとANTI-HALLUCINATIONに反するため、総合scoreは98/100に据え置く。外部Evidenceが取得可能になった時点で、公式区分表の各項目を問題IDへ照合し、必要なら最小patch後に再採点する。
