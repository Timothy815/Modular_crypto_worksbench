# Local Document Workflow V1

Last updated: May 20, 2026
Status: Proposed

---

## Purpose

Add one bounded local-document workflow so MCW can open, save, and re-save real workspace files from the user’s local filesystem instead of forcing every file-backed workflow through export/import semantics.

This slice follows:

- [Workspace Durability Safety V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-DURABILITY-SAFETY-V1.md)
- [Authoring Durability UX V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AUTHORING-DURABILITY-UX-V1.md)

It is not cloud sync.
It is not a full multi-file project system.
It is not a replacement for import/export artifacts.

It is one bounded document-authoring slice: make one workspace behave like a local document the user can open from disk, save back to disk, and save under a new name, while keeping import as a distinct “bring this into the current workspace” action.

---

## Why This Slice Exists

MCW already supports:

- new workspaces
- durable local browser persistence
- JSON export
- lab-pack export
- Python export
- import of workspace artifacts

That is enough to preserve work, but it still feels like an artifact shuttle rather than a document workflow.

The current pain is structural:

- opening a saved workspace file feels like importing data into MCW rather than opening a named document
- the user may have to create or rename a workspace inside MCW instead of simply reopening the file they already saved
- import and open are conflated
- save and export are conflated

The product standard should not be:

- “use export, then later import that file into a new or existing workspace”

It should be:

- “open a workspace document, work on it, save it back, and still use import/export for the cases where those are the right tools”

without pretending browser-based file access is universally available.

---

## Scope

### In scope

- one bounded local document workflow for workspace JSON documents
- explicit `Open Workspace...`
- explicit `Save`
- explicit `Save As...`
- one remembered file binding for a workspace when the browser permits it
- one clear fallback path when file-handle APIs are unavailable
- keeping import as a distinct action from open
- bounded tests for file-bound save/open behavior and fallback behavior

### Out of scope

- cloud sync
- full folder/project workspaces
- multi-document tabs from one folder
- filesystem-backed composite-library directories
- replacing shareable lab packs or Python export
- removing JSON import
- replacing browser-local durability as the safety net

---

## Strategic Principle

V1 must separate three things clearly:

- opening or saving a workspace document on the local filesystem
- importing a workspace artifact into the current MCW session
- browser-local durability and recovery

The slice succeeds only if a user can read the product model correctly:

- `Open Workspace...` means “open this file as a workspace document”
- `Save` means “write back to the current bound file if one exists”
- `Save As...` means “choose a new file location/name for this workspace”
- `Import` still means “bring external content into the current session or workspace”

It must not imply:

- local-file save replaces browser-local durability
- import and open are the same action
- export and save are the same action

---

## Required Product Behavior

### 1. Open must be distinct from import

MCW must provide one explicit `Open Workspace...` action that loads a workspace document from the local filesystem as the active workspace document.

This must be separate from:

- `Import Workspace`
- `Import Lab Pack`
- other artifact-oriented imports

The user should not need to create a new workspace first just to read a file they already saved.

### 2. Save must behave like document save when a file binding exists

If the active workspace is already bound to a local file handle, `Save` must write the current workspace document back to that file.

V1 should preserve the workspace’s document identity:

- same file
- same name/path association

The user should not be forced through export every time.

### 3. Save As must create or replace the file binding explicitly

MCW must provide `Save As...` so the user can:

- choose a local filename/path
- create a new document file for the current workspace
- replace or establish the active file binding

After a successful `Save As...`, subsequent `Save` actions should write to that chosen file.

### 4. Opened workspaces must keep their document identity visible

When a workspace is opened from or bound to a local file, the product must surface enough identity to make the document model legible.

V1 should at minimum show:

- the bound filename when a file binding exists
- whether the workspace is currently file-bound or browser-local only

It does not need a full path browser.

### 5. Fallback behavior must stay honest

If the browser does not support the needed local-file APIs, MCW must fall back honestly.

The product may say, in effect:

- direct local open/save is unavailable in this browser
- use Import/Export instead

It must not pretend `Save` is file-backed when it is only updating browser-local durability.

### 6. Import must remain available as a distinct authoring action

V1 must preserve the current ability to:

- create a new workspace
- import a workspace artifact into the current environment
- import lab packs separately

This slice is about adding document workflow, not removing artifact workflow.

### 7. The claim boundary must stay bounded

The product may say:

- this workspace is bound to a local file
- save writes back to that file
- import remains separate from open

The product must not say:

- local file binding means multi-device safety
- file-backed save replaces export
- browser-local recovery no longer matters

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Project / Workspace actions**
   - `New Workspace`
   - `Open Workspace...`
   - `Save`
   - `Save As...`

2. **Import / Export actions**
   - `Import Workspace`
   - `Import Lab Pack`
   - existing export actions

3. **Workspace context / durability surface**
   - one compact file-binding state line such as:
     - `File-bound workspace`
     - `Browser-local workspace`

This should feel like a real document workflow layered onto the existing workbench, not like a filesystem browser bolted onto the UI.

---

## Data / UX Guidance

V1 should prefer a narrow document model:

- one active workspace may have one local file binding
- the binding stores browser-supported file-handle metadata in the existing durable local workspace store, not raw path assumptions
- after reload, the binding must be treated as provisional until file-handle permission/availability is reconfirmed
- if reopened through `Open Workspace...`, the workspace should restore from the selected file as a document, not as an import artifact that needs renaming

The UX should avoid:

- treating every file open as “import into a new anonymous workspace”
- overloading export terminology for ordinary save behavior
- exposing low-level filesystem jargon in the main happy path

---

## Implementation Notes

### 1. Prefer the File System Access API where supported

V1 should use the browser File System Access API where available for:

- open
- save
- save as

This is the right document-workflow substrate on supporting browsers.

### 2. Keep fallback explicit on unsupported browsers

If the API is unavailable, do not fake file-backed save.

Instead:

- disable or redirect local document actions honestly
- point the user toward the existing import/export flow

### 3. Keep file binding metadata narrow

V1 should persist only the metadata needed to remember and describe the current file binding where the browser allows it.

The intended model is:

- persist the file-handle metadata in the same durable local workspace store that already owns the current workspace document
- on reload, re-check whether the handle is still usable before claiming that `Save` is file-backed
- if the handle cannot be reconfirmed, downgrade the workspace visibly to browser-local-only until the user reopens or rebinds the file

This keeps the document identity remembered without pretending browser permissions survive forever.

Do not turn this into a full recent-files manager unless the browser behavior makes one essentially free.

### 4. Keep import semantics distinct in labels and copy

Use wording that makes the separation unmistakable:

- `Open Workspace...`
- `Import Workspace`

Avoid ambiguous labels that collapse those into one action.

### 5. Save should integrate with the durability story, not replace it

Browser-local durability and autosave should still run.

File-backed save is a document workflow improvement, not a reason to remove:

- autosave
- recovery snapshots
- degraded-mode honesty

### 6. The file workflow should remain bounded to workspace documents in V1

Do not expand this slice into:

- folder-backed package systems
- composite-library directories
- general filesystem browsing

Those are future packaging questions.

### 7. Keep the file API behind a narrow testable boundary

V1 should isolate File System Access API interactions behind one narrow document-file workflow layer that can be mocked in vitest.

The contract does not require end-to-end filesystem writes in unit tests.
It does require a testable abstraction boundary so the product behavior can be verified without pretending raw browser file APIs are naturally unit-testable.

---

## Tutorial / Onboarding Requirement

V1 should add one compact inline help note in the workspace/project context surface that teaches:

1. `Open Workspace...` opens a saved workspace document from disk
2. `Save` writes back to the current bound file when one exists
3. `Save As...` creates or changes the file binding
4. `Import Workspace` is still for bringing external content into the current MCW session
5. browser-local durability and autosave still exist alongside file-backed save

This does not need a full tutorial project or a separate Quick Start workflow update in V1.

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. Opening a valid workspace document through the local-document workflow must load it as the active workspace document without requiring a prior blank-workspace creation step.
4. `Save` must call the currently bound document-file workflow write path when a confirmed file binding exists, using a mocked file-workflow boundary in vitest rather than raw browser filesystem access.
5. `Save As...` must establish or replace the file binding used by later `Save` calls.
6. Opening a workspace document via `Open Workspace...` must not route through the import-artifact flow, and importing via `Import Workspace` must not establish a file binding.
7. Unsupported-browser fallback must explicitly route the user toward the existing import/export flow rather than pretending direct local file save is active.

---

## Success Criteria

V1 is successful if:

- a user can save a workspace to a real local file and reopen it later as that same document
- a user no longer has to treat reopen as import-into-a-new-workspace
- save/export/import/open are cleaner, separate concepts in the product
- browser-local durability still exists as a safety layer alongside the local document workflow

---

## Likely Follow-On

If V1 works, the next packaging/authoring slices should likely move into:

1. composite authoring ergonomics
2. workspace navigation and scale
3. package/library reuse
4. possibly a richer recent-files or recent-documents surface if the file workflow proves valuable

But those should stay separate contracts.
