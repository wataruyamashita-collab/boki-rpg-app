'use strict';
const assert=require('assert');
const fs=require('fs');
const lifecycle=require('../scripts/qa/phase-b-lifecycle');
const validator=require('../scripts/qa/validate-edu-taxonomy');

const ARTIFACT='reports/edu-quality/question-taxonomy-2026.json';
const artifact=JSON.parse(fs.readFileSync(ARTIFACT,'utf8'));

assert(artifact.officialSyllabusAuthority,'official syllabus authority metadata');
assert.strictEqual(artifact.officialSyllabusAuthority.organization,'日本商工会議所');
assert.strictEqual(artifact.officialSyllabusAuthority.effectiveDate,'2022-04-01');
assert.strictEqual(artifact.officialSyllabusAuthority.appliesToExamYear,2026);
assert(/^https:\/\/www\.kentei\.ne\.jp\//.test(artifact.officialSyllabusAuthority.authorityPageUrl),'official authority page URL');
assert(/^https:\/\/www\.kentei\.ne\.jp\//.test(artifact.officialSyllabusAuthority.pdfUrl),'official syllabus PDF URL');

const expectedLegend={
  'P1-1':'第一 簿記の基本原理 / 1. 基礎概念',
  'P1-2':'第一 簿記の基本原理 / 2. 取引',
  'P1-3':'第一 簿記の基本原理 / 3. 勘定',
  'P1-4':'第一 簿記の基本原理 / 4. 帳簿',
  'P1-5':'第一 簿記の基本原理 / 5. 証ひょうと伝票',
  'P2-1':'第二 諸取引の処理 / 1. 現金預金',
  'P2-3':'第二 諸取引の処理 / 3. 売掛金と買掛金',
  'P2-4':'第二 諸取引の処理 / 4. その他の債権と債務等',
  'P2-5':'第二 諸取引の処理 / 5. 手形',
  'P2-6':'第二 諸取引の処理 / 6. 債権の譲渡',
  'P2-7':'第二 諸取引の処理 / 7. 引当金',
  'P2-9':'第二 諸取引の処理 / 9. 商品の売買',
  'P2-12':'第二 諸取引の処理 / 12. 有形固定資産',
  'P2-20':'第二 諸取引の処理 / 20. 収益と費用',
  'P2-21':'第二 諸取引の処理 / 21. 税金',
  'P3-1':'第三 決算 / 1. 試算表の作成',
  'P3-2':'第三 決算 / 2. 精算表（8桁）',
  'P3-3':'第三 決算 / 3. 決算整理',
  'P3-4':'第三 決算 / 4. 決算整理後残高試算表',
  'P3-5':'第三 決算 / 5. 収益と費用の損益勘定への振替',
  'P3-6':'第三 決算 / 6. 純損益の繰越利益剰余金勘定への振替',
  'P3-8':'第三 決算 / 8. 帳簿の締切',
  'P3-9':'第三 決算 / 9. 損益計算書と貸借対照表の作成',
  'P4-1':'第四 株式会社会計 / 1. 資本金',
  'P4-3':'第四 株式会社会計 / 3. 利益剰余金',
  'P4-4':'第四 株式会社会計 / 4. 剰余金の配当など'
};
assert.deepStrictEqual(artifact.syllabusCodeLegend,expectedLegend,'official syllabus-code legend');

const f001=artifact.rows.find(row=>row.id==='F001');
assert(f001,'F001 taxonomy row');
assert.deepStrictEqual(f001.explanationLearningObjective.targetConceptIds,['FS_INCOME_STATEMENT'],'F001 income-statement target');

assert.strictEqual(typeof validator.validateArtifact,'function','dedicated validator exports full artifact validator');
const broken=JSON.parse(JSON.stringify(artifact));
delete broken.rows[0].primarySyllabusMapping;
assert.throws(()=>validator.validateArtifact(broken),/primary syllabus/i,'dedicated validator rejects missing required schema');

const candidate=lifecycle.createCandidate();
assert(candidate.files[ARTIFACT],'Generation candidate locks taxonomy sidecar');
console.log('ISSUE201_GENERATION_109_CANDIDATE '+JSON.stringify(candidate));

console.log('ISSUE201_POSTMERGE_REVIEW_REGRESSION_PASS');
throw new Error('ISSUE201_GENERATION_109_CAPTURE_STOP');
