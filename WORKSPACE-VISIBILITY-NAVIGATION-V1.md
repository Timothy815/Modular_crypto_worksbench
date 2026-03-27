# Workspace Visibility Navigation V1

Last updated: March 27, 2026

Status: Implemented on the `feature/workspace-visibility-navigation` line.

## Purpose

This contract defines the first post-versioning workspace-visibility slice for MCW.

The goal is to make larger workspaces easier to see, navigate, and re-orient inside without changing MCW into a generic node-editor product.

## Product Problem

MCW can now support:
- larger authored workspaces
- repeated structure
- cluster operations
- undo/redo
- named restore points

That makes workspace scale more important.

The current remaining friction is not graph expressiveness. It is view management:
- larger workspaces can exceed the comfortable visible field
- it can be slow to move between distant authored regions
- execution-order reading and workspace position can drift apart
- users can know *what* they want to inspect without being able to bring it into view quickly

Those are visibility/navigation problems, not versioning or authoring-structure problems.

## Core Question

Can MCW improve workspace visibility and orientation for larger graphs through bounded zoom and focus-navigation behavior without changing the explicit-machine model?

## Strategic Principle

**Improve view control, not machine abstraction.**

That means:
- users should see more of the same explicit structure
- navigation aids should bring existing modules into focus
- execution-path focus should reveal visible graph regions, not replace them with a hidden trace UI

This is not:
- a canvas rewrite
- a minimap-and-toolbar feature spree
- automatic graph folding
- React Flow migration

## First Milestone

The first milestone should answer one clear question:

**Can a user reliably zoom, pan larger workspaces, and jump visible focus to relevant modules or execution paths?**

## Include

The first slice should likely include:
- bounded zoom in / zoom out controls for the workspace canvas
- a reliable reset or fit-style view action
- larger navigable workspace handling that preserves the existing explicit graph surface
- execution-order or trace-driven focus jump behavior that brings a chosen module or path region into the visible field
- predictable focus behavior for `node -> node -> node` path inspection

## Exclude

Do not include in V1:
- full minimap tooling unless it becomes absolutely necessary during implementation
- node clustering or folding
- hidden subgraph navigation
- lasso path authoring
- arbitrary camera animation tooling
- edge-routing redesign
- generic whiteboard features

## Core Rules

1. **Navigation must preserve explicit structure**
- a focus jump should move the viewport to visible modules, not open a separate abstracted representation

2. **Zoom must stay bounded and predictable**
- V1 should use a fixed zoom range with explicit controls
- reset behavior must be obvious

3. **Focus actions must be tied to user intent**
- clicking a module or execution-trace item should bring that relevant region into view
- V1 should not guess what to center unless the user explicitly requests focus

4. **The slice must stay workspace-local**
- no global navigation system
- no cross-workspace camera state

5. **V1 should prefer a few reliable controls over a navigation suite**
- one bounded zoom model
- one reset/focus baseline
- one execution-path focus behavior

## Recommended Implementation Shape

The strongest V1 shape is likely:
- a workspace viewport scale state
- explicit zoom controls in the workbench
- viewport reset / fit-to-workspace behavior
- `scrollIntoView` / centering-style focus helpers for selected modules and trace-owned modules

Reason:
- MCW already has concrete module positions and existing landmark/focus concepts
- the next gain is camera control, not graph restructuring
- a narrow camera layer is lower risk than a broad canvas rewrite

## Expected File Scope

Primary files likely in scope:
- `src/ui/components/workbench-panel.tsx`
- `src/App.tsx`
- `src/App.css`

Supporting files may include:
- execution-trace related UI surfaces if focus actions need to originate there
- small helper files for viewport math if needed

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- `Zoom In`
- `Zoom Out`
- `Reset View`
- a focus-jump affordance tied to selected execution steps or module-path surfaces

The important thing is:
- the user can deliberately control the visible field
- the focus target is obvious
- the system still reads like navigating a machine, not stepping away from it

## Success Criteria

This slice is successful when:
- a user can zoom the workspace in and out predictably
- a user can recover a sane overall view quickly
- a user can bring a chosen module or trace-relevant path region into the visible field
- large-workspace navigation feels easier without reducing structure visibility

## Validation Expectations

This slice should add focused tests for:
- bounded zoom behavior
- reset-view behavior
- focus-target math / viewport positioning
- preserving normal selection and drag behavior under zoom

## Explicitly Avoid Next

Do not let this become:
- a generic diagram-tool camera suite
- subgraph hiding by stealth
- execution-trace replacement for the workspace itself
- a broad UX rewrite

Keep the first move about visible field control and intentional focus recovery.
