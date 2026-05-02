# Arithmetic Exactness Audit — 2026-05-01

Last updated: May 1, 2026
Status: Active audit note

## Purpose

Audit MCW's current arithmetic substrate against the standard required for future algebraic cryptography work, especially prime-field and elliptic-curve work.

This is a code-first audit.

It does not ask what arithmetic MCW aspires to have.
It asks what arithmetic MCW actually has, where it is exact, where it silently degrades, and what must change before ECC can be added honestly.

## Surfaces Audited

Primary engine files:

- [src/engine/modules/bit-word.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/bit-word.ts)
- [src/engine/modules/add-mod.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/add-mod.ts)
- [src/engine/modules/sub-mod.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/sub-mod.ts)
- [src/engine/modules/mul-mod.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mul-mod.ts)
- [src/engine/modules/modulo.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/modulo.ts)
- [src/engine/modules/mod-exp.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-exp.ts)
- [src/engine/modules/mod-inverse.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-inverse.ts)
- [src/engine/modules/counter.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/counter.ts)

Secondary supporting surfaces:

- [src/engine/validation.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/validation.ts)
- [src/engine/analysis/modexp-analysis.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/analysis/modexp-analysis.ts)
- [src/ui/components/inspector-analyze-details.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/inspector-analyze-details.tsx)
- [src/ui/demo-projects.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/demo-projects.ts)
- [src/ui/starter-tutorials.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/starter-tutorials.ts)

## Current Arithmetic Capability

MCW already ships a meaningful bounded arithmetic line:

- `AddMod`
- `SubMod`
- `MulMod`
- `Modulo`
- `ModExp`
- `ModInverse`
- modulus inspector analysis
- toy RSA and classical finite-modulus Diffie-Hellman teaching content

This is enough to teach visible modular arithmetic and asymmetric toy constructions.

It is not yet enough to support ECC honestly.

## Core Finding

MCW's current arithmetic substrate is built on JavaScript `number` plus 32-bit bitwise conversion helpers.

That means:

- the current arithmetic layer is educationally valid for small toy widths
- the exactness boundary is not explicit in the product
- several arithmetic modules become mathematically unsafe before an ordinary user would expect them to
- future prime-field or ECC work must not build directly on this substrate without refactoring it first

This is the main finding.

## Exactness Risks In The Current Engine

### 1. Bit-word conversion uses 32-bit bitwise coercion

In [bit-word.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/bit-word.ts):

- `bitsToUnsignedNumber()` uses `value = (value << 1) | bit`
- `unsignedNumberToBits()` uses `(normalized >> shift) & 1`

Those are JavaScript bitwise operators.
They operate on signed 32-bit integers.

That creates a hard but currently implicit boundary:

- once values need more than 31 bits of unsigned magnitude, conversion is no longer trustworthy
- the product does not currently surface this boundary clearly enough

### 2. Arithmetic is built on `number`, not exact integer arithmetic

`AddMod`, `SubMod`, `MulMod`, `Modulo`, `ModExp`, and `ModInverse` all ultimately operate on JavaScript `number`.

That means exactness depends on remaining within the IEEE-754 safe integer regime:

- integers are exact only up to `2^53 - 1`

This matters differently by operator family.

### 3. Validation checks width-versus-modulus, not arithmetic exactness

Current validation checks like:

- `modulus <= 2 ** width`

are useful for range sanity.

They do **not** protect against:

- 32-bit coercion in conversion helpers
- unsafe integer multiplication
- unsafe repeated-squaring intermediate products
- unsafe extended-Euclidean coefficient growth

So the current system can accept arithmetic settings that are structurally valid but numerically unsafe.

That is the highest-value silent-wrong-answer risk in this area.

## Operator-By-Operator Exactness Assessment

## `bitsToUnsignedNumber()` / `unsignedNumberToBits()`

### Current status

- exact only while the represented value remains within the safe behavior of signed 32-bit bitwise coercion

### Practical exactness boundary

- acceptable for values up to `2^31 - 1`
- not trustworthy as a generic conversion layer beyond that

### Risk

This is foundational.
Any arithmetic or control primitive built on these helpers inherits the boundary.

## `AddMod` / `SubMod`

### What they do

- perform arithmetic modulo `2^n` on equal-width bit words

### Exactness regime

Given the current helpers:

- conversion is the first bottleneck
- practical exactness is bounded by the 31-bit conversion ceiling

Within that regime, addition and subtraction themselves remain safely below `2^53`.

### Verdict

- acceptable for toy-width word arithmetic
- not an acceptable long-term exact arithmetic substrate

## `MulMod`

### What it does

- multiplies equal-width bit words modulo `2^n`

### Exactness regime

Multiplication is the first place `number` precision becomes unsafe even if conversion still works.

Conservative safe regime:

- roughly `n <= 26` bits if exact multiplication is required

Why:

- the product of two `n`-bit values approaches `2^(2n)`
- beyond about `2^53`, integer multiplication is no longer exact in `number`

### Verdict

- acceptable for bounded toy work
- already unsafe well before any serious algebraic cryptography target

## `Modulo`

### What it does

- reduces one bit-word input modulo an explicit integer modulus

### Exactness regime

- exact while conversion to `number` remains exact
- practical ceiling is again the 31-bit conversion regime

### Verdict

- useful and honest for toy modular reduction
- not a sufficient basis for future finite-field work

## `ModExp`

### What it does

- repeated squaring with explicit integer modulus

### Exactness regime

This is more fragile than its surface suggests.

Current implementation repeatedly multiplies `number`s:

- `result * b`
- `b * b`

Even if the final result is reduced modulo `m`, the intermediate multiplication must still be exact for the algorithm to be exact.

Conservative safe regime:

- roughly modulus/base widths `<= 26` bits

### Additional risk

- the exponent is also derived through 32-bit conversion helpers
- wide exponent words can silently mis-convert before the algorithm even starts

### Verdict

- fine for toy RSA and visible DH demonstrations
- not an honest foundation for large or future ECC-adjacent exact arithmetic

## `ModInverse`

### What it does

- modular inverse via the extended Euclidean algorithm

### Exactness regime

This uses repeated integer subtraction and coefficient updates with `number`.

Even if the input value and modulus are modest, intermediate coefficient products can grow.

So while there is no immediate 32-bit-only collapse inside the Euclidean loop itself, it still lacks a principled exactness guarantee once values move beyond the safe small-integer regime.

Conservative working conclusion:

- acceptable in the same small-toy regime as `ModExp`
- not yet suitable as an exact finite-field inverse substrate

### Verdict

- educationally valid now
- not yet foundationally trustworthy for field-level work

## `Counter`

### What it does

- increments a fixed-width word modulo `2^n`

### Exactness regime

- relies on `2 ** width`
- relies on `unsignedNumberToBits()`

So it inherits the same 31-bit conversion boundary.

### Verdict

- not directly an ECC blocker
- but it confirms the broader point that MCW still treats "bit words as numbers" through a 32-bit lens

## Teaching Content Impact

Current teaching content is still honest in practice because it uses small parameters:

- toy RSA uses tiny modulus values
- Diffie-Hellman demo uses modulus `23`

So the shipped asymmetric content is not currently broken by these arithmetic boundaries.

That matters.

The problem is not that current teaching content is invalid.

The problem is that the arithmetic substrate underneath it would tempt future growth into regimes it cannot honestly support.

## Product Rigor Impact

MCW's current arithmetic layer is good enough for:

- visible toy number theory
- bounded RSA intuition
- bounded classical DH intuition
- explicit modular arithmetic labs

It is not yet good enough for:

- exact prime-field algebra as a product foundation
- large-width group arithmetic
- ECC point arithmetic
- any future feature that implies "exact modular arithmetic at arbitrary educationally interesting widths"

## Highest-Risk Silent Wrong-Answer Cases

1. Widths above the 31-bit conversion regime
- values can be mis-converted silently before arithmetic starts

2. `MulMod` at moderate-large word widths
- multiplication can lose integer exactness before reduction

3. `ModExp` repeated squaring beyond small widths
- intermediate products can become inexact while results still look plausible

4. `ModInverse` beyond small widths
- coefficient growth lacks an explicit exactness guarantee under `number`

These are more important than UI wording.
They are real substrate issues.

## Recommended Next Slice

The correct next step is:

- [EXACT-INTEGER-SUBSTRATE-V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)

More concretely, the next bounded implementation contract should be:

- `EXACT-INTEGER-SUBSTRATE-V1`

### Its goal should be:

- introduce exact integer helpers that do not rely on 32-bit bitwise coercion
- make supported arithmetic exactness an explicit product property
- keep current toy arithmetic teaching content working
- prepare for later prime-field and algebraic signal work

## What Must Change Before ECC

Before honest ECC work begins, MCW needs:

1. exact integer conversion helpers
2. exact multiplication under the supported regime
3. exact modular arithmetic under the supported regime
4. explicit exactness limits in validation and inspector copy
5. a clean separation between:
   - bit-word arithmetic
   - integer arithmetic
   - later field arithmetic

Without those, ECC would be a product shortcut.

## Bottom Line

MCW already has a legitimate toy number-theory wing.

But its arithmetic substrate is still:

- `number`-based
- 32-bit-coercion-based at the conversion boundary
- silently unsafe outside a bounded toy regime

That does not invalidate what has shipped.
It does mean the product must not pretend the current arithmetic layer is a ready-made bridge to ECC.

The correct next move is not "start ECC."

It is:

- make arithmetic exactness explicit
- replace unsafe conversion/arithmetic foundations
- then build field and curve work on top of that

That is the path that respects MCW's standards.
