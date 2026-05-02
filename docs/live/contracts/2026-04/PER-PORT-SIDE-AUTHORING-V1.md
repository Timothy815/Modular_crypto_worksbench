# PER-PORT-SIDE-AUTHORING-V1

Last updated: April 5, 2026

---

## Purpose

Define a bounded per-instance port-side authoring model that lets users place individual ports on the most useful card edge for readability while keeping MCW inside a structured, orthogonal node language.

This is the follow-on to:
- `PORT-ORDER-AUTHORING-V1.md`
- `PORT-SIDE-LAYOUT-PRESETS-V1.md`

It should solve real dense-workspace cases like rotor stepping turnover ports without turning node cards into freeform diagram canvases.

---

## Problem

Port order and whole-node side presets already made dense workspaces cleaner, but some nodes still produce avoidable crossings because one or two ports want a more local edge assignment than the node-wide preset allows.

Examples:
- turnover outputs on rotor control modules
- pulse/control ports that want to stay on a top or right corridor
- composite helper ports that read more clearly when separated by side rather than by order alone

The product need is:
- cleaner local routing
- clearer node geography
- fewer forced crossovers in advanced workspaces

The product need is not:
- arbitrary per-port x/y placement
- freeform node editing
- a mini CAD system inside each card

---

## Desired Outcome

For a selected module instance, the user should be able to move an individual visible input or output port to:
- `Left`
- `Right`
- `Top`
- `Bottom`

using a direct inspector authoring surface.

The result should:
- update the workspace card immediately
- update connection anchor positions immediately
- preserve port identity by name
- preserve orthogonal routing behavior

The node should still feel like an MCW module card, not a hand-drawn shape.

---

## V1 Scope

`PER-PORT-SIDE-AUTHORING-V1` should include:

- per-instance visual side assignment for individual ports
- support for both inputs and outputs
- drag/drop or equivalent direct assignment in the inspector
- visible side bins for:
  - `Left`
  - `Right`
  - `Top`
  - `Bottom`
- ordering within each side
- immediate workspace-card and wire-anchor updates
- persistence through the existing workspace UI metadata paths

V1 should stay intentionally bounded:
- no arbitrary free placement inside a side
- no off-card ports
- no curve authoring or routing rewrite
- no module-definition mutation
- no engine semantics change

---

## Product Shape

Per-port side assignment is:
- workspace-local UI metadata
- per instance, not global per primitive or composite definition
- visual only

Port identity remains bound to:
- module id
- port name

not to any visual slot.

Connections remain semantically attached to the same named ports after reassignment.

---

## Interaction Model

### Inspector Surface

The selected module inspector should expose a compact authoring surface near the existing port-order controls.

V1 should allow the user to move a port between side bins by:
- dragging a labeled port chip into `Left`, `Right`, `Top`, or `Bottom`

If drag/drop proves unreliable in practice, a bounded fallback such as side buttons may exist, but drag/drop is the intended primary interaction.

### Side Bins

Each side bin must:
- clearly communicate whether it holds inputs, outputs, or both
- keep ports visibly labeled
- preserve stable ordering within the bin

If inputs and outputs share a side, they must remain distinguishable by direction styling or grouping.

### Ordering

Within a side, authored order matters.

V1 may reuse the existing per-port order language by:
- preserving current relative order when a port changes sides
- appending to the end of the target side by default

It does not need a second brand-new ordering model if the existing ordering metadata can be extended cleanly.

---

## Rendering Rules

1. Workspace cards must render ports on the authored side assignments.
2. Connection anchors must follow the authored side assignments.
3. Pending connections and rewiring previews must follow the authored side assignments.
4. Orthogonal routing must continue to use the current side of each endpoint.
5. Node rotation must continue to behave deterministically relative to authored side assignments.
6. If a port has no explicit authored side, it falls back to the current node-wide presentation logic.

---

## Required Constraints

1. This slice must remain UI-only.
2. It must not change engine execution, export semantics, or signal behavior.
3. It must work for primitives and composites.
4. It must not permit arbitrary x/y port placement.
5. It must not place ports outside the node card edge system.
6. It must preserve per-port identity and type labeling.
7. It must preserve reconnect stability and pending-wire targeting behavior.
8. It must round-trip through:
   - refresh
   - save/load
   - workspace history and versions
   - workspace artifact export/import
   - shareable lab pack persistence
9. V1 must not require a node to adopt a completely custom layout engine separate from the current card model.

---

## Data Shape Guidance

The safest V1 data model is:
- per-instance port-side metadata
- keyed by direction and port name

For example, conceptually:
- input port `turnoverA` -> `top`
- output port `step` -> `right`

This should coexist with:
- existing per-port order metadata
- existing node-wide `portLayoutPreset`

Precedence should be:
1. explicit per-port side assignment
2. node-wide side preset
3. orientation-derived default

---

## Explicitly Avoid In V1

Do not include:
- arbitrary dragging to pixel positions on the card
- port spacing controls
- automatic side optimization
- semantic grouping logic
- edge-specific port styling beyond clear input/output distinction
- composite-definition mutation
- a node-local freeform editor

---

## Exit Condition

This contract is complete when:
- a user can move an individual port to a cleaner side directly from the inspector
- the workspace card updates immediately
- wires and anchors follow the new side immediately
- dense cases like rotor turnover/control crossings become easier to clean up
- the feature improves readability without making node editing feel fussy or overly technical
