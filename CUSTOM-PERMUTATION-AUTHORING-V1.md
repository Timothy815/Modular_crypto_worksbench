# Custom Permutation Authoring V1

Last updated: March 24, 2026

Status: Shipped in `v1.12.0`.

## Purpose

This contract defines the first bounded authoring slice for custom `Permutation` work.

The goal is not to turn MCW into a full wiring-optimization environment.
The goal is to let a teacher or student directly rewire a permutation inside the workbench and immediately see how that changes routing behavior in the existing machine and transformation view.

This slice should teach:
- a permutation is an explicit routing map
- changing the order changes where output positions pull their bits from
- rewiring should feel tactile, like a patch panel or plugboard, not like typing an abstract number list

This should remain an educational authoring surface, not a generalized graph-editing replacement.

## Product Boundary

This slice should reuse existing MCW surfaces:

1. **Configure**
- the `Permutation` wiring/order param must become realistically editable in the inspector
- drag-based editing should be the primary workflow
- raw CSV should remain available as a secondary exact-input path

2. **Analyze**
- the existing permutation routing view should continue to explain the authored permutation
- the authoring editor should reinforce, not replace, that routing view

3. **Build / Guide**
- authored permutations should behave like ordinary module params inside projects and composites
- the feature should support experimentation in the existing byte-round, hex-round, and hash-related demos that already use permutations

This slice should not become:
- a generic node-graph rewiring system
- a free-form cable simulator
- a cryptanalytic scoring tool for diffusion quality
- a giant library of famous branded permutations

## First Milestone

The first milestone should answer one question clearly:

**Can a student directly rewire a valid permutation and immediately see how that changes bit routing?**

The student should be able to:
- edit the permutation through a tactile drag/swap interface
- keep the routing structurally valid
- see which positions were changed
- re-run the machine and inspect the changed routing in `Analyze`

## Include

The first milestone should likely include:
- a bounded tactile editor for the `Permutation` order/wiring param
- drag-to-swap or drag-to-reassign behavior that preserves validity by construction
- support for the existing teaching sizes already used in demos
- raw CSV / order-list editing that stays synchronized with the tactile editor
- immediate validation if a pasted raw order becomes invalid

Prefer bounded swap/reorder mechanics over free-form rewiring.

## Exclude

This milestone should explicitly avoid:
- arbitrary graph cable dragging between canvas modules
- diffusion scoring dashboards
- auto-generated “good permutations”
- cryptanalytic claims about security strength
- turning the permutation editor into a second routing-visualization subsystem

## Visual / Teaching Principles

Prefer:
- a compact patch-panel / plugboard feel
- draggable assignments that visibly preserve one-to-one routing
- an obvious connection between the editor and the existing routing transformation view
- raw CSV as a secondary precision tool, not the primary surface

Avoid:
- making the user type index lists as the main interaction
- allowing invalid duplicates to accumulate invisibly
- hiding where a moved output position now pulls from

## Success Criteria

This slice is successful when a student can:
- open a `Permutation` in `Configure`
- rewire it through a tactile editor
- understand whether the edited permutation is valid
- re-run the machine and see the new routing behavior in `Analyze`
- leave with a better intuition for how authored permutations control diffusion and routing
