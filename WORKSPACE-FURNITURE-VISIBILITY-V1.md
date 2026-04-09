# WORKSPACE-FURNITURE-VISIBILITY-V1

Last updated: April 5, 2026

Status: Implemented on `main`

## Purpose

Define a bounded visibility-control slice for workspace furniture so users can temporarily quiet the canvas and focus on machine logic.

The goal is not to remove furniture systems.
The goal is to give large workspaces a cleaner presentation mode when structure aids become visually competitive with the machine itself.

## Why Now

MCW now has multiple useful organization surfaces:
- stage labels
- group boxes
- guide rails
- annotations
- minimap

Each is valuable on its own, but together they can create too much ambient chrome in large workspaces or classroom presentation contexts.

The missing capability is a calm, explicit way to reduce that chrome without deleting authored structure.

## Product Goal

Users should be able to quickly switch between:
- **authoring view**
- **clean reading / presentation view**

without losing any workspace structure.

## Core Decision

This slice introduces **visibility controls**, not another furniture system.

It should let users hide or quiet non-essential furniture temporarily while preserving:
- authored positions
- titles
- metadata
- undo/history safety

## Scope

This contract is limited to:
- stage labels
- group boxes
- guide rails
- annotations
- optional minimap visibility if it fits the same control model cleanly
- workspace-local visibility state in UI metadata if required

This slice may include:
- a top-level `Hide Furniture` or `Presentation View` style control
- finer-grained toggles if they remain compact and coherent
- calmer non-selected default treatment if needed to support the same goal

## Required Behaviors

1. Furniture visibility controls must be explicit.
2. Hidden furniture must not be deleted or mutated.
3. Toggling visibility must be one undo/redo-safe UI action if it is recorded at all, or a clearly non-destructive view-state toggle if not.
4. When furniture is hidden, the core machine graph must remain fully interactive.
5. When furniture is restored, authored positions and titles must return exactly.
6. The control model must remain compact; V1 should not become a large visibility-settings panel.
7. The feature must remain workspace-local.
8. The feature must not affect engine semantics, exports, or execution.
9. Selection behavior must degrade cleanly if currently selected furniture is hidden.
10. Hidden furniture must not continue to intercept pointer events.

## Product Shape

V1 should stay bounded and readable.

Good V1 shapes:
- a single `Hide Furniture` toggle
- or a compact `Furniture` menu with:
  - `Show All`
  - `Hide Furniture`
  - optionally one or two sub-toggles only if they clearly earn their space

This should not become a full layer manager in V1.

## Explicit Non-Goals

Do not include:
- attaching furniture systems to each other
- re-parenting labels to group boxes
- per-item visibility rules
- locking systems
- presentation-mode camera choreography
- canvas-wide style redesign

## Success Criteria

This contract is successful when:
- large workspaces can be made visually calmer instantly
- authored furniture remains safe and recoverable
- the machine logic becomes easier to present and read
- the visibility control is compact enough to feel like a quick win rather than a new subsystem
