# CRYPTANALYSIS WORKSPACE V1

Status: Shipped initial workspace boundary on `main`

Last updated: March 22, 2026

---

## 1. Purpose

MCW has now reached the point where construction and interrogation should be treated as
distinct but connected activities.

The `Compare` surface remains the lightweight place for:
- baseline vs variant output comparison
- first-divergence debugging
- quick summary statistics on final text output

The new Cryptanalysis workspace exists for a different task:
- discovering structure in ciphertext
- testing classical attack hypotheses
- reconstructing likely plaintext and key candidates

This workspace is not an automatic solver. It is a guided laboratory for analysis.

---

## 2. First Milestone

The first cryptanalysis milestone is:

**Vigenere Analysis Workspace**

Why Vigenere first:
- it is historically important
- it requires real analysis rather than brute force
- it naturally combines multiple tools:
  - index of coincidence
  - repeated-pattern / Kasiski-style examination
  - candidate key-length estimation
  - per-column frequency analysis
  - Caesar-shift scoring
  - plaintext reconstruction

This is the right complexity level after `v1.3.0`:
- more substantial than Caesar
- far less specialized than Enigma/Bombe-style search
- broad enough to justify a dedicated workspace

---

## 3. Product Boundary

### 3.1 Compare vs Cryptanalysis

`Compare` continues to own:
- baseline capture
- variant comparison
- first divergent step/tick reporting
- quick output statistics:
  - letter counts
  - IOC
  - top letters
  - top bigrams
  - top trigrams

`Cryptanalysis` owns:
- standalone ciphertext investigation
- candidate key-length exploration
- repeated-fragment discovery
- per-slice frequency analysis
- shift hypothesis testing
- candidate plaintext reconstruction

Do not keep growing `Compare` into a full attack surface.

### 3.2 Workspace Shape

Cryptanalysis should be a top-level workspace mode, not just another inspector panel.

Reason:
- the workflows need more room
- the user will move through multiple coordinated views
- attack tooling is a different cognitive activity from graph construction

The likely shell direction is:
- `Build`
- `Guide`
- `Cryptanalysis`

Exact UI naming can be refined later, but the product boundary is locked:
- serious analysis work gets its own workspace

---

## 4. V1 Scope

The first cryptanalysis workspace milestone should include:

1. Ciphertext input
- paste or type ciphertext directly
- treat text as the primary source for this workflow

2. Global summary
- normalized text view
- letter count
- unique letter count
- IOC
- top letters / bigrams / trigrams

3. Repeated-pattern view
- repeated fragments of bounded length
- distances between repeated occurrences
- enough support for Kasiski-style reasoning

4. Candidate key-length estimation
- IOC-by-period view
- repeated-pattern distance hints
- ranked or at least inspectable candidate periods

5. Column analysis
- split ciphertext into period-based columns
- show per-column letter frequencies
- allow per-column shift testing

6. English frequency scoring
- compare each shifted column against reference English letter frequencies
- surface the best-scoring shift candidates

7. Plaintext reconstruction preview
- combine chosen per-column shifts into a candidate key
- show live reconstructed plaintext

This should be enough to teach:
- how Vigenere leaks structure
- how period recovery works
- how monoalphabetic analysis reappears after slicing

---

## Outcome

The initial cryptanalysis workspace boundary is shipped.

Shipped shape includes:
- dedicated `cryptanalysis` workspace mode rather than continued expansion of `Compare`
- standalone cryptanalysis UI with ciphertext input, summary statistics, repeated-pattern support, candidate period analysis, column analysis, shift scoring, and plaintext reconstruction
- later bounded follow-ons for prominence, visuals, and randomness/modern analysis built on top of this workspace boundary rather than replacing it

---

## 5. Explicit Non-Goals

The first milestone explicitly excludes:
- automated full cracking
- Bombe-style search
- Enigma-specific attack machinery
- modern differential / linear cryptanalysis
- bit-domain avalanche tooling in the cryptanalysis workspace
- hidden language-model guessing
- opaque "best answer" buttons

Students should remain in control of the reasoning process.

---

## 6. Data and Scoring Rules

The first workspace should use explicit reference data and transparent scoring.

### 6.1 Normalization

V1 should normalize to uppercase A-Z for Vigenere workflows.

Non-letter handling should be explicit:
- either ignored in analysis
- or preserved only for plaintext preview display

The first milestone should prefer analysis simplicity over preserving punctuation semantics.

### 6.2 Reference Frequencies

English frequency tables should live in a dedicated reusable data file.

They are product data, not ad hoc constants inside a component.

### 6.3 Scoring

Scoring must stay inspectable.

Allowed:
- chi-squared style fit
- absolute frequency distance
- rank-based heuristics

Not allowed:
- hidden composite score with unexplained weightings

If multiple scores are shown, name them clearly.

---

## 7. UI Principles

1. Show the reasoning path.
- candidate key lengths should not appear magically
- period evidence should be visible

2. Keep the student in the loop.
- suggest candidate shifts
- do not silently choose them

3. Prefer coordinated panes over stacked prose.
- ciphertext summary
- key-length evidence
- column analysis
- plaintext preview

4. Keep room for future families.
- Vigenere first
- broader classical attack workflows later

---

## 8. Implementation Sequence

Recommended order:

1. Contract and shell
- add the new workspace mode
- persist its state
- do not overbuild the UI yet

2. Shared analysis data/helpers
- English frequency table
- reusable IOC helpers
- repeated-pattern utilities

3. First visible workspace slice
- ciphertext input
- global summary
- candidate key-length evidence

4. Column/shift workflow
- per-column slicing
- shift scoring
- candidate plaintext reconstruction

5. Final polish
- clearer evidence presentation
- educational copy
- maybe export or note-taking later

---

## 9. Safe Extensions After V1

Likely next steps after this milestone:
- richer Kasiski tooling
- Caesar / affine helper workflows
- transposition-analysis helpers
- classical crib tooling
- later, modern analysis instruments in a separate post-V1 line

Do not mix these into the first milestone unless the Vigenere loop is already clean.

---

## 10. Summary

The next major branch after `v1.3.0` is:

**`feature/cryptanalysis-workspace-vigenere`**

The correct first move is not automated cracking.
It is a dedicated workspace that teaches how to analyze ciphertext with explicit, inspectable tools.
