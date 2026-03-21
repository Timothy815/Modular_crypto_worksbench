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
type ParamKind = 'number' | 'string' | 'boolean' | 'select' | 'wiring';

interface ParamFieldDef {
  key: string;
  label: string;
  kind: ParamKind;
  defaultValue: unknown;
  options?: string[]; // Required for 'select'
}
```

### 2.3 Module Registry
Definitions are managed by a central `ModuleRegistry` class to ensure ID uniqueness and provide lookup for the executor and validator.

### 2.4 Error Model
- **Validation:** Returns a `ValidationResult` object (collection of errors). Does not throw.
- **Runtime (Executor):** Throws immediately if it encounters an invalid state that should have been caught by validation.

### 2.5 Execution Model
**Iterative Topological Order:**
1. Validate Graph.
2. Compute Topological Sort.
3. Iterate through sorted list.
4. Each module `evaluate()` called once.
5. Store results in a run-local `Map<string, Signal>`.

---

## 3. The Sprint Backlog (Implementation Sequence)

1.  **Scaffold:** Vite + React + TS + Vitest configuration.
2.  **Infrastructure:** `types.ts`, `registry.ts`, and the `ModuleRegistry` instance.
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
