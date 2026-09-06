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

### Git baseline and branch-safety rules

The following rules are mandatory for both A-SIDE and B-SIDE whenever a Codex
workspace or another local Git checkout is used.

1. GitHub `main`, not a local branch name, defines the authoritative baseline.
2. A local branch named `work` is workspace-local unless a GitHub branch with
   that exact name is independently verified. Never describe local `work` as a
   published or shared GitHub branch merely because it is currently checked out.
3. Before implementation, compare the local HEAD commit with the current GitHub
   `main` HEAD. If they differ, stop implementation and explicitly re-baseline
   from the current GitHub `main` before making production changes.
4. Do not accumulate new development commits directly on a generic local
   `work` branch. Create a task-specific GitHub branch from the verified current
   `main` HEAD, then use that branch for implementation and PR review.
5. Production changes must reach `main` through a pull request. Do not push or
   write implementation changes directly to `main`.
6. When reporting a merge commit, report ALL parent SHAs in repository order.
   A GitHub merge commit normally has at least two parents; do not report only
   the first parent under the ambiguous label `Parent SHA`. If first-parent
   ancestry is specifically relevant, label it `first parent` and report the
   other merge parent separately.
7. An empty local `git remote -v` means only that the current local checkout has
   no configured Git remote. It does NOT prove that the GitHub repository,
   branch, or PR history is absent. Verify GitHub state through the connected
   GitHub source before drawing any repository-level conclusion.
8. If command-line `git fetch`, `git pull`, or `git push` is required, a valid
   remote must be configured before those commands are relied upon. If work is
   performed through an authenticated GitHub integration instead, record that
   distinction explicitly rather than inventing or assuming a local remote.
9. Before each PR, record at minimum: verified GitHub `main` HEAD, task branch,
   task branch HEAD, working-tree cleanliness when locally observable, tests
   actually run, and any device/browser verification that remains pending.
10. Never claim physical-device or browser acceptance unless it was actually
    performed after the exact candidate being accepted. Automated structural
    verification and real-device acceptance are separate statuses.

### A-side startup rule

When acting as A-SIDE, before any implementation:

- read Issue #144
- locate the latest `[B-SIDE → A-SIDE HANDOFF]`,
  `[B-SIDE → A-SIDE REVIEW RESULT]`, `[BLOCKER]`, or
  `[RELEASE / MERGE STATUS]` comment relevant to the current work
- verify current GitHub `main` HEAD and TREE
- compare any local workspace HEAD against that GitHub baseline
- create or select a task-specific branch based on the verified current `main`
- follow the latest GitHub-recorded instruction

A-SIDE must not require the B-side instruction to be repeated outside GitHub.

### B-side startup rule

When acting as B-SIDE:

- read Issue #144
- locate the latest `[A-SIDE → B-SIDE REVIEW REQUEST]` or handoff
- independently inspect the referenced GitHub PR/main state
- verify that the reviewed PR is based on an appropriate authoritative baseline
- publish the review result back to Issue #144

Important:
GitHub is the only permitted A/B communication channel.
