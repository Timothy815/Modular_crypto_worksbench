# Bridge Ergonomics V2 — Contract

Shipped: `v1.32.0`

## Scope

This slice adds two bounded improvements to bridge/representation ergonomics:

1. **`AsciiToHex` bridge** — a symbol-domain representation transform (symbol → symbol) that encodes 7-bit ASCII text into uppercase hex bytes. Paired with the existing `HexToAscii` for round-trip coverage.

2. **Sink-only output representation views** — when an `Output` or `BitOutput` module is selected in the Analyze tab, and the arriving signal is `bits`, the inspector shows a representation switcher with four tabs:
   - **Bits** — always available; raw binary string
   - **Bytes** — available when width is divisible by 8; decimal byte values
   - **Hex** — available when width is divisible by 4; uppercase hex nibbles
   - **ASCII** — available when width is divisible by 8 and all bytes are ≤ 0x7F; decoded character string

   Unavailable tabs are disabled with a tooltip explaining why.

## What is NOT in scope

- No UTF-8 or multi-byte encoding support
- No Base64 encoding
- No copy/export buttons on representation views
- No representation views on non-sink modules
- No encoding auto-detection
- No mutation of the graph or underlying signal from representation views

## Key decisions

- `AsciiToHex` is categorized as `bridge` (same as `HexToAscii`) — it converts representation, not signal domain
- Representation availability logic is extracted into `src/ui/sink-representations.ts` for testability
- Unavailable representations fall back to `bits` rather than showing an error
- Views are observational only — they read from the execution trace and never write back

## Files

- `src/engine/modules/ascii-to-hex.ts` — new module
- `src/engine/modules/index.ts` — registration
- `src/engine/modules/modules.test.ts` — 5 AsciiToHex tests including round-trip
- `src/ui/module-categories.ts` — category entry
- `src/ui/module-library.ts` — library entry
- `src/ui/sink-representations.ts` — pure availability/formatting helpers
- `src/ui/sink-representations.test.ts` — unit tests for availability and formatting
- `src/ui/components/parameter-inspector.tsx` — representation switcher UI
- `src/App.css` — representation view styles
