'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class MemoryCache {
  constructor() { this.entries = new Map(); this.added = []; }
  async addAll(urls) { this.added.push(...urls); urls.forEach(url => this.entries.set(url, response(`precache:${url}`))); }
  async match(request) { return this.entries.get(typeof request === 'string' ? request : request.url); }
  async put(request, value) { this.entries.set(typeof request === 'string' ? request : request.url, value); }
}
const response = body => ({ body, ok: true, type: 'basic', clone() { return response(body); } });
const stores = new Map([['boki-rpg-v9', new MemoryCache()]]); const deleted = []; const handlers = {};
const caches = {
  async open(key) { if (!stores.has(key)) stores.set(key, new MemoryCache()); return stores.get(key); },
  async keys() { return [...stores.keys()]; },
  async delete(key) { deleted.push(key); return stores.delete(key); }
};
let online = true; const fetches = [];
const sandbox = {
  caches, URL,
  fetch: async (request, options) => { fetches.push({ url: request.url || request, options }); if (!online) throw new Error('offline'); return response(`network:${request.url || request}`); },
  self: {
    location: { origin: 'https://example.test' }, clients: { async claim() {} }, skipWaiting() {},
    addEventListener(type, listener) { handlers[type] = listener; }
  }
};
vm.runInNewContext(fs.readFileSync('service-worker.js', 'utf8'), sandbox);
const dispatch = async (type, event = {}) => {
  let pending; let output;
  handlers[type]({ ...event, waitUntil(promise) { pending = promise; }, respondWith(promise) { output = promise; } });
  if (pending) await pending; return output && output;
};
(async () => {
  await dispatch('install');
  const currentKey = [...stores.keys()].find(key => key !== 'boki-rpg-v9');
  assert.strictEqual(currentKey, 'boki-rpg-20260824-13');
  const current = stores.get(currentKey);
  assert(current.added.includes('./data/questions.js?v=20260824-13') && current.added.includes('./js/feedback.js?v=20260824-13') && current.added.includes('./js/controller.js?v=20260824-13'), 'coherent version assets are installed');
  await dispatch('activate');
  assert.deepStrictEqual(deleted, ['boki-rpg-v9'], 'old cache is removed');

  const navigation = { url: 'https://example.test/', method: 'GET', mode: 'navigate' };
  const fresh = await dispatch('fetch', { request: navigation });
  assert.strictEqual((await fresh).body, 'network:https://example.test/', 'navigation is network first');
  online = false;
  const offline = await dispatch('fetch', { request: navigation });
  assert.strictEqual((await offline).body, 'network:https://example.test/', 'latest navigation is available offline');

  const oldQuery = { url: 'https://example.test/js/controller.js?v=old', method: 'GET', mode: 'same-origin' };
  await assert.rejects(async () => dispatch('fetch', { request: oldQuery }).then(value => value), 'old query cannot alias the current cached script');
  assert(!fs.readFileSync('service-worker.js', 'utf8').includes('ignoreSearch'), 'query strings remain cache keys');
  console.log('service worker tests: ok');
})().catch(error => { console.error(error); process.exitCode = 1; });
