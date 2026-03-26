# Diffie-Hellman V1

## Status

Framed for `v1.37.0`.

## Purpose

Use the shipped number-theoretic foundations to teach a second asymmetric scenario beyond toy RSA.

This slice exists to solve a strategic product gap:
- `ModExp` and `ModInverse` are shipped
- `Toy RSA` proves the vocabulary can express one public-key workflow
- MCW still needs a second asymmetric teaching scenario to show that the number-theoretic line is general, not RSA-specific

The goal is not to introduce a full public-key suite.
The goal is to ship one bounded, visible Diffie-Hellman key-exchange teaching loop.

## Strategic Principle

**Teach shared-secret agreement from explicit exponentiation paths, not from a black-box “DH” module.**

That means:
- reuse shipped primitives wherever possible
- keep both sides of the exchange visible in the graph
- make the equality of the derived shared secret inspectable
- avoid hiding the protocol behind a single preset node

## Why Now

MCW now has:
- `ModExp`
- `ModInverse`
- arithmetic and comparison vocabulary
- protocol-material primitives
- explicit builder ergonomics strong enough to support larger teaching workspaces

That makes this the right time to validate the number-theoretic family with a second standard asymmetric scenario.
Diffie-Hellman is the cleanest next move because it is classroom-familiar, structurally honest, and can likely be expressed without new engine primitives.

## V1 Scope

V1 should stay bounded to **one explicit Diffie-Hellman key-exchange teaching scenario using existing primitives unless review proves one tiny helper is unavoidable**.

Primary user story:
- inspect the public parameters
- inspect Alice and Bob's private exponents
- watch each side compute its public value
- watch each side derive the same shared secret
- understand why the agreed secret matches without ever transmitting the secret directly

## Included

- one demo workspace focused on visible Diffie-Hellman key exchange
- one guided tutorial walking through:
  - public modulus and generator
  - Alice and Bob private exponents
  - public exchange values
  - matching shared secret derivation
- one challenge that breaks a DH parameter or exponent relationship and asks the learner to repair it
- use of existing arithmetic / number-theoretic modules wherever possible
- analysis visibility sufficient to compare the two derived shared-secret paths
- learning-sequence placement after `Toy RSA Round-Trip` and before any future signing or authenticated-exchange follow-on

## Explicitly Excluded

Do not include in V1:
- a monolithic `DiffieHellman` primitive
- full key generation from prime selection
- primality testing modules
- signing / verification
- elliptic-curve variants
- authenticated key exchange
- protocol transcript simulation beyond the visible shared-secret agreement
- large-integer / `BigInt` expansion

## Candidate Teaching Surface

### Demo Workspace
- **Diffie-Hellman Key Exchange**
  - public generator `g`
  - public modulus `p`
  - Alice private exponent `a`
  - Bob private exponent `b`
  - Alice public value: `g^a mod p`
  - Bob public value: `g^b mod p`
  - Alice shared secret path: `(g^b)^a mod p`
  - Bob shared secret path: `(g^a)^b mod p`
  - visible equality check of the two derived secrets
  - note: `p` is visible as a shared `ModExp` parameter across the exchange, not as a signal node; the tutorial should call this out explicitly

### Tutorial
- **Visible Shared Secret**
  - step 1: identify the public parameters
  - step 2: identify each private exponent
  - step 3: inspect the exchanged public values
  - step 4: inspect the matching shared-secret outputs

### Challenge
- **Repair the Shared Secret**
  - break one exponent or modulus/generator setting so the two secret paths no longer agree
  - learner restores the correct relationship so both sides derive the same value again

## Core Rules

1. **The exchange must remain explicit**
   - learners should be able to point to the exact path producing each public value and each shared secret
   - no hidden agreement logic

2. **The teaching loop must stay bounded**
   - one scenario
   - one demo
   - one tutorial
   - one challenge

3. **New primitives are not the default**
   - prefer composing the scenario from shipped modules
   - add a new primitive only if review identifies a clear expressiveness blocker

4. **Security realism stays honest**
   - this is a toy teaching surface using small values
   - do not imply production-safe parameter sizes or real-world deployment readiness

## Success Criteria

V1 is successful if:
- MCW can teach Diffie-Hellman visibly using the existing number-theoretic foundation
- learners can see both public exchange paths and both shared-secret derivations
- the shared-secret equality is inspectable and challengeable
- the product now has more than one asymmetric teaching scenario
- the slice deepens vocabulary without widening into full protocol simulation

## Likely Follow-Ons

Possible later slices, only if still justified:
- bounded signing / verification teaching line
- prime-generation or parameter-validation helpers
- authenticated key-exchange teaching follow-on
- broader asymmetric curriculum packaging after classroom feedback

## Explicitly Avoid Next

Do not turn this into:
- a catch-all public-key milestone
- a black-box asymmetric preset library
- `BigInt` engine expansion by stealth
- authenticated-encryption or signing in the same slice

Keep the first move narrow, visible, and built from honest parts.
