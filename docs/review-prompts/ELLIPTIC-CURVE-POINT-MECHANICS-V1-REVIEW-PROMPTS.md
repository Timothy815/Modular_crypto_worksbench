# Elliptic-Curve Point Mechanics V1 — Review Prompts

## Claude

```text
Review this bounded contract as a product and interaction critic:

- docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md

Context:
MCW is a visual cryptography workbench.
It now ships:
- an exact integer arithmetic substrate
- a visible integer signal domain
- explicit bits <-> integer bridges
- prime-field arithmetic over visible integer-domain values

This contract proposes the next bounded ECC step: visible point mechanics over prime fields, without yet adding scalar multiplication or protocol shells.

Please focus on:
- whether this is the right next product move after prime-field arithmetic
- whether the slice stays disciplined and does not drift into scalar multiplication or ECDH by stealth
- whether the visible point-domain behavior is clear enough for students
- whether point validity, infinity handling, and undefined-operation behavior are specified honestly enough
- whether any inspector, sink, or teaching requirements are too vague
- whether the contract preserves MCW’s “live machine, glass-box” standard

Do not spend most of the review on:
- broad ECC roadmap arguments
- speculative protocol design
- low-level implementation advice beyond what the contract implies

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```

## Gemini

```text
Review this bounded contract as a systems and implementation-boundary critic:

- docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md

Context:
MCW is a TypeScript + React visual cryptography workbench.
It now ships:
- an exact integer arithmetic substrate
- a visible integer signal domain
- explicit bits <-> integer bridges
- prime-field arithmetic with visible integer-domain I/O

This contract proposes the next bounded ECC step: add a visible ec-point signal domain and point-mechanics family without yet adding scalar multiplication or protocol composites.

Please focus on:
- whether the slice is technically coherent with the current engine architecture
- whether introducing ec-point now is the right implementation boundary
- whether the contract is clear enough about what changes in:
  - engine signal typing
  - validation
  - inspector rendering
  - runtime failure behavior
- whether infinity handling and invalid-point handling are specified tightly enough to avoid silent wrong answers
- whether the contract stays tight enough to avoid accidental scalar-multiplication or protocol creep
- whether any likely migration hazards or testing gaps are missing

Do not spend most of the review on:
- broad roadmap arguments
- speculative protocol design
- future optimizations beyond what this slice needs

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```
