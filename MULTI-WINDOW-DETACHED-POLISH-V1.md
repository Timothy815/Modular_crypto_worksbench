# MULTI-WINDOW-DETACHED-POLISH-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next bounded multi-window refinement slice as a polish pass over the newly shipped tabbed detached-window model.

This slice should improve the usability and clarity of detached tab groups without widening the multi-window system into new pane families, saved layouts, or a generalized docking framework.

This slice follows:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- `MULTI-WINDOW-WORKSPACE-V2.md`
- `MULTI-WINDOW-TABBED-WINDOWS-V1.md`

---

## Problem

The tabbed detached-window model is now working and bounded, but several product-surface refinements are still desirable:

1. detached window commands can be clearer and more context-aware
2. detached window/group labels can better reflect what is actually open
3. detached shell titles and active-tab cues can feel more deliberate
4. common move / return flows can become easier to scan and less ambiguous

The current model is structurally sound. This slice is about making it feel more finished.

---

## Strategic Position

This is the right next step because:
- the current tabbed-window model is already proven
- a polish pass can improve real usability without reopening architecture
- it creates a cleaner stopping point before any later decision about cryptanalysis detachment, saved layouts, or broader docking behavior

This slice should stay strictly on the product-surface side of the line.

---

## Required V1 Shape

This slice must:
- keep the current host-authoritative synchronization model unchanged
- keep the current supported detached surfaces unchanged:
  - `Palette`
  - `Inspector`
  - `Learning`
- improve detached window/group labels so the user can more easily understand the current grouping
- improve window-action wording and no-op prevention inside the dedicated `Windows` control surface
- improve detached-window title behavior so the browser window reflects the active tab or grouped context more clearly
- improve return / move ergonomics without adding new window concepts

It must not:
- add detached `Cryptanalysis`
- add saved or persistent window layouts
- add split panes inside detached windows
- add drag-and-drop tab reordering
- add freeform docking or tiling
- redesign the app into a general IDE shell

---

## Refinement Targets

V1 is allowed to refine:
- command labels
- menu grouping and readability
- detached shell headers
- active-tab affordances
- grouped window naming
- focus behavior after moving a tab into an existing detached window
- bounded status/provenance hints inside detached windows

V1 should prefer:
- fewer ambiguous labels
- fewer dead-end or no-op actions
- more obvious grouped-window identity
- cleaner transitions between main-window and detached-window states

---

## Success Condition

This slice is successful when:
- detached tab groups feel clearer and more deliberate to use
- the `Windows` control surface is easier to scan than the shipped baseline
- detached window labels and titles better communicate grouped context
- no new pane families or layout systems are introduced
- the multi-window line ends this pass in a visibly more polished state without changing its architectural boundary
