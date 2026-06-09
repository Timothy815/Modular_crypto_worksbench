# Live Machine Feel V1

Last updated: June 8, 2026
Status: Shipped on `main`

---

## Purpose

Close the remaining experiential gap between MCW's current state (~70% of the north star) and the stated goal: the product should feel like working on a live cryptographic machine, not assembling a static diagram.

This contract addresses three specific north star targets that remain substantially unmet:

1. **Wiring feels like routing a signal, not drawing a logical arrow**
2. **Structure reads without interpretation**
3. **Bookkeeping is reduced, not hidden**

It does not re-address targets that are already substantially met:
- "State is readable while the machine is running" — signal chips, active path glow, always-on execution are shipped
- "Parameter edits connect directly to visible output" — always-on execution (runs on every render) is shipped; the latency is already at render speed. No new sub-slice is warranted here.

This contract is organized as nine bounded sub-slices grouped into four implementation tiers. H (auto-label hint) is merged into G as an extension rather than a standalone slice. Each tier is independently shippable. Tiers reflect impact-per-effort ordering, not strict dependency.

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

Nine sub-slices (H merged into G) across four tiers:

**Tier 1 — Immediate feel (lowest effort, highest per-action impact)**
- A: Canvas error badges with error-kind tooltip
- B: Port hover snap-preview
- F: Connection drag from output chip

**Tier 2 — Wiring as routing**
- E: Jump-to-first-error
- D: Splice-on-wire (mid-wire module insertion)

**Tier 3 — Structure without ceremony**
- C: Wire domain legend
- G: One-gesture label+frame with auto-label hint (formerly G + H)

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
- can locate a broken module and see what kind of error it has without entering Analyze

Note: this contract makes failure **visible and categorized** on the canvas. It does not promise that the user can fully diagnose every failure without Analyze — Analyze remains the authoritative diagnostic surface.

---

## Sub-Slice Definitions

### A — Canvas Error Badges with Error-Kind Tooltip

**What it is:**
When a module produces no output — because a required input is missing, a type mismatch exists on an input port, upstream execution failed, or a parameter fails validation — show a small visible indicator on the canvas node itself. On badge hover, show a compact tooltip naming the error category.

**Current state:**
Errors are only discoverable by entering Analyze mode or noticing that a downstream output chip is absent. On a dense board, the broken module can be anywhere in the graph.

**Required behavior:**
- After each execution cycle, any module whose execution output is absent or invalid for at least one output port must display a compact badge on its canvas node.
- Source modules (HexSource, TextInput, etc.) that have no upstream inputs must also show a badge if their parameter fails validation (e.g., a HexSource with a non-hex character value). The badge distinguishes "parameter error on a source" from "missing upstream input" — both warrant a badge.
- The badge must disappear when the module produces valid output on all ports.
- The badge must not block port hit areas or obscure the module label.
- On badge hover, a compact tooltip must indicate the error category. Acceptable categories include: `Missing input`, `Type mismatch`, `Upstream failure`, `Invalid parameter`. The exact category strings are implementation choices; the requirement is that a hovering user can distinguish between these four failure kinds without opening Analyze.
- The tooltip must not suggest an automatic fix.

**Constraint:**
The badge and tooltip surface existing execution result and validation information already in the reducer state. They do not change execution semantics or introduce new error-detection logic. Analyze remains the full diagnostic surface; the badge+tooltip is a first-pass orientation, not a replacement.

---

### B — Port Hover Snap-Preview

**What it is:**
When dragging a wire and hovering a compatible target port, the wire endpoint snaps to that port and renders a preview connection before release. Incompatible ports show a clear visual rejection beyond the current dim-coloring.

**Current state:**
Port color changes during hover but the feedback is passive. Connecting feels like clicking a small target, not like inserting a cable.

**Required behavior:**
- **Snap zone:** The snap zone is a 20px radius around the center of each port. When the wire drag tip enters the 20px radius of a compatible port, the endpoint snaps to that port and the proposed connection is rendered as a preview (distinct styling from a committed connection).
- **Anti-hijack rule:** If two compatible ports are both within the 20px snap zone simultaneously, no snap occurs — the wire continues to follow the cursor freely until one port is the exclusive occupant of the 20px radius. This prevents oscillation between adjacent ports on dense nodes.
- **Snap stability:** Once snapped to a target, the snap is stable until the drag tip leaves a 24px radius around that port (4px hysteresis) to prevent jitter.
- **Rejection indicator:** When the drag tip enters the 20px radius of an incompatible port, a clear rejection indicator appears (beyond current color dimming — a brief red border or equivalent) so the user understands immediately why the connection will not form.
- On release over an active snap target, the connection commits.
- On release outside any snap zone, the connection is abandoned.

**Constraint:**
The snap must not silently reroute a wire to a port other than the one the preview shows. The previewed target is the committed target. No coercion, no silent domain bridging.

---

### F — Connection Drag from Output Chip

**What it is:**
Allow starting a wire drag from the live signal chip that appears on an output port, in addition to the port dot itself.

**Current state:**
Wire creation requires clicking precisely on the small port dot. The signal chip displayed adjacent to the port is a larger, easier target but is not interactive for wire creation.

**Required behavior:**
- A pointer-down on the signal chip of an output port initiates a wire drag from that port, identical to a pointer-down on the port dot itself.
- The chip must still display its current signal value at rest — it is not visually converted into a button.
- No change to wire creation semantics — the drag behaves identically once initiated from the chip.
- The drag from chip must participate in the snap-preview behavior defined in sub-slice B.

**Constraint:**
The chip remains honest about its signal value. Dragging from it does not change what the wire carries or how the connection is validated. The larger hit target reduces precision demand without changing semantics.

---

### E — Jump-to-First-Error

**What it is:**
After execution, if any modules have the error badge (sub-slice A), a keyboard shortcut or quick-action pans the viewport to the first broken module and frames it.

**Current state:**
On a dense board, finding the first broken module requires panning manually. The minimap helps but does not highlight error locations.

**Required behavior:**
- After execution with at least one error badge present, a single action (keyboard shortcut and/or button in workspace chrome) moves the viewport to the first broken module with standard selection framing.
- "First broken module" is determined by topological execution order — the earliest module in execution order that produced no valid output.
- If no error badges are present, the action is disabled or absent.
- The previous-view return path (already shipped) is preserved so the user can return to where they were before the jump.
- The jump selects the broken module so the error-kind tooltip (sub-slice A) is immediately accessible.

**Constraint:**
Jump-to-first-error navigates and selects only. It does not attempt to repair the error or suggest a fix. Analyze remains the authoritative diagnostic surface.

---

### D — Splice-on-Wire (Mid-Wire Module Insertion)

**What it is:**
When the user drags a module from the palette and releases it onto an existing wire, the module is inserted in place: the original connection is severed and two new connections are created (source → new module input, new module output → original target), provided the module meets the splice eligibility rules.

**Current state:**
Inserting a module between two connected modules requires: sever the wire, place the module in empty space, connect source → new module, connect new module → target. Four steps for the most common board-building action.

**Splice eligibility rules:**
A module is eligible for splice-on-wire insertion if and only if:
1. It has **exactly one data input port** whose signal type matches the wire's domain.
2. It has **exactly one data output port** whose signal type matches the wire's domain.
3. Control ports (clock, reset, select, or any port whose role is control rather than data) are **excluded** from the eligibility count. A module with one bits data input, one bits data output, and one bits clock input is eligible on a bits wire — the clock port is not counted.
4. Other ports of non-matching domains are excluded from the eligibility count. A module with one bits data input, one bits data output, and one symbol input is eligible on a bits wire — the symbol port is not counted.
5. The module must have no required data ports on non-matched domains that lack default values. If the module requires a second input to function (even of a compatible domain), the splice is not eligible.

**Target wire disambiguation:**
- If the drop point lies over a single wire, that wire is the target.
- If the drop point lies over two or more wires (crossing or overlapping), no auto-insertion occurs — the module is placed normally. The preview (see below) only appears when one wire is unambiguously the target.

**Required behavior:**
- During a module drag from the palette, the canvas detects when the drag tip is within 12px of an existing wire that has an unambiguous single-wire target.
- If the module meets the splice eligibility rules for that wire's domain, a visual preview appears on the wire showing where the module will be inserted.
- On release, the original connection is replaced by two new connections. The module is placed at the point on the wire segment nearest to the drop point (not necessarily the geometric midpoint — this handles orthogonal wires with multiple segments correctly).
- Wire visual metadata (bends, lane preferences, orthogonal routing state) is transferred to the two replacement segments proportionally. If the wire has no metadata, the two segments inherit the workspace default routing style.
- If splice eligibility is not met, no auto-insertion occurs — the module is placed in open space as normal.
- The entire splice (remove original wire + add module + add two new connections) is one atomic undo step.

**Constraint:**
Splice-on-wire must not silently route signals through a module the user did not intend. The preview must make the proposed insertion unambiguous before release. No coercion, no implicit bridging. Control ports are never used for routing without explicit user action.

---

### C — Wire Domain Legend

**What it is:**
A small always-visible legend in the workspace chrome mapping wire colors to domain names: `bits`, `symbol`, `integer`, `ec-point`.

**Current state:**
Domain colors are learnable only through the palette module cards and by hovering individual wires. First-session students building their first board do not know what the colors mean.

**Note on "live machine feel":** This sub-slice improves explicitness and first-session orientation more than it improves "live machine feel" directly. Both reviewers noted this and the tier has been adjusted accordingly. It remains in scope because the north star requires that "structure reads without interpretation" — and domain colors that are only learnable through palette hover are a real first-session blocker.

**Required behavior:**
- A compact domain color legend is visible somewhere in the persistent workspace chrome (not a modal, not a separate help surface, not requiring any action to appear).
- The legend shows each domain name (`bits`, `symbol`, `integer`, `ec-point`) paired with its color swatch.
- The legend is consistent with the actual wire domain coloring in the current workspace.
- The legend does not compete visually with the canvas or the module nodes — it is a background reference element, not a prominent header.

**Constraint:**
The legend is read-only. It does not add interaction. It does not change wiring semantics.

---

### G — One-Gesture Label+Frame with Auto-Label Hint

**What it is:**
Two behaviors unified into one sub-slice:

**G1 — One-gesture label+frame:**
When the user has modules selected and presses F (or triggers Frame Selection), if no group box already tightly contains the selection, a group box is created around the selection AND the group box label field opens immediately for naming.

**G2 — Auto-label hint (formerly sub-slice H):**
When the label field opens (via G1 or any other group box creation path), if all enclosed modules share one module category, the label field is pre-populated with that category display name as an editable hint.

**Current state:**
Framing a selection and adding a labeled group box are three separate actions. New group boxes have blank labels even when the content is visually homogeneous.

**Required behavior — G1:**
- F with a selection creates a group box enclosing the selected modules AND opens the label input inline, focused and ready to type.
- If a group box already tightly contains the selection, F frames the viewport only (existing behavior) — no duplicate group box is created.
- If the user presses Escape after the group box is created but before typing a label, the group box is retained with an empty label (consistent with existing group box behavior). This Escape path is an explicit keep-empty, not an undo.
- The group box creation is one undo step. Typing and confirming the label is not part of the undo unit.

**Required behavior — G2:**
- On label field open, if all enclosed module instances share one module category, the label field is pre-populated with that category display name.
- The pre-population is a hint, not a commit. The user can edit, clear, or replace it before confirming.
- If enclosed modules span multiple categories, the label field opens blank.
- If no modules are enclosed, the label field opens blank.

**Constraint:**
The group box is a purely visual organizational element. Its creation does not change graph semantics, signal flow, or execution order. The hint is derived from module category metadata already present in the registry — it does not infer semantic meaning from signal values, params, or graph topology.

---

### I — Tick Pulse on Wires

**What it is:**
During ticked execution, when a tick fires and a wire carries a non-empty signal in that tick, a brief traveling animation highlight appears on that wire. The pulse travels from source port to target port and then disappears. This is not a persistent visual change — it is a momentary pulse synchronized to each tick transition.

**Current state:**
Ticked execution produces correct per-tick output visible in the output chips and the tick scrubber, but the timing is not felt. There is no visible indication of signal moving through the graph on each tick.

**Required behavior:**
- When the tick advances, every wire that carried a non-empty signal in the new tick fires a brief traveling pulse animation.
- The pulse uses the wire's domain color at elevated opacity, traveling from source anchor to target anchor over approximately 300–500ms.
- The pulse is a CSS/SVG animation layered over the static wire — it does not replace or modify the wire's permanent visual state.
- The pulse does not fire during stateless (non-ticked) execution.
- The pulse does not fire when the tick scrubber is held down and dragged rapidly — debounced or suppressed during fast scrub to prevent animation pile-up.
- The pulse can be disabled per workspace via the existing workspace display settings.

**Animation budget and density management:**
- Pulses are only rendered for wires **currently visible in the viewport**. Wires outside the viewport do not fire animations.
- If more than **24 wires within the viewport** would pulse simultaneously, the pulse behavior degrades: instead of traveling wire pulses, a compact node-halo effect appears on each module that received a non-empty signal in that tick. The halo is a brief glow around the node boundary rather than a traveling animation. This prevents a visual "flashbang" on 100+ module boards.
- The threshold of 24 is a starting value and may be adjusted during implementation; the contract requires that an explicit threshold exist and be documented in the shipping commit.
- The degraded (halo) mode is also acceptable as the default implementation of I if traveling pulse proves too expensive. The contract requires that *some* visible temporal signal exists — traveling pulse or halo, but not silence.

**Constraint:**
The pulse is purely visual. It does not change execution order, signal values, or timing semantics. It surfaces what the execution model already computes. The animation budget rules ensure it stays honest — it animates only what is visible, not everything that exists.

---

## Tier Ordering and Dependencies

Sub-slice A (error badges) is a soft dependency for sub-slice E (jump-to-first-error): E is most useful once A makes errors visible on the canvas. Both can ship independently; E alone is still useful as a navigation shortcut to Analyze's error list.

Sub-slice F (chip drag) benefits from sub-slice B (snap-preview) — chips that initiate drags should participate in the same snap behavior. F can ship before B but should be updated when B lands.

Sub-slice G1 (frame gesture) is a dependency for G2 (auto-label hint) within the same sub-slice. They ship together.

Sub-slice I (tick pulse) is independent of all others. It should not block any Tier 1–3 work.

---

## Implementation Notes

### Error badges and tooltip (A)
The execution result is already available in the reducer state after each run. The badge render is a conditional class on the existing canvas node component. The error category for the tooltip requires distinguishing four cases: (1) missing input — no upstream connection on a required input port; (2) type mismatch — upstream connection exists but signal type doesn't match; (3) upstream failure — the upstream module itself has no output; (4) invalid parameter — module-level param validation already runs in the UI layer. Categories 1–3 are derivable from execution result + connection state without engine changes. Category 4 requires routing existing param validation results to the same badge render path.

### Port hover snap (B)
The wire drag state machine already tracks hover proximity for port color changes. The snap preview extends that state with a `snapTarget` field (port reference or null). Snap zone: 20px engage, 24px release (hysteresis). Anti-hijack: if `distanceToNearest < 20` AND `distanceToSecondNearest < 20`, `snapTarget = null`. The preview renders the proposed connection path using the existing SVG path logic with a `snap-preview` CSS class.

### Connection drag from chip (F)
The signal chip components already know their source port. A pointer-down handler on the chip that calls the same wire-drag initiation as the port dot, passing the same source port reference. The chip's display behavior (signal value rendering) must not change at rest.

### Jump-to-first-error (E)
"First broken module in topological order" requires the topological sort already computed by the executor. The executor order is available in the execution result. Walk the order and find the first module whose output map has no valid signals. Invoke the existing Frame Selection path with that module selected, then push a previous-view entry.

### Splice-on-wire (D)
Build on the existing "insert bridge on type mismatch" pattern. The wire-proximity detection (12px threshold) should use screen-space distance to the closest point on the wire path, not bounding box. Render the splice preview using a distinct module ghost + two preview wire segments. On commit: dispatch one reducer action containing `removeConnection(original) + addModule(new) + addConnection(source→new) + addConnection(new→target)` as an atomic batch. Wire metadata transfer: copy bend/lane data to both replacement segments, truncated at the insertion point.

### One-gesture label+frame with hint (G)
Extend the existing F-key handler to check: does a group box already contain all selected modules? If not, create one via the existing group-box reducer action and then dispatch a "begin inline label edit" action for the new group box. The auto-label hint is computed in the label field's initialization: collect the set of module categories for all enclosed modules; if the set has exactly one member, pre-populate with that category's display name.

### Tick pulse (I)
The animation layer is a separate SVG overlay component. On each tick transition, it receives the diff: wires whose source module output changed from empty→non-empty or remained non-empty. Filter to viewport-visible wires. If the filtered count is ≤ 24, fire CSS `@keyframes` animations for each. If the count is > 24, fire node-halo animations instead. No store changes; the diff is computed from the ticked execution result already in store.

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass with `maxChunk` ≤ 450 KiB.
3. **A — execution failure:** A seeded project with a type-mismatch on a non-source module renders an error badge on that module; the badge clears when the mismatch is resolved.
4. **A — param failure:** A HexSource with an invalid hex parameter value renders an error badge; the badge clears when the parameter is corrected.
5. **A — no false badge:** A source module with a valid parameter and no upstream inputs does not show an error badge after successful execution.
6. **A — tooltip categories:** The badge tooltip for a type-mismatch module names the category `Type mismatch`; the badge tooltip for a module with a missing upstream connection names `Missing input`. The exact string is implementation-defined but the test must assert that the two cases produce distinguishable text.
7. **B — snap engage:** Hovering a compatible port within 20px during wire drag enters the snap-preview state and renders the preview connection.
8. **B — snap release:** Moving the drag tip more than 24px from the snapped port exits the snap-preview state and restores free-cursor behavior.
9. **B — anti-hijack:** When two compatible ports are both within 20px of the drag tip, the snap state is null (no snap preview, free cursor).
10. **B — rejection:** Hovering an incompatible port within 20px shows the rejection indicator.
11. **C — legend present:** The domain legend renders in workspace chrome with all four domain colors and names present.
12. **C — legend consistent:** The domain color swatches in the legend match the actual wire domain color CSS tokens used by the canvas.
13. **D — eligible splice:** Dropping an eligible single-data-input/single-data-output module onto a wire creates two new connections, removes the original, and places the module at the nearest point on the wire segment to the drop point.
14. **D — ineligible: multiple compatible ports:** Dropping a module with two compatible data input ports onto a wire results in normal placement with no auto-insertion.
15. **D — ineligible: control port exclusion:** Dropping a module with one bits data input, one bits data output, and one bits clock input onto a bits wire is treated as eligible (the clock port does not disqualify it).
16. **D — ineligible: crossing wires:** Dropping an eligible module over a point where two wires cross results in normal placement with no auto-insertion.
17. **D — undo atomicity:** The splice (connection removal + module placement + two new connections) reverses as a single undo step.
18. **E — jump to earliest:** With two broken modules in the graph, jump-to-first-error selects and frames the one that appears earlier in topological execution order.
19. **E — disabled when clean:** The jump-to-first-error action is disabled when no error badges are present.
20. **F — chip initiates drag:** A pointer-down on the output signal chip initiates a wire drag identical to a pointer-down on the port dot.
21. **F — chip value unchanged:** The signal chip continues to display the correct current output value after a drag was initiated and cancelled from it.
22. **G1 — create and open:** F with a selection that has no enclosing group box creates a group box around that selection and opens the label input inline.
23. **G1 — no duplicate:** F with a selection that is already enclosed in a group box frames the viewport without creating a new group box.
24. **G1 — Escape keeps box:** Escape during the open label input retains the group box with an empty label (not an undo).
25. **G2 — hint populated:** A new group box enclosing modules of exactly one category pre-populates the label field with that category's display name.
26. **G2 — hint blank on mixed:** A new group box enclosing modules of two or more categories opens with a blank label field.
27. **I — pulse fires:** In ticked mode, advancing the tick fires an animation on at least one wire that carried a non-empty signal in that tick.
28. **I — no pulse on empty wire:** A wire whose source had no output in the current tick does not fire a pulse animation.
29. **I — no pulse in stateless mode:** In non-ticked execution, no pulse animations fire.
30. **I — disable path:** Disabling the pulse in workspace display settings stops pulse and halo animations from firing on subsequent tick advances.
31. **I — fast scrub suppression:** Dragging the tick scrubber rapidly does not produce an unbounded queue of pending animations.

---

## Acceptance Criteria

This contract is complete when all of the following are true:

1. A broken module on the canvas is visible as broken without entering Analyze, and a hover over the badge reveals which error category applies.
2. Connecting a wire to a compatible port shows a snap preview before release; incompatible ports show a clear rejection; two adjacent compatible ports do not cause snap oscillation.
3. The wire domain color legend is always visible in workspace chrome without any user action.
4. Dropping a single-data-input/single-data-output module onto an unambiguous wire inserts it in place in one gesture; control ports and crossing wires do not trigger unintended insertions.
5. After execution with errors, one action pans to the topologically first broken module; the previous-view return path is preserved.
6. Dragging a wire can be initiated from the output signal chip; the chip's signal value display is unchanged at rest.
7. F with a selection creates a group box, opens the label field, and pre-populates a hint when the selection is categorically homogeneous.
8. In ticked mode, wire pulses or node halos are visible on each tick transition; the animation budget caps the effect on dense boards.
9. All sub-slices pass human review against both north star tests: "more explicit and correct" AND "more like directly shaping a live machine."

Criterion 9 requires a sign-off from the author or a designated reviewer — it is not automated. At ship time, the commit should include a reviewer note that evaluates each sub-slice against both halves of the test. A sub-slice that clearly satisfies only one half must be addressed before this criterion passes.

---

## What This Contract Does Not Promise

This contract makes failure **visible and categorized** on the canvas. It does not promise that a user can fully diagnose and fix every failure without Analyze — Analyze remains the authoritative diagnostic surface.

This contract does not claim to reach 100% of the north star standard — that standard is directional, not a checklist.

What remains after this contract ships:
- Building a new board from scratch still requires layout discipline on very dense boards (100+ modules).
- Mid-drag module insertion into the middle of a multi-hop routing path (as opposed to a single wire) is not addressed in V1.
- Splice-on-wire for modules with optional secondary ports requires a follow-on contract if that use case is important.
- Full traveling-pulse animation for all wires on a 100+ module board is not promised — the density threshold degrades to node halos at that scale.

---

## Shipping Notes

When this ships, update:

- `ACTIVE-DOCS.md`
- `IMPLEMENTATION-STATUS.md`
- `CLAUDE.md` "Genuine next open work" section
- `EXPERIENTIAL-NORTH-STAR-V1.md` north star realization estimate
