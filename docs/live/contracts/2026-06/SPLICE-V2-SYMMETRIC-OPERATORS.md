# Splice V2 — Symmetric Operators

Last updated: June 17, 2026
Status: Shipped on `main`

Related:
- [LIVE-MACHINE-FEEL-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/LIVE-MACHINE-FEEL-V1.md)
- [CANVAS-FEEDBACK-REFINEMENT-V1.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/CANVAS-FEEDBACK-REFINEMENT-V1.md)
- [NORTH-STAR-REMAINING-GAPS-2026-06.md](/Users/timothykoerner/Desktop/modular_cryptography/docs/live/contracts/2026-06/NORTH-STAR-REMAINING-GAPS-2026-06.md)

---

## Purpose

Close the highest-leverage remaining splice-on-wire authoring gap after `LIVE-MACHINE-FEEL-V1`.

Current splice-on-wire works well for one-input / one-output transforms, but it rejects the most common
mid-stream symmetric operators teachers actually want to insert while building boards:

- `XOR`
- `AND`
- `OR`
- `AddMod`
- `GF2Mul`

These modules are currently rejected because the eligibility rule in
`src/ui/live-machine-feel-tier2.ts` requires `matchingInputs.length === 1`.

This slice widens splice eligibility in one bounded, explicit way:

- if a module has **at least one** matching data input for the wire domain
- and exactly one matching data output
- then splice into the **first matching input by definition order**
- leave the remaining inputs unconnected

That preserves MCW's honesty:

- no hidden extra wiring
- no implicit defaults
- no automatic repair
- the unfinished state remains visible through the existing missing-input badge and jump-to-error flow

---

## Problem Statement

The remaining splice friction is narrower than earlier north-star notes suggested.

Source verification shows the real blocker is not a generic "optional secondary port" rule. The actual
gating behavior today is:

1. `matchingInputs.length !== 1` rejects same-domain multi-input operators outright
2. `nonMatchingInputs.length > 0` rejects modules with extra data inputs of other domains

In current shipped source, the first rule is the real classroom problem. The second rule is not the
thing blocking the named common splice targets in this contract.

Examples:

- `XOR` is rejected because it has two matching `bits` inputs
- `AND` / `OR` are rejected for the same reason
- `GF2Mul` and `AddMod` are rejected for the same reason
- modules like `SBox` and `BitShifter` are not the real motivating cases here

So this contract does **not** reopen splice into a broad "required-only port" policy. It targets the
actual pain point in current source: symmetric multi-input operators on the same wire domain.

The mixed-type extra-input case is explicitly deferred. For example, removing the
`nonMatchingInputs.length > 0` gate would also widen splice eligibility for modules like
`ScalarMultiply` on `ec-point` wires by wiring `point` and leaving `scalar(integer)` unconnected.
That behavior is coherent, but it is not needed for the named classroom targets here and should be
evaluated separately rather than bundled into this slice.

---

## Scope

### In scope

- widen splice eligibility for same-domain multi-input operators
- choose the first matching input by module definition order
- leave all other inputs unconnected after splice
- rely on existing missing-input canvas feedback to expose the unfinished state
- update helper tests and one graph-level behavior test

### Out of scope

- engine changes
- new store actions
- new port metadata fields
- hidden auto-wiring of secondary inputs
- splice behavior for modules with multiple matching outputs
- splice behavior for ambiguous multi-wire targets
- changes to control-port exclusion
- changes to the 12px wire-targeting rule
- changes to wire metadata splitting / undo atomicity
- group box nesting
- any `LIVE-MACHINE-FEEL-V2` expansion beyond this narrow splice rule

---

## Strategic Test

This slice succeeds only if it satisfies both:

- "more explicit and correct"
- "more like shaping a live machine"

It is acceptable for splice to create a temporarily incomplete graph if:

- the auto-wired connection is visible
- the remaining missing input is visible
- no hidden assumption is made about the second input

It is not acceptable to:

- silently duplicate the source signal into another input
- auto-insert a constant
- auto-choose between multiple outputs
- invent a new engine-side notion of optionality

---

## Required Behavior

### 1. Eligibility rule change

In `getSpliceEligiblePorts(moduleDef, wireType)`:

- keep the current data-port filtering and control-port exclusion
- keep the requirement that there is exactly one matching data output
- change the input rule from:
  - `matchingInputs.length !== 1` → reject
- to:
  - `matchingInputs.length < 1` → reject

If there is one or more matching input, choose:

- `inputPortName = matchingInputs[0].name`

where `matchingInputs` preserves the module definition order from `moduleDef.inputs`.

### 2. Keep the mixed-type extra-input rejection gate unchanged

Keep this rejection unchanged:

- reject when `nonMatchingInputs.length > 0`

Reason:

- it is not the real blocker for the named target modules in this slice
- removing it would create newly eligible mixed-type cases that this contract does not need to
  justify or test
- this slice is specifically about same-domain multi-input operators like `XOR`, not a broader
  expansion of splice semantics

### 3. Resulting splice behavior

When a newly eligible symmetric operator is dropped onto a wire:

- the existing wire is replaced atomically as before
- the source is connected to the first matching input
- the output is connected to the original target
- all other inputs remain unconnected

That means the inserted module may immediately show:

- `Missing input`

This is correct and desired. The graph is not "finished," but the splice still saved the teacher the
mechanical sever-place-reconnect work on the main path.

### 4. Preview behavior remains unchanged

No special preview rewrite is needed for newly eligible multi-input modules.

The splice preview should continue to anchor to:

- `splicePorts.inputPortName`

For `XOR`, that means the preview anchors to `a`, while `b` simply remains visibly unconnected in the
preview and after commit. This is the desired honest behavior.

### 5. No new hidden semantics

The following remain forbidden:

- no auto-population of a second operand
- no duplicated source signal into both inputs
- no inferred identity element for arithmetic or logical operators
- no fallback constants

The user must still wire the remaining operand explicitly.

---

## Implementation Shape

### Files touched

- `src/ui/live-machine-feel-tier2.ts`
- `src/ui/live-machine-feel-tier2.test.ts`

Potentially one existing component/integration test file if needed for graph-level missing-input
verification, but no broader UI refactor is expected.

### Expected code change

Primary logic change is in:

- `getSpliceEligiblePorts`

Expected shape:

1. compute `matchingInputs` and `matchingOutputs` as today
2. reject if `matchingInputs.length < 1`
3. reject if `matchingOutputs.length !== 1`
4. keep the existing `nonMatchingInputs.length > 0` rejection
5. return `matchingInputs[0].name` and `matchingOutputs[0].name`

No other helper semantics should change unless required by tests.

---

## Tests

### Helper-level tests

Update `src/ui/live-machine-feel-tier2.test.ts` to verify:

1. `NOT` remains splice-eligible on `bits`
2. `Gate` remains splice-eligible on `bits`
3. `XOR` becomes splice-eligible on `bits`
   - expected result:
   ```ts
   { inputPortName: 'a', outputPortName: 'out' }
   ```

Add at least one additional same-domain symmetric operator check if present in `V1_REGISTRY`, such as:

- `AND`
- `OR`
- `GF2Mul`
- `AddMod`

The point is to prove the rule generalizes beyond `XOR`, not that every module needs a separate test.

### Behavior-level test

Add one concrete graph-level test proving that the new splice model remains honest:

- start from a minimal project with two modules connected by a `bits` wire
- splice `XOR` into that connection using the existing splice/reducer path, not a bespoke shortcut
- assert that the resulting graph now has:
  - two connections instead of one
  - the inserted `XOR` wired through its first matching input (`a`)
  - its remaining required input left unconnected
- assert that `deriveCanvasModuleErrorStateById` reports `Missing input` for the inserted `XOR`

This test does not need to exercise full pointer choreography. The goal is to prove the resulting
graph semantics, not the mouse interaction layer.

### Regression expectations

The following existing behaviors must remain true:

- modules with no matching inputs are still ineligible
- modules with mixed-type extra data inputs remain ineligible under the unchanged gate
- modules with multiple matching outputs are still ineligible
- control-port exclusion still works
- ambiguous crossing-wire drops still do not auto-insert
- splice undo remains atomic
- update the existing helper-test description so it no longer claims symmetric multi-input modules are rejected

---

## Acceptance Criteria

1. Dropping `XOR` onto a `bits` wire now auto-inserts it into the wire rather than falling back to normal placement.
2. The inserted `XOR` uses its first matching input by definition order (`a`) as the splice target.
3. `XOR`'s remaining required input is left visibly unconnected.
4. The canvas shows the resulting `Missing input` state using the already shipped error-badge path.
5. `Jump To First Error` can still locate the newly incomplete splice result without any special-case logic.
6. One-input transforms that were already eligible remain eligible.
7. Modules with mixed-type extra data inputs remain ineligible.
8. Modules with multiple matching outputs remain ineligible.
9. No hidden secondary-input wiring or constant injection is introduced.
10. `npx vitest run` passes.
11. `npm run build` passes and bundle guard remains under `450 KiB`.

---

## Why This Slice Now

This is the strongest next bounded authoring improvement because it:

- targets a common real build action (`XOR` insertion is frequent)
- has a narrow source-of-truth implementation site
- reuses already shipped honesty mechanisms instead of inventing new ones
- improves live authoring feel without touching engine semantics

It beats broader follow-ons right now because:

- group box nesting still needs an architecture contract
- mid-edit parameter preview is more invasive than this
- undo visibility and verification discoverability are lower-impact polish by comparison

---

## Explicit Non-Goals

This contract is **not**:

- a general optional-port framework
- a hidden "finish the splice for me" system
- a change to module semantics
- a packaging or curriculum slice

It is one narrow relaxation of splice eligibility for symmetric multi-input operators, bounded by the
current live-machine and canvas-feedback foundations already on `main`.
