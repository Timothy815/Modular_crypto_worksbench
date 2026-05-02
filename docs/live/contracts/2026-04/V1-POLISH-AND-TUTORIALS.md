# V1 Polish And Tutorials Contract

This branch exists to turn MCW from a strong prototype into a confident `v1.0` educational product.

## Goals

- add guided walkthroughs that explain existing reference machines step by step
- improve product consistency across shell, panels, dialogs, and action language
- make analysis surfaces easier to teach from in a classroom setting
- finish the product in a way that feels intentional, not merely feature-complete

## Non-Goals

- no new engine execution model
- no major primitive expansion on this branch
- no scoring system, gradebook, or user accounts
- no automated cryptanalysis tooling

## Tutorial Principles

- tutorials are UI-layer teaching artifacts, not engine concepts
- tutorials should target existing projects and modules explicitly
- each tutorial step should be short, focused, and explain one idea
- tutorials should guide attention without hiding the underlying machine
- annotations remain available as freeform notes; tutorials are structured guidance

## First Tutorial Slice

The first slice on this branch should prove:

1. seeded tutorial definitions
2. reducer-backed tutorial session state
3. persistence of active tutorial + step position
4. a visible tutorial panel in the app shell
5. the ability to focus the current tutorial step's target module

This first slice should stay intentionally narrow:

- no tutorial authoring tools yet
- no import/export yet
- no branching tutorial logic yet
- no grading tied to tutorials

## Expected Follow-Up Work

- richer tutorial visuals using existing annotation surfaces
- tutorial-aware success states for reference machines
- button/dialog consistency across the app
- probe-style persistent signal visibility in analysis mode
- final v1 polish pass

## v1.0 Bar

MCW can honestly claim `v1.0` when:

- Build / Analyze / Break / Challenge all feel coherent
- modern primitives are in place and teachable
- at least one guided walkthrough clearly teaches a reference machine
- shell, palette, inspector, and dialogs feel consistent and classroom-ready
- the product can be used for a real lesson without the teacher compensating for obvious UX gaps
