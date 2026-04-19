# STEPPED-MECHANISM-COMPARISON-TEACHING-V1

Status: Shipped on `main`

## Purpose

Add one bounded teaching workspace that makes a sharper distinction between two live machine patterns that both change across ticks but for different reasons:

- a stepped rotor path, where one mapping changes because visible rotor state advances
- a clocked iterator path, where one bounded round body is traversed one pulse at a time

The goal is not another large rotor-realism lab. The goal is one compact side-by-side comparison that helps users feel the difference between:

- stateful substitution
- stateful structural traversal

## Why This Slice Exists

`STATEFUL-FAMILY-COMPARISON-TEACHING-V1` already establishes the broad stateful grammar:

- pulse source
- counted time
- register evolution
- structural traversal

That family board is useful, but it is still one level abstract. The next bounded step is to compare two actual transforming machines that both respond to the same clock:

- `Rotor`
- `ClockedByteRoundIterator`

This should answer:

**How is a stepped rotor different from a pulse-driven iterator if both produce changing outputs over time?**

## Required Outcome

Ship exactly:

1. one seeded demo project
2. one matching starter tutorial
3. one small demo-registry test
4. implementation status update

## Demo Shape

Create one demo with a shared visible clock and two branches:

- Branch A:
  - `TextInput -> Rotor -> TextOutput`
  - the same `Clock` feeds the rotor `clock` input
- Branch B:
  - `IV -> ClockedByteRoundIterator -> BitOutput`
  - the same `Clock` feeds the iterator `clock` input

Both branches must be executable in ticked mode on one canvas.

## Teaching Point

The tutorial must make the distinction explicit:

- the rotor changes one substitution face by advancing position
- the clocked iterator changes output by applying the next authored round to the accumulated state

This is not a “which one is better” lesson. It is a “what kind of machine is this” lesson.

## Scope Rules

Include:

- one shared `Clock`
- one visible rotor branch
- one visible clocked-iterator branch
- direct outputs on both branches
- ticked-mode default enabled

Exclude:

- new primitives
- new iterator semantics
- multi-rotor realism
- reflectors
- reverse traversal
- control-bank behavior
- keyed iterators
- challenge conversion

## Acceptance

This slice is complete when:

- a user can open one workspace and step the same pulse through both branches
- the tutorial explains why the rotor is changing and why the iterator is changing in different terms
- the result is smaller than the existing rotor-realism labs and smaller than the stateful-family board

