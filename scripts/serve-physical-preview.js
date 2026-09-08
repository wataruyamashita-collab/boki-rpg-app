'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PREVIEW_PORT || 4173);
const HOST = process.env.PREVIEW_HOST || '0.0.0.0';
const git = (...args) => execFileSync('git', args, { cwd:ROOT, encoding:'utf8' }).trim();
const commit = git('rev-parse', 'HEAD^{commit}');
const tree = git('rev-parse', 'HEAD^{tree}');
const branch = git('branch', '--show-current');
const clean = git('status', '--porcelain=v1') === '';
const expected = process.env.PREVIEW_EXPECTED_SHA;

if (expected && expected !== commit) throw new Error(`PREVIEW_HEAD_MISMATCH: expected ${expected}, got ${commit}`);
if (!clean && process.env.PREVIEW_ALLOW_DIRTY !== '1') throw new Error('PREVIEW_DIRTY_WORKTREE: commit the candidate before physical acceptance');

const roots = new Set(['index.html','manifest.webmanifest','service-worker.js']);
const directories = ['css','data','icons','js'];
const mime = { '.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8' };
const diagnostic = () => ({ purpose:'PR physical acceptance preview',commit,tree,branch,clean,generation:10,pwaRelease:'20260906-83' });

function allowed(relative) {
  return roots.has(relative) || directories.some(directory => relative.startsWith(`${directory}/`));
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://preview.local').pathname);
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-preview-commit', commit);
  response.setHeader('x-content-type-options', 'nosniff');
  if (pathname === '/__preview.json') {
    response.setHeader('content-type', mime['.json']);
    return response.end(`${JSON.stringify(diagnostic(), null, 2)}\n`);
  }
  if (pathname === '/__preview') {
    response.setHeader('content-type', mime['.html']);
    return response.end(`<!doctype html><meta name="viewport" content="width=device-width"><title>PR preview identity</title><main><h1>PR preview identity</h1><dl><dt>Commit</dt><dd><code>${commit}</code></dd><dt>Tree</dt><dd><code>${tree}</code></dd><dt>Branch</dt><dd><code>${branch}</code></dd><dt>Generation / PWA</dt><dd>10 / 20260906-83</dd></dl><p><a href="/">Open candidate</a></p></main>`);
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  if (!allowed(relative)) { response.writeHead(404); return response.end('not found'); }
  const file = path.resolve(ROOT, relative);
  if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); return response.end('not found'); }
  response.setHeader('content-type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`PREVIEW_READY http://${HOST}:${address.port} commit=${commit} tree=${tree}`);
});
