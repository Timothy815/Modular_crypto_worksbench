# Mark II Avalanche Analysis

Date: April 24, 2026
Status: Active design note

## Purpose

Record the first systematic ciphertext-avalanche sweep for the current Mark II SPN baseline after:

- fixing the `m2fwdrnd-4` left/right lane asymmetry
- adding full-width round constants to the 3-round key schedule

## Artifact Under Test

- Workspace: `markii-spn.mcw (5).json`
- Export: `markii-spn_python_export (2)/markii-spn.py`
- Plaintext source: `hexsequenceinput-1`
- Ciphertext sink: `bitoutput-7`
- Decryption/round-trip sink: `bitoutput-1`

Key used during the sweep:

- `D4E9A17C6B3F82F15AC0D94E27B8613F`

Round constants used:

- `R1 = 9F3A7C2D4E81B6A5D2C9F0E1374B8A6C`
- `R2 = 4C8E19A7D3F2B6E05A7D91C3E8F4B2D6`
- `R3 = A17D5E3C9B02F4A6D8C1E73B5F9A6D2E`

## Important Export Note

The generated Python export still contains an override gap:

- `_mcw_source_override()` is emitted
- but generated `HexSequenceInput` calls inside `_mcw_run()` do not use it

That means direct Python-side source overrides are currently ignored by the stock export. The avalanche sweep was therefore run by patching the export in memory and driving the exported composite functions directly.

This is an exporter bug, not a Mark II design result.

## Results

Systematic test:

- flip each plaintext bit once across all `128` bit positions
- compare changed ciphertext bits against the baseline ciphertext
- verify that decrypt(encrypt(flipped_plaintext)) returns the flipped plaintext

Observed results:

- Round-trip failures: `0`
- Minimum changed ciphertext bits: `6`
- Maximum changed ciphertext bits: `65`
- Average changed ciphertext bits: `36.055`
- Median changed ciphertext bits: `37`
- Standard deviation: `11.698`

Lowest individual cases:

- bit `97` -> `6`
- bits `40`, `115` -> `8`
- bits `19`, `73` -> `11`

Highest individual cases:

- bit `60` -> `65`
- bit `11` -> `60`
- bit `13` -> `57`
- bit `112` -> `56`

Byte-group averages:

- byte `0` -> `29.625`
- byte `1` -> `44.125`
- byte `2` -> `27.125`
- byte `3` -> `37.875`
- byte `4` -> `41.000`
- byte `5` -> `27.250`
- byte `6` -> `42.875`
- byte `7` -> `44.875`
- byte `8` -> `34.125`
- byte `9` -> `30.125`
- byte `10` -> `36.875`
- byte `11` -> `42.625`
- byte `12` -> `25.625`
- byte `13` -> `38.500`
- byte `14` -> `38.500`
- byte `15` -> `35.750`

## Interpretation

The round constants improved some individual cases materially. A spot check reached `50`, which is much better than the earlier high-30s examples.

But the full `128`-bit sweep shows that the design is still uneven at `3` rounds:

- some bits propagate strongly
- some bits remain weak
- the variance is too high for a comfortably diffusive `128`-bit SPN

So the correct current reading is:

- Mark II is structurally valid
- round constants were the right move
- `3` rounds are still not enough for consistent diffusion

## Design Conclusion

The next most justified design move is:

1. keep the corrected-with-constants Mark II as the known-good baseline
2. add a `4th` round
3. rerun the same sweep before making deeper structural changes

If the average remains in the 30s after `4` rounds, the issue is more likely structural than depth-only.

If the average moves upward and the weak low-end cases rise materially, then depth is doing the expected work.
