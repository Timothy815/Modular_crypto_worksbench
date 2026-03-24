# Protocol Material V1

Last updated: March 24, 2026

Status: Shipped in `v1.17.0`.

## Purpose

This contract defines the first bounded protocol-material vocabulary slice for MCW.

The goal is not to add cipher modes, authenticated encryption, or protocol orchestration.
The goal is to give MCW honest, labeled source modules for the material that real cryptographic protocols require alongside the message itself.

This slice should establish that MCW can represent:
- an initialization vector (IV) as a visible, named source
- a nonce as a visible, named source
- a salt as a visible, named source

These are structurally source modules — no inputs, one `bits` output — but they carry semantic identity that generic `HexSource` or `BitSource` do not.

## Why Now

Block framing shipped in `v1.16.0`. MCW can now split, pad, and rejoin fixed-width blocks.

The next honest step is not building cipher modes on top of framing. The next honest step is giving students the labeled inputs that real modes require, so they can wire them explicitly before any mode-building contract arrives.

Without protocol-material sources, a student building a block pipeline would use a generic HexSource for the IV and another for the message. The graph would work, but the distinction between message and IV would be invisible — exactly the kind of hidden structure MCW exists to make explicit.

## Architectural Decision

For the first protocol-material milestone, all new modules should be stateless source modules on the existing `bits` signal domain.

That means:
- no new signal types
- no executor changes
- no session state, randomness, or implicit generation
- no hidden uniqueness enforcement

Each protocol-material source should:
- emit one `bits` output
- have a user-supplied hex value parameter (like HexSource)
- have an explicit width parameter that controls the output bit-width
- validate that the supplied value matches the declared width
- carry a distinct module identity (`IV`, `Nonce`, `Salt`) for graph legibility

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Build**
- protocol-material sources should appear in the palette as a distinct category or clearly labeled group
- students should be able to wire an IV source into a block pipeline alongside the message source
- the graph should make visible which input is the message and which is the IV/nonce/salt

2. **Analyze**
- protocol-material sources should be inspectable like any other module
- no special analysis view is needed for the first slice — they are sources, not transforms

3. **Guide / Challenge**
- at least one tutorial should teach why protocol material is distinct from the message
- at least one demo should show a block pipeline with an explicit IV wired in
- at least one challenge should require fixing a misused or missing protocol input

This slice should not become:
- a random number generator
- a session-state manager
- a cipher-mode library
- a "secure by default" wrapper that hides structure

## First Milestone

The first milestone should answer one question clearly:

**Can a student visibly wire labeled protocol inputs into a block pipeline and understand why the IV is not the message?**

The student should be able to:
- place an IV source alongside a message source
- see that both produce bits, but carry different roles
- wire the IV into a block pipeline (e.g., XOR with the first block before processing)
- understand that reusing or omitting the IV changes the output
- understand that nonce, salt, and IV are related but serve different protocol contexts

## Include

The first milestone should include:

### Modules

- `IV` — initialization vector source
  - one `bits` output
  - `value` parameter: hex string (like HexSource)
  - `width` parameter: target bit-width (e.g., 8, 16, 32)
  - validation: value must match declared width
  - evaluate: emit the value as a bit vector, zero-padded on the right to width if short

- `Nonce` — number-used-once source
  - same structural shape as IV
  - distinct module identity for graph legibility
  - teaching copy should emphasize uniqueness per use

- `Salt` — randomization source
  - same structural shape as IV
  - distinct module identity for graph legibility
  - teaching copy should emphasize randomness per context

### Shared behavior

All three modules should share:
- the same parameter schema shape (`value` + `width`)
- the same evaluate logic (hex → bits at declared width)
- the same validation rules (value matches width)
- distinct `id`, `name`, and palette grouping

The implementation should prefer sharing a common evaluate helper rather than duplicating logic across three module files.

### Width validation

Each module should validate that the supplied hex value, when converted to bits, does not exceed `width` bits:
- if the hex value is too short, zero-pad on the right to `width` (matching BitPad's default behavior)
- if the hex value is too long, **reject with a validation error** — silent truncation would hide a width mismatch the student should see
- the width parameter itself should be validated as a positive integer
- width must be a multiple of 4 (one hex digit = 4 bits) to keep the hex ↔ width relationship clean for students

## Exclude

This milestone should explicitly avoid:
- CBC / CTR / OFB / GCM mode modules
- automatic IV generation or randomness
- session-scoped uniqueness tracking for nonces
- key-derivation functions
- authenticated encryption helpers
- protocol orchestration or sequencing logic
- number-theoretic primitives
- any module that takes the message as input alongside the protocol material
- a dedicated `CounterSource` module (the shipped `Counter` from v1.15.0 can serve this role in demos)

## Relationship to Existing Modules

Protocol-material sources are deliberately close to `HexSource` in structure. The difference is semantic:

| Module | Purpose | Width control | Teaching role |
|---|---|---|---|
| `HexSource` | generic bit-domain source | implicit (from hex length) | message or arbitrary data |
| `IV` | initialization vector | explicit `width` param | block-cipher initialization, chaining seed |
| `Nonce` | number used once | explicit `width` param | uniqueness per encryption, replay prevention |
| `Salt` | randomization input | explicit `width` param | hash salting, key derivation context |

A student should be able to explain: "I could use HexSource for the IV, but then the graph doesn't show that this input has a special role."

### Why not just use HexSource?

This is the right question to ask, and the contract should answer it directly.

In the first slice, `IV`, `Nonce`, and `Salt` share identical evaluate logic. The engine cannot enforce uniqueness, randomness, or any protocol-level property — those are semantic constraints that a stateless DAG cannot express. The distinction is **intentionally graph-legibility only** for the first milestone.

This is not accidental duplication. It is the same design decision that makes `KeyInput` a separate module from `TextInput` even though both emit a symbol. The graph should name the role, not just the data type.

The explicit `width` parameter is the one behavioral difference from HexSource: protocol-material sources declare their expected width up front and reject values that exceed it, while HexSource derives width implicitly from whatever hex string the user types. This makes width a visible, inspectable contract between the source and the downstream pipeline.

Future slices may add behavioral differences (e.g., nonce-uniqueness warnings, salt-randomness hints), but the first slice does not depend on them.

### Counter-source deferral

The vocabulary roadmap lists "explicit counter sources" as a protocol-material item. For this first slice, a dedicated `CounterSource` module is **deferred**.

MCW already ships a `Counter` module (v1.15.0) that produces a `bits` output and advances per tick. In a protocol-material demo, the existing `Counter` can serve the structural role of a counter-mode input without a new engine primitive. If a future CTR-mode teaching surface requires a counter with different semantics (e.g., a non-ticked, parameter-driven counter that emits a fixed block), that should be proposed in a follow-on contract, not bundled here.

## Visual / Teaching Principles

Prefer:
- labeled modules that make protocol roles visible in the graph
- explicit width parameters that students can inspect and modify
- simple first examples where the IV is XORed with a block before processing

Avoid:
- hiding protocol material behind a "setup" phase that runs before the graph
- pretending IV/nonce/salt are interchangeable
- teaching uniqueness or randomness properties through enforcement rather than observation
- adding "secure by default" generation that removes the teaching surface

## Shipped Teaching Additions

The first milestone shipped with:

### Demo workspaces

- `Protocol Material Mixer`
  - `HexSource(message) -> BitPad(16) -> BitSplit(8) -> XOR(IV, left half) + XOR(key, right half) -> BitJoin -> BitsToHex -> Output`
  - shows three distinct labeled sources: message, IV, and key
  - invites students to change the IV value and observe that the output changes while the graph remains structurally legible

### Tutorials

- `Protocol Material Is Context`
  - teaches why protocol material belongs beside the message rather than hiding inside unnamed generic sources
  - contrasts labeled IV material with generic key/message sources on the same graph
  - emphasizes that IV/nonce/salt are structured inputs, not magic security switches

### Challenges

- `Repair the IV`
  - starts from a framed mixer where the IV value is wrong
  - asks the student to restore the explicit IV source so the output again matches the reference graph
  - teaches that protocol material affects machine behavior even in a small bounded pipeline

## Success Criteria

This slice is successful when a student can:
- explain what an IV, nonce, and salt are and why they are distinct
- place a labeled protocol-material source in a graph
- wire it into a block pipeline alongside a message
- observe that changing the IV changes the output
- understand why reusing a nonce or omitting a salt weakens a construction
- understand that these are sources of structured input, not magic security switches
