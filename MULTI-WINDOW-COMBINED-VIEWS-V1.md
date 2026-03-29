# MULTI-WINDOW-COMBINED-VIEWS-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next bounded multi-window expansion slice by allowing one detached window to show multiple supported MCW surfaces simultaneously, in a user-controlled order.

This slice follows the shipped detached-window sequence:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- `MULTI-WINDOW-WORKSPACE-V2.md`
- `MULTI-WINDOW-TABBED-WINDOWS-V1.md`
- `MULTI-WINDOW-DETACHED-POLISH-V1.md`

---

## Problem

Tabbed detached windows solved grouping, but not simultaneous visibility.

Users can now combine:
- `Palette`
- `Inspector`
- `Learning`

inside one detached window, but only one of those panes is visible at a time.

For dense working sessions, that is still too limiting. The next real refinement is to allow a detached window to show multiple supported panes together at once, while preserving the bounded host-authoritative model.

---

## Strategic Position

This is the right next step because it:
- increases the practical usefulness of detached windows on a second monitor
- remains inside the already-shipped pane family
- improves authoring density without turning MCW into a generalized docking IDE

This should be treated as a bounded combined-view model, not as a full layout engine.

---

## Required V1 Shape

This slice must:
- preserve the current host-authoritative synchronization model unchanged
- keep the supported detachable surfaces unchanged:
  - `Palette`
  - `Inspector`
  - `Learning`
- allow a detached window to switch between:
  - tabbed mode
  - combined visible mode
- allow multiple supported panes in one detached window to be visible simultaneously in combined mode
- allow the user to choose the pane order inside a combined detached window
- preserve per-pane return-to-main behavior
- preserve the existing ability to add a pane to an existing detached window

It must not:
- add detached `Cryptanalysis`
- add arbitrary split panes or freeform resizing
- add drag-anywhere docking
- add saved or persistent layouts
- add independent reducer ownership in detached windows
- redesign the app into a generalized docking shell

---

## Combined View Model

In V1, a detached window may host the supported panes in one of two bounded presentations:

1. `tabs`
- current shipped behavior
- one pane visible at a time

2. `combined`
- one vertical ordered stack of visible panes
- any subset of `Palette`, `Inspector`, and `Learning`
- order controlled by the user through explicit commands, not drag-and-drop

The combined presentation should remain simple:
- no nested groups
- no split-grid layout
- no proportional pane resizing model

---

## Ordering Behavior

V1 should support:
- moving a pane earlier in the combined stack
- moving a pane later in the combined stack
- preserving the pane order for the lifetime of the detached window
- maintaining a stable active pane identity even when all panes are visible

V1 does not need:
- arbitrary drag reordering
- saved ordering across sessions

---

## Control Surface

This slice may refine the `Windows` surface only as much as needed to support:
- toggling a detached window between tabbed and combined mode
- moving panes up/down within a combined detached window
- returning individual panes to main
- keeping no-op actions hidden or disabled

It should not expand the `Windows` surface into a generalized workspace manager.

---

## Non-Goals

This slice should explicitly avoid:
- cryptanalysis detachment
- saved detached layouts
- freeform pane geometry
- pane resize handles inside detached combined windows
- arbitrary user-defined detached pane types
- cross-window collaborative or shared-edit behavior

---

## Success Condition

This slice is successful when:
- one detached window can show multiple supported panes simultaneously
- users can order those panes deliberately
- tabbed mode remains available
- host-authoritative synchronization remains intact
- MCW gains materially more useful second-screen composition without becoming a generalized docking system
