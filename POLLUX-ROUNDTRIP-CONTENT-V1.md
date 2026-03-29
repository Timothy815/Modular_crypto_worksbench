# POLLUX-ROUNDTRIP-CONTENT-V1

Status: Proposed

Owner: Codex
Scope: Historical Bridges / Tutorials / Challenges / Manual

## Why

MCW now ships both halves of the Pollux line:
- `PolluxFractionation` for forward disguise (`bits -> symbol`)
- `PolluxInverse` for inverse recovery (`symbol -> bits`)

That means the core machine capability is now present, but the teaching content is still uneven.

Right now users can learn the forward Pollux idea, but they do not yet get a first-class round-trip learning path that shows:
- encode
- decode
- compare against the original bit source
- understand why the disguise layer is reversible once the alphabets are known

This is the natural follow-on because the engine line is complete enough for a bounded sender/receiver style lab.

## Goal

Add a bounded Pollux round-trip content slice so users can learn Pollux as a reversible historical-bridge workflow rather than a one-way novelty primitive.

The first milestone should make it possible to:
- open one demo showing explicit Pollux encode + decode
- walk through one tutorial about the round-trip
- solve one challenge based on repairing the decode side or the alphabet agreement
- read one manual entry that explains forward disguise plus inverse recovery together

## Product Boundary

This slice is:
- content-first
- classroom-oriented
- historical-bridge focused
- built on already-shipped Pollux primitives

It is not:
- a new Pollux cracking surface
- a probabilistic decipherment workflow
- a new primitive family
- a modern security claim

The right framing is:
- reversible fractionation
- known-alphabet decode
- sender/receiver representation agreement

## Required V1 Shape

1. V1 should add one dedicated Pollux round-trip demo project.
2. The demo should show:
   - a visible bit source
   - `PolluxFractionation`
   - `PolluxInverse`
   - one explicit comparison or equality check proving the original bits survive the round-trip
3. V1 should add one tutorial that explains:
   - forward disguise
   - inverse membership decode
   - why known alphabets make the disguise reversible
4. V1 should add one challenge that requires repairing a broken Pollux round-trip.
5. The challenge should stay bounded to:
   - mismatched alphabets
   - or a broken inverse-side configuration
   - not a frequency-analysis or cracking exercise
6. V1 should update the manual so Pollux is documented as a round-trip historical bridge rather than only a forward disguise primitive.
7. The teaching copy must state plainly that:
   - Pollux can disguise representation
   - Pollux is reversible when the alphabets are known
   - this is not the same thing as modern diffusion or secrecy
8. The content should remain compatible with the existing learning, compare, verification, and Python export story.

## Preferred V1 Direction

The likely best first shape is:
- one compact demo:
  - `BitSource -> PolluxFractionation -> PolluxInverse -> Equals -> BitOutput`
- one tutorial focused on:
  - visible encode/decode symmetry
  - disjoint alphabets
  - set-membership recovery
- one challenge where:
  - the forward Pollux side is correct
  - the inverse alphabets are wrong or swapped
  - the student must restore a clean round-trip

That keeps the slice:
- easy to verify
- easy to teach
- tightly bounded
- aligned with the current Pollux engine line

## Teaching Rules

- The content must not imply that Pollux round-tripping makes a secure channel.
- The tutorial and manual should say explicitly that recovery works because both sides share the same zero/one symbol sets.
- The challenge should reward understanding of:
  - disjoint alphabets
  - membership-based decoding
  - reversible disguise
- The content should contrast Pollux with modern diffusion:
  - Pollux changes visible representation
  - diffusion changes how influence spreads through structure

## Non-Goals

- No new Pollux cracking workspace in V1
- No probabilistic or noisy decode behavior
- No selector-driven or random-choice Pollux extension in this slice
- No attempt to turn Pollux into a modern secure design line

## Success Condition

This slice is successful if:
- a student can open one Pollux round-trip demo
- see the encoded symbol stream and the recovered bits
- repair one broken round-trip challenge
- and explain why the recovery depends on known alphabet agreement rather than hidden magic

## Notes

This should come before any selector-driven Pollux follow-on.

The next honest teaching step after forward + inverse primitives is:
- round-trip content
- sender/receiver agreement
- explicit reversible disguise

Only after that should MCW consider whether Pollux needs a controlled-selection extension.
