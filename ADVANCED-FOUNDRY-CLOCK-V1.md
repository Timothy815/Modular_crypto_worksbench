# MCW — Advanced Foundry: Clock & Stateful Advance Contract

**Status:** DRAFT — awaiting Gemini review
**Date:** March 22, 2026
**Branch:** `feature/advanced-foundry-clock`
**Prerequisite:** V1 engine contract (stateless, pure, topological)

---

## 1. Problem Statement

The V1 engine executes every module exactly once per run. All state is
encoded in params (e.g., the Rotor's `position` param). This means:

- An LFSR produces its entire output stream in one `evaluate()` call
- A Rotor has a fixed position — it never advances per character
- There is no concept of "process this message one character at a time"

Real cipher machines operate on **sequences of inputs** where internal
state advances between each input. Enigma rotors step. LFSRs shift.
Key-stream generators emit one bit per clock tick. MCW needs to support
this without hiding the state changes.

---

## 2. Design Principles

These principles are non-negotiable and inherited from the engine
contract and strategic vision.

### 2.1 Explicit State, Not Hidden Mutation

State changes must be visible in the graph and traceable in the
inspector. A module that silently mutates between evaluations violates
the project's core teaching value. Students should be able to see:
"After tick 3, the rotor is at position D."

### 2.2 Preserve Engine Purity

`evaluate()` remains a pure function. It takes inputs and params, returns
outputs. It does not read or write mutable state. The clock mechanism
lives **outside** `evaluate()` and feeds updated params into the next
evaluation.

### 2.3 No Implicit Clocking

Modules do not auto-advance. A module only advances when it receives an
explicit clock signal. If there is no clock in the graph, every module
behaves exactly as it does today — the V1 contract is preserved.

### 2.4 Honest Graphs

Clock connections are visible wires, not hidden system behavior. If a
rotor steps, there is a wire from a clock source to that rotor. Students
can see *why* it steps and *what controls the stepping*.

### 2.5 Deterministic and Testable

Given the same initial params, the same input sequence, and the same
clock configuration, the output must be identical every time. The
step-through debugger must be able to replay any tick.

---

## 3. Core Concepts

### 3.1 Tick

A **tick** is one discrete advance of the machine. For a character-level
cipher, one tick processes one character. The number of ticks is
determined by the length of the input signal, not by an arbitrary
counter.

### 3.2 Tick Execution

A ticked execution replays the full topological evaluation once per tick.
Between ticks, stateful modules receive updated params based on their
advance functions. The execution loop is:

```
for each tick t in 0..N-1:
  1. compute effective params for each stateful module at tick t
  2. slice or index per-tick inputs from source modules
  3. execute the full topological graph (standard V1 executor)
  4. collect the per-tick output
  5. advance state for the next tick
```

This is a loop **around** the existing executor, not a replacement of it.

### 3.3 Stateful Module Declaration

A module opts into stateful behavior by declaring an `advance` function
in its definition. Modules without `advance` remain purely stateless.

```ts
interface StatefulModuleDef extends ModuleDef {
  advance: (params: ModuleParams, tick: number) => ModuleParams;
}
```

`advance(params, tick)` takes the module's current params and the current
tick index, and returns the params that should be used for the **next**
tick. This function is pure — it computes new params, it does not mutate
anything.

Example — Rotor advance:
```ts
advance: (params, _tick) => ({
  ...params,
  position: ((params.position as number) + 1) % 26,
})
```

Example — LFSR advance:
```ts
// The LFSR could shift its seed register by one step per tick,
// emitting one bit per tick instead of the full stream.
advance: (params, _tick) => {
  const register = [...(params.seed as number[])];
  const taps = parseTapIndexes(params.taps);
  const feedback = xorBits(taps.map((i) => register[i]));
  register.pop();
  register.unshift(feedback);
  return { ...params, seed: register };
}
```

### 3.4 Per-Tick Input Slicing

Source modules (TextInput, KeyInput) that provide sequences must emit
one element per tick when operating in ticked mode:

- `TextInput` with value `"HELLO"` emits `"H"` at tick 0, `"E"` at
  tick 1, etc.
- `BitSource` with value `[1,0,1,1]` emits `[1]` at tick 0, `[0]` at
  tick 1, etc.

This slicing happens at the execution loop level, not inside
`evaluate()`. Source modules continue to declare their full value in
params — the tick executor slices before calling `evaluate()`.

### 3.5 Per-Tick Output Collection

The Output module collects one result per tick. The full execution
produces a collected sequence:

- Character mode: `["H","E","L","L","O"]` → concatenated display
- Bit mode: `[[1],[0],[1],[1]]` → concatenated bit array

### 3.6 Tick Count Determination

The number of ticks is derived from the input length:
- If the primary source is a `TextInput` with value `"HELLO"`, there
  are 5 ticks.
- If multiple sources have different lengths, the shortest determines
  tick count (with a validation warning for length mismatch).

---

## 4. Engine Interface Changes

### 4.1 New Types

```ts
interface TickedExecutionResult {
  ticks: ExecutionResult[];       // one standard result per tick
  collectedOutputs: Record<string, Signal[]>;  // per-output-module
  paramsByModuleByTick: Record<string, ModuleParams[]>;  // for tracing
}
```

### 4.2 New Executor Entry Point

```ts
function executeTickedProject(
  project: Project,
  registry: ModuleRegistry,
  tickCount: number,
): TickedExecutionResult;
```

This function:
1. Validates the project once (existing `validateProject`)
2. Builds topological order once (existing `buildTopologicalOrder`)
3. Loops `tickCount` times, calling the existing `executeProject`
   internally with per-tick input overrides and per-tick params
4. Advances stateful modules between ticks

### 4.3 Module Detection

```ts
function isStatefulModule(def: ModuleDefinition): def is StatefulModuleDef {
  return 'advance' in def && typeof (def as StatefulModuleDef).advance === 'function';
}
```

### 4.4 Source Slicing

Source modules that provide sequences need a way to emit per-tick
slices. This can be handled by the tick executor recognizing source
modules and providing `inputOverrides` that slice params before
evaluation. No changes to `evaluate()` itself.

---

## 5. What Does NOT Change

- `evaluate()` signature and purity — unchanged
- `executeProject()` — unchanged, still the single-tick executor
- V1 modules without `advance` — unchanged, fully backwards compatible
- Topological sort — unchanged
- Validation — unchanged (may add optional warnings for tick-mode)
- Composite modules — unchanged (composites can contain stateful modules;
  the tick loop wraps the outermost execution)
- Signal types — unchanged
- Persistence — existing projects load and run exactly as before

---

## 6. UI Integration (Future Slices)

These are not part of the contract but establish the expected direction.

### 6.1 Tick Mode Toggle

The workbench will have a mode toggle: **Single Evaluation** (V1
behavior) vs **Ticked Execution** (character-by-character).

### 6.2 Tick Step-Through

The existing step-through debugger will gain a second axis:
- **Module step** — walk within a single tick (existing)
- **Tick step** — walk across ticks (new)

Students can step through "tick 3, module 4" to see exactly what the
rotor did to the third character.

### 6.3 Tick Trace in Inspector

The Analyze tab will show tick-by-tick state evolution for probed
modules. Signal probes (already shipped) will naturally extend to show
per-tick values.

### 6.4 State Timeline

A compact visualization showing how a module's params evolve across
ticks. For a rotor, this would show position A → B → C → D → E.

---

## 7. Scope Boundaries

### In Scope for This Feature

- `StatefulModuleDef` with `advance` function
- `executeTickedProject` executor wrapper
- Rotor advance function (proof module)
- LFSR per-tick mode (proof module)
- Per-tick input slicing for TextInput
- Per-tick output collection for Output
- Tick trace types

### Out of Scope

- Feedback loops (cycles remain prohibited)
- Conditional clocking (e.g., Enigma double-stepping — future slice)
- Async or real-time execution
- Clock as a separate module type (deferred — the tick executor handles
  advance uniformly for now; a Clock module can be added later for
  selective per-module clocking)
- Custom scripting for advance functions
- Network/multi-machine communication

---

## 8. Recommended First Implementation Slice

After this contract is reviewed and accepted:

### Slice 1: Engine Tick Proof (engine only, no UI)

1. Add `StatefulModuleDef` interface to `src/engine/types.ts`
2. Add `isStatefulModule` type guard
3. Add `TickedExecutionResult` type
4. Implement `executeTickedProject` in `src/engine/executor.ts`
5. Add `advance` to the Rotor module definition
6. Write integration test: 5-character input through a single Rotor in
   ticked mode, verify that position advances and each character gets a
   different substitution
7. Write integration test: LFSR in ticked mode emitting one bit per tick
   matches the V1 full-stream output

**Success criteria:** The ticked executor produces correct, deterministic
output for the Rotor and LFSR, and the existing V1 test suite passes
unchanged.

### Slice 2: Source Slicing (engine only)

1. Implement per-tick input slicing for TextInput and BitSource
2. Implement per-tick output collection for Output
3. Integration test: full Enigma-style pipeline (TextInput → Rotor →
   Reflector → Rotor → Output) in ticked mode encrypts "HELLO"
   character by character with rotor advancement

### Slice 3: UI Tick Mode

1. Add tick mode toggle to the workbench shell
2. Wire `executeTickedProject` through App.tsx
3. Display collected output in the Output module
4. Extend step-through to support tick × module stepping
5. Show tick-by-tick param evolution in probed signal cards

---

## 9. Testing Strategy

- All existing V1 tests must continue to pass unchanged
- Ticked execution tests use known-answer vectors
- Advance functions are tested in isolation (pure function tests)
- The ticked executor is tested against the V1 executor: for a
  single-tick execution, results must be identical
- Rotor ticked test: verify against hand-computed Enigma stepping
- LFSR ticked test: verify per-tick output matches full-stream output

---

## 10. Migration Notes

- No existing module definitions change
- No existing project files change
- `advance` is optional — modules without it work identically to V1
- The `executeProject` function remains the primary entry point for
  single evaluations
- `executeTickedProject` is additive — it wraps `executeProject`

This contract is designed so that the clock feature can be built
incrementally without disrupting any shipped functionality.
