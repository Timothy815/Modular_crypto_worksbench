# Current Handoff

Last updated: July 10, 2026

This file is the fastest restart point for a fresh agent session.

## Current Branch And Commit State

- branch: `main`
- latest commit on `main`: `615cb0d`
- latest commit message: `Refresh Splice V2 handoff and status docs`
- latest shipped feature commit on `main`: `a6ada0f`
- latest shipped feature message: `Implement Splice V2 for symmetric operators`

## Working Tree

- expected state at handoff: clean
- current state at this handoff: clean
- if a future session starts and the tree is dirty, verify whether the changes are new user work or unfinished agent work before doing anything destructive

## What Just Shipped

`SPLICE-V2-SYMMETRIC-OPERATORS` is now complete on `main`.

The latest shipped authoring improvement includes:

- splice-on-wire now accepts same-domain multi-input operators like `XOR` and `AND`
- splice chooses the first matching input by definition order
- remaining required inputs are left visibly unconnected
- existing missing-input badges and jump-to-error continue to surface the unfinished state honestly

The immediately preceding shipped experiential/UI layers remain intact:

- `CANVAS-FEEDBACK-REFINEMENT-V1`
- `LIVE-MACHINE-FEEL-V1`

Those shipped layers include:

- `A` canvas error badges with categorized hover copy
- `B` port hover snap-preview
- `F` connection drag from output chip
- `E` jump-to-first-error
- `D` splice-on-wire
- `C` wire domain legend
- `G` one-gesture label+frame with auto-label hint
- `I` tick pulse on wires

## Current Product State

MCW is now in a strong post-crypto, post-durability, post-document-workflow, post-live-machine-feel, post-canvas-feedback-refinement, post-splice-v2 phase.

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
- the complete bounded `LIVE-MACHINE-FEEL-V1` experiential pass
- the bounded `CANVAS-FEEDBACK-REFINEMENT-V1` polish follow-on
- the bounded `SPLICE-V2-SYMMETRIC-OPERATORS` splice-authoring follow-on

## Canonical Restart Read Order

1. `AGENTS.md`
2. `PROJECT.md`
3. `ENGINE-V1-CONTRACT.md`
4. `EXPERIENTIAL-NORTH-STAR-V1.md`
5. `CURRENT-HANDOFF.md`
6. `IMPLEMENTATION-STATUS.md`
7. `ACTIVE-DOCS.md`

## Next Likely Work

There is no contracted automatic follow-on after `SPLICE-V2-SYMMETRIC-OPERATORS`.

Recommended next direction:

- reassess the product fresh against `EXPERIENTIAL-NORTH-STAR-V1.md`
- verify in current source where the highest real friction still remains
- draft the next bounded contract from the present codebase, not from older queue memory
- do not assume there is a half-finished implementation waiting; there is not

The likely candidate categories are:

1. operator guidance / onboarding coherence
2. workflow/discovery coherence
3. another bounded experiential pass only if a real remaining north-star gap is still obvious
4. a new crypto-capability slice only if product-shaping friction is no longer the bottleneck

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
- do not infer a `LIVE-MACHINE-FEEL-V2`, `CANVAS-FEEDBACK-REFINEMENT-V2`, or `SPLICE-V3` automatically; reassess first
