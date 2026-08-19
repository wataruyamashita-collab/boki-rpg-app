// =========================================
// アプリコントローラー・状態管理 (仕様書34, 39, 43対応)
// =========================================
const App = {
  currentQuestionId: null,
  questionIds: [],
  accountNames: [],

  // 同じ取引で混同しやすい科目をまとめ、全科目を並べずに判断できるようにする。
  accountConfusionGroups: [
    ['現金', '小口現金', '普通預金', '当座預金', '現金過不足', '受取商品券'],
    ['売掛金', '買掛金', '未収利息', '未払利息', '未払金', 'クレジット売掛金'],
    ['前払金', '前受金', '仮払金', '仮受金', '立替金', '差入保証金'],
    ['電子記録債権', '電子記録債務', '売掛金', '買掛金', '貸付金', '借入金'],
    ['仕入', '売上', '繰越商品', '発送費', '消耗品費', '貯蔵品'],
    ['備品', '消耗品費', '減価償却費', '減価償却累計額', '固定資産売却損', '貯蔵品'],
    ['保険料', '前払保険料', '支払利息', '未払利息', '受取利息', '未収利息'],
    ['受取家賃', '前受家賃', '売上', '前受金', '受取利息', '未収利息'],
    ['仮払消費税', '仮受消費税', '未払消費税', '租税公課', '未払法人税等', '法人税、住民税及び事業税'],
    ['給料', '所得税預り金', '社会保険料預り金', '法定福利費', '立替金', '未払金'],
    ['貸倒引当金', '貸倒引当金繰入', '売掛金', '固定資産売却損', '減価償却累計額', '減価償却費'],
    ['資本金', '繰越利益剰余金', '損益', '借入金', '売上', '仕入'],
    ['支払手数料', '旅費交通費', '通信費', '発送費', '雑費', '消耗品費']
  ],

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

  getAccountChoices(correctAccount) {
    const relatedAccounts = this.accountConfusionGroups
      .filter(group => group.includes(correctAccount))
      .flat()
      .filter((account, index, accounts) => account !== correctAccount && accounts.indexOf(account) === index);
    const fallbackAccounts = this.accountNames.filter(account =>
      account !== correctAccount && !relatedAccounts.includes(account)
    );

    const choices = [correctAccount, ...relatedAccounts, ...fallbackAccounts].slice(0, 5);
    let seed = `${this.currentQuestionId}-${correctAccount}`
      .split('')
      .reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0);

    // 問題を開き直しても並びは変えず、正答だけが常に先頭になることは避ける。
    for (let index = choices.length - 1; index > 0; index -= 1) {
      seed = ((seed * 1664525) + 1013904223) >>> 0;
      const swapIndex = seed % (index + 1);
      [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
    }
    return choices;
  },

  createAccountSelect(side, rowNumber, correctAccount) {
    const select = document.createElement('select');
    select.className = `${side}-account`;
    select.setAttribute('aria-label', `${side === 'debit' ? '借方' : '貸方'} ${rowNumber}行目の勘定科目`);
    select.innerHTML = `<option value="">${correctAccount ? '--勘定科目--' : '--入力なし--'}</option>`;
    select.disabled = !correctAccount;
    if (!correctAccount) return select;

    this.getAccountChoices(correctAccount).forEach(account => {
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
        const correctAccount = q.answer[side][index]?.account;
        journalSide.appendChild(this.createAccountSelect(side, index + 1, correctAccount));

        const amount = document.createElement('input');
        amount.type = 'text';
        amount.className = `${side}-amount amount-input`;
        amount.placeholder = '金額';
        amount.inputMode = 'numeric';
        amount.setAttribute('aria-label', `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`);
        amount.disabled = !correctAccount;
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
    document.getElementById('q-category').textContent = `第${q.chapter}章｜分野：${q.category}`;
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
      alert("借方・貸方の勘定科目と金額を、すべて入力してください。");
      return;
    }

    const userAnswer = { debit, credit };

    const q = QuestionData[this.currentQuestionId];
    
    // 採点実行
    const isCorrect = GradingEngine.gradeJournalEntry(userAnswer, q.answer);
    
    // 結果表示画面の構築
    const resultBox = document.getElementById('result-status');
    if (isCorrect) {
      resultBox.textContent = "正解です！";
      resultBox.className = "result-box result-correct";
    } else {
      resultBox.textContent = "もう一歩です";
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

    document.getElementById('story-title').textContent = 'すべての仕訳問題が終了しました！';
    document.getElementById('story-content').innerHTML = '<p>すべての仕訳問題に取り組みました。お疲れさまでした。</p>';
    document.getElementById('story-start-button').hidden = true;
    this.switchView('view-story');
  }
};

// ★追加：HTMLの読み込みが終わったら初期設定を実行
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
