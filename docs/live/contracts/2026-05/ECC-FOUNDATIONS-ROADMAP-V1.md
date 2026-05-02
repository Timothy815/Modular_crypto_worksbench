# ECC Foundations Roadmap V1

Last updated: May 1, 2026
Status: Active roadmap note

## Purpose

Define a product-respecting roadmap for bringing elliptic curve cryptography into MCW without violating the workbench's core standards:

- explicit machinery
- typed honesty
- local inspectability
- analytical rigor
- live-machine feel

This is not a promise to ship ECC quickly.

It is a discipline document for how ECC should enter the product if it enters at all.

## Why ECC Needs Its Own Roadmap

MCW already has real number-theoretic footing:

- modular exponentiation
- modular inverse
- modulus analysis
- toy RSA teaching content
- visible finite-modulus Diffie-Hellman teaching content

That is enough to teach some asymmetric ideas honestly.

It is not enough to claim that MCW is structurally ready for ECC.

ECC is not just "more asymmetric cryptography."
It requires a different algebraic substrate:

- prime-field arithmetic
- point-domain operations
- subgroup-aware reasoning
- exact arithmetic beyond the safe range of JavaScript bitwise-number tricks

If MCW tries to add ECC as just another protocol wing on top of the current arithmetic layer, it will violate the product's mission.

## Code-First Baseline

MCW currently ships:

- `AddMod`, `SubMod`, `MulMod`
  - bit-word arithmetic modulo `2^n`
- `Modulo`
  - integer modulus reduction over a bit-word input
- `ModExp`
  - modular exponentiation with explicit modulus parameter
- `ModInverse`
  - modular multiplicative inverse with explicit modulus parameter
- modulus analysis
  - primality
  - Euler totient / group-order framing
  - small-factor warnings
- teaching content for:
  - `Toy RSA`
  - `Diffie-Hellman Key Exchange`

This is a meaningful start.

But the current arithmetic substrate still relies on JavaScript `number` conversion helpers and bitwise operators in `src/engine/modules/bit-word.ts`, which means:

- the existing arithmetic layer is educationally valid for toy widths
- it is not an acceptable foundation for ECC-scale exactness
- it is not yet a principled field-arithmetic layer

## Product Standard For ECC

ECC should enter MCW only if it can satisfy all of these:

1. A student can see the algebraic machinery, not only the protocol shell.
2. A student can inspect intermediate values meaningfully.
3. The arithmetic is exact in the supported regime.
4. The product distinguishes:
   - local algebraic facts
   - protocol facts
   - security interpretations
5. The experience still feels like working on a live machine, not filling out opaque parameters.

If a proposed ECC slice cannot satisfy those standards, it should not ship yet.

## What ECC Must Not Become In MCW

ECC should not arrive as:

- a black-box `ECDH` module
- a black-box `ECDSA` module
- a marketing checkbox for "modern crypto support"
- a thin protocol skin over incorrect arithmetic
- an over-academic wall of formulas with no inspectable machine behavior

The wrong way to add ECC would be to hide the point algebra and show only the protocol result.

That would make MCW less itself, not more.

## Product Outcome

If this roadmap succeeds, a serious student should eventually be able to:

1. understand that ECC lives in a finite field and a point group, not in "magic asymmetric math"
2. inspect point addition and point doubling as concrete operations
3. understand scalar multiplication as repeated group action
4. connect that machinery to public-key derivation and shared-secret agreement
5. explain what the local curve and point properties do not prove about protocol security

That is the target.

## Priority Order

ECC should be approached in this order:

1. arithmetic exactness
2. algebraic signal vocabulary
3. finite-field foundations
4. point mechanics
5. protocol composites
6. rigor and failure-mode labs

Skipping this order would create surface capability without product honesty.

## Phase 0: Arithmetic Audit And Exactness Boundary

### Goal

Establish exactly what the current arithmetic substrate can and cannot support.

### Why This Comes First

Current helpers like `bitsToUnsignedNumber()` and `unsignedNumberToBits()` rely on JavaScript `number` and bitwise operations.

That is acceptable for toy number theory.
It is not an acceptable hidden boundary for ECC.

### Required Work

- audit all arithmetic modules for width/exactness assumptions
- identify where JS `number` and bitwise coercion create silent correctness ceilings
- define the supported exactness regime explicitly
- decide whether the next substrate uses:
  - `bigint`
  - or a bounded custom exact integer layer

### Success Test

MCW can state exactly which arithmetic regime is exact, and the answer is no longer "whatever JavaScript numbers happen to tolerate."

## Phase 1: Exact Integer Arithmetic Substrate

### Goal

Create a trustworthy exact arithmetic foundation for future algebraic work.

### Required Work

- add exact integer helpers that do not depend on 32-bit bitwise truncation
- separate:
  - bit-word representation concerns
  - integer arithmetic concerns
- provide exact conversion between:
  - bit vectors
  - integers in the supported range
- ensure engine, inspector, and export surfaces stay aligned

### Non-Goals

- no ECC yet
- no new protocol content yet

### Success Test

MCW has a principled exact arithmetic layer that can support finite-field work honestly.

## Phase 2: Algebraic Signal Vocabulary

### Goal

Expand the signal model so ECC does not have to masquerade as plain bits everywhere.

### Recommended New Domains

At minimum, evaluate:

- `integer`
- `ec-point`

Possibly later:

- `field-element`
- `curve-params`

### Why This Matters

If curve points remain hidden inside anonymous bitstrings, students cannot inspect the mechanism properly.

That would collapse MCW's glass-box standard.

### Required Work

- extend signal typing carefully
- define display/inspector representations for new domains
- define explicit bridges where conversion to bits is needed
- preserve the no-hidden-coercion rule

### Success Test

A selected value in an ECC workspace can read as a point or scalar in the inspector without lying about what it is.

## Phase 3: Prime-Field Arithmetic Foundations

### Goal

Add the field machinery ECC actually needs.

### Scope

Prime fields only in the first wave.
No binary-field curves in V1.

### Required Primitives

- field add mod `p`
- field subtract mod `p`
- field multiply mod `p`
- field inverse mod `p`
- optional field negate mod `p`

### Important Constraint

These must be real field operations, not fake compositions built from `mod 2^n` word operators plus later reduction.

### Teaching Outcome

Students should be able to see:

- how field arithmetic differs from plain integer arithmetic
- why inverse existence depends on the modulus and element
- why prime-modulus structure matters

### Success Test

MCW can teach finite-field arithmetic directly and honestly before any curve protocol appears.

## Phase 4: Point Mechanics

### Goal

Make elliptic-curve point operations visible and inspectable.

### Required Primitives Or Structured Definitions

- point-on-curve check
- point negation
- point addition
- point doubling
- scalar multiplication
- identity / point-at-infinity handling

### Required Inspector Support

- show coordinates clearly
- show invalid-point states clearly
- show when the point at infinity is produced
- show which curve parameters are in force

### Teaching Outcome

Students should be able to answer:

- what point addition is doing
- why doubling is a special case
- why scalar multiplication is repeated structure, not magic

### Success Test

MCW can show an elliptic-curve point pipeline that feels like visible algebraic machinery rather than a black-box asymmetric widget.

## Phase 5: ECC Protocol Composites

### Goal

Build protocol-level ECC teaching surfaces from the visible machinery below them.

### First Candidates

- ECDH-style shared secret agreement

### Later Candidates

- Schnorr-style signatures
- ECDSA-style teaching only if nonce/range/failure-mode framing is mature enough

### Required Constraint

These should ship as composites or guided workspaces built from visible lower-level operations whenever possible.

If a helper wrapper is added, it must still preserve inspectable intermediate state.

### Success Test

A student can open an ECC protocol workspace and trace it downward into visible field and point operations.

## Phase 6: Rigor, Failure Modes, And Labs

### Goal

Prevent ECC from becoming a mystified prestige wing.

### Required Teaching Themes

- valid point versus invalid point
- base point versus arbitrary point
- scalar range discipline
- why repeated multiplication is easy forward and hard to reverse
- what local curve facts do not prove
- why protocol misuse still breaks a mathematically elegant system

### Likely Labs

- visible scalar multiplication intuition lab
- ECDH shared-secret agreement lab
- invalid-point / bad-parameter caution lab
- signature nonce-discipline lab, only later and only if the substrate is mature enough

### Success Test

Students leave with better judgment, not just higher reverence for ECC.

## Recommended Near-Term Roadmap Slices

If this roadmap becomes active work, the best bounded sequence is:

1. `ARITHMETIC-EXACTNESS-AUDIT-V1`
- code-first audit of arithmetic precision boundaries and unsafe coercions

2. `EXACT-INTEGER-SUBSTRATE-V1`
- introduce an exact arithmetic layer suitable for future field work

3. `ALGEBRAIC-SIGNALS-V1`
- extend the signal model beyond `bits` and `symbol`

4. `PRIME-FIELD-ARITHMETIC-V1`
- visible field add/sub/mul/inverse

5. `ELLIPTIC-CURVE-POINT-MECHANICS-V1`
- point validation, add, double, scalar multiply

6. `VISIBLE-ECDH-V1`
- protocol teaching built on the lower layers

That order is intentionally conservative.

## What Can Wait

The following should not be early goals:

- large named real-world curves
- performance optimization for large-scale cryptographic workloads
- ECDSA as an early prestige feature
- binary-field curve support
- black-box "ECC secure channel" presets

The goal is understanding first, not credential theater.

## Evaluation Standard

Future ECC work should be judged against these questions:

- does this make the underlying algebra more visible
- is the arithmetic exact in the supported regime
- does the student gain inspectable intuition, not only procedural steps
- does the surface say what it does not prove
- does the result still feel like shaping a live machine

If a slice adds protocol vocabulary but hides the mechanism, it should not count as progress.

## Bottom Line

MCW is not ready for honest ECC yet.

But it is close enough in spirit that ECC could become one of the strongest wings of the product if it is built through the right substrate:

- exact arithmetic
- explicit algebraic signals
- visible field operations
- visible point mechanics
- protocol composites only after the machinery is trustworthy

That is the path that respects the mission and honors MCW's intentions.
