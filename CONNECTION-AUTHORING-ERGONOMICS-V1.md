# Connection Authoring Ergonomics V1

Last updated: March 27, 2026

Status: Implemented on `main` after `WORKSPACE-VISIBILITY-NAVIGATION-V1`.

## Purpose

This contract defines the first connection-editing ergonomics slice for MCW.

The goal is to make connection changes faster and less laborious without changing the explicit-machine nature of the workbench.

## Product Problem

MCW now supports:
- repeated-structure duplication
- cluster selection and deletion
- workspace-local undo / redo
- named workspace versions
- bounded zoom and focus navigation

That means the next editing bottleneck is increasingly the wiring itself.

Current friction shows up in tasks like:
- replacing an existing input connection
- retargeting a connection to a different module
- adjusting one leg of a larger machine without manually delete-then-rewire cycles
- editing repeated or parallel structures where connection work dominates node work

These are connection-authoring problems, not vocabulary or layout problems.

## Core Question

Can MCW make connection editing more direct and reversible without hiding the graph’s explicit structure?

## Strategic Principle

**Make rewiring easier, not automatic.**

That means:
- the user should still explicitly choose every wire endpoint
- the system may accelerate replacement and retargeting
- the system should not infer intended multi-wire patterns

This is not:
- auto-wiring
- bulk inferred connection generation
- hidden routing
- graph beautification by stealth

## First Milestone

The first milestone should answer one clear question:

**Can a user replace or retarget an existing connection directly, without a manual remove-then-add cycle?**

## Include

The first slice should likely include:
- dragging from an occupied input to replace its current incoming connection
- direct retargeting of an existing connection endpoint
- clear live feedback showing whether the result is:
  - a new connection
  - a replacement of an existing connection
  - a blocked invalid target
- consistent interaction with current validation rules
- undo/redo compatibility

## Exclude

Do not include in V1:
- automatic connection bundles
- inferred fan-out or fan-in generation
- edge routing redesign
- wire styling overhaul
- keyboard shortcut systems for connection editing
- multi-connection batch editing

## Core Rules

1. **Every final connection must still be explicit**
- the user chooses the endpoint
- the system does not guess destination ports

2. **Replacement behavior must be visible**
- if an occupied input will lose its current incoming wire, the UI should indicate that clearly

3. **Validation remains authoritative**
- type mismatch, cycles, and invalid targets still block the operation

4. **The slice must integrate with history**
- replace / retarget actions should work cleanly with undo/redo

5. **V1 should focus on one-wire edits**
- improve the common case of changing a single connection
- do not turn this into a generalized graph-editing suite

## Recommended Implementation Shape

The strongest V1 shape is likely:
- extend the current live-connection drag model
- allow drag initiation from an existing input endpoint or connection endpoint
- when the target input is already occupied, treat a valid drop as explicit replacement
- preserve the current validation/feedback path rather than inventing a second connection-editing system

Reason:
- the workbench already has explicit connection drag semantics
- this keeps the behavior teachable and predictable
- replacement is the highest-leverage reduction of repetitive wiring work

## Expected File Scope

Primary files likely in scope:
- `src/ui/components/workbench-panel.tsx`
- any small connection helper utilities if needed
- relevant store tests if reducer/state behavior changes

Supporting files may include:
- `src/App.css`
- focused UI tests around connection replacement behavior

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- allow drag from an occupied input anchor
- allow drag from a visible connection endpoint or equivalent hit target
- show explicit replacement feedback during hover

The important thing is:
- rewiring feels direct
- the user understands what connection will be replaced
- the final graph remains fully visible and explicit

## Success Criteria

This slice is successful when:
- a user can replace an occupied input connection directly
- a user can retarget a connection without a separate manual deletion step
- invalid rewires remain blocked clearly
- the feature reduces wire-edit friction without introducing hidden behavior

## Validation Expectations

This slice should add focused tests for:
- replacing an occupied input connection
- preserving single-input-port rules correctly
- blocked rewires on invalid type/cycle cases
- undo/redo behavior after replacement

## Explicitly Avoid Next

Do not let this become:
- smart graph wiring
- batch connection generation
- routing polish disguised as editing ergonomics
- a broad canvas rewrite

Keep the first move about direct connection replacement and retargeting.
