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
      const input = this.document.createElement('input'); input.type = 'text'; input.inputMode = 'numeric';
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.value = value;
      return input;
    }
    updateSelectTitle(select) {
      select.title = select.selectedOptions[0]?.textContent || '';
    }
    renderJournal(question, draft = {}) {
      const container = this.byId('journal-container'); container.replaceChildren();
      const header = this.document.createElement('div'); header.className = 'journal-header'; header.innerHTML = '<span>借方科目・金額</span><span></span><span>貸方科目・金額</span>'; container.append(header);
      const count = Math.max(question.answer.debit.length, question.answer.credit.length);
      for (let index = 0; index < count; index += 1) {
        const row = this.document.createElement('div'); row.className = 'journal-row';
        ['debit', 'credit'].forEach((side, sideIndex) => {
          const answer = question.answer[side][index]; const wrap = this.document.createElement('div'); wrap.className = 'journal-side';
          const select = this.document.createElement('select'); select.className = `${side}-account`; select.disabled = !answer;
          select.innerHTML = `<option value="">${answer ? '--勘定科目--' : '--入力なし--'}</option>`;
          if (answer) root.AppController.accountChoices(question, answer.account).forEach(name => select.append(new Option(name, name)));
          const saved = draft[side] && draft[side][index]; if (saved) select.value = saved.account;
          this.updateSelectTitle(select);
          wrap.append(select, this.makeAmount(`${side}-amount`, `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`, saved ? saved.amount : ''));
          if (!answer) wrap.lastChild.disabled = true;
          row.append(wrap); if (sideIndex === 0) { const divider = this.document.createElement('span'); divider.className = 'divider'; divider.textContent = '｜'; row.append(divider); }
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
      box.textContent = score.correct ? '正解です！' : `部分点 ${score.earned} / ${score.possible}`;
      this.byId('explanation').textContent = question.explanation;
    }
  }
  root.AppView = AppView;
}(window));
