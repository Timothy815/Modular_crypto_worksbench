# HEX-BLOCK-PATH-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `STRICT-LENGTH-POLICY-TEACHING-V1.md`
- `PIPELINE-MICRO-DEMOS-V2.md`

This slice adds one compact seeded workspace and one walkthrough for the hex-authored block path.

The teaching goal is:

**show the clean byte-word XOR path and the explicit normalize-before-block variant side by side.**

---

## Product Problem

MCW now teaches:

- visible repeated-key repair
- visible strict matching

What still needs a compact seeded explanation is the bit-domain workflow that starts from hex:

- how do two equal-width hex blocks enter a ticked byte-word XOR path?
- what changes when one side is not already block-aligned?
- where do truncate and pad live when normalization must be explicit?

The product already has the modules and micro demos.
This slice adds the smallest seeded workspace that makes the comparison readable on canvas.

---

## Strategic Principle

**Teach the clean path and the repaired path together.**

That means:

- the top branch should show the direct equal-width block XOR path
- the lower branch should show the normalize-before-block path using visible mismatch helpers
- both branches should end in readable hex output

This is about authoring truth, not new semantics.

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - a direct `HexSequenceInput -> BitsSequenceToTicked(wordWidth=8) -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput` path
   - a second path where a shorter hex buffer is normalized with `TruncateBitsToMatch` and `PadBitsToMatch` before entering the same byte-word XOR structure
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- a decrypt half
- a challenge
- a new authoring popup
- nibble-width variants
- hidden normalization

This slice stays focused on byte-word block authoring from hex.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- the walkthrough clearly distinguishes direct block XOR from normalize-then-XOR
- a user can see where representation authoring stops and explicit bit-domain processing begins

