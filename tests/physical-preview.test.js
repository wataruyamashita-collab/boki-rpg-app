'use strict';
const assert = require('assert');
const { spawn, execFileSync } = require('child_process');

const commit = execFileSync('git',['rev-parse','HEAD^{commit}'],{ encoding:'utf8' }).trim();
const child = spawn(process.execPath,['scripts/serve-physical-preview.js'],{ env:{ ...process.env,PREVIEW_PORT:'0',PREVIEW_HOST:'127.0.0.1',PREVIEW_EXPECTED_SHA:commit,PREVIEW_ALLOW_DIRTY:'1' },stdio:['ignore','pipe','inherit'] });
let output = '';
const timeout = setTimeout(() => { child.kill(); throw new Error('preview server did not start'); },5000);
child.stdout.on('data',async chunk => {
  output += chunk;
  const match = output.match(/127\.0\.0\.1:(\d+)/);
  if (!match) return;
  clearTimeout(timeout);
  try {
    const origin = `http://127.0.0.1:${match[1]}`;
    const identityResponse = await fetch(`${origin}/__preview.json`);
    const identity = await identityResponse.json();
    assert.strictEqual(identity.commit,commit);
    assert.strictEqual(identity.generation,10);
    assert.strictEqual(identity.pwaRelease,'20260906-83');
    assert.strictEqual(identityResponse.headers.get('x-preview-commit'),commit);
    const indexResponse = await fetch(origin);
    assert.strictEqual(indexResponse.status,200);
    assert.strictEqual(indexResponse.headers.get('x-preview-commit'),commit);
    assert((await indexResponse.text()).includes('js/app.js?v=20260906-83'));
    assert.strictEqual((await fetch(`${origin}/.git/config`)).status,404);
    console.log('physical preview tests: exact commit identity, release identity, production bytes, path isolation: ok');
  } finally { child.kill(); }
});
child.on('exit',code => { if (code && code !== 0) process.exitCode = code; });
