# WORKSPACE-POLISH-V2

Status: Shipped on `main`.

## Intent

Tighten the interaction coherence of the richer workspace surface without adding new graph semantics.

## Required V1 Shape

1. Calm stage-label behavior to match newer canvas tools.
2. Make quick workbench actions more context-sensitive.
3. Keep all changes UI-only with zero engine or project-schema drift.
4. Preserve existing layout/routing capabilities; this slice only changes presentation and affordance visibility.

## Shipped Note

The local implementation focuses on two friction points:

- stage labels are now quiet by default and only expose drag/edit controls on hover or selection
- the workbench inline action strip now separates always-useful layout controls from context-specific selection and wire tools

## Non-Goals

- no new layout primitives
- no new routing behavior
- no new snapping rules
- no workspace data-model changes beyond existing UI metadata use
