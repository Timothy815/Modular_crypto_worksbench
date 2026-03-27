# Primitive Micro Demos V1

Last updated: March 27, 2026

Status: Implemented on `feature/primitive-micro-demos` as the next bounded primitive-legibility ergonomics follow-on.

## Purpose

This contract defines the first primitive-local demo slice for MCW.

The goal is to let a user inspect a primitive and open a tiny, purpose-built example that demonstrates that primitive with only the minimum surrounding structure required to see meaningful input/output behavior.

## Product Problem

MCW now has enough vocabulary that some friction happens before authorship:
- a user sees `Mux`, `Demux`, `Gate`, `Equals`, `AtLeast`, `Majority`, `BitSplit`, or similar modules
- they understand the name only partially
- the full demo/tutorial library is too large a jump for the narrow question they actually have
- they want to see one tool in relative isolation before using it in a larger machine

This is not a missing primitive problem.
It is a primitive legibility and just-in-time teaching problem.

## Core Question

Can MCW let a user open a minimal, tool-specific example from the primitive itself without creating a second general demo library?

## Strategic Principle

**Teach the primitive at the point of need. Do not flatten the system-level teaching library into one-tool examples.**

That means:
- micro demos should live close to the primitive that they explain
- they should be intentionally small
- they should not compete with the main demo/tutorial/challenge library
- they should accelerate understanding, then get out of the way

## First Milestone

The first milestone should answer one question clearly:

**Can a user open a minimal working example for a small set of conceptually opaque primitives directly from the primitive surface?**

## Include

The first slice should likely include:
- a primitive-local `Try Demo` action from the primitive palette
- a bounded starter set of eligible primitives only
- one seeded micro-workspace per eligible primitive
- examples that use only the minimum surrounding modules needed to produce visible behavior
- opening the micro demo as a new local workspace copy that remains fully editable once loaded

## Exclude

Do not include in V1:
- micro demos for every primitive
- a second browsable library panel of micro demos
- auto-generated demo synthesis from param schemas
- separate tutorial/challenge flows for each micro demo
- broad explanatory documentation panels attached to each primitive
- hidden “playground mode” that behaves differently from normal workspaces

## Core Rules

1. **Micro demos are primitive-local**
- V1 should attach entry points to the primitive surface
- they should not appear as regular top-level demos in the main library

2. **The examples must stay minimal**
- each micro demo should contain only the selected primitive plus the smallest set of supporting modules needed to show its behavior
- “minimal” matters more than “comprehensive”

3. **The examples must stay real**
- once opened, a micro demo is just a normal workspace
- no special execution mode or teaching-only runtime should exist

4. **Not every primitive needs a micro demo in V1**
- the first slice should focus on primitives where local behavior is especially hard to infer from name alone
- V1 is locked to:
  - `Mux`
  - `Demux`
  - `Gate`
  - `Equals`
  - `AtLeast`
  - `Majority`

5. **Main teaching surfaces remain system-level**
- regular demos/tutorials/challenges should continue to teach system composition
- micro demos should not replace those surfaces

6. **Each micro demo has one focal behavior**
- each V1 micro demo should teach one focal primitive behavior only
- do not layer in a second concept unless it is strictly required to produce visible input/output

## Recommended Implementation Shape

The strongest V1 shape is likely:
- define a small micro-demo registry keyed by primitive `defId`
- each registry entry points to a seeded project/workspace definition
- expose a single `Try Demo` action from the primitive palette when a micro demo exists
- open the selected micro demo as a new local workspace copy using existing workspace-creation/loading behavior

Reason:
- MCW already has seeded demo infrastructure
- a registry keeps the feature explicit and bounded
- one entry surface avoids duplicated UI and keeps V1 small

## Expected File Scope

Primary files likely in scope:
- `src/ui/module-library.ts`
- `src/ui/components/primitive-palette.tsx`
- a new small micro-demo registry/helper under `src/ui/`

Supporting files may include:
- `src/ui/demo-projects.ts` or a dedicated adjacent seeded-data file
- `src/App.tsx`
- focused tests around registry behavior and UI availability

This slice should not require engine-layer changes.

## UI Shape

The first UI should stay small and obvious.

Good options:
- a `Try Demo` button on eligible primitives in the palette
- a short one-line explanation such as “Loads a tiny editable example for this primitive”

The important thing is:
- the user can reach the example at the moment of need
- the action is only present when a micro demo exists
- the micro demo does not masquerade as a full lesson

## Success Criteria

This slice is successful when:
- a user can open a minimal example for eligible primitives directly from the primitive surface
- the example is small, editable, and visibly centered on that primitive’s behavior
- the main demo/tutorial/challenge libraries remain unchanged as the primary system-level teaching surfaces
- the feature improves primitive legibility without adding a second teaching taxonomy

## Validation Expectations

This slice should add focused tests for:
- registry lookup by primitive `defId`
- showing the action only for eligible primitives
- creating the correct local workspace copy for the selected primitive
- keeping the opened example inside normal editable workspace behavior

## Explicitly Avoid Next

Do not let this become:
- a second tutorial system
- an “example for every primitive” sweep
- auto-generated teaching content
- a documentation browser attached to the palette

Keep the first move about primitive-local legibility at the point of need.
