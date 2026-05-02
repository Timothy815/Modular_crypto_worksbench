# BYPASS-V1

## Status

Shipped in `v1.29.0` as a bounded usability and teaching slice.

## Purpose

Add a visible, reversible way to disable a module instance without deleting it from the graph.

The goal is not shortcut execution or graph simplification. The goal is:
- faster A/B comparison while teaching
- easier primitive isolation during exploration
- less graph surgery when students want to ask “what changes if this module does nothing?”

This slice should preserve MCW’s honesty:
- bypass must be visible on the module instance
- bypass must not pretend to work for modules where “identity pass-through” is ambiguous
- bypass must not hide structural differences in the graph

## Why Now

MCW now has a large enough primitive and teaching library that users increasingly want to:
- temporarily silence one transform inside a chain
- compare “with vs without this primitive” without rewiring
- debug a machine by turning one stage off at a time

That is especially useful in:
- tutorials
- guided challenges
- teacher-led demos
- modern multi-stage machines where editing the graph is heavier than toggling one node

## Core Product Rule

Bypass is an **instance-level inspection aid**, not a new primitive family.

It should behave like a visible patch-cable shortcut around a module instance, not like hidden optimizer logic.

## V1 Scope

Add a standard instance-level `bypass` flag for a bounded eligible set of modules.

### V1 Eligible Modules

Only modules that satisfy all of the following:
- exactly one input
- exactly one output
- same signal domain on input and output

Typical eligible examples:
- `Rotor`
- `Reflector`
- `Plugboard`
- `BitShifter`
- `Permutation`
- `SBox`
- `SymbolPermutation`
- `SymbolWindow`
- `BitWindow`
- `BitPad`
- `BitUnpad`

Eligibility should be determined explicitly in the implementation, not guessed from loose heuristics.
V1 now implements this as an explicit allow-list over modules that also satisfy the one-input / one-output / same-domain shape.

### V1 Behavior

When `bypass = true` on an eligible module instance:
- the instance remains present in the graph
- the instance continues to render and can still be selected/analyzed as an object
- execution returns the input signal unchanged on the output
- validation should not fail merely because the module is bypassed
- the UI should mark the node clearly as bypassed

When `bypass = false`:
- normal module behavior applies

## Required UX

V1 should include:
- a simple `Bypass` toggle in the parameter inspector for eligible instances
- a clear node-level visual state for bypassed modules
- at least one demo/tutorial/challenge that uses bypass as a teaching move

The UI must make it obvious that:
- the module still exists
- the graph still routes through that instance
- the transform is currently disabled

## Explicit Exclusions

V1 does **not** include universal bypass.

Do not support bypass yet for:
- multi-input modules like `XOR`, `AND`, `OR`, `Mux`
- multi-output modules like `BitSplit`, `Demux`
- source modules like `HexSource`, `Clock`, `IV`, `Nonce`, `Salt`
- sink/output modules like `Output`, `BitOutput`
- domain-changing bridges like `TextToBits`, `BitsToHex`, `BitsToSymbol`
- clearly stateful generators like `LFSR`, `Counter`
- iterator/composite-specific bypass semantics

These are excluded because “straight through without alteration” is not honest or not uniquely defined for them.

## Teaching Goal

The first teaching loop should prove one concept:

“A machine can keep its structure while one transform is temporarily neutralized.”

Good first examples:
- compare a pipeline with and without `BitShifter`
- compare a rotor chain with one rotor bypassed
- compare a permutation lab with one routing stage neutralized

The lesson is not “bypass is magic.”
The lesson is:
- structure stays visible
- contribution of one stage becomes easier to isolate

## Good V1 Demo Shape

```text
HexSource -> BitShifter -> XOR -> BitsToHex -> Output
```

With the tutorial explicitly asking the student to:
- inspect the original transformed output
- bypass `BitShifter`
- observe the changed downstream result
- re-enable it

## Validation / Engine Notes

V1 should prefer an explicit allow-list on module definitions or instance capabilities.

Avoid:
- silently exposing bypass on modules with ambiguous identity behavior
- introducing special-case bypass rewrites in unrelated engine systems
- treating bypass as graph deletion

## Success Criteria

V1 is successful if MCW gains:
- a clear, honest bypass toggle for eligible modules
- visible bypassed-node state
- one demo, one tutorial, one challenge using the feature
- no ambiguity about what is or is not bypassable

## Explicitly Avoid Next

Do not widen this into:
- optimizer-style dead-stage elimination
- automatic “solo/mute” systems
- universal bypass on every module
- composite-wide bypass graphs
- hidden rewiring
- preset compare/overlay automation

Keep it small, visible, and instance-local.
