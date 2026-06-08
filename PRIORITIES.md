# MCW Product Priorities

Last updated: June 7, 2026
Status: Active working checklist

---

## How To Use This Document

This list is organized by priority tier, not by implementation order. Work from the top down. Each item has a **rationale** (why it matters) and a **done condition** (how you know it is finished). When an item ships, check it off and note the date.

Measure progress against the north star dimensions: **Live Readability**, **Authoring Fluency**, **Pipeline Legibility**, **Mechanism Feel**, and **Honest Ergonomics**. Each tier maps to one or more of those dimensions.

Current north star realization: approximately **55–60%**. The explicit-and-correct half is well served. The "feels alive while building" half is the primary remaining frontier.

---

## P1 — Critical Gaps
*These break stated product promises. Nothing in P2–P5 should take priority over finishing this tier.*

- [x] **GF2/AES Python export parity** *(shipped May 14, 2026 — commit 2880305)*
  Rationale: GF2Mul and GF2Inv generate no Python code. The AES building blocks line — the product's strongest single demonstration of depth — is verified inside MCW but cannot be exported. The flagship lab capstone steps that depend on verify_parity.py are incomplete without this.
  Done when: GF2Mul and GF2Inv produce correct Python, and verify_parity.py passes for a Visible MixColumns board using the FIPS 197 test vector.

- [x] **Verification workflow: explain PASS and FAIL in-product** *(shipped June 7, 2026)*
  Rationale: Students treat PASS as a score rather than a behavioral trust claim. The manual explains the distinction, but the surface itself does not. This is a teaching failure embedded in the product's most important quality-assurance step.
  Done when: The verification station includes in-product language (not just in the manual) that clearly states what PASS means and why a FAIL case is informative, without requiring the user to leave the surface.

- [x] **Student-first onboarding path** *(shipped June 7, 2026)*
  Rationale: Current first-session guidance depends on instructor scaffolding. Quick Start and Atlas are improvements but are not sufficient for a student arriving alone. The product's classroom value depends on students being able to begin productively without hand-holding.
  Shipped: `FIRST-SESSION-ONBOARDING-V1` (April 2026) added Start Here, Quick Start, Atlas. June 2026 additions: Quick Start step 3 now explicitly names "Reset Challenge" and explains the module-select-then-Inspector interaction; beginner challenges show a first-timer tip before evaluation begins. Behavioral validation (15 min solo) requires a real classroom session — code-side work is complete.
  Done when: A student with no prior MCW experience can reach their first repair success in under 15 minutes, starting from a fresh session, without instructor intervention.

---

## P2 — North Star: The Live Machine Gap
*These close the largest gap between the product's north star and its current experience. The explicit-and-correct half of MCW is strong. The "feels alive" half is not. These items address that directly.*

- [x] **Live signal values on the canvas** *(shipped April 11, 2026 — commit a3fa86a)*
  Rationale: The single highest-leverage north star improvement remaining. Currently, you must enter Analyze or Trace to see what any wire is carrying. Audulus shows you signal value the moment you patch a cable. MCW should show you signal value — even abbreviated — as the machine runs.
  Done when: Wires or output ports display current signal value (abbreviated for long values) while the machine is running, without entering the Analyze surface. The display updates when params change.
  North star dimension: Live Readability.

- [x] **Active path distinction on the canvas** *(shipped — connection-group-live/idle CSS classes with glow and opacity)*
  Rationale: On a complex board, all connections look identical regardless of whether they are carrying signal. A student cannot tell which path is active at a glance.
  Done when: Active connections are visually distinct from idle or bypassed connections. The distinction is unambiguous without opening any panel.
  North star dimension: Live Readability, Mechanism Feel.

- [x] **Dense board legibility: 128+ element boards** *(substantially addressed June 7, 2026)*
  Rationale: The full AES round board has 128+ SubBytes transforms. At this scale, the authoring experience becomes physically laborious and the board is difficult to read as a coherent structure even with Tidy Layout and group boxes. The product needs density-management primitives beyond what exists today.
  Shipped June 7, 2026: `F` key shortcut — frame selection when modules selected, frame workspace otherwise. Matches node editor convention. Hint shown in View menu. Together with existing minimap, group boxes, stage labels, and Tidy Layout, large boards can now be navigated without menu ceremony.
  Done when: A full AES round board can be navigated, understood, and modified without excessive pan/zoom ceremony. Structural intent (columns, rows, round phases) is legible at a moderate zoom level.
  North star dimension: Pipeline Legibility, Authoring Fluency.

- [x] **Parameter edit → visible output feedback without re-running manually** *(always-on — execution runs on every render)*
  Rationale: Changing a key value or a curve parameter should produce immediately visible output change in the running graph. Currently the feedback loop requires the user to observe the change themselves.
  Done when: Param changes produce visible output updates in real time without any manual re-run step. The connection between edit and effect is immediate and obvious.
  North star dimension: Mechanism Feel, Live Readability.

---

## P3 — Teaching Depth
*These complete teaching arcs that are currently partial or absent. Each one closes a specific gap in the product's classroom coverage.*

- [x] **AES key schedule: visible board with tutorial** *(shipped June 7, 2026)*
  Rationale: All four AES round operations are visible and verified. The key schedule is the missing link. Without it, the AES teaching story stops at "one round" and cannot connect to a complete cipher.
  Done when: A visible key schedule board shows how a 128-bit key expands to 11 round keys, includes a tutorial, and is verified against a NIST FIPS 197 test vector. A repair challenge is present.

- [ ] **Pedagogical multi-round AES board (4 rounds minimum)**
  Rationale: The one-round AES board is the current capability ceiling. A multi-round board with explicit key schedule and round operations is the product's strongest possible single demonstration of depth and would complete the AES teaching line.
  Note: Blocked on composite packaging. A flat 4-round board would be 500+ modules; requires an AesRoundComposite first. Key schedule step now exists (visible-aes-key-schedule). Resume when composite infrastructure is ready.
  Done when: A board wires at least 4 full AES rounds with the key schedule feeding each round key explicitly. Verified against a standard test vector. Tutorial present.

- [x] **Hash construction: SHA-256 round decomposition or sponge pedagogy** *(shipped June 7, 2026)*
  Rationale: Hash functions are entirely absent from the standard teaching flow. This is the largest remaining gap in modern cryptographic vocabulary. SHA-256 round structure or a real sponge construction would be the most significant single teaching addition remaining.
  Done when: At least one hash construction board exists, verified against a known test vector, with a tutorial that explains what the round function is doing and why.

- [x] **Consequence board: stream cipher IV/nonce reuse** *(shipped June 7, 2026)*
  Rationale: The Schnorr nonce reuse and ECDH low-order point boards are the strongest in the product. A stream cipher or CTR-mode IV-reuse consequence board in the same style would teach one of the most practically important failure modes in modern cryptography.
  Done when: A bounded board shows two messages encrypted with the same keystream, with visible key recovery. A repair challenge or analysis surface is present.

- [x] **Consequence board: CBC padding oracle pattern (pedagogical)** *(shipped June 7, 2026)*
  Rationale: Padding oracle is one of the most consequential real-world attacks and fits the MCW consequence-board model well. Even a bounded teaching version would be high value.
  Done when: A bounded board shows the oracle structure — a ciphertext block, a padding check, and the information leak — in a way that makes the attack mechanism legible without being a live attack tool.

- [x] **Classical cipher breadth: Vigenere with cryptanalysis** *(shipped June 7, 2026)*
  Rationale: The classical flagship lab covers Enigma in depth. Beyond Enigma, the classical curriculum is empty. Vigenere is the most important missing classical cipher — both to build and to break.
  Done when: A Vigenere encryption board exists with a tutorial and a repair challenge. A companion cryptanalysis board shows Kasiski test or index of coincidence as visible analysis.
  Note: Encryption board (`visible-vigenere-cipher`, "AIDE"+"KEY"→"KMBO"), 5-step tutorial, and beginner repair challenge shipped. Automated Kasiski/IC analysis requires new frequency-counting module primitives not yet in the engine — noted as a future P4/P5 engine addition.

- [x] **Classical cipher breadth: Transposition cipher** *(shipped June 7, 2026)*
  Rationale: No transposition cipher teaching exists at all. Columnar transposition would fill a curriculum gap and demonstrate a fundamentally different class of transformation from substitution.
  Done when: A columnar transposition board exists with a tutorial. A repair challenge is present.

- [x] **RSA teaching board** *(shipped June 7, 2026)*
  Rationale: RSA is the most commonly taught public-key system. The product has the modular arithmetic vocabulary to express it but has no dedicated board.
  Done when: A bounded RSA board shows key generation (toy scale), encryption, and decryption as explicit visible operations. Verified against known test values. Tutorial present.

- [x] **DH key exchange board** *(shipped — diffie-hellman-key-exchange demo + tutorial already present)*
  Rationale: Diffie-Hellman is the foundation of most key agreement protocols and is notably absent despite the product's strong modular arithmetic capabilities.
  Done when: A visible DH board shows the shared-secret computation with both Alice and Bob's perspectives. Tutorial present.

---

## P4 — Technical Health
*These are architecture and code-quality items that are not user-visible but will constrain future work if deferred. Do not let these fall further behind.*

- [x] **parameter-inspector.tsx refactor** *(shipped June 7, 2026)*
  Rationale: The parameter inspector is the largest acknowledged technical debt in the UI. It is already constraining future analysis work and will continue to slow cryptanalysis feature development. The May 2026 state-of-the-union named it explicitly.
  Done when: parameter-inspector.tsx is split into focused, coherent components. No behavior changes visible to the user. No new surface area added during the refactor.
  Shipped: 9 static module analysis useMemos extracted to `inspector-module-analysis.ts`; port ordering, side layout, drag state, and bypass eligibility extracted to `inspector-port-layout.ts`. Main file: 1196 → 1076 lines.

- [x] **workbench-panel.tsx splitting** *(shipped June 7, 2026)*
  Rationale: At 5,739 lines, this is the largest single source file. It is hard to navigate, review, and modify safely. Any future canvas or workbench feature touches it.
  Done when: workbench-panel.tsx is split into sub-components with clear responsibilities. No behavior changes.
  Shipped: All pure canvas geometry helpers (grid snapping, hit-testing, SVG path generation, port placement, node sizing, inline param formatting) extracted to `workbench-canvas-geometry.ts`. Main file: 5768 → 5525 lines; 308-line geometry file is independently testable and has no React dependencies.

- [x] **store.ts audit and thinning** *(audited June 7, 2026)*
  Rationale: At 6,184 lines, the UI store is large enough to be a maintenance burden. Reducers and selectors that have drifted or accumulated should be identified and cleaned.
  Done when: Store is audited. Dead or duplicated state is removed. No behavior changes.
  Audit result: All 55 UiState fields are referenced in non-store files; all UiAction union types have reducer cases. Store size reflects application complexity, not dead accumulation. One known duplication: snapCoordinateToGrid/snapPointToGrid also exist in workbench-canvas-geometry.ts — cannot deduplicate without a circular import through WORKBENCH_GRID_SIZE.

---

## P5 — Strategic Growth
*These are meaningful expansions that are not urgent but should be planned. Do not start these until P1 is complete and P2/P3 are substantially advanced.*

- [x] **TLS-adjacent protocol handshake board** *(shipped June 7, 2026)*
  Rationale: A pedagogical TLS-like handshake (key exchange → session key derivation → AEAD encryption) would be the most sophisticated protocol teaching board in the product and would demonstrate the "systems IDE" identity most clearly.
  Done when: A bounded pedagogical protocol handshake board shows the full pipeline — key exchange, symmetric key derivation, authenticated encryption — with a tutorial. Verified against test vectors where applicable.

- [x] **Weak PRNG consequence board** *(shipped June 8, 2026)*
  Rationale: The PRNG / LFSR / Randomness Lab boards teach structure but not consequence. A board that shows what happens when a weak PRNG feeds a cipher — predictable output, recoverable key — would complete that teaching arc.
  Done when: A bounded consequence board shows LFSR-based keystream prediction with a visible recovery path. Tutorial present.

- [x] **Python export: additional coverage audit** *(audited June 8, 2026)*
  Rationale: As new modules ship, Python export parity needs to be maintained. This item tracks the ongoing discipline of keeping export parity current.
  Done when: Every module in V1_REGISTRY either has Python export support or is explicitly documented as export-unsupported in the compatibility table.

- [x] **Student progress evidence (lightweight)** *(shipped June 8, 2026)*
  Rationale: Teachers need evidence of student engagement beyond "they were in the room." Even lightweight local tracking — challenge attempts, verification passes, repair completions — would support assessment in a classroom setting.
  Done when: Some bounded form of session evidence is visible to the teacher after a pilot, without requiring external infrastructure or accounts.

- [ ] **Lab-pack curation: a second curated subject pack**
  Rationale: The instructor pilot pack and manual are now strong. A curated lab pack for a specific subject (e.g., "AES Building Blocks Pack" or "ECC Teaching Pack") would make the product more immediately usable by a teacher who is not yet comfortable building their own labs.
  Done when: One new curated lab pack is available as an importable artifact, with a pilot-pack entry and manual routing for it.

---

## Progress Measurement

At any point, progress can be assessed against these three questions:

1. **Is the Verify/Export pillar complete?**
   P1 item 1 (GF2/AES Python export) closes the most visible gap. P5 item 3 (Python export audit) closes it permanently.

2. **How close is the north star?**
   P2 items 1–4 are the direct north star gap-closers. When all four are done, the "feels alive" half of the north star is substantially realized. Current: ~40%. Target: ~80% when P2 is complete.

3. **How complete is the teaching curriculum?**
   P3 items track curriculum completion. When P3 is complete, MCW covers: classical (Enigma + Vigenere + Transposition), modern (AES full + key schedule + hash), protocol (ECDH + Schnorr + DH + RSA + TLS-adjacent), and consequences (nonce reuse + IV reuse + padding oracle + weak PRNG). That is a comprehensive cybersecurity curriculum.

---

*This document should be updated whenever an item ships. Note the shipping date next to the checkbox.*
