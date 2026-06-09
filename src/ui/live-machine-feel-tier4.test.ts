import { describe, expect, it } from 'vitest';

import type { ExecutionResult, Project } from '../engine/types';
import {
  deriveTickActiveConnectionKeys,
  projectTickPulseVisibility,
  shouldSuppressTickPulseDuringScrub,
} from './live-machine-feel-tier4';

describe('live-machine-feel Tier 4 helpers', () => {
  it('only pulses connections carrying non-empty signals', () => {
    const project: Project = {
      modules: [],
      connections: [
        { from: { moduleId: 'src', port: 'bitsOut' }, to: { moduleId: 'mid', port: 'in' } },
        { from: { moduleId: 'src', port: 'symbolOut' }, to: { moduleId: 'sink', port: 'in' } },
        { from: { moduleId: 'src', port: 'emptyBits' }, to: { moduleId: 'idle', port: 'in' } },
      ],
    };
    const execution: ExecutionResult = {
      order: ['src'],
      outputsByModuleId: {
        src: {
          bitsOut: { type: 'bits', value: [1, 0, 1] },
          symbolOut: { type: 'symbol', value: 'A' },
          emptyBits: { type: 'bits', value: [] },
        },
      },
      trace: [],
      analysisTrace: [],
    };

    expect(deriveTickActiveConnectionKeys(project, execution)).toEqual([
      'src:bitsOut->mid:in',
      'src:symbolOut->sink:in',
    ]);
  });

  it('degrades to halo mode when too many visible wires would pulse', () => {
    const entries = Array.from({ length: 25 }, (_, index) => ({
      connectionKey: `m${index}:out->n${index}:in`,
      targetModuleId: `n${index}`,
      domain: 'bits' as const,
      visible: true,
    }));

    expect(projectTickPulseVisibility(entries)).toEqual({
      mode: 'halo',
      wireConnectionKeys: [],
      haloModuleIds: entries.map((entry) => entry.targetModuleId),
      domainByConnectionKey: {},
      domainByModuleId: Object.fromEntries(
        entries.map((entry) => [entry.targetModuleId, 'bits']),
      ),
    });
  });

  it('keeps wire mode for visible pulses within the budget', () => {
    const projection = projectTickPulseVisibility([
      {
        connectionKey: 'src:out->mid:in',
        targetModuleId: 'mid',
        domain: 'integer',
        visible: true,
      },
      {
        connectionKey: 'mid:out->sink:in',
        targetModuleId: 'sink',
        domain: 'ec-point',
        visible: false,
      },
    ]);

    expect(projection).toEqual({
      mode: 'wire',
      wireConnectionKeys: ['src:out->mid:in'],
      haloModuleIds: [],
      domainByConnectionKey: {
        'src:out->mid:in': 'integer',
      },
      domainByModuleId: {},
    });
  });

  it('uses the first visible incoming domain for each halo module', () => {
    const projection = projectTickPulseVisibility([
      {
        connectionKey: 'a:out->shared:inA',
        targetModuleId: 'shared',
        domain: 'symbol',
        visible: true,
      },
      {
        connectionKey: 'b:out->shared:inB',
        targetModuleId: 'shared',
        domain: 'bits',
        visible: true,
      },
      ...Array.from({ length: 23 }, (_, index) => ({
        connectionKey: `m${index}:out->n${index}:in`,
        targetModuleId: `n${index}`,
        domain: 'bits' as const,
        visible: true,
      })),
    ]);

    expect(projection.mode).toBe('halo');
    expect(projection.domainByModuleId.shared).toBe('symbol');
  });

  it('suppresses rapid scrub pulses but not isolated tick changes', () => {
    expect(shouldSuppressTickPulseDuringScrub(true, 200, 120)).toBe(true);
    expect(shouldSuppressTickPulseDuringScrub(true, 400, 120)).toBe(false);
    expect(shouldSuppressTickPulseDuringScrub(false, 200, 120)).toBe(false);
  });
});
