# Repository instructions

Before committing any change, run the mandatory quality gate:

```sh
npm run verify
```

Do not weaken an audit or regression assertion merely to make this command pass. Keep journal entries horizontal (debit account, debit amount, credit account, credit amount), and preserve authored question explanations at runtime.

Every runtime explanation must let a beginner solve that exact question again. Identify the prompt or table evidence, each selected account and its increase/decrease, why it is debit or credit, every answer amount and calculation, and the final entry or table value. Add a common-error note when it materially helps. Generic theory, answer-only prose, and token presence without meaningful reasoning are not acceptable.

## A/B development coordination

This repository uses two logical development lanes:

- A-SIDE: Primary Development Lead
- B-SIDE: Review / QA / Audit perspective

A-SIDE and B-SIDE may be operated by the same human owner. They are logical roles, not a mandatory two-person approval model.

GitHub Issue #144, "A/B Development Handoff — Bookkeeping RPG", remains the authoritative coordination ledger for important baseline, release, blocker, review, and handoff records.

Before beginning any new development, planning, implementation, review, release, or audit task:

1. Read GitHub Issue #144 when the current task depends on prior handoff, blocker, release, or review state.
2. Verify the current GitHub `main` branch before acting.
3. Treat GitHub `main` as the authoritative code source.
4. Reconcile any stale Issue #144 status against the current GitHub `main` before implementation.

Do not rely on:

- email
- external messages
- another Codex task's local history
- copied private notes
- assumed A-side/B-side state

If the authoritative GitHub baseline cannot be determined, stop production modification until the GitHub state is resolved.

### Git baseline and branch-safety rules

The following rules are mandatory whenever a Codex workspace or another local Git checkout is used.

1. GitHub `main`, not a local branch name, defines the authoritative baseline.
2. A local branch named `work` is workspace-local unless a GitHub branch with that exact name is independently verified. Never describe local `work` as a published or shared GitHub branch merely because it is currently checked out.
3. Before implementation, compare the local HEAD commit with the current GitHub `main` HEAD. If they differ, explicitly re-baseline from the current GitHub `main` before making production changes.
4. Do not accumulate new development commits directly on a generic local `work` branch. Create a task-specific GitHub branch from the verified current `main` HEAD, then use that branch for implementation and PR review.
5. Production changes must reach `main` through a pull request. Do not push or write implementation changes directly to `main`.
6. When reporting a merge commit, report ALL parent SHAs in repository order. If first-parent ancestry is specifically relevant, label it `first parent` and report the other merge parent separately.
7. An empty local `git remote -v` means only that the current local checkout has no configured Git remote. It does NOT prove that the GitHub repository, branch, or PR history is absent. Verify GitHub state through the connected GitHub source before drawing any repository-level conclusion.
8. If command-line `git fetch`, `git pull`, or `git push` is required, a valid remote must be configured before those commands are relied upon. If work is performed through an authenticated GitHub integration instead, record that distinction explicitly rather than inventing or assuming a local remote.
9. Before each PR, record at minimum: verified GitHub `main` HEAD, task branch, task branch HEAD, working-tree cleanliness when locally observable, tests actually run, and any device/browser verification that remains pending.
10. Never claim physical-device or browser acceptance unless it was actually performed after the exact candidate being accepted. Automated structural verification and real-device acceptance are separate statuses.

### A-side execution rule

A-SIDE is the primary execution path. Before implementation:

- verify current GitHub `main` HEAD and TREE
- compare any local workspace HEAD against that GitHub baseline
- create or select a task-specific branch based on the verified current `main`
- inspect applicable Issue #144 blocker/release notes when relevant
- implement the change
- run the required automated verification
- review the PR diff and scope before merge

A-SIDE does not need to wait for a separate B-SIDE response when the same human owner operates both roles. After required checks pass and the PR review is satisfactory, A-SIDE may merge the PR directly.

### B-side review rule

B-SIDE is an optional review/QA perspective, not a blocking approval gate when A-SIDE and B-SIDE are operated by the same human owner.

Use B-SIDE-style independent review when it adds value, especially for high-impact changes involving:

- accounting correctness
- protected-learning authority
- release/audit lifecycle
- data migrations or destructive changes
- security or privacy
- broad mobile/browser regressions

A B-SIDE review request or response is not required for routine progression or merge unless the human owner explicitly asks for a separate review cycle.

Important:
GitHub remains the authoritative source for code, PRs, and recorded coordination state.
