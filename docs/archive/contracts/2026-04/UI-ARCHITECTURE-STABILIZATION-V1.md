# UI-ARCHITECTURE-STABILIZATION-V1

Status: Shipped

Owner: Codex
Scope: UI Maintainability / Product Stability / Authoring Velocity

## Why

MCW has crossed the line from "feature-rich prototype" into a real teaching platform:
- flagship labs
- onboarding
- instructor pilot support
- verification explainability
- shareable lab packs
- Python export parity

That product growth is real, but the top-level UI orchestration is now carrying too much weight in one place.

The main pressure point is [App.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/App.tsx):
- more than 4,000 lines
- owns persistence bootstrapping
- owns imported/exported artifact flows
- owns tutorial/challenge/verification orchestration
- owns detached-window orchestration
- owns large amounts of workspace routing glue

The next highest-value move is not another feature family.
It is protecting delivery speed and regression safety before the UI shell becomes the bottleneck for every future change.

## Goal

Reduce the architectural pressure in the top-level UI shell without changing the product model, engine semantics, or shipped user workflows.

V1 should make the app easier to extend by extracting clear orchestration seams from `App.tsx` into bounded UI-layer helpers or controllers.

This is not a redesign.
It is a stabilization slice.

## Prior Work

This slice continues the already-shipped `APP-SHELL-REFACTOR-V1` line.

It must build on prior shell extraction work rather than duplicate or undo it.

This is effectively the next bounded pass on the same problem:
- keep `App.tsx` as the composition shell
- move imperative orchestration into named UI-layer helpers
- preserve the current reducer-backed ownership model

## Product Boundary

This slice must not:
- change engine behavior
- change reducer semantics
- change JSON persistence format
- change Python export behavior
- introduce a new state management library
- rewrite the workbench shell from scratch
- widen into a general component-style cleanup campaign
- introduce a new React context/provider layer
- introduce a new local state owner outside the existing reducer-backed flow

The goal is better internal separation while preserving current product behavior.

## Required V1 Shape

1. V1 must stay entirely inside the UI layer.
2. V1 must preserve existing behavior for:
   - workspace bootstrapping
   - import/export actions
   - tutorial/challenge selection
   - verification case handling
   - detached-window synchronization
3. V1 must extract at least three bounded responsibility areas out of `App.tsx`.
4. The extraction must use plain TypeScript modules or focused UI hooks/helpers already compatible with the current reducer-backed model.
5. V1 must not introduce any new persistent project metadata or migration burden.
6. V1 must not widen into cosmetic component churn unrelated to the extracted orchestration areas.
7. The final shape must be measurably easier to extend for future adoption-facing work.
8. Extracted modules must remain stateless relative to the React lifecycle and accept current state, dispatch, and existing callbacks as parameters where needed.
9. Extracted modules must not introduce new contexts, providers, reducers, or alternate state-management patterns.
10. Each extracted module must be independently importable and must not create a circular dependency back into `App.tsx`.
11. V1 should include at least one regression test per extracted module's public interface.
12. `App.tsx` should be reduced by at least `800` lines from its current starting size for this slice to count as complete.

## Preferred V1 Extraction Targets

The best bounded targets are:

1. Workspace artifact handling in `src/ui/workspace-artifacts.ts`
- import/export of:
  - workbench documents
  - composite libraries
  - guided challenges
  - shareable lab packs
  - Python-export ZIP delivery glue
- file parsing, validation, and import-routing glue

2. Learning/verification orchestration in `src/ui/learning-orchestration.ts`
- selected tutorial/challenge lookup
- tutorial/challenge project switching
- verification-case add/remove/import/clear helpers
- baseline-capture / baseline-clear workflow glue

3. Detached-window orchestration in `src/ui/detached-window-orchestration.ts`
- window-group coordination
- snapshot broadcasting
- command routing for detached panes

These are already logically separable and give the largest reduction in top-level pressure.

## Good V1 Deliverables

V1 should likely produce:

- one extracted `src/ui/workspace-artifacts.ts` helper/controller module
- one extracted `src/ui/learning-orchestration.ts` helper/controller module
- one extracted `src/ui/detached-window-orchestration.ts` helper/controller module
- a smaller, more readable `MainApp` body that composes these pieces

All three targets are expected.

If the detached-window extraction alone would exceed roughly `400` lines of focused change after the first two targets are complete, it may defer to a follow-on slice.

The first two targets must still ship in V1.

## Explicit Non-Goals

- No reducer rewrite
- No context/provider architecture shift
- No Zustand/Redux/XState adoption
- No engine refactor
- No generic "split every component into tiny files" pass
- No visual redesign of the shell
- No new product feature hidden inside the refactor
- No JSX migration into orchestration helpers beyond minimal boundary wrappers
- No ad-hoc object-controller framework

## UX Rules

- Users should not notice the refactor except through continued stability.
- All existing workflows must remain discoverable in the same places.
- No menu labels, tutorial labels, or lab-pack behaviors should change unless required for a bug fix discovered during the extraction.

## Success Condition

This slice is successful if:
- `App.tsx` is reduced by at least `800` lines and is meaningfully easier to scan
- the extracted responsibility areas have clear ownership boundaries
- future slices can change import/export, learning flow, or detached windows with less risk of top-level regression
- the extracted helper modules remain parameter-driven and stateless relative to the React lifecycle
- all existing tests, lint, and build checks continue to pass without behavior regressions

## Notes

MCW now has enough product power that internal structure matters directly to product progress.

This slice is about preserving momentum.
It should make the next adoption-facing and classroom-facing improvements easier to ship, not compete with them.

Shipped result:
- extracted `src/ui/workspace-artifacts.ts`
- extracted `src/ui/learning-orchestration.ts`
- extracted `src/ui/detached-window-orchestration.ts`
- added direct regression tests for the new helper surfaces
- reduced [App.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/App.tsx) from `4403` lines to `3596` lines without changing product behavior
