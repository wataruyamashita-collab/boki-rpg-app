(function (root) {
  'use strict';
  const normalizeNumber = value => String(value ?? '')
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  const yen = value => Number(value).toLocaleString('ja-JP');
  const ACCOUNT_TYPES = {
    asset: new Set(['現金','普通預金','当座預金','売掛金','受取手形','繰越商品','備品','電子記録債権','クレジット売掛金','未収入金','前払金','現金過不足','小口現金','仮払金','立替金','仮払消費税','前払保険料','受取商品券','差入保証金','未収利息','貯蔵品','貸付金']),
    contraAsset: new Set(['貸倒引当金','減価償却累計額','備品減価償却累計額']),
    liability: new Set(['買掛金','支払手形','借入金','電子記録債務','未払金','前受金','所得税預り金','社会保険料預り金','仮受消費税','仮受金','前受家賃','未払利息','未払法人税等','未払消費税']),
    equity: new Set(['資本金','繰越利益剰余金','損益']),
    revenue: new Set(['売上','受取利息','受取家賃','固定資産売却益','償却債権取立益','雑益']),
    expense: new Set(['仕入','発送費','消耗品費','減価償却費','固定資産売却損','支払手数料','通信費','水道光熱費','旅費交通費','支払利息','給料','法定福利費','租税公課','貸倒引当金繰入','保険料','法人税、住民税及び事業税','雑損'])
  };
  const TYPE_LABELS = { asset: '資産', contraAsset: '資産の控除', liability: '負債', equity: '純資産', expense: '費用', revenue: '収益' };
  class AppView {
    constructor(document) { this.document = document; }
    byId(id) { return this.document.getElementById(id); }
    show(id) { this.document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); }
    updateRpg(rpg) {
      this.byId('player-status').textContent = `Lv.${rpg.level} ${rpg.role}｜EXP ${rpg.state.xp}｜経営HP ${rpg.state.companyHP}/100｜総取引処理額 ${yen(rpg.state.totalTransactionAmount)}円`;
    }
    renderQuestion(question, draft, mode = 'story') {
      this.byId('q-category').textContent = `第${question.chapter}章｜${question.category}`;
      const story = this.byId('q-story'); story.hidden = mode !== 'story';
      if (!story.hidden) { this.byId('q-scene').textContent = question.scene; this.byId('q-context').textContent = question.story; this.byId('q-task').textContent = `今回の仕事：${question.category}`; }
      this.byId('q-text').textContent = question.question;
      this.renderMaterials(question);
      this.byId('journal-container').hidden = question.type !== 'journal';
      this.byId('table-container').hidden = question.type === 'journal';
      if (question.type === 'journal') this.renderJournal(question, draft, mode); else this.renderTable(question, draft);
    }
    renderMaterials(question) {
      let container = this.byId('question-materials');
      if (!container) { container = this.document.createElement('section'); container.id = 'question-materials'; container.className = 'question-materials'; this.byId('q-text').after(container); }
      container.replaceChildren(); container.hidden = !Array.isArray(question.materials) || question.materials.length === 0;
      if (container.hidden) return;
      const heading = this.document.createElement('h3'); heading.textContent = '解答資料';
      const wrap = this.document.createElement('div'); wrap.className = 'materials-table-wrap';
      const table = this.document.createElement('table'); table.className = 'materials-table';
      const columns = [...new Set(question.materials.flatMap(row => Object.keys(row)))];
      const head = table.createTHead().insertRow(); columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = column; head.append(th); });
      const body = table.createTBody(); question.materials.forEach(material => { const row = body.insertRow(); columns.forEach(column => { const cell = row.insertCell(); const value = material[column]; cell.textContent = value == null ? '—' : typeof value === 'number' ? yen(value) : value; }); });
      wrap.append(table); container.append(heading, wrap);
    }
    makeAmount(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.setAttribute('inputmode', 'numeric');
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.setAttribute('pattern', '[0-9,]*');
      input.setAttribute('enterkeyhint', 'done'); input.setAttribute('autocorrect', 'off'); input.setAttribute('spellcheck', 'false'); input.value = value;
      return input;
    }
    makeText(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.className = `${className} table-text-input`;
      input.setAttribute('aria-label', label); input.setAttribute('enterkeyhint', 'done'); input.setAttribute('autocomplete', 'off'); input.value = value; return input;
    }
    updateSelectTitle(select) {
      select.title = select.selectedOptions[0]?.textContent || '';
    }
    renderJournal(question, draft = {}, mode = 'story') {
      const container = this.byId('journal-container'); container.replaceChildren();
      const header = this.document.createElement('div'); header.className = 'journal-header'; header.innerHTML = '<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>'; container.append(header);
      const count = Math.max(question.answer.debit.length, question.answer.credit.length);
      for (let index = 0; index < count; index += 1) {
        const row = this.document.createElement('div'); row.className = 'journal-row';
        ['debit', 'credit'].forEach(side => {
          const answer = question.answer[side][index];
          const select = this.document.createElement('select'); select.className = `${side}-account`; select.disabled = !answer;
          select.innerHTML = `<option value="">${answer ? '--勘定科目--' : '--入力なし--'}</option>`;
          if (answer) root.AppController.accountChoices(question, answer.account, mode).forEach(name => select.append(new Option(name, name)));
          const saved = draft[side] && draft[side][index]; if (saved) select.value = saved.account;
          this.updateSelectTitle(select);
          const amount = this.makeAmount(`${side}-amount`, `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`, saved ? saved.amount : '');
          if (!answer) amount.disabled = true;
          row.append(select, amount);
        }); container.append(row);
      }
    }
    accountType(account) {
      return Object.keys(ACCOUNT_TYPES).find(type => ACCOUNT_TYPES[type].has(account)) || 'unknown';
    }
    accountLabel(account) {
      const wrap = this.document.createElement('span'); wrap.className = 'account-with-badge';
      const name = this.document.createElement('span'); name.textContent = account || '（未入力）'; wrap.append(name);
      if (account) { const type = this.accountType(account); const badge = this.document.createElement('span'); badge.className = `account-badge account-badge-${type}`; badge.textContent = TYPE_LABELS[type] || '科目'; wrap.append(badge); }
      return wrap;
    }
    renderTable(question, draft = {}) {
      const wrap = this.byId('table-container'); wrap.replaceChildren();
      wrap.classList.toggle('worksheet-scroll', question.format === 'eight-column-worksheet');
      const table = this.document.createElement('table'); table.className = `answer-table${question.format === 'eight-column-worksheet' ? ' eight-column-worksheet' : ''}`;
      const thead = table.createTHead(); const head = thead.insertRow(); question.table.columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = column; head.append(th); });
      const body = table.createTBody(); let inputIndex = 0;
      question.table.rows.forEach(rowData => {
        const row = body.insertRow(); Object.values(rowData).forEach(value => {
          const cell = row.insertCell();
          if (value === '入力') {
            const id = question.table.inputCells[inputIndex++]; const inputType = question.table.inputTypes?.[id] || 'amount';
            const input = inputType === 'amount' ? this.makeAmount('table-input', `${id}の回答（金額）`, draft.cells?.[id] ?? '') : this.makeText('table-input', `${id}の回答（勘定科目）`, draft.cells?.[id] ?? '');
            input.dataset.cellId = id; input.dataset.inputType = inputType; cell.append(input);
          }
          else cell.textContent = value == null ? '' : typeof value === 'number' ? yen(value) : value;
        });
      }); wrap.append(table);
    }
    readAnswer(question) {
      if (question.type !== 'journal') { const cells = {}; this.document.querySelectorAll('.table-input').forEach(input => { cells[input.dataset.cellId] = input.value; }); return { cells }; }
      const side = name => [...this.document.querySelectorAll(`.${name}-account`)].map((account, index) => {
        const source = normalizeNumber(this.document.querySelectorAll(`.${name}-amount`)[index].value).replace(/,/g, '').trim();
        return { account: account.value, amount: source === '' ? Number.NaN : Number(source) };
      }).filter(item => item.account || Number.isFinite(item.amount));
      return { debit: side('debit'), credit: side('credit') };
    }
    result(question, score, userAnswer) {
      const standardActions = this.byId('standard-result-actions'); const examActions = this.byId('exam-result-actions');
      if (standardActions) standardActions.hidden = false; if (examActions) examActions.hidden = true;
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
          const item = answer[side][index]; const account = row.insertCell(); account.append(this.accountLabel(item?.account));
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
    renderDiagnostics(question, answer, score) {
      const diagnostics = root.WrongAnswerFeedback.diagnoseWrongAnswer(question, answer, score);
      if (!diagnostics.length) return null;
      const section = this.document.createElement('section'); section.className = 'wrong-answer-feedback'; section.setAttribute('aria-labelledby', `feedback-${question.id}`);
      const heading = this.document.createElement('h3'); heading.id = `feedback-${question.id}`; heading.textContent = 'なぜ間違えた？'; section.append(heading);
      const appendCard = (parent, diagnostic) => { const card = this.document.createElement('article'); card.className = `diagnostic-card diagnostic-${diagnostic.kind}`; const title = this.document.createElement('h4'); title.textContent = diagnostic.title; const reason = this.document.createElement('p'); reason.textContent = diagnostic.reason; const thinkingTitle = this.document.createElement('strong'); thinkingTitle.textContent = '正しい考え方'; const thinking = this.document.createElement('p'); thinking.textContent = diagnostic.thinking; const nextTitle = this.document.createElement('strong'); nextTitle.textContent = '次回の判別ポイント'; const next = this.document.createElement('p'); next.textContent = diagnostic.nextRule; card.append(title, reason, thinkingTitle, thinking, nextTitle, next); parent.append(card); };
      diagnostics.slice(0, 3).forEach(diagnostic => appendCard(section, diagnostic));
      if (diagnostics.length > 3) { const details = this.document.createElement('details'); details.className = 'diagnostic-details'; const summary = this.document.createElement('summary'); summary.textContent = `残り${diagnostics.length - 3}件の正答と根拠を見る`; details.append(summary); diagnostics.slice(3).forEach(diagnostic => appendCard(details, diagnostic)); section.append(details); }
      return section;
    }
    renderExplanation(question, score, userAnswer) {
      const container = this.byId('explanation'); container.replaceChildren();
      const diagnostics = this.renderDiagnostics(question, userAnswer, score);
      if (diagnostics) container.append(diagnostics);
      const heading = this.document.createElement('h3'); heading.textContent = '詳しい解説'; container.append(heading);
      if (question.type === 'journal' && question.answer) {
        const badges = this.document.createElement('div'); badges.className = 'explanation-accounts';
        [...question.answer.debit, ...question.answer.credit].forEach(item => badges.append(this.accountLabel(item.account)));
        container.append(badges);
      }
      this.explanationSections(question.explanation).forEach(section => {
        const card = this.document.createElement('section'); card.className = `explanation-card explanation-card-${section.kind}`;
        const title = this.document.createElement('h4'); title.textContent = section.label;
        const text = this.document.createElement('p'); text.className = 'explanation-text'; text.textContent = section.text;
        card.append(title, text); container.append(card);
      });
      this.renderKnowledgeLinks(question, container);
    }
    renderKnowledgeLinks(question, container) {
      const links = question.knowledgeLinks;
      if (!links) return;
      const card = this.document.createElement('section'); card.className = 'knowledge-links';
      const heading = this.document.createElement('h4'); heading.textContent = '理解をつなぐ次の一歩'; card.append(heading);
      const list = this.document.createElement('ul');
      [['prerequisite', '先に確認'], ['related', '関連'], ['nextConcept', '次の疑問'], ['reviewOf', '復習元']].forEach(([key, label]) => {
        const ids = Array.isArray(links[key]) ? links[key] : links[key] ? [links[key]] : [];
        ids.forEach(id => { const item = this.document.createElement('li'); const button = this.document.createElement('button'); button.type = 'button'; button.className = 'knowledge-link'; button.dataset.action = 'open-related'; button.dataset.questionId = id; button.textContent = `${label}：${id}`; item.append(button); list.append(item); });
      });
      if (list.children.length) { card.append(list); container.append(card); }
    }
    answerReviewBlock(label, question, answer) {
      const section = this.document.createElement('section'); section.className = 'exam-answer-review';
      const heading = this.document.createElement('h4'); heading.textContent = label; section.append(heading);
      if (!answer) { const empty = this.document.createElement('p'); empty.textContent = '未回答'; section.append(empty); return section; }
      if (question.type === 'journal') section.append(this.journalTable(answer));
      else {
        const list = this.document.createElement('dl'); list.className = 'exam-cell-review';
        question.table.inputCells.forEach(cellId => { const term = this.document.createElement('dt'); term.textContent = cellId; const value = this.document.createElement('dd'); value.textContent = answer.cells?.[cellId] === '' || answer.cells?.[cellId] == null ? '未入力' : String(answer.cells[cellId]); list.append(term, value); });
        section.append(list);
      }
      return section;
    }
    examResult(review, questions, history) {
      const standardActions = this.byId('standard-result-actions'); const examActions = this.byId('exam-result-actions');
      if (standardActions) standardActions.hidden = true; if (examActions) examActions.hidden = false;
      const box = this.byId('result-status'); box.className = `result-box ${review.passed ? 'result-correct' : 'result-incorrect'}`;
      box.textContent = `${review.points}点 / 100点（${review.passed ? '合格圏' : '要復習'}）｜未回答 ${review.unansweredCount}問`;
      this.byId('answer-comparison').hidden = true; this.byId('correct-journal').replaceChildren();
      const container = this.byId('explanation'); container.replaceChildren();
      const heading = this.document.createElement('h3'); heading.textContent = '問題別レビュー'; container.append(heading);
      review.items.forEach((item, index) => { const question = questions[item.id]; const details = this.document.createElement('details'); const summary = this.document.createElement('summary'); summary.textContent = `第${index + 1}問｜${item.earned}/${item.points}点｜${item.correct ? '正解' : item.answer ? '不正解' : '未回答'}｜${item.topic}`; details.append(summary, this.answerReviewBlock('自分の回答', question, item.answer), this.answerReviewBlock('正解', question, question.answer)); const diagnostics = this.renderDiagnostics(question, item.answer, { correct: item.correct }); if (diagnostics) details.append(diagnostics); const explanation = this.document.createElement('p'); explanation.className = 'exam-review-explanation'; explanation.textContent = question.explanation; details.append(explanation); container.append(details); });
      const historyHeading = this.document.createElement('h3'); historyHeading.textContent = '直近の成績'; container.append(historyHeading);
      const list = this.document.createElement('ol'); history.slice(-5).reverse().forEach(item => { const row = this.document.createElement('li'); row.textContent = `${new Date(item.finishedAt).toLocaleString('ja-JP')}｜${item.points}点｜${item.passed ? '合格圏' : '要復習'}｜所要${Math.ceil(item.durationMs / 60000)}分｜未回答${item.unansweredCount}問`; list.append(row); }); container.append(list);
    }
    explanationSections(explanation = '') {
      const parts = String(explanation).split(/【([^】]+)】/); const sections = [];
      if (parts[0].trim()) sections.push({ label: '解説', kind: 'memo', text: parts[0].trim() });
      for (let index = 1; index < parts.length; index += 2) {
        const raw = parts[index]; const label = /試験|ポイント/.test(raw) ? '試験POINT' : /根拠/.test(raw) ? '実務MEMO' : raw;
        sections.push({ label, kind: label === '試験POINT' ? 'point' : 'memo', text: (parts[index + 1] || '').trim() });
      }
      return sections.length ? sections : [{ label: '解説', kind: 'memo', text: '' }];
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
