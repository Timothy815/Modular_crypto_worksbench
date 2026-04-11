# Post-Collision Interpretation V1

Last updated: March 24, 2026

Status: Shipped on `main`.

## Purpose

This contract defines the next bounded teaching slice after the first two hash collision challenges.

The goal is not to help students find collisions faster.
The goal is to help students understand what a found collision means inside the machine.

This slice should teach:
- two different messages can land on the same digest for different internal reasons
- matching digests do not imply matching internal traces
- compression-style and sponge-style collisions should feel interpretable, not magical

This should remain a guided interpretation exercise, not an attack framework.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Guide / Challenge**
- a collision can still be found through the existing seeded challenges
- the challenge may point the student toward interpretation after success

2. **Analyze**
- students should inspect primitive transformation views inside the colliding machine
- the interpretation workflow should use the existing transformation surfaces where possible

3. **Cryptanalysis**
- students should compare the two colliding paths and see where differences persisted, merged, or disappeared
- this may justify one lightweight interpretation helper, but not a new heavy subsystem

This slice should not become:
- an automated collision explainer
- a brute-force search assistant
- a probability calculator
- a formal collision-resistance theorem surface

## First Milestone

The first milestone should answer one question clearly:

**How can two different messages end at the same digest?**

The student should be able to:
- keep the target collision visible
- compare the original message and the colliding message
- inspect where their internal traces diverge
- inspect where those differences are compressed, folded, or hidden before the final digest

## Include

The first milestone includes:
- a clearer post-success nudge from the collision challenges into interpretation
- a bounded comparison helper for:
  - original input
  - colliding input
  - same digest framing
- support for both shipped collision families:
  - `Toy Compression Hash`
  - `Toy Sponge Hash`

Still deferred within this contract:
- a more explicit internal-difference helper beyond the first-divergence card and nudges into existing surfaces

Prefer lightweight reuse over new systems.

## Exclude

This milestone should explicitly avoid:
- automatic “explain the whole collision” narration
- symbolic proofs or security claims
- giant trace-diff tables
- adding more collision challenges before interpretation is made clearer
- algorithm-brand comparisons (SHA-2, SHA-3, MD5)

## Visual / Teaching Principles

The student should be able to leave with this intuition:
- “Same digest does not mean same path.”
- “Different constructions can hide differences in different ways.”

Prefer:
- side-by-side message comparison
- visible “same digest / different message” framing
- guidance toward existing transformation views
- compact internal-difference summaries

Avoid:
- overwhelming the student with every trace row at once
- replacing the existing Analyze / Cryptanalysis surfaces with a new parallel workflow
- implying that one toy collision explains all real-world hash collisions

## Success Criteria

This slice is successful when a student can:
- find a collision using the shipped challenge
- move into an interpretation workflow without losing context
- see that the messages differ while the digest matches
- leave with a better intuition for why “same digest” is not the same as “same internal behavior”

This first milestone is now satisfied.

The remaining open question is:
- whether interpretation should deepen beyond the first-divergence helper
