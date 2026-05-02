# VERIFICATION-EXPLAINABILITY-V1

Status: Shipped on `main`.

Owner: Codex
Scope: Compare Surface / Verification Station / Failure Interpretation / User Guidance

## Why

MCW now has enough capability that the next bottleneck is no longer “what can the product do?”

The next bottleneck is:
- when a machine fails
- when a challenge does not pass
- when a verification case diverges
- when an exported machine does not match expectations

Can a student or instructor quickly understand:
- what failed
- where it failed
- what kind of failure it is
- what to inspect next

The current verification and comparison surfaces already contain the right engine-backed information:
- validation errors
- runtime errors
- output match / mismatch
- first divergence
- tick-level divergence
- baseline-vs-variant comparison

But the current wording and presentation are still more engineer-shaped than student-shaped.

The next honest move is to improve explainability:
- clearer interpretation
- clearer failure classes
- clearer next-step guidance

## Goal

Make the verification and comparison surfaces easier for first-time and classroom users to interpret without changing the underlying execution or trust model.

The first milestone should make it possible for a user to distinguish quickly between:
- validation failure
- runtime failure
- output mismatch
- first internal divergence
- baseline-free known-answer mismatch

And then know what to inspect next.

## Product Boundary

This slice is:
- usability-first
- explanation-first
- built on already-shipped execution/verification logic
- intended to improve user confidence and recovery speed

It is not:
- a new verification engine
- a new trace engine
- a new grading system
- a new onboarding wizard
- a cryptographic correctness oracle

The right framing is:
- better interpretation of already-shipped verification data
- better help at the moment of failure

## Required V1 Shape

1. V1 should keep the current verification engine, comparison engine, and divergence logic intact.
2. V1 should improve the compare / verification UI wording and summaries without changing the meaning of pass/fail.
3. The surface should explicitly distinguish at least these failure classes:
   - validation problem
   - runtime execution problem
   - output mismatch
   - first divergence inside the execution trace
   - baseline-free mismatch
4. Each failure class should include concise “what this means” guidance in user-facing language.
5. Each failed verification result should include a bounded “what to inspect next” suggestion based on the failure type.
6. The compare summary should use more human-readable wording than raw divergence reason codes alone.
7. The verification station should explain more clearly that “verified” means “matches the chosen reference behavior,” not “secure” or “correct in all contexts.”
8. The surface should remain compact enough to fit inside the existing compare / verification panel architecture.
9. V1 should improve wording and guidance both for baseline-backed checks and for baseline-free imported known-answer checks.
10. The new guidance should work in both stateless and ticked modes.

## Preferred V1 Direction

The likely best first shape is:

1. **Clear Failure Labels**
   - replace terse or purely internal phrasing with readable labels
   - examples:
     - “This machine is invalid before it can run”
     - “The machine ran, but the final output did not match”
     - “The outputs diverged at tick 3”

2. **Meaning + Next Step**
   - pair each failure with:
     - what it means
     - what to inspect next

3. **Verification Trust Copy**
   - keep reinforcing that:
     - pass means “matches the chosen reference”
     - fail means “does not currently match that reference”
     - neither one is a blanket security claim

## Sequence Rules

- The compare surface should help a user recover, not just observe.
- The wording should be short, concrete, and classroom-readable.
- The panel should not turn into a verbose diagnostics console.
- The guidance should point toward existing product surfaces:
  - Configure / parameters
  - Analyze / Trace
  - Compare / Verification
  - source values
  - tick counts

## Teaching Rules

- The UI should not imply that divergence reason codes are meaningful by themselves to a new user.
- The wording should treat:
  - “invalid”
  - “did not run”
  - “ran but mismatched”
  - “diverged internally”
  as importantly different situations.
- Baseline-free imported known-answer cases should explain that MCW can still check final output even when no divergence trace is available yet.

## Non-Goals

- No new trace visualization engine
- No new verification workflow engine
- No full recommendation system or AI hinting layer
- No challenge-specific grading rubric changes
- No new export/parity runtime logic

## Success Condition

This slice is successful if:
- a new user can tell why a verification attempt failed without reading code-like phrasing
- a student can distinguish invalid machines from wrong-output machines
- a baseline-free imported case explains why it can only do output matching
- and the compare / verification panel feels more like a teaching instrument than a raw debugger

## Notes

This is likely the highest-leverage usability follow-on after the flagship labs.

The flagship paths now give users something meaningful to do.
This slice improves what happens when they inevitably get something wrong.
