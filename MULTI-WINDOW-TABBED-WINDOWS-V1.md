# MULTI-WINDOW-TABBED-WINDOWS-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next bounded multi-window refinement slice by allowing detached windows to host multiple MCW surfaces as tabs, while also cleaning up the crowded window-management actions in the main workspace controls.

This slice is the implementation follow-on to:
- `MULTI-WINDOW-WORKSPACE-V1.md`
- `MULTI-WINDOW-WORKSPACE-V2.md`

---

## Problem

The current detached-window model works, but two refinement pressures are now clear:

1. window-management actions are mixed into already crowded workspace controls
2. detached surfaces are still one-surface-per-window even when users want to group them together

The highest-value grouping cases are already obvious:
- `Palette + Inspector`
- `Palette + Learning`
- `Inspector + Learning`

The current model makes multi-monitor use possible, but not yet flexible in the way a dense working session wants.

---

## Strategic Position

This is the right next multi-window refinement because it improves:
- window organization
- detached-window usefulness
- user-controlled arrangement

without yet requiring:
- freeform tiling
- arbitrary pane geometry management
- independent detached-state ownership
- a generalized docking framework

This should still behave like a bounded host-authoritative window manager, not a full IDE shell.

---

## Required V1 Shape

This slice must:
- preserve the current host-authoritative synchronization model
- allow one detached window to host multiple surfaces as tabs
- allow `Palette`, `Inspector`, and `Learning` to be grouped together in any tab combination
- allow a detached surface to open into either:
  - a new detached window
  - an existing detached window as a new tab
- allow tabs to return individually to the main window
- reduce window-action clutter in the main UI by giving detached-window actions a clearer organizational surface

It must not:
- introduce freeform pane tiling
- introduce drag-anywhere window docking
- introduce independent reducer ownership in detached windows
- detach cryptanalysis in this slice
- redesign the workbench itself into a docking shell

---

## Window Model

V1 should treat a detached window as:
- one host-connected detached shell
- containing one or more tabs
- each tab bound to one of the supported detached surface kinds:
  - `Palette`
  - `Inspector`
  - `Learning`

The host remains authoritative for:
- reducer actions
- panel state synchronization
- tutorial/challenge routing
- focus and trace coordination
- library/export actions

Detached windows remain synchronized views, not independent workspace clients.

---

## Menu / Control Refinement

This slice must improve the organization of window-management actions.

The goal is:
- make it visually obvious which controls are about windows
- separate window actions from unrelated workspace actions
- support grouping and re-grouping surfaces without bloating the existing workspace dropdown

V1 does not need a full new command palette or major navigation redesign.

It only needs a cleaner bounded surface for:
- open in new window
- move into existing window
- return to main window

---

## Tab Behaviors

V1 should support:
- selecting tabs inside a detached window
- preserving the active tab per detached window
- opening a supported surface into an existing detached tab group
- returning one tab to main without tearing down unrelated tabs
- closing a detached window automatically when its final tab returns to main

It should preserve:
- current synchronized panel behavior
- current hiding of docked duplicates while a detached copy is active

---

## Non-Goals

This slice should explicitly avoid:
- arbitrary user-defined panel types in tab groups
- cryptanalysis detachment
- nested tab groups
- split panes inside detached windows
- persistent saved window layouts
- cross-browser-window collaborative behavior

---

## Success Condition

This slice is successful when:
- detached windows can host tabbed combinations of `Palette`, `Inspector`, and `Learning`
- the window-management surface is clearer and less crowded than the current mixed workspace controls
- host-authoritative synchronization remains intact
- MCW gains materially better multi-monitor ergonomics without turning into a generalized docking framework
