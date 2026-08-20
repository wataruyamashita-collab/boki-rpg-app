(function (root) {
  'use strict';
  const yen = value => Number(value).toLocaleString('ja-JP');
  class AppView {
    constructor(document) { this.document = document; }
    byId(id) { return this.document.getElementById(id); }
    show(id) { this.document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); }
    updateRpg(rpg) { this.byId('player-status').textContent = `Lv.${rpg.level} ${rpg.role}｜EXP ${rpg.state.xp}`; }
    renderQuestion(question, draft) {
      this.byId('q-category').textContent = `第${question.chapter}章｜${question.category}`;
      this.byId('q-text').textContent = question.question;
      this.byId('journal-container').hidden = question.type !== 'journal';
      this.byId('table-container').hidden = question.type === 'journal';
      if (question.type === 'journal') this.renderJournal(question, draft); else this.renderTable(question, draft);
    }
    makeAmount(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.setAttribute('inputmode', 'numeric');
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.value = value;
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
          const answer = question.answer[side][index]; const wrap = this.document.createElement('div'); wrap.className = 'journal-side';
          const select = this.document.createElement('select'); select.className = `${side}-account`; select.disabled = !answer;
          select.innerHTML = `<option value="">${answer ? '--勘定科目--' : '--入力なし--'}</option>`;
          if (answer) root.AppController.accountChoices(question, answer.account).forEach(name => select.append(new Option(name, name)));
          const saved = draft[side] && draft[side][index]; if (saved) select.value = saved.account;
          this.updateSelectTitle(select);
          wrap.append(select, this.makeAmount(`${side}-amount`, `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`, saved ? saved.amount : ''));
          if (!answer) wrap.lastChild.disabled = true;
          row.append(wrap);
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
      const side = name => [...this.document.querySelectorAll(`.${name}-account`)].map((account, index) => ({ account: account.value, amount: Number(this.document.querySelectorAll(`.${name}-amount`)[index].value.replace(/,/g, '')) })).filter(item => item.account || item.amount);
      return { debit: side('debit'), credit: side('credit') };
    }
    result(question, score) {
      const box = this.byId('result-status'); box.className = `result-box ${score.correct ? 'result-correct' : 'result-incorrect'}`;
      box.textContent = score.correct ? '正解です！' : 'もう一歩です';
      this.renderCorrectJournal(question);
      this.byId('explanation').textContent = question.explanation;
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
      const wrap = this.document.createElement('div'); wrap.className = 'journal-table-wrap';
      const table = this.document.createElement('table'); table.className = 'journal-table';
      const head = table.createTHead().insertRow();
      ['借方科目', '金額', '貸方科目', '金額'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; head.append(th); });
      const body = table.createTBody();
      const rows = Math.max(question.answer.debit.length, question.answer.credit.length);
      for (let index = 0; index < rows; index += 1) {
        const row = body.insertRow();
        ['debit', 'credit'].forEach(side => {
          const item = question.answer[side][index];
          const account = row.insertCell(); account.textContent = item?.account || '';
          const amount = row.insertCell(); amount.className = 'journal-amount'; amount.textContent = item ? `${yen(item.amount)}円` : '';
        });
      }
      wrap.append(table); container.append(heading, wrap);
    }
  }
  root.AppView = AppView;
}(window));
