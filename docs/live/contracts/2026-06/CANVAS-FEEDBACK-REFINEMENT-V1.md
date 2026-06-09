# Canvas Feedback Refinement V1

Last updated: June 9, 2026
Status: Shipped on `main`

Related:
- [NORTH-STAR-REMAINING-GAPS-2026-06.md](./NORTH-STAR-REMAINING-GAPS-2026-06.md)
- [LIVE-MACHINE-FEEL-V1.md](./LIVE-MACHINE-FEEL-V1.md)

---

## Purpose

Close the four highest-leverage remaining gaps from the North Star assessment (items 1–4 in the ranked table). All four are low-effort, UI-only, and derivable from state already computed in the running product. No engine changes are required.

This is a polish slice, not a feature slice. Each item removes a specific residual friction point that survives from before LIVE-MACHINE-FEEL-V1.

---

## Scope

### In scope

**A: Port-level mismatch detail in error badge tooltip**
The badge already shows "Type mismatch" and a long message that includes opaque module IDs. A user who sees this still has to open Analyze to understand which port is affected and what types collided. Add a clean port-summary line to the tooltip.

**B: Domain-colored halos in halo mode**
The tick pulse degrades to halo mode on every flagship board (AES round, ECC scalar multiply, hash compression) because they all exceed the 24-wire threshold. In halo mode the pulse uses a single generic accent glow. Use the same four domain colors as the wire pulse and port dots so the halo conveys which signal domain is flowing, even when wire mode is suppressed.

**C: Minimap error overlay**
The minimap shows spatial layout but no error state. On a dense board the minimap could direct the user to broken regions without panning. Add an error class to minimap nodes that have a canvas error state so they render visibly distinct.

**D: Input port hit-target enlargement**
Input port dots are visually small. With chip-drag covering the output side, connecting to an input port is the last remaining precision-dependent wiring action. Add an invisible hit-area extension around input port anchors via CSS so the effective click/hover target is larger than the visible dot.

### Out of scope

- Engine changes of any kind
- New module primitives or curriculum content
- Python export changes
- Automatic layout or automatic graph repair
- Composite authoring changes
- Splice-on-wire V2 (eligibility by required-only ports) — that is a separate contract
- Group box nesting — that is a separate contract

---

## Strategic Test

Each item must satisfy:

- "This makes MCW more explicit and correct" (user gets more information or more precise interaction)
- "This makes MCW feel more like a live machine" (feedback is immediate and located at the point of action)

---

## Implementation

### A: Port-level mismatch detail

**Files touched:**
- `src/ui/live-machine-feel-tier1.ts`
- `src/ui/live-machine-feel-tier1.test.ts`
- `src/ui/components/workbench-panel.tsx`
- `src/App.css`

**Changes:**

1. Add optional `portSummary?: string` field to `CanvasModuleErrorState`.

2. In `deriveCanvasModuleErrorStateById`, when building the `type-mismatch` or `kind-mismatch` state, derive a port summary from `mismatchIssue.connection` plus the registry:
   - Look up the target port definition from `registry[moduleInstance.defId].inputs`
   - Look up the source module's instance from `project.modules` and get its output port definition from the registry
   - Produce: `portSummary = 'Port "${to.port}": expects ${targetPort.type}, got ${sourcePort.type}'`
   - Handle the kind-mismatch case analogously: `'Port "${to.port}": expects ${targetKind} ${targetPort.type}, got ${sourceKind}'`
   - If either lookup fails (registry gap, malformed project), leave `portSummary` undefined — do not throw

3. In the error badge tooltip in workbench-panel (around line 5673), render `portSummary` as a monospaced secondary line between the label and the detail:
   ```tsx
   <strong>{canvasErrorState.label}</strong>
   {canvasErrorState.portSummary ? (
     <code className="graph-node-error-tooltip-port">{canvasErrorState.portSummary}</code>
   ) : null}
   <span>{canvasErrorState.detail}</span>
   ```

4. Add CSS for `.graph-node-error-tooltip-port` — monospaced, slightly muted, small font, bottom-border or left-border accent to visually separate it.

**Tests:**
- In `live-machine-feel-tier1.test.ts`, add a test verifying `portSummary` is set correctly on a type-mismatch state.
- Add a test verifying `portSummary` is undefined when registry lookup fails (missing def).
- Existing missing-input tests must still pass; `portSummary` should remain undefined for non-mismatch errors.

---

### B: Domain-colored halos

**Files touched:**
- `src/ui/live-machine-feel-tier4.ts`
- `src/ui/live-machine-feel-tier4.test.ts`
- `src/ui/components/workbench-panel.tsx`
- `src/App.css`

**Changes:**

1. Add `domainByModuleId: Record<string, 'bits' | 'symbol' | 'integer' | 'ec-point'>` to `TickPulseProjection`.

2. In `projectTickPulseVisibility`, when `mode === 'halo'`, compute `domainByModuleId`:
   - Group visible entries by `targetModuleId`
   - For each module, pick the domain of the first entry (entries are sorted by their order in the connection list, which is deterministic)
   - If a module has multiple different domains, first domain wins; this keeps the logic O(n) and avoids instability

3. In the wire-mode branch, `domainByModuleId` remains `{}` (not needed there; wire coloring already applies to individual connection segments).

4. In workbench-panel, add a `tickPulseHaloDomainByModuleId` memo parallel to the existing `tickPulseHaloModuleIdSet`:
   ```ts
   const tickPulseHaloDomainByModuleId = useMemo(
     () => tickPulseProjection?.domainByModuleId ?? {},
     [tickPulseProjection],
   );
   ```

5. When rendering the halo span (line 5398–5402), append a domain class:
   ```tsx
   className={`graph-node-tick-pulse-halo${
     tickPulseHaloDomainByModuleId[moduleInstance.id]
       ? ` graph-node-tick-pulse-halo-${tickPulseHaloDomainByModuleId[moduleInstance.id]}`
       : ''
   }`}
   ```

6. Add four CSS rules that override the halo border/shadow color to match the domain wire-pulse colors:
   - `.graph-node-tick-pulse-halo-bits`: border-color and box-shadow using `#0a67ff`
   - `.graph-node-tick-pulse-halo-symbol`: using `#ff7a12`
   - `.graph-node-tick-pulse-halo-integer`: using `#23b261`
   - `.graph-node-tick-pulse-halo-ec-point`: using `#9166ff`
   
   The animation and timing are inherited from `.graph-node-tick-pulse-halo`. Only color overrides are needed.

**Tests:**
- In `live-machine-feel-tier4.test.ts`, add a test verifying `domainByModuleId` is populated in halo mode.
- Verify that wire mode returns `domainByModuleId: {}`.
- Verify that a module with two incoming entries from different domains takes the domain of the first entry.

---

### C: Minimap error overlay

**Files touched:**
- `src/ui/components/workbench-panel.tsx`
- `src/App.css`

**Changes:**

1. In the minimap node render block (line 6271–6284), add the error class:
   ```tsx
   className={`workbench-minimap-node${
     selectedModuleIds.includes(moduleId) ? ' selected' : ''
   }${
     canvasModuleErrorStateById[moduleId] ? ' error' : ''
   }`}
   ```

2. Add CSS for `.workbench-minimap-node.error`. Use a red or orange background/outline that is legible at minimap scale. The minimap node is very small (a few pixels at scale), so a solid background change is more legible than an outline:
   ```css
   .workbench-minimap-node.error {
     background: var(--error-text); /* or a fixed #d44 */
   }
   ```
   The color should contrast clearly against the normal minimap node color AND the minimap background.

3. No new state or derivation needed. `canvasModuleErrorStateById` is already computed and in scope at the minimap render site.

**Tests:** No new unit tests required. The minimap is a pure view derived from existing state; the error state derivation is already tested in tier-1 tests.

---

### D: Input port hit-target enlargement

**Files touched:**
- `src/App.css`

**Changes (CSS only):**

Add an invisible hit-area extension to input port anchor elements:

```css
.graph-port-anchor-in::before {
  content: '';
  position: absolute;
  inset: -10px;
  pointer-events: auto;
  background: transparent;
}
```

This creates a transparent 20px-larger click target centered on each input port anchor. The anchor itself has `position: absolute; width: 0; height: 0`, so `inset: -10px` creates a 20×20px invisible overlay centered on the port point.

Verify the following invariants:
- Snap-preview behavior is unaffected (snap uses mouse-move events at the canvas level, not port-level mouse events)
- The hit extension does not bleed through output ports (output ports use `.graph-port-anchor-out`, not `.graph-port-anchor-in`)
- Rewire-on-occupied-port still works: the `onMouseDown` handler on the port anchor fires when the user clicks within the extended hit area

**Tests:** No new unit tests. The CSS is not testable at the unit level. Visual verification in the browser is sufficient.

---

## Implementation Order

These items have no dependencies on each other. Suggested order by risk:

1. **D first** — CSS only, zero risk of logic regression, immediate feel improvement
2. **C second** — two lines of JSX + one CSS rule, no logic changes
3. **B third** — small logic change in `live-machine-feel-tier4.ts` + rendering + CSS
4. **A last** — logic change in `live-machine-feel-tier1.ts` + type change + tooltip rendering

Each item should be committed individually. The slice is complete when all four are on `main` with passing tests and a clean build.

---

## Acceptance Criteria

- `npx vitest run` passes
- `npm run build` succeeds with no chunk exceeding 450 KiB
- On a type-mismatch board: error badge tooltip shows a clean "Port X: expects Y, got Z" line
- On the AES round board (or any board with >24 active wires in ticked mode): halo pulses show domain color (blue for bits, amber for symbol, etc.)
- On any board with broken modules: minimap shows red/orange dots at the error module locations
- On any dense board: input port dots are comfortably clickable without sub-pixel precision

---

## What This Does Not Do

- It does not change the tick pulse threshold (24-wire budget is correct and stays)
- It does not change error propagation logic (upstream-failure cascade is correct and stays)
- It does not add new error categories
- It does not make the minimap interactive beyond its current pan behavior
- It does not change the splice-on-wire eligibility rule
