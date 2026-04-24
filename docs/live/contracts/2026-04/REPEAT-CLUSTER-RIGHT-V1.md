# Repeat Cluster Right V1

Last updated: April 24, 2026

Status: Shipped on `main`.

## Purpose

Define a bounded authoring-power slice for repeated round and lane structures.

MCW already supports:
- duplicate selected cluster
- preserve internal topology and port placement
- selection-scoped autowire helpers

The remaining friction is the hand step after duplication:
- duplicate a working round
- drag it into place
- reconnect the old boundary outputs into the duplicate boundary inputs

That is still too manual for repeated cipher structures.

## Product Problem

When an author builds:
- repeated rounds
- repeated lane banks
- paired data/key schedule stages

they often want one explicit operation:

**take this finished cluster, place another copy to the right, and connect the current cluster into the new one.**

The current toolset gets close, but still leaves the reconnect step manual.

## V1 Goal

Add one explicit authoring action:

- `Repeat Right`

This action should:
- duplicate the selected cluster to the right
- preserve the duplicate as normal local graph structure
- reconnect exposed outputs from the source cluster into the exposed inputs of the duplicate
- select the new duplicate immediately

## Include

V1 includes:
- one explicit action in workspace authoring surfaces
- same deterministic duplicate placement as current same-workspace duplication
- one deterministic reconnect rule for source-to-duplicate boundary wiring
- immediate selection handoff to the new duplicate

## Boundary Wiring Rule

V1 uses one bounded reconnect heuristic:

- source side: boundary output ports of the selected cluster
- duplicate side: boundary input ports of the duplicated cluster
- pairing: top-to-bottom positional order, preserving signal compatibility

This is intentionally simple.

It is meant for repeated explicit machine structure, not arbitrary graph inference.

## Exclude

Do not include:
- linked clones
- hidden macros
- inferred multi-copy generation
- automatic numbering or renaming
- bidirectional cluster bridging
- vertical repeat in the same slice
- generic “guess the intended topology” behavior

## Success Condition

This slice is complete when an author can:
- select a working round or lane cluster
- invoke `Repeat Right`
- get a duplicate to the right
- see the expected source-to-duplicate boundary wires created automatically
- continue editing the new copy immediately

The result must still feel like explicit machine authoring, not template magic.
