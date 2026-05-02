# VERIFIED-MACHINE-TICKED-WORKFLOW-V1

Last updated: March 28, 2026

Status: Shipped

---

## Purpose

Define the next bounded implementation slice for the verification/trust line after the shipped stateless verification station.

This slice follows:
- `VERIFIED-MACHINE-COHERENCE-V1.md`
- `VERIFIED-MACHINE-WORKFLOW-V1.md`

It should extend the verification workflow into bounded temporal/ticked machines without widening into a general test harness.

---

## Problem

MCW now has a first verification station for stateless workspaces.

That closes part of the trust gap, but not the part that is most identity-defining for MCW:
- stateful execution
- clocks
- feedback
- turnovers
- collected/tick-history outputs

Right now, users still lack a first-class way to prove that a temporal machine matches a chosen reference behavior across time.

---

## Strategic Position

The next verification move should remain narrow.

It is not:
- a scripting console
- a waveform lab
- a standards browser
- a full protocol test harness

It is:
- explicit bounded ticked verification cases
- run against the current workspace in the existing compare/analyze line
- clear pass/fail across time
- first divergence surfaced by tick and module

This keeps trust aligned with MCW’s glass-box systems-IDE identity.

---

## Required V1 Shape

This slice must:
- live inside the existing compare/analyze verification station
- support bounded ticked verification cases for workspaces already running in ticked mode
- allow a user to define one or more explicit temporal verification cases
- at minimum support cases with:
  - one explicit source override
  - one explicit tick count or bounded run length
  - one explicit expected result, such as:
    - collected output
    - or bounded output history
- run the current workspace against those cases
- show per-case pass/fail clearly
- show first divergence with tick-aware location when a case fails
- reuse existing ticked execution and execution-comparison logic wherever possible
- keep the trust language explicit:
  - “verified” means “matches this chosen reference behavior over time”
  - not “secure” or “certified”

It must not:
- add arbitrary scripting
- add unbounded temporal scenario authoring
- imply formal verification
- claim cryptographic security from a passing result
- widen into a generic waveform or debugger subsystem

---

## Verification Model

In V1, a temporal verification case should remain tightly bounded.

Each case should express:
- one source module to override
- one explicit source value
- one bounded tick count
- one explicit expected temporal outcome

The expected temporal outcome in V1 should likely be limited to one of:
- expected collected output
- expected terminal output after N ticks
- expected per-tick output history for a single chosen sink

Verification should answer:
- did the machine match the expected behavior across the requested tick window?
- if not, at which tick did it first diverge?
- which module/output path diverged first?

That divergence should be surfaced in the same reasoning model MCW already uses:
- output mismatch
- first trace divergence
- explicit tick index
- visible module-level location

---

## UX Shape

V1 should still feel like a verification station, not a testing IDE.

That means:
- small explicit temporal cases
- obvious bounded run/check action
- obvious pass/fail result
- obvious tick-aware first-divergence pointer

It should not feel like:
- authoring timelines
- scripting time-based assertions
- building a mini QA framework inside MCW

---

## Success Condition

This slice is successful when:
- a user can define bounded ticked verification cases for a temporal workspace
- MCW can run those cases and show pass/fail clearly
- a failing temporal case points the user toward the first divergence by tick and module
- the workflow strengthens trust for MCW’s stateful machines without widening into a general programming surface
- MCW has a first real answer to “how do I prove this temporal machine matches a reference over time?”

---

## Shipped Shape

This slice is now shipped in a bounded form:
- it lives inside the existing compare surface
- it extends the baseline-backed verification station into ticked mode
- it supports bounded temporal cases for the same supported verification sources:
  - `TextInput`
  - `AsciiSource`
  - `BaudotSource`
  - `HexSource`
- each ticked case stores:
  - source module
  - explicit input value
  - explicit tick count
  - explicit expected collected output captured from the chosen baseline
- each ticked case reports:
  - pass/fail
  - expected collected output
  - actual collected output
  - first divergence by tick and module when the live workspace no longer matches the captured reference

This V1 shape remains intentionally bounded:
- it does not add waveform authoring
- it does not add arbitrary temporal assertions
- it does not widen into a general test harness
