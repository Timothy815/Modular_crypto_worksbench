# Avalanche & Influence Analysis Engine V1

Status: Open
Last updated: 2026-04-27

---

## Honest Baseline: What Already Exists

Before specifying new work, what MCW already has in `cryptanalysis.ts` and the cryptanalysis panel:

**Already implemented:**
- `flipBitAtIndex(bits, index)` — single bit flip utility
- `calculateBitDifference(a, b)` — XOR difference as boolean flags
- `analyzeBitDifference(baseline, variant)` — changedCount, changedPercent per flip
- `AvalancheSweepEntry` — per-flip row: inputIndex, changedFlags[], changedCount, changedPercent
- `AvalancheSweepSummary` — min, max, average, median, stddev, weakest/strongest inputs, byte groups
- `buildInfluenceHeatmapColumnEntries` — column summary for output bit sensitivity
- `buildAvalancheSweepSummary` — aggregates sweep results
- `analyzeRoundDiffusion` — traces diffusion through rounds via execution trace comparison
- An influence heatmap grid (2D: input bit rows × output bit columns) already renders in the panel

**The identified problems with the current implementation:**

1. **Single-flip live view and full-sweep heatmap are decoupled and confusing.** The UI shows one active flip at a time (effectiveModernFlipBit) for the live comparison, while the heatmap is supposed to show all flips — but the connection between them is not visually clear to a learner.

2. **The heatmap is rendered but not legible.** The cells exist but there is no color intensity scale, no ideal-line reference, and no at-a-glance reading of where the cipher is weak or strong.

3. **Per-output-bit sensitivity is computed but not prominently displayed.** A learner cannot easily identify dead zones (output bits that rarely change regardless of which input bit flips).

4. **No difference mask visualization.** The XOR pattern itself — which output bits changed — is not shown as a spatial pattern, only as a count.

5. **No key-flip mode.** Only plaintext bit flipping is implemented.

6. **No statistical quality judgment.** There is no reference line or threshold indicating whether measured diffusion is near the ideal (~50% output bits changed per input flip).

7. **No human-readable pattern callouts.** Structural anomalies (dead zones, correlated input groups, asymmetric quadrants) are not surfaced in text.

This contract specifies the replacements and additions that address these problems directly.

---

## Problem Statement

A cipher's diffusion quality is visible in the relationship between individual input bit changes and the resulting output bit changes. For a well-designed cipher, flipping any single input bit should change approximately half the output bits unpredictably. For a weak cipher, patterns emerge: certain input bits cause few output changes, certain output bits change rarely, or groups of inputs produce nearly identical difference masks.

MCW's current implementation computes the right numbers but does not show them in a way that builds the learner's intuition. The goal of this engine is to make diffusion structure *visible as pattern*, not just *legible as statistics*.

---

## Scope

This contract covers:

1. A clarified and hardened **full sweep engine** (replace/extend current)
2. A **redesigned influence matrix** as first-class visual artifact
3. **Per-output-bit sensitivity panel** with ideal reference
4. **Difference mask visualization** per flip and as aggregate overlay
5. **Statistical quality layer** with plain-language callouts
6. **Key-flip mode** (symmetric with plaintext-flip mode)

Out of scope for V1:
- NIST randomness tests (runs, frequency, serial) — those belong in a separate statistical testing subsystem
- Multi-round diffusion trace is already handled by `analyzeRoundDiffusion` — do not duplicate
- Chosen-plaintext correlation analysis beyond single-bit perturbation

---

## Data Structures

### `InfluenceMatrix`

The central artifact. Replaces the current ad-hoc row/column build.

```
interface InfluenceMatrix {
  inputWidth: number;               // N: number of input bits swept
  outputWidth: number;              // M: number of output bits observed
  rows: InfluenceRow[];             // N rows, one per input bit flipped
  columnSummaries: InfluenceColumnSummary[];  // M columns
  globalStats: InfluenceGlobalStats;
}

interface InfluenceRow {
  inputBitIndex: number;            // which input bit was flipped
  baselineOutput: number[];         // M-bit output before flip
  variantOutput: number[];          // M-bit output after flip
  differenceMask: boolean[];        // XOR: true where output bit changed
  changedCount: number;             // popcount of differenceMask
  changedFraction: number;          // changedCount / outputWidth
  idealDelta: number;               // changedFraction - 0.5 (signed deviation from ideal)
}

interface InfluenceColumnSummary {
  outputBitIndex: number;
  activationCount: number;          // how many of the N flips changed this output bit
  activationFraction: number;       // activationCount / inputWidth
  idealDelta: number;               // activationFraction - 0.5
  isDead: boolean;                  // activationFraction < DEAD_ZONE_THRESHOLD (0.10)
  isOveractive: boolean;            // activationFraction > OVERACTIVE_THRESHOLD (0.90)
}

interface InfluenceGlobalStats {
  averageChangedFraction: number;   // mean of all row changedFractions
  medianChangedFraction: number;
  standardDeviation: number;
  minChangedFraction: number;
  maxChangedFraction: number;
  deadInputCount: number;           // rows where changedFraction < 0.10
  deadOutputCount: number;          // columns where activationFraction < 0.10
  qualityScore: number;             // 0–1: 1.0 = perfect avalanche, 0 = no diffusion
  qualityLabel: 'strong' | 'moderate' | 'weak' | 'broken';
}
```

### `DifferenceMaskOverlay`

For aggregate visualization across all flips.

```
interface DifferenceMaskOverlay {
  outputWidth: number;
  activationCounts: number[];       // per output bit: how many flips activated it
  activationFractions: number[];    // per output bit: fraction of flips
  patternEntropy: number;           // bit entropy of activationFractions distribution
}
```

### `KeyFlipSweepResult`

```
interface KeyFlipSweepResult extends InfluenceMatrix {
  keyWidth: number;
  sweepMode: 'key';
}

interface PlaintextFlipSweepResult extends InfluenceMatrix {
  sweepMode: 'plaintext';
}
```

---

## Engine Interface

### `buildInfluenceMatrix`

```
function buildInfluenceMatrix(
  baseline: number[],             // baseline plaintext bits
  runFn: (input: number[]) => number[],  // pure function: bits → bits
  options?: {
    maxInputBits?: number;        // cap sweep at N bits (default: full input width)
    outputBitRange?: [number, number];  // observe only a slice of output
  }
): InfluenceMatrix
```

**Behavior:**
- Runs `runFn(baseline)` once to get baseline output
- For each input bit index i from 0 to min(inputWidth, maxInputBits):
  - Constructs `flipped = flipBitAtIndex(baseline, i)`
  - Runs `runFn(flipped)` to get variant output
  - Computes `differenceMask = XOR(baseline_output, variant_output)`
  - Builds `InfluenceRow`
- Builds column summaries across all rows
- Computes global stats
- Returns complete `InfluenceMatrix`

**Determinism requirement:** `runFn` must be a pure function of its input — no internal state, no randomness. If the project contains stateful modules (LFSR, Rotor), the caller must reset state before each invocation. The engine itself does not manage state.

**Error conditions:**
- `runFn` throws → propagate with `{ error: 'execution-failed', inputBitIndex: i }`
- Output width inconsistent across runs → reject with `{ error: 'variable-output-width' }`
- Input width is zero → reject immediately

### `buildDifferenceMaskOverlay`

```
function buildDifferenceMaskOverlay(matrix: InfluenceMatrix): DifferenceMaskOverlay
```

Aggregates the differenceMask arrays from all rows into per-output-bit activation counts.

### `generateInfluenceCallouts`

```
function generateInfluenceCallouts(matrix: InfluenceMatrix): InfluenceCallout[]

interface InfluenceCallout {
  severity: 'info' | 'warning' | 'critical';
  category: 'dead-zone' | 'overactive' | 'weak-input' | 'correlated-inputs' | 'symmetry' | 'quality';
  message: string;   // plain English, no jargon
  affectedInputBits?: number[];
  affectedOutputBits?: number[];
}
```

**Required callout rules:**

| Condition | Severity | Message template |
|---|---|---|
| Any output bit with activationFraction < 0.10 | critical | "Output bit {N} barely changes regardless of which input bit is flipped — it contributes almost nothing to diffusion." |
| Any input bit with changedFraction < 0.10 | critical | "Flipping input bit {N} causes almost no output change — this input has nearly no influence on the cipher output." |
| globalStats.averageChangedFraction < 0.25 | critical | "Average output change per flip is {X}% — well below the 50% ideal. This cipher has weak diffusion." |
| globalStats.averageChangedFraction between 0.25–0.40 | warning | "Average diffusion is {X}% — below the 50% ideal. Some input bits have limited reach." |
| Two or more input bits with identical differenceMasks | warning | "Input bits {A} and {B} produce identical difference patterns — they may be structurally equivalent or redundant." |
| globalStats.standardDeviation > 0.20 | warning | "Diffusion is highly uneven across input bits — some inputs spread changes widely while others barely propagate." |
| Dead output count > outputWidth * 0.15 | critical | "{N} output bits ({X}%) show low sensitivity across all input flips — the output has dead zones." |
| qualityScore > 0.85 | info | "Diffusion is strong. Each input flip changes approximately half the output bits without obvious pattern." |

---

## Visualization Requirements

### 1. Influence Heatmap (redesign of current)

**Layout:** 2D grid. Rows = input bits (y-axis, top to bottom). Columns = output bits (x-axis, left to right).

**Cell color encoding:**
- Changed (1): colored according to row's changedFraction
  - changedFraction near 0.5: strong signal color (e.g., analysis-accent)
  - changedFraction < 0.25: muted warm color (weak)
  - changedFraction > 0.75: muted cool color (concentrated)
- Unchanged (0): background color (near-zero)

**Required annotations:**
- Row end: changedFraction as percentage, with a bar showing deviation from 0.5
- Column bottom: activationFraction as percentage
- Dead-zone columns: distinct border or overlay marker
- A reference line or band showing the ideal 50% zone on both axis summaries

**Interaction:**
- Hovering a cell shows: "Input bit {row} flipped → Output bit {col} {changed/unchanged}"
- Hovering a row shows: "{changedCount} of {outputWidth} output bits changed ({changedFraction}%)"
- Hovering a column shows: "Changed in {activationCount} of {inputWidth} input flips ({activationFraction}%)"
- Clicking a row selects that flip for the live single-flip comparison view (connecting the two views explicitly)

### 2. Difference Mask Overlay

**Layout:** A single row of M cells, one per output bit, showing activationFraction as bar height and color intensity.

**Reference line:** Horizontal line at 50% activation (the ideal).

**Color encoding:** 
- Near 50%: neutral/strong
- Far from 50% in either direction: warning color
- Below DEAD_ZONE_THRESHOLD or above OVERACTIVE_THRESHOLD: critical color with label

### 3. Single-Flip Comparison View (clarify current)

This view already exists but its relationship to the heatmap must be made explicit.

**Required change:** When a heatmap row is clicked, the single-flip view updates to show that flip. A visible label reads: "Showing input bit {N} flip — click any row in the heatmap to inspect its difference mask."

### 4. Quality Summary Bar

A compact header strip above the heatmap showing:
- Quality score as a labeled gauge (Broken / Weak / Moderate / Strong)
- Average changed fraction vs ideal (50%) as a single number with delta
- Dead input count and dead output count as badges (zero = no badge)

---

## Key-Flip Mode

Mirrors the plaintext-flip mode exactly. The sweep function receives the key bit array instead of the plaintext bit array.

The `runFn` for key-flip mode is:
```
(keyBits: number[]) => runProjectWithKey(project, fixedPlaintext, keyBits)
```

UI: a toggle in the analysis header — "Flip: Plaintext bits | Key bits". Only shown when a key source is detectable in the project.

Both modes share the same `InfluenceMatrix` structure and all visualization components.

---

## Integration With MCW Inspector

The engine is called from the cryptanalysis panel's Modern Analysis mode. It must:

- Accept a `Project` and `ExecutionResult` (baseline already computed by the panel)
- Construct `runFn` from the project's source module and output module (already identified by the panel's module-detection logic)
- Run synchronously for inputs up to 64 bits; for inputs 65–128 bits, run in a `setTimeout(0)` yield loop with a loading indicator
- Return a complete `InfluenceMatrix` that the panel stores in component state

The engine itself (`buildInfluenceMatrix`, `buildDifferenceMaskOverlay`, `generateInfluenceCallouts`) lives in `cryptanalysis.ts`. The UI components live in `cryptanalysis-panel.tsx`. No engine function may import from UI files.

---

## Quality Score Definition

```
qualityScore = 1 - (2 * |averageChangedFraction - 0.5|)
             × (1 - standardDeviationPenalty)
             × (1 - deadZonePenalty)

where:
  standardDeviationPenalty = min(1, standardDeviation / 0.5)
  deadZonePenalty = (deadInputCount + deadOutputCount) / (inputWidth + outputWidth)

qualityLabel:
  score >= 0.85 → 'strong'
  score >= 0.60 → 'moderate'
  score >= 0.30 → 'weak'
  score <  0.30 → 'broken'
```

---

## Constants

```
DEAD_ZONE_THRESHOLD = 0.10        // below this → dead
OVERACTIVE_THRESHOLD = 0.90       // above this → overactive
IDEAL_CHANGED_FRACTION = 0.50     // Shannon's perfect diffusion target
MAX_SYNCHRONOUS_INPUT_BITS = 64   // above this → yielded execution
CORRELATION_MASK_EQUALITY_THRESHOLD = 1.0  // identical masks → correlated
```

---

## Migration Notes

The following existing exports in `cryptanalysis.ts` are superseded by this contract and should be **deprecated but not removed** until the new implementation is verified:

- `buildInfluenceHeatmapColumnEntries` → superseded by `buildInfluenceMatrix` column summaries
- `buildAvalancheSweepSummary` → superseded by `InfluenceGlobalStats`
- `AvalancheSweepEntry`, `AvalancheSweepSummary`, `AvalancheSweepByteGroupEntry` → superseded by `InfluenceMatrix` and related types

Keep the old functions in place until the new panel renders correctly. Remove in a follow-on cleanup commit.

---

## What This Visibly Fixes

| Current problem | Fix |
|---|---|
| Heatmap and single-flip view feel disconnected | Clicking a heatmap row drives the single-flip view |
| No sense of whether diffusion is good or bad | Quality score and ideal reference line on both axes |
| Dead zones are not called out | Column markers and critical callout text |
| No plain-language summary | `generateInfluenceCallouts` always produces human-readable text |
| Key bits not analyzable | Key-flip mode toggle |
| Full sweep not clearly separated from single flip | `buildInfluenceMatrix` computes all N flips in one call; UI renders the complete matrix |
