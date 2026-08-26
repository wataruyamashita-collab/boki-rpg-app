# PROFESSIONAL EDITORIAL AUDIT RECOVERY STATUS

監査日: 2026-08-26  
Truth source: `data/questions.js`

## Conclusion

**REOPEN — 100 / 100 は宣言しない。** 既存matrixの `VERIFIED` 表示を独立証拠とは扱わない。今回、Finding B–Eの再現可能な欠陥を修正したが、独立会計oracleはまだ全300問を覆わず、Exam Readiness Auditも3/10である。したがって、既存matrixと旧98点自己評価は完成証拠として無効である。

Evidence taxonomy: runtimeテストで再現できた項目だけを `VERIFIED`、静的な別管理fingerprintを `SOURCE-SUPPORTED` とする。fingerprintはsource改ざん検出用であり、会計上の期待値をfactsから導出する独立oracleとは主張しない。

## Verified fixes

| ID/domain | Before | Root cause | After | Evidence level |
|---|---|---|---|---|
| J001/J005/J141/E002ほかsource mutation | source load前にanswerを変えるとsnapshot型keyも一緒に変わりVALIDになり得た | `QuestionData.answer` 読込後の自己snapshot | 300問の静的review fingerprintをanswerとは別に保持し、semantic validation時に照合。既知4例を含むsource-before-load 13件を検出 | SOURCE-SUPPORTED（integrity。独立会計oracleではない） |
| Wrong-answer feedback | 未定義科目が「AはAとして認識」の循環文へfallback | 勘定定義不足とcheckerが名称包含だけを検査 | 全選択肢科目へ区別可能な定義を追加。checkerは循環句、未登録定義、差異説明、再利用可能ruleを検査 | VERIFIED（252/252、generic 0） |
| Knowledge Links | 26 edge中、review/exam targetをControllerが拒否 | link authoringと公開policyの不整合 | 学習順を壊さない既習core問題へedgeを再authoring。全27 edgeを `openRelated()` で遷移確認 | VERIFIED（27/27） |
| L042 | 金額2欄と合計だけを採点 | 表示資料を能力測定と誤認 | 受取日、振出人、振出日、満期日、支払場所、摘要、金額を2行とも入力・採点 | VERIFIED（15欄） |
| L043 | 金額2欄と合計だけを採点 | 表示資料を能力測定と誤認 | 振出日、受取人、満期日、支払場所、摘要、金額を2行とも入力・採点 | VERIFIED（13欄） |

## Mutation results

```text
Source-before-load mutations exercised: 13
Detected: 13
Missed: 0
Detection rate: 100%
```

対象にはJ001 wrong account、J005 wrong account、J141 wrong account、E002 wrong debit account、J004、D019、F001、D020、L039、L040、L044、T001、E001を含む。なおfingerprint gateだけで会計正しさを証明したとは扱わない。

## Knowledge Link E2E

```text
Total: 27
Opened through openRelated(): 27
Blocked: 0
Broken: 0
```

テストは各source/target edgeを列挙し、Controllerがtrueを返し、`start(target)`へ同一IDを渡すところまで確認する。Exam候補を直接指定するnegative testも引き続き拒否を確認する。

## Feedback gate

```text
Misconception pairs: 252
Specific under strengthened checker: 252
Generic/circular: 0
Fallback: 0
```

checkerはwrong/correct名称の存在だけで合格にせず、概念差、問題への接続、次回使えるrule、および禁止循環句を検査する。

## Remaining hard gates / WHY NOT 100

- Independent accounting evidence: facts + rulesからanswer非依存で導出できない問題が残る。review fingerprintはこの不足を代替しない。
- 25問×12 batchの新しい独立editorial evidenceは未完成。既存 `question-audit-matrix.json` のgeneric findingは信用しない。
- Exam Readinessは3/10。仕訳、仕訳帳、総勘定元帳、受取/支払手形記入帳、固定資産、初見転移がFAIL/B/Cであり、transfer全件VERIFIEDとはしない。
- よって二回連続のglobal red-team clean pass、300/300 full evidence gate、Professional Editorial Audit 100は未成立。

## Commands and results

- `npm test`: PASS（300問data、semantic、source mutations、252 feedback、27 Knowledge Link edges、L042/L043 transfer inputを含む）。
- `npm run typecheck`: PASS。
- `npm run audit:exam`: FAIL (3/10)。assertion/thresholdは変更していない。

## Change risk

変更範囲は教材データ、誤答feedback、監査checker、回帰テスト、release cache coherenceに限定した。review spacing、Placement、RPG progression、CSS、iPhone zoom挙動は変更していない。`data/questions.js` と `js/feedback.js` の配信更新に伴い、HTML asset queryとService Worker releaseを同じ値へ更新した。
