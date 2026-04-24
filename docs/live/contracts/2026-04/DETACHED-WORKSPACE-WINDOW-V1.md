# DETACHED-WORKSPACE-WINDOW-V1

Status: Proposed

Owner: Codex

Date: 2026-04-24

---

## 1. Purpose

Allow one open workspace tab to be displayed in a separate browser window while staying live with the main app, so an author can work on one part of a system and watch its place in a larger system at the same time.

---

## 2. Why Now

Tabbed workspaces solved one class of navigation friction:

- keep multiple workspaces open
- switch between them without losing context

Recent authoring feedback found the next limitation:

- the author wants one workspace visible beside another
- especially for workflows like key schedule surgery versus whole-cipher integration
- switching tabs is still too serial for that kind of iteration

The right next step is not generic multi-app independence.
It is one bounded detached workspace window.

---

## 3. Problem

Today, MCW has:

- open workspace tabs in the main shell
- detached palette / inspector / learning windows
- local persistence of the full authoring state

But it does not have:

- a second live workbench surface for a workspace

So when an author wants to:

- edit a reusable/key-schedule workspace
- keep the consuming workspace visible at the same time
- observe the effect immediately

they still have to work by tab switching and memory.

---

## 4. Product Goal

One workspace tab should be able to open in a separate window as a live workbench surface.

That detached workspace should:

- remain synced with the host app
- show the same current graph state
- allow normal workbench editing
- not become an independent competing app instance

The mental model should be:

- same machine
- second bench view
- one source of truth

not:

- duplicate app
- duplicate persistence owner
- conflicting save authority

---

## 5. Required V1 Shape

1. A workspace tab can be opened in a new window from the main shell.
2. The detached workspace window shows one chosen workspace as a live workbench surface.
3. The main app remains host-authoritative for state.
4. The detached workspace window must not independently persist or own canonical workspace state.
5. Edits made in the detached workspace must update the host app live.
6. Edits made in the host app must update the detached workspace live.
7. V1 supports exactly one detached workspace window at a time.
8. The detached workspace must preserve the normal workbench authoring model:
   - canvas
   - ports
   - wires
   - inspector/palette interactions as currently available in the host shell
9. Closing the detached window must not lose work or corrupt the host session.
10. During normal editing, host-authoritative state changes must remain visually in sync without stale workspace state lingering after the next snapshot/command cycle.
11. The detached workspace is locked to one explicit `projectId` for its lifetime unless the user explicitly closes and reopens it for a different workspace.
12. If the host window closes, reloads, or navigates away while the detached workspace is open, the detached workspace must enter a clear disconnected state rather than pretending to remain authoritative.

---

## 6. Architectural Rule

V1 must be host-authoritative.

That means:

- the main app owns the live reducer state
- the detached workspace window is a synchronized remote surface
- communication happens through the existing detached-window style channel model or an equivalent bounded bridge
- the detached workspace routes destructive authoring actions to the host instead of applying canonical reducer mutations locally
- the detached workspace boot mode must bypass normal local persistence writes so it never writes competing state to the shared localStorage keys

V1 must explicitly avoid:

- two independent editors both writing canonical workspace state to localStorage
- split-brain tab ownership
- race-prone “last writer wins” persistence behavior

If host and detached edits arrive near-simultaneously, the host-authoritative reducer order wins. V1 does not attempt collaborative conflict resolution beyond that rule.

---

## 7. Bounded Scope

Primary files likely in scope:

- `src/App.tsx`
- `src/ui/multi-window.ts`
- `src/ui/detached-window-orchestration.ts`
- `src/ui/components/detached-panel-window.tsx` or a sibling detached workspace window surface
- supporting CSS
- focused tests for the detached workspace window state model

This slice may require a new query-param boot mode for detached workspaces.

This slice should reuse the current detached-window orchestration ideas where possible instead of inventing a second unrelated windowing system.

---

## 8. Non-Goals

This slice should not:

- create a fully independent second MCW app instance
- allow arbitrary multi-window workspace shells
- detach composite drilldown in the same pass
- add cross-window freeform wiring
- add “workspace as composite boundary” semantics
- redesign the current tabbed workspace strip
- replace persistence architecture broadly

---

## 9. Key UX Constraints

1. Opening a workspace in a new window must be explicit and must come from one named trigger location in V1: the main-shell `Windows` menu.
2. The detached workspace must show a persistent visible session-state indicator in its header chrome that it is a live view of the same host session, not a copied fork.
3. V1 should prefer clarity over ambition:
   - one workspace window
   - one workspace at a time in that window
   - stable return/focus controls
4. The detached workspace should not silently mutate which workspace it represents unless the user explicitly retargets it.
5. Transient UI state such as quick-add menus, hover states, and context menus should remain local to the detached window rather than being synchronized as shared session state.

---

## 10. Acceptance

This slice is successful when:

- a user can open a workspace tab in a new window
- the detached workspace shows live state from the host session
- edits in either place remain coherent
- there is no persistence split-brain
- the workflow supports “edit here, watch there” for larger systems
- the result feels like a bounded extension of the current shell, not a second app bolted on

---

## 11. Explicit Review Standard

This contract passes review if reviewers can agree that:

- the slice is solving the real product need
- the host-authoritative rule is strong enough
- the scope is bounded tightly enough to avoid accidental window-manager sprawl
- the proposal supports live dual-workspace authoring without introducing ambiguous ownership of state
