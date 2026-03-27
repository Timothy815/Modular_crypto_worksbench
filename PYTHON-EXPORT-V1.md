# PYTHON-EXPORT-V1

Last updated: March 27, 2026

---

## Purpose

Define a bounded future code-generation line for exporting an MCW workspace as standalone executable Python.

This line would move MCW beyond teaching and design into implementation tooling by turning an explicit workspace into runnable external code.

It is not the current active implementation path, but it is strategically important and should remain near the front of the future docket.

---

## Problem

MCW currently excels at:
- visible system construction
- cryptographic teaching
- explicit machine design
- workspace experimentation

What it does not yet do is let the user take a workspace and export it into a normal external program.

That means MCW currently stops at design and simulation.
There is no path from workspace to standalone implementation artifact.

---

## Strategic Position

This is a major future product line.

If done well, it would make MCW more than a teaching environment:
- a design tool
- an executable specification environment
- and an implementation bridge

This is one of the most strategically important future ideas in the product.

Because of that, it should be handled deliberately and not treated as a casual utility feature.

---

## Desired Shape

The first slice should aim for:
- export one workspace as standalone Python
- preserve explicit graph structure in the generated code
- generate readable code, not opaque blobs
- keep runtime behavior aligned with MCW execution semantics for the supported subset

The generated code should reflect the machine the user built, not hide it behind a radically different execution model.

---

## Recommended First Slice

If this line is implemented, the first slice should stay narrow:
- target a bounded supported subset of modules
- export one workspace at a time
- produce a small Python runtime harness plus generated module / graph code
- prefer clarity and fidelity over aggressive optimization

This should be framed as **Python export foundations**, not “export everything.”

---

## Open Design Questions

This line will later need explicit answers for:
- which module subset is supported first
- how stateful / ticked execution is represented
- how composites are emitted
- whether generated code uses functions, classes, or both
- how validation parity is preserved
- how export handles unsupported primitives

These are intentionally left open for the future implementation contract.

---

## Non-Goals

This line should explicitly avoid the following in its first slice:
- full-language backend pluralism
- export for every primitive family immediately
- hidden optimizations that obscure the graph structure
- broad runtime portability promises
- immediate production-hardening claims
- folding persistence/history/versioning concerns into the export line

---

## Product Fit

This family would make MCW meaningfully more important as a tool by turning it into:
- a visible design environment
- a cryptographic systems IDE
- and a bridge to executable implementation

This is a major strategic expansion of the product's value.

---

## Recommendation

Keep this near the front of the future docket.

It should be discussed fairly soon because it may become one of the most important long-term differentiators of MCW.

It should not displace the current immediate ergonomics path without a deliberate product decision, but it should not be allowed to vanish into a distant backlog either.

---

## Exit Condition

This contract is complete when:
- the Python export direction is recorded as a major strategic line
- the first slice is framed as bounded foundations rather than total codegen coverage
- the project can revisit export later with a clean, deliberate starting point
