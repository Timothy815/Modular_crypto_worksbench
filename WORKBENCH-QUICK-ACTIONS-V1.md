# WORKBENCH-QUICK-ACTIONS-V1

Status: Shipped on main

Owner: Codex
Scope: Workbench UI only

## Goal

Add a compact quick-actions strip for high-frequency canvas actions so users can reach common view, layout, routing, history, and wire actions without repeatedly reopening dropdown menus.

## Required V1 Shape

1. Keep existing dropdown menus intact as the complete fallback navigation path.
2. Add a thin quick-actions strip to the workbench chrome.
3. Use icon-first buttons with explicit tooltips for every action.
4. Only promote high-frequency canvas actions:
   - zoom in / zoom out
   - fit view / reset view
   - undo / redo
   - horizontal / vertical layout
   - curved / orthogonal routing
   - overview navigator toggle
   - save version
   - delete selected wire
   - reset selected wire path
5. Preserve active-state visibility for layout direction, routing mode, and overview visibility.
6. Keep destructive or conditional actions disabled when not applicable rather than hiding them unpredictably.
7. Do not replace import/export, structure authoring, or project menus with icon-only controls.

## Non-Goals

- No ribbon UI.
- No customizable toolbar.
- No icon-only replacement for the full menu system.
- No command search / palette.

## UX Rules

- The strip must remain visually thin and secondary to the canvas.
- Icons must be recognizable without depending on a third-party icon package.
- Tooltips are required; icons do not stand alone.
- Selection- or wire-specific actions may stay disabled until relevant.

## Shipped Note

V1 is shipped on main. The workbench now includes a compact quick-actions strip for the most common canvas actions while preserving the grouped dropdown menus as the full fallback navigation path.
