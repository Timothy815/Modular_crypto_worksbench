# Protocol Handshakes V1

## Status

Framed for `v1.44.0`.

## Purpose

Deepen MCW's teaching language so it can express one bounded multi-step protocol conversation, not just isolated cryptographic machines.

This slice exists to solve the next strategic product gap after `v1.43.0`:
- visible symmetric protection is now taught through integrity and AEAD foundations
- visible asymmetric foundations are now taught through toy RSA, Diffie-Hellman, and digital signatures
- MCW can show individual machines honestly
- MCW still cannot show how those machines are composed across a short protocol transcript

The goal is not to ship TLS, certificate validation, replay defense, or a secure-channel wrapper.
The goal is to add one bounded handshake-style teaching loop that makes "establish, authenticate, then protect" visible as a sequence of explicit structures.

## Strategic Principle

**Protocol teaching must remain visible transcript structure, not a branded session wrapper.**

That means:
- each step should remain individually inspectable
- key agreement, authentication, and protected messaging should remain separate visible sub-machines
- the learner should be able to point to what is sent first, what is checked next, and what later data depends on those earlier steps
- no monolithic `Handshake`, `TLS`, or "secure channel" node should hide the structural lesson

## Why Now

MCW now has:
- visible asymmetric key agreement through `Diffie-Hellman`
- visible asymmetric authentication through digital signatures
- visible confidentiality and integrity composition through AEAD foundations

That means the next honest step is not certificates and not stronger primitive realism.
The next honest step is one bounded systems-level slice showing how earlier visible machines feed later ones in a short protocol exchange.

## V1 Scope

V1 should stay bounded to **one explicit handshake-to-message teaching scenario where two parties establish or authenticate keying context and then use that result to protect one later message**.

Primary user story:
- inspect one short transcript with ordered steps
- inspect which early values are public and which later values are derived
- inspect how authentication checks bind one step to the next
- inspect how a later protected-message step depends on earlier agreement/authentication
- understand that protocols are compositions of machines over time, not one larger machine blob

## Included

- one bounded handshake-style demo workspace
- one guided tutorial explaining:
  - the ordered transcript steps
  - the visible public exchange
  - the visible authentication or verification step
  - the visible protected-message step that depends on earlier results
- one challenge that breaks one visible transcript dependency, verification relationship, or derived-key routing step and asks the learner to repair it
- reuse of shipped `Diffie-Hellman`, digital-signature, and AEAD-style foundations wherever possible
- visible transcript ordering or step labeling on the teaching surface
- learning-sequence placement after `Signing Is Not Encrypting` and before any future certificate / trust-chain line

## Explicitly Excluded

Do not include in V1:
- certificate chains, PKI, or trust stores
- industrial protocol presets such as `TLS 1.3`
- replay defense, nonce-management systems, or transcript-hash realism
- session resumption, renegotiation, or channel lifecycle management
- a generic secure-channel wrapper
- hidden message scheduling or automatic state progression across steps
- broad state-machine infrastructure unless review proves one tiny helper is unavoidable

## Candidate Teaching Surface

### Demo Workspace
- **Visible Secure Handshake**
  - one visible first exchange built from shipped `Diffie-Hellman`-style public values
  - one visible authentication check, preferably by reusing the digital-signature teaching shape on one exchanged public value
  - one visible derived-secret or session-key handoff into a later protected-message step
  - one deliberately minimal protected-message step built from shipped confidentiality/integrity parts rather than replaying the full AEAD teaching surface
  - one visible pass/fail output showing whether the authenticated setup still supports the later protected step
  - the expected shape is a flat, step-labeled graph where early public exchange feeds later verification and protection branches explicitly
  - the first move should stay small: one sender, one receiver, one agreement/authentication dependency, and one later protected message
  - the expected size target is approximately 15-20 modules total; the handshake lesson is "these visible machines compose across steps", not "repeat every sub-machine at full teaching depth"
  - the DH exchange may reuse a compact 4-`ModExp` pattern with shared visible parameters
  - the authentication step should stay minimal: sign one exchanged public value and verify it with one visible `Equals` result
  - the protected-message step should stay smaller than the AEAD demo, for example a compact XOR-and-verify tail that shows the derived-key dependency without replaying the full tag/decrypt lesson

### Tutorial
- **From Handshake To Protected Message**
  - step 1: identify the first public exchange
  - step 2: identify the authentication or verification step
  - step 3: identify the derived secret or session-key handoff
  - step 4: identify the protected-message step that depends on the earlier transcript
  - step 5: explain why this is a sequence of machines, not one primitive

### Challenge
- **Repair the Handshake**
  - break one transcript dependency, verification relationship, or derived-key routing step
  - learner restores it so the later protected-message and pass/fail outputs match the reference machine again

## Core Rules

1. **Transcript structure must stay explicit**
   - learners should be able to trace the protocol steps in order
   - no hidden scheduler or protocol wrapper

2. **The first move stays bounded**
   - one demo
   - one tutorial
   - one challenge
   - no certificate or protocol-suite bundling

3. **Reuse shipped foundations**
   - prefer `Diffie-Hellman`, digital-signature, compare, and AEAD-style teaching parts
   - add a new primitive only if review identifies a real expressiveness blocker

4. **Systems-level teaching contrast matters**
   - the slice should make it obvious that a protocol is a composition of earlier cryptographic machines
   - the learner should leave able to say "the later protected message depends on what the earlier transcript established"

5. **Transcript order is conveyed visually, not with a new scheduler**
   - transcript-step ordering should be shown through spatial layout, existing sticky-note annotations, and tutorial step order
   - do not add a new `TranscriptStep`, `ProtocolPhase`, or hidden execution primitive for V1

## Success Criteria

V1 is successful if:
- MCW can teach one visible handshake-style transcript as an ordered composition of shipped parts
- learners can identify what is exchanged publicly, what is verified, what is derived, and what later protection depends on those earlier steps
- the slice makes protocol composition clearer than prose alone
- the design prepares for later trust-chain or richer protocol follow-ons without introducing hidden magic

## Likely Follow-Ons

Possible later slices, only if still justified:
- a second handshake-oriented teaching surface if the first one proves classroom value
- certificate / trust-chain teaching after one standalone handshake composition is individually clear
- a later `v2.0` sanity/framing pass after systems-level composition has one stable checkpoint beyond signatures

## Explicitly Avoid Next

Do not turn this into:
- a TLS clone
- a certificate or PKI bundle
- a generic "secure conversation" wrapper
- hidden transcript state progression
- a new transcript-labeling primitive
- composites used only to hide DH, signature, or protection sub-machines
- a `v2.0` relabeling exercise disguised as one handshake demo

Keep the first move narrow, stepwise, and inspectable.
