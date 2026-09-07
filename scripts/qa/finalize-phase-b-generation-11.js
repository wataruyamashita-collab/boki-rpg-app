'use strict';
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const core = require('./audit-core');
const lifecycle = require('./phase-b-lifecycle');

const output = path.join(core.ROOT, 'reports/auto-gate/audit-locks/phase-b-generation-11.json');
const authorityPaths = [lifecycle.ROOT_LOCK, ...[2,3,4,5,6,7,8,9,10].map(generation => `reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`)].map(file => path.join(core.ROOT, file));
const expectedAuthoritySha256 = ['daae6937fcada78f974115cf1c0ded4682a5d7df7fd8f74fd7bf874ad0623544','cae19421e81cc63a2bc4254ea5dce6bf629f3cc6fc97d067f4ef14dae3010813','ac622dc4b1c8db35c83f2573f1f0f77af828c2f20256887b454a2d0b85c1f2cd','c46aa8c3ee2b9a895e4afe818ea902995b8b9045f8bd4444254d6f5261066fe7','a3f2f7320665ed8c015d2bd7cb396fbd7993be0850ee8a8347606ab5bbdbf95c','76265d955608506ce71429e30771b06ebf7a15471845a4211df6690e2e649ea8','0f3fc0ae6f5545d160683ca338ec539c2c139406b77ce57923d982552711a179','3aa4af586d7d26e8c3abe96646f98bce50568977c48a1af80081cfa5660bbb58','4d021337c8013ec98bb7a8f9424cef0e66f98b46b09ace039e35b74d458b868d','b96049174b9af9cc71c08c6d9b8624e8693fd4a1fce638260124ec5f03c2abd3'];
const approvedHead = '0c66980429d2c368d7a16862c3ad95c9c444fc31';
const approvedTree = '88b501b37e9b639e390d199a973663995e8f7979';
const finalProductionSha256 = {'css/style.css':'d81288e58692b0630c5031c5737db51aa937cb68fb5364cfc3fe2f0e5814878b','js/view.js':'c2edc7526692e9bd99dc1d473e577f3d6e9461f854be4509b2c9ac28c53031a3'};
const requiredDirty = new Set(['independent-audit/tests/generation-11-finalizer.test.js','independent-audit/tests/generation-immutability.test.js','index.html','package.json','pwa-release-manifest.json','scripts/qa/finalize-phase-b-generation-11.js','scripts/qa/validate-auto-gate.js','service-worker.js']);
const NEW_RELEASE = '20260907-84', PREVIOUS_RELEASE = '20260906-83';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => childProcess.execFileSync('git', args, { cwd:core.ROOT, encoding:'utf8' }).trim();
const fail = message => { console.error(`PHASE_B_GENERATION_11_FINALIZATION_REFUSED: ${message}`); return false; };
function validateRelease() {
  const manifest = JSON.parse(fs.readFileSync(path.join(core.ROOT, 'pwa-release-manifest.json'), 'utf8'));
  if (manifest.release !== NEW_RELEASE || manifest.previousRelease !== PREVIOUS_RELEASE) throw new Error('release manifest version mismatch');
  const worker = fs.readFileSync(path.join(core.ROOT, 'service-worker.js'), 'utf8'), index = fs.readFileSync(path.join(core.ROOT, 'index.html'), 'utf8');
  if (!worker.includes(`const RELEASE = '${NEW_RELEASE}';`) || (index.match(new RegExp(`\\?v=${NEW_RELEASE}`, 'g')) || []).length !== 12) throw new Error('release token mismatch');
  for (const [file, sha] of Object.entries(manifest.assets)) if (core.sha(file) !== sha) throw new Error(`release asset hash mismatch: ${file}`);
}
function finalize() {
  if (fs.existsSync(output) || lifecycle.generationAuthorities().some(item => item.document.generation === 11)) return fail('Generation 11 already exists');
  if (git(['rev-parse','HEAD^{tree}']) !== approvedTree) return fail(`approved PR #151 candidate tree mismatch (expected head ${approvedHead})`);
  if (authorityPaths.some((file,index) => !fs.existsSync(file) || digest(fs.readFileSync(file)) !== expectedAuthoritySha256[index])) return fail('historical authority raw bytes changed');
  const dirty = git(['status','--porcelain','--untracked-files=all']).split(/\n/u).filter(Boolean).map(line => line.slice(2).trim());
  if (dirty.length !== requiredDirty.size || dirty.some(file => !requiredDirty.has(file)) || [...requiredDirty].some(file => !dirty.includes(file))) return fail(`dirty scope mismatch: ${dirty.join(', ')}`);
  try { validateRelease(); } catch (error) { return fail(error.message); }
  for (const [file, sha] of Object.entries(finalProductionSha256)) if (core.sha(file) !== sha) return fail(`final Production hash mismatch: ${file}`);
  const candidate = lifecycle.createCandidate();
  if (candidate.generation !== 11) return fail('candidate generation must be 11');
  const verification = lifecycle.verifyCandidate(candidate);
  if (!verification.ok) return fail(verification.errors.join(', '));
  fs.writeFileSync(output, `${JSON.stringify(candidate,null,2)}\n`, { flag:'wx' });
  console.log(`FINALIZED ${path.relative(core.ROOT, output)}`); return true;
}
if (require.main === module && !finalize()) process.exit(1);
module.exports = { approvedHead, approvedTree, authorityPaths, expectedAuthoritySha256, finalProductionSha256, NEW_RELEASE, PREVIOUS_RELEASE, output, finalize, validateRelease };
