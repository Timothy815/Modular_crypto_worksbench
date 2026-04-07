# Integrity Authentication V1

## Status

Shipped in `v1.41.0`.

## Purpose

Deepen MCW's modern-cryptography teaching language so it can express the difference between confidentiality and integrity/authentication from explicit visible parts rather than from prose alone.

This slice exists to solve the next strategic product gap after `v1.40.0`:
- hashing foundations are shipped
- visible block chaining is shipped
- byte/word-oriented helpers are shipped
- MCW can now teach message mixing and block-to-block context honestly
- MCW still does not have one bounded teaching surface showing how a construction can detect tampering even when confidentiality is not the main lesson

The goal is not to ship AEAD, TLS, signatures, or a full protocol suite.
The goal is to add one bounded integrity/authentication teaching loop that makes "tamper evidence" visible and distinct from encryption.

## Strategic Principle

**Integrity/authentication must remain an explicit comparison of message plus authenticator state, not a black-box security label.**

That means:
- the authenticator path should be visible on the canvas
- learners should be able to point to what data is authenticated and where comparison happens
- the teaching surface should make it obvious that integrity is not the same thing as hiding the message
- no monolithic "secure message" wrapper should hide the structural lesson

## Why Now

MCW now has:
- explicit hashing constructions
- explicit block framing and chaining
- explicit byte/word structure helpers
- guided challenge and compare surfaces strong enough to support tamper-repair teaching loops

That means the next honest step is not AEAD and not signatures.
The next honest step is one bounded integrity/authentication slice that separates "detect modification" from "encrypt data."

## V1 Scope

V1 should stay bounded to **one explicit authenticator-style teaching scenario where a message and a visible tag/check value are compared to detect tampering**.

Primary user story:
- inspect one message path
- inspect one authenticator or tag path derived from the same message and key/context material
- compare a candidate tag against the expected tag visibly
- tamper with the message or tag and observe verification failure
- understand that the point is detection, not secrecy

## Included

- one bounded integrity/authentication demo workspace
- one guided tutorial explaining message, authenticator, and verification comparison
- one challenge that breaks one visible tag/comparison relationship and asks the learner to repair it
- reuse of shipped hashing and comparison foundations wherever possible
- explicit contrast between readable message content and the separate authenticator path
- learning-sequence placement after `Visible Byte Order` and before any future AEAD or signature line

## Explicitly Excluded

Do not include in V1:
- AEAD / GCM / CCM / ChaCha20-Poly1305
- signatures or public-key authentication
- HMAC as a branded industrial construction unless review proves the first slice truly needs it
- protocol transcript orchestration
- nonce-management or replay-defense systems
- password hashing / KDF work
- a generic "authenticated channel" wrapper

## Candidate Teaching Surface

### Demo Workspace
- **Visible Tamper Check**
  - one visible sender message source and one visible receiver-side message path
  - one visible key or context source per side when needed to keep sender and verifier roles inspectable
  - one explicit toy keyed-hash shape built from shipped parts: message mixed with key/context, split into visible bytes, then hashed with a shipped hash composite to produce a tag
  - one receiver-side recomputation of that same tag shape from the received message and shared key/context
  - one visible `Equals` comparison between transmitted and recomputed tags
  - one visible 1-bit pass/fail output
  - no new engine primitive is required for V1; the expected shape is a flat graph where the authenticator path and the comparison point are both inspectable

### Tutorial
- **Why Integrity Is Not Secrecy**
  - step 1: identify the readable message path
  - step 2: identify the authenticator/tag path
  - step 3: inspect the visible comparison point
  - step 4: inspect how a tampered message or wrong tag flips verification

### Challenge
- **Repair the Tamper Check**
  - break one visible authenticator, routing, or comparison input
  - learner restores it so the verification output matches the reference machine again

## Core Rules

1. **The authentication path must stay explicit**
   - learners should be able to trace what feeds the tag/check value
   - no hidden verification wrapper

2. **The first move stays bounded**
   - one demo
   - one tutorial
   - one challenge
   - no protocol-suite bundling

3. **Teaching contrast matters**
   - the slice should explicitly contrast readable message content with a separate integrity/authentication check
   - the learner should leave able to say "this detects tampering" rather than "this encrypts the message"

4. **Reuse shipped foundations**
   - prefer shipped hash-like, compare, and bridge/output surfaces
   - add a new primitive only if review identifies a real expressiveness blocker

## Success Criteria

V1 is successful if:
- MCW can teach integrity/authentication as a visible tamper-detection path
- learners can identify what data is being authenticated and where verification happens
- the slice makes confidentiality-vs-integrity distinction clearer than prose alone
- the design prepares for later AEAD or stronger MAC follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- a stronger MAC-style follow-on if the first authenticator loop proves classroom value
- a bounded AEAD teaching slice after integrity and confidentiality are both individually clear
- a later signature/verification line separate from symmetric authentication

## Explicitly Avoid Next

Do not turn this into:
- a full AEAD milestone
- a signature/public-key milestone
- a generic "secure messaging" wrapper
- a password/KDF slice by stealth
- a protocol-suite bundle disguised as one auth demo

Keep the first move narrow, explicit, and comparison-centered.
