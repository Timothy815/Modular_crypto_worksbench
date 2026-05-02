# INSPECTOR-ANALYSIS-AND-OUTPUT-EXTRACTION-V1

Last updated: April 11, 2026

Status: Shipped on `main`

## Purpose

Define the next bounded inspector-maintenance slice after
`docs/archive/contracts/2026-04/INSPECTOR-STRUCTURED-EDITOR-EXTRACTION-V1.md`.

The goal is to remove the analysis, output-summary, and compare/verification rendering family from
`src/ui/components/parameter-inspector.tsx` without changing shipped inspector behavior.

This is not an inspector redesign.
This is not a new analysis feature pass.
This is an extraction slice.

## Product Problem

`parameter-inspector.tsx` is still a drag coefficient even after the structured-editor extraction.

It still directly renders:
- output summary / sink representation switching
- tick summary
- stepper and selected-step detail
- pinned probes
- tutorial analysis note
- transformation views
- selected/global issue sections
- execution trace list
- compare / verification surface handoff

Those surfaces already behave like a coherent inspector family:
- they are all non-configuration reading/explaining surfaces
- they are all driven by execution, analysis, or comparison state
- they are the part of the inspector most likely to keep growing as MCW deepens its “systems IDE”
  reading tools

The next maintenance win is to move that family into dedicated subcomponents while preserving the
current interaction model exactly.

## Core Question

What is the smallest extraction that meaningfully reduces the size and responsibility of
`parameter-inspector.tsx` by moving the read/understand/compare rendering family into dedicated
components without changing shipped behavior?

## Strategic Principle

**Move the analysis family out, keep inspector orchestration in place.**

That means:
- the inspector still owns tab choice, selected module context, and existing state
- extracted components render the output/analyze/compare surfaces from current props
- no new state-management model is introduced

## Relationship To Existing Work

This slice builds on:
- `INSPECTOR-REFACTOR-V1`
- `docs/archive/contracts/2026-04/INSPECTOR-STRUCTURED-EDITOR-EXTRACTION-V1.md`
- `PIPELINE-ROLE-LANGUAGE-V1`
- `SEQUENCE-VS-TICK-CUEING-V1`
- `REQUIRE-LENGTH-MATCH-WORKFLOW-POLISH-V1`
- the already-shipped `ComparisonPanel`

Those slices established the behavior and language.
This slice only changes file responsibility and future modification cost.

## Include

V1 should include:

1. One extracted inspector family for:
- output summary
- analyze tab rendering
- compare tab handoff

2. Dedicated subcomponents for coherent rendering blocks, likely under
`src/ui/components/inspector-analysis/` or a similarly local folder

3. ParameterInspector integration that makes the main file orchestration-first rather than
analysis-rendering-first

4. Any tiny UI-local helper extraction needed to avoid duplicating analysis-section view logic

## Exclude

Do not include in V1:
- engine changes
- new analysis semantics
- compare/verification redesign
- new output formats
- tutorial copy changes
- new probe / trace / stepping behavior
- another structured-editor pass
- CSS redesign beyond tiny extraction-local adjustments

## Required Boundary

This slice must:
- preserve current output summary behavior
- preserve current analyze-tab behavior
- preserve current compare/verification behavior
- preserve current stepping, probe, and trace interactions
- reduce the amount of output/analyze/compare implementation living directly in
  `parameter-inspector.tsx`

This slice must not:
- change what the inspector can do
- move orchestration into a second state layer
- widen into a general inspector rewrite

## Recommended Implementation Shape

The preferred shape is:

1. Keep these in `parameter-inspector.tsx`:
- tab selection state
- current execution-derived memoized values
- selected module / baseline / verification orchestration
- callbacks already owned by the inspector

2. Move rendering into dedicated leaf components such as:
- `InspectorOutputSummary`
- `InspectorAnalyzeView`
- `InspectorCompareView`

3. Pass current derived values explicitly rather than re-deriving them from scratch inside the new
components when that would duplicate logic

4. Keep any shared view helpers UI-local and adjacent to the new family

## Likely Files

Likely files in scope:
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/components/inspector-analysis-output.tsx`
- one optional adjacent helper file if the extracted family needs a small shared type/helper module
- targeted tests if existing coverage needs to move

## Success Criteria

This slice is successful when:
- `parameter-inspector.tsx` loses a meaningful block of analysis/output/compare rendering
- the analysis/output family becomes easier to reason about in isolation
- inspector behavior remains stable
- future analyze/compare changes no longer require editing a monolithic inspector file first

## Explicitly Avoid Next

Do not let this become:
- a redesign of compare/verification
- a trace/stepper behavior rewrite
- a generic “split everything” componentization pass

This is one bounded extraction slice.
