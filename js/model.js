(function (root) {
  'use strict';
  class ProgressModel {
    constructor(questions, storage, key = 'boki-rpg-progress-v2') {
      this.questions = questions && typeof questions === 'object' ? questions : {}; this.storage = storage; this.key = key;
      this.state = { mode: 'story', currentQuestionId: null, answeredIds: [], incorrectIds: [], mistakeCounts: {}, reviewSchedule: {}, reviewAssignments: {}, attempts: [], drafts: {}, completed: false, examAttempt: 0, examSession: null, examHistory: [], lastExamReview: null };
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(this.storage?.getItem?.(this.key));
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) this.state = Object.assign(this.state, saved, {
          mode: ['story', 'training', 'review', 'exam'].includes(saved.mode) ? saved.mode : 'story',
          currentQuestionId: this.questions[saved.currentQuestionId] ? saved.currentQuestionId : null,
          answeredIds: Array.isArray(saved.answeredIds) ? saved.answeredIds.filter(id => this.questions[id]) : [],
          incorrectIds: Array.isArray(saved.incorrectIds) ? saved.incorrectIds.filter(id => this.questions[id]) : [],
          drafts: saved.drafts && typeof saved.drafts === 'object' && !Array.isArray(saved.drafts)
            ? Object.fromEntries(Object.entries(saved.drafts).filter(([id, draft]) => this.questions[id] && draft && typeof draft === 'object')) : {},
          mistakeCounts: saved.mistakeCounts && typeof saved.mistakeCounts === 'object'
            ? Object.fromEntries(Object.entries(saved.mistakeCounts).filter(([id, count]) => this.questions[id] && Number.isSafeInteger(count) && count > 0)) : {},
          reviewSchedule: saved.reviewSchedule && typeof saved.reviewSchedule === 'object' && !Array.isArray(saved.reviewSchedule)
            ? Object.fromEntries(Object.entries(saved.reviewSchedule).filter(([id, item]) => this.questions[id] && item &&
              Number.isSafeInteger(item.stage) && item.stage >= 0 && item.stage <= 4 && Number.isFinite(item.dueAt) && item.dueAt >= 0)) : {},
          reviewAssignments: saved.reviewAssignments && typeof saved.reviewAssignments === 'object' && !Array.isArray(saved.reviewAssignments)
            ? Object.fromEntries(Object.entries(saved.reviewAssignments).filter(([sourceId, item]) => this.questions[sourceId] && item &&
              item.sourceQuestionId === sourceId && this.questions[item.reviewQuestionId] && typeof item.conceptId === 'string' &&
              Number.isSafeInteger(item.stage) && item.stage >= 0 && item.stage <= 4 && Number.isFinite(item.dueAt) &&
              Number.isFinite(item.assignedAt) && ['assigned', 'completed'].includes(item.status))) : {},
          attempts: Array.isArray(saved.attempts) ? saved.attempts.filter(item => item && this.questions[item.questionId || item.id] && typeof item.correct === 'boolean' && Number.isFinite(item.responseMs) && item.responseMs >= 0).slice(-200) : [],
          completed: saved.completed === true,
          examAttempt: Number.isSafeInteger(saved.examAttempt) && saved.examAttempt >= 0 ? saved.examAttempt : 0,
          examSession: this.validExamSession(saved.examSession) ? saved.examSession : null,
          examHistory: Array.isArray(saved.examHistory) ? saved.examHistory.filter(item => item && Number.isFinite(item.finishedAt) && Number.isFinite(item.points)).slice(-10) : [],
          lastExamReview: saved.lastExamReview && typeof saved.lastExamReview === 'object' ? saved.lastExamReview : null
        });
      } catch (_) { /* An unavailable/corrupt store starts a clean session. */ }
    }
    validExamSession(session) {
      if (!(session && typeof session === 'object' && Array.isArray(session.ids) && session.ids.length === 15 &&
        session.ids.every(id => this.questions[id]) && new Set(session.ids).size === session.ids.length &&
        Number.isFinite(session.startedAt) && Number.isFinite(session.endAt) && session.endAt > session.startedAt &&
        ['RUNNING', 'EXPIRED', 'FINISHING'].includes(session.status || 'RUNNING') &&
        session.scores && typeof session.scores === 'object' && !Array.isArray(session.scores))) return false;
      return Object.entries(session.scores).every(([id, score]) => session.ids.includes(id) && score &&
        typeof score.correct === 'boolean' && Number.isFinite(score.earned) && Number.isFinite(score.possible) &&
        Number.isFinite(score.ratio) && score.earned >= 0 && score.possible > 0 && score.earned <= score.possible && score.ratio >= 0 && score.ratio <= 1);
    }
    save() { try { this.storage?.setItem?.(this.key, JSON.stringify(this.state)); } catch (_) { /* learning remains usable */ } }
    setDraft(id, answer) { if (!this.questions[id] || !answer || typeof answer !== 'object') return false; this.state.drafts[id] = answer; this.state.currentQuestionId = id; this.save(); return true; }
    record(id, correct, now = Date.now()) {
      if (!this.questions[id]) return false;
      if (!this.state.answeredIds.includes(id)) this.state.answeredIds.push(id);
      const intervals = [20 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000];
      const scheduled = this.state.reviewSchedule[id];
      if (!correct) {
        if (!this.state.incorrectIds.includes(id)) this.state.incorrectIds.push(id);
        this.state.mistakeCounts[id] = (this.state.mistakeCounts[id] || 0) + 1;
        this.state.reviewSchedule[id] = { stage:0, dueAt:now + intervals[0] };
      } else if (scheduled && now >= scheduled.dueAt) {
        const nextStage = scheduled.stage + 1;
        if (nextStage >= intervals.length) {
          this.state.incorrectIds = this.state.incorrectIds.filter(value => value !== id);
          delete this.state.reviewSchedule[id];
        } else this.state.reviewSchedule[id] = { stage:nextStage, dueAt:now + intervals[nextStage] };
      } else if (!scheduled) this.state.incorrectIds = this.state.incorrectIds.filter(value => value !== id);
      delete this.state.drafts[id]; this.save(); return true;
    }
    dueReviewIds(now = Date.now()) {
      return this.state.incorrectIds.filter(id => !this.state.reviewSchedule[id] || this.state.reviewSchedule[id].dueAt <= now)
        .sort((a, b) => (this.state.reviewSchedule[a]?.dueAt || 0) - (this.state.reviewSchedule[b]?.dueAt || 0));
    }
    assignReview(sourceQuestionId, reviewQuestionId, now = Date.now()) {
      const schedule = this.state.reviewSchedule[sourceQuestionId];
      if (!this.questions[sourceQuestionId] || !this.questions[reviewQuestionId] || !schedule) return null;
      const current = this.state.reviewAssignments[sourceQuestionId];
      if (current && current.status === 'assigned' && current.stage === schedule.stage && current.dueAt === schedule.dueAt && this.questions[current.reviewQuestionId]) return current;
      const assignment = { sourceQuestionId, reviewQuestionId, conceptId:this.questions[sourceQuestionId].category || '', stage:schedule.stage, dueAt:schedule.dueAt, assignedAt:now, status:'assigned' };
      this.state.reviewAssignments[sourceQuestionId] = assignment; this.save(); return assignment;
    }
    completeReview(sourceQuestionId, correct, now = Date.now()) {
      const assignment = this.state.reviewAssignments[sourceQuestionId];
      if (!assignment || assignment.status !== 'assigned' || now < assignment.dueAt) return false;
      const recorded = this.record(sourceQuestionId, correct, now);
      if (recorded) { delete this.state.reviewAssignments[sourceQuestionId]; this.save(); }
      return recorded;
    }
    recordAttempt(id, correct, responseMs, wrongType = '', delayedSuccess = false, now = Date.now(), reviewStage = null, confidence = 'unsure') {
      if (!this.questions[id] || typeof correct !== 'boolean' || !Number.isFinite(responseMs) || responseMs < 0) return false;
      this.state.attempts.push({ questionId:id, id, concept:this.questions[id].category, category:this.questions[id].category, difficulty:Number(this.questions[id].difficulty || 1), correct, confidence:confidence === 'sure' ? 'sure' : 'unsure', responseMs, wrongType:String(wrongType || ''), reviewStage:Number.isSafeInteger(reviewStage) ? reviewStage : null, delayedSuccess:delayedSuccess === true, timestamp:now, at:now });
      this.state.attempts = this.state.attempts.slice(-200); this.save(); return true;
    }
    adaptiveDifficulty(concept, fallback = 2) {
      const recent = this.state.attempts.filter(item => item.concept === concept).slice(-6);
      if (!recent.length) return Math.max(1, Math.min(4, fallback));
      const accuracy = recent.filter(item => item.correct).length / recent.length;
      const fast = recent.filter(item => item.correct && item.responseMs <= 60000).length / recent.length;
      const delayed = recent.some(item => item.delayedSuccess);
      const current = recent[recent.length - 1].difficulty;
      if (!recent[recent.length - 1].correct && recent[recent.length - 1].confidence === 'sure') return Math.max(1, current - 1);
      if (recent.slice(-2).every(item => !item.correct)) return Math.max(1, current - 1);
      if (recent.length >= 3 && accuracy >= .8 && fast >= .6 && delayed) return Math.min(4, current + 1);
      return current;
    }
    recommendedIds(concept) {
      const attempted = new Set(this.state.attempts.map(item => item.questionId || item.id));
      const candidates = Object.values(this.questions).filter(item => item.category === concept);
      const target = this.adaptiveDifficulty(concept, candidates[0]?.difficulty || 2);
      const roleOrder = { core:0, drill:1, reinforcement:1, review:2, transfer:3, exam:4 };
      return candidates.sort((a,b) => Number(attempted.has(a.id))-Number(attempted.has(b.id)) ||
        (roleOrder[a.learningRole] ?? 2)-(roleOrder[b.learningRole] ?? 2) || Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target)).map(item => item.id);
    }
    placementStart(scores = {}) {
      const foundation = Math.max(0, Math.min(100, Number(scores.foundation) || 0));
      const closing = Math.max(0, Math.min(100, Number(scores.closing) || 0));
      const targetChapter = foundation >= 80 ? (closing >= 70 ? 10 : 7) : (foundation >= 50 ? 4 : 1);
      return Object.values(this.questions)
        .filter(item => item.learningRole === 'core' || item.learningRole === 'drill')
        .sort((a, b) => a.chapter - b.chapter || a.difficulty - b.difficulty)
        .find(item => item.chapter >= targetChapter)?.id || Object.keys(this.questions)[0] || null;
    }
  }
  root.ProgressModel = ProgressModel;
  if (typeof module !== 'undefined') module.exports = ProgressModel;
}(typeof window !== 'undefined' ? window : globalThis));
