# Repository instructions

Before committing any change, run the mandatory quality gate:

```sh
npm run verify
```

Do not weaken an audit or regression assertion merely to make this command pass. Keep journal entries horizontal (debit account, debit amount, credit account, credit amount), and preserve authored question explanations at runtime.

Every runtime explanation must let a beginner solve that exact question again. Identify the prompt or table evidence, each selected account and its increase/decrease, why it is debit or credit, every answer amount and calculation, and the final entry or table value. Add a common-error note when it materially helps. Generic theory, answer-only prose, and token presence without meaningful reasoning are not acceptable.
## A/B development coordination

This repository uses GitHub-only asynchronous coordination between two
development lanes:

- A-SIDE: Primary Development Lead
- B-SIDE: Independent Review / QA / Audit Support

The authoritative coordination ledger is:

GitHub Issue #144
"A/B Development Handoff — Bookkeeping RPG"

Before beginning ANY new development, planning, implementation, review,
release, or audit task:

1. Read GitHub Issue #144.
2. Read the Issue body.
3. Read all comments added since the previous handoff.
4. Identify the latest applicable handoff or review instruction.
5. Verify the current GitHub `main` branch before acting.
6. Treat GitHub `main` as the authoritative code source.
7. Treat Issue #144 as the authoritative A/B communication source.

Do not rely on:

- email
- external messages
- another Codex task's local history
- copied private notes
- assumed A-side/B-side state

If Issue #144 cannot be accessed or its latest handoff state is ambiguous:

STOP.

Do not modify production until the GitHub coordination state is resolved.

### A-side startup rule

When acting as A-SIDE, before any implementation:

- read Issue #144
- locate the latest `[B-SIDE → A-SIDE HANDOFF]`,
  `[B-SIDE → A-SIDE REVIEW RESULT]`, `[BLOCKER]`, or
  `[RELEASE / MERGE STATUS]` comment relevant to the current work
- verify current `main`
- follow the latest GitHub-recorded instruction

A-SIDE must not require the B-side instruction to be repeated outside GitHub.

### B-side startup rule

When acting as B-SIDE:

- read Issue #144
- locate the latest `[A-SIDE → B-SIDE REVIEW REQUEST]` or handoff
- independently inspect the referenced GitHub PR/main state
- publish the review result back to Issue #144

Important:
GitHub is the only permitted A/B communication channel.
