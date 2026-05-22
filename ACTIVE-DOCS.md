# MCW Active Docs

Last updated: May 22, 2026

This is the canonical starting point for humans and agents.

## Always Read

- `AGENTS.md`
- `PROJECT.md`
- `ENGINE-V1-CONTRACT.md`
- `IMPLEMENTATION-STATUS.md`
- `EXPERIENTIAL-NORTH-STAR-V1.md`
- `docs/live/contracts/2026-04/CODE-FIRST-CAPABILITIES-AUDIT-2026-04-29.md`
- `docs/live/contracts/2026-04/STATE-OF-THE-UNION-2026-04-29.md`
- `docs/live/contracts/2026-05/STATE-OF-THE-UNION-2026-05-14.md` — current canonical state snapshot (AES Building Blocks complete, palette reorganization, EC inspector fixes)
- `docs/live/contracts/2026-04/ANALYTICAL-RIGOR-ROADMAP-V1.md` when analysis quality, validity, or interpretation is in scope
- `docs/live/contracts/2026-04/SBOX-ANALYSIS-RIGOR-PASS-V1.md` when tightening local cryptographic metric framing and consequence language
- `docs/live/contracts/2026-05/ECC-FOUNDATIONS-ROADMAP-V1.md` when evaluating whether and how algebraic or elliptic-curve cryptography should enter MCW
- `docs/live/contracts/2026-05/ARITHMETIC-EXACTNESS-AUDIT-2026-05-01.md` when evaluating arithmetic exactness boundaries before future field or ECC work
- `docs/live/contracts/2026-05/EXACT-INTEGER-SUBSTRATE-V1.md` when planning the first bounded arithmetic substrate hardening slice
- `docs/live/contracts/2026-05/ALGEBRAIC-SIGNALS-V1.md` when planning the first visible algebraic signal-domain expansion
- `docs/live/contracts/2026-05/PRIME-FIELD-ARITHMETIC-V1.md` when planning the first honest finite-field layer for future ECC work
- `docs/live/contracts/2026-05/ELLIPTIC-CURVE-POINT-MECHANICS-V1.md` when planning the first honest visible elliptic-curve point layer
- `docs/live/contracts/2026-05/SCALAR-MULTIPLICATION-V1.md` when planning the first honest repeated-point-action layer before any visible ECDH work
- `docs/live/contracts/2026-05/VISIBLE-ECDH-V1.md` when planning the first honest elliptic-curve key-agreement teaching slice
- `docs/live/contracts/2026-05/POINT-ORDER-AND-SUBGROUPS-V1.md` when planning the first honest subgroup/point-order teaching layer after visible ECDH
- `docs/live/contracts/2026-05/ECC-RIGOR-PASS-V1.md` when tightening how the shipped ECC line is framed, interpreted, and bounded
- `docs/live/contracts/2026-05/VISIBLE-SCHNORR-V1.md` when planning the first honest glass-box ECC signature teaching slice
- `docs/live/contracts/2026-05/SCHNORR-NONCE-REUSE-CONSEQUENCE-V1.md` when reviewing the shipped bounded ECC misuse-teaching slice after visible Schnorr — making nonce reuse and secret-scalar recovery legible as a live machine consequence
- `docs/live/contracts/2026-05/SCHNORR-CHALLENGE-BINDING-CONSEQUENCE-V1.md` when reviewing the shipped bounded ECC signature-integrity consequence slice after visible Schnorr and nonce reuse — making verifier challenge/message misbinding legible as a false-looking verification success
- `docs/live/contracts/2026-05/ECDH-LOW-ORDER-POINT-CONSEQUENCE-V1.md` when reviewing the shipped bounded ECC protocol-consequence slice after visible ECDH, point order, and Schnorr nonce reuse — making low-order peer points and shared-secret collapse legible as a live machine consequence
- `docs/live/contracts/2026-05/ECC-PUBLIC-KEY-VALIDATION-CONSEQUENCE-V1.md` when reviewing the shipped ECC validation/consequence slice after low-order peer-point collapse and Schnorr challenge binding — making curve-membership-only acceptance visibly insufficient before protocol use
- `docs/live/contracts/2026-05/WORKSPACE-DURABILITY-SAFETY-V1.md` when reviewing the shipped bounded persistence-safety slice after the ECC consequence line — moving primary document storage off `localStorage`, adding autosave recovery, and reducing accidental local loss before any packaging-focused pass
- `docs/live/contracts/2026-05/AUTHORING-DURABILITY-UX-V1.md` when planning the first authoring ergonomics follow-on after the shipped persistence-safety slice — making current save health, recovery recency, degraded mode, and export/back-up boundaries legible enough to trust during real work
- `docs/live/contracts/2026-05/LOCAL-DOCUMENT-WORKFLOW-V1.md` when reviewing the shipped filesystem-backed document workflow slice after durability UX — separating open/save/save-as document flow from import/export artifact flow and making file-backed work feel like opening a named workspace document instead of importing an artifact
- `docs/live/contracts/2026-05/COMPOSITE-AUTHORING-ERGONOMICS-V1.md` when reviewing the shipped packaging/authoring ergonomics slice after durability and local-document workflow — making reusable composite capture, palette summaries, and drill-in/out flows legible before deeper boundary-port authoring
- `docs/live/contracts/2026-05/WORKSPACE-NAVIGATION-AND-SCALE-V1.md` when reviewing the shipped workspace-scale ergonomics slice after composite authoring improvements — adding framing, named workspace regions, and bounded return-to-previous-view support without inventing a second workspace representation
- `docs/live/contracts/2026-05/PACKAGE-LIBRARY-AND-REUSE-V1.md` when reviewing the shipped reusable-library ergonomics slice after workspace navigation improvements — making authored definitions easier to find, rename, duplicate, and place without turning MCW into a package manager
- `docs/live/contracts/2026-05/WORKSPACE-SCOPED-REUSABLES-V1.md` when reviewing the shipped authored-reuse storage-model slice after package-library ergonomics — making new reusables workspace-local by default and promotion into a personal shared library explicit
- `docs/live/contracts/2026-05/REUSABLE-DEPENDENCY-AND-PROMOTION-VISIBILITY-V1.md` when reviewing the shipped authored-reuse trust slice after workspace-scoped reusables — making immediate dependency scope and promotion consequence visible before authors treat promoted reusables as broadly reusable
- `docs/live/contracts/2026-05/ECC-POINT-PYTHON-EXPORT-PARITY-V1.md` when closing the remaining Python export gap for the shipped ECC point family
- `docs/live/contracts/2026-05/VISIBLE-DOUBLE-AND-ADD-V1.md` when reviewing the shipped ECC visibility slice after the scalar-multiplication/ECDH/Schnorr line — unpacking scalar multiplication into an explicit repeated-action machine
- `docs/live/contracts/2026-05/TOY-CURVE-POINT-MAP-V1.md` when reviewing the shipped toy-curve ECC intuition slice after visible double-and-add — making one toy finite-field curve legible as a visible point set and repeated-action landscape
- `docs/live/contracts/2026-05/REAL-WORLD-CRYPTO-CAPABILITY-ROADMAP-V1.md` when evaluating the overall trajectory from toy-scale to real-scale cryptography — read this before starting any of the three real-world layers
- `docs/live/contracts/2026-05/REAL-SCALE-ARITHMETIC-SUBSTRATE-V1.md` when planning the param-layer change that lifts the Number.isSafeInteger ceiling from all ECC and field arithmetic modules
- `docs/live/contracts/2026-05/NAMED-CURVE-SOURCES-V1.md` when planning the named-curve source modules (secp256k1, P-256) and inspector preset ergonomics — depends on REAL-SCALE-ARITHMETIC-SUBSTRATE-V1
- `docs/live/contracts/2026-05/GF2-FIELD-ARITHMETIC-V1.md` when reviewing shipped GF(2⁸) field arithmetic (GF2Mul, GF2Inv, Visible MixColumns) — use as historical context for the next AES round slice
- `docs/live/contracts/2026-05/AES-ROUND-COMPOSITE-V1.md` when reviewing the shipped full AES round composite — composition scope, ShiftRows bus wiring, FIPS 197 round-1 acceptance, and the follow-on parity/refactor phases
- `docs/live/contracts/2026-05/GF2-AES-PYTHON-EXPORT-PARITY-V1.md` when reviewing the shipped GF2/AES Python export parity slice after the AES round composite — primitive/workspace parity, FIPS replay, and bounded test-coverage completion
- `docs/live/contracts/2026-05/AES-ROW-COLUMN-PERTURBATION-V1.md` when reviewing the shipped bounded AES control-and-consequence slice after the round composite — row-rotation perturbation with explicit visible consequences and no generic cipher-lab sprawl
- `docs/live/contracts/2026-05/KEYED-SBOX-AUTHORING-V1.md` when reviewing the shipped bounded keyed-substitution slice after AES row perturbation — visible 2-bit key selection over one explicit 4-bit S-box family, machine-visible permutation validity, and honest local consequence language
- `docs/live/contracts/2026-05/AES-COLUMN-PERTURBATION-V1.md` when reviewing the shipped bounded AES controllability slice after keyed S-box authoring — one explicit MixColumns-rule perturbation with visible post-MixColumns and final-output consequences
- `docs/live/contracts/2026-05/AES-LOCAL-CONSEQUENCE-ANALYSIS-V1.md` when reviewing the shipped bounded AES interpretation slice after the row/column/keyed-control line — machine-visible first divergence, changed-byte counts, and local consequence language
- `docs/live/contracts/2026-05/PARAMETER-INSPECTOR-REFACTOR-V1.md` when reviewing the shipped configure-tab extraction from `parameter-inspector.tsx` — architecture protection only, no behavior change
- `docs/live/contracts/2026-05/DEMO-ATLAS-V1.md` when reviewing the shipped Demo Atlas discovery surface — Learning-dock Atlas tab, searchable concept-map sections, and explicit separation from the fast-launch Demo menu

## Read As Needed

- `V2.1-NEXT-DOCKET.md` for broader priority framing
- `RELEASE-VERSIONING.md` for release-line consistency
- `V2.1-AUTHORING-POWER-PLAN.md` for historical builder-power intent
- `CRYPTOGRAPHIC-VOCABULARY-ROADMAP.md` for long-range vocabulary direction
- `docs/live/contracts/2026-04/PYTHON-EXPORT-RUNTIME-LIBRARY-V1.md` only if revisiting future export productization

## Live Contract Directories

- `docs/live/contracts/2026-04/` holds non-core active or undecided contracts/notes that should stay out of the repo root
- `docs/archive/contracts/2026-04/` holds shipped/completed historical contracts

## Archived Contracts

Historical shipped/completed contracts can be moved under `docs/archive/`.
Active but non-core contracts/notes can live under `docs/live/contracts/`.

The first archived wave lives in:
- `docs/archive/contracts/2026-04/`

When a contract is archived:
- update its `Status:` line first
- move it into `docs/archive/`
- update any explicit restart/reference paths that still point at the root copy
- remove it from any live shortlist that implies it is still open work

## Current Practical Rule

Do not assume an older contract at repo root is the next thing to build.

Do not assume an older status note is still accurate if it conflicts with the code-first audit.

Use `IMPLEMENTATION-STATUS.md` plus this file to decide whether a contract is:
- still active
- planning-only
- or already historical and safe to archive
