# 第6次 AI Loop 教材完成度監査（2026-08-24）

## 1. Executive Summary

現行300問を独立再計測し、模試レビューの内部JSON露出を廃止した。低価値な同型問題9問を、8桁精算表、損益計算書、主要補助簿、移動平均法、3伝票制へ置換した。問題数は300を維持すること自体を目的にせず、既存IDによる学習履歴互換のため置換を選んだ。公式サイトへのネットワーク接続が拒否されたため2026公式原典との最終照合とiPhone実機確認は `UNVERIFIED`。したがって公開判定は **INCOMPLETE** とする。

## 2. ROUND 1 — VERIFY & PATCH

`node scripts/audit-data.js` で不足論点が全て0件、Chapter 8が94問、同型問題223問であることを再現。模試結果が `pre` と `JSON.stringify` で内部形式を表示することも確認した。レビューを仕訳表またはセル名・値の定義リストへ変更し、D001/F001/L044–L050を教材価値の高い問題へ置換した。

## 3. ROUND 2 — ADVERSARIAL AUDIT

空欄と0の区別、全角数字、精算表104セルの部分採点、4組の貸借一致、P/L利益式、移動平均数量・単価、既存先入先出法、知識リンク先ID、模試時間境界を別経路で検証した。新規P0はなかった。

## 4. ROUND 3 Red Team

| # | 攻撃 | 結果 |
|--:|---|---|
|1|旧Service Worker cache|PASS: activate削除|
|2|新旧JS混在|PASS: query完全一致|
|3|模試終了後Back|PASS: sessionなし回答画面を拒否|
|4|模試再試験|PASS: new session|
|5|iPhone input focus|コードPASS、実機UNVERIFIED|
|6|iPhone landscape|静的PASS、実機UNVERIFIED|
|7|320px模試結果長文|DOM/CSS PASS、実機UNVERIFIED|
|8|320px 8桁精算表|横スクロール・sticky PASS|
|9|精算表最右列|1180px表内で到達可能|
|10|P/L利益不一致|テストで拒否|
|11|商品有高帳移動平均|PASS: L049|
|12|重複問題連続出題|改善したが残存|
|13|明らかなDistractor|UNVERIFIED: 全件意味監査未完|
|14|related link循環|循環しても手動遷移のみ。自動ループなし|
|15|RPG HP=0|既存復帰導線PASS|
|16|精算表の空欄を0扱い|PASS: 空欄は不正解|
|17|全角・半角混在|PASS|
|18|不正URLのrelated ID|存在確認して無視|
|19|模試FINISHED後submit|PASS|
|20|オフラインnavigation|PASS|
|21|壊れたlocalStorage|PASS|
|22|連続submit|PASS|
|23|精算表の借貸逆転|セル採点で検出|
|24|P/L費用二重計上|式テストPASS|
|25|移動平均の数量不整合|20個−12個=8個、8,800円を確認|

## 5. OPEN ISSUE QUEUE

- P1 EDU-2026-001 `UNVERIFIED`: 2026年度公式出題区分表を公式原典と再照合（ネットワーク403）。
- P1 IOS-REAL-001 `UNVERIFIED`: iPhone Chrome実機でfocus、pinch zoom、320/375/390/430pxレビューを確認。
- P2 DIST-001: 全選択肢の意味的Distractor A–D人手監査とC/D置換。
- P2 DUP-001: 同型問題214/300、同型解説257/300、同型story 292/300が残る。
- P2 RPG-001: HP損失が簿記能力と直接対応しない旧設計が残る。
- P2 RELEASE-001: release文字列はHTML/SW/testの複数箇所。ビルド不要方針との比較設計が必要。
- P2 EDU-HANDNOTE-001: 手形論点の2026公式範囲該当性を原典で確定するまで追加しない。

## 6. 技術基盤回帰結果

Unit、状態機械、データ監査、型検査はPASS。Browser E2Eはブラウザーバイナリ不在でUNVERIFIED。

## 7. Service Worker

`RELEASE=20260824-6`、release付きcache、navigation Network First、旧cache削除、`ignoreSearch:true`不在を確認。単一ソース化は静的配布を複雑化させない代案が未確定。

## 8. 模試

60分、15問、未回答拒否、終了時刻ちょうどの採点拒否、EXPIRED/FINISHING/FINISHEDからの更新拒否、履歴、再試験sessionを回帰確認。

## 9. iPhone入力自動ズーム

input/select/textareaおよび精算表inputは16px。viewportに `maximum-scale=1` と `user-scalable=no` はない。実機はUNVERIFIED。

## 10. iPhone模試結果レビュー

`pre` と `JSON.stringify` を削除。仕訳は借方・金額・貸方・金額の表、表問題は定義リスト、解説は折返し可能な文章で表示する。

## 11. 2026公式Coverage Matrix

原典再取得不能のため最終的な公式母集団の完全性はUNVERIFIED。以下は現行問題の学習行動監査結果。

| 公式論点 | 対応 | 問題ID（代表） | 問題数 | 問題形式 | 十分性 |
|---|---|---|---:|---|:---:|
|現金・預金の仕訳|済|J002ほか|複数|仕訳|A|
|現金出納帳|済|L044|1|帳簿完成|B|
|当座預金出納帳|済|L045|1|帳簿完成|B|
|小口現金出納帳|済|L046|1|帳簿完成|B|
|仕入帳|済|L047|1|帳簿完成|B|
|売上帳|済|L048|1|帳簿完成|B|
|売掛金元帳|済|既存L群|複数|元帳|B|
|買掛金元帳|済|既存L群|複数|元帳|B|
|商品有高帳|済|既存L群/L049|複数|帳簿完成|A|
|先入先出法|済|既存L群|複数|商品有高帳|B|
|移動平均法|済|L049|1|商品有高帳計算|B|
|固定資産台帳|済|既存L群|複数|台帳|B|
|電子記録債権・債務|済|既存J群|複数|仕訳|B|
|3伝票制|済|L050|1|取引から伝票判断|B|
|残高試算表|済|T001–T040|40|表完成|A|
|決算整理仕訳|済|J/D群|複数|仕訳・表|A|
|8桁精算表|済|D001|1|104セル完成|B|
|損益計算書|済|F001|1|4項目完成|B|
|貸借対照表|済|F002–F010|9|表完成|A|
|手形|未確定|—|0|—|D/UNVERIFIED|

## 12. 対応済み論点

上表の「済」。存在語ではなく、学習者が金額・科目・残高を入力する行動を確認した。

## 13. 未対応論点

公式原典照合が未完のため手形を未確定とする。1問のみのB評価論点には反復不足がある。

## 14. 8桁精算表

D001は科目列＋試算表/修正記入/P/L/B/S各借貸の8列、13科目、当期純利益、104入力セルを持つ。sticky header/科目列と横スクロールを使用し16px未満へ縮小しない。

## 15. 損益計算書

F001で売上高、売上原価、費用、当期純利益を入力し、800,000−400,000−220,000=180,000を検証する。

## 16. 補助簿

L044–L048へ現金・当座預金・小口現金の各出納帳、仕入帳、売上帳を追加。

## 17. 商品有高帳・移動平均法

既存先入先出法を保持。L049は20個を平均単価1,100円とし、12個払出13,200円、8個残高8,800円を完成する。

## 18. 伝票・手形

L050は実取引から入金・出金・振替伝票を判断する。手形は年度範囲の公式確認待ち。

## 19. 300問重複分析

Before 136/91/44 unique、反復群223/266/294。After 145/100/47 unique、反復群214/257/292。改善は限定的でキュー継続。

## 20. Chapter分布

After: 1:9, 2:18, 3:21, 4:12, 5:21, 6:15, 7:45, 8:87, 9:12, 10:35, 11:3, 12:22。Chapter 8は94→87（31.3%→29.0%）。番号移動でなく問題置換による減少。

## 21. Distractor Quality

正解5位置分布はPASS。全選択問題の意味評価A–Dは未完で、位置品質と内容品質を混同せずOPENとした。

## 22. 探求心

`prerequisite/related/nextConcept/reviewOf` と「理解をつなぐ次の一歩」を導入。対象は新規重点問題のみで全体展開は未完。

## 23. RPG心理設計

知識リンクで理解駆動を強めたが、旧HP罰設計は残存。意味的融合は条件付き。

## 24. iPhone UX

320pxを想定しレビューは固定幅JSONを廃止。8桁表は意図的な局所横スクロール。実機確認なし。

## 25. Browser E2E

環境にChromium/ChromeがなくUNVERIFIED。DOM単体・静的CSS検査で代替したがPASS扱いしない。

## 26. Accounting Invariants

仕訳、試算表、精算表4区分、P/L、B/S、在庫数量・金額の各不変条件をテストまたはデータ監査した。

## 27. 回帰テスト

`node tests/app.test.js`、`node tests/service-worker.test.js`、`node scripts/audit-data.js`、`tsc --noEmit`、`git diff --check` はPASS。

## 28. 残存リスク

公式原典、実機iPhone、実ブラウザE2E、Distractor全件、重複、RPG融合が残る。

## 29. 修正前後スコア

|項目|Before|After|
|---|---:|---:|
|コード品質|89|90|
|Service Worker / 配布|84|84|
|自動テスト|86|90|
|状態遷移|88|88|
|模試基盤|80|88|
|iPhone静的UX|88|91|
|問題データ構造|91|93|
|既存問題の簿記品質|84|85|
|2026 Coverage|55|76|
|問題多様性|45|51|
|Distractor|50|50|
|ストーリー|54|54|
|探求心|55|62|
|RPG融合|52|53|
|30日継続性|46|48|
|総合|70|76|

## 30. STATUS / 最終質問

**STATUS: INCOMPLETE**

Q1 YES / Q2 YES / Q3 YES / Q4 UNVERIFIED / Q5 YES / Q6 UNVERIFIED / Q7 YES / Q8 YES / Q9 YES / Q10 YES / Q11 YES / Q12 NO / Q13 YES / Q14 条件付きYES / Q15 条件付きYES / Q16 条件付きYES / Q17 条件付きYES / Q18 条件付きYES / Q19 条件付きYES / Q20 条件付きYES

### Final self-critique

3 Roundと25攻撃を実施した。Queueは空でなく、実機・Browser E2E・公式原典をPASSへ偽装していない。16pxとpinch zoomを維持し、JSON露出を除去した。商品有高帳と先入先出法を保持し、移動平均を別に追加した。`worksheet`名ではなく8列構造を検証し、P/L type名ではなく利益式を検証した。重複・Distractor・RPGの未完成を過大評価していない。
