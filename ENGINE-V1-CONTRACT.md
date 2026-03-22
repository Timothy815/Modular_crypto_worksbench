# MCW — Engine V1 Final Implementation Contract

**Status:** FINALIZED & LOCKED  
**Date:** March 20, 2026  
**Role:** Project Master Specification

---

## 1. Core Mandates
- **Engine Isolation:** `src/engine/` must have zero dependencies on `ui/` or `persistence/`.
- **Strict Typing:** No implicit signal conversion. `symbol` and `bits` are distinct.
- **Explicit Transformation:** All domain crossings require a visible module (e.g., `SymbolToBits`).
- **Deterministic Execution:** Same input + same graph = same output, every time.
- **Pure Evaluation:** `evaluate()` functions must be side-effect free.

---

## 2. Technical Specifications

### 2.1 Signal Types
```ts
type SignalType = 'symbol' | 'bits';
type SignalValue = string | number[]; // string for symbol, number[] for bits

interface Signal {
  type: SignalType;
  value: SignalValue;
}
```

### 2.2 Param Schema
Every `ModuleDef` must define its parameters using this schema to enable auto-generated UI and validation.
```ts
type ParamKind = 'number' | 'string' | 'boolean' | 'select' | 'wiring' | 'bits';

interface ParamOption {
  label: string;
  value: string;
}

interface ParamFieldDef {
  key: string;
  label: string;
  kind: ParamKind;
  defaultValue: unknown;
  required?: boolean;
  options?: ParamOption[]; // Used by 'select'
}
```

### 2.3 Module Registry
V1 uses a simple record-based registry:

```ts
type ModuleRegistry = Record<string, ModuleDef>;
```

This is sufficient for the first engine slice and keeps the shared interface simple for multiple agents. A dedicated registry class can be introduced later if dynamic registration or lifecycle behavior becomes necessary.

### 2.4 Reserved Port Names

- **`clock`** — Reserved input port for conditional advance of stateful modules. When connected, the ticked executor only calls `advance` if the signal is an active pulse (`{ type: 'bits', value: [1] }`). When unconnected, stateful modules advance every tick (backward compatible). See `ADVANCED-FOUNDRY-CLOCK-V1.md` §2.3 for full specification.

### 2.5 Error Model
- **Validation:** Returns a `ValidationResult` object (collection of errors). Does not throw.
- **Runtime (Executor):** Throws immediately if it encounters an invalid state that should have been caught by validation.

### 2.6 Execution Model
**Iterative Topological Order:**
1. Validate Graph.
2. Compute Topological Sort.
3. Iterate through sorted list.
4. Each module `evaluate()` called once.
5. Store results in run-local execution data keyed by module instance ID.

---

## 3. The Sprint Backlog (Implementation Sequence)

1.  **Scaffold:** Vite + React + TS + Vitest configuration.
2.  **Infrastructure:** `types.ts` and the shared `ModuleRegistry` type.
3.  **Validation:** `validation.ts` (Cycle detection, Type checking, Port validation).
4.  **Executor:** `executor.ts` (Topological sort + iterative loop).
5.  **General Primitives:** `TextInput`, `KeyInput`, `BitSource`, `SymbolToBits`, `BitsToSymbol`, `XOR`, `Output`.
6.  **Cipher Primitives:** `Rotor`, `Reflector`.
7.  **Verification:** Hybrid reference pipeline integration test.

---

## 4. Operational Standards
- **Testing:** Every module requires a `.test.ts` file covering valid and invalid inputs.
- **Documentation:** Use JSDoc for complex logic; keep code idiomatic and "boring."
- **Consistency:** Use `interface` for objects, `PascalCase` for types, and `kebab-case` for files.
- **Validation:** Graph validation includes structural checks and param validation against `paramSchema`.
