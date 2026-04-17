# DETACHED-PALETTE-DRAG-TO-CANVAS-V1

Last updated: April 16, 2026

Status: Draft

## Purpose

Define a bounded V1 for dragging a module from a **detached palette window** into the **main workbench canvas**.

This is a cross-window authoring ergonomics slice.

It exists to restore parity between:
- the palette when it is docked in the main app
- the palette when it is detached into its own window

## Why Now

MCW already supports:
- detached palette windows
- direct palette drag-to-canvas placement in the main window

That means the product currently has an asymmetry:
- attached palette: drag-to-place works
- detached palette: only click-to-add works

This breaks the expectation that detached panes are still part of one live instrument.

If MCW wants to feel like a directly shaped machine across multiple surfaces, detached placement should not fall back to a weaker interaction model.

## Core Question

Can MCW support palette drag-to-canvas placement when the palette lives in a separate window, while keeping placement authority, snapping, and cancellation behavior entirely in the main workbench?

## Strategic Principle

**The main canvas remains the source of truth.**

The detached palette may start and describe a drag.

The main workbench must own:
- the active drag session state
- ghost rendering
- canvas hit testing
- snap-to-grid and snap-to-guides behavior
- final placement
- cancellation

This keeps cross-window behavior consistent with the existing same-window drag model and avoids split authority.

## Relationship To Existing Work

This slice extends:
- `WIRING-CEREMONY-REDUCTION-V1`
- the shipped palette drag-to-canvas placement work on `main`
- the detached-window orchestration model already used for palette / inspector / learning surfaces

This slice should integrate with:
- `src/ui/detached-window-orchestration.ts`
- `src/ui/components/detached-panel-window.tsx`
- `src/ui/multi-window.ts`
- `src/App.tsx`
- `src/ui/components/primitive-palette.tsx`
- `src/ui/components/workbench-panel.tsx`

This slice does **not** change engine behavior, store graph semantics, or persistence schema.

## Include

V1 should include:
- drag start from a detached palette card
- drag move updates sent from detached palette window to host window
- host-owned ghost rendering over the main workbench
- host-owned canvas drop resolution
- snap to grid when enabled
- snap to guide rails when enabled
- cancel if the drag ends outside the main canvas
- cancel if the detached window closes during an active drag
- cancel if the host window no longer has a valid active workspace

## Exclude

V1 must exclude:
- wiring during detached drag
- quick-add from detached palette drag
- detached-to-detached placement
- multi-card drag
- palette reordering
- HTML5 drag-and-drop APIs
- persistence of drag sessions
- cross-window freeform ghost ownership by the detached palette window

## Core Rules

1. **Detached palette is a sender, not the placer**
- the detached palette window only reports drag lifecycle events
- it must not dispatch `addModule` directly as the result of a drag drop gesture

2. **Host window owns visible drag state**
- the main app must hold the active detached-palette drag session
- the workbench uses that state to render the ghost and compute placement

3. **One session at a time**
- MCW must allow at most one detached-palette drag session at once
- starting a new session must cancel any prior one cleanly

4. **Placement rules must match in-window palette drag**
- the same snapping rules should apply
- the same node-size-aware ghost placement should apply
- the same add-module reducer path should apply

5. **Cancellation must be explicit and robust**
- if the mouse is released outside the main canvas, cancel
- if the detached palette loses the drag unexpectedly, cancel
- if the host window loses the session context, cancel
- cancellation must never leave a stale ghost behind

6. **Cross-window transport must stay bounded**
- use the existing detached-window command / channel model
- do not introduce a second unrelated message bus for this slice

## Recommended Session Model

The drag session should be modeled explicitly with a transient payload such as:

```ts
{
  source: 'detached-palette',
  panelWindowId: string,
  defId: string,
  clientX: number,
  clientY: number,
  startClientX: number,
  startClientY: number,
  isActive: boolean
}
```

The exact type name may vary, but V1 should preserve these ideas:
- origin window identity
- module definition identity
- current pointer position
- thresholded active/inactive drag state

## Recommended Command Shapes

The detached palette should send bounded host commands such as:
- `startPaletteCanvasDrag`
- `updatePaletteCanvasDrag`
- `endPaletteCanvasDrag`
- `cancelPaletteCanvasDrag`

These names are illustrative, not mandatory.

What matters is that:
- the commands are lifecycle-specific
- they travel through the existing host/detached orchestration path
- the host can distinguish drag end from drag cancel

## UX Expectations

When the interaction is working correctly:
- dragging from a detached palette card should feel materially similar to dragging from the attached palette
- the host canvas should show the ghost, not the detached palette window
- release over the canvas should place the module once
- release elsewhere should do nothing
- no text selection should occur in the detached palette during the drag

## Failure Boundaries

If any of these conditions occur, V1 should cancel rather than guessing:
- detached window disappears mid-drag
- host window no longer has an active workbench
- invalid module id
- missing registry entry
- drag updates arrive after the session has already been canceled

This slice should prefer cancellation over cleverness.

## Suggested Implementation Order

1. Extend the detached palette command path to report drag lifecycle events
2. Add host-owned detached drag session state in `App.tsx`
3. Reuse the existing workbench ghost/drop path so detached drags and attached drags converge on one placement model
4. Add cancellation handling for blur/close/interrupted drag
5. Verify same-window drag still works unchanged

## Success Criteria

This slice is successful if:
- a user can detach the palette and still drag a module directly into the main canvas
- the resulting placement behavior matches attached-palette placement
- no stale ghost or stuck drag state remains after cancel/end
- the implementation reuses the existing placement path instead of creating a second graph mutation path

## Non-Goals

This slice is not trying to:
- solve all cross-window drag interactions in MCW
- support cross-window wiring
- introduce arbitrary panel-to-panel drag semantics
- redesign detached windows
- replace click-to-add in detached palette mode

## Final Boundary

The workbench should still behave like one explicit instrument spread across windows.

This slice only restores that feeling for the specific act of placing a module from a detached tool palette into the main machine.
