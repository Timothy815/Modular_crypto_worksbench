# Modular Cryptography Workbench (MCW)

## Overview

The Modular Cryptography Workbench (MCW) is a visual, composable cryptographic construction environment — a **cryptographic erector set** inspired by modular synthesizers.

It allows users to:
- Build encryption systems from modular components
- Combine classical and modern cryptographic techniques
- Create reusable composite components
- Observe and analyze transformations step-by-step
- Reconstruct historical cipher machines and invent new ones

This project treats cryptography as a **signal-processing system**, where data flows through transformations. Data is the signal, modules are transformations, wires are information flow.

### Origin

MCW grew out of a separate project — a **Paper Enigma Machine Maker/Simulator** — and the realization that the same modular thinking (rotors, reflectors, wiring) could be generalized into an open-ended construction environment. The Enigma project remains separate and focused on mechanical realism; MCW is the broader "cipher foundry" where any cryptographic system can be assembled.

### Core Metaphor

> "Build your own machine. Now break it."

Most crypto tools say "Here is AES" or "Here is Enigma." MCW says "Build your own cipher machine from parts, then test it, then try to break it." This shift from consumption to construction is the heart of the project.

---

## Core Philosophy

1. **Composition over implementation**
   - Users build systems from parts instead of selecting prebuilt algorithms

2. **Explicit transformation**
   - No hidden conversions between domains (symbol ↔ bit)
   - All transformations must be visible in the graph
   - Conversion modules are the "customs checkpoints" between signal domains

3. **Abstraction as a first-class feature**
   - Modules can be composed into reusable modules
   - Composite modules behave identically to primitive modules
   - Composites can be nested indefinitely

4. **Local-first, persistent structure**
   - Everything meaningful is serializable
   - Projects and modules are saved as structured data (JSON)
   - Persistence is foundational, not an afterthought — composition creates identity

5. **Separation of concerns**
   - Simulation engine ≠ UI ≠ persistence ≠ runtime state
   - Three distinct layers of data: **Definition** (what a module is), **Instance** (a placed module with params), **Runtime State** (ephemeral execution state)

---

## Signal Domains

MCW does not have two separate systems for classical and modern cryptography. It has **one unified system with multiple signal domains** connected by explicit bridge modules.

### Why Not Two Systems?

Splitting classical (symbol) and digital (bit) into separate systems would prevent the most exciting capability: **hybrid machines**. A single pipeline can cross centuries:

```
Text Input → Rotor → Reflector → Rotor → Encoder → XOR → Decoder → Output
```

That's half Enigma, half stream cipher, fully custom. This is where the "cryptographic erector set" becomes something special.

### Signal Types (V1)

```ts
type Signal =
  | { type: 'symbol'; value: string }     // 'A'
  | { type: 'bits'; value: number[] };     // [1,0,1,1,0]
```

Future signal type extensions: `byte`, `number`, `stream`

### Domain Rules

- Modules operate within a specific signal domain
- Ports must match signal types exactly — **no implicit conversion**
- Domain transitions require explicit conversion modules (e.g., `SymbolToBits`)
- This is a teaching feature, not a limitation — students see the boundary between classical and modern cryptography

### What This Unlocks

- **Enigma** → stays entirely in symbol domain
- **Lorenz** → mostly bit domain with encoding layer
- **Modern ciphers** → fully bit domain
- **Hybrid machines** → cross domains freely with explicit bridges
- Students literally watch: `letter → number → bits → transformed → bits → number → letter`

---

## Core Concepts

### Modules

A **module** is the fundamental unit of computation, defined by `ModuleDef`:

```ts
type ModuleDef = {
  id: string;
  name: string;
  inputs: { name: string; type: Signal['type'] }[];
  outputs: { name: string; type: Signal['type'] }[];
  params: Record<string, any>;
  evaluate: (inputs: Record<string, Signal>, params: any) => Record<string, Signal>;
};
```

- `id` — unique identifier for the module definition
- `name` — human-readable display name
- `inputs` / `outputs` — typed ports; `type` must be `'symbol'` or `'bits'`
- `params` — default/schema for module-specific configuration (e.g., shift amount for Caesar)
- `evaluate` — pure function that transforms input signals to output signals

A `ModuleDef` is a **blueprint**. To place a module in a graph, you create a `ModuleInstance`:

```ts
type ModuleInstance = {
  id: string;
  defId: string;
  params: Record<string, any>;
};
```

- `id` — unique identifier for this instance within the graph
- `defId` — references the `ModuleDef.id` this instance is built from
- `params` — instance-specific parameter values (overrides the definition's defaults)

This separation means a single `ModuleDef` (e.g., `CaesarShift`) can appear multiple times in a graph with different parameters.

#### Primitive Modules (V1 — Minimum Viable Set)

| Module            | Domain   | Description                              |
|-------------------|----------|------------------------------------------|
| `TextInput`       | source   | Provides plaintext input                 |
| `KeyInput`        | source   | Provides key input                       |
| `Rotor`           | symbol   | Substitution via configurable wiring + position |
| `Reflector`       | symbol   | Involutive mapping (self-inverse pairs)  |
| `SymbolToBits`    | convert  | Encodes a symbol as a bit array          |
| `BitsToSymbol`    | convert  | Decodes a bit array back to a symbol     |
| `XOR`             | bits     | Bitwise XOR of two bit arrays            |
| `BitSource`       | source   | Static or repeating bit stream           |
| `Output`          | sink     | Displays final result                    |

#### Future Module Types (Post-V1)

| Module             | Domain   | Description                              |
|--------------------|----------|------------------------------------------|
| `CaesarShift`      | symbol   | Shifts a symbol by a key offset          |
| `Vigenere`         | symbol   | Polyalphabetic substitution              |
| `SBox`             | bits     | Substitution box (configurable lookup)   |
| `Permutation`      | bits     | Bit permutation / transposition          |
| `BitShifter`       | bits     | Logical/circular bit shifts              |
| `LFSR`             | bits     | Linear feedback shift register           |
| `KeyStreamGen`     | bits     | Key stream generator                     |
| `Substitution`     | symbol   | General substitution cipher              |
| `Transposition`    | symbol   | Columnar/rail-fence transposition        |
| `Clock`            | control  | Stepping/clocking for stateful systems   |
| `BaudotEncoder`    | convert  | Baudot code conversion                   |
| `HexEncoder`       | convert  | Hexadecimal conversion                   |
| `AsciiEncoder`     | convert  | ASCII conversion                         |

#### Composite Modules

A composite module wraps a subgraph of connected modules into a single reusable unit. It exposes selected internal ports as its own inputs/outputs. Composite modules are first-class — they can be nested, saved, and shared.

**Example:** Select Rotor → Reflector → Rotor, save as "Simple Enigma Core v1". Now drop that composite into a larger system: `Text → EnigmaCore → Encoder → XOR → Decoder`

Composite modules:
- Must behave identically to primitive modules from the outside
- May contain internal graphs
- May be nested indefinitely
- Can be "entered" to view/edit internals
- Are versioned — projects bind to specific versions

### Graph

The **graph** is a directed acyclic graph (DAG) of module instances connected by `Connection`s. Each connection links one output port to one input port.

```ts
type Connection = {
  from: { moduleId: string; port: string };
  to:   { moduleId: string; port: string };
};
```

- `moduleId` — references a `ModuleInstance.id` in the graph
- `port` — name of an output (on `from`) or input (on `to`) defined by the module's `ModuleDef`

A `Project` is the top-level serializable unit — a collection of instances and connections:

```ts
type Project = {
  modules: ModuleInstance[];
  connections: Connection[];
};
```

### Execution Model

**Pull-based, recursive evaluation:**

1. Request output from the final node
2. It recursively resolves its inputs
3. Each module evaluates once per run
4. Topological sort determines execution order

**Constraints (V1):**
- Deterministic — same inputs always produce same outputs
- Synchronous — no async behavior
- No clocks or stepping (stateful modules like rotors use params for position)
- No feedback loops
- Side effects are not permitted inside `evaluate()`

---

## Persistence Model

Persistence is foundational because **composition creates identity**. The moment a user saves a composite as "Custom Naval Rotor Stack A," it becomes a named object with identity that other projects can reference.

### Three Layers of Data

| Layer            | What it is                     | Persistence         |
|------------------|--------------------------------|----------------------|
| **Definition**   | What a module is (blueprint)   | Saved permanently    |
| **Instance**     | A placed module with params    | Saved with project   |
| **Runtime State**| Ephemeral execution values     | Not saved            |

This separation prevents: changing one rotor from altering six projects, saved machines forgetting stepping state, editing a component from mutating older machines.

### Storage Layers

1. **Project File** — instances, connections, layout, references to definitions
2. **Module Definitions** — primitive and composite, parameter schema, port definitions, internal graph (if composite)
3. **Library Index** (future) — catalog of reusable modules, version tracking, metadata

### Versioning Strategy

- Every module definition has a version
- Projects reference specific versions
- Updates do **NOT** automatically mutate existing projects
- Users can choose to upgrade to newer versions

### Embed vs Reference

When a composite module is used in a project:
- **Embed by value** — portable, stable, but duplicates definitions
- **Reference by identity** — centralized reuse, but requires version tracking
- **Hybrid (recommended)** — reusable modules have stable IDs; projects can reference a version or embed a snapshot

### Format

- JSON-based serialization
- Explicit IDs for all entities
- Include `schemaVersion` in all saved formats from day one

---

## Architecture

```
src/
├── engine/           # Simulation engine (pure logic, no UI)
│   ├── types.ts      # Signal, ModuleDef, ModuleInstance, Connection, Project
│   ├── modules/      # Primitive module implementations
│   ├── graph.ts      # Graph construction and validation
│   ├── executor.ts   # Topological sort + pull-based execution
│   └── composite.ts  # Composite module creation
├── ui/               # Visual interface (React + canvas/SVG)
│   ├── components/   # React components
│   ├── canvas/       # Node-graph rendering
│   └── state/        # UI state management
├── persistence/      # Save/load projects and modules
│   ├── serializer.ts
│   └── storage.ts
└── utils/            # Shared utilities (alphabet, bit ops)
```

### Layer Responsibilities

| Layer         | Responsibility                          | Dependencies        |
|---------------|-----------------------------------------|----------------------|
| `engine`      | Types, modules, graph, execution        | None                 |
| `ui`          | Rendering, interaction, layout          | `engine`             |
| `persistence` | Serialization, local storage            | `engine`             |
| `utils`       | Helpers (alphabet, bit ops)             | None                 |

The `engine` layer has **zero dependencies** on UI or persistence. It must be fully testable in isolation. The engine should not care whether the front end is browser, desktop wrapper, CLI, or future mobile interface.

---

## Tech Stack

| Concern       | Technology                              |
|---------------|-----------------------------------------|
| Language      | TypeScript (strict mode)                |
| Runtime       | Browser (Vite + React)                  |
| UI Framework  | React 18+                               |
| Graph Render  | React Flow or custom SVG/Canvas         |
| State         | Zustand or React context                |
| Persistence   | localStorage / IndexedDB                |
| Testing       | Vitest                                  |
| Linting       | ESLint + Prettier                       |

### Why Web-First?

- The project is fundamentally visual and interactive — browsers handle node editors, animation, and canvas rendering well
- No installation friction for classroom use — share by link
- Supports gradual growth: local-only → cloud saves → shared libraries → classroom mode
- Desktop packaging (Electron/Tauri) remains an option later if the engine is clean
- Web Workers and WebAssembly available if performance becomes a bottleneck

---

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use discriminated unions for signal types
- No `any` — use `unknown` + type guards where needed
- Pure functions in the engine layer — no side effects

### Testing
- Engine modules must have unit tests for all signal type combinations
- Graph execution must be tested with known-answer vectors
- Composite modules must be tested for equivalence with their expanded graphs

### Naming Conventions
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Module type identifiers: `PascalCase` strings (e.g., `"CaesarShift"`)

### Git Workflow
- Commit messages: imperative mood, concise (e.g., "Add XOR module")
- Feature branches off `main`
- PRs require passing tests

---

## Development Phases

### Phase 1: Engine First
- Define data models (Signal, ModuleDef, ModuleInstance, Connection, Project)
- Implement module evaluation for core V1 modules
- Build execution graph traversal (topological sort + pull-based resolution)
- Hardcode primitive modules
- Unit tests for all modules

### Phase 2: Minimal UI
- Add modules to canvas manually
- Define connections manually
- Run pipeline and display output
- Parameter editing panel

### Phase 3: Usability
- Drag-and-drop module placement
- Wire-style connections between modules
- Save/load projects (JSON)
- Inspector panel for intermediate values

### Phase 4: Composition
- Create composite modules from selected subgraphs
- Save reusable components to local library
- Load composites into new projects
- Composite versioning

### Phase 5: Expansion
- Add more module types (S-boxes, LFSRs, permutations, etc.)
- Step-through execution mode
- Signal tracing / probing on wires
- Visual animation of transformations
- Module templates for famous systems (Enigma, Lorenz, DES-like SP networks, Feistel networks)

---

## V1 Milestone

The V1 milestone delivers:
1. Core primitive modules (TextInput, Rotor, Reflector, SymbolToBits, BitsToSymbol, XOR, BitSource, Output)
2. Graph construction, validation, and execution
3. Composite module creation from subgraphs
4. Basic visual node-graph editor (connect, configure, run)
5. Save/load projects to local storage
6. Step-by-step execution visualization

### V1 Success Criteria

You should be able to:
1. Build a pipeline
2. Run it
3. See output
4. Save it
5. Reload it
6. Wrap part of it into a reusable module

At that point, the system is alive.

### Out of Scope for V1
- Authentication / accounts
- Cloud storage
- Collaboration / multi-user
- Async execution
- Feedback loops
- Clocking / stepping (stateful advance)
- Advanced cryptography (AES, RSA, ECC)
- Custom module scripting
- Performance optimization for large graphs

---

## Long-Term Vision

### Educational Tool
- Demonstrate the transition from classical → modern cryptography
- Visualize intermediate states at every stage
- Enable experimentation and deliberate failure
- Students design cipher machines, swap them, and attempt to break each other's systems ("cipher duels")
- Functions as both a simulator and a teaching tool
- CTF challenge generator — introduce weaknesses intentionally

### Construction System
- Users build custom cipher machines from scratch
- Systems can be shared, cloned, and analyzed
- Hybrid cryptographic designs emerge naturally from the modular system
- Export a built system as a named "machine"

### Advanced Features (Future)
- Step-through execution with pause/resume
- Signal tracing / wire probing
- Visual animation of data flowing between modules
- Library marketplace for community-built modules
- Classroom mode with assignments and galleries
- Version diffing of machines
- Toggle between hardware-like and abstract views
- Machine templates for famous systems
- Desktop packaging via Electron or Tauri

### Guiding Principle

> Build a system where cryptography is not just used, but assembled, explored, and understood through construction.
