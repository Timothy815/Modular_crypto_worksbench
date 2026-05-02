# MCW Active Docs

Last updated: May 2, 2026

This is the canonical starting point for humans and agents.

## Always Read

- `AGENTS.md`
- `PROJECT.md`
- `ENGINE-V1-CONTRACT.md`
- `IMPLEMENTATION-STATUS.md`
- `EXPERIENTIAL-NORTH-STAR-V1.md`
- `docs/live/contracts/2026-04/CODE-FIRST-CAPABILITIES-AUDIT-2026-04-29.md`
- `docs/live/contracts/2026-04/STATE-OF-THE-UNION-2026-04-29.md`
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
