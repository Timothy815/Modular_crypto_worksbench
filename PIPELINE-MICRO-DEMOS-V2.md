# PIPELINE-MICRO-DEMOS-V2

Last updated: April 11, 2026

Status: Shipped

## Purpose

Define the second bounded **pipeline micro demo** slice for MCW.

This follow-on expands the first end-to-end composition set so the most important sequence workflows are demonstrated as complete, editable, honest machines rather than implied by isolated primitive demos.

V1 proved that the new sequence, bridge, collector, and mismatch helpers can compose.
V2 should prove that they are usable for the most common real authoring goals:
- ASCII key/message encryption and decryption
- visible repeated-key workflows
- visible strict-length workflows
- visible hex/block preparation and recovery workflows

## Why Now

The current pipeline line is structurally sound, but still slightly narrow.

Right now MCW demonstrates:
- repeated-key XOR in one direction
- strict match before XOR
- truncate-to-block
- pad-to-block
- one representation round-trip

That is enough to prove architectural honesty.
It is not yet enough to make the sequence system feel complete to a user trying to answer:
- how do I encrypt and then decrypt with a repeated ASCII key?
- how do I work in hex while still staying in the real bit domain?
- how do I normalize a short or long buffer before a block-oriented operation?
- how do I see both the forward and reverse path without inventing the graph myself?

This is an ergonomics problem, not an engine problem.

## Core Question

Can MCW add a small second wave of end-to-end workflow demos that make the new sequence pipeline feel complete, without turning Quick Start into a large tutorial catalog?

## Strategic Principle

**Cover the workflows people actually try first.**

That means:
- keep the demo count bounded
- prioritize authoring patterns over theoretical completeness
- stay end-to-end, compact, and editable
- make encryption/decryption symmetry visible where the workflow naturally has it
- keep paired paths visually separated in the seeded layout so forward and reverse halves read clearly

## Relationship To Existing Work

This slice extends:
- `PIPELINE-MICRO-DEMOS-V1`
- `STRUCTURED-SEQUENCE-SIGNAL-MODEL-V1`
- `BIT-AND-HEX-SEQUENCE-BRIDGES-V1`
- `TICKED-TO-SEQUENCE-COLLECTORS-V1`
- `REPRESENTATION-TO-OPERATIONAL-BRIDGES-V1`
- `REPEAT-TO-MATCH-V1`
- `TRUNCATE-TO-MATCH-V1`
- `PAD-TO-MATCH-V1`
- `REQUIRE-LENGTH-MATCH-V1`

V2 should remain clearly separate from:
- flagship demos
- tutorials
- challenges
- long prose onboarding flows

The purpose here is still compact composition truth.

## Locked V2 Additions

V2 is locked to **3-4 new pipeline demos** beyond the V1 set.

The recommended locked additions are:
1. ASCII repeated-key XOR encrypt/decrypt
2. ASCII strict-match XOR encrypt/decrypt
3. hex-authored block XOR workflow
4. hex-authored normalize-then-XOR workflow

If one item must be deferred, defer item 4 before any of the others.

## Include

This slice should include:
- 3-4 new entries in the existing pipeline micro demo registry
- concise summary copy focused on the workflow question being answered
- explicit pipeline strings for each new workflow
- seeded layouts that remain compact and legible
- examples that visibly use bridges, collectors, and mismatch helpers where required

## Exclude

Do not include in V2:
- automatic “recommended next demo” sequencing
- challenge conversion
- long tutorial copy attached to demos
- every possible bridge permutation
- protocol-scale or lab-scale machines
- hidden “encrypt/decrypt mode” toggles inside one demo

## Core Rules

1. **Each new demo must answer a specific workflow question**
- “How do I encrypt and then decrypt an ASCII message with a repeated key?”
- “How do I keep strict length behavior visible in both directions?”
- “How do I author hex, operate on bits, and recover a hex-visible result?”
- “How do I normalize block width before the operation instead of relying on hidden coercion?”

2. **Encryption/decryption symmetry must stay graph-visible**
- if a workflow includes decrypting, the reverse path should be shown as an explicit second half of the graph or as a clearly paired branch
- do not hide decryption in an output formatter or inspector-only interpretation

3. **Representation and operation layers must stay distinct**
- ASCII and Hex may author or display
- operational transforms must still happen in `bits`
- no new hidden bridge behavior is allowed

4. **Mismatch policy must remain explicit**
- repeated-key examples must visibly use `RepeatSymbolToMatch` or `RepeatBitsToMatch`
- strict examples must visibly use `RequireSymbolLengthMatch` or `RequireBitsLengthMatch`
- normalize-before-block examples must visibly use `Truncate*ToMatch`, `Pad*ToMatch`, or a clear composition of both

5. **Examples must remain compact**
- one screen at normal zoom on a typical laptop
- avoid branching into full protocol architectures
- prefer one transformation family per demo
- if a workflow includes both encrypt and decrypt halves, the seeded layout should keep those halves visually separated

## Recommended New Demo Shapes

### 1. ASCII repeated-key XOR encrypt/decrypt

Recommended shape:
- `AsciiSequenceInput(plain) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(a)`
- `AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=plain) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput(cipher)`
- and a paired reverse path
- `HexSequenceInput(cipher) -> BitsSequenceToTicked(wordWidth=8) -> XOR(a)`
- `AsciiSequenceInput(plain-length-reference) -> visible length-only reference role`
- `AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=plain-length-reference) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR(b)`
- `XOR -> TickedBitsToSequence -> BitsToAscii -> TextOutput(recovered)`

Purpose:
- shows the complete visible encrypt/decrypt loop for the most common classroom repeated-key workflow
- proves that ASCII authoring, bit-domain XOR, hex-visible ciphertext, and ASCII recovery all compose honestly

Implementation note:
- V2 explicitly chooses the visible known-length reference path for the decrypt half
- do not hide decrypt-side alignment behind a byte-count derivation companion in this slice
- the reference-only input should be visually marked as contributing length rather than recovered data

### 2. ASCII strict-match XOR encrypt/decrypt

Recommended shape:
- same overall encrypt/decrypt structure as the repeated-key demo
- but use `RequireSymbolLengthMatch` instead of repeat helpers on the ASCII key path

Purpose:
- shows the difference between repair and assertion in a complete workflow instead of an isolated prefix check
- teaches that strictness is a graph decision, not an XOR behavior

### 3. Hex-authored block XOR workflow

Recommended shape:
- `HexSequenceInput(leftBlock) -> BitsSequenceToTicked(wordWidth=8) -> XOR(a)`
- `HexSequenceInput(rightBlock) -> BitsSequenceToTicked(wordWidth=8) -> XOR(b)`
- `XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput`

Purpose:
- demonstrates the cleanest visible hex-to-bits operational path without detouring through ASCII
- gives users a small honest block-domain pattern for nibble/byte-oriented work

### 4. Hex-authored normalize-then-XOR workflow

Recommended shape:
- `HexSequenceInput(buffer) -> HexSequenceToBits -> TruncateBitsToMatch(reference=block, side=...) -> PadBitsToMatch(reference=block, side=..., padBit=...)`
- `reference block path -> HexSequenceToBits`
- both into `BitsSequenceToTicked(wordWidth=8)` branches
- then `XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput`

Purpose:
- proves that block-width normalization remains visible even when the authoring layer is hex
- helps users see the difference between representation width and operational width
- proves the composed normalize path explicitly instead of implying “pick whichever helper applies”

## UI Surface Guidance

These demos should remain in the same Quick Start pipeline micro demo surface introduced in V1.

Do not create:
- a second launcher
- a new tab
- a hidden submenu only for “advanced” demos

The right move is to deepen the existing pipeline surface, not fragment it.

If the list grows too long, the answer is light grouping or ordering, not a new subsystem.

## Naming Guidance

Use names that answer a user task, not internal implementation language.

Good examples:
- `ASCII Repeated-Key XOR Encrypt/Decrypt`
- `ASCII Strict-Match XOR Encrypt/Decrypt`
- `Hex Block XOR`
- `Hex Normalize Then XOR`

Avoid names that are technically correct but weaker pedagogically:
- `Bridge + Collector Example`
- `Reference-Driven Hex Workflow`
- `Bits Sequence Composition 2`

## Validation Expectations

This slice should add focused tests for:
- registry coverage of the expanded V2 demo set
- preserving the intended graph shape of each new workflow
- ensuring encrypt/decrypt paired examples remain honest about bridges and mismatch policy
- ensuring all new demos validate and execute without runtime failure

## Success Criteria

This slice is successful when:
- MCW can show the most common ASCII and hex sequence workflows as compact honest machines
- users can see both one-way and paired encrypt/decrypt sequence paths without inventing them from scratch
- the Quick Start pipeline demos feel materially more complete without becoming bloated
- the product remains explicit about bridge boundaries, mismatch policy, and collection

## Explicitly Avoid Next

Do not let this slice drift into:
- full “recipe book” coverage of all data-type permutations
- inspector redesign
- module-library taxonomy redesign
- automatic graph synthesis

Those are follow-on ergonomics slices, not part of this one.
