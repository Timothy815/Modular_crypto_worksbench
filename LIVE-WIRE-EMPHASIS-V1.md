# Live Wire Emphasis V1

Last updated: April 11, 2026

Status: Shipped on `main`.

## Purpose

Extend the Live Readability north-star lens by making active signal paths
visually distinguishable from idle paths at a glance.

Together with `LIVE-SIGNAL-CHIPS-V1.md`, this completes the first
Experiential North Star Live Readability move:

> State is readable while the machine is running.
> MCW-specific target: signal values visible without opening Analyze;
> **active paths distinguishable from idle ones.**

## Core Change

After any successful execution, classify each wire as live or idle
based on whether the source module produced an output on that port.

- **Live wire**: source output exists in `execution.outputsByModuleId`
  → subtle domain-glow boost, full opacity — the path is carrying data
- **Idle wire**: execution present but source output absent
  → reduced opacity (≈0.28), no glow — the path is dormant

When `execution` is null (no run yet or validation blocking execution),
no live/idle emphasis is applied — the canvas is in a neutral, static state.

## Priority Rules

Existing emphasis states remain authoritative and override live/idle:

| State | Overrides live/idle? |
|---|---|
| `connection-group-selected` | Yes (overlay layer, separate rendering path) |
| `connection-group-emphasized` | Yes (`opacity: 1` appears later in CSS) |
| `connection-group-trace` | Yes (`opacity: 1` appears later in CSS) |
| `connection-group-invalid` | Coexists — invalid + idle combines naturally |
| `connection-group-dimmed` | Yes (`opacity: 0.11` appears later in CSS) |

## Scope

This contract is limited to:
- `src/ui/components/workbench-panel.tsx` — class computation in `renderConnection`
- `src/App.css` — live and idle CSS rules

No engine changes. No store changes. No new props.

## Success Criteria

This slice is successful when:
- a user can read which paths are carrying data and which are dormant,
  without entering Analyze or hovering anything
- changing a connection or parameter updates the live/idle state immediately
- selected, emphasized, and trace states remain clearly dominant over live/idle
- the canvas does not feel cluttered or overloaded with the new visual layer
