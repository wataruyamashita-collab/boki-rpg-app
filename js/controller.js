(function (root) {
  'use strict';
  const normalizeNumber = value => String(value ?? '')
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  const getStorage = () => {
    try { return root.localStorage; } catch (_) { return null; }
  };
  // 同じ会計的性質の科目を先に提示し、単なる見た目の5択ではなく識別学習にする。
  const JOURNAL_GROUPS = [
    ['現金','普通預金','当座預金','小口現金','現金過不足'],
    ['売掛金','受取手形','電子記録債権','未収入金','未収収益','クレジット売掛金'],
    ['買掛金','支払手形','電子記録債務','未払金','未払費用','借入金'],
    ['仕入','売上','繰越商品','仕入返品','売上返品'],
    ['旅費交通費','通信費','水道光熱費','消耗品費','支払家賃','租税公課'],
    ['備品','減価償却費','減価償却累計額','固定資産売却損','固定資産売却益'],
    ['資本金','繰越利益剰余金','損益','受取利息','償却債権取立益']
  ];
  const EXAM_DURATION_MS = 60 * 60 * 1000;
  const EXAM_POINTS = Object.freeze([9, 9, 9, 9, 9, 5, 5, 5, 5, 6, 6, 6, 6, 6, 5]);
  class Controller {
    constructor(document, questions) {
      this.document = document; this.questions = questions; this.ids = Object.keys(questions); this.view = new root.AppView(document);
      const storage = getStorage();
      this.model = new root.ProgressModel(questions, storage); this.rpg = new root.RPGModel(storage); this.currentId = null; this.questionStartedAt = null; this.reviewSourceId = null; this.reviewMappings = new Map(); this.expression = '0'; this.calculatorTarget = null; this.examTimerId = null;
      this.calculator = { accumulator: null, operator: null, waitingForOperand: false, lastOperator: null, lastOperand: null };
      this.filters = { query: '', account: '', mistakes: 'all' };
      this.submitting = false;
      // 問題データは起動中不変なので、300問の監査は初期化時に一度だけ行う。
      this.semanticAudit = root.validateSemanticQuestionData(this.questions);
    }
    static accountChoices(question, correct, mode = 'story') {
      const all = [...new Set(Object.values(root.QuestionData).filter(q => q.type === 'journal').flatMap(q => [...q.answer.debit, ...q.answer.credit].map(item => item.account)))];
      if (mode === 'exam') return all.sort((a, b) => a.localeCompare(b, 'ja'));
      const related = JOURNAL_GROUPS.find(group => group.includes(correct)) || [];
      const seed = `${question.id}:${correct}`;
      const choices = Controller.seededShuffle([...new Set([correct, ...related, ...all])].slice(0, 5), seed);
      const current = choices.indexOf(correct); const target = Controller.hash(seed) % choices.length;
      [choices[current], choices[target]] = [choices[target], choices[current]];
      return choices;
    }
    static hash(text) {
      let hash = 2166136261;
      for (const char of String(text)) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
      return hash >>> 0;
    }
    static seededShuffle(values, seed) {
      const shuffled = [...values]; let state = Controller.hash(seed) || 0x9e3779b9;
      const random = () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
      for (let index = shuffled.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]; }
      return shuffled;
    }
    init(route = {}) {
      this.bindEvents(); this.populateAccountFilter(); this.renderModes(); this.view.updateRpg(this.rpg);
      const mode = ['story', 'training', 'review', 'exam'].includes(route.mode) ? route.mode : 'story';
      this.showMode(mode);
      if (typeof route.questionId === 'string' && this.questions[route.questionId] && (mode !== 'exam' || this.modeIds().includes(route.questionId))) this.start(route.questionId);
    }
    bindEvents() {
      this.document.addEventListener('click', event => {
        const action = event.target.closest('[data-action]'); if (!action) return;
        const handlers = { mode: () => this.showMode(action.dataset.mode), start: () => this.start(action.dataset.questionId || this.modeIds()[0]), next: () => this.next(), save: () => this.saveDraft(true), 'finish-exam': () => this.finishExam(false), 'exam-home': () => this.leaveExamResult('story'), 'exam-review': () => this.leaveExamResult('review'), 'exam-retry': () => this.retryExam(), calc: () => this.calcKey(action.dataset.calc), 'calc-insert': () => this.insertCalculatorResult(false), 'filter-reset': () => this.resetFilters(), 'retry-mode': () => this.restartAfterGameOver(false), 'review-game-over': () => this.restartAfterGameOver(true), 'open-related': () => { const id = action.dataset.questionId; if (this.questions[id]) { this.model.setMode('training'); this.renderModes(); this.start(id); } } };
        if (handlers[action.dataset.action]) handlers[action.dataset.action]();
      });
      this.document.addEventListener('input', event => { if (event.target.matches('.amount-input')) this.formatAmount(event.target); if (event.target.matches('.amount-input, .table-text-input')) this.saveDraft(false); });
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
    showMode(mode) {
      this.model.state.mode = mode;
      if (mode === 'exam') this.ensureExamSession();
      else this.stopExamTimer();
      this.model.save(); this.view.show(`view-${mode}`); this.document.getElementById('question-filters').hidden = mode === 'exam';
      this.document.body?.classList?.toggle('exam-active', mode === 'exam');
      this.document.querySelectorAll('[data-action="mode"]').forEach(button => button.setAttribute('aria-current', button.dataset.mode === mode ? 'page' : 'false'));
      if (mode === 'exam') { this.updateExamStatus(); this.startExamTimer(); }
    }
    leaveExamResult(mode) { this.currentId = null; this.showMode(mode); this.renderModes(); }
    retryExam(now = Date.now()) {
      this.model.state.examSession = null; this.currentId = null;
      const session = this.ensureExamSession(now);
      this.showMode('exam'); this.renderModes();
      if (session.ids[0]) this.start(session.ids[0]);
      return session;
    }
    buildExamIds() {
      const quota = { journal: 5, ledger: 2, trial_balance: 2, correction: 2, worksheet: 2, financial_statement: 1, comprehensive: 1 };
      const attempt = Number(this.model.state.examAttempt || 0);
      const semanticAudit = this.semanticAudit || root.validateSemanticQuestionData(this.questions);
      const eligible = new Set(semanticAudit.eligibleIds);
      return Object.entries(quota).flatMap(([type, count]) => { const pool = this.ids.filter(id => this.questions[id].type === type && eligible.has(id)); if (pool.length < count) throw new Error(`独立Semantic監査済みの${type}問題が不足しています`); const start = (attempt * count) % pool.length; return Array.from({ length: count }, (_, index) => pool[(start + index) % pool.length]); });
    }
    storyIds() {
      const flow = { journal: 0, ledger: 1, trial_balance: 2, correction: 3, worksheet: 4, financial_statement: 5, comprehensive: 6 };
      return this.ids.map((id, index) => ({ id, index })).sort((left, right) => {
        const a = this.questions[left.id]; const b = this.questions[right.id];
        return a.chapter - b.chapter || flow[a.type] - flow[b.type] || left.index - right.index;
      }).map(item => item.id);
    }
    reviewIds() {
      const due = this.model.dueReviewIds();
      this.reviewMappings = new Map();
      if (due.length) return due.map(sourceId => {
        const source = this.questions[sourceId];
        const stage = this.model.state.reviewSchedule[sourceId]?.stage || 0;
        const existing = this.model.state.reviewAssignments?.[sourceId];
        const scheduledIds = new Set(Object.keys(this.model.state.reviewSchedule));
        const assignedIds = new Set(Object.values(this.model.state.reviewAssignments || {}).filter(item => item?.status === 'assigned' && item.sourceQuestionId !== sourceId).map(item => item.reviewQuestionId));
        const variants = this.model.recommendedIds(source.category).filter(id => id !== sourceId && !scheduledIds.has(id) && !assignedIds.has(id) && !this.reviewMappings.has(id));
        const persistedIsSafe = existing && existing.status === 'assigned' && existing.stage === stage && existing.dueAt === this.model.state.reviewSchedule[sourceId]?.dueAt &&
          (existing.reviewQuestionId === sourceId || variants.includes(existing.reviewQuestionId));
        const reviewQuestionId = persistedIsSafe ? existing.reviewQuestionId : (variants[stage % Math.max(variants.length, 1)] || sourceId);
        const assignment = this.model.assignReview(sourceId, reviewQuestionId) || { reviewQuestionId, sourceQuestionId:sourceId, conceptId:source.category, dueAt:this.model.state.reviewSchedule[sourceId]?.dueAt || 0, stage, status:'assigned' };
        this.reviewMappings.set(reviewQuestionId, Object.freeze({ ...assignment }));
        return reviewQuestionId;
      });
      if (!this.model.state.incorrectIds.length) return this.ids;
      // 復習時刻までは同じ問題を即時反復せず、同一概念の別表現を優先して転移を促す。
      const categories = new Set(this.model.state.incorrectIds.map(id => this.questions[id]?.category));
      const variants = this.ids.filter(id => !this.model.state.incorrectIds.includes(id) && categories.has(this.questions[id]?.category));
      return variants.length ? variants : this.ids.filter(id => !this.model.state.incorrectIds.includes(id));
    }
    modeIds() { const mode = this.model.state.mode; if (mode === 'review') return this.reviewIds(); if (mode === 'exam') return this.model.state.examSession?.ids || this.buildExamIds(); if (mode === 'training') return this.ids.filter(id => this.questions[id].type !== 'journal'); return this.storyIds(); }
    ensureExamSession(now = Date.now()) {
      if (this.model.validExamSession(this.model.state.examSession)) return this.model.state.examSession;
      this.model.state.examSession = { ids: this.buildExamIds(), startedAt: now, endAt: now + EXAM_DURATION_MS, status: 'RUNNING', scores: {} };
      this.model.save(); return this.model.state.examSession;
    }
    isExamExpired(now = Date.now(), session = this.model.state.examSession) {
      return !session || (session.status || 'RUNNING') !== 'RUNNING' || now >= session.endAt;
    }
    unansweredExamIds() {
      const session = this.model.state.examSession;
      return session ? session.ids.filter(id => !Object.prototype.hasOwnProperty.call(session.scores, id)) : [];
    }
    updateExamStatus(now = Date.now()) {
      const session = this.model.state.examSession; if (!session) return;
      const remaining = Math.max(0, session.endAt - now); const seconds = Math.ceil(remaining / 1000);
      const timer = this.document.getElementById('exam-timer'); const progress = this.document.getElementById('exam-progress');
      if (timer) timer.textContent = `残り ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      const position = Math.max(0, session.ids.indexOf(this.currentId)) + 1;
      if (progress) progress.textContent = `第${position}問 / ${session.ids.length}問｜回答済み ${session.ids.length - this.unansweredExamIds().length}問`;
      if (remaining === 0) { session.status = 'EXPIRED'; this.finishExam(true, now); }
    }
    startExamTimer() { this.stopExamTimer(); this.updateExamStatus(); this.examTimerId = root.setInterval?.(() => this.updateExamStatus(), 1000) || null; }
    stopExamTimer() { if (this.examTimerId !== null) root.clearInterval?.(this.examTimerId); this.examTimerId = null; }
    finishExam(force, now = Date.now()) {
      const session = this.model.state.examSession; if (!session) return false;
      if (session.status === 'FINISHING' || session.status === 'FINISHED') return false;
      const timedOut = force || now >= session.endAt || session.status === 'EXPIRED';
      const unanswered = this.unansweredExamIds();
      if (!timedOut && unanswered.length) { root.alert?.(`未回答が${unanswered.length}問あります。全問回答後に採点してください。`); this.start(unanswered[0]); return false; }
      if (!timedOut && root.confirm && !root.confirm('全15問の回答を終了し、採点しますか？')) return false;
      session.status = 'FINISHING';
      const earned = session.ids.reduce((sum, id, index) => sum + (session.scores[id]?.ratio || 0) * EXAM_POINTS[index], 0);
      const points = Math.round(earned); const correct = points >= 70;
      session.ids.forEach(id => { const result = session.scores[id]; if (result) { this.model.record(id, result.correct); this.rpg.recordMastery(this.questions[id], result); } });
      const review = { finishedAt: now, startedAt: session.startedAt, points, passed: correct, durationMs: Math.max(0, Math.min(now, session.endAt) - session.startedAt), unansweredCount: unanswered.length, items: session.ids.map((id, index) => ({ id, topic: this.questions[id].category, points: EXAM_POINTS[index], earned: Math.round((session.scores[id]?.ratio || 0) * EXAM_POINTS[index]), correct: session.scores[id]?.correct === true, answer: session.scores[id]?.answer ?? null })) };
      review.topicScores = review.items.reduce((out, item) => { const row = out[item.topic] || { earned: 0, possible: 0 }; row.earned += item.earned; row.possible += item.points; out[item.topic] = row; return out; }, {});
      session.status = 'FINISHED'; this.model.state.lastExamReview = review; this.model.state.examHistory = [...(this.model.state.examHistory || []), { finishedAt: review.finishedAt, points, passed: correct, durationMs: review.durationMs, topicScores: review.topicScores, unansweredCount: review.unansweredCount }].slice(-10);
      this.model.state.examAttempt += 1; this.model.state.examSession = null; this.model.save(); this.stopExamTimer();
      this.document?.body?.classList?.remove('exam-active');
      this.view.examResult(review, this.questions, this.model.state.examHistory);
      this.view.show('view-result'); return true;
    }
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
      const counts = [render('story-list', this.storyIds()), render('training-list', this.ids.filter(id => this.questions[id].type !== 'journal')), render('review-list', this.reviewIds()), render('exam-list', this.buildExamIds())];
      const modeIndex = ['story', 'training', 'review', 'exam'].indexOf(this.model.state.mode); const count = counts[Math.max(modeIndex, 0)]; this.document.getElementById('filter-status').textContent = `${count}問を表示しています。`;
      const storyIds = this.storyIds();
      const nextId = storyIds.find(id => !this.model.state.answeredIds.includes(id)) || this.model.state.currentQuestionId || storyIds[0];
      const next = this.questions[nextId]; const chapterIds = storyIds.filter(id => this.questions[id].chapter === next.chapter);
      this.document.getElementById('resume-scene').textContent = `第${next.chapter}章｜${next.scene}`;
      this.document.getElementById('resume-task').textContent = `次の仕事「${next.question}」`;
      this.document.getElementById('resume-progress').textContent = `Chapter進捗 ${chapterIds.filter(id => this.model.state.answeredIds.includes(id)).length} / ${chapterIds.length}｜役職 ${this.rpg.role}`;
      this.document.getElementById('resume-button').dataset.questionId = nextId;
    }
    start(id) { if (!this.questions[id] || (this.model.state.mode === 'exam' && !this.modeIds().includes(id))) return; this.submitting = false; this.currentId = id; this.questionStartedAt = Date.now(); this.reviewSourceId = this.model.state.mode === 'review' ? (this.reviewMappings.get(id)?.sourceQuestionId || (this.model.dueReviewIds().includes(id) ? id : null)) : null; this.model.state.currentQuestionId = id; this.model.save(); this.view.renderQuestion(this.questions[id], this.model.state.drafts[id], this.model.state.mode); this.view.show('view-question'); this.document.getElementById('question-filters').hidden = true; const firstAmount = this.document.querySelector('.amount-input:not(:disabled)'); if (firstAmount) this.selectCalculatorTarget(firstAmount); }
    saveDraft(message) { if (!this.currentId) return; this.model.setDraft(this.currentId, this.view.readAnswer(this.questions[this.currentId])); if (message) this.document.getElementById('save-status').textContent = '入力内容を保存しました。'; }
    submit() {
      if (this.submitting || !this.currentId || !this.questions[this.currentId]) return;
      if (this.model.state.mode === 'exam' && this.isExamExpired()) { const session = this.model.state.examSession; if (session) session.status = 'EXPIRED'; this.finishExam(true); return; }
      this.submitting = true;
      const question = this.questions[this.currentId]; const answer = this.view.readAnswer(question);
      if (this.model.state.mode === 'exam' && this.isExamExpired()) { this.model.state.examSession.status = 'EXPIRED'; this.finishExam(true); return; }
      const score = root.GradingEngine.grade(question, answer);
      const answeredAt = Date.now(); const responseMs = Math.max(0, answeredAt - (Number.isFinite(this.questionStartedAt) ? this.questionStartedAt : answeredAt));
      const reviewStage = this.reviewSourceId ? this.model.state.reviewSchedule[this.reviewSourceId]?.stage ?? null : null;
      const wrongType = score.correct ? '' : (score.details?.find(detail => !detail.correct)?.cellId || (question.type === 'journal' ? 'journal-entry' : 'table-cell'));
      const confidence = this.document.querySelector('input[name="confidence"]:checked')?.value || 'unsure';
      this.model.recordAttempt?.(question.id, score.correct, responseMs, wrongType, Boolean(this.reviewSourceId && score.correct), answeredAt, reviewStage, confidence);
      if (this.model.state.mode === 'exam') {
        const session = this.model.state.examSession;
        if (this.isExamExpired(Date.now(), session)) { session.status = 'EXPIRED'; this.finishExam(true); return; }
        session.scores[question.id] = { correct: score.correct, earned: score.earned, possible: score.possible, ratio: score.ratio, answer };
        this.model.setDraft(question.id, answer); this.model.save(); this.updateExamStatus();
        const unanswered = this.unansweredExamIds(); const ids = this.modeIds(); const following = ids.slice(ids.indexOf(this.currentId) + 1).find(id => unanswered.includes(id));
        if (following) return this.start(following);
        if (unanswered.length) return this.start(unanswered[0]);
        this.renderModes(); this.showMode('exam'); return;
      }
      if (this.reviewSourceId) this.model.completeReview(this.reviewSourceId, score.correct, answeredAt);
      else this.model.record(question.id, score.correct, answeredAt);
      this.rpg.recordMastery?.(question, score);
      if (score.correct) this.rpg.reward(question, score, 1);
      this.rpg.applyAnswer(score.correct, confidence);
      this.view.updateRpg(this.rpg); this.view.result(question, score, answer, confidence); this.view.show('view-result');
    }
    next() { if (this.model.state.mode === 'exam' && !this.model.state.examSession) return this.leaveExamResult('story'); if (this.model.state.mode === 'review') { const due = this.modeIds(); if (due.length) return this.start(due.find(id => id !== this.currentId) || due[0]); this.renderModes(); return this.showMode('review'); } if (this.model.state.mode !== 'exam') { const concept = this.questions[this.currentId]?.category; const adaptive = concept && this.model.recommendedIds(concept).find(id => id !== this.currentId && !this.model.state.answeredIds.includes(id) && !this.model.state.reviewSchedule[id]); if (adaptive) return this.start(adaptive); } const ids = this.modeIds(); const next = ids[ids.indexOf(this.currentId) + 1]; if (next) this.start(next); else { this.renderModes(); this.showMode(this.model.state.mode); } }
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
