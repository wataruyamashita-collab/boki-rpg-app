'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const childProcess=require('child_process');
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

const authorityBytes=new Map(
  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    .filter(generation=>fs.existsSync(authorityPath(generation)))
    .map(
      generation=>[
        generation,
        fs.readFileSync(authorityPath(generation))
      ]
    )
);

const auditBytes=fs.readFileSync(auditPath);

const committed=generation=>
  childProcess.spawnSync(
    'git',
    [
      'cat-file',
      '-e',
      `HEAD:reports/auto-gate/audit-locks/phase-b-generation-${generation}.json`
    ],
    {cwd:core.ROOT}
  ).status===0;

const digest=value=>
  crypto.createHash('sha256').update(value).digest('hex');

let count=0;

const test=(name,fn)=>{
  fn();
  count++;
  console.log(`ok ${count} - ${name}`);
};

const rejectCandidate=(candidate,generations)=>
  assert.strictEqual(
    lifecycle.verifyCandidate(candidate,{generations}).ok,
    false
  );

try{
  const authorities=lifecycle.generationAuthorities();
  const generations=authorities.map(
    item=>item.document.generation
  );
  const generation31Committed=committed(31);

  test(
    'authority sequence is [2..30] before Generation 31 or [2..31] after commit',
    ()=>assert.deepStrictEqual(
      generations,
      generation31Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
        : [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
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

  const candidate=generation31Committed
    ? documents.at(-1)
    : (
        fs.existsSync(authorityPath(31))
          ? JSON.parse(fs.readFileSync(authorityPath(31),'utf8'))
          : lifecycle.createCandidate()
      );

  for(const generation of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]){
    test(
      `duplicate Generation ${generation} is rejected`,
      ()=>{
        const existing=
          documents.find(
            document=>document.generation===generation
          ) || candidate;

        rejectCandidate(
          candidate,
          [...documents,structuredClone(existing)]
        );
      }
    );
  }

  test(
    'stale-predecessor Generation 32 successor is rejected',
    ()=>{
      const skipped=structuredClone(candidate);
      skipped.generation=32;
      rejectCandidate(skipped,documents);
    }
  );

  test(
    'competing Generation 31 is rejected',
    ()=>{
      const fork=structuredClone(candidate);
      fork.auditHash='f'.repeat(64);

      rejectCandidate(
        candidate,
        [
          ...documents.filter(
            document=>document.generation<31
          ),
          fork
        ]
      );
    }
  );

  test(
    'broken Generation 31 predecessor is rejected',
    ()=>{
      const broken=structuredClone(candidate);
      broken.predecessor.canonicalDocumentSha256='0'.repeat(64);

      rejectCandidate(
        broken,
        documents.filter(
          document=>document.generation<31
        )
      );
    }
  );

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

  if(generation31Committed){
    test(
      'committed Generation 31 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else{
    test(
      'pending Generation 31 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(candidate).ok,
        true
      )
    );
  }
}finally{
  fs.writeFileSync(auditPath,auditBytes);

  for(const [generation,bytes] of authorityBytes){
    fs.writeFileSync(authorityPath(generation),bytes);
  }
}

console.log(
  `Generation authority successor-aware immutability regressions: ${count}/${count}`
);
