# SHAREABLE-LAB-PACK-COMPOSITE-DEPENDENCIES-V1

Status: Proposed

Owner: Codex

Date: 2026-04-22

---

## 1. Purpose

Extend the existing Shareable Lab Pack flow so a user can export one portable file, email it to themselves or someone else, and import it into another MCW instance without separately exporting and importing the composite library first.

The immediate user story is simple:

- build a workspace that uses user-authored composites
- export one file
- import one file on another machine
- have the workspace open and run correctly

V1 should remove the fragile "import the library first" requirement for lab-pack portability.

---

## 2. Problem

MCW already has:

- workspace document export/import
- composite-library export/import
- shareable lab pack export/import

But those surfaces are still split in a way that creates portability friction.

Today, if a workspace depends on user-authored composite library entries, the user must remember to carry and import the library document separately before importing the workspace.

That is too easy to get wrong, especially for:

- moving work between school and home
- sending a lab through email
- distributing a class artifact through LMS/file share

The current shareable lab pack does not solve this dependency problem because it packages the workspace and teaching context, but not the required user composite definitions that the workspace depends on.

---

## 3. Product Position

MCW already has a portable artifact concept: the Shareable Lab Pack.

This slice should strengthen that existing artifact rather than introduce a second bundle format.

The product answer should be:

- if you want to move or share a complete lab, use a lab pack

not:

- export a workspace
- export a library
- remember the import order
- hope the recipient reconstructs the same environment

---

## 4. Design Principles

### 4.1 One-file portability

The portable teaching artifact should remain one JSON file.

### 4.2 Bounded dependency capture

The pack should include only the user composite library entries actually required by the packaged workspace.

It must not export the user's entire composite library by default.

### 4.3 Explicit imported content

Imported composite definitions must remain explicit local content, not invisible runtime state.

### 4.4 Deterministic import

Import must load any packaged composite dependencies before validating and loading the packaged workspace.

### 4.5 No new cloud or sync model

This remains local-file portability only.

---

## 5. Required V1 Shape

1. Exporting a Shareable Lab Pack must collect the transitive set of user-authored composite library entries required by the packaged workspace.
2. The exported lab pack must embed those required composite definitions inside the pack document.
3. Importing a lab pack must load those packaged composite definitions into the local user composite library before validating and loading the workspace.
4. Imported composite definitions from a lab pack must be treated as user/imported library entries, not built-ins.
5. If the pack includes a composite id that already exists locally, MCW must resolve the collision safely and deterministically instead of silently overwriting the local definition.
6. The imported workspace must be rewritten or mapped as needed so it references the imported local composite ids after collision resolution.
7. The pack must continue to support workspaces with no user composite dependencies.
8. Existing lab packs without embedded composite dependencies must remain importable.
9. The pack must continue to be a single JSON document.
10. Import failure must remain explicit and all-or-nothing; no partial workspace import with missing composite dependencies.

---

## 6. Data Shape

The existing `ShareableLabPack` should be extended, not replaced.

Suggested bounded addition:

```ts
interface ShareableLabPack {
  version: 1;
  kind: 'mcw-shareable-lab-pack';
  metadata: { ... };
  workspace: WorkbenchDocument;
  compositeLibrary?: CompositeLibraryDocument;
  comparisonBaseline?: ComparisonBaselineDocument | null;
  verificationCases?: VerificationCase[];
  tutorial?: GuidedTutorial;
  challenge?: GuidedChallenge;
  teachingNotes?: string;
}
```

The embedded `compositeLibrary` block should include only the required user-authored entries, not built-ins and not unrelated user entries.

If implementation needs a narrower field name such as `requiredCompositeLibrary`, that is also acceptable as long as the meaning remains explicit.

---

## 7. Dependency Collection Rules

Dependency capture must be bounded and deterministic.

Export should:

1. Walk the active workspace project graph.
2. Identify all referenced composite definitions that come from the user/imported composite library rather than the built-in library.
3. Include the full transitive dependency chain for those composites if a user-authored composite depends on another user-authored composite.
4. Exclude built-in composites already guaranteed by the application.
5. Exclude unused user composite entries.

This keeps the pack portable without turning it into a full library backup.

---

## 8. Import Rules

Import should:

1. Parse the lab pack schema.
2. If embedded composite definitions are present, prepare them for local import first.
3. Resolve id/name collisions safely for imported composite entries.
4. Update any workspace references to the resolved local imported ids.
5. Build the effective registry using built-ins plus the imported composite entries.
6. Validate the packaged workspace against that effective registry.
7. Create the imported local workspace entry and load the document.

If any embedded composite definition is malformed or collides in a way MCW cannot safely resolve, import must fail clearly.

---

## 9. UX Rules

- The user should still think of this as `Export Lab Pack` / `Import Lab Pack`, not as a separate bundle system.
- If the pack contains embedded composite dependencies, MCW should make that visible in import feedback or a short summary, e.g. "Imported lab pack with 3 required reusable composites."
- The user should not need to manually import a separate library file for the common portability case.
- Existing standalone `Export Library` should remain for intentional library sharing, but it should no longer be required for normal lab portability.

---

## 10. Success Condition

This slice is successful if:

- a workspace that depends on user-authored composites can be exported as one lab pack
- that file can be emailed or moved to another machine
- importing that one file into a fresh MCW instance succeeds without a separate library import
- the imported workspace runs correctly and its required reusable composites are available locally afterward

---

## 11. Non-Goals

- No change to standalone workspace document export/import
- No removal of standalone composite library export/import
- No export of the user's full library by default
- No cloud sync or cross-device account model
- No live linking between an imported workspace and its source lab pack
- No library marketplace or package manager

---

## 12. Recommended Implementation Order

1. Add a helper that collects the required user composite library dependency set for a project.
2. Extend lab pack export to embed that dependency set.
3. Extend lab pack import to stage embedded composite definitions before workspace validation.
4. Add collision handling plus workspace remapping for imported composite ids.
5. Add regression tests for:
   - pack with no composite dependencies
   - pack with one required user composite
   - pack with transitive user composite dependencies
   - pack import into a target instance that already has a conflicting local composite id

---

## 13. Why This Matters

MCW already lets users build machines.
It already lets them save machines.
It already lets them export reusable composites.

But that is still not the same thing as trustworthy portability.

For a teacher, student, or solo user moving between machines, "one file that actually works when opened elsewhere" is the honest threshold.

This slice reaches that threshold without inventing a new platform layer.
