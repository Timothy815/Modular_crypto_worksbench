# Number-Theoretic Foundations — V1 Contract

**Status:** Shipped in v1.26.0
**Depends on:** ENGINE-V1-CONTRACT.md, CRYPTO-OPERATORS-V1.md, ARITHMETIC-EXPANSION-V1.md

---

## §1 Scope

Two new primitives that extend the arithmetic operator vocabulary into number theory:

| Module | Inputs | Outputs | Params | Semantics |
|---|---|---|---|---|
| `ModExp` | `base` (bits), `exp` (bits) | `out` (bits) | `modulus` (int ≥ 2) | base^exp mod modulus |
| `ModInverse` | `in` (bits) | `out` (bits) | `modulus` (int ≥ 2) | modular multiplicative inverse via extended Euclidean algorithm |

Plus one key-schedule demonstration workspace using existing primitives (no new modules).

---

## §2 ModExp

- Two `bits` inputs: `base` and `exp`.
- One `bits` output: `out`.
- `modulus` parameter: integer ≥ 2.
- Output width = base input width.
- Repeated-squaring algorithm for efficiency.
- Static validation: modulus must not exceed 2^(base width).
- JS safe-integer limit constrains practical use to ≤ 26-bit words.

## §3 ModInverse

- One `bits` input: `in`.
- One `bits` output: `out`.
- `modulus` parameter: integer ≥ 2.
- Output width = input width.
- Extended Euclidean algorithm.
- Throws at runtime if GCD(input, modulus) ≠ 1 (no inverse exists).
- Static validation: modulus must not exceed 2^(input width).
- Follows the `Modulo` single-input + modulus-param pattern.

## §4 Teaching Surface

### Demo Workspaces
- **Toy RSA** (`toy-rsa`): HexSource → ModExp(encrypt, e=3, n=15) → ModExp(decrypt, d=3, n=15) → BitsToHex → Output. Visible RSA round-trip with p=3, q=5.
- **Key Schedule Workshop** (`key-schedule-workshop`): One master key → two round-key branches. Round 1 uses master key directly; Round 2 derives via BitShifter(rotate-left 2) → XOR(round constant).

### Tutorials
- **Toy RSA Round-Trip**: 4 steps covering message, encryption, decryption, and round-trip verification.
- **Key Schedule Workshop**: 4 steps covering master key, direct use, derivation, and comparison.

### Challenges
- **Repair the RSA Exponent**: Private exponent broken from 03 to 02; student must restore the correct inverse.
- **Repair the Key Rotation**: BitShifter rotation broken from 2 to 5; student must restore the correct shift.

---

## §5 Validation

- Both modules have custom param validators (`validateModExpParam`, `validateModInverseParam`).
- Both have modulus-vs-width constraint checking in static validation.
- Both wired into `inferStaticBitWidth`: ModExp infers from `base`, ModInverse infers from input.

---

## §6 Deferred

- Analyze transformation views for ModExp and ModInverse (would benefit from a table or exponentiation trace — defer until classroom feedback).
- Larger moduli beyond JS safe-integer limit (would require BigInt plumbing throughout the engine).
- Euler's totient / Carmichael function as a visible module (not needed until key-generation becomes a teaching goal).
