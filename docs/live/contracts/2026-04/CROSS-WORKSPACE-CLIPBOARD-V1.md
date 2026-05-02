# Cross-Workspace Clipboard V1

## Status

Shipped in `v1.36.0`.

## Purpose

Let users copy a selected cluster of modules from one workspace and paste it into another workspace without rebuilding the same subgraph by hand.

This slice exists to solve a practical builder problem:
- a user wants to reuse part of a machine across experiments
- a whole-workspace duplicate is too large
- rebuilding a useful subgraph manually is slow and error-prone

The goal is not to turn selections into reusable library assets.
The goal is to move one local graph fragment between workspaces safely.

## Strategic Principle

**Copy the selected fragment as a local working cluster, not as a linked definition.**

That means:
- pasted modules become ordinary workspace-local instances
- IDs are remapped safely on paste
- the source and pasted copies diverge immediately after paste
- no back-reference to the source selection is retained

## Why Now

MCW now supports:
- workspace-local module renaming
- whole-workspace duplication
- clearer composite boundary hints during wiring

That means the remaining high-value builder convenience is fragment reuse.
Users can now branch whole workspaces safely; the next obvious need is reusing only the useful part.

## V1 Scope

V1 should stay bounded to **copying the currently selected module cluster from one workspace and pasting it into another workspace**.

Primary user story:
- select a subgraph
- copy it
- switch workspaces
- paste it
- continue building with a clean local copy

## Included

- copy the currently selected modules from the active workspace
- include:
  - selected modules
  - connections whose endpoints are both inside the selected set
  - relative layout positions for the selected set
- paste into a target workspace as ordinary local modules
- generate fresh module instance IDs on paste
- preserve params and internal cluster topology
- place the pasted cluster with a sensible offset or anchor near the paste point / workspace origin
- clear handling when nothing is selected

## Explicitly Excluded

Do not include in V1:
- copy of partial dangling connections to non-selected modules
- linked pasted fragments
- reusable-library extraction from selection
- cross-session system clipboard integration
- image/text clipboard export
- multi-workspace sync
- batch paste transformations

## Core Rules

1. **Paste must be independent**
   - the pasted modules are ordinary local instances
   - future edits do not affect the source selection

2. **Topology must stay local and closed**
   - only connections fully inside the selected set are copied
   - no dangling references to unselected source modules

3. **ID remapping must be safe**
   - pasted module IDs must be unique in the target workspace
   - source IDs are preserved only as a remapping basis, not reused blindly

4. **Selection remains user-controlled**
   - no automatic “expand selection” behavior in V1
   - copy only what the user explicitly selected

## Success Criteria

V1 is successful if:
- a user can copy a selected subgraph from one workspace to another
- pasted modules preserve their internal connections and params
- pasted IDs are unique and valid
- the pasted cluster is immediately editable as local workspace content
- no library/sync/versioning semantics are introduced

## Likely Follow-Ons

Possible later slices, only if still justified:
- selection-to-reusable-composite promotion improvements
- system clipboard import/export
- smarter paste positioning
- bounded dangling-edge hints before copy

## Explicitly Avoid Next

Do not turn this into:
- reusable-library authoring by stealth
- linked fragment reuse
- workspace sync/sharing
- system clipboard integration in the first pass

Keep the first move local, closed, and topology-safe.
