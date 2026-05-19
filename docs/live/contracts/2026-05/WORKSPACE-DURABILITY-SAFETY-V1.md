# Workspace Durability Safety V1

Last updated: May 17, 2026
Status: Proposed

---

## Purpose

Add one bounded persistence-safety slice so MCW authored work is materially less vulnerable to accidental loss from browser storage clearing, tab crashes, or user forgetfulness.

This is not a cloud-sync contract.
It is not collaborative persistence.
It is not a generalized revision-control system.

It is one bounded safety-net contract: make serious authored work behave more like a recoverable local document than a fragile browser tab.

---

## Why This Slice Exists

MCW has grown beyond toy-session complexity.

A user can now build:

- large AES perturbation workspaces
- ECC consequence workspaces
- custom composites
- saved analysis cases
- personal workspace libraries
- named workspace versions

That makes persistence failure more expensive than it was earlier in the project.

The current main persistence substrate is `window.localStorage` through `src/ui/persistence.ts`.

That is acceptable for:

- theme
- dock widths
- collapsed chrome state
- other lightweight UI preferences

It is a weak primary safety net for meaningful authored work because:

- clearing site data can remove it
- storage can be reset unexpectedly
- large document state is concentrated in one browser-scoped store
- accidental loss is disproportionate to the user effort required to build a serious machine

MCW’s product standard should not be:

- “remember to export before you lose your work”

It should be:

- “the product makes accidental loss harder by default”

without pretending V1 solves every durability problem.

---

## Scope

### In scope

- move primary workspace-document persistence from `localStorage` to IndexedDB
- keep lightweight UI preference persistence in `localStorage`
- add bounded automatic local snapshots for authored workspace documents
- add one visible recovery entry point when recoverable snapshots exist
- preserve current explicit save and save-version workflows
- migrate existing stored workspaces forward if older `localStorage` data exists
- bounded tests for migration, autosave, restore, and fallback behavior

### Out of scope

- cloud accounts or remote sync
- shared team workspaces
- cross-device synchronization
- full git-like history browsing
- background encrypted backup systems
- replacing explicit export/import as a user-controlled portability path
- packaging/authoring ergonomics improvements unrelated to persistence safety

---

## Strategic Principle

V1 must separate three things clearly:

- durable workspace document storage
- lightweight browser preference storage
- explicit user-controlled exports

The slice succeeds only if MCW becomes safer against accidental local loss without turning persistence into a hidden magic system the user cannot understand.

The product should say, in effect:

- workspace documents and versions are stored in a more durable local document store
- small browser preferences still live in lightweight browser storage
- export remains the portable user-controlled backup path

It must not imply:

- local persistence means permanent safety
- IndexedDB is a substitute for export
- browser-local storage is equivalent to cross-device backup

---

## Required Product Behavior

### 1. Workspace documents must stop depending primarily on `localStorage`

The primary persisted workspace artifacts must live in IndexedDB:

- current workspace documents
- user workspace library
- workspace versions
- saved analysis cases
- challenge/tutorial attachment state that belongs to the document

V1 may keep a small compatibility layer for migration, but `localStorage` must stop being the authoritative home for those artifacts.

### 2. UI preferences may remain lightweight

These may remain in `localStorage`:

- theme
- dock widths and collapsed state
- panel visibility preferences
- other small browser-local chrome settings

V1 should not overcomplicate those.

### 3. Autosave must exist as a bounded local safety net

MCW must create bounded local snapshots automatically when a workspace changes meaningfully.

V1 should prefer a simple bounded policy such as:

- snapshot after a debounce interval following meaningful document edits
- retain only a small recent window per workspace
- reuse current workspace-version structures where honest rather than inventing a second unrelated history model

The point is not infinite history.
The point is recoverability after unintentional loss.

### 4. Recovery must be visible

If recoverable autosaved snapshots exist for a workspace, the user must have one explicit way to restore them.

V1 should not bury recovery behind:

- browser devtools
- manual storage export
- undocumented hidden menus

### 5. Migration must be safe

If older MCW document state already exists in `localStorage`, the product must migrate it forward into IndexedDB rather than silently discarding it.

Migration must be:

- idempotent
- bounded
- tested

### 6. The claim boundary must stay honest

The product may say:

- local work is safer against accidental browser-state loss
- recent local recovery is available

The product must not say:

- your work is permanently backed up
- your work is safe across devices
- export is no longer necessary

---

## Recommended Surface Shape

The strongest V1 shape is:

1. one IndexedDB-backed workspace-document store
2. one migration path from old `localStorage` document blobs
3. one bounded autosave snapshot ring per workspace
4. one explicit recovery affordance in the existing project/workspace context surface

V1 should prefer attaching recovery to existing workspace/version UI rather than inventing a wholly new persistence dashboard.

---

## Data / Storage Guidance

V1 should treat the following as separate classes:

### Durable document data

- workspace project graph
- workspace UI document state
- saved workspace versions
- saved analysis cases
- user workspace library entries

### Lightweight browser prefs

- theme
- dock widths
- dock collapse state
- other UI-only chrome settings

### Explicit export artifacts

- JSON workspace export
- shareable lab packs
- other user-triggered portable artifacts

The storage implementation should make these distinctions explicit rather than continuing to serialize all persistence concerns through one generic `localStorage` bucket.

---

## Implementation Notes

### 1. Prefer one bounded IndexedDB adapter rather than scattered direct calls

V1 should introduce one narrow persistence layer for IndexedDB-backed document storage rather than sprinkling storage logic through multiple UI surfaces.

### 2. Keep migration one-way and explicit

If legacy `localStorage` document state exists:

- read it
- validate it
- write it into IndexedDB
- mark migration complete

Do not repeatedly bounce the authoritative document state back and forth.

### 3. Keep autosave bounded

This is a recovery safety slice, not a full version-control system.

V1 should prefer:

- a small per-workspace autosave ring
- timestamped snapshots
- clear last-saved / recoverable language

### 4. Keep explicit save/version UX intact

Autosave should reduce accidental loss.
It should not erase the meaning of:

- Save Current Workspace
- Save Version

Those still matter as intentional user checkpoints.

### 5. Rank and sequencing

This slice is important, but it should not preempt the remaining high-value ECC truth/consequence work.

The intended place in the queue is:

1. finish the next bounded ECC consequence/validation slices
2. then ship this persistence-safety slice
3. only after that, return to authoring/packaging ergonomics

That means this contract should rank:

- below the remaining top ECC slices
- above composite/authoring packaging polish

---

## Testing Requirements

1. migration test:
   - legacy `localStorage` workspace document data migrates into IndexedDB without loss

2. persistence round-trip test:
   - saving and loading a workspace document through the new IndexedDB layer reproduces the same document state

3. autosave snapshot test:
   - meaningful document edits produce bounded recoverable snapshots

4. bounded retention test:
   - autosave retention does not grow unbounded per workspace

5. recovery test:
   - a recoverable snapshot can be restored into the active workspace state

6. preference separation test:
   - lightweight UI preferences may still round-trip through `localStorage` without becoming coupled to document persistence

7. fallback behavior test:
   - if IndexedDB is unavailable or fails, the product surfaces a clear persistence warning rather than silently pretending a durable save occurred

---

## Acceptance Criteria

1. workspaces and versions no longer rely primarily on `localStorage`
2. older stored document state migrates forward safely
3. recent autosaved snapshots exist as a bounded local recovery net
4. users have one explicit recovery entry point
5. explicit save/version/export workflows still behave coherently
6. the product is more resistant to accidental local loss without overstating what local persistence guarantees

---

## What Follows

After this slice, MCW should reassess:

- whether a later export/backup convenience pass is needed
- whether optional user-facing backup reminders are warranted
- whether packaging/authoring ergonomics should resume next

But those are follow-ons.
V1 is only about making accidental loss materially less likely and materially less final.
