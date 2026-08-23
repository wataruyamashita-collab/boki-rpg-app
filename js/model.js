(function (root) {
  'use strict';
  class ProgressModel {
    constructor(questions, storage, key = 'boki-rpg-progress-v2') {
      this.questions = questions && typeof questions === 'object' ? questions : {}; this.storage = storage; this.key = key;
      this.state = { mode: 'story', currentQuestionId: null, answeredIds: [], incorrectIds: [], mistakeCounts: {}, drafts: {}, completed: false, examAttempt: 0 };
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
          examAttempt: Number.isSafeInteger(saved.examAttempt) && saved.examAttempt >= 0 ? saved.examAttempt : 0
        });
      } catch (_) { /* An unavailable/corrupt store starts a clean session. */ }
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
