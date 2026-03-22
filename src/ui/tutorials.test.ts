import { describe, expect, it } from 'vitest';

import { clampTutorialStepIndex, getTutorialStep, type GuidedTutorial } from './tutorials';

const tutorial: GuidedTutorial = {
  id: 'test',
  title: 'Test Tutorial',
  summary: 'Test summary',
  projectId: 'bridge',
  steps: [
    { id: 'step-1', title: 'One', body: 'First' },
    { id: 'step-2', title: 'Two', body: 'Second' },
    { id: 'step-3', title: 'Three', body: 'Third' },
  ],
};

describe('tutorial helpers', () => {
  it('clamps negative step indexes to zero', () => {
    expect(clampTutorialStepIndex(tutorial, -5)).toBe(0);
  });

  it('clamps overflowing step indexes to the final step', () => {
    expect(clampTutorialStepIndex(tutorial, 99)).toBe(2);
  });

  it('returns the current tutorial step after clamping', () => {
    expect(getTutorialStep(tutorial, 1)?.id).toBe('step-2');
    expect(getTutorialStep(tutorial, 99)?.id).toBe('step-3');
  });

  it('returns null for missing tutorials', () => {
    expect(getTutorialStep(null, 0)).toBeNull();
  });
});
