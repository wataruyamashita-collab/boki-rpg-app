(function (root) {
  'use strict';
  const normalizeNumber = value => String(value ?? '')
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  const yen = value => Number(value).toLocaleString('ja-JP');
  const ACCOUNT_TYPES = {
    asset: new Set(['現金','普通預金','当座預金','売掛金','受取手形','繰越商品','備品','電子記録債権','クレジット売掛金','未収入金','前払金','現金過不足','小口現金','仮払金','立替金','仮払消費税','前払保険料','受取商品券','差入保証金','未収利息','貯蔵品','貸付金']),
    contraAsset: new Set(['貸倒引当金','減価償却累計額','備品減価償却累計額']),
    liability: new Set(['買掛金','支払手形','借入金','当座借越','電子記録債務','未払金','前受金','所得税預り金','社会保険料預り金','仮受消費税','仮受金','前受家賃','未払利息','未払法人税等','未払消費税']),
    equity: new Set(['資本金','繰越利益剰余金','損益']),
    revenue: new Set(['売上','受取利息','受取家賃','固定資産売却益','償却債権取立益','雑益']),
    expense: new Set(['仕入','発送費','消耗品費','減価償却費','固定資産売却損','支払手数料','通信費','水道光熱費','旅費交通費','支払利息','給料','法定福利費','租税公課','貸倒引当金繰入','保険料','法人税、住民税及び事業税','雑損'])
  };
  const TYPE_LABELS = { asset: '資産', contraAsset: '資産の控除', liability: '負債', equity: '純資産', expense: '費用', revenue: '収益' };
  const TABLE_LABELS = {
    account: '勘定科目', acquisitionCost: '取得原価', amount: '金額', answer: '解答', asset: '固定資産',
    balance: '残高', closingBookValue: '期末帳簿価額', credit: '貸方', currentDepreciation: '当期減価償却額',
    date: '日付', debit: '借方', debitAccount: '借方科目', debitAmount: '借方金額', description: '摘要',
    evidence: '証憑', item: '項目', life: '耐用年数', openingAccumulated: '期首減価償却累計額', quantity: '数量',
    recorded: '帳簿の記録', section: '区分', transaction: '取引内容', unitPrice: '単価', value: '内容',
    creditAccount: '貸方科目', creditAmount: '貸方金額'
  };
  class AppView {
    constructor(document) { this.document = document; }
    byId(id) { return this.document.getElementById(id); }
    tableLabel(value) { return TABLE_LABELS[value] || value; }
    show(id) { this.document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); }
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
      this.byId('q-category').textContent = `第${question.chapter}章｜${question.category}`;
      const story = this.byId('q-story'); story.hidden = mode !== 'story';
      if (!story.hidden) { this.byId('q-scene').textContent = question.scene; this.byId('q-context').textContent = question.story; this.byId('q-task').textContent = `今回の仕事：${question.category}`; }
      this.byId('q-text').textContent = question.question;
      this.renderMaterials(question);
      this.byId('journal-container').hidden = question.type !== 'journal';
      this.byId('table-container').hidden = question.type === 'journal';
      if (question.type === 'journal') this.renderJournal(question, draft, mode);
      else if (question.type === 'correction') this.renderCorrection(question, draft);
      else if (question.category === '仕訳帳' && question.table?.inputCells?.includes('d1Account')) this.renderJournalBook(question, draft);
      else if (question.format === 'balance-sheet') this.renderBalanceSheet(question, draft);
      else this.renderTable(question, draft);
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
      const head = table.createTHead().insertRow(); columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = this.tableLabel(column); head.append(th); });
      const body = table.createTBody(); question.materials.forEach(material => { const row = body.insertRow(); columns.forEach(column => { const cell = row.insertCell(); const value = material[column]; cell.textContent = value == null ? '—' : typeof value === 'number' ? yen(value) : value; }); });
      wrap.append(table); container.append(heading, wrap);
    }
    makeAmount(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.setAttribute('inputmode', 'none'); input.readOnly = true;
      input.className = `${className} amount-input`; input.setAttribute('aria-label', label); input.setAttribute('pattern', '[0-9,]*');
      input.setAttribute('title', '金額は計算機から入力してください'); input.maxLength = 24; input.value = value;
      return input;
    }
    makeText(className, label, value = '') {
      const input = this.document.createElement('input'); input.type = 'text'; input.className = `${className} table-text-input`;
      input.setAttribute('aria-label', label); input.setAttribute('enterkeyhint', 'done'); input.setAttribute('autocomplete', 'off'); input.maxLength = 120; input.value = value; return input;
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
    renderJournalBook(question, draft = {}) {
      const container = this.byId('table-container'); container.replaceChildren();
      container.classList.add('journal-book-scroll');
      const table = this.document.createElement('table'); table.className = 'journal-book-entry';
      const head = table.createTHead().insertRow();
      ['日付', '借方科目', '元丁', '借方金額', '貸方科目', '元丁', '貸方金額'].forEach(label => {
        const th = this.document.createElement('th'); th.textContent = label; head.append(th);
      });
      const body = table.createTBody();
      for (let index = 1; question.table.inputCells.includes(`d${index}Account`); index += 1) {
        const row = body.insertRow(); const date = question.table.inputMetadata?.[`d${index}Account`]?.label?.split(' ')[0] || '';
        const dateCell = row.insertCell(); dateCell.textContent = date;
        [`d${index}Account`, `d${index}Ref`, `d${index}Amount`, `c${index}Account`, `c${index}Ref`, `c${index}Amount`].forEach(cellId => {
          const cell = row.insertCell(); const inputType = question.table.inputTypes?.[cellId]; const label = this.cellLabel(question, cellId);
          const input = inputType === 'amount'
            ? this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[cellId] ?? '')
            : this.makeText('table-input', label, draft.cells?.[cellId] ?? '');
          input.dataset.cellId = cellId; input.dataset.inputType = inputType; cell.append(input);
        });
      }
      container.append(table);
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
      if (question.format === 'eight-column-worksheet') {
        const guide = this.document.createElement('aside'); guide.className = 'worksheet-guide';
        const title = this.document.createElement('strong'); title.textContent = '「8桁」は、金額の桁数ではなく8つの金額欄という意味です';
        const detail = this.document.createElement('p'); detail.textContent = '試算表・修正記入・損益計算書・貸借対照表に、それぞれ借方と貸方があるため、2欄×4組＝8欄です。表は横にスクロールして入力してください。';
        guide.append(title, detail); wrap.append(guide);
      }
      const table = this.document.createElement('table'); table.className = `answer-table${question.format === 'eight-column-worksheet' ? ' eight-column-worksheet' : ''}`;
      if (question.format === 'eight-column-worksheet') table.setAttribute('role', 'grid');
      const thead = table.createTHead();
      if (question.format === 'eight-column-worksheet') {
        const groupHead = thead.insertRow();
        const accountHead = this.document.createElement('th'); accountHead.textContent = '勘定科目'; accountHead.rowSpan = 2; accountHead.scope = 'col'; groupHead.append(accountHead);
        ['試算表', '修正記入', '損益計算書', '貸借対照表'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; th.colSpan = 2; th.scope = 'colgroup'; groupHead.append(th); });
        const sideHead = thead.insertRow();
        for (let index = 0; index < 4; index += 1) ['借方', '貸方'].forEach(label => { const th = this.document.createElement('th'); th.textContent = label; th.scope = 'col'; sideHead.append(th); });
      } else {
        const head = thead.insertRow(); question.table.columns.forEach(column => { const th = this.document.createElement('th'); th.textContent = this.tableLabel(column); th.scope = 'col'; head.append(th); });
      }
      const body = table.createTBody(); let inputIndex = 0;
      question.table.rows.forEach(rowData => {
        const row = body.insertRow(); if (question.format === 'eight-column-worksheet') row.setAttribute('role', 'row'); Object.values(rowData).forEach((value, columnIndex) => {
          const cell = row.insertCell();
          if (question.format === 'eight-column-worksheet') cell.setAttribute('role', 'gridcell');
          if (question.format === 'eight-column-worksheet' && columnIndex > 0) cell.classList.add('worksheet-value-cell');
          if (value === '入力') {
            const id = question.table.inputCells[inputIndex++]; const inputType = question.table.inputTypes?.[id] || 'amount';
            const metadata = question.table.inputMetadata?.[id]; const label = metadata?.label || this.cellLabel(question, id);
            const input = inputType === 'amount' ? this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[id] ?? '') : this.makeText('table-input', label, draft.cells?.[id] ?? '');
            if (inputType === 'amount') cell.classList.add('amount-cell');
            input.dataset.cellId = id; input.dataset.inputType = inputType; cell.append(input);
          }
          else { cell.textContent = value == null ? '' : typeof value === 'number' ? yen(value) : this.tableLabel(value); if (typeof value === 'number') cell.classList.add('amount-cell'); }
        });
      }); wrap.append(table);
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
      const idFor = row => row.account === '繰越利益剰余金' ? 'retainedEarnings' : null;
      const appendValue = (tr, row) => {
        const account = tr.insertCell(); account.className = 'balance-account'; account.textContent = row?.account || '';
        const amount = tr.insertCell(); amount.className = 'balance-amount';
        if (!row) return;
        const cellId = idFor(row);
        if (row.amount !== '入力') { amount.textContent = typeof row.amount === 'number' ? yen(row.amount) : row.amount; return; }
        if (comparison) {
          const actual = this.document.createElement('span'); actual.className = 'comparison-actual'; actual.textContent = `入力 ${this.comparisonValue(question, cellId, comparison.user.cells?.[cellId])}`;
          const expected = this.document.createElement('span'); expected.className = 'comparison-expected'; expected.textContent = `正解 ${this.comparisonValue(question, cellId, question.answer.cells[cellId])}`;
          amount.append(actual, expected); return;
        }
        const input = this.makeAmount('table-input', `${row.account}（金額）`, draft.cells?.[cellId] ?? ''); input.dataset.cellId = cellId; input.dataset.inputType = 'amount'; amount.append(input);
      };
      const body = table.createTBody();
      for (let index = 0; index < Math.max(left.length, right.length); index += 1) { const tr = body.insertRow(); appendValue(tr, left[index]); appendValue(tr, right[index]); }
      const foot = table.createTFoot().insertRow();
      const appendTotal = (label, cellId) => {
        const name = foot.insertCell(); name.className = 'balance-total-label'; name.textContent = label;
        const amount = foot.insertCell(); amount.className = 'balance-amount balance-total-amount';
        if (comparison) {
          amount.innerHTML = `<span class="comparison-actual">入力 ${this.comparisonValue(question, cellId, comparison.user.cells?.[cellId])}</span><span class="comparison-expected">正解 ${this.comparisonValue(question, cellId, question.answer.cells[cellId])}</span>`;
        } else { const input = this.makeAmount('table-input', `${label}（金額）`, draft.cells?.[cellId] ?? ''); input.dataset.cellId = cellId; input.dataset.inputType = 'amount'; amount.append(input); }
      };
      appendTotal('資産合計', 'assetsTotal'); appendTotal('負債・純資産合計', 'liabilitiesEquityTotal');
      wrap.append(table); return wrap;
    }
    readAnswer(question) {
      if (question.type !== 'journal') { const cells = {}; this.document.querySelectorAll('.table-input').forEach(input => { cells[input.dataset.cellId] = input.value; }); return { cells }; }
      const side = name => [...this.document.querySelectorAll(`.${name}-account`)].map((account, index) => {
        const source = normalizeNumber(this.document.querySelectorAll(`.${name}-amount`)[index].value).replace(/,/g, '').trim();
        return { account: account.value, amount: source === '' ? Number.NaN : Number(source) };
      }).filter(item => item.account || Number.isFinite(item.amount));
      return { debit: side('debit'), credit: side('credit') };
    }
    result(question, score, userAnswer, confidence = 'unsure', achievement = {}) {
      const standardActions = this.byId('standard-result-actions'); const examActions = this.byId('exam-result-actions');
      if (standardActions) standardActions.hidden = false; if (examActions) examActions.hidden = true;
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
      const inputType = question.table?.inputTypes?.[cellId];
      const semanticType = question.table?.inputMetadata?.[cellId]?.semanticType;
      if ((inputType === 'amount' || semanticType === 'amount') && Number.isFinite(Number(normalizeNumber(value).replace(/,/g, '')))) {
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
        heading.textContent = 'あなたの仕訳（誤答）';
        const note = this.document.createElement('p'); note.textContent = '下の「正しい仕訳」と、科目・貸借・金額を一つずつ見比べましょう。';
        container.append(heading, note, this.journalTable(userAnswer));
        return;
      }
      if (question.type === 'correction') {
        heading.textContent = 'あなたの訂正仕訳（誤答）';
        const note = this.document.createElement('p'); note.textContent = '下の「正しい訂正仕訳」と、借方・貸方の科目と金額を見比べましょう。';
        container.append(heading, note, this.journalTable(this.correctionJournal(userAnswer)));
        return;
      }
      if (question.type === 'worksheet') {
        heading.textContent = '決算整理表で回答を比較';
        const note = this.document.createElement('p'); note.textContent = '問題と同じ行・列の中で、入力した値と正解を横に見比べましょう。';
        container.append(heading, note, this.worksheetAnswerComparison(question, score, userAnswer));
        return;
      }
      if (question.format === 'balance-sheet') {
        heading.textContent = '貸借対照表で回答を比較';
        const note = this.document.createElement('p'); note.textContent = '資産と負債・純資産の左右を保ったまま、入力と正解を見比べましょう。';
        container.append(heading, note, this.renderBalanceSheet(question, {}, { user:userAnswer, score }));
        return;
      }
      heading.textContent = 'あなたの解答と正しい解答';
      const note = this.document.createElement('p'); note.textContent = '「要確認」の項目を横に見比べて、入力と正解の違いを確認しましょう。';
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
    renderExplanation(question, score, userAnswer) {
      const container = this.byId('explanation'); container.replaceChildren();
      const heading = this.document.createElement('h3'); heading.textContent = '今回の解説'; container.append(heading);
      const lead = this.document.createElement('p'); lead.className = 'explanation-summary';
      lead.textContent = score.correct
        ? '正解です。答えの根拠、実務での使い方、試験での見分け方を順に確認しましょう。'
        : 'もう一歩です。誤答の原因から正しい考え方へつなげ、実務と試験で使える判断手順まで一続きで確認しましょう。';
      container.append(lead);
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
      if (question.npcDialogue) { const dialogue = this.document.createElement('blockquote'); dialogue.className = 'npc-dialogue'; dialogue.textContent = question.npcDialogue; container.append(dialogue); }
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
