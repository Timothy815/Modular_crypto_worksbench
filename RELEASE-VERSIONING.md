# MCW Release Versioning

## Current Canonical Version Line

- `v2.0.0` marks the shipped "Cryptographic Systems IDE" boundary
- `v2.1.0` is the first post-`v2.0.0` checkpoint that consolidates:
  - onboarding
  - user manual
  - AI toolkit
  - cryptanalysis visibility and visuals
  - Pollux, S-box, and PRNG teaching lines
  - flagship classical and modern lab sequences
  - verification explainability
  - instructor pilot support

This file is the canonical release-policy note for the repo. `README.md`,
`IMPLEMENTATION-STATUS.md`, Git tags, and `package.json` should agree with it.

## Historical Note

MCW had an earlier incremental `1.x` growth era with many small feature changes.
That cadence outpaced formal tagging discipline. The project now treats:

- pre-`v2.0.0` work as the growth era
- `v2.0.0` as the major product-boundary reset
- `v2.1.x` as the current polish, trust, and classroom-readiness line

The goal is not to reconstruct every missed micro-release retroactively. The goal
is to keep versioning disciplined from `v2.1.0` forward.

## Release Rules

1. Product release versions must be reflected in all four places:
   - Git tag
   - `package.json`
   - `README.md`
   - `IMPLEMENTATION-STATUS.md`
2. Major releases (`v3.0.0`, etc.) require a documented product-boundary change.
3. Minor releases (`v2.1.0`, `v2.2.0`) mark coherent shipped capability or
   usability checkpoints.
4. Patch releases (`v2.1.1`, etc.) are for bounded fixes or small polish passes
   that do not change the product line's overall shape.
5. Do not leave docs and package metadata on different version lines after a
   release checkpoint is declared.
