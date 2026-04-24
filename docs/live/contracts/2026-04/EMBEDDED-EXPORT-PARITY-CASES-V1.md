## Embedded Export Parity Cases V1

Last updated: April 24, 2026

## Purpose

Improve trust in exported Python by ensuring `verify_parity.py` is useful by default whenever the current workspace already exposes a clear, supported parity path.

This slice is not about building a general verification framework.

It is about removing the common failure mode where export succeeds, `verify_parity.py` exists, and the file contains no actual cases.

## Problem

Right now, exported Python often produces:

- a valid runtime
- a valid main workspace script
- a `verify_parity.py` helper

but:

- `PARITY_CASES = []`

This weakens trust at exactly the handoff point where users are trying to answer:

- did export preserve the machine I built
- can I verify that with something concrete

Users then compensate manually:

- by editing the exported Python
- by copying source values into the exported script
- by running ad hoc checks outside MCW

That is unnecessary friction.

## User Value

When a workspace already has a clear supported source and sink, export should hand the user at least one concrete parity check automatically.

That gives users:

- a trustworthy first verification step
- a stronger bridge from in-product design to exported execution
- a better classroom and review workflow

## Scope

V1 is intentionally narrow.

It should:

- detect when the current workspace has a supported parity path
- emit a concrete parity case into exported Python
- keep `verify_parity.py` immediately runnable without user editing

V1 should not:

- add a new export UI flow
- invent a full saved-vector management system
- auto-generate exhaustive test suites
- try to infer parity cases for unsupported source/sink shapes

## Supported V1 Case Shape

For V1, a `supported parity source` means the primary exportable message/input path recognized by the existing Python parity workflow.

It does not mean every source-like module in the graph automatically counts as an equal parity candidate.

In particular:

- the contract should follow the current export parity path rules rather than treating secondary key/configuration inputs as competing parity sources by default
- if the current export parity path cannot distinguish a primary message/input source from competing inputs, V1 must fall back explicitly rather than guess

A `supported parity sink` means the sink shape already supported by the exported parity helper and Python runtime verification path.

V1 should support parity case embedding only when all of the following are true:

1. the workspace exposes exactly one supported primary parity source for export parity
2. the workspace exposes exactly one supported parity sink for export parity
3. the source kind is already supported by the export runtime parity path
4. the sink representation is already supported by the export parity helper

If those conditions are not met, export may still succeed, but parity-case embedding should not guess.

## V1 Output

When a parity case can be embedded, export should populate `PARITY_CASES` with exactly one case containing:

- source module id
- source definition id
- a concrete input value in the source’s expected string form
- the expected sink output derived from MCW at export time

If the workspace already contains an explicit verification case that matches the supported export parity path, V1 may prefer that case rather than inventing a new one.

If no explicit matching verification case exists, V1 may derive one deterministic case from the current machine state.

## Derivation Rule

If V1 derives a parity case automatically, it should use the current supported source value already present in the workspace.

For ticked machines, the derived case should use the natural tick count implied by the source input and current export verification rules, not an arbitrary transient UI tick selection.

It should not:

- generate random inputs
- mutate the machine before export
- create multiple speculative cases

The user should be able to understand the case as:

- "this is a concrete export-time check of the machine as currently authored"

## Fallback Rule

If the workspace does not satisfy the supported parity-path constraints, or if MCW cannot successfully execute the workspace at export time to derive the expected sink output, `verify_parity.py` should remain valid and explicit.

It should clearly state that no embedded parity cases were generated because:

- no supported source was found
- no supported sink was found
- more than one eligible source/sink made the path ambiguous
- or the current source/sink shape is outside supported parity embedding
- or export-time validation/execution failed

V1 should prefer a truthful empty result over a guessed case.

When ambiguity is the reason, the fallback should list the detected candidate sources and/or sinks so the user can understand why the helper remained empty.

## UX Expectations

This is primarily an export-surface improvement, not a new editor feature.

The exported artifact should communicate clearly:

- when parity cases were embedded
- what source and sink they target
- when parity cases could not be embedded and why

For V1, fallback communication should appear as:

- a runtime `print(...)` explanation when the helper runs with no embedded cases
- plus a small inspectable in-file status constant or comment block describing the reason

V1 does not require a new on-screen export wizard.

## Required Behaviors

### 1. Deterministic

The same workspace exported twice without relevant machine changes should produce the same embedded parity case content.

### 2. Trustworthy

Embedded parity cases must be derived from MCW’s own execution of the exported workspace state, not from hand-built formatter shortcuts.

### 3. Narrow

Only supported and unambiguous primary source/sink paths should produce embedded cases.

### 4. Immediate

When a case is embedded, `verify_parity.py` should run without manual editing and actually test something.

### 5. Honest Fallback

When no case is embedded, the exported helper should explain that clearly instead of silently shipping an empty array with no guidance.

## Non-Goals

V1 is not:

- a replacement for in-product verification workflows
- automatic generation of multiple parity cases per source
- export of saved analysis cases
- export of full avalanche or cryptanalysis scripts
- support for ambiguous multi-source / multi-sink parity inference
- a promise that every exportable workspace gets parity vectors automatically

## Likely Implementation Direction

Use the existing export-time source/sink detection path and current verification/export helpers.

The safest implementation shape is:

1. identify whether exactly one supported primary parity source and exactly one supported parity sink exist
2. resolve the current source value from the workspace
3. resolve the expected sink output from MCW execution at export time
4. serialize that into `PARITY_CASES`
5. emit a truthful fallback message when the path is unsupported, ambiguous, or cannot be executed successfully at export time

## Success Criteria

This slice is successful when:

1. common supported exports no longer ship empty parity helpers by default
2. the embedded case matches the authored machine at export time
3. unsupported or ambiguous workspaces remain explicit rather than guessed
4. exported parity feels like a trust bridge, not a dead stub
