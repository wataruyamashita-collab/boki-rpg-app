// =========================================
// 採点エンジン基盤 (仕様書37)
// =========================================
const normalizeNumber = value => String(value ?? '')
  .normalize('NFKC')
  .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
  .replace(/，/g, ',');

const normalizeText = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const normalizeDate = value => {
  const source = normalizeText(value).replace(/年/g, '/').replace(/月/g, '/').replace(/日/g, '').replace(/[.-]/g, '/');
  const match = source.match(/^(?:(\d{4})\/)?(\d{1,2})\/(\d{1,2})$/);
  if (!match) return source;
  const month = Number(match[2]); const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return source;
  return `${match[1] ? `${match[1]}/` : ''}${month}/${day}`;
};

const GradingEngine = {
  /**
   * 仕訳の採点を行う (複合仕訳・順不同対応)
   * @param {Object} userAnswer - ユーザー入力 { debit: [{account, amount}], credit: [{account, amount}] }
   * @param {Object} correctAnswer - 正答データ
   * @returns {boolean} 正誤
   */
  gradeJournalEntry(userAnswer, correctAnswer) {
    if (!Array.isArray(userAnswer?.debit) || !Array.isArray(userAnswer?.credit) ||
        !Array.isArray(correctAnswer?.debit) || !Array.isArray(correctAnswer?.credit)) return false;
    const validLine = item => item && typeof item.account === 'string' && item.account.trim() &&
      typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0;
    if (![...userAnswer.debit, ...userAnswer.credit].every(validLine)) return false;
    // 貸借の合計一致チェック (仕様書40: 不変条件)
    const userDebitTotal = userAnswer.debit.reduce((sum, item) => sum + item.amount, 0);
    const userCreditTotal = userAnswer.credit.reduce((sum, item) => sum + item.amount, 0);
    if (userDebitTotal !== userCreditTotal) return false;

    // 行単位での完全一致確認 (順不同を許容するためのヘルパー関数)
    const matchSides = (userSide, correctSide) => {
      if (userSide.length !== correctSide.length) return false;
      
      // ユーザー入力のコピーを作り、マッチしたものを消していく
      const remainingCorrect = [...correctSide];
      for (const uItem of userSide) {
        const matchIndex = remainingCorrect.findIndex(cItem => 
          cItem.account === uItem.account && cItem.amount === uItem.amount
        );
        if (matchIndex === -1) return false; // 一致する科目・金額がない
        remainingCorrect.splice(matchIndex, 1);
      }
      return remainingCorrect.length === 0;
    };

    return matchSides(userAnswer.debit, correctAnswer.debit) &&
           matchSides(userAnswer.credit, correctAnswer.credit);
  },

  gradeTable(userAnswer, correctAnswer, inputMetadata = {}) {
    const expected = correctAnswer?.cells && typeof correctAnswer.cells === 'object' ? correctAnswer.cells : {};
    const details = Object.keys(expected).map(cellId => {
      const raw = userAnswer?.cells ? userAnswer.cells[cellId] : undefined;
      const source = normalizeNumber(raw).replace(/,/g, '').trim();
      const semanticType = inputMetadata[cellId]?.semanticType;
      const normalized = typeof expected[cellId] === 'number'
        ? (source === '' ? Number.NaN : Number(source))
        : semanticType === 'date' ? normalizeDate(raw) : normalizeText(raw);
      const expectedValue = semanticType === 'date' ? normalizeDate(expected[cellId]) : typeof expected[cellId] === 'string' ? normalizeText(expected[cellId]) : expected[cellId];
      return { cellId, correct: normalized === expectedValue, expected: expected[cellId], actual: normalized };
    });
    const earned = details.filter(item => item.correct).length;
    return { correct: earned === details.length, earned, possible: details.length, ratio: details.length ? earned / details.length : 0, details };
  },

  grade(question, userAnswer) {
    if (!question || typeof question !== 'object') return { correct: false, earned: 0, possible: 0, ratio: 0, details: [] };
    if (question.type === 'journal') {
      const correct = this.gradeJournalEntry(userAnswer, question.answer);
      return { correct, earned: correct ? 1 : 0, possible: 1, ratio: correct ? 1 : 0, details: [] };
    }
    return this.gradeTable(userAnswer, question.answer, question.table?.inputMetadata);
  }
};

if (typeof window !== 'undefined') window.GradingEngine = GradingEngine;
if (typeof module !== 'undefined') module.exports = GradingEngine;
