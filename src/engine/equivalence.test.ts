import { describe, expect, it } from 'vitest';

import type { CompositeDef, IteratorDef } from './composites';
import { executeProject, executeTickedProject } from './executor';
import type { ModuleDef, ModuleInputs, ModuleRegistry, Project, StatefulModuleDef } from './types';

const RoundMix: ModuleDef = {
  id: 'RoundMix',
  name: 'Round Mix',
  inputs: [
    { name: 'in', type: 'bits' as const },
    { name: 'key', type: 'bits' as const },
  ],
  outputs: [{ name: 'out', type: 'bits' as const }],
  paramSchema: {},
  evaluate: (inputs: ModuleInputs) => {
    if (inputs.in.type !== 'bits' || inputs.key.type !== 'bits') {
      throw new Error('RoundMix expects bits signals.');
    }

    const data = inputs.in.value;
    const key = inputs.key.value;
    const length = Math.min(data.length, key.length);

    return {
      out: {
        type: 'bits',
        value: Array.from({ length }, (_, index) => {
          const rotated = data[(index + 1) % length] ?? 0;
          return rotated ^ (key[index] ?? 0);
        }),
      },
    };
  },
};

const StatefulRoundMix: StatefulModuleDef = {
  id: 'StatefulRoundMix',
  name: 'Stateful Round Mix',
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'key', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    offset: {
      key: 'offset',
      label: 'Offset',
      kind: 'number',
      defaultValue: 0,
    },
  },
  evaluate: (inputs, params) => {
    if (inputs.in.type !== 'bits' || inputs.key.type !== 'bits') {
      throw new Error('StatefulRoundMix expects bits signals.');
    }

    const data = inputs.in.value;
    const key = inputs.key.value;
    const length = Math.min(data.length, key.length);
    const offset = Number(params.offset ?? 0) % Math.max(1, length);

    return {
      out: {
        type: 'bits',
        value: Array.from({ length }, (_, index) => {
          const rotated = data[(index + offset + 1) % length] ?? 0;
          return rotated ^ (key[index] ?? 0);
        }),
      },
    };
  },
  advance: (params) => ({
    ...params,
    offset: Number(params.offset ?? 0) + 1,
  }),
};

function buildKeyedRoundComposite(id: string, internalDefId: string): CompositeDef {
  return {
    id,
    name: id,
    kind: 'composite',
    version: 1,
    inputs: [
      { name: 'in', type: 'bits' },
      { name: 'key', type: 'bits' },
    ],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    project: {
      modules: [
        {
          id: 'mix-1',
          defId: internalDefId,
          params: internalDefId === 'StatefulRoundMix' ? { offset: 0 } : {},
        },
      ],
      connections: [],
    },
    inputBindings: [
      { externalPort: 'in', internalModuleId: 'mix-1', internalPort: 'in' },
      { externalPort: 'key', internalModuleId: 'mix-1', internalPort: 'key' },
    ],
    outputBindings: [
      { externalPort: 'out', internalModuleId: 'mix-1', internalPort: 'out' },
    ],
  };
}

function buildIteratorDef(
  id: string,
  roundDefId: string,
  iterationCount: number,
  roundKeyWidth: number,
): IteratorDef {
  return {
    id,
    name: id,
    kind: 'iterator',
    version: 1,
    inputs: [
      { name: 'in', type: 'bits' },
      { name: 'key', type: 'bits' },
    ],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    roundDefId,
    iterationCount,
    roundKeyWidth,
  };
}

function buildPackagedKeyedComposite(
  id: string,
  roundDefId: string,
  iterationCount: number,
  roundKeyWidth: number,
): CompositeDef {
  return {
    id,
    name: id,
    kind: 'composite',
    version: 1,
    inputs: [
      { name: 'in', type: 'bits' },
      ...Array.from({ length: iterationCount }, (_, index) => ({
        name: `key-${index + 1}`,
        type: 'bits' as const,
      })),
    ],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {
      roundKeyWidth: {
        key: 'roundKeyWidth',
        label: 'Round Key Width',
        kind: 'number',
        defaultValue: roundKeyWidth,
      },
    },
    project: {
      modules: Array.from({ length: iterationCount }, (_, index) => ({
        id: `round-${index + 1}`,
        defId: roundDefId,
        params: {},
      })),
      connections: Array.from({ length: iterationCount - 1 }, (_, index) => ({
        from: { moduleId: `round-${index + 1}`, port: 'out' },
        to: { moduleId: `round-${index + 2}`, port: 'in' },
      })),
    },
    inputBindings: [
      { externalPort: 'in', internalModuleId: 'round-1', internalPort: 'in' },
      ...Array.from({ length: iterationCount }, (_, index) => ({
        externalPort: `key-${index + 1}`,
        internalModuleId: `round-${index + 1}`,
        internalPort: 'key',
      })),
    ],
    outputBindings: [
      { externalPort: 'out', internalModuleId: `round-${iterationCount}`, internalPort: 'out' },
    ],
  };
}

function buildHandStackedProject(roundDefId: string, iterationCount: number): Project {
  return {
    modules: Array.from({ length: iterationCount }, (_, index) => ({
      id: `round-${index + 1}`,
      defId: roundDefId,
      params: {},
    })),
    connections: Array.from({ length: iterationCount - 1 }, (_, index) => ({
      from: { moduleId: `round-${index + 1}`, port: 'out' },
      to: { moduleId: `round-${index + 2}`, port: 'in' },
    })),
  };
}

function buildIteratorProject(iteratorDefId: string): Project {
  return {
    modules: [{ id: 'rounds', defId: iteratorDefId, params: {} }],
    connections: [],
  };
}

function bitsFromNumber(value: number, width: number) {
  return Array.from({ length: width }, (_, index) => {
    const shift = width - index - 1;
    return (value >> shift) & 1;
  });
}

function buildKeyBus(iterationCount: number, roundKeyWidth: number) {
  return Array.from({ length: iterationCount }, (_, index) =>
    bitsFromNumber((index * 37 + 19) % (1 << roundKeyWidth), roundKeyWidth),
  ).flat();
}

function splitKeyBus(keyBus: number[], roundKeyWidth: number) {
  return Array.from({ length: keyBus.length / roundKeyWidth }, (_, index) =>
    keyBus.slice(index * roundKeyWidth, (index + 1) * roundKeyWidth),
  );
}

function buildHandOverrides(
  iterationCount: number,
  inputBits: number[],
  keyBus: number[],
  roundKeyWidth: number,
): Record<string, ModuleInputs> {
  const keyChunks = splitKeyBus(keyBus, roundKeyWidth);
  const overrides: Record<string, ModuleInputs> = {};

  for (let index = 0; index < iterationCount; index += 1) {
    const moduleId = `round-${index + 1}`;
    overrides[moduleId] = {
      ...(index === 0 ? { in: { type: 'bits', value: inputBits } } : {}),
      key: { type: 'bits', value: keyChunks[index] ?? [] },
    };
  }

  return overrides;
}

function buildPackagedOverrides(
  inputBits: number[],
  keyBus: number[],
  roundKeyWidth: number,
): Record<string, ModuleInputs> {
  const keyChunks = splitKeyBus(keyBus, roundKeyWidth);

  return {
    stack: {
      in: { type: 'bits', value: inputBits },
      ...Object.fromEntries(
        keyChunks.map((chunk, index) => [`key-${index + 1}`, { type: 'bits', value: chunk }]),
      ),
    },
  };
}

describe('iterative equivalence', () => {
  it('matches a 16-round keyed iterator against hand-stacked and packaged keyed chains', () => {
    const roundCount = 16;
    const roundKeyWidth = 8;
    const keyedRoundComposite = buildKeyedRoundComposite('KeyedRoundComposite', 'RoundMix');
    const keyedIterator = buildIteratorDef(
      'KeyedRoundIterator16',
      keyedRoundComposite.id,
      roundCount,
      roundKeyWidth,
    );
    const packagedStack = buildPackagedKeyedComposite(
      'PackagedKeyedRoundStack16',
      keyedRoundComposite.id,
      roundCount,
      roundKeyWidth,
    );

    const registry: ModuleRegistry = {
      RoundMix,
      [keyedRoundComposite.id]: keyedRoundComposite,
      [keyedIterator.id]: keyedIterator,
      [packagedStack.id]: packagedStack,
    };

    const inputBits = bitsFromNumber(0xa3, 8);
    const keyBus = buildKeyBus(roundCount, roundKeyWidth);

    const handResult = executeProject(
      buildHandStackedProject(keyedRoundComposite.id, roundCount),
      registry,
      buildHandOverrides(roundCount, inputBits, keyBus, roundKeyWidth),
    );
    const packagedResult = executeProject(
      {
        modules: [{ id: 'stack', defId: packagedStack.id, params: {} }],
        connections: [],
      },
      registry,
      buildPackagedOverrides(inputBits, keyBus, roundKeyWidth),
    );
    const iteratorResult = executeProject(
      buildIteratorProject(keyedIterator.id),
      registry,
      {
        rounds: {
          in: { type: 'bits', value: inputBits },
          key: { type: 'bits', value: keyBus },
        },
      },
    );

    const handOutput = handResult.outputsByModuleId[`round-${roundCount}`]?.out;
    const packagedOutput = packagedResult.outputsByModuleId.stack?.out;
    const iteratorOutput = iteratorResult.outputsByModuleId.rounds?.out;

    expect(handOutput).toEqual(packagedOutput);
    expect(packagedOutput).toEqual(iteratorOutput);
    expect(iteratorResult.analysisTrace.filter((entry) => entry.moduleId.startsWith('rounds/round-')).length).toBe(
      roundCount * 2,
    );
  });

  it('matches a keyed iterator against a hand-stacked stateful chain across ticks', () => {
    const roundCount = 4;
    const roundKeyWidth = 4;
    const statefulRoundComposite = buildKeyedRoundComposite(
      'StatefulKeyedRoundComposite',
      'StatefulRoundMix',
    );
    const statefulIterator = buildIteratorDef(
      'StatefulKeyedRoundIterator4',
      statefulRoundComposite.id,
      roundCount,
      roundKeyWidth,
    );

    const registry: ModuleRegistry = {
      StatefulRoundMix,
      [statefulRoundComposite.id]: statefulRoundComposite,
      [statefulIterator.id]: statefulIterator,
    };

    const inputBits = bitsFromNumber(0x9, 4);
    const keyBus = buildKeyBus(roundCount, roundKeyWidth);
    const tickOverrides: Record<string, ModuleInputs>[] = Array.from({ length: 3 }, () => ({
      rounds: {
        in: { type: 'bits', value: inputBits },
        key: { type: 'bits', value: keyBus },
      },
    }));

    const handTickOverrides = Array.from({ length: 3 }, () =>
      buildHandOverrides(roundCount, inputBits, keyBus, roundKeyWidth),
    );

    const handResult = executeTickedProject(
      buildHandStackedProject(statefulRoundComposite.id, roundCount),
      registry,
      3,
      handTickOverrides,
    );
    const iteratorResult = executeTickedProject(
      buildIteratorProject(statefulIterator.id),
      registry,
      3,
      tickOverrides,
    );

    expect(
      handResult.ticks.map((tick) => tick.outputsByModuleId[`round-${roundCount}`]?.out),
    ).toEqual(iteratorResult.ticks.map((tick) => tick.outputsByModuleId.rounds?.out));
  });
});
