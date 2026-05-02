# Exact Integer Substrate V1 — Review Prompts

Use these prompts as-is.

## Claude Prompt

```text
Review this bounded contract as a product and interaction critic:

- docs/live/contracts/2026-05/EXACT-INTEGER-SUBSTRATE-V1.md

Context:
MCW is a visual cryptography workbench used for teaching and experimentation.
It already ships toy number-theory features such as:
- AddMod / SubMod / MulMod
- Modulo
- ModExp
- ModInverse
- Toy RSA
- Diffie-Hellman

A recent code-first audit found that the current arithmetic substrate still relies on JavaScript number behavior and 32-bit bitwise coercion in core conversion helpers. This contract proposes the next bounded substrate-hardening slice before any future field or ECC work.

Please focus on:
- whether this is the right next product move before any ECC or finite-field expansion
- whether the slice stays disciplined as substrate work rather than drifting into hidden product expansion
- whether the user-facing expectations are honest for a largely engine-level change
- whether the validation and exactness boundary requirements are clear enough
- whether any requirement is too vague about what users should experience when configurations exceed the supported exact regime
- whether the contract preserves MCW’s “live machine, glass-box” standard even though this slice is mostly under the hood

Do not spend most of the review on:
- broad ECC roadmap arguments
- speculative future algebraic signals or point mechanics
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

- docs/live/contracts/2026-05/EXACT-INTEGER-SUBSTRATE-V1.md

Context:
MCW is a TypeScript + React visual cryptography workbench.
It already ships:
- bit-word arithmetic primitives
- modular arithmetic primitives
- modulus analysis
- toy RSA and Diffie-Hellman teaching content
- Python export for those arithmetic modules

A recent code-first audit found that the current arithmetic substrate still depends on JavaScript number behavior and 32-bit bitwise coercion in core bit-word conversion helpers. This contract proposes a bounded exactness substrate pass before future field or ECC work.

Please focus on:
- whether the slice is technically coherent with the current engine architecture
- whether the bounded scope is tight enough to avoid accidental ECC-by-stealth
- whether the contract is clear enough about the difference between:
  - exact engine arithmetic representation
  - UI parameter representation
  - bit-vector signal representation
- whether the validation requirements are sufficient to prevent silent wrong answers
- whether Python export parity is scoped strongly enough
- whether any likely migration hazards or test gaps are missing

Please also assess whether the contract is specific enough about the supported exactness regime, or whether it leaves too much room for an implementation that is still ambiguous about where exactness ends.

Do not spend most of the review on:
- broad roadmap arguments
- speculative ECC design
- future field or point-domain work beyond what this contract needs next

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```
