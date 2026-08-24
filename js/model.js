(function (root) {
  'use strict';
  class ProgressModel {
    constructor(questions, storage, key = 'boki-rpg-progress-v2') {
      this.questions = questions && typeof questions === 'object' ? questions : {}; this.storage = storage; this.key = key;
      this.state = { mode: 'story', currentQuestionId: null, answeredIds: [], incorrectIds: [], mistakeCounts: {}, drafts: {}, completed: false, examAttempt: 0, examSession: null, examHistory: [], lastExamReview: null };
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
    record(id, correct) {
      if (!this.questions[id]) return false;
      if (!this.state.answeredIds.includes(id)) this.state.answeredIds.push(id);
      this.state.incorrectIds = this.state.incorrectIds.filter(value => value !== id);
      if (!correct) { this.state.incorrectIds.push(id); this.state.mistakeCounts[id] = (this.state.mistakeCounts[id] || 0) + 1; }
      delete this.state.drafts[id]; this.save(); return true;
    }
  }
  root.ProgressModel = ProgressModel;
  if (typeof module !== 'undefined') module.exports = ProgressModel;
}(typeof window !== 'undefined' ? window : globalThis));
