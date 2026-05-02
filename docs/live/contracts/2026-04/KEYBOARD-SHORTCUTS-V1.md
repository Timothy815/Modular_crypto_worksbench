# KEYBOARD-SHORTCUTS-V1

## Why this slice exists

MCW is starting to behave like a real workbench instead of a static teaching page. As students and teachers spend more time:

- selecting and moving modules
- duplicating repeated structures
- stepping traces and ticks
- switching between Build, Analyze, Guide, and Challenge
- running and rerunning machines

mouse-only interaction becomes unnecessarily slow.

This slice adds a bounded first layer of keyboard shortcuts that speeds up repeated work without turning MCW into a hidden-command power-user tool.

The goal is not “more shortcuts.” The goal is:

- faster repeated authoring
- faster repeated inspection
- faster repeated classroom demonstration
- no reduction in conceptual visibility

## Product position

Keyboard shortcuts in MCW should be:

- accelerators for already-visible actions
- discoverable from the UI
- safe in teaching contexts
- consistent with workbench mental models

They should not:

- become secret knowledge
- bypass important conceptual steps
- trigger unpredictably while students are typing
- create mode-specific surprises that make the tool harder to learn

## V1 scope

V1 should cover only high-value, low-ambiguity shortcuts.

### 1. Selection and editing

- `Delete` / `Backspace`
  - delete current selected module, wire, or selected workspace structure when deletion is already possible from visible UI
- `Escape`
  - clear current selection
  - dismiss armed or transient UI states when applicable
- arrow keys
  - nudge selected modules by a small grid-safe amount when the canvas has focus and the user is not typing in an editor
- `Cmd/Ctrl + D`
  - duplicate current selected module or selected structure using existing duplicate behavior

### 2. Core workbench commands

- `Cmd/Ctrl + C`
  - copy current selected workspace structure when a copyable selection exists
- `Cmd/Ctrl + V`
  - paste current workspace clipboard content into the active project
- `Cmd/Ctrl + Z`
  - undo
- `Cmd/Ctrl + Shift + Z`
  - redo
- `R`
  - run the current machine when the workbench surface has focus and no text input is active

### 3. Ticked / trace stepping

- `Space`
  - play/pause tick playback only in contexts where tick playback is already visible and active
- `[` and `]`
  - previous / next trace step or tick when the active surface is already in a stepped analysis context

### 4. Mode switching

V1 may include a very small set of mode shortcuts only if they are surfaced visibly in the mode controls.

If included:

- `B` -> Build
- `A` -> Analyze
- `G` -> Guide
- `C` -> Challenge

If this creates too much collision or ambiguity in implementation, mode switching should wait for V2.

## Non-goals

V1 should not include:

- arbitrary one-letter shortcuts for many panels
- hidden module-authoring macros
- auto-build or auto-repair actions
- keyboard-only wiring workflows
- pack import/export shortcuts
- shortcut customization
- a global command palette
- shortcuts that trigger while typing in textareas, parameter fields, CSV editors, or code-like inputs

## Required behaviors

### 1. Visible action first

Every V1 shortcut must map to an already-visible UI action or state transition. Shortcuts should accelerate existing behavior, not introduce new invisible behavior.

### 2. Typing safety

Shortcuts must not fire while focus is inside:

- text inputs
- textareas
- parameter editors
- CSV editors
- rename fields
- any other editable field

### 3. Context safety

A shortcut should only fire when its meaning is unambiguous in the current focused surface.

Examples:

- `R` should not rerun while the user is typing in a field
- `Space` should not both scroll the page and toggle playback unpredictably
- `[` and `]` should do nothing if there is no stepped trace or tick context

### 4. Classroom discoverability

V1 should expose shortcut hints in one or more of these places:

- button tooltips
- menu item labels
- visible mode/action hints

At minimum, high-value shortcuts such as Run, Duplicate, Undo, Redo, and Delete should be visibly hinted somewhere in-product.

### 5. Honest no-op behavior

If a shortcut is pressed in a context where it does not apply, MCW should do nothing rather than guess.

## Visual / UX shape

V1 should keep the UX simple.

### Option A: tooltip-first

Add shortcut hints to existing buttons/tooltips for:

- Run
- Duplicate
- Delete
- Undo / Redo
- Copy / Paste

This is the minimum acceptable discoverability layer.

### Option B: lightweight shortcuts help

Optionally add a small “Keyboard Shortcuts” help section in an existing help/manual surface. This should be a compact reference, not a new subsystem.

## Educational guardrails

Keyboard shortcuts should reinforce the workbench, not hide it.

Good shortcut examples:

- duplicate a selected round
- rerun after a wiring change
- step forward through analysis
- clear a mistaken selection

Bad shortcut examples:

- auto-build a full cipher stage
- silently repair a challenge
- trigger opaque automation that students cannot see or explain

The guiding rule:

V1 shortcuts should reduce friction around repeated visible actions, not replace understanding with speed.

## Success criteria

This slice is successful if:

1. Teachers and advanced students can move faster through repeated workbench actions.
2. Beginners are not penalized for not knowing shortcuts.
3. Shortcut behavior feels predictable and safe.
4. The UI reveals that shortcuts exist instead of hiding them.
5. The workbench feels more like a tool, not more like a game with secret controls.

## Likely implementation direction

V1 should likely use:

- a centralized keyboard shortcut handler in the UI layer
- focus guards that detect editable inputs and bail out
- existing reducer actions and command handlers rather than shortcut-specific logic forks
- lightweight label plumbing so buttons/tooltips can show shortcut hints

The implementation should prefer:

- one place to register shortcut bindings
- one place to enforce typing/context guards
- no per-component ad hoc keyboard listeners unless truly necessary

## Open design questions for later

These should not block V1, but should be tracked:

- whether mode switching belongs in V1 or V2
- whether a compact shortcuts reference should live in Manual, Guide, or Workbench help
- whether `Enter` should commit rename/editor actions more consistently across the app
- whether there should later be a command palette for teachers / power users
