# GF(2⁸) Field Arithmetic V1

Last updated: May 2, 2026
Status: Proposed

## Purpose

Add byte-level multiplication and inversion over GF(2⁸) so that MCW can express AES's MixColumns step — and more broadly, so students can see why AES needs a field structure that XOR alone cannot provide.

This slice does not depend on REAL-SCALE-ARITHMETIC-SUBSTRATE-V1 or NAMED-CURVE-SOURCES-V1.
It operates entirely in the `bits` domain.
It can proceed independently.

It is not a full AES round contract.
It is not a key-schedule contract.
It is not an AES cipher contract.

It is the bounded primitive layer that makes honest AES construction possible. Without it, a student can wire up SubBytes (already expressible with the shipped `SBox`), ShiftRows (already expressible with `SymbolPermutation` or byte-window operations), and AddRoundKey (already expressible with `XOR`) — but MixColumns requires field multiplication that does not exist yet.

## Why This Slice Exists

The four AES operations that compose a round are:

| Operation | Requires | Current MCW status |
|---|---|---|
| AddRoundKey | XOR | Ships. |
| SubBytes | 8-bit lookup table | Ships as `SBox` with Rijndael table. |
| ShiftRows | Byte-order permutation | Ships via `SymbolPermutation` or `ByteRotate`. |
| MixColumns | GF(2⁸) multiplication | **Missing.** |

MixColumns mixes each four-byte column by multiplying its bytes against a fixed matrix over GF(2⁸) with reduction polynomial `x⁸ + x⁴ + x³ + x + 1` (0x11B). It cannot be expressed as XOR, bit-shift, or any combination of currently shipped primitives.

Without GF(2⁸) multiplication, MCW can show AES's structure but cannot compute a real AES round output. The student learns the anatomy without being able to run the body.

This slice adds the missing organ.

## Scope

### In scope

- `GF2Mul` primitive: multiplies two 8-bit inputs in GF(2⁸) with a configurable reduction polynomial param
  - inputs: `a` (bits[8]), `b` (bits[8])
  - output: `out` (bits[8])
  - param: `poly` (bigint-hex, the irreducible reduction polynomial; default: `11B` for AES)
- `GF2Inv` primitive: multiplicative inverse in GF(2⁸) for a given reduction polynomial
  - input: `in` (bits[8])
  - output: `out` (bits[8])
  - param: `poly` (bigint-hex; default: `11B` for AES)
  - note: inverse of `00` is defined as `00` (conventional for AES S-box derivation)
- Analyze transformation view for `GF2Mul` — the `arithmetic` view kind, showing the multiplication expression, the reduction polynomial, and the input/output bytes in hex
- A `GF(2⁸) Multiply` demo workspace showing `GF2Mul` with the AES reduction polynomial and two explicit byte inputs, with the output visible
- A `Why AES Needs GF(2⁸)` tutorial placed after `When Bits Become Bytes`
- A `Repair the GF Multiply` repair challenge: the reduction polynomial param is wrong (uses `11D` instead of `11B`), breaking the output; the student must restore the correct AES polynomial
- Python export support for `GF2Mul` and `GF2Inv`
- Parity tests for both primitives

### Out of scope

- A full MixColumns primitive (4-byte matrix step — a later contract)
- A full AES round primitive (a later contract)
- AES key schedule
- AES as a complete enciphering cipher
- GF(2^k) for k ≠ 8 (generalizing to other field sizes is not needed for this slice)
- GF multiplication over large primes (that is the prime-field domain, already shipped)
- Decryption (requires InvMixColumns, a separate derivation)
- The Rijndael S-box derivation using `GF2Inv` plus affine transform (interesting but a separate teaching moment)

## Required Product Behavior

### 1. GF2Mul must produce correct AES field products

With the default reduction polynomial (`11B` = `x⁸ + x⁴ + x³ + x + 1`):

- `GF2Mul(02, 03)` must produce `05`
- `GF2Mul(02, 02)` must produce `04`
- `GF2Mul(FF, 01)` must produce `FF`
- `GF2Mul(57, 83)` must produce `C1` (the AES specification example)

These are not optional coverage cases. They are the acceptance criterion.

### 2. GF2Mul with a different polynomial produces a different output

The `poly` param must actually affect the computation. If a student changes the polynomial from `11B` to a different 9-bit polynomial, the output for the same inputs must change. The module is not hard-coded to AES.

### 3. GF2Inv must be the true multiplicative inverse

For any nonzero byte `a`, `GF2Mul(a, GF2Inv(a))` must produce `01`.

`GF2Inv(00)` must produce `00` by convention.

### 4. Invalid polynomial must be rejected

The `poly` param must represent a degree-8 irreducible polynomial over GF(2). At minimum, it must be a 9-bit value (bit 8 set, representing the `x⁸` term). The module should validate:
- The polynomial has bit 8 set (minimum check for a degree-8 polynomial)
- The polynomial is a positive integer within the valid 9-bit range

Full irreducibility checking is not required in V1. Validating bit 8 is the minimum honest check.

### 5. Output must carry 8-bit width

Both `GF2Mul` and `GF2Inv` always output exactly 8 bits, regardless of input values. The output is always in the field, never wider.

### 6. Inputs must be exactly 8 bits wide

Both primitives validate that their inputs are exactly 8 bits wide at evaluation time. If the input width is statically knowable, static validation should also reject wrong-width inputs before evaluation.

## GF(2⁸) Arithmetic

For reference, the algorithm both primitives use:

**GF2Mul(a, b)**: Russian peasant algorithm over GF(2).
```
result = 0
while b > 0:
    if b & 1:
        result ^= a
    high_bit = a & 0x80
    a = (a << 1) & 0xFF
    if high_bit:
        a ^= (poly & 0xFF)  # reduce by the low 8 bits of poly
    b >>= 1
return result
```

**GF2Inv(a)**: Extended Euclidean algorithm over GF(2)[x], or equivalently a lookup table for the fixed AES polynomial. Either is acceptable. The lookup table approach is simpler and correct for a fixed polynomial. The extended Euclidean approach respects the configurable poly param.

If a lookup table is used for the default `11B` polynomial, a live-computed extended-Euclidean path should also be provided for other polynomial values.

## Analyze Transformation View

`GF2Mul` gets an `arithmetic` analyze view showing:
- The input bytes a and b in hex
- The reduction polynomial in hex
- The expression: `a ⊗ b mod poly`
- The output byte in hex
- A note: "Multiplication uses carry-less (XOR) arithmetic reduced by the irreducible polynomial"

This is consistent with how the existing arithmetic transformation views render field expressions.

## Implementation Notes

### 1. Bits domain, not integer domain

`GF2Mul` and `GF2Inv` operate on `bits` signals, not `integer` signals. An 8-bit GF field element is a byte — 8 bits — not an arbitrary-precision integer. Keeping them in the bits domain keeps them composable with `XOR`, `SBox`, `ByteRotate`, and the other byte-oriented primitives that already ship.

Do not introduce an `integer` ↔ `bits` bridge inside these modules. The input and output are both bits[8] and the arithmetic is internal.

### 2. The poly param

The `poly` param should use the `bigint-hex` kind (from REAL-SCALE-ARITHMETIC-SUBSTRATE-V1) since it represents a small integer — 9 bits at most for GF(2⁸). However, `GF2-FIELD-ARITHMETIC-V1` is independent of that substrate slice. If `bigint-hex` is not yet shipped when this slice is implemented, use a `number` param with explicit validation that the value is a 9-bit integer. Either form works. The poly value for AES is `0x11B = 283`.

### 3. The reduction polynomial representation

`0x11B` represents the polynomial `x⁸ + x⁴ + x³ + x + 1`. Bit 8 (value 256) represents the `x⁸` term. This is the standard representation used by the AES specification and most field arithmetic literature. The module should use this representation consistently in its description and param label.

### 4. No dependency on REAL-SCALE-ARITHMETIC-SUBSTRATE-V1

This slice should proceed regardless of whether the large-integer param substrate is ready. The GF(2⁸) primitives are self-contained byte operations.

### 5. Python export

Both `GF2Mul` and `GF2Inv` need Python runtime implementations. These are simple to write:
- `GF2Mul`: Russian peasant loop in pure Python (no external deps)
- `GF2Inv`: lookup table for the AES polynomial, or extended Euclidean for generality

Python implementation example for GF2Mul:

```python
def gf2_mul(a_bits, b_bits, poly=0x11B):
    a = int(''.join(str(x) for x in a_bits), 2)
    b = int(''.join(str(x) for x in b_bits), 2)
    result = 0
    while b > 0:
        if b & 1:
            result ^= a
        high_bit = a & 0x80
        a = (a << 1) & 0xFF
        if high_bit:
            a ^= (poly & 0xFF)
        b >>= 1
    return [int(x) for x in format(result, '08b')]
```

## Test Requirements

### 1. AES specification examples

At minimum:
- `GF2Mul(57, 83, poly=0x11B)` → `C1`
- `GF2Mul(02, 0F, poly=0x11B)` → `1E`
- `GF2Mul(02, 02, poly=0x11B)` → `04`

These are drawn from the AES specification (FIPS 197, Appendix B) and are the canonical acceptance tests.

### 2. Inverse correctness

For a selection of nonzero bytes, `GF2Mul(a, GF2Inv(a))` → `01`.

Special case: `GF2Inv(00)` → `00`.

### 3. Python export parity

Export a workspace containing `GF2Mul` to Python and verify the output matches `executeProject()` for the AES specification example inputs.

### 4. Invalid input width rejection

Attempting to feed a bits[4] signal into `GF2Mul` must produce a validation error, not a silent wrong answer.

## Repair Challenge: Repair the GF Multiply

**Source workspace**: `GF(2⁸) Multiply` demo with the AES reduction polynomial.

**Break**: Change `poly` from `11B` to `11D` (`x⁸ + x⁴ + x³ + x² + 1`, a different valid irreducible polynomial over GF(2) but not the AES polynomial). The output changes from the AES-specified value to a different field product.

**Student task**: Restore the correct AES reduction polynomial.

**Hints**:
- The AES specification defines a specific irreducible polynomial for its field.
- `11D` and `11B` are both irreducible over GF(2) — both define valid fields — but AES specifically uses `11B`.
- Check the `poly` parameter against the AES specification value.

## Success Criteria

This slice is successful when:

1. `GF2Mul` computes correct GF(2⁸) field products for all AES specification examples
2. `GF2Inv` is the true multiplicative inverse under the same polynomial
3. A student can wire `SBox` + `GF2Mul` + `XOR` in a workspace and see the beginnings of a real AES round
4. The demo, tutorial, and challenge ship
5. Python export parity is confirmed for both primitives
6. No existing content is broken

## Likely Next Step

After this slice, the most natural single-contract follow-on is:

- **MixColumns V1**: a 4-byte MixColumns primitive that uses `GF2Mul` to perform the matrix step — implementing the AES MixColumns as a visible operation on a 4-byte column input, with the fixed AES MDS matrix visible in the module params

With SubBytes (SBox), ShiftRows (SymbolPermutation / ByteRotate), MixColumns (from this slice's `GF2Mul`), and AddRoundKey (XOR), a complete visible AES round becomes expressible.
