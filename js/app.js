(function (root) {
  'use strict';
  const App = {
    init() {
      this.controller = new root.AppController(document, root.QuestionData); this.controller.init();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js');
    },
    calculateExpression(expression) { return root.SafeCalculator.evaluate(expression); }
  };
  root.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
}(window));
