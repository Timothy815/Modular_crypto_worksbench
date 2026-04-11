# WORKBENCH-REFACTOR-V1

Last updated: March 27, 2026

Status: Shipped on `main`.

---

## Purpose

Reduce future drag in the workbench without changing behavior.

This slice is not a workbench redesign.
It is a bounded maintenance pass meant to lower the cost of future builder-power, visibility, and multi-window work.

---

## Core Question

What is the smallest refactor that materially reduces the size and responsibility load of `workbench-panel.tsx` without changing the shipped workbench workflow?

---

## Required Boundary

This slice must:
- preserve workbench behavior
- preserve current workspace actions and canvas interactions
- extract obvious top-of-panel sub-surfaces and pure helper logic
- reduce the amount of orchestration and utility logic living inside `workbench-panel.tsx`

This slice must not:
- redesign the workbench UI
- change canvas interaction semantics
- change connection authoring behavior
- change tutorial, comparison, or versioning behavior

---

## Implementation Shape

V1 should extract:
- top-of-panel project/context rendering into dedicated local subcomponents
- workspace action-bar rendering into a dedicated local subcomponent
- pure workbench support helpers into a reusable UI-local helper module

Expected extracted surfaces:
- `src/ui/components/workbench-project-context.tsx`
- `src/ui/components/workbench-actions.tsx`
- `src/ui/workbench-support.ts`

`workbench-panel.tsx` should remain the orchestration surface for:
- canvas state
- drag / selection / wiring interactions
- viewport focus

---

## Implementation Result

This slice is now implemented on `main`.

Shipped behavior:
- top-of-panel project/context rendering now lives in `workbench-project-context.tsx`
- workspace actions now live in `workbench-actions.tsx`
- pure workbench helpers now live in `workbench-support.ts`
- `workbench-panel.tsx` now carries less non-rendering and top-surface responsibility

---

## Why This Slice

The workbench was the second major UI anchor after the inspector.

This refactor is intentionally conservative:
- no redesign
- no behavior change
- real reduction in file responsibility

It keeps the current feature wave from turning the workbench into the next drag coefficient.
