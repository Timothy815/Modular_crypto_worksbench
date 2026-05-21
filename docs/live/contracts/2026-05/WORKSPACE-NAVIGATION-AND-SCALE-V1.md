# Workspace Navigation And Scale V1

Last updated: May 21, 2026
Status: Shipped

---

## Purpose

Add one bounded workspace-navigation ergonomics pass so large live machines remain explorable after the recent durability, document-workflow, and composite-packaging improvements.

This slice follows:

- [Composite Authoring Ergonomics V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/COMPOSITE-AUTHORING-ERGONOMICS-V1.md)

It is not package-library organization.
It is not new composite semantics.
It is not automatic layout.

It is one bounded ergonomics slice: make large workspaces easier to orient within, revisit, and traverse without hiding the machine or introducing a second representation of it.

---

## Why This Slice Exists

MCW now has stronger large-machine authoring power:

- durable local workspace recovery
- local document workflow
- self-contained workspace documents
- clearer composite capture and drilldown ergonomics

But large boards still impose a practical navigation tax:

- users can get lost after panning away from the main region
- returning to a meaningful area is too manual
- there is not enough support for “where am I in this machine?” once the workspace gets large
- flagship boards and author-built projects can feel bigger than the current movement/orientation affordances support

The product standard should not be:

- “zoom out until everything is tiny, then guess where to go next”

It should be:

- “frame the region I care about, move between important regions deliberately, and keep the machine legible while doing it”

without replacing the real workspace with a separate overview-only authoring mode.

---

## Scope

### In scope

- one bounded navigation-status surface inside the existing workspace chrome
- one explicit `Frame Selection` / `Frame Workspace` orientation pass using the real canvas viewport
- one bounded named-region system for the current workspace
- one bounded “return to previous view” capability for recent navigation jumps
- one compact current-scale/orientation readout tied to the real workspace viewport
- bounded tests for region creation, region recall, framing behavior, and navigation-status rendering

### Out of scope

- automatic graph layout or re-layout
- minimap-first navigation redesign
- full bookmark folders or project-wide navigation trees
- cross-workspace saved region catalogs
- semantic machine outlines or auto-generated architecture maps
- package-library management
- multi-user cursors or collaborative navigation

---

## Strategic Principle

V1 must separate three things clearly:

- where the user is currently looking in the real workspace
- one bounded set of named regions worth returning to
- temporary navigation jumps between those real regions

The slice succeeds only if large-workspace movement becomes more intentional without becoming abstract:

- the viewport still shows the real machine
- framing actions move the real camera, not a proxy
- saved regions are lightweight return points, not a second authoring structure

It must not imply:

- that MCW has solved layout automatically
- that saved regions replace understanding the machine
- that the user is editing a mini-map instead of the actual workspace

---

## Required Product Behavior

### 1. The workspace must support explicit framing of current context

V1 must provide:

- `Frame Selection`
- `Frame Workspace`

Both actions must move the real workspace viewport to fit the relevant live content with a stable margin.

If there is no current selection, `Frame Selection` must either be disabled or communicate clearly that a selection is required.

### 2. The product must support one bounded named-region workflow for the current workspace

The user must be able to save the current viewport as a named region for the active workspace.

Each saved region must capture:

- name
- viewport position
- viewport zoom

V1 does not need hierarchy, folders, or cross-workspace sharing.
It only needs one bounded list of named regions for the current workspace.

### 3. The product must support deliberate recall of saved regions

Selecting a saved region must move the real workspace viewport back to that stored view.

The user should not need to recreate zoom and pan manually after naming a region.

### 4. The product must support one-step return from recent navigation jumps

When the user jumps via:

- `Frame Selection`
- `Frame Workspace`
- saved-region recall
- focus-style navigation from learning surfaces or search results

the product must retain one bounded previous-view return affordance such as:

- `Back To Previous View`

V1 does not need full browser-like history.
It only needs one bounded return step so deliberate jumps do not feel like losing place.

### 5. The workspace must show compact live orientation state

Inside the existing workspace/project context or other existing bounded workspace chrome, V1 must show a compact live navigation summary derived from the actual viewport.

At minimum, that summary must include:

- current zoom level in a legible human form
- whether saved regions exist for this workspace
- whether a previous-view return is currently available

This summary must render from current state, not hard-coded copy.

### 6. The region workflow must stay lightweight and local

V1 must keep the region system intentionally small:

- regions belong to the current workspace
- region creation is explicit, not automatic
- region recall moves the viewport only

The slice must not turn regions into:

- alternate documents
- semantic packages
- reusable artifacts in the library

### 7. The claim boundary must stay bounded

The product may say:

- this action frames your current selection
- this action returns to the last view
- this workspace has named regions you can revisit

It must not say:

- this solves machine complexity
- this map understands the machine for you
- this replaces good composite packaging or layout discipline

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Workspace navigation section in existing workspace chrome**
   - `Frame Workspace`
   - `Frame Selection`
   - compact zoom/readiness state
   - `Back To Previous View` when available

2. **Named regions list for the active workspace**
   - `Save Current View`
   - compact list of saved region names
   - one click/tap recall for each region
   - bounded rename/delete affordance if already cheap in the current surface

3. **Existing focus jumps honor the same view-history model**
   - learning/tutorial/challenge focus actions
   - search-result focus actions

This should feel like stronger orientation inside the real workbench, not like opening a separate navigation app.

---

## Data / UX Guidance

V1 should prefer a narrow region model:

- regions are viewport bookmarks, not semantic graph annotations
- names should be short and user-authored
- the list should stay easy to scan
- the view-history model should remain one-step and predictable

The UX should avoid:

- a giant always-open snapshot-like region drawer
- forcing users through a modal to jump to a region
- requiring path-like naming schemes
- auto-generating many noisy regions

Example acceptable summaries:

- `Zoom: 82%`
- `3 saved regions`
- `Previous view available`

Example acceptable region names:

- `Round output`
- `S-box cluster`
- `Verifier lane`

---

## Implementation Notes

### 1. Use the real viewport model already owned by the workbench

V1 should read and set the same viewport state the canvas already uses for pan/zoom.

It should not maintain:

- one viewport for rendering
- another viewport model for region recall

### 2. Existing focus-style jumps should share the same bounded history path

If the product already jumps to modules or highlighted regions from learning/search surfaces, those jumps should feed the same one-step previous-view model rather than introducing a separate return mechanic.

### 3. Region persistence should stay inside the current workspace document/durable state

Saved regions belong to the workspace they were created in.

They should persist with the workspace/document the same way other workspace-local authoring state does.

V1 does not need a global region catalog.

### 4. Keep the list bounded and legible

If a practical cap is needed, it should be explicit and modest rather than unbounded.

The goal is:

- a small set of meaningful return points

not:

- dozens of map pins

### 5. Prefer compact inline help over a detached navigation tutorial

If the product needs help text, it should live inside the bounded workspace navigation surface itself and explain:

- regions save views, not machine meaning
- `Back To Previous View` returns from the latest navigation jump
- good composites and good region names work together

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. For one seeded workspace state, `Frame Workspace` must compute a viewport that fits the full live graph bounds with the shipped margin rule.
4. For one seeded selection, `Frame Selection` must compute a viewport that fits the selected live bounds with the shipped margin rule.
5. Changing the current selection must update the enabled/disabled or ready state for `Frame Selection` rather than leaving stale selection framing UI on screen.
6. Saving a named region must persist the actual current viewport position and zoom for the active workspace.
7. Recalling a saved region must restore the committed viewport state for that region.
8. A navigation jump produced by region recall, frame actions, or focus-style navigation must populate one bounded previous-view return state.
9. The navigation status surface must render live zoom and saved-region availability from real current workspace state.
10. Saved regions must remain workspace-local and must not appear as reusable library artifacts.

---

## Acceptance Criteria

This slice is successful when:

- large workspaces no longer force the user to reconstruct orientation purely by manual zoom/pan
- the user can save and revisit a few meaningful views without leaving the real workbench
- movement between learning-focus jumps and authored regions no longer feels like losing place
- the product stays honest that this is navigation help, not automatic machine understanding

---

## Likely Follow-On

If this lands cleanly, the next authoring ergonomics slice should be:

- `PACKAGE-LIBRARY-AND-REUSE-V1`

That later slice can focus on organizing and reusing authored definitions after navigation/orientation on large workspaces becomes less painful.
