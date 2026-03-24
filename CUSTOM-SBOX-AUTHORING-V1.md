# Custom S-Box Authoring V1

Last updated: March 24, 2026

Status: Proposed next bounded slice after `v1.11.0`.

## Purpose

This contract defines the first bounded authoring slice for custom `SBox` work.

The goal is not to turn MCW into a full cryptographic design lab.
The goal is to let a teacher or student intentionally edit an `SBox` table inside the workbench and immediately see the consequences in the existing machine, transformation view, and challenge/analysis surfaces.

This slice should teach:
- an `SBox` is a lookup table, not a magical black box
- table entries can be authored directly
- changing the table changes substitution behavior everywhere that `SBox` is used
- a custom table still has to obey the structural rules of a valid permutation

This should remain an educational authoring surface, not an expert cryptanalysis suite.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Configure**
- the `SBox` table must become realistically editable in the inspector
- editing should be easier than hand-typing a long comma-separated list

2. **Analyze**
- the existing `SBox` transformation view should continue to explain the authored table
- no parallel visualization family should be created just for authoring

3. **Build / Guide**
- authored `SBox` tables should behave like ordinary module params inside projects and composites
- the feature should support direct experimentation in existing byte-round and hash demos

This slice should not become:
- a full DES/AES-style S-Box property analyzer
- a differential/linear cryptanalysis workbench
- a giant table-generation framework
- a library of famous branded S-Boxes

## First Milestone

The first milestone should answer one question clearly:

**Can a student directly author a valid `SBox` table and immediately see how that changes substitution behavior?**

The student should be able to:
- edit a small `SBox` table without manually rewriting a comma-separated string
- keep the table structurally valid
- see which entry changed
- run the machine again and inspect the changed lookup in `Analyze`

## Include

The first milestone should likely include:
- a bounded custom editor for `SBox.table`
- support for at least the existing teaching widths:
  - 4-bit / 16-entry tables
  - 8-bit / 256-entry tables
- strong validation feedback when the table stops being a valid permutation
- one or two safe editing affordances, such as:
  - per-cell editing
  - swap two entries
  - reset to identity or reverse-order teaching defaults

Prefer bounded authoring helpers over free-form tooling.

## Exclude

This milestone should explicitly avoid:
- auto-generating “good” cryptographic S-Boxes
- collision/differential scorecards
- nonlinear algebra teaching overlays
- importing/exporting external S-Box datasets as the primary workflow
- trying to explain AES or DES design history in the editor itself

## Visual / Teaching Principles

Prefer:
- a grid editor that visually resembles the existing lookup view
- immediate validation and obvious invalid-state feedback
- visible row/column indexing for 8-bit tables
- a small number of safe editing actions

Avoid:
- giant text areas as the primary authoring surface
- hiding invalid states until execution time
- pretending the table has security meaning beyond substitution

## Success Criteria

This slice is successful when a student can:
- open an `SBox` in `Configure`
- change one or more entries through a bounded editor
- understand whether the edited table is valid
- re-run the machine and see the new lookup behavior in `Analyze`
- leave with a better intuition for how authored substitution tables affect the machine
