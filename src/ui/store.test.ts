import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import { CANVAS_NODE_HEIGHT, CANVAS_NODE_WIDTH } from './canvas-selection';
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

  it('rotates a module clockwise without changing engine state', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const nextState = uiReducer(initialState, {
      type: 'rotateModuleClockwise',
      projectId,
      moduleId: 'clock',
    });

    expect(nextState.layoutByProject[projectId]?.clock).toMatchObject({
      orientation: 'south',
    });
    expect(nextState.projectStates[projectId]).toEqual(initialState.projectStates[projectId]);
  });

  it('reorders module input and output ports as workspace-local metadata', () => {
    const initialState = createInitialUiState(demoProjects);

    const withInputOrder = uiReducer(initialState, {
      type: 'moveModulePortOrder',
      projectId: 'lorenz-foundation',
      moduleId: 'xor',
      direction: 'input',
      portName: 'b',
      delta: -1,
    });

    const withOutputOrder = uiReducer(withInputOrder, {
      type: 'moveModulePortOrder',
      projectId: 'rotor-return-path',
      moduleId: 'rotor-fwd',
      direction: 'output',
      portName: 'turnover',
      delta: -1,
    });

    expect(withInputOrder.layoutByProject['lorenz-foundation']?.xor?.inputOrder).toEqual(['b', 'a']);
    expect(withOutputOrder.layoutByProject['rotor-return-path']?.['rotor-fwd']?.outputOrder).toEqual([
      'turnover',
      'out',
    ]);
    expect(withOutputOrder.projectStates['lorenz-foundation']).toEqual(
      initialState.projectStates['lorenz-foundation'],
    );
    expect(withOutputOrder.projectStates['rotor-return-path']).toEqual(
      initialState.projectStates['rotor-return-path'],
    );
  });

  it('reorders composite module ports using the effective registry', () => {
    const initialState = createInitialUiState(demoProjects);

    const nextState = uiReducer(initialState, {
      type: 'moveModulePortOrder',
      projectId: 'advanced-rotor-stepping',
      moduleId: 'middle-step-control',
      direction: 'input',
      portName: 'turnoverB',
      delta: -1,
    });

    expect(nextState.layoutByProject['advanced-rotor-stepping']?.['middle-step-control']?.inputOrder).toEqual([
      'pulse',
      'turnoverB',
      'turnoverA',
    ]);
  });

  it('stores and clears per-instance port layout presets as workspace-local metadata', () => {
    const initialState = createInitialUiState(demoProjects);

    const withPrimitivePreset = uiReducer(initialState, {
      type: 'setModulePortLayoutPreset',
      projectId: 'lorenz-foundation',
      moduleId: 'xor',
      preset: 'vertical',
    });

    const withCompositePreset = uiReducer(withPrimitivePreset, {
      type: 'setModulePortLayoutPreset',
      projectId: 'advanced-rotor-stepping',
      moduleId: 'middle-step-control',
      preset: 'horizontal',
    });

    const clearedPrimitivePreset = uiReducer(withCompositePreset, {
      type: 'setModulePortLayoutPreset',
      projectId: 'lorenz-foundation',
      moduleId: 'xor',
      preset: null,
    });

    expect(withPrimitivePreset.layoutByProject['lorenz-foundation']?.xor?.portLayoutPreset).toBe(
      'vertical',
    );
    expect(
      withCompositePreset.layoutByProject['advanced-rotor-stepping']?.['middle-step-control']
        ?.portLayoutPreset,
    ).toBe('horizontal');
    expect(clearedPrimitivePreset.layoutByProject['lorenz-foundation']?.xor?.portLayoutPreset).toBe(
      undefined,
    );
  });

  it('stores and clears per-instance port side overrides as workspace-local metadata', () => {
    const initialState = createInitialUiState(demoProjects);

    const withInputSide = uiReducer(initialState, {
      type: 'setModulePortSide',
      projectId: 'advanced-rotor-stepping',
      moduleId: 'middle-step-control',
      direction: 'input',
      portName: 'turnoverA',
      side: 'top',
    });

    const withOutputSide = uiReducer(withInputSide, {
      type: 'setModulePortSide',
      projectId: 'rotor-return-path',
      moduleId: 'rotor-fwd',
      direction: 'output',
      portName: 'turnover',
      side: 'left',
    });

    const clearedInputSide = uiReducer(withOutputSide, {
      type: 'setModulePortSide',
      projectId: 'advanced-rotor-stepping',
      moduleId: 'middle-step-control',
      direction: 'input',
      portName: 'turnoverA',
      side: null,
    });

    expect(
      withInputSide.layoutByProject['advanced-rotor-stepping']?.['middle-step-control']?.inputPortSides
        ?.turnoverA,
    ).toBe('top');
    expect(
      withOutputSide.layoutByProject['rotor-return-path']?.['rotor-fwd']?.outputPortSides?.turnover,
    ).toBe('left');
    expect(
      clearedInputSide.layoutByProject['advanced-rotor-stepping']?.['middle-step-control']
        ?.inputPortSides?.turnoverA,
    ).toBeUndefined();
  });

  it('creates a stage group box around the selected cluster bounds', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const clockPosition = initialState.layoutByProject[projectId]?.clock;
    const lfsrPosition = initialState.layoutByProject[projectId]?.lfsr;
    if (!clockPosition || !lfsrPosition) {
      throw new Error('Expected clock and lfsr positions in the sequential demo.');
    }

    const selectedState = uiReducer(
      uiReducer(initialState, {
        type: 'selectModule',
        projectId,
        moduleId: 'clock',
      }),
      {
        type: 'selectModule',
        projectId,
        moduleId: 'lfsr',
        additive: true,
      },
    );

    const nextState = uiReducer(selectedState, {
      type: 'addGroupBoxFromSelection',
      projectId,
    });

    expect(nextState.groupBoxesByProject[projectId]).toHaveLength(1);
    expect(nextState.groupBoxesByProject[projectId]?.[0]).toEqual({
      id: 'group-1',
      x: Math.max(16, Math.min(clockPosition.x, lfsrPosition.x) - 36),
      y: Math.max(16, Math.min(clockPosition.y, lfsrPosition.y) - 36),
      width:
        Math.max(clockPosition.x, lfsrPosition.x) -
        Math.min(clockPosition.x, lfsrPosition.x) +
        CANVAS_NODE_WIDTH +
        72,
      height:
        Math.max(clockPosition.y, lfsrPosition.y) -
        Math.min(clockPosition.y, lfsrPosition.y) +
        CANVAS_NODE_HEIGHT +
        72,
      title: 'Selected Group',
      variant: 'stage',
    });

    const movedState = uiReducer(nextState, {
      type: 'moveGroupBox',
      projectId,
      groupBoxId: 'group-1',
      x: 120,
      y: 144,
    });
    const resizedState = uiReducer(movedState, {
      type: 'resizeGroupBox',
      projectId,
      groupBoxId: 'group-1',
      width: 480,
      height: 220,
    });

    expect(resizedState.groupBoxesByProject[projectId]?.[0]).toMatchObject({
      x: 120,
      y: 144,
      width: 480,
      height: 220,
    });
  });

  it('round-trips group boxes through workspace history snapshots', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const stateWithBox = uiReducer(initialState, {
      type: 'addGroupBox',
      projectId,
    });

    const savedVersionState = uiReducer(stateWithBox, {
      type: 'saveWorkspaceVersion',
      projectId,
      versionId: 'group-boxes-v1',
      name: 'Grouped',
      savedAt: '2026-04-03T22:00:00.000Z',
    });

    expect(savedVersionState.workspaceVersionsByProject[projectId]?.[0]?.document.ui.groupBoxes).toEqual([
      {
        id: 'group-1',
        x: 88,
        y: 88,
        width: 280,
        height: 180,
        title: 'Group',
        variant: 'stage',
      },
    ]);
  });

  it('adds, moves, renames, and removes guide rails', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const withVerticalRail = uiReducer(initialState, {
      type: 'addGuideRail',
      projectId,
      axis: 'vertical',
    });
    const movedRail = uiReducer(withVerticalRail, {
      type: 'moveGuideRail',
      projectId,
      guideRailId: 'rail-1',
      position: 264,
    });
    const renamedRail = uiReducer(movedRail, {
      type: 'updateGuideRailTitle',
      projectId,
      guideRailId: 'rail-1',
      title: 'State Lane',
    });
    const removedRail = uiReducer(renamedRail, {
      type: 'removeGuideRail',
      projectId,
      guideRailId: 'rail-1',
    });

    expect(withVerticalRail.guideRailsByProject[projectId]).toEqual([
      {
        id: 'rail-1',
        axis: 'vertical',
        position: 180,
        title: 'Vertical Rail',
      },
    ]);
    expect(renamedRail.guideRailsByProject[projectId]).toEqual([
      {
        id: 'rail-1',
        axis: 'vertical',
        position: 264,
        title: 'State Lane',
      },
    ]);
    expect(removedRail.guideRailsByProject[projectId]).toEqual([]);
  });

  it('adds, moves, renames, and removes stage labels', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const withLabel = uiReducer(initialState, {
      type: 'addStageLabel',
      projectId,
    });
    const movedLabel = uiReducer(withLabel, {
      type: 'moveStageLabel',
      projectId,
      stageLabelId: 'label-1',
      x: 212,
      y: 64,
    });
    const renamedLabel = uiReducer(movedLabel, {
      type: 'updateStageLabelText',
      projectId,
      stageLabelId: 'label-1',
      text: 'Round 1',
    });
    const removedLabel = uiReducer(renamedLabel, {
      type: 'removeStageLabel',
      projectId,
      stageLabelId: 'label-1',
    });

    expect(withLabel.stageLabelsByProject[projectId]).toEqual([
      { id: 'label-1', x: 96, y: 48, text: 'Stage Label' },
    ]);
    expect(renamedLabel.stageLabelsByProject[projectId]).toEqual([
      { id: 'label-1', x: 212, y: 64, text: 'Round 1' },
    ]);
    expect(removedLabel.stageLabelsByProject[projectId]).toEqual([]);
  });

  it('toggles the overview navigator per workspace', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const nextState = uiReducer(initialState, {
      type: 'setOverviewNavigatorVisible',
      projectId,
      visible: false,
    });

    expect(nextState.showOverviewNavigatorByProject[projectId]).toBe(false);
    expect(initialState.showOverviewNavigatorByProject[projectId]).toBe(false);
  });

  it('toggles grid visibility, snap-to-grid, and snap-to-guides per workspace', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const withGrid = uiReducer(initialState, {
      type: 'setGridVisible',
      projectId,
      visible: true,
    });
    const withSnap = uiReducer(withGrid, {
      type: 'setSnapToGrid',
      projectId,
      enabled: true,
    });
    const withGuideSnap = uiReducer(withSnap, {
      type: 'setSnapToGuides',
      projectId,
      enabled: true,
    });

    expect(withGrid.showGridByProject[projectId]).toBe(true);
    expect(withSnap.snapToGridByProject[projectId]).toBe(true);
    expect(withGuideSnap.snapToGuidesByProject[projectId]).toBe(true);
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

  it('renames linkedRotorId references when a forward rotor is renamed', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'rotor-return-path';

    const nextState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: 'rotor-fwd',
      nextModuleId: 'rotor-alpha',
    });

    const reverseRotor = nextState.projectStates[projectId]?.modules.find(
      (moduleInstance) => moduleInstance.id === 'rotor-rev',
    );

    expect(reverseRotor?.params.linkedRotorId).toBe('rotor-alpha');
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

  it('duplicates the selected cluster as an independent local fragment and selects it', () => {
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
      type: 'duplicateSelectedCluster',
      projectId,
    });

    const nextProject = nextState.projectStates[projectId];
    const duplicatedIds = nextState.selectedModuleIdsByProject[projectId] ?? [];

    expect(duplicatedIds.length).toBe(2);
    expect(duplicatedIds.every((moduleId) => moduleId !== firstModuleId && moduleId !== secondModuleId)).toBe(
      true,
    );
    expect(nextState.selectedModuleIdByProject[projectId]).toBe(duplicatedIds[0]);
    expect(nextProject.modules.some((moduleInstance) => moduleInstance.id === firstModuleId)).toBe(true);
    expect(nextProject.modules.some((moduleInstance) => moduleInstance.id === secondModuleId)).toBe(true);

    const sourceConnection = project.connections.find(
      (connection) =>
        connection.from.moduleId === firstModuleId && connection.to.moduleId === secondModuleId,
    );
    if (!sourceConnection) {
      throw new Error('Expected the selected modules to have an internal connection.');
    }

    expect(
      nextProject.connections.some(
        (connection) =>
          connection.from.moduleId === duplicatedIds[0] &&
          connection.to.moduleId === duplicatedIds[1] &&
          connection.from.port === sourceConnection.from.port &&
          connection.to.port === sourceConnection.to.port,
      ),
    ).toBe(true);

    const sourceFirstPosition = initialState.layoutByProject[projectId]?.[firstModuleId];
    const sourceSecondPosition = initialState.layoutByProject[projectId]?.[secondModuleId];
    const duplicatedFirstPosition = nextState.layoutByProject[projectId]?.[duplicatedIds[0]];
    const duplicatedSecondPosition = nextState.layoutByProject[projectId]?.[duplicatedIds[1]];

    expect(Boolean(sourceFirstPosition && sourceSecondPosition && duplicatedFirstPosition && duplicatedSecondPosition)).toBe(true);
    expect(duplicatedFirstPosition?.x).toBeGreaterThan(sourceSecondPosition?.x ?? 0);
    expect(duplicatedFirstPosition?.y).toBe(sourceFirstPosition?.y);
    expect(duplicatedSecondPosition?.y).toBe(sourceSecondPosition?.y);
    expect(nextState.currentTickByProject[projectId]).toBe(0);
    expect(nextState.isTickPlaybackActiveByProject[projectId]).toBe(false);
  });

  it('selects multiple modules directly while preserving additive behavior', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId, thirdModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const selectedState = uiReducer(initialState, {
      type: 'selectModules',
      projectId,
      moduleIds: [firstModuleId, secondModuleId],
    });
    const additiveState = uiReducer(selectedState, {
      type: 'selectModules',
      projectId,
      moduleIds: [thirdModuleId],
      additive: true,
    });

    expect(selectedState.selectedModuleIdsByProject[projectId]).toEqual([
      firstModuleId,
      secondModuleId,
    ]);
    expect(additiveState.selectedModuleIdsByProject[projectId]).toEqual([
      firstModuleId,
      secondModuleId,
      thirdModuleId,
    ]);
    expect(additiveState.selectedModuleIdByProject[projectId]).toBe(thirdModuleId);
  });

  it('arranges the selected modules into a stage row anchored on the lead selection', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId, thirdModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const selectedState = uiReducer(
      uiReducer(
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
      ),
      {
        type: 'selectModule',
        projectId,
        moduleId: thirdModuleId,
        additive: true,
      },
    );

    const anchorPosition = selectedState.layoutByProject[projectId]?.[thirdModuleId];
    if (!anchorPosition) {
      throw new Error('Expected the lead selection to have a layout position.');
    }

    const nextState = uiReducer(selectedState, {
      type: 'arrangeSelectedModules',
      projectId,
      mode: 'stage-row',
    });

    expect(nextState.layoutByProject[projectId]?.[thirdModuleId]).toEqual(anchorPosition);
    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.y).toBe(anchorPosition.y);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.y).toBe(anchorPosition.y);
    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.x).toBe(anchorPosition.x - 488);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.x).toBe(anchorPosition.x - 244);
  });

  it('stacks the selected modules into a stage column anchored on the lead selection', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId, thirdModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const selectedState = uiReducer(
      uiReducer(
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
      ),
      {
        type: 'selectModule',
        projectId,
        moduleId: thirdModuleId,
        additive: true,
      },
    );

    const anchorPosition = selectedState.layoutByProject[projectId]?.[thirdModuleId];
    if (!anchorPosition) {
      throw new Error('Expected the lead selection to have a layout position.');
    }

    const nextState = uiReducer(selectedState, {
      type: 'arrangeSelectedModules',
      projectId,
      mode: 'stage-column',
    });

    expect(nextState.layoutByProject[projectId]?.[thirdModuleId]).toEqual(anchorPosition);
    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.x).toBe(anchorPosition.x);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.x).toBe(anchorPosition.x);
    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.y).toBe(anchorPosition.y - 296);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.y).toBe(anchorPosition.y - 148);
  });

  it('aligns the selected modules to the left edge without changing their y positions', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId, thirdModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const movedState = uiReducer(initialState, {
      type: 'moveModules',
      projectId,
      positions: {
        [firstModuleId]: { x: 420, y: 40 },
        [secondModuleId]: { x: 260, y: 160 },
        [thirdModuleId]: { x: 640, y: 280 },
      },
    });

    const selectedState = uiReducer(movedState, {
      type: 'selectModules',
      projectId,
      moduleIds: [firstModuleId, secondModuleId, thirdModuleId],
    });

    const nextState = uiReducer(selectedState, {
      type: 'arrangeSelectedModules',
      projectId,
      mode: 'align-left',
    });

    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.x).toBe(260);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.x).toBe(260);
    expect(nextState.layoutByProject[projectId]?.[thirdModuleId]?.x).toBe(260);
    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.y).toBe(40);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.y).toBe(160);
    expect(nextState.layoutByProject[projectId]?.[thirdModuleId]?.y).toBe(280);
    expect(nextState.selectedModuleIdsByProject[projectId]).toEqual([
      firstModuleId,
      secondModuleId,
      thirdModuleId,
    ]);
  });

  it('distributes the selected modules horizontally while keeping the outer modules fixed', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId, thirdModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const movedState = uiReducer(initialState, {
      type: 'moveModules',
      projectId,
      positions: {
        [firstModuleId]: { x: 80, y: 40 },
        [secondModuleId]: { x: 180, y: 160 },
        [thirdModuleId]: { x: 680, y: 280 },
      },
    });

    const selectedState = uiReducer(
      uiReducer(
        uiReducer(movedState, {
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
      ),
      {
        type: 'selectModule',
        projectId,
        moduleId: thirdModuleId,
        additive: true,
      },
    );

    const nextState = uiReducer(selectedState, {
      type: 'arrangeSelectedModules',
      projectId,
      mode: 'distribute-horizontal',
    });

    expect(nextState.layoutByProject[projectId]?.[firstModuleId]?.x).toBe(80);
    expect(nextState.layoutByProject[projectId]?.[thirdModuleId]?.x).toBe(680);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.x).toBe(380);
    expect(nextState.layoutByProject[projectId]?.[secondModuleId]?.y).toBe(160);
  });

  it('undos selected-cluster alignment in one workspace history step', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const [firstModuleId, secondModuleId] =
      initialState.projectStates[projectId].modules.map((moduleInstance) => moduleInstance.id);

    if (!firstModuleId || !secondModuleId) {
      throw new Error('Expected at least two modules in the sequential demo.');
    }

    const selectedState = uiReducer(initialState, {
      type: 'selectModules',
      projectId,
      moduleIds: [firstModuleId, secondModuleId],
    });

    const alignedState = uiReducer(selectedState, {
      type: 'arrangeSelectedModules',
      projectId,
      mode: 'align-top',
    });
    const undoneState = uiReducer(alignedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });

    expect(undoneState.layoutByProject[projectId]).toEqual(selectedState.layoutByProject[projectId]);
  });

  it('deletes the selected cluster and cleans related workspace state', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const firstModuleId = project.modules[0]?.id;
    const secondModuleId = project.modules[1]?.id;

    if (!firstModuleId || !secondModuleId) {
      throw new Error('Expected at least two modules in the sequential demo.');
    }

    const preparedState = uiReducer(
      uiReducer(
        uiReducer(
          uiReducer(initialState, {
            type: 'selectModules',
            projectId,
            moduleIds: [firstModuleId, secondModuleId],
          }),
          {
            type: 'toggleProbe',
            projectId,
            moduleId: firstModuleId,
          },
        ),
        {
          type: 'setParamDraft',
          projectId,
          moduleId: firstModuleId,
          key: 'seed',
          rawValue: '1010',
        },
      ),
      {
        type: 'setTickPlaybackActive',
        projectId,
        active: true,
      },
    );

    const nextState = uiReducer(preparedState, {
      type: 'deleteSelectedCluster',
      projectId,
    });

    expect(
      nextState.projectStates[projectId].modules.some(
        (moduleInstance) => moduleInstance.id === firstModuleId || moduleInstance.id === secondModuleId,
      ),
    ).toBe(false);
    expect(
      nextState.projectStates[projectId].connections.some(
        (connection) =>
          connection.from.moduleId === firstModuleId ||
          connection.to.moduleId === firstModuleId ||
          connection.from.moduleId === secondModuleId ||
          connection.to.moduleId === secondModuleId,
      ),
    ).toBe(false);
    expect(nextState.probedModuleIdsByProject[projectId]).not.toContain(firstModuleId);
    expect(nextState.paramDrafts[`${projectId}:${firstModuleId}:seed`]).toBeUndefined();
    expect(nextState.isTickPlaybackActiveByProject[projectId]).toBe(false);
    expect(nextState.currentTickByProject[projectId]).toBe(0);
  });

  it('replaces a connection atomically and restores it in one undo step', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'keystream';
    const project = initialState.projectStates[projectId];
    const firstModuleId = 'plain';
    const secondModuleId = 'xor';
    const thirdModuleId = 'clock';

    if (!firstModuleId || !secondModuleId || !thirdModuleId) {
      throw new Error('Expected at least three modules in the sequential demo.');
    }

    const incomingIndex = project.connections.findIndex(
      (connection) =>
        connection.to.moduleId === secondModuleId && connection.to.port === 'a',
    );

    if (incomingIndex < 0) {
      throw new Error('Expected a connection feeding the second module.');
    }

    const replacedState = uiReducer(initialState, {
      type: 'replaceConnection',
      projectId,
      removeConnectionIndices: [incomingIndex],
      fromModuleId: thirdModuleId,
      fromPort: 'pulse',
      toModuleId: secondModuleId,
      toPort: 'a',
    });

    expect(
      replacedState.projectStates[projectId]?.connections.some(
        (connection) =>
          connection.from.moduleId === thirdModuleId &&
          connection.from.port === 'pulse' &&
          connection.to.moduleId === secondModuleId &&
          connection.to.port === 'a',
      ),
    ).toBe(true);
    expect(
      replacedState.projectStates[projectId]?.connections.some(
        (connection) =>
          connection.from.moduleId === firstModuleId &&
          connection.to.moduleId === secondModuleId,
      ),
    ).toBe(false);

    const undoneState = uiReducer(replacedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });

    expect(undoneState.projectStates[projectId]).toEqual(initialState.projectStates[projectId]);
  });

  it('applies copied params only to same-definition selected targets and clears their drafts', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const lfsrDef = V1_REGISTRY.LFSR;
    if (!lfsrDef) {
      throw new Error('Expected LFSR definition.');
    }

    const seededState = uiReducer(
      uiReducer(initialState, {
        type: 'loadDocument',
        projectId,
        document: {
          version: 1,
          project: {
            modules: [
              {
                id: 'lfsr-a',
                defId: 'LFSR',
                params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 5 },
              },
              {
                id: 'lfsr-b',
                defId: 'LFSR',
                params: { seed: [0, 0, 0, 0, 1], taps: '1,3', outputLength: 3 },
              },
              {
                id: 'sink',
                defId: 'BitOutput',
                params: {},
              },
            ],
            connections: [
              { from: { moduleId: 'lfsr-a', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
            ],
          },
          ui: {
            layout: {
              'lfsr-a': { x: 40, y: 40 },
              'lfsr-b': { x: 260, y: 40 },
              sink: { x: 480, y: 40 },
            },
            annotations: [],
          },
        },
      }),
      {
        type: 'setParamDraft',
        projectId,
        moduleId: 'lfsr-b',
        key: 'taps',
        rawValue: 'stale-draft',
      },
    );

    const nextState = uiReducer(seededState, {
      type: 'applyCopiedParams',
      projectId,
      sourceModuleId: 'lfsr-a',
      sourceDefId: lfsrDef.id,
      targetModuleIds: ['lfsr-b', 'sink'],
      params: {
        seed: [1, 0, 1, 1, 0],
        taps: '0,2',
        outputLength: 5,
      },
      paramKeys: ['seed', 'taps', 'outputLength'],
    });

    const targetModule = nextState.projectStates[projectId]?.modules.find(
      (moduleInstance) => moduleInstance.id === 'lfsr-b',
    );
    const sinkModule = nextState.projectStates[projectId]?.modules.find(
      (moduleInstance) => moduleInstance.id === 'sink',
    );

    expect(targetModule?.params.seed).toEqual([1, 0, 1, 1, 0]);
    expect(targetModule?.params.taps).toBe('0,2');
    expect(targetModule?.params.outputLength).toBe(5);
    expect(sinkModule?.params).toEqual({});
    expect(nextState.paramDrafts[`${projectId}:lfsr-b:taps`]).toBeUndefined();
  });

  it('undos copied param application in one history step', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const loadedState = uiReducer(initialState, {
      type: 'loadDocument',
      projectId,
      document: {
        version: 1,
        project: {
          modules: [
            {
              id: 'lfsr-a',
              defId: 'LFSR',
              params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 5 },
            },
            {
              id: 'lfsr-b',
              defId: 'LFSR',
              params: { seed: [0, 0, 0, 0, 1], taps: '1,3', outputLength: 3 },
            },
          ],
          connections: [],
        },
        ui: {
          layout: {
            'lfsr-a': { x: 40, y: 40 },
            'lfsr-b': { x: 260, y: 40 },
          },
          annotations: [],
        },
      },
    });

    const appliedState = uiReducer(loadedState, {
      type: 'applyCopiedParams',
      projectId,
      sourceModuleId: 'lfsr-a',
      sourceDefId: 'LFSR',
      targetModuleIds: ['lfsr-b'],
      params: {
        seed: [1, 0, 1, 1, 0],
        taps: '0,2',
        outputLength: 5,
      },
      paramKeys: ['seed', 'taps', 'outputLength'],
    });

    const undoneState = uiReducer(appliedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });

    expect(undoneState.projectStates[projectId]).toEqual(loadedState.projectStates[projectId]);
  });

  it('undoes and redoes recent workspace authoring actions', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const firstModuleId = initialState.projectStates[projectId].modules[0]?.id;

    if (!firstModuleId) {
      throw new Error('Expected a module in the sequential demo.');
    }

    const renamedState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: firstModuleId,
      nextModuleId: 'history-source',
    });
    const undoneState = uiReducer(renamedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });
    const redoneState = uiReducer(undoneState, {
      type: 'redoWorkspaceHistory',
      projectId,
    });

    expect(
      renamedState.projectStates[projectId].modules.some(
        (moduleInstance) => moduleInstance.id === 'history-source',
      ),
    ).toBe(true);
    expect(
      undoneState.projectStates[projectId].modules.some(
        (moduleInstance) => moduleInstance.id === firstModuleId,
      ),
    ).toBe(true);
    expect(
      undoneState.projectStates[projectId].modules.some(
        (moduleInstance) => moduleInstance.id === 'history-source',
      ),
    ).toBe(false);
    expect(
      redoneState.projectStates[projectId].modules.some(
        (moduleInstance) => moduleInstance.id === 'history-source',
      ),
    ).toBe(true);
  });

  it('clears redo history after a new authoring action', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const firstModuleId = initialState.projectStates[projectId].modules[0]?.id;

    if (!firstModuleId) {
      throw new Error('Expected a module in the sequential demo.');
    }

    const renamedState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: firstModuleId,
      nextModuleId: 'history-source',
    });
    const undoneState = uiReducer(renamedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });
    const branchedState = uiReducer(undoneState, {
      type: 'moveModule',
      projectId,
      moduleId: firstModuleId,
      x: 480,
      y: 240,
    });

    expect(branchedState.workspaceHistoryByProject[projectId]?.future).toEqual([]);
  });

  it('keeps workspace history isolated per project', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const otherProjectId = 'toy-rsa';
    const firstModuleId = initialState.projectStates[projectId].modules[0]?.id;

    if (!firstModuleId) {
      throw new Error('Expected a module in the sequential demo.');
    }

    const nextState = uiReducer(initialState, {
      type: 'renameModuleInstance',
      projectId,
      moduleId: firstModuleId,
      nextModuleId: 'history-source',
    });

    expect(nextState.workspaceHistoryByProject[projectId]?.past.length).toBe(1);
    expect(nextState.workspaceHistoryByProject[otherProjectId]?.past.length ?? 0).toBe(0);
  });

  it('restores annotation state through undo history', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const annotatedState = uiReducer(initialState, {
      type: 'addAnnotation',
      projectId,
    });
    const annotationId = annotatedState.annotationsByProject[projectId]?.[0]?.id;

    if (!annotationId) {
      throw new Error('Expected an annotation to be created.');
    }

    const editedState = uiReducer(annotatedState, {
      type: 'updateAnnotationText',
      projectId,
      annotationId,
      text: 'History note',
    });
    const undoneState = uiReducer(editedState, {
      type: 'undoWorkspaceHistory',
      projectId,
    });

    expect(editedState.annotationsByProject[projectId]?.[0]?.text).toBe('History note');
    expect(undoneState.annotationsByProject[projectId]?.[0]?.text).toBe('Add note...');
  });

  it('bounds workspace history depth deterministically', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const moduleId = initialState.projectStates[projectId].modules[0]?.id;

    if (!moduleId) {
      throw new Error('Expected a module in the sequential demo.');
    }

    let nextState = initialState;
    for (let index = 0; index < 45; index += 1) {
      nextState = uiReducer(nextState, {
        type: 'moveModule',
        projectId,
        moduleId,
        x: 120 + index * 8,
        y: 140 + index * 4,
      });
    }

    expect(nextState.workspaceHistoryByProject[projectId]?.past.length).toBe(40);
  });

  it('saves named workspace versions per project without leaking across workspaces', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const otherProjectId = 'toy-rsa';

    const nextState = uiReducer(initialState, {
      type: 'saveWorkspaceVersion',
      projectId,
      versionId: 'sequential-v1',
      name: 'Sequential Checkpoint',
      savedAt: '2026-03-27T12:00:00.000Z',
    });

    expect(nextState.workspaceVersionsByProject[projectId]).toHaveLength(1);
    expect(nextState.workspaceVersionsByProject[projectId]?.[0]?.name).toBe(
      'Sequential Checkpoint',
    );
    expect(nextState.workspaceVersionsByProject[otherProjectId] ?? []).toEqual([]);
  });

  it('restores a saved workspace version and resets transient editor state', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const firstModuleId = initialState.projectStates[projectId].modules[0]?.id;

    if (!firstModuleId) {
      throw new Error('Expected a module in the sequential demo.');
    }

    const savedState = uiReducer(initialState, {
      type: 'saveWorkspaceVersion',
      projectId,
      versionId: 'sequential-v1',
      name: 'Sequential Checkpoint',
      savedAt: '2026-03-27T12:00:00.000Z',
    });
    const editedState = uiReducer(
      uiReducer(
        uiReducer(savedState, {
          type: 'moveModule',
          projectId,
          moduleId: firstModuleId,
          x: 640,
          y: 260,
        }),
        {
          type: 'toggleProbe',
          projectId,
          moduleId: firstModuleId,
        },
      ),
      {
        type: 'setParamDraft',
        projectId,
        moduleId: firstModuleId,
        key: 'seed',
        rawValue: '10110011',
      },
    );
    const restoredState = uiReducer(editedState, {
      type: 'restoreWorkspaceVersion',
      projectId,
      versionId: 'sequential-v1',
    });

    expect(restoredState.layoutByProject[projectId]?.[firstModuleId]).toEqual(
      initialState.layoutByProject[projectId]?.[firstModuleId],
    );
    expect(restoredState.annotationsByProject[projectId]).toEqual(
      initialState.annotationsByProject[projectId],
    );
    expect(restoredState.probedModuleIdsByProject[projectId]).toEqual([]);
    expect(restoredState.paramDrafts[`${projectId}:${firstModuleId}:seed`]).toBeUndefined();
    expect(restoredState.currentTickByProject[projectId]).toBe(0);
    expect(restoredState.isTickPlaybackActiveByProject[projectId]).toBe(false);
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

  it('tidies layout vertically in a deterministic stage ladder', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const project = initialState.projectStates[projectId];
    const verticalState = uiReducer(initialState, {
      type: 'setLayoutDirection',
      projectId,
      direction: 'vertical',
    });
    const scrambledState = uiReducer(verticalState, {
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

    expect(
      project.connections.every((connection) => {
        const from = tidiedState.layoutByProject[projectId]?.[connection.from.moduleId];
        const to = tidiedState.layoutByProject[projectId]?.[connection.to.moduleId];
        return Boolean(from && to && from.y < to.y);
      }),
    ).toBe(true);
    expect(tidiedState.layoutByProject[projectId]?.clock).toEqual({ x: 48, y: 72 });
    expect(tidiedState.layoutByProject[projectId]?.lfsr?.y).toBe(220);
    expect(tidiedState.layoutByProject[projectId]?.decode?.y).toBe(368);
    expect(tidiedState.layoutByProject[projectId]?.output?.y).toBe(516);
  });

  it('does nothing when tidying a selection with fewer than two modules', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const selectedState = uiReducer(initialState, {
      type: 'selectModule',
      projectId,
      moduleId: 'clock',
    });

    const nextState = uiReducer(selectedState, {
      type: 'tidySelectedModules',
      projectId,
    });

    expect(nextState).toBe(selectedState);
  });

  it('tidies only the selected modules while keeping the lead selection anchored', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const scrambledState = uiReducer(initialState, {
      type: 'moveModules',
      projectId,
      positions: {
        clock: { x: 320, y: 180 },
        lfsr: { x: 495, y: 264 },
        decode: { x: 418, y: 338 },
      },
    });
    const selectedState = uiReducer(
      uiReducer(
        uiReducer(scrambledState, {
          type: 'selectModule',
          projectId,
          moduleId: 'clock',
        }),
        {
          type: 'selectModule',
          projectId,
          moduleId: 'lfsr',
          additive: true,
        },
      ),
      {
        type: 'selectModule',
        projectId,
        moduleId: 'decode',
        additive: true,
      },
    );

    const nextState = uiReducer(selectedState, {
      type: 'tidySelectedModules',
      projectId,
    });

    expect(nextState.layoutByProject[projectId]?.clock).toEqual({ x: -70, y: 338 });
    expect(nextState.layoutByProject[projectId]?.lfsr).toEqual({ x: 174, y: 338 });
    expect(nextState.layoutByProject[projectId]?.decode).toEqual({ x: 418, y: 338 });
    expect(nextState.layoutByProject[projectId]?.output).toEqual(
      selectedState.layoutByProject[projectId]?.output,
    );
    expect(nextState.selectedModuleIdByProject[projectId]).toBe('decode');
    expect(nextState.selectedModuleIdsByProject[projectId]).toEqual(['clock', 'lfsr', 'decode']);
  });

  it('adds modules below the selected module in vertical mode', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const verticalState = uiReducer(initialState, {
      type: 'setLayoutDirection',
      projectId,
      direction: 'vertical',
    });
    const selectedState = uiReducer(verticalState, {
      type: 'selectModule',
      projectId,
      moduleId: 'clock',
    });

    const nextState = uiReducer(selectedState, {
      type: 'addModule',
      projectId,
      moduleDef: V1_REGISTRY.Output,
    });

    const addedModule = nextState.projectStates[projectId]?.modules.at(-1);
    const selectedPosition = selectedState.layoutByProject[projectId]?.clock;
    expect(addedModule?.defId).toBe('Output');
    expect(nextState.layoutDirectionByProject[projectId]).toBe('vertical');
    expect(selectedPosition).toBeDefined();
    expect(nextState.layoutByProject[projectId]?.[addedModule?.id ?? '']).toMatchObject({
      x: selectedPosition?.x ?? 0,
      y: (selectedPosition?.y ?? 0) + 148,
      orientation: 'south',
    });
  });

  it('stores routing mode per workspace', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const nextState = uiReducer(initialState, {
      type: 'setRoutingMode',
      projectId,
      mode: 'orthogonal',
    });

    expect(nextState.routingModeByProject[projectId]).toBe('orthogonal');
  });

  it('stores wire color mode per workspace', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';

    const nextState = uiReducer(initialState, {
      type: 'setWireColorMode',
      projectId,
      mode: 'high-contrast',
    });

    expect(nextState.wireColorModeByProject[projectId]).toBe('high-contrast');
  });

  it('stores and clears orthogonal bend overrides per connection', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const connectionKey = 'clock:out->output:in';

    const bentState = uiReducer(initialState, {
      type: 'setConnectionOrthogonalBend',
      projectId,
      connectionKey,
      axis: 'x',
      value: 180,
    });
    expect(bentState.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalBend: { axis: 'x', value: 180 },
    });

    const clearedState = uiReducer(bentState, {
      type: 'clearConnectionOrthogonalBend',
      projectId,
      connectionKey,
    });
    expect(clearedState.connectionLayoutByProject[projectId]?.[connectionKey]).toBeUndefined();
  });

  it('stores lane preference independently from orthogonal bends', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const connectionKey = 'clock:out->output:in';

    const withPreference = uiReducer(initialState, {
      type: 'setConnectionLanePreference',
      projectId,
      connectionKey,
      preference: 'negative',
    });
    expect(withPreference.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalLanePreference: 'negative',
    });

    const withBend = uiReducer(withPreference, {
      type: 'setConnectionOrthogonalBend',
      projectId,
      connectionKey,
      axis: 'x',
      value: 180,
    });
    expect(withBend.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalBend: { axis: 'x', value: 180 },
      orthogonalLanePreference: 'negative',
    });

    const bendCleared = uiReducer(withBend, {
      type: 'clearConnectionOrthogonalBend',
      projectId,
      connectionKey,
    });
    expect(bendCleared.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalLanePreference: 'negative',
    });

    const preferenceCleared = uiReducer(bendCleared, {
      type: 'clearConnectionLanePreference',
      projectId,
      connectionKey,
    });
    expect(preferenceCleared.connectionLayoutByProject[projectId]?.[connectionKey]).toBeUndefined();
  });

  it('stores orthogonal anchors and clears authored path edits without clearing lane or color', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const connectionKey = 'clock:out->output:in';

    const withAnchors = uiReducer(initialState, {
      type: 'setConnectionOrthogonalAnchors',
      projectId,
      connectionKey,
      anchors: [
        { x: 120, y: 180 },
        { x: 180, y: 240 },
      ],
    });
    expect(withAnchors.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalAnchors: [
        { x: 120, y: 180 },
        { x: 180, y: 240 },
      ],
    });

    const withLane = uiReducer(withAnchors, {
      type: 'setConnectionLanePreference',
      projectId,
      connectionKey,
      preference: 'positive',
    });
    const withColor = uiReducer(withLane, {
      type: 'setConnectionColorOverride',
      projectId,
      connectionKey,
      color: 'teal',
    });

    const pathCleared = uiReducer(withColor, {
      type: 'clearConnectionOrthogonalPathEdits',
      projectId,
      connectionKey,
    });

    expect(pathCleared.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalLanePreference: 'positive',
      colorOverride: 'teal',
    });
  });

  it('stores wire color overrides independently from manual bends and lane preference', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const connectionKey = 'clock:out->output:in';

    const withColor = uiReducer(initialState, {
      type: 'setConnectionColorOverride',
      projectId,
      connectionKey,
      color: 'violet',
    });
    expect(withColor.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      colorOverride: 'violet',
    });

    const withPreference = uiReducer(withColor, {
      type: 'setConnectionLanePreference',
      projectId,
      connectionKey,
      preference: 'positive',
    });
    const withBend = uiReducer(withPreference, {
      type: 'setConnectionOrthogonalBend',
      projectId,
      connectionKey,
      axis: 'y',
      value: 144,
    });

    expect(withBend.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      colorOverride: 'violet',
      orthogonalBend: { axis: 'y', value: 144 },
      orthogonalLanePreference: 'positive',
    });

    const colorCleared = uiReducer(withBend, {
      type: 'clearConnectionColorOverride',
      projectId,
      connectionKey,
    });
    expect(colorCleared.connectionLayoutByProject[projectId]?.[connectionKey]).toEqual({
      orthogonalBend: { axis: 'y', value: 144 },
      orthogonalLanePreference: 'positive',
    });
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

  it('duplicates a workspace as an independent copy with reset session state', () => {
    const initialState = createInitialUiState(demoProjects);
    const sourceProjectId = 'sequential';
    const preparedState = uiReducer(
      uiReducer(
        uiReducer(initialState, {
          type: 'selectTutorial',
          projectId: sourceProjectId,
          tutorialId: initialState.tutorialLibrary.find(
            (tutorial) => tutorial.projectId === sourceProjectId,
          )?.id ?? null,
        }),
        {
          type: 'setTutorialStep',
          projectId: sourceProjectId,
          stepIndex: 2,
        },
      ),
      {
        type: 'setCurrentTick',
        projectId: sourceProjectId,
        tick: 4,
      },
    );

    const duplicateState = uiReducer(preparedState, {
      type: 'saveWorkspaceAs',
      sourceProjectId,
      workspaceId: 'sequential-copy',
      name: 'Sequential Copy',
      summary: 'A duplicated workspace.',
      pipeline: 'Clock -> LFSR -> BitsToSymbol -> Output',
      defaultTickedMode: true,
    });

    const renamedDuplicateState = uiReducer(duplicateState, {
      type: 'renameModuleInstance',
      projectId: 'sequential-copy',
      moduleId: duplicateState.projectStates['sequential-copy']?.modules[0]?.id ?? '',
      nextModuleId: 'copied-clock',
    });

    expect(duplicateState.activeProjectId).toBe('sequential-copy');
    expect(duplicateState.projectStates['sequential-copy']).toEqual(
      preparedState.projectStates[sourceProjectId],
    );
    expect(duplicateState.layoutByProject['sequential-copy']).toEqual(
      preparedState.layoutByProject[sourceProjectId],
    );
    expect(duplicateState.activeTutorialIdByProject['sequential-copy']).toBeNull();
    expect(duplicateState.activeTutorialStepByProject['sequential-copy']).toBe(0);
    expect(duplicateState.activeChallengeIdByProject['sequential-copy']).toBeNull();
    expect(duplicateState.currentTickByProject['sequential-copy']).toBe(0);
    expect(duplicateState.isTickPlaybackActiveByProject['sequential-copy']).toBe(false);
    expect(renamedDuplicateState.projectStates[sourceProjectId]?.modules[0]?.id).not.toBe(
      'copied-clock',
    );
    expect(renamedDuplicateState.projectStates['sequential-copy']?.modules[0]?.id).toBe(
      'copied-clock',
    );
  });

  it('deep-clones annotations when duplicating a workspace', () => {
    const initialState = createInitialUiState(demoProjects);
    const sourceProjectId = 'sequential';
    const annotatedState = uiReducer(
      uiReducer(initialState, {
        type: 'addAnnotation',
        projectId: sourceProjectId,
      }),
      {
        type: 'updateAnnotationText',
        projectId: sourceProjectId,
        annotationId: 'note-1',
        text: 'Original workspace note',
      },
    );

    const duplicateState = uiReducer(annotatedState, {
      type: 'saveWorkspaceAs',
      sourceProjectId,
      workspaceId: 'sequential-copy',
      name: 'Sequential Copy',
      summary: 'A duplicated workspace.',
      pipeline: 'Clock -> LFSR -> BitsToSymbol -> Output',
      defaultTickedMode: false,
    });
    const editedDuplicateState = uiReducer(duplicateState, {
      type: 'updateAnnotationText',
      projectId: 'sequential-copy',
      annotationId: 'note-1',
      text: 'Copied workspace note',
    });

    expect(duplicateState.annotationsByProject['sequential-copy']).toEqual(
      annotatedState.annotationsByProject[sourceProjectId],
    );
    expect(editedDuplicateState.annotationsByProject[sourceProjectId]?.[0]?.text).toBe(
      'Original workspace note',
    );
    expect(editedDuplicateState.annotationsByProject['sequential-copy']?.[0]?.text).toBe(
      'Copied workspace note',
    );
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
