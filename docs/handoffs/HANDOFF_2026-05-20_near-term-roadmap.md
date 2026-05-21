# Near-Term Roadmap Handoff (2026-05-20)

Branch: `feature/cmdk-filter-views` (top of a 4-PR stack on top of `main`).
All four PRs are open and held for Drew's morning review.

## Next Session Onboarding

Before doing anything else, the next session must:

1. Read `C:\dev\SESSION_PROTOCOL.md`.
2. Read this project's `CLAUDE.md` if present.
3. Read this handoff doc end-to-end.
4. Run `vstart` (or `C:\dev\_scripts\session-start.ps1` with explicit `-Path`
   if outside `C:\dev\`).

## What shipped

All eight near-term features from `docs/DASHBOARD_ROADMAP.md` (sections
1.1-1.8), packaged as four reviewable PRs stacked sequentially so each
applies cleanly on top of the previous.

| PR | Branch | Base | Roadmap items |
|----|--------|------|---------------|
| [#8](https://github.com/Ginkobaloba/agile-cards-board/pull/8)  | `feature/cost-surfaces`     | `main`                  | 1.3 dollar-cost chip, 1.8 column cost rollup |
| [#9](https://github.com/Ginkobaloba/agile-cards-board/pull/9)  | `feature/tile-polish`       | `feature/cost-surfaces` | 1.7 copy-id, age, blocked-on dep badge |
| [#10](https://github.com/Ginkobaloba/agile-cards-board/pull/10) | `feature/manual-rank`       | `feature/tile-polish`   | 1.4 drag-to-reorder + sort dropdown |
| [#11](https://github.com/Ginkobaloba/agile-cards-board/pull/11) | `feature/cmdk-filter-views` | `feature/manual-rank`   | 1.1 Cmd-K, 1.2 filter chips, 1.5 saved views, 1.6 keyboard |

Merge order is the same: 8 → 9 → 10 → 11. The doc PR (#7) is also still
open; PR #8 imports the roadmap doc, so #7 is now redundant and can be
closed without merging if Drew prefers.

## How the stack composes

Each PR's branch base is the previous PR's branch, so reviewing #9 only
shows the tile-polish diff (not the cost diff already in #8). After
#8 merges to main, GitHub will automatically re-target #9's base to
`main`; same cascade for #10 and #11. Drew does not need to rebase
anything.

If Drew wants a single "what landed overnight" diff, the full stack
diff against main is `feature/cost-surfaces..feature/cmdk-filter-views`.

## Decisions

- **Stack vs separate PRs:** I chose 4 sequential PRs over 8 tiny ones
  or 1 mega-PR. The four group by theme (cost / polish / rank /
  navigation+views) and each is small enough that a focused review
  takes 15-30 minutes.
- **Fork F (cost):** backend rate table + on-demand compute. Rate
  changes reprice history. See `backend/src/cost/rates.ts`.
- **Fork A (rank):** SQLite `card_rank` table, not frontmatter. Disk
  is the work definition; rank is presentation.
- **Fork C (filter):** chip builder, not JQL. No DSL.
- **Saved-view sharing:** URL-encoded params, not cross-token DB
  reads. Multi-tenant token work (`b044-03`) will replace this with a
  real user model.
- **Cost-cap enforcement:** out of scope. Display only (color-stepped
  chip at 80% warn / 100% danger). The governor is horizon-3.
- **Focused-card gestures (`S`, `X`, `Shift-S`)** deferred. Need a
  focused-card concept in the store plus visible focus styling on
  tiles -- neither is a one-line change. Global shortcuts ship.

## Test status

Top of stack (`feature/cmdk-filter-views`):

- `npm --prefix backend run typecheck` — clean
- `npm --prefix backend test` — 36 pass, 0 fail
  - 14 stories tests (unchanged)
  - 9 cost-rates tests (new in PR #8)
  - 14 ranks tests (new in PR #10)
  - 8 saved-views tests (new in PR #11)
- `npm --prefix frontend run typecheck` — clean
- `npm --prefix frontend test` — 58 pass, 0 fail
  - 4 SubmitStory tests (unchanged)
  - 20 cost tests (new in PR #8)
  - 9 relativeTime tests (new in PR #9)
  - 8 store tests (new in PR #10)
  - 7 fuzzy tests (new in PR #11)
  - 10 filters tests (new in PR #11)
- `npm --prefix frontend run build` — 378 modules, no warnings

Each PR body also lists its own subset of these.

## What's not tested

- **Manual rank drag-and-drop end-to-end.** The midpoint algorithm
  has unit tests (including a 20-iteration density stress) and the
  selector has a sort test, but the dnd-kit wiring (same-column drop
  detection, before/after neighbor inference) is only covered by
  reading the code. Worth a 5-minute manual smoke before merging
  PR #10.
- **CommandPalette keyboard navigation.** Wired by hand on top of
  Radix Dialog; behavior verified by reading the code, not by a test.
- **URL filter sync across browser back/forward.** Implemented; not
  jsdom-tested.

These would be worth covering with a couple of @testing-library
integration tests in a follow-up if Drew wants tighter regression
coverage. The cost is moderate (~2-3 hours including setup) and the
upside is catching dnd-kit regressions before they hit the live
board.

## Process notes

- One commit (PR #3) had a stray `COMMIT_MSG.txt` in it; rewound and
  recommitted cleanly before pushing. The pushed commit is the clean
  one.
- One commit (PR #4) was initially landed on the wrong branch
  (`feature/manual-rank` instead of `feature/cmdk-filter-views`).
  Recovered with `git branch X HEAD; git reset --hard <prev>`; the
  prior branch was reset back to its pushed state, the new branch
  carries the commit, no force-push to a published branch was
  required.
- All git commands ran from PowerShell on the Windows host, per the
  protocol section on `C:\dev\` git operations.
- The plan doc lives at `docs/superpowers/plans/2026-05-20-near-term-dashboard.md`.
  It documents the file map, fork decisions, and PR boundaries; it's
  the artifact a fresh reviewer can match against the implementation.

## Suggested merge plan for Drew

1. **PR #8 (cost):** review, confirm the 80%-warn / 100%-danger
   colorscheme looks right on seeded cards, merge.
2. **PR #9 (tile polish):** GitHub re-targets to main automatically.
   Spot-check the copy-id (no modal opens on click) and the
   blocked-on-N click (jumps to dep), merge.
3. **PR #10 (rank):** **biggest risk in the stack** because of dnd-kit
   semantics. Test in a real browser: drag within column, drag
   across columns, reload to confirm rank survives, switch sort
   to Tier and confirm drag-reorder is disabled. Then merge.
4. **PR #11 (navigation):** lightest risk because it adds surface
   without changing existing behavior. Confirm Cmd-K opens
   palette, `?` opens cheatsheet, `F` focuses search, share-URL
   round-trips. Merge.

## What's next (if Drew wants the obvious follow-ups)

From the mid-term horizon, the natural successors are:

- **2.1 Sprint planner UI** — backend already speaks `/api/sprints`;
  build the timeline + budget meters on top of the rank ordering this
  stack persists. Largest payoff after cost.
- **2.5 Per-card live event timeline** — reuses the existing SSE bus;
  small backend addition to persist per-card event history.
- **2.6 Dependency view** — the `selectUnmetDeps` selector this stack
  added is already the read-side of this; needs a DAG renderer.

Open questions Drew flagged in section 10 of the roadmap (cost-cap
default, review-bandwidth number, agent avatars, embeddings provider,
multi-tenant timing) are unblocked but not blocking — none of them
gate any specific horizon-2 work.
