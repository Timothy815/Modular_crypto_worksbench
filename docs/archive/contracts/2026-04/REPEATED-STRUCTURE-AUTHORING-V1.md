# Repeated Structure Authoring V1

Last updated: March 27, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the first bounded authoring-power slice after `v2.0.0`.

The goal is to make repeated explicit machine structure faster to build without hiding that structure behind linked clones, templates, or hidden generation.

## Product Problem

MCW can already express repeated structure well:
- repeated rounds
- sender / receiver mirrors
- encrypt / decrypt parallels
- multi-stage key schedules
- repeated split / transform / join patterns

But building those structures is still more manual than it should be.

Today, a user often has to:
- select one working cluster
- manually recreate the same local topology again nearby
- re-place modules one by one
- reconnect edges one by one
- rename the resulting instances carefully

That is too much friction for a system that already supports:
- selection
- composite capture
- cross-workspace clipboard
- reusable architecture modules

## Core Question

Can MCW let a user duplicate a selected visible cluster inside the **same workspace** so repeated structure can be built faster while staying explicit and immediately editable?

## Strategic Principle

**Duplicate visible structure as new local structure.**

That means:
- the duplicate remains a normal workspace-local graph fragment
- IDs are remapped safely
- internal topology is preserved
- the duplicate diverges immediately from the source after creation

This is not:
- linked duplication
- reusable-library authoring
- hidden templating
- synchronized instances

## First Milestone

The first milestone should answer one clear question:

**Can a user take a selected subgraph and duplicate it nearby in the same workspace without rebuilding it by hand?**

The user should be able to:
- select a cluster
- duplicate it in-place or near the original
- keep internal connections and params
- continue editing the new copy immediately

## Include

The first slice should likely include:
- one explicit `Duplicate Selected Cluster` action in the current workspace
- duplication of:
  - selected modules
  - connections whose endpoints are both inside the selected set
  - relative layout positions
- fresh module instance IDs on duplication
- one deterministic placement offset to the right of the selected cluster
- immediate selection of the duplicated cluster

## Exclude

Do not include in V1:
- linked clones
- synchronized edits across duplicates
- duplicate-with-automatic-renaming schemes beyond safe ID remapping
- automatic stage numbering or semantic naming heuristics
- reusable-library extraction in the same slice
- iterator/composite-specific special duplication semantics
- graph macros or pattern generators
- annotation duplication
- probe duplication
- external connection carry-over

## Core Rules

1. **The duplicate must be independent**
- edits to the duplicate must not affect the source cluster

2. **Topology must stay local**
- only connections fully inside the selected set are duplicated
- no dangling external connections should be auto-created

3. **IDs must remap safely**
- all duplicated module instance IDs must be unique in the workspace
- V1 guarantees valid unique IDs, not semantic rename preservation
- source IDs may inform remapping, but readable `round-1` -> `round-2` style naming is not required in this slice

4. **Structure must remain visible**
- the result must be an ordinary editable graph fragment, not a hidden abstraction

5. **The workflow must stay user-controlled**
- no automatic repeated-structure inference
- no guessing how many copies the user wants

6. **Placement must stay local and predictable**
- the duplicate should appear to the right of the selected cluster, not at a global workspace paste anchor
- the offset should be derived from the selected cluster bounds so the relationship stays readable

7. **Selection handoff must be explicit**
- after duplication, the new cluster becomes the active selection
- the source cluster should remain unchanged and unlinked

## Likely Reuse

This slice should build on existing systems where possible:
- cross-workspace clipboard topology logic
- workspace-local ID remapping
- selection handling
- layout offset behavior
- existing reducer-backed workspace state updates

It should reuse those ideas instead of creating a separate duplication engine if avoidable.

## Expected File Scope

Primary files likely in scope:
- `src/ui/workspace-clipboard.ts`
- `src/ui/store.ts`
- `src/ui/components/workbench-panel.tsx`
- focused tests covering duplication behavior

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- a `Duplicate Selected Cluster` button near other workbench actions
- optional keyboard shortcut later, but not required in V1

The important thing is:
- the action is explicit
- the result is predictable
- the duplicate appears close enough to understand the relationship, but far enough to avoid overlap
- V1 may use a button only; keyboard shortcuts can wait

## Workspace State Rules

V1 should duplicate only graph structure and layout.

That means:
- duplicate module params with the modules
- do not duplicate annotations
- do not duplicate probe state
- do not copy external connections
- do not carry over stale param draft UI state

## Success Criteria

This slice is successful when:
- a user can duplicate a selected cluster inside the same workspace
- duplicated modules preserve internal params and topology
- duplicated IDs are valid and unique
- duplicated layout is placed with a deterministic local offset from the source selection
- the duplicated modules become the active selection immediately
- the duplicate is immediately usable as a new local fragment
- repeated visible machine structure becomes noticeably less laborious to build

## Validation Expectations

This slice should add focused tests for:
- internal-topology preservation
- unique ID remapping
- duplicate/source independence
- deterministic local placement
- selection handoff after duplication

## Explicitly Avoid Next

Do not let this become:
- template authoring by stealth
- reusable architecture authoring by stealth
- linked-instance semantics
- hidden code generation

Keep the first move local, explicit, and topology-safe.
