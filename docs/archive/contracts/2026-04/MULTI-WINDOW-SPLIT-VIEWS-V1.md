# MULTI-WINDOW-SPLIT-VIEWS-V1

Last updated: March 28, 2026

Status: Shipped

---

## Purpose

Define the next bounded multi-window expansion slice by allowing one detached window to show supported panes side by side, with user-adjustable width, so detached surfaces can use the horizontal space of a second monitor more effectively.

This slice follows:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- `MULTI-WINDOW-WORKSPACE-V2.md`
- `MULTI-WINDOW-TABBED-WINDOWS-V1.md`
- `MULTI-WINDOW-DETACHED-POLISH-V1.md`
- `MULTI-WINDOW-COMBINED-VIEWS-V1.md`

---

## Problem

The shipped combined visible mode solved simultaneous visibility, but it does so as a vertical stack.

That creates two obvious limits:
1. it forces more scrolling than a wide monitor should require
2. it does not let users take advantage of the extra horizontal space available on a 16:9 second screen

For the common `Palette + Inspector`, `Inspector + Learning`, or `Palette + Learning` cases, side-by-side viewing is the more natural arrangement.

---

## Strategic Position

This is the right next step because it:
- increases the practical usefulness of detached windows without widening the pane family
- makes better use of second-screen horizontal space
- still stays inside a bounded view-model expansion rather than a generalized docking/layout engine

This should be treated as a simple split-view model, not as freeform layout composition.

---

## Required V1 Shape

This slice must:
- preserve the current host-authoritative synchronization model unchanged
- keep the supported detachable surfaces unchanged:
  - `Palette`
  - `Inspector`
  - `Learning`
- allow a detached window to switch between:
  - `tabs`
  - `combined`
  - `split`
- allow `split` mode to show two supported panes side by side concurrently
- allow the user to choose which two panes are the split pair when more than two panes belong to that detached window
- allow the user to control left/right ordering of the split pair
- allow the user to resize the width balance between the two visible panes
- preserve per-pane return-to-main behavior

It must not:
- add detached `Cryptanalysis`
- add arbitrary grid layouts
- add three-column detached layouts
- add freeform pane dragging
- add persistent saved layouts
- add independent reducer ownership in detached windows
- redesign the app into a generalized docking shell

---

## Split View Model

In V1, `split` mode should remain tightly bounded:
- exactly two panes visible side by side at once
- any additional detached panes in that same window remain accessible, but not all visible simultaneously
- the split pair can be chosen from the window’s current pane set
- the split pair order can be swapped or reassigned through explicit commands

The split presentation should use:
- one horizontal row
- one resize divider between the two visible panes
- bounded minimum widths for each side

This slice should not introduce:
- nested splits
- stacked secondary regions
- arbitrary pane matrices

---

## Resize Behavior

V1 should support:
- dragging a divider to change the relative widths of the left/right panes
- bounded minimum widths for each pane
- preserving the current split ratio for the lifetime of that detached window

V1 does not need:
- saved ratios across sessions
- precision numeric width controls

---

## Control Surface

This slice may refine the detached shell and `Windows` surface only as much as needed to support:
- switching a detached window into `split` mode
- assigning the left pane
- assigning the right pane
- swapping left/right panes
- resizing the split pair
- keeping no-op actions hidden or disabled

It should not expand the `Windows` surface into a generalized pane manager.

---

## Non-Goals

This slice should explicitly avoid:
- cryptanalysis detachment
- three-pane simultaneous layouts
- saved detached layouts
- arbitrary split trees
- freeform pane geometry
- arbitrary user-defined detached pane types

---

## Success Condition

This slice is successful when:
- one detached window can show a bounded side-by-side pair of supported panes
- the user can adjust the width balance between the two sides
- the split model uses horizontal space better than the shipped vertical combined stack
- tabbed mode and combined mode remain available
- host-authoritative synchronization remains intact
- MCW gains a materially more useful second-screen layout without becoming a generalized docking system

---

## Shipped Notes

This slice is now shipped on `main`.

What landed:
- detached windows now support `tabs`, `combined`, and `split` presentation modes
- `split` mode shows exactly two visible panes side by side
- users can choose the left/right split pair when more than two panes belong to that detached window
- split-side assignment, side swapping, and bounded width resizing are host-authoritative
- `Palette`, `Inspector`, and `Learning` remain the only supported detachable pane family

Still out of scope:
- arbitrary split trees
- three-pane simultaneous detached layouts
- saved detached layouts
- cryptanalysis as a detached pane
