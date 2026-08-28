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
      const filters = document.getElementById('question-filters'); const mobile = root.matchMedia?.('(max-width: 768px)');
      const syncFilters = () => { if (filters && !filters.hidden) filters.open = !mobile?.matches; }; mobile?.addEventListener?.('change', syncFilters); syncFilters();
      let installPrompt = null; const install = document.getElementById('pwa-install');
      root.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; install.hidden = false; });
      install?.addEventListener('click', async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; install.hidden = true; });
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(registration => {
        const toast = document.getElementById('update-toast'); const showUpdate = worker => { if (!worker) return; toast.hidden = false; document.getElementById('pwa-update').onclick = () => { worker.postMessage({ type:'SKIP_WAITING' }); root.location.reload(); }; };
        if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);
        registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting); }));
      });
    },
    calculateExpression(expression) { return root.SafeCalculator.evaluate(expression); }
  };
  root.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
}(window));
