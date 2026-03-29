# WORKBENCH-MENU-CLEANUP-V1

Status: Proposed

Owner: Codex
Scope: UI / Workbench Shell

## Why

Student feedback surfaced a simple but high-leverage workbench problem: the top workbench control area mixes unrelated actions together and has become harder to scan as the product has grown.

The issue is not lack of capability. The issue is categorization.

MCW now has distinct classes of workbench actions:
- view/navigation controls
- editorial / authoring actions
- save / version / recovery actions
- import / export actions
- detached window actions

Those actions should read as deliberate groups rather than one long mixed control strip.

## Goal

Reorganize the workbench control area into a bounded grouped-dropdown model so the bar stays on one line in most widths and users can find actions by intent rather than by memorizing button position.

## Non-Goals

- No new workbench capability
- No new persistence model
- No new import/export behavior
- No redesign of the detached-window system
- No deep nested menus
- No command palette

## Required V1 Shape

1. Replace the current mixed workbench action strip with a small set of top-level grouped controls.
2. Keep the grouped controls on one row in most normal desktop configurations.
3. Use clear bounded categories, with the default V1 target set:
   - `View`
   - `Edit`
   - `Project`
   - `Import/Export`
   - `Windows`
4. Reuse existing actions where possible rather than creating parallel commands.
5. Keep keyboard shortcuts and existing action semantics unchanged.
6. Keep the group count small; this should reduce scan cost, not create a mega-menu problem.
7. Menus should remain shallow and readable. Avoid nested submenu trees in V1.
8. `Windows` should remain a first-class grouped surface because detached-window management is now substantial enough to justify its own category.
9. Preserve one-click access for the most critical always-used actions only if they still materially justify remaining outside dropdowns. Otherwise, prefer consistency.
10. The grouped control surface must still behave well when the active workspace changes.

## Category Intent

### View

Contains actions primarily about seeing or navigating the workspace.

Expected examples:
- zoom in / out
- fit / reset view
- landmarks / visibility navigation

### Edit

Contains editorial and authoring actions that change the workspace structure or selection state.

Expected examples:
- selected-cluster actions
- stage / arrange actions
- other bounded editorial operations already present in the workbench surface

### Project

Contains save / recovery / version-oriented actions.

Expected examples:
- save
- duplicate
- version / restore / checkpoint actions
- undo / redo only if they belong in the workbench shell rather than remaining shortcut-first

### Import/Export

Contains import / export actions only.

Expected examples:
- workspace import
- workspace export
- Python export

### Windows

Contains detached-window and pane-placement actions.

Expected examples:
- open in window
- move to window
- return to main
- grouped detached-window actions already shipped

## UX Rules

- The menu bar should feel simpler than the current mixed strip at a glance.
- Labels should be concise and stable.
- Group names should describe intent, not implementation.
- Menus should not become long scrolling lists in V1; if a category becomes crowded, reorder or trim before widening.
- The grouped model should remain usable without requiring hover precision gymnastics.

## Success Condition

This slice is successful if:
- the workbench control area reads as a small number of clear intent-based categories
- users can locate common actions faster without learning a crowded mixed strip
- the workbench bar stays to one line in most normal desktop layouts
- no existing workbench capability is lost

## Notes

This is a workbench-shell cleanup slice, not a feature slice.

The value is organizational clarity:
- lower scan cost
- clearer mental model
- better classroom usability

If later user feedback suggests one category is still overloaded, that should be handled as a follow-on refinement rather than by broadening this contract into a full command-surface redesign.
