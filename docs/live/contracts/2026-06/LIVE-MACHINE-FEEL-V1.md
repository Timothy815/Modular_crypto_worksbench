# Live Machine Feel V1

Last updated: June 8, 2026
Status: Under Review

---

## Purpose

Close the remaining experiential gap between MCW's current state (~70% of the north star) and the stated goal: the product should feel like working on a live cryptographic machine, not assembling a static diagram.

This contract addresses three specific north star targets that remain substantially unmet:

1. **Wiring feels like routing a signal, not drawing a logical arrow**
2. **Structure reads without interpretation**
3. **Bookkeeping is reduced, not hidden**

It does not re-address targets that are already substantially met:
- "State is readable while the machine is running" — signal chips, active path glow, always-on execution are shipped
- "Parameter edits connect directly to visible output" — always-on execution is shipped

This contract is organized as nine bounded sub-slices grouped into four implementation tiers. Each sub-slice is independently shippable. The tiers reflect impact-per-effort ordering, not strict dependency.

It is not a curriculum addition.
It is not a new signal domain.
It is not automatic layout or hidden graph repair.

It is a bounded set of canvas and interaction improvements that close the authoring-feel gap within MCW's existing honest, glass-box constraints.

---

## Why This Slice Exists

MCW's explicit-and-correct half is strong. The teaching curriculum is comprehensive. The verification story is solid. Python export parity is complete.

The remaining gap is experiential. The north star document (EXPERIENTIAL-NORTH-STAR-V1.md) identifies the quality to aim for:

> When you patch a cable or turn a knob in Audulus, you feel the machine respond. You are not filling out a configuration form. You are shaping something that is already running.

Today in MCW:
- Connecting a wire requires finding a small port dot and clicking precisely
- Inserting a module between two connected modules takes four steps: sever wire, place module, reconnect from source, reconnect to target
- A newly built subgraph requires a manual cleanup pass (Tidy Layout → add group box → add label) before it reads as a coherent structure
- Errors in the graph are invisible until the user enters Analyze or notices missing downstream output
- Ticked execution produces correct outputs but the timing is not felt — there is no visible pulse

These are not missing features. They are friction points in the existing interaction model that prevent the product from feeling alive during authoring.

The product standard should not be:

- "You can build anything if you follow the right steps"

It should be:

- "Each action you take produces a visible response from the machine you are building"

within MCW's constraints: explicit types, honest domain boundaries, no hidden coercions, no automatic graph repair.

---

## Scope

### In scope

Nine sub-slices grouped into four tiers:

**Tier 1 — Immediate feel (lowest effort, highest per-action impact)**
- A: Canvas error badges
- B: Port hover snap-preview
- C: Wire domain legend

**Tier 2 — Wiring as routing**
- D: Splice-on-wire (mid-wire module insertion)
- E: Jump-to-first-error
- F: Connection drag from output chip

**Tier 3 — Structure without ceremony**
- G: One-gesture label+frame
- H: Auto-label role hint on group box creation

**Tier 4 — Temporal pulse**
- I: Tick pulse on wires

### Out of scope

- Automatic graph layout or graph repair
- Implicit type coercion or silent domain bridging
- Any hidden wiring that is not visible in the graph
- Reorganization of the signal type model
- New module primitives or curriculum additions
- Composite or iterator authoring semantics
- Export or verification workflow changes

---

## Strategic Principle

Every sub-slice in this contract must satisfy both of these at once:

- "this makes MCW more explicit and correct"
- "this makes MCW feel more like directly shaping a live machine"

A sub-slice that satisfies only the first (adds a capability but adds ceremony) is necessary but not sufficient.
A sub-slice that satisfies only the second (improves feel by hiding something) is not acceptable.

The slices succeed collectively when a new user building a fresh board:
- sees the machine respond to every connection and parameter change without entering Analyze
- can insert a new transform between two connected modules in one gesture
- can read what a finished subgraph does from its visual structure without opening the inspector
- can locate a broken module at a glance and understand what is wrong

---

## Sub-Slice Definitions

### A — Canvas Error Badges

**What it is:**
When a module produces no output — because a required input is missing, a type mismatch exists on an input port, or upstream execution failed — show a small visible indicator on the canvas node itself.

**Current state:**
Errors are only discoverable by entering Analyze mode or noticing that a downstream output chip is absent. On a dense board, the broken module can be anywhere in the graph.

**Required behavior:**
- After each execution cycle, any module that produced no output for at least one of its output ports must display a compact badge on its canvas node.
- The badge must be visually distinct from normal module styling and from the active/idle wire distinction.
- The badge must disappear when the module produces valid output on all ports.
- The badge must not block port hit areas or obscure the module label.
- The badge must not appear on source-only modules (inputs, constants) that have no execution result by design — distinguish "module evaluated but produced no output" from "module is a source with no upstream execution."

**Constraint:**
The badge surfaces existing execution result information. It does not change execution semantics or reveal hidden information. It does not suggest an automatic fix.

---

### B — Port Hover Snap-Preview

**What it is:**
When dragging a wire and hovering a compatible target port, the wire briefly snaps to that port and renders a preview connection before release. Incompatible ports show a clear visual rejection beyond the current dim-coloring.

**Current state:**
Port color changes during hover but the feedback is passive. Connecting feels like clicking a small target, not like inserting a cable.

**Required behavior:**
- When a wire drag enters the proximity zone of a compatible target port, the wire endpoint visually snaps to that port and renders the proposed connection path in a preview state (distinct styling from a committed connection).
- The snap preview appears before the user releases the mouse.
- When a wire drag enters the proximity zone of an incompatible target port, a clear rejection indicator appears (beyond current color dimming — e.g., a brief red border or shake) so the user knows exactly why the connection will not form.
- On release over a valid snap target, the connection commits as normal.
- On release outside any valid snap zone, the connection is abandoned as normal.
- The snap zone size must be tuned to feel helpful on dense boards without accidentally hijacking intended targets.

**Constraint:**
The snap must not silently reroute a wire to a different target than the user aimed at. If two compatible ports are close together, the snap resolves to the nearest and shows the user which one is targeted before release.

---

### C — Wire Domain Legend

**What it is:**
A small always-visible legend in the workspace chrome mapping wire colors to domain names: `bits`, `symbol`, `integer`, `ec-point`.

**Current state:**
Domain colors are learnable only through the palette module cards and by hovering individual wires. First-session students building their first board do not know what the colors mean.

**Required behavior:**
- A compact domain color legend is visible somewhere in the persistent workspace chrome (not a modal, not a separate help surface, not requiring any action to appear).
- The legend shows each domain name paired with its color token.
- The legend is consistent with the actual wire domain coloring in the current workspace.
- The legend does not compete visually with the canvas or the module nodes — it is a background reference element, not a prominent header.

**Constraint:**
The legend is read-only. It does not add interaction. It does not change wiring semantics.

---

### D — Splice-on-Wire (Mid-Wire Module Insertion)

**What it is:**
When the user drags a module from the palette and releases it onto an existing wire, the module is inserted in place: the original connection is severed and two new connections are created (source → new module input, new module output → original target), provided the module has exactly one compatible input and one compatible output for the wire's signal type.

**Current state:**
Inserting a module between two connected modules requires: sever the wire, place the module in empty space, connect source → new module, connect new module → target. Four steps for the most common board-building action.

**Required behavior:**
- During a module drag from the palette, the canvas detects when the dragged module passes over an existing wire.
- If the module has exactly one input port and one output port with types compatible with that wire's signal domain, a visual preview appears on the wire showing the proposed insertion point.
- On release, the original connection is replaced with two new connections routing through the placed module.
- If the module has multiple compatible input or output ports, no auto-insertion occurs — the module is placed normally and the user connects manually.
- If no compatible single-input/single-output match exists, no auto-insertion occurs.
- The insertion is undoable as one undo step.

**Constraint:**
Splice-on-wire must not silently route signals through a module the user did not intend. The preview must make the proposed insertion visible before release. If the module type is not compatible with the wire, no insertion occurs — the module is placed in open space as normal. No coercion, no implicit bridging.

---

### E — Jump-to-First-Error

**What it is:**
After execution, if any modules have the error badge (sub-slice A), a keyboard shortcut or quick-action pans the viewport to the first broken module and frames it.

**Current state:**
On a dense board, finding the first broken module requires panning manually. The minimap helps but does not highlight error locations.

**Required behavior:**
- After execution with at least one error badge present, a single action (keyboard shortcut and/or button in workspace chrome) moves the viewport to the first broken module with standard selection framing.
- "First broken module" is determined by topological order — the earliest module in execution order that produced no output.
- If no error badges are present, the action is disabled or absent.
- The previous-view return path (already shipped) is preserved so the user can return to where they were.

**Constraint:**
Jump-to-first-error navigates only. It does not attempt to repair the error, suggest a fix, or highlight a cause. The broken module is selected and framed; the user investigates and corrects.

---

### F — Connection Drag from Output Chip

**What it is:**
Allow starting a wire drag from the live signal chip that appears on an output port, in addition to the port dot itself.

**Current state:**
Wire creation requires clicking precisely on the small port dot. The signal chip displayed adjacent to the port is a larger, easier target but is not interactive for wire creation.

**Required behavior:**
- A pointer-down on the signal chip of an output port initiates a wire drag from that port, identical to a pointer-down on the port dot itself.
- The chip remains a read-only display of the current output value when not being used to drag.
- No change to wire creation semantics — the drag behaves identically once initiated.

**Constraint:**
The chip remains honest about its signal value. Dragging from it does not change what the wire carries or how the connection is validated. The larger hit target reduces precision demand without changing semantics.

---

### G — One-Gesture Label+Frame

**What it is:**
When the user has modules selected and presses F (or triggers Frame Selection), if no group box already contains the selection, a group box is created around the selection AND the group box label field opens immediately for naming.

**Current state:**
Framing a selection (F key) and adding a group box with a label are two separate actions: frame the viewport, then use the Edit menu to insert a group box, then label it. Three steps for the most common "I just built a subgraph, now organize it" action.

**Required behavior:**
- F with a selection creates a group box enclosing the selected modules AND opens the label input inline, focused and ready to type.
- If a group box already tightly contains the selection, F frames the viewport only (current behavior) — the group box creation gesture is not triggered twice.
- If the user presses Escape after the group box is created but before typing a label, the group box is retained with an empty label (consistent with current group box behavior).
- The group box creation is one undo step. Typing the label is not part of the undo unit.

**Constraint:**
The group box is still a purely visual organizational element. Its creation does not change graph semantics, signal flow, or execution order. This sub-slice does not add automatic labeling — it only opens the label field immediately after creation.

---

### H — Auto-Label Role Hint on Group Box Creation

**What it is:**
When a new group box is created (via sub-slice G or any other creation path), if all enclosed modules share one module category, the label field is pre-populated with that category name as a hint. The hint is editable and clearable before confirming.

**Current state:**
New group boxes have blank labels. Users must type a name from scratch even when the content is visually homogeneous (e.g., sixteen SBox modules form a "SubBytes" cluster).

**Required behavior:**
- On group box creation, if all enclosed module instances have the same module category, the label field is pre-populated with the category display name.
- The pre-population is a hint, not a commit. The user can edit or clear it before confirming.
- If enclosed modules span multiple categories, the label field is blank (no conflated hint).
- If no modules are enclosed, the label field is blank.

**Constraint:**
The hint is derived from module category metadata already present in the registry. It does not infer semantic meaning from signal values, params, or graph topology. A cluster of sixteen SBox modules hints "S-Box"; it does not hint "SubBytes layer" by analyzing context.

---

### I — Tick Pulse on Wires

**What it is:**
During ticked execution, when a tick fires and a wire carries a non-empty signal in that tick, a brief traveling animation highlight appears on that wire. The pulse travels from source port to target port over a short fixed duration and then disappears. This is not a persistent visual change — it is a momentary pulse synchronized to each tick transition.

**Current state:**
Ticked execution produces correct per-tick output visible in the output chips and the tick scrubber, but the timing is not felt. There is no visual indication of signal moving through the graph on each tick.

**Required behavior:**
- When the tick advances (whether from the clock control or scrubber), every wire that carried a non-empty signal in the new tick fires a brief traveling pulse animation.
- The pulse uses the wire's domain color at elevated opacity, traveling from source anchor to target anchor over approximately 300–500ms.
- The pulse is a CSS/SVG animation layered over the static wire — it does not replace or modify the wire's permanent visual state.
- The pulse does not fire during stateless (non-ticked) execution.
- The pulse does not fire when the tick scrubber is held down and dragged rapidly — it is debounced or suppressed during fast scrub to avoid animation pile-up.
- The pulse can be disabled per workspace via the existing workspace display settings if it is visually distracting.

**Constraint:**
The pulse is purely visual. It does not change execution order, signal values, or timing semantics. It surfaces what the execution model already computes — it does not introduce a new execution concept.

---

## Tier Ordering and Dependencies

Tiers 1–3 are mutually independent and can be implemented in any order within the tier.

Sub-slice A (error badges) is a soft dependency for sub-slice E (jump-to-first-error): E is most useful once A makes errors visible. But E can ship independently and is still useful with Analyze's error output.

Sub-slice G (one-gesture label+frame) is a soft dependency for sub-slice H (auto-label hint): H enriches G but H can also enrich the existing manual group box creation path.

Sub-slice I (tick pulse) is independent of all others and is the highest-effort item in the contract. It should not block any Tier 1–3 work.

---

## Implementation Notes

### Error badges (A)
The execution result is already available in the reducer state after each run. The badge render is a conditional class on the existing canvas node component, keyed on whether the module's execution output contains any non-null signal values. No new execution logic required — this is a read from existing state.

### Port hover snap (B)
The wire drag state machine already tracks hover proximity for port color changes. The snap preview requires extending that state to include a "snap-committed target" while the wire is mid-drag. The preview renders the proposed path using the existing connection SVG path logic with a distinct CSS class.

### Splice-on-wire (D)
The existing "insert bridge on type mismatch" feature (already shipped) established a pattern for intercept-and-rewire on connection drop. Splice-on-wire applies similar logic to module placement: detect wire proximity during drag, validate types, preview insertion, and execute as three atomic operations (remove old connection, add connection A, add connection B) in one reducer step.

### Tick pulse (I)
The pulse requires knowing which wires carried non-empty signals in the most recent tick transition. The execution result already contains per-module output values per tick. The animation layer can be a separate SVG overlay component that reads the diff between tick N-1 and tick N outputs, finds wires where the source changed from empty to non-empty (or remained non-empty), and fires the CSS animation for each. No changes to the execution model or store schema required beyond one transient animation-trigger signal.

---

## Testing Requirements

1. `npx vitest run` must pass for all sub-slices.
2. `npm run build` must pass with `maxChunk` ≤ 450 KiB.
3. **Sub-slice A:** A seeded project with a known type-mismatch renders an error badge on the affected module and clears the badge when the mismatch is resolved.
4. **Sub-slice A:** Source-only modules (HexSource, TextInput, etc.) do not show error badges when the graph executes successfully.
5. **Sub-slice B:** Hovering a compatible port during wire drag enters the snap-preview state; hovering an incompatible port shows the rejection indicator.
6. **Sub-slice D:** Dropping a single-input/single-output compatible module onto a wire results in two new connections replacing the original; the original wire is absent; the module is placed at the midpoint of the wire.
7. **Sub-slice D:** Dropping a module with multiple compatible ports onto a wire results in normal placement with no auto-insertion.
8. **Sub-slice D:** The splice is reversible as one undo step.
9. **Sub-slice E:** With at least one error badge present, the jump-to-first-error action selects and frames the topologically earliest broken module.
10. **Sub-slice G:** F with a selection that is not already group-boxed creates a group box and opens the label input.
11. **Sub-slice G:** F with a selection that is already group-boxed frames the viewport without creating a duplicate group box.
12. **Sub-slice H:** A group box enclosing modules of one category pre-populates the label field with that category name.
13. **Sub-slice H:** A group box enclosing modules of mixed categories has a blank label field.
14. **Sub-slice I:** In ticked mode, advancing the tick fires a pulse animation on wires carrying non-empty signals; wires with no signal in that tick do not pulse.
15. **Sub-slice I:** In stateless (non-ticked) execution, no pulse animations fire.

---

## Acceptance Criteria

This contract is complete when all of the following are true:

1. A broken module on the canvas is visible as broken without entering Analyze.
2. Connecting a wire to a compatible port shows a snap preview before release; incompatible ports show a clear rejection.
3. The wire domain color legend is always visible in workspace chrome.
4. Dropping a single-input/single-output compatible module onto an existing wire inserts it in place in one gesture.
5. After execution with errors, one action pans the viewport to the first broken module.
6. Dragging a wire can be initiated from the output signal chip, not only the port dot.
7. F with a selection creates a group box and opens the label field in one gesture.
8. A new group box around a homogeneous module cluster pre-populates the label hint.
9. In ticked mode, wire pulses are visible on each tick transition.
10. All nine items satisfy both: "this makes MCW more explicit and correct" AND "this makes MCW feel more like directly shaping a live machine."

---

## What This Contract Does Not Promise

This contract closes the authoring-feel gap described in the June 2026 north star assessment. It does not claim to reach 100% of the north star standard — that standard is directional, not a checklist.

What remains after this contract ships:

- The distinction between building a new board from scratch (still requires layout discipline) versus modifying a known board (substantially improved by this contract) is not fully erased.
- The "Audulus feeling" for very large boards (100+ modules) will be improved but the wire-routing ceremony on dense boards does not disappear entirely.
- Full mid-drag module insertion into the middle of a multi-hop routing path (as opposed to a single wire) is not addressed in V1.

---

## Shipping Notes

When this ships, update:

- `ACTIVE-DOCS.md`
- `IMPLEMENTATION-STATUS.md`
- `CLAUDE.md` "Genuine next open work" section
- `EXPERIENTIAL-NORTH-STAR-V1.md` north star realization estimate
