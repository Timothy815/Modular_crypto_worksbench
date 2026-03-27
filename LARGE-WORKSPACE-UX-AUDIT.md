# Large Workspace UX Audit

Last updated: March 27, 2026

Status: Completed as part of `LARGE-WORKSPACE-UX-TRIAGE-V1`.

## Purpose

This audit records the concrete large-workspace usability finding that justified the bounded implementation in the current slice.

## Representative Workspaces Reviewed

- `Visible Block Chaining`
- `Recursive Key Schedule`
- `Visible Tamper Check`
- `Visible Authenticated Encryption`
- `Visible Secure Handshake`

## Review Protocol

For each workspace, the review checked whether it was easy to:
- locate the final output from the initial viewport
- trace backward from the output to the first key or protocol-material source
- identify the major visible substructures without repeated manual search

## Result

The current workbench still holds up.
Large workspaces are not collapsing under their own size.

The strongest confirmed friction is:
- **orientation recovery across wide horizontal graphs**

In practice, the largest demos often place the decisive output or late verification result far to the right of the initial viewport.
That means the first reading step can require manual scrolling before the user can even see where the machine ends.

This does not mean the canvas model is wrong.
It means larger graphs need a small amount of explicit navigation help.

## What Did Not Need Immediate Redesign

The audit did **not** justify:
- a minimap-first milestone
- zoom/pan feature expansion
- React Flow migration
- canvas subgraph folding
- broad visual redesign

The existing workbench already has:
- explicit structure
- annotations
- tutorial focus
- tidy layout
- stable graph interaction

Those were sufficient to avoid a larger rewrite.

## Chosen Bounded Fix

The bounded fix for this slice is:
- **Workspace Landmarks**

That fix adds explicit jump targets for larger graphs so users can move directly to:
- protocol/timing context modules
- major source modules
- output modules

This improves orientation without hiding structure or changing the workbench’s explicit-machine model.

## Why This Fix

This fix was chosen because it:
- addresses the confirmed friction directly
- stays inside the existing scrollable-canvas model
- avoids generic node-editor feature sprawl
- gives students and reviewers a faster way to regain orientation in larger demos

## Outcome

Large-workspace usability is now confirmed as a real pressure point, but only at the level of orientation support.

The current bounded response is enough for now:
- no broader canvas-navigation milestone is justified yet
- the project should absorb this fix and only escalate further if real pressure remains afterward
