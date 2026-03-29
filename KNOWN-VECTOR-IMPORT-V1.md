# KNOWN-VECTOR-IMPORT-V1

Last updated: March 29, 2026

Status: Implemented

---

## Purpose

Define the next bounded verification/trust refinement slice after the shipped stateless verification station, ticked verification workflow, and export-engine parity workflow.

This slice follows:
- `VERIFIED-MACHINE-COHERENCE-V1.md`
- `VERIFIED-MACHINE-WORKFLOW-V1.md`
- `VERIFIED-MACHINE-TICKED-WORKFLOW-V1.md`
- `EXPORT-ENGINE-PARITY-WORKFLOW-V1.md`

It should make the verification station easier to feed with real known-answer pairs while staying bounded, explicit, and classroom-friendly.

---

## Problem

MCW now has a real verification story:
- baseline-backed stateless verification cases
- bounded ticked verification cases
- export-vs-engine parity via `verify_parity.py`

But the verification station still assumes the user will create cases one at a time inside the UI.

That is good for discovery, but weak for classroom and textbook use:
- teachers often already have input/output pairs
- users often want to paste known-answer vectors directly
- typing many cases by hand is needless friction

Right now the verification workflow is trustworthy, but still slower than it should be to populate.

---

## Strategic Position

The next verification refinement should remain narrow.

It is not:
- a standards database
- a bundled NIST catalog
- a broad import/export format ecosystem
- a scripting console
- a general test-fixture manager

It is:
- a bounded way to paste or import explicit known-answer cases
- directly into the existing verification station
- using the same case model MCW already runs
- with explicit validation and visible mapping to supported source modules

This keeps the trust line aligned with MCW’s glass-box philosophy:
- users bring explicit cases
- MCW runs them honestly
- MCW shows pass/fail and first divergence clearly

---

## Required V1 Shape

This slice must:
- live inside the existing verification station rather than creating a separate testing subsystem
- support importing or pasting multiple explicit known-answer cases in one bounded action
- map imported cases onto the existing verification case model wherever possible
- keep the imported shape explicit and small, such as:
  - source module
  - input value
  - expected output
  - optional tick count for bounded temporal cases
- validate imported cases before adding them
- show clear rejection reasons when a case cannot be imported cleanly
- allow imported cases to exist without a captured baseline
- make baseline-free behavior explicit:
  - pass/fail still works against the chosen expected output
  - first-divergence tracing is limited unless the captured baseline also matches the imported expectation
- resolve a deterministic verification target sink for imported cases when a workspace has multiple sinks
- preserve the existing trust language:
  - “matches these chosen known-answer cases”
  - not “secure” or “certified”

It may support more than one bounded input format if they are both simple and classroom-friendly, such as:
- line-oriented paste format
- small JSON array format

It must not:
- bundle a standards/vector library into the app
- widen into arbitrary file parsing
- add scripting
- replace the existing manual case flow
- imply formal verification or security certification

---

## Import Model

In V1, imported vectors should remain tightly bounded and human-readable.

The imported data should express only:
- which source is being overridden
- what input value should be used
- what output is expected
- and, for bounded temporal cases, how many ticks should be run

V1 should prefer one of these bounded models:

1. Source-scoped paste:
- user chooses a supported source module first
- then pastes one or more `input -> expected` pairs

2. Small structured import:
- user provides a short explicit data structure where each case names:
  - source module
  - input
  - expected output
  - optional tick count

Whatever format is chosen, MCW should convert it into the same internal verification cases already used by the current verification station.

The parser should remain intentionally small but tolerant of common classroom delimiters:
- `->`
- `:`
- tab
- `,`

It may normalize bounded source/input formats where that matches current engine behavior, such as:
- trimming whitespace
- case-insensitive hexadecimal input for `HexSource`
- stripping `0x` prefixes from hexadecimal source input

---

## UX Shape

V1 should feel like an accelerator for the current verification station, not a test-management product.

That means:
- small explicit import affordance
- obvious preview or validation summary
- obvious “add N cases” result
- obvious rejection feedback when parsing fails
- obvious distinction between:
  - baseline-backed cases with trace divergence support
  - imported cases that may be output-only checks when no matching baseline exists

It should not feel like:
- uploading fixtures into a separate lab
- configuring a file format ecosystem
- maintaining a standards repository

The likely best shape is:
- a bounded `Paste Known Vectors` action inside the verification station
- a short parser/preview step
- then conversion into ordinary MCW verification cases

---

## Success Condition

This slice is successful when:
- a teacher or user can populate the verification station with multiple known-answer cases quickly
- imported cases become ordinary MCW verification cases after validation
- malformed or unsupported vectors fail clearly instead of silently
- the trust story gets easier to use without widening into a generic test harness
- the slice materially improves classroom/readiness workflows ahead of real-user sessions
