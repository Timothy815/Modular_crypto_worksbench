# Canonical Chain Insertion Stage 2A V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

This contract defines the next bounded follow-on after `CANONICAL-CHAIN-INSERTION-V1.md`:

**surface the already-shipped canonical chains earlier, at the moment a user hovers an unconnected input port, without inserting anything automatically and without broadening the chain registry.**

The goal is to reduce the gap between:

- "this input clearly belongs in a known pipeline role"
- and "the user can see the common explicit next chains immediately"

---

## Product Problem

Stage 1 solved one repeated ceremony path:

- drag from an output port
- release on empty canvas
- choose a named chain from quick add

That helps once the user has already committed to wiring from a source.

But there is still a common earlier moment of hesitation:

- the user hovers an empty input port
- they know the target needs something explicit upstream
- they still have to infer whether the next honest move is a source, a bridge, or a small canonical chain

The palette already biases likely single modules for hovered input ports.

The missing follow-on is:

**show the small canonical chain options that are already known-good for that hovered port context, before the user starts a drag gesture.**

---

## Strategic Principle

**Suggest structure earlier. Do not insert structure implicitly.**

That means:

- hovered-port chain suggestions are suggestive only
- the user must still click a named chain intentionally
- the inserted result must still be ordinary visible modules and wires
- the chain set must remain the same bounded registry unless separately expanded by contract

This is not:

- automatic chain insertion on hover
- widening the chain registry
- reference inference
- mismatch repair logic

---

## V1 Product Shape

When the user hovers an unconnected input port on the canvas, the palette may show a small `Common chains` strip above the ordinary module results.

That strip shows only canonical chain options whose **end port shape** matches the hovered input port’s expected signal shape.

Clicking one option inserts the same explicit chain shape used by Stage 1 and attaches the chain’s tail to the hovered input, leaving the chain head exposed upstream for the next move.

---

## Surface

This slice adds one surface only:

### Hovered-input `Common chains` strip

- appears only while an unconnected input port is hovered
- renders above the main palette search/results area
- lists only matching canonical chains
- disappears immediately on hover end

No other surfaces are included in this slice.

---

## Chain Set

This slice reuses the existing shipped Stage 1 chain registry exactly:

- `ASCII sequence -> bit words`
- `Collect ticked bits -> ASCII`
- `Collect ticked bits -> hex`

No new chains are added here.

In particular:

- no single-module shortcuts are added
- no reference-dependent chains are added
- no width-parameterized chains are added

---

## Matching Rules

### Rule 1 — Match by hovered port expectation, not by arbitrary nearby graph intent

The strip should appear only when the hovered input port has a clear expected signal shape:

- `type`
- `kind`

Only chains whose `endPortShape` matches that expectation may appear.

### Rule 2 — Suggestions remain additive

The palette’s ordinary hovered-port source and bridge suggestions remain visible.

The `Common chains` strip is an additional section, not a replacement for the ordinary results.

### Rule 3 — Suggestions target the hovered input only

The inserted chain is chosen because its **output** can feed the hovered input directly.

This slice does not attempt to infer the ideal upstream source.

### Rule 4 — No hidden reverse inference

The system may not inspect distant graph branches to infer a target chain.

This slice is keyed only from the hovered input port’s expected upstream shape.

### Rule 5 — Reuse Stage 1 insertion behavior

Clicking a hovered-port chain suggestion must use the same `insertChain` path and deterministic placement rules already shipped in Stage 1.

The only Stage 2A addition is that the inserted chain attaches its tail to the hovered input port while leaving its head unconnected.

### Rule 6 — Keep the chain list short

If no canonical chains match, the strip does not render.

If more than one chain matches, show them in alphabetical label order.

Do not scroll a long chain list in this strip.

---

## Include

- one `Common chains` strip above palette results for hovered unconnected input ports
- reuse of the existing canonical chain registry
- reuse of the existing atomic `insertChain` insertion path
- no engine changes

---

## Exclude From V1

- mismatch-repair popup chain offers
- reference-dependent chains
- graph-proximity rules for selecting a reference source
- any new chain registry entries
- any automatic insertion on hover
- any chain insertion from incompatible hovered ports

---

## Best Next Follow-On

After this slice, the next coherent follow-on would be:

- `CANONICAL-CHAIN-INSERTION-STAGE2B-V1`

That follow-on would cover mismatch-repair popup chain offers only after the repair surface is separately tightened.

Reference-dependent chains remain separate work and need their own contract.

---

## Why This Slice Matters

Stage 1 made canonical chains fast once the user had already started wiring.

Stage 2A makes those same chains discoverable earlier:

- while inspecting an empty input
- without requiring a wire drag first
- without changing the explicit graph model

That is the right next step because it improves discoverability and ceremony together, while staying inside the already-shipped chain registry and insertion semantics.
