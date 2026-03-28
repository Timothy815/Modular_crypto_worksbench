/// <reference types="node" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../executor';
import { V1_REGISTRY } from '../modules';
import { generatePythonExport, getPythonExportCompatibility } from './python';
import type { CompositeDef, IteratorDef } from '../composites';
import type { ModuleRegistry, Project, Signal } from '../types';
import { STARTER_COMPOSITE_LIBRARY } from '../../ui/starter-composites';

function formatExpectedSinkValue(defId: string, signal: Signal) {
  if (defId === 'Output' || defId === 'TextOutput' || defId === 'BaudotOutput') {
    return String(signal.value);
  }

  if (defId === 'BitOutput') {
    if (signal.type !== 'bits') {
      throw new Error('BitOutput expects a bits signal');
    }
    return signal.value.join('');
  }

  if (defId === 'HexOutput') {
    return String(signal.value).toUpperCase();
  }

  throw new Error(`Unsupported sink ${defId}`);
}

function getExpectedSinkLines(project: Project, registry: ModuleRegistry) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return project.modules
    .filter((moduleInstance) =>
      ['Output', 'TextOutput', 'BaudotOutput', 'BitOutput', 'HexOutput'].includes(moduleInstance.defId),
    )
    .map((moduleInstance) => {
      const traceEntry = traceByModuleId.get(moduleInstance.id);
      if (!traceEntry?.inputs.in) {
        throw new Error(`Missing sink input for ${moduleInstance.id}`);
      }
      return `${moduleInstance.id}: ${formatExpectedSinkValue(moduleInstance.defId, traceEntry.inputs.in)}`;
    });
}

function getExpectedTickedSinkLines(project: Project, registry: ModuleRegistry) {
  const tickCount = deriveTickCount(project, registry);
  if (tickCount === null) {
    throw new Error('Expected a derived tick count for a ticked parity workspace');
  }

  const result = executeTickedProject(project, registry, tickCount);

  return result.ticks.flatMap((tickResult, tickIndex) => {
    const traceByModuleId = new Map(tickResult.trace.map((entry) => [entry.moduleId, entry]));

    return project.modules
      .filter((moduleInstance) =>
        ['Output', 'TextOutput', 'BaudotOutput', 'BitOutput', 'HexOutput'].includes(moduleInstance.defId),
      )
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in) {
          throw new Error(`Missing sink input for ${moduleInstance.id} at tick ${tickIndex}`);
        }
        return `tick ${tickIndex} | ${moduleInstance.id}: ${formatExpectedSinkValue(moduleInstance.defId, traceEntry.inputs.in)}`;
      });
  });
}

function executeGeneratedPython(source: string) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `mcw-python-export-${Date.now()}-${Math.random().toString(16).slice(2)}.py`,
  );
  fs.writeFileSync(tempFilePath, source, 'utf8');
  const result = spawnSync('python3', [tempFilePath], { encoding: 'utf8' });
  fs.unlinkSync(tempFilePath);
  return result;
}

const pythonAvailability = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const hasPython3 = pythonAvailability.status === 0;
const parityDescribe = hasPython3 ? describe : describe.skip;

const symbolRoundTripComposite = STARTER_COMPOSITE_LIBRARY.find(
  (entry) => entry.id === 'SymbolRoundTripComposite',
)?.definition;

const byteRoundIterator = STARTER_COMPOSITE_LIBRARY.find(
  (entry) => entry.id === 'ByteRoundIterator',
)?.definition;

const keyedByteRoundIterator = STARTER_COMPOSITE_LIBRARY.find(
  (entry) => entry.id === 'KeyedByteRoundIterator',
)?.definition;

const starterDefinitionRegistry = STARTER_COMPOSITE_LIBRARY.reduce<ModuleRegistry>(
  (accumulator, entry) => {
    accumulator[entry.id] = entry.definition;
    return accumulator;
  },
  { ...V1_REGISTRY },
);

if (!symbolRoundTripComposite || symbolRoundTripComposite.kind !== 'composite') {
  throw new Error('Expected SymbolRoundTripComposite to exist in the starter composite library.');
}

if (!byteRoundIterator || byteRoundIterator.kind !== 'iterator') {
  throw new Error('Expected ByteRoundIterator to exist in the starter composite library.');
}

if (!keyedByteRoundIterator || keyedByteRoundIterator.kind !== 'iterator') {
  throw new Error('Expected KeyedByteRoundIterator to exist in the starter composite library.');
}

const forwardedShiftComposite: CompositeDef = {
  id: 'ForwardedShiftComposite',
  name: 'Forwarded Shift Composite',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'mask', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    rotateMode: {
      key: 'rotateMode',
      label: 'Rotate Mode',
      kind: 'select',
      defaultValue: 'rotate-left',
      options: [
        { label: 'Rotate Left', value: 'rotate-left' },
        { label: 'Rotate Right', value: 'rotate-right' },
      ],
    },
  },
  project: {
    modules: [
      { id: 'shift-1', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
      { id: 'mix-1', defId: 'XOR', params: {} },
    ],
    connections: [
      { from: { moduleId: 'shift-1', port: 'out' }, to: { moduleId: 'mix-1', port: 'a' } },
    ],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'shift-1', internalPort: 'in' },
    { externalPort: 'mask', internalModuleId: 'mix-1', internalPort: 'b' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'mix-1', internalPort: 'out' },
  ],
  forwardedParams: [
    { externalParam: 'rotateMode', internalModuleId: 'shift-1', internalParamKey: 'mode' },
  ],
};

const clockedRotorComposite: CompositeDef = {
  id: 'ClockedRotorComposite',
  name: 'Clocked Rotor Composite',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'in', type: 'symbol' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [
    { name: 'out', type: 'symbol' },
    { name: 'turnover', type: 'bits' },
  ],
  paramSchema: {},
  project: {
    modules: [
      {
        id: 'rotor-1',
        defId: 'Rotor',
        params: {
          wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
          position: 0,
          ringOffset: 0,
          notches: 'Q',
        },
      },
    ],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'rotor-1', internalPort: 'in' },
    { externalPort: 'clock', internalModuleId: 'rotor-1', internalPort: 'clock' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'rotor-1', internalPort: 'out' },
    { externalPort: 'turnover', internalModuleId: 'rotor-1', internalPort: 'turnover' },
  ],
};

const steppingRotorComposite: CompositeDef = {
  id: 'SteppingRotorComposite',
  name: 'Stepping Rotor Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  project: {
    modules: [
      {
        id: 'rotor-1',
        defId: 'Rotor',
        params: {
          wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
          position: 0,
          ringOffset: 0,
          notches: 'Q',
        },
      },
    ],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'rotor-1', internalPort: 'in' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'rotor-1', internalPort: 'out' },
  ],
};

const nestedComposite: CompositeDef = {
  id: 'NestedComposite',
  name: 'Nested Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'inner', defId: 'SymbolRoundTripComposite', params: {} }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'inner', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'inner', internalPort: 'out' }],
};

const nestedForwardedComposite: CompositeDef = {
  id: 'NestedForwardedComposite',
  name: 'Nested Forwarded Composite',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'mask', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    rotateMode: {
      key: 'rotateMode',
      label: 'Rotate Mode',
      kind: 'select',
      defaultValue: 'rotate-left',
      options: [
        { label: 'Rotate Left', value: 'rotate-left' },
        { label: 'Rotate Right', value: 'rotate-right' },
      ],
    },
  },
  project: {
    modules: [{ id: 'inner', defId: 'ForwardedShiftComposite', params: {} }],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'inner', internalPort: 'in' },
    { externalPort: 'mask', internalModuleId: 'inner', internalPort: 'mask' },
  ],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'inner', internalPort: 'out' }],
  forwardedParams: [
    { externalParam: 'rotateMode', internalModuleId: 'inner', internalParamKey: 'rotateMode' },
  ],
};

const nestedClockedRotorComposite: CompositeDef = {
  id: 'NestedClockedRotorComposite',
  name: 'Nested Clocked Rotor Composite',
  kind: 'composite',
  version: 1,
  inputs: [
    { name: 'in', type: 'symbol' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [
    { name: 'out', type: 'symbol' },
    { name: 'turnover', type: 'bits' },
  ],
  paramSchema: {},
  project: {
    modules: [{ id: 'inner', defId: 'ClockedRotorComposite', params: {} }],
    connections: [],
  },
  inputBindings: [
    { externalPort: 'in', internalModuleId: 'inner', internalPort: 'in' },
    { externalPort: 'clock', internalModuleId: 'inner', internalPort: 'clock' },
  ],
  outputBindings: [
    { externalPort: 'out', internalModuleId: 'inner', internalPort: 'out' },
    { externalPort: 'turnover', internalModuleId: 'inner', internalPort: 'turnover' },
  ],
};

const compositeContainingIterator: CompositeDef = {
  id: 'CompositeContainingIterator',
  name: 'Composite Containing Iterator',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'iter', defId: 'ByteRoundIterator', params: {} }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'iter', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'iter', internalPort: 'out' }],
};

const forwardedIteratorComposite: CompositeDef = {
  id: 'ForwardedIteratorComposite',
  name: 'Forwarded Iterator Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    rounds: {
      key: 'rounds',
      label: 'Rounds',
      kind: 'number',
      defaultValue: 2,
    },
  },
  project: {
    modules: [{ id: 'iter', defId: 'ByteRoundIterator', params: { iterationCount: 2 } }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'iter', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'iter', internalPort: 'out' }],
  forwardedParams: [
    { externalParam: 'rounds', internalModuleId: 'iter', internalParamKey: 'iterationCount' },
  ],
};

const temporalIteratorContainingComposite: CompositeDef = {
  id: 'TemporalIteratorContainingComposite',
  name: 'Temporal Iterator Containing Composite',
  kind: 'composite',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  project: {
    modules: [{ id: 'iter', defId: 'SteppingRotorIterator', params: { iterationCount: 2 } }],
    connections: [],
  },
  inputBindings: [{ externalPort: 'in', internalModuleId: 'iter', internalPort: 'in' }],
  outputBindings: [{ externalPort: 'out', internalModuleId: 'iter', internalPort: 'out' }],
};

const iteratorWithCompositeIteratorRound: IteratorDef = {
  id: 'IteratorWithCompositeIteratorRound',
  name: 'Iterator With Composite Iterator Round',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  roundDefId: 'CompositeContainingIterator',
  iterationCount: 2,
};

const steppingRotorIterator: IteratorDef = {
  id: 'SteppingRotorIterator',
  name: 'Stepping Rotor Iterator',
  kind: 'iterator',
  version: 1,
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    iterationCount: {
      key: 'iterationCount',
      label: 'Round Count',
      kind: 'number',
      defaultValue: 2,
    },
  },
  roundDefId: 'SteppingRotorComposite',
  iterationCount: 2,
};

describe('getPythonExportCompatibility', () => {
  it('rejects invalid linked reverse rotors and bypassed modules', () => {
    const incompatibleProject: Project = {
      modules: [
        { id: 'rotor-rev-1', defId: 'RotorReverse', params: { linkedRotorId: 'rotor-fwd' } },
        { id: 'bits-1', defId: 'BitSource', params: { stream: [1, 0, 1, 0] }, bypass: true },
      ],
      connections: [],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, V1_REGISTRY);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toEqual([
      {
        moduleId: 'rotor-rev-1',
        defId: 'RotorReverse',
        reason: 'RotorReverse linkedRotorId must reference an exported forward Rotor, not "rotor-fwd".',
      },
      {
        moduleId: 'bits-1',
        defId: 'BitSource',
        reason: 'Bypass behavior is not exportable in V1.',
      },
    ]);
  });

  it('rejects unlinked rotor reverse export', () => {
    const incompatibleProject: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'A' } },
        { id: 'rotor-rev-1', defId: 'RotorReverse', params: { linkedRotorId: '' } },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-rev-1', port: 'in' } },
        { from: { moduleId: 'rotor-rev-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, V1_REGISTRY);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toContainEqual({
      moduleId: 'rotor-rev-1',
      defId: 'RotorReverse',
      reason: 'RotorReverse requires a linked forward Rotor for Python export.',
    });
  });

  it('rejects composite definition cycles in v1', () => {
    const cyclicCompositeA: CompositeDef = {
      id: 'CyclicCompositeA',
      name: 'Cyclic Composite A',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'inner', defId: 'CyclicCompositeB', params: {} }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'inner', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'inner', internalPort: 'out' }],
    };
    const cyclicCompositeB: CompositeDef = {
      id: 'CyclicCompositeB',
      name: 'Cyclic Composite B',
      kind: 'composite',
      version: 1,
      inputs: [{ name: 'in', type: 'symbol' }],
      outputs: [{ name: 'out', type: 'symbol' }],
      paramSchema: {},
      project: {
        modules: [{ id: 'inner', defId: 'CyclicCompositeA', params: {} }],
        connections: [],
      },
      inputBindings: [{ externalPort: 'in', internalModuleId: 'inner', internalPort: 'in' }],
      outputBindings: [{ externalPort: 'out', internalModuleId: 'inner', internalPort: 'out' }],
    };
    const compositeRegistry: ModuleRegistry = {
      ...V1_REGISTRY,
      CyclicCompositeA: cyclicCompositeA,
      CyclicCompositeB: cyclicCompositeB,
    };
    const incompatibleProject: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'A' } },
        { id: 'cycle-1', defId: 'CyclicCompositeA', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'cycle-1', port: 'in' } },
        { from: { moduleId: 'cycle-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, compositeRegistry);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toContainEqual({
      moduleId: 'cycle-1/inner/inner',
      defId: 'CyclicCompositeA',
      reason: 'Composite definition cycles are not exportable in V1.',
    });
  });

  it('rejects invalid iterator round-count overrides in v1', () => {
    const invalidIterator: IteratorDef = {
      id: 'InvalidIterator',
      name: 'Invalid Iterator',
      kind: 'iterator',
      version: 1,
      inputs: [{ name: 'in', type: 'bits' }],
      outputs: [{ name: 'out', type: 'bits' }],
      paramSchema: {},
      roundDefId: 'ByteRoundComposite',
      iterationCount: 2,
    };
    const iteratorRegistry: ModuleRegistry = {
      ...starterDefinitionRegistry,
      SymbolRoundTripComposite: symbolRoundTripComposite,
      ForwardedShiftComposite: forwardedShiftComposite,
      ClockedRotorComposite: clockedRotorComposite,
      InvalidIterator: invalidIterator,
    };
    const incompatibleProject: Project = {
      modules: [
        { id: 'bits-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'iter-1', defId: 'InvalidIterator', params: { iterationCount: 0 } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, iteratorRegistry);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toContainEqual({
      moduleId: 'iter-1',
      defId: 'InvalidIterator',
      reason: 'Iterator iterationCount overrides must resolve to a positive integer.',
    });
  });

  it('allows composites containing iterators in v1', () => {
    const compatibilityRegistry: ModuleRegistry = {
      ...starterDefinitionRegistry,
      CompositeContainingIterator: compositeContainingIterator,
    };
    const compatibleProject: Project = {
      modules: [
        { id: 'bits-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'comp-1', defId: 'CompositeContainingIterator', params: {} },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const compatibility = getPythonExportCompatibility(compatibleProject, compatibilityRegistry);

    expect(compatibility.ok).toBe(true);
    expect(compatibility.issues).toEqual([]);
  });

  it('rejects iterator round definitions whose composite body contains an iterator in v1', () => {
    const compatibilityRegistry: ModuleRegistry = {
      ...starterDefinitionRegistry,
      CompositeContainingIterator: compositeContainingIterator,
      IteratorWithCompositeIteratorRound: iteratorWithCompositeIteratorRound,
    };
    const incompatibleProject: Project = {
      modules: [
        { id: 'bits-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'iter-1', defId: 'IteratorWithCompositeIteratorRound', params: {} },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, compatibilityRegistry);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toContainEqual({
      moduleId: 'iter-1/round-def/iter',
      defId: 'ByteRoundIterator',
      reason: 'Iterators inside composites are not exportable in V1.',
    });
  });
});

parityDescribe('generatePythonExport', () => {
  const compositeRegistry: ModuleRegistry = {
    ...starterDefinitionRegistry,
    SymbolRoundTripComposite: symbolRoundTripComposite,
    ForwardedShiftComposite: forwardedShiftComposite,
    ClockedRotorComposite: clockedRotorComposite,
    NestedComposite: nestedComposite,
    NestedForwardedComposite: nestedForwardedComposite,
    NestedClockedRotorComposite: nestedClockedRotorComposite,
    CompositeContainingIterator: compositeContainingIterator,
    ForwardedIteratorComposite: forwardedIteratorComposite,
    SteppingRotorComposite: steppingRotorComposite,
    SteppingRotorIterator: steppingRotorIterator,
    TemporalIteratorContainingComposite: temporalIteratorContainingComposite,
  };

  it('matches executeProject for a bridge-heavy stateless workspace', () => {
    const project: Project = {
      modules: [
        { id: 'ascii-src', defId: 'AsciiSource', params: { value: 'A' } },
        { id: 'bits-to-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'ascii-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'ascii-src', port: 'out' },
          to: { moduleId: 'bits-to-ascii', port: 'in' },
        },
        {
          from: { moduleId: 'bits-to-ascii', port: 'out' },
          to: { moduleId: 'ascii-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a direct plugboard workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'a' } },
        {
          id: 'plug-1',
          defId: 'Plugboard',
          params: {
            wiring: ['B', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
          },
        },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'plug-1', port: 'in' } },
        { from: { moduleId: 'plug-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Module: plug-1 [Plugboard]');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a routing and structural transform workspace', () => {
    const project: Project = {
      modules: [
        { id: 'payload-bits', defId: 'BitSource', params: { stream: [1] } },
        { id: 'route-select', defId: 'BitSource', params: { stream: [1, 0] } },
        { id: 'router-1', defId: 'MultiRouter', params: { routeCount: '4' } },
        { id: 'join-left', defId: 'BitSource', params: { stream: [0, 1] } },
        { id: 'join-1', defId: 'BitJoin', params: {} },
        { id: 'pad-1', defId: 'BitPad', params: { targetWidth: 8, side: 'left', padBit: '0' } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'route-select', port: 'out' },
          to: { moduleId: 'router-1', port: 'select' },
        },
        {
          from: { moduleId: 'payload-bits', port: 'out' },
          to: { moduleId: 'router-1', port: 'in' },
        },
        {
          from: { moduleId: 'join-left', port: 'out' },
          to: { moduleId: 'join-1', port: 'a' },
        },
        {
          from: { moduleId: 'router-1', port: 'out2' },
          to: { moduleId: 'join-1', port: 'b' },
        },
        {
          from: { moduleId: 'join-1', port: 'out' },
          to: { moduleId: 'pad-1', port: 'in' },
        },
        {
          from: { moduleId: 'pad-1', port: 'out' },
          to: { moduleId: 'hex-1', port: 'in' },
        },
        {
          from: { moduleId: 'hex-1', port: 'out' },
          to: { moduleId: 'hex-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for an s-box workspace', () => {
    const project: Project = {
      modules: [
        { id: 'nibble-src', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'sbox-1', defId: 'SBox', params: { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'nibble-src', port: 'out' },
          to: { moduleId: 'sbox-1', port: 'in' },
        },
        {
          from: { moduleId: 'sbox-1', port: 'out' },
          to: { moduleId: 'bits-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a shipped composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'A' } },
        { id: 'roundtrip-1', defId: 'SymbolRoundTripComposite', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'roundtrip-1', port: 'in' } },
        { from: { moduleId: 'roundtrip-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def composite_SymbolRoundTripComposite');
    expect(pythonSource).toContain('# Composite helper: SymbolRoundTripComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a user-authored forwarded composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'bits-1', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'mask-1', defId: 'BitSource', params: { stream: [0, 1, 0, 0] } },
        {
          id: 'comp-1',
          defId: 'ForwardedShiftComposite',
          params: { rotateMode: 'rotate-right' },
        },
        { id: 'out-1', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'mask-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'mask' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Composite helper: ForwardedShiftComposite');
    expect(pythonSource).toContain('param_rotateMode');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a shipped nested composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'A' } },
        { id: 'nested-1', defId: 'NestedComposite', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'nested-1', port: 'in' } },
        { from: { moduleId: 'nested-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def composite_SymbolRoundTripComposite');
    expect(pythonSource).toContain('def composite_NestedComposite');
    expect(pythonSource.indexOf('def composite_SymbolRoundTripComposite')).toBeLessThan(
      pythonSource.indexOf('def composite_NestedComposite'),
    );
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a user-authored nested forwarded composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'bits-1', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'mask-1', defId: 'BitSource', params: { stream: [0, 1, 0, 0] } },
        {
          id: 'comp-1',
          defId: 'NestedForwardedComposite',
          params: { rotateMode: 'rotate-right' },
        },
        { id: 'out-1', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'mask-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'mask' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def composite_ForwardedShiftComposite');
    expect(pythonSource).toContain('def composite_NestedForwardedComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeTickedProject for a temporal composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'comp-1', defId: 'ClockedRotorComposite', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'comp-1', port: 'clock' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def composite_ClockedRotorComposite_init_state');
    expect(pythonSource).toContain('def composite_ClockedRotorComposite_tick');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, compositeRegistry));
  });

  it('matches executeTickedProject for a temporal nested composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'comp-1', defId: 'NestedClockedRotorComposite', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'comp-1', port: 'clock' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def composite_ClockedRotorComposite_init_state');
    expect(pythonSource).toContain('def composite_NestedClockedRotorComposite_init_state');
    expect(pythonSource.indexOf('def composite_ClockedRotorComposite_init_state')).toBeLessThan(
      pythonSource.indexOf('def composite_NestedClockedRotorComposite_init_state'),
    );
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a shipped iterator-containing composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'left-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'right-1', defId: 'HexSource', params: { value: 'A5' } },
        { id: 'comp-1', defId: 'ToyCompressionHashComposite', params: { digestRounds: 3 } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'left' } },
        { from: { moduleId: 'right-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'right' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def iterator_ToyCompressionHashComposite_digest_rounds');
    expect(pythonSource).toContain('iterator_ToyCompressionHashComposite_digest_rounds(');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a user-authored iterator-containing composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'comp-1', defId: 'ForwardedIteratorComposite', params: { rounds: 3 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def iterator_ForwardedIteratorComposite_iter');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeTickedProject for a temporal iterator-containing composite workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'comp-1', defId: 'TemporalIteratorContainingComposite', params: {} },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'comp-1', port: 'in' } },
        { from: { moduleId: 'comp-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def iterator_TemporalIteratorContainingComposite_iter_init_state');
    expect(pythonSource).toContain('def iterator_TemporalIteratorContainingComposite_iter_tick');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a shipped iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'iter-1', defId: 'ByteRoundIterator', params: { iterationCount: 2 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def iterator_iter_1');
    expect(pythonSource).toContain('# Iterator helper: ByteRoundIterator [iter-1]');
    expect(pythonSource).toContain('# Round 1: ByteRoundComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a keyed iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'key-1', defId: 'HexSource', params: { value: 'A55A' } },
        { id: 'iter-1', defId: 'KeyedByteRoundIterator', params: { iterationCount: 2 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'key-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'key' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('requires a key bus of exactly 16 bits');
    expect(pythonSource).toContain('# Round 2: KeyedByteRoundComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a feistel iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'key-1', defId: 'HexSource', params: { value: 'AB' } },
        { id: 'iter-1', defId: 'FeistelRoundIterator', params: { iterationCount: 2 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'key-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'key' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Iterator helper: FeistelRoundIterator [iter-1]');
    expect(pythonSource).toContain('# Round 2: FeistelRoundComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a hash-digest iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '3C' } },
        { id: 'iter-1', defId: 'HashDigestRoundIterator', params: { iterationCount: 4 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Iterator helper: HashDigestRoundIterator [iter-1]');
    expect(pythonSource).toContain('# Round 4: HashDigestRoundComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a sponge-mix iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'hex-1', defId: 'HexSource', params: { value: '1234' } },
        { id: 'iter-1', defId: 'SpongeMixRoundIterator', params: { iterationCount: 2 } },
        { id: 'hex-2', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'hex-2', port: 'in' } },
        { from: { moduleId: 'hex-2', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Iterator helper: SpongeMixRoundIterator [iter-1]');
    expect(pythonSource).toContain('# Round 2: SpongeMixRoundComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, compositeRegistry));
  });

  it('matches executeTickedProject for a temporal iterator workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'iter-1', defId: 'SteppingRotorIterator', params: { iterationCount: 2 } },
        { id: 'out-1', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'iter-1', port: 'in' } },
        { from: { moduleId: 'iter-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, compositeRegistry);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('def iterator_iter_1_init_state');
    expect(pythonSource).toContain('def iterator_iter_1_tick');
    expect(pythonSource).toContain('# Round 2: SteppingRotorComposite');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, compositeRegistry));
  });

  it('matches executeProject for a modular arithmetic workspace', () => {
    const project: Project = {
      modules: [
        { id: 'left-word', defId: 'BitSource', params: { stream: [1, 1, 0, 1] } },
        { id: 'right-word', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'add-1', defId: 'AddMod', params: {} },
        { id: 'sub-1', defId: 'SubMod', params: {} },
        { id: 'mod-1', defId: 'Modulo', params: { modulus: 7 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'left-word', port: 'out' },
          to: { moduleId: 'add-1', port: 'a' },
        },
        {
          from: { moduleId: 'right-word', port: 'out' },
          to: { moduleId: 'add-1', port: 'b' },
        },
        {
          from: { moduleId: 'add-1', port: 'out' },
          to: { moduleId: 'sub-1', port: 'a' },
        },
        {
          from: { moduleId: 'right-word', port: 'out' },
          to: { moduleId: 'sub-1', port: 'b' },
        },
        {
          from: { moduleId: 'sub-1', port: 'out' },
          to: { moduleId: 'mod-1', port: 'in' },
        },
        {
          from: { moduleId: 'mod-1', port: 'out' },
          to: { moduleId: 'bits-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a control and arithmetic workspace', () => {
    const project: Project = {
      modules: [
        { id: 'bit-a', defId: 'BitSource', params: { stream: [1] } },
        { id: 'bit-b', defId: 'BitSource', params: { stream: [0] } },
        { id: 'bit-c', defId: 'BitSource', params: { stream: [1] } },
        { id: 'majority-1', defId: 'Majority', params: {} },
        { id: 'left-word', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'right-word', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'mul-1', defId: 'MulMod', params: {} },
        { id: 'gt-1', defId: 'GreaterThan', params: {} },
        { id: 'decision-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bit-a', port: 'out' }, to: { moduleId: 'majority-1', port: 'a' } },
        { from: { moduleId: 'bit-b', port: 'out' }, to: { moduleId: 'majority-1', port: 'b' } },
        { from: { moduleId: 'bit-c', port: 'out' }, to: { moduleId: 'majority-1', port: 'c' } },
        { from: { moduleId: 'left-word', port: 'out' }, to: { moduleId: 'mul-1', port: 'a' } },
        { from: { moduleId: 'right-word', port: 'out' }, to: { moduleId: 'mul-1', port: 'b' } },
        { from: { moduleId: 'mul-1', port: 'out' }, to: { moduleId: 'gt-1', port: 'a' } },
        { from: { moduleId: 'left-word', port: 'out' }, to: { moduleId: 'gt-1', port: 'b' } },
        { from: { moduleId: 'gt-1', port: 'out' }, to: { moduleId: 'decision-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a byte-structure workspace', () => {
    const project: Project = {
      modules: [
        { id: 'payload', defId: 'HexSource', params: { value: '12345678' } },
        { id: 'rotate-1', defId: 'ByteRotate', params: { amount: 1, direction: 'left' } },
        { id: 'swap-1', defId: 'ByteSwap', params: {} },
        { id: 'unpad-1', defId: 'BitUnpad', params: { originalWidth: 16, side: 'right' } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'payload', port: 'out' }, to: { moduleId: 'rotate-1', port: 'in' } },
        { from: { moduleId: 'rotate-1', port: 'out' }, to: { moduleId: 'swap-1', port: 'in' } },
        { from: { moduleId: 'swap-1', port: 'out' }, to: { moduleId: 'unpad-1', port: 'in' } },
        { from: { moduleId: 'unpad-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a protocol-material workspace', () => {
    const project: Project = {
      modules: [
        { id: 'iv-1', defId: 'IV', params: { value: '1C', width: 8 } },
        { id: 'nonce-1', defId: 'Nonce', params: { value: 'A', width: 8 } },
        { id: 'join-1', defId: 'BitJoin', params: {} },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'iv-1', port: 'out' }, to: { moduleId: 'join-1', port: 'a' } },
        { from: { moduleId: 'nonce-1', port: 'out' }, to: { moduleId: 'join-1', port: 'b' } },
        { from: { moduleId: 'join-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a symbol-structure workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'MATH' } },
        { id: 'permute-1', defId: 'SymbolPermutation', params: { order: '2,0,3,1' } },
        { id: 'window-1', defId: 'SymbolWindow', params: { start: 1, width: 2 } },
        { id: 'text-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'permute-1', port: 'in' } },
        { from: { moduleId: 'permute-1', port: 'out' }, to: { moduleId: 'window-1', port: 'in' } },
        { from: { moduleId: 'window-1', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a stateless baudot decoding workspace', () => {
    const project: Project = {
      modules: [
        { id: 'baudot-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 1, 1, 1, 0, 0, 0, 0] } },
        { id: 'decode-1', defId: 'BitsToBaudot', params: {} },
        { id: 'baudot-out', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'baudot-bits', port: 'out' }, to: { moduleId: 'decode-1', port: 'in' } },
        { from: { moduleId: 'decode-1', port: 'out' }, to: { moduleId: 'baudot-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a direct baudot source workspace', () => {
    const project: Project = {
      modules: [
        { id: 'baudot-src', defId: 'BaudotSource', params: { value: 'AB' } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'baudot-src', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Module: baudot-src [BaudotSource]');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a direct mod-exp workspace', () => {
    const project: Project = {
      modules: [
        { id: 'base-1', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'exp-1', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'pow-1', defId: 'ModExp', params: { modulus: 13 } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'base-1', port: 'out' }, to: { moduleId: 'pow-1', port: 'base' } },
        { from: { moduleId: 'exp-1', port: 'out' }, to: { moduleId: 'pow-1', port: 'exp' } },
        { from: { moduleId: 'pow-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a direct mod-inverse workspace', () => {
    const project: Project = {
      modules: [
        { id: 'bits-1', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'inv-1', defId: 'ModInverse', params: { modulus: 11 } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits-1', port: 'out' }, to: { moduleId: 'inv-1', port: 'in' } },
        { from: { moduleId: 'inv-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a clocked counter workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'counter-1', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-1', port: 'clock' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a baudot source decoding workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
        { id: 'counter-1', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        { id: 'baudot-src', defId: 'BaudotSource', params: { value: 'AB' } },
        { id: 'decode-1', defId: 'BitsToBaudot', params: {} },
        { id: 'baudot-out', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-1', port: 'clock' } },
        { from: { moduleId: 'baudot-src', port: 'out' }, to: { moduleId: 'decode-1', port: 'in' } },
        { from: { moduleId: 'decode-1', port: 'out' }, to: { moduleId: 'baudot-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a gated counter workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'counter-1', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'counter-2', defId: 'Counter', params: { width: 3, value: 0, step: 2 } },
        { id: 'gt-1', defId: 'GreaterThan', params: {} },
        { id: 'gate-1', defId: 'Gate', params: {} },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-1', port: 'clock' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-2', port: 'clock' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'gt-1', port: 'a' } },
        { from: { moduleId: 'counter-2', port: 'out' }, to: { moduleId: 'gt-1', port: 'b' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'gt-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a clocked lfsr workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'lfsr-1', defId: 'LFSR', params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'lfsr-1', port: 'clock' } },
        { from: { moduleId: 'lfsr-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for an lfsr-controlled gating workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'lfsr-1', defId: 'LFSR', params: { seed: [1, 0, 1], taps: '0,1', outputLength: 1 } },
        { id: 'payload', defId: 'BitSource', params: { stream: [1, 1, 0, 1] } },
        { id: 'gate-1', defId: 'Gate', params: {} },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'lfsr-1', port: 'clock' } },
        { from: { moduleId: 'payload', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'lfsr-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a stepping rotor workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        {
          id: 'rotor-1',
          defId: 'Rotor',
          params: {
            wiring: ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'],
            position: 0,
            ringOffset: 0,
            notches: 'Q',
          },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-1', port: 'in' } },
        { from: { moduleId: 'rotor-1', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Module: rotor-1 [Rotor]');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a rotor turnover workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAA' } },
        {
          id: 'rotor-1',
          defId: 'Rotor',
          params: {
            wiring: ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'],
            position: 0,
            ringOffset: 0,
            notches: 'A',
          },
        },
        { id: 'payload', defId: 'BitSource', params: { stream: [1, 1, 1] } },
        { id: 'gate-1', defId: 'Gate', params: {} },
        { id: 'text-out', defId: 'Output', params: {} },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-1', port: 'in' } },
        { from: { moduleId: 'rotor-1', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
        { from: { moduleId: 'payload', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'rotor-1', port: 'turnover' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a clock-gated rotor workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 2, offset: 0, length: 4 } },
        {
          id: 'rotor-1',
          defId: 'Rotor',
          params: {
            wiring: ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'],
            position: 0,
            ringOffset: 0,
            notches: 'Q',
          },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-1', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'rotor-1', port: 'clock' } },
        { from: { moduleId: 'rotor-1', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a rotor return path workspace', () => {
    const rotorWiring = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const reflectorWiring = ['Y', 'R', 'U', 'H', 'Q', 'S', 'L', 'D', 'P', 'X', 'N', 'G', 'O', 'K', 'M', 'I', 'E', 'B', 'F', 'Z', 'C', 'W', 'V', 'J', 'A', 'T'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        {
          id: 'reflector-1',
          defId: 'Reflector',
          params: { wiring: reflectorWiring },
        },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: { linkedRotorId: 'rotor-fwd', wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector-1', port: 'in' } },
        { from: { moduleId: 'reflector-1', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Module: rotor-rev [RotorReverse]');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a stepped rotor return path workspace', () => {
    const rotorWiring = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const reflectorWiring = ['Y', 'R', 'U', 'H', 'Q', 'S', 'L', 'D', 'P', 'X', 'N', 'G', 'O', 'K', 'M', 'I', 'E', 'B', 'F', 'Z', 'C', 'W', 'V', 'J', 'A', 'T'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        { id: 'reflector-1', defId: 'Reflector', params: { wiring: reflectorWiring } },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: { linkedRotorId: 'rotor-fwd', wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'rotor-fwd', port: 'clock' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector-1', port: 'in' } },
        { from: { moduleId: 'reflector-1', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a plugboard-plus-rotor path workspace', () => {
    const rotorWiring = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const reflectorWiring = ['Y', 'R', 'U', 'H', 'Q', 'S', 'L', 'D', 'P', 'X', 'N', 'G', 'O', 'K', 'M', 'I', 'E', 'B', 'F', 'Z', 'C', 'W', 'V', 'J', 'A', 'T'];
    const plugboardWiring = ['B', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'plug-in', defId: 'Plugboard', params: { wiring: plugboardWiring } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        { id: 'reflector-1', defId: 'Reflector', params: { wiring: reflectorWiring } },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: { linkedRotorId: 'rotor-fwd', wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'Q' },
        },
        { id: 'plug-out', defId: 'Plugboard', params: { wiring: plugboardWiring } },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'plug-in', port: 'in' } },
        { from: { moduleId: 'plug-in', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'rotor-fwd', port: 'clock' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector-1', port: 'in' } },
        { from: { moduleId: 'reflector-1', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'plug-out', port: 'in' } },
        { from: { moduleId: 'plug-out', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('# Module: plug-in [Plugboard]');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject when linked reverse turnover is used downstream', () => {
    const rotorWiring = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const reflectorWiring = ['Y', 'R', 'U', 'H', 'Q', 'S', 'L', 'D', 'P', 'X', 'N', 'G', 'O', 'K', 'M', 'I', 'E', 'B', 'F', 'Z', 'C', 'W', 'V', 'J', 'A', 'T'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AA' } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'A' },
        },
        { id: 'reflector-1', defId: 'Reflector', params: { wiring: reflectorWiring } },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: { linkedRotorId: 'rotor-fwd', wiring: rotorWiring, position: 0, ringOffset: 0, notches: 'A' },
        },
        { id: 'payload', defId: 'BitSource', params: { stream: [1, 1] } },
        { id: 'gate-1', defId: 'Gate', params: {} },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector-1', port: 'in' } },
        { from: { moduleId: 'reflector-1', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'payload', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'turnover' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject when one rotor turnover steps a second rotor', () => {
    const rotorWiringA = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const rotorWiringB = ['A', 'J', 'D', 'K', 'S', 'I', 'R', 'U', 'X', 'B', 'L', 'H', 'W', 'T', 'M', 'C', 'Q', 'G', 'Z', 'N', 'P', 'Y', 'F', 'V', 'O', 'E'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        {
          id: 'rotor-a',
          defId: 'Rotor',
          params: { wiring: rotorWiringA, position: 0, ringOffset: 0, notches: 'A,B' },
        },
        {
          id: 'rotor-b',
          defId: 'Rotor',
          params: { wiring: rotorWiringB, position: 0, ringOffset: 0, notches: 'E' },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-a', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'rotor-a', port: 'clock' } },
        { from: { moduleId: 'rotor-a', port: 'turnover' }, to: { moduleId: 'rotor-b', port: 'clock' } },
        { from: { moduleId: 'rotor-a', port: 'out' }, to: { moduleId: 'rotor-b', port: 'in' } },
        { from: { moduleId: 'rotor-b', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('step_m_rotor_b = _is_active_control_pulse(m_rotor_a["turnover"])');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject when gated turnover prevents a downstream rotor from advancing every tick', () => {
    const rotorWiringA = ['E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'];
    const rotorWiringB = ['A', 'J', 'D', 'K', 'S', 'I', 'R', 'U', 'X', 'B', 'L', 'H', 'W', 'T', 'M', 'C', 'Q', 'G', 'Z', 'N', 'P', 'Y', 'F', 'V', 'O', 'E'];
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAAAA' } },
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'enable-1', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 1, 0] } },
        {
          id: 'rotor-a',
          defId: 'Rotor',
          params: { wiring: rotorWiringA, position: 0, ringOffset: 0, notches: 'A,B' },
        },
        { id: 'gate-1', defId: 'Gate', params: {} },
        {
          id: 'rotor-b',
          defId: 'Rotor',
          params: { wiring: rotorWiringB, position: 0, ringOffset: 0, notches: 'E' },
        },
        { id: 'text-out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'rotor-a', port: 'in' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'rotor-a', port: 'clock' } },
        { from: { moduleId: 'enable-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'rotor-a', port: 'turnover' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'rotor-b', port: 'clock' } },
        { from: { moduleId: 'rotor-a', port: 'out' }, to: { moduleId: 'rotor-b', port: 'in' } },
        { from: { moduleId: 'rotor-b', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a double-step-style three-rotor stepping path', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        {
          id: 'left',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 2,
            notches: 'Q',
          },
        },
        {
          id: 'middle',
          defId: 'Rotor',
          params: {
            wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE'.split(''),
            position: 4,
            ringOffset: 0,
            notches: 'E',
          },
        },
        {
          id: 'right',
          defId: 'Rotor',
          params: {
            wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
            position: 15,
            ringOffset: 0,
            notches: 'Q',
          },
        },
        { id: 'middle-step-or', defId: 'OR', params: {} },
        { id: 'left-gate', defId: 'Gate', params: {} },
        { id: 'out', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'right', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'right', port: 'clock' } },
        { from: { moduleId: 'right', port: 'turnover' }, to: { moduleId: 'middle-step-or', port: 'a' } },
        { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'middle-step-or', port: 'b' } },
        { from: { moduleId: 'middle-step-or', port: 'out' }, to: { moduleId: 'middle', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'left-gate', port: 'in' } },
        { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'left-gate', port: 'control' } },
        { from: { moduleId: 'left-gate', port: 'out' }, to: { moduleId: 'left', port: 'clock' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
        { from: { moduleId: 'middle', port: 'out' }, to: { moduleId: 'left', port: 'in' } },
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(pythonSource).toContain('step_m_middle = _is_active_control_pulse(m_middle_step_or["out"])');
    expect(pythonSource).toContain('step_m_left = _is_active_control_pulse(m_left_gate["out"])');
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });
});
