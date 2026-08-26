# 日商簿記3級 経理シミュレーションRPG

簿記を使って会社の課題を解決しながら、仕訳から試算表・元帳・精算表・財務諸表までを学ぶ、ブラウザー完結型の学習アプリです。外部ライブラリやビルド工程を必要とせず、全300問を収録しています。

## アーキテクチャ

ブラウザー標準APIのみを使ったMVC構成です。実行時のゼロ依存・ビルドフリーを維持しながら、`types/domain.d.ts` で問題・回答・進捗の契約を型として管理しています。

- **Model**: `ProgressModel` がモード、回答状況、復習対象、下書きを、`RPGModel` が経験値、レベル、役割、分野別習熟度を管理します。状態は `localStorage` に永続化されます。
- **View**: `AppView` が問題タイプに応じて横型仕訳または表入力UIを生成します。Viewは採点や画面遷移を判断しません。
- **Controller**: `AppController` がイベントデリゲーション、モード遷移、回答確定、Model更新を統括します。
- **Domain services**: `GradingEngine` が仕訳と表問題を採点し、`SafeCalculator` が字句解析と演算子優先順位に基づいて数式を評価します。

```
.
├── index.html                 # 各モードと回答画面のセマンティックな骨格
├── css/style.css              # iPhone対応、横型仕訳、スクロール可能な表
├── data/questions.js          # 300問の問題データ
├── js/
│   ├── app.js                 # 起動処理
│   ├── controller.js          # Controller / 状態遷移
│   ├── view.js                # View / DOMジェネレーター
│   ├── model.js               # 学習進捗Model
│   ├── rpg.js                 # RPG・習熟度Model
│   ├── engine.js              # 共通採点エンジン
│   └── calculator.js          # 安全な四則演算パーサー
├── tests/app.test.js          # 回帰・不変条件テスト
├── types/domain.d.ts          # 問題・回答・進捗のTypeScript型契約
├── manifest.webmanifest       # インストール可能なPWAの設定
├── service-worker.js          # アプリシェルのオフラインキャッシュ
└── docs/master_specification.md
```

## ローカル実行

リポジトリのルートで静的HTTPサーバーを起動し、表示されたURLをブラウザーで開きます。

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

`file://` で直接開く方法ではなくHTTPサーバーを推奨します。進捗をリセットする場合は、ブラウザーの開発者ツールで当該オリジンのLocal Storageを消去してください。

初回アクセス後はアプリシェルと全問題データがService Workerへ保存され、オフラインでも学習できます。対応ブラウザーではホーム画面へのインストールも可能です。

## 問題検索と復習

各モードの問題一覧は、問題文・カテゴリ・勘定科目をキーワード検索できます。勘定科目の指定、現在の復習対象、過去に間違えた問題への絞り込みにも対応し、「間違いが多い順」では端末に保存された累積誤答回数を基準に並べ替えます。

## テスト

Node.js 18以降で、依存パッケージのインストールなしに実行できます。

```bash
npm ci
npm test
```

`npm test` はアプリ回帰、Service Worker、データ、誤答フィードバック、エンゲージメント監査を同じコマンドで実行します。試験準備度の厳格な未達ゲートも確認する場合は `npm run audit:exam` を実行してください。

TypeScriptが利用できる開発環境では、段階的移行用の型定義も検証できます（アプリの実行にはTypeScriptもビルドも不要です）。

```bash
tsc --noEmit
```

テストは安全な数式評価、ゼロ除算と不正トークンの拒否、仕訳採点、表のセル単位部分採点、経験値の二重付与防止、4モードのHTML構造、インラインイベントハンドラの不在を検証します。
