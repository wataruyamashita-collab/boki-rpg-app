# Foundation v1.0 — 要求・実行の入口

改訂: 2026-10-07。対象: `wataruyamashita-collab/boki-rpg-app`。
このファイルは索引であり、別工程表でも実装完了の証明でもない。

| 内容 | 正本・参照先 |
|---|---|
| 何を作るか・学習思想・UX・他社研究・製品境界 | [既存仕様書のProduct Charter](master_specification.md) |
| 何を満たせばFoundation完成か | [Foundation Acceptance](FOUNDATION_V1_ACCEPTANCE.md) |
| 毎回どう実行するか・Codex・CI・マージ | [AGENTS.md](../AGENTS.md) |
| 何を次に行うか | [既存Roadmap #177](https://github.com/wataruyamashita-collab/boki-rpg-app/issues/177)と[現況 #153](https://github.com/wataruyamashita-collab/boki-rpg-app/issues/153) |
| 判断経緯・技術判断 | [台帳 #144](https://github.com/wataruyamashita-collab/boki-rpg-app/issues/144)、各IssueのDesign LockとPR |

## 出所と差分

最新指示は「正確無比・実行最適化 統合開発プロンプト」（2026-10-07受領、0〜44節）。
原本UTF-8 SHA-256: `6286616fde9b160f61d9de003ef4416dc48d3ed24411cb939ee6c332d363ad6d`。
LF正規化SHA-256: `8fd907979419827e25e5de62fefec352c695775e4876affca56f25e8746dc491`。

旧全文（25、25-1〜25-7を含む）は[元コミット1ed5adf](https://github.com/wataruyamashita-collab/boki-rpg-app/blob/1ed5adfba49579695fa414fb50398bbaff23657a/docs/FOUNDATION_V1_MASTER_PROMPT.md)に保持する。
元のGit blobは `dcbddf0833e49a2a92127f754d64eaa3aa6593de`。履歴を切り捨てず、全文を複数の正本へ増殖させない。

新指示の0〜10節・33節の製品/情報保護原則はCharter/AGENTS、11〜14節・40〜41節の文書/差分運用はこの索引/AGENTS、15〜19節・42〜43節のDoD/拡張/P0〜P2はAcceptance、20〜38節・44節の実行/検証/報告はAGENTSと既存台帳へ分担する。
旧機能構想は長期方針として維持し、最新指示が任意化した高度AI、Knowledge Graph、全上位級教材や装飾をFoundation必須にしない。
文書整理は今回の差分を一度処理した後、完成を妨げる最短経路上の実装へ戻る。要求、実装、検証、Acceptedを混同しない。
