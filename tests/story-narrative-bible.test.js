'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('data/questions.js','utf8');
const marker='const WorkInstructions = Object.freeze({';
assert(source.includes(marker),'ChapterDrama probe marker must remain available');

const instrumented=source.replace(
  marker,
  `if (typeof window !== 'undefined') window.__ChapterDrama = ChapterDrama;
${marker}`
);

const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(instrumented,sandbox,{filename:'data/questions.js'});

const arcs=sandbox.window.__ChapterDrama;
assert(arcs,'ChapterDrama must be exposed by the test probe');
assert.deepStrictEqual(
  Object.keys(arcs).map(Number),
  Array.from({length:12},(_,i)=>i+1),
  'Narrative Bible must define all 12 semantic chapters'
);

const expectedThemes={
  1:'拡大資金の記録',
  2:'営業部の未精算',
  3:'回収予定表の空白',
  4:'現金の違和感',
  5:'業務拡大',
  6:'給与日の混乱',
  7:'月次締めの壁',
  8:'試算表のずれ',
  9:'決算前夜',
  10:'年度決算の予行演習',
  11:'取締役会前の最終照合',
  12:'最後の決算'
};
for(const [chapter,theme] of Object.entries(expectedThemes)){
  assert.strictEqual(arcs[chapter].theme,theme,`Chapter ${chapter} theme must match Narrative Bible v0.1`);
}

const semanticChecks={
  1:/資本|現金|預金/u,
  2:/仕入|売上|返品|商品/u,
  3:/債権|債務|売掛|買掛|回収|支払/u,
  4:/現金|小口|差額|過不足/u,
  5:/固定資産|仮払|立替|借入|投資/u,
  6:/給与|預り|社会保険|税/u,
  7:/帳簿|元帳|転記|残高/u,
  8:/試算表|訂正|未記帳|差異|ずれ/u,
  9:/期間|当期|前払|未払|前受|未収/u,
  10:/決算整理|精算表|減価償却|貸倒|売上原価/u,
  11:/消費税|仮払|仮受|未払/u,
  12:/財務諸表|成果|財政状態|最終報告/u
};

for(const [chapter,re] of Object.entries(semanticChecks)){
  const arc=arcs[chapter];
  const narrative=[arc.problem,arc.goal,arc.result,arc.stakes].join(' ');
  assert(
    re.test(narrative),
    `Chapter ${chapter} Narrative Bible must align with its semantic accounting topic: ${narrative}`
  );
}

console.log('ISSUE179_NARRATIVE_BIBLE_ALIGNMENT_PASS');
