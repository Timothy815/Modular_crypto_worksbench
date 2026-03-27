# Parameter Authoring Ergonomics V1

Last updated: March 27, 2026

Status: Implemented on `main` after `CONNECTION-AUTHORING-ERGONOMICS-V1`.

## Purpose

This contract defines the first parameter-authoring ergonomics slice for MCW.

The goal is to make module tuning faster and less repetitive without introducing hidden parameter inheritance, spreadsheet editing, or synchronized-template behavior.

## Product Problem

MCW now has materially better graph authoring:
- repeated-structure duplication
- cluster selection and deletion
- workspace-local undo / redo
- named workspace versions
- zoom / focus / view recovery
- direct connection rewiring and replacement

That means the next authoring bottleneck is increasingly parameter work rather than graph mechanics.

Current friction shows up in tasks like:
- repeating the same parameter edit across several selected modules
- tuning one stage of a repeated machine, then manually repeating that change in sibling stages
- copying a known-good configuration from one module to another compatible instance
- knowing whether an inspector value is still draft-only or already committed

These are parameter-authoring problems, not canvas or vocabulary problems.

## Core Question

Can MCW make parameter editing faster across compatible modules without hiding the fact that each module still owns its own explicit parameter values?

## Strategic Principle

**Accelerate explicit tuning. Do not create hidden linkage.**

That means:
- a user may copy or apply values across compatible modules intentionally
- every target module still stores its own explicit params
- the system must not create live synchronization or template inheritance

This is not:
- spreadsheet-style bulk editing
- hidden shared parameter state
- param binding between modules
- automatic inference of “similar stages”

## First Milestone

The first milestone should answer one clear question:

**Can a user copy or apply parameter values from one module to other explicitly selected compatible modules without retyping the same edits one field at a time?**

## Include

The first slice should likely include:
- a lightweight `Copy Params` action for the currently inspected module
- a `Paste Params` or `Apply To Selected Compatible Modules` action
- compatibility checks based on identical module definition ID only in V1
- explicit reporting when selected modules are incompatible and skipped
- clear committed-vs-draft behavior in the inspector when bulk application occurs
- undo/redo compatibility as a single authoring step per apply action

## Exclude

Do not include in V1:
- live-linked parameter groups
- batch editing across mixed incompatible module families
- param diff visualizations across many modules
- spreadsheet/table editing modes
- hidden “apply to all future duplicates” behavior
- multi-workspace parameter propagation

## Core Rules

1. **Every final parameter value must remain explicit**
- target modules store ordinary concrete params after the operation
- no shared references or synchronized follow-on behavior

2. **Compatibility must be visible**
- if an action only applies to some selected modules, the UI should say so clearly

3. **The first source of truth is the current inspector**
- V1 should extend the existing inspector flow, not invent a second parameter-editing surface

4. **Draft behavior must stay understandable**
- applying params should not silently preserve stale drafts that disagree with committed values
- applying params should clear or overwrite conflicting drafts on every affected target module

5. **The slice must integrate with history**
- one copy/apply action should undo as one step
- V1 should use one bounded higher-level reducer action for bulk apply, not a loop of many `updateParam` actions

6. **V1 should focus on same-definition modules first**
- start with the common case of copying between instances of the same module definition
- broader compatibility rules can come later if needed

7. **The source module remains the current inspector target**
- V1 should copy from the currently inspected module only
- V1 should apply to other explicitly selected modules, never back onto the source by implication

## Recommended Implementation Shape

The strongest V1 shape is likely:
- keep a lightweight parameter clipboard in UI state or component state
- allow copying from the currently selected module instance
- allow applying to the currently selected compatible module instances
- add one bounded higher-level reducer action for applying copied params to selected targets atomically

Reason:
- the inspector already owns parameter editing
- the project already has multi-selection and history
- the highest-leverage improvement is reducing repeated re-entry, not redesigning parameter editing from scratch

## Expected File Scope

Primary files likely in scope:
- `src/ui/components/parameter-inspector.tsx`
- `src/ui/store.ts`
- `src/App.tsx`

Supporting files may include:
- `src/App.css`
- focused tests around parameter clipboard/application behavior

This slice should not require engine-layer changes.

## UI Shape

The first UI can be simple.

Good options:
- `Copy Params` button on the selected module
- `Apply Params To Selected` button when more than one same-definition compatible module is selected
- small status text showing how many selected modules will receive the copied values

The important thing is:
- applying params feels intentional
- skipped modules are explained
- target modules remain explicit and independently editable afterward
- the source module and target count are obvious before the user clicks apply

## Success Criteria

This slice is successful when:
- a user can copy params from one module and apply them to selected compatible sibling modules
- incompatible selected modules are skipped clearly
- resulting parameter values are committed explicitly on each target instance
- conflicting drafts on affected target modules are not left behind
- undo/redo treats one apply action as one step
- the feature reduces repeated inspector re-entry without introducing hidden behavior

## Validation Expectations

This slice should add focused tests for:
- copying params from a source module
- applying params to selected compatible modules of the same definition
- skipping incompatible selected modules cleanly
- preserving explicit per-module parameter state after apply
- clearing/replacing stale drafts on affected targets
- undo/redo behavior after one bulk-apply action

## Explicitly Avoid Next

Do not let this become:
- param inheritance
- live synchronization between modules
- spreadsheet bulk editing
- compatibility-by-overlap heuristics across unrelated module families
- clipboard persistence across reloads or workspaces
- an inspector redesign disguised as ergonomics

Keep the first move about explicit parameter-copy/application leverage inside the existing authoring model.
