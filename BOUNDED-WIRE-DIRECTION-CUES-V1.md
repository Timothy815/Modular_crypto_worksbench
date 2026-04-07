# BOUNDED-WIRE-DIRECTION-CUES-V1

Status: Shipped on `main`.

## Goal

Improve signal-flow readability in dense workspaces by showing **direction cues only when a wire is under active attention**.

This slice is not about putting arrows on every wire. It is about making the direction of a currently relevant path easier to read without turning the canvas into a traffic diagram.

---

## Why

MCW now supports:
- orthogonal routing
- manual bend editing
- lane preference
- multi-anchor orthogonal wire authoring
- per-port side assignment

That means complex workspaces can be made cleaner than before, but users still need a fast way to answer:

- where is this signal going?
- which way is this feedback path flowing?
- am I reading this trace correctly?

Global always-on arrows would add too much noise. A bounded active-only treatment is the right next step.

---

## Product Shape

Direction cues appear only on:
- hovered wires
- selected wires
- trace-emphasized wires

Direction cues do **not** appear on every wire by default.

The cues should feel like transient reading assistance, not permanent diagram furniture.

---

## Required V1 Behavior

1. A hovered wire shows subtle repeated direction indicators along the visible path.
2. A selected wire shows the same indicators more clearly than hover-only.
3. A trace-emphasized wire may also show the indicators, but must remain visually subordinate to explicit selection when both states overlap.
4. Direction indicators must follow the rendered wire path direction from source to target.
5. Curved and orthogonal routing modes must both be supported.
6. The cues must work with:
   - default wire colors
   - neutral mode
   - high-contrast mode
   - per-wire color overrides
7. Direction cues must never interfere with:
   - wire selection
   - wire hover
   - bend handles
   - anchor handles
   - reconnect targeting
8. If multiple visual states apply, precedence must remain:
   - invalid / comparison / trace / selected path styling first
   - direction cues layered on top as a reading aid

---

## Non-Goals

This V1 does **not** include:
- always-on arrows for all wires
- semantic arrowheads at every endpoint
- animated flow
- direction labels on nodes
- wire path changes
- persistence or schema changes

---

## UX Constraints

1. The cues must be visually lighter than the wire itself.
2. They must be readable without becoming the dominant graphic.
3. They must not create visual chatter at dense crossings.
4. They must not make inactive wires harder to ignore.
5. The spacing of repeated cues should be deterministic so they do not shimmer or jump while dragging nearby nodes.

---

## Implementation Bias

Preferred V1 implementation:
- presentation-only
- CSS/SVG marker or repeated path decoration approach
- no engine changes
- no new workspace metadata

The implementation should reuse existing selected / hovered / trace wire state rather than introduce a new wire mode.

---

## Acceptance Standard

The slice is successful if:
- hovered and selected wires are easier to read directionally in dense regions
- the canvas does not become busier when no wire is under active attention
- no reconnect or handle interaction regressions are introduced

