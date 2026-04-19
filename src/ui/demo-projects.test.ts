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
});
