# ON-CANVAS-STAGE-LABELS-V1

Status: Implemented locally

## Goal

Add lightweight on-canvas stage labels that make large workspaces easier to scan without introducing new graph semantics.

## V1 Shape

- Add persistent stage labels as workspace UI metadata only.
- Support `Add Stage Label`, drag, rename, and delete.
- Render labels as lightweight canvas landmarks rather than sticky notes.
- Include labels in refresh, save/load, history, versions, export/import, and shareable lab packs.
- Show labels in the minimap as light visual markers.

## Non-Goals

- No engine or validator meaning.
- No grouping or layout constraints.
- No rich text, arrows, or annotation-body editing.
- No automatic stage numbering in V1.

## Shipped Note

V1 gives authors a lightweight way to mark rounds, outputs, feedback regions, and other teaching landmarks directly on the canvas. The labels stay visual-only and intentionally simpler than notes or group boxes.
