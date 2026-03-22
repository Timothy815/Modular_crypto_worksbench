import { describe, expect, it } from 'vitest';

import { demoProjects } from './demo-projects';
import { createInitialUiState, uiReducer } from './store';

describe('uiReducer', () => {
  it('resets tick position and playback when loading a document', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const sequentialProject = demoProjects.find((project) => project.id === projectId);

    if (!sequentialProject) {
      throw new Error('Expected sequential demo project.');
    }

    const stateWithTickPlayback = uiReducer(
      uiReducer(initialState, {
        type: 'setCurrentTick',
        projectId,
        tick: 4,
      }),
      {
        type: 'setTickPlaybackActive',
        projectId,
        active: true,
      },
    );

    const nextState = uiReducer(stateWithTickPlayback, {
      type: 'loadDocument',
      projectId,
      document: {
        version: 1,
        project: sequentialProject.project,
        ui: {
          layout: sequentialProject.layout,
          annotations: [],
        },
      },
    });

    expect(nextState.currentTickByProject[projectId]).toBe(0);
    expect(nextState.isTickPlaybackActiveByProject[projectId]).toBe(false);
  });
});
