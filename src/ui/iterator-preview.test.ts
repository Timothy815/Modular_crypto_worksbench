import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import type { ModuleDef, ModuleRegistry } from '../engine/types';
import { previewClockedIteratorDefinition, previewIteratorDefinition } from './iterator-preview';

const PASS_BITS: ModuleDef = {
  id: 'PassBits',
  name: 'Pass Bits',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ out: inputs.in }),
};

const BAD_PORTS: ModuleDef = {
  id: 'BadPorts',
  name: 'Bad Ports',
  inputs: [{ name: 'data', type: 'bits' }],
  outputs: [{ name: 'result', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => ({ result: inputs.data }),
};

const registry: ModuleRegistry = {
  ...V1_REGISTRY,
  PassBits: PASS_BITS,
  BadPorts: BAD_PORTS,
};

describe('iterator previews', () => {
  it('previews the iterator interface from the chosen repeated body', () => {
    expect(previewIteratorDefinition(registry, 'PassBits', 3)).toEqual({
      ok: true,
      bodyName: 'Pass Bits',
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      structuralSummary: '3-round body: Pass Bits',
    });
  });

  it('previews the clocked iterator interface including the clock input', () => {
    expect(previewClockedIteratorDefinition(registry, 'PassBits', 4, 'halt')).toEqual({
      ok: true,
      bodyName: 'Pass Bits',
      inputs: [
        { name: 'in', type: 'bits' },
        { name: 'clock', type: 'bits' },
      ],
      outputs: [{ name: 'out', type: 'bits' }],
      structuralSummary: '4-step halt body: Pass Bits',
    });
  });

  it('reports an invalid repeated body honestly', () => {
    const preview = previewIteratorDefinition(registry, 'BadPorts', 2);
    expect(preview.ok).toBe(false);
    expect(preview.bodyName).toBe('Bad Ports');
    expect(preview.error).toContain('exactly one input named "in"');
  });
});
