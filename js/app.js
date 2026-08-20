(function (root) {
  'use strict';
  const App = {
    init() { this.controller = new root.AppController(document, root.QuestionData); this.controller.init(); },
    calculateExpression(expression) { return root.SafeCalculator.evaluate(expression); }
  };
  root.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
}(window));
