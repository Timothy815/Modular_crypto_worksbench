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

These are guidance items, not hard blockers against the next implementation slice.
