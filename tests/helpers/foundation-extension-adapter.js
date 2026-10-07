(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FoundationExtensionAdapter = api;
}(typeof window === 'undefined' ? globalThis : window, function (root) {
  'use strict';
  // Test-only prototype: no production entrypoint imports this module.
  const normalize = value => String(value ?? '').normalize('NFKC');
  const grouped = value => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const specFor = input => {
    if (!input?.dataset || !Object.hasOwn(input.dataset, 'extensionPrecision')) return null;
    const precision = Number(input.dataset.extensionPrecision);
    if (!Number.isInteger(precision) || precision < 0 || precision > 2) throw new RangeError('Unsupported fixture precision');
    return { precision, signed:input.dataset.extensionSigned === 'true' };
  };
  function parseDecimal(value) {
    const raw = normalize(value);
    const match = /^(-?)(\d{1,13})(?:\.(\d{1,12}))?$/.exec(raw);
    if (!match) throw new RangeError('Expected a bounded decimal amount');
    return { negative:match[1] === '-', whole:match[2], fraction:match[3] || '' };
  }
  function roundHalfUp(value, precision) {
    if (!Number.isInteger(precision) || precision < 0 || precision > 2) throw new RangeError('Unsupported precision');
    const {negative,whole,fraction} = parseDecimal(value);
    const places = fraction.padEnd(precision + 1, '0');
    let scaled = BigInt(whole) * (10n ** BigInt(precision)) + BigInt(places.slice(0, precision) || '0');
    if (places[precision] >= '5') scaled += 1n;
    if (scaled > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Unsafe scaled amount');
    const digits = scaled.toString().padStart(precision + 1, '0');
    const sign = negative && scaled !== 0n ? '-' : '';
    return sign + (precision ? digits.slice(0, -precision) + '.' + digits.slice(-precision) : digits);
  }
  function formatDecimal(input, event = {}) {
    if (event.isComposing) return true;
    const spec = specFor(input), before = normalize(input.value);
    const decimal = spec.precision ? `(?:[.][0-9]{0,${spec.precision}})?` : '';
    const regex = new RegExp(`^${spec.signed ? '-?' : ''}(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)${decimal}$`);
    if (before === '' || (before === '-' && spec.signed)) {
      input.setCustomValidity?.(before === '-' ? '数値を入力してください。' : ''); return before === '';
    }
    if (!regex.test(before)) { input.setCustomValidity?.('指定された符号・桁数・3桁区切りで入力してください。'); return false; }
    const raw = before.replace(/,/g, '');
    try { parseDecimal(raw.endsWith('.') ? raw + '0' : raw); } catch (_) { input.setCustomValidity?.('入力可能な金額範囲を超えています。'); return false; }
    const start = input.selectionStart ?? before.length, end = input.selectionEnd ?? start;
    const direction = input.selectionDirection || 'none';
    const [integer, fraction] = raw.split('.');
    const after = grouped(integer) + (fraction === undefined ? '' : '.' + fraction);
    const position = offset => {
      if (before === after) return offset;
      const count = before.slice(0, offset).replace(/,/g, '').length;
      if (!count) return 0;
      let seen = 0;
      for (let i = 0; i < after.length; i++) if (after[i] !== ',' && ++seen === count) return i + 1;
      return after.length;
    };
    input.value = after;
    input.setCustomValidity?.(raw.endsWith('.') ? '小数点の後に数値を入力してください。' : '');
    input.setSelectionRange?.(position(start), position(end), direction);
    return !raw.endsWith('.');
  }
  function namespacedStorage(storage, prefix) {
    if (!storage || !/^foundation-ext:[a-z0-9-]+:$/u.test(prefix)) throw new Error('An explicit isolated fixture store is required');
    return {
      getItem:key => storage.getItem(prefix + key),
      setItem:(key,value) => storage.setItem(prefix + key, value),
      removeItem:key => storage.removeItem(prefix + key)
    };
  }
  class ExtensionView extends root.AppView {
    renderQuestion(question, draft, mode) {
      super.renderQuestion(question, draft, mode);
      for (const input of this.document.querySelectorAll('[data-cell-id]')) {
        const metadata = question.table?.inputMetadata?.[input.dataset.cellId];
        if (metadata?.extensionText) { input.style.minWidth = '0'; input.style.maxWidth = '100%'; }
        if (!metadata?.extensionNumeric) continue;
        input.dataset.extensionPrecision = String(metadata.precision || 0);
        input.dataset.extensionSigned = String(metadata.signed === true);
        input.dataset.extensionQuestion = question.id;
        const spec = specFor(input);
        input.inputMode = spec.precision ? 'decimal' : 'numeric';
        input.pattern = `${spec.signed ? '-?' : ''}(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)${spec.precision ? `(?:[.][0-9]{1,${spec.precision}})?` : ''}`;
        input.setAttribute('aria-label', `${metadata.label}（${metadata.unit}）`);
      }
    }
    renderExplanation(question, score, userAnswer) {
      if (question.extension?.isolated !== true) return super.renderExplanation(question, score, userAnswer);
      const container = this.byId('explanation'); container.replaceChildren();
      const heading = this.document.createElement('h3'); heading.textContent = '今回の解説'; container.append(heading);
      // Use the existing authored-explanation renderer inside the actual result view.
      this.appendAuthoredExplanation(question, container, true);
    }
  }
  class ExtensionController extends root.AppController {
    constructor(document, questions, storage, prefix) {
      if (!Object.values(questions).length || Object.values(questions).some(q => q.extension?.isolated !== true || !q.id.startsWith('EXT-'))) throw new Error('Only isolated fixtures are allowed');
      const scoped = namespacedStorage(storage, prefix);
      const descriptor = Object.getOwnPropertyDescriptor(root, 'localStorage');
      // Super captures the scoped object before either real model can load/save.
      // The synchronous constructor restores the global descriptor even on error.
      try {
        Object.defineProperty(root, 'localStorage', { configurable:true, value:scoped });
        super(document, questions);
      } finally {
        if (descriptor) Object.defineProperty(root, 'localStorage', descriptor); else delete root.localStorage;
      }
      this.view = new ExtensionView(document); this.extensionPrefix = prefix;
    }
    formatAmount(input, event = {}) {
      return specFor(input) ? formatDecimal(input, event) : super.formatAmount(input, event);
    }
    insertCalculatorResult(shouldCalculate) {
      const selected = this.document.querySelector?.('.amount-input.calculator-selected');
      const target = this.document.body.contains(this.calculatorTarget) ? this.calculatorTarget : selected;
      const spec = specFor(target);
      if (!spec) return super.insertCalculatorResult(shouldCalculate);
      if (!target || target.disabled || !this.document.body.contains(target) || target.dataset.extensionQuestion !== this.currentId) return false;
      try {
        const value = shouldCalculate ? String(root.SafeCalculator.evaluate(this.expression)) : this.expression;
        const parsed = parseDecimal(value);
        if (parsed.negative && !spec.signed) throw new RangeError('This field is unsigned');
        const rounded = roundHalfUp(value, spec.precision);
        target.value = rounded;
        target.setSelectionRange?.(rounded.length, rounded.length);
        if (!this.formatAmount(target)) return false;
        const saved = this.saveDraft(false);
        this.calculatorTarget = target; this.updateCalculatorDisplay();
        this.document.getElementById('calculator-target').textContent = `${target.getAttribute('aria-label')}へ${target.value}を入力しました`;
        return saved;
      } catch (_) {
        this.document.getElementById('calculator-target').textContent = '指定された範囲の計算結果を確認してください';
        return false;
      }
    }
  }
  function catalog(cases) { return Object.fromEntries(Object.values(cases).map(q => [q.id, JSON.parse(JSON.stringify(q))])); }
  return { ExtensionView, ExtensionController, catalog, roundHalfUp, formatDecimal, namespacedStorage };
}));
