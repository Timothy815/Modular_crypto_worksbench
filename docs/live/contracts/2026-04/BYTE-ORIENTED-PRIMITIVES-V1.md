# Byte-Oriented Primitives V1

## Status

Shipped in `v1.40.0`.

## Purpose

Deepen MCW's modern-construction language so it can express byte- and word-level structure honestly without forcing students to hand-wire every transformation as raw bit slicing and recombination.

This slice exists to solve the next strategic product gap after `v1.39.0` and now frames the local `v1.40.0` slice:
- framing and visible block chaining are shipped
- key routing and recursive key-schedule depth are shipped
- modern toy rounds already exist
- MCW still makes byte- and word-level transforms more tedious than they should be for modern cipher teaching

The goal is not to ship AES, ChaCha, or SHA as black-box presets.
The goal is to add one bounded byte/word vocabulary slice that gives MCW a few honest missing words for modern machine structure.

## Strategic Principle

**Byte- and word-level structure must remain explicit transforms, not hidden reinterpretation of the `bits` domain.**

That means:
- signals stay on the existing `bits` domain
- width expectations should remain inspectable
- the graph should show when a machine is rotating bytes, swapping byte order, or splitting one word into visible byte lanes
- no hidden “treat this as bytes” mode flag should rewrite module semantics behind the scenes

## Why Now

MCW now has:
- explicit framing and chaining
- explicit round structure and key schedules
- bit-domain substitution, permutation, and shifting primitives
- bridge ergonomics strong enough for byte-oriented inputs and outputs

That means the next honest step is not authenticated encryption and not a giant “modern cipher pack.”
The next honest step is a bounded byte/word vocabulary slice that makes modern machine structure legible without expanding the signal model.

## V1 Scope

V1 should stay bounded to **one small family of explicit byte/word helpers that operate on visible `bits` signals with clear multiple-of-8 expectations**.

Primary user story:
- start from one 16-bit or 32-bit word
- visibly split it into byte lanes or reorder those lanes
- visibly rotate or swap byte order at byte granularity
- use those transforms to build one modern-style toy round or schedule step more honestly than manual bit-window wiring allows

## Included

- one bounded helper family for byte/word structure on `bits`
- one demo workspace showing modern-style word handling from explicit parts
- one guided tutorial explaining what changes when a machine treats one word as ordered bytes
- one challenge that breaks one visible byte/word transform and asks the learner to repair it
- reuse of shipped `bits`-domain infrastructure and bridge/output surfaces wherever possible
- learning-sequence placement after `Visible Block Chaining` and before any future integrity/authentication line

## Explicitly Excluded

Do not include in V1:
- a new `byte` or `word` signal type
- AES, DES, ChaCha, SHA, or GCM preset modules
- authenticated encryption, MAC, or HMAC teaching
- full endian-aware protocol parsing
- a general-purpose “reinterpret as bytes” toggle on arbitrary modules
- hidden byte grouping semantics that bypass ordinary visible transforms

## Candidate Primitive Shape

V1 should prefer the smallest honest set, such as:

- **`ByteRotate`**
  - one `bits` input
  - one `bits` output
  - width must be a multiple of 8
  - rotates whole-byte groups left or right by an explicit byte count
  - note: this performs the same mathematical operation as `BitShifter(rotate-*, N*8)`. Its value is explicit byte-granularity naming on the canvas and strict multiple-of-8 width validation. The tutorial should compare the two directly so students understand that byte rotation is bit rotation at a specific stride.

- **`ByteSwap`**
  - one `bits` input
  - one `bits` output
  - width must be a multiple of 8
  - reverses byte order visibly (big-endian ↔ little-endian style reordering)

- **One bounded byte-lane helper if still justified**
  - for example a visible split/join helper for a fixed small byte count
  - only if review shows `ByteRotate` and `ByteSwap` alone are insufficient for one good teaching surface

The contract should bias toward the smallest set that adds real vocabulary rather than convenience aliases.

## Candidate Teaching Surface

### Demo Workspace
- **Visible Byte Order**
  - one 16-bit or 32-bit source
  - one byte-order transform
  - one byte-rotation transform
  - outputs that let the learner compare the original word, reordered word, and rotated word
  - the expected shape is a flat visible graph of explicit byte/word transforms, not a cipher preset

### Tutorial
- **When Bits Become Bytes**
  - step 1: identify the input word and its byte grouping
  - step 2: inspect what byte-order reversal changes
  - step 3: inspect what byte-rotation changes
  - step 4: compare how these transforms differ from plain bit rotation or plain bit permutation

### Challenge
- **Repair the Byte Order**
  - break one visible byte/word transform
  - learner restores it so the transformed output matches the reference machine again

## Core Rules

1. **The helpers must remain explicit**
   - byte grouping should be a visible structural claim
   - no hidden reinterpretation flags on unrelated modules

2. **The first move stays bounded**
   - one small helper family
   - one demo
   - one tutorial
   - one challenge
   - no full modern-cipher suite

3. **The existing `bits` domain should be honored**
   - do not introduce a new signal type just to make V1 feel cleaner
   - validate widths explicitly instead

4. **Vocabulary matters more than algorithm branding**
   - the value is that MCW gains honest byte/word words in its machine language
   - V1 does not need to claim “now we support AES” or “now we support ChaCha”

## Success Criteria

V1 is successful if:
- MCW can teach a modern byte/word transform more honestly than manual bit-window wiring
- learners can explain what changed at the byte level, not just at the raw bit level
- width expectations remain explicit and inspectable
- the slice prepares for later integrity/authentication or richer modern-round follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- stronger byte-lane helpers if one bounded split/join primitive proves necessary
- integrity/authentication teaching after modern byte/word handling is comfortable
- a later modern-round or sponge follow-on if the byte/word vocabulary proves classroom value

## Explicitly Avoid Next

Do not turn this into:
- an AES/ChaCha preset bundle
- a new signal-domain migration
- hidden endianness metadata attached to wires
- authenticated-encryption by stealth
- a broad encoding-family expansion disguised as modern primitive work

Keep the first move small, explicit, and word-structure focused.
