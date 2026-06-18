# SUPERSEDED

This repo is archived as of **2026-06-18**.

The board now lives inside the `agile-cards` monorepo at
[`Ginkobaloba/agile-cards/apps/board/`](https://github.com/Ginkobaloba/agile-cards/tree/main/apps/board).

## Why

The board and the engine were built simultaneously in two repos but
they are one product. The card schema is shared vocabulary; a change
to the engine's card store and the matching board view-model update
have to land together or the integration breaks. Two repos made every
cross-cutting change a coordination problem. They live in one repo now.

## What survived

The full commit history of this repo (51 commits, including every
feature branch in flight at the time of the move) was grafted into
the monorepo via `git subtree add --prefix=apps/board`, without
`--squash`. The original SHAs are preserved. `git log apps/board/<file>`
in the new repo reaches the original commits with their original
authors and dates.

## Pointers

- The final commit on this repo's `main` before the move is tagged
  [`archived-pre-monorepo-2026-06-18`](https://github.com/Ginkobaloba/agile-cards-board/releases/tag/archived-pre-monorepo-2026-06-18).
- The merge PR on the monorepo side is
  [`Ginkobaloba/agile-cards#37`](https://github.com/Ginkobaloba/agile-cards/pull/37).
- The merged board path: [`apps/board/`](https://github.com/Ginkobaloba/agile-cards/tree/main/apps/board).
- The merged board's README: [`apps/board/README.md`](https://github.com/Ginkobaloba/agile-cards/blob/main/apps/board/README.md).

## What to do with open work that was on this repo

If you had a branch in flight here, rebase it onto the monorepo:

```powershell
cd C:\dev\agile-cards
git remote add archived-board <path-or-url-to-this-archive>
git fetch archived-board
git checkout -b your-feature-from-board archived-board/your-feature-branch
# rewrite the paths so files live under apps/board/
git filter-repo --to-subdirectory-filter apps/board
git rebase main
```

For most live feature branches the path-rewrite is simply moving every
file two levels deeper. The `filter-repo --to-subdirectory-filter`
incantation above does that for the whole branch in one pass.

If you don't want to do the rebase yourself, ping Drew and he'll do it.

## Don't open PRs here

This repo is read-only going forward. Open PRs against the monorepo:
[`Ginkobaloba/agile-cards`](https://github.com/Ginkobaloba/agile-cards).
