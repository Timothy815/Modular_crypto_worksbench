# MCW — Break Workflows V1 Contract

This contract defines the first bounded "Build / Analyze / Break" workflow for MCW.

It is intentionally narrow. The goal is not to build a full cryptanalysis suite in one milestone.
The goal is to establish the first product-grade comparative and mutation workflow that turns MCW
from a construction environment into an interrogation lab.

---

## Goal

Deliver the first reusable workflow for asking:

> What changed, where did it change, and why did the machine behave differently?

The first `break-workflows` milestone should make it easy to:
- duplicate or compare two machine variants
- run them against the same input
- inspect where outputs diverge
- inspect where trace steps diverge

This is the first concrete product step toward the long-term "Build / Analyze / Break" loop.

---

## Non-Goals

This milestone does **not** yet need to include:
- automated cryptanalysis
- brute-force search
- scoring candidate decryptions
- classroom challenge authoring
- attack libraries
- adversarial AI tooling
- stateful execution engine changes

If a proposed feature requires those, it is too large for this slice.

---

## Product Definition

V1 break workflows should answer three questions clearly:

1. **What two machine states are being compared?**
2. **Did they produce different outputs?**
3. **At what execution step did they start to diverge?**

The first version may be UI-driven and comparison-focused rather than mathematically "attack-grade."

That is acceptable and desirable for this milestone.

---

## Required V1 Capabilities

### 1. Variant Comparison

The user must be able to compare:
- a baseline workbench document
- a mutated variant of that workbench document

The first version may allow mutation via:
- duplicate current project
- edit one or more params / connections
- compare current vs baseline

This does not require a new persistent project type if the existing document model can support it
cleanly.

### 2. Shared-Input Comparative Execution

Both variants must run against the same top-level inputs.

The UI must make this comparison explicit.

The product should not imply comparison between different inputs unless the user intentionally
changes the inputs in one variant.

### 3. Output Difference Surface

The comparison view must clearly show:
- whether the final output is identical or different
- the concrete output values for each variant

### 4. Trace Divergence Surface

The comparison view must clearly show:
- the first execution step where the two traces diverge
- the module id / def id involved
- the differing signals

This is the core educational value of the milestone.

### 5. Mutation Visibility

The UI must make it clear which machine is the baseline and which is the variant.

The user should not have to infer this from memory.

---

## Execution / Engine Constraints

V1 break workflows must preserve the current engine purity:
- no engine state mutation
- no special "compare mode" inside module definitions
- no hidden execution shortcuts that bypass existing validation or trace generation

Comparisons should be built from ordinary execution results and trace data already produced by the engine.

If new helpers are introduced, they should operate on:
- `ExecutionResult`
- `ValidationResult`
- existing project/document structures

not by modifying the engine contract.

---

## Persistence Constraints

If comparison artifacts are persisted, they must remain clearly separate from:
- the engine `Project`
- reusable composite definitions

Any comparison-specific metadata should live in UI/workbench-layer state.

V1 does not require a permanent "comparison document" format unless it becomes necessary.

---

## UI Constraints

The UI must remain educational, not generic.

That means:
- comparisons should speak in terms of modules, signals, outputs, and trace steps
- not in abstract diff-tool language alone

Good:
- "First divergence at `xor`"
- "Baseline output `B`, Variant output `M`"
- "Rotor position changed from `0` to `1`"

Bad:
- "Object A differs from Object B"
- "Delta at index 4"

---

## Recommended V1 Scope

The first implementation should likely include:

1. comparison state model
2. baseline vs variant execution
3. output comparison summary
4. first-divergence trace comparison
5. one clear comparison UI

This is enough to prove the milestone.

---

## Recommended Implementation Order

1. Define comparison result helpers
   - compare outputs
   - compare trace arrays
   - find first divergence

2. Add one engine-adjacent proof test
   - same input
   - one param mutation
   - first divergence correctly identified

3. Add a narrow UI surface
   - baseline / variant compare panel
   - output summary
   - first divergence summary

4. Add a simple mutation workflow
   - duplicate current graph
   - change a parameter
   - compare

Only after that should the branch consider richer guided break workflows.

---

## Definition of Done

The `break-workflows` V1 milestone is done when:

- a user can compare two machine variants
- both runs are validated and executed through the existing engine path
- final outputs are shown side by side
- the first divergent trace step is clearly identified
- the UI makes the mutation and comparison understandable without external explanation

That will be enough to justify the first "Break Workflow" milestone.
