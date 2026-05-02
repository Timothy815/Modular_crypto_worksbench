# Live Signal Chips V1

Last updated: April 11, 2026

Status: Shipped on `main`.

## Purpose

Make the machine's live state visible directly on the canvas — without requiring the user to open Analyze.

This is the first direct implementation move toward the Experiential North Star: the workbench should feel like working on a live machine, not assembling a static diagram.

## Product Problem

MCW already executes automatically on every project change. The results are always available. But they are only visible inside the Analyze tab, behind a separate panel interaction.

That means the workbench canvas currently reads as a static diagram even when the machine is actively producing results. The data is flowing but nothing on the canvas shows that it is.

This is the gap between how MCW currently feels and how a live machine should feel.

## Core Change

After any successful execution, show compact value chips at each module's output port anchors — directly on the canvas, alongside the existing port labels.

- **Bits signals**: formatted as a binary string, truncated at 8 bits with `…`
- **Symbol signals**: formatted as text, truncated at 10 characters with `…`
- **Single-bit control values**: just `0` or `1`
- **Empty signals**: show `∅`

Chips clear automatically when execution is unavailable (validation errors, no execution result). They reappear immediately after a successful run.

## What This Is Not

This is not a replacement for Analyze. Analyze still provides:
- full signal values
- step-through trace
- per-tick inspection
- probed module history

Signal chips are a lightweight always-visible readout of the current execution result. They are complementary, not competing.

## Scope

This contract is limited to:
- `src/ui/signal-chip-format.ts` — pure signal formatting helper
- `src/ui/components/workbench-panel.tsx` — chip rendering at output port anchors
- `src/App.css` — chip styles

No engine changes. No store changes. No new persistence.

## Behavior Rules

1. **Chips appear at output port anchors only** — input port anchors are not modified.

2. **Chips render when `execution !== null`** — they clear immediately when the execution is unavailable.

3. **Domain-aware styling** — bits chips carry a blue-accent tint; symbol chips carry an orange-accent tint, matching the existing wire domain color conventions.

4. **Pointer-events: none** — chips must not interfere with wire creation or port interaction.

5. **Truncation is non-destructive** — full values remain visible in Analyze and on hover.

6. **Opt-out toggle available** — a small canvas-level toggle allows power users to hide chips when they prefer a quieter canvas.

7. **Works in ticked mode** — shows the execution result for the current tick when ticked execution is active.

## Success Criteria

This contract is successful when:
- a user can tell what their machine is producing at each output port without switching to Analyze
- changing a parameter produces visibly different chip values
- adding or removing a connection causes chips to update
- the canvas still reads cleanly when chips are present — they add information without visual chaos

## Experiential North Star Alignment

This slice closes the most direct gap in the north star:

> State is readable while the machine is running.
> MCW-specific target: signal values visible without opening Analyze; active paths distinguishable from idle ones.

The canvas moves from "run button + go to Analyze" toward "the machine shows you what it is doing."
