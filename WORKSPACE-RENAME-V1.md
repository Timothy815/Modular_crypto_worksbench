# Workspace Rename V1

## Status

Proposed housekeeping follow-on before the next major vocabulary expansion.

## Purpose

Let users rename module instance IDs inside a single workspace without breaking the graph.

This slice exists to solve a practical authoring problem:
- unzipping composites often leaves module IDs that still carry old composite-chain prefixes
- those IDs are technically valid
- but they become noisy, confusing, and harder to work with

The goal is not to rename module definitions globally.
The goal is to let a builder clean up one workspace safely.

## Strategic Principle

**Rename the local instance, not the underlying primitive or composite definition.**

That means:
- renaming is workspace-local
- the module’s behavior does not change
- only references to that specific instance should be updated
- the graph must remain valid after the rename

## Why Now

MCW now supports:
- composite unzip workflows
- increasingly large teaching and experiment workspaces
- more explicit sink and authoring semantics

That makes naming pressure more visible.
Once a composite is unzipped, users need a clean way to turn inherited IDs into readable local names.

## V1 Scope

V1 should stay bounded to **module instance ID renaming within one workspace**.

Primary user story:
- unzip a composite
- rename resulting modules to clean local IDs
- continue building without stale composite-chain names everywhere

## Included

- rename one module instance ID inside the active workspace
- validation for:
  - uniqueness
  - non-empty ID
  - conservative identifier format:
    - letters
    - numbers
    - hyphens
    - underscores
- update all local references that depend on module instance ID, including:
  - connections
  - layout
  - current selection
  - param drafts
  - probes
  - annotations
  - persisted per-workspace UI references tied to module instance ID
- minimal UI affordance in the inspector or workspace controls to trigger the rename

## Explicitly Excluded

Do not include in V1:
- global primitive renaming
- composite definition renaming
- automatic mass-rename of a whole graph
- cross-workspace renaming workflows
- naming templates or bulk rename systems
- semantic labels separate from IDs

## Core Rules

1. **Rename must be referentially safe**
   - every local reference to the old instance ID must move to the new one
   - no dangling connections or stale layout keys

2. **Rename must stay local**
   - only the active workspace changes
   - no reusable definition or shipped library entry is renamed

3. **Validation must be explicit**
   - duplicate IDs are rejected
   - invalid IDs are rejected before mutation

4. **No hidden graph restructuring**
   - the rename must not alter topology
   - it only changes identity references

## Success Criteria

V1 is successful if:
- a user can rename an unzipped module instance cleanly
- the graph still executes afterward
- all local workspace references remain intact
- the feature reduces composite-unzip cleanup friction without widening scope

## Likely Follow-Ons

Possible later slices, only if still justified:
- workspace duplication
- cross-workspace cluster copy/paste
- semantic display labels distinct from instance IDs
- bounded bulk rename helpers

## Explicitly Avoid Next

Do not turn this into:
- a global naming system overhaul
- composite definition editing by stealth
- bulk rename machinery in the first pass

Keep the first move small, safe, and local.
