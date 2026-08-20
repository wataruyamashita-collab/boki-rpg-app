(function (root) {
  'use strict';
  const ROLES = [[30, '決算責任者'], [20, '月次決算担当'], [10, '経理主任'], [5, '経理担当'], [1, '経理見習い']];
  class RPGModel {
    constructor(storage, key = 'boki-rpg-character-v1') { this.storage = storage; this.key = key; this.state = { xp: 0, rewardedIds: [], mastery: {} }; this.load(); }
    load() { try { this.state = Object.assign(this.state, JSON.parse(this.storage.getItem(this.key)) || {}); } catch (_) {} }
    save() { try { this.storage.setItem(this.key, JSON.stringify(this.state)); } catch (_) {} }
    get level() { return Math.min(30, Math.floor(Math.sqrt(this.state.xp / 20)) + 1); }
    get role() { return ROLES.find(([level]) => this.level >= level)[1]; }
    reward(question, score) {
      if (this.state.rewardedIds.includes(question.id)) return false;
      this.state.rewardedIds.push(question.id);
      this.state.xp += Math.round(20 * question.difficulty * score.ratio);
      const mastery = this.state.mastery[question.category] || { earned: 0, possible: 0 };
      mastery.earned += score.earned; mastery.possible += score.possible;
      this.state.mastery[question.category] = mastery; this.save(); return true;
    }
  }
  root.RPGModel = RPGModel;
  if (typeof module !== 'undefined') module.exports = RPGModel;
}(typeof window !== 'undefined' ? window : globalThis));
