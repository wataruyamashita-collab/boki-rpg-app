# Tenth evidence-first completion audit

## Status

**INCOMPLETE.** This round does not claim 100/100. Automated semantic validation currently reports 300/300 valid, but `reports/question-audit-matrix.json` still identifies independent accounting and professional editorial review as `UNVERIFIED`. The independent exam-readiness audit remains **3/10**. Those results must not be promoted to completion evidence.

The JCCI primary-source lookup requested for the 2026 scope was attempted on 2026-08-26, but the available web service returned HTTP 401. Official-scope verification is therefore `EXTERNAL_UNVERIFIED` in this environment.

## Verified defects and minimum patches

| Issue | Reproduction evidence | Root cause | Files allowed | Patch | Verification |
|---|---|---|---|---|---|
| P1-001–004 Placement | Q9 marked `仕入／繰越商品` correct; 8/10 correct choices were first; ten binary prompts omitted ledger/trial-balance/statement performance | Authored values encoded correctness and measured too narrow a construct | `index.html`, `js/controller.js`, `js/model.js`, `tests/app.test.js` | 16 domain-labelled items, balanced positions, semantic correct/wrong scoring, Q9 corrected, advanced-score start cap retained | app state/invariant tests PASS |
| P1-005–009 curriculum/spacing | Story included review roles; Story and Training excluded every transfer; Review listed non-due material | One `transfer` flag was used both for learnable transfer and exam reservation; entry points did not share a due gate | `js/controller.js`, `tests/app.test.js` | Separate deterministic exam candidates from learnable transfer; exclude review outside due scheduler; expose non-exam advanced formats | exposure/curriculum/spacing tests PASS |
| P1-014 Knowledge Link | click called nonexistent `model.setMode()` | Controller used an API absent from `ProgressModel` | `js/controller.js`, `tests/app.test.js` | update and persist existing model state through `openRelated`; block review/exam exposure | state-flow test PASS |
| P1-021 Engagement audit | curiosity/mission/job scores came from repository string existence | Feature presence was mistaken for per-question coverage | `scripts/audit-engagement.js`, `tests/audit-engagement.test.js` | calculate six coverage ratios from all 300 question objects | coverage and mutation tests PASS |
| P1-022/023 migration/retake | any missing placement forced the placement view; no retake action existed | no legacy migration or reset operation | `index.html`, `js/controller.js`, `js/model.js`, `tests/app.test.js` | preserve attempted user's current position; reset placement only; add retake action | reload/migration/history-preservation tests PASS |
| Release coherence | shipped HTML/controller/model changed | service-worker release keys would otherwise serve mixed assets | `index.html`, `service-worker.js`, `tests/service-worker.test.js` | bump shared release to `20260826-24` | service-worker VM test PASS |

## Remaining hard gates

- Independent accounting oracle as defined by the prompt: **not independently established**. Internal semantic result is not substituted for this gate.
- Per-question professional editorial audit: **0 independently evidenced rows**; the matrix remains truthful.
- Exam readiness: **3/10**, with journal, real-book variants, fixed-asset variant, and unseen-transfer gates failing.
- Knowledge graph coverage: **9/300 (3%)**; mission and job-unlock question coverage are 0%. The engagement audit now exposes rather than conceals this.
- Real iPhone, real-browser screenshot, 100-user study, and retention: **EXTERNAL_UNVERIFIED**.
- Red-team clean streak: **0** while the hard gates above remain open.

## Post-patch diff audit

Every changed runtime line maps to a reproduced P1 or release-coherence requirement. No question answers, audit thresholds, scoring formulas, CSS, unrelated UI, or architecture were changed. The failing exam-readiness command is retained as negative evidence rather than weakened.
