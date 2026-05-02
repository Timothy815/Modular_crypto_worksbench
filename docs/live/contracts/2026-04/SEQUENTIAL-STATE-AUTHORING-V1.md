# SEQUENTIAL-STATE-AUTHORING-V1

## Why this exists

MCW can already build real sequential machines:
- `Clock`
- `Counter`
- `LFSR`
- rotor stepping systems
- conditional clocking systems
- selector- and control-driven temporal workspaces

Those machines are valid and teachable, but they are still harder to read at a glance than
combinational pipelines. Students often have to infer:
- which modules actually hold evolving state
- which modules are only shaping control
- which modules are just showing the result

The pain point is real, but the first fix must stay small and metadata-free.

## Problem

Sequential workspaces are visually denser than they need to be:
- state-holding modules are mixed in with ordinary helpers
- control/timing modules do not read differently enough from state modules
- sinks and observation points can blend into the same visual layer as the mechanism itself

This makes "what changes each tick?" harder to answer than it should be.

## Goal

Make sequential workspaces easier to read without changing engine semantics, project state, export,
or layout systems.

## Non-goals

- No new engine execution model
- No new primitive family
- No new project or `ModuleInstance` fields
- No user-authored sequential grouping metadata
- No stage bands, wrappers, or bank overlays in V1
- No hidden scheduler
- No automatic rewiring or graph mutation
- No export/codegen changes

## Required V1 shape

1. Ship exactly one mechanism: **computed role badges**.
2. Badges must be derived at render time from existing module-definition information.
3. V1 must add **no new persistent metadata** to:
   - `Project`
   - `ModuleInstance`
   - serialized workspaces
4. Badges must appear **only in ticked mode**.
5. V1 must clearly distinguish three roles:
   - `State`
   - `Control`
   - `Observe`
6. Modules with no role should remain unbadged.
7. The badges must be visually secondary to the graph and must not dominate small workspaces.
8. The feature must work in already-shipped sequential families such as:
   - `LFSR Predictability Lab`
   - conditional clocking labs
   - rotor control-bank style labs
9. The feature must not change:
   - execution order
   - validation behavior
   - Python export
   - JSON save/load shape

## Role mapping

V1 must use a fixed derived mapping rather than user assignment.

Recommended bounded mapping:

- `State`
  - modules whose behavior depends on explicit ticked state
  - examples: `LFSR`, `Counter`, `Rotor`
- `Control`
  - modules that shape timing, gating, or selection rather than storing the main evolving state
  - examples: `Clock`, `Gate`, `Mux`, `Demux`, `Majority`, similar selector/control modules
- `Observe`
  - sink/output modules that primarily surface the machine result
  - examples: `Output`, `BitOutput`, `HexOutput`, `TextOutput`, `BaudotOutput`

Any module not in the derived bounded mapping should receive no badge in V1.

## Data-model impact

V1 is explicitly metadata-free.

- No new fields may be added to `Project`
- No new fields may be added to `ModuleInstance`
- No migration work is required
- No export compatibility changes are required

The roles are computed at render time only.

## UX rules

- Badges must be visible only when `isTickedMode === true`.
- A user should be able to identify the state/control/observe structure of a sequential machine in
  one glance.
- The badge style should be compact and visually subordinate to the node title and graph topology.
- Stateless workspaces should remain visually unchanged in normal mode.
- V1 should not introduce a second spatial organization system that competes with stage row/column
  layout.

## Teaching requirement

At least one already-shipped sequential teaching workspace should be used as the canonical example
for the feature, so students actually encounter it in context.

The clearest likely target is:
- `LFSR Predictability Lab`

## Success condition

After this slice:
- a student can open a ticked sequential workspace and quickly identify:
  - what holds state
  - what shapes control
  - what simply observes output
- a teacher can point to the graph and explain "what changes every tick" without adding a new
  lecture layer
- MCW gains a clearer language for time-evolving machines without widening the engine or project
  model

## Why this matters strategically

MCW is already strong at visible transformation graphs.

The next language-strengthening move is not another primitive. It is making sequential machines read
more fluently. The safe first step is semantic clarity, not a new state-bank system.
