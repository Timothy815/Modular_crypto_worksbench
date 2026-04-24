import { describe, expect, it } from 'vitest';

import { demoProjects } from './demo-projects';
import {
  buildFlatZipArchive,
  loadWorkspaceFromStorage,
  parseCompositeLibraryDocument,
  parseGuidedChallengeDocument,
  saveWorkspaceToStorage,
} from './persistence';
import { parseShareableLabPack } from './shareable-lab-pack-persistence';
import { createInitialUiState, uiReducer } from './store';
import type { CompositeLibraryDocument, ShareableLabPack } from './workbench-document';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('parseCompositeLibraryDocument', () => {
  it('accepts a valid composite library document', () => {
    const document: CompositeLibraryDocument = {
      version: 1,
      entries: [
        {
          id: 'SimpleComposite',
          name: 'Simple Composite',
          version: 1,
          definition: {
            id: 'SimpleComposite',
            name: 'Simple Composite',
            kind: 'composite',
            version: 1,
            inputs: [{ name: 'in', type: 'symbol' }],
            outputs: [{ name: 'out', type: 'symbol' }],
            paramSchema: {},
            project: {
              modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
              connections: [],
            },
            inputBindings: [
              { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
            ],
            outputBindings: [
              { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
            ],
          },
        },
      ],
    };

    const result = parseCompositeLibraryDocument(JSON.stringify(document));

    expect(result).toEqual(document);
  });

  it('rejects malformed composite library documents', () => {
    const malformed = JSON.stringify({
      version: 1,
      entries: [{ id: 'Broken' }],
    });

    const result = parseCompositeLibraryDocument(malformed);

    expect(result).toBeNull();
  });
});

describe('parseGuidedChallengeDocument', () => {
  it('accepts collision challenges with an explicit home project', () => {
    const result = parseGuidedChallengeDocument(
      JSON.stringify({
        version: 1,
        id: 'find-sponge-collision',
        title: 'Find A Sponge Collision',
        projectId: 'toy-sponge-hash',
        prompt: 'Find a different 2-byte message with the same digest.',
        startingProject: {
          modules: [],
          connections: [],
        },
        targetProject: {
          modules: [],
          connections: [],
        },
        success: {
          kind: 'output-match-target-with-module-difference',
          moduleIds: ['left-source', 'right-source'],
        },
      }),
    );

    expect(result?.projectId).toBe('toy-sponge-hash');
    expect(result?.success.kind).toBe('output-match-target-with-module-difference');
  });
});

describe('workspace persistence', () => {
  it('round-trips user workspaces through storage', () => {
    const initialState = createInitialUiState(demoProjects);
    const createdState = uiReducer(initialState, {
      type: 'createBlankWorkspace',
      workspaceId: 'my-scratchpad',
      name: 'My Scratchpad',
      summary: 'A blank personal workspace for building from scratch.',
      pipeline: 'Blank canvas',
    });
    const verticalState = uiReducer(createdState, {
      type: 'setLayoutDirection',
      projectId: 'my-scratchpad',
      direction: 'vertical',
    });
    const stateWithWorkspace = uiReducer(verticalState, {
      type: 'setRoutingMode',
      projectId: 'my-scratchpad',
      mode: 'orthogonal',
    });
    const stateWithWireColors = uiReducer(stateWithWorkspace, {
      type: 'setWireColorMode',
      projectId: 'my-scratchpad',
      mode: 'high-contrast',
    });
    const stateWithGroupBox = uiReducer(stateWithWireColors, {
      type: 'addGroupBox',
      projectId: 'my-scratchpad',
    });
    const stateWithGuideRail = uiReducer(stateWithGroupBox, {
      type: 'addGuideRail',
      projectId: 'my-scratchpad',
      axis: 'horizontal',
    });
    const stateWithStageLabel = uiReducer(stateWithGuideRail, {
      type: 'addStageLabel',
      projectId: 'my-scratchpad',
    });
    const storage = new MemoryStorage();

    saveWorkspaceToStorage(
      uiReducer(stateWithStageLabel, {
        type: 'setSnapToGuides',
        projectId: 'my-scratchpad',
        enabled: true,
      }),
      {},
      storage,
    );
    const restored = loadWorkspaceFromStorage(demoProjects, storage);

    expect(restored?.userWorkspaceLibrary).toEqual([
      {
        id: 'my-scratchpad',
        name: 'My Scratchpad',
        group: 'My Workspaces',
        summary: 'A blank personal workspace for building from scratch.',
        pipeline: 'Blank canvas',
        defaultTickedMode: false,
      },
    ]);
    expect(restored?.documentsByProjectId['my-scratchpad']?.project).toEqual({
      modules: [],
      connections: [],
    });
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.layoutDirection).toBe('vertical');
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.routingMode).toBe('orthogonal');
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.wireColorMode).toBe(
      'high-contrast',
    );
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.connectionLayout).toEqual({});
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.groupBoxes).toEqual([
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
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.guideRails).toEqual([
      {
        id: 'rail-1',
        axis: 'horizontal',
        position: 140,
        title: 'Horizontal Rail',
      },
    ]);
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.stageLabels).toEqual([
      {
        id: 'label-1',
        x: 96,
        y: 48,
        text: 'Stage Label',
      },
    ]);
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.showOverviewNavigator).toBe(false);
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.showGrid).toBe(false);
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.snapToGrid).toBe(false);
    expect(restored?.documentsByProjectId['my-scratchpad']?.ui.snapToGuides).toBe(true);
  });

  it('round-trips node orientation through storage', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const storage = new MemoryStorage();

    const rotatedState = uiReducer(initialState, {
      type: 'rotateModuleClockwise',
      projectId,
      moduleId: 'clock',
    });

    saveWorkspaceToStorage(rotatedState, {}, storage);
    const restored = loadWorkspaceFromStorage(demoProjects, storage);

    expect(restored?.documentsByProjectId[projectId]?.ui.layout.clock).toMatchObject({
      orientation: 'south',
    });
  });

  it('round-trips named workspace versions through storage', () => {
    const initialState = createInitialUiState(demoProjects);
    const stateWithVersion = uiReducer(initialState, {
      type: 'saveWorkspaceVersion',
      projectId: 'sequential',
      versionId: 'sequential-v1',
      name: 'Sequential Checkpoint',
      savedAt: '2026-03-27T12:00:00.000Z',
    });
    const storage = new MemoryStorage();

    saveWorkspaceToStorage(stateWithVersion, {}, storage);
    const restored = loadWorkspaceFromStorage(demoProjects, storage);

    expect(restored?.workspaceVersionsByProjectId?.['sequential']).toHaveLength(1);
    expect(restored?.workspaceVersionsByProjectId?.['sequential']?.[0]).toMatchObject({
      id: 'sequential-v1',
      name: 'Sequential Checkpoint',
      savedAt: '2026-03-27T12:00:00.000Z',
      tickedMode: true,
    });
    expect(
      restored?.workspaceVersionsByProjectId?.['sequential']?.[0]?.document.project,
    ).toEqual(initialState.projectStates['sequential']);
  });

  it('round-trips saved analysis cases and cryptanalysis control state through storage', () => {
    const initialState = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const storage = new MemoryStorage();

    const withMode = uiReducer(initialState, {
      type: 'setCryptanalysisMode',
      projectId,
      mode: 'modern',
    });
    const withBaseline = uiReducer(withMode, {
      type: 'setModernAnalysisBaseline',
      projectId,
      value: '10101100',
    });
    const withFlipBit = uiReducer(withBaseline, {
      type: 'setModernAnalysisFlipBit',
      projectId,
      value: 5,
    });
    const withSource = uiReducer(withFlipBit, {
      type: 'setModernAnalysisSourceId',
      projectId,
      value: 'input',
    });
    const withSink = uiReducer(withSource, {
      type: 'setModernAnalysisSinkId',
      projectId,
      value: 'output',
    });
    const withSavedCase = uiReducer(withSink, {
      type: 'saveAnalysisCase',
      projectId,
      savedCase: {
        id: 'analysis-modern-1',
        name: 'Saved Modern Setup',
        projectId,
        mode: 'modern',
        state: {
          sourceModuleId: 'input',
          sinkModuleId: 'output',
          baselineInput: '10101100',
          flipBit: 5,
        },
      },
    });

    saveWorkspaceToStorage(withSavedCase, {}, storage);
    const restored = loadWorkspaceFromStorage(demoProjects, storage);

    expect(restored?.modernAnalysisBaselineByProjectId?.[projectId]).toBe('10101100');
    expect(restored?.modernAnalysisFlipBitByProjectId?.[projectId]).toBe(5);
    expect(restored?.modernAnalysisSourceIdByProjectId?.[projectId]).toBe('input');
    expect(restored?.modernAnalysisSinkIdByProjectId?.[projectId]).toBe('output');
    expect(restored?.savedAnalysisCasesByProjectId?.[projectId]).toEqual([
      {
        id: 'analysis-modern-1',
        name: 'Saved Modern Setup',
        projectId,
        mode: 'modern',
        state: {
          sourceModuleId: 'input',
          sinkModuleId: 'output',
          baselineInput: '10101100',
          flipBit: 5,
        },
      },
    ]);
  });
});

describe('parseShareableLabPack', () => {
  it('accepts a valid lab pack with workspace context', () => {
    const pack: ShareableLabPack = {
      version: 1,
      kind: 'mcw-shareable-lab-pack',
      metadata: {
        id: 'lab-pack-demo',
        title: 'Lab Pack Demo',
        summary: 'A portable verified lab.',
        exportedAt: '2026-04-02T12:00:00.000Z',
      },
      workspace: {
        version: 1,
        project: {
          modules: [],
          connections: [],
        },
        ui: {
          layout: {},
          annotations: [],
          guideRails: [
            {
              id: 'rail-1',
              axis: 'vertical',
              position: 188,
              title: 'Signal Rail',
            },
          ],
          snapToGuides: true,
          layoutDirection: 'vertical',
          routingMode: 'orthogonal',
          wireColorMode: 'neutral',
          connectionLayout: {
            'a:out->b:in': {
              orthogonalBend: { axis: 'x', value: 144 },
              orthogonalLanePreference: 'positive',
              colorOverride: 'teal',
            },
          },
        },
      },
      verificationCases: [
        {
          id: 'case-1',
          mode: 'stateless',
          sourceModuleId: 'input-1',
          sourceDefId: 'BitInput',
          sourceLabel: 'Input',
          inputValue: '1010',
          expectedOutput: '1010',
        },
      ],
    };

    expect(parseShareableLabPack(JSON.stringify(pack))).toEqual(pack);
  });

  it('persists connection color overrides in storage', () => {
    const state = createInitialUiState(demoProjects);
    const projectId = 'sequential';
    const connectionKey = 'clock:out->output:in';
    const storage = new MemoryStorage();

    const coloredState = uiReducer(state, {
      type: 'setConnectionColorOverride',
      projectId,
      connectionKey,
      color: 'rose',
    });

    saveWorkspaceToStorage(coloredState, {}, storage);
    const restored = loadWorkspaceFromStorage(demoProjects, storage);

    expect(restored?.documentsByProjectId[projectId]?.ui.connectionLayout).toEqual({
      [connectionKey]: {
        colorOverride: 'rose',
      },
    });
  });
});

describe('buildFlatZipArchive', () => {
  it('builds a flat utf-8 zip archive containing only the provided files', async () => {
    const archive = buildFlatZipArchive([
      { fileName: 'mcw_runtime.py', contents: '# runtime\n__version__ = "1.0.0"\n' },
      { fileName: 'demo-workspace.py', contents: '# workspace\nimport mcw_runtime\n' },
    ]);

    expect(archive.type).toBe('application/zip');

    const bytes = new Uint8Array(await archive.arrayBuffer());
    const decoder = new TextDecoder();
    const archiveText = decoder.decode(bytes);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(archiveText).toContain('mcw_runtime.py');
    expect(archiveText).toContain('demo-workspace.py');
    expect(archiveText).not.toContain('.mcw_meta');
    expect(archiveText).not.toContain('README.md');

    const endOfCentralDirectoryOffset = bytes.length - 22;
    expect(view.getUint32(endOfCentralDirectoryOffset, true)).toBe(0x06054b50);
    expect(view.getUint16(endOfCentralDirectoryOffset + 8, true)).toBe(2);
    expect(view.getUint16(endOfCentralDirectoryOffset + 10, true)).toBe(2);
  });
});
