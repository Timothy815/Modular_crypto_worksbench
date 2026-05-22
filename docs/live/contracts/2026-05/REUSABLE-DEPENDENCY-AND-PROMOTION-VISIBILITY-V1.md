# Reusable Dependency And Promotion Visibility V1

Last updated: May 22, 2026
Status: Shipped

---

## Purpose

Add one bounded authored-reuse visibility slice so MCW makes reusable dependency scope legible before authors promote or reuse machine parts across workspace boundaries.

This slice follows:

- [Workspace-Scoped Reusables V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-SCOPED-REUSABLES-V1.md)

It is not a package manager.
It is not semantic versioning.
It is not a dependency graph explorer for the whole product.

It is one bounded trust-and-legibility slice: make one reusable’s immediate dependency picture visible, make dependency scope visible, and warn clearly when promoting a reusable would still leave it dependent on workspace-local internals that are not coming with it.

---

## Why This Slice Exists

MCW now has a better authored-reuse ownership model:

- new authored reusables belong to the current workspace by default
- personal-library promotion is explicit
- workspace documents remain self-contained

That solves clutter and ownership, but it creates the next trust question:

- what does this reusable depend on
- which of those dependencies are built-in
- which are personal-library reusables
- which are still workspace-local
- if I promote this reusable, am I actually promoting something broadly reusable, or am I promoting a shell that still relies on local-only internals

The product standard should not be:

- “promote first, then discover later that the promoted reusable still depends on hidden workspace-local pieces”

It should be:

- “before promoting or reusing a reusable across contexts, I can see the bounded dependency picture and the scope consequences”

without turning MCW into a full graph-analysis IDE for reusable packages.

---

## Scope

### In scope

- one bounded dependency-summary surface for an authored reusable
- one bounded scope-summary for that reusable’s immediate reusable dependencies
- one bounded promotion-readiness warning when a reusable still depends on workspace-local internals
- one bounded authored-reuse copy note in the existing reusable-library surface
- bounded tests for dependency summary correctness, scope classification, and promotion-warning behavior

### Out of scope

- full recursive graph explorer UI
- semantic versioning or upgrade management
- package publishing
- dependency editing
- auto-promote-all-dependencies workflows
- cloud or team reusable catalogs

---

## Strategic Principle

V1 must separate three things clearly:

- what this reusable is
- what other reusables it immediately depends on
- whether those dependencies make promotion broader-use ready or still workspace-bound

The slice succeeds only if authors can answer:

- does this reusable stand on built-ins only
- does it depend on personal-library reusables
- does it still depend on workspace-local pieces
- if I promote it, what portability/reuse boundary still remains

It must not imply:

- that MCW is now doing full package resolution
- that one promotion automatically promotes an entire dependency tree
- that a promoted reusable is fully independent if its dependencies are still workspace-local

---

## Required Product Behavior

### 1. The reusable-library surface must show one bounded dependency summary for authored reusables

For authored reusable entries, V1 must expose one compact dependency summary that covers immediate reusable-definition dependencies only.

At minimum, the user must be able to see:

- whether the reusable depends on no other authored/built-in reusables beyond primitives
- or the count of immediate reusable dependencies

This summary does not need a full graph explorer.

### 2. The product must classify dependency scope visibly

When an authored reusable depends on other reusable definitions, V1 must make those dependency scopes visible at minimum as:

- built-in
- this workspace
- personal library

The author should not have to infer scope from ids alone.

### 3. The promotion surface must warn when a promoted reusable still depends on workspace-local internals

If the reusable being promoted has one or more immediate reusable dependencies that remain workspace-local, V1 must show a bounded warning before promotion completes.

The warning must make clear:

- the promoted reusable copy will exist in the personal library
- the current workspace remains intact
- the promoted reusable still depends on workspace-local internals that are not automatically promoted in this slice

V1 does not need to block promotion absolutely, but it must make the consequence visible.

### 4. Placement must stay distinct from dependency and promotion visibility

The product must keep these distinct:

- place this reusable
- inspect this reusable’s dependency/scope summary
- promote this reusable

V1 must not overload place/reuse actions with hidden dependency warnings or silent dependency copying.

### 5. The slice must stay inside existing library and related bounded surfaces

The committed architectural homes are:

- the existing reusable-library palette/cards
- the existing bounded rename/promote/detail area where already appropriate

This is not a new reusable-management dock.

### 6. The claim boundary must stay bounded

The product may say:

- this reusable depends on built-in / workspace / personal-library reusables
- this promotion creates a personal-library copy
- this promoted reusable still references workspace-local internals

It must not say:

- this resolves or publishes a package
- this promotes the whole dependency tree automatically
- this guarantees cross-workspace independence when workspace-local dependencies remain

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Reusable card/detail summary**
   - dependency count
   - one-line scope mix summary such as:
     - `Depends on: built-in only`
     - `Depends on: 2 workspace reusables`
     - `Depends on: 1 workspace, 1 personal`

2. **Promotion warning**
   - only shown when the promoted reusable still depends on workspace-local reusables
   - names that the promoted copy remains dependent on local-only internals

3. **Optional expanded bounded dependency list**
   - immediate reusable names only
   - each with scope label

This should feel like dependency literacy, not package tooling.

---

## Data / UX Guidance

V1 should prefer a narrow dependency model:

- immediate reusable dependencies only
- no deep recursive tree required in the first slice
- visible scope labeling matters more than fancy graph presentation

Acceptable summary copy:

- `Depends on built-ins only`
- `Depends on 2 workspace reusables`
- `Depends on 1 workspace reusable and 1 personal-library reusable`

Acceptable warning copy shape:

- `Promoting this reusable does not promote its workspace-local dependencies.`
- `This personal-library copy will still rely on workspace-local internals in the current workspace.`

The UX should avoid:

- silently promoting dependencies
- implying that a personal-library copy is fully self-sufficient when it is not
- opening a heavy dependency browser for a small trust question

---

## Implementation Notes

### 1. Reuse the already-shipped reusable dependency discovery path where possible

MCW already discovers reusable dependencies for self-contained workspace documents.

V1 should reuse or adapt that logic rather than inventing a second dependency-walk implementation.

### 2. Promotion warning should be consequence-focused, not procedural

The point is not to overwhelm the author with internal mechanics.

The point is to make one bounded truth visible:

- this promoted copy still depends on workspace-local pieces

### 3. Immediate dependencies are enough for V1

If a reusable depends on another reusable that itself depends on more reusables, V1 does not need to expand the full recursive tree in the main UI.

The first slice only needs:

- immediate dependency names
- immediate dependency scopes
- bounded promotion consequence language

### 4. Inline help should stay inside the reusable-library surface

V1 must include one compact inline help note or help copy inside the existing reusable-library surface explaining:

- dependency scope is about what a reusable still relies on
- promotion creates a personal-library copy, not a fully independent package
- workspace-local dependencies remain workspace-local unless explicitly promoted later

---

## Testing Requirements

1. `npx vitest run` must pass.

2. `npm run build` must pass.

3. For one seeded reusable that depends only on built-ins or primitives, the library summary must report no workspace/personal reusable dependency risk.

4. For one seeded reusable that depends on workspace-local reusables, the library summary must classify those dependencies as `This Workspace`.

5. For one seeded reusable with mixed dependency scopes, the library summary must report the immediate dependency scope mix correctly.

6. Promoting a reusable that still depends on workspace-local reusables must show the bounded promotion warning rather than silently presenting the promoted copy as broadly independent.

7. Promoting a reusable with no workspace-local reusable dependencies must not show the workspace-local dependency warning.

8. The reusable-library surface must include one compact dependency-help component explaining dependency scope, bounded promotion meaning, and the non-automatic status of dependency promotion.

---

## Success Criteria

V1 is successful when:

- authors can see what a reusable depends on before promoting it
- authors can tell which dependencies are still workspace-local
- promotion feels more trustworthy because MCW no longer hides the dependency-scope consequence
- the product becomes safer to reuse without becoming a package-management UI

---

## Out-of-Scope Follow-Ons

If V1 lands well, later work can consider:

- recursive dependency drilldowns
- explicit promote-dependencies-too workflows
- personal-library organization beyond scope labels
- richer reusable impact analysis across workspaces

Those are later slices.
V1 is only about making dependency scope and promotion consequence visible enough to trust.
