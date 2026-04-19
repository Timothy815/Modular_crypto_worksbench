# BRIDGE-FAMILY-COMPARISON-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `MISMATCH-POLICY-COMPARISON-TEACHING-V1.md`
- `REFERENCE-AWARE-CHAIN-TEACHING-V1.md`
- `HEX-BLOCK-PATH-TEACHING-V1.md`

This slice adds one compact comparison surface for the common representation bridges.

The teaching goal is:

**show whole-sequence bridges, ticked bridges, and collected return paths as one coherent bridge family.**

---

## Product Problem

MCW now teaches mismatch policy clearly, but a user still has to mentally piece together the bridge grammar from separate demos:

- whole ASCII sequence to whole bit sequence
- ASCII sequence to one character per tick
- one character per tick to one byte per tick
- hex-authored bit buffer to one byte per tick
- collected return to ASCII or hex

Those are all related moves, but they are not yet presented as one visible comparison surface.

---

## Strategic Principle

**Teach the bridge family as a reusable language, not as isolated tricks.**

That means:

- one shared comparison workspace
- one branch for whole-buffer ASCII to hex
- one branch for ASCII through ticked characters and collected return
- one branch for hex through ticked bytes and collected return

The user should be able to see:

- where authoring begins
- where ticking begins
- where collection closes the loop

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - `AsciiSequenceInput -> AsciiSequenceToBits -> BitsToHex -> HexOutput`
   - `AsciiSequenceInput -> AsciiSequenceToTicked + Clock -> AsciiCharToBits -> TickedBitsToSequence -> BitsToAscii -> TextOutput`
   - `HexSequenceInput -> BitsSequenceToTicked(wordWidth=8) + Clock -> TickedBitsToSequence -> BitsToAscii -> TextOutput`
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- XOR or other operators
- mismatch helpers
- decrypt branches
- a challenge
- hidden bridge shortcuts

This slice is about representation crossing only.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- the tutorial makes the differences between whole-buffer bridging, ticked bridging, and collected return explicit
- a user can read the common bridge grammar on one canvas without jumping between multiple demos

