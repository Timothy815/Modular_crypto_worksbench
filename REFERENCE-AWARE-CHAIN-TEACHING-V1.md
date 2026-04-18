# REFERENCE-AWARE-CHAIN-TEACHING-V1

Last updated: April 18, 2026

Status: Shipped on `main`

---

## Purpose

Define one bounded teaching follow-on after:

- `CANONICAL-CHAIN-INSERTION-STAGE3-V1.md`
- `CANONICAL-CHAIN-INSERTION-STAGE3B-V1.md`

The new reference-aware repair path is now authorable, but it still needs one compact teaching surface that makes the machine shape legible without asking users to build it from memory.

This slice adds:

- one seeded demo project
- one matching starter tutorial

The teaching goal is simple:

**show the repeated-key repair as a visible machine, not just as a popup affordance.**

---

## Product Problem

MCW can now insert:

- `RepeatSymbolToMatch`
- `AsciiSequenceToTicked`
- `AsciiCharToBits`

as one explicit repaired chain when a short ASCII key must be expanded to match a message before entering a bit-scalar operator.

That solves the authoring ceremony problem.

What is still missing is a compact answer to the next user question:

- what did the repair actually build?
- where does the message provide the reference length?
- where does the key become repeated text?
- where does the graph finally cross into 8-bit words?

Without one visible example, the repair feature is faster than the product language around it.

---

## Strategic Principle

**Teach the repaired shape directly.**

That means:

- the seeded project must already contain the fully explicit repaired graph
- the tutorial must point at the message branch, repeated-key branch, bridge modules, operator, and collected result
- no hidden invalid connection state is required inside the seeded project

This slice is about reading and understanding the repaired machine once it exists.

---

## Include

V1 includes exactly:

1. one compact demo project showing:
   - an ASCII message sequence
   - a shorter ASCII key sequence
   - `RepeatSymbolToMatch(reference=message)`
   - visible ASCII-to-ticked and ASCII-to-bits bridge steps
   - one ticked XOR path
   - one collected hex-visible result
   - one visible output showing the expanded repeated key sequence
2. one starter tutorial tied to that demo
3. one short implementation-status note

---

## Exclude

Do not include:

- a second encrypt/decrypt branch
- a challenge
- a new popup surface
- automatic replay of the failed connection attempt
- a full flagship lab
- any new chain insertion semantics

This slice is deliberately smaller than `PIPELINE-MICRO-DEMOS-V2`.

---

## Demo Shape

The demo should use this visible shape:

- `AsciiSequenceInput(message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=message)`
- `RepeatSymbolToMatch -> TextOutput(expanded key preview)`
- `RepeatSymbolToMatch -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `Clock -> both tick bridges and collector`
- `XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput`

The message branch and repeated-key branch should be visually separated enough that the user can read:

- which sequence is the reference
- which sequence is being expanded
- where both branches become one ticked 8-bit word stream

---

## Tutorial Shape

The tutorial should answer these questions in order:

1. Which sequence is the message?
2. Which sequence is the shorter key?
3. How does `RepeatSymbolToMatch` make the dependency visible?
4. Where do the two branches turn into one ASCII character per tick?
5. Where do the ASCII characters become 8-bit words?
6. Where is the collected ciphertext read back in hex?

The tutorial should describe the graph as a machine the user can rebuild manually after seeing the demo once.

---

## Exit Condition

This slice is complete when:

- the new seeded project validates and executes
- the tutorial targets only real modules in that project
- the repeated-key repair path is legible on canvas without opening a contract document

