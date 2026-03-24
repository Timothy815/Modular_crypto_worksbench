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

  it('does not remove built-in architecture entries from the library', () => {
    const initialState = createInitialUiState(demoProjects);
    const builtInEntry = initialState.compositeLibrary.find((entry) => entry.source === 'built-in');

    if (!builtInEntry) {
      throw new Error('Expected a built-in reusable entry.');
    }

    const nextState = uiReducer(initialState, {
      type: 'removeCompositeFromLibrary',
      compositeId: builtInEntry.id,
    });

    expect(nextState.compositeLibrary.some((entry) => entry.id === builtInEntry.id)).toBe(true);
  });

  it('does not open the editor for built-in architecture entries', () => {
    const initialState = createInitialUiState(demoProjects);
    const builtInComposite = initialState.compositeLibrary.find(
      (entry) => entry.source === 'built-in' && entry.definition.kind === 'composite',
    );

    if (!builtInComposite) {
      throw new Error('Expected a built-in composite entry.');
    }

    const nextState = uiReducer(initialState, {
      type: 'openCompositeEditor',
      entryId: builtInComposite.id,
    });

    expect(nextState.compositeEditor).toBeNull();
  });

  it('defaults each project to a matching starter challenge when one exists', () => {
    const initialState = createInitialUiState(demoProjects);

    expect(initialState.activeChallengeIdByProject['toy-compression-hash']).toBe(
      'find-hash-collision',
    );
    expect(initialState.activeChallengeIdByProject['toy-sponge-hash']).toBe(
      'find-sponge-collision',
    );
  });
});
