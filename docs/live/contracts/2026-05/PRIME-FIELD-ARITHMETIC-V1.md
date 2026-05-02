# Prime-Field Arithmetic V1

Last updated: May 1, 2026
Status: Shipped

## Purpose

Introduce the first honest finite-field arithmetic layer for MCW so future elliptic-curve work can rest on visible, exact field operations instead of bit-word approximations.

This slice follows:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Exact Integer Substrate V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/EXACT-INTEGER-SUBSTRATE-V1.md)
- [Algebraic Signals V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ALGEBRAIC-SIGNALS-V1.md)

It is not a point-mechanics contract.
It is not an ECDH contract.

It is the field foundation required before those can be honest.

## Problem

MCW now has:

- an exact internal integer substrate
- a visible `integer` signal domain
- explicit `bits <-> integer` bridges

But the current arithmetic operator family is still largely about:

- fixed-width bit-word arithmetic
- modular reduction expressed through module params
- toy number-theory workflows that still end in bit outputs

That is enough for current toy RSA and Diffie-Hellman content.
It is not enough for prime-field reasoning.

Without a dedicated field layer, future ECC work would be pushed toward one of two bad outcomes:

- hiding field semantics inside plain integer modules
- faking field operations by composing `mod 2^n` word operators with later reduction

Both would violate MCW's product standard.

## Goal

Add the first bounded family of prime-field arithmetic primitives with visible integer-domain I/O and explicit modulus semantics, while keeping the slice small enough to reason about clearly.

The result should be:

- real field operations over a prime modulus
- integer-domain inputs and outputs
- explicit modulus parameterization
- exact behavior in the supported regime
- visible failure when an operation is undefined

## Scope

V1 is intentionally narrow.

In scope:

- prime-field add modulo `p`
- prime-field subtract modulo `p`
- prime-field multiply modulo `p`
- prime-field inverse modulo `p`
- validation for modulus and operand regime
- bounded inspector/analyze support for the new family
- one or two small teaching/demo paths proving the field layer is usable

Out of scope:

- curve-point operations
- field-element as a separate signal domain
- hidden modulus-carrying value objects
- protocol composites
- binary-field arithmetic
- large theorem-heavy analysis panels

## Required Product Behavior

1. A student must be able to tell that these are field operations, not plain integer operations.
2. All operations must use explicit `integer` signals as inputs and outputs.
3. The modulus must remain explicit at the module level in V1.
4. Undefined operations, especially inversion of zero or non-invertible values, must fail explicitly.
5. The product must not imply that prime-field support means ECC support has already arrived.

## Why Prime Fields First

Prime fields are the correct first wave because they are:

- simpler to explain than binary fields
- directly relevant to the first honest ECC teaching path
- compatible with the new exact integer substrate and integer signal domain

Binary-field work can wait.

## Required Primitive Family

V1 should add a distinct family such as:

- `FieldAdd`
- `FieldSub`
- `FieldMul`
- `FieldInverse`

Names can vary slightly, but the family should read clearly as field arithmetic, not as generic number operators.

Do not reuse:

- `AddMod`
- `SubMod`
- `MulMod`
- `Modulo`

as if they were already field modules.

Those existing operators teach different semantics.

## Domain Semantics

These modules should operate on:

- visible `integer` input signals
- exact internal arithmetic
- explicit prime modulus parameters

The result is a field operation only when the modulus is prime.

V1 must be honest about that.

Options for V1 honesty:

- either validate primality and reject non-prime moduli
- or visibly downgrade the family to “modular arithmetic over a declared prime field candidate” and say so clearly

The recommended path is stricter:

- reject non-prime moduli in V1

That keeps the student model clean.

Because the modulus is a module parameter in V1 rather than a live signal, primality should be validated statically through MCW's normal parameter-validation path.

Students should see a normal module-level validation issue before execution, not discover non-primality only through runtime failure.

## Engine Requirements

### 1. Exact field arithmetic

All field operations must use the exact integer substrate.

No operation may depend on:

- JavaScript floating-point shortcuts
- 32-bit bitwise coercion
- fake `mod 2^n` composition

### 2. Integer-domain I/O

Inputs and outputs must use the visible `integer` signal domain.

V1 should not hide field values inside bits unless a user explicitly inserts an `IntegerToBits` bridge.

### 3. Explicit modulus handling

Each field primitive may accept the modulus as a numeric param in V1 if that remains within the supported exactness regime.

But the engine must normalize it through the exact substrate before use.

The modulus must not be hidden inside a global context.

The current supported regime for the modulus in V1 remains bounded by the product surface established in the exact-substrate work:

- modulus params must remain positive safe integers
- that means V1 prime-field arithmetic is still a bounded teaching substrate, not an ECC-scale prime substrate

This limitation should be treated as an honest V1 boundary, not worked around implicitly.

### 4. Inverse failure semantics

`FieldInverse` must fail explicitly when the input has no multiplicative inverse modulo `p`.

In the recommended prime-only regime, that mainly means:

- zero has no inverse

The error should be visible and interpretable, not a silent fallback.

In V1, this should surface through MCW's existing runtime/module error presentation path:

- the module should fail visibly
- the run should show the failure in the normal error surface

V1 should not introduce:

- sentinel output values
- implicit null field results
- silent coercion to zero or one

### 5. Field membership of input signals

V1 must be explicit about what happens when an integer-domain input is outside the canonical field range `0 .. p - 1`.

The recommended path is stricter and more teachable:

- reject out-of-range integer inputs explicitly at runtime

V1 should not silently auto-reduce arbitrary integer inputs into the field, because that hides an important membership boundary from students.

## Validation Requirements

V1 must validate at least:

- modulus is present
- modulus is a positive safe integer at the current product surface
- modulus is prime
- integer inputs are structurally valid integer-domain signals

Because the modulus is a parameter, prime validation should happen statically before execution.

Validation should distinguish:

- invalid parameter
- exactness-regime violation
- undefined operation at runtime
- out-of-field runtime input

Where validation can prevent a bad run ahead of time, it should.
Where the condition depends on the live input signal, the runtime failure should still be explicit and legible.

## UI Requirements

### 1. Clear field-family naming

The module names, inspector copy, and library descriptions must make it obvious that these are:

- prime-field operations

not just faster or fancier integer arithmetic.

The primary mechanical differentiator in V1 should be explicit in the product story:

- existing `AddMod` / `SubMod` / `MulMod` remain bit-word operators with `bits` I/O
- the new field family uses visible `integer` I/O

Students should be able to learn that distinction from both the module shape and the library copy, not from naming alone.

### 2. Inspector readability

Integer-domain values should remain readable through the existing integer inspector surface:

- decimal primary
- hex secondary

The field family should not invent a new opaque display format in V1.

### 3. “What this does not prove”

Where analysis or consequence copy appears, the product should say clearly:

- prime-field arithmetic is foundational
- it does not by itself imply curve security
- it does not by itself imply protocol security

At minimum, this limitation should appear in:

- the library/detail copy for the field family

It may also appear in demos or inspector copy, but V1 should commit to at least one always-visible teaching surface.

## Teaching Requirements

V1 should include at least one bounded demonstration path that makes field semantics visible.

Recommended candidates:

1. `Field inverse check`
- integer source -> `FieldInverse` -> `FieldMul` with original operand -> integer output
- demonstrates that `a * a^-1 mod p = 1`

2. `Plain modular vs field-family comparison`
- same visible integer operands through old modular operator path vs new field-family path
- only if the distinction can be shown honestly without clutter

Recommended V1 choice:

- the inverse-check path

It is the cleanest demonstration of why the field layer matters.

V1 should commit to:

- one demo workspace
- one tutorial

Challenge content is optional in this slice.

## Non-Goals

V1 should not:

- add curve points
- add scalar multiplication
- add ECDH
- add field-element as a richer typed object
- hide modulus context in wires
- collapse field primitives into generic arithmetic widgets

This is a foundation slice, not a prestige shortcut.

## Success Criteria

V1 is successful if:

1. MCW has a clearly named prime-field arithmetic family with integer-domain I/O.
2. The family is exact across the supported regime.
3. The product explicitly distinguishes field arithmetic from existing bit-word arithmetic.
4. Undefined operations fail visibly instead of degrading silently.
5. MCW is in a materially stronger position for point-mechanics work without yet pretending to support ECC.

## Likely Next Step

If this slice succeeds, the correct follow-on is:

- `ELLIPTIC-CURVE-POINT-MECHANICS-V1`

not protocol wrappers first.
