import { describe, expect, it } from 'vitest';

import type { Project } from '../engine/types';
import { V1_REGISTRY } from '../engine/modules';
import { deriveCanvasModuleErrorStateById } from './live-machine-feel-tier1';
import {
  deriveFirstBrokenModuleId,
  getSpliceEligiblePorts,
  splitConnectionLayoutForSplice,
} from './live-machine-feel-tier2';

describe('live-machine-feel Tier 2 helpers', () => {
  it('finds the first broken module using execution order', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1] } },
        { id: 'middle', defId: 'NOT', params: {} },
        { id: 'sink', defId: 'NOT', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
        { from: { moduleId: 'middle', port: 'out' }, to: { moduleId: 'sink', port: 'in' } },
      ],
    };

    const errorStates = deriveCanvasModuleErrorStateById(
      project,
      V1_REGISTRY,
      [],
      {
        order: ['source', 'middle', 'sink'],
        outputsByModuleId: {
          source: { out: { type: 'bits', value: [1] } },
        },
        trace: [],
        analysisTrace: [],
      },
    );

    expect(
      deriveFirstBrokenModuleId({
        project,
        executionOrder: ['source', 'middle', 'sink'],
        canvasModuleErrorStateById: errorStates,
      }),
    ).toBe('middle');
  });

  it('accepts one-in one-out data modules for splicing and rejects extra required inputs', () => {
    expect(getSpliceEligiblePorts(V1_REGISTRY.NOT, 'bits')).toEqual({
      inputPortName: 'in',
      outputPortName: 'out',
    });
    expect(getSpliceEligiblePorts(V1_REGISTRY.XOR, 'bits')).toBeNull();
    expect(getSpliceEligiblePorts(V1_REGISTRY.Gate, 'bits')).toEqual({
      inputPortName: 'in',
      outputPortName: 'out',
    });
  });

  it('splits orthogonal anchor metadata across the replacement wire pair', () => {
    expect(
      splitConnectionLayoutForSplice(
        {
          orthogonalAnchors: [
            { x: 80, y: 100 },
            { x: 180, y: 100 },
          ],
          orthogonalLanePreference: 'positive',
          colorOverride: 'teal',
        },
        1,
      ),
    ).toEqual({
      sourceLayout: {
        orthogonalAnchors: [{ x: 80, y: 100 }],
        orthogonalLanePreference: 'positive',
        colorOverride: 'teal',
      },
      targetLayout: {
        orthogonalAnchors: [{ x: 180, y: 100 }],
        orthogonalLanePreference: 'positive',
        colorOverride: 'teal',
      },
    });
  });
});
