import { describe, expect, it } from 'vitest';

import {
  applyLearningPanelTabSelection,
  buildChallengeSelectionPlan,
  buildTutorialSelectionPlan,
  createVerificationCaseForProject,
} from './learning-orchestration';

describe('learning-orchestration', () => {
  it('builds tutorial and challenge selection plans that preserve guide-mode intent', () => {
    const tutorialPlan = buildTutorialSelectionPlan({
      activeProjectId: 'project-a',
      workspaceMode: 'cryptanalysis',
      projectId: 'project-b',
      tutorialId: 'tutorial-1',
      tutorials: [
        {
          version: 1,
          id: 'tutorial-1',
          title: 'Tutorial',
          group: 'Group',
          summary: 'Summary',
          projectId: 'project-b',
          steps: [{ id: 'step-1', title: 'Step', body: 'Body', targetStepIndex: 4 }],
        },
      ],
    });
    const challengePlan = buildChallengeSelectionPlan({
      activeProjectId: 'project-a',
      workspaceMode: 'cryptanalysis',
      challengeId: 'challenge-1',
      challenges: [
        {
          version: 1,
          id: 'challenge-1',
          title: 'Challenge',
          group: 'Group',
          prompt: 'Fix it',
          projectId: 'project-a',
          startingProject: { modules: [], connections: [] },
          targetProject: { modules: [], connections: [] },
          success: { kind: 'output-match-target' },
        },
      ],
    });

    expect(tutorialPlan.shouldSwitchProject).toBe(true);
    expect(tutorialPlan.targetStepIndex).toBe(4);
    expect(challengePlan.needsGuideMode).toBe(true);
    expect(challengePlan.projectId).toBe('project-a');
  });

  it('adds a verification case when the captured baseline can run it', () => {
    const result = createVerificationCaseForProject({
      comparisonBaseline: {
        capturedAt: '2026-04-02T00:00:00.000Z',
        project: {
          modules: [
            {
              id: 'input-1',
              defId: 'BitInput',
              params: { value: '1010' },
            },
            {
              id: 'out-1',
              defId: 'BitOutput',
              params: {},
            },
          ],
          connections: [
            {
              from: { moduleId: 'input-1', port: 'out' },
              to: { moduleId: 'out-1', port: 'in' },
            },
          ],
        },
      },
      verificationSourceOptions: [
        {
          moduleId: 'input-1',
          defId: 'BitInput',
          label: 'input-1 (Bit Input)',
        },
      ],
      registry: {
        BitInput: {
          id: 'BitInput',
          name: 'Bit Input',
          inputs: [],
          outputs: [{ name: 'out', type: 'bits' }],
          paramSchema: {
            value: { key: 'value', label: 'Value', kind: 'string', defaultValue: '' },
          },
          evaluate: () => ({ out: { type: 'bits', value: [1, 0, 1, 0] } }),
        },
        BitOutput: {
          id: 'BitOutput',
          name: 'Bit Output',
          inputs: [{ name: 'in', type: 'bits' }],
          outputs: [],
          paramSchema: {},
          evaluate: () => ({}),
        },
      },
      sourceModuleId: 'input-1',
      inputValue: '1111',
      projectId: 'project-a',
      casesByProject: { 'project-a': [] },
      isTickedMode: false,
    });

    expect(result.error).toBeNull();
    expect(result.nextCasesByProject['project-a']).toHaveLength(1);
  });

  it('syncs workspace mode when selecting the cryptanalysis learning tab', () => {
    const dispatched: unknown[] = [];
    let selectedTab: string | null = null;

    applyLearningPanelTabSelection({
      tab: 'cryptanalysis',
      activeProjectId: 'project-a',
      workspaceMode: 'guide',
      dispatch: (action) => {
        dispatched.push(action);
      },
      setLearningPanelTab: (value) => {
        selectedTab = typeof value === 'function' ? value('quickstart') : value;
      },
    });

    expect(selectedTab).toBe('cryptanalysis');
    expect(dispatched).toEqual([
      {
        type: 'setWorkspaceMode',
        projectId: 'project-a',
        mode: 'cryptanalysis',
      },
    ]);
  });

  it('returns to guide mode when leaving cryptanalysis for a peer learning tab', () => {
    const dispatched: unknown[] = [];
    let selectedTab: string | null = null;

    applyLearningPanelTabSelection({
      tab: 'tutorial',
      activeProjectId: 'project-a',
      workspaceMode: 'cryptanalysis',
      dispatch: (action) => {
        dispatched.push(action);
      },
      setLearningPanelTab: (value) => {
        selectedTab = typeof value === 'function' ? value('quickstart') : value;
      },
    });

    expect(selectedTab).toBe('tutorial');
    expect(dispatched).toEqual([
      {
        type: 'setWorkspaceMode',
        projectId: 'project-a',
        mode: 'guide',
      },
    ]);
  });
});
