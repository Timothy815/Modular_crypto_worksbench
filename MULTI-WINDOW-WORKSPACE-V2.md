# MULTI-WINDOW-WORKSPACE-V2

Last updated: March 27, 2026

---

## Purpose

Define the first follow-on to the shipped detached-window bridge by adding one combined detachable learning surface.

This slice keeps tutorials and challenges together as one synchronized `Learning` window rather than splitting them into separate windows.

---

## Problem

`MULTI-WINDOW-WORKSPACE-V1` proved that bounded host-authoritative detached surfaces work well for:
- `Palette`
- `Inspector`

The next high-value panel family is the combined learning dock:
- tutorials
- challenges

These already behave as a unified tabbed surface in the main app and benefit directly from multi-monitor use.

---

## Shipped Slice Boundary

This follow-on remains narrow:
- add one detachable `Learning` window
- keep tutorials and challenges together in that same window
- preserve the existing tabbed tutorial/challenge model
- keep the main window as the single state owner

---

## Required Behaviors

- `Open Learning In Window` / `Return Learning To Main Window` actions
- one detached `Learning` window containing the current tutorial/challenge surface
- tab state synchronized with the main window
- tutorial selection, challenge selection, step changes, workspace-mode changes, and focus requests routed through the host
- docked learning surface hidden in the main window while the detached copy is active

---

## Non-Goals

- detaching tutorials and challenges into separate windows
- detaching cryptanalysis in this slice
- independent learning-window workspace state
- generalized docking or pane-layout systems

---

## Exit Condition

This contract is complete when:
- one detachable `Learning` window is shipped
- the host-authoritative bridge cleanly supports tutorial/challenge interactions
- the next multi-window follow-on can stay focused on other surfaces instead of re-litigating the learning-surface boundary
