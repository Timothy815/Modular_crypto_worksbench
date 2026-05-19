# Schnorr Challenge Binding Consequence V1

Last updated: May 19, 2026
Status: Shipped on feature/aes-column-perturbation

---

## Purpose

Add the next bounded ECC consequence slice for MCW so students can see that a Schnorr-style signature only means what they think it means if the verifier challenge stays bound to the exact visible commitment point, public key, and message.

This slice follows:

- [Visible Schnorr V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/VISIBLE-SCHNORR-V1.md)
- [Schnorr Nonce Reuse Consequence V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/SCHNORR-NONCE-REUSE-CONSEQUENCE-V1.md)
- [ECC Rigor Pass V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/ECC-RIGOR-PASS-V1.md)

It is not a generic forgery lab.
It is not an ECDSA contract.
It is not a production transcript-attack claim.

It is one bounded signature-integrity slice: show that if the verifier challenge stage is wired to the wrong visible message source, one signature over message `m₁` can still appear to verify while the board claims it is checking message `m₂`.

---

## Why This Slice Exists

MCW’s ECC line is now strong in:

- visible point mechanics
- visible scalar multiplication
- visible double-and-add
- toy-curve point-map intuition
- visible ECDH
- visible Schnorr signing
- Schnorr nonce-reuse consequence
- ECDH low-order peer-point consequence

That means students can already see:

- how one Schnorr-style signature is built honestly
- why nonce freshness matters
- how one protocol-side ECC misuse collapses a shared-secret space

But a major signature-integrity gap remains:

- visible Schnorr teaches that `ChallengeCombine` derives one challenge from `R`, `P`, and `m`
- the product still does not show what breaks if the verifier challenge is bound to the wrong visible transcript ingredient

The next highest-value ECC improvement is to make this fact machine-visible:

- the signature was created over one visible message
- the board claims it is checking a different visible message
- verification still passes only because the verifier challenge stage is wired back to the original message source

without pretending MCW has become a real-world signature forgery toolkit.

---

## Scope

### In scope

- one bounded Schnorr challenge-binding flagship board
- one tutorial
- one repair challenge
- one machine-visible consequence surface showing that a misbound verifier challenge can preserve a false-looking verification success
- seeded tests and known-answer vectors
- manual/library/atlas coverage for anything new

### Out of scope

- generic transcript-attack dashboards
- ECDSA or MuSig follow-ons
- production-safe hashing, encoding, or transcript frameworks
- broad “signature forgery” branding
- arbitrary challenge-authoring surfaces
- public-key validation work beyond the signature-binding consequence shown here

---

## Strategic Principle

V1 must separate three things clearly:

- the structural misuse
- the visible algebraic consequence
- the cryptographic claim boundary

The slice succeeds only if a student can read:

- this signature was created over one visible message
- this verifier lane claims to check a different visible message
- verification still passes only because the challenge stage is bound to the wrong message source
- when the challenge is rebound to the correct visible message, the same signature no longer verifies

It is not enough to say:

- “challenge binding matters”
- “the verifier is wrong”
- “the transcript changed”

without showing the machine consequence.

---

## Required Product Behavior

### 1. One honest signature transcript must stay visible

The flagship board must show one visible pedagogical Schnorr-style signature over:

- one visible base point `G`
- one visible subgroup order `n`
- one visible secret scalar `x`
- one visible nonce scalar `r`
- one signed visible message `m_sig`
- one visible challenge `c_sig`
- one visible response scalar `s`

The signer-side transcript must stay explicit rather than collapsing into an opaque preset.

### 2. The claimed verification message must be visibly different

The board must also show one second visible message `m_claim` that is different from `m_sig`.

The product must make the mismatch visible as a board fact, not only mention it in tutorial prose.

### 3. The broken verifier challenge must be committed, not implied

V1 must commit one specific misuse:

- the broken verifier challenge lane is labeled as checking `m_claim`
- but its `message` input is actually wired to `m_sig`

The contract must not leave the misuse open between:

- wrong message
- wrong public key
- wrong commitment point
- generic transcript mismatch

### 4. The consequence surface must be machine-visible and committed

The flagship board must include two explicit verifier consequence lanes using the same visible signature pair `(R, s)`:

1. one broken verifier lane
   - challenge input misbound to `m_sig`
   - final `PointEquals` result must emit `1`

2. one honest reference verifier lane
   - challenge input bound to `m_claim`
   - final `PointEquals` result must emit `0`

This side-by-side consequence is the educational payoff of the slice.

### 5. The challenge-binding role must stay explicit

The board must keep saying and showing:

- the challenge stage stands in for transcript-binding hash work in real Schnorr
- the verifier challenge must be derived from the same visible ingredients the signer actually signed
- this slice is about transcript binding, not nonce freshness and not secret-scalar recovery

### 6. The claim boundary must stay bounded

The product may say:

- if the verifier challenge is bound to the wrong visible message, the signature can appear to verify for the wrong transcript
- challenge binding is structurally necessary in Schnorr-style verification

The product must not say:

- this board demonstrates a production signature forgery pipeline
- every transcript mismatch is exploitable in the same way
- MCW now models full real-world signature verification safety

### 7. The board must stay live

If the broken verifier challenge is repaired so its message input is rebound from `m_sig` to `m_claim`, the false-looking verification success must disappear immediately.

This must be a live machine effect, not a static before/after warning card.

---

## Recommended Surface Shape

The strongest V1 shape is one pedagogical workspace with four visible regions:

1. one shared Schnorr setup lane
   - base point `G`
   - subgroup order `n`
   - secret scalar `x`
   - public point `P`
   - nonce scalar `r`
   - commitment point `R`

2. one signer transcript lane
   - signed message `m_sig`
   - signer-side `ChallengeCombine`
   - signer response `s`

3. one claimed-message lane
   - different visible message `m_claim`
   - one honest verifier challenge derived from `R`, `P`, and `m_claim`

4. two verifier consequence lanes
   - broken lane: `sG` versus `R + c_broken P`, where `c_broken` is still derived from `m_sig`
   - honest reference lane: `sG` versus `R + c_claim P`, where `c_claim` is derived from `m_claim`

The board should feel like a transcript-integrity autopsy, not like two unrelated verification demos placed near each other.

---

## Pedagogical V1 Choice

V1 should commit to the same small pedagogical Schnorr setting already used in the shipped line:

- curve:
  - `p = 17`
  - `a = 2`
  - `b = 3`
- base point:
  - `G = (15, 12)` with subgroup order `n = 11`
- signer secret scalar:
  - `x = 7`
- public point:
  - `P = xG = (3, 6)`
- nonce scalar:
  - `r = 3`
- commitment point:
  - `R = rG = (12, 2)`
- signed message:
  - `m_sig = 3`
- claimed verification message:
  - `m_claim = 8`

The point is not realistic transcript encoding.
The point is showing that the verifier challenge only means “this exact message was signed” if it is actually bound to the exact visible message source.

---

## Primitive Strategy

### Preferred path

Build this slice entirely from shipped machinery:

- `PointSource`
- `PointOrder`
- `ChallengeCombine`
- `ScalarLinearCombine`
- `ScalarMultiply`
- `PointAdd`
- `PointEquals`
- existing integer/bit bridges and outputs

### Helper policy

V1 should not require a new cryptographic primitive.

If implementation discovers that one currently shipped module does not expose the output port needed to express the already-visible consequence honestly, fix that exposure directly rather than adding a new “binding consequence” helper.

### Unacceptable helpers

Do not add:

- `ForgeSignature`
- `BreakChallengeBinding`
- `TranscriptExploit`
- any generic “signature attack” shell

---

## Data / Content Guidance

V1 commits one concrete seeded pedagogical transcript family up front.

Committed V1 values:

- `G = (15, 12)`
- `n = 11`
- `x = 7`
- `P = (3, 6)`
- `r = 3`
- `R = (12, 2)`
- `m_sig = 3`
- `m_claim = 8`

Committed signer transcript:

- `c_sig = 4`
- `s = r + c_sig x mod 11 = 9`

Committed verification-side point facts:

- `sG = 9G = (8, 15)`
- `c_sig P = 4P = (14, 2)`
- `R + c_sig P = (8, 15)`
- therefore the signature verifies honestly for `m_sig`

Committed broken-binding consequence facts:

- the broken verifier challenge still receives `m_sig`
- `c_broken = 4`
- `R + c_broken P = (8, 15)`
- `PointEquals(sG, R + c_broken P) = 1`

Committed honest-reference facts for the claimed message:

- `c_claim = 9`
- `c_claim P = 9P = (12, 15)`
- `R + c_claim P = ∞`
- `PointEquals(sG, R + c_claim P) = 0`

These values should stay small and hand-checkable.
Do not replace them with larger opaque transcript constants in V1.

---

## Tutorial Requirements

Ship one tutorial focused on this exact board.

The tutorial should do these things in order:

1. identify the signed message `m_sig = 3`
2. identify the claimed verification message `m_claim = 8`
3. show that the signer transcript really uses `m_sig`, producing `c_sig = 4` and `s = 9`
4. show that the broken verifier challenge still reads from `m_sig`, so `c_broken = 4`
5. show that the honest verifier challenge for `m_claim` is different, `c_claim = 9`
6. read both visible verifier results:
   - broken verifier equality `= 1`
   - honest verifier equality `= 0`
7. state explicitly:
   - the structural misuse was challenge misbinding to the wrong message source
   - the visible consequence was false-looking verification success for the wrong transcript
   - this demonstrates the binding role of the challenge stage, not a complete production forgery pipeline

The tutorial should attribute the consequence to transcript binding, not to some special property of message value `3` or `8`.

---

## Challenge Requirements

Ship one repair challenge.

The strongest V1 challenge is:

- the board visibly claims to verify the signature against `m_claim`
- the broken verifier challenge module’s `message` input is actually wired to `message-sig`
- the student must rewire that one `message` leg to `message-claim`

The challenge repair gesture is therefore explicit:

- broken state:
  - `broken-verify-challenge.message <- message-sig`
- repaired state:
  - `broken-verify-challenge.message <- message-claim`

The challenge should begin with:

- broken verifier equality `= 1`

and end with:

- repaired verifier equality `= 0`

The challenge should not ask the student to:

- change the signer message
- alter the nonce
- change the secret scalar
- rewrite the whole verifier topology

This is a bounded wiring repair, not a generic “fix Schnorr” task.

---

## Implementation Notes

### 1. Reuse the shipped visible Schnorr shape directly

This slice should read as a constrained fork of the already-shipped `Visible Schnorr Signature` board rather than as a fresh protocol graph designed from scratch.

### 2. Keep the verifier contrast explicit

Do not rely on one verifier lane alone.

The board should keep the honest reference verifier for `m_claim` visible so students can see:

- the same `(R, s)` pair
- two different challenge values
- two different verification outcomes

### 3. Keep the message-source mistake inspectable

The broken verifier lane should make the misbound source leg inspectable in normal board interaction.

Students should be able to trace:

- the verifier lane says “claimed message”
- but its challenge input still comes from the signed message source

### 4. Do not overgrow the slice into transcript infrastructure

Do not add:

- transcript objects
- serialization helpers
- hash-domain controls
- generic signer/verifier shells

The slice is about one wrong message-source binding only.

---

## Testing Requirements

1. `npx vitest run` passes
2. `npm run build` passes
3. the flagship board reproduces the committed seeded values:
   - `c_sig = 4`
   - `s = 9`
   - `c_broken = 4`
   - `c_claim = 9`
4. the flagship board reproduces the committed point facts:
   - `sG = (8, 15)`
   - `R + c_broken P = (8, 15)`
   - `R + c_claim P = ∞`
5. the flagship board reproduces the committed verifier results:
   - broken verifier equality `= 1`
   - honest reference verifier equality `= 0`
6. the repair challenge begins in the misbound state and passes only when the broken verifier challenge message leg is rewired from `message-sig` to `message-claim`
7. the tutorial and challenge reference the actual board modules they claim to teach

---

## Success Criteria

This slice is successful if:

1. students can point to the exact message-source misbinding in the graph
2. students can read why the broken verifier still emits `1`
3. students can read why the honest verifier for the claimed message emits `0`
4. the product makes challenge binding feel like a structural necessity rather than a prose warning
5. the tutorial and challenge preserve the claim boundary that this is a bounded pedagogical integrity failure, not a production forgery toolkit

---

## Likely Follow-On

If this slice lands cleanly, the strongest immediate ECC follow-on remains:

- `ECC-PUBLIC-KEY-VALIDATION-CONSEQUENCE-V1`

That would broaden the protocol-side integrity story from:

- “the verifier challenge must be bound to the right transcript”

to:

- “the public point being verified or multiplied must itself be structurally valid”
