'use strict';

const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),childProcess=require('child_process');
const lockApi=require('../../scripts/qa/audit-lock');
const projectRoot=path.resolve(__dirname,'../..');
const git=(root,args)=>childProcess.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const write=(root,file,value)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
const hashes=root=>{const files=['independent-audit/a.txt','scripts/qa/audit-lock.js','scripts/qa/create-audit-lock.js'];return Object.fromEntries(files.sort().map(file=>[file,lockApi.digest(fs.readFileSync(path.join(root,file)))]));};
function init(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'audit-lock-v2-'));git(root,['init','-q']);git(root,['config','user.email','audit@example.invalid']);git(root,['config','user.name','Audit Test']);write(root,'independent-audit/a.txt','audited\n');for(const file of ['scripts/qa/audit-lock.js','scripts/qa/create-audit-lock.js'])write(root,file,fs.readFileSync(path.join(projectRoot,file)));git(root,['add','.']);git(root,['commit','-qm','BASE']);return root;}
function finalize(root,message='FINAL BASELINE'){const lock=lockApi.makeLock(hashes(root));write(root,lockApi.LOCK_PATH,JSON.stringify(lock,null,2)+'\n');git(root,['add','.']);git(root,['commit','-qm',message]);return lock;}
function runCreator(root,arg){return childProcess.spawnSync(process.execPath,['scripts/qa/create-audit-lock.js',arg],{cwd:root,encoding:'utf8'});}
function run(){const roots=[];try{
  const headFirst=init();roots.push(headFirst);const firstLock=finalize(headFirst);assert(lockApi.verifyAuditLock({root:headFirst}).ok,'HEAD itself must verify as the first final baseline');
  write(headFirst,'independent-audit/a.txt','audited!\n');assert(!lockApi.verifyAuditLock({root:headFirst}).ok,'one-byte audited-file tamper must fail');write(headFirst,'independent-audit/a.txt','audited\n');
  fs.appendFileSync(path.join(headFirst,'scripts/qa/create-audit-lock.js'),' ');assert(!lockApi.verifyAuditLock({root:headFirst}).ok,'one-byte lock-creator tamper must fail');git(headFirst,['checkout','--','scripts/qa/create-audit-lock.js']);
  const refused=runCreator(headFirst,'--finalize-phase-a');assert.notStrictEqual(refused.status,0);assert.match(refused.stderr,/AUDIT_LOCK_CREATE_REFUSED/);
  fs.unlinkSync(path.join(headFirst,lockApi.LOCK_PATH));const bootstrap=runCreator(headFirst,'--bootstrap');assert.notStrictEqual(bootstrap.status,0);assert.match(bootstrap.stderr,/AUDIT_LOCK_CREATE_REFUSED/);assert(!fs.existsSync(path.join(headFirst,lockApi.LOCK_PATH)));git(headFirst,['checkout','--',lockApi.LOCK_PATH]);
  const changed=path.join(headFirst,'independent-audit/a.txt');write(headFirst,'independent-audit/a.txt','coordinated tamper\n');const forged=lockApi.makeLock(hashes(headFirst));write(headFirst,lockApi.LOCK_PATH,JSON.stringify(forged,null,2)+'\n');assert.deepStrictEqual(lockApi.validateSelf(forged),[],'forged current lock must be internally consistent');assert(!lockApi.verifyAuditLock({root:headFirst}).ok,'reachable historical authority must reject coordinated file+lock tamper');fs.writeFileSync(changed,'audited\n');git(headFirst,['checkout','--',lockApi.LOCK_PATH]);
  const metadata=JSON.parse(fs.readFileSync(path.join(headFirst,lockApi.LOCK_PATH)));metadata.createdBy='attacker';write(headFirst,lockApi.LOCK_PATH,JSON.stringify(metadata));assert(!lockApi.verifyAuditLock({root:headFirst}).ok,'metadata tamper must fail');git(headFirst,['checkout','--',lockApi.LOCK_PATH]);

  const side=init();roots.push(side);const main=git(side,['branch','--show-current']);git(side,['switch','-qc','side']);finalize(side);git(side,['switch','-q',main]);assert.strictEqual(lockApi.discoverHistoricalBaseline(side),null,'an unrelated side-branch baseline must not be selected');

  const historyA=init(),historyB=init();roots.push(historyA,historyB);const lockA=finalize(historyA);write(historyA,'evidence.txt','runner evidence\n');git(historyA,['add','.']);git(historyA,['commit','-qm','EVIDENCE']);const lockB=finalize(historyB,'SQUASHED FINAL SNAPSHOT');assert.notStrictEqual(git(historyA,['rev-parse','HEAD']),git(historyB,['rev-parse','HEAD']));assert.strictEqual(lockA.baselineIdentity,lockB.baselineIdentity,'identity must ignore commit SHA and history shape');assert(lockApi.verifyAuditLock({root:historyA}).ok);assert(lockApi.verifyAuditLock({root:historyB}).ok);assert(!('commit' in lockApi.verifyAuditLock({root:historyA}).auditLock),'persistable evidence must not require a commit SHA');
  assert.strictEqual(firstLock.baselineIdentity,lockApi.computeBaselineIdentity(firstLock));
  console.log('audit lock v2 regressions: ok');
}finally{for(const root of roots)fs.rmSync(root,{recursive:true,force:true});}}
if(require.main===module)run();
module.exports={run};
