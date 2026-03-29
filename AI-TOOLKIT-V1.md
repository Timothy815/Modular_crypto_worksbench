# AI-TOOLKIT-V1

Status: Proposed

Owner: Codex
Scope: UI / Export / Product Surface

## Why

MCW is now rich enough that an external AI system could be useful as a layout authoring assistant:
- generate a workbench JSON layout from a natural-language spec
- generate lab starter layouts quickly
- scaffold challenge documents
- help instructors create bounded experiments without building every graph by hand

But an LLM can only do that well if it knows:
- MCW document shape
- supported primitives and structured features
- signal-domain rules
- common authoring patterns
- challenge/export constraints

That knowledge should not depend on a user manually reverse-engineering the repo or inventing their own prompt every time.

MCW should provide a bounded AI toolkit package that users can hand to ChatGPT, Gemini, Claude, or another external model so the model can generate MCW-compatible JSON documents more reliably.

## Goal

Add a `AI Toolkit` entry to `Resources` that lets a user download a bounded package for external LLM use.

That package should help an external AI generate:
- workspace JSON layouts
- challenge JSON documents
- structurally valid MCW graphs

The package should function as an AI-facing authoring reference, not as an embedded AI integration.

## Non-Goals

- No in-product chatbot
- No API integration with OpenAI, Anthropic, Google, or any other provider
- No server-side generation service
- No autonomous graph editing by the app itself
- No promise that AI-generated layouts are automatically valid or pedagogically good
- No replacement for the existing verification and challenge authoring workflows

## Required V1 Shape

1. `Resources` must include an `AI Toolkit` action.
2. That action must download a bounded package, not open a third-party AI site directly.
3. The package must include:
   - a concise system/use prompt for an external LLM
   - MCW document-shape guidance for workspace JSON
   - challenge-document guidance for challenge JSON
   - a bounded feature inventory of currently supported primitives and structured authoring features
   - explicit rules about typed signals and no hidden conversions
4. The package must be designed for external model prompting, not for machine execution by MCW itself.
5. The package must be extendable as MCW grows.
6. The package must clearly distinguish:
   - what an AI may generate
   - what the user must still verify inside MCW
7. The toolkit must present MCW as a graph-based systems IDE, not as a freeform code interpreter.
8. The toolkit must explicitly instruct the external model to emit valid MCW JSON artifacts rather than prose when requested.
9. The toolkit must stay bounded. It should be a reference pack, not a full documentation mirror.

## Expected V1 Package Contents

### Prompt File

A reusable prompt scaffold that tells an external model:
- what MCW is
- what artifact types it can generate
- how to stay within MCW’s typed graph rules
- how to avoid invalid hidden conversions or unsupported structures

### Workspace JSON Guide

A bounded explanation of:
- `WorkbenchDocument`
- `project`
- `modules`
- `connections`
- `ui.layout`
- `ui.annotations`

### Challenge JSON Guide

A bounded explanation of:
- guided challenge shape
- starting project vs target project
- hints
- challenge intent

### Feature Inventory

A concise AI-facing summary of:
- major primitive families
- composites / iterators / structured reuse
- stateful vs stateless expectations
- learning/verification/export-relevant surfaces only where useful for generation

### Worked Examples

A small number of examples showing:
- one simple workspace JSON
- one structured machine example
- one challenge-document example

## UX Rules

- The user should be able to find the toolkit from `Resources` without coaching.
- The toolkit should feel like a practical handoff pack, not like raw internal notes.
- The content should be concise enough to paste into an external AI workflow.
- The package should clearly warn that generated layouts still need validation and human review inside MCW.

## Success Condition

This slice is successful if:
- a user can download the AI toolkit from `Resources`
- the package gives an external LLM enough bounded context to generate plausible MCW JSON artifacts
- the package is clear about constraints, limits, and the need for verification inside MCW
- the content is structured so it can be updated as MCW grows

## Notes

This is an AI-facing export/help artifact, not an embedded AI product surface.

The value is:
- faster lab setup
- faster challenge scaffolding
- easier instructor prompting
- a cleaner bridge between MCW and external LLM tooling

The trust boundary must remain explicit:
- AI can propose layouts
- MCW still validates, runs, verifies, and exports them
