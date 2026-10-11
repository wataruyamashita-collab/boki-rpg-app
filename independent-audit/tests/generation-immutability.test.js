'use strict';

const assert=require('assert');
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');

const authorityPath=generation=>
  path.join(
    core.ROOT,
    `reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`
  );

const auditPath=path.join(
  core.ROOT,
  'independent-audit/manifest.json'
);

// Snapshot every present authority, including a pending successor. A fixed
// numeric ceiling can omit the latest immutable authority after finalization.
const authorityBytes=new Map(
  fs.readdirSync(path.dirname(authorityPath(2)))
    .filter(file=>/^phase-b-generation-[0-9]+\.json$/u.test(file))
    .map(file=>Number(file.match(/^phase-b-generation-([0-9]+)\.json$/u)[1]))
    .sort((left,right)=>left-right)
    .map(
      generation=>[
        generation,
        fs.readFileSync(authorityPath(generation))
      ]
    )
);

const auditBytes=fs.readFileSync(auditPath);

const digest=value=>
  crypto.createHash('sha256').update(value).digest('hex');

let count=0;

const test=(name,fn)=>{
  fn();
  count++;
  console.log(`ok ${count} - ${name}`);
};

const rejectCandidate=(candidate,generations,expectedError)=>{
  const result=lifecycle.verifyCandidate(candidate,{generations});
  assert.strictEqual(result.ok,false);
  if(expectedError)assert(result.errors.some(error=>error.includes(expectedError)),
    `expected ${expectedError}, received ${result.errors.join('; ')}`);
};

const assertAuthorityInventory=(authorities,historicalFiles)=>
  assert.deepStrictEqual(authorities.map(item=>item.file).sort(),historicalFiles);

try{
  const authorities=lifecycle.generationAuthorities();
  // HEAD's current inventory alone cannot detect deletion of a committed tip.
  // Keep every authority path ever introduced in reachable ancestry mandatory.
  const historicalFiles=[...new Set(childProcess.execFileSync('git',[
    'log','--full-history','-m','--format=','--name-only','--no-renames','HEAD','--',
    'reports/auto-gate/audit-locks'
  ],{cwd:core.ROOT,encoding:'utf8'}).split(/\n/u).filter(file=>
    file.startsWith('reports/auto-gate/audit-locks/')&&file.endsWith('.json')))].sort();
  test('no authority from reachable history is deleted',()=>
    assertAuthorityInventory(authorities,historicalFiles));
  test('deleting the committed tip cannot shrink the accepted history',()=>{
    assert(authorities.length>1,'history fixture contains multiple generations');
    assert.throws(()=>assertAuthorityInventory(authorities.slice(0,-1),historicalFiles),assert.AssertionError);
  });
  test('deleting a committed suffix cannot shrink the accepted history',()=>
    assert.throws(()=>assertAuthorityInventory(authorities.slice(0,-2),historicalFiles),assert.AssertionError));
  const generations=authorities.map(
    item=>item.document.generation
  );
  // Derive the sequence only from Git-backed authorities, never from the
  // largest worktree filename. Continuity is also checked by the lifecycle.
  const root=lifecycle.phaseARootAuthority().document;
  test(
    'committed authorities form a contiguous sequence after the immutable root',
    ()=>assert.deepStrictEqual(
      generations,
      Array.from({length:authorities.length},(_,index)=>root.baselineVersion+index+1)
    )
  );

  test(
    'every committed authority has a raw-byte snapshot',
    ()=>assert.deepStrictEqual(
      generations.filter(generation=>!Buffer.isBuffer(authorityBytes.get(generation))),
      []
    )
  );

  for(const generation of generations){
    test(
      `Generation ${generation} worktree bytes remain immutable`,
      ()=>assert(
        authorities
          .find(item=>item.document.generation===generation)
          .bytes
          .equals(authorityBytes.get(generation))
      )
    );
  }

  for(let index=1;index<authorities.length;index++){
    test(
      `Generation ${generations[index]} predecessor is exact Generation ${generations[index-1]} identity`,
      ()=>assert.deepStrictEqual(
        authorities[index].document.predecessor,
        lifecycle.identity(authorities[index-1].document)
      )
    );
  }

  test(
    'authority identities are content-based',
    ()=>{
      for(const authority of authorities){
        assert.strictEqual(
          lifecycle.identity(authority.document)
            .canonicalDocumentSha256,
          lifecycle.canonicalDocumentHash(authority.document)
        );
        assert(
          !Object.hasOwn(
            lifecycle.identity(authority.document),
            'commit'
          )
        );
      }
    }
  );

  for(const generation of generations){
    test(
      `Generation ${generation} trailing-byte tamper is rejected`,
      ()=>{
        const target=authorityPath(generation);
        const saved=authorityBytes.get(generation);

        fs.writeFileSync(
          target,
          Buffer.concat([saved,Buffer.from(' ')])
        );

        assert(
          lifecycle.verifyCurrent().errors.includes(
            `reports/auto-gate/audit-locks/phase-b-generation-${generation}.json raw bytes differ from immutable historical authority`
          )
        );

        fs.writeFileSync(target,saved);
      }
    );
  }

  const documents=authorities.map(item=>item.document);

  // Start negative cases from a valid immediate successor so they cannot
  // pass merely because an already committed tip is not a candidate.
  const candidate=lifecycle.createCandidate();
  test('valid immediate successor passes candidate verification',()=>
    assert.strictEqual(lifecycle.verifyCandidate(candidate).ok,true));
  test('later successors use the same contract without a fixed ceiling',()=>{
    const fixtureHistory=[...authorities,{document:candidate}];
    const successor=lifecycle.createCandidate('B_GENERATION',fixtureHistory);
    assert.strictEqual(successor.generation,candidate.generation+1);
    assert.strictEqual(lifecycle.verifyCandidate(successor,{generations:fixtureHistory}).ok,true);
    // An in-memory future fixture is never accepted as committed history.
    rejectCandidate(successor,authorities,'candidate generation must be exactly');
  });

  for(const generation of generations){
    test(
      `duplicate Generation ${generation} is rejected`,
      ()=>{
        const existing=
          documents.find(
            document=>document.generation===generation
          ) || candidate;

        rejectCandidate(
          candidate,
          [...documents,structuredClone(existing)],
          `competing generation ${generation} authorities found`
        );
      }
    );
  }

  test(
    'stale generation is rejected',
    ()=>{
      const skipped=structuredClone(candidate);
      skipped.generation=candidate.generation-1;
      rejectCandidate(skipped,documents,'candidate generation must be exactly');
    }
  );

  test('skipped candidate generation is rejected',()=>{
    const skipped=structuredClone(candidate);
    skipped.generation++;
    rejectCandidate(skipped,documents,'candidate generation must be exactly');
  });

  test('missing generation is rejected',()=>{
    assert(documents.length>1,'history fixture contains multiple generations');
    rejectCandidate(candidate,documents.filter((_,index)=>index!==Math.floor(documents.length/2)),
      'generation skip:');
  });

  test('competing history branch is rejected',()=>{
    const fork=structuredClone(documents.at(-1));
    fork.files['unapproved-authority']='f'.repeat(64);
    fork.auditHash=digest(JSON.stringify(fork.files));
    rejectCandidate(candidate,[...documents,fork],`competing generation ${fork.generation} authorities found`);
  });

  test('wrong predecessor identity is rejected',()=>{
    const broken=structuredClone(candidate);
    broken.predecessor.canonicalDocumentSha256='0'.repeat(64);
    rejectCandidate(broken,documents,'candidate predecessor canonicalDocumentSha256 mismatch');
  });

  test(
    'coordinated audit and historical authority tamper is rejected',
    ()=>{
      fs.writeFileSync(
        auditPath,
        Buffer.concat([auditBytes,Buffer.from(' ')])
      );

      const target=authorityPath(2);
      const value=JSON.parse(authorityBytes.get(2));
      const relative='independent-audit/manifest.json';

      value.files[relative]=digest(fs.readFileSync(auditPath));
      value.auditHash=digest(JSON.stringify(value.files));

      fs.writeFileSync(
        target,
        JSON.stringify(value,null,2)+'\n'
      );

      const errors=lifecycle.verifyCurrent().errors;

      assert(
        errors.includes(
          'reports/auto-gate/audit-locks/phase-b-generation-2.json raw bytes differ from immutable historical authority'
        )
      );

      assert(errors.includes(relative));

      fs.writeFileSync(
        target,
        authorityBytes.get(2)
      );
      fs.writeFileSync(auditPath,auditBytes);
    }
  );

  // A file's presence/number is not authority. Only Git history supplies
  // committed originals; at most one separately verified successor may be pending.
  const committedFiles=new Set(authorities.map(item=>item.file));
  const pendingFiles=core.walk('reports/auto-gate/audit-locks')
    .filter(file=>file.endsWith('.json')&&!committedFiles.has(file));
  test('at most one uncommitted candidate is present',()=>assert(pendingFiles.length<=1));
  for(const authority of authorities){
    assert(fs.readFileSync(path.join(core.ROOT,authority.file)).equals(authority.bytes),
      'pending candidate cannot legitimize changed historical original '+authority.file);
  }
  if(pendingFiles.length){
    const file=pendingFiles[0];
    const pending=JSON.parse(fs.readFileSync(path.join(core.ROOT,file),'utf8'));
    test('pending successor has its canonical filename',()=>assert.strictEqual(
      file,`reports/auto-gate/audit-locks/phase-b-generation-${pending.generation}.json`));
    test('pending successor passes only candidate verification',()=>{
      const result=lifecycle.verifyCandidate(pending,{generations:authorities});
      assert.strictEqual(result.ok,true,result.errors.join('; '));
      const current=lifecycle.verifyCurrent();
      assert.strictEqual(current.ok,false,'pending file must not become current authority');
      assert(current.errors.includes(`uncommitted generation authority: ${file}`));
    });
  }else{
    test('committed tip passes current verification',()=>{
      const result=lifecycle.verifyCurrent();
      assert.strictEqual(result.ok,true,result.errors.join('; '));
    });
  }

  test('unapproved on-disk authority is never a committed original',()=>{
    const extra=path.join(core.ROOT,'reports/auto-gate/audit-locks/unapproved-authority.json');
    assert(!fs.existsSync(extra),'negative fixture must not overwrite existing data');
    try{
      fs.writeFileSync(extra,JSON.stringify(candidate));
      const result=lifecycle.verifyCurrent();
      assert.strictEqual(result.ok,false);
      assert(result.errors.includes('uncommitted generation authority: reports/auto-gate/audit-locks/unapproved-authority.json'));
    }finally{fs.unlinkSync(extra);}
  });

}finally{
  fs.writeFileSync(auditPath,auditBytes);

  for(const [generation,bytes] of authorityBytes){
    fs.writeFileSync(authorityPath(generation),bytes);
  }
}

console.log(
  `Generation authority successor-aware immutability regressions: ${count}/${count}`
);
