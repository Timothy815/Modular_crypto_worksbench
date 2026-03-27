# INSPECTOR-REFACTOR-V1

Last updated: March 27, 2026

Status: Implemented on `main`

---

## Purpose

Reduce future drag in the inspector without changing behavior.

This slice is not an inspector redesign.
It is a structural maintenance pass intended to lower the cost of future work on a large UI surface.

---

## Core Question

What is the smallest refactor that materially reduces the size and responsibility load of `parameter-inspector.tsx` without changing the shipped inspector workflow?

---

## Required Boundary

This slice must:
- preserve inspector behavior
- preserve current UI output and interactions
- extract pure analysis and trace helpers out of the component file
- reduce the amount of non-rendering logic living inside `parameter-inspector.tsx`

This slice must not:
- redesign the inspector tabs
- change parameter editing behavior
- change trace stepping behavior
- change validation or comparison semantics

---

## Implementation Shape

V1 should extract a dedicated pure helper module for inspector analysis behavior, including:
- transformation-view derivation
- trace filtering / grouping helpers
- permutation / rotor / reflector support helpers used by the inspector
- formatting helpers tied to inspector analysis output

The extracted module should remain UI-local and reusable:
- `src/ui/inspector-analysis.ts`

`parameter-inspector.tsx` should become more clearly a rendering/orchestration surface and less of a logic container.

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- pure inspector analysis logic now lives in `src/ui/inspector-analysis.ts`
- `parameter-inspector.tsx` now imports that logic instead of carrying the full analysis layer inline
- behavior is preserved while reducing future change risk in the inspector surface

---

## Why This Slice

The inspector had reached the point where continued feature work risked making it a maintenance anchor.

This refactor is intentionally conservative:
- no UI redesign
- no user-facing workflow change
- real reduction in file responsibility

It is architecture protection in service of future speed.
