# Workspace History V1

Last updated: March 27, 2026

Status: Implemented locally on `feature/workspace-history`; awaiting review/commit.

## Purpose

This contract defines the first undo/redo slice for MCW.

The goal is to provide short-horizon editing safety for active workspace authoring without turning history into a full persistence, branching, or cross-session versioning system.

## Product Problem

MCW now supports stronger authoring operations:
- same-workspace cluster duplication
- drag-box multi-selection
- selected-cluster deletion
- multi-module movement
- layout cleanup

That increases builder power, but it also raises the cost of mistakes.

Today, if a user:
- deletes the wrong cluster
- duplicates the wrong fragment
- drags a large group somewhere unhelpful
- tidies the layout at the wrong moment

there is no immediate recovery path other than manual repair or document restore.

That is now a real product problem.

## Core Question

Can MCW provide bounded workspace-local undo/redo for recent editing actions without introducing a broad state-management rewrite or confusing it with long-horizon versioning?

## Strategic Principle

**Undo recent workspace edits; do not simulate a full source-control system.**

That means:
- history should protect users from recent authoring mistakes
- history should stay local to the active workspace state
- history should be bounded and predictable

This is not:
- named versions
- branching history
- cross-session collaborative history
- a diff viewer

## First Milestone

The first milestone should answer one clear question:

**Can a user undo and redo recent workspace authoring actions reliably enough to recover from normal editing mistakes?**

## Include

The first slice should likely include:
- one explicit `Undo` action
- one explicit `Redo` action
- bounded history for workspace editing state
- history entries for graph-authoring actions such as:
  - add/remove module
  - rename module instance
  - add/remove connection
  - move module / move modules
  - tidy layout
  - duplicate selected cluster
  - delete selected cluster
  - annotation add/move/text/remove
- active-workspace-local history only

## Exclude

Do not include in V1:
- named versions
- branching or non-linear history
- cross-session persistent undo
- history for tutorial progress, challenge progress, or workspace-mode toggles
- history for import/export operations beyond treating a successful import as one restorable state transition if needed
- diff views or timeline UIs

## Core Rules

1. **History must be workspace-local**
- undo/redo should apply to the active workspace only
- switching workspaces should not merge their history

2. **History must be bounded**
- V1 should retain a fixed number of recent history states
- old states may roll off deterministically

3. **History must restore authoring state coherently**
- graph, layout, annotations, selection, probe state, and relevant drafts should restore together when they are part of an authored state

4. **History must not pretend to be versioning**
- undo/redo is for recent recovery, not named checkpointing

5. **The first implementation should prefer reliability over cleverness**
- a bounded snapshot model is acceptable in V1 if it is simpler and safer than inverse-action bookkeeping

## Recommended Implementation Shape

The strongest V1 shape is likely:
- snapshot-based workspace-local history
- bounded depth
- reducer-managed push / undo / redo behavior

Reason:
- MCW already has reducer-backed workspace state
- authoring correctness matters more than theoretical efficiency here
- snapshots are easier to reason about for mixed graph/layout/annotation edits

## Expected File Scope

Primary files likely in scope:
- `src/ui/store.ts`
- `src/ui/store.test.ts`
- `src/App.tsx`
- `src/ui/workbench-document.ts` only if needed for shared workspace-state shape reuse
- small supporting UI surfaces for undo/redo actions

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- `Undo` / `Redo` buttons in workspace actions
- action-menu entries
- keyboard shortcuts later, but not required in V1

The important thing is:
- users have an obvious recovery path
- the feature behaves predictably
- it does not imply full version management

## Success Criteria

This slice is successful when:
- a user can undo a recent destructive or disruptive authoring action
- a user can redo an undone action
- recent authoring mistakes are recoverable without manual reconstruction
- history remains bounded and workspace-local
- the feature is reliable enough that users trust it as an editing safety net

## Validation Expectations

This slice should add focused tests for:
- push / undo / redo flow
- bounded history depth
- clearing redo after a new edit
- workspace-local history isolation
- restoration of graph/layout/annotation state for representative authoring actions

## Explicitly Avoid Next

Do not let this become:
- versioning by stealth
- cross-workspace history entanglement
- a generic event-sourcing rewrite
- a timeline browser

Keep the first move bounded, local, and reliable.
