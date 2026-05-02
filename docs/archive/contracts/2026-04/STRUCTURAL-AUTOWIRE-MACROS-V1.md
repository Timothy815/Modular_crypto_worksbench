# STRUCTURAL-AUTOWIRE-MACROS-V1

Last updated: April 5, 2026

Status: Shipped on `main`.

## Purpose

Define a bounded macro-authoring slice that reduces repetitive connection work in structurally regular module groups.

The goal is not to auto-build whole algorithms.
The goal is to provide a small set of explicit helper actions that can connect obvious matching ports across a selected set of modules.

## Why Now

MCW has become much better at organization and readability, but repeated wiring is still slow in:
- Feistel-style ladders
- SP-network strips
- rotor/control banks
- repeated key-schedule scaffolds

Cluster duplication helps with repeated geometry.
What is still missing is a bounded way to reduce repeated **connection authoring**.

## Product Goal

Users should be able to take a selected structured region and ask MCW to perform a small amount of obvious connection work:
- explicitly
- locally
- predictably

The result should save time without hiding the structure or turning MCW into a black-box macro generator.

## Core Decision

This slice introduces **bounded structural auto-wire helpers**, not generic inference.

The helpers should only act on:
- the current selection
- clearly matchable ports
- deterministic local rules

## Scope

This contract is limited to selection-scoped helpers such as:
- connect matching outputs to inputs across an ordered selection
- connect one stage to the next using exact port-name matches
- fill only currently missing connections

The exact helper list can be small in V1, but the product shape must stay:
- explicit
- selection-scoped
- reviewable by eye

## Required Behaviors

1. Auto-wire helpers must operate only on the current selection.
2. V1 must only create connections that satisfy existing connection rules.
3. Existing valid connections must not be overwritten unless a specific helper explicitly says it replaces them.
4. V1 should prefer missing-connection fill behavior over destructive rewiring.
5. Matching rules must be deterministic and inspectable.
6. The action must be one undo/redo step.
7. The result must remain fully ordinary MCW graph state:
   - no hidden macros
   - no hidden grouping semantics
8. The feature must not mutate primitive or composite definitions.
9. The feature must not infer cryptographic meaning beyond explicit structural rules.
10. The feature must not require engine changes.

## Product Shape

Good bounded V1 helpers would be things like:
- `Connect Matching Ports`
- `Connect Selection Left-to-Right`
- `Connect Selection Top-to-Bottom`

Where "matching" means exact visible port-name compatibility, not fuzzy semantic guessing.

If multiple helpers are offered, they should live in a compact selection-scoped surface, not a new macro wizard.

## Matching Guidance

Safe V1 matching rules:
- exact output-port name to input-port name match
- deterministic module ordering based on current layout or selection order
- only connect ports that are currently unconnected if a helper is in "fill missing" mode

Unsafe V1 behavior to avoid:
- semantic guessing like “clock probably goes to tick”
- choosing among multiple plausible targets with hidden heuristics
- creating connection fans without explicit user intent

## Explicit Non-Goals

Do not include:
- full algorithm templates
- repeated-stage generation
- hidden stage inference
- auto-layout
- automatic cleanup of resulting geometry
- semantic macro scripting
- cross-workspace pattern libraries

## Success Criteria

This contract is successful when:
- repeated structural wiring becomes faster in obvious cases
- the helper behavior remains predictable enough to trust
- the result is easy to inspect and undo
- MCW gains time-saving structure helpers without sacrificing its glass-box character
