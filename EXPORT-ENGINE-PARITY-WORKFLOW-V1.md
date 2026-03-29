# EXPORT-ENGINE-PARITY-WORKFLOW-V1

Last updated: March 28, 2026

Status: Proposed

---

## Purpose

Define the next bounded implementation slice for the verification/trust line after the shipped stateless and ticked verification-station workflows.

This slice follows:
- `VERIFIED-MACHINE-COHERENCE-V1.md`
- `VERIFIED-MACHINE-WORKFLOW-V1.md`
- `VERIFIED-MACHINE-TICKED-WORKFLOW-V1.md`

It should strengthen trust that exported Python remains behaviorally faithful to the authored MCW machine.

---

## Problem

MCW now has a first-class way to verify:
- stateless workspaces against chosen reference behavior
- bounded temporal workspaces against chosen reference behavior over time

But one trust question still remains product-facing rather than just internal:

**How does the user know the exported Python is faithful to the machine they authored in MCW?**

Right now that trust mostly lives in repository tests and internal engineering discipline.
That is a strong engineering signal, but not yet a first-class product workflow.

---

## Strategic Position

The next export/trust move should remain narrow.

It is not:
- arbitrary Python execution inside the browser
- a remote Python runner service
- a full external-runtime orchestration system
- a generic package/test harness

It is:
- a bounded export-vs-engine parity workflow
- attached to the verification story MCW already has
- explicit about what is being checked
- honest about what is not being checked

This keeps export trust aligned with MCW’s “Glass Box” and executable-specification identity.

---

## Required V1 Shape

This slice must:
- define a first-class workflow for checking exported Python against live MCW behavior
- stay inside the existing trust/product line rather than becoming a separate external-runner subsystem
- make clear that the parity claim is:
  - exported Python matches MCW behavior for the chosen verification cases
  - not “all possible executions are proven forever”
- support, at minimum:
  - stateless parity cases
  - and, if it remains clean, bounded ticked parity cases
- reuse the verification-station case model wherever possible
- give the user a tangible parity artifact or workflow, such as:
  - generated verification script content
  - generated parity metadata
  - or another bounded export-side parity companion
- keep the exported-workspace/runtime split intact

It must not:
- add arbitrary code execution in the browser
- imply formal equivalence proof
- widen into general packaging/distribution work
- become a generic Python test runner

---

## Parity Model

In V1, parity should mean:

**For the chosen bounded cases, the exported Python and the MCW engine are expected to produce the same behavior.**

That behavior may include:
- final output parity for stateless cases
- collected-output parity for bounded ticked cases

The workflow should be explicit about:
- which cases are checked
- what artifact is being run or compared
- what constitutes pass/fail

The workflow should also preserve MCW’s honesty:
- parity success means “faithful for these cases”
- not “universally equivalent under all future edits or environments”

---

## UX Shape

V1 should feel like an export-trust workflow, not an infrastructure feature.

That means:
- explicit relationship to the existing verification station
- obvious “engine vs export” framing
- small bounded artifacts
- clear pass/fail or parity expectations

It should not feel like:
- a Python IDE inside MCW
- a deployment pipeline
- a cloud execution service

---

## Success Condition

This slice is successful when:
- MCW has a first user-facing answer to “how do I know the export is faithful?”
- the parity workflow is clear, bounded, and honest
- it strengthens trust in Python export without widening into arbitrary external execution
- the next productization or verification move can build on a stable engine-vs-export trust model
