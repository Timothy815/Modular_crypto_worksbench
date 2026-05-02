# Algebraic Signals V1 — Review Prompts

Use these prompts as-is.

## Claude Prompt

```text
Review this bounded contract as a product and interaction critic:

- docs/live/contracts/2026-05/ALGEBRAIC-SIGNALS-V1.md

Context:
MCW is a visual cryptography workbench that currently exposes two visible signal domains:
- bits
- symbol

It recently gained an exact integer arithmetic substrate internally, but future algebraic and ECC work still has a product-honesty problem: without richer visible signal domains, the workbench would be forced to hide algebraic meaning inside anonymous bitstrings.

This contract proposes the next bounded step: add a first explicit algebraic signal domain without yet adding field or curve mechanics.

Please focus on:
- whether this is the right next product move after the exact arithmetic substrate work
- whether starting with only `integer` is the right bounded V1 shape
- whether the contract preserves MCW’s “live machine, glass-box” standard
- whether the new domain is framed clearly enough for students
- whether any user-facing behavior around inspectors, sinks, or explicit bridges is too vague
- whether the contract stays disciplined instead of drifting into field arithmetic or ECC by stealth

Do not spend most of the review on:
- broad ECC roadmap arguments
- speculative point-domain or protocol design
- detailed implementation suggestions beyond what the contract implies

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```

## Gemini Prompt

```text
Review this bounded contract as a systems and implementation-boundary critic:

- docs/live/contracts/2026-05/ALGEBRAIC-SIGNALS-V1.md

Context:
MCW is a TypeScript + React visual cryptography workbench.
It currently exposes only:
- bits
- symbol

It recently gained an exact integer arithmetic substrate internally. This contract proposes the next bounded step: introduce a first explicit visible algebraic signal domain so future field or ECC work does not have to hide semantics inside plain bitstrings.

Please focus on:
- whether the slice is technically coherent with the current engine architecture
- whether introducing only `integer` first is the right implementation boundary
- whether the contract is clear enough about what changes in:
  - engine signal typing
  - validation
  - inspector rendering
  - explicit bridges
- whether the contract stays tight enough to avoid accidental field-arithmetic or ECC creep
- whether any likely migration hazards or testing gaps are missing
- whether the contract is too vague about serialization or persistence consequences of adding a new signal domain

Do not spend most of the review on:
- broad ECC roadmap arguments
- future point mechanics
- speculative protocol design

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```
