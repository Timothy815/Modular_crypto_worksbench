# SEARCH-FIRST-PALETTE-V1

Last updated: April 4, 2026

Status: Drafted for review before implementation

## Purpose

Define a bounded primitive-discovery slice that makes the palette faster to use at current product scale.

The goal is not to redesign the entire shell.
The goal is to reduce the "scroll-and-search" friction now that MCW has enough primitives, composites, and supporting surfaces to make the current palette feel too tall and too passive.

## Why Now

MCW now has:
- a much richer workspace surface
- stronger wire and layout tooling
- more capable structured primitive editors
- a more coherent inspector

That means one of the next bottlenecks is no longer "can the user build this machine?" but:
- can the user find the right part quickly?
- can the user discover the right part family without hunting through long vertical sections?
- can the product surface feel more like a modern IDE and less like a long catalog?

Recent product review feedback points to the same friction:
- palette discovery depth is becoming costly
- vertical browsing is too prominent as the primary discovery pattern
- quick lookup still feels slower than it should for an expert tool

## Product Goal

The palette should become search-first without becoming command-first.

That means:
- search is the primary discovery interaction
- browsing still exists
- the user can still understand families and categories
- the product does not collapse into a generic command launcher

The ideal result is:
- faster primitive lookup
- easier discovery of likely parts
- less vertical scanning
- stronger "IDE" feel without losing the guided machine-part vocabulary

## Core Decision

This slice introduces a search-first palette experience inside the existing palette surface.

It does **not** replace the palette with a global command palette.

It does **not** remove category browsing.

It does **not** widen into full command search across the whole application.

## Scope

This contract is limited to:
- `src/ui/components/primitive-palette.tsx`
- any palette-local filtering/search helpers
- supporting palette-local keyboard handling if needed
- palette-local styles in `src/App.css`
- small supporting tests if behavior extraction is needed

This slice may include:
- an always-available search field that is visually primary
- stronger ranking of search matches
- a compact search-results view inside the palette
- clearer empty-state and no-results guidance
- lightweight section suppression/collapse behavior when search is active
- keyboard focus affordances for the palette search field

## Desired Shape

The palette should support two honest modes:

1. **Search-first**
- the default fast path
- type to narrow immediately
- show the strongest matching parts first
- keep result cards compact and scannable

2. **Browse**
- still available when the user wants category discovery
- existing section structure remains legible
- not removed, just demoted from being the only practical discovery path

When search is active:
- the palette should prioritize matched results over category storytelling
- section headers should disappear entirely
- search should feel immediate and local

When search is empty:
- the palette may continue to show the current sectioned browsing surface

## Required Behaviors

1. **Search is visually primary**
- the search field should read as the first-class palette interaction

2. **Search remains palette-local**
- this is not a global command palette
- it should not search menus, workspace actions, or inspector controls

3. **Search is tolerant**
- matches should work across:
  - primitive names
  - ids
  - section/family wording where useful
  - existing descriptive copy

4. **Browsing remains available**
- sectioned palette browsing must still exist when no search is active

5. **No taxonomy rewrite required**
- this slice should work with the current palette coherence structure
- it should not require another large reclassification pass

6. **No command-system drift**
- do not widen this slice into generic action search, command dispatch, or menu replacement

7. **Keyboard friendliness**
- the user should be able to focus and use palette search quickly
- `/` should focus the palette search field when the user is not already typing in another input
- `Escape` should clear the query and return the palette to browse mode
- typing inside the search field must not leak global shortcuts into the rest of the shell

8. **No new persistence contract**
- search-first behavior may remember the last query locally if useful, but no project/schema changes are allowed

9. **Result flattening**
- when the search query is non-empty, the palette must show one flattened ranked result list
- category and section headers must be suppressed while search is active

10. **Weighted ranking**
- matches must be ranked with clear priority:
  - exact name or id match first
  - partial name or id match second
  - purpose, detail, section, and keyword matches after that
- search should not allow a weak descriptive hit to outrank a direct module-name hit

11. **Search-first focus order**
- the search field should be the first practical focus target in the palette
- filter controls and view toggles should read as secondary controls

12. **Compact density**
- when compact view is active and search is non-empty, search results should remain especially vertically dense
- search mode should not reintroduce tall browse-style section chrome

## Non-Goals

Do not include:
- a global command palette
- full-app action search
- workspace-command execution from search
- a new palette taxonomy pass
- major palette visual redesign unrelated to discovery speed
- a new detached-window model
- AI-assisted search or recommendation logic
- fuzzy result ranking complex enough to require a new search subsystem

## Success Criteria

This contract is successful when:
- a user can find a known primitive faster than with pure scrolling
- the palette no longer feels like the main source of discovery friction at current primitive count
- search results are compact and high-signal
- browsing still works without feeling broken or second-class
- the implementation remains bounded to the palette surface
- a search for `xor` or `rotor` clearly promotes the directly named module above weaker descriptive matches

## Suggested Validation Questions

After implementation, validate:
- can a user find `RotorReverse`, `SymbolPermutation`, `Modulo`, or `Nonce` quickly without scrolling?
- does search feel clearly primary inside the palette?
- do no-results and low-confidence searches still guide the user well?
- does the palette still make sense when search is cleared?
- did this stay palette-local rather than quietly becoming a command system?

## Relationship To Existing Work

This contract follows:
- `PALETTE-COHERENCE-V1.md`
- `WORKBENCH-CONTROL-SIMPLIFICATION-V1.md`
- `WORKBENCH-QUICK-ACTIONS-V1.md`

`PALETTE-COHERENCE-V1` made the library read more honestly.

This slice makes that library faster to use.

## Likely Follow-Ons

If this slice succeeds cleanly, the next related follow-ons would be:
- palette result ranking polish
- richer primitive summary cards in search results
- a separate, later **global action launcher** if the product truly needs one

Those are explicitly out of scope for V1.
