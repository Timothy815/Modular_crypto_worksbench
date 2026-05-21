# Composite Authoring Ergonomics V1

Last updated: May 20, 2026
Status: Proposed

---

## Purpose

Add one bounded authoring-ergonomics pass for reusable composites so large live machines can be packaged, named, previewed, and reopened more confidently without hiding their structure or introducing new abstraction magic.

This slice follows:

- [Authoring Durability UX V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/AUTHORING-DURABILITY-UX-V1.md)
- [Local Document Workflow V1](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-05/LOCAL-DOCUMENT-WORKFLOW-V1.md)

It is not boundary-port editing.
It is not package-library organization.
It is not workspace-scale navigation.

It is one bounded ergonomics slice: make the existing composite capture and reuse flow easier to understand before the user commits to packaging a live graph fragment into a reusable definition.

---

## Why This Slice Exists

MCW already has the core authoring power:

- create composite from selection
- create iterator and clocked iterator reusables
- save reusable definitions into the composite library
- reopen a composite instance
- edit a shared definition
- unzip a composite instance back into explicit structure

That power is real, but the workflow still feels rough in three places:

- before capture, the user cannot clearly see what ports the composite boundary will expose
- after capture, the library does not summarize reusable definitions strongly enough for quick recognition and reuse
- during reuse, drill-in and back-out affordances are present but still feel more technical than author-centered

The product standard should not be:

- “capture it, then inspect the result to find out what boundary was inferred”

It should be:

- “preview the boundary, name the reusable clearly, save it intentionally, and reopen it later without losing orientation”

while preserving the truth that the composite is still an inspectable machine, not a sealed black box.

---

## Scope

### In scope

- one explicit pre-create preview for composite capture from selection
- one explicit pre-create preview for iterator and clocked-iterator capture from the selected or chosen body definition
- clearer naming and summary copy for reusable definitions in the existing composite-library/palette flow
- clearer drill-in and back-out copy on the existing instance-open and shared-definition edit flow
- one compact authoring help note anchored to the composite-capture surface
- bounded tests for preview correctness, library-summary rendering, and drilldown labeling

### Out of scope

- editing inferred boundary ports after capture
- include/exclude toggles for inferred boundary ports during capture
- new composite semantics in the engine
- filesystem-backed package libraries
- cloud/shared package catalogs
- full workspace-scale navigation aids
- replacing unzip with a more general inverse-packaging system

---

## Strategic Principle

V1 must separate three things clearly:

- seeing what structure will become a reusable boundary
- saving that structure as one reusable definition
- reopening that reusable later to inspect or edit its internals

The slice succeeds only if the user can read the packaging model correctly:

- the capture preview says what the reusable will expose before it is created
- the library summary says what the reusable is without opening it first
- drilldown says whether the user is opening one instance or editing the shared definition

It must not imply:

- that previewed boundary ports are editable in this slice
- that a saved composite is opaque or safer because it is packaged
- that “open instance” and “edit shared definition” are the same action

---

## Required Product Behavior

### 1. Composite capture must show a real boundary preview before creation

When the user invokes `Create Composite` from a workspace selection, the create surface must show a live preview of the inferred external boundary before the composite is created.

That preview must include:

- inferred input ports
- inferred output ports
- each port’s signal type
- the count of selected internal modules being captured

The preview must render from the actual current selection, not hard-coded explanatory copy.

### 2. Iterator capture must show the same kind of boundary preview

When the user invokes `Create Iterator` or `Create Clocked Iterator`, the create surface must show the resolved external interface of the reusable being created.

V1 does not need new iterator semantics.
It only needs interface legibility at the moment of packaging.

The user should not have to create the reusable first to learn what goes in and out.

### 3. The preview must be explicitly read-only in this slice

The create surface must say clearly that the boundary is inferred from the current structure and is previewed here for confirmation, not edited here.

V1 may say, in effect:

- `Previewed boundary`
- `Inferred from the current selection`

It must not imply:

- `click to customize ports`
- `drag to remove boundary ports`

because that is a later slice.

### 4. Library cards must summarize reusable definitions more usefully

Inside the existing composites/library palette flow, each reusable composite or iterator should show a stronger at-a-glance summary.

At minimum, the summary must include:

- kind: composite / iterator / clocked iterator
- number of inputs and outputs
- one compact structural summary such as:
  - internal module count for composites
  - resolved round/body summary for iterators
- whether the definition is built-in or user-authored

The user should be able to browse the library without opening each entry just to remember what it is.

### 5. Drilldown language must distinguish instance inspection from shared-definition editing

Where MCW already offers:

- `Open Instance`
- `Edit Shared Definition`
- `Unzip Composite`

the surrounding copy and labels must make the difference legible:

- `Open Instance` means inspect this placed instance in context
- `Edit Shared Definition` means modify the reusable itself
- `Unzip Composite` means replace the selected instance with its explicit internal structure

The product must not blur those actions together.

### 6. The slice must stay inside existing authoring surfaces

V1 must use the existing authoring surfaces rather than inventing a new packaging dock.

The committed architectural homes are:

- the existing create-composite / create-iterator capture surface
- the existing composite-library palette cards
- the existing inspector/configure-view drilldown actions for composite instances and definitions

This is a refinement slice, not a new subsystem.

### 7. The claim boundary must stay bounded

The product may say:

- this selection will expose these inferred ports
- this reusable has this many ports and this kind of structure
- this action opens one instance or edits the shared definition

The product must not say:

- this packaged composite is simpler in the mathematical sense
- this abstraction removes the need to inspect internals
- this slice gives full boundary-port authoring control

---

## Recommended Surface Shape

The strongest V1 shape is:

1. **Composite capture dialog / sheet**
   - name field
   - id field if already present
   - one read-only `Boundary Preview` card
   - one compact count such as `8 modules selected`
   - one inline note explaining that the boundary is inferred, not edited here

2. **Iterator capture dialog / sheet**
   - same preview treatment adapted to iterator or clocked-iterator structure
   - body/round summary kept visible before creation

3. **Composites palette cards**
   - stronger reusable summary line
   - visible distinction between built-in and user-authored entries

4. **Inspector/configure view action copy**
   - clearer language around:
     - `Open Instance`
     - `Edit Shared Definition`
     - `Unzip Composite`

This should feel like one coherent packaging workflow layered onto the existing authoring surfaces, not like a second authoring mode.

---

## Data / UX Guidance

V1 should prefer a narrow preview model:

- the boundary preview reads from the actual inferred boundary already available from capture logic
- the preview should list ports in a stable order
- signal types should be explicit
- internal module count should be computed from the actual selected capture set

The summary model should stay equally narrow:

- composites summarize internal module count
- iterators summarize resolved round/body structure
- clocked iterators summarize body plus clocked nature

The UX should avoid:

- exposing raw internal graph ids as the main summary text
- rendering long unscannable boundary lists without grouping or count context
- adding new full-screen library management chrome

---

## Implementation Notes

### 1. Reuse the shipped capture logic rather than inventing a second inference path

The preview should be produced from the same capture/inference machinery that creation already uses.

V1 should not maintain:

- one code path for preview
- another for final composite creation

If those diverge, the preview stops being trustworthy.

### 2. Treat preview correctness as a real product requirement

If the current selection changes, the preview must update with it before creation.

The product should not cache stale preview data after the selection or chosen body changes.

### 3. Keep boundary-port editing explicitly deferred

If a user reaches for deeper control, the surface may say, in effect:

- `Boundary editing comes in a later slice`

It should not offer dead controls or fake affordances.

### 4. Keep drilldown copy compact but precise

The instance-vs-definition distinction should be taught by the existing action area, not by a large secondary tutorial.

V1 is about removing ambiguity, not adding lots of prose.

### 5. Integrate with existing palette metadata rather than adding a second composite catalog

The richer reusable summaries should live inside the existing composites tab and existing library cards.

V1 should not add:

- a second reusable browser
- separate packaging dashboards

---

## Tutorial / Onboarding Requirement

V1 does not need a full tutorial project.

It does need one compact inline help note in the capture surface that teaches five facts:

1. the boundary preview is inferred from the current structure
2. the preview shows what the reusable will expose externally
3. this slice does not yet allow boundary-port editing
4. saved reusables remain inspectable through instance-open and shared-definition edit flows
5. unzip restores one composite instance back into explicit structure when the user wants the exploded view again

That inline note must live inside the capture surface itself, not in a separate Quick Start detour.

---

## Testing Requirements

1. `npx vitest run` must pass.
2. `npm run build` must pass.
3. the composite capture preview must render the actual inferred input/output ports, signal types, and selected-module count for one seeded selection
4. the iterator or clocked-iterator capture preview must render the actual resolved external interface for one seeded reusable body
5. changing the selection or chosen capture body must update the preview rather than leaving stale preview data on screen
6. the preview surface must explicitly label the boundary as inferred/read-only and must not expose fake boundary-editing controls
7. the composites palette summary must render kind, port counts, authored-vs-built-in status, and one structural summary for at least one user-authored reusable and one built-in reusable
8. the inspector/configure-view action area must keep `Open Instance`, `Edit Shared Definition`, and `Unzip Composite` behaviorally and textually distinct

---

## Success Criteria

- users can see what a composite or iterator boundary will look like before creating it
- users can recognize reusable definitions in the library with less reopening and guesswork
- users can tell whether they are opening one instance, editing the reusable itself, or unzipping it back into explicit structure
- large machine packaging feels more intentional without making the machine opaque

---

## Likely Follow-On

The most natural follow-on after this slice is:

- explicit include/exclude control over inferred composite boundary ports during capture

but only after the current packaging workflow is made legible enough to trust.
