## Stage And Signal Inspection V1

Last updated: April 25, 2026

## Purpose

Make it easier for students to inspect what a machine stage is doing, what signal is present at a chosen point, and how that signal relates to the surrounding machine.

This slice is not about adding a new execution engine.

It is about making the existing execution and analysis surfaces more inspectable and more legible for real investigation.

## Problem

MCW can already execute machines, show outputs, and provide cryptanalysis views.

But students still hit a common gap:

- they can see that something happened
- but they cannot easily answer what this stage is doing
- where this signal came from
- what changed between here and the previous stage

That weakens the product’s value as a teaching environment.

Without stronger inspection depth, students can still complete workflows while remaining too fuzzy on the mechanism.

## User Value

A student working on a cipher, key schedule, or signal pipeline should be able to:

- click a stage and inspect its current value in a readable form
- understand the stage’s role in the larger machine
- see what upstream stage or source is feeding it
- compare the selected stage output to the immediately previous visible stage when that comparison is meaningful

This should make MCW feel more like a live machine bench and less like a static graph with outputs.

## Scope

V1 is intentionally narrow.

It should:

- deepen inspection for selected modules and selected sinks
- surface readable current signal values and nearby provenance
- expose simple previous-stage comparison when a stage chain is already visible
- reuse the current execution trace and existing workbench/analysis surfaces

V1 should not:

- add arbitrary graph-query tooling
- add freeform historical trace browsing
- add general-purpose provenance graphs
- add a new detached inspector system
- attempt to explain every possible composite interior automatically

## Core Questions V1 Must Answer

1. What signal is at this stage right now?
2. What role does this stage play in the machine?
3. What visible upstream stage or source is feeding it?
4. Compared with the nearest meaningful visible prior stage, what changed?

## Supported V1 Shape

V1 should work when:

1. the selected item is a top-level module or sink
2. the project has a valid execution trace for the current run
3. the selected stage has a visible output or sink input that can be rendered in an existing supported representation

V1 may fall back gracefully when:

- the stage has no current signal
- the selected module is only partially connected
- there is no meaningful visible prior stage to compare against
- the selected item is a composite whose internal substructure is not explicitly exposed at the top level
- the project has not been run yet or current execution failed validation

For V1, `visible` means:

- any module or sink instance that exists at the current top-level authored project layer
- not composite internals unless those internals are already explicitly authored at the current level

## Required Output

When a stage is selected, the product should show:

1. current signal value in a readable representation
2. signal type and width/length where meaningful
3. short stage-role description
4. immediate visible upstream source or stage inputs
5. simple previous-stage comparison when available

The comparison should stay bounded:

- same representation when possible
- width-parity only
- a concise changed/unchanged cue
- no giant diff view in V1

For V1, the stage-role description should be generic per-type role language derived from existing module-role language and current selection context.

It should not attempt full topology-derived semantic purpose explanation in V1.

## Visual Shape

V1 should prefer extending existing surfaces rather than creating a new workspace.

The likely shape is:

1. selected-stage inspection section in the existing inspector/workbench panel
2. compact “current signal” block
3. short “fed by” provenance block
4. short “compared with previous visible stage” block when available

This should feel like deeper inspection of the current selection, not a separate expert tool.

If there is no current execution trace, the same surface should stay visible and say so plainly, for example:

- run the machine to inspect current signals
- current execution is unavailable because validation failed

## Provenance Rule

V1 should expose only bounded provenance:

- immediate visible upstream parents only
- not full recursive ancestry

This keeps the product legible and avoids drifting into a graph-debugger subsystem.

For single-input modules and sinks, this is usually one upstream stage.

For multi-input modules, V1 should show all immediate visible parents rather than inventing a single primary parent.

If an immediate parent is a composite instance, V1 should show that composite instance as the visible upstream stage and stop there.

## Comparison Rule

V1 comparison should only appear when there is an obvious prior visible stage in the same authored path.

For V1, that means:

- linear single-input chains
- same-level authored modules only
- same signal width

V1 should not attempt automatic previous-stage comparison for:

- multi-input modules
- ambiguous fan-in paths
- width-mismatched stages
- hidden composite internals

If there is no meaningful comparison target, the product should say that plainly rather than fabricate one.

For selected sinks, the comparison target may be the single visible module feeding that sink when the same width rule holds.

## Copy Principles

The product should use observational language:

- “Current output at this stage”
- “Fed by”
- “Compared with previous visible stage”
- “Changed in representation/width/value”

The product should avoid overclaiming language:

- not “this proves”
- not “this stage is secure”
- not “this stage is correct”

## Required Behaviors

### 1. Immediate

Inspection should update from the current execution result without requiring export or separate setup.

For ticked machines, inspection should use the currently active tick shown by the product, not an implicit default tick.

### 2. Bounded

The surface should stay narrow enough to answer local questions without turning into a giant trace debugger.

### 3. Readable

Signal values should be shown in the existing best-fit readable representation for the selected signal.

### 4. Contextual

Students should see not only the value, but also what the stage is for and what immediately feeds it.

### 5. Honest

If provenance or previous-stage comparison is unavailable, the UI should say so directly.

## Likely Implementation Direction

Use the existing execution trace, selected-module state, and current sink representation helpers.

The safest implementation shape is:

1. resolve the selected module or sink from current workbench selection
2. extract current output/input signal from trace
3. derive a bounded stage-role description from existing module-role language
4. find immediate visible upstream parents through the authored top-level connections
5. compare against a prior visible stage only for linear same-width chains when possible
6. render the result in the current selection/inspector surface

## Non-Goals

V1 is not:

- arbitrary path tracing
- full execution history playback
- composite-internal debugger mode
- formal semantic explanation engine
- automatic proof of correctness

## Success Criteria

This slice is successful when:

1. a student can click a stage and see its current value in a readable way
2. a student can identify the local role of the stage without leaving the product
3. a student can tell what visible upstream stage is feeding the selection
4. a student can see a bounded previous-stage comparison when it is meaningful
5. the feature feels like inspection depth, not analysis clutter
