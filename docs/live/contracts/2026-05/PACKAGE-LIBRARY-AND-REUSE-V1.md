# Package Library And Reuse V1

Last updated: May 21, 2026
Status: Proposed

---

## Purpose

Add one bounded authoring-ergonomics pass for reusable-definition organization and reuse so the composite library feels like a usable working shelf rather than a growing flat list.

This slice follows:

- [Workspace Navigation And Scale V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-NAVIGATION-AND-SCALE-V1.md)

It is not filesystem package export.
It is not cloud/shared reusable catalogs.
It is not new reusable semantics.

It is one bounded ergonomics slice: make authored reusables easier to find, review, rename, duplicate, and reuse inside MCW’s existing library and inspector surfaces without turning the library into a separate package-management product.

---

## Why This Slice Exists

MCW now has stronger reusable-definition authoring power:

- clearer composite and iterator capture previews
- stronger reusable palette summaries
- clearer drilldown and unzip language
- self-contained workspace documents that carry authored reusable dependencies
- better large-workspace navigation and saved views

But the reusable-library workflow is still too flat and technical:

- user-authored definitions accumulate without enough lightweight organization
- finding the right authored reusable is still more manual than it should be
- reusing or revising an authored definition still depends too much on remembering ids
- the distinction between “keep using this shared definition,” “make a variation,” and “rename this thing for clarity” is not legible enough at the library level

The product standard should not be:

- “scroll a long list, remember ids, and hope the right reusable is the one you click”

It should be:

- “browse authored reusables intentionally, recognize what is mine, duplicate when I want a variation, rename when I want clarity, and place the right reusable without reopening every definition”

without pretending MCW has a full external package system.

---

## Scope

### In scope

- one bounded authored-reusables section refinement inside the existing composites/library palette
- one bounded authored-reusable naming and duplicate workflow
- one bounded authored-reusable usage/reuse affordance using existing placement flows
- one bounded authored-vs-built-in filtering or view split inside the current library surface
- one bounded authored-reusable detail summary sufficient for fast recognition before opening
- bounded tests for authored-library filtering, rename/duplicate correctness, and reuse-facing status rendering

### Out of scope

- folder trees or nested package hierarchies
- filesystem package export/import
- cloud sync or shared team libraries
- semantic dependency graphs across all reusables
- boundary-port editing
- new composite/iterator execution semantics
- workspace-scale navigation changes

---

## Strategic Principle

V1 must separate three things clearly:

- browsing and recognizing reusable definitions in the library
- revising the identity of one authored reusable
- placing or duplicating that reusable for further work

The slice succeeds only if authored reusables feel more intentional without becoming a full package manager:

- built-in architecture stays visibly distinct from user-authored reusables
- duplicate means “make another reusable definition as a starting point,” not “place an instance”
- rename means “clarify this shared authored definition,” not “edit its boundary”

It must not imply:

- that MCW now has external package publishing
- that duplicate creates a live linked variant system
- that library organization replaces understanding the underlying machine

---

## Required Product Behavior

### 1. The library must make built-in and user-authored reusables separable at browse time

Inside the existing composites/library palette, V1 must let the user narrow attention to authored reusables without mixing them indistinguishably into built-in architecture entries.

Acceptable V1 shapes:

- a built-in / authored filter
- a built-in / authored segmented view
- two clearly labeled sections in the existing list

The user should not have to scan the entire mixed catalog just to find their own authored definitions.

### 2. Authored reusables must expose stronger recognition details before opening

For authored reusable entries, the library must show enough compact detail to support fast recognition.

At minimum, this must include:

- display name
- stable id
- kind
- port counts
- one structural summary
- one authored-usage summary if cheaply available from existing reusable-library data, such as current in-use count

The user should be able to distinguish authored definitions before opening them one by one.

### 3. The library must support bounded rename for user-authored reusables

V1 must allow renaming a user-authored reusable’s display name from an existing bounded library or inspector surface.

V1 does not need stable-id renaming.
The stable id may remain visible for recognition, but it is not an editable field in this slice.

This slice does not need boundary edits or semantic changes.
It only needs a clear identity-edit path.

Built-in architecture entries must not pretend to support authored rename.

### 4. The library must support bounded duplicate for user-authored reusables

V1 must allow the user to duplicate one authored reusable into a new authored reusable definition with a new id and name.

Duplicate must mean:

- make a new reusable definition as a starting point for variation

It must not mean:

- place another instance of the same definition on the canvas

The resulting duplicate must be independent of the source reusable definition.

### 5. The product must keep placement/reuse distinct from duplicate/revision

Where the current product already supports placing a reusable into the workspace, V1 must keep that action distinct from:

- rename reusable
- duplicate reusable
- edit shared definition

The library and surrounding copy must not blur those actions together.

### 6. The slice must stay inside existing library and inspector homes

The committed architectural homes are:

- the existing composites/library palette
- the existing inspector/configure-style definition surfaces where already appropriate
- the existing place-from-library flow

This is a refinement slice, not a new package-management dock.

### 7. The claim boundary must stay bounded

The product may say:

- this is built-in architecture
- this is your reusable
- this duplicate is a new reusable definition
- this action places an instance into the workspace

It must not say:

- this publishes a package
- this creates a linked reusable family
- this turns MCW into a full library-management system

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Composites/library palette**
   - built-in / authored view split or equivalent filter
   - stronger authored-entry cards
   - quick authored actions:
     - `Place`
     - `Duplicate`
     - `Rename`

2. **Authored reusable rename surface**
   - compact inline or bounded dialog edit for display name and stable id
   - explicit validation when the target id already exists

3. **Authored reusable duplicate flow**
   - create a new authored reusable entry derived from the chosen source
   - seed the duplicate with a safe derived id and a visible copy-style name

This should feel like making better use of the existing library shelf, not opening a package IDE.

---

## Data / UX Guidance

V1 should prefer a narrow organization model:

- authored vs built-in is the key browsing distinction
- authored rename/duplicate actions should stay lightweight
- duplicate should seed a predictable derived id and name
- the library should keep the authored list easy to scan

Example acceptable authored labels:

- `Your reusable`
- `Built-in architecture`
- `In use 3 times`

Example acceptable duplicate naming seeds:

- `Byte Round Copy`
- `byte-round-copy`

The UX should avoid:

- a deep management tree
- multi-step wizard flows for simple rename or duplicate actions
- forcing users into a separate screen just to reuse one library entry

---

## Implementation Notes

### 1. Reuse existing reusable-definition data rather than inventing a second package schema

V1 should work from the shipped reusable definition/library data already used by the palette and capture flows.

It should not create:

- one library model for authored entries
- another model for reusable placement

### 2. Duplicate should clone one reusable definition, not place an instance

The duplicate path should reuse the same underlying definition structure with a new authored identity.

It should not:

- add a canvas instance as a side effect
- preserve the original id

### 3. Rename and duplicate must stay honest about dependency context

If an authored reusable is already used in current workspaces, rename should clarify the shared definition without mutating its semantics.

Duplicate should create an independent definition for future divergence.

### 4. Keep the authored section bounded and legible

If the library already computes usage count cheaply, V1 should show it.

If not, V1 may omit usage count rather than adding heavy global dependency scanning just for this slice.

### 5. V1 must include one compact inline help note in the library surface

That note should live inside the library surface itself and explain:

- built-in vs authored
- duplicate vs place
- rename clarifies one reusable definition, not one placed instance

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. The library surface must render built-in and authored reusable entries as distinct browseable groups or filtered views.
4. For one seeded authored reusable, the palette card must render the committed authored recognition details from live reusable-definition data.
5. Renaming an authored reusable must update its stored display name without changing its stable id, reusable kind, or boundary counts.
6. Duplicate must create a new authored reusable definition with a distinct id from the source entry.
7. Duplicate must not place a new workspace instance as a side effect.
8. The reuse-facing action for placing a reusable must remain behaviorally distinct from duplicate.
9. Built-in entries must not render misleading authored rename actions.

---

## Acceptance Criteria

This slice is successful when:

- authored reusables are easier to find than they are in the current flat browse experience
- the user can clarify or branch a reusable definition without confusing that act with placing an instance
- built-in vs authored identity remains obvious throughout the library flow
- the product stays honest that this is a bounded library-and-reuse pass, not package publication

---

## Likely Follow-On

If this lands cleanly, the next ergonomics slice can revisit deeper package transport or sharing questions from a stronger local-library baseline.
