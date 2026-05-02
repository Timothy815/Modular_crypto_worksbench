# STRICT-LENGTH-POLICY-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `REQUIRE-LENGTH-MATCH-WORKFLOW-POLISH-V1.md`
- `REFERENCE-AWARE-CHAIN-TEACHING-V1.md`

MCW now teaches the visible repair path for a short ASCII key.
This slice adds the equally important policy companion:

**a compact seeded workspace that shows strict visible matching as a graph decision, not an XOR behavior.**

---

## Product Problem

The product now has two honest mismatch families:

- repair helpers that visibly adjust length
- require helpers that visibly refuse to proceed when lengths differ

That is the right architecture.

What is still missing in the seeded demo/tutorial surface is a compact answer to:

- what does the strict path look like when it is the chosen policy?
- where does the key get checked against the message before ticking begins?
- how is that different from the repair path?

The user should be able to open one small machine and see both choices:

- the strict branch that is allowed to continue only because lengths already match
- the alternative repair branch that would repeat a shorter key instead

---

## Strategic Principle

**Teach policy choice, not just pipeline shape.**

That means:

- the strict helper must be a visible module in the live path
- the strict path must stay executable in the seeded project
- the repair alternative must appear beside it as an explicit branch, not as prose alone

This slice is not about making the seeded project fail.
It is about making the difference between `require` and `repair` legible on canvas.

---

## Include

V1 includes exactly:

1. one compact seeded demo project showing:
   - an ASCII message
   - an equal-length ASCII key through `RequireSymbolLengthMatch`
   - explicit ASCII tick bridges and `AsciiCharToBits`
   - ticked XOR, collection, and hex output
   - one separate shorter-key repair branch using `RepeatSymbolToMatch(reference=message)` and a text preview sink
2. one matching starter tutorial
3. one short implementation-status note

---

## Exclude

Do not include:

- a failing seeded project
- automatic branch switching
- a challenge
- a second decrypt half
- new strict-helper semantics

This remains a compact teaching slice.

---

## Demo Shape

The demo should use this shape:

- `AsciiSequenceInput(message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(strict key) -> RequireSymbolLengthMatch(reference=message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput`
- and a visible sibling branch:
  - `AsciiSequenceInput(short key) -> RepeatSymbolToMatch(reference=message) -> TextOutput`

The lower repair branch is present to show the alternative the strict helper deliberately refuses to perform.

---

## Tutorial Shape

The tutorial should answer these questions in order:

1. Which sequence is the message?
2. Which key is already valid for strict matching?
3. Where does `RequireSymbolLengthMatch` make the policy visible?
4. Where do both strict-path branches become one character per tick?
5. Where do the characters become 8-bit words before XOR?
6. Where is the collected ciphertext read back in hex?
7. Where is the visible repair alternative if the key were shorter?

The tutorial should frame the lower branch as a different graph decision, not as a hidden fallback.

---

## Exit Condition

This slice is complete when:

- the seeded project validates and executes
- the tutorial points only at real modules in that project
- a user can see, on canvas, the difference between strict matching and visible repair without opening the contracts

