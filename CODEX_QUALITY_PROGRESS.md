# 教材品質是正 Evidence（2026-09-02）

## 判定

- 工程: Loop 0〜7 実装・静的検証完了
- runtime対象: 300問
- explanation audit: PASS 300 / FAIL 0
- iPhone: STATIC VERIFIED / BROWSER UNVERIFIED / DEVICE UNVERIFIED

## Baseline（是正前）

`reports/baseline-20260902/explanation-metrics.json` の実測値を固定した。旧ゲートは PASS していたが、150〜350文字外が248問、固有文字数100未満が230問、journal正答科目coverageが58/150だった。

## 是正後の機械計測

`npm run audit:explanation-metrics` の出力を根拠とする。

| 指標 | 実測 |
|---|---:|
| 総問題数 | 300 |
| journal | 150 / 150 PASS |
| ledger | 50 / 50 PASS |
| trial_balance | 40 / 40 PASS |
| correction | 20 / 20 PASS |
| worksheet | 20 / 20 PASS |
| financial_statement | 10 / 10 PASS |
| comprehensive | 10 / 10 PASS |
| 固有文字数100以上 | 300 / 300 |
| journal正答科目coverage | 150 / 150 |
| journal正答金額coverage | 150 / 150 |
| journal借貸理由coverage | 150 / 150 |
| table回答値coverage | 150 / 150 |
| 完全重複解説 | 0 |

長い説明単位の反復は212件を診断値として報告する。分類原則など、複数問で共通する会計上の説明を含むためであり、完全に同一の解説は品質ゲートでFAILする。

## UI Evidence

- 貸借対照表: 資産と負債・純資産を左右表示し、負債の部と純資産の部に表示ラベルと境界線を付与。
- 入力mapping: 各入力行の `inputCellId` を問題データで宣言し、rendererの科目名推測を廃止。
- mobile static: 320 / 375 / 390 / 430pxで、科目240px・金額120pxの4列を縮小せず横スクロールする契約をテスト。
- ブラウザおよび実iPhone: 未検証。静的検証と混同しない。

## Mutation Evidence

`tests/explanation-audit-regression.test.js` は、J149一般論化、借方科目削除、貸方科目削除、正答金額削除、借貸理由削除、F003一般論化・計算過程削除、T039一般論化、およびF002以外299問の一般論化をFAILさせる。B/S mappingとmobile幅は `tests/quality-regressions.test.js` と `tests/mobile-layout.test.js` が回帰検出する。
