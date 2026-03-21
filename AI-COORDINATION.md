# MCW — AI Coordination Protocol

This document defines how multiple AI agents collaborate on MCW without drifting, duplicating work, or editing the same surfaces with conflicting assumptions.

---

## Source of Truth

Use the documents in this order:

1. `ENGINE-V1-CONTRACT.md`
2. `PROJECT.md`
3. `DISCUSSION-FIRST-STEPS.md`
4. agent-specific context files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`)

Interpretation:
- `ENGINE-V1-CONTRACT.md` governs implementation decisions for the first engine slice.
- `PROJECT.md` governs product intent and long-range architecture.
- `DISCUSSION-FIRST-STEPS.md` is discussion history and review context.
- Agent context files are summaries, not higher authority than the contract.

If two documents conflict during implementation, the contract wins unless the team explicitly revises it.

---

## Shared Working Rules

- The engine layer is pure and dependency-free.
- No hidden signal coercions are allowed.
- V1 execution is iterative and topological, not pull-recursive.
- V1 `evaluate()` is stateless.
- Validation is required before execution.
- `ParamSchema` exists from the beginning.

No agent should re-open these decisions while implementation is underway unless they find a concrete contradiction in code or tests.

---

## Ownership Model

Each agent should work in an explicitly bounded area.

- Architect:
  - engine contracts
  - type boundaries
  - validation rules
  - executor structure
  - cross-cutting integration decisions
- Module implementer:
  - primitive module definitions
  - module-level tests
- Reviewer / systems critic:
  - challenge assumptions
  - inspect execution model consequences
  - review edge cases, regressions, and design drift

No agent should edit files outside its assigned scope unless:
- the owner is finished
- the owner explicitly delegates
- the change is necessary to unblock integration and is documented

---

## Change Coordination

Before making changes, each agent should state:
- what files it intends to modify
- what assumptions it is relying on
- whether the work depends on unfinished edits by another agent

After making changes, each agent should report:
- files changed
- decisions encoded in those files
- follow-up work created for other agents
- any unresolved risks

---

## File-Level Expectations

Treat these files as architect-owned until the core engine is stable:
- `ENGINE-V1-CONTRACT.md`
- `AI-COORDINATION.md`
- `AI-WORKSTREAMS.md`
- `src/engine/types.ts`
- `src/engine/validation.ts`
- `src/engine/executor.ts`

Treat these paths as module-implementer-owned once scaffolded:
- `src/engine/modules/`
- `src/engine/modules/*.test.ts`

If shared edits become necessary, the agent making them must describe why.

---

## Handoff Standard

Every handoff should include:
- current branch/workspace assumptions
- exact files touched
- what is done
- what is intentionally not done
- what another agent can safely begin next

Good handoffs are short and concrete. Avoid broad prose summaries when a bounded task list is enough.

---

## Stop Conditions

An agent should stop and escalate instead of guessing if:
- a contract document and implementation requirements materially conflict
- another agent is already actively editing the same file set
- a requested change would violate engine-layer purity
- the right answer changes the V1 contract rather than implementing it

---

## Implementation Priority

The project should proceed in this order:

1. engine scaffold and core types
2. validation
3. executor
4. first general-purpose primitive modules
5. module tests
6. integration tests
7. symbol-domain rotor/reflector modules
8. later UI and persistence work

This priority is locked for the current kickoff unless the team deliberately revises the contract.
