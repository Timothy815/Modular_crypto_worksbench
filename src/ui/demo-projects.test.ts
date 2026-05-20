import { describe, expect, it } from 'vitest';

import { demoProjects, getDefaultDemoProject } from './demo-projects';

describe('getDefaultDemoProject', () => {
  it('starts new users at the beginning of the learning sequence', () => {
    const defaultProject = getDefaultDemoProject(demoProjects);

    expect(defaultProject?.id).toBe('bridge');
  });
});

describe('demoProjects', () => {
  it('includes the explicit sequence segmentation and rejoin demo as a ticked workflow', () => {
    const demo = demoProjects.find((project) => project.id === 'bit-sequence-segment-and-rejoin');

    expect(demo?.name).toBe('Bit Sequence Segment And Rejoin');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('BitsSequenceToTicked');
    expect(demo?.pipeline).toContain('TickedBitsToSequence');
  });

  it('includes the visible repeated-key repair demo as a ticked workflow', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-repeated-key-repair');

    expect(demo?.name).toBe('Visible Repeated-Key Repair');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('RepeatSymbolToMatch');
    expect(demo?.pipeline).toContain('AsciiSequenceToTicked');
    expect(demo?.pipeline).toContain('TickedBitsToSequence');
  });

  it('includes the visible strict-length gate demo as a ticked workflow', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-strict-length-gate');

    expect(demo?.name).toBe('Visible Strict-Length Gate');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('RequireSymbolLengthMatch');
    expect(demo?.pipeline).toContain('RepeatSymbolToMatch');
    expect(demo?.pipeline).toContain('TickedBitsToSequence');
  });

  it('includes the visible hex block paths demo as a ticked workflow', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-hex-block-paths');

    expect(demo?.name).toBe('Visible Hex Block Paths');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('BitsSequenceToTicked');
    expect(demo?.pipeline).toContain('TruncateBitsToMatch');
    expect(demo?.pipeline).toContain('PadBitsToMatch');
  });

  it('includes the visible mismatch policy family demo as a comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-mismatch-policy-family');

    expect(demo?.name).toBe('Visible Mismatch Policy Family');
    expect(demo?.pipeline).toContain('RequireSymbolLengthMatch');
    expect(demo?.pipeline).toContain('RepeatSymbolToMatch');
    expect(demo?.pipeline).toContain('TruncateSymbolToMatch');
    expect(demo?.pipeline).toContain('PadSymbolToMatch');
  });

  it('includes the visible bridge family demo as a comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-bridge-family');

    expect(demo?.name).toBe('Visible Bridge Family');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('AsciiSequenceToBits');
    expect(demo?.pipeline).toContain('AsciiSequenceToTicked');
    expect(demo?.pipeline).toContain('BitsSequenceToTicked');
    expect(demo?.pipeline).toContain('TickedBitsToSequence');
  });

  it('includes the visible operator family demo as a comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-operator-family');

    expect(demo?.name).toBe('Visible Operator Family');
    expect(demo?.pipeline).toContain('XOR');
    expect(demo?.pipeline).toContain('AND');
    expect(demo?.pipeline).toContain('AddMod');
    expect(demo?.pipeline).toContain('BitShifter');
  });

  it('includes the visible stateful family demo as a comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-stateful-family');

    expect(demo?.name).toBe('Visible Stateful Family');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('Clock');
    expect(demo?.pipeline).toContain('Counter');
    expect(demo?.pipeline).toContain('LFSR');
    expect(demo?.pipeline).toContain('ClockedByteRoundIterator');
  });

  it('includes the visible stepped mechanisms demo as an applied comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-stepped-mechanisms');

    expect(demo?.name).toBe('Visible Stepped Mechanisms');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('Rotor');
    expect(demo?.pipeline).toContain('ClockedByteRoundIterator');
    expect(demo?.pipeline).toContain('TextInput');
    expect(demo?.pipeline).toContain('IV');
  });

  it('includes the visible control family demo as a live comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-control-family');

    expect(demo?.name).toBe('Visible Control Family');
    expect(demo?.defaultTickedMode).toBe(true);
    expect(demo?.pipeline).toContain('Gate');
    expect(demo?.pipeline).toContain('Mux');
    expect(demo?.pipeline).toContain('MultiRouter');
    expect(demo?.pipeline).toContain('BitsSequenceToTicked');
  });

  it('includes the full AES round demo as a composed FIPS-verified workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-round-full');

    expect(demo?.name).toBe('AES Round (Full)');
    expect(demo?.pipeline).toContain('16x SBox(AES)');
    expect(demo?.pipeline).toContain('Permutation(ShiftRows)');
    expect(demo?.pipeline).toContain('MixColumns');
    expect(demo?.pipeline).toContain('16x XOR(round key)');
  });

  it('includes the AES row perturbation demo as a canonical-vs-perturbed comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-row-perturbation');

    expect(demo?.name).toBe('AES Row Perturbation');
    expect(demo?.pipeline).toContain('Canonical AES Round');
    expect(demo?.pipeline).toContain('Perturbed AES Round(row1=0)');
    expect(demo?.pipeline).toContain('Equals(branch comparisons)');
    expect(demo?.pipeline).toContain('AesConsequenceSummary');
  });

  it('includes the keyed S-box authoring demo as a bounded table-selection workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'keyed-sbox-authoring');

    expect(demo?.name).toBe('Keyed S-Box Authoring');
    expect(demo?.pipeline).toContain('KeyedSBox4');
    expect(demo?.pipeline).toContain('SBox(PRESENT)');
    expect(demo?.pipeline).toContain('BitOutput(valid permutation)');
  });

  it('includes the AES column perturbation demo as a canonical-vs-perturbed diffusion comparison workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-column-perturbation');

    expect(demo?.name).toBe('AES Column Perturbation');
    expect(demo?.pipeline).toContain('Canonical AES Round');
    expect(demo?.pipeline).toContain('Perturbed AES Round(mix row0 = 02 02 01 01)');
    expect(demo?.pipeline).toContain('BitsToHex(post-MixColumns and final state)');
    expect(demo?.pipeline).toContain('Equals(branch comparisons)');
    expect(demo?.pipeline).toContain('AesConsequenceSummary');
  });

  it('includes the Schnorr nonce reuse consequence demo as a visible misuse-autopsy workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'schnorr-nonce-reuse-consequence');

    expect(demo?.name).toBe('Schnorr Nonce Reuse Consequence');
    expect(demo?.pipeline).toContain('two Schnorr-style lanes sharing nonce R');
    expect(demo?.pipeline).toContain('ScalarLinearCombine(s1,s2)');
    expect(demo?.pipeline).toContain('FieldSub(Δs,Δc)');
    expect(demo?.pipeline).toContain('FieldInverse');
    expect(demo?.pipeline).toContain('Equals(secret recovery)');
  });

  it('includes the low-order ECDH consequence demo as a visible subgroup-collapse workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'ecdh-low-order-point-consequence');

    expect(demo?.name).toBe('ECDH Low-Order Point Consequence');
    expect(demo?.pipeline).toContain('PointSource(G,Q_low)');
    expect(demo?.pipeline).toContain('PointOrder(Q_low)');
    expect(demo?.pipeline).toContain('ScalarMultiply(aG,B,aB,aQ_low,a-prime Q_low)');
    expect(demo?.pipeline).toContain('PointEquals(low-order collapse)');
  });

  it('includes the Schnorr challenge binding consequence demo as a visible transcript-integrity workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'schnorr-challenge-binding-consequence');

    expect(demo?.name).toBe('Schnorr Challenge Binding Consequence');
    expect(demo?.pipeline).toContain('visible signer transcript');
    expect(demo?.pipeline).toContain('ChallengeCombine(c_sig,c_broken,c_claim)');
    expect(demo?.pipeline).toContain('ScalarLinearCombine(s)');
    expect(demo?.pipeline).toContain('PointEquals(broken verifier vs honest verifier)');
  });

  it('includes the ECC public-key validation consequence demo as a visible peer-acceptance workspace', () => {
    const demo = demoProjects.find((project) => project.id === 'ecc-public-key-validation-consequence');

    expect(demo?.name).toBe('ECC Public-Key Validation Consequence');
    expect(demo?.pipeline).toContain('PointOnCurve');
    expect(demo?.pipeline).toContain('ScalarMultiply(11B,11Q_low,0B,aB,a-prime B,aQ_low,a-prime Q_low)');
    expect(demo?.pipeline).toContain('PointSelector(accepted peers)');
    expect(demo?.pipeline).toContain('PointEquals(validation + collapse contrast)');
  });
});
