# Current Handoff

Last updated: May 23, 2026

This file is the fastest restart point for a fresh agent session.

## Current Branch And Commit

- branch: `main`
- latest shipped commit on `main`: `9a1d5c9`
- latest shipped message: `Add dependency-aware reusable promotion`

## Working Tree

- expected state at handoff: clean
- if a future session starts and the tree is dirty, verify whether the changes are new user work or unfinished agent work before doing anything destructive

## What Just Shipped

The latest authored-reuse slice is now live on `main`:

- `PROMOTE-DEPENDENCIES-TOO-V1`

MCW now supports:

- workspace-scoped reusables by default
- explicit promotion to `Personal Library`
- immediate dependency visibility and promotion warnings
- bounded `Promote Reusable With Selected Dependencies` flow
- unselected-by-default immediate workspace-local dependency checklist
- copy-based multi-entry promotion
- continued warnings when excluded or still-transitive workspace-local dependencies remain unresolved

## Current Product State

MCW is now in a strong post-crypto, post-durability, post-document-workflow authoring phase.

Already shipped on `main`:

- full recent ECC teaching/consequence line
- durability + autosave recovery
- durability UX
- local document workflow (`Open Workspace...`, `Save`, `Save As...`)
- self-contained workspace documents
- composite authoring ergonomics
- workspace navigation and saved regions
- reusable-library ergonomics
- workspace-scoped reusables
- reusable dependency visibility
- dependency-aware reusable promotion

## Canonical Restart Read Order

1. `AGENTS.md`
2. `PROJECT.md`
3. `ENGINE-V1-CONTRACT.md`
4. `EXPERIENTIAL-NORTH-STAR-V1.md`
5. `CURRENT-HANDOFF.md`
6. `IMPLEMENTATION-STATUS.md`
7. `ACTIVE-DOCS.md`

## Next Likely Work

No next slice is drafted yet after `PROMOTE-DEPENDENCIES-TOO-V1`.

The most likely next authored-reuse follow-ons are:

1. `PERSONAL-LIBRARY-ORGANIZATION-V1`
- lightweight tags/groups/filtering for the personal library
- best if clutter in the personal layer is becoming the next pain point

2. `REUSABLE-IMPACT-AND-REFERENCES-V1`
- show where a reusable is used before rename/delete/promotion
- best if trust and safe cleanup are the next concern

3. a smaller promotion follow-on only if needed
- for example, more explicit post-promotion placement/reuse cues
- but only if real use shows the current bounded dialog is still insufficient

Recommended next direction if no new user priority overrides it:

- `PERSONAL-LIBRARY-ORGANIZATION-V1`

Reason:

- ownership and promotion trust are now in good shape
- the next likely pain point is personal-library clutter and recognition rather than promotion mechanics

## Verification Baseline

Before the latest commit, the following were green:

- `npx vitest run`
- `npm run build`

## Important Boundaries To Preserve

- keep engine logic independent from UI/persistence
- keep reusable promotion copy-based unless a future contract explicitly changes that
- keep workspace documents self-contained
- do not silently retarget current workspaces to personal-library copies
- do not drift into package-manager semantics without a contract
