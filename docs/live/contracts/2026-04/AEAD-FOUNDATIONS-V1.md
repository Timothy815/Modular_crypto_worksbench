# AEAD Foundations V1

## Status

Shipped in `v1.42.0`.

## Purpose

Deepen MCW's modern-cryptography teaching language so it can express the composition of confidentiality and integrity/authentication in one visible machine.

This slice exists to solve the next strategic product gap after `v1.41.0`:
- visible block chaining is shipped
- byte/word-oriented helpers are shipped
- visible integrity/authentication is shipped
- MCW can now teach encryption and tamper detection separately
- MCW still does not have one bounded teaching surface showing how those two properties are composed in one explicit construction

The goal is not to ship `GCM`, `CCM`, `ChaCha20-Poly1305`, or a generic secure-channel system.
The goal is to add one bounded AEAD-style composition lesson that makes "encrypt and authenticate together" visible and distinct from either property alone.

## Strategic Principle

**Authenticated encryption must remain visible composition, not a branded black-box mode label.**

That means:
- the confidentiality path should remain inspectable
- the authentication/tag path should remain inspectable
- any associated public context should be visible as authenticated but not encrypted
- learners should be able to point to where encryption happens, where tag derivation happens, and what data each path covers
- no monolithic `AEAD`, `GCM`, or "secure message" wrapper should hide the structural lesson

## Why Now

MCW now has:
- explicit framing and chaining foundations
- explicit byte/word structure helpers
- explicit tamper-detection teaching loops
- explicit protocol-material sources such as `IV`, `Nonce`, and `Salt`

That means the next honest step is not signatures and not full protocol choreography.
The next honest step is one bounded composition slice showing how confidentiality and integrity can be combined without hiding the parts.

## V1 Scope

V1 should stay bounded to **one explicit authenticated-encryption-style teaching scenario where ciphertext and a visible tag are produced together from a readable message, key/context material, and optional visible associated data**.

Primary user story:
- inspect a readable plaintext before protection
- inspect the visible encryption path that hides that plaintext
- inspect a separate visible tag/authenticator path
- inspect one visible comparison or verification point
- understand that some public context may be authenticated without being encrypted
- understand that this is composition, not a magic single-step property

## Included

- one bounded AEAD-style demo workspace
- one guided tutorial explaining what is encrypted, what is authenticated, and what public context is only authenticated
- one challenge that breaks one visible composition edge, context source, or verification input and asks the learner to repair it
- reuse of shipped confidentiality and integrity/authentication foundations wherever possible
- explicit contrast between ciphertext output and pass/fail verification output
- optional visible associated-data path only if it stays small and inspectable
- learning-sequence placement after `Visible Tamper Check` and before any future signature or protocol-suite line

## Explicitly Excluded

Do not include in V1:
- a monolithic `AEAD`, `GCM`, `CCM`, or `ChaCha20-Poly1305` primitive
- branded industrial constructions presented as presets
- full nonce-management, replay-defense, or transcript choreography
- signatures or public-key authentication
- password hashing / KDF work
- a generic authenticated-channel wrapper
- a broad protocol-suite bundle

## Candidate Teaching Surface

### Demo Workspace
- **Visible Authenticated Encryption**
  - one visible plaintext source
  - one deliberately minimal encryption path built from shipped parts, biased toward a single-block or otherwise compact branch rather than reusing the larger block-chaining teaching surface
  - **Encrypt-then-MAC** ordering for V1: the tag is derived from the ciphertext, not the plaintext
  - one visible tag/authenticator path that reuses shipped parts, preferably `ToyCompressionHashComposite`, to keep the top-level graph readable
  - one visible receiver-side recomputation point plus a visible decrypt path so the learner can see both "verify first" and "recover plaintext only when the composition still matches"
  - one visible pass/fail output distinct from the ciphertext and recovered-plaintext outputs
  - associated data is deferred by default for V1 and should only be added if the final graph remains clearly inspectable
  - the expected shape is a flat composition graph where ciphertext feeds the tag path explicitly and where confidentiality and authentication remain separately traceable, not a preset mode node

### Tutorial
- **Encrypting Is Not Enough**
  - step 1: identify the plaintext and ciphertext paths
  - step 2: identify the separate tag/authenticator path
  - step 3: identify any visible associated public context that is authenticated but not encrypted
  - step 4: inspect the verification point and pass/fail output
  - step 5: compare what breaks when ciphertext, tag, or associated context changes

### Challenge
- **Repair the Protected Message**
  - break one visible composition edge, context source, or verification input
  - learner restores it so both the protected output and the verification result match the reference machine again

## Core Rules

1. **Composition must stay explicit**
   - learners should be able to trace the encryption branch and the authenticator branch separately
   - no hidden combined-mode behavior in one black-box node

2. **The first move stays bounded**
   - one demo
   - one tutorial
   - one challenge
   - no protocol-suite bundling

3. **Teaching contrast matters**
   - the slice should clarify the difference between:
     - encryption alone
     - authentication alone
     - combined protection
   - the learner should leave able to say "this combines secrecy and tamper detection" rather than "this is just encryption with a label"

4. **Reuse shipped foundations**
   - prefer shipped framing, protocol-material, encryption-side, hash-like, compare, and output surfaces
   - add a new primitive only if review identifies a real expressiveness blocker
   - prefer shipped composites for the tag path and the smallest honest transform chain for the encryption path

## Success Criteria

V1 is successful if:
- MCW can teach authenticated-encryption-style composition as visible structure
- learners can identify what data is encrypted, what data is authenticated, and where verification happens
- the slice makes combined protection clearer than teaching confidentiality and integrity separately in prose
- the design prepares for later stronger AEAD or MAC follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- a stronger or more standard AEAD-style follow-on if the first composition lesson proves classroom value
- a stronger MAC-style follow-on if students need a more specific authenticator construction
- a later signature / public-key-authentication line kept separate from symmetric composition

## Explicitly Avoid Next

Do not turn this into:
- a preset AEAD library
- a full protocol transcript machine
- a signature/public-key milestone
- a generic "secure messaging" wrapper
- a password/KDF slice by stealth

Keep the first move narrow, compositional, and inspectable.
