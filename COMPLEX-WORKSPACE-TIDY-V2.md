# COMPLEX-WORKSPACE-TIDY-V2

Last updated: April 5, 2026

---

## Purpose

Refine local workspace tidy so dense selected fragments clean up **in place** instead of expanding toward whole-canvas spacing.

This is a bounded follow-on to `LOCAL-WIRE-TIDY-V1.md`.

---

## Problem

`Tidy Selection` already helps rescue dense subgraphs without disturbing the rest of the workspace.

But its current behavior still inherits whole-workspace spacing language too strongly.
That means a local tidy can:
- over-expand a small fragment
- create more whitespace than the surrounding region can comfortably afford
- feel more like a mini global re-layout than a local rescue

---

## Goal

Keep the existing selected-subgraph tidy model, but make it **footprint-aware**:
- preserve the lead selection as the local anchor
- keep the cleaned fragment compact
- avoid unnecessary expansion in dense regions

---

## Required V2 Shape

1. `Tidy Selection` remains the same user-facing action.
2. Only selected module positions may change.
3. The lead selection remains the visual anchor.
4. Local tidy may compress layer spacing relative to whole-workspace tidy.
5. Compression must stay deterministic.
6. Compression must still respect a bounded minimum gap so nodes do not collapse into each other.
7. Whole-workspace `Tidy Layout` behavior must remain unchanged.
8. Wire routing, semantics, annotations, rails, labels, boxes, and connection metadata must remain unchanged.
9. The action remains one undo/redo step.
10. The action must still respect the current workspace layout direction.

---

## Non-Goals

Do not include:
- new tidy controls
- arbitrary spacing sliders
- auto-moving workspace furniture
- route solving
- semantic stage inference
- canvas-wide layout behavior changes

---

## Exit Condition

This slice is complete when:
- `Tidy Selection` still cleans selected dense fragments
- the cleaned fragment stays more local and compact than before
- the result reads more clearly without disturbing the surrounding workspace
- whole-workspace tidy behavior remains unchanged
