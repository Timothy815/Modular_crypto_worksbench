import { describe, expect, it } from 'vitest';

import {
  buildShareableLabPack,
  prepareImportedLabPack,
  parseWorkspaceArtifact,
} from './workspace-artifacts';

describe('workspace-artifacts', () => {
  it('parses workbench documents before lab-pack import logic runs', () => {
    const parsed = parseWorkspaceArtifact(
      JSON.stringify({
        version: 1,
        project: { modules: [], connections: [] },
        ui: { layout: {}, annotations: [], layoutDirection: 'vertical' },
      }),
    );

    expect(parsed?.kind).toBe('workbench');
  });

  it('prepares imported lab packs with unique local workspace and learning ids', () => {
    const pack = buildShareableLabPack({
      activeProjectId: 'demo',
      projectName: 'Shared Lab',
      projectSummary: 'summary',
      project: { modules: [], connections: [] },
      layout: {},
      annotations: [],
      layoutDirection: 'vertical',
      comparisonBaseline: null,
      verificationCases: [],
      tutorial: {
        version: 1,
        id: 'tutorial-1',
        title: 'Tutorial',
        group: 'Group',
        summary: 'Summary',
        projectId: 'demo',
        steps: [],
      },
      challenge: {
        version: 1,
        id: 'challenge-1',
        title: 'Challenge',
        group: 'Group',
        prompt: 'Repair it',
        projectId: 'demo',
        startingProject: { modules: [], connections: [] },
        targetProject: { modules: [], connections: [] },
        success: { kind: 'output-match-target' },
      },
    });

    const prepared = prepareImportedLabPack({
      pack,
      availableProjects: [{ id: 'shared-lab', name: 'Shared Lab' }],
      tutorialLibrary: [{ id: 'tutorial-1' }],
      challengeLibrary: [{ id: 'challenge-1' }],
    });

    expect(prepared.workspaceName).toBe('Shared Lab 2');
    expect(prepared.workspaceId).toBe('shared-lab-2');
    expect(prepared.tutorial?.tutorialId).toBe('tutorial-1-2');
    expect(prepared.challenge?.challengeId).toBe('challenge-1-2');
    expect(prepared.learningPanelTab).toBe('challenge');
    expect(prepared.document.ui.layoutDirection).toBe('vertical');
  });
});
