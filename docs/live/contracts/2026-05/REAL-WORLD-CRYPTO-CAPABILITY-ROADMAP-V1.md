# Real-World Crypto Capability Roadmap V1

Last updated: May 2, 2026
Status: Active planning document

## Purpose

Articulate the product trajectory beyond toy-scale cryptography.

MCW is not meant to be a tool for making toy ciphers and fetal-pig analogies.

It is meant to be an **anatomy lab for cryptography** — a place where the student can build, dissect, analyze, and break real cryptographic machinery with full visibility into every intermediate state.

This document describes what that means concretely, where MCW stands relative to that goal as of May 2026, and what the contract sequence is to close the gap.

It is written for agents and collaborators resuming work on the product, not for end users.

## The Vision

The reference standard is the anatomy lab, not the biology classroom.

A medical student uses cadavers because:
- The structure is real, not simplified for comfort
- Every organ is accessible, not hidden behind abstraction
- You can take it apart and see how the pieces connect
- Pathology (how things break) is as visible as physiology (how things work)
- The knowledge transfers directly to working on living systems

MCW's goal is the same relationship with cryptography:
- The arithmetic is real, not toy-scale
- Every intermediate signal is visible, not hidden inside a library call
- The student can construct, inspect, trace, and break any primitive
- Analysis (where does it break? what does side-channel mean? what does the avalanche look like?) is a first-class mode
- The knowledge transfers to implementing or auditing real systems

This is different from most crypto tooling:
- A textbook explains. MCW runs.
- OpenSSL implements. MCW exposes.
- A CTF challenge breaks. MCW teaches *why* it breaks.

The claim MCW should be able to make:

> A student who can build secp256k1 ECDH in MCW and watch every intermediate point understands what they are doing when they call `crypto.createECDH('secp256k1')` in Node.js.

> A student who can build a real AES round in MCW and trace MixColumns byte by byte understands what they are auditing when they review an AES implementation.

MCW does not make secure ciphers. It makes cryptography legible. The distinction is the right one.

## Where MCW Stands as of May 2026

The structural foundation is already stronger than most crypto pedagogy tools:

### What is real

- **Signal tracing**: every wire carries a typed, inspectable signal. No black boxes.
- **Explicit domain transitions**: no silent coercions. Symbol ↔ bits conversion requires a visible bridge module.
- **Full ECC teaching line**: visible point arithmetic, scalar multiplication, ECDH, point order, subgroups, and Schnorr — all with explicit intermediate point signals
- **Real arithmetic substrate**: bigint-backed internally, field arithmetic correct at toy scale
- **Python export**: any workspace can be exported to runnable Python. The pedagogy is portable.
- **Analysis modes**: Analyze view, signal probing, avalanche explorer, transformation views
- **Repair challenges**: structural breaks that require the student to reason about the machinery, not just find a typo

### What is still toy-scale

- **Integer param ceiling**: curve parameters (p, a, b, G_x, G_y) are limited to `Number.isSafeInteger` (< 2^53). secp256k1's prime is ≈ 2^256. Students can see ECDH structure but cannot load real curves.
- **No named curve sources**: a student wanting real secp256k1 must manually enter a 78-digit hex prime. That is friction with no pedagogical value.
- **No GF(2⁸) multiplication**: AES can be sketched (SubBytes, ShiftRows, AddRoundKey all ship) but MixColumns requires GF(2⁸) field multiplication which is absent. AES is not fully constructible.
- **No real SHA-256**: the round constants and message schedule exist conceptually but are not wired into a real SHA-256 round. Hash construction is structural, not exact.
- **No side-channel model**: the tool has no model for timing variation, power traces, or cache-timing. The pathology layer does not yet exist.

## The Three Contracts That Close the Toy Gap

These three contracts are the next work. They are ordered by dependency and impact.

### Layer 1: REAL-SCALE-ARITHMETIC-SUBSTRATE-V1

**What it does**: Removes the `Number.isSafeInteger` ceiling from all module params that represent large integers. Adds a `bigint-hex` param kind. Changes `EcCurveDescriptor.p/a/b` from `number` to `bigint`.

**Why it matters**: Without this, all ECC and field arithmetic is permanently toy-scale regardless of what else ships. This is the substrate that makes real curves possible.

**What it unlocks**: secp256k1 ECDH with real parameters. P-256 point arithmetic. RSA at real key sizes (2048-bit ModExp). Any number-theoretic operation MCW ships, at real scale.

**Dependencies**: None. Buildable now.

**Contract**: [REAL-SCALE-ARITHMETIC-SUBSTRATE-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/REAL-SCALE-ARITHMETIC-SUBSTRATE-V1.md)

---

### Layer 2: NAMED-CURVE-SOURCES-V1

**What it does**: Adds a `NamedCurveBasePoint` module with a `curve` dropdown (secp256k1, P-256). Outputs the real generator point G and subgroup order n as signals. Adds an inspector "Load Curve Preset" helper on all ECC modules.

**Why it matters**: After Layer 1, a student *can* enter secp256k1 parameters manually. They should not *have to*. Named curve sources remove 64-character hex copy-paste friction while keeping the full parameter machinery visible. A student still sees the p, a, b values — they are just pre-loaded from a trusted preset.

**What it unlocks**: Real ECDH workspaces. Real Schnorr workspaces. Real ECC signature demos without manual hex entry.

**Dependencies**: REAL-SCALE-ARITHMETIC-SUBSTRATE-V1.

**Contract**: [NAMED-CURVE-SOURCES-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/NAMED-CURVE-SOURCES-V1.md)

---

### Layer 3: GF2-FIELD-ARITHMETIC-V1

**What it does**: Adds `GF2Mul` (GF(2⁸) multiply) and `GF2Inv` (GF(2⁸) inverse) primitives operating in the `bits` domain. Configurable reduction polynomial; default is the AES polynomial `0x11B`.

**Why it matters**: AES has four operations per round. Three already ship (SubBytes/SBox, ShiftRows/SymbolPermutation, AddRoundKey/XOR). MixColumns requires GF(2⁸) multiplication. This is the last missing organ. After this, a full AES round is constructible.

**What it unlocks**: MixColumns. Full AES round construction. The Rijndael S-box derivation as a visible pedagogical exercise. Any cipher that uses byte-level field arithmetic.

**Dependencies**: Independent. Does not depend on Layer 1 or Layer 2. Can proceed in parallel.

**Contract**: [GF2-FIELD-ARITHMETIC-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md)

---

## What Becomes Possible After These Three Layers

When all three layers ship, MCW can express:

| Cipher / Protocol | Status after three layers |
|---|---|
| secp256k1 ECDH | Fully expressible with real parameters and verifiable output |
| P-256 ECDH | Fully expressible |
| RSA-2048 | Fully expressible (ModExp already ships; just needs bigint params) |
| AES round (single) | Fully expressible (SubBytes + ShiftRows + MixColumns + AddRoundKey) |
| Full AES (10 rounds) | Expressible as an iterator over the round structure |
| Schnorr on secp256k1 | Expressible (all ECC primitives ship; needs real curve + hash) |

The gap from "toy cipher" to "real cipher visible construction" closes with three targeted contracts.

## What Remains After That

The following are honest follow-on directions, not current commitments:

- **SHA-256 as a constructible workspace**: requires the SHA-256 message schedule and round constants as parameter sources, plus word-level rotation/shift operations. The rotations exist; the schedule wrapper does not.
- **Real Schnorr on secp256k1**: requires SHA-256 (or a hash output as an integer input), named curve sources, and the existing ScalarLinearCombine/ChallengeCombine primitives
- **ECDSA**: similar to Schnorr; requires hash + named curve + signature scalar arithmetic
- **AES key schedule**: additional contracts after full AES round is expressible
- **Side-channel modeling**: a future capability track, not near-term. Would require a new analysis mode that models timing or power variation during execution.
- **Curve25519 / EdDSA**: different curve form (Montgomery / twisted Edwards). Requires separate curve arithmetic substrate — not short Weierstrass.

None of these should be treated as part of the three-layer commitment. They are the honest next horizon after the gap closes.

## Note on Claims and Tone

MCW should not claim to produce secure ciphers. Proof of security comes from analysis, peer review, and time — not from constructing the circuit.

But MCW should also not call itself a toy.

The right framing: **MCW makes cryptography legible at the level where professionals reason about it.** A student who has used MCW to build ECDH from scratch, trace every intermediate point signal, and break it with a bad private key knows something qualitatively different from a student who has called a library function.

That is the product. That is worth building.
