# Authoring Durability UX V1

Last updated: May 20, 2026
Status: Proposed

---

## Purpose

Refine the shipped workspace-durability system so MCW authors can tell, at a glance, whether their work is being saved safely, whether recovery is available, and when they still need an explicit backup/export habit.

This slice follows:

- [Workspace Durability Safety V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/WORKSPACE-DURABILITY-SAFETY-V1.md)

It is not a new storage-engine contract.
It is not cloud sync.
It is not full version-control UX.

It is one bounded ergonomics slice: make the already-shipped IndexedDB/autosave/recovery system legible enough that authors trust it for real work without being misled about its limits.

---

## Why This Slice Exists

MCW now has materially better local durability than it did before:

- primary workspace documents no longer depend on `localStorage`
- autosave snapshots exist
- recent recovery is exposed in the workspace context surface
- degraded-mode warnings exist when durable storage is unavailable

That solved the infrastructure problem.

The remaining problem is product trust and author comprehension:

- authors need to know whether durable save is healthy right now
- authors need to know whether recent recovery exists right now
- authors need to understand that local durability is not the same thing as a portable backup
- authors need stronger cues before risky moments such as abandoning a large workspace without exporting it

The product standard should not be:

- “the system probably saved it somewhere”

It should be:

- “I can see my current safety state, I can see whether recovery exists, and I know when I still need an export”

without turning persistence into an intrusive dashboard.

---

## Scope

### In scope

- one bounded durability-status UX surface in the existing workspace/project context
- clearer live status for:
  - durable local storage health
  - last durable save / last autosave recency
  - recent recoverability
- one bounded backup/export reminder surface when a workspace is protected only by local durability
- clearer degraded-mode messaging and recovery affordances
- bounded tests for live status rendering, recovery metadata rendering, and degraded-mode copy

### Out of scope

- new storage backends
- cloud sync or accounts
- cross-device backup
- full history browsing
- project-library organization
- composite packaging ergonomics
- large-canvas navigation
- generic notification infrastructure unrelated to persistence safety

---

## Strategic Principle

V1 must separate three things clearly:

- current local durability state
- current local recoverability state
- explicit portable backup/export state

The slice succeeds only if the product can say, honestly and visibly:

- your workspace is currently saving durably to local storage
- recent autosave recovery is or is not available
- export is still the portable backup path

It must not imply:

- local durability means your work is backed up elsewhere
- autosave means export no longer matters
- “saved locally” and “safe forever” are equivalent

---

## Required Product Behavior

### 1. Current durability state must be visible without guesswork

The existing workspace/project context surface must show one explicit current durability state for the active workspace.

V1 should name states in plain language such as:

- durable local save active
- local recovery available
- degraded local save mode

The user should not need to infer safety from silence.

### 2. Recovery recency must be visible

If recoverable autosaves exist, the surface must show:

- that recovery exists
- the recency of the most recent recoverable snapshot
- one explicit way to restore it

This must not be buried behind a generic “more” menu.

### 3. Durable save recency must be visible

The surface must show when the current workspace was last durably saved or autosaved in a way the user can read quickly.

V1 does not need perfect humanized prose, but it must expose:

- one last-saved / last-autosaved fact
- live updates when the workspace changes and the autosave cycle completes

### 4. Degraded mode must be high-salience and actionable

If durable storage is unavailable and MCW is running in a weaker fallback mode, the product must say so clearly.

The warning must:

- be visible near the workspace durability surface
- explain that local protection is weaker than normal
- point the user toward export/backup behavior

### 5. Export must stay legible as the portable safety path

The workspace context surface must include one bounded reminder that export remains the user-controlled portable backup path.

This reminder should be visible when:

- the workspace has never been exported
- or the workspace has changed since its most recent export
- durability is local-only

The reminder must not become a noisy modal habit.

### 6. Restore actions must be explicit about what they will do

If the user restores from a recent autosave, the product must make clear that:

- the current workspace will be replaced by that restored state
- the restore target is a local snapshot, not a remote backup

V1 may do this with concise inline copy rather than a new complex diff flow.

### 7. The claim boundary must stay honest

The product may say:

- recent local recovery is available
- durable local save is healthy or degraded
- export is recommended for portable backup

The product must not say:

- your work is backed up remotely
- your work is protected across devices
- autosave replaces export

---

## Recommended Surface Shape

The strongest V1 shape is one durability section inside the existing workspace/project context surface with three compact blocks:

1. **Current Safety**
   - current durability state
   - last durable save / last autosave recency

2. **Recent Recovery**
   - latest recoverable snapshot recency
   - restore action

3. **Portable Backup**
   - one short export reminder
   - one existing export entry point

This should feel like a trustworthy document-status card, not like a new storage dashboard.

This contract assumes the durability section already exists as a result of the shipped `WORKSPACE-DURABILITY-SAFETY-V1` slice.
V1 refines that existing section rather than inventing a second persistence home elsewhere in the product.

---

## Data / UX Guidance

V1 should expose only the smallest set of facts an author actually needs:

- durable storage mode
- degraded or healthy status
- latest autosave recency
- whether recovery snapshots exist
- latest recovery snapshot recency
- one export reminder

It should avoid clutter such as:

- raw storage implementation names everywhere
- long snapshot histories
- internal migration diagnostics unless something failed

IndexedDB can appear in implementation or degraded-mode copy where needed, but the main UX should prefer author-facing language over storage jargon.

---

## Implementation Notes

### 1. Build on the shipped durability layer rather than bypassing it

This slice should read real state from the shipped durability/autosave layer.

Do not duplicate save-timestamp logic in unrelated UI surfaces.

### 2. Prefer one bounded status surface over scattered toasts

V1 should prefer one stable durability section inside the existing workspace/project context surface rather than many ephemeral notifications.

Small toasts are acceptable only if they reinforce, not replace, the stable status surface.

### 3. Keep export reminders contextual

The export reminder should appear where the user already looks for workspace/project actions.

Do not introduce a new modal flow just to say “remember to export.”

For V1, the reminder trigger should be read exactly as:

- show the reminder if the active workspace has never been exported
- or if the active workspace has been modified since its most recent export

Do not interpret “local-only protection” as a reason to show the reminder for every workspace all the time.

### 4. Keep degraded-mode language specific

Degraded mode copy should say, in effect:

- durable local storage is unavailable
- MCW is using weaker local protection
- export is recommended now

It should not say only:

- storage issue
- something went wrong

### 5. Restore metadata must come from real snapshot data

The recovery surface must display actual snapshot recency/state, not hard-coded placeholder copy.

### 6. Keep this slice explicitly separate from packaging ergonomics

This work is about author confidence in persistence and recovery, not:

- project-library taxonomy
- reusable composite publishing
- canvas abstraction

Those are later ergonomics slices.

---

## Tutorial / Onboarding Requirement

V1 should add one short onboarding/help path as an inline collapsible note inside the durability section of the workspace/project context surface that teaches:

1. local durable save is active when healthy
2. recent autosave recovery is available in the same surface
3. export is still the portable backup path
4. degraded mode means the user should export sooner rather than later

This should be a compact inline help note in that durability section rather than a separate tutorial project or a detached help surface.
It does not need a full tutorial project.

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. The durability surface must render the active healthy/degraded state from real workspace durability state, not from static copy.
4. The durability surface must render real last-save / last-autosave metadata when present.
5. The recovery surface must render actual latest recoverable snapshot metadata when snapshots exist.
6. The restore action must display explicit replacement-semantics copy before proceeding, including that the current workspace will be replaced by a local snapshot.
7. The degraded-mode warning must render only when the shipped durability layer reports degraded operation, and its copy must explicitly say that durable local storage is unavailable or weakened and that export is recommended now.
8. The export reminder must remain visible in the bounded workspace/project context surface when the active workspace has never been exported or has changed since its most recent export.

---

## Success Criteria

V1 is successful if:

- an author can open the workspace/project context surface and tell whether local durability is healthy or degraded
- an author can tell whether recent recovery exists and restore it explicitly
- an author can see when the workspace was last durably saved or autosaved
- an author is reminded that export is still the portable backup path
- the product feels more trustworthy without claiming more safety than it actually provides

---

## Likely Follow-On

If V1 works, the next ergonomics slices should move outward from persistence trust into:

1. composite authoring ergonomics
2. large-workspace navigation and scale
3. package/library reuse flows

But those should remain separate contracts.
