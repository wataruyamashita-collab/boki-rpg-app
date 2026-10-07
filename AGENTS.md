# Repository execution instructions

## Live source and single writer

GitHub main is the production source of truth. Read current main HEAD/TREE, Issue #153 (current state), Roadmap #177 and the active Issue/PR; read Issue #144 when prior decisions/releases/blockers matter. [Product Charter](docs/master_specification.md), [Foundation Acceptance](docs/FOUNDATION_V1_ACCEPTANCE.md) and the [requirement index](docs/FOUNDATION_V1_MASTER_PROMPT.md) have distinct roles. Latest explicit user requirements govern scope; code and exact-SHA tests prove implementation.

Do the initial role/gap audit once or on material requirement changes; routine work checks only changed main, relevant scope/CI/reviews and the critical path. Do not repeat accepted work, duplicate issues/PRs/roadmaps/docs or grow the master prompt. Classify work as RPG-ONLY, RPG-CORE, SHARED-CANDIDATE, TRAINING-DESIGN or TRAINING-IMPLEMENTATION. Prioritize evidenced P0/P1; do not demote mandatory RPG features or add attractive P2 work to Foundation acceptance.

One writer per implementation/branch/Generation/merge. Delegate bounded Codex implementation/tests with Issue, purpose, start SHA, task branch, allowed/protected files, acceptance, real test commands and output. Do not write its branch concurrently; record a handoff before changing writers. A/B are logical roles, not a mandatory two-person approval or proof of independent expert review. Already-authorized steps do not need repeated user confirmation.

## Git and scope safety

Compare local HEAD to live main before implementation; rebaseline and select a task-specific branch from current main or safely update the existing PR branch. Local `work` is not a published branch. An absent local remote proves only missing local configuration, not absent GitHub history. Configure a valid remote before relying on CLI fetch/pull/push; otherwise identify authenticated-connector use. Stop production edits when the authoritative baseline is unknown. Production changes reach main through PRs, never direct writes. Preserve concurrent changes with expected-SHA leases; re-read on conflict.

Keep exactly300 canonical IDs, grading/Oracle, Exam/Review membership, authored explanation coverage, state isolation, continuity/mastery/review authority, RPG progression/rewards/anti-farming and historical Generation files unchanged except for explicitly design-locked changes with tests. Content replacement requires explicit content identity and safe old/new/mixed/missing-history migration; preserve old evidence, valid current evidence, lifetime effort and earned rewards. Validate backup/import transactionally. Never reset all questions to repair one migration.

Keep journal input horizontal: `借方科目 | 借方金額 | 貸方科目 | 貸方金額`. Preserve tap/focus, contextual calculator, next-cell behavior, input retention and mobile no-unnecessary-horizontal-scroll contracts. Runtime explanations teach the exact question: prompt/table evidence, relevant account/formula and increase/decrease, debit/credit or cell placement, amount calculation and final entry/value; common errors when useful. No generic token-only/answer-only substitute or forced long template. Unsupported error-cause inference is candidate/unknown, not a diagnosis.

No secrets, credentials, personal/personnel/payroll/company financial data or unrelated chat history in this repo. Verify necessary current external facts from official sources; do not copy third-party questions, explanations, code, images or screen designs.

## Test, review and merge

Before committing **any change**, run the mandatory gate:

```sh
npm run verify
```

Run applicable existing QA/integrity/browser/normal/boundary/negative regressions and independent accounting recalculation. Discover actual commands; never invent results. Do not remove tests, exempt inconvenient cases, weaken assertions or rewrite authority/expected values just to turn red green. Use the normal successor Generation/Release lifecycle for relevant changes; keep historical bytes immutable.

Review the exact diff against scope. Codex review is normally required for nontrivial grading/state/storage/review/PWA/input/shared-core/content/authority/security changes; nonfunctional Markdown may use risk-based primary review under repository rules. After changes repeat affected tests/review on the new candidate. Inspect branch/ruleset enforcement; do not silently change admin settings or claim protection from instructions alone.

Immediately before Ready/merge re-read main, exact HEAD/TREE, required CI, reviews and comparison. Require latest-HEAD GREEN, behind=0, mergeable=true and unresolved review threads=0. Failed, stale, unexpectedly skipped, action-required or ambiguous checks are not GREEN. Use `expected_head_sha` and a normal merge where authority ancestry must be preserved. User merge authorization never waives gates.

After merge verify the actual merged SHA/TREE, ALL parents in repository order (label first parent), main CI, regression/integrity, accounting and relevant PWA/publication behavior. Accept/close completed work and start further production edits only after exact merged-main GREEN. Update existing roadmap/current-state/ledger by delta, re-read after writes, then return to the critical path.

## Evidence reporting

Report work done, main/PR HEAD and actual merge SHA, CI run/results, recalculation, merge decision, unmet conditions and next step. Before each PR record baseline/task branch/HEAD, locally observable cleanliness and pending browser/device checks. Distinguish Foundation, Grade3 RPG, Grade2 and Grade1 completion; do not infer completion percentages from PR counts.

Codex states: not-requested / prepared / sent / start-confirmed / running / completed / blocked or failed. A request is not a running task; retain task/bot/commit evidence. No claimed background work without a launched service. Automated browser evidence is not physical-device evidence. The same AI under another title is not an independent expert. Unverified facts and missing provenance stay unknown.
