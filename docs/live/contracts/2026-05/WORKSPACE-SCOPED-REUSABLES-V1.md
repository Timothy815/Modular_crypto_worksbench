# Workspace-Scoped Reusables V1

Last updated: May 22, 2026
Status: Proposed

---

## Purpose

Add one bounded reusable-scope slice so user-authored composites, iterators, and related reusables belong to the workspace that created them by default, while still allowing explicit promotion into a personal cross-workspace library.

This slice follows:

- [Package Library And Reuse V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/PACKAGE-LIBRARY-AND-REUSE-V1.md)
- [Local Document Workflow V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/LOCAL-DOCUMENT-WORKFLOW-V1.md)

It is not cloud sync.
It is not filesystem package export.
It is not team/shared catalogs.

It is one bounded authored-reuse slice: make user-authored reusables workspace-local by default, keep them portable with the workspace document, and add one explicit path for promoting a reusable into a personal shared library when the author actually wants cross-workspace reuse.

---

## Why This Slice Exists

MCW now has stronger authored-reuse power:

- self-contained workspace documents
- clearer composite capture and reusable summaries
- better reusable-library rename and duplicate affordances
- clearer workspace navigation for large machines

But authored reusables still behave too much like one flat global shelf:

- reusables from unrelated projects accumulate together
- finding the right project-specific reusable gets harder over time
- a one-off machine part and a truly shared architecture entry look too similar at the storage-model level
- the user can reasonably worry that cleaning up clutter will also lose something important

The product standard should not be:

- “every authored reusable goes into one ever-growing personal pile”

It should be:

- “reusables stay with the workspace that needs them, and only become cross-workspace library entries when the author explicitly promotes them”

without breaking self-contained portability or reintroducing hidden dependency loss.

---

## Scope

### In scope

- one bounded scope model for user-authored reusables:
  - `Workspace`
  - `Personal Library`
- making new authored reusables workspace-scoped by default
- one explicit promote-to-personal-library action
- one explicit browse distinction between workspace-local authored reusables and personal-library authored reusables
- preserving workspace-scoped reusables inside saved/opened/exported workspace documents
- bounded tests for default scope, promotion behavior, browse separation, and document portability

### Out of scope

- cloud-backed reusable catalogs
- shared team/workgroup libraries
- filesystem package directories
- semantic versioning for reusables
- dependency graphs across all reusables
- new composite or iterator execution semantics
- folder trees or nested reusable taxonomies

---

## Strategic Principle

V1 must separate three things clearly:

- reusables that belong to the current workspace
- reusables that belong to the user’s personal cross-workspace library
- built-in architecture shipped by the product

The slice succeeds only if authors can read and trust the storage model:

- creating a reusable in one workspace does not automatically clutter every other workspace
- saving/opening the workspace keeps its workspace-local reusables with it
- promoting a reusable into the personal library is an explicit author decision

It must not imply:

- that all authored reusables are globally shared by default
- that personal-library promotion is required to avoid losing a reusable
- that workspace-local means fragile or disposable

---

## Required Product Behavior

### 1. New authored reusables must be workspace-scoped by default

When the user creates a new authored reusable through existing capture flows, V1 must store it as belonging to the current workspace by default.

This applies to:

- composites
- iterators
- clocked iterators
- other user-authored reusable kinds already supported by the product

The user should not need to make an early packaging decision just to finish capture.

### 2. The product must preserve a separate personal reusable library

V1 must keep one personal cross-workspace reusable library for authored definitions the user intentionally wants available beyond the current workspace.

This is not the default destination for new authored reusables.
It is the explicit shared layer.

### 3. The library surface must make reusable scope visible at browse time

Inside the existing reusable-library surface, V1 must let the user distinguish at minimum:

- built-in architecture
- this workspace
- personal library

Acceptable V1 shapes:

- separate grouped sections
- a scope filter combined with grouped rendering
- equivalent bounded browse treatment inside the existing palette/library home

The user should not have to infer reusable scope from memory alone.

### 4. The product must support explicit promotion from workspace scope into the personal library

V1 must provide one bounded action that promotes a workspace-scoped authored reusable into the personal library.

Promotion must mean:

- create a new personal-library copy of an authored reusable while leaving the workspace-local copy in place

The UX must make clear that this is a scope/share action, not:

- placing an instance
- renaming the reusable
- editing its boundary

### 5. Workspace documents must stay self-contained for workspace-scoped reusables

Saving, saving as, exporting, opening, and importing a workspace document must continue to preserve the workspace-scoped reusables that the workspace depends on.

This slice must not regress the self-contained document guarantee.

Promotion must not retarget an existing workspace to resolve through the personal-library copy.
After promotion, the current workspace must continue resolving its existing reusable usage through its own workspace-local copy.

If a workspace contains workspace-local reusables, reopening that document on another browser/profile should still reconstruct the workspace correctly without requiring the personal library.

### 6. Placement must stay distinct from promotion

The product must keep these actions visibly distinct:

- place this reusable into the workspace
- promote this reusable to the personal library
- rename this reusable
- duplicate this reusable

V1 must not blur “I want to use this reusable now” with “I want this reusable shared across future workspaces.”

### 7. The claim boundary must stay bounded

The product may say:

- this reusable belongs to this workspace
- this reusable is in your personal library
- this action shares the reusable across workspaces on this browser/profile

It must not say:

- this is cloud-backed
- this is multi-device safe
- this is package publishing
- this replaces workspace-document portability

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Reusable-library palette**
   - three clearly labeled browse groups or scope filters:
     - `Built-In`
     - `This Workspace`
     - `Personal Library`

2. **Workspace-authored entry actions**
   - `Place`
   - `Rename`
   - `Duplicate`
   - `Promote To Personal Library`

3. **Personal-library entry actions**
   - `Place`
   - existing bounded rename/duplicate actions where appropriate

This should feel like one clearer storage model for authored machines, not like adding a package registry.

---

## Data / UX Guidance

V1 should prefer a narrow ownership model:

- new authored reusable entries are tagged to the active workspace
- personal-library entries remain outside any one workspace and persist in the browser-profile durable local store
- workspace-scoped entries persist with the workspace document
- the library should keep scope labels easy to scan
- promotion creates an independent personal-library copy rather than moving the workspace-local entry

If a personal-library entry with the same stable id already exists, V1 must block silent promotion and require explicit conflict resolution before continuing.
The strongest V1 shape is:

- show the conflict clearly
- seed a safe derived id and copy-style display name
- require explicit author confirmation before the promoted copy is created

Acceptable scope labels:

- `This workspace`
- `Personal library`
- `Built-in architecture`

The UX should avoid:

- forcing a promote/share decision during initial capture
- silently copying workspace-local reusables into the personal library
- burying scope inside low-visibility inspector metadata

---

## Implementation Notes

### 1. Preserve the self-contained workspace-document model

Workspace-local reusable scope should build on the already-shipped self-contained document path, not bypass it.

This means:

- workspace-local reusable definitions stay serializable with the workspace document
- open/import must still hydrate them before the graph is loaded

### 2. Promotion should be explicit and bounded

The simplest V1 promotion model is acceptable:

- promote one workspace-scoped reusable into the personal library as a new independent copy
- keep the workspace-local source entry unchanged
- if a personal-library stable-id conflict exists, require explicit confirmation of a visible derived id/name before promotion completes

V1 does not need:

- two-way sync between workspace and personal versions
- a live linked-family system

### 3. Scope should be metadata, not a second reusable semantics system

V1 should treat reusable scope as library/document ownership metadata layered over the existing reusable-definition model.

It should not create:

- one execution model for workspace reusables
- another execution model for personal-library reusables

### 4. Browse separation matters more than deep organization

The main product gain here is avoiding one flat authored pile.

V1 should prioritize:

- visible scope grouping
- trustworthy default ownership
- easy explicit promotion

It should not drift into:

- folders
- tags
- package manifests

### 5. Inline help should live inside the library surface

V1 must include one compact inline help note inside the reusable-library surface explaining:

- new authored reusables belong to this workspace by default
- personal library is for explicit cross-workspace reuse
- workspace-local reusables still travel with the workspace document

### 6. Legacy authored reusables may remain in the personal library

V1 may treat currently shipped authored reusables from the old flat library model as legacy personal-library entries rather than migrating them automatically into workspace scope.

This slice does not require a bulk migration of older authored reusables into workspace-local ownership.

---

## Testing Requirements

1. `npx vitest run` must pass.

2. `npm run build` must pass.

3. Creating a new authored reusable through the shipped capture path must store it as workspace-scoped by default rather than personal-library scoped.

4. The library surface must render built-in, workspace-scoped, and personal-library authored reusables as visibly distinct browse groups or equivalent scope-distinguishable views.

5. Promoting one workspace-scoped authored reusable to the personal library must preserve its reusable kind and boundary shape while creating a new independent personal-library copy and leaving the workspace-local source entry intact.

6. Saving and reopening a workspace document that depends on workspace-scoped authored reusables must still reconstruct the workspace correctly without requiring those reusables to exist first in the personal library.

7. The UI must keep placement actions distinct from promotion actions rather than routing promotion through the normal place/reuse flow.

8. The reusable-library surface must include one compact inline help note component covering default workspace-local ownership, explicit personal-library promotion, and workspace-document portability for workspace-local reusables.

---

## Success Criteria

V1 is successful when:

- project-specific authored reusables no longer feel like they automatically clutter every other workspace
- authors can tell whether a reusable belongs to the current workspace or the personal shared layer
- promoting a reusable into broader reuse is explicit instead of accidental
- self-contained workspace portability remains intact
- MCW feels more like a serious authoring environment and less like one global reusable dump

---

## Out-of-Scope Follow-Ons

If V1 lands well, later work can consider:

- copying from personal library back into workspace-local scope as an explicit localized variant flow
- richer personal-library organization
- filesystem-backed reusable packs
- team/shared reusable catalogs

Those are later slices.
V1 is only about making authored reusable ownership legible and safe.
