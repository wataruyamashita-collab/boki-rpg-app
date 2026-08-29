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
      this.setupInstallPrompt();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(registration => {
        const offerUpdate = worker => { if (!worker || !navigator.serviceWorker.controller) return; this.showToast('新しいバージョンが利用可能です。', '更新', () => { worker.postMessage({ type:'SKIP_WAITING' }); root.location.reload(); }); };
        offerUpdate(registration.waiting); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.installing?.state === 'installed') offerUpdate(registration.installing); }));
        navigator.serviceWorker.addEventListener('controllerchange', () => root.location.reload());
      });
    },
    setupInstallPrompt() {
      const button = document.getElementById('install-app'); let promptEvent = null;
      root.addEventListener('beforeinstallprompt', event => { event.preventDefault(); promptEvent = event; button.hidden = false; });
      button?.addEventListener('click', async () => { if (!promptEvent) return; await promptEvent.prompt(); promptEvent = null; button.hidden = true; });
      root.addEventListener('appinstalled', () => { promptEvent = null; if (button) button.hidden = true; this.showToast('アプリをインストールしました。'); });
    },
    showToast(message, actionLabel, action) {
      const toast = document.getElementById('app-toast'), button = document.getElementById('app-toast-action'); document.getElementById('app-toast-message').textContent = message;
      button.hidden = !actionLabel; button.textContent = actionLabel || ''; button.onclick = action || null; toast.hidden = false;
    },
    calculateExpression(expression) { return root.SafeCalculator.evaluate(expression); }
  };
  root.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
}(window));
