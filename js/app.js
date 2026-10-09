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
      if (this.ready) return this.ready;
      const ownership = this.storageOwnership = { active:false, closed:false };
      const warning = document.getElementById('storage-warning');
      const originalWarning = warning?.textContent;
      const notice = text => { if (warning) { warning.textContent=text; warning.hidden=false; } };
      let finish, release;
      this.ready = new Promise(resolve => { finish=resolve; });
      const lifetime = new Promise(resolve => { release=resolve; });
      // Hold one origin-wide writer for the document lifetime, including startup
      // recovery. A second tab must not mistake a live journal for a crashed one.
      root.addEventListener('pagehide', () => {
        ownership.active=false; ownership.closed=true;
        this.controller?.stopExamTimer?.(); release(); finish(false);
      });
      root.addEventListener('pageshow', event => { if (event.persisted) root.location.reload(); });
      const unavailable = () => {
        ownership.active=false;
        notice('保存データを安全に開けません。このブラウザを更新し、HTTPSの学習ページを開き直してください。');
        finish(false);
      };
      if (!root.navigator?.locks?.request) { unavailable(); return this.ready; }
      notice('別のタブで学習中の場合は、そのタブを閉じてください。保存データを引き継いで開始します。');
      try {
        this.storageLock = root.navigator.locks.request('boki-rpg-saved-learning', {mode:'exclusive'}, async () => {
          if (ownership.closed) return;
          ownership.active=true;
          if (warning) { warning.textContent=originalWarning; warning.hidden=true; }
          try { this.start(); finish(true); await lifetime; }
          finally { ownership.active=false; }
        }).catch(unavailable);
      } catch (_) { unavailable(); }
      return this.ready;
    },
    start() {
      this.controller = new root.AppController(document, root.QuestionData); this.controller.init(this.initialRoute());
      this.setupInstallPrompt();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(registration => {
        let updateAccepted = false;
        const offerUpdate = worker => { if (!worker || !navigator.serviceWorker.controller) return; this.showToast('新しいバージョンが利用可能です。', '更新', () => { updateAccepted = true; worker.postMessage({ type:'SKIP_WAITING' }); }); };
        offerUpdate(registration.waiting); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.installing?.state === 'installed') offerUpdate(registration.installing); }));
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (updateAccepted) root.location.reload(); });
      }).catch(() => {
        if (!this.storageOwnership.closed) this.showToast('オフライン利用の準備ができませんでした。オンラインで学習を続け、後でページを開き直してください。');
      });
    },
    setupInstallPrompt() {
      const button = document.getElementById('install-app'); let promptEvent = null;
      const standalone = () => root.matchMedia?.('(display-mode: standalone)').matches || root.navigator?.standalone === true;
      if (button) button.hidden = true;
      root.addEventListener('beforeinstallprompt', event => { event.preventDefault(); if (standalone()) return; promptEvent = event; if (button) button.hidden = false; });
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
