(function (root) {
  'use strict';
  const ROLES = [[30, '決算責任者'], [20, '月次決算担当'], [10, '経理主任'], [5, '経理担当'], [1, '経理見習い']];
  class RPGModel {
    constructor(storage, key = 'boki-rpg-character-v1') {
      this.storage = storage; this.key = key;
      this.state = { xp: 0, rewardedIds: [], mastery: {}, companyHP: 100, totalTransactionAmount: 0 };
      this.load();
    }
    load() { try { this.state = Object.assign(this.state, JSON.parse(this.storage.getItem(this.key)) || {}); } catch (_) {} }
    save() { try { this.storage.setItem(this.key, JSON.stringify(this.state)); } catch (_) {} }
    get level() { return Math.min(30, Math.floor(Math.sqrt(this.state.xp / 20)) + 1); }
    get role() { return ROLES.find(([level]) => this.level >= level)[1]; }
    reward(question, score, multiplier = 1) {
      if (this.state.rewardedIds.includes(question.id)) return false;
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
