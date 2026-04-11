# PYTHON-EXPORT-FULL-COVERAGE-AUDIT-V1

Last updated: March 28, 2026

Status: Shipped on `main`.

---

## Purpose

Define the first explicit coverage audit after the shipped structured export compatibility tightening.

This contract is the follow-on to:
- `PYTHON-EXPORT-STRUCTURED-COMPATIBILITY-V1.md`

The export line now covers:
- broad stateless primitive export
- bounded temporal export
- bounded rotor-family export
- bounded rotor-control export
- composite helper export
- iterator helper export
- broader shipped iterator coverage
- explicit rejection of currently unsupported structured recursion

The next need is not another opportunistic export slice. It is a **full coverage audit**.

---

## Product Goal

Produce one explicit, trustworthy map of what in MCW can export today, what cannot export today, and what the remaining blockers actually are.

This is **coverage auditing**, not runtime redesign.

---

## Strategic Position

Python export is now a major product line, not a novelty.

That means the next strategic step is:
- stop guessing about completeness
- audit the actual gap between “what MCW can run” and “what Python export can emit”

This audit should create the first honest basis for saying:
- what is already effectively complete
- what is blocked by explicit contract boundaries
- what is blocked by missing runtime/helper support
- what is blocked by recursive structure or shared-state semantics

---

## Core Question

What exactly still separates the shipped Python export line from the long-term goal that anything MCW can run should eventually export?

---

## Required V1 Shape

This slice must:
- inspect the current shipped module/export surface against the actual MCW registry and structured definition forms
- use `src/engine/modules/index.ts` as the definitive primitive-module baseline
- classify every remaining unsupported case
- distinguish between:
  - unsupported primitive/stateful families
  - unsupported structured forms
  - explicit contract exclusions
  - implementation gaps
- identify the smallest next completeness milestone after the audit
- produce a ranked gap-priority list after the inventory is complete

This slice must not:
- add new runtime helpers
- broaden compatibility
- change generated Python
- silently fold into implementation work
- perform opportunistic implementation “while auditing”

---

## Audit Deliverable

The audit should produce one explicit recorded artifact that answers:
1. Which primitive modules are export-compatible today?
2. Which primitive modules are still unsupported?
3. Which structured forms are export-compatible today?
4. Which structured forms are still unsupported?
5. Which unsupported cases are intentional contract boundaries?
6. Which unsupported cases are now the highest-value next implementation targets?
7. Which cases appear implemented but still need stronger parity verification?

The output should be specific enough to guide the next implementation slice without re-auditing from scratch.

---

## Classification Rule

Every unsupported case should be classified into one of these categories:
- `intentional-boundary`
- `missing-runtime-support`
- `missing-structured-support`
- `shared-state-or-recursive-semantics`
- `needs-verification-only`
- `future-productization`

The audit should not collapse all remaining gaps into one vague “not yet supported” bucket.

---

## Expected Focus Areas

The audit should examine at least:
- remaining unsupported primitive/stateful module definitions in the registry
- remaining unsupported shipped composite and iterator shapes
- supported cases that may still lack strong parity coverage
- any remaining rotor-family/control-bank gaps
- broader structured recursion gaps
- the relationship between current one-file export and the future runtime-library split

---

## Explicit Non-Goals

This slice must not:
- implement any new export support directly
- redesign the current exporter
- switch to runtime-library packaging
- claim “full export parity” without evidence

---

## Success Condition

This slice is successful when:
- Python export has one explicit coverage map grounded in the current codebase
- the remaining gaps are classified clearly
- the gap-priority order is explicit
- the next implementation milestone after the audit is obvious instead of speculative
