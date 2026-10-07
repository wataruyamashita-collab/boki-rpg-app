from pathlib import Path
import json, hashlib

def replace_file(file, before, after):
    p=Path(file); s=p.read_text()
    assert s.count(before)==1, (file,before)
    p.write_text(s.replace(before,after))

replace_file('js/model.js','this.migrateContentIdentity(savedContentRevision);','this.migrateContentIdentity(savedContentRevision, hasLearningSchemaV1 ? saved.questionStats : null);')
replace_file('js/model.js','migrateContentIdentity(fromRevision) {','migrateContentIdentity(fromRevision, savedQuestionStats) {')
replace_file('js/model.js','const oldStats = state.questionStats[id] || null;','''// Only an original lifetime aggregate can corroborate a complete log.
        // Reaggregating that same rolling log would be circular provenance.
        const oldStats = this.validQuestionStats(savedQuestionStats?.[id]) ? savedQuestionStats[id] : null;''')
replace_file('.github/visual/run-content-progress-migration.js',"{viewport:{width,height:900},serviceWorkers:'block'}","{viewport:{width,height:900}}")
replace_file('.github/visual/run-content-progress-migration.js','errors.push(String(error))','errors.push(error.stack || String(error))')
file='independent-audit/tests/generation-immutability.test.js'
replace_file(file,'const generation118Committed=committed(118);','const generation118Committed=committed(118);\n  const generation119Committed=committed(119);')
replace_file(file,"'authority sequence tracks committed Generations through 118'","'authority sequence tracks committed Generations through 119'")
replace_file(file,'      generation118Committed\n','      generation119Committed\n        ? Array.from({length:118},(_,index)=>index+2)\n        :generation118Committed\n')
replace_file(file,'  const generation118Pending=','  const generation119Pending=fs.existsSync(authorityPath(119))&&!generation119Committed;\n  const generation118Pending=')
replace_file(file,'  if(generation118Committed){',"""  if(generation119Committed){
    test('committed Generation 119 current integrity passes',()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true));
  }else if(generation119Pending){
    const generation119Candidate=JSON.parse(fs.readFileSync(authorityPath(119),'utf8'));
    test('pending Generation 119 candidate integrity passes',()=>assert.strictEqual(lifecycle.verifyCandidate(generation119Candidate).ok,true));
  }else if(generation118Committed){""")
needle="  test('matching category alone or a conflicting explicit identity is not accepted evidence',()=>{"
insert="""  for(const id of ['J051','L031'])for(const schema of ['legacy','missing-aggregate']){
    test(`${id}: ${schema} recent failures cannot authenticate a stale completion flag`,()=>{
      // The rolling log can lose old successes while the lifetime completion flag
      // remains. Without the original aggregate, rebuilding that log is not proof.
      const before=fixture('new',id);delete before.questionStats;
      if(schema==='legacy')delete before.learningSchemaVersion;
      before.attempts.filter(attempt=>attempt.id===id).forEach(attempt=>{attempt.correct=false;});
      const model=new Model(questions,storage(JSON.stringify(before)));
      assert.strictEqual(model.statsForQuestion(id).correctCount,0);
      assert.strictEqual(model.statsForQuestion(id).incorrectCount,3);
      assert(!model.state.correctIds.includes(id));
      assert(model.state.contentRecheckIds.includes(id));
      const archive=model.state.contentMigrationArchive.questions[id];
      assert.strictEqual(archive.questionStats,null);
      assert.strictEqual(archive.flags.correct,true);
      assert.strictEqual(archive.provenComplete,false);
      assert(Model.validateBackupState(model.state,questions));
    });
  }
"""
replace_file('tests/content-progress-integration.test.js',needle,insert+needle)
for file in ['index.html','service-worker.js']:
    p=Path(file);s=p.read_text();assert '20260924-178' in s;p.write_text(s.replace('20260924-178','20260924-179'))
p=Path('pwa-release-manifest.json');release=json.loads(p.read_text());assert release['release']=='20260924-178'
release['release']='20260924-179';release['previousRelease']='20260924-178'
for file in release['assets']:release['assets'][file]=hashlib.sha256(Path(file).read_bytes()).hexdigest()
p.write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n')
