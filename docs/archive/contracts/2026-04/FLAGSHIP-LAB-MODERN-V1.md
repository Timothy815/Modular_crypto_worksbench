# FLAGSHIP-LAB-MODERN-V1

Status: Shipped on `main`.

Owner: Codex
Scope: Modern Flagship Sequence / Tutorials / Challenges / Cryptanalysis / Verification / Manual

## Why

The classical flagship now proves that MCW is more than a cipher toy on the historical/mechanical side.

The next differentiator should prove the same thing for modern structures.

What makes MCW special is not that it can name modern components like:
- rounds
- S-boxes
- permutations
- subkeys
- Feistel structure

It is that MCW can make those ideas:
- buildable
- inspectable
- traceable
- analyzable
- repairable
- verifiable
- exportable

The modern line already has the right raw ingredients:
- visible byte rounds
- keyed round structure
- bounded iterators
- Feistel composition
- authored S-boxes and bounded table transforms
- avalanche and diffusion views
- verification and Python parity export

But those capabilities still mostly live as separate slices and demos.

The next honest move is to package them into one classroom-ready flagship modern lab sequence that demonstrates why MCW is different from a static round diagram, a black-box “AES visualizer,” or a toy encryption worksheet.

## Goal

Create one high-impact modern flagship lab sequence that turns the existing round / S-box / diffusion line into a coherent teaching pathway for students and instructors.

The first milestone should make it possible to:
- begin with one canonical modern round machine
- learn substitution, permutation, and keying through one staged tutorial sequence
- inspect diffusion and avalanche through existing analysis surfaces
- repair or reason about that system through multiple linked challenges
- verify behavior against explicit expected outputs
- end with one export/parity-oriented capstone handoff

## Product Boundary

This slice is:
- classroom-first
- sequence-first
- built from already-shipped modern-round capabilities
- intended to prove product distinctiveness through depth and coherence

It is not:
- a new block-cipher primitive line
- a new generalized cryptanalysis dashboard
- a security-claims surface
- a full curriculum platform
- a full “course mode”

The right framing is:
- one polished modern glass-box lab family
- one teachable progression
- one professor-ready showcase

## Required V1 Shape

1. V1 should define one flagship modern lab pathway built from already-shipped demos, tutorials, challenges, cryptanalysis, verification, and export capabilities.
2. The sequence should be centered on the visible round / S-box / diffusion line, not split across unrelated modern topics.
3. V1 should include:
   - one canonical entry demo
   - one staged tutorial sequence
   - at least two linked challenges
   - one explicit cryptanalysis/analyze step
   - one manual subsection or manual expansion that supports the whole sequence
   - one explicit verification step
   - one explicit export/parity capstone handoff
4. The sequence should explicitly teach:
   - substitution through authored S-boxes
   - permutation and bit movement
   - key/material visibility
   - multi-round structure
   - diffusion and avalanche as observable consequences
5. The sequence must reference demos, tutorials, and challenges by stable IDs, not by display titles alone.
6. The sequence should remain bounded to already-shipped machine behaviors rather than adding new engine work in V1.
7. The final step should make clear that MCW can carry a visible modern-round machine from authored workspace to exported Python while preserving inspectable behavior.
8. Flagship demos, tutorials, and challenges should use explicit lab-style numbering or namespacing so the intended sequence order is unmistakable.
9. The sequence should be discoverable through the existing demo searchability using terms like `round`, `sbox`, `diffusion`, `avalanche`, or `feistel`.
10. The parity capstone should include a short success guide that explains what to do if local Python is unavailable, so environment setup does not erase the teaching value of the sequence.
11. At least one tutorial step must explicitly guide the user to trigger an Avalanche run in the Modern Cryptanalysis panel and interpret the resulting diffusion chart.
12. The flagship machine should stay small enough that avalanche and diffusion views remain readable on a standard laptop screen.

## Preferred V1 Direction

The likely best first shape is a three-part modern sequence:

1. **Round Mechanics**
   - start with one canonical byte/bit round machine
   - make substitution, permutation, and key flow mechanically legible

2. **Diffusion And Analysis**
   - move into a multi-round or Feistel-style machine
   - use Analyze / Cryptanalysis to read avalanche and diffusion as visible behavior, not mythology

3. **Trust And Handoff**
   - verify the machine against expected behavior
   - export to Python
   - run or explain parity as the final trust step

That gives the user a visible modern machine journey:
- structure
- mixing
- analysis
- debugging
- trust

## Sequence Rules

- The sequence should feel like one family, not a list of unrelated labs.
- Each step should have a clear teaching purpose and a visible success condition.
- The challenges should teach repair and explanation, not just random experimentation.
- The sequence should require one explicit analyze/cryptanalysis moment where the user reads a diffusion or avalanche consequence from the existing surfaces.
- The export/parity handoff should be framed as “prove the authored machine survived export,” not as an afterthought.
- The sequence should be suitable for an instructor to assign as a bounded modern lab progression.

## Teaching Rules

- The sequence must not treat modern-round behavior as mystical “security by complexity.”
- The sequence should use a clear `LAB-2.x` namespace to distinguish it from the shipped classical `LAB-1.x` line.
- Every surprising behavior should be explained through visible machine structure:
  - S-box substitution
  - permutation
  - key/material distribution
  - iteration/rounding
  - output comparison
- The sequence should explicitly distinguish:
  - substitution
  - permutation
  - keying
  - diffusion/avalanche
  - verification
  - export trust
- The tutorial and challenge copy should help a student explain *why* the machine behaved as it did, not only restore the correct output.
- One challenge in the sequence should focus specifically on permutation repair, since that is a confusion point MCW is uniquely able to expose honestly.
- One challenge in the sequence should focus specifically on authored S-box structure, since that is another confusion point MCW can expose honestly without hiding the table.

## Non-Goals

- No new round primitive in V1
- No new cryptanalysis engine in V1
- No claim that the flagship lab proves modern security
- No generalized grading engine
- No broad multi-family modern curriculum in the same slice

## Success Condition

This slice is successful if:
- a student can complete one coherent modern-round sequence in MCW
- explain substitution, permutation, and diffusion without appealing to hidden magic
- solve linked repair challenges
- use the existing analysis surfaces to read and explain a real structural consequence
- verify behavior against expected results
- and understand that the same machine can then be exported with parity support, with a clear path for either running parity locally or understanding the handoff if Python is not available

## Notes

This should come before another experimental modern primitive line.

If MCW is going to prove uniqueness to a professor, it needs one unmistakably polished modern flagship path that demonstrates:
- visible round mechanics
- visible analysis
- visible debugging
- visible verification
- visible export trust

The goal is not to have “many modern demos.”
The goal is to have one modern sequence strong enough that a professor can say:
- this tool makes modern cryptographic structure legible in a way that static slides and black-box demos do not
