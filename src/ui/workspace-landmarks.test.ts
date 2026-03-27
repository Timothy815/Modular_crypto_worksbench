import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import {
  deriveWorkspaceLandmarks,
  isLargeWorkspace,
  LARGE_WORKSPACE_MODULE_THRESHOLD,
} from './workspace-landmarks';

describe('workspace landmarks', () => {
  it('treats 18+ module workspaces as large', () => {
    const smallProject: Project = {
      modules: Array.from({ length: LARGE_WORKSPACE_MODULE_THRESHOLD - 1 }, (_, index) => ({
        id: `m-${index}`,
        defId: 'HexSource',
        params: { value: '00' },
      })),
      connections: [],
    };
    const largeProject: Project = {
      modules: Array.from({ length: LARGE_WORKSPACE_MODULE_THRESHOLD }, (_, index) => ({
        id: `m-${index}`,
        defId: 'HexSource',
        params: { value: '00' },
      })),
      connections: [],
    };

    expect(isLargeWorkspace(smallProject)).toBe(false);
    expect(isLargeWorkspace(largeProject)).toBe(true);
  });

  it('groups protocol context, generic sources, and outputs separately in layout order', () => {
    const project: Project = {
      modules: [
        { id: 'message', defId: 'AsciiSource', params: { value: 'HI' } },
        { id: 'nonce', defId: 'Nonce', params: { value: 'AA', width: 8 } },
        { id: 'iv', defId: 'IV', params: { value: 'BB', width: 8 } },
        { id: 'key', defId: 'HexSource', params: { value: '0F' } },
        { id: 'out-bits', defId: 'BitOutput', params: {} },
        { id: 'out-text', defId: 'TextOutput', params: {} },
      ],
      connections: [],
    };

    const landmarks = deriveWorkspaceLandmarks(project, V1_REGISTRY, {
      message: { x: 40, y: 200 },
      nonce: { x: 40, y: 120 },
      iv: { x: 40, y: 40 },
      key: { x: 40, y: 280 },
      'out-bits': { x: 800, y: 220 },
      'out-text': { x: 800, y: 80 },
    });

    expect(landmarks.context.map((item) => item.moduleId)).toEqual(['iv', 'nonce']);
    expect(landmarks.sources.map((item) => item.moduleId)).toEqual(['message', 'key']);
    expect(landmarks.outputs.map((item) => item.moduleId)).toEqual(['out-text', 'out-bits']);
  });
});
