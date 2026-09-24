(function (root) {
  'use strict';
  const normalizeNumber = value => String(value ?? '')
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  const validAmountText = value => value === '' || /^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value);
  const normalizeShortDateInput = value => {
    const original = String(value ?? '').trim();
    const normalized = original
      .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
      .replace(/／/g, '/')
      .replace(/年/g, '/')
      .replace(/月/g, '/')
      .replace(/日/g, '')
      .replace(/-/g, '/');
    let month; let day;
    const explicit = normalized.match(/^(\d{1,2})\/(\d{1,2})$/u);
    if (explicit) { month = Number(explicit[1]); day = Number(explicit[2]); }
    else if (/^\d{3,4}$/u.test(normalized)) {
      const split = normalized.length === 3 ? 1 : 2;
      month = Number(normalized.slice(0, split)); day = Number(normalized.slice(split));
    } else return original;
    const monthDays = [31,29,31,30,31,30,31,31,30,31,30,31];
    if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) return original;
    return `${month}/${day}`;
  };
  const yen = value => Number(value).toLocaleString('ja-JP');
  const GENERIC_AMOUNT_CONTENT_GLYPHS = 9;
  const journalAccountFontSize = value => {
    const glyphs = [...String(value ?? '').trim()].length;
    if (!glyphs || glyphs <= 5) return 16;
    if (glyphs <= 8) return 15;
    if (glyphs <= 10) return 14;
    return 13;
  };
  const genericTableInputCharacters = question => {
    const widths=new Map(); let inputIndex=0;
    for(const row of question.table?.rows||[]) Object.values(row).forEach((value,columnIndex)=>{
      if(value!=='入力')return;
      const column=question.table.columns[columnIndex],cellId=question.table.inputCells[inputIndex++];
      if((question.table.inputTypes?.[cellId]||'amount')!=='amount')return;
      widths.set(column,GENERIC_AMOUNT_CONTENT_GLYPHS);
    });
    return widths;
  };
  // accounting-domain.js is the production source of truth.  The two special
  // values below only keep isolated view unit tests fail-safe when scripts are
  // intentionally evaluated without the application bootstrap.
  const DOMAIN = root.AccountingDomain || { accountType: account => ({ '現金過不足':'temporary', '損益':'closing' })[account] || 'unknown', typeLabels:{ temporary:'仮勘定', closing:'決算勘定' } };
  const TABLE_LABELS = {
    account: '勘定科目', acquisitionCost: '取得原価', acquisitionDate: '取得日', amount: '金額', answer: '解答', asset: '固定資産',
    annualDepreciation: '年間減価償却額', balance: '残高', closingAccumulated: '期末減価償却累計額', closingBookValue: '期末帳簿価額', credit: '貸方', currentDepreciation: '当期減価償却額',
    date: '日付', debit: '借方', debitAccount: '借方科目', debitAmount: '借方金額', description: '摘要',
    disposalBookValue: '売却時帳簿価額', disposalLoss: '固定資産売却損', evidence: '証憑', item: '項目', life: '耐用年数', method: '償却方法', months: '使用月数', openingAccumulated: '期首減価償却累計額', quantity: '数量', residualValue: '残存価額',
    recorded: '帳簿の記録', section: '区分', transaction: '取引内容', unitPrice: '単価', value: '内容',
    creditAccount: '貸方科目', creditAmount: '貸方金額'
  };
  class AppView {
    constructor(document) { this.document = document; this.calculatorFirstInput = AppView.prefersCalculatorFirst(root); }
    static prefersCalculatorFirst(environment) {
      return environment.matchMedia?.('(hover: none) and (pointer: coarse)').matches === true;
    }
    static genericTableInputCharacters(question) { return genericTableInputCharacters(question); }
    static normalizeShortDateInput(value) { return normalizeShortDateInput(value); }
    static journalAccountFontSize(value) { return journalAccountFontSize(value); }
    byId(id) { return this.document.getElementById(id); }
    tableLabel(value) { return TABLE_LABELS[value] || value; }
    show(id) { this.document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); }
    showNotice(message, options = {}) {
      const dialog = this.byId('app-notice-dialog'); if (!dialog) return false;
      const title = this.byId('app-notice-title'); const body = this.byId('app-notice-message');
      const itemsBox = this.byId('app-notice-items');
      const cancel = this.byId('app-notice-cancel'); const confirm = this.byId('app-notice-confirm');
      title.textContent = options.title || 'お知らせ'; body.textContent = String(message ?? '');
      confirm.textContent = options.confirmLabel || '閉じる';
      cancel.hidden = !options.cancelLabel; cancel.textContent = options.cancelLabel || '戻る';
      const close = () => { if (typeof dialog.close === 'function' && dialog.open) dialog.close(); else dialog.removeAttribute('open'); };
      const noticeItems = Array.isArray(options.items) ? options.items.filter(item => item && item.id) : [];
      itemsBox.replaceChildren(...noticeItems.map(item => {
        const card = this.document.createElement('div'); card.className = 'app-notice-item';
        const copy = this.document.createElement('div'); copy.className = 'app-notice-item-copy';
        const label = this.document.createElement('strong'); label.textContent = item.label || item.id;
        const detail = this.document.createElement('p'); detail.textContent = item.detail || '';
        copy.append(label, detail);
        const button = this.document.createElement('button'); button.type = 'button'; button.className = 'secondary-button app-notice-item-action';
        button.textContent = options.itemActionLabel || '開く';
        button.setAttribute('aria-label', `${label.textContent}を開く`);
        button.onclick = () => { close(); if (typeof options.onItemSelect === 'function') options.onItemSelect(item); };
        card.append(copy, button); return card;
      }));
      itemsBox.hidden = noticeItems.length === 0;
      cancel.onclick = close;
      confirm.onclick = () => { close(); if (typeof options.onConfirm === 'function') options.onConfirm(); };
      if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
      else dialog.setAttribute('open', '');
      (itemsBox.querySelector?.('button') || confirm).focus?.(); return true;
    }
    updateRpg(rpg) {
      const status = this.byId('player-status');
      const items = [
        ['現在の役割', `Lv.${rpg.level} ${rpg.role}`],
        ['経験値', `${yen(rpg.state.xp)} EXP`],
        ['帳簿信頼度', `${rpg.state.companyHP} / 100`]
      ];
      status.replaceChildren(...items.map(([label, value]) => {
        const group = this.document.createElement('div');
        const term = this.document.createElement('dt'); term.textContent = label;
        const description = this.document.createElement('dd'); description.textContent = value;
        group.append(term, description); return group;
      }));
      const details = `総取引処理額 ${yen(rpg.state.totalTransactionAmount)}円。解放ツール ${rpg.unlockedTools.join('・')}`;
      status.title = details;
      status.setAttribute('aria-label', `学習ステータス。${items.map(([label, value]) => `${label} ${value}`).join('。')}。${details}${rpg.progressCompleted ? '。主要実務を修了済みです' : ''}`);
      if (rpg.progressCompleted) status.setAttribute('data-completed', 'true'); else status.removeAttribute('data-completed');
      this.renderOperations(rpg);
    }
    renderOperations(rpg) {
      const panel = this.byId('unlocked-operations'); if (!panel) return;
      const operations = [
        { level:5, label:'税込・税抜クイック計算', action:'tax-calculate', detail:'請求書の税込額を即座に確認' },
        { level:10, label:'過去ログ分析', action:'open-log-analysis', detail:'誤答傾向から次の調査先を特定' },
        { level:20, label:'月次決算 Boss Case', action:'start-boss', boss:'monthly', detail:'試算表・精算表の難関案件' },
        { level:30, label:'年度決算 Boss Case', action:'start-boss', boss:'annual', detail:'財務諸表を完成させ社長へ報告' }
      ];
      panel.replaceChildren(...operations.map(item => {
        const card = this.document.createElement('article'); card.className = `operation-card${rpg.level >= item.level ? ' unlocked' : ' locked'}`;
        const badge = this.document.createElement('small'); badge.textContent = rpg.level >= item.level ? '解放済み' : `Lv.${item.level}で解放`;
        const title = this.document.createElement('strong'); title.textContent = item.label;
        const detail = this.document.createElement('p'); detail.textContent = item.detail;
        const button = this.document.createElement('button'); button.type = 'button'; button.dataset.action = item.action; if (item.boss) button.dataset.boss = item.boss;
        button.textContent = rpg.level >= item.level ? (item.boss ? '案件に挑む' : 'ツールを開く') : '未解放'; button.disabled = rpg.level < item.level;
        if (item.level === 5) button.addEventListener('click', () => { const tool = this.byId('tax-tool'); tool.hidden = !tool.hidden; });
        card.append(badge, title, detail, button); return card;
      }));
    }
    renderQuestion(question, draft, mode = 'story') {
      this.questionMode = mode;
      const hintSupport = this.byId('protected-learning'); if (hintSupport) hintSupport.hidden = mode === 'exam';
      this.byId('q-category').textContent = `第${question.chapter}章｜${question.category}`;
      const story = this.byId('q-story'); story.hidden = mode !== 'story';
      if (!story.hidden) { this.byId('q-scene').textContent = question.scene; this.byId('q-context').textContent = question.story; this.byId('q-task').textContent = `今回の仕事：${question.category}`; }
      this.byId('q-text').textContent = question.question;
      this.renderMaterials(question);
      this.byId('journal-container').hidden = question.type !== 'journal';
      this.byId('table-container').hidden = question.type === 'journal';
      if (question.type === 'journal') this.renderJournal(question, draft, mode);
      else if (question.type === 'correction') this.renderCorrection(question, draft);
      else if (question.format === 'journal-book' && question.table?.inputCells?.includes('d1Account')) this.renderJournalBook(question, draft, mode);
      else if (question.format?.startsWith('bookkeeping-')) this.renderBookkeepingForm(question, draft);
      else if (question.format === 'balance-sheet') this.renderBalanceSheet(question, draft);
      else if (question.format === 'fixed-asset-ledger') this.renderFixedAssetLedger(question, draft);
      else this.renderTable(question, draft);
    }
    renderMaterials(question) {
      let container = this.byId('question-materials');
      if (!container) { container = this.document.createElement('section'); container.id = 'question-materials'; container.className = 'question-materials'; this.byId('q-text').after(container); }
      container.replaceChildren(); container.hidden = !Array.isArray(question.materials) || question.materials.length === 0;
      if (container.hidden) return;
      const heading = this.document.createElement('h3'); heading.textContent = question.materialTitle || '資料';
      const wrap = this.document.createElement('div'); wrap.className = 'materials-table-wrap';
      const table = this.document.createElement('table'); table.className = 'materials-table';
      const columns = [...new Set(question.materials.flatMap(row => Object.keys(row)))];
      const head = table.createTHead().insertRow(); columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = this.tableLabel(column); head.append(th); });
      const body = table.createTBody(); question.materials.forEach(material => { const row = body.insertRow(); columns.forEach(column => { const cell = row.insertCell(); const value = material[column]; cell.textContent = value == null ? '—' : typeof value === 'number' ? yen(value) : value; }); });
      wrap.append(table); container.append(heading, wrap);
    }
    makeAmount(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.setAttribute('inputmode', this.calculatorFirstInput ? 'none' : 'numeric');
      input.setAttribute('autocomplete', 'off'); input.setAttribute('enterkeyhint', 'done');
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.setAttribute('pattern', '(?:[0-9０-９]+|[0-9０-９]{1,3}(?:[,，][0-9０-９]{3})+)');
      input.readOnly = this.calculatorFirstInput;
      input.setAttribute('title', this.calculatorFirstInput ? '金額欄を選び、アプリ内計算機で入力します' : '数字を直接入力できます。必要に応じて計算機も使えます'); input.maxLength = 24; input.value = value;
      return input;
    }
    makeText(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.className = `${className} table-text-input`;
      input.setAttribute('aria-label', label); input.setAttribute('enterkeyhint', 'done'); input.setAttribute('autocomplete', 'off'); input.maxLength = 120; input.value = value; return input;
    }
    makeShortDateInput(className, label, value = '', placeholder = '例：7/1') {
      const input = this.makeText(className, label, value); input.classList.add('short-date-input'); input.setAttribute('inputmode', 'numeric'); input.maxLength = 8; input.placeholder = placeholder;
      const normalize = () => { const next = normalizeShortDateInput(input.value); if (next !== input.value) { input.value = next; const EventCtor = input.ownerDocument?.defaultView?.Event || root.Event; if (EventCtor) input.dispatchEvent(new EventCtor('input', { bubbles:true })); } };
      input.addEventListener('blur', normalize); input.addEventListener('change', normalize); return input;
    }
    makeDatePicker(input, label) {
      const control = this.document.createElement('span'); control.className = 'date-picker-control';
      const icon = this.document.createElement('span'); icon.className = 'date-picker-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '📅';
      const picker = this.document.createElement('input'); picker.type = 'date'; picker.className = 'date-picker-native'; picker.setAttribute('aria-label', `カレンダーから${label}を選ぶ`);
      const sync = () => { const value = normalizeShortDateInput(input.value); const match = value.match(/^(\d{1,2})\/(\d{1,2})$/u); picker.value = match ? `2000-${String(Number(match[1])).padStart(2,'0')}-${String(Number(match[2])).padStart(2,'0')}` : ''; };
      input.addEventListener('blur', sync); input.addEventListener('change', sync); sync();
      picker.addEventListener('change', () => { const match = picker.value.match(/^\d{4}-(\d{2})-(\d{2})$/u); if (!match) return; input.value = `${Number(match[1])}/${Number(match[2])}`; const EventCtor = input.ownerDocument?.defaultView?.Event || root.Event; if (EventCtor) { input.dispatchEvent(new EventCtor('input', { bubbles:true })); input.dispatchEvent(new EventCtor('change', { bubbles:true })); } });
      control.append(icon, picker); return control;
    }
    updateJournalAccountPresentation(select) {
      const value = select.value || '';
      select.style.setProperty('--journal-account-font-size', `${journalAccountFontSize(value)}px`);
      select.dataset.accountGlyphs = String([...String(value)].length);
    }
    updateSelectTitle(select) {
      select.title = select.selectedOptions[0]?.textContent || '';
      if (select.classList?.contains('debit-account') || select.classList?.contains('credit-account')) this.updateJournalAccountPresentation(select);
    }
    renderJournal(question, draft = {}, mode = 'story') {
      const container = this.byId('journal-container'); container.replaceChildren();
      if (mode === 'exam') {
        const instruction = this.document.createElement('p'); instruction.className = 'journal-instruction';
        instruction.textContent = '必要な行だけ入力し、不要な行は空欄のままにしてください。'; container.append(instruction);
      }
      const grid = this.document.createElement('div'); grid.className = 'journal-grid-scroll';
      const header = this.document.createElement('div'); header.className = 'journal-header'; header.innerHTML = '<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>'; grid.append(header);
      const count = mode === 'exam' ? 3 : Math.max(question.answer.debit.length, question.answer.credit.length);
      for (let index = 0; index < count; index += 1) {
        const row = this.document.createElement('div'); row.className = 'journal-row';
        ['debit', 'credit'].forEach(side => {
          const answer = mode === 'exam' ? null : question.answer[side][index];
          const enabled = mode === 'exam' || Boolean(answer);
          const select = this.document.createElement('select'); select.className = `${side}-account`; select.disabled = !enabled;
          select.innerHTML = `<option value="">${enabled ? '--勘定科目--' : '--入力なし--'}</option>`;
          if (enabled) root.AppController.accountChoices(question, answer?.account, mode).forEach(name => select.append(new Option(name, name)));
          const saved = draft[side] && draft[side][index]; if (saved) select.value = saved.account;
          this.updateSelectTitle(select);
          const amount = this.makeAmount(`${side}-amount`, `${side === 'debit' ? '借方' : '貸方'} ${index + 1}行目の金額`, saved ? saved.amount : '');
          if (!enabled) amount.disabled = true;
          row.append(select, amount);
        }); grid.append(row);
      }
      container.append(grid);
    }
    renderCorrection(question, draft = {}) {
      const container = this.byId('table-container'); container.replaceChildren();
      container.classList.remove('worksheet-scroll');
      const entry = this.document.createElement('div'); entry.className = 'correction-entry';
      const header = this.document.createElement('div'); header.className = 'correction-header';
      header.innerHTML = '<span>借方科目</span><span>借方金額</span><span>貸方科目</span><span>貸方金額</span>';
      const row = this.document.createElement('div'); row.className = 'correction-row';
      ['debitAccount', 'debitAmount', 'creditAccount', 'creditAmount'].forEach(cellId => {
        const label = this.tableLabel(cellId); const inputType = question.table.inputTypes?.[cellId];
        let input;
        if (inputType === 'account') {
          input = this.document.createElement('select'); input.className = 'table-input correction-account'; input.setAttribute('aria-label', label);
          input.append(new Option('--勘定科目--', ''));
          root.AppController.accountChoices(question, question.answer.cells[cellId]).forEach(name => input.append(new Option(name, name)));
          input.value = draft.cells?.[cellId] ?? ''; this.updateSelectTitle(input);
        } else input = this.makeAmount('table-input correction-amount', `${label}（金額）`, draft.cells?.[cellId] ?? '');
        input.dataset.cellId = cellId; input.dataset.inputType = inputType; row.append(input);
      });
      entry.append(header, row); container.append(entry);
    }
    renderJournalBook(question, draft = {}, mode = 'story') {
      const container = this.byId('table-container'); container.replaceChildren();
      container.classList.add('journal-book-scroll');
      const guidance = this.document.createElement('div'); guidance.className = 'journal-book-guidance';
      const folioHelp = this.document.createElement('p'); folioHelp.id = 'journal-book-folio-help'; folioHelp.className = 'journal-book-folio-help'; folioHelp.textContent = '元丁：総勘定元帳の転記先を示す番号';
      const scrollHelp = this.document.createElement('p'); scrollHelp.className = 'journal-book-scroll-note'; scrollHelp.textContent = '横にスクロールして借方・貸方を入力できます。';
      guidance.append(folioHelp, scrollHelp); container.append(guidance);
      const table = this.document.createElement('table'); table.className = 'journal-book-entry';
      const head = table.createTHead().insertRow();
      ['日付', '摘要', '元丁', '借方', '貸方'].forEach(label => {
        const th = this.document.createElement('th'); th.textContent = label; th.scope = 'col'; head.append(th);
      });
      const body = table.createTBody();
      const accountControl = (cellId, amountContext) => {
        const label = this.cellLabel(question, cellId);
        const select = this.document.createElement('select'); select.className = 'table-input journal-book-account'; select.setAttribute('aria-label', label);
        select.append(new Option('--勘定科目--', ''));
        root.AppController.accountChoices(question, question.answer.cells[cellId], mode).forEach(name => select.append(new Option(name, name)));
        select.value = draft.cells?.[cellId] ?? ''; select.dataset.cellId = cellId; select.dataset.inputType = 'account'; select.dataset.semanticType = 'account';
        const updateAmountContext = () => { const name = select.value || '科目'; amountContext.textContent = name; amountContext.title = select.value || '勘定科目を選択してください'; };
        select.addEventListener('change', updateAmountContext); updateAmountContext();
        this.updateSelectTitle(select); return select;
      };
      const folioControl = cellId => {
        const label = this.cellLabel(question, cellId); const input = this.makeText('table-input folio-input', label, draft.cells?.[cellId] ?? '');
        input.dataset.cellId = cellId; input.dataset.inputType = 'folio'; input.dataset.semanticType = 'folio'; input.setAttribute('aria-describedby', folioHelp.id); return input;
      };
      const amountControl = cellId => {
        const label = this.cellLabel(question, cellId); const input = this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[cellId] ?? '');
        input.dataset.cellId = cellId; input.dataset.inputType = 'amount'; input.dataset.semanticType = 'amount'; return input;
      };
      const amountContext = () => { const context = this.document.createElement('span'); context.className = 'journal-book-amount-context'; context.setAttribute('aria-hidden', 'true'); context.textContent = '科目'; return context; };
      const appendAmount = (cell, input, context) => {
        const line = this.document.createElement('span'); line.className = 'bookkeeping-input-line'; line.append(context, input);
        const unit = this.document.createElement('span'); unit.className = 'bookkeeping-unit'; unit.textContent = '円'; line.append(unit); cell.append(line);
      };
      for (let index = 1; question.table.inputCells.includes(`d${index}Account`); index += 1) {
        const dateId = `date${index}`;
        const dateLabel = this.cellLabel(question, dateId);
        const debit = body.insertRow(); debit.className = 'journal-book-transaction-start';
        const dateCell = debit.insertCell(); dateCell.className = 'journal-book-date-cell'; dateCell.rowSpan = 2;
        const dateInput = this.makeShortDateInput('table-input journal-book-date', dateLabel, draft.cells?.[dateId] ?? '', '月/日');
        dateInput.dataset.cellId = dateId; dateInput.dataset.inputType = 'date'; dateInput.dataset.semanticType = 'date'; dateCell.append(dateInput);
        const debitContext = amountContext();
        const debitSummary = debit.insertCell(); debitSummary.className = 'journal-book-summary-cell'; debitSummary.append(accountControl(`d${index}Account`, debitContext));
        const debitFolio = debit.insertCell(); debitFolio.className = 'journal-book-folio-cell'; debitFolio.append(folioControl(`d${index}Ref`));
        const debitAmount = debit.insertCell(); debitAmount.className = 'journal-book-amount-cell'; appendAmount(debitAmount, amountControl(`d${index}Amount`), debitContext);
        const debitBlank = debit.insertCell(); debitBlank.className = 'journal-book-empty-cell'; debitBlank.setAttribute('aria-hidden', 'true');

        const credit = body.insertRow(); credit.className = 'journal-book-credit-row';
        const creditContext = amountContext();
        const creditSummary = credit.insertCell(); creditSummary.className = 'journal-book-summary-cell'; creditSummary.append(accountControl(`c${index}Account`, creditContext));
        const creditFolio = credit.insertCell(); creditFolio.className = 'journal-book-folio-cell'; creditFolio.append(folioControl(`c${index}Ref`));
        const creditBlank = credit.insertCell(); creditBlank.className = 'journal-book-empty-cell'; creditBlank.setAttribute('aria-hidden', 'true');
        const creditAmount = credit.insertCell(); creditAmount.className = 'journal-book-amount-cell'; appendAmount(creditAmount, amountControl(`c${index}Amount`), creditContext);
      }
      container.append(table);
    }
    renderBookkeepingForm(question, draft = {}) {
      const wrap = this.byId('table-container'); wrap.replaceChildren();
      wrap.classList.remove('worksheet-scroll', 'journal-book-scroll');
      const book = this.document.createElement('section'); book.className = `bookkeeping-form ${question.format}`; book.setAttribute('aria-label', question.category);
      const heading = this.document.createElement('h3'); heading.className = 'bookkeeping-form-title'; heading.textContent = question.category; book.append(heading);
      const cells = question.table.inputCells || [];
      const fallbackLabels = Object.fromEntries(cells.map((id, index) => [id, Object.values(question.table.rows?.[index] || {})[0]]));
      const numberedRecords = /^bookkeeping-notes-/.test(question.format) && cells.some(id => /1$/.test(id))
        ? [['手形1', cells.filter(id => /1$/.test(id))], ['手形2', cells.filter(id => /2$/.test(id))], ['合計', cells.filter(id => !/[12]$/.test(id))]]
        : [[question.format === 'bookkeeping-account-ledger' ? '勘定の流れ' : '記入する帳簿行', cells]];
      const records = this.document.createElement('div'); records.className = 'bookkeeping-records';
      for (const [recordTitle, recordCells] of numberedRecords.filter(([, ids]) => ids.length)) {
        const record = this.document.createElement('section'); record.className = 'bookkeeping-record';
        const recordHeading = this.document.createElement('h4'); recordHeading.className = 'bookkeeping-record-title'; recordHeading.textContent = recordTitle; record.append(recordHeading);
        const fields = this.document.createElement('div'); fields.className = 'bookkeeping-record-fields';
        for (const cellId of recordCells) {
        const metadata = question.table.inputMetadata?.[cellId] || {};
        const semanticType = metadata.semanticType || question.table.inputTypes?.[cellId] || 'text';
        const field = this.document.createElement('div'); field.className = 'bookkeeping-field'; field.dataset.semanticType = semanticType; field.dataset.cell = cellId;
        const label = this.document.createElement('label'); label.textContent = metadata.label || fallbackLabels[cellId] || this.tableLabel(cellId); label.htmlFor = `bookkeeping-${question.id}-${cellId}`;
        const amountLike = semanticType === 'amount' || semanticType === 'unitPrice';
        const input = amountLike ? this.makeAmount('table-input bookkeeping-input', `${label.textContent}（金額）`, draft.cells?.[cellId] ?? '') : semanticType === 'date' ? this.makeShortDateInput('table-input bookkeeping-input', label.textContent, draft.cells?.[cellId] ?? '', '例：6/5') : this.makeText('table-input bookkeeping-input', label.textContent, draft.cells?.[cellId] ?? '');
        input.id = label.htmlFor; input.dataset.cellId = cellId; input.dataset.inputType = semanticType; input.dataset.semanticType = semanticType;
        if (semanticType === 'folio') input.classList.add('folio-input');
        if (semanticType === 'account') input.classList.add('account-input');
        const line = this.document.createElement('div'); line.className = 'bookkeeping-input-line'; if (semanticType === 'date') line.append(input, this.makeDatePicker(input, label.textContent)); else line.append(input);
        const units = { amount:'円', unitPrice:'円', months:'か月', years:'年' };
        if (units[semanticType]) { const unit = this.document.createElement('span'); unit.className = 'bookkeeping-unit'; unit.textContent = units[semanticType]; line.append(unit); }
        field.append(label, line); fields.append(field);
        }
        record.append(fields); records.append(record);
      }
      book.append(records); wrap.append(book);
    }
    accountType(account) {
      return DOMAIN.accountType(account);
    }
    accountLabel(account) {
      const wrap = this.document.createElement('span'); wrap.className = 'account-with-badge';
      const name = this.document.createElement('span'); name.textContent = account || '（未入力）'; wrap.append(name);
      if (account) { const type = this.accountType(account); const badge = this.document.createElement('span'); badge.className = `account-badge account-badge-${type}`; badge.textContent = DOMAIN.typeLabels[type] || '科目'; wrap.append(badge); }
      return wrap;
    }
    renderTable(question, draft = {}) {
      const wrap = this.byId('table-container'); wrap.replaceChildren();
      wrap.classList.toggle('worksheet-scroll', question.format === 'eight-column-worksheet');
      if (question.format === 'eight-column-worksheet') {
        const guide = this.document.createElement('aside'); guide.className = 'worksheet-guide';
        const title = this.document.createElement('strong'); title.textContent = '「8桁」は、金額の桁数ではなく8つの金額欄という意味です';
        const detail = this.document.createElement('p'); detail.textContent = '試算表・修正記入・損益計算書・貸借対照表に、それぞれ借方と貸方があるため、2欄×4組＝8欄です。表は横にスクロールして入力してください。';
        guide.append(title, detail); wrap.append(guide);
      }
      const table = this.document.createElement('table'); table.className = `answer-table${question.format === 'eight-column-worksheet' ? ' eight-column-worksheet' : ''}`;
      const columnTypes = new Map((question.table.columns || []).map(column => [column, 'text']));
      const inputCharacters = genericTableInputCharacters(question);
      if (question.format !== 'eight-column-worksheet') {
        let profileInputIndex = 0;
        for (const row of question.table.rows || []) Object.values(row).forEach((value, columnIndex) => {
          const column = question.table.columns[columnIndex];
          if (value === '入力') {
            const cellId = question.table.inputCells[profileInputIndex++];
            columnTypes.set(column, question.table.inputTypes?.[cellId] === 'account' ? 'account' : question.table.inputTypes?.[cellId] === 'text' ? 'text' : 'numeric');
          } else if (typeof value === 'number' && columnTypes.get(column) === 'text') columnTypes.set(column, 'numeric');
        });
        for (const column of question.table.columns || []) {
          if (column === 'life') columnTypes.set(column, 'years');
          else if (column === 'date') columnTypes.set(column, 'date');
          else if (column === 'quantity') columnTypes.set(column, 'quantity');
          else if (column === 'unitPrice') columnTypes.set(column, 'unit-price');
          else if (column === 'description') columnTypes.set(column, 'description');
          else if (/account/i.test(column) || column === 'account') columnTypes.set(column, 'account');
        }
        if (inputCharacters.size) table.style.setProperty('--table-input-ch', `${Math.max(...inputCharacters.values())}ch`);
        table.dataset.sizing = 'semantic-content';
      }
      if (question.format === 'eight-column-worksheet') table.setAttribute('role', 'grid');
      const thead = table.createTHead();
      if (question.format === 'eight-column-worksheet') {
        const groupHead = thead.insertRow();
        const accountHead = this.document.createElement('th'); accountHead.textContent = '勘定科目'; accountHead.rowSpan = 2; accountHead.scope = 'col'; groupHead.append(accountHead);
        ['試算表', '修正記入', '損益計算書', '貸借対照表'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; th.colSpan = 2; th.scope = 'colgroup'; groupHead.append(th); });
        const sideHead = thead.insertRow();
        for (let index = 0; index < 4; index += 1) ['借方', '貸方'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; th.scope = 'col'; sideHead.append(th); });
      } else {
        const head = thead.insertRow(); question.table.columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = this.tableLabel(column); th.scope = 'col'; th.dataset.columnKey = column; th.dataset.columnType = columnTypes.get(column); head.append(th); });
      }
      const body = table.createTBody(); let inputIndex = 0;
      question.table.rows.forEach(rowData => {
        const row = body.insertRow(); if (question.format === 'eight-column-worksheet') row.setAttribute('role', 'row'); Object.values(rowData).forEach((value, columnIndex) => {
          const cell = row.insertCell();
          if (question.format !== 'eight-column-worksheet') { cell.dataset.columnKey = question.table.columns[columnIndex]; cell.dataset.columnType = columnTypes.get(question.table.columns[columnIndex]); }
          if (question.format === 'eight-column-worksheet') cell.setAttribute('role', 'gridcell');
          if (question.format === 'eight-column-worksheet' && columnIndex > 0) cell.classList.add('worksheet-value-cell');
          if (value === '入力') {
            const id = question.table.inputCells[inputIndex++]; const inputType = question.table.inputTypes?.[id] || 'amount';
            const metadata = question.table.inputMetadata?.[id]; const label = metadata?.label || this.cellLabel(question, id);
            const input = inputType === 'amount' ? this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[id] ?? '') : inputType === 'date' ? this.makeShortDateInput('table-input', label, draft.cells?.[id] ?? '') : this.makeText('table-input', label, draft.cells?.[id] ?? '');
            if (inputType === 'amount') cell.classList.add('amount-cell');
            if (inputType === 'amount') cell.style.setProperty('--column-input-ch', `${inputCharacters.get(question.table.columns[columnIndex]) || 9}ch`);
            input.dataset.cellId = id; input.dataset.inputType = inputType; if (inputType === 'date') { const line = this.document.createElement('div'); line.className = 'table-date-input-line'; line.append(input, this.makeDatePicker(input, label)); cell.append(line); } else cell.append(input);
          }
          else { cell.textContent = value == null ? '' : typeof value === 'number' ? yen(value) : this.tableLabel(value); if (typeof value === 'number') cell.classList.add('amount-cell'); }
        });
      }); wrap.append(table); if (question.format !== 'eight-column-worksheet') this.positionStickyContextColumns(table);
    }
    renderFixedAssetLedger(question, draft = {}) {
      const wrap = this.byId('table-container'); wrap.replaceChildren();
      wrap.classList.remove('worksheet-scroll', 'journal-book-scroll');
      const ledger = this.document.createElement('div'); ledger.className = 'fixed-asset-ledger'; let inputIndex = 0;
      for (const [rowIndex, row] of question.table.rows.entries()) {
        const section = this.document.createElement('section'); section.className = 'fixed-asset-card';
        const title = this.document.createElement('h3'); title.textContent = row.asset || `固定資産${rowIndex + 1}`; section.append(title);
        const fields = this.document.createElement('div'); fields.className = 'fixed-asset-fields';
        for (const [key, value] of Object.entries(row)) {
          if (key === 'asset') continue;
          const field = this.document.createElement('div'); field.className = 'fixed-asset-field'; field.dataset.field = key;
          if (value === '入力') {
            const cellId = question.table.inputCells[inputIndex++]; const metadata = question.table.inputMetadata?.[cellId] || {};
            const semanticType = metadata.semanticType || 'amount'; const label = this.document.createElement('label');
            label.textContent = metadata.label || this.tableLabel(key); label.htmlFor = `fixed-asset-${question.id}-${cellId}`;
            const input = semanticType === 'amount' ? this.makeAmount('table-input fixed-asset-input', `${label.textContent}（金額）`, draft.cells?.[cellId] ?? '') : semanticType === 'date' ? this.makeShortDateInput('table-input fixed-asset-input', label.textContent, draft.cells?.[cellId] ?? '', '例：7/1') : this.makeText('table-input fixed-asset-input', label.textContent, draft.cells?.[cellId] ?? '');
            input.id = label.htmlFor; input.dataset.cellId = cellId; input.dataset.inputType = question.table.inputTypes?.[cellId] || 'text'; input.dataset.semanticType = semanticType;
            if (semanticType === 'months') input.inputMode = 'numeric';
            const line = this.document.createElement('div'); line.className = 'fixed-asset-input-line'; if (semanticType === 'date') line.append(input, this.makeDatePicker(input, label.textContent)); else line.append(input);
            if (semanticType === 'amount' || semanticType === 'months') { const unit = this.document.createElement('span'); unit.className = 'fixed-asset-unit'; unit.textContent = semanticType === 'amount' ? '円' : 'か月'; line.append(unit); }
            field.append(label, line);
          } else {
            const label = this.document.createElement('span'); label.className = 'fixed-asset-label'; label.textContent = this.tableLabel(key);
            const shown = this.document.createElement('strong'); shown.textContent = typeof value === 'number' ? yen(value) : String(value ?? '—');
            const unit = ['acquisitionCost','residualValue','openingAccumulated','salePrice'].includes(key) ? '円' : key === 'life' ? '年' : ''; if (unit) shown.textContent += unit;
            field.append(label, shown);
          }
          fields.append(field);
        }
        section.append(fields); ledger.append(section);
      }
      wrap.append(ledger);
    }
    positionStickyContextColumns(table) {
      this.stickyContextObserver?.disconnect();
      const update = () => this.updateStickyContextColumns(table);
      update();
      if (root.ResizeObserver) {
        this.stickyContextObserver = new root.ResizeObserver(update);
        this.stickyContextObserver.observe(table);
      }
    }
    updateStickyContextColumns(table) {
      const keys = ['description','quantity']; let left = 0;
      for (const key of keys) {
        const cells = [...table.querySelectorAll(`[data-column-key="${key}"]`)]; if (!cells.length) continue;
        cells.forEach(cell => { cell.dataset.stickyContext = 'true'; cell.style.setProperty('--sticky-left', `${left}px`); });
        left += cells[0].getBoundingClientRect().width;
      }
      table.style.setProperty('--sticky-context-width', `${left}px`);
    }
    renderBalanceSheet(question, draft = {}, comparison = null) {
      const wrap = comparison ? this.document.createElement('div') : this.byId('table-container');
      if (!comparison) wrap.replaceChildren();
      wrap.classList.add(comparison ? 'balance-sheet-comparison-wrap' : 'balance-sheet-wrap');
      const table = this.document.createElement('table'); table.className = 'balance-sheet-table';
      table.setAttribute('aria-label', '貸借対照表');
      const groups = table.createTHead().insertRow();
      [['資産', 2], ['負債・純資産', 2]].forEach(([label, span]) => { const th = this.document.createElement('th'); th.textContent = label; th.colSpan = span; th.scope = 'colgroup'; groups.append(th); });
      const columns = table.tHead.insertRow();
      ['科目', '金額', '科目', '金額'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; th.scope = 'col'; columns.append(th); });
      const sourceRows = question.table.rows.filter(row => row.section !== '合計');
      const left = sourceRows.filter(row => row.section === '資産');
      const right = sourceRows.filter(row => row.section === '負債' || row.section === '純資産');
      const isSectionStart = (rows, index) => index === 0 || rows[index]?.section !== rows[index - 1]?.section;
      const appendValue = (tr, row, sectionStart) => {
        const account = tr.insertCell(); account.className = 'balance-account'; account.textContent = row?.account || '';
        const amount = tr.insertCell(); amount.className = 'balance-amount';
        if (!row) return;
        if (row && sectionStart) {
          const section = this.document.createElement('span'); section.className = 'balance-section-label'; section.textContent = `${row.section}の部`; account.prepend(section);
          tr.classList.add('balance-section-start');
        }
        const cellId = row.inputCellId;
        if (row.amount !== '入力') { amount.textContent = typeof row.amount === 'number' ? yen(row.amount) : row.amount; return; }
        if (comparison) {
          const actual = this.document.createElement('span'); actual.className = 'comparison-actual'; actual.textContent = `入力 ${this.comparisonValue(question, cellId, comparison.user.cells?.[cellId])}`;
          const expected = this.document.createElement('span'); expected.className = 'comparison-expected'; expected.textContent = `正解 ${this.comparisonValue(question, cellId, question.answer.cells[cellId])}`;
          amount.append(actual, expected); return;
        }
        const input = this.makeAmount('table-input', `${row.account}（金額）`, draft.cells?.[cellId] ?? ''); input.dataset.cellId = cellId; input.dataset.inputType = 'amount'; amount.append(input);
      };
      const body = table.createTBody();
      for (let index = 0; index < Math.max(left.length, right.length); index += 1) { const tr = body.insertRow(); appendValue(tr, left[index], isSectionStart(left, index)); appendValue(tr, right[index], isSectionStart(right, index)); }
      const foot = table.createTFoot().insertRow();
      const appendTotal = (label, cellId) => {
        const name = foot.insertCell(); name.className = 'balance-total-label'; name.textContent = label;
        const amount = foot.insertCell(); amount.className = 'balance-amount balance-total-amount';
        if (comparison) {
          amount.innerHTML = `<span class="comparison-actual">入力 ${this.comparisonValue(question, cellId, comparison.user.cells?.[cellId])}</span><span class="comparison-expected">正解 ${this.comparisonValue(question, cellId, question.answer.cells[cellId])}</span>`;
        } else { const input = this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[cellId] ?? ''); input.dataset.cellId = cellId; input.dataset.inputType = 'amount'; amount.append(input); }
      };
      const totals = question.table.rows.filter(row => row.section === '合計');
      appendTotal(totals[0]?.account || '資産合計', totals[0]?.inputCellId); appendTotal(totals[1]?.account || '負債・純資産合計', totals[1]?.inputCellId);
      wrap.append(table); return wrap;
    }
    readAnswer(question) {
      if (question.type !== 'journal') { const cells = {}; this.document.querySelectorAll('.table-input').forEach(input => { cells[input.dataset.cellId] = input.value; }); return { cells }; }
      const side = name => [...this.document.querySelectorAll(`.${name}-account`)].map((account, index) => {
        const raw = this.document.querySelectorAll(`.${name}-amount`)[index].value.trim();
        const source = normalizeNumber(raw);
        return { account: account.value, amount: source === '' || !validAmountText(source) ? Number.NaN : Number(source.replace(/,/g, '')), attempted: Boolean(account.value || raw) };
      }).filter(item => item.attempted).map(({ account, amount }) => ({ account, amount }));
      return { debit: side('debit'), credit: side('credit') };
    }
    result(question, score, userAnswer, confidence = 'unsure', achievement = {}, retryAuthorized = false) {
      const standardActions = this.byId('standard-result-actions'); const examActions = this.byId('exam-result-actions');
      if (standardActions) standardActions.hidden = false; if (examActions) examActions.hidden = true;
      const retryAction = this.document.querySelector('[data-action="coaching-retry-result"]');
      if (retryAction) retryAction.hidden = !retryAuthorized;
      const topActions = this.byId('top-result-actions'); if (topActions) topActions.hidden = false;
      const box = this.byId('result-status'); box.className = `result-box ${score.correct ? 'result-correct' : 'result-incorrect'}`;
      const calibration = confidence === 'sure'
        ? (score.correct ? '自信と理解が一致しました。この判断軸を次の仕事でも再現しましょう。' : '強い思い込みを発見できました。今ここで直せば、次の正解がより確かな力になります。')
        : (score.correct ? '慎重に考えて正解へ到達しました。解説で根拠を言葉にすると自信へ変わります。' : '「まだ自信なし」と見抜けたことも前進です。解説の判別ポイントを一つ持ち帰りましょう。');
      const headline = this.document.createElement('strong'); headline.className = 'result-headline'; headline.textContent = score.correct ? '正解です！' : 'もう一歩です';
      const confidenceFeedback = this.document.createElement('span'); confidenceFeedback.className = `confidence-feedback confidence-${confidence}-${score.correct ? 'correct' : 'wrong'}`;
      confidenceFeedback.textContent = `${confidence === 'sure' ? '自信あり' : 'まだ自信なし'} × ${score.correct ? '正解' : '要確認'}｜${calibration}`;
      box.replaceChildren(headline, confidenceFeedback);
      this.renderAchievement(box, achievement);
      this.renderAnswerComparison(question, score, userAnswer);
      this.renderCorrectJournal(question);
      this.renderExplanation(question, score, userAnswer);
    }
    protectedResult(confidence = 'unsure', retry = false) {
      const panel = this.byId('protected-learning'); const status = this.byId('protected-status');
      panel.hidden = false;
      status.hidden = false;
      status.replaceChildren();
      const headline = this.document.createElement('strong'); headline.className = 'result-headline'; headline.textContent = retry ? '練習の回答はまだ要確認です' : '最初の回答はもう一歩です';
      const guidance = this.document.createElement('span'); guidance.className = 'confidence-feedback'; guidance.textContent = confidence === 'sure' ? '自信ありとして記録しました。根拠を順に確認しましょう。' : 'まだ自信なしとして記録しました。ヒントを使って確認できます。';
      status.append(headline, guidance); status.focus?.();
    }
    applyRetryDraft(question, draft = {}) {
      if (question.type === 'journal') {
        ['debit','credit'].forEach(side => {
          const accounts = this.document.querySelectorAll(`.${side}-account`); const amounts = this.document.querySelectorAll(`.${side}-amount`);
          accounts.forEach((account, index) => { const row = draft[side]?.[index]; account.value = row?.account || ''; if (amounts[index]) amounts[index].value = row?.amount ?? ''; this.updateSelectTitle(account); });
        });
        return;
      }
      this.document.querySelectorAll('.table-input').forEach(input => { input.value = draft.cells?.[input.dataset.cellId] ?? ''; if (input.tagName === 'SELECT') this.updateSelectTitle(input); });
    }
    setAnswerMode(mode) {
      const form = this.byId('question-form'); const locked = mode === 'protected'; const coaching = mode === 'coaching';
      form?.querySelectorAll('input, select, textarea').forEach(field => {
        if (locked && !field.disabled) { field.dataset.flowLocked = 'true'; field.disabled = true; }
        else if (!locked && field.dataset.flowLocked === 'true') { field.disabled = false; delete field.dataset.flowLocked; }
      });
      const actions = form?.querySelector('.question-actions'); if (actions) actions.hidden = locked;
      const confidence = form?.querySelector('.confidence-selector'); if (confidence) confidence.hidden = coaching;
      const save = form?.querySelector('.save-button'); if (save) save.hidden = coaching;
      const saveStatus = this.byId('save-status'); if (saveStatus) saveStatus.hidden = coaching;
      const protectedPanel = this.byId('protected-learning'); if (protectedPanel) protectedPanel.hidden = coaching || this.questionMode === 'exam';
      const submit = form?.querySelector('button[type="submit"]'); if (submit) submit.textContent = coaching ? '練習回答を確認する' : '回答を確定する';
      form?.setAttribute('data-answer-mode', mode);
    }
    resetLearningSurfaces() {
      const protectedPanel = this.byId('protected-learning'); if (protectedPanel) protectedPanel.hidden = false;
      const protectedStatus = this.byId('protected-status'); if (protectedStatus) { protectedStatus.hidden = true; protectedStatus.replaceChildren(); }
      const hintPanel = this.byId('hint-panel'); if (hintPanel) hintPanel.hidden = true;
      const heading = this.byId('hint-heading'); if (heading) heading.textContent = '';
      const text = this.byId('hint-text'); if (text) text.textContent = '';
      const first = this.document.querySelector('[data-action="hint-1"]'); if (first) { first.hidden = false; first.disabled = false; }
      const second = this.document.querySelector('[data-action="hint-2"]'); if (second) { second.hidden = true; second.disabled = false; }
      ['result-status','answer-comparison','correct-journal','explanation'].forEach(id => this.byId(id)?.replaceChildren());
      const top = this.byId('top-result-actions'); if (top) top.hidden = true;
    }
    hideProtectedResult() { const panel = this.byId('protected-learning'); if (panel) panel.hidden = true; const status = this.byId('protected-status'); if (status) { status.hidden = true; status.replaceChildren(); } }
    renderHint(stage, text) {
      const panel = this.byId('hint-panel'); const heading = this.byId('hint-heading');
      panel.hidden = false; heading.textContent = `ヒント ${stage}`; this.byId('hint-text').textContent = text;
      const second = this.document.querySelector('[data-action="hint-2"]'); if (second) second.hidden = stage < 1;
      const first = this.document.querySelector('[data-action="hint-1"]'); if (first) first.hidden = stage >= 1;
      if (second && stage >= 2) second.hidden = true;
      heading.focus?.();
    }
    renderAchievement(anchor, achievement = {}) {
      let banner = this.byId('achievement-banner');
      if (!banner) { banner = this.document.createElement('aside'); banner.id = 'achievement-banner'; banner.className = 'achievement-banner'; banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite'); anchor.after(banner); }
      const unlocks = [achievement.level ? `LEVEL UP！ Lv.${achievement.level}` : '', achievement.role ? `NEW ROLE！「${achievement.role}」解放 — 新ツールと専用Boss Caseを確認できます` : ''].filter(Boolean);
      banner.hidden = unlocks.length === 0; banner.textContent = unlocks.join(' ／ ');
      if (!banner.isConnected) anchor.after(banner);
    }
    journalTable(answer) {
      const wrap = this.document.createElement('div'); wrap.className = 'journal-table-wrap';
      const table = this.document.createElement('table'); table.className = 'journal-table';
      const tableHead = table.createTHead(); const sideHead = tableHead.insertRow();
      [['借方', 'debit'], ['貸方', 'credit']].forEach(([label, side]) => { const th = this.document.createElement('th'); th.colSpan = 2; th.scope = 'colgroup'; th.className = `journal-side-${side}`; th.textContent = label; sideHead.append(th); });
      const columnHead = tableHead.insertRow();
      ['借方科目', '借方金額', '貸方科目', '貸方金額'].forEach(label => { const th = this.document.createElement('th'); th.scope = 'col'; th.textContent = label; columnHead.append(th); });
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
    correctionJournal(answer = {}) {
      const cells = answer.cells || answer;
      const row = side => ({ account:cells[`${side}Account`] || '', amount:Number(normalizeNumber(cells[`${side}Amount`] ?? '').replace(/,/g, '')) });
      return { debit:[row('debit')], credit:[row('credit')] };
    }
    comparisonValue(question, cellId, value) {
      if (value == null || value === '' || (typeof value === 'number' && !Number.isFinite(value))) return '未入力';
      const semanticType = question.table?.inputMetadata?.[cellId]?.semanticType;
      if ((semanticType === 'amount' || semanticType === 'unitPrice') && Number.isFinite(Number(normalizeNumber(value).replace(/,/g, '')))) {
        return `${yen(normalizeNumber(value).replace(/,/g, ''))}円`;
      }
      return String(value);
    }
    tableAnswerComparison(question, score, userAnswer) {
      const detailMap = new Map((score.details || []).map(detail => [detail.cellId, detail]));
      const wrap = this.document.createElement('div'); wrap.className = 'answer-comparison-table-wrap';
      const table = this.document.createElement('table'); table.className = 'answer-comparison-table';
      const head = table.createTHead().insertRow();
      ['項目', 'あなたの解答', '正しい解答', '判定'].forEach(label => { const th = this.document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); });
      const body = table.createTBody();
      question.table.inputCells.forEach(cellId => {
        const correct = detailMap.get(cellId)?.correct === true; const row = body.insertRow();
        if (!correct) row.className = 'comparison-row-mismatch';
        const label = row.insertCell(); label.textContent = question.table.inputMetadata?.[cellId]?.label || this.cellLabel(question, cellId);
        const actual = row.insertCell(); actual.textContent = this.comparisonValue(question, cellId, userAnswer.cells?.[cellId]);
        if (!correct) actual.className = 'cell-mismatch';
        const expected = row.insertCell(); expected.textContent = this.comparisonValue(question, cellId, question.answer.cells?.[cellId]);
        const status = row.insertCell(); status.className = `comparison-status ${correct ? 'comparison-status-match' : 'comparison-status-mismatch'}`; status.textContent = correct ? '一致' : '要確認';
      });
      wrap.append(table); return wrap;
    }
    worksheetAnswerComparison(question, score, userAnswer) {
      const details = new Map((score.details || []).map(detail => [detail.cellId, detail.correct === true]));
      const wrap = this.document.createElement('div'); wrap.className = 'answer-comparison-table-wrap';
      const table = this.document.createElement('table'); table.className = 'answer-comparison-table worksheet-answer-comparison';
      const head = table.createTHead().insertRow(); question.table.columns.forEach(column => { const th = this.document.createElement('th'); th.scope = 'col'; th.textContent = this.tableLabel(column); head.append(th); });
      const body = table.createTBody(); let inputIndex = 0;
      question.table.rows.forEach(rowData => {
        const row = body.insertRow();
        Object.values(rowData).forEach(value => {
          const cell = row.insertCell();
          if (value !== '入力') { cell.textContent = typeof value === 'number' ? yen(value) : this.tableLabel(value); return; }
          const cellId = question.table.inputCells[inputIndex++]; const correct = details.get(cellId) === true;
          const pair = this.document.createElement('div'); pair.className = `worksheet-comparison-pair${correct ? '' : ' cell-mismatch'}`;
          const actual = this.document.createElement('span'); actual.className = 'comparison-actual'; actual.textContent = `入力 ${this.comparisonValue(question, cellId, userAnswer.cells?.[cellId])}`;
          const expected = this.document.createElement('span'); expected.className = 'comparison-expected'; expected.textContent = `正解 ${this.comparisonValue(question, cellId, question.answer.cells?.[cellId])}`;
          pair.append(actual, expected); cell.append(pair);
        });
      });
      wrap.append(table); return wrap;
    }
    renderAnswerComparison(question, score, userAnswer) {
      const container = this.byId('answer-comparison'); container.replaceChildren();
      container.hidden = true;
      if (score.correct || !userAnswer) return;
      container.hidden = false;
      const heading = this.document.createElement('h3');
      if (question.type === 'journal') {
        heading.textContent = '最初の仕訳（誤答）';
        const note = this.document.createElement('p'); note.textContent = '下の「正しい仕訳」と、科目・貸借・金額を一つずつ見比べましょう。';
        container.append(heading, note, this.journalTable(userAnswer));
        return;
      }
      if (question.type === 'correction') {
        heading.textContent = '最初の訂正仕訳（誤答）';
        const note = this.document.createElement('p'); note.textContent = '下の「正しい訂正仕訳」と、借方・貸方の科目と金額を見比べましょう。';
        container.append(heading, note, this.journalTable(this.correctionJournal(userAnswer)));
        return;
      }
      if (question.type === 'worksheet') {
        heading.textContent = '最初の回答を決算整理表で比較';
        const note = this.document.createElement('p'); note.textContent = '問題と同じ行・列の中で、入力した値と正解を横に見比べましょう。';
        container.append(heading, note, this.worksheetAnswerComparison(question, score, userAnswer));
        return;
      }
      if (question.format === 'balance-sheet') {
        heading.textContent = '最初の回答を貸借対照表で比較';
        const note = this.document.createElement('p'); note.textContent = '資産と負債・純資産の左右を保ったまま、入力と正解を見比べましょう。';
        container.append(heading, note, this.renderBalanceSheet(question, {}, { user:userAnswer, score }));
        return;
      }
      heading.textContent = '最初の解答と正しい解答';
      const note = this.document.createElement('p'); note.textContent = '「要確認」は最初の回答時の判定です。最初の入力と正解の違いを確認しましょう。';
      container.append(heading, note, this.tableAnswerComparison(question, score, userAnswer));
    }
    renderDiagnostics(question, answer, score) {
      const diagnostics = root.WrongAnswerFeedback.diagnoseWrongAnswer(question, answer, score);
      if (!diagnostics.length) return null;
      const section = this.document.createElement('section'); section.className = 'wrong-answer-feedback'; section.setAttribute('aria-label', '誤答理由と考え方');
      const appendCard = (parent, diagnostic) => { const card = this.document.createElement('article'); card.className = `diagnostic-card diagnostic-${diagnostic.kind}`; const title = this.document.createElement('h4'); title.textContent = diagnostic.title; const reason = this.document.createElement('p'); reason.textContent = diagnostic.reason; card.append(title, reason); parent.append(card); };
      diagnostics.slice(0, 3).forEach(diagnostic => appendCard(section, diagnostic));
      if (diagnostics.length > 3) { const details = this.document.createElement('details'); details.className = 'diagnostic-details'; const summary = this.document.createElement('summary'); summary.textContent = `残り${diagnostics.length - 3}件の正答と根拠を見る`; details.append(summary); diagnostics.slice(3).forEach(diagnostic => appendCard(details, diagnostic)); section.append(details); }
      const diagnostic = diagnostics[0];
      const next = this.document.createElement('p'); next.className = 'diagnostic-next'; next.textContent = `次の確認：${diagnostic.nextRule}`; section.append(next);
      return section;
    }
    renderStructuredExplanation(question, userAnswer, score) {
      if (score.correct || !question.explanationModel || !root.ExplanationModel?.build) return null;
      const model = root.ExplanationModel.build(question, userAnswer || {}, score);
      const valueText = value => typeof value === 'number' ? `${yen(value)}円` : value === true ? '確認' : String(value ?? '');
      const flow = this.document.createElement('section'); flow.className = 'explanation-flow'; flow.setAttribute('aria-label', 'この問題をもう一度解く手順');
      const intro = this.document.createElement('h4'); intro.className = 'explanation-flow-title'; intro.textContent = 'この問題をもう一度解く手順'; flow.append(intro);
      const journalBook = question.type === 'journal' || question.format === 'journal-book' || /仕訳帳/u.test(question.category || '');
      const hasMeaningfulCalculation = (model.calculation || []).some(item => /[×÷＋+−\-＝=]/u.test(String(item.expression || '')));
      const teachingProfile = {
        journal:{summary:'どういう取引か考える',transfer:'借方・貸方を決めて仕訳する'},
        ledger:{summary:journalBook?'どういう取引か考える':'増減の流れをつかむ',transfer:journalBook?'借方・貸方を決めて仕訳帳に記入する':'帳簿に記入する'},
        trial_balance:{summary:'残高の置き場所を決める',transfer:'試算表に記入する'},
        correction:{summary:'どこが違うか整理する',transfer:'訂正仕訳を書く'},
        worksheet:{summary:'決算整理を反映する',transfer:'精算表に記入する'},
        financial_statement:{summary:'どの区分に入るか決める',transfer:'財務諸表に記入する'},
        comprehensive:{summary:'処理の順番を整理する',transfer:'答えに反映する'}
      }[question.type] || {summary:'処理のポイントをつかむ',transfer:'答えに書き込む'};
      const definitions = [
        ['まずここを確認','sources'],
        [teachingProfile.summary,'summary'],
        ...(hasMeaningfulCalculation ? [['必要な金額を出す','calculation']] : []),
        [teachingProfile.transfer,'transfer'],
        ['最後に確認','checks'],
        ['間違えやすいところ','mistakes']
      ];
      const element = (tag, className, text) => { const node = this.document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
      definitions.forEach(([label, key], index) => {
        const section = element('section', 'explanation-flow-section'); section.dataset.section = key;
        const head = element('div', 'explanation-flow-head'); head.append(element('div', 'explanation-flow-step', String(index + 1)), element('h5', '', label)); section.append(head);
        const items = model[key] || [];
        if (!items.length) section.append(element('p', 'explanation-flow-empty', 'この問題では追加情報はありません。'));
        if (key === 'sources') items.forEach(item => { const card = element('article', 'explanation-source-card'); card.append(element('h6', '', item.title), element('p', 'explanation-source-focus', item.focus)); const list = element('dl', 'explanation-source-values'); (item.values || []).forEach(value => { const row = element('div', 'explanation-source-value'); row.append(element('dt', '', value.label), element('dd', '', valueText(value.value))); list.append(row); }); card.append(list); section.append(card); });
        if (key === 'summary') { const list = element('div', 'explanation-summary-list'); items.forEach(item => list.append(element('p', 'explanation-summary-item', item.text))); section.append(list); }
        if (key === 'calculation') items.forEach(item => { const card = element('article', 'explanation-formula'); card.append(element('div', 'explanation-formula-label', item.label), element('strong', '', item.expression || `答え：${valueText(item.result)}`)); if (item.operands?.length) { const operands = element('div', 'explanation-operands'); item.operands.forEach(value => operands.append(element('span', 'explanation-operand', `${value.label} ${valueText(value.value)}`))); card.append(operands); } section.append(card); });
        if (key === 'transfer') items.forEach(item => { const card = element('article', 'explanation-transfer-card'), from = element('div', 'explanation-transfer-from'), to = element('div', 'explanation-transfer-to'); from.append(element('strong', '', item.from), element('div', '', item.decision)); to.append(element('strong', '', item.to), element('div', '', valueText(item.value))); const arrow = element('div', 'explanation-transfer-arrow', '→'); arrow.setAttribute('aria-hidden', 'true'); card.append(from, arrow, to); section.append(card); });
        if (key === 'checks') { const list = element('div', 'explanation-checks'); items.forEach(item => { const card = element('article', 'explanation-check-item'); card.append(element('div', 'explanation-check-mark', '✓')); const body = element('div', 'explanation-check-body'); body.append(element('strong', '', item.label), element('span', '', valueText(item.expected))); card.append(body); list.append(card); }); section.append(list); }
        if (key === 'mistakes') items.forEach(item => { const card = element('article', 'explanation-mistake-card'); card.append(element('h6', '', item.title), element('p', '', item.reason), element('p', 'explanation-mistake-fix', `直し方：${item.correction}`)); section.append(card); });
        flow.append(section);
      });
      return flow;
    }
    appendAuthoredExplanation(question, container, authoredOnly = false) {
      if (question.npcDialogue) { const dialogue = this.document.createElement('blockquote'); dialogue.className = 'npc-dialogue'; dialogue.textContent = question.npcDialogue; container.append(dialogue); }
      if (question.type === 'journal' && question.answer) { const badges = this.document.createElement('div'); badges.className = 'explanation-accounts'; [...question.answer.debit, ...question.answer.credit].forEach(item => badges.append(this.accountLabel(item.account))); container.append(badges); }
      let explanation = String(question.explanation || '');
      if (authoredOnly) {
        const markers = ['【この問題への当てはめ】','【使用する資料】'].map(marker => explanation.indexOf(marker)).filter(index => index >= 0);
        if (markers.length) explanation = explanation.slice(0, Math.min(...markers)).trimEnd();
      }
      this.explanationSections(explanation).forEach(section => { const card = this.document.createElement('section'); card.className = `explanation-card explanation-card-${section.kind}`; const title = this.document.createElement('h4'); title.textContent = section.label; const text = this.document.createElement('p'); text.className = 'explanation-text'; text.textContent = section.text; card.append(title, text); container.append(card); });
      this.renderKnowledgeLinks(question, container);
    }
    renderExplanation(question, score, userAnswer) {
      const container = this.byId('explanation'); container.replaceChildren();
      const heading = this.document.createElement('h3'); heading.textContent = '今回の解説'; container.append(heading);
      const lead = this.document.createElement('p'); lead.className = 'explanation-summary';
      lead.textContent = score.correct
        ? '正解です。答えの根拠、実務での使い方、試験での見分け方を順に確認しましょう。'
        : 'もう一歩です。誤答の原因から正しい考え方へつなげ、実務と試験で使える判断手順まで一続きで確認しましょう。';
      container.append(lead);
      const structured = this.renderStructuredExplanation(question, userAnswer, score);
      if (structured) { container.append(structured); this.appendAuthoredExplanation(question, container, true); return; }
      const solution = this.document.createElement('section'); solution.className = 'solution-steps';
      const solutionHeading = this.document.createElement('h4'); solutionHeading.textContent = '解き方（この順番で考える）';
      const list = this.document.createElement('ol');
      const steps = {
        journal:['取引によって増えたものと減ったものを拾います。','それぞれに適切な勘定科目を当てはめます。','資産・費用の増加は借方、負債・純資産・収益の増加は貸方に置き、減少は反対側に置きます。','借方合計と貸方合計が一致するまで金額を確認します。'],
        correction:['帳簿に記録済みの仕訳を、借方・貸方に分けて書き出します。','証憑から本来の正しい仕訳を作ります。','誤った部分を逆向きにして取り消し、正しい処理との差額だけを訂正仕訳にします。','訂正仕訳を元の帳簿へ加え、証憑どおりの科目・金額になるか検算します。'],
        ledger:['証憑を日付順に並べ、記帳する取引を選びます。','相手勘定と増減額を該当する行へ転記します。','直前残高へ増加を足し、減少を引いて新しい残高を求めます。','日付・相手勘定・最終残高を資料と照合します。'],
        trial_balance:['各勘定の最終残高と残高方向を確認します。','借方残高は借方列、貸方残高は貸方列へ一度だけ転記します。','各列を合計します。','借方合計と貸方合計の一致で転記漏れや二重計上を検算します。'],
        worksheet:['試算表の残高を出発点にします。','決算整理事項を仕訳にし、修正記入の借方・貸方へ記入します。','修正後の各勘定を、収益・費用は損益計算書、資産・負債・純資産は貸借対照表へ振り分けます。','各欄の借方・貸方を合計し、差額となる当期純利益まで一致を確認します。'],
        financial_statement:['資料から収益・費用・資産・負債・純資産を分類します。','収益から売上原価と費用を差し引いて利益を求めます。','期末残高を対応する財務諸表の欄へ転記します。','合計や貸借の一致を確認します。'],
        comprehensive:['資料ごとに必要な取引を仕訳します。','仕訳を帳簿へ転記して残高を集計します。','決算整理事項を反映します。','各段階の貸借一致を確認して最終数値を記入します。']
      }[question.type] || ['資料の条件を整理します。','必要な会計処理を決めます。','計算して対応する欄へ転記します。','合計と資料を照合して検算します。'];
      steps.forEach(step => { const item = this.document.createElement('li'); item.textContent = step; list.append(item); });
      solution.append(solutionHeading, list); container.append(solution);
      const diagnostics = this.renderDiagnostics(question, userAnswer, score);
      if (diagnostics) container.append(diagnostics);
      this.appendAuthoredExplanation(question, container);
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
        question.table.inputCells.forEach(cellId => { const term = this.document.createElement('dt'); term.textContent = this.cellLabel(question, cellId); const value = this.document.createElement('dd'); value.textContent = answer.cells?.[cellId] === '' || answer.cells?.[cellId] == null ? '未入力' : String(answer.cells[cellId]); list.append(term, value); });
        section.append(list);
      }
      return section;
    }
    cellLabel(question, cellId) {
      const index = question.table.inputCells.indexOf(cellId); let seen = -1;
      for (const row of question.table.rows) {
        if (Object.values(row).includes('入力')) { seen += 1; if (seen === index) { const fixed = Object.values(row).find(value => value !== '入力' && value != null && value !== ''); if (fixed != null) return String(fixed); } }
      }
      return `回答欄${index + 1}`;
    }
    examResult(review, questions, history, achievement = {}) {
      const standardActions = this.byId('standard-result-actions'); const examActions = this.byId('exam-result-actions');
      if (standardActions) standardActions.hidden = true; if (examActions) examActions.hidden = false;
      const box = this.byId('result-status'); box.className = `result-box ${review.passed ? 'result-correct' : 'result-incorrect'}`;
      box.textContent = `${review.points}点 / 100点（${review.passed ? '合格圏' : '要復習'}）｜未回答 ${review.unansweredCount}問`;
      this.renderAchievement(box, achievement);
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
      if (!['journal', 'correction'].includes(question.type) || !question.answer) return;
      const heading = this.document.createElement('h3'); heading.textContent = question.type === 'correction' ? '正しい訂正仕訳' : '正しい仕訳';
      const answer = question.type === 'correction' ? this.correctionJournal(question.answer) : question.answer;
      container.append(heading, this.journalTable(answer));
    }
  }
  root.AppView = AppView;
}(window));
