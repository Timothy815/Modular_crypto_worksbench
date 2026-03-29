# VERIFIED-MACHINE-WORKFLOW-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the first bounded implementation slice that turns the verification/trust direction into a real product workflow.

This slice follows:
- `SYSTEMS-IDE-COHERENCE-V1.md`
- `VERIFIED-MACHINE-COHERENCE-V1.md`

It should refine the existing compare/analysis line into a first-class verification station for known-answer cases.

---

## Problem

MCW can execute serious machines, trace them, compare them, and export them.

But it still lacks one explicit workflow for proving:
- this workspace matches a chosen expected behavior
- the match or mismatch is visible
- the first divergence can be located without manual guessing

Right now that proof burden is too manual.

---

## Strategic Position

The right first verification slice is not:
- a scripting console
- a standards database
- a formal verification engine
- a broad external-library integration layer

The right first slice is:
- user-provided known-answer cases
- run directly against the current workspace
- pass/fail summarized clearly
- first divergence surfaced through the existing compare/trace machinery

This keeps the trust story aligned with MCW’s glass-box philosophy.

---

## Required V1 Shape

This slice must:
- live inside the existing compare/analyze product line, not as a disconnected subsystem
- allow the user to define one or more explicit verification cases
- support, at minimum, stateless verification cases with:
  - input
  - expected output
- run the current workspace against those cases
- show per-case pass/fail clearly
- show the first divergence location when a case fails
- reuse existing execution-comparison logic wherever possible
- state clearly that “verified” means:
  - matches this chosen reference behavior
  - not “secure” or “certified”

It may also support a bounded ticked variant in V1 if that remains clean:
- explicit ticked input case
- explicit expected collected/ticked output

It must not:
- add a scripting console
- add arbitrary code execution
- imply formal verification
- claim cryptographic security from a passing result
- introduce a broad standards bundle or standards browser

---

## Verification Model

In V1, a verification case should remain tightly bounded.

For stateless machines, each case should express:
- one explicit input value
- one explicit expected output value

For bounded ticked support, each case should express:
- one explicit ticked input/source configuration
- one explicit expected output history or collected output

Verification should answer:
- did the machine match the expected output?
- if not, where did it first diverge?

That divergence should be expressed through the same reasoning model MCW already uses elsewhere:
- output mismatch
- first trace divergence
- visible module-level location

---

## UX Shape

V1 should feel like a verification station, not a test harness IDE.

That means:
- small explicit cases
- obvious run/check action
- obvious pass/fail result
- obvious first-divergence pointer

It should not feel like:
- writing scripts
- managing test files
- configuring a miniature CI system

---

## Success Condition

This slice is successful when:
- a user can define explicit known-answer verification cases for a workspace
- MCW can run those cases and show pass/fail clearly
- a failing case points the user toward the first divergence instead of forcing manual guesswork
- the workflow strengthens trust without widening into general programming behavior
- MCW has a first real answer to “how do I prove this machine matches a reference?”
