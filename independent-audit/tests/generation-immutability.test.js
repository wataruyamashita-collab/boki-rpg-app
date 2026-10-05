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
  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]
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
  const generation72Committed=committed(72);
  const generation73Committed=committed(73);
  const generation74Committed=committed(74);
  const generation75Committed=committed(75);
  const generation76Committed=committed(76);
  const generation77Committed=committed(77);
  const generation78Committed=committed(78);
  const generation79Committed=committed(79);
  const generation80Committed=committed(80);
  const generation81Committed=committed(81);
  const generation82Committed=committed(82);
  const generation83Committed=committed(83);
  const generation84Committed=committed(84);
  const generation85Committed=committed(85);
  const generation86Committed=committed(86);
  const generation87Committed=committed(87);
  const generation88Committed=committed(88);
  const generation89Committed=committed(89);
  const generation90Committed=committed(90);
  const generation91Committed=committed(91);
  const generation92Committed=committed(92);
  const generation93Committed=committed(93);
  const generation94Committed=committed(94);
  const generation95Committed=committed(95);
  const generation96Committed=committed(96);
  const generation97Committed=committed(97);
  const generation98Committed=committed(98);
  const generation99Committed=committed(99);
  const generation100Committed=committed(100);

  test(
    'authority sequence tracks committed Generations through 100',
    ()=>assert.deepStrictEqual(
      generations,
      generation100Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]
        : generation99Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99]
        : generation98Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98]
        : generation97Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97]
        : generation96Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96]
        : generation95Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95]
        : generation94Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94]
        : generation93Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93]
        : generation92Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92]
        : generation91Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91]
        : generation90Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90]
        : generation89Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89]
        : generation88Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88]
        : generation87Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87]
        : generation86Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86]
        : generation85Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85]
        : generation84Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84]
        : generation83Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83]
        : generation82Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82]
        : generation81Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81]
        : generation80Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80]
        : generation79Committed
        ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79]
        : generation78Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78]
          : generation77Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77]
        : generation76Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76]
          : generation75Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75]
          : generation74Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74]
        : generation73Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73]
        : generation72Committed
          ? [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72]
        : generation71Committed
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

  for(const generation of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]){
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

  const generation100Pending=
    fs.existsSync(authorityPath(100))&&!generation100Committed;
  const generation99Pending=
    fs.existsSync(authorityPath(99))&&!generation99Committed;
  const generation98Pending=
    fs.existsSync(authorityPath(98))&&!generation98Committed;
  const generation97Pending=
    fs.existsSync(authorityPath(97))&&!generation97Committed;
  const generation96Pending=
    fs.existsSync(authorityPath(96))&&!generation96Committed;
  const generation95Pending=
    fs.existsSync(authorityPath(95))&&!generation95Committed;
  const generation94Pending=
    fs.existsSync(authorityPath(94))&&!generation94Committed;
  const generation93Pending=
    fs.existsSync(authorityPath(93))&&!generation93Committed;
  const generation92Pending=
    fs.existsSync(authorityPath(92))&&!generation92Committed;
  const generation91Pending=
    fs.existsSync(authorityPath(91))&&!generation91Committed;
  const generation90Pending=
    fs.existsSync(authorityPath(90))&&!generation90Committed;
  const generation89Pending=
    fs.existsSync(authorityPath(89))&&!generation89Committed;
  const generation88Pending=
    fs.existsSync(authorityPath(88))&&!generation88Committed;
  const generation87Pending=
    fs.existsSync(authorityPath(87))&&!generation87Committed;
  const generation86Pending=
    fs.existsSync(authorityPath(86))&&!generation86Committed;
  const generation85Pending=
    fs.existsSync(authorityPath(85))&&!generation85Committed;
  const generation84Pending=
    fs.existsSync(authorityPath(84))&&!generation84Committed;
  const generation83Pending=
    fs.existsSync(authorityPath(83))&&!generation83Committed;
  const generation82Pending=
    fs.existsSync(authorityPath(82))&&!generation82Committed;
  const generation81Pending=
    fs.existsSync(authorityPath(81))&&!generation81Committed;
  const generation80Pending=
    fs.existsSync(authorityPath(80))&&!generation80Committed;
  const generation79Pending=
    fs.existsSync(authorityPath(79))&&!generation79Committed;
  const generation78Pending=
    fs.existsSync(authorityPath(78))&&!generation78Committed;
  const generation77Pending=
    fs.existsSync(authorityPath(77))&&!generation77Committed;
  const generation76Pending=
    fs.existsSync(authorityPath(76))&&!generation76Committed;
  const generation75Pending=
    fs.existsSync(authorityPath(75))&&!generation75Committed;
  const generation74Pending=
    fs.existsSync(authorityPath(74))&&!generation74Committed;
  const generation73Pending=
    fs.existsSync(authorityPath(73))&&!generation73Committed;
  const generation72Pending=
    fs.existsSync(authorityPath(72))&&!generation72Committed;
  const generation71Pending=
    fs.existsSync(authorityPath(71))&&!generation71Committed;
  const generation70Pending=
    fs.existsSync(authorityPath(70))&&!generation70Committed;
  const generation69Pending=
    fs.existsSync(authorityPath(69))&&!generation69Committed;
  const generation68Pending=
    fs.existsSync(authorityPath(68))&&!generation68Committed;

  if(generation100Committed){
    test(
      'committed Generation 100 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation100Pending){
    const generation100Candidate=
      JSON.parse(fs.readFileSync(authorityPath(100),'utf8'));
    test(
      'pending Generation 100 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation100Candidate).ok,
        true
      )
    );
  }else if(generation99Committed){
    test(
      'committed Generation 99 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation99Pending){
    const generation99Candidate=
      JSON.parse(fs.readFileSync(authorityPath(99),'utf8'));
    test(
      'pending Generation 99 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation99Candidate).ok,
        true
      )
    );
  }else if(generation98Committed){
    test(
      'committed Generation 98 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation98Pending){
    const generation98Candidate=
      JSON.parse(fs.readFileSync(authorityPath(98),'utf8'));
    test(
      'pending Generation 98 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation98Candidate).ok,
        true
      )
    );
  }else if(generation97Committed){
    test(
      'committed Generation 97 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation97Pending){
    const generation97Candidate=
      JSON.parse(fs.readFileSync(authorityPath(97),'utf8'));
    test(
      'pending Generation 97 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation97Candidate).ok,
        true
      )
    );
  }else if(generation96Committed){
    test(
      'committed Generation 96 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation96Pending){
    const generation96Candidate=
      JSON.parse(fs.readFileSync(authorityPath(96),'utf8'));
    test(
      'pending Generation 96 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation96Candidate).ok,
        true
      )
    );
  }else if(generation95Committed){
    test(
      'committed Generation 95 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation95Pending){
    const generation95Candidate=
      JSON.parse(fs.readFileSync(authorityPath(95),'utf8'));
    test(
      'pending Generation 95 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation95Candidate).ok,
        true
      )
    );
  }else if(generation94Committed){
    test(
      'committed Generation 94 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation94Pending){
    const generation94Candidate=
      JSON.parse(fs.readFileSync(authorityPath(94),'utf8'));
    test(
      'pending Generation 94 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation94Candidate).ok,
        true
      )
    );
  }else if(generation93Committed){
    test(
      'committed Generation 93 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation93Pending){
    const generation93Candidate=
      JSON.parse(fs.readFileSync(authorityPath(93),'utf8'));
    test(
      'pending Generation 93 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation93Candidate).ok,
        true
      )
    );
  }else if(generation92Committed){
    test(
      'committed Generation 92 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation92Pending){
    const generation92Candidate=
      JSON.parse(fs.readFileSync(authorityPath(92),'utf8'));
    test(
      'pending Generation 92 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation92Candidate).ok,
        true
      )
    );
  }else if(generation91Committed){
    test(
      'committed Generation 91 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation91Pending){
    const generation91Candidate=
      JSON.parse(fs.readFileSync(authorityPath(91),'utf8'));
    test(
      'pending Generation 91 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation91Candidate).ok,
        true
      )
    );
  }else if(generation90Committed){
    test(
      'committed Generation 90 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation90Pending){
    const generation90Candidate=
      JSON.parse(fs.readFileSync(authorityPath(90),'utf8'));
    test(
      'pending Generation 90 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation90Candidate).ok,
        true
      )
    );
  }else if(generation89Committed){
    test(
      'committed Generation 89 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation89Pending){
    const generation89Candidate=
      JSON.parse(fs.readFileSync(authorityPath(89),'utf8'));
    test(
      'pending Generation 89 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation89Candidate).ok,
        true
      )
    );
  }else if(generation88Committed){
    test(
      'committed Generation 88 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation88Pending){
    const generation88Candidate=
      JSON.parse(fs.readFileSync(authorityPath(88),'utf8'));
    test(
      'pending Generation 88 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation88Candidate).ok,
        true
      )
    );
  }else if(generation87Committed){
    test(
      'committed Generation 87 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation87Pending){
    const generation87Candidate=
      JSON.parse(fs.readFileSync(authorityPath(87),'utf8'));
    test(
      'pending Generation 87 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation87Candidate).ok,
        true
      )
    );
  }else if(generation86Committed){
    test(
      'committed Generation 86 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation86Pending){
    const generation86Candidate=
      JSON.parse(fs.readFileSync(authorityPath(86),'utf8'));
    test(
      'pending Generation 86 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation86Candidate).ok,
        true
      )
    );
  }else if(generation85Committed){
    test(
      'committed Generation 85 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation85Pending){
    const generation85Candidate=
      JSON.parse(fs.readFileSync(authorityPath(85),'utf8'));
    test(
      'pending Generation 85 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation85Candidate).ok,
        true
      )
    );
  }else if(generation84Committed){
    test(
      'committed Generation 84 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation84Pending){
    const generation84Candidate=
      JSON.parse(fs.readFileSync(authorityPath(84),'utf8'));
    test(
      'pending Generation 84 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation84Candidate).ok,
        true
      )
    );
  }else if(generation83Committed){
    test(
      'committed Generation 83 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation83Pending){
    const generation83Candidate=
      JSON.parse(fs.readFileSync(authorityPath(83),'utf8'));
    test(
      'pending Generation 83 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation83Candidate).ok,
        true
      )
    );
  }else if(generation82Committed){
    test(
      'committed Generation 82 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation82Pending){
    const generation82Candidate=
      JSON.parse(fs.readFileSync(authorityPath(82),'utf8'));
    test(
      'pending Generation 82 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation82Candidate).ok,
        true
      )
    );
  }else if(generation81Committed){
    test(
      'committed Generation 81 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation81Pending){
    const generation81Candidate=
      JSON.parse(fs.readFileSync(authorityPath(81),'utf8'));
    test(
      'pending Generation 81 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation81Candidate).ok,
        true
      )
    );
  }else if(generation80Committed){
    test(
      'committed Generation 80 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation80Pending){
    const generation80Candidate=
      JSON.parse(fs.readFileSync(authorityPath(80),'utf8'));
    test(
      'pending Generation 80 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation80Candidate).ok,
        true
      )
    );
  }else if(generation79Committed){
    test(
      'committed Generation 79 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation79Pending){
    const generation79Candidate=
      JSON.parse(fs.readFileSync(authorityPath(79),'utf8'));
    test(
      'pending Generation 79 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation79Candidate).ok,
        true
      )
    );
  }else if(generation78Committed){
    test(
      'committed Generation 78 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation78Pending){
    const generation78Candidate=
      JSON.parse(fs.readFileSync(authorityPath(78),'utf8'));
    test(
      'pending Generation 78 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation78Candidate).ok,
        true
      )
    );
  }else if(generation77Committed){
    test(
      'committed Generation 77 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation77Pending){
    const generation77Candidate=
      JSON.parse(fs.readFileSync(authorityPath(77),'utf8'));
    test(
      'pending Generation 77 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation77Candidate).ok,
        true
      )
    );
  }else if(generation76Committed){
    test(
      'committed Generation 76 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation76Pending){
    const generation76Candidate=
      JSON.parse(fs.readFileSync(authorityPath(76),'utf8'));
    test(
      'pending Generation 76 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation76Candidate).ok,
        true
      )
    );
  }else if(generation75Committed){
    test(
      'committed Generation 75 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation75Pending){
    const generation75Candidate=
      JSON.parse(fs.readFileSync(authorityPath(75),'utf8'));
    test(
      'pending Generation 75 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation75Candidate).ok,
        true
      )
    );
  }else if(generation74Committed){
    test(
      'committed Generation 74 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation74Pending){
    const generation74Candidate=
      JSON.parse(fs.readFileSync(authorityPath(74),'utf8'));
    test(
      'pending Generation 74 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation74Candidate).ok,
        true
      )
    );
  }else if(generation73Committed){
    test(
      'committed Generation 73 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation73Pending){
    const generation73Candidate=
      JSON.parse(fs.readFileSync(authorityPath(73),'utf8'));
    test(
      'pending Generation 73 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation73Candidate).ok,
        true
      )
    );
  }else if(generation72Committed){
    test(
      'committed Generation 72 current integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCurrent().ok,
        true
      )
    );
  }else if(generation72Pending){
    const generation72Candidate=
      JSON.parse(fs.readFileSync(authorityPath(72),'utf8'));
    test(
      'pending Generation 72 candidate integrity passes',
      ()=>assert.strictEqual(
        lifecycle.verifyCandidate(generation72Candidate).ok,
        true
      )
    );
  }else if(generation71Committed){
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
