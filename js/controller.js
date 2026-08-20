(function (root) {
  'use strict';
  const JOURNAL_GROUPS = [['現金','普通預金','当座預金','売掛金','買掛金'], ['仕入','売上','繰越商品','発送費','消耗品費'], ['備品','減価償却費','減価償却累計額','固定資産売却損'], ['資本金','繰越利益剰余金','損益','借入金']];
  class Controller {
    constructor(document, questions) {
      this.document = document; this.questions = questions; this.ids = Object.keys(questions); this.view = new root.AppView(document);
      this.model = new root.ProgressModel(questions, root.localStorage); this.rpg = new root.RPGModel(root.localStorage); this.currentId = null; this.expression = ''; this.calculatorTarget = null; this.examScores = [];
    }
    static accountChoices(question, correct) {
      const all = [...new Set(Object.values(root.QuestionData).filter(q => q.type === 'journal').flatMap(q => [...q.answer.debit, ...q.answer.credit].map(item => item.account)))];
      const related = JOURNAL_GROUPS.find(group => group.includes(correct)) || [];
      return [...new Set([correct, ...related, ...all])].slice(0, 5).sort(() => 0.5 - Controller.hash(`${question.id}-${correct}`));
    }
    static hash(text) { return ([...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 10) / 10; }
    init() { this.bindEvents(); this.renderModes(); this.view.updateRpg(this.rpg); this.showMode('story'); }
    bindEvents() {
      this.document.addEventListener('click', event => {
        const action = event.target.closest('[data-action]'); if (!action) return;
        const handlers = { mode: () => this.showMode(action.dataset.mode), start: () => this.start(action.dataset.questionId || this.modeIds()[0]), next: () => this.next(), save: () => this.saveDraft(true), calc: () => this.calcKey(action.dataset.calc), 'calc-insert': () => this.insertCalculatorResult(true) };
        if (handlers[action.dataset.action]) handlers[action.dataset.action]();
      });
      this.document.addEventListener('input', event => { if (event.target.matches('.amount-input')) { this.formatAmount(event.target); this.saveDraft(false); } });
      this.document.addEventListener('focusin', event => { if (event.target.matches('.amount-input:not(:disabled)')) this.selectCalculatorTarget(event.target); });
      this.document.addEventListener('change', event => { if (event.target.matches('.journal-row select')) { this.view.updateSelectTitle(event.target); this.saveDraft(false); } });
      this.document.getElementById('question-form').addEventListener('submit', event => {
        event.preventDefault();
        this.document.activeElement?.blur();
        this.submit();
      });
    }
    showMode(mode) { this.model.state.mode = mode; if (mode === 'exam') this.examScores = []; this.model.save(); this.view.show(`view-${mode}`); this.document.querySelectorAll('[data-action="mode"]').forEach(button => button.setAttribute('aria-current', button.dataset.mode === mode ? 'page' : 'false')); }
    modeIds() { const mode = this.model.state.mode; if (mode === 'review') return this.model.state.incorrectIds.length ? this.model.state.incorrectIds : this.ids; if (mode === 'exam') return this.ids.slice(-15); if (mode === 'training') return this.ids.filter(id => this.questions[id].type !== 'journal'); return this.ids; }
    renderModes() {
      const render = (id, ids) => { const list = this.document.getElementById(id); list.replaceChildren(...ids.slice(0, 30).map(qid => { const button = this.document.createElement('button'); button.type = 'button'; button.dataset.action = 'start'; button.dataset.questionId = qid; button.textContent = `${qid}｜${this.questions[qid].category}`; return button; })); };
      render('story-list', this.ids.filter(id => this.questions[id].type === 'journal')); render('training-list', this.ids.filter(id => this.questions[id].type !== 'journal')); render('review-list', this.modeIds()); render('exam-list', this.ids.slice(-15));
    }
    start(id) { this.currentId = id; this.model.state.currentQuestionId = id; this.model.save(); this.view.renderQuestion(this.questions[id], this.model.state.drafts[id]); this.view.show('view-question'); const firstAmount = this.document.querySelector('.amount-input:not(:disabled)'); if (firstAmount) this.selectCalculatorTarget(firstAmount); }
    saveDraft(message) { if (!this.currentId) return; this.model.setDraft(this.currentId, this.view.readAnswer(this.questions[this.currentId])); if (message) this.document.getElementById('save-status').textContent = '入力内容を保存しました。'; }
    submit() {
      const question = this.questions[this.currentId]; const answer = this.view.readAnswer(question); const score = root.GradingEngine.grade(question, answer);
      if (this.model.state.mode === 'exam') {
        this.examScores.push({ id: question.id, score });
        const ids = this.modeIds(); const next = ids[ids.indexOf(this.currentId) + 1];
        if (next) return this.start(next);
        const earned = this.examScores.reduce((sum, item) => sum + item.score.earned, 0); const possible = this.examScores.reduce((sum, item) => sum + item.score.possible, 0);
        this.view.result({ explanation: '模擬試験を終了しました。復習モードで誤答した論点を確認しましょう。' }, { correct: earned === possible, earned, possible });
        this.view.show('view-result'); return;
      }
      this.model.record(question.id, score.correct); this.rpg.reward(question, score); this.view.updateRpg(this.rpg); this.view.result(question, score); this.view.show('view-result');
    }
    next() { const ids = this.modeIds(); const next = ids[ids.indexOf(this.currentId) + 1]; if (next) this.start(next); else { this.renderModes(); this.showMode(this.model.state.mode); } }
    formatAmount(input) {
      const before = input.value;
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
      const target = this.calculatorTarget;
      if (!target || !this.document.body.contains(target)) { this.document.getElementById('calculator-target').textContent = '先に金額欄を選んでください'; return; }
      if (shouldCalculate) { try { this.expression = String(root.SafeCalculator.evaluate(this.expression)); } catch (_) { this.expression = 'エラー'; } }
      const amount = Number(this.expression);
      if (!Number.isFinite(amount) || amount < 0) { this.document.getElementById('calculator-target').textContent = '0以上の計算結果を確認してください'; this.updateCalculatorDisplay(); return; }
      target.value = String(Math.round(amount)); this.formatAmount(target); this.saveDraft(false);
      this.updateCalculatorDisplay();
      this.document.getElementById('calculator-target').textContent = `${target.getAttribute('aria-label')}へ${target.value}円を入力しました`;
    }
    calcKey(key) {
      if (key === 'AC') this.expression = ''; else if (key === 'C') this.expression = this.expression.slice(0, -1); else if (key === '＝') { this.insertCalculatorResult(true); return; } else { if (this.expression === 'エラー') this.expression = ''; this.expression += key; }
      this.updateCalculatorDisplay();
    }
  }
  root.AppController = Controller;
}(window));
