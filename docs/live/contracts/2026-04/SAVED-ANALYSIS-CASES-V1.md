# Saved Analysis Cases V1

Last updated: April 24, 2026

## Purpose

This contract defines the next bounded cryptanalysis workflow slice after Batch Avalanche Sweep V1.

The goal is simple:

- let a user save a named cryptanalysis setup
- return to it later without rebuilding the same analysis state by hand

This is a repeatability and trust feature, not a new analysis method.

## Product Position

Saved Analysis Cases belong inside the existing `Cryptanalysis` workspace.

They should sit above or alongside the current analysis controls as lightweight reusable presets for a single project.

They are not:

- a full notebook system
- a report generator
- a cross-project artifact library
- a new persistence model for projects themselves

The right product framing is:

- "remember this analysis setup"

not:

- "build a full experiment-management system"

## Problem Statement

MCW can already run meaningful cryptanalysis views, but repeated use still has too much setup friction.

Users currently have to recreate by hand:

- baseline input
- selected source
- selected sink
- flip position
- selected cryptanalysis mode

That is manageable once.
It becomes annoying and error-prone when:

- comparing revisions of the same cipher
- teaching the same exercise repeatedly
- returning to a known avalanche or randomness case
- validating that an earlier result still holds after a design change

## V1 Scope

V1 should only save analysis setup state for a single project.

It should support the currently shipped cryptanalysis workspace modes:

- `modern`
- `randomness`
- `classical`

But the contract should stay conservative about what each mode actually stores.

## Required Shape

Each saved analysis case must include:

- a user-visible name
- the target project id
- the cryptanalysis mode
- the mode-specific analysis state needed to restore the setup

V1 should support, at minimum:

### Modern mode

- selected source id
- selected sink id
- baseline input value
- selected flip bit

### Randomness mode

- selected sink id

### Classical mode

- ciphertext input
- selected candidate period
- selected column index
- currently chosen column shifts

V1 must not attempt to save transient computed outputs as canonical truth.

It should save:

- setup inputs

not:

- derived analysis results

Restored cases should re-run against the current machine state.

## Required UX

V1 must provide:

1. a `Save Case` action in the cryptanalysis workspace
2. a compact list of saved cases for the active project
3. a way to load a saved case
4. a way to rename a saved case
5. a way to delete a saved case

The interaction should stay lightweight.

The user should not need to open a large modal just to save one setup.

The `Save Case` trigger should be a single mode-aware action near the top of the active cryptanalysis mode content, not a separate global shell action.

## Save Behavior

Saving a case should be explicit.

The user should be able to:

- create a new saved case from the current cryptanalysis state
- overwrite an existing case intentionally

V1 must avoid silent overwrites.

The V1 overwrite model should be:

- `Save Case` creates a new case by default
- existing case rows expose an explicit overwrite/update action for replacing that case with the current setup

V1 does not need name-conflict-driven overwrite prompts as the primary model.

## Load Behavior

Loading a saved case should:

- restore the saved analysis controls for that project
- switch the cryptanalysis workspace to the saved mode if needed
- mark any computed analysis as current only after the live workspace recomputes it

Loading a case must not:

- mutate the machine graph
- mutate project execution state outside the normal analysis-control path
- switch to a different project silently

If a saved case belongs to a different project than the active one, V1 should not load it in place.

V1 should stay project-local and only surface cases for the active project.

If a saved case references a source or sink id that no longer exists, V1 should soft-fail:

- load the rest of the saved setup
- fall back to the first compatible currently available source or sink
- clearly avoid claiming that the original source/sink binding was preserved exactly

The UI must not crash or refuse the entire load just because one saved module reference is stale.

## Staleness Rule

Saved cases are setup bookmarks, not frozen evidence.

That means:

- restoring a case after the machine changes is allowed
- the restored case should run against the current machine
- the product should not imply the result is identical to the earlier run

V1 does not need historical result snapshots.

The V1 staleness indication rule should be:

- loading a saved case silently restores the saved setup controls
- live analysis then recomputes against the current machine
- the product should describe the feature as restoring a setup, not a prior result

V1 does not need a persistent "machine changed since save" banner if the copy and interaction already make the rerun model explicit.

## Persistence

Saved analysis cases should persist with the workspace document alongside other UI-level project state.

They should survive:

- reload
- normal save/load
- workspace export/import

They should not require a second external file.

V1 should keep the saved-case list project-local and filtered to the active project only.

V1 does not need merge-aware import conflict handling beyond normal workspace-document replacement/restore semantics.

## Non-Goals

V1 does not include:

- case sharing across unrelated projects
- case folders or tags
- result snapshots
- notes per case
- multi-project dashboards
- diff views between saved cases
- export-to-report flows

Those may be useful later, but they are not necessary for the first repeatability slice.

## Visual Shape

The simplest acceptable V1 shape is:

- a `Save Case` button near the relevant analysis controls
- a short saved-case list in the cryptanalysis panel
- each case row showing:
  - name
  - mode
  - load
  - rename
  - delete

The list should be compact and project-local.

The list may be unbounded in V1 as long as it is scrollable and remains visually contained within the panel.

## Copy Principles

The copy should reinforce that a case stores setup, not proof.

Prefer:

- saved case
- saved setup
- restore this case
- rerun with current machine

Avoid:

- snapshot
- certified result
- frozen analysis

## Implementation Sequence

1. Lock the contract.
2. Extend persisted UI project state with saved analysis cases.
3. Add save/load/rename/delete reducer actions.
4. Add compact saved-case UI inside the cryptanalysis panel.
5. Restore mode-specific controls from a loaded case.
6. Verify save/load survives document round-trip.

## Success Criteria

This slice is successful when a user can:

- save a useful cryptanalysis setup in one step
- return to it later without rebuilding the controls manually
- compare later machine revisions against the same saved setup
- trust that loading a case restores inputs, not stale results

It is especially successful if a user can move between:

- "interesting case I want to remember"

and:

- "re-run that exact setup on the current machine"

without leaving MCW.
