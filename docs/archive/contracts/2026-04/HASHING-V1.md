# Hashing V1

Last updated: March 24, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the first hashing line for the Modular Cryptography Workbench.

Hashing belongs in MCW because it is a foundational part of modern cryptography, not an optional side topic. It should be taught with the same product values as the rest of the system:
- explicit structure
- visible transformation
- intuition first
- graphs before jargon

The purpose of Hashing V1 is not to ship a production hash library. It is to make the core ideas of hashing concrete:
- fixed-size compression from variable or structured input
- mixing and diffusion
- avalanche from tiny input changes
- one-way-looking behavior without pretending we can "see" one-wayness directly

## Product Boundary

Hashing should connect both major MCW surfaces:

1. **Build**
- students should be able to construct or inspect small hash-like pipelines from explicit modules
- rounds, permutations, XOR, shifts, and compression-like structure should stay visible

2. **Cryptanalysis**
- hashing should have an analysis surface for avalanche and diffusion
- this should extend the modern-analysis visual language rather than invent a second unrelated UI

Hashing should not begin as:
- a black-box dropdown of famous algorithms
- a pure calculator page
- a math-heavy theorem module

## First Milestone

The first hashing milestone is **Hash Construction Foundations**.

It should let a student:
- see how a small structured bit input is mixed into a fixed-size output
- compare two nearby inputs
- watch avalanche in a hash-like construction
- understand how repeated rounds contribute to diffusion

The first milestone should focus on small explicit constructions, not industrial hash realism.

## Include

The first hashing milestone includes:
- one or more starter hash-like demo constructions
- explicit bit-domain pipelines built from existing and small new primitives
- cryptanalysis support through the modern Avalanche Explorer
- guided tutorial content that explains:
  - message in
  - round mixing
  - compressed or fixed-size digest out
  - avalanche under one-bit input change

The shipped teaching artifacts include:
- a toy compression chain
- a sponge-like absorb/mix/squeeze teaching model
- a Feistel-inspired or SP-inspired digest toy if it stays honest and visible

## Exclude

The first milestone should explicitly avoid:
- pretending to implement SHA-2 or SHA-3 faithfully before the teaching model is ready
- giant constant tables as the primary experience
- proof-heavy collision/preimage formalism as the main workflow
- password hashing / KDF complexity in the first slice
- Merkle trees, HMAC, or signature integration in V1 hashing

Those may come later, but they are not the right entry point.

## Visual Principles

Hashing should feel visual in the same way modern analysis now feels visual:
- message bits should be visible
- digest bits should be visible
- round diffusion should be visible
- avalanche should be visible

The student should be able to see:
- small message changes creating large digest changes
- digest width staying fixed while message structure varies
- repeated mixing making local changes harder to track

Prefer:
- digest bit strips
- round diffusion matrices
- before/after message vs digest comparisons
- simple fixed-size output cards

Avoid leading with:
- long hex dumps without explanation
- huge specification text
- opaque "security score" framing

## Likely Module / Workflow Shape

Hashing V1 may require some small new teaching-oriented primitives later, but the first line should reuse existing structure wherever possible.

Expected workflow shape:
1. message source enters as explicit bits/bytes
2. one or more visible mixing rounds transform state
3. output is rendered as a fixed-size digest
4. modern analysis shows avalanche and diffusion

If new primitives are added, they should be small and legible, not giant special-case algorithm engines.

## Relationship To Modern Analysis

Hashing should build on the existing modern-analysis work, not fork from it.

The Avalanche Explorer should become the first natural analysis surface for hashing.
This is strategically important: hashing should reinforce the modern-analysis line instead of competing with it.

## Implementation Sequence

1. Define Hashing V1 as a product contract.
2. Continue modern-analysis breadth so the Avalanche Explorer is more generally useful.
3. Add bounded hash-construction teaching artifacts.
4. Attach guided tutorials to those artifacts.
5. Complete the first hashing milestone before considering famous-hash approximations.

## Success Criteria

Hashing V1 is successful when a student can:
- run a small explicit hash-like construction
- flip one bit in the message
- see the digest change strongly
- inspect how the mixing rounds contributed to that change
- leave with a concrete intuition for why hashing is a distinct cryptographic tool, not just "encryption without a key"

Current shipped milestone coverage:
- `Toy Compression Hash`
- `Toy Sponge Hash`
- `Hash Digest Round`
- `Compression vs Sponge`
- Avalanche Explorer support for the hash teaching artifacts
- parameter-forwarded controls for digest/mix behavior
- transformation views that explain the internal `SBox`, `BitShifter`, `Permutation`, and `XOR` steps used by the hash artifacts
