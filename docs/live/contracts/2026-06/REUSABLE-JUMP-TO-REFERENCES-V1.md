# Reusable Jump To References V1

Last updated: June 5, 2026
Status: Shipped

---

## Purpose

Add one bounded authored-reuse actionability slice so MCW can take an author from a reusable's reference summary to the actual local workspace board or referring reusable that currently uses it.

This slice follows:

- [Reusable Dependency And Promotion Visibility V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/REUSABLE-DEPENDENCY-AND-PROMOTION-VISIBILITY-V1.md)
- [Promote Dependencies Too V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/PROMOTE-DEPENDENCIES-TOO-V1.md)
- [Personal Library Organization V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/PERSONAL-LIBRARY-ORGANIZATION-V1.md)
- [Reusable Impact And References V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/REUSABLE-IMPACT-AND-REFERENCES-V1.md)

It is not a package manager.
It is not bulk retargeting.
It is not automatic dependency repair.

It is one bounded actionability slice: after MCW shows that a reusable is placed or referenced, the product should let the author jump to one immediate local reference target instead of stopping at read-only impact visibility.

---

## Why This Slice Exists

MCW now does the trust part:

- it distinguishes placed-instance references from reusable-definition references
- it shows saved-local impact summaries in the reusable palette
- it blocks delete when local references still exist
- it keeps rename language honest about stable ids and reference continuity

That makes cleanup safer, but it still leaves one practical gap:

- the author can see that a reusable is placed in saved local work
- the author can see that another reusable definition depends on it
- but the author still has to manually hunt for the exact board or reusable to inspect or clean up

The product standard should not be:

- "MCW can tell you that this reusable is referenced, but you still have to search manually for the actual place"

It should be:

- "MCW shows the immediate local reference picture and lets you jump directly to one reference target"

without turning the library into a full dependency browser or replacement manager.

---

## Scope

### In scope

- one bounded jump action from a reusable card's placed-reference detail rows to a local saved workspace board that contains the reusable
- activating a saved-local board from MCW's current workspace/library session when that board is already available through the durable local workspace model, even if it is not the currently active board
- one bounded jump action from a reusable card's reusable-definition reference rows to the referring reusable definition
- reusing existing workspace/project switching, selection, and framing behavior where possible
- clear empty/unavailable wording when a saved-local reference summary exists but no direct jump target can be materialized in the current session state
- bounded tests for jump target resolution, scope boundaries, and action visibility/disabled states

### Out of scope

- bulk replace-reference workflows
- retargeting one reusable id to another
- recursive graph browsing
- cross-file scanning of unopened external `.mcw` files on disk
- opening arbitrary OS files from palette reference rows
- auto-fixing broken references
- delete cascade flows

---

## Strategic Principle

V1 must separate three things clearly:

- **seeing** that references exist
- **jumping** to one immediate local reference target
- **editing or replacing** that reference after arrival

This slice covers only the second step.

The slice succeeds only if authors can answer:

- which local board currently places this reusable
- which reusable definition currently depends on it
- how to open one of those targets directly from the reference list
- when a reference summary is informative only and not jumpable in this slice

It must not imply:

- that MCW can rewrite all references automatically
- that every saved-local reference can be repaired from the palette itself
- that the product now exposes a full recursive reusable graph browser
- that unopened external files are being searched or opened

For this contract, a board is **available through MCW's current saved-local workspace/library session** when it is already present in MCW's current available project/workspace list and can be activated from that in-session local registry without opening external files.

---

## Required Product Behavior

### 1. Placed-reference rows must offer one bounded jump-to-board action

When a reusable's reference details list one or more placed references, each placed-reference row must identify the saved local workspace board and offer a direct action to jump there.

At minimum, the action must:

- activate the referenced board when that board is already available through MCW's current saved-local workspace/library session, even if it is not the currently active board
- select one placed instance of the reusable on that board
- frame that selection using MCW's existing workspace navigation behavior
- preserve normal previous-view return behavior by routing through the existing navigation path rather than bypassing it
- keep palette visibility/state unchanged from its current docked or detached surface behavior so authors can continue inspecting reference rows after a jump

If a board contains multiple placed instances of the same reusable, V1 may jump to the first stable match in that board rather than offering in-row cycling controls.

For V1, "first stable match" means the first matching module instance in that board's `project.modules` order.

### 2. Reusable-definition reference rows must offer one bounded jump-to-reusable action

When another reusable definition immediately refers to the current reusable id, the reference details must offer a direct action to open that referring reusable definition.

For reusable-definition jumps, V1 may land in whichever existing authored-reuse surface is already the normal edit/open path for that definition kind:

- composite
- iterator
- clocked iterator
- conditional
- multi-conditional

The action must invoke the same existing open/edit affordance MCW already uses for that reusable kind. It must open the referring reusable itself, not merely filter or highlight the palette list.

### 3. Action labels must stay honest about local scope

The UI copy for these actions must make the local boundary legible.

Acceptable label shapes include:

- `Open board`
- `Jump to board`
- `Open reusable`

The surrounding copy must not imply:

- global workspace search beyond MCW's saved-local boundary
- external file opening
- automatic cleanup or replacement

### 4. Unavailable jump targets must be explicit rather than silent

If a reference entry remains visible in the saved-local summary model but MCW cannot materialize a direct jump target in the current session state, V1 must show that honestly.

For placed-reference rows, V1 chooses the following boundary:

- if the referenced board is already available through MCW's current saved-local workspace/library session, the action should activate that board and jump
- if the referenced board is only known from saved-local reference summary data but is not currently materialized as an available board in the session, the row remains visible with a disabled action and an explicit reason

The same visible-but-disabled rule applies to reusable-definition reference rows when the referring reusable id is not resolvable in the current composite library.

V1 does not require opening arbitrary external files or reconstructing boards that are not already available through the current local MCW session.

In those cases, the row may remain visible with a disabled action and a bounded reason. V1 must not silently hide the row.

### 5. Delete, rename, promotion, and tags must remain separate concerns

This slice must not change:

- delete blocking logic
- rename semantics
- promotion copy semantics
- personal-tag organization semantics

It may make cleanup easier by improving navigation, but it must not introduce retargeting or replacement semantics through that navigation.

### 6. The slice must stay inside existing authored-reuse and navigation surfaces

The committed architectural homes are:

- reusable reference summary/detail helpers
- reusable palette/card detail rows
- existing open/edit reusable flows
- existing workspace navigation actions such as project switching, selection framing, and previous-view return

This is not a new reusable management dock.
This is not a new graph browser.

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Placed-reference detail rows**
   - keep the existing board name and placed count
   - add one compact `Open board` action

2. **Reusable-definition detail rows**
   - keep the existing reusable name and scope label
   - add one compact `Open reusable` action

3. **Arrival behavior**
   - placed-reference jump activates the target board from the current saved-local session, selects the first matching placed instance in `project.modules` order, and frames it
   - reusable-definition jump invokes the same existing open/edit affordance already used for that reusable kind

4. **Failure state**
   - disabled action plus short reason text when direct resolution is unavailable

This should feel like cleanup navigation, not package tooling.

---

## Data / UX Guidance

V1 should reuse the saved-local reference boundary already established in `REUSABLE-IMPACT-AND-REFERENCES-V1`:

- placed-reference rows come from the current live state plus workspace documents saved in MCW's durable local workspace store
- reusable-definition reference rows come from the current composite library
- unopened external `.mcw` files remain outside scope

The jump boundary is narrower than the summary boundary:

- boards already available through the current local MCW session are jumpable
- rows based on saved-local summary data remain visible even when the direct target is not currently materialized as an available board or reusable in session state
- V1 does not promise file-open side effects for unopened or out-of-session work

This visible-but-disabled row pattern should be treated as a bounded honesty case, not the preferred primary path. The intended common case is that locally available boards and reusable definitions remain directly jumpable from the reference list.

Preferred language:

- `Open board`
- `Open reusable`
- `Jump unavailable (target not currently open)`
- `This row is based on saved-local reference data, but the direct target is not currently available in the current session.`

Avoid:

- `replace all`
- `retarget`
- `resolve`
- `repair all`
- `dependency tree`
- `open file`
- `browse files`
- `external file`

Those terms imply a stronger management model than this slice provides.

---

## Implementation Notes

### 1. Extend the reusable-reference helper with jump-target metadata

The current reusable-reference helper already computes:

- placed-reference summaries
- reusable-definition reference summaries
- compact summary text
- delete-block reasons

V1 should extend that model with enough metadata to support jump actions without duplicating reference discovery in the UI layer.

For placed references, the helper or a nearby adapter should be able to name:

- target project id
- target project name
- one stable module instance id for the jump, when resolvable

When multiple matching placed instances exist in one board, the chosen module instance id should come from the first match in `project.modules` order so tests can assert the same target deterministically.

A module instance id is resolvable when it is present in the referenced board's current module state at jump time.

For reusable-definition references, it should be able to name:

- target reusable id
- target reusable kind/scope labels already needed by the card

### 2. Reuse existing workspace navigation paths rather than inventing a second camera model

MCW already has project switching, module selection, frame-selection behavior, and return-to-previous-view navigation.

Placed-reference jumps should compose those existing behaviors instead of adding a new one-off camera implementation inside the palette.

### 3. Reuse existing reusable open/edit entry points by kind

MCW already has separate open/edit flows for composites and the other authored reusable kinds.

Definition-reference jumps should route through those same flows rather than creating a palette-specific editor path.

Arrival consistency in V1 is defined narrowly:

- the jump uses the existing open/edit behavior for that kind
- V1 does not require every reusable kind to land in an identical visual surface
- V1 does require that the action opens the target reusable definition rather than only changing palette browse state

All five authored-reuse kinds named in this contract are expected to have an existing open/edit affordance. If a kind does not currently have one at implementation time, V1 must not silently fake success for that row. A disabled action with a bounded reason such as `Edit not yet available for this reusable kind` is acceptable until that kind's edit/open path exists.

### 4. Multi-instance cycling is explicitly out of scope

If one board places the same reusable several times, V1 may jump to the first stable matching instance in that board.

This contract does not require:

- next/previous instance stepping
- per-row instance enumeration
- instance-specific breadcrumbs

### 5. Detached palette behavior must stay consistent

If the detachable palette can show reusable reference details, the same jump action visibility and unavailable-state rules must apply there too.

If a direct jump cannot function from a detached surface because of window-boundary constraints, the disabled reason must say so explicitly rather than pretending the action exists.

---

## Testing Requirements

Add or update tests that cover:

- placed-reference jump target resolution for a board with one placed instance
- placed-reference jump behavior when a board contains multiple placed instances of the same reusable and V1 selects one stable first match
- placed-reference jump behavior when the referenced board is available in the current saved-local session but is not the currently active board, and V1 activates that board, selects one matching instance, and frames it
- placed-reference jump behavior pushes a normal previous-view return entry through the existing navigation path
- reusable-definition jump target resolution for at least one composite-like reusable and one non-composite authored reusable kind
- disabled/unavailable state when a saved-local summary row exists but the direct target cannot be resolved
- detached-palette parity for action visibility or bounded disabled-state behavior
- existing delete-block and rename semantics remaining unchanged
- rendered copy review for prohibited package-manager or external-scan language in the reference-row actions and disabled reasons

---

## Acceptance Criteria

This slice is complete when all of the following are true:

1. A reusable with one or more placed-reference rows whose referenced board is available through MCW's current saved-local workspace/library session shows an action on each row that opens the referenced board, selects one matching placed instance, and frames it.
2. A reusable with one or more reusable-definition reference rows whose referring reusable definition is resolvable in the current composite library shows an action on each row that invokes the same existing open/edit affordance already used for that reusable kind and opens the referring reusable definition.
3. If a saved-local reference row cannot be resolved into a direct jump target, the row remains visible and its action is disabled with an explicit bounded reason.
4. Delete blocking, rename semantics, promotion semantics, and personal-tag semantics behave exactly as before this slice.
5. Detached-palette reference rows follow the same action-visibility rules and show an explicit disabled reason when a jump cannot function from that surface.
6. A successful placed-reference jump preserves normal previous-view return behavior and does not force the palette surface to close or collapse.
7. Final rendered row/action copy is reviewed before ship to confirm it does not imply recursive graph browsing, automatic replacement, or scanning of unopened external files.

---

## Shipping Notes

When this ships, update:

- `ACTIVE-DOCS.md`
- `CURRENT-HANDOFF.md`
- `IMPLEMENTATION-STATUS.md`

The status record should describe this as a bounded authored-reuse navigation/actionability slice, not as dependency management.
