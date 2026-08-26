# Ninth Evidence-First Audit (2026-08-26)

## Executive summary

This round reproduced a verified audit defect: `ExamConfidence` was 88 even though the independent exam-readiness audit passed only 3 of 10 gates. The engagement audit now derives confidence from the five required readiness components rather than learning-clarity and spaced-review proxies. The resulting simulated mean is 24, and a readiness-removal mutation lowers it further. This is a correction to the audit, not evidence that learner confidence is 24.

**STATUS: INCOMPLETE.** The repository's automated checks do not constitute an independent accounting solve or professional editorial review of every question, and real-device, browser, and real-user evidence remains unavailable.

## A. Master issue ledger

| Issue ID | Area | Severity | Evidence | Reproduction | Root Cause | Affected Files | Files Allowed To Change | Protected Files | Patch | Tests | Status | Regression Risk | Exit Condition |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|
| NINTH-001 | Engagement audit / ExamConfidence | P1 | VERIFIED: readiness 3/10 while confidence mean 88 | Run both audit scripts before this patch | Confidence used only learning clarity and spaced review | `scripts/audit-engagement.js` | Audit script and focused test | question data, grading, scheduler, UI | Feed Q1/Q2/Q3/unseen-transfer/readiness results into confidence | `node tests/audit-engagement.test.js` | PASS | Audit-only; formula changes can conceal deficits | Readiness mutation is detected and 3/10 cannot yield high confidence |
| NINTH-002 | 300-question independent oracle | P1 | VERIFIED: internal feedback audit reports 300 valid; independent source-authored mutation proof is absent | Inspect current audit implementation | Semantic validator and authored facts are not a complete independent oracle | audit tooling/data | None without verified accounting rules | all question answers | No speculative patch | Existing audits only | UNVERIFIED | False assurance | Independent rules derive all 300 answers and reject all required mutations |
| NINTH-003 | Professional editorial audit | P1 | No per-question human editorial evidence | Inspect prior reports and matrix | Automated semantic checks cannot prove natural Japanese | question content | None without verified defect | accounting facts/answers | No speculative patch | N/A | UNVERIFIED | Meaning changes during copy edits | 300/300 individually evidenced editorial decisions |
| NINTH-004 | Real-world validation | P1 | Environment has no real iPhone/user cohort evidence | Environment review | External evidence is unavailable | none | none | repository | No code patch | N/A | UNVERIFIED | Simulation presented as reality | Device/browser/user evidence exists |

Open P0: 0. Open P1: 3 (`NINTH-002`–`004`). Therefore COMPLETE is prohibited.

## B. Question audit matrix

`reports/question-audit-matrix.json` contains exactly one row per repository question and all requested columns. Automated wrong-feedback coverage and duplication measurement are identified separately; fields requiring independent accounting or professional editorial judgment remain `UNVERIFIED`. This avoids promoting an internal validator's output to an independent oracle.

Completion: question rows 300/300; independently solved 0/300; story editorial 0/300 verified; question-text editorial 0/300 verified; explanation editorial 0/300 verified. `NOT_STARTED` is 0 because unperformed gates are explicitly closed as `UNVERIFIED`; `IN_PROGRESS` is 0.

## C. Score / hard-gate ledger

| Gate | Evidence class | Status | Evidence / exit condition |
|---|---|---|---|
| Engagement audit detects engagement mutation | VERIFIED | PASS | Removing failure/progress/hooks lowers OneMoreQuestionIntent |
| Engagement audit detects exam-readiness mutation | VERIFIED | PASS | Zeroing readiness components lowers ExamConfidence |
| Exam readiness | VERIFIED | FAIL | Current audit: 3/10 |
| 300 independent accounting oracles | UNVERIFIED | UNVERIFIED | 300/300 independent derivations plus mutation rejection required |
| 300 story/question/explanation editorial reviews | UNVERIFIED | UNVERIFIED | Per-ID evidence required |
| Real iPhone/browser | UNVERIFIED | UNVERIFIED | Device/E2E evidence required |
| Real-user retention | UNVERIFIED | UNVERIFIED | Longitudinal cohort evidence required |
| Two red-team rounds with no new P0/P1 | VERIFIED | FAIL | This round found NINTH-001; consecutive count reset |
| No score gaming | VERIFIED (diff scope) | PASS | The patch lowers, rather than inflates, the reported confidence |
| Minimum necessary change | VERIFIED (diff scope) | PASS | Only audit derivation, focused test, and evidence ledgers changed |

## Round 1

- FACT/VERIFIED: 300 questions load; feedback audit reports 300 semantic-valid results; exam readiness is 3/10; prior simulated confidence was 88.
- SOURCE-SUPPORTED: The supplied requirement says confidence must include independent readiness, Q1, Q2, Q3, and unseen transfer.
- SIMULATED: The 100-person panel and its 24 confidence mean.
- UNVERIFIED: independent accounting correctness, professional editorial quality, real mobile/browser behavior, and real-user outcomes.
- Closed issue: NINTH-001.
- New P0: 0. New P1: 1 (NINTH-001, then closed). Consecutive clean rounds: 0.

## Post-patch diff audit

Every changed executable line is required to remove the reproduced self-referential confidence calculation or to test that regression. Question data, grading, scheduling, service-worker assets, UI, and CSS are protected and unchanged. Since no shipped application asset changed, the service-worker release was deliberately not bumped.

## Final decision

The corrected audit exposes rather than hides the exam gap. It does not establish 300-question independent correctness or editorial completion. **STATUS: INCOMPLETE.**
