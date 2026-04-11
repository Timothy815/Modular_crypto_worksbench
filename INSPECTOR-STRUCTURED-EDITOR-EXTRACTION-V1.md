# INSPECTOR-STRUCTURED-EDITOR-EXTRACTION-V1

Last updated: April 11, 2026

Status: Ready for implementation

## Purpose

Define the next bounded inspector-maintenance slice after `INSPECTOR-REFACTOR-V1`.

The goal is to remove one coherent family of high-complexity editor surfaces from
`src/ui/components/parameter-inspector.tsx` without changing shipped inspector behavior.

This is not an inspector redesign.
This is not a rewrite of structured primitive authoring.
This is an extraction slice.

## Product Problem

`parameter-inspector.tsx` is still a major drag coefficient.

It now carries:
- core parameter form rendering
- analysis and comparison surfaces
- live-state summaries
- module-role / typical-path language
- structured primitive authoring surfaces for:
  - permutation
  - rotor
  - reflector
  - plugboard
  - S-box

`INSPECTOR-REFACTOR-V1` removed pure analysis helpers, which was the right first move.

But the file is still over 5,000 lines, and one of the clearest remaining seams is the
structured-editor family. Those editors already behave like a subproduct inside the inspector.

The next maintenance win is to move that family into dedicated leaf components while preserving the
current workflow exactly.

## Core Question

What is the smallest extraction that meaningfully reduces the size and responsibility of
`parameter-inspector.tsx` by moving structured primitive editors into dedicated components without
changing their authored behavior?

## Strategic Principle

**Extract one coherent editor family, preserve one inspector workflow.**

That means:
- move family-sized JSX/state plumbing out of the main inspector file
- keep the current inspector tabs, controls, and behavior
- avoid opportunistic redesign while doing maintenance work

## Relationship To Existing Work

This slice builds on:
- `INSPECTOR-REFACTOR-V1`
- `STRUCTURED-EDITOR-UNIFICATION-V1`
- `CUSTOM-PERMUTATION-AUTHORING-V1`
- `ROTOR-INSPECTOR-POLISH-V1`
- `CUSTOM-REFLECTOR-AUTHORING-V1`
- `CUSTOM-SBOX-AUTHORING-V1`
- `SBOX-TABLE-TRANSFORMS-V1`
- `SBOX-GENERATION-WORKFLOW-V1`

Those slices established the behavior and visual language.
This slice is only about file responsibility and future change risk.

## Include

V1 should include:

1. One extracted structured-editor component family under `src/ui/components/structured-editors/`

2. Dedicated leaf components for the current structured authoring surfaces:
- permutation editor
- rotor wiring editor
- reflector editor
- plugboard editor
- S-box editor

3. Any tiny shared UI-local helper module needed to avoid duplicating editor-family view logic

4. ParameterInspector integration that turns the main file back into orchestration rather than
inline structured-editor implementation

## Exclude

Do not include in V1:
- changes to engine semantics
- changes to saved document shape
- changes to inspector tab structure
- visual redesign of structured editors
- new S-box / rotor / reflector / plugboard capabilities
- opportunistic CSS overhaul
- another extraction pass outside the structured-editor family

## Required Boundary

This slice must:
- preserve current authored behavior
- preserve current inspector interactions
- preserve current tests or replace them with equivalent coverage
- reduce the amount of structured-editor implementation living directly in
  `parameter-inspector.tsx`

This slice must not:
- change what a valid permutation / rotor / reflector / plugboard / S-box edit means
- change runtime behavior
- widen scope into general inspector cleanup

## Recommended Implementation Shape

The preferred shape is:

1. Keep selection/orchestration decisions in `parameter-inspector.tsx`

2. Move family-specific rendering into dedicated components, likely with props such as:
- `moduleDef`
- `moduleInstance`
- field metadata / value / baseline value
- read-only mode
- current UI-local selection state
- event handlers already owned by the inspector

3. Keep any family-specific pure view helpers UI-local, not in the engine

4. Only extract enough local state to make the components coherent.
Avoid a second state-management system.

## Likely Files

Likely files in scope:
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/components/structured-editors/permutation-editor.tsx`
- `src/ui/components/structured-editors/rotor-editor.tsx`
- `src/ui/components/structured-editors/reflector-editor.tsx`
- `src/ui/components/structured-editors/plugboard-editor.tsx`
- `src/ui/components/structured-editors/sbox-editor.tsx`
- one optional shared helper file in the same folder
- targeted inspector/editor tests

## Success Criteria

This slice is successful when:
- `parameter-inspector.tsx` loses a meaningful block of structured-editor implementation
- the structured editor family becomes easier to reason about and modify in isolation
- inspector behavior stays stable
- future structured-editor work no longer requires digging through the entire inspector surface

## Explicitly Avoid Next

Do not let this become:
- an inspector redesign disguised as maintenance
- a state-management rewrite
- a broad “split every section into a component” pass

This is one bounded extraction slice.
