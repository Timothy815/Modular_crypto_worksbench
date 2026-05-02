# Real-Scale Arithmetic Substrate V1

Last updated: May 2, 2026
Status: Proposed

## Purpose

Lift the hard ceiling on integer parameter sizes so that every shipped ECC and field arithmetic module can operate at real cryptographic key sizes — not just toy-curve pedagogy.

This slice follows:

- [ECC Point Python Export Parity V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-POINT-PYTHON-EXPORT-PARITY-V1.md)

It is a prerequisite for:

- [Named Curve Sources V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/NAMED-CURVE-SOURCES-V1.md)

It is not a new primitive contract.
It is not a named-curve contract.
It is not a UI redesign.

It is the substrate change that removes the last numerical wall between MCW's pedagogy and real-scale cryptography.

## Why This Slice Exists

MCW's ECC and field arithmetic modules already use `bigint` internally for all computation. That work was done. But a separate ceiling remains:

**Module params are still validated with `Number.isSafeInteger`.**

Every ECC module (`PointSource`, `ScalarMultiply`, `PointAdd`, etc.) stores its curve parameters `p`, `a`, `b`, `x`, `y` as JavaScript `number` values in the project definition. The engine reads them with `Number.isSafeInteger` guards before converting to `bigint` for arithmetic.

`Number.isSafeInteger` caps at `2^53 - 1`.

secp256k1's field prime p is approximately `2^256`.

The current architecture means:

- You can teach ECDH structure on a 17-element curve.
- You cannot load the actual secp256k1 generator point.
- The arithmetic is correct at any scale once it runs. But it can never run on real parameters because the params are rejected before the arithmetic runs.

Additionally, `EcCurveDescriptor` (the curve record embedded in every `ec-point` signal value) stores `p`, `a`, `b` as `number`, not `bigint`. This means a real secp256k1 point cannot be represented at the runtime signal level either.

This slice fixes both gaps.

## Current Architecture Facts

The following is accurate as of the date this contract was written:

- `IntegerSignal.value` is already a `string` (decimal). Supports arbitrary precision.
- `EcPointAffineValue.x` and `.y` are already `string` (decimal). Supports arbitrary precision.
- `EcCurveDescriptor.p`, `.a`, `.b` are `number`. **This is the wall.**
- All module `evaluate()` functions use `bigint` arithmetic. Correct at any scale.
- Module param schema uses `kind: 'number'` for all curve/modulus params. Goes through `Number.isSafeInteger`. **This is the wall.**
- `normalizePositiveSafeInteger()` and `normalizePrimeFieldModulus()` both require `Number.isSafeInteger`. **This is the wall.**

## Scope

### In scope

- Add a new param schema kind `'bigint-hex'` for module params that represent large integers, stored as uppercase hex strings in the project definition (e.g., `"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F"`)
- Change `EcCurveDescriptor.p`, `.a`, `.b` from `number` to `bigint` (this is a runtime-only type, not persisted directly)
- Update all ECC modules (`PointSource`, `PointNegate`, `PointDouble`, `PointAdd`, `PointEquals`, `PointOrder`, `PointOnCurve`, `ScalarMultiply`, `ChallengeCombine`, `ScalarLinearCombine`) to use `bigint-hex` params for `p`, `a`, `b`
- Update all field arithmetic modules (`FieldAdd`, `FieldSub`, `FieldMul`, `FieldNegate`, `FieldInverse`, `FieldExp`, `FieldSqrt`, `FieldReduce`, `ModReduce`, `IsQuadraticResidue`) to use `bigint-hex` for their modulus param
- Update `ModExp` and `ModInverse` to use `bigint-hex` for their modulus param
- Update `ScalarMultiply`, `ChallengeCombine`, and `ScalarLinearCombine` to use `bigint-hex` for their subgroup order `n` param
- Update the inspector param renderer to handle `bigint-hex` as a hex text input with appropriate validation
- Update Python export to emit large integer params as Python integer literals (hex notation: `int('0x...', 16)` or raw Python `0x...` literals)
- Add parity tests that compute real secp256k1 point arithmetic and verify against known test vectors
- Keep all existing toy-curve demos and challenges working unchanged (small values are valid hex strings)

### Out of scope

- Named curve source modules (that is NAMED-CURVE-SOURCES-V1)
- New ECC or field arithmetic primitives
- New teaching content
- Changes to the `bits` domain or `symbol` domain
- Changes to the `integer` signal value type (already a string)
- Changes to how large integers are displayed in the inspector (a follow-on UX concern)
- GF(2⁸) operations (that is GF2-FIELD-ARITHMETIC-V1)

## Required Product Behavior

### 1. Module params for large integers must be stored as hex strings

Any module param that represents a large integer — a prime modulus, a curve parameter, a point coordinate — must store its value as an uppercase hex string in the persisted project definition.

The new param kind is `bigint-hex`.

The inspector must render `bigint-hex` params as a plain text input. The user enters a hex string. The engine validates it as a non-negative integer.

Existing toy-curve demos must continue to work. Their params will be migrated to short hex strings (e.g., `17` → `"11"`, `2` → `"02"`, `3` → `"03"`).

### 2. EcCurveDescriptor must carry bigint curve parameters

The `EcCurveDescriptor` interface must change from:

```ts
interface EcCurveDescriptor {
  p: number;
  a: number;
  b: number;
}
```

to:

```ts
interface EcCurveDescriptor {
  p: bigint;
  a: bigint;
  b: bigint;
}
```

This is a runtime-only type. It is not directly serialized to JSON. The serialized form is inside `ModuleInstance.params` as hex strings.

All engine code that creates or reads `EcCurveDescriptor` must be updated accordingly.

### 3. Existing demos and challenges must produce identical outputs

All currently shipped ECC demos, tutorials, and repair challenges must still produce the same outputs after the param migration. The change is purely representational at the param layer — the arithmetic semantics are unchanged.

This is a non-negotiable regression requirement. The test suite must explicitly cover it.

### 4. Real-scale ECC must produce verifiable output

After this slice, it must be possible to:

1. Create a `PointSource` with secp256k1's `p`, `a=0`, `b=7`, and generator point `G_x`, `G_y` expressed as hex strings
2. Connect it to `ScalarMultiply` with a 256-bit scalar
3. Run the workspace
4. Receive an `ec-point` output whose coordinates match the expected result computed by a reference implementation

This is the acceptance criterion. The test suite must include at least one test at real secp256k1 scale.

### 5. Python export must emit large integer params correctly

When a workspace uses real-scale parameters, the exported Python code must emit those values as valid Python integers.

Acceptable forms:
- `int('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 16)`
- A raw Python integer literal

Python's `int` type is already arbitrary precision. The constraint is purely that the generator code must not truncate or lose precision when building the parameter expression strings.

## Implementation Notes

### 1. Param schema migration

The new `bigint-hex` param kind stores the value as a hex string. The existing `kind: 'number'` stores a JavaScript number. Modules that currently use `kind: 'number'` for large-integer params must migrate to `kind: 'bigint-hex'`.

The default value for these params changes from a small JavaScript integer to a short hex string. Example: `PointSource.params.p` changes from `defaultValue: 17` to `defaultValue: '11'`.

This is a breaking change to the persisted project format for any workspace that uses ECC or field arithmetic modules. A migration path must be provided: if a persisted param for a `bigint-hex` field is a `number`, the engine must accept it and coerce it to a hex string at load time. This preserves backward compatibility for all saved workspaces.

### 2. EcCurveDescriptor migration

After this change, the `normalizeEcCurveParams` function will parse hex-string params into `bigint` and return an `EcCurveDescriptor` with `bigint` values. All callers must be updated. This affects:

- `ec-point.ts` helpers
- All ECC module `evaluate()` functions
- Point arithmetic helpers (`_ec_point_add`, `_ec_point_double`, etc.)
- Analysis and display code that reads curve descriptors from signal values

### 3. Python export param encoding

In `python.ts`, all `getParamExpression()` calls for `bigint-hex` params must emit Python integer literals, not JavaScript number literals. The current path likely calls `JSON.stringify` or similar — that path will truncate large integers silently.

The safe path: for `bigint-hex` params, parse the hex string to a `bigint`, then emit `int('0x' + hexString, 16)` in the generated Python.

### 4. Inspector rendering

The `bigint-hex` param kind renders as a plain text `<input>`. Validation on blur:
- Must be a valid hex string (optional `0x` prefix accepted but stripped on normalize)
- Must represent a non-negative integer
- Must satisfy any module-specific constraints (e.g., must be prime for field modules)

Display convention: uppercase hex, no `0x` prefix, in the input value.

### 5. Backward compatibility and test migration

All existing ECC test workspaces in `python.test.ts` and `starter-challenges.ts` use toy-curve parameters (small integers). After the module param migration, these must be updated to pass short hex strings instead of small numbers. The computed outputs must remain identical.

## Test Requirements

### 1. Regression coverage for all existing ECC content

Every shipped ECC demo, tutorial, and challenge must have an explicit test asserting that output is unchanged after the param type migration.

### 2. Real-scale parity test

At least one test must:
- Build a workspace using secp256k1 parameters (`p`, `a=0`, `b=7`, `G_x`, `G_y`) as `bigint-hex` strings
- Run `ScalarMultiply` with a specific scalar
- Assert the output matches a known-good reference computed externally (e.g., `2G`, `k*G` for a known `k`)

This test is the acceptance criterion for the entire slice.

### 3. Python export parity at real scale

At minimum one Python export test must use real-scale secp256k1 parameters and verify that the exported Python computes the same result as `executeProject()`.

## Success Criteria

This slice is successful when:

1. A `PointSource` can be authored with secp256k1's field prime, generator coordinates, and curve coefficients without validation errors
2. Point arithmetic on that source produces verifiably correct results matching a reference implementation
3. All existing toy-curve ECC demos, challenges, and parity tests continue to pass unchanged
4. Python export correctly encodes large integer params and produces verifiable output for real-scale workspaces
5. The inspector correctly renders `bigint-hex` params as editable hex string fields
6. `EcCurveDescriptor` carries `bigint` values at runtime with no silent truncation anywhere in the pipeline

## Likely Next Step

After this slice, the natural next steps diverge:

- **NAMED-CURVE-SOURCES-V1**: add `NamedCurveBasePoint` and `NamedCurveScalarOrder` source modules that inject secp256k1/P-256 parameters without requiring the user to know the 78-digit prime
- **GF2-FIELD-ARITHMETIC-V1**: independent of this slice, can proceed in parallel if needed
