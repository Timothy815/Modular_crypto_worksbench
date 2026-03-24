# Control Primitives V1

Last updated: March 24, 2026

Status: Proposed follow-on after `CRYPTO-OPERATORS-V1.md`.

## Purpose

This contract defines the first bounded control-logic milestone for MCW.

The goal is not to turn MCW into a general automation language.
The goal is to make condition-driven cryptographic machines expressible as honest graphs.

This slice should establish that MCW can represent:
- counters
- comparisons
- conditions
- pulses / triggers
- gates and conditional flow

This is the missing vocabulary needed for:
- advanced rotor behavior
- irregular clocking in stream-cipher teaching
- scheduler and protocol control logic
- state-machine-style machine behavior

## Architectural Decision

For this first control milestone, control primitives should stay on the existing `bits` signal domain.

That means:
- counters output fixed-width `bits` words
- comparators output single-bit control signals:
  - `[1]` for active / true
  - `[0]` for inactive / false
- gates consume explicit `bits` control signals rather than hidden engine state

This slice should follow the existing ticked engine rule:
- an active pulse is exactly `[1]`
- `[0]`, `[]`, or wider bit arrays are not clock pulses

For the first milestone, explicit pulse-on-match behavior should come from comparator outputs rather than a separate hidden trigger memory model.

This means:
- `Equals` can act as an exact-match pulse when its left input changes over time
- `AtLeast` can act as a persistent level once a threshold has been reached
- `Gate` can pass or block an existing pulse stream visibly

This slice should not introduce:
- a new control-specific signal type
- hidden edge-trigger semantics
- input-driven internal state mutation outside the existing clocked stateful model

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Ticked Build**
- control primitives should work naturally with existing stateful and ticked execution
- they should appear as ordinary graph modules, not hidden engine rules

2. **Analyze**
- conditions and pulses should be inspectable
- students should be able to see why a trigger fired or did not fire

3. **Guide / Challenge**
- at least one tutorial and one bounded exercise should teach conditional machine behavior

This slice should not become:
- a scripting runtime
- arbitrary custom logic code
- event-loop programming inside the workbench
- a generic automation builder

## First Milestone

The first milestone should answer one question clearly:

**Can a student build a simple condition-driven cryptographic machine without hidden control magic?**

The student should be able to:
- count or track a simple state
- compare that state to a visible condition
- produce a trigger or gated effect
- inspect the result in a ticked machine

## Include

The first milestone should likely include a bounded set such as:
- `Counter`
- `Equals`
- one threshold-style comparator such as `GreaterThan` or `AtLeast`
- pulse-on-match behavior via comparator outputs
- `Gate`

Preference:
- choose the smallest set that can express real conditional behavior
- keep pulse semantics explicit
- make rollover / wrap behavior visible where relevant

The first proof targets should likely include:
- a notional notch/turnover precursor
- a gated clock demo
- an irregular stepping or conditional keystream example

## Exclude

This milestone should explicitly avoid:
- full rotor realism in the same slice
- a large library of comparators
- a separate stateful `Trigger` until MCW needs true edge-memory semantics
- recursive state machines
- hidden transition tables
- freeform condition scripting

## Visual / Teaching Principles

Prefer:
- modules that read as obvious control parts
- visible difference between “state,” “condition,” and “trigger”
- clean tick-by-tick inspectability
- one tutorial that makes the machine logic feel legible rather than magical

Avoid:
- collapsing counter, compare, and trigger into one opaque super-module
- hidden conditional advance rules inside unrelated primitives
- making control flow feel like UI scripting instead of cryptographic mechanism

## Suggested Teaching Additions

The first milestone should likely ship with:
- one tutorial on counters, conditions, and pulses
- one demo workspace such as a gated clock or threshold-trigger machine
- one bounded challenge or mutation exercise showing why a trigger fires when it does

## Success Criteria

This slice is successful when a student can:
- build a small ticked machine with explicit conditional behavior
- explain what state was counted
- explain what condition was checked
- explain why a trigger or gate fired
- see how this vocabulary prepares later rotor realism, stream-cipher control, and scheduler logic
