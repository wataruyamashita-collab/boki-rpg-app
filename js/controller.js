(function (root) {
  'use strict';
  const normalizeNumber = value => String(value ?? '')
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  const getStorage = () => {
    try { return root.localStorage; } catch (_) { return null; }
  };
  const JOURNAL_GROUPS = [['現金','普通預金','当座預金','売掛金','買掛金'], ['仕入','売上','繰越商品','発送費','消耗品費'], ['備品','減価償却費','減価償却累計額','固定資産売却損'], ['資本金','繰越利益剰余金','損益','借入金']];
  class Controller {
    constructor(document, questions) {
      this.document = document; this.questions = questions; this.ids = Object.keys(questions); this.view = new root.AppView(document);
      const storage = getStorage();
      this.model = new root.ProgressModel(questions, storage); this.rpg = new root.RPGModel(storage); this.currentId = null; this.expression = '0'; this.calculatorTarget = null; this.examScores = [];
      this.calculator = { accumulator: null, operator: null, waitingForOperand: false, lastOperator: null, lastOperand: null };
      this.filters = { query: '', account: '', mistakes: 'all' };
      this.submitting = false;
    }
    static accountChoices(question, correct, mode = 'story') {
      const all = [...new Set(Object.values(root.QuestionData).filter(q => q.type === 'journal').flatMap(q => [...q.answer.debit, ...q.answer.credit].map(item => item.account)))];
      if (mode === 'exam') return all.sort((a, b) => a.localeCompare(b, 'ja'));
      const related = JOURNAL_GROUPS.find(group => group.includes(correct)) || [];
      return [...new Set([correct, ...related, ...all])].slice(0, 5).sort(() => 0.5 - Controller.hash(`${question.id}-${correct}`));
    }
    static hash(text) { return ([...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 10) / 10; }
    init(route = {}) {
      this.bindEvents(); this.populateAccountFilter(); this.renderModes(); this.view.updateRpg(this.rpg);
      const mode = ['story', 'training', 'review', 'exam'].includes(route.mode) ? route.mode : 'story';
      this.showMode(mode);
      if (typeof route.questionId === 'string' && this.questions[route.questionId]) this.start(route.questionId);
    }
    bindEvents() {
      this.document.addEventListener('click', event => {
        const action = event.target.closest('[data-action]'); if (!action) return;
        const handlers = { mode: () => this.showMode(action.dataset.mode), start: () => this.start(action.dataset.questionId || this.modeIds()[0]), next: () => this.next(), save: () => this.saveDraft(true), calc: () => this.calcKey(action.dataset.calc), 'calc-insert': () => this.insertCalculatorResult(false), 'filter-reset': () => this.resetFilters(), 'retry-mode': () => this.restartAfterGameOver(false), 'review-game-over': () => this.restartAfterGameOver(true) };
        if (handlers[action.dataset.action]) handlers[action.dataset.action]();
      });
      this.document.addEventListener('input', event => { if (event.target.matches('.amount-input')) { this.formatAmount(event.target); this.saveDraft(false); } });
      this.document.addEventListener('focusin', event => { if (event.target.matches('.amount-input:not(:disabled)')) this.selectCalculatorTarget(event.target); });
      this.document.addEventListener('change', event => { if (event.target.matches('.journal-row select')) { this.view.updateSelectTitle(event.target); this.saveDraft(false); } });
      this.document.getElementById('filter-query').addEventListener('input', event => { this.filters.query = event.target.value; this.renderModes(); });
      ['filter-account', 'filter-mistakes'].forEach(id => this.document.getElementById(id).addEventListener('change', event => { this.filters[id === 'filter-account' ? 'account' : 'mistakes'] = event.target.value; this.renderModes(); }));
      this.document.getElementById('question-form').addEventListener('submit', event => {
        event.preventDefault();
        this.document.activeElement?.blur();
        this.submit();
      });
    }
    showMode(mode) { this.model.state.mode = mode; if (mode === 'exam') this.examScores = []; this.model.save(); this.view.show(`view-${mode}`); this.document.getElementById('question-filters').hidden = false; this.document.querySelectorAll('[data-action="mode"]').forEach(button => button.setAttribute('aria-current', button.dataset.mode === mode ? 'page' : 'false')); }
    modeIds() { const mode = this.model.state.mode; if (mode === 'review') return this.model.state.incorrectIds.length ? this.model.state.incorrectIds : this.ids; if (mode === 'exam') return this.ids.slice(-15); if (mode === 'training') return this.ids.filter(id => this.questions[id].type !== 'journal'); return this.ids; }
    questionAccounts(question) { return question.type === 'journal' ? [...question.answer.debit, ...question.answer.credit].map(item => item.account) : []; }
    populateAccountFilter() {
      const select = this.document.getElementById('filter-account');
      [...new Set(this.ids.flatMap(id => this.questionAccounts(this.questions[id])))].sort((a, b) => a.localeCompare(b, 'ja')).forEach(account => select.append(new Option(account, account)));
    }
    filteredIds(ids) {
      const normalized = this.filters.query.trim().toLocaleLowerCase('ja');
      const matches = ids.filter(id => {
        const question = this.questions[id]; const accounts = this.questionAccounts(question);
        const searchable = [id, question.category, question.question, question.scene, question.story, ...accounts].filter(Boolean).join(' ').toLocaleLowerCase('ja');
        if (normalized && !searchable.includes(normalized)) return false;
        if (this.filters.account && !accounts.includes(this.filters.account)) return false;
        const count = this.model.state.mistakeCounts[id] || 0;
        if (this.filters.mistakes === 'incorrect' && !this.model.state.incorrectIds.includes(id)) return false;
        if ((this.filters.mistakes === 'attempted' || this.filters.mistakes === 'frequent') && count === 0) return false;
        return true;
      });
      if (this.filters.mistakes === 'frequent') matches.sort((a, b) => (this.model.state.mistakeCounts[b] || 0) - (this.model.state.mistakeCounts[a] || 0));
      return matches;
    }
    resetFilters() {
      this.filters = { query: '', account: '', mistakes: 'all' };
      this.document.getElementById('filter-query').value = ''; this.document.getElementById('filter-account').value = ''; this.document.getElementById('filter-mistakes').value = 'all'; this.renderModes();
    }
    renderModes() {
      const render = (id, ids) => { const filtered = this.filteredIds(ids); const list = this.document.getElementById(id); list.replaceChildren(...filtered.map(qid => { const button = this.document.createElement('button'); button.type = 'button'; button.dataset.action = 'start'; button.dataset.questionId = qid; const mistakes = this.model.state.mistakeCounts[qid] || 0; button.textContent = `${qid}｜${this.questions[qid].category}${mistakes ? `｜誤答 ${mistakes}回` : ''}`; return button; })); return filtered.length; };
      const counts = [render('story-list', this.ids.filter(id => this.questions[id].type === 'journal')), render('training-list', this.ids.filter(id => this.questions[id].type !== 'journal')), render('review-list', this.model.state.incorrectIds.length ? this.model.state.incorrectIds : this.ids), render('exam-list', this.ids.slice(-15))];
      const modeIndex = ['story', 'training', 'review', 'exam'].indexOf(this.model.state.mode); const count = counts[Math.max(modeIndex, 0)]; this.document.getElementById('filter-status').textContent = `${count}問を表示しています。`;
    }
    start(id) { if (!this.questions[id]) return; this.submitting = false; this.currentId = id; this.model.state.currentQuestionId = id; this.model.save(); this.view.renderQuestion(this.questions[id], this.model.state.drafts[id], this.model.state.mode); this.view.show('view-question'); this.document.getElementById('question-filters').hidden = true; const firstAmount = this.document.querySelector('.amount-input:not(:disabled)'); if (firstAmount) this.selectCalculatorTarget(firstAmount); }
    saveDraft(message) { if (!this.currentId) return; this.model.setDraft(this.currentId, this.view.readAnswer(this.questions[this.currentId])); if (message) this.document.getElementById('save-status').textContent = '入力内容を保存しました。'; }
    submit() {
      if (this.submitting || !this.currentId || !this.questions[this.currentId]) return;
      this.submitting = true;
      const question = this.questions[this.currentId]; const answer = this.view.readAnswer(question); const score = root.GradingEngine.grade(question, answer);
      const confidence = this.document.querySelector('input[name="confidence"]:checked')?.value || 'careful';
      this.model.record(question.id, score.correct);
      if (score.correct) this.rpg.reward(question, score, confidence === 'bold' ? 3 : 1);
      this.rpg.applyAnswer(score.correct, confidence);
      if (this.model.state.mode === 'exam') {
        this.examScores.push({ id: question.id, score });
        if (this.rpg.state.companyHP === 0) { this.view.updateRpg(this.rpg); this.showGameOver(); return; }
        const ids = this.modeIds(); const next = ids[ids.indexOf(this.currentId) + 1];
        if (next) return this.start(next);
        const earned = this.examScores.reduce((sum, item) => sum + item.score.earned, 0); const possible = this.examScores.reduce((sum, item) => sum + item.score.possible, 0);
        this.view.updateRpg(this.rpg);
        this.view.result({ explanation: '模擬試験を終了しました。復習モードで誤答した論点を確認しましょう。' }, { correct: earned === possible, earned, possible });
        this.view.show('view-result'); return;
      }
      this.view.updateRpg(this.rpg); this.view.result(question, score, answer); this.view.show('view-result');
      if (this.rpg.state.companyHP === 0) this.showGameOver();
    }
    next() { const ids = this.modeIds(); const next = ids[ids.indexOf(this.currentId) + 1]; if (next) this.start(next); else { this.renderModes(); this.showMode(this.model.state.mode); } }
    formatAmount(input) {
      const before = normalizeNumber(input.value);
      const selectionStart = input.selectionStart ?? before.length;
      const selectionEnd = input.selectionEnd ?? selectionStart;
      const selectionDirection = input.selectionDirection || 'none';
      const digitOffset = position => before.slice(0, position).replace(/\D/g, '').length;
      const digits = before.replace(/\D/g, '');
      const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const caretAt = offset => {
        if (offset === 0) return 0;
        let seen = 0;
        for (let position = 0; position < formatted.length; position += 1) {
          if (/\d/.test(formatted[position])) seen += 1;
          if (seen === offset) return position + 1;
        }
        return formatted.length;
      };
      input.value = formatted;
      input.setSelectionRange?.(caretAt(digitOffset(selectionStart)), caretAt(digitOffset(selectionEnd)), selectionDirection);
    }
    selectCalculatorTarget(input) {
      this.document.querySelectorAll('.amount-input').forEach(field => field.classList.toggle('calculator-selected', field === input));
      this.calculatorTarget = input; this.document.getElementById('calculator-target').textContent = `${input.getAttribute('aria-label')}へ入力します`;
    }
    formatCalculatorExpression(expression) {
      return String(expression).replace(/\d+(?:\.\d*)?/g, numberText => {
        const [integer, decimal] = numberText.split('.');
        const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return decimal === undefined ? formatted : `${formatted}.${decimal}`;
      });
    }
    updateCalculatorDisplay() { this.document.getElementById('calculator-display').value = this.formatCalculatorExpression(this.expression) || '0'; }
    insertCalculatorResult(shouldCalculate) {
      const selectedTarget = this.document.querySelector?.('.amount-input.calculator-selected');
      const target = this.document.body.contains(this.calculatorTarget) ? this.calculatorTarget : selectedTarget;
      if (!target || target.disabled || !this.document.body.contains(target)) { this.document.getElementById('calculator-target').textContent = '先に金額欄を選んでください'; return; }
      this.calculatorTarget = target;
      if (shouldCalculate) { try { this.expression = String(root.SafeCalculator.evaluate(this.expression)); } catch (_) { this.expression = 'エラー'; } }
      const amount = Number(this.expression);
      if (!Number.isFinite(amount) || amount < 0) { this.document.getElementById('calculator-target').textContent = '0以上の計算結果を確認してください'; this.updateCalculatorDisplay(); return; }
      target.value = String(Math.round(amount)); this.formatAmount(target); this.saveDraft(false);
      this.updateCalculatorDisplay();
      this.document.getElementById('calculator-target').textContent = `${target.getAttribute('aria-label')}へ${target.value}円を入力しました`;
    }
    calcKey(key) {
      if (key === 'AC') this.clearCalculator();
      else if (key === 'C') { this.expression = '0'; this.calculator.waitingForOperand = false; }
      else if (key === '＝') this.calculateEquals();
      else if (['＋', '−', '×', '÷'].includes(key)) this.setOperator(key);
      else this.inputCalculatorDigit(key);
      this.updateCalculatorDisplay();
    }
    clearCalculator() {
      this.expression = '0'; this.calculator = { accumulator: null, operator: null, waitingForOperand: false, lastOperator: null, lastOperand: null };
    }
    inputCalculatorDigit(key) {
      if (this.expression === 'エラー' || this.calculator.waitingForOperand) { this.expression = '0'; this.calculator.waitingForOperand = false; }
      if (key === '.') { if (!this.expression.includes('.')) this.expression += '.'; return; }
      const next = this.expression === '0' ? key.replace(/^0+(?=\d)/, '') : this.expression + key;
      if (next.replace(/[-.]/g, '').length <= 12) this.expression = next || '0';
    }
    operate(left, operator, right) {
      return root.SafeCalculator.evaluate(`${left}${operator}${right}`);
    }
    setOperator(operator) {
      const value = Number(this.expression);
      if (!Number.isFinite(value)) return this.clearCalculator();
      if (this.calculator.operator && !this.calculator.waitingForOperand) this.calculator.accumulator = this.operate(this.calculator.accumulator, this.calculator.operator, value);
      else if (this.calculator.accumulator === null) this.calculator.accumulator = value;
      this.expression = String(this.calculator.accumulator); this.calculator.operator = operator; this.calculator.waitingForOperand = true;
      this.calculator.lastOperator = null; this.calculator.lastOperand = null;
    }
    calculateEquals() {
      let operator = this.calculator.operator; let operand = Number(this.expression); const repeating = !operator && this.calculator.lastOperator;
      if (repeating) { operator = this.calculator.lastOperator; operand = this.calculator.lastOperand; }
      if (!operator || this.calculator.accumulator === null) return;
      if (this.calculator.waitingForOperand && !repeating) operand = this.calculator.accumulator;
      try {
        const result = this.operate(this.calculator.accumulator, operator, operand);
        this.expression = String(result); this.calculator.accumulator = result; this.calculator.lastOperator = operator; this.calculator.lastOperand = operand; this.calculator.operator = null; this.calculator.waitingForOperand = true;
      } catch (_) { this.expression = 'エラー'; this.calculator.accumulator = null; this.calculator.operator = null; }
    }
    showGameOver() {
      const dialog = this.document.getElementById('game-over-dialog');
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    }
    restartAfterGameOver(review) {
      const dialog = this.document.getElementById('game-over-dialog'); dialog.close?.(); dialog.removeAttribute('open');
      this.rpg.resetCompanyHP(); this.view.updateRpg(this.rpg); this.renderModes();
      if (review) { this.showMode('review'); return; }
      if (this.model.state.mode === 'exam') this.examScores = [];
      const first = this.modeIds()[0];
      if (first) this.start(first); else this.showMode(this.model.state.mode);
    }
  }
  root.AppController = Controller;
}(window));
