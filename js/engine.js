// =========================================
// 採点エンジン基盤 (仕様書37)
// =========================================
const GradingEngine = {
  /**
   * 仕訳の採点を行う (複合仕訳・順不同対応)
   * @param {Object} userAnswer - ユーザー入力 { debit: [{account, amount}], credit: [{account, amount}] }
   * @param {Object} correctAnswer - 正答データ
   * @returns {boolean} 正誤
   */
  gradeJournalEntry(userAnswer, correctAnswer) {
    // 貸借の合計一致チェック (仕様書40: 不変条件)
    const userDebitTotal = userAnswer.debit.reduce((sum, item) => sum + item.amount, 0);
    const userCreditTotal = userAnswer.credit.reduce((sum, item) => sum + item.amount, 0);
    if (userDebitTotal !== userCreditTotal) return false;

    // 行単位での完全一致確認 (順不同を許容するためのヘルパー関数)
    const matchSides = (userSide, correctSide) => {
      if (userSide.length !== correctSide.length) return false;
      
      // ユーザー入力のコピーを作り、マッチしたものを消していく
      let remainingCorrect = [...correctSide];
      for (let uItem of userSide) {
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
  }
};
