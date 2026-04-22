# ELASTIC-WORKSPACE-EXTENTS-V1

Status: Proposed

Owner: Codex

Date: 2026-04-22

---

## 1. Purpose

Make the MCW workspace feel effectively unbounded for normal authoring so larger systems can be laid out without hitting a hard-feeling bottom or edge.

The goal is not literal mathematical infinity.
The goal is that a user building a meaningfully larger machine should not feel forced to compress structure because the canvas runs out of room.

---

## 2. Why Now

Recent user testing on a first self-authored toy SPN found:

- the authoring model held up under a more complex build
- there were no major composition friction points
- the first clear workspace-level limit was spatial
- the canvas stopped feeling expandable far sooner than expected vertically

That is a different class of problem from earlier large-workspace reading/scanning concerns.

The current workbench now has:

- minimap
- stage labels
- group boxes
- landmarks
- tidy/layout support

Those help orientation.
But they do not solve a workspace that feels physically bounded during authoring.

---

## 3. Problem

Today the workspace size is effectively governed by current content bounds plus a bounded visible surface model in `src/ui/components/workbench-panel.tsx`.

That is good enough for small and medium builds.
It is not good enough once a user starts:

- separating forward and reverse paths clearly
- leaving conceptual space between key schedule and round logic
- building multi-round systems with teaching-friendly spacing

The result is that authors start making layout compromises for the canvas rather than for the machine.

That is the opposite of the intended product feel.

---

## 4. Product Goal

MCW should feel more like a modular machine bench than a finite whiteboard.

For normal usage, the workspace should be:

- spacious enough to lay out larger systems naturally
- elastic enough that moving outward remains easy
- stable enough that navigation aids still make sense

This slice is about authoring freedom, not decorative scale.

---

## 5. Design Principles

### 5.1 Effectively unbounded, not literally infinite

The implementation may still use finite numbers internally.
But the user should not encounter an obvious “the workspace stops here” boundary during normal large-workspace work.

### 5.2 Preserve current navigation tools

Minimap, landmarks, stage labels, group boxes, and panning should continue to work.

### 5.3 No workspace-chaos by default

More space should not make orientation worse by itself.
This slice should expand practical extents, not remove all visual anchoring.

### 5.4 Keep the interaction model simple

The user should not need to learn a new workspace mode or manually manage pages/canvas tiles.

---

## 6. Required V1 Shape

1. The workbench must allow authors to continue laying out modules significantly farther downward and outward than the current practical limit.
2. The canvas extents must expand elastically from authored content rather than feeling pinned to a narrow bounded surface.
3. Dragging a module, stage label, annotation, or group box toward the current outer edge must continue to reveal more available workspace instead of trapping the author at a hard-feeling boundary.
4. Pan and zoom behavior must remain stable as workspace extents grow.
5. The minimap must continue to represent the active authored area correctly after extents expand.
6. Tidy/layout actions must still function on larger spread-out workspaces.
7. Save/load, import/export, and lab-pack flows must preserve the authored positions exactly.
8. Existing small and medium workspaces must not feel materially different or “lost in space.”

---

## 7. Bounded Scope

This slice should focus on practical workspace extents only.

Primary surfaces:

- `src/ui/components/workbench-panel.tsx`

Likely supporting surfaces:

- `src/ui/workbench-document.ts`
- tests covering workspace panel behavior or document persistence if needed

This slice should not broaden into:

- a full navigation redesign
- a new minimap milestone
- page/section-based canvases
- multi-canvas workspaces
- automatic semantic layout
- large-workspace styling refresh

---

## 8. Non-Goals

Do not include:

- literal infinite-coordinate space as a product promise
- new landmarks/minimap feature families
- auto-generated stages or regioning
- broad multi-window follow-on work
- generic “CAD editor” behavior
- hidden recentering or automatic content relocation that moves the user’s layout unexpectedly

---

## 9. Success Criteria

This slice is successful if:

- a user can build and spread out a larger system like a multi-round toy cipher without hitting the old practical bottom/edge constraint
- the workspace still feels stable and navigable
- the minimap still behaves coherently
- no existing smaller workspaces regress in persistence or usability

---

## 10. Recommended Implementation Direction

The likely V1 direction is:

1. decouple practical workspace extents from the currently tight visible-surface assumptions
2. compute larger elastic world bounds around content with generous outward slack
3. allow those bounds to continue growing as authored content approaches the current edge
4. keep the minimap keyed to the authored world bounds rather than the old fixed-feeling surface

The important point is not the exact math.
The important point is that the user can keep building without feeling the workspace floor.

---

## 11. Verification Scenarios

Verify with at least:

1. a larger authored machine laid out vertically with separated forward path, key schedule, and reverse path
2. a horizontally spread multi-branch workspace
3. a small workspace to ensure no regression in normal navigation feel

For the larger authored case, the user should be able to:

- drag modules farther down and outward
- continue panning naturally
- still use the minimap to recover orientation
- save, reload, and find the same layout intact

---

## 12. Why This Matters

MCW is increasingly succeeding at the machine-authoring problem itself.
That means spatial constraints matter more now than they did when smaller demos dominated usage.

If the workspace feels bounded, the user starts designing for the canvas.
If the workspace feels elastic, the user can design for the machine.

That is the right next pressure point to relieve.
