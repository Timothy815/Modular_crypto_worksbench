# Workspace Duplicate V1

## Status

Proposed housekeeping follow-on after `WORKSPACE-RENAME-V1`.

## Purpose

Let users duplicate the active workspace into a new local workspace without rebuilding the graph by hand.

This slice exists to solve a practical builder workflow problem:
- a user wants to branch an experiment before making risky edits
- a user wants a clean alternate version of a guided/demo workspace
- a user wants to compare two variants without destroying the original

The goal is not cross-workspace copy/paste yet.
The goal is to clone one whole workspace safely.

## Strategic Principle

**Duplicate the local workspace as a new branch of work, not as a linked alias.**

That means:
- the duplicate gets a new workspace ID
- the duplicate keeps its own project graph and UI metadata
- later edits in one workspace do not affect the other
- duplication should feel like branching, not referencing

## Why Now

MCW now supports:
- personal workspaces
- guided/demo workspaces worth branching
- composite unzip workflows that often lead to experimentation
- workspace-local instance renaming

That makes whole-workspace branching more valuable.
Once users can clean up IDs locally, the next natural move is to clone a workspace before trying a different path.

## V1 Scope

V1 should stay bounded to **duplicating the active workspace into a new local workspace entry**.

Primary user story:
- open a workspace
- duplicate it
- continue building in the copy without affecting the original

## Included

- duplicate the active workspace into a new workspace with a unique workspace ID
- the duplicate must receive fresh local workspace/project identity
- preserve:
  - project graph
  - layout
  - annotations
  - workspace summary/pipeline metadata
  - default ticked-mode preference
- create a new user-workspace library entry for the duplicate
- make the duplicate the active workspace after creation
- use a predictable default name such as:
  - `<Current Name> Copy`
  - with uniqueness handling when needed
- reset only ephemeral runtime/session state where appropriate
  - active selection may reset or reinitialize safely
  - live playback state should not carry over in a stale way
  - active tutorial/challenge session state should not carry over

## Explicitly Excluded

Do not include in V1:
- copying only a selected cluster
- cross-workspace clipboard/paste
- linked workspaces
- automatic diff/comparison views between original and duplicate
- reusable-definition duplication
- batch duplication

## Core Rules

1. **Duplicate must be independent**
   - future edits in the duplicate must not mutate the original
   - challenge/tutorial ownership must not leak across workspaces

2. **Duplicate must stay local**
   - this creates a new local workspace entry only
   - it does not modify demo definitions or reusable composites

3. **Metadata should stay honest**
   - the duplicate should clearly read as a copy of the current workspace
   - naming should be predictable and unique

4. **Ephemeral runtime state should not leak**
   - duplication should not preserve stale playback/session state in a confusing way

## Success Criteria

V1 is successful if:
- a user can duplicate the current workspace in one action
- the duplicate opens immediately as a separate workspace
- graph and layout content match the original
- later edits diverge cleanly
- the feature reduces “risk of losing a good version” during experimentation

## Likely Follow-Ons

Possible later slices, only if still justified:
- cross-workspace cluster copy/paste
- richer duplicate naming controls
- workspace snapshots/history
- explicit compare-original-vs-copy tooling

## Explicitly Avoid Next

Do not turn this into:
- a general branching/version-control system
- selection-level clipboard semantics
- linked-workspace references

Keep the first move whole-workspace, local, and safe.
