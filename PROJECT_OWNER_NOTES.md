# MCW — Project Owner Notes

These notes capture product-direction feedback from the project owner so they remain visible as the UI evolves.

---

## UI Notes (March 21, 2026)

### Visual Direction

- The current light-mode color palette is strong and should be preserved as the baseline light theme.
- The current font choices feel right and should be preserved unless there is a compelling reason to change them.

### Dark Mode

- The product should support a dark mode option.
- This should be introduced through theme tokens and layout-aware styling rather than a one-off repaint.
- The goal is to avoid a later large-scale visual overhaul.

### Workbench Space

- The workbench should be able to occupy a larger share of the screen.
- The palette and inspector are readable at their current size, but they take up a lot of visual space.
- The layout should support options for side panels to be minimized, collapsed, or hidden so the workbench can expand.

### Timing

- These concerns are intentionally being raised early to avoid major overhauls later.
- Interactivity remains the immediate next priority, but layout flexibility should be considered as it is built.

### General Direction

- The current direction is strongly aligned with the intended vision.
- The UI is beginning to match the mental model of the project owner and should continue moving toward a true workspace/editor feel.

---

## Near-Term Implications

These notes suggest the following near-term UI priorities:

1. Add layout state for side-panel visibility.
2. Ensure the workbench expands when panels are hidden.
3. Keep the current light theme as the canonical light-mode foundation.
4. Prepare the styling system so dark mode can be added without rewriting components.
5. Treat the workspace as something that can grow arbitrarily large over time.
6. Keep alternate encodings explicit in the graph, likely as separate modules rather than hidden options inside one encoder module.

---

## Editor Direction Notes

- Connection editing is complete: port-to-port creation and click-to-delete.
- Node DOM has been refactored: body and port hit areas are separate.
- Module color-coding by functional role was added per owner request to aid classroom readability.
- Structured editors for `bits` and `wiring` are now in place.
- Persistence is now in place: autosave/restore and JSON import/export.
- Sticky-note style annotations are now supported as UI metadata, not as graph primitives.
- Next editor priorities: dark-mode groundwork, merge-readiness cleanup, then composite-module editing.

---

## Safe Resume Context

Active UI branch: `origin/feature/minimal-ui-shell`

The UI now supports:
- palette-driven module creation
- selected-module deletion
- reducer-backed state
- draggable nodes
- collapsible side panels
- parameter editing from `paramSchema`
- structured editors for `bits` and `wiring`
- port-to-port connection creation (drag from output to input)
- connection deletion (click to remove)
- target validation and highlighting during connection editing
- color-coded modules by functional role (source/operator/bridge/sink)
- new modules placed within visible canvas area
- local autosave/restore
- JSON import/export
- sticky-note annotations on the canvas

The UI does not yet support:
- composite-module editing
- dark mode
- deeper execution stepping / trace tooling

All four editor fundamentals are now complete: add, delete, move, and connect modules.
The workbench lifecycle is also now present: persist, restore, export, import, and annotate.
