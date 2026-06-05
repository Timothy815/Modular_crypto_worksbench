# Reusable Impact And References V1

Last updated: June 3, 2026
Status: Shipped

---

## Purpose

Add one bounded authored-reuse trust slice so MCW shows where a reusable is referenced before authors rename, delete, promote, or reorganize it.

This slice follows:

- [Workspace-Scoped Reusables V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-SCOPED-REUSABLES-V1.md)
- [Reusable Dependency And Promotion Visibility V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/REUSABLE-DEPENDENCY-AND-PROMOTION-VISIBILITY-V1.md)
- [Promote Dependencies Too V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/PROMOTE-DEPENDENCIES-TOO-V1.md)
- [Personal Library Organization V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/PERSONAL-LIBRARY-ORGANIZATION-V1.md)

It is not a package manager.
It is not semantic versioning.
It is not automatic dependency repair.

It is one bounded impact-literacy slice: before changing or deleting a reusable, the author can see the immediate places that currently rely on it.

---

## Why This Slice Exists

MCW now has a stronger authored-reuse model:

- new authored reusables are workspace-scoped by default
- personal-library promotion is explicit and copy-based
- immediate reusable dependency scope is visible
- promotion can include selected immediate workspace-local dependencies
- personal-library entries can be tagged and filtered

That makes reusables easier to own and find. The next trust gap is impact:

- if I rename this reusable, what am I touching
- if I delete it, which placed instances or reusable definitions will break
- if another reusable depends on it, can I see that before cleanup
- if I promote it, am I promoting a reusable that is already depended on by local authored parts

The product standard should not be:

- "delete or rename first, then discover later that another authored reusable depended on it"

It should be:

- "before a destructive or identity-adjacent action, MCW shows the bounded reference picture"

without turning the reusable library into a full dependency-management product.

---

## Scope

### In scope

- one reusable-reference summary for each reusable-library entry
- placed-instance references across workspace documents saved in MCW's durable local workspace store, including the currently loaded UI state
- immediate reusable-definition references from other reusable definitions
- compact reference details inside the existing reusable palette/card surface
- delete warning text that names both placed-instance and reusable-definition references
- bounded tests for reference counting, reference classification, and delete blocking/warning behavior

### Out of scope

- recursive dependency graph explorer
- semantic versioning or upgrade management
- automatic retargeting from one reusable to another
- safe-delete cascade operations
- bulk replacement flows
- cloud/team reusable catalogs
- scanning external `.mcw` files that have not been opened, imported, or saved into MCW's local workspace store

---

## Strategic Principle

V1 must separate two reference types:

- **placed instances**: modules in workspace projects whose `defId` is this reusable id
- **reusable-definition references**: other reusable definitions that immediately refer to this reusable id

Reusable-definition references include composite, iterator, clocked-iterator, conditional, and multi-conditional definitions whose internal module set, body definition, or branch definition list contains this reusable id.

The slice succeeds only if authors can answer:

- is this reusable placed on any locally saved workspace board MCW can enumerate
- is this reusable used as the body/branch/internal module of another reusable
- which high-level workspace or reusable names are involved
- whether delete is unavailable because references still exist

It must not imply:

- that MCW has modeled the full recursive impact tree
- that references can be automatically repaired
- that renaming the display name changes stable ids or reference resolution
- that personal-library tagging changes dependency or reference semantics

---

## Required Product Behavior

### 1. The reusable-library card must show one compact impact summary

For every reusable entry, V1 must show a compact reference summary alongside the existing origin, dependency, and usage details.

At minimum:

- no references beyond built-in availability
- placed instance count
- reusable-definition reference count

Acceptable summary examples:

- `No saved-local references`
- `Placed in 2 saved boards`
- `Referenced by 1 reusable`
- `Placed in 2 saved boards · referenced by 1 reusable`

The current `usageCount` already counts placed instances. V1 should extend the product language so that placed-instance use is not confused with reusable-definition dependency/reference use.

The reference boundary must be explicit in UI copy: placed counts cover the current live state plus workspace documents saved in MCW's durable local workspace store. They do not claim to cover unopened external files on disk.

`No saved-local references` should appear only when both counts are zero: no saved-local placed instances and no immediate reusable-definition references.

### 2. Expanded details must list immediate reference names only

When a reusable has references, the expanded palette card should show a bounded detail list:

- workspace/project names for placed instances when available
- referring reusable names and scope labels for reusable-definition references

The detail list should be immediate-only. It does not need to expand references of references.

### 3. Delete must remain blocked when references exist, with better reason text

Today delete is disabled when placed instances exist. V1 must also consider immediate reusable-definition references.

The delete affordance should explain why deletion is unavailable:

- placed instances still exist
- other reusable definitions still reference it
- both, if both are true

V1 should not add forced delete.

Delete blocking should use the same saved-local reference boundary as the summary. If a reusable is referenced by any locally saved workspace document or any reusable definition in the current library, delete must remain unavailable.

### 4. Rename must clarify display-name-only impact

Reusable rename currently changes display names while stable ids remain fixed. V1 should keep that behavior and make the impact language clearer:

- renaming does not break placed instances
- renaming does not retarget reusable-definition references
- stable id stays unchanged

This can be a compact note in the rename card, not a modal.

### 5. Promotion and organization must stay distinct from reference impact

V1 may show reference counts on personal-library, workspace-local, and built-in reusable cards, but it must not change promotion or tag semantics.

In particular:

- personal tags do not affect references
- promotion still creates copies
- workspace-local originals are not silently retargeted
- personal-library copies created by promotion count as reusable-definition references exactly like workspace-local reusables when they refer to another reusable id

### 6. The slice must stay inside existing surfaces

The committed architectural homes are:

- reusable-library helper functions
- reusable palette/card summaries
- existing delete/rename affordances
- existing tests for reusable-library and palette behavior

This is not a new management dock or graph browser.

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Card summary**
   - current origin/scope summary remains
   - reference summary appears near dependency summary
   - placed-instance count and reusable-definition count are visibly different

2. **Expanded card detail**
   - bounded "References" block only when references exist
   - list workspace/project names and referring reusable names
   - label referring reusable scope as built-in / this workspace / personal library

3. **Delete affordance**
   - disabled if placed instances or reusable-definition references exist
   - title/aria-label names the reason

4. **Rename note**
   - keeps current stable-id language
   - adds that display-name rename does not change references

This should feel like safe cleanup context, not package tooling.

---

## Data / UX Guidance

V1 should use a narrow but saved-local reference model:

- placed instance scan across the current live `state.projectStates` plus workspace documents available through MCW's durable local workspace persistence path
- immediate reusable-definition reference scan across `state.compositeLibrary`
- reuse `getImmediateReusableDependencyIds` where possible for definition references
- do not recursively walk dependency trees in the UI

Preferred language:

- `Placed in 2 saved workspace boards`
- `Referenced by 1 reusable`
- `Delete unavailable while this reusable is placed in saved local work or referenced by another reusable`
- `Rename changes the display name only. Stable id and existing references stay unchanged.`

Avoid:

- `dependency tree`
- `package impact`
- `breaking change`
- `publish`
- `upgrade`
- `resolve`

Those terms imply a package-management model MCW does not yet have.

---

## Implementation Notes

### 1. Add a reusable-reference helper

Create a helper that accepts:

- reusable entry id
- composite library
- current project states plus locally persisted workspace documents, or a compact project summary input produced from those sources
- active workspace id if scope labels need current-workspace wording

It should return:

- placed reference count
- placed reference summaries
- reusable-definition reference count
- reusable-definition reference summaries
- one compact summary string
- one delete-blocking reason string when applicable

The implementation should read saved-local workspace references through the existing persistence boundary:

- current live state from `state.projectStates`
- durable local workspace documents through the `src/ui/workspace-durability.ts` / `src/ui/persistence.ts` load path
- any legacy `localStorage` workspace data only through the existing migration/load path, not a second ad hoc parser

V1 does not need to scan arbitrary external workspace files that have not been opened, imported, or saved into MCW.

The existing `usageCount` shape should remain the placed-instance count for compatibility. V1 should add sibling reference-summary data rather than overloading or replacing `usageCount`.

### 2. Reuse current dependency discovery

Reusable-definition references can use the already-shipped immediate dependency path:

- `getImmediateReusableDependencyIds`

The direction is inverted:

- dependency visibility asks "what does this reusable depend on"
- impact visibility asks "what other reusables depend on this reusable"

### 3. Keep delete behavior conservative

Deleting a reusable with immediate reusable-definition references should be blocked in V1, even if no placed instances currently exist.

This avoids producing reusable definitions that refer to missing ids.

### 4. Keep display-name rename non-destructive

Rename should not require reference confirmation because it does not change stable ids. The UI should clarify this rather than adding friction.

### 5. Include detached palette parity

The detached palette receives the same composite library and usage-count data. V1 should keep reference summaries and delete affordance behavior consistent there.

The reference summary input should be computed by the host and passed to the palette snapshot, rather than asking detached windows to read persistence directly.

---

## Testing Requirements

1. `npx vitest run` must pass.

2. `npm run build` must pass.

3. Reference helper tests:
   - reports no references for an unused reusable
   - counts placed module instances separately from reusable-definition references
   - classifies referring reusable scope as workspace / personal / built-in
   - produces a delete-blocking reason when either reference type exists
   - includes placed references from saved-local workspace documents, not only the currently active board

4. Palette tests:
   - card summary distinguishes placed use from reusable-definition references
   - delete is disabled when reusable-definition references exist even if placed usage is zero
   - rename affordance renders text stating that display-name rename does not change stable ids or existing references
   - detached palette snapshot renders the same delete-disabled state for a referenced reusable

5. Existing dependency visibility and promote-with-dependencies tests must remain green.

---

## Acceptance Criteria

- A reusable with zero placed instances in saved-local workspace documents and zero reusable-definition references shows `No saved-local references`.
- A reusable with placed instances in saved-local workspace documents shows a placed count.
- A reusable referenced by another reusable definition shows a reusable-definition reference count.
- A reusable with either non-zero placed references or non-zero reusable-definition references cannot be deleted through the palette in V1.
- Rename remains display-name-only and visibly non-destructive to references.
- No recursive package graph, auto-repair, or retargeting behavior is introduced.
- Documentation/status files are updated when the slice ships.
