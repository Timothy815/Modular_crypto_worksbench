import { describe, expect, it } from 'vitest';

import { demoProjects, getDefaultDemoProject } from './demo-projects';

describe('getDefaultDemoProject', () => {
  it('starts new users at the beginning of the learning sequence', () => {
    const defaultProject = getDefaultDemoProject(demoProjects);

    expect(defaultProject?.id).toBe('bridge');
  });
});
