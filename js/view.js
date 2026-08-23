(function (root) {
  'use strict';
  const normalizeNumber = str => String(str || '').replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
  const yen = value => Number(value).toLocaleString('ja-JP');
  class AppView {
    constructor(document) { this.document = document; }
    byId(id) { return this.document.getElementById(id); }
    show(id) { this.document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); }
    updateRpg(rpg) {
      this.byId('player-status').textContent = `Lv.${rpg.level} ${rpg.role}｜EXP ${rpg.state.xp}｜経営HP ${rpg.state.companyHP}/100｜総取引処理額 ${yen(rpg.state.totalTransactionAmount)}円`;
    }
    renderQuestion(question, draft) {
      this.byId('q-category').textContent = `第${question.chapter}章｜${question.category}`;
      this.byId('q-text').textContent = question.question;
      this.byId('journal-container').hidden = question.type !== 'journal';
      this.byId('table-container').hidden = question.type === 'journal';
      if (question.type === 'journal') this.renderJournal(question, draft); else this.renderTable(question, draft);
    }
    makeAmount(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.setAttribute('inputmode', 'numeric');
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.setAttribute('pattern', '[0-9,]*');
      input.setAttribute('enterkeyhint', 'done'); input.setAttribute('autocorrect', 'off'); input.setAttribute('spellcheck', 'false'); input.value = value;
      return input;
    }
    updateSelectTitle(select) {
      select.title = select.selectedOptions[0]?.textContent || '';
    }
    renderJournal(question, draft = {}) {
      const container = this.byId('journal-container'); container.replaceChildren();
      const header = this.document.createElement('div'); header.className = 'journal-header'; header.innerHTML = '<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>'; container.append(header);
      const count = Math.max(question.answer.debit.length, question.answer.credit.length);
      for (let index = 0; index < count; index += 1) {
        const row = this.document.createElement('div'); row.className = 'journal-row';
        ['debit', 'credit'].forEach(side => {
          const answer = question.answer[side][index];
          const select = this.document.createElement('select'); select.className = `${side}-account`; select.disabled = !answer;
          select.innerHTML = `<option value="">${answer ? '--勘定科目--' : '--入力なし--'}</option>`;
          if (answer) root.AppController.accountChoices(question, answer.account).forEach(name => select.append(new Option(name, name)));
          const saved = draft[side] && draft[side][index]; if (saved) select.value = saved.account;
          this.updateSelectTitle(select);
          const amount = this.makeAmount(`${side}-amount`, `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`, saved ? saved.amount : '');
          if (!answer) amount.disabled = true;
          row.append(select, amount);
        }); container.append(row);
      }
    }
    renderTable(question, draft = {}) {
      const wrap = this.byId('table-container'); wrap.replaceChildren();
      const table = this.document.createElement('table'); table.className = 'answer-table';
      const thead = table.createTHead(); const head = thead.insertRow(); question.table.columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = column; head.append(th); });
      const body = table.createTBody(); let inputIndex = 0;
      question.table.rows.forEach(rowData => {
        const row = body.insertRow(); Object.values(rowData).forEach(value => {
          const cell = row.insertCell();
          if (value === '入力') { const id = question.table.inputCells[inputIndex++]; const input = this.makeAmount('table-input', `${id}の回答`, draft.cells?.[id] || ''); input.dataset.cellId = id; cell.append(input); }
          else cell.textContent = value == null ? '' : typeof value === 'number' ? yen(value) : value;
        });
      }); wrap.append(table);
    }
    readAnswer(question) {
      if (question.type !== 'journal') { const cells = {}; this.document.querySelectorAll('.table-input').forEach(input => { cells[input.dataset.cellId] = input.value; }); return { cells }; }
      const side = name => [...this.document.querySelectorAll(`.${name}-account`)].map((account, index) => ({ account: account.value, amount: Number(normalizeNumber(this.document.querySelectorAll(`.${name}-amount`)[index].value).replace(/,/g, '')) })).filter(item => item.account || item.amount);
      return { debit: side('debit'), credit: side('credit') };
    }
    result(question, score, userAnswer) {
      const box = this.byId('result-status'); box.className = `result-box ${score.correct ? 'result-correct' : 'result-incorrect'}`;
      box.textContent = score.correct ? '正解です！' : 'もう一歩です';
      this.renderAnswerComparison(question, score, userAnswer);
      this.renderCorrectJournal(question);
      this.renderExplanation(question, score, userAnswer);
    }
    journalTable(answer) {
      const wrap = this.document.createElement('div'); wrap.className = 'journal-table-wrap';
      const table = this.document.createElement('table'); table.className = 'journal-table';
      const head = table.createTHead().insertRow();
      ['借方科目', '金額', '貸方科目', '金額'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; head.append(th); });
      const body = table.createTBody(); const rows = Math.max(answer.debit.length, answer.credit.length, 1);
      for (let index = 0; index < rows; index += 1) {
        const row = body.insertRow();
        ['debit', 'credit'].forEach(side => {
          const item = answer[side][index]; const account = row.insertCell(); account.textContent = item?.account || '（未入力）';
          const amount = row.insertCell(); amount.className = 'journal-amount'; amount.textContent = item?.amount ? `${yen(item.amount)}円` : '—';
        });
      }
      wrap.append(table); return wrap;
    }
    renderAnswerComparison(question, score, userAnswer) {
      const container = this.byId('answer-comparison'); container.replaceChildren();
      container.hidden = true;
      if (score.correct || question.type !== 'journal' || !userAnswer) return;
      container.hidden = false;
      const heading = this.document.createElement('h3'); heading.textContent = 'あなたの仕訳（誤答）';
      const note = this.document.createElement('p'); note.textContent = '下の「正しい仕訳」と、科目・貸借・金額を一つずつ見比べましょう。';
      container.append(heading, note, this.journalTable(userAnswer));
    }
    diagnoseJournal(userAnswer, correctAnswer) {
      const key = item => `${item.account}\u0000${item.amount}`;
      const has = (items, target) => items.some(item => key(item) === key(target));
      const debitTotal = userAnswer.debit.reduce((sum, item) => sum + item.amount, 0);
      const creditTotal = userAnswer.credit.reduce((sum, item) => sum + item.amount, 0);
      const messages = [];
      if (debitTotal !== creditTotal) messages.push(`借方合計${yen(debitTotal)}円と貸方合計${yen(creditTotal)}円が一致していません。仕訳は必ず貸借同額になります。`);
      const reversed = [...correctAnswer.debit.filter(item => has(userAnswer.credit, item)), ...correctAnswer.credit.filter(item => has(userAnswer.debit, item))];
      if (reversed.length) messages.push(`${[...new Set(reversed.map(item => item.account))].join('・')}を借方と貸方の反対側に記入しています。資産・費用の増加は借方、負債・純資産・収益の増加は貸方、減少はその逆と整理しましょう。`);
      const correctAccounts = [...correctAnswer.debit, ...correctAnswer.credit].map(item => item.account);
      const wrongAccounts = [...userAnswer.debit, ...userAnswer.credit].filter(item => !correctAccounts.includes(item.account)).map(item => item.account).filter(Boolean);
      if (wrongAccounts.length) messages.push(`${[...new Set(wrongAccounts)].join('・')}を選んでいます。取引文から「何が増減したか」を先に特定してから、勘定科目へ置き換えましょう。`);
      const amountErrors = [...correctAnswer.debit, ...correctAnswer.credit].filter(correct => {
        const entered = [...userAnswer.debit, ...userAnswer.credit].find(item => item.account === correct.account);
        return entered && entered.amount !== correct.amount;
      });
      if (amountErrors.length) messages.push(`${[...new Set(amountErrors.map(item => item.account))].join('・')}は勘定科目を捉えていますが、金額が違います。取引総額、支払額、残額のどれを記入するかを問題文に戻って確認しましょう。`);
      const missing = [...correctAnswer.debit, ...correctAnswer.credit].filter(item => ![...userAnswer.debit, ...userAnswer.credit].some(entered => entered.account === item.account));
      if (missing.length) messages.push(`${[...new Set(missing.map(item => item.account))].join('・')}が未記入です。複合仕訳では、取引を構成する増減を漏れなく分解しましょう。`);
      if (!messages.length) messages.push('科目と金額の組合せ、または記入する側にずれがあります。正しい仕訳と1行ずつ照合し、取引の増減を確認しましょう。');
      return messages;
    }
    renderExplanation(question, score, userAnswer) {
      const container = this.byId('explanation'); container.replaceChildren();
      if (!score.correct && question.type === 'journal' && userAnswer) {
        const heading = this.document.createElement('h3'); heading.textContent = 'なぜ間違えたのか';
        const list = this.document.createElement('ul'); list.className = 'mistake-reasons';
        this.diagnoseJournal(userAnswer, question.answer).forEach(message => { const item = this.document.createElement('li'); item.textContent = message; list.append(item); });
        container.append(heading, list);
      }
      const heading = this.document.createElement('h3'); heading.textContent = 'TAC講師の解説';
      const text = this.document.createElement('p'); text.className = 'explanation-text'; text.textContent = question.explanation;
      container.append(heading, text);
    }
    renderCorrectJournal(question) {
      let container = this.byId('correct-journal');
      if (!container) {
        container = this.document.createElement('div'); container.id = 'correct-journal'; container.className = 'correct-journal';
        this.byId('explanation').before(container);
      }
      container.replaceChildren();
      if (question.type !== 'journal' || !question.answer) return;
      const heading = this.document.createElement('h3'); heading.textContent = '正しい仕訳';
      container.append(heading, this.journalTable(question.answer));
    }
  }
  root.AppView = AppView;
}(window));
