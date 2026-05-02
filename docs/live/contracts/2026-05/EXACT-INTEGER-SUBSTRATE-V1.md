# Exact Integer Substrate V1

Last updated: May 1, 2026
Status: Proposed

## Purpose

Replace MCW's current arithmetic dependence on JavaScript 32-bit bitwise coercion and unsafe `number`-only integer behavior with a bounded exact integer substrate suitable for future field arithmetic.

This is the first implementation step required by:

- [ECC Foundations Roadmap V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md)
- [Arithmetic Exactness Audit — 2026-05-01](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ARITHMETIC-EXACTNESS-AUDIT-2026-05-01.md)

It is not an ECC contract.
It is not a field-arithmetic contract.
It is not a signal-domain expansion contract.

It is the substrate repair needed before any of those can be honest.

## Problem

MCW currently ships a real toy number-theory line:

- `AddMod`
- `SubMod`
- `MulMod`
- `Modulo`
- `ModExp`
- `ModInverse`

But the arithmetic beneath those modules still depends on helpers like:

- `bitsToUnsignedNumber()`
- `unsignedNumberToBits()`

which currently use JavaScript bitwise operators in [src/engine/modules/bit-word.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/bit-word.ts).

That creates an implicit 32-bit coercion boundary and leaves several arithmetic modules numerically unsafe outside a bounded toy regime.

MCW can currently teach small modular arithmetic honestly.
It cannot yet claim that its arithmetic substrate is exact in a principled supported regime.

This slice fixes that.

## Goal

Introduce an exact integer substrate for current arithmetic modules, while keeping the product behavior stable for existing toy-number-theory and asymmetric teaching content.

The result should be:

- no hidden 32-bit coercion in arithmetic conversion helpers
- exact integer behavior across the supported regime
- explicit validation or rejection when parameters exceed the supported regime
- no silent wrong-answer path for future arithmetic growth

## Scope

V1 is intentionally bounded to the integer substrate used by current arithmetic modules.

In scope:

- exact integer conversion between bit vectors and integer values
- exact modular arithmetic helpers needed by current modules
- updating current arithmetic modules to use the new substrate
- updating validation to enforce explicit exactness boundaries
- updating Python export parity if needed for arithmetic consistency
- regression tests proving preserved behavior for current supported teaching content

Out of scope:

- new signal domains like `integer` or `ec-point`
- new finite-field primitives
- ECC point operations
- new end-user teaching content
- product-wide arithmetic inspector redesign

## Required Product Behavior

1. Current small-width toy arithmetic workspaces must still behave the same.
2. Existing demos like toy RSA and Diffie-Hellman must remain correct.
3. Arithmetic modules must no longer rely on signed 32-bit bitwise coercion for core exactness.
4. If a requested arithmetic configuration exceeds the supported exact regime, MCW must reject it explicitly rather than compute a plausible-looking wrong answer.
5. Python export must remain parity-correct for the supported arithmetic regime.

## Design Direction

V1 should prefer exact integer semantics over convenience.

The likely implementation direction is:

- use `bigint` inside the engine arithmetic substrate
- keep bit vectors as the external signal representation for now
- convert bit vectors to exact integers through non-bitwise helpers
- convert exact integers back to bit vectors through non-bitwise helpers
- only downcast to `number` where a bounded UI or parameter field explicitly requires it and the conversion is known safe

In V1, `bigint` should remain an internal engine detail.
It should not become:

- a new signal representation
- a new persisted parameter representation
- a new inspector-visible value type

Signals should stay what they are today at the product surface.
This slice is about arithmetic exactness, not about changing the user's visible data vocabulary.

This slice should not preserve unsafe `number` semantics just because they are currently convenient.

## Engine Requirements

### 1. Replace unsafe bit-word conversion

Current helpers in [src/engine/modules/bit-word.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/bit-word.ts) should no longer rely on:

- `<<`
- `>>`
- other signed 32-bit coercing bitwise operators

V1 should add exact helpers such as:

- bit-array to exact unsigned integer
- exact unsigned integer to fixed-width bit-array

These helpers must be exact across the supported regime.

### 2. Separate exact arithmetic from UI-friendly numeric params

Current arithmetic modules accept numeric params like `modulus` as `number`.

V1 may keep that user-facing parameter shape if needed, but the engine must normalize and validate it into an exact integer form before arithmetic uses it.

The separation should be explicit:

- UI param input representation
- exact engine arithmetic representation

### 3. Update current arithmetic modules

At minimum:

- [AddMod](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/add-mod.ts)
- [SubMod](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/sub-mod.ts)
- [MulMod](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mul-mod.ts)
- [Modulo](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/modulo.ts)
- [ModExp](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-exp.ts)
- [ModInverse](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/mod-inverse.ts)
- [Counter](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/modules/counter.ts) because it also depends on the same bit-word conversion helpers

should use the new exact substrate rather than unsafe `number` conversion.

### 4. Explicit supported regime

V1 must define the supported exact arithmetic regime clearly in code.

Concrete candidate regime for V1:

- arithmetic modules may use internal exact `bigint` helpers for conversion and computation
- user-facing numeric params that remain serialized as JavaScript numbers must be restricted to safe integers
- any arithmetic parameter still represented through the current numeric param system must satisfy:
  - `Number.isSafeInteger(value) === true`
  - existing positivity constraints where applicable
- any arithmetic bit-vector conversion used by these modules must be exact by construction under the new helper contract, not by accidental 32-bit coercion behavior

Conservative candidate boundary for initial implementation:

- keep current user-facing arithmetic params in the safe-integer regime
- allow only those arithmetic module configurations whose bit-vector-to-integer conversion and inverse conversion are exact under the new internal helper layer

The exact line is an implementation decision, but it must be:

- explicit
- validated
- test-covered

It must not remain an accidental side effect of JavaScript internals.

## Validation Requirements

Current validation checks mainly enforce structural range relations like:

- modulus must not exceed the input word range

V1 must add exactness-aware validation where needed.

Examples:

- reject arithmetic params that cannot be represented exactly in the chosen user-facing regime
- reject arithmetic widths or configurations that exceed the substrate's promised exact support
- distinguish:
  - structurally invalid
  - out of supported exactness regime

Exactness failures should surface through MCW's existing validation/error presentation path, not through ad hoc runtime-only failure where validation could have caught the issue first.

The user should not receive a numerically wrong result when an explicit validation issue could have prevented it.

## Python Export Requirements

Python export already supports the current arithmetic module family.

If V1 changes arithmetic semantics or helper logic in a way that affects parity, Python export must be updated to match the exact engine behavior.

Important current reality:

- Python export has its own parallel arithmetic/runtime helper path
- it does not automatically inherit engine arithmetic fixes

So this slice must explicitly audit and update both:

- engine arithmetic behavior
- Python export arithmetic behavior

This slice does not need to redesign export productization, but it must preserve:

- workspace parity
- demo parity
- test parity

especially for:

- `ModExp`
- `ModInverse`
- `MulMod`

## Testing Requirements

V1 must include regression coverage for:

1. preserved correctness on currently shipped toy content
- toy RSA
- Diffie-Hellman demo

2. exactness at widths that were previously on the dangerous boundary
- especially above 31-bit conversion-sensitive cases

3. validation failure instead of silent wrong answers beyond the supported regime

4. Python export parity where arithmetic helpers changed

5. module-level correctness for each updated arithmetic primitive

This slice is foundational enough that tests are not optional.

## User-Facing Expectations

This slice is primarily substrate work, so visible UI changes should remain minimal.

However, if exactness limits become newly explicit, the product may need:

- clearer validation copy
- more precise arithmetic error messages
- possibly a manual note later

V1 does not need a major new teaching surface.

It does need to stop lying by omission through silent unsafe arithmetic.

## Non-Goals

V1 should not:

- add ECC protocol modules
- add field arithmetic modules
- add point types
- introduce a broad algebraic UI
- silently widen the product claim to "arbitrary precision everywhere"

This is a substrate hardening slice, not a vocabulary expansion slice.

## Success Criteria

V1 is successful if:

1. MCW's current arithmetic primitives no longer depend on unsafe 32-bit bitwise conversion for exactness.
2. Existing small arithmetic teaching content still works unchanged.
3. Out-of-regime arithmetic configurations are rejected explicitly.
4. Python export still matches engine behavior for the supported regime.
5. Arithmetic modules and helper call sites no longer rely on the old unsafe 32-bit bitwise conversion path for their supported exact behavior.

## Likely Next Step

If this slice succeeds, the next correct follow-on is:

- `ALGEBRAIC-SIGNALS-V1`

Not ECC directly.
Not point arithmetic directly.

The sequence should remain:

1. exact integer substrate
2. algebraic signal vocabulary
3. prime-field arithmetic
4. point mechanics

That order is part of the contract logic.
