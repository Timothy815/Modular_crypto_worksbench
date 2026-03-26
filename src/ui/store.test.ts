import { describe, expect, it } from 'vitest';

import { demoProjects } from './demo-projects';
import { createInitialUiState, uiReducer } from './store';

describe('uiReducer', () => {
  it('renames a module instance and updates workspace-local references atomically', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const moduleId = project.modules[0]?.id;
    const connectedModuleId = project.connections.find(
      (connection) => connection.from.moduleId === moduleId,
    )?.to.moduleId;

    if (!moduleId || !connectedModuleId) {
      throw new Error('Expected a connected module in the sequential demo.');
    }

    const stateWithReferences = uiReducer(
      uiReducer(
        uiReducer(initialState, {
          type: 'selectModule',
          projectId,
          moduleId,
        }),
        {
          type: 'toggleProbe',
          projectId,
          moduleId,
        },
      ),
      {
        type: 'setParamDraft',
        projectId,
        moduleId,
        key: 'seed',
        rawValue: '1010101',
      },
    );

    const nextState = uiReducer(stateWithReferences, {
      type: 'renameModuleInstance',
      projectId,
      moduleId,
      nextModuleId: 'round_1-source',
    });

    expect(
      nextState.projectStates[projectId]?.modules.some((entry) => entry.id === 'round_1-source'),
    ).toBe(true);
    expect(nextState.projectStates[projectId]?.modules.some((entry) => entry.id === moduleId)).toBe(
      false,
    );
    expect(
      nextState.projectStates[projectId]?.connections.some(
        (connection) =>
          connection.from.moduleId === 'round_1-source' &&
          connection.to.moduleId === connectedModuleId,
      ),
    ).toBe(true);
    expect(nextState.layoutByProject[projectId]?.['round_1-source']).toEqual(
      initialState.layoutByProject[projectId]?.[moduleId],
    );
    expect(nextState.layoutByProject[projectId]?.[moduleId]).toBeUndefined();
    expect(nextState.selectedModuleIdByProject[projectId]).toBe('round_1-source');
    expect(nextState.selectedModuleIdsByProject[projectId]).toContain('round_1-source');
    expect(nextState.probedModuleIdsByProject[projectId]).toContain('round_1-source');
    expect(nextState.paramDrafts[`${projectId}:round_1-source:seed`]).toBe('1010101');
    expect(nextState.paramDrafts[`${projectId}:${moduleId}:seed`]).toBeUndefined();
  });

  it('rejects invalid or duplicate module instance IDs', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const firstModuleId = project.modules[0]?.id;
    const secondModuleId = project.modules[1]?.id;

    if (!firstModuleId || !secondModuleId) {
      throw new Error('Expected at least two modules in the sequential demo.');
    }

    const duplicateRenameState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: firstModuleId,
      nextModuleId: secondModuleId,
    });
    const invalidRenameState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: firstModuleId,
      nextModuleId: 'round 1 source',
    });

    expect(duplicateRenameState).toEqual(initialState);
    expect(invalidRenameState).toEqual(initialState);
  });

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

  it('moves an existing multi-selection together', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const firstModuleId = project.modules[0]?.id;
    const secondModuleId = project.modules[1]?.id;

    if (!firstModuleId || !secondModuleId) {
      throw new Error('Expected at least two modules in the sequential demo.');
    }

    const selectedState = uiReducer(
      uiReducer(initialState, {
        type: 'selectModule',
        projectId,
        moduleId: firstModuleId,
      }),
      {
        type: 'selectModule',
        projectId,
        moduleId: secondModuleId,
        additive: true,
      },
    );

    const nextState = uiReducer(selectedState, {
      type: 'moveModules',
      projectId,
      positions: {
        [firstModuleId]: { x: 320, y: 180 },
        [secondModuleId]: { x: 508, y: 180 },
      },
    });

    expect(nextState.layoutByProject[projectId]?.[firstModuleId]).toEqual({ x: 320, y: 180 });
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]).toEqual({ x: 508, y: 180 });
  });

  it('tidies layout into a clean grid while preserving all modules', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const scrambledState = uiReducer(initialState, {
      type: 'moveModules',
      projectId,
      positions: Object.fromEntries(
        project.modules.slice(0, 3).map((moduleInstance, index) => [
          moduleInstance.id,
          {
            x: 480 - index * 97,
            y: 260 + index * 53,
          },
        ]),
      ),
    });

    const tidiedState = uiReducer(scrambledState, {
      type: 'tidyLayout',
      projectId,
    });

    const tidiedPositions = project.modules.map(
      (moduleInstance) => tidiedState.layoutByProject[projectId]?.[moduleInstance.id],
    );

    expect(tidiedPositions.every(Boolean)).toBe(true);
    expect(new Set(tidiedPositions.map((position) => `${position?.x},${position?.y}`)).size).toBe(
      tidiedPositions.length,
    );
    expect(
      project.connections.every((connection) => {
        const from = tidiedState.layoutByProject[projectId]?.[connection.from.moduleId];
        const to = tidiedState.layoutByProject[projectId]?.[connection.to.moduleId];
        return Boolean(from && to && from.x < to.x);
      }),
    ).toBe(true);
    expect(tidiedState.layoutByProject[projectId]?.clock).toEqual({ x: 48, y: 72 });
    expect(tidiedState.layoutByProject[projectId]?.lfsr?.x).toBe(292);
    expect(tidiedState.layoutByProject[projectId]?.decode?.x).toBe(536);
    expect(tidiedState.layoutByProject[projectId]?.output?.x).toBe(780);
  });

  it('creates a blank personal workspace in build mode', () => {
    const initialState = createInitialUiState(demoProjects);

    const nextState = uiReducer(initialState, {
      type: 'createBlankWorkspace',
      workspaceId: 'my-scratchpad',
      name: 'My Scratchpad',
      summary: 'A blank personal workspace for building from scratch.',
      pipeline: 'Blank canvas',
    });

    expect(nextState.activeProjectId).toBe('my-scratchpad');
    expect(nextState.userWorkspaceLibrary).toEqual([
      {
        id: 'my-scratchpad',
        name: 'My Scratchpad',
        group: 'My Workspaces',
        summary: 'A blank personal workspace for building from scratch.',
        pipeline: 'Blank canvas',
        defaultTickedMode: false,
      },
    ]);
    expect(nextState.projectStates['my-scratchpad']).toEqual({ modules: [], connections: [] });
    expect(nextState.workspaceModeByProject['my-scratchpad']).toBe('build');
  });

  it('saves the current graph into a personal workspace entry', () => {
    const initialState = createInitialUiState(demoProjects);

    const nextState = uiReducer(initialState, {
      type: 'saveWorkspaceAs',
      sourceProjectId: 'sequential',
      workspaceId: 'sequential-copy',
      name: 'Sequential Copy',
      summary: 'A personal copy of the sequential graph.',
      pipeline: 'Clock -> LFSR -> BitsToSymbol -> Output',
      defaultTickedMode: true,
    });

    expect(nextState.activeProjectId).toBe('sequential-copy');
    expect(nextState.userWorkspaceLibrary[0]?.id).toBe('sequential-copy');
    expect(nextState.projectStates['sequential-copy']).toEqual(
      initialState.projectStates['sequential'],
    );
    expect(nextState.layoutByProject['sequential-copy']).toEqual(
      initialState.layoutByProject['sequential'],
    );
    expect(nextState.activeChallengeIdByProject['sequential-copy']).toBeNull();
  });

  it('removes a personal workspace and falls back to a demo project', () => {
    const initialState = createInitialUiState(demoProjects);
    const stateWithWorkspace = uiReducer(initialState, {
      type: 'createBlankWorkspace',
      workspaceId: 'my-scratchpad',
      name: 'My Scratchpad',
      summary: 'A blank personal workspace for building from scratch.',
      pipeline: 'Blank canvas',
    });

    const nextState = uiReducer(stateWithWorkspace, {
      type: 'removeWorkspace',
      workspaceId: 'my-scratchpad',
      fallbackProjectId: 'baudot-bridge',
    });

    expect(nextState.activeProjectId).toBe('baudot-bridge');
    expect(nextState.userWorkspaceLibrary).toEqual([]);
    expect(nextState.projectStates['my-scratchpad']).toBeUndefined();
    expect(nextState.layoutByProject['my-scratchpad']).toBeUndefined();
    expect(nextState.workspaceModeByProject['my-scratchpad']).toBeUndefined();
  });
});
