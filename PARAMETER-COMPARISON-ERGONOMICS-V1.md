# Parameter Comparison Ergonomics V1

Last updated: March 27, 2026

Status: Implemented on `feature/parameter-comparison-ergonomics` as the next bounded follow-on after `PARAMETER-AUTHORING-ERGONOMICS-V1`.

## Purpose

This contract defines the first parameter-comparison ergonomics slice for MCW.

The goal is to help users see where repeated or sibling modules differ without introducing hidden normalization, dashboard sprawl, or spreadsheet-style comparison tooling.

## Product Problem

MCW now supports:
- repeated-structure duplication
- selected-cluster operations
- workspace history and named restore points
- visibility / navigation improvements
- direct rewiring
- bulk parameter copy / apply across same-definition siblings

That means the next authoring bottleneck is less about making changes and more about understanding where similar modules now differ.

Current friction shows up in tasks like:
- checking whether copied params were actually applied across repeated stages
- finding the one field that differs between two sibling modules
- understanding whether selected same-definition modules are still aligned or have drifted
- scanning repeated structures round-by-round without manually clicking into each module and remembering previous values

These are comparison/legibility problems, not editing-mechanics problems.

## Core Question

Can MCW help the user see parameter divergence across selected same-definition modules without creating a second inspector or hidden synchronization layer?

## Strategic Principle

**Make divergence visible. Do not collapse modules into one logical object.**

That means:
- comparison should expose where sibling modules match and where they differ
- each module remains individually explicit and editable
- the system should not auto-normalize or auto-apply values as part of comparison

This is not:
- live parameter synchronization
- spreadsheet comparison grids
- workspace-wide param dashboards
- automatic “fix all differences” behavior

## First Milestone

The first milestone should answer one clear question:

**Can a user inspect one module and immediately see which selected same-definition sibling modules share or diverge on each parameter?**

## Include

The first slice should likely include:
- selected-sibling comparison scoped to the currently inspected module definition only
- a compact comparison summary in the existing inspector
- per-parameter indication of:
  - same across selected same-definition siblings
  - different across selected same-definition siblings
- a lightweight count or summary of how many sibling modules are aligned vs divergent
- compatibility limited to explicitly selected modules with the same definition ID

## Exclude

Do not include in V1:
- bulk editing from the comparison surface
- auto-apply or “normalize all” actions
- mixed-definition comparison heuristics
- table/spreadsheet comparison views
- workspace-wide comparison dashboards
- persisted comparison reports

## Core Rules

1. **Comparison stays inspector-local**
- V1 extends the current parameter inspector
- it does not introduce a separate comparison workspace for params

2. **V1 is same-definition only**
- only compare the current module against explicitly selected sibling modules with the same definition ID
- everything else is out of scope

3. **Comparison is read-first**
- this slice should help the user see divergence
- it should not add new mutation behavior beyond what already exists

4. **The current module remains primary**
- the selected/inspected module is the anchor
- sibling comparison should be framed relative to that module, not as an anonymous group summary

5. **Divergence must be obvious**
- the UI should make it easy to tell whether a field is aligned or divergent without reading a dense report

## Recommended Implementation Shape

The strongest V1 shape is likely:
- derive sibling comparison state in the inspector from:
  - current module
  - current selection
  - current project modules
- show a compact comparison card above or near the parameter list
- annotate parameter fields with a small alignment/divergence chip where useful

Reason:
- the inspector already owns parameter meaning
- the selected module is already the natural anchor
- the highest-leverage improvement is reducing memory burden while scanning repeated structures

## Expected File Scope

Primary files likely in scope:
- `src/ui/components/parameter-inspector.tsx`
- small derived helper utilities if needed

Supporting files may include:
- `src/App.css`
- focused tests around sibling comparison derivation or inspector rendering

This slice should not require engine-layer changes.

## UI Shape

The first UI should be compact.

Good options:
- a `Selected Sibling Comparison` card that says how many same-definition siblings are in scope
- simple chips like `Aligned` / `Divergent` on parameter rows
- a short summary such as “3 siblings selected · 2 aligned fields · 1 divergent field”

The important thing is:
- the user can tell quickly where drift exists
- the current module stays legible as the main editing target
- the UI does not become a secondary parameter editor

## Success Criteria

This slice is successful when:
- a user can inspect one module and immediately see whether selected same-definition siblings diverge on each parameter
- the scope is clearly limited to explicitly selected same-definition modules
- the UI reduces repeated click-and-memory comparison work
- no hidden edits or synchronization are introduced

## Validation Expectations

This slice should add focused tests for:
- deriving same-definition sibling comparison scope from selection
- correctly marking aligned vs divergent fields
- skipping incompatible selected modules cleanly
- keeping the selected module as the comparison anchor

## Explicitly Avoid Next

Do not let this become:
- a bulk-edit follow-on disguised as comparison
- workspace-wide parameter analytics
- mixed-definition heuristics
- “normalize all” tooling

Keep the first move about making divergence visible inside the existing inspector model.
