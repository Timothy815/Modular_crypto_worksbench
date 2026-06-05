# Current Handoff

Last updated: June 5, 2026

This file is the fastest restart point for a fresh agent session.

## Current Branch And Commit

- branch: `main`
- latest shipped commit on `main`: pending commit after `34c32eb`
- latest shipped message: `Add reusable impact references`

## Working Tree

- expected state at handoff: clean
- if a future session starts and the tree is dirty, verify whether the changes are new user work or unfinished agent work before doing anything destructive

## What Just Shipped

The latest authored-reuse slice is now implemented in the working tree:

- `REUSABLE-IMPACT-AND-REFERENCES-V1`
- `REUSABLE-JUMP-TO-REFERENCES-V1`

MCW now supports:

- reusable impact summaries in the reusable palette
- separate placed-instance counts from reusable-definition reference counts
- saved-local reference copy that does not imply external-file scanning
- delete blocking when either placed instances or other reusable definitions reference an entry
- rename copy that clarifies display-name changes keep stable ids and references unchanged
- `Open board` actions from reusable placed-reference rows into the saved-local board that currently contains the reusable
- `Open reusable` actions from reusable-definition reference rows when that reusable kind already has an edit/open affordance
- bounded disabled-state copy when a reference target is not currently jumpable

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
- personal-library tag organization
- reusable impact/reference visibility
- reusable jump-to-reference navigation

## Canonical Restart Read Order

1. `AGENTS.md`
2. `PROJECT.md`
3. `ENGINE-V1-CONTRACT.md`
4. `EXPERIENTIAL-NORTH-STAR-V1.md`
5. `CURRENT-HANDOFF.md`
6. `IMPLEMENTATION-STATUS.md`
7. `ACTIVE-DOCS.md`

## Next Likely Work

No next authored-reuse follow-on is drafted yet after `REUSABLE-JUMP-TO-REFERENCES-V1`.

The most likely future authored-reuse directions are:

1. a reusable cleanup/actionability follow-on only if real use shows jump-only navigation is insufficient
- for example, a bounded replace-reference workflow
- but only with a fresh contract, since this slice intentionally stopped short of retargeting semantics

2. a smaller personal-library organization follow-on only if the current tag layer proves too thin
- for example, tag rename or tag cleanup

Recommended next direction if no new user priority overrides it:

- pause automatic authored-reuse follow-ons and evaluate where real author friction remains

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
