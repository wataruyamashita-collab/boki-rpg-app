'use strict';

const assert=require('assert');
const childProcess=require('child_process');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const core=require('../../scripts/qa/audit-core');
const lifecycle=require('../../scripts/qa/phase-b-lifecycle');
const finalizer=require('../../scripts/qa/finalize-phase-b-generation-16');

const script=path.join(
  core.ROOT,
  'scripts/qa/finalize-phase-b-generation-16.js'
);

const output=finalizer.output;

const historical=new Map(
  finalizer.authorityPaths.map(
    file=>[file,fs.readFileSync(file)]
  )
);

const digest=bytes=>
  crypto.createHash('sha256').update(bytes).digest('hex');

const run=()=>
  childProcess.spawnSync(
    process.execPath,
    [script],
    {cwd:core.ROOT,encoding:'utf8'}
  );

let count=0;

const test=(name,fn)=>{
  fn();
  count++;
  console.log(`ok ${count} - ${name}`);
};

const committed=
  childProcess.spawnSync(
    'git',
    [
      'cat-file',
      '-e',
      'HEAD:reports/auto-gate/audit-locks/phase-b-generation-16.json'
    ],
    {cwd:core.ROOT}
  ).status===0;

const issuedBeforeTest=fs.existsSync(output);

try{
  const authorities=lifecycle.generationAuthorities();
  const predecessorGeneration15=authorities.find(
    item=>item.document.generation===15
  );

  if(committed||issuedBeforeTest){
    const generation16=committed
      ? authorities.find(item=>item.document.generation===16)
      : {document:JSON.parse(fs.readFileSync(output,'utf8'))};

    test(
      'Generation 16 is discoverable',
      ()=>assert(generation16)
    );

    test(
      'Generation 16 predecessor is exact Generation 15',
      ()=>assert.deepStrictEqual(
        generation16.document.predecessor,
        lifecycle.identity(predecessorGeneration15.document)
      )
    );

    if(committed){
      test(
        'committed Generation 16 current integrity passes',
        ()=>assert.strictEqual(lifecycle.verifyCurrent().ok,true)
      );
    }else{
      test(
        'uncommitted issued Generation 16 verifies',
        ()=>assert.strictEqual(
          lifecycle.verifyCandidate(generation16.document).ok,
          true
        )
      );
    }

    test(
      'duplicate Generation 16 issuance fails',
      ()=>assert.notStrictEqual(run().status,0)
    );

    test(
      'historical authorities remain byte-identical',
      ()=>{
        for(const [file,bytes] of historical){
          assert(fs.readFileSync(file).equals(bytes));
        }
      }
    );
  }else{
    fs.rmSync(output,{force:true});

    const candidate=lifecycle.createCandidate();

    test(
      'candidate is Generation 16',
      ()=>assert.strictEqual(candidate.generation,16)
    );

    test(
      'predecessor is exact Generation 15',
      ()=>assert.deepStrictEqual(
        candidate.predecessor,
        lifecycle.identity(predecessorGeneration15.document)
      )
    );

    test(
      'valid candidate passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(candidate).ok,
        true
      )
    );

    test(
      'generation skip fails',
      ()=>{
        const mutant=structuredClone(candidate);
        mutant.generation=17;
        assert.strictEqual(
          lifecycle.verifyCandidate(mutant).ok,
          false
        );
      }
    );

    test(
      'historical raw SHA values are pinned',
      ()=>assert.deepStrictEqual(
        finalizer.authorityPaths.map(
          file=>digest(fs.readFileSync(file))
        ),
        finalizer.expectedAuthoritySha256
      )
    );

    test(
      'approved Generation 15 successor baseline is pinned',
      ()=>assert.deepStrictEqual(
        [finalizer.approvedHead,finalizer.approvedTree],
        [
          '2335720e6ad5b9e1cb3fe13b94e3256b7ce182d8',
          '6781555124a723268ac0ad15afc90827677873a8'
        ]
      )
    );

    test(
      'tested final Production hashes are pinned',
      ()=>{
        for(
          const [file,sha]
          of Object.entries(finalizer.finalProductionSha256)
        ){
          assert.strictEqual(core.sha(file),sha);
        }
      }
    );

    test(
      'unexpected Production drift fails',
      ()=>{
        const target=path.join(
          core.ROOT,
          'manifest.webmanifest'
        );
        const saved=fs.readFileSync(target);
        try{
          fs.appendFileSync(target,' ');
          assert.notStrictEqual(run().status,0);
        }finally{
          fs.writeFileSync(target,saved);
        }
      }
    );

    test(
      'unexpected audit drift fails',
      ()=>{
        const target=path.join(
          core.ROOT,
          'independent-audit/unapproved-generation-16.tmp'
        );
        try{
          fs.writeFileSync(target,'unexpected\n');
          assert.notStrictEqual(run().status,0);
        }finally{
          fs.rmSync(target,{force:true});
        }
      }
    );

    test(
      'one-use issuance succeeds',
      ()=>{
        const result=run();
        assert.strictEqual(
          result.status,
          0,
          result.stderr||result.stdout
        );
        assert(fs.existsSync(output));
      }
    );

    const issued=fs.readFileSync(output);
    const document=JSON.parse(issued);

    test(
      'issued bytes equal candidate bytes',
      ()=>assert(
        issued.equals(
          Buffer.from(JSON.stringify(candidate,null,2)+'\n')
        )
      )
    );

    test(
      'duplicate issuance fails',
      ()=>assert.notStrictEqual(run().status,0)
    );

    test(
      'historical authorities remain byte-identical',
      ()=>{
        for(const [file,bytes] of historical){
          assert(fs.readFileSync(file).equals(bytes));
        }
      }
    );

    test(
      'issued candidate verifies without itself as predecessor',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(document).ok,
        true
      )
    );
  }
}finally{
  if(!committed&&!issuedBeforeTest){
    fs.rmSync(output,{force:true});
  }

  for(const [file,bytes] of historical){
    fs.writeFileSync(file,bytes);
  }
}

console.log(
  `Generation 16 finalizer regressions: ${count}/${count}`
);
