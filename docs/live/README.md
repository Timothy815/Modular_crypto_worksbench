# MCW Live Contracts

This directory holds active or undecided contract/note files that are still relevant but should not crowd the repo root.

## What Belongs Here

- active implementation contracts
- planning notes that still influence future slice selection
- older contract docs without clear terminal status that still need verification or triage
- historical context that is still live enough to keep searchable without treating it as archived

## Relationship To Other Doc Surfaces

- repo root: core restart and project-definition docs only
- `docs/live/contracts/`: active/undecided contract docs
- `docs/archive/`: shipped/completed historical docs

## Workflow

If a contract becomes clearly historical:
1. update its `Status:` line
2. remove it from live shortlists
3. move it from `docs/live/contracts/` to `docs/archive/contracts/`
