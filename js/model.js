(function (root) {
  'use strict';
  class ProgressModel {
    constructor(questions, storage, key = 'boki-rpg-progress-v2') {
      this.questions = questions; this.storage = storage; this.key = key;
      this.state = { mode: 'story', currentQuestionId: null, answeredIds: [], incorrectIds: [], mistakeCounts: {}, drafts: {}, completed: false };
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(this.storage.getItem(this.key));
        if (saved && typeof saved === 'object') this.state = Object.assign(this.state, saved, {
          answeredIds: Array.isArray(saved.answeredIds) ? saved.answeredIds.filter(id => this.questions[id]) : [],
          incorrectIds: Array.isArray(saved.incorrectIds) ? saved.incorrectIds.filter(id => this.questions[id]) : [],
          drafts: saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {},
          mistakeCounts: saved.mistakeCounts && typeof saved.mistakeCounts === 'object'
            ? Object.fromEntries(Object.entries(saved.mistakeCounts).filter(([id, count]) => this.questions[id] && Number.isInteger(count) && count > 0)) : {}
        });
      } catch (_) { /* An unavailable/corrupt store starts a clean session. */ }
    }
    save() { try { this.storage.setItem(this.key, JSON.stringify(this.state)); } catch (_) { /* learning remains usable */ } }
    setDraft(id, answer) { this.state.drafts[id] = answer; this.state.currentQuestionId = id; this.save(); }
    record(id, correct) {
      if (!this.state.answeredIds.includes(id)) this.state.answeredIds.push(id);
      this.state.incorrectIds = this.state.incorrectIds.filter(value => value !== id);
      if (!correct) { this.state.incorrectIds.push(id); this.state.mistakeCounts[id] = (this.state.mistakeCounts[id] || 0) + 1; }
      delete this.state.drafts[id]; this.save();
    }
  }
  root.ProgressModel = ProgressModel;
  if (typeof module !== 'undefined') module.exports = ProgressModel;
}(typeof window !== 'undefined' ? window : globalThis));
