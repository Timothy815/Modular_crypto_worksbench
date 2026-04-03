# SHAREABLE-LAB-PACKS-V1

Status: Shipped

Owner: Codex

---

## 1. Purpose

Give instructors and advanced users a bounded way to package and distribute a complete MCW lab without introducing a cloud backend, account system, or public gallery.

The goal is not "social features."
The goal is portable, teacher-friendly, verifiable lab distribution.

V1 should let a user export a self-contained lab pack that another user can import into MCW and run immediately.

This is the first bounded distribution step after `v2.1.0`.

---

## 2. Product Position

MCW now solves:

- how to build a machine
- how to inspect it
- how to verify it
- how to export it

The next product-level question is:

- how to distribute a verified, teachable machine to another person cleanly

V1 should answer that with explicit portable lab packs, not a hosted gallery.

---

## 3. V1 Design Principles

### 3.1 Portable, not hosted

V1 must use explicit export/import artifacts.
No server, no accounts, no remote content fetching, no cloud library.

### 3.2 Whole-lab packaging

The unit of sharing is not just a raw project JSON.
It is a bounded teaching package containing the project and the context needed to use it.

### 3.3 Trust-preserving

Shared packs must preserve the same trust story MCW already has:

- visible machine
- visible verification cases
- visible tutorial/challenge framing
- explicit imported content

### 3.4 Deterministic and inspectable

Import must be explicit and reversible.
Users should know what entered their workspace.

### 3.5 Bounded scope

This is not a public gallery, not a publishing platform, and not a collaboration backend.

---

## 4. Required V1 Shape

1. MCW must support exporting a **Shareable Lab Pack** file from the current workspace.
2. MCW must support importing that lab pack back into another local MCW instance.
3. The lab pack must be a single JSON document, not a multi-file bundle.
4. The imported pack must create or add a local user workspace entry rather than mutating built-in demos.
5. The imported pack must preserve the authored project and layout.
6. The imported pack must preserve any attached tutorial, challenge, and verification context included in the pack.
7. The imported pack must make the source clear to the user, e.g. "Imported Lab Pack".
8. Import must be explicit from an `Import/Export` or `Resources` surface, not hidden behind URL magic in V1.
9. V1 must use deterministic schema validation for the pack document before import.
10. V1 must reject malformed packs clearly and refuse partial import.

---

## 5. Lab Pack Contents

V1 lab packs should contain only the minimum bounded set needed for distribution:

- metadata
  - id
  - title
  - summary
  - author/source note
  - created/exported timestamp
  - pack version
- workspace document
  - project
  - layout
  - annotations
- optional comparison baseline
- optional verification cases
- optional attached tutorial
- optional attached challenge
- optional teaching notes / instructor note block

V1 must not attempt to export the entire user library or all local storage state.

---

## 6. Data Shape

V1 should introduce a dedicated packed document type rather than overloading `WorkbenchDocument`.

Suggested shape:

```ts
interface ShareableLabPack {
  version: 1;
  kind: 'mcw-shareable-lab-pack';
  metadata: {
    id: string;
    title: string;
    summary: string;
    author?: string;
    source?: string;
    exportedAt: string;
  };
  workspace: WorkbenchDocument;
  comparisonBaseline?: ComparisonBaselineDocument | null;
  verificationCases?: VerificationCaseDocument[];
  tutorial?: GuidedTutorial;
  challenge?: GuidedChallenge;
  teachingNotes?: string;
}
```

Exact field names may differ, but the separation between metadata and packaged content should remain explicit.

---

## 7. Verification Context

Verification context is one of the main reasons this feature matters.

If the current workspace has:

- an attached comparison baseline
- imported known-answer cases
- challenge target expectations

those should be included in the pack when available and valid for export.

This makes the pack a teachable verified machine rather than just a diagram.

---

## 8. Import Behavior

Import should:

1. validate the pack schema
2. validate the packaged project
3. create a new local user workspace entry
4. attach included tutorial/challenge/verification content
5. label the result as imported content

V1 must not silently overwrite an existing workspace with the same id.
If there is a collision, MCW should mint a safe local id or prompt for a renamed import path if that is already easy inside the existing model.

---

## 9. Export Behavior

Export should let the user package the active workspace as a lab pack.

The export action should be easy to discover from the existing workbench shell.

The export should be framed as:

- shareable lab
- portable teaching artifact
- includes verification/tutorial/challenge context when present

not merely "save JSON."

---

## 10. UX Rules

- The user must be able to understand what a lab pack is in one sentence.
- Export and import should use explicit labels like `Export Lab Pack` and `Import Lab Pack`.
- Import errors must be concrete:
  - malformed file
  - unsupported version
  - invalid project
  - unsupported attached content
- Imported content should be visually identifiable as user/imported content, not mistaken for built-in demos.
- V1 should remain lightweight enough that instructors can distribute a lab pack by email, LMS upload, or file share.

---

## 11. Success Condition

This slice is successful if:

- one instructor can export a lab with verification/tutorial/challenge context
- another user can import it into a fresh MCW instance
- the imported lab appears as a local user workspace
- the user can immediately run the lab and see the preserved teaching/verification context

---

## 12. Non-Goals

- No cloud hosting
- No public gallery or browsing service
- No accounts, auth, or sharing permissions
- No URL-based deep-link import in V1
- No live synchronization between users
- No collaborative editing
- No arbitrary remote content fetch
- No pack marketplace

---

## 13. Why This Matters

MCW is now strong enough that the bottleneck is not only building machines.
It is circulating them.

This slice would let:

- teachers distribute verified labs to students
- students hand work back to instructors as explicit artifacts
- peers exchange machines without requiring localStorage spelunking

It is the smallest honest step from "workbench" toward "platform."
