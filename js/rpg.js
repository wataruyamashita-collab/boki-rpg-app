(function (root) {
  'use strict';
  const ROLES = [[30, '決算責任者'], [20, '月次決算担当'], [10, '経理主任'], [5, '経理担当'], [1, '経理見習い']];
  class RPGModel {
    constructor(storage, key = 'boki-rpg-character-v1') {
      this.storage = storage; this.key = key;
      this.state = { xp: 0, rewardedIds: [], mastery: {}, companyHP: 100, totalTransactionAmount: 0 };
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(this.storage.getItem(this.key));
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
        this.state = {
          xp: Number.isSafeInteger(saved.xp) && saved.xp >= 0 ? saved.xp : 0,
          rewardedIds: Array.isArray(saved.rewardedIds) ? [...new Set(saved.rewardedIds.filter(id => typeof id === 'string'))] : [],
          mastery: saved.mastery && typeof saved.mastery === 'object' && !Array.isArray(saved.mastery)
            ? Object.fromEntries(Object.entries(saved.mastery).filter(([, value]) => value &&
              Number.isFinite(value.earned) && value.earned >= 0 && Number.isFinite(value.possible) && value.possible >= value.earned)) : {},
          companyHP: Number.isFinite(saved.companyHP) ? Math.max(0, Math.min(100, saved.companyHP)) : 100,
          totalTransactionAmount: Number.isFinite(saved.totalTransactionAmount) && saved.totalTransactionAmount >= 0 ? saved.totalTransactionAmount : 0
        };
      } catch (_) { /* An unavailable/corrupt store starts a clean character. */ }
    }
    save() { try { this.storage.setItem(this.key, JSON.stringify(this.state)); } catch (_) {} }
    get level() { return Math.min(30, Math.floor(Math.sqrt(this.state.xp / 20)) + 1); }
    get role() { return ROLES.find(([level]) => this.level >= level)[1]; }
    reward(question, score, multiplier = 1) {
      if (this.state.rewardedIds.includes(question.id)) return false;
      if (!score || !Number.isFinite(score.ratio) || score.ratio < 0 || score.ratio > 1 || !Number.isFinite(multiplier) || multiplier < 0) return false;
      this.state.rewardedIds.push(question.id);
      this.state.xp += Math.round(20 * question.difficulty * score.ratio * multiplier);
      this.state.totalTransactionAmount += this.questionAmount(question);
      const mastery = this.state.mastery[question.category] || { earned: 0, possible: 0 };
      mastery.earned += score.earned; mastery.possible += score.possible;
      this.state.mastery[question.category] = mastery; this.save(); return true;
    }
    questionAmount(question) {
      if (question.type === 'journal') return (question.answer?.debit || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return Object.values(question.answer?.cells || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }
    applyAnswer(correct, confidence = 'careful') {
      const damage = confidence === 'bold' ? 30 : 10;
      this.state.companyHP = Math.max(0, Math.min(100, this.state.companyHP + (correct ? 5 : -damage)));
      this.save();
      return this.state.companyHP;
    }
    resetCompanyHP() { this.state.companyHP = 100; this.save(); }
  }
  root.RPGModel = RPGModel;
  if (typeof module !== 'undefined') module.exports = RPGModel;
}(typeof window !== 'undefined' ? window : globalThis));
