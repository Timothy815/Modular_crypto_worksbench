# Named Curve Sources V1

Last updated: May 2, 2026
Status: Proposed

## Purpose

Let students build real ECDH, Schnorr, and key-agreement workspaces on secp256k1 and P-256 without knowing the 78-digit field prime, generator coordinates, or subgroup order — while keeping the full machinery visible.

This slice follows:

- [Real-Scale Arithmetic Substrate V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/REAL-SCALE-ARITHMETIC-SUBSTRATE-V1.md)

It is a prerequisite for any future real-curve ECDSA or Schnorr signature work.

It is not a signature contract.
It is not a hash contract.
It is not a named-algorithm contract for AES or SHA.

It is the minimum ergonomic layer that makes real-curve ECC workspaces buildable without requiring memorization of curve constants.

## Why This Slice Exists

After REAL-SCALE-ARITHMETIC-SUBSTRATE-V1, a student can build a secp256k1 workspace by manually entering the field prime, generator coordinates, and subgroup order as hex strings. That is educational once — showing that the curve is defined by explicit constants is a valid lesson.

But in practice it means:
- copy-pasting a 64-character hex string into every `PointSource` param
- repeating it for every downstream module that also takes `p`, `a`, `b` as params
- any typo silently producing a wrong curve

The wall between "understanding the structure" and "actually running real ECC" should not be 64-character hex input friction. That friction serves no pedagogical purpose once the student has seen the structure.

This slice removes it.

## Scope

### In scope

- A `NamedCurveBasePoint` source module with a `curve` dropdown param (secp256k1, P-256) that outputs:
  - `point`: an `ec-point` signal representing the standard generator point G with the full real curve embedded
  - `order`: an `integer` signal representing the subgroup order `n`
- An internal named-curve registry with accurate parameters for secp256k1 and P-256 (NIST P-256 / prime256v1)
- An inspector "Load Curve Preset" helper on all ECC modules that take `p`, `a`, `b` params — a dropdown that auto-fills those params from a named preset without requiring the user to copy hex strings
- A `secp256k1 ECDH` demo workspace showing real ECDH using `NamedCurveBasePoint` as the shared base point, two scalar private keys, and `ScalarMultiply` and `PointEquals` to demonstrate shared-secret derivation
- Python export support for `NamedCurveBasePoint`
- At least one parity test exporting the secp256k1 ECDH workspace to Python and verifying the output matches `executeProject()`

### Out of scope

- Curve25519 / Ed25519 / Edwards curves (different curve form — not short Weierstrass; requires separate substrate work)
- Brainpool curves, NIST curves beyond P-256
- ECDSA (different contract)
- Schnorr on real curves (different contract, builds on this one)
- SHA-256 parameter packs (different track — AES/SHA constants are not ECC constants)
- Automatic curve detection or inference from a point signal
- Named-algorithm presets for anything other than ECC curve parameters

## Named Curve Parameters

The following parameters must be correct and sourced from authoritative standards documents.

### secp256k1 (Bitcoin / most common ECC pedagogy)

```
p  = FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a  = 0
b  = 7
Gx = 79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
n  = FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
h  = 1
```

### P-256 (NIST P-256 / prime256v1 — most widely deployed)

```
p  = FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
a  = FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC
b  = 5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B
Gx = 6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296
Gy = 4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5
n  = FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
h  = 1
```

These values must be verified against the primary standards references (SEC 2 for secp256k1, NIST FIPS 186-5 for P-256) before shipping.

## Required Product Behavior

### 1. NamedCurveBasePoint outputs a real point with real curve embedded

When a student places a `NamedCurveBasePoint` module and selects `secp256k1`, the `point` output must carry an `ec-point` signal with:

- `curve.p`, `curve.a`, `curve.b` equal to the secp256k1 field parameters
- `x`, `y` equal to the secp256k1 generator coordinates
- `kind: 'affine'`

Downstream modules that accept this point signal will inherit the embedded curve descriptor, and their own `p`, `a`, `b` params must match it or the existing cross-curve validation rejects them.

The `order` output must carry an `integer` signal with the secp256k1 subgroup order `n` encoded as a decimal string.

### 2. The inspector Load Curve Preset fills p, a, b on any ECC module

Any ECC module with `p`, `a`, `b` params in its inspector must show a "Load curve preset" dropdown alongside those fields.

Selecting a named curve from the dropdown fills the `p`, `a`, `b` fields with the correct hex-string values for that curve. This is a UI-only operation — it does not add a curve dependency to the module or change how the module evaluates. The params are just pre-populated hex strings that the student can subsequently verify or change.

This avoids requiring the student to copy-paste 64-character hex values by hand while keeping the fact that these are explicit module params fully visible.

### 3. Python export must emit named-curve params correctly

Exported Python for a workspace using `NamedCurveBasePoint` must emit the curve parameters as Python integer literals — the full hex values, not variable references to a named standard.

Acceptable:

```python
base_point = named_curve_base_point('secp256k1')
```

where `named_curve_base_point` is a Python runtime helper that returns the curve's G as an ec-point dict with the correct coordinates. The helper must not obscure the values — it must be defined inline in the generated Python with explicit literal constants.

### 4. Cross-curve mismatch validation still applies

`NamedCurveBasePoint` participates in the same cross-curve mismatch validation as any other `PointSource`. If a workspace mixes a secp256k1 base point with P-256 params on a downstream module, the engine must reject it with the same explicit error it would produce for any other curve mismatch.

Named curves are not a bypass of the existing point-domain type safety.

### 5. Existing toy-curve workspaces are unaffected

No existing demo or challenge uses `NamedCurveBasePoint`. This module is purely additive. All existing toy-curve ECC content continues to work without any modification.

## Implementation Notes

### 1. Named curve registry

Implement a small internal lookup table:

```ts
const NAMED_CURVES = {
  'secp256k1': { p: '...', a: '0', b: '7', gx: '...', gy: '...', n: '...' },
  'P-256': { p: '...', a: '...', b: '...', gx: '...', gy: '...', n: '...' },
} as const;
```

Keep this as engine-internal. It is not a user-extensible registry. It is not a general-purpose curve database.

### 2. NamedCurveBasePoint evaluate()

The module's `evaluate()` reads the `curve` param from the registry, parses all values to `bigint`, and emits:

- `point`: an `ec-point` signal using `createAffineEcPointSignal` with the full curve descriptor
- `order`: an `integer` signal with the subgroup order as a decimal string

No validation beyond the curve name being recognized is needed at evaluate-time. The curve parameters in the registry are pre-validated.

### 3. Python runtime helper

Add a `_named_curve_base_point(curve_name)` Python helper to the export runtime that returns the G point and order as an `ec-point`-compatible dict. The helper must include the literal coordinates in its body — do not reference any external library.

Example structure (values abbreviated):

```python
def _named_curve_base_point(curve_name):
    CURVES = {
        'secp256k1': {
            'p': 0xFFFFFFF...FC2F,
            'a': 0,
            'b': 7,
            'gx': 0x79BE667...798,
            'gy': 0x483ADA7...4B8,
            'n': 0xFFFFFFF...141,
        },
        ...
    }
    if curve_name not in CURVES:
        raise ValueError(f"Unknown named curve: {curve_name}")
    c = CURVES[curve_name]
    curve = {'p': c['p'], 'a': c['a'], 'b': c['b']}
    return {
        'point': {'kind': 'affine', 'curve': curve, 'x': str(c['gx']), 'y': str(c['gy'])},
        'order': {'type': 'integer', 'value': str(c['n'])},
    }
```

## Test Requirements

### 1. Named curve registry correctness

Verify that the shipped secp256k1 and P-256 parameters satisfy the curve equation:

```
Gy² ≡ Gx³ + a·Gx + b (mod p)
```

This is a pure arithmetic check that does not depend on any external library.

### 2. secp256k1 ECDH parity

Export the secp256k1 ECDH demo to Python and verify that:
- Both shared-point branches produce the same `ec-point` value
- `PointEquals` emits `1`
- The shared point coordinates match a known reference (computable from the registry values)

### 3. PointOnCurve with named curve base point

A workspace feeding `NamedCurveBasePoint.point` directly into `PointOnCurve` (with matching `p`, `a`, `b` params) must emit `1`.

## Success Criteria

This slice is successful when:

1. A student can place `NamedCurveBasePoint`, select secp256k1 or P-256, and get a real generator point with no manual hex entry
2. The secp256k1 ECDH demo workspace runs in the app and produces verifiable shared-secret coordinates
3. That demo exports to Python and the exported Python produces the same shared-secret coordinates
4. Cross-curve mismatch validation still applies to named-curve points
5. No existing demo or challenge is broken

## Likely Next Step

After this slice, the most natural follow-on is:

- A real-curve Schnorr or ECDSA signature demo built on secp256k1 — using the full ECC foundation, named curve sources, and a hash function output as a challenge scalar
- Or a focused SHA-256 parameter pack slice if hash integration is needed first
