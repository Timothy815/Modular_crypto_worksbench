# VERIFIED-MACHINE-COHERENCE-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define a bounded verification/trust coherence pass for MCW now that:
- Python export has reached its first real completeness and productization milestone
- authoring safety foundations such as undo/redo and named workspace versions are already shipped
- MCW can now build and export serious cryptographic machines, but does not yet give users a first-class way to prove those machines against external ground truth

This slice is not about new crypto vocabulary.
It is about deciding how MCW should help users know a machine is behaviorally correct.

---

## Problem

MCW has achieved expressive parity:
- it can model and execute what it claims to model
- it can export those models into executable Python

But MCW has not yet achieved verifiable parity:
- there is no first-class workflow for running a workspace against known-answer cases
- users still rely too heavily on manual inspection and ad hoc output checking
- compare/trace/export all exist, but they do not yet form one coherent trust story

This creates the current maturity gap:
- MCW can build serious machines
- but it still asks users to prove correctness mostly by hand

---

## Strategic Position

In MCW, “verified” should mean:

**Observably identical to a chosen ground truth for the behavior being tested.**

It should not mean:
- formally proven secure
- mathematically certified
- blessed as a production-safe cipher

The trust goal is narrower and more useful:
- the machine matches a known expected behavior
- edge and temporal behavior are checked explicitly
- exported Python remains behaviorally aligned with the authored workbench machine

---

## Working Thesis

The strongest next trust move is likely not a brand-new subsystem.

It is likely a refinement of the existing compare/analysis line into a bounded verification workflow, where users can:
- define explicit input -> expected output cases
- run a workspace against those cases
- see pass/fail clearly
- inspect the first divergence location when a case fails

This pass exists to either confirm that direction or replace it with a stronger trust model.

---

## Required V1 Shape

This slice must:
- define what “verified” should mean inside MCW
- identify the strongest trust signals MCW already has
- identify the main trust/coherence gap that still remains
- recommend the best next move for trust strengthening, such as:
  - compare/verification workflow refinement
  - external known-answer/vector alignment
  - export-vs-engine trust strengthening
  - deployment / real-user validation
- explicitly distinguish:
  - trust signals already present
  - trust signals still missing
  - trust claims MCW should refuse to make

It must not:
- promise formal verification
- imply cryptographic security certification from a passing machine
- expand into a scripting console or general programming environment
- turn into a broad standards-coverage roadmap

---

## Deliverable

This slice should produce one bounded strategic note that answers:
- what “verified” should mean in MCW
- what the strongest current trust signals already are
- what the main trust/coherence gap is
- what the best next move is for strengthening user confidence
- what one bounded next implementation slice should follow from that decision

The result should be short, explicit, and product-facing.

---

## Success Condition

This slice is successful when:
- MCW has a clearer answer to “how does the user know the machine is right?”
- “verified” is defined in a way that is strong but honest
- the next trust-focused implementation slice is identified without reopening the entire roadmap
- future compare/export work can be judged against a stable verification philosophy rather than ad hoc convenience
