# Parameter Inspector Refactor V1

Last updated: May 14, 2026
Status: Shipped

---

## Purpose

Define the next bounded architecture-protection slice for the inspector after the shipped analysis/output extraction and structured-editor extraction passes.

The goal is to reduce the remaining size and responsibility of
`src/ui/components/parameter-inspector.tsx` without changing shipped inspector behavior.

This is not an inspector redesign.
This is not a new analysis feature pass.
This is not a CSS refresh.
This is an extraction and responsibility-splitting slice.

---

## Product Problem

`parameter-inspector.tsx` is still a major drag coefficient even after two successful bounded extractions:

- `docs/archive/contracts/2026-04/INSPECTOR-STRUCTURED-EDITOR-EXTRACTION-V1.md`
- `docs/archive/contracts/2026-04/INSPECTOR-ANALYSIS-AND-OUTPUT-EXTRACTION-V1.md`

The file is still over 3,000 lines and still directly owns too many concerns at once:

- inspector shell / tab chrome
- configure-tab stage inspection card
- module identity and role summary
- rename / duplicate / replace / bypass / rotate / unzip / delete actions
- replacement-candidate search and preview
- selected-sibling parameter comparison summary
- a very large param-field rendering switch for ordinary fields and a few remaining special cases
- port layout / orientation surfaces

The remaining problem is no longer "extract the obvious big families." That already happened.

The remaining problem is that the configure-tab body still behaves like a subproduct living inline inside the inspector file. Future maintenance on:

- parameter editing
- module actions
- replacement flows
- layout/port controls
- live stage inspection

still requires digging through a monolith that mixes orchestration with rendering.

---

## Core Question

What is the smallest extraction that meaningfully reduces the size and responsibility of
`parameter-inspector.tsx` by moving the remaining configure-tab family into dedicated local
components while preserving shipped behavior exactly?

---

## Strategic Principle

**Move the configure-tab family out, keep inspector orchestration in place.**

That means:

- `ParameterInspector` should still own top-level selection, derived values, and callbacks
- extracted components should render coherent configure-tab sections from explicit props
- no second state-management layer should appear
- no user-visible workflow should change
- all current hooks (`useMemo`, `useEffect`, `useState`, callback ownership) stay in
  `ParameterInspector` in this slice even when they feed configure-tab rendering exclusively

---

## Relationship To Existing Work

This slice builds on:

- `docs/archive/contracts/2026-04/INSPECTOR-STRUCTURED-EDITOR-EXTRACTION-V1.md`
- `docs/archive/contracts/2026-04/INSPECTOR-ANALYSIS-AND-OUTPUT-EXTRACTION-V1.md`
- the shipped ECC and AES inspector expansions
- the current `IMPLEMENTATION-STATUS.md` recommendation that `parameter-inspector.tsx` is now the primary large-surface refactor candidate

Those earlier slices removed two large coherent families.
This slice should not revisit them.

It should instead target the remaining inline configure-tab implementation that is still making the inspector hard to change safely.

---

## Include

V1 should include:

1. One extracted configure-tab family under `src/ui/components/` adjacent to the inspector

2. Dedicated local components for coherent remaining inspector blocks, likely along lines such as:
- inspector shell or configure-tab container
- stage inspection card
- module summary and action cluster
- replacement / copy-params / bypass summary cards
- parameter field list renderer
- port layout / orientation block

3. Any tiny UI-local helper extraction needed to keep rendering logic coherent

4. Integration that makes `ParameterInspector` orchestration-first rather than configure-rendering-first

---

## Exclude

Do not include in V1:

- engine changes
- saved document shape changes
- new inspector capabilities
- new analysis or comparison behavior
- structured-editor redesign
- stage inspection semantics changes
- layout-system behavior changes
- replacement logic changes
- parameter parsing or formatting changes
- moving the static analysis memos (`staticSBoxAnalysis`, `staticPermutationAnalysis`,
  `staticLFSRAnalysis`, `staticPlugboardAnalysis`, `staticReflectorAnalysis`,
  `staticModulusAnalysis`) out of `ParameterInspector`
- CSS redesign beyond tiny extraction-local adjustments
- a broad "split everything in the inspector" pass

---

## Required Boundary

This slice must:

- preserve current inspector behavior
- preserve current tab behavior
- preserve current configure-tab workflows
- preserve current parameter editing semantics
- preserve current module action behavior
- preserve current replacement / copy-params / bypass flows
- preserve current stage inspection behavior
- preserve current port layout and orientation behavior
- reduce the amount of configure-tab implementation living directly in `parameter-inspector.tsx`

This slice must not:

- change what the inspector can do
- move orchestration into a second state layer
- change the meaning of any module parameter edit
- widen into a general inspector rewrite

---

## Recommended Implementation Shape

The preferred shape is:

1. Keep these in `parameter-inspector.tsx`:
- top-level tab state
- top-level memoized derivations
- callback ownership
- selection context
- execution / comparison / tutorial orchestration
- all existing hooks, including memos used only by the configure tab

2. Move coherent configure-tab rendering blocks into dedicated leaf components such as:
- `InspectorConfigureView`
- `InspectorStageSignalCard`
- `InspectorModuleSummary`
- `InspectorModuleActions`
- `InspectorParameterList`

The exact filenames may differ, but the configure-tab family should become a local subsystem rather than an inline render wall.

A temporarily wide props interface on an extracted configure view is acceptable in V1 if that
is the safest way to preserve behavior. Prefer explicit prop-passing over trying to narrow or
redistribute callback ownership in ways that risk semantic drift.

3. Pass current derived values explicitly rather than re-deriving them deeply inside child components when that would duplicate logic

4. Keep any shared helpers UI-local and adjacent to the new family

5. If a remaining special param-field branch is still too large after extraction, split that branch locally inside the new parameter-list family rather than pushing it back into `ParameterInspector`

---

## Concrete Scope Guidance

The highest-value extraction target is the configure-tab body beginning after the already-extracted analyze/output surfaces.

In the current file, the natural render seam is the
`moduleDef && moduleInstance && inspectorTab === 'configure'` guard.

The derivation zone feeding that block begins around the `stageSignalInspection` memo and
continues through the configure-tab-specific summaries and port-layout memos.

That body currently includes:

- stage inspection card
- selected module summary
- read-only/rename handling
- action buttons
- replacement search/select/preview
- copy-param application summary
- bypass eligibility/explanation cards
- sibling parameter comparison summary
- parameter field rendering loop

This slice should treat that as the main extraction unit.

The likely result is:

- `ParameterInspector` still computes values like `stageSignalInspection`, replacement candidates, comparison summaries, and ordered ports
- dedicated child components receive those values and render them

This is preferable to extracting business logic first, because the main drag coefficient now is inline rendering and responsibility sprawl, not missing pure helpers.

---

## Likely Files

Likely files in scope:

- `src/ui/components/parameter-inspector.tsx`
- one or more new local inspector configure components under `src/ui/components/`
- small adjacent helper/type files only if needed
- targeted inspector tests if existing coverage needs to move or tighten

Possible filenames:

- `src/ui/components/inspector-configure-view.tsx`
- `src/ui/components/inspector-stage-signal-card.tsx`
- `src/ui/components/inspector-module-summary.tsx`
- `src/ui/components/inspector-module-actions.tsx`
- `src/ui/components/inspector-parameter-list.tsx`

These names are illustrative, not mandatory.

---

## Test Requirements

### 1. No visible inspector regressions

Any targeted inspector tests affected by the extraction must continue to pass or be replaced with equivalent coverage.

### 2. Existing suite remains green

`npx vitest run` must pass in full.

`npm run build` must pass.

### 3. No behavior-only-by-accident changes

If the extraction reveals a behavior difference, either:

- preserve the shipped behavior in this slice, or
- stop and write a separate behavior contract rather than smuggling the change into a refactor pass

---

## Success Criteria

This slice is successful when:

1. `parameter-inspector.tsx` loses a meaningful block of configure-tab implementation
2. the remaining file reads primarily as orchestration rather than as a single giant render function
3. configure-tab behavior remains stable
4. `ParameterInspector` no longer contains the full configure-tab render body inline; that rendering is delegated to extracted component(s)
5. no new inspector capability is added as part of the refactor

---

## Explicitly Avoid Next

Do not let this become:

- a visual inspector redesign
- a state-management rewrite
- a CSS cleanup campaign
- a stealth parameter-authoring feature pass
- a generic "componentize everything" exercise

This is one bounded architecture-protection slice.

---

## Likely Next Step

After this slice, the next honest follow-on should be chosen from product-facing capability work rather than extending the maintenance line by default.

If more inspector refactoring is still needed after this pass, it should be justified by a newly identified coherent seam rather than by a general desire to keep splitting files.
