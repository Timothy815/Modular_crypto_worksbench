# WIRE-AUTHORING-CONFIDENCE-V1

Last updated: April 5, 2026

---

## Purpose

Define a bounded wiring-ergonomics slice for making connection authoring and rewiring feel more explicit and trustworthy.

This is an interaction-feedback pass.
It is not a routing change and not a change to connection validation rules.

---

## Problem

MCW already supports:
- direct wire selection
- rewiring from occupied inputs
- valid / replace / invalid target states
- wire hover labels

But while dragging a connection, the current feedback is still too quiet:
- the armed source does not feel strong enough
- valid and replacement targets can be missed in dense graphs
- blocked targets do not always feel decisively blocked
- the user has to infer too much from subtle port color alone

The missing piece is confidence, not capability.

---

## Goal

Add a bounded interaction pass that makes connection authoring easier to read in real time:
- stronger armed-source feedback
- clearer valid / replace / blocked target cues
- better live copy about what the current hovered target will do

---

## Required V1 Shape

1. V1 must keep the current connection rules exactly as they are.
2. V1 must make the armed output port more visually explicit.
3. V1 must strengthen valid, replace, and blocked target states on input ports.
4. V1 must provide clearer live copy while a connection is pending:
   - source endpoint
   - whether the user is wiring or rewiring
   - what the currently hovered target will do, when available
5. V1 should surface at-a-glance counts of available valid and replacement targets while wiring.
6. V1 must stay compatible with dense workspaces and not introduce visual clutter when no connection is pending.

---

## Non-Goals

Do not include:
- new connection semantics
- multi-wire authoring
- automatic target selection
- snapping behavior changes
- routing behavior changes
- new persistence

---

## Exit Condition

This contract is complete when:
- dragging a connection feels more deliberate
- the user can tell at a glance which targets are valid, replaceable, or blocked
- rewiring feels less ambiguous in dense workspaces
- the slice stays bounded to interaction feedback only
