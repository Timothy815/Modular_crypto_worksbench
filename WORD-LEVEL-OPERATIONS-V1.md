# Word-Level Operations V1

Status: Open
Last updated: 2026-04-26

---

## Problem

Modern ciphers operate on arrays of fixed-width words, not flat bit streams. ChaCha20 works on sixteen 32-bit words. SHA-256 works on eight 32-bit words. AES operates on a 4×4 byte matrix. Expressing any of these on the MCW canvas today requires manually chaining BitWindow + arithmetic + BitJoin for every word — producing incomprehensible graphs that obscure the structure the tool is supposed to reveal.

The missing abstraction: treat a wide bit array as N words of W bits, operate on words, reassemble.

---

## Scope

Two new primitives. One demo. One tutorial.

### `WordSplit`

- **Inputs:** one `bits` signal of width `N × W`
- **Outputs:** N `bits` outputs, each of width W, named `w0`, `w1`, ..., `w(N-1)`
- **Params:**
  - `wordWidth` (number, required) — bits per word
- **Validation:** input width must be an exact multiple of `wordWidth`; output count derived automatically
- **Evaluate:** slice input into consecutive W-bit chunks, emit each as a named output port

### `WordJoin`

- **Inputs:** N `bits` signals, named `w0`, `w1`, ..., `w(N-1)`  
- **Outputs:** one `bits` signal of width `N × W`
- **Params:**
  - `wordCount` (number, required) — how many word inputs to expect
  - `wordWidth` (number, required) — expected width of each word input; validated at runtime
- **Evaluate:** concatenate all word inputs in order

### Port count constraint

Both modules use dynamic port counts derived from params. `WordSplit` output count = `inputWidth / wordWidth` (knowable only after a live signal arrives or an `inputWidth` hint is provided). `WordJoin` input count = `wordCount` param.

This is the same pattern as `BitWindow` / `BitSplit` — static where knowable, runtime-derived otherwise.

---

## What This Unlocks

| Cipher / Algorithm | Blocked today | Unblocked by V1 |
|---|---|---|
| ChaCha20 quarter round | Yes — needs 4×32-bit word ops | Yes |
| SHA-256 message schedule | Yes — needs 16×32-bit words | Yes |
| AES ShiftRows / MixColumns | Partially | Closer |
| Visible block as word array | Yes | Yes |

---

## Demo: `visible-word-operations`

- Group: Modern Rounds
- A 128-bit HexSource feeds WordSplit (wordWidth: 32) → four 32-bit word outputs
- Each word feeds a BitShifter (rotate-left by different amounts) to show word-granularity rotation
- WordJoin (wordCount: 4, wordWidth: 32) reassembles the rotated words
- BitOutput shows the result
- Teaching point: the structure of ChaCha20's quarter round is word rotation + XOR; this demo makes the word boundary visible

---

## Tutorial: `visible-word-operations`

Five steps:
1. Observe the 128-bit input split into four explicit 32-bit word outputs — inspect each word
2. Each word enters its own BitShifter with a different rotation amount — note the independence
3. WordJoin reassembles — output width equals input width, nothing lost
4. Change one word's rotation amount and re-run — only that word changes in the output
5. Connect: ChaCha20 applies addition, XOR, and rotation to 16 such words per quarter round — this is the building block

---

## Out of Scope for V1

- Word-wise arithmetic (AddWords, XORWords) — use existing AddMod / XOR per word for now
- AES-specific byte matrix operations
- Variable word count driven by a live signal width (static param only)
- More than 16 output ports on WordSplit

---

## Validation Rules

- `wordWidth` must be a positive integer
- `wordCount` must be a positive integer between 2 and 16
- WordSplit: if a live input arrives with width not divisible by `wordWidth`, reject with a clear message
- WordJoin: if any word input width differs from `wordWidth`, reject with a clear message

---

## Placement in Learning Sequence

- Group: `Modern Rounds`
- Stage: `modern-bit-machines`
- Order: 136 (after visible-feistel-round at 134, before or alongside feistel-network at 135)
- Recommended after: `visible-feistel-round`
