# Protocol Material V1

Last updated: March 24, 2026

Status: Proposed.

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
  - evaluate: emit the value as a bit vector, padded or truncated to width

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

Each module should validate that the supplied hex value, when converted to bits, produces exactly `width` bits:
- if the hex value is too short, pad to width (matching BitPad behavior)
- if the hex value is too long, reject with a validation error
- the width parameter itself should be validated as a positive integer

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

## Relationship to Existing Modules

Protocol-material sources are deliberately close to `HexSource` in structure. The difference is semantic:

| Module | Purpose | Width control | Teaching role |
|---|---|---|---|
| `HexSource` | generic bit-domain source | implicit (from hex length) | message or arbitrary data |
| `IV` | initialization vector | explicit `width` param | block-cipher initialization, chaining seed |
| `Nonce` | number used once | explicit `width` param | uniqueness per encryption, replay prevention |
| `Salt` | randomization input | explicit `width` param | hash salting, key derivation context |

A student should be able to explain: "I could use HexSource for the IV, but then the graph doesn't show that this input has a special role."

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

## Suggested Teaching Additions

The first milestone should likely ship with:
- one tutorial on protocol material and why it matters
- one demo workspace such as:
  - `HexSource -> BitPad -> BitSplit -> XOR(IV) on left + XOR(key) on right -> BitJoin -> BitsToHex -> Output`
  - where the IV source is visibly distinct from the message source and the key source
- one bounded challenge such as:
  - a pipeline where the IV is missing or set to all zeros, and the student must supply the correct IV to match a reference output

## Success Criteria

This slice is successful when a student can:
- explain what an IV, nonce, and salt are and why they are distinct
- place a labeled protocol-material source in a graph
- wire it into a block pipeline alongside a message
- observe that changing the IV changes the output
- understand why reusing a nonce or omitting a salt weakens a construction
- understand that these are sources of structured input, not magic security switches
