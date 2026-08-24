# 第7次 Semantic Question Integrity 監査（2026-08-24）

## 1. Executive Summary
既知P0（D001、L044〜L046、F001）は表示資料と採点を修正した。全300件に `semantic` 契約を生成し、模試を `VALID && gradingValidated` の問題だけに限定した。構造・Semantic・単体・SWテストはPASS。一方、日本商工会議所一次資料は実行環境からHTTP 403、実ブラウザー/iPhone実機も不在であり、公式Coverageと実機UXはUNVERIFIEDである。したがって公開判定は **INCOMPLETE** とする。

## 2. ROUND 1結果
D001は元試算表が非表示、104セル中77超のゼロ欄が得点対象、F001はD001へ暗黙依存、L044〜L046は根拠証憑なし、D001 prerequisite逆転、L050 self-loopを再現した。

## 3. ROUND 2結果
受験者が回答前に見る `question/story/materials/fixedCell` のみで再攻撃。D001は元試算表9科目を資料と固定セルへ、F001は4つの整理後金額を再掲、L044〜L046は日付・証ひょう・摘要・金額を再掲した。資料は `renderMaterials()` がDOMへ描画する。全0は0/18点、空欄も0点。

## 4. ROUND 3 Red Team
30ケースを実施した。1 D001資料不足 PASS、2 全0 PASS、3 一部空欄 PASS、4 F001直接開始 PASS、5 L044直接開始 PASS、6 L045直接開始 PASS、7 L046直接開始 PASS、8 prerequisite逆転 PASS、9 self-loop PASS、10 graph参照不明 PASS、11 INVALID模試混入 PASS、12 手形Coverage CODE PASS/公式UNVERIFIED、13 整理後残高試算表 PASS、14 帳簿締切 PASS、15 iPhone最右列 STATIC PASS/実機UNVERIFIED、16 input focus STATIC PASS/実機UNVERIFIED、17 模試review PASS、18 SW旧cache PASS、19 全0 PASS、20 全空欄 PASS、21 fact source欠落 PASS、22 QUESTIONABLE模試混入 PASS、23 grading未検証混入 PASS、24 materials DOM消失 PASS、25 D001固定値再入力 PASS、26 F001不要な前問記憶 PASS、27 related重複 PASS、28 prerequisite自己参照 PASS、29 手形貸借一致 PASS、30 16px回帰 PASS。

## 5. OPEN ISSUE QUEUE
- P1-EXT-001: 2026年度日本商工会議所出題区分表の一次資料照合（HTTP 403）。
- P1-DEVICE-002: 実iPhone WebKitで最右列、focus、ズームを確認。
- P2-PSY-003: 全選択肢の人手によるDistractor A/B/C/D校閲。

## 6. D001再現結果
修正前FALSE、修正後TRUE。現金300,000円から保険料200,000円まで元試算表を回答前に表示する。

## 7. D001修正内容
元試算表をmaterialsと固定セルで明示し、整理・P/L・B/Sの非ゼロ18セルだけを操作対象とした。

## 8. D001採点妥当性
意味のないゼロを得点対象外とし、全0は0/18。完全正答は18/18。

## 9. L044現金出納帳
入金票50,000円、領収証18,000円を日付・摘要付きで表示。

## 10. L045当座預金出納帳
預入票300,000円、振込受付書85,000円を表示。

## 11. L046小口現金出納帳
通信費領収証4,800円、交通費精算書7,200円と同額補給条件を表示。

## 12. F001損益計算書
売上800,000、売上原価400,000、保険料160,000、減価償却費60,000を同画面へ再掲しStandalone化。

## 13. 模試Semantic Eligibility
`semanticStatus === VALID && gradingValidated === true && examEligible === true` のpoolだけからquota選出する。不足時は黙って不正問題を混ぜずfail closedする。

## 14. Knowledge Graph整合
学習順に対するprerequisite、self-loop、related重複をSemantic Validatorで検査。D001逆転とL050 self-loopを解消。

## 15. Semantic Validator
Structural Validatorとは別にrequiredFacts、factSources、dependencies、status、eligibility、grading、graphを検証する。

## 16. 全300問Semantic Audit
全件に `questionId/visibleInputs/requiredFacts/factSources/dependencies/semanticStatus/examEligible` を生成した。機械可読契約は全件通過したが、専門家による2026一次資料照合は未完。

## 17. VALID / QUESTIONABLE / INVALID件数
機械・ルール分類: VALID 300 / QUESTIONABLE 0 / INVALID 0。公式範囲監修は別の公開blockerとしてUNVERIFIED。

## 18. 2026年度Coverage Matrix
|公式論点|対応|成立問題数|問題ID|Semantic Validity|十分性|
|---|---|---:|---|---|---|
|約束手形の受入・振出・取立・支払|実装|3|J148-J150|VALID|公式照合UNVERIFIED|
|決算整理後残高試算表|実装|1|D019|VALID|基礎演習|
|帳簿締切|実装|1|D020|VALID|基礎演習|
|8桁精算表|実装|1|D001|VALID|成立|
|損益計算書|実装|1|F001|VALID|成立|

## 19. 手形
J148受入、J149振出、J150取立・支払を追加。一次資料の年度適用確認はUNVERIFIED。

## 20. 決算整理後残高試算表
D019で整理前残高・整理事項から整理後残高を完成する。

## 21. 帳簿締切
D020で収益・費用を損益へ、利益を繰越利益剰余金へ振り替える。

## 22. 8桁精算表Coverage
構造、元データ、一意性、採点、静的mobile対応はPASS。実機のみUNVERIFIED。

## 23. 損益計算書Coverage
必要データ、一意計算、本人入力、採点はPASS。

## 24. 問題重複
146テンプレート、反復群212/300前後。前回145/214から僅かに改善。

## 25. Chapter分布
Chapter 8は87/300（29%）で据置。集中は依然リスク。

## 26. Distractor Quality
位置分散は回帰なし。全件A/B/C/D人手校閲は未完でOPEN。

## 27. Knowledge Link
品質のない増量は行わず、既存linkの順序・自己参照を優先修正。

## 28. RPG残存課題
簿記能力と無関係な勝負回答倍率は将来のpsychometric課題。

## 29. iPhone UX
16px、44px、sticky先頭列、横scroll、pinch zoom許可を維持。実機確認はUNVERIFIED。

## 30. Regression Tests
SEMANTIC-D001/L044/L045/L046/F001、WORKSHEET-ZERO、GRAPH-ORDER/SELF、EXAM-VALIDITY、IOS-16PXを自動検査へ追加・維持した。

## 31. Accounting Invariants
仕訳貸借一致、表の入力型一致、D001の意味セル採点、P/L式、手形決済貸借を検査。

## 32. 残存リスク
一次資料403、実ブラウザー不在、全Distractor人手校閲未完。このためCOMPLETE条件を満たさない。

## 33. 修正前後スコア
|軸|Before|After|
|---|---:|---:|
|問題成立性|72|91|
|模試基盤|82|91|
|8桁精算表|45|88|
|損益計算書|55|88|
|2026公式Coverage|61|68（原典未検証のため抑制）|
|総合|67|76|

## 34. STATUS
**STATUS: INCOMPLETE**。コード内P0は解消したが、OPEN ISSUE QUEUEとUNVERIFIED重大項目が残る。

### 最終質問
Q1 YES / Q2 YES / Q3 YES / Q4 YES / Q5 YES / Q6 YES / Q7 YES / Q8 YES（機械監査範囲） / Q9 YES / Q10 YES / Q11 YES / Q12 NO（公式適用と十分量が未確認） / Q13 YES / Q14 YES / Q15 条件付きYES（実機未確認） / Q16 YES / Q17 YES（現データの機械・ルール監査。専門家監修は未実施） / Q18 YES / Q19 条件付きYES / Q20 YES（静的。実機未確認） / Q21 NO / Q22 条件付きYES。

### FINAL SELF-CRITIQUE
20項目を再確認した。特にanswerの存在と可解性を混同せず、special 5問は各根拠をDOMに描画されるmaterialsまで追跡した。公式原典と実機を確認できない状態をPASSへ丸めず、COMPLETEバイアスを退けた。
