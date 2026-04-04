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
          wireColorMode: 'neutral',
          connectionLayout: {
            'a:out->b:in': {
              orthogonalBend: { axis: 'x', value: 120 },
              orthogonalLanePreference: 'negative',
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
      stageLabels: [
        {
          id: 'label-1',
          x: 84,
          y: 40,
          text: 'Round 1',
        },
      ],
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
      guideRails: [
        {
          id: 'rail-1',
          axis: 'vertical',
          position: 172,
          title: 'Round Rail',
        },
      ],
      showOverviewNavigator: true,
      showGrid: true,
      snapToGrid: true,
      snapToGuides: true,
      layoutDirection: 'vertical',
      routingMode: 'orthogonal',
      wireColorMode: 'high-contrast',
      connectionLayout: {
        'a:out->b:in': {
          orthogonalBend: { axis: 'x', value: 120 },
          orthogonalLanePreference: 'negative',
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
    expect(prepared.document.ui.wireColorMode).toBe('high-contrast');
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
    expect(prepared.document.ui.stageLabels).toEqual([
      {
        id: 'label-1',
        x: 84,
        y: 40,
        text: 'Round 1',
      },
    ]);
    expect(prepared.document.ui.guideRails).toEqual([
      {
        id: 'rail-1',
        axis: 'vertical',
        position: 172,
        title: 'Round Rail',
      },
    ]);
    expect(prepared.document.ui.showOverviewNavigator).toBe(true);
    expect(prepared.document.ui.showGrid).toBe(true);
    expect(prepared.document.ui.snapToGrid).toBe(true);
    expect(prepared.document.ui.snapToGuides).toBe(true);
    expect(prepared.document.ui.connectionLayout).toEqual({
      'a:out->b:in': {
        orthogonalBend: { axis: 'x', value: 120 },
        orthogonalLanePreference: 'negative',
      },
    });
  });
});
