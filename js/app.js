(function (root) {
  'use strict';
  const App = {
    initialRoute(search = root.location?.search || '') {
      try {
        const params = new URLSearchParams(search);
        return { mode: params.get('mode'), questionId: params.get('question') };
      } catch (_) { return {}; }
    },
    init() {
      this.controller = new root.AppController(document, root.QuestionData); this.controller.init(this.initialRoute());
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
    },
    calculateExpression(expression) { return root.SafeCalculator.evaluate(expression); }
  };
  root.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
}(window));
