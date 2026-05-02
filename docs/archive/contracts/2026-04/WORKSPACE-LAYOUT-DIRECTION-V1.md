# WORKSPACE-LAYOUT-DIRECTION-V1

Status: Shipped on main
Owner: Codex
Last updated: April 3, 2026

## Intent

Add a bounded per-workspace layout-direction option so the same graph can be authored and tidied in either:
- `horizontal` flow (`left -> right`)
- `vertical` flow (`top -> bottom`)

This is a layout/readability slice, not an execution slice.

## Why

MCW currently reads and tidies almost entirely as a left-to-right machine language. That works well for many pipelines, but it creates avoidable horizontal sprawl in:
- larger flagship labs
- sequential/stateful workspaces
- laptop-sized viewports
- classroom use where vertical scrolling is often more natural than horizontal dragging

The goal is to preserve the current horizontal language while making vertical graph construction a first-class option.

## Non-Goals

V1 does **not**:
- change execution order or signal semantics
- create a second project type
- rotate graphs automatically as a transform
- add per-subgraph direction
- add mixed horizontal/vertical routing inside one workspace
- remap ports to top/bottom in vertical mode
- redesign wire routing beyond existing behavior

## Required V1 Shape

1. Add a per-workspace layout-direction setting with exactly two values:
   - `horizontal`
   - `vertical`

2. Horizontal remains the default for existing and new workspaces.

3. Persist `layoutDirection: 'horizontal' | 'vertical'` in workspace document UI metadata.
   Older documents without the field must resolve to `horizontal`.

4. The graph model stays identical. Direction only affects:
   - tidy layout
   - default placement of newly added modules
   - fit/focus behavior where needed for comfortable viewport recovery

5. `Tidy Layout` must respect the chosen direction:
   - horizontal mode:
     - sources biased left
     - sinks biased right
     - stage progression left-to-right
   - vertical mode:
     - sources biased top
     - sinks biased bottom
     - stage progression top-to-bottom in a stage-ladder pattern
     - modules in the same stage spread horizontally

6. Newly added modules should appear in a sensible forward-growing position for the active direction:
   - horizontal:
     - to the right of the selected module when possible
     - otherwise to the right of the current graph bounds
   - vertical:
     - below the selected module when possible
     - otherwise below the current graph bounds

7. V1 keeps current left/right port placement in both directions.

8. The selected direction must persist per workspace across refreshes, document save/load, and shareable lab packs.

9. Existing workspaces without an explicit direction must resolve to `horizontal` without migration breakage.

10. V1 should keep the existing workbench shell and graph renderer. Do not invent a second canvas implementation.

## UX Rules

- The control should be small and explicit, next to `Tidy Layout` in the workspace layout actions.
- The mode labels should be plain:
  - `Horizontal`
  - `Vertical`
- Prefer a simple toggle or select over icons-only controls.
- The feature should feel like changing how the workspace is arranged, not changing what the machine means.

## Tidy Rules

Horizontal tidy:
- preserve current mental model where possible
- do not regress existing staged pipeline readability

Vertical tidy:
- stack stages top-to-bottom with enough spacing for wire legibility
- branch fans should widen horizontally rather than stretching the graph downward unnecessarily

In both modes:
- tidy should remain deterministic
- tidy should avoid overlapping modules
- tidy should preserve grouped local fragments when practical

## Persistence Rules

- Workspace layout direction should persist with the workspace, not as a single global preference.
- Default resolution for older documents/workspaces must be `horizontal`.
- V1 must not break existing saved documents or lab packs.

## Implementation Preference

Prefer extending the existing layout/tidy helpers rather than scattering direction conditionals across unrelated UI surfaces.

Likely primary implementation surfaces:
- workspace state / document UI metadata
- tidy-layout helpers
- module placement helpers for add-module actions
- viewport fit/focus helpers if direction-sensitive bias is needed
- small workbench layout control wiring

## Success Condition

V1 is complete when:
- a user can switch a workspace between `Horizontal` and `Vertical`
- tidy clearly reflows the graph according to the chosen direction
- new module placement follows the active direction
- the chosen direction survives refresh and reload
- existing workspaces continue to open horizontally without breakage

## Shipped Note

`main` now supports a bounded per-workspace layout direction:
- persisted `layoutDirection` in workspace UI metadata
- horizontal remains the default for older workspaces
- tidy layout and default add-module placement both respect the chosen direction
- vertical mode reflows stages downward without changing graph semantics or port placement

## Risks

- If this becomes a second graph system, the slice is too large.
- If tidy works but manual authoring still assumes horizontal-only placement, the feature will feel incomplete.
- If vertical mode changes semantics or trace interpretation, V1 has crossed the contract boundary.

## Final Note

This is a readability and navigation slice. The value is not “more modes.” The value is letting the same visible cryptographic machine fit the screen and the teaching context more naturally.
