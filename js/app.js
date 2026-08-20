// =========================================
// アプリコントローラー・状態管理 (仕様書34, 39, 43対応)
// =========================================
const App = {
  currentQuestionId: null,
  questionIds: [],
  accountNames: [],
  storageKey: 'boki-rpg-progress-v1',
  progressState: { currentQuestionId: null, answeredIds: [], drafts: {}, completed: false },
  calculatorExpression: '',
  calculatorTarget: null,

  accountTypes: {
    '現金': '資産', '小口現金': '資産', '普通預金': '資産', '当座預金': '資産', '現金過不足': '仮勘定',
    '受取商品券': '資産', '売掛金': '資産', 'クレジット売掛金': '資産', '未収利息': '資産', '前払金': '資産',
    '仮払金': '資産', '立替金': '資産', '差入保証金': '資産', '電子記録債権': '資産', '貸付金': '資産',
    '繰越商品': '資産', '備品': '資産', '貯蔵品': '資産', '仮払消費税': '資産', '前払保険料': '資産',
    '減価償却累計額': '資産の控除科目', '貸倒引当金': '資産の控除科目',
    '買掛金': '負債', '未払利息': '負債', '未払金': '負債', '前受金': '負債', '仮受金': '負債',
    '電子記録債務': '負債', '借入金': '負債', '仮受消費税': '負債', '未払消費税': '負債',
    '所得税預り金': '負債', '社会保険料預り金': '負債', '前受家賃': '負債', '未払法人税等': '負債',
    '資本金': '純資産', '繰越利益剰余金': '純資産', '損益': '決算振替勘定',
    '仕入': '費用', '発送費': '費用', '消耗品費': '費用', '保険料': '費用', '支払利息': '費用',
    '給料': '費用', '法定福利費': '費用', '固定資産売却損': '費用', '減価償却費': '費用',
    '貸倒引当金繰入': '費用', '支払手数料': '費用', '旅費交通費': '費用', '通信費': '費用',
    '租税公課': '費用', '法人税、住民税及び事業税': '費用',
    '売上': '収益', '受取家賃': '収益', '受取利息': '収益'
  },

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
    this.accountNames = [...new Set(this.questionIds.reduce((accounts, id) => {
      const answer = QuestionData[id].answer;
      return accounts.concat([...answer.debit, ...answer.credit].map(item => item.account));
    }, []))].sort((a, b) => a.localeCompare(b, 'ja'));
    this.loadProgress();
    this.setupCalculator();
    this.renderTableOfContents();
    const resumeId = this.progressState.currentQuestionId;
    if (resumeId && this.questionIds.includes(resumeId) && !this.progressState.completed) {
      const button = document.getElementById('story-start-button');
      button.textContent = `続き（問題${this.questionIds.indexOf(resumeId) + 1}）から再開する`;
      button.onclick = () => this.startQuestion(resumeId);
    }
  },

  loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      if (saved && typeof saved === 'object') {
        this.progressState = {
          currentQuestionId: saved.currentQuestionId || null,
          answeredIds: Array.isArray(saved.answeredIds) ? saved.answeredIds.filter(id => this.questionIds.includes(id)) : [],
          drafts: saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {},
          completed: Boolean(saved.completed)
        };
      }
    } catch (error) {
      console.warn('保存データを読み込めませんでした。', error);
    }
  },

  persistProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progressState));
    } catch (error) {
      console.warn('進捗を保存できませんでした。', error);
    }
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
    container.innerHTML = '';

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
        const answerItem = q.answer[side][index];
        const correctAccount = answerItem ? answerItem.account : undefined;
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
    this.setupCalculatorTargets();
    this.restoreDraft(q.id);
    container.querySelectorAll('select, input').forEach(field => {
      field.addEventListener('change', () => this.saveDraft(false));
      field.addEventListener('input', () => this.saveDraft(false));
    });
  },

  getDraft() {
    const read = side => [...document.querySelectorAll(`.${side}-account`)].map((account, index) => ({
      account: account.value,
      amount: document.querySelectorAll(`.${side}-amount`)[index].value
    }));
    return { debit: read('debit'), credit: read('credit') };
  },

  saveDraft(showMessage) {
    if (!this.currentQuestionId) return;
    this.progressState.currentQuestionId = this.currentQuestionId;
    this.progressState.drafts[this.currentQuestionId] = this.getDraft();
    this.persistProgress();
    if (showMessage) {
      const status = document.getElementById('save-status');
      status.textContent = 'この問題の入力内容と進捗を保存しました。';
      window.setTimeout(() => { status.textContent = ''; }, 2500);
    }
  },

  restoreDraft(questionId) {
    const draft = this.progressState.drafts[questionId];
    if (!draft) return;
    ['debit', 'credit'].forEach(side => {
      const accounts = document.querySelectorAll(`.${side}-account`);
      const amounts = document.querySelectorAll(`.${side}-amount`);
      (draft[side] || []).forEach((item, index) => {
        if (accounts[index]) accounts[index].value = item.account || '';
        if (amounts[index]) amounts[index].value = item.amount || '';
      });
    });
  },

  updateProgress() {
    const index = this.questionIds.indexOf(this.currentQuestionId);
    document.getElementById('progress').textContent =
      `問題 ${index + 1} / ${this.questionIds.length}｜解答済み ${this.progressState.answeredIds.length} 問`;
  },

  renderTableOfContents() {
    const container = document.getElementById('table-of-contents');
    if (!container) return;
    container.innerHTML = '';
    const chapters = [...new Set(this.questionIds.map(id => QuestionData[id].chapter))];

    chapters.forEach(chapter => {
      const ids = this.questionIds.filter(id => QuestionData[id].chapter === chapter);
      const completed = ids.filter(id => this.progressState.answeredIds.includes(id)).length;
      const details = document.createElement('details');
      details.className = 'toc-chapter';
      if (this.currentQuestionId && ids.includes(this.currentQuestionId)) details.open = true;
      const firstQuestion = QuestionData[ids[0]];
      details.innerHTML = `<summary><span class="toc-chapter-number">第${chapter}章</span><span class="toc-chapter-title">${firstQuestion.scene}</span><span class="toc-chapter-count">${completed}/${ids.length}</span></summary>`;
      const questions = document.createElement('div');
      questions.className = 'toc-questions';
      ids.forEach(id => {
        const question = QuestionData[id];
        const button = document.createElement('button');
        const isCompleted = this.progressState.answeredIds.includes(id);
        button.type = 'button';
        button.className = `toc-question${isCompleted ? ' completed' : ''}`;
        button.innerHTML = `<span>${isCompleted ? '✓' : this.questionIds.indexOf(id) + 1}</span><strong>${question.category}</strong><small>${isCompleted ? '解答済み' : `難易度 ${question.difficulty}`}</small>`;
        button.setAttribute('aria-label', `問題${this.questionIds.indexOf(id) + 1} ${question.category}${isCompleted ? ' 解答済み' : ''}`);
        button.addEventListener('click', () => this.startQuestion(id));
        questions.appendChild(button);
      });
      details.appendChild(questions);
      container.appendChild(details);
    });
    document.getElementById('toc-progress').textContent = `${this.progressState.answeredIds.length} / ${this.questionIds.length} 問完了`;
  },

  showTableOfContents() {
    if (document.getElementById('view-question').classList.contains('active')) {
      this.saveDraft(false);
    }
    this.renderTableOfContents();
    this.switchView('view-story');
    document.getElementById('toc-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    this.progressState.currentQuestionId = qId;
    this.progressState.completed = false;
    this.persistProgress();
    this.updateProgress();
    document.getElementById('save-status').textContent = '';

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
    if (!this.progressState.answeredIds.includes(this.currentQuestionId)) {
      this.progressState.answeredIds.push(this.currentQuestionId);
    }
    delete this.progressState.drafts[this.currentQuestionId];
    const currentIndex = this.questionIds.indexOf(this.currentQuestionId);
    this.progressState.currentQuestionId = this.questionIds[currentIndex + 1] || null;
    this.progressState.completed = !this.progressState.currentQuestionId;
    this.persistProgress();
    
    // 結果表示画面の構築
    const resultBox = document.getElementById('result-status');
    if (isCorrect) {
      resultBox.textContent = "正解です！";
      resultBox.className = "result-box result-correct";
    } else {
      resultBox.textContent = "もう一歩です";
      resultBox.className = "result-box result-incorrect";
    }

    this.renderCorrectJournal(q.answer);
    this.renderExplanation(q);
    
    this.switchView('view-result');
  },

  renderCorrectJournal(answer) {
    const rows = Math.max(answer.debit.length, answer.credit.length);
    const cells = side => Array.from({ length: rows }, (_, index) => {
      const item = answer[side][index];
      return item ? `<td>${item.account}</td><td class="journal-amount">${item.amount.toLocaleString('ja-JP')}円</td>` : '<td></td><td></td>';
    });
    const debit = cells('debit');
    const credit = cells('credit');
    document.getElementById('correct-journal').innerHTML = `
      <h3>正しい仕訳</h3>
      <div class="journal-table-wrap"><table class="journal-table">
        <thead><tr><th colspan="2">借方</th><th colspan="2">貸方</th></tr></thead>
        <tbody>${debit.map((value, index) => `<tr>${value}${credit[index]}</tr>`).join('')}</tbody>
      </table></div>`;
  },

  renderExplanation(q) {
    const accounts = [...new Set([...q.answer.debit, ...q.answer.credit].map(item => item.account))];
    const classifications = accounts.map(account =>
      `<li><strong>${account}</strong>：${this.accountTypes[account] || '分類未設定'}</li>`).join('');
    const explanation = document.getElementById('explanation');
    explanation.innerHTML = '';
    const text = document.createElement('div');
    text.className = 'explanation-text';
    text.textContent = q.explanation;
    explanation.appendChild(text);
    explanation.insertAdjacentHTML('beforeend', `<h3>科目の分類</h3><ul class="account-types">${classifications}</ul>`);
  },

  setupCalculator() {
    document.getElementById('calculator-keys').addEventListener('click', event => {
      const calculatorKey = event.target.closest('[data-calc]');
      const key = calculatorKey ? calculatorKey.dataset.calc : null;
      if (!key) return;
      if (key === 'AC') this.calculatorExpression = '';
      else if (key === 'C') this.calculatorExpression = this.calculatorExpression.slice(0, -1);
      else if (key === '＝') {
        this.calculateResult();
        this.insertCalculatorResult(false);
      }
      else this.calculatorExpression += key;
      this.updateCalculatorDisplay();
    });
    document.getElementById('calculator-insert').addEventListener('click', () => this.insertCalculatorResult());
  },

  setupCalculatorTargets() {
    this.calculatorTarget = null;
    document.querySelectorAll('.amount-input:not(:disabled)').forEach(input => {
      input.addEventListener('focus', () => this.selectCalculatorTarget(input));
      input.addEventListener('click', () => this.selectCalculatorTarget(input));
    });
    const firstAmount = document.querySelector('.amount-input:not(:disabled)');
    if (firstAmount) this.selectCalculatorTarget(firstAmount);
  },

  selectCalculatorTarget(input) {
    document.querySelectorAll('.amount-input').forEach(field => field.classList.toggle('calculator-selected', field === input));
    this.calculatorTarget = input;
    document.getElementById('calculator-target').textContent = `${input.getAttribute('aria-label')}へ入力します`;
  },

  insertCalculatorResult(shouldCalculate = true) {
    if (!this.calculatorTarget || !document.body.contains(this.calculatorTarget)) {
      document.getElementById('calculator-target').textContent = '先に仕訳の金額欄を選んでください';
      return;
    }
    if (shouldCalculate) this.calculateResult();
    const amount = Number(this.calculatorExpression);
    if (!Number.isFinite(amount) || amount < 0) {
      document.getElementById('calculator-target').textContent = '0以上の計算結果を確認してください';
      return;
    }
    this.calculatorTarget.value = Math.round(amount).toLocaleString('ja-JP');
    this.calculatorTarget.dispatchEvent(new Event('input', { bubbles: true }));
    this.updateCalculatorDisplay();
    const targetName = this.calculatorTarget.getAttribute('aria-label');
    this.calculatorTarget.focus();
    document.getElementById('calculator-target').textContent = `${targetName}へ${this.calculatorTarget.value}円を入力しました`;
  },

  calculateResult() {
    const normalized = this.calculatorExpression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/＋/g, '+')
      .replace(/−/g, '-');
    if (!normalized || !/^[0-9+*/.() -]+$/.test(normalized)) return;
    try {
      const result = Function(`"use strict"; return (${normalized})`)();
      this.calculatorExpression = Number.isFinite(result) ? String(Math.round((result + Number.EPSILON) * 1e10) / 1e10) : 'エラー';
    } catch (error) {
      this.calculatorExpression = 'エラー';
    }
  },

  updateCalculatorDisplay() {
    document.getElementById('calculator-display').value = this.calculatorExpression || '0';
  },

  nextStep() {
    const currentIndex = this.questionIds.indexOf(this.currentQuestionId);
    const nextQuestionId = this.questionIds[currentIndex + 1];

    if (nextQuestionId) {
      this.startQuestion(nextQuestionId);
      return;
    }

    this.progressState.currentQuestionId = null;
    this.progressState.completed = true;
    this.persistProgress();
    this.renderTableOfContents();

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
