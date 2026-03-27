# Digital Signature Foundations V1

## Status

Framed for `v1.43.0`.

## Purpose

Deepen MCW's modern-cryptography teaching language so it can express asymmetric authentication, not just asymmetric confidentiality or shared-secret agreement.

This slice exists to solve the next strategic product gap after `v1.42.0`:
- `ModExp` and `ModInverse` are shipped
- `Toy RSA` is shipped as a visible asymmetric encryption/decryption teaching loop
- `Diffie-Hellman` is shipped as a visible shared-secret agreement teaching loop
- symmetric integrity/authentication and AEAD-style composition are now shipped
- MCW still does not have one bounded teaching surface showing how one party can prove authorship with a private key and another party can verify with a public key

The goal is not to ship a full signature suite, certificate chains, or PKI.
The goal is to add one bounded, visible digital-signature teaching loop that makes "signing is not encrypting" explicit.

## Strategic Principle

**Asymmetric authentication must remain visible signature and verification structure, not a black-box trust label.**

That means:
- the signed message path should remain inspectable
- the signature path should remain inspectable
- the verification path should remain inspectable
- learners should be able to point to the private-key signing step and the public-key verification step separately
- no monolithic `Signature`, `RSA-Sign`, or certificate wrapper should hide the structural lesson

## Why Now

MCW now has:
- number-theoretic foundations through `ModExp` and `ModInverse`
- one visible asymmetric encryption/decryption surface (`Toy RSA`)
- one visible asymmetric key-agreement surface (`Diffie-Hellman`)
- a completed modern symmetric-composition arc through AEAD-style teaching

That means the next honest step is not stronger symmetric refinement and not protocol handshakes.
The next honest step is a bounded asymmetric-authentication slice that completes the teaching contrast between:
- encrypting for secrecy
- authenticating with shared secrets
- authenticating with a private/public key split

## V1 Scope

V1 should stay bounded to **one explicit toy signature-and-verification teaching scenario using existing number-theoretic foundations unless review proves one tiny helper is unavoidable**.

Primary user story:
- inspect a visible message
- inspect the sender's private-key signing path
- inspect the receiver's public-key verification path
- inspect a visible pass/fail result
- understand why signing proves source differently than encryption or shared-secret MAC-style authentication

## Included

- one bounded digital-signature demo workspace
- one guided tutorial explaining:
  - visible message path
  - sender-side signing with a private exponent/key
  - receiver-side verification with a public exponent/key
  - visible comparison / verification result
- one challenge that breaks one visible exponent, routing, or verification relationship and asks the learner to repair it
- reuse of shipped number-theoretic and comparison foundations wherever possible
- explicit teaching contrast between signing and encrypting
- learning-sequence placement after the framed AEAD foundations slice and before any future certificate / protocol-trust line

## Explicitly Excluded

Do not include in V1:
- certificate chains, PKI, or identity infrastructure
- industrial signature schemes or padding standards
- elliptic-curve signatures
- transcript or handshake choreography
- a generic "trusted identity" wrapper
- hash-agility / algorithm-picker UI
- `BigInt` expansion

## Candidate Teaching Surface

### Demo Workspace
- **Visible Signature Verification**
  - one visible message source
  - one visible sender-side signing path using shipped number-theoretic parts
  - one visible receiver-side verification path using the corresponding public-key relationship
  - one visible comparison / verification point
  - one visible pass/fail output
  - the expected shape is a flat graph that shows "private side signs, public side verifies" explicitly, not a preset signature node
  - the expected module shape is deliberately small: one visible message source, one `ModExp` signing step with a private exponent, one `ModExp` verification step with a public exponent, one `Equals` comparing the verified value against the original message, one `BitOutput` for pass/fail, and readable taps only if they help teaching clarity
  - key parameters should reuse the shipped toy RSA-style relationship (`e = 3`, `d = 3`, `n = 15`, or similar small safe teaching values), and the asymmetry should be visually obvious on the canvas: the private signing path feeds the public verification path, not vice versa

### Tutorial
- **Signing Is Not Encrypting**
  - step 1: identify the visible message path
  - step 2: inspect the sender-side signing step
  - step 3: inspect the receiver-side public verification step
  - step 4: compare this flow against RSA-style encryption and symmetric authentication

### Challenge
- **Repair the Signature**
  - break one visible exponent, key relationship, or verification input
  - learner restores it so the verification output matches the reference machine again

## Core Rules

1. **Signing and verification must stay explicit**
   - learners should be able to trace the signing path and the verification path separately
   - no hidden trust wrapper

2. **The first move stays bounded**
   - one demo
   - one tutorial
   - one challenge
   - no certificate or protocol-suite bundling

3. **Reuse shipped foundations**
   - prefer `ModExp`, `ModInverse`, visible sources, and `Equals`
   - add a new primitive only if review identifies a real expressiveness blocker

4. **Teaching contrast matters**
   - the slice should make it obvious that signing is not encrypting and not a shared-secret MAC
   - the learner should leave able to say "only the private side can produce this proof, but the public side can check it"

## Success Criteria

V1 is successful if:
- MCW can teach one visible asymmetric-authentication loop using shipped number-theoretic foundations
- learners can identify the sender-side signing step and the receiver-side public verification step
- the slice makes the distinction between encryption, shared-secret authentication, and digital signatures clearer than prose alone
- the design prepares for later certificate / trust / handshake follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- a second signature-oriented teaching surface if the first one proves classroom value
- certificate / trust-chain teaching after standalone signatures are individually clear
- handshake / protocol-trust composition only if it stays visible and inspectable

## Explicitly Avoid Next

Do not turn this into:
- a catch-all public-key identity milestone
- a certificate or PKI bundle
- elliptic-curve expansion by stealth
- a generic "trust this sender" wrapper
- a protocol-suite milestone disguised as one signature demo

Keep the first move narrow, visible, and number-theoretically honest.
