# GUIDE-STAGE-SNAP-EXPANSION-V1

Status: Implemented locally, pending push
Date: 2026-04-04

## Intent

Expand the existing guide-snap and drag-guide system so module placement can also align to stage-label anchors and group-box structure, not just guide rails.

## Required V1 Shape

1. Keep the slice module-placement only.
2. Stage labels act as lightweight snap anchors.
3. Group boxes contribute edge and center alignment lines.
4. Drag-time alignment guides mirror the same new snap targets.
5. No new persistence model beyond the existing stage-label and group-box metadata.
6. No solver, no semantic grouping, and no wire snapping.

## UX Rules

- Guide snap should continue to feel like soft resistance, not a hard constraint.
- Drag guides should remain temporary and low-noise.
- Existing guide-rail snapping must remain intact.

## Non-Goals

- No snapping of notes or arbitrary text blocks.
- No auto-layout changes.
- No box-contained-layout semantics.

## Success Condition

Users can line modules up against stage markers and group-box structure with the same light-touch assistance already available for guide rails.
