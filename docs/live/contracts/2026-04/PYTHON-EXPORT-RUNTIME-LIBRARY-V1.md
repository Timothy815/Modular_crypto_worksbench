# PYTHON-EXPORT-RUNTIME-LIBRARY-V1

Last updated: March 28, 2026

Status: Future planning note

---

## Purpose

Record the future architectural line that would split Python export into:
- one reusable MCW Python runtime library
- one generated workspace implementation file that imports that runtime

This is not the current active export slice.

It exists so the idea is explicit, strategically legible, and available for later deliberate execution rather than being introduced ad hoc into the current exporter.

---

## Why This Exists

The current Python export architecture is intentionally self-contained:
- one generated `.py` file
- embedded runtime helpers
- generated workspace logic in the same file

That was the correct foundations move because it:
- maximized portability
- minimized packaging complexity
- kept early parity work bounded

But as export coverage grows across:
- stateless primitives
- temporal primitives
- rotor-family behavior
- composites
- iterators

the embedded-runtime model becomes less elegant as the long-term architecture.

The future architectural direction should be:
- stable reusable runtime surface
- separate generated workspace implementation

---

## Product Goal

Allow exported Python to feel like a real implementation surface rather than a single generated script blob.

In the long run, users should be able to read:
- the reusable MCW runtime as one library artifact
- the generated workspace as the authored machine implementation

without those two concerns being visually collapsed together.

---

## Architectural Intent

The future split should mirror MCW’s actual product structure:
- runtime vocabulary and execution helpers as one layer
- user-authored workspace logic as another layer

That means the generated workspace file should increasingly express:
- the machine the user built
- not the entire exported support runtime inline

This is desirable because it would:
- reduce visual crowding in exported workspace code
- make generated workspace files easier to study and teach from
- let multiple exported workspaces share one runtime
- make the Python export line feel more like a real product surface

---

## Recommended First Slice

When this line becomes active, the first bounded move should be:
- two-file export, not package distribution

Recommended artifact shape:
1. `mcw_runtime.py`
2. `<workspace>.py`

Where:
- `mcw_runtime.py` contains the reusable helper/runtime layer
- `<workspace>.py` contains only the generated machine/workspace implementation plus imports

This first slice should not yet require:
- `pip` installation
- packaging metadata
- versioned published Python packages
- dependency resolution outside exported files

---

## Constraints

When activated, this line should preserve:
- parity-first behavior
- readable generated code
- explicit machine structure
- zero hidden interpreter behavior

It should also preserve:
- a stable runtime API boundary for generated workspaces
- a clear version relationship between the generated workspace and the runtime it expects

The first slice should strongly consider:
- whether single-file export remains available as a compatibility mode
- how generated imports stay stable across future runtime growth

---

## Non-Goals

This planning note does not authorize:
- changing the current exporter immediately
- replacing the existing one-file export by default
- introducing Python packaging/distribution infrastructure now
- mixing runtime-library work into unrelated export slices

---

## Strategic Placement

This line should happen only when:
- the current one-file exporter has reached a stable completeness milestone
- the project is ready to treat Python export as a more fully productized surface

It should be considered a future strategic refinement of the export architecture, not a blocker on the current export-completeness line.

---

## Success Condition

This note is successful when:
- the runtime/library split is explicitly part of MCW’s future planning
- the current self-contained exporter remains understood as the right foundations architecture
- a later transition to runtime/library export can be undertaken deliberately rather than impulsively
