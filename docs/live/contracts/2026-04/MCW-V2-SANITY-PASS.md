# MCW V2 Sanity Pass

## Status

Proposed after `v1.44.0`.

## Purpose

Consolidate MCW after the completed teaching-surface expansion arc so the product remains teachable, navigable, and coherent as a systems workbench.

This slice exists to solve the next strategic product gap after `v1.44.0`:
- the workbench now spans primitives, machines, properties, and first systems composition
- the teaching library is broad enough that organization and scale are now product concerns of their own
- the next high-value move is no longer another missing cryptographic concept family
- MCW needs a bounded pass that protects usability and curriculum coherence before any certificate, trust-chain, or deeper protocol follow-on

The goal is not to relabel the whole product cosmetically.
The goal is to make one bounded cohesion pass that keeps the workbench from turning into a flat pile of powerful parts.

## Strategic Principle

**V2 should consolidate structure before expanding scope.**

That means:
- improve how existing teaching surfaces are organized before adding major new ones
- improve navigation through existing capability before opening more advanced trust or protocol lines
- preserve explicit machine construction rather than hiding complexity behind new wrappers
- treat classroom usability as a first-class product concern

## Why Now

MCW now has:
- completed modern symmetric-composition teaching
- completed asymmetric-foundations teaching
- one bounded systems-composition handshake surface
- a large and growing teaching library across demos, tutorials, and challenges

That means the next honest step is not ECC, PKI, or another handshake variant.
The next honest step is a bounded sanity pass that checks whether the product’s organization still matches its depth.

## V2 Scope

V2 should stay bounded to **one product-level organization and coherence pass over the shipped workbench experience**.

Primary user story:
- find the right learning path without already knowing the entire library
- understand how simple labs lead into larger systems-level demos
- use the workbench without feeling lost in a flat list of increasingly complex artifacts

## Included

- one bounded audit of learning-library organization
- one bounded audit of palette/category clarity where scale now causes confusion
- one bounded audit of system-level demo usability and navigation
- one visible product framing pass that clarifies what MCW now is after `v1.44.0`
- one written audit deliverable describing what holds up, what does not, and whether one bounded implementation fix is justified
- one resulting contract or implementation slice only if the audit identifies a concrete, bounded fix

## Explicitly Excluded

Do not include in V2:
- new cryptographic primitive families
- certificate chains, PKI, or trust stores
- ECC or post-quantum lines
- cloud collaboration or sharing systems
- generic “workspace folders everywhere” sprawl without a bounded problem statement
- a broad visual redesign disconnected from actual product friction

## Candidate Teaching / Product Surface

The sanity pass should examine three pressure points:

1. **Learning-library hierarchy**
   - whether current stages and ordering are sufficient now that the library spans from XOR to handshakes
   - whether larger systems-level labs need clearer grouping or pathfinding

2. **Palette and category coherence**
   - whether the primitive palette still guides users from foundations toward composition cleanly
   - whether category names and grouping still fit the current product depth

3. **Large-workspace usability**
   - whether 15–20+ module demos remain comfortable to inspect, move, and reason about
   - whether existing hints, grouping, and workspace controls are sufficient for the first systems-level labs

## Core Rules

1. **Consolidate before expanding**
   - do not open a new cryptographic concept family inside this pass

2. **Keep it bounded**
   - one product-level sanity contract
   - one resulting implementation slice only if the audit identifies one clear, high-leverage fix

3. **Stay evidence-driven**
   - prefer issues grounded in the current shipped/framed product over speculative redesign

4. **Do not hide structure**
   - any UX improvement must preserve MCW’s explicit-machine philosophy

## Success Criteria

V2 is successful if:
- the product’s current breadth feels more navigable and coherent
- the next post-`v1.44.0` decision is based on organization and real friction, not momentum alone
- MCW is positioned cleanly for either classroom deployment feedback or one later bounded deepening line

## Likely Follow-Ons

Possible later slices, only if still justified:
- one bounded curriculum/pathfinding implementation slice
- one bounded large-workspace organization/navigation slice
- certificate / trust-chain teaching only after the consolidated product is stable and classroom-tested

## Explicitly Avoid Next

Do not turn this into:
- a fake `v2.0` marketing relabel
- a catch-all backlog dump
- a stealth certificate / PKI milestone
- a broad UI rewrite without a bounded problem statement

Keep the pass narrow, honest, and product-defining.
