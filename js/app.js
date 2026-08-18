// =========================================
// アプリコントローラー・状態管理 (仕様書34, 39, 43対応)
// =========================================
const App = {
  currentQuestionId: null,

  // ★追加：画面起動時の初期設定
  init() {
    // 金額入力欄に「自動カンマ付与」の機能を設定
    document.querySelectorAll('.amount-input').forEach(input => {
      input.addEventListener('input', function() {
        // 入力された文字から、数字以外（カンマなど）を一旦取り除く
        let value = this.value.replace(/[^0-9]/g, '');
        // 3桁区切りのカンマ付き文字列に変換して戻す
        if (value) {
          this.value = parseInt(value, 10).toLocaleString('ja-JP');
        } else {
          this.value = '';
        }
      });
    });
  },
  
  switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  },

  startQuestion(qId) {
    this.currentQuestionId = qId;
    const q = QuestionData[qId];
    
    // UIの初期化
    document.getElementById('q-category').textContent = `分野: ${q.category} (Chapter ${q.chapter})`;
    document.getElementById('q-text').textContent = q.question;
    
    // 入力欄のリセット
    document.querySelector('.debit-account').value = "";
    document.querySelector('.debit-amount').value = "";
    document.querySelector('.credit-account').value = "";
    document.querySelector('.credit-amount').value = "";

    this.switchView('view-question');
  },

  submitAnswer() {
    // UIから値を取得
    const dAcc = document.querySelector('.debit-account').value;
    // ★修正：入力された文字列からカンマ(,)を取り除いて数値に変換する
    const dAmtStr = document.querySelector('.debit-amount').value.replace(/,/g, '');
    const dAmt = parseInt(dAmtStr, 10);

    const cAcc = document.querySelector('.credit-account').value;
    const cAmtStr = document.querySelector('.credit-amount').value.replace(/,/g, '');
    const cAmt = parseInt(cAmtStr, 10);

    // 入力チェック
    if (!dAcc || isNaN(dAmt) || !cAcc || isNaN(cAmt)) {
      alert("勘定科目と金額を正しく入力してください。");
      return;
    }

    const userAnswer = {
      debit: [{ account: dAcc, amount: dAmt }],
      credit: [{ account: cAcc, amount: cAmt }]
    };

    const q = QuestionData[this.currentQuestionId];
    
    // 採点実行
    const isCorrect = GradingEngine.gradeJournalEntry(userAnswer, q.answer);
    
    // 結果表示画面の構築
    const resultBox = document.getElementById('result-status');
    if (isCorrect) {
      resultBox.textContent = "正解！";
      resultBox.className = "result-box result-correct";
    } else {
      resultBox.textContent = "不正解...";
      resultBox.className = "result-box result-incorrect";
    }

    document.getElementById('explanation').innerText = q.explanation;
    
    this.switchView('view-result');
  },

  nextStep() {
    alert("次のストーリー展開、または次の問題へ移行する処理をここに実装します。");
    this.switchView('view-story');
  }
};

// ★追加：HTMLの読み込みが終わったら初期設定を実行
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
