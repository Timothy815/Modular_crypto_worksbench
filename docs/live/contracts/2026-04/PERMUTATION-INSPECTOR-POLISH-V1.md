# PERMUTATION-INSPECTOR-POLISH-V1

## Goal

Make permutation authoring feel table-first and direct, with controls visually tied to the routing surface instead of detached form rows.

## Shipped Shape

- Both `Permutation` and `SymbolPermutation` use the visual routing surface as the primary editor.
- Routing supports:
  - drag an input onto an output slot
  - click an input to arm it, then click an output to route it there
- Whole-permutation transforms are available as compact icon tools near the routing surface:
  - identity
  - reverse
  - rotate left
  - rotate right
  - inverse
- Raw CSV order remains available behind the existing disclosure.

## Boundaries

- No engine semantics changed beyond adding explicit whole-permutation rotation helpers.
- No new persistence model.
- No freeform visual editing beyond explicit re-routing of permutation outputs.

## Notes

- The click-to-route fallback exists because browser drag behavior is not equally reliable everywhere.
- The icon row is intentionally compact and local to the wire surface so the editor reads as a manipulable routing view rather than a form with a diagram in the middle.
