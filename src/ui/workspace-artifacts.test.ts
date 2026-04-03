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
        ui: {
          layout: {},
          annotations: [],
          layoutDirection: 'vertical',
          routingMode: 'orthogonal',
          connectionLayout: {
            'a:out->b:in': {
              orthogonalBend: { axis: 'x', value: 120 },
            },
          },
        },
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
      groupBoxes: [
        {
          id: 'group-box-1',
          x: 40,
          y: 60,
          width: 240,
          height: 160,
          title: 'Round 1',
          variant: 'stage',
        },
      ],
      showOverviewNavigator: true,
      layoutDirection: 'vertical',
      routingMode: 'orthogonal',
      connectionLayout: {
        'a:out->b:in': {
          orthogonalBend: { axis: 'x', value: 120 },
        },
      },
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
    expect(prepared.document.ui.routingMode).toBe('orthogonal');
    expect(prepared.document.ui.groupBoxes).toEqual([
      {
        id: 'group-box-1',
        x: 40,
        y: 60,
        width: 240,
        height: 160,
        title: 'Round 1',
        variant: 'stage',
      },
    ]);
    expect(prepared.document.ui.showOverviewNavigator).toBe(true);
    expect(prepared.document.ui.connectionLayout).toEqual({
      'a:out->b:in': {
        orthogonalBend: { axis: 'x', value: 120 },
      },
    });
  });
});
