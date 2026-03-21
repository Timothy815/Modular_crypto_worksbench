# MCW — Guided Challenges V1 Contract

This contract defines the first bounded classroom-facing challenge workflow for MCW.

It follows the engine, composite, analysis, and break milestones by turning the existing
Build / Analyze / Break loop into a more guided teaching experience.

The scope is intentionally narrow. The goal is not to build a full LMS, scoring engine, or
cryptanalysis tournament system. The goal is to establish the first reusable challenge format that
helps a teacher present a machine, pose a task, and let students inspect whether they succeeded.

---

## Goal

Deliver the first reusable workflow for asking:

> Can the student reproduce or explain a target machine behavior inside the workbench?

The first `guided-challenges` milestone should make it easy to:
- load a challenge prompt into the workbench
- show the student what the task is
- compare the student’s current machine against a target behavior
- make success or failure legible without hiding the machine structure

This is the first product step from open-ended lab work toward a classroom-ready teaching mode.

---

## Non-Goals

This milestone does **not** yet need to include:
- user accounts
- online submissions
- grades or scorebooks
- randomized challenge generation
- automated hint engines
- multi-step tutorials with branching state
- adversarial search or attack automation

If a proposed feature requires those, it is too large for this slice.

---

## Product Definition

V1 guided challenges should answer four questions clearly:

1. **What is the student being asked to do?**
2. **What target behavior is the challenge checking?**
3. **How does the student know whether the current machine satisfies it?**
4. **How does the student inspect where their machine differs from the target?**

The first version may use comparison-first challenge checking rather than a richer rubric system.

That is acceptable and desirable for this milestone.

---

## Required V1 Capabilities

### 1. Serializable Challenge Definition

The project needs a first challenge definition shape that can be stored as structured data.

The V1 challenge definition should likely include:
- id
- title
- prompt / instructions
- a source project or target project
- comparison input assumptions
- success condition metadata

This should live outside the pure engine layer.

### 2. Challenge Session in the Workbench

The UI must be able to open a challenge context while preserving the student’s editable graph.

The first version may treat the student graph as:
- a copy of a provided starting graph
- or the current active project under challenge evaluation

The key requirement is that the challenge state is explicit and inspectable.

### 3. Success / Failure Surface

The UI must clearly show:
- whether the current student machine satisfies the challenge condition
- what target output or target behavior is being evaluated

V1 success can be comparison-first:
- output match
- no divergence against target under the specified input

### 4. Explainable Failure Surface

Failure should not only say “incorrect.”

The UI must make it possible to inspect:
- output mismatch
- first divergence
- relevant parameter or structure differences when available

This should reuse the existing analysis and break surfaces wherever possible.

### 5. Teacher-Friendly Scope

The first challenge type should be something a teacher could realistically author or demo without
special tooling.

Good first examples:
- “Recreate this machine so the output matches the target”
- “Fix the broken machine so it produces the expected output”
- “Mutate this machine until it matches the provided behavior”

---

## Execution / Engine Constraints

Guided challenges must preserve engine purity:
- no challenge logic inside engine module definitions
- no special-case execution path for “challenge mode”
- no hidden evaluation channels bypassing the normal validation/execution/trace flow

Challenge checking should be built from:
- `Project`
- `ExecutionResult`
- `ValidationResult`
- existing comparison helpers

not by changing the engine contract.

---

## Persistence Constraints

Challenge data must remain clearly separate from:
- the engine `Project`
- reusable composite definitions
- ordinary workbench annotations

If persisted, challenge metadata should live in the UI/workbench layer.

V1 does not require a fully separate “challenge document” format if an additive workbench-layer
document shape remains cleaner.

---

## UI Constraints

The UI must remain explicit and educational.

That means:
- the challenge prompt should talk about machines, modules, outputs, and signals
- the success check should be visible, not magical
- comparison and analysis should remain inspectable

Good:
- “Target output: `B`”
- “Your machine first diverges at `xor`”
- “Expected rotor position: `1`, current: `0`”

Bad:
- “Task incomplete”
- “Score: 63%”
- “Mismatch at internal object”

---

## Recommended V1 Scope

The first implementation should likely include:

1. challenge definition types
2. one simple challenge session state model
3. one comparison-backed success evaluator
4. one clear challenge panel in the UI
5. one seeded example challenge

This is enough to prove the milestone.

---

## Recommended Implementation Order

1. Define challenge data structures
   - challenge definition
   - active challenge session
   - success state model

2. Add one proof helper
   - compare current student machine against target behavior
   - reuse existing break/comparison utilities where possible

3. Add one seeded challenge
   - use a simple, explainable reference machine

4. Add a narrow UI surface
   - challenge prompt
   - status
   - success / failure summary

5. Reuse existing analysis/break surfaces
   - divergence info
   - baseline/variant style comparison if helpful

Only after that should the branch consider richer challenge authoring or scoring.

---

## Definition of Done

The `guided-challenges` V1 milestone is done when:

- a challenge can be loaded into the workbench
- the student can edit a machine in response
- the workbench can determine whether the current machine satisfies the challenge
- success or failure is shown clearly
- failure remains explainable through the existing comparison/analysis surfaces

That will be enough to justify the first classroom-facing challenge milestone.
