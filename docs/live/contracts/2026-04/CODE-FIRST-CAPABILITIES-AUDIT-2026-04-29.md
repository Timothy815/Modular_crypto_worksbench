# MCW Code-First Capabilities Audit

Last updated: April 29, 2026
Status: Active audit note

## Purpose

This document is a code-first inventory of what MCW actually ships on `main`.
It intentionally overrides stale roadmap memory, outdated contract status lines, and older restart notes.

Method:
- inspect shipped code paths
- confirm visible UI entry points where applicable
- classify features as `Shipped`, `Partial`, or `Not Clearly Shipped`

This is not a promise document. It is a baseline of reality.

## High-Confidence Shipped

### Core Product Shape

- visual cryptographic workbench over a typed signal-flow DAG
- explicit `symbol` and `bits` domains with no hidden coercion
- `Build`, `Guide`, and `Cryptanalysis` workspace modes
- learning dock with `Quick Start`, `Tutorial`, `Challenge`, and `Cryptanalysis` panel tabs
- composite authoring, drilldown, and unzip workflows
- iterator, clocked iterator, conditional, and multi-conditional authoring

Evidence:
- [src/App.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/App.tsx)
- [src/ui/components/workbench-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-panel.tsx)
- [src/ui/components/workbench-actions.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-actions.tsx)

### Authoring / Workbench Ergonomics

- workspace-local undo / redo
- workspace copy / paste / duplicate / delete
- save current workspace and save named version
- selected-cluster operations
- quick add from canvas and pending connection flows
- click-to-connect
- drag from palette to canvas
- replace-in-place for modules
- inline parameter edits for selected supported modules
- orthogonal routing, bend editing, lane preference, and wire color modes
- group boxes, stage labels, guide rails, minimap, and furniture visibility controls
- per-instance port order and port side controls

Evidence:
- [src/ui/store.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/store.ts)
- [src/ui/components/workbench-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-panel.tsx)
- [src/ui/components/workbench-actions.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-actions.tsx)

### Keyboard Shortcuts

Shipped shortcut families include:
- undo / redo
- copy / paste / duplicate / delete
- save workspace / save version
- composite create / open / unzip
- iterator / clocked iterator / conditional / multi-conditional creation
- mode switching
- arrow-key nudge and coarse `Shift+Arrow` nudge
- tick playback and stepping
- `/` palette search focus
- dialog `Enter` / `Escape` behavior
- `Escape` cleanup of transient canvas states

Evidence:
- [src/App.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/App.tsx:2515)
- [src/ui/components/workbench-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-panel.tsx:2190)
- [src/ui/manual-content.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/manual-content.ts:66)

### Cryptanalysis Surfaces

- `Classical` analysis
- `Modern` analysis
- `Randomness` analysis
- `Key Schedule` analysis
- `Output Statistics`
- `Round Contribution View`
- saved analysis cases

Evidence:
- [src/ui/cryptanalysis-mode.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/cryptanalysis-mode.ts:1)
- [src/ui/components/cryptanalysis-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/cryptanalysis-panel.tsx)
- [src/ui/cryptanalysis.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/cryptanalysis.ts)

### Output Statistics

This is shipped, not speculative.

Implemented pieces:
- byte frequency histogram
- chi-squared / p-value path
- bit balance and monobit p-value
- entropy summary
- sequential correlation and scatter grid
- runs analysis
- summary narrative
- key-dependency sanity check
- separate symbol-mode output sweep path

Evidence:
- [src/engine/analysis/output-statistics.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/engine/analysis/output-statistics.ts)
- [src/ui/components/cryptanalysis-panel.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/cryptanalysis-panel.tsx:1787)

### Stage / Signal Inspection

This is shipped.

Implemented pieces:
- bounded `Stage Inspection` card in the inspector
- current signal display
- representation / type / role chips
- immediate visible parents
- previous-stage comparison when available
- `Copy Value`
- `Copy Bits`

Evidence:
- [src/ui/components/parameter-inspector.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/parameter-inspector.tsx:1744)
- [src/ui/stage-signal-inspection.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/stage-signal-inspection.ts)

### Analyze-Tab Property Panels

Shipped panels include:
- S-Box properties
- permutation properties
- LFSR properties
- plugboard properties
- reflector properties
- modulus properties

Evidence:
- [src/ui/components/inspector-analyze-details.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/inspector-analyze-details.tsx)

### S-Box Analysis

MCW is already beyond “invertibility and fixed points only.”

Shipped S-box metrics include:
- nonlinearity
- component nonlinearity
- differential uniformity / DDT max
- full DDT or thumbnail / histogram fallback
- algebraic degree
- fixed points
- bit-dependency matrix
- SAC deviation
- lookup / substitution visualization

Evidence:
- [src/ui/components/inspector-analyze-details.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/inspector-analyze-details.tsx:905)
- [src/ui/components/structured-editors/index.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/structured-editors/index.tsx)

### Teaching Content

Shipped content families include:
- starter tutorials
- starter challenges
- primitive micro demos
- pipeline demos
- flagship classical and modern learning lines
- cryptanalysis labs
- Enigma dissection / repair content

Evidence:
- [src/ui/starter-tutorials.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/starter-tutorials.ts)
- [src/ui/starter-challenges.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/starter-challenges.ts)
- [src/ui/primitive-micro-demos.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/primitive-micro-demos.ts)

### Artifact / Pack Infrastructure

Shipped:
- export workspace
- import workspace
- export Python
- import lab pack
- export lab pack
- shareable lab-pack persistence and import preparation

Evidence:
- [src/ui/components/workbench-actions.tsx](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/components/workbench-actions.tsx:1172)
- [src/ui/shareable-lab-pack-persistence.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/shareable-lab-pack-persistence.ts)
- [src/ui/workspace-artifact-actions.ts](/Users/timothykoerner/Desktop/modular_cryptography/src/ui/workspace-artifact-actions.ts)

## Partial / Ambiguous

### Cipher Expansion Packs As A Product Layer

What is shipped:
- generic lab-pack import/export infrastructure
- Enigma demo/tutorial/challenge content

What is not clearly shipped:
- a dedicated curated cipher-pack browser / picker
- a formalized “Cipher Expansion Pack” product surface distinct from generic lab packs

Status: `Partial`

### Output Statistics Rigor / Honesty

The feature exists and is user-visible.
What remains uncertain is whether its formulas, thresholds, and copy are honest enough for the educational standard MCW wants.

Status: `Shipped feature, still audit-worthy`

### S-Box Analysis Completeness

Strong property coverage is shipped, but some possible extensions are not clearly present:
- cycle decomposition of invertible S-boxes as permutations
- broader “quality summary” framing beyond the current metric presentation

Status: `Mostly shipped, with possible follow-ons`

## Not Clearly Shipped

These should not be assumed present without further source confirmation:

- dedicated S-box cycle analysis
- curated one-click cipher pack catalog / registry
- a separate polished “Cipher Expansion Pack” onboarding flow beyond generic lab-pack import/export

## Biggest Current Documentation Drift

The current top-level status docs still imply that some shipped features are open work.

Confirmed drift examples:
- `Output Statistics` is implemented but still treated as open in older status language
- `Stage / Signal Inspection` is implemented
- lab-pack import/export is implemented
- S-box analysis is significantly more advanced than some planning prompts imply

## Baseline Conclusion

MCW on `main` is already:
- a real visual cryptography workbench
- a real learning system with guided content
- a real reusable-definition environment
- a real analysis environment with several substantive cryptanalytic/property panels

The repo's main problem is no longer “missing first-pass capability.”
It is “documentation, prioritization, and product framing have not kept up with what the code already ships.”
