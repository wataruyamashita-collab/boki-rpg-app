// =========================================
// アプリコントローラー・状態管理 (仕様書34, 39)
// =========================================
const App = {
  currentQuestionId: null,
  
  switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  },

  startQuestion(qId) {
    this.currentQuestionId = qId;
    // ※QuestionDataは後ほど別ファイルから読み込まれます
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
    const dAmt = parseInt(document.querySelector('.debit-amount').value, 10);
    const cAcc = document.querySelector('.credit-account').value;
    const cAmt = parseInt(document.querySelector('.credit-amount').value, 10);

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
    
    // 採点実行 (engine.jsのGradingEngineを呼び出し)
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
    // 例: 進捗の保存、レベルアップ判定などを挟み、次のIDへ遷移
    this.switchView('view-story');
  }
};
