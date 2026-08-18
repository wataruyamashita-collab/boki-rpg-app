// =========================================
// アプリコントローラー・状態管理 (仕様書34, 39, 43対応)
// =========================================
const App = {
  currentQuestionId: null,
  questionIds: [],
  accountNames: [],

  // ★追加：画面起動時の初期設定
  init() {
    this.questionIds = Object.keys(QuestionData).filter(id => QuestionData[id].type === 'journal');
    this.accountNames = [...new Set(this.questionIds.flatMap(id => {
      const answer = QuestionData[id].answer;
      return [...answer.debit, ...answer.credit].map(item => item.account);
    }))].sort((a, b) => a.localeCompare(b, 'ja'));
  },

  setupAmountInputs() {
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

  createAccountSelect(side, rowNumber) {
    const select = document.createElement('select');
    select.className = `${side}-account`;
    select.setAttribute('aria-label', `${side === 'debit' ? '借方' : '貸方'} ${rowNumber}行目の勘定科目`);
    select.innerHTML = '<option value="">--勘定科目--</option>';
    this.accountNames.forEach(account => {
      const option = document.createElement('option');
      option.value = account;
      option.textContent = account;
      select.appendChild(option);
    });
    return select;
  },

  renderJournalRows(q) {
    const rowCount = Math.max(q.answer.debit.length, q.answer.credit.length);
    const container = document.getElementById('journal-container');
    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'journal-header';
    header.innerHTML = '<span>借方</span><span aria-hidden="true"></span><span>貸方</span>';
    container.appendChild(header);

    for (let index = 0; index < rowCount; index += 1) {
      const row = document.createElement('div');
      row.className = 'journal-row';

      ['debit', 'credit'].forEach((side, sideIndex) => {
        const journalSide = document.createElement('div');
        journalSide.className = 'journal-side';
        journalSide.appendChild(this.createAccountSelect(side, index + 1));

        const amount = document.createElement('input');
        amount.type = 'text';
        amount.className = `${side}-amount amount-input`;
        amount.placeholder = '金額';
        amount.inputMode = 'numeric';
        amount.setAttribute('aria-label', `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`);
        journalSide.appendChild(amount);
        row.appendChild(journalSide);

        if (sideIndex === 0) {
          const divider = document.createElement('div');
          divider.className = 'divider';
          divider.textContent = '｜';
          row.appendChild(divider);
        }
      });
      container.appendChild(row);
    }
    this.setupAmountInputs();
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
    this.renderJournalRows(q);

    this.switchView('view-question');
  },

  submitAnswer() {
    const readSide = side => [...document.querySelectorAll(`.${side}-account`)].map((account, index) => {
      const amountText = document.querySelectorAll(`.${side}-amount`)[index].value.replace(/,/g, '');
      return { account: account.value, amount: Number.parseInt(amountText, 10) };
    }).filter(item => item.account || !Number.isNaN(item.amount));

    const debit = readSide('debit');
    const credit = readSide('credit');
    const hasInvalidRow = [...debit, ...credit].some(item => !item.account || Number.isNaN(item.amount));

    if (hasInvalidRow || debit.length === 0 || credit.length === 0) {
      alert("勘定科目と金額を正しく入力してください。");
      return;
    }

    const userAnswer = { debit, credit };

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
    const currentIndex = this.questionIds.indexOf(this.currentQuestionId);
    const nextQuestionId = this.questionIds[currentIndex + 1];

    if (nextQuestionId) {
      this.startQuestion(nextQuestionId);
      return;
    }

    document.getElementById('story-title').textContent = '仕訳問題を完了しました！';
    document.getElementById('story-content').innerHTML = '<p>全ての仕訳問題への取り組み、お疲れさまでした。</p>';
    document.getElementById('story-start-button').hidden = true;
    this.switchView('view-story');
  }
};

// ★追加：HTMLの読み込みが終わったら初期設定を実行
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
