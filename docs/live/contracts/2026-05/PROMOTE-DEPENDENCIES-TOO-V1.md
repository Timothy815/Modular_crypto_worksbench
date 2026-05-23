# Promote Dependencies Too V1

Last updated: May 22, 2026
Status: Shipped

---

## Purpose

Add one bounded authored-reuse follow-on so MCW can promote a reusable together with selected immediate workspace-local reusable dependencies when the author explicitly wants a broader-use personal-library copy.

This slice follows:

- [Reusable Dependency And Promotion Visibility V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/REUSABLE-DEPENDENCY-AND-PROMOTION-VISIBILITY-V1.md)
- [Workspace-Scoped Reusables V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-SCOPED-REUSABLES-V1.md)

It is not a package manager.
It is not recursive dependency publishing.
It is not semantic versioning.

It is one bounded actionability slice: after MCW warns that a promoted reusable still depends on workspace-local internals, the product should let the author explicitly promote that reusable together with selected immediate workspace-local reusable dependencies instead of stopping at warning-only trust language.

---

## Why This Slice Exists

MCW now does the right first trust step:

- new authored reusables are workspace-scoped by default
- personal-library promotion is explicit and copy-based
- immediate dependency scope is visible
- promotion warns when the promoted reusable still depends on workspace-local internals

That makes the truth visible, but it still leaves one practical gap:

- the author can now see that promotion is incomplete
- but the author still cannot act on that fact in one bounded flow
- the only current answer is to promote dependencies one by one manually and keep the mental tree in sync

The product standard should not be:

- “MCW can tell you that promotion is incomplete, but you must manually reconstruct the safe promotion set yourself”

It should be:

- “MCW shows which immediate workspace-local pieces still remain local, and lets you explicitly include them in the same promotion pass”

without turning the reusable library into a recursive package-export system.

---

## Scope

### In scope

- one bounded promote-with-dependencies action for immediate workspace-local reusable dependencies only
- one bounded pre-promotion selection surface listing the current reusable plus its immediate workspace-local reusable dependencies
- clear copy-based promotion semantics for every selected reusable
- preserving current workspace-local copies after promotion
- bounded tests for selection defaults, copy behavior, identity conflict handling, and non-recursive claim boundaries

### Out of scope

- recursive full-tree dependency promotion
- package publishing
- semantic version coordination
- cross-workspace dependency rewiring after promotion
- automatic replacement of workspace-local references with personal-library references
- cloud/team catalogs

---

## Strategic Principle

V1 must separate three things clearly:

- what reusable the author is promoting
- which immediate workspace-local reusable dependencies can be included in the same promotion
- what still remains outside the promoted set after that bounded action

The slice succeeds only if authors can answer:

- which immediate workspace-local dependencies are being promoted now
- which ones are being left local
- that promotion creates personal-library copies, not in-place retargeting
- that the current workspace remains intact and self-contained after the action

It must not imply:

- that MCW has resolved the full recursive dependency tree
- that promotion automatically makes the result fully independent across all contexts
- that workspace-local references in the current workspace are silently rewritten

---

## Required Product Behavior

### 1. The promotion flow must offer one bounded include-dependencies choice

When a workspace-scoped authored reusable has one or more immediate workspace-local reusable dependencies, V1 must offer an explicit promotion flow that allows the author to:

- promote only the selected reusable
- or promote the selected reusable together with one or more immediate workspace-local reusable dependencies

This must be an explicit author-facing choice, not silent automatic inclusion.

### 2. The dependency-selection surface must stay immediate-only

The pre-promotion surface must list:

- the reusable being promoted
- its immediate workspace-local reusable dependencies only

V1 does not need to expand recursive dependency trees.

If an included dependency itself still depends on further workspace-local internals, the product must continue to treat that as outside this slice’s guarantee.

### 3. Promotion must remain copy-based for every selected reusable

For every reusable included in the promote-with-dependencies action, V1 must create a personal-library copy while leaving the workspace-local source reusable in place.

This means:

- the current workspace keeps resolving through its workspace-local copies
- the personal-library copies become available for future cross-workspace reuse
- the current workspace is not silently retargeted to the personal-library copies

### 4. The flow must make the remaining claim boundary explicit

If the selected set still leaves immediate workspace-local dependencies outside the promotion set, the product must say so before promotion completes.

The UX must make clear:

- which immediate workspace-local dependencies are included
- which immediate workspace-local dependencies are still excluded
- that excluded dependencies remain workspace-local

V1 may still allow the author to continue, but it must not present the result as fully independent if immediate workspace-local dependencies remain excluded.

### 5. Identity conflict handling must stay visible and safe

If one or more selected reusables would conflict with existing personal-library stable ids, V1 must:

- show the conflict clearly
- seed safe derived ids and copy-style names
- require explicit confirmation before completing promotion

No silent overwrite is allowed.

### 6. Placement and editing must stay distinct from promote-with-dependencies

The product must keep these actions visibly distinct:

- place this reusable
- rename this reusable
- promote this reusable only
- promote this reusable with selected dependencies

V1 must not hide dependency inclusion behind ordinary placement or edit flows.

### 7. The claim boundary must stay bounded

The product may say:

- this action promotes selected immediate workspace-local reusable dependencies
- this action creates personal-library copies
- excluded immediate dependencies remain workspace-local

It must not say:

- this promotes the full dependency tree
- this guarantees total cross-workspace independence
- this replaces self-contained workspace-document portability

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Promotion confirmation surface**
   - promoted reusable summary
   - immediate workspace-local dependency checklist
   - selected vs excluded counts

2. **Conflict/warning block**
   - visible only when ids/names need safe derived copies
   - visible when immediate workspace-local dependencies remain excluded

3. **Completion semantics**
   - makes clear that selected entries become personal-library copies
   - makes clear that workspace-local originals remain in the current workspace

This should feel like bounded promotion control, not package release management.

---

## Data / UX Guidance

V1 should prefer a narrow and honest selection model:

- include the primary reusable by default
- immediate workspace-local dependencies default to unselected in this slice
- the surface must make the inclusion consequence and the exclusion consequence clear on screen before promotion completes
- personal-library and built-in dependencies do not need selection controls in this slice
- workspace-local originals remain unchanged after promotion

The strongest warning copy shape is:

- `MCW promotes personal-library copies of the selected reusables only.`
- `Excluded dependencies remain workspace-local.`
- `This slice does not promote recursive dependency trees automatically.`

The UX should avoid:

- pretending the selected set is the whole dependency closure
- silently promoting transitive dependencies
- silently retargeting the current workspace to new personal-library copies

---

## Implementation Notes

### 1. Reuse the already-shipped immediate dependency visibility path

MCW already computes immediate reusable dependency scope for authored library entries.

V1 should build the dependency-selection surface from that same immediate dependency view rather than inventing a second promotion-specific dependency classifier.

### 2. Keep the current workspace resolution path unchanged

Promotion should create personal-library copies for future reuse, not mutate the current workspace’s reusable resolution path.

This preserves the current self-contained workspace-document guarantee.

### 3. Recursive promotion is explicitly out of scope

If a selected dependency itself still depends on further workspace-local reusables, V1 must continue to warn honestly rather than recursively expanding the surface.

That limitation should be stated plainly in copy/help language rather than hidden.

### 4. Inline help should stay inside the existing reusable-library/promotion surface

V1 must include one compact inline help note inside the existing reusable-library or promotion surface explaining:

- this flow promotes personal-library copies
- workspace-local originals remain in the current workspace
- only immediate workspace-local dependencies are selectable in this slice

---

## Testing Requirements

1. `npx vitest run` must pass.

2. `npm run build` must pass.

3. For one seeded reusable with immediate workspace-local reusable dependencies, the promotion surface must list those immediate workspace-local dependencies distinctly from built-in and personal-library dependencies.

4. Promoting a reusable together with one selected immediate workspace-local dependency must create personal-library copies of both while leaving the workspace-local originals intact.

5. Promoting a reusable while excluding at least one immediate workspace-local dependency must show the bounded warning that excluded dependencies remain workspace-local.

6. Personal-library and built-in dependencies must not be presented as selectable promote-with-dependencies candidates in this slice.

7. Stable-id conflicts for any selected promoted reusable must require explicit confirmation with safe derived copy identity rather than silent overwrite.

8. If an included immediate workspace-local dependency itself still has unresolved further workspace-local dependencies, the promotion flow must continue to show the bounded transitive-warning state rather than presenting the selected set as fully independent.

9. The reusable-library or promotion surface must include one compact promote-with-dependencies help component.

---

## Success Criteria

V1 is successful when:

- authors can act on the dependency warning rather than only reading it
- authors can promote one reusable together with immediate workspace-local dependencies in one bounded flow
- the current workspace stays intact and self-contained after promotion
- the product becomes more trustworthy for authored reuse without drifting into package-management UI

---

## Out-of-Scope Follow-Ons

If V1 lands well, later work can consider:

- recursive dependency-set expansion
- promote-all-immediate dependencies shortcuts
- dependency impact analysis across workspaces
- version-aware reusable upgrade flows

Those are later slices.
V1 is only about bounded, explicit, immediate-dependency-aware promotion.
