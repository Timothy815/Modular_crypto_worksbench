## Student Success Roadmap V1

Last updated: April 25, 2026

## Purpose

Define the product standard MCW must meet to be considered genuinely useful for real students studying toward cryptographic practice.

This roadmap is not a release plan.

It is a prioritization frame for deciding which future slices matter most if MCW is to become:

- a serious teaching and experimentation tool
- a disciplined environment for inspection and testing
- a product with value beyond the author's personal exploration

## North Star

MCW should help students build understanding, intuition, and disciplined habits by making cryptographic structure visible and testable.

The product should move students toward practitioner behavior, not just toward successful assembly.

That means MCW must satisfy four standards:

1. every important mechanism should be inspectable
2. every important claim should be testable in-product
3. every workflow should teach a habit, not just produce an output
4. the tool should reward careful thinking more than clever clicking

## Problem

MCW already has meaningful analysis and authoring power, but there is still a gap between:

- "this tool can do interesting things"
- and "this tool reliably teaches students how to think"

Without closing that gap, students can still:

- see outputs without understanding mechanisms
- run analysis without knowing what question they are answering
- complete a lab without forming transferable habits
- misread partial or ambiguous evidence as stronger than it is

That would make MCW interesting, but not yet a true success as a teaching tool.

## Product Outcome

MCW should help a serious student repeatedly practice this loop:

1. build or modify a machine
2. inspect what each part is doing
3. form a hypothesis
4. run a relevant in-product test
5. compare outcomes honestly
6. explain what changed and why

If MCW reliably teaches that loop, it is serving real students.

## Priority Framework

The most important work is not "add more crypto topics" first.

The most important work is to strengthen the product around the four standards above.

Priority should be ordered like this:

1. inspection depth
2. in-product testing and verification
3. comparison workflows
4. guided habit-building content
5. semantic clarity and anti-sloppiness guardrails

## Priority 1: Inspection Depth

### Goal

Students should be able to answer:

- what is happening here
- what role does this stage play
- where did this signal come from
- what changed between these two points

without exporting or guessing.

### Required Improvements

- stronger stage and round inspection for both message and key-schedule paths
- easier extraction of intermediate values from taps, sinks, and selected modules
- clearer signal provenance: upstream source, transformations, and current representation
- better support for side-by-side stage inspection across variants
- more direct explanation of module role inside a larger machine

### Success Test

A student can inspect a machine and explain the role of a chosen stage from the product itself.

## Priority 2: In-Product Testing And Verification

### Goal

Students should treat testing as the normal next step after a design change.

### Required Improvements

- one-click rerun of the most relevant tests for a workspace
- stronger known-answer, round-trip, parity, and comparison checks inside MCW
- repeatable named test and analysis cases where appropriate
- clearer failure explanations when a result stops matching expectations
- easier before/after testing after a structural edit

### Success Test

When a student changes a machine, the product naturally leads them to rerun and compare rather than just trust visual plausibility.

## Priority 3: Comparison Workflows

### Goal

Students should be able to compare weak vs stronger, before vs after, and variant A vs variant B without rebuilding the framing themselves every time.

### Required Improvements

- better variant comparison surfaces tied to the same analysis question
- explicit comparison presets for common investigative tasks
- stage-level and result-level deltas that explain what changed
- tighter support for "same machine, one changed assumption" studies

### Success Test

A student can answer "what did this change actually do?" without manually reconstructing both contexts from scratch.

## Priority 4: Guided Habit-Building Content

### Goal

Labs, demos, and challenges should teach analytical habits rather than merely present features.

### Required Improvements

- more labs that end with interpretation, not just execution
- prompts that ask for expectation before result
- clearer weak-vs-stronger comparisons tied to live machine evidence
- challenge content that rewards diagnosis, not just construction
- short authored interpretation scaffolds that teach how to read evidence modestly

### Success Test

Students begin using the product to form and test hypotheses, not only to follow steps.

## Priority 5: Semantic Clarity And Guardrails

### Goal

The product should make disciplined reading easier than sloppy reading.

### Required Improvements

- stronger distinction between message input, key input, constants, IV/nonce, and state
- more visible warnings around stale, partial, ambiguous, or format-constrained analysis
- clearer source and sink role labeling in analysis workflows
- less room for accidental good-looking results caused by UI ambiguity

### Success Test

Students are less likely to confuse convenience, formatting, or ambiguity with cryptographic meaning.

## Highest-Leverage Near-Term Slices

If MCW wants the fastest route toward real student usefulness, the next slices should preferentially come from this set:

1. deeper stage and signal inspection
2. stronger in-product verification harnesses
3. better variant-comparison workflows
4. additional habit-centered labs and challenges
5. semantic role clarity for message, key, constants, and state

These are more important than adding many new content areas before the core learning loop is stronger.

## Non-Goals

This roadmap is not:

- a claim that MCW must become a full curriculum platform
- a promise to cover every cryptographic topic equally
- a requirement to replace formal coursework or textbooks
- a suggestion that more features alone equal better teaching

## Evaluation Standard

Future slices should be judged against this question:

- does this make MCW better at teaching disciplined investigative practice

If a slice adds capability but weakens clarity, inspectability, or testing discipline, it should not be treated as a top educational priority.

## True Success

MCW can be called a true success for students when a serious learner can use it to practice the habits of a practitioner:

- isolate structure
- inspect mechanisms
- form a hypothesis
- run a test
- compare variants
- explain the result honestly

At that point MCW is no longer just a personal cryptographic workbench.

It becomes a genuine training environment for disciplined cryptographic study.
