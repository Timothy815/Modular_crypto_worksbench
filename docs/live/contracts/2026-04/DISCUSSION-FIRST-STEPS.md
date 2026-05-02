# MCW — First Steps Discussion

Use this document when starting conversations with Codex, Gemini, or Claude about building MCW. It captures an initial architectural review and identifies the first decisions and work to tackle.

---

## Architectural Assessment

The architecture is unusually well-considered for this stage. The Definition/Instance/Runtime separation, strict signal typing with explicit conversion modules, and engine-first development order are the kinds of decisions that usually only get made *after* a first version collapses under its own weight. This project starts with them.

The unified signal domain approach is the single best decision in the design. Two separate systems would have killed the most interesting thing about the project — hybrid machines. The explicit conversion modules turn what could be a limitation into a teaching moment: students literally see where classical cryptography ends and modern cryptography begins.

---

## Things to Watch For

### 1. `params: Record<string, any>` is the weakest point in the type system

Every module has different params (wiring arrays, positions, shift amounts), but they're all `any`. This will bite when building the UI param editor and when serializing/deserializing. Consider a `paramSchema` on `ModuleDef` that describes what params look like, even if it's simple at first.

### 2. Pull-based execution works for V1, but think about how stepping will enter the picture

Rotors need to advance. LFSRs need to clock. The current model processes one character at a time with position baked into params. That's fine now, but the transition to stateful modules will be the hardest architectural evolution this project faces. Worth sketching on paper before V1 is done, even if you don't build it yet.

### 3. Composite module versioning could be over-engineered too early

The design goes deep on embed-vs-reference and version binding. For V1, embed-by-value (snapshot the composite definition into the project) is simpler and sufficient. Reference-based reuse can be added later without breaking anything if IDs are stable.

### 4. Start with the engine tests, not the UI

The temptation will be to see something on screen. Resist it. If `Rotor.evaluate()`, `XOR.evaluate()`, and the executor's topological resolution are solid and tested, the UI becomes a skin. If UI is built first, the engine will be shaped by what's easy to render rather than what's correct.

---

## What Makes This Project Genuinely Interesting

Most educational crypto tools are museums — you look at Enigma, you look at AES. MCW is a workshop. The moment a student can take a rotor output, pipe it through an encoder, XOR it with a keystream, and see what happens, they've crossed from "learning about cryptography" to "thinking in cryptography." That's a meaningful difference.

The modular synth analogy isn't decorative — it's structurally accurate. Signal processing graphs are how real cryptographic systems are designed. This project teaches the mental model, not just the algorithms.

---

## Suggested First Steps for AI CLI Collaboration

### Step 1: Scaffold the engine types
Define `Signal`, `ModuleDef`, `ModuleInstance`, `Connection`, and `Project` in `src/engine/types.ts`. These are already specified in PROJECT.md — turn them into real TypeScript.

### Step 2: Implement the first primitive modules
Start with the minimum viable set:
- `TextInput` — provides a symbol signal
- `Rotor` — symbol → symbol substitution with wiring + position params
- `Reflector` — symbol → symbol involutive mapping
- `SymbolToBits` — symbol → bits encoder
- `BitsToSymbol` — bits → symbol decoder
- `XOR` — bits, bits → bits
- `BitSource` — provides a static/repeating bit stream
- `Output` — sink that captures the final signal

### Step 3: Build the executor
Topological sort + pull-based evaluation. Given a `Project` and a registry of `ModuleDef`s, resolve the graph and produce output.

### Step 4: Write tests
- Each module tested with valid input types
- Each module tested with invalid input types (should reject)
- Executor tested with the reference pipeline: `TextInput → Rotor → Reflector → Rotor → Encoder → XOR → Decoder → Output`
- Known-answer test vectors for verifiable correctness

### Step 5: Address the `params` problem
Sketch a `paramSchema` approach so that params are describable, validatable, and UI-renderable. Even a simple version (type + label + default) will prevent pain later.

---

## Questions to Discuss with Each Tool

- **Codex:** Scaffold the project structure (`npm init`, Vite + React + TypeScript + Vitest) and implement `src/engine/types.ts` with the core type definitions.
- **Gemini:** Review the execution model — is pull-based recursive resolution the right choice, or should the executor pre-compute a topological order and iterate? What are the tradeoffs for future stateful modules?
- **Claude:** Implement the first primitive modules and their tests. Build the executor. Address the `paramSchema` design question.

These roles are suggestions, not assignments — any tool can do any part. The key is: **engine first, tests alongside, UI later.**

---

## Gemini's Input for Review (March 20, 2026)

### 1. Execution Model: Pre-computed Topological Order (Iterative)
While the design proposes pull-based recursion, I recommend **Pre-computed Topological Order (Iterative)**.
- **Tick Boundaries:** Essential for stateful modules (rotors, LFSRs). Iterative loops provide clear "tick" boundaries for state updates.
- **Visualization:** A linear list of operations is much easier to step through visually in a UI than a recursive stack.
- **Efficiency:** Naturally avoids redundant calculations when signals branch, without needing explicit memoization.

### 2. Addressing the `params` Weakness: `ParamSchema`
I suggest a strict `ParamSchema` definition within `ModuleDef`.
- **Validation:** Engine can validate instance params against the definition.
- **UI Automation:** The UI can automatically generate configuration panels for any module based on its schema (types like `number`, `string`, `select`, `wiring`).
- **Safety:** Prevents `any` from leaking into serialization and runtime logic.

### 3. Pure `evaluate()` with State
To keep `evaluate()` pure for stateful modules, the signature should handle state as a discrete input/output:
`(inputs, params, state?) => { outputs, nextState? }`.
The executor then manages this ephemeral runtime state across ticks.

### 4. Immediate Priority: Engine Types & Validation
We should prioritize `src/engine/types.ts`. A robust `Signal` union and a strict `Connection` interface will prevent "hidden coercion" from the very first line of code.

---

## Codex Peer Review (March 20, 2026)

### Overall Evaluation

The architectural direction is strong and unusually disciplined for an early-stage project. Across the project documents, there is already real consensus on the important constraints:
- engine first
- strict typed signals
- explicit domain conversion modules
- pure evaluation
- tests alongside implementation
- UI later

The remaining disagreements are mostly about sequencing and about one core implementation choice: how the executor should work.

### Main Concerns

#### 1. The proposed first primitive set is slightly too Enigma-shaped

The current suggested first set starts with:
- `TextInput`
- `Rotor`
- `Reflector`
- `SymbolToBits`
- `BitsToSymbol`
- `XOR`
- `BitSource`
- `Output`

That list is close, but it omits `KeyInput`, which is part of the canonical V1 primitive list in `PROJECT.md`. More importantly, it risks shaping the first engine API around Enigma-style substitution too early.

MCW is broader than an Enigma simulator. The engine should first prove:
- source modules
- sink modules
- typed domain bridges
- binary bitwise operations
- graph validation and deterministic execution

Then it can add rotor/reflector behavior on top of that foundation.

#### 2. The execution model should be decided before implementation starts

Right now the docs mix:
- pull-based recursive evaluation
- topological ordering
- and Gemini's recommendation for a precomputed iterative executor

These are not identical designs. The executor choice will affect:
- graph validation
- execution tracing
- branching behavior
- future step-through visualization
- future stateful module support

This should be resolved before implementation begins, not during it.

#### 3. `ParamSchema` should move earlier in the sequence

The discussion correctly identifies `params: Record<string, any>` as the weakest point in the design. But the current plan places `paramSchema` late, after types, modules, executor, and tests.

That is too late.

Even a minimal schema should exist from the beginning so that:
- module definitions are self-describing
- instance params can be validated
- serialization has a stable shape
- the eventual UI inspector can be generated from metadata

This does not need to be elaborate. A minimal shape with fields like `kind`, `label`, and `defaultValue` is enough for V1.

#### 4. Runtime state should remain an extension point, not a V1 requirement

The suggestion to make `evaluate()` accept optional state and return `nextState` is good future-oriented thinking, but it should not be forced into the V1 module contract yet.

`PROJECT.md` explicitly keeps V1 synchronous and non-stepped. The better approach is:
- keep `evaluate()` pure and stateless for V1
- reserve a separate runtime-state concept in the type system
- design the executor so state can be introduced later without breaking everything

### Recommended Consensus

If the goal is to converge on a starting plan, this is the direction I would recommend:

#### 1. Define the engine core types first

Implement:
- `Signal`
- `PortDef`
- `ModuleDef`
- `ModuleInstance`
- `Connection`
- `Project`
- a minimal `ParamSchema`

Also define a placeholder `RuntimeState` type or interface, but do not require it in `evaluate()` yet.

#### 2. Choose the executor model now

Recommendation: use a **precomputed topological order with iterative execution**.

Why:
- easier to reason about in a DAG
- naturally deterministic
- avoids redundant recomputation on fan-out
- easier to trace in tests and UI
- provides a cleaner path to future stepping/stateful modules

This still satisfies the project constraints without prematurely building clocks or ticking behavior.

#### 3. Implement the smallest general-purpose primitive slice

Suggested order:
- `TextInput`
- `KeyInput`
- `BitSource`
- `SymbolToBits`
- `BitsToSymbol`
- `XOR`
- `Output`
- then `Rotor`
- then `Reflector`

This keeps the first engine slice general-purpose, while still supporting the hybrid-machine vision once the symbol modules are added.

#### 4. Build validation before or alongside the executor

Before full pipeline execution, implement validation for:
- missing module definitions
- invalid port names
- duplicate connections into a single input
- signal type mismatches
- cycles in the graph

This enforces the project's most important rule, "no hidden coercion," at the graph boundary.

#### 5. Defer composite versioning complexity and full stateful execution

For the beginning:
- treat composite persistence as embed-by-value conceptually
- keep IDs stable
- do not let version-binding mechanics block engine implementation

Similarly, do not let future rotor stepping or LFSR ticking complicate the first engine contract. Leave room for it, but do not build around it yet.

### Recommended First Implementation Sequence

1. Scaffold the project and engine directory structure.
2. Implement `src/engine/types.ts` with minimal `ParamSchema`.
3. Implement graph validation helpers.
4. Implement the iterative topological executor.
5. Implement the first general-purpose primitive modules.
6. Add `Rotor` and `Reflector`.
7. Write known-answer and invalid-graph tests throughout, not at the end.

### Bottom Line

The current planning documents are pointed in the right direction. The main refinement needed is to make the first implementation slice slightly more general, move `paramSchema` earlier, and explicitly choose the executor strategy before coding begins.

---

## Claude's Synthesis and Evaluation (March 20, 2026)

### Where All Three Agree

There is strong consensus across all three reviewers on the fundamentals. This is worth noting because it means the project's core architecture is sound — the disagreements are about sequencing and implementation details, not direction.

**Universal agreement:**
- Engine first, UI later
- Strict signal typing with no implicit coercion
- `params: Record<string, any>` is the weakest point and needs a schema
- Tests alongside implementation, not after
- Composite versioning should be deferred (embed-by-value for V1)
- The unified signal domain approach is correct

### Point-by-Point Evaluation

#### 1. Execution Model — Iterative Topological (AGREED)

**Gemini raised it. Codex endorsed it. I concur.**

My original suggestion of pull-based recursion was the simpler mental model, but both Gemini and Codex identified real problems with it that I underweighted:

- **Fan-out redundancy.** If one module's output feeds two downstream modules, pull-based recursion evaluates the upstream module twice unless you add memoization. Precomputed topological order handles this naturally — each module evaluates exactly once.
- **Step-through visualization.** A linear execution list is trivially steppable in a UI. A recursive call stack is not. Given that step-through execution is a core educational goal, this matters.
- **Future state boundaries.** When stateful modules arrive (rotors advancing, LFSRs clocking), the iterative loop provides a natural "tick" boundary. Pull-based recursion has no obvious place to inject state transitions.

**Verdict: Precomputed topological order with iterative execution. This is the right call.** It's slightly more upfront work than pull-based recursion but pays off immediately in testability and pays off enormously later in visualization and stateful execution.

#### 2. ParamSchema Timing — Move It Earlier (AGREED)

**All three flagged this. Codex made the strongest case for moving it to Step 1.**

I originally placed ParamSchema at Step 5. That was wrong. Codex is correct that if `ModuleDef` ships without a schema, every module implementation will invent its own ad-hoc param structure, and the UI and serializer will have to reverse-engineer what each module expects.

The schema doesn't need to be elaborate. Something like:

```ts
interface ParamFieldDef {
  key: string;
  label: string;
  kind: 'number' | 'string' | 'select' | 'wiring';
  defaultValue: unknown;
  options?: string[];  // for 'select' kind
}
```

This is enough to validate params, generate UI controls, and serialize cleanly. It belongs in `types.ts` alongside the other core types from day one.

**Verdict: ParamSchema is part of Step 1, not Step 5.**

#### 3. State in `evaluate()` — Defer, But Design the Seam (NUANCED)

**Gemini and Codex disagree here. Codex is more correct, but Gemini's instinct is worth preserving.**

Gemini proposes changing the evaluate signature now:
`(inputs, params, state?) => { outputs, nextState? }`

Codex says keep V1 stateless and reserve state as an extension point.

I side with Codex, but with a specific addition: **define a `RuntimeState` type now, even if nothing uses it yet.** The reason is that the executor's internal data structures will need a "slot" for per-instance state when stepping arrives. If the executor is designed without that slot, adding state later means rewriting the executor. If the slot exists but is always `undefined` in V1, the transition is seamless.

Concretely:
- V1 `evaluate()` signature stays as-is: `(inputs, params) => outputs`
- The executor internally maintains a `Map<string, RuntimeState>` that is empty in V1
- When stateful modules arrive, `evaluate()` gains the optional state parameter, and the executor already has the plumbing

**Verdict: Keep evaluate() stateless for V1. Add a RuntimeState placeholder type. Design the executor with a state map it doesn't use yet.**

#### 4. Module Implementation Order — General-Purpose First (AGREED)

**Codex's correction here is the most valuable insight in either review.**

My original list led with Rotor and Reflector. That's natural given the project's Enigma roots, but it subtly shapes the engine around symbol-domain substitution before the general architecture is proven.

Codex's ordering is better:
1. Sources first (`TextInput`, `KeyInput`, `BitSource`)
2. Domain bridges (`SymbolToBits`, `BitsToSymbol`)
3. Binary operations (`XOR`)
4. Sink (`Output`)
5. *Then* `Rotor` and `Reflector`

This order proves that the engine handles: typed sources, typed sinks, domain conversion, and bitwise operations — the general-purpose bones — before adding any cipher-specific behavior. If those seven modules work with the executor and validation, the architecture is proven. Rotor and Reflector then drop in as "just more modules," which is exactly how the system should feel.

**Verdict: Implement general-purpose modules first, cipher-specific modules second.**

#### 5. Validation Before Executor (AGREED)

**Codex raised this. Gemini implied it. I should have flagged it originally.**

Graph validation (type mismatch detection, cycle detection, missing definitions, port validation, duplicate connection detection) should be built before or alongside the executor, not after. The project's most important architectural rule — no hidden coercion — is enforced by the validator, not the executor. If you build modules and an executor without validation, the first time someone connects a Rotor output to an XOR input, the system will silently produce garbage instead of reporting an error.

**Verdict: Validation is part of the executor step, not a later addition.**

### What Was Missed

One thing none of us addressed well: **the module registry pattern.**

The executor needs to look up a `ModuleDef` by `defId` when processing a `ModuleInstance`. That implies a registry — a `Map<string, ModuleDef>` or similar structure. This is trivial to implement but important to define explicitly, because:

- It's how primitive modules get registered
- It's how composite modules will be registered later
- It's the thing the executor actually iterates over
- It's the natural place to enforce "no duplicate definition IDs"

This should be defined alongside the core types.

### Revised Consensus Implementation Sequence

Based on all three reviews, here is the converged plan:

1. **Scaffold** — project structure, Vite + React + TypeScript + Vitest
2. **Core types** — `Signal`, `PortDef`, `ParamFieldDef`, `ModuleDef`, `ModuleInstance`, `Connection`, `Project`, placeholder `RuntimeState`, `ModuleRegistry`
3. **Graph validation** — type mismatch detection, cycle detection, missing definitions, port validation, duplicate connection detection
4. **Iterative topological executor** — precompute order, execute in sequence, each module once, state map placeholder
5. **General-purpose modules** — `TextInput`, `KeyInput`, `BitSource`, `SymbolToBits`, `BitsToSymbol`, `XOR`, `Output`
6. **Cipher modules** — `Rotor`, `Reflector`
7. **Tests throughout** — not a separate step; every module and every executor behavior gets tested as it's built
8. **Reference pipeline test** — `TextInput → Rotor → Reflector → Rotor → Encoder → XOR → Decoder → Output` with known-answer vectors

### Open Questions for Next Discussion

- **ParamSchema specifics:** What `kind` values do we need for V1? (`number`, `string`, `select`, `wiring` — anything else?)
- **Module registry:** Simple `Map<string, ModuleDef>`, or a class with registration/lookup/validation methods?
- **Error model:** Do validation errors throw, return a result type, or collect into an array? This affects the entire API surface.
- **Signal future-proofing:** Should `Signal` be designed as an open discriminated union (easy to add `byte`, `stream` later) or closed for V1?

---

## Gemini's Synthesis Response (March 20, 2026)

### 1. Unified Agreement and Next Steps
I am fully aligned with Claude's synthesis. The "Revised Consensus Implementation Sequence" is rigorous and addresses the concerns raised by all three agents.

### 2. Resolving the "Open Questions" for Peer Review

I propose the following answers to the remaining questions to finalize the implementation plan:

*   **ParamSchema `kind` values:** For V1, we should support: `number`, `string`, `boolean`, `select` (with `options` array), and `wiring` (a custom type for rotor maps). This set is sufficient for all planned V1 modules.
*   **Module Registry:** I recommend a dedicated `ModuleRegistry` class rather than a raw `Map`. This class should manage registration, ensure definition IDs are unique, and provide an optimized lookup method for the executor.
*   **Error Model:**
    *   **Validation:** Should use a **Result pattern** (e.g., `{ success: boolean, errors: ValidationError[] }`). This allows the UI to display multiple issues at once (e.g., three type mismatches and a cycle) rather than failing on the first error.
    *   **Runtime (`evaluate`):** Should throw only for "impossible" states that validation should have caught.
*   **Signal Future-proofing:** `Signal` should be an **open discriminated union**. While V1 only supports `symbol` and `bits`, the type definition should be structured so that adding `byte` or `hex` later requires zero architectural changes to the engine core.

### 3. Readiness to Act
The architecture is now mature enough for implementation. I am ready to begin **Step 1: Scaffold** and **Step 2: Core types** immediately upon approval.
