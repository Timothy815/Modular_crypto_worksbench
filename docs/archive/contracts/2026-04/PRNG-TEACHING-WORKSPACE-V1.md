# PRNG-TEACHING-WORKSPACE-V1

Status: Shipped on `main`.

Owner: Codex
Scope: Sequential / Historical Bridges / Cryptanalysis Teaching

## Why

MCW already contains visible stateful generators and control structures:
- `LFSR`
- `Clock`
- `Gate`
- `Mux`
- `Demux`
- `Majority`
- `Counter`

What it does not yet provide as a first-class teaching slice is a bounded workspace line for studying:
- why some generators are predictable
- why some visible irregular-clock ideas still remain weak
- what kinds of structural or statistical clues survive in generated streams

This should be framed as a teaching and comparison line, not as a product claim that MCW ships a cryptographically secure PRNG primitive.

## Goal

Add a bounded teaching workspace line that helps users compare visible pseudo-random generator constructions and reason about what makes them weak, stronger, or still unsuitable for cryptographic use.

The first milestone should make it possible to:
- compare simple visible generators against one another
- study regular vs gated vs combined clocking ideas
- inspect output structure with the existing analysis and verification surfaces
- teach why “looks noisy” is not the same thing as “cryptographically secure”

## Product Boundary

This slice is about:
- teaching
- comparison
- visible structure
- weakness analysis
- historical and conceptual bridges into stream-generation ideas

It is not about:
- certifying a generator as secure
- shipping a production CSPRNG primitive
- claiming that MCW contains a trustworthy entropy source
- hiding generation logic behind a black-box “secure random” module

## Required V1 Shape

1. V1 should stay workspace-first rather than primitive-first.
2. It should reuse already shipped visible modules where possible.
3. The core teaching comparison should likely include:
   - a plain `LFSR`
   - at least one gated or irregular-clock variant
   - at least one combined-control variant such as majority-clocked or routed clocking
4. Every workspace in this line must carry a persistent disclosure that it is an educational model and not cryptographically secure.
5. Every `LFSR`-based workspace in this line must disclose the register width and the maximum theoretical period (`2^n - 1`) for the chosen seed width.
6. V1 must include one explicit predictability exercise where the student can infer a later output bit from an observed visible stream.
7. The teaching copy must use trace explicitly to connect visible register state to the emitted output bit on each tick.
8. The teaching copy must explicitly distinguish:
   - pseudo-random appearance
   - structural predictability
   - cryptographic suitability
9. The analysis angle should remain bounded to existing product surfaces:
   - trace
   - verification
   - compare
   - cryptanalysis views where they are applicable
10. V1 must not label any seeded construction “cryptographically secure.”
11. If the slice adds new demos, tutorials, or challenges, they should focus on:
   - observing patterns
   - comparing generators
   - repairing weak control logic
   - explaining why visible irregularity can still fail cryptographic expectations
12. V1 should include one plainly degenerate or obviously weak case so students can see that a stateful generator can still stall, repeat too quickly, or remain directly predictable.

## Preferred V1 Direction

The likely best first shape is:
- one focused teaching docket built from existing generator/control primitives
- one or more comparison demos that expose:
  - fixed clocking
  - gated clocking
  - multi-control clocking
- a small tutorial/challenge/manual line that frames the lesson honestly

This keeps the slice:
- bounded
- useful for students
- aligned with MCW’s glass-box strengths

## Teaching Rules

- The product must state plainly that `LFSR` is educational and deterministic, not secure.
- “Harder to eyeball” must not be presented as equivalent to “safe for cryptography.”
- The line should encourage users to compare:
  - repeat structure
  - control dependence
  - output regularity
  - visible state effects
- The line should explicitly teach that irregularity in the rendered stream is not the same thing as algebraic hardness.

## Non-Goals

- No new `CSPRNG` primitive in V1
- No claim that a gated or majority-clocked construction is secure
- No hidden entropy or OS-randomness module
- No formal randomness test suite in V1
- No standards-conformance claim against NIST SP 800-22 or similar batteries
- No new PRNG-specific analysis UI in V1

## Success Condition

This slice is successful if:
- students can open a small set of generator workspaces
- compare their structure and outputs
- explain why visible irregularity is not enough for security
- predict a later bit in at least one bounded `LFSR` exercise
- and leave with a clearer idea of what makes PRNG design stronger or weaker

## Notes

This is best treated as a teaching-workspace line built around already-shipped sequential primitives.

The important product message is:
- MCW can help users inspect pseudo-random generator structure
- but inspection and visible complexity are not the same thing as cryptographic security
