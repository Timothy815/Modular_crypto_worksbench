# Manual Operator Guidance V2

Last updated: June 7, 2026
Status: Proposed

---

## Problem Statement

`OPERATOR-MANUAL-AND-LEARNING-DISCOVERY-V1` corrected the manual's information architecture.
The manual now has the right top-level shape, but it is still more readable than operational.

For a new user, the highest-value questions are usually:

- what should I open first?
- what should I click next?
- which surface should I use for this task?
- why did the expected action not work?

V2 exists to make the manual behave more like an operator guide and less like a passive reading surface.

---

## Scope

### In scope

- adding stronger intent-based entry points near the top of the manual
- adding compact `Open Next` / `Use This When` routing blocks to high-value entries
- converting key workflow entries from prose-first to procedure-first presentation
- adding a bounded troubleshooting section for common first-user failure cases
- improving manual scanability without turning it into a large prose expansion
- preserving V1 structure while making it more action-guiding
- tests for new rendering behavior where appropriate

### Out of scope

- rewriting every manual entry
- building new launch/deep-link infrastructure
- redesigning Atlas
- adding personalized onboarding or progress tracking
- turning the manual into a full curriculum engine
- replacing Quick Start

---

## Required Product Outcome

After this slice, a new user should be able to:

1. identify their intent quickly
2. see the next concrete board or surface to open
3. follow short procedures instead of decoding long paragraphs
4. recover from common early confusion without leaving the manual

---

## Required Product Behavior

### 1. The manual must expose intent gateways near the top

V2 must add a compact intent layer near the top of the manual, under `Start Here`.

Required intents:

- `I want a first tour`
- `I want to build`
- `I want repair practice`
- `I want to learn AES`
- `I want to learn ECC`
- `I want to verify or export`

Each intent must route to one named manual entry and at least one named board or learning surface.

### 2. High-value entries must include explicit next-step routing

The most important entries must include a compact route block that answers:

- `Use This When`
- `Open Next`
- `Then`
- `If you want repair practice`

Equivalent labels are acceptable if they preserve the same meaning.

Required minimum coverage:

- `Where To Begin`
- `Atlas, Demos, Tutorials, And Challenges`
- `How To Create A Composite`
- `How To Create An Iterator From A Round`
- `How To Use The Verification Station`
- `How To Export To Python And Prove Parity`
- `Where To Go For AES`
- `Where To Go For ECC`
- `Where To Find The Flagship Labs`

### 3. Key workflows must become procedure-first

For the highest-value operator tasks, the visible structure should privilege short procedures over long explanation.

Required entries:

- create composite
- create iterator
- create clocked iterator
- save workspace / save as / save version
- use reusable library / promote reusable
- use verification station
- export to Python / parity

These do not need long explanations.
They do need clear step order and clear action names.

### 4. The manual must include bounded troubleshooting

V2 must add a bounded troubleshooting area for high-frequency early-user friction.

Required troubleshooting entries:

- `Why can't I create a composite?`
- `Why is Challenge empty on this board?`
- `Why is Save not writing to a file?`
- `Why is my reusable not portable?`
- `Why does exported Python not match the board?`

These should be concise diagnosis-and-next-action entries, not essays.

### 5. Visual emphasis must reflect operator value

Visible emphasis inside entries must highlight only:

- menu paths
- mode names
- panel names
- action labels
- named boards, tutorials, challenges, and labs

The manual must not reintroduce generic visible keyword inventories or vocabulary-style highlighting.

### 6. The manual must reinforce existing onboarding surfaces

The manual must complement Quick Start and Atlas instead of competing with them.

The intended relationship is:

- Quick Start = first-session push
- Manual = task guidance and route-finding
- Atlas = discovery map of learning content

V2 should strengthen those handoffs, not blur them.

---

## UI / UX Guidance

### Entry structure

Preferred structure for high-value entries:

1. one-sentence purpose
2. short numbered stops or procedure
3. compact route block for what to open next

### Route blocks

Route blocks should be visually distinct from body prose.
They should read more like operator cues than like documentation paragraphs.

### Troubleshooting entries

Troubleshooting entries should use a simple pattern:

- likely cause
- what to check
- what to do next

---

## Acceptance Criteria

This slice is successful only if all of the following are true:

1. the manual exposes all six required intent gateways near the top
2. each required intent names at least one manual destination and one named board or surface
3. each required high-value entry includes an explicit route block or equivalent next-step cue
4. the five required troubleshooting entries exist
5. the manual does not reintroduce visible generic keyword lists
6. workflow entries for composite, iterator, verification, and export/parity read as short procedures rather than paragraph-only explanations
7. a new user can identify what to open next for one first-tour case, one AES case, and one export/parity case by human review at release

---

## Suggested Implementation Shape

1. extend the manual content model only as much as needed to support route blocks or intent cards cleanly
2. add the intent gateway area under `Start Here`
3. convert the required workflow entries to procedure-first shape
4. add bounded troubleshooting entries
5. render route blocks distinctly from ordinary body text
6. verify manual rendering and search behavior still work

This will likely require changes in:

- `src/ui/manual-content.ts`
- `src/ui/components/manual-window.tsx`
- `src/App.css`
- `src/ui/manual-support.test.ts`
