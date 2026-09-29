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
  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71]
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
  const generation67Committed=committed(67);
  const generation68Committed=committed(68);
  const generation69Committed=committed(69);
  const generation70Committed=committed(70);
  const generation71Committed=committed(71);

  test(
    'authority sequence tracks committed Generations through 71',
    ()=>assert.deepStrictEqual(
      generations,
      generation71Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71]
        : generation70Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70]
          : generation69Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69]
          : generation68Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68]
          : generation67Committed
            ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]
            : [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66]
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

  const candidate=generation67Committed
    ? documents.at(-1)
    : (
        fs.existsSync(authorityPath(67))
          ? JSON.parse(fs.readFileSync(authorityPath(67),'utf8'))
          : lifecycle.createCandidate()
      );

  for(const generation of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71]){
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
    'stale-predecessor Generation 71 successor is rejected',
    ()=>{
      const skipped=structuredClone(candidate);
      skipped.generation=71;
      rejectCandidate(skipped,documents);
    }
  );

  test(
    'competing Generation 67 is rejected',
    ()=>{
      const fork=structuredClone(candidate);
      fork.auditHash='f'.repeat(64);

      rejectCandidate(
        candidate,
        [
          ...documents.filter(
            document=>document.generation<67
          ),
          fork
        ]
      );
    }
  );

  test(
    'broken Generation 67 predecessor is rejected',
    ()=>{
      const broken=structuredClone(candidate);
      broken.predecessor.canonicalDocumentSha256='0'.repeat(64);

      rejectCandidate(
        broken,
        documents.filter(
          document=>document.generation<67
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

  const generation71Pending=
    fs.existsSync(authorityPath(71))&&!generation71Committed;
  const generation70Pending=
    fs.existsSync(authorityPath(70))&&!generation70Committed;
  const generation69Pending=
    fs.existsSync(authorityPath(69))&&!generation69Committed;
  const generation68Pending=
    fs.existsSync(authorityPath(68))&&!generation68Committed;

  if(generation71Committed){
    test(
      'committed Generation 71 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation71Pending){
    const generation71Candidate=
      JSON.parse(fs.readFileSync(authorityPath(71),'utf8'));
    test(
      'pending Generation 71 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation71Candidate).ok,
        true
      )
    );
  }else if(generation70Committed){
    test(
      'committed Generation 70 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation70Pending){
    const generation70Candidate=
      JSON.parse(fs.readFileSync(authorityPath(70),'utf8'));
    test(
      'pending Generation 70 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation70Candidate).ok,
        true
      )
    );
  }else if(generation69Committed){
    test(
      'committed Generation 69 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation69Pending){
    const generation69Candidate=
      JSON.parse(fs.readFileSync(authorityPath(69),'utf8'));
    test(
      'pending Generation 69 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation69Candidate).ok,
        true
      )
    );
  }else if(generation68Committed){
    test(
      'committed Generation 68 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation68Pending){
    const generation68Candidate=
      JSON.parse(fs.readFileSync(authorityPath(68),'utf8'));
    test(
      'pending Generation 68 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation68Candidate).ok,
        true
      )
    );
  }else if(generation67Committed){
    test(
      'committed Generation 67 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else{
    test(
      'pending Generation 67 candidate integrity passes',
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
