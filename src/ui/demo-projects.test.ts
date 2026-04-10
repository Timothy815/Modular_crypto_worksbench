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
});
