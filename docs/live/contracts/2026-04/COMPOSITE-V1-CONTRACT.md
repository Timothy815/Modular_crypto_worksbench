# MCW — Composite V1 Contract

**Status:** Draft for Implementation  
**Branch:** `feature/composite-groundwork`  
**Purpose:** Lock the first composite-module milestone before code changes begin.

---

## 1. Goal

Composite modules are the next major capability after the minimal UI milestone.

They allow a user to take a subgraph of existing modules, expose selected ports, and reuse that subgraph as a single module in later graphs.

The first composite milestone must prove:
- composites are serializable
- composites behave like primitive modules from the outside
- composites preserve explicit graph structure internally
- composites do not weaken engine/UI separation

This milestone is **not** the full nested editor.

---

## 2. Core Requirements

### 2.1 Composite Modules Are First-Class

A composite must be usable anywhere a primitive module is usable.

From the outside, a composite exposes:
- `id`
- `name`
- typed `inputs`
- typed `outputs`
- `paramSchema` if needed later

For V1 groundwork, composites may use an empty `paramSchema` unless parameter forwarding is explicitly implemented.

### 2.2 Internal Structure Remains Explicit

A composite is not a hidden algorithm blob.

It contains:
- an internal `Project`
- a mapping of external input ports to internal module input ports
- a mapping of external output ports to internal module output ports

The internal graph remains a normal MCW graph built from existing modules.

### 2.3 Engine Purity Must Hold

`src/engine/` must remain free of UI and persistence concerns.

Composite execution must not depend on:
- layout
- annotations
- editor selection state
- any `src/ui/*` surface

### 2.4 Persistence Must Distinguish Graph vs Workbench Data

Composite definitions belong to the reusable-definition layer, not to UI layout metadata.

Projects/workbench documents may reference composites, but layout/annotation data must remain outside engine definitions.

---

## 3. V1 Composite Data Model

### 3.1 Engine-Facing Shape

The engine needs a serializable composite definition shape conceptually equivalent to:

```ts
interface CompositePortBinding {
  externalPort: string;
  internalModuleId: string;
  internalPort: string;
}

interface CompositeDef {
  id: string;
  name: string;
  kind: 'composite';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  project: Project;
  inputBindings: CompositePortBinding[];
  outputBindings: CompositePortBinding[];
}
```

Notes:
- exact naming can change during implementation
- the important part is the separation of:
  - exposed ports
  - internal graph
  - binding map between the two

### 3.2 Registry Surface

The registry must eventually be able to hold both:
- primitive module definitions
- composite module definitions

For the first composite slice, this can be modeled as:
- extending `ModuleDef`
- or creating a discriminated union around primitive/composite defs

The design must keep the primitive path simple.

### 3.3 Project Instances

A placed composite still appears as a normal `ModuleInstance`:

```ts
interface ModuleInstance {
  id: string;
  defId: string;
  params: ModuleParams;
}
```

That means:
- projects do not need a different instance shape for composites
- only the definition layer changes

---

## 4. Execution Semantics

### 4.1 Composite Behavior

From the caller’s perspective, a composite behaves like a primitive:
- inputs arrive at external ports
- outputs leave from external ports
- execution is deterministic

### 4.2 Recommended First Implementation Strategy

For V1 composite groundwork, the safest execution strategy is:

1. Expand the composite into an executable internal graph representation
2. Inject external inputs into the bound internal ports
3. Execute the internal graph with the existing deterministic engine
4. Read outputs from the bound internal output ports

This can happen:
- at evaluation time
- or through a pre-expansion helper

Either is acceptable if:
- the engine remains pure
- traceability is preserved
- the implementation stays understandable

### 4.3 Explicit Non-Goals

This milestone does **not** require:
- recursive visual editing UI
- arbitrary param forwarding
- stateful composite internals
- automatic version migration

---

## 5. Validation Rules

Composite definitions must validate:
- internal graph is a valid DAG
- all bound internal ports exist
- external input bindings map only to internal input ports
- external output bindings map only to internal output ports
- bound port signal types match exactly
- exposed external port names are unique

Validation must fail before runtime if a composite definition is structurally invalid.

---

## 6. Persistence Model

### 6.1 Composite Library Layer

The first persistence shape should distinguish:

1. **Project / Workbench Document**
   - placed module instances
   - graph connections
   - layout
   - annotations

2. **Composite Definition Library**
   - reusable composite definitions

### 6.2 Recommended V1 Persistence Shape

Conceptually:

```ts
interface CompositeLibraryEntry {
  id: string;
  name: string;
  version: number;
  definition: CompositeDef;
}
```

Workbench/project persistence may then reference composite `defId`s the same way it references primitive `defId`s.

### 6.3 Versioning

For the first composite milestone:
- support a simple `version: number`
- do not implement migrations yet
- document that migrations will matter later

---

## 7. Minimum UI Proof

The first UI proof should stay narrow.

Required:
1. Select a small existing subgraph
2. Save it as a composite definition
3. Add that composite to the palette/library
4. Place the composite in a graph
5. Execute it successfully as if it were a primitive

Not required yet:
- entering the composite to edit internals
- nested canvas editing
- advanced composite library management
- drag-to-select subgraph polish

---

## 8. Suggested Implementation Order

1. Add this contract and keep it as the source of truth for the branch
2. Define composite engine/persistence types
3. Add composite-definition validation
4. Add composite execution support
5. Add one engine-level proof test
6. Add minimal persistence/library support
7. Add minimal UI proof

---

## 9. Immediate Risks To Avoid

### 9.1 Do Not Smuggle UI Metadata Into Engine Definitions

Composite definitions must not contain:
- canvas layout
- note annotations
- theme state

### 9.2 Do Not Hide Internal Domain Crossings

A composite may encapsulate internal steps, but its saved internal graph must remain explicit and inspectable.

### 9.3 Do Not Overbuild The UI First

The nested editor can come later.
This phase should prove composite semantics, not polish the final composite UX.

---

## 10. Success Criteria

This milestone is successful when:
- the codebase has a clear composite definition model
- the engine can execute a composite like a primitive
- composites can be serialized and reloaded
- one end-to-end UI proof exists
- the engine/UI separation remains intact

If those conditions are met, the project will be ready to grow into true reusable machine-building rather than only single-graph editing.
