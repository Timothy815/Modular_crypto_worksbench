# Selected Cluster Operations V1

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the next small authoring-power slice after same-workspace cluster duplication.

The goal is to make cluster-level editing feel coherent:
- select visible structure more easily
- remove visible structure more easily

Without turning MCW into a generic diagram editor or hiding graph semantics behind smart automation.

## Product Problem

MCW now lets a user duplicate a selected visible cluster inside the same workspace.

That makes repeated structure easier to build, but the surrounding cluster workflow is still weaker than it should be:
- selecting larger visible fragments still depends on repeated click-addition
- removing a visible fragment still tends to happen one module at a time

For repeated rounds, mirrored sender/receiver branches, and staged explicit machines, that is too laborious.

## Core Question

Can MCW support one bounded cluster-operations slice that improves both:
- selecting a visible cluster with a drag box
- deleting a selected cluster in one explicit action

While keeping the machine explicit, local, and predictable?

## Strategic Principle

**Operate on visible local graph structure, not inferred intent.**

That means:
- box selection should select modules that visibly fall within the dragged rectangle
- cluster deletion should remove exactly the selected modules and invalidated connections
- no smart rerouting, graph healing, or semantic inference should occur

This is not:
- lasso editing
- annotation editing
- edge editing
- transform handles
- smart graph repair
- a generic whiteboard-tool feature pass

## First Milestone

The first milestone should answer two tightly related questions:

1. **Can a user drag over empty canvas space to select a visible module cluster more quickly than click-adding each module?**
2. **Can a user remove a selected visible cluster in one explicit action without deleting it module by module?**

## Include

The first slice should likely include:
- bounded rectangular box selection that begins from empty canvas background
- selection of modules whose visible positions fall inside the box
- additive box selection when `Shift` or `Cmd/Ctrl` is held
- one explicit `Delete Selected Cluster` action in the current workspace
- deletion of:
  - selected modules
  - all connections whose `from` or `to` endpoint is inside the selected set
- cleanup of workspace-local state tied to deleted modules:
  - selection
  - probes
  - param drafts
- predictable post-delete selection behavior

## Exclude

Do not include in V1:
- freeform lasso selection
- annotation selection
- edge selection
- resize handles or transform boxes
- drag-box selection that starts on a module body or port
- undo/redo
- confirmation modals for every delete path
- graph healing or auto-rerouting
- stage-aware or semantic delete behavior
- annotation deletion unless annotations become explicitly selectable in a later slice

## Core Rules

1. **Selection must begin from empty canvas**
- drag-box selection should only start from uncovered canvas background
- existing node-drag and port-drag interactions must keep working unchanged

2. **Selection must stay visible and literal**
- V1 box selection should select by visible module positions
- no semantic grouping or hidden subgraph inference

3. **Deletion must be explicit**
- no background inference should decide what else to remove beyond the selected modules and their invalidated connections

4. **Connection cleanup must be structural**
- any connection touching a deleted module is removed
- no new replacement connection is auto-created

5. **Workspace state must stay coherent**
- deleted modules must be removed from selection, probes, and param drafts
- no stale workspace-local references should remain

6. **The remaining graph must stay untouched**
- modules outside the selected set keep their IDs, params, and positions
- annotations remain in place in V1

7. **Post-delete selection must be predictable**
- if modules remain, select one surviving module deterministically
- if the workspace becomes empty, selection becomes empty

## Likely Reuse

This slice should build on existing systems where possible:
- existing multi-selection state handling
- existing module drag interactions
- existing single-module delete behavior in the reducer
- workspace-local probe cleanup
- param-draft cleanup rules

It should reuse those ideas instead of introducing a separate editing subsystem.

## Expected File Scope

Primary files likely in scope:
- `src/ui/components/workbench-panel.tsx`
- `src/ui/store.ts`
- `src/ui/store.test.ts`
- `src/App.tsx`
- any small supporting canvas-selection styling

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- drag on empty canvas to create a selection rectangle
- `Delete Selected Cluster` button near other workbench actions
- action-menu entry alongside duplicate/copy/paste cluster actions
- keyboard shortcut later, but not required in V1

The important thing is:
- the selection behavior is explicit and legible
- the delete behavior is explicit and predictable
- users do not have to assemble or dismantle visible repeated structure one module at a time

## Success Criteria

This slice is successful when:
- a user can drag a selection box over empty canvas space to select multiple nearby modules
- additive box selection works without breaking existing click-based multi-select
- a user can delete a selected cluster in one action
- all touched connections are removed safely
- probes and param drafts tied to deleted modules are cleaned up
- surviving modules remain unchanged
- post-delete selection is deterministic

## Validation Expectations

This slice should add focused tests for:
- box selection begin/end behavior on empty canvas
- additive box selection behavior
- deletion of multiple selected modules in one action
- cleanup of touched connections
- cleanup of probe and draft state
- deterministic surviving-module selection
- empty-workspace behavior when the last selected modules are removed

## Explicitly Avoid Next

Do not let this become:
- undo/redo by stealth
- graph repair by stealth
- smart stage-editing semantics
- annotation editing by stealth
- a broad editing-overhaul milestone

Keep the first move local, explicit, and state-safe.
