# Wiring Ceremony Reduction V1

Last updated: April 21, 2026

Status: Shipped.

---

## Purpose

This contract defines the next ceremony-reduction slice for MCW.

The goal is to eliminate the remaining multi-step overhead in the most common pipeline-building gestures — specifically the gap between "I want this module next" and "the module is placed and wired."

## Product Problem

MCW has recently shipped several ceremony-reduction features:
- hover-to-sever wire button
- insert bridge on type mismatch (inline popup)
- pipeline starters (quick-start strip)
- mid-drag palette drop (drag wire → release on palette card → placed and wired)

These addressed the most obvious friction points. What remains is subtler but still real.

Current bottlenecks observed in normal use:

**Building a pipeline:**
- To extend the canvas with a new module, the user still needs to (a) land back on the palette, (b) click `+`, (c) drag the placed module to its intended position. Three steps for what feels like one thought.
- To swap a module type (trying XOR vs AND vs NAND), the user must delete the old module — losing all connections — place the replacement, then rewire from scratch.
- Editing a parameter requires selecting the module, opening the inspector, finding the field, editing, and clicking away. For simple scalar params (width, value, key) this is three times more work than the thought justifies.

**Connecting modules:**
- Long-distance connections require mouse precision across the full canvas. A missed port means starting over.
- There is no way to "arm" an output port and then complete the connection later with a single click on an input.

These are not vocabulary or layout problems. They are gesture-path problems: the user knows exactly what they want; the system makes them earn it too many times.

## Core Question

Can MCW reduce the most common pipeline-building gestures to the minimum number of intentional actions — without hiding the explicit machine structure that makes the workbench educational?

## Strategic Principle

**Shorten the path between intention and result. Never obscure the graph.**

That means:
- every module placed must still be visible and movable
- every connection made must still be explicit and inspectable
- shortcuts may accelerate placement and wiring but must not infer destinations the user didn't choose
- the workbench must feel like a fast instrument, not a wizard

This is not:
- auto-layout by stealth
- connection inference from module names or types
- abstract macro recording
- anything that produces hidden graph structure

---

## Five Bounded Features

Each feature below is a discrete, shippable slice. They are ordered by estimated impact. They may be implemented sequentially or the highest-value ones selected first.

---

### Feature 1 — Drag From Port to Empty Canvas (Quick-Add)

**What it is:**
While dragging a wire from any output port, if the user releases the mouse on empty canvas space (not on a port or module), a small filtered popup appears at the drop point. The popup lists only modules with at least one compatible input port. Clicking a module name places it at the drop position and wires the first compatible input automatically.

**Why it matters:**
This is the most natural node-editor gesture. It eliminates the palette entirely for the most common workflow (extend the pipeline forward). The user never has to switch focus to the palette panel, find the module, click `+`, then drag the new module back into position.

**Interaction:**
1. Start dragging from an output port
2. Release over blank canvas space
3. A small popup appears at the release point, showing only type-compatible modules — grouped and searchable
4. Click any entry → module is placed at the drop position and wired
5. Press Escape or click outside → cancel, no placement

**Include:**
- shows only modules whose first compatible input port matches the dragged output type
- places module at the exact canvas drop point
- wires the first matching input port automatically
- integrates with undo/redo as a single `insertModuleAndConnect` action
- works for both `bits` and `symbol` output types

**Exclude from V1:**
- drag from input port (forward-only for now)
- multi-port connection in a single gesture
- smart layout repositioning of surrounding modules
- custom port selection within the popup

---

### Feature 2 — Replace Module in Place

**What it is:**
A "Replace with…" action on any selected module. Opens a filtered palette search. Choosing a replacement swaps the module definition while preserving all connections whose port names and types still match between the old and new definition. The replacement lands at the same canvas position with the same layout orientation.

**Why it matters:**
Iterating on primitive choice — trying XOR vs AND, comparing AddMod vs XOR for diffusion, swapping a Rotor for a RotorReverse — currently requires delete + replace + full rewire. For modules with one or two connections this is annoying; for a heavily wired module it is a full rebuild. Replace-in-place turns this into a single action.

**Interaction:**
1. Select a module on the canvas
2. Invoke "Replace with…" (right-click context menu entry, or a button in the inspector header)
3. A small inline search popup appears, scoped to the palette
4. The user picks a replacement definition
5. The module is swapped; connections that match by port name and type survive; connections that don't are removed; the canvas position and orientation are preserved

**Include:**
- connection survival based on exact port name + type match
- removed connections shown briefly as a transient warning (e.g., a count badge: "2 connections removed") before disappearing
- undo/redo as a single atomic `replaceModule` action
- works for primitive and composite module instances

**Exclude from V1:**
- fuzzy port name matching
- interactive "map old ports to new ports" remapping UI
- batch replace-all across multiple selected modules of the same type

---

### Feature 3 — Inline Parameter Editing on Canvas Nodes

**What it is:**
For modules with a single dominant parameter (a `bits` width, a hex value, a key string, an integer constant), clicking the displayed parameter value directly on the canvas node opens a compact inline text editor in place — no inspector required. Pressing Enter or clicking away commits the change.

**Why it matters:**
The inspector round-trip (select module → inspector opens → scroll to field → edit → click away) is unnecessary overhead when the intended edit is "change this width from 8 to 16." For common modules like `BitSource`, `KeyInput`, `XOR`, `BitShifter`, `AddMod`, `ModExp`, and similar scalar-param modules, the dominant parameter is already visible on the node label. Clicking it directly is the obvious gesture.

**Include:**
- a curated allow-list of eligible modules and their single inline-editable parameter
- inline text input overlaid on the node at the param display position
- Enter / Tab to commit; Escape to cancel
- same validation as the inspector (rejects out-of-range, wrong type, etc.)
- undo/redo as a single `setModuleParam` action

**Eligible modules in V1 (suggested):**
- `BitSource` → `bits` value
- `KeyInput` → `key` hex value
- `IV`, `Nonce`, `Salt` → `value` hex
- `XOR` → `width`
- `BitShifter` → `shift`
- `AddMod`, `SubMod`, `MulMod`, `Modulo` → `modulus`
- `ModExp`, `ModInverse` → `modulus`
- `Counter` → `max`

**Exclude from V1:**
- inline editing of structured params (permutation tables, rotor wiring, S-box grids)
- inline editing for composite or iterator instances
- multi-field inline editing
- inline editing triggered from the inspector

---

### Feature 4 — Click-to-Connect (Arm and Complete)

**What it is:**
Clicking an output port without dragging "arms" it. The port glows to show it is armed. The user can then scroll the canvas, zoom, do whatever they need, and then click any compatible input port to complete the connection. Pressing Escape or clicking empty canvas cancels.

**Why it matters:**
Long-distance connections are the hardest drag gesture in the workbench. Connecting a `KeyInput` at the top of a large machine to a `Rotor` at the bottom requires precise dragging across a large scrolled canvas. Click-to-connect removes the drag requirement for these long paths, replacing it with two precise single clicks.

**Interaction:**
1. Click (not drag) an output port → port glows, status bar shows "Wiring from ModuleId.port — click a compatible input to connect, Escape to cancel"
2. The canvas behaves normally — the user can scroll, zoom, inspect
3. Compatible input ports glow as targets (same logic as the existing drag-wiring system)
4. Click any compatible input → connection made
5. Escape or click empty canvas → cancel, no connection made

**Include:**
- reuses existing `pendingConnection` state and target-port validation logic
- no new connection types or special behavior — same validation, same store action
- visual state identical to mid-drag (compatible ports glow, incompatible ports dim)
- Escape key cancels
- clicking another output port while armed switches the armed port (replaces, does not accumulate)

**Exclude from V1:**
- clicking multiple outputs to create a fan-out in one gesture
- keyboard navigation between ports
- named "wiring mode" that persists across module selections

---

### Feature 5 — Drag Module From Palette to Canvas

**What it is:**
Instead of clicking `+` (which places at an auto-computed position) and then dragging the placed module to the desired position, the user can drag a palette card directly onto the canvas and release it at any position. The module is placed at the drop point.

**Why it matters:**
Position matters in MCW. Modules placed in the wrong location must be immediately moved, which adds a step to every placement. The current `+` button is fast but position-blind. Drag-from-palette is the natural complement: fast placement *and* precise positioning in one motion.

**Interaction:**
1. Mouse-down on a palette card and begin dragging
2. If the mouse moves more than a small threshold while held, enter drag-to-canvas mode
3. A ghost node (translucent card) follows the cursor
4. When the cursor is over the canvas, the ghost appears at the canvas drop position
5. Release → module placed at that canvas position
6. If released outside the canvas, cancel (no placement)

**Include:**
- ghost node sized and styled like a real canvas node
- snap to grid if snap-to-grid is enabled
- snap to guide rails if snap-to-guides is enabled
- placement at cursor canvas position
- undo/redo as a single `addModule` action with explicit position

**Exclude from V1:**
- drag-to-canvas that simultaneously connects (that is Feature 1)
- drag reordering within the palette itself
- multi-card drag
- drag from the compact palette view (expanded view only, or both — implementer's choice)

---

## Implementation Notes

### Shared infrastructure

Features 1 and 4 both use the existing `pendingConnection` / `insertModuleAndConnect` infrastructure introduced in the mid-drag palette drop slice. Feature 1 adds a canvas-drop trigger; Feature 4 adds a click-arm trigger. The core state machine is the same.

Feature 2 needs one new store action: `replaceModule` — remove the old instance, add the new instance at the same position, recreate surviving connections.

Feature 3 needs one new UI state: `inlineParamEdit: { moduleId, paramKey } | null` — rendered as an absolutely-positioned input overlay on the canvas node.

Feature 5 is largely UI-only: drag state tracked in palette, ghost node rendered in a portal over the canvas, `addModule` dispatched on drop.

### Order of implementation

If implementing sequentially, the recommended order is:
1. **Feature 1** (drag-from-port) — highest ceremony reduction, reuses existing infrastructure
2. **Feature 2** (replace in place) — high value during tutorial and challenge iteration
3. **Feature 4** (click-to-connect) — addresses long-distance connection friction
4. **Feature 3** (inline param edit) — polishes the most-repeated small task
5. **Feature 5** (drag-from-palette) — lowest delta over current `+` button, but completes the placement model

### Boundaries

- None of these features change the engine layer
- None introduce new signal types or module semantics
- All are store + UI only
- All integrate with existing undo/redo (workspace history)
- None require new persistence schema changes

---

## What This Is Not

This contract does not propose:
- auto-wiring entire pipelines from a description
- layout inference or automatic graph arrangement
- wizard-style guided placement
- any behavior that produces graph structure the user cannot directly inspect and modify
- changes to how execution, validation, or analysis work

The workbench must remain an explicit instrument. These features make playing it faster, not easier to ignore.

---

## Shipped Outcome

This contract is now implemented on `main`.

Shipped behavior includes:
- drag from an output port into empty canvas to open a compatible quick-add popup and insert+wire in one action
- `Replace with…` in the inspector, preserving same-name same-type connections where possible
- inline on-canvas editing for a bounded allow-list of dominant scalar parameters
- click-to-connect by arming an output port on click and completing on a later compatible input click
- drag-from-palette placement onto canvas with ghost preview and explicit drop position

Implementation landed across the existing UI/store surfaces rather than as one isolated commit:
- `src/ui/components/workbench-panel.tsx`
- `src/ui/components/primitive-palette.tsx`
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/store.ts`
- `src/App.tsx`
