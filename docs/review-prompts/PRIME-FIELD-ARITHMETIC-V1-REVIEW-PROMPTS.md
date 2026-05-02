# Prime-Field Arithmetic V1 Review Prompts

Use these prompts to review:

- [Prime-Field Arithmetic V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/PRIME-FIELD-ARITHMETIC-V1.md)

## Claude Prompt

```text
Review this bounded contract as a product and interaction critic:

- docs/live/contracts/2026-05/PRIME-FIELD-ARITHMETIC-V1.md

Context:
MCW is a visual cryptography workbench.
It now ships:
- an exact integer arithmetic substrate
- a visible `integer` signal domain
- explicit `BitsToInteger` and `IntegerToBits` bridges

This contract proposes the next bounded algebraic step: a prime-field arithmetic family with visible integer-domain I/O.

Please focus on:
- whether this is the right next product move after algebraic signals
- whether the slice stays disciplined and does not drift into ECC-by-stealth
- whether the difference between field arithmetic and existing modular/bit-word arithmetic is clear enough for students
- whether the product behavior around undefined operations is clear and honest
- whether any inspector, library, or teaching requirements are too vague
- whether the contract preserves MCW’s “live machine, glass-box” standard

Do not spend most of the review on:
- broad ECC roadmap arguments
- speculative point or protocol design
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

## Gemini Prompt

```text
Review this bounded contract as a systems and implementation-boundary critic:

- docs/live/contracts/2026-05/PRIME-FIELD-ARITHMETIC-V1.md

Context:
MCW is a TypeScript + React visual cryptography workbench.
It now ships:
- an exact bigint-backed arithmetic substrate
- a visible serializable `integer` signal domain
- explicit `BitsToInteger` and `IntegerToBits` bridges

This contract proposes the next bounded step: add a prime-field arithmetic primitive family with integer-domain I/O and explicit modulus semantics.

Please focus on:
- whether the slice is technically coherent with the current engine architecture
- whether it clearly distinguishes field arithmetic from existing bit-word arithmetic
- whether the boundary around modulus handling is precise enough
- whether the validation story is sufficient to prevent silent wrong answers
- whether the recommended prime-only regime is implementation-safe and product-honest
- whether likely testing, export, or inspector/rendering gaps are missing

Please also assess whether the contract is specific enough about:
- prime validation
- undefined inverse behavior
- how much current arithmetic-family analysis should or should not be reused

Do not spend most of the review on:
- broad ECC roadmap arguments
- future point mechanics
- speculative protocol-level design

Required output format:
1. Findings first, ordered by severity
2. Concrete references to contract sections where possible
3. Open questions second
4. End with one short conclusion:
- acceptable as-is
- acceptable with small edits
- needs contract revision
```
