import { describe, expect, it } from 'vitest';

import { AsciiSource } from './modules/ascii-source';
import { AddMod } from './modules/add-mod';
import { AND } from './modules/and';
import { AtLeast } from './modules/at-least';
import { BaudotSource } from './modules/baudot-source';
import { BitPad } from './modules/bit-pad';
import { BitSource } from './modules/bit-source';
import { BitSplit } from './modules/bit-split';
import { Counter } from './modules/counter';
import { Equals } from './modules/equals';
import { Gate } from './modules/gate';
import { HexSource } from './modules/hex-source';
import { IV } from './modules/iv';
import { Majority } from './modules/majority';
import { Modulo } from './modules/modulo';
import { Mux } from './modules/mux';
import { Nonce } from './modules/nonce';
import { NOT } from './modules/not';
import { OR } from './modules/or';
import { Permutation } from './modules/permutation';
import { Plugboard } from './modules/plugboard';
import { Reflector } from './modules/reflector';
import { Rotor } from './modules/rotor';
import { Salt } from './modules/salt';
import { SBox } from './modules/s-box';
import { SubMod } from './modules/sub-mod';
import { XOR } from './modules/xor';
import type { ModuleRegistry, Project } from './types';
import { validateProject } from './validation';

const registry: ModuleRegistry = {
  Source: {
    id: 'Source',
    name: 'Source',
    inputs: [],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: () => ({ out: { type: 'symbol', value: 'A' } }),
  },
  Sink: {
    id: 'Sink',
    name: 'Sink',
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [],
    paramSchema: {
      mode: {
        key: 'mode',
        label: 'Mode',
        kind: 'select',
        defaultValue: 'strict',
        required: true,
        options: [
          { label: 'Strict', value: 'strict' },
          { label: 'Lenient', value: 'lenient' },
        ],
      },
    },
    evaluate: () => ({}),
  },
  Loop: {
    id: 'Loop',
    name: 'Loop',
    inputs: [{ name: 'in', type: 'symbol' }],
    outputs: [{ name: 'out', type: 'symbol' }],
    paramSchema: {},
    evaluate: (inputs) => ({ out: inputs.in }),
  },
  [BitSource.id]: BitSource,
  [AsciiSource.id]: AsciiSource,
  [BaudotSource.id]: BaudotSource,
  [HexSource.id]: HexSource,
  [IV.id]: IV,
  [Majority.id]: Majority,
  [Mux.id]: Mux,
  [Nonce.id]: Nonce,
  [Salt.id]: Salt,
  [XOR.id]: XOR,
  [AND.id]: AND,
  [OR.id]: OR,
  [NOT.id]: NOT,
  [Counter.id]: Counter,
  [Equals.id]: Equals,
  [AtLeast.id]: AtLeast,
  [Gate.id]: Gate,
  [AddMod.id]: AddMod,
  [SubMod.id]: SubMod,
  [Modulo.id]: Modulo,
  [Permutation.id]: Permutation,
  [Rotor.id]: Rotor,
  [Plugboard.id]: Plugboard,
  [Reflector.id]: Reflector,
  [SBox.id]: SBox,
  [BitSplit.id]: BitSplit,
  [BitPad.id]: BitPad,
};

describe('validateProject', () => {
  it('rejects signal type mismatches', () => {
    const project: Project = {
      modules: [
        { id: 'source-1', defId: 'Source', params: {} },
        { id: 'sink-1', defId: 'Sink', params: { mode: 'strict' } },
      ],
      connections: [
        {
          from: { moduleId: 'source-1', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-type-mismatch')).toBe(true);
  });

  it('rejects cycles', () => {
    const project: Project = {
      modules: [
        { id: 'a', defId: 'Loop', params: {} },
        { id: 'b', defId: 'Loop', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'a', port: 'out' },
          to: { moduleId: 'b', port: 'in' },
        },
        {
          from: { moduleId: 'b', port: 'out' },
          to: { moduleId: 'a', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'cycle-detected')).toBe(true);
  });

  it('rejects missing required params', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: {} }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'missing-required-param')).toBe(true);
  });

  it('rejects unknown params', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: { mode: 'strict', extra: true } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unknown-param')).toBe(true);
  });

  it('rejects invalid select options', () => {
    const project: Project = {
      modules: [{ id: 'sink-1', defId: 'Sink', params: { mode: 'broken' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-param-option')).toBe(true);
  });

  it('rejects duplicate incoming edges to one input', () => {
    const project: Project = {
      modules: [
        { id: 'source-1', defId: 'Source', params: {} },
        { id: 'source-2', defId: 'Source', params: {} },
        { id: 'sink-1', defId: 'Sink', params: { mode: 'strict' } },
      ],
      connections: [
        {
          from: { moduleId: 'source-1', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
        {
          from: { moduleId: 'source-2', port: 'out' },
          to: { moduleId: 'sink-1', port: 'in' },
        },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'duplicate-input-connection')).toBe(true);
  });

  it('rejects unknown module definitions', () => {
    const project: Project = {
      modules: [{ id: 'ghost', defId: 'MissingDef', params: {} }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unknown-module-def')).toBe(true);
  });

  it('rejects malformed permutation order params before execution', () => {
    const project: Project = {
      modules: [{ id: 'permute-1', defId: 'Permutation', params: { order: '0,1,X,3' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'permute-1' &&
          issue.message.includes('Permutation order must contain only non-negative integers'),
      ),
    ).toBe(true);
  });

  it('rejects malformed s-box tables before execution', () => {
    const project: Project = {
      modules: [{ id: 'sbox-1', defId: 'SBox', params: { table: '0,1,2' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'sbox-1' &&
          issue.message.includes('SBox table length must be a power of two'),
      ),
    ).toBe(true);
  });

  it('rejects malformed reflector wiring before execution', () => {
    const project: Project = {
      modules: [
        {
          id: 'reflector-1',
          defId: 'Reflector',
          params: { wiring: 'BCDEFGHIJKLMNOPQRSTUVWXYZA'.split('') },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'reflector-1' &&
          issue.message.includes('Reflector wiring must be involutive'),
      ),
    ).toBe(true);
  });

  it('rejects malformed plugboard wiring before execution', () => {
    const project: Project = {
      modules: [
        {
          id: 'plugboard-1',
          defId: 'Plugboard',
          params: { wiring: 'BCADEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'plugboard-1' &&
          issue.message.includes('Plugboard wiring must be reciprocal'),
      ),
    ).toBe(true);
  });

  it('rejects rotor ring offsets outside the alphabet range', () => {
    const project: Project = {
      modules: [
        {
          id: 'rotor-1',
          defId: 'Rotor',
          params: {
            wiring: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
            position: 0,
            ringOffset: 26,
          },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'rotor-1' &&
          issue.message.includes('Ring offset must be an integer from 0 to 25'),
      ),
    ).toBe(true);
  });

  it('rejects malformed rotor notch lists before execution', () => {
    const project: Project = {
      modules: [
        {
          id: 'rotor-1',
          defId: 'Rotor',
          params: {
            wiring: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
            position: 0,
            notches: 'Q, 3',
          },
        },
      ],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'rotor-1' &&
          issue.message.includes('Notches must use uppercase single letters'),
      ),
    ).toBe(true);
  });

  it('rejects malformed hex source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'hex-1', defId: 'HexSource', params: { value: 'G1' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'hex-1' &&
          issue.message.includes('HexSource accepts only hexadecimal characters 0-9 and A-F'),
      ),
    ).toBe(true);
  });

  it('rejects protocol-material width values that are not multiples of 4', () => {
    const project: Project = {
      modules: [{ id: 'iv-1', defId: 'IV', params: { value: 'A3', width: 10 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'iv-1' &&
          issue.message.includes('multiple of 4 bits'),
      ),
    ).toBe(true);
  });

  it('rejects protocol-material values whose hex width exceeds the declared width', () => {
    const project: Project = {
      modules: [{ id: 'nonce-1', defId: 'Nonce', params: { value: 'A3F1', width: 8 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'nonce-1' &&
          issue.message.includes('must fit within the declared width'),
      ),
    ).toBe(true);
  });

  it('accepts protocol-material values that are shorter than the declared width', () => {
    const project: Project = {
      modules: [{ id: 'salt-1', defId: 'Salt', params: { value: 'A3', width: 16 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(true);
  });

  it('rejects Majority when a statically known input is wider than one bit', () => {
    const project: Project = {
      modules: [
        { id: 'a', defId: 'BitSource', params: { stream: [1, 0] } },
        { id: 'b', defId: 'BitSource', params: { stream: [1] } },
        { id: 'c', defId: 'BitSource', params: { stream: [0] } },
        { id: 'vote', defId: 'Majority', params: {} },
      ],
      connections: [
        { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'vote', port: 'a' } },
        { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'vote', port: 'b' } },
        { from: { moduleId: 'c', port: 'out' }, to: { moduleId: 'vote', port: 'c' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'vote' &&
          issue.code === 'signal-width-mismatch' &&
          issue.message.includes('requires 1-bit inputs'),
      ),
    ).toBe(true);
  });

  it('rejects Mux when a statically known input is wider than one bit', () => {
    const project: Project = {
      modules: [
        { id: 'select', defId: 'BitSource', params: { stream: [1] } },
        { id: 'a', defId: 'BitSource', params: { stream: [1, 0] } },
        { id: 'b', defId: 'BitSource', params: { stream: [0] } },
        { id: 'mux', defId: 'Mux', params: {} },
      ],
      connections: [
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'mux', port: 'select' } },
        { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'mux', port: 'a' } },
        { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'mux', port: 'b' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'mux' &&
          issue.code === 'signal-width-mismatch' &&
          issue.message.includes('requires 1-bit inputs'),
      ),
    ).toBe(true);
  });

  it('rejects non-ascii source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'ascii-1', defId: 'AsciiSource', params: { value: 'é' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'ascii-1' &&
          issue.message.includes('AsciiSource accepts only 7-bit ASCII characters'),
      ),
    ).toBe(true);
  });

  it('rejects non-baudot source params before execution', () => {
    const project: Project = {
      modules: [{ id: 'baudot-1', defId: 'BaudotSource', params: { value: 'HELLO!' } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'baudot-1' &&
          issue.message.includes('BaudotSource accepts only letters A-Z and spaces in letters mode'),
      ),
    ).toBe(true);
  });

  it('rejects malformed counter params before execution', () => {
    const project: Project = {
      modules: [{ id: 'counter-1', defId: 'Counter', params: { width: 0, value: 0, step: 1 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'counter-1' &&
          issue.message.includes('positive integer'),
      ),
    ).toBe(true);
  });

  it('rejects equal-width binary operators when static source widths differ', () => {
    const project: Project = {
      modules: [
        { id: 'left', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'right', defId: 'BitSource', params: { stream: [1, 0, 1] } },
        { id: 'add', defId: 'AddMod', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'add', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'add', port: 'b' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-width-mismatch')).toBe(true);
  });

  it('rejects comparator inputs when static source widths differ', () => {
    const project: Project = {
      modules: [
        { id: 'left', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'right', defId: 'BitSource', params: { stream: [1, 0, 1] } },
        { id: 'equals', defId: 'Equals', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'equals', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'equals', port: 'b' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signal-width-mismatch')).toBe(true);
  });

  it('rejects modulo params larger than the statically known input width supports', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'mod', defId: 'Modulo', params: { modulus: 32 } },
      ],
      connections: [{ from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'mod', port: 'in' } }],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'mod' &&
          issue.message.includes('must not exceed the input word range'),
      ),
    ).toBe(true);
  });

  it('rejects BitSplit leftWidth that is not a positive integer', () => {
    const project: Project = {
      modules: [{ id: 'split', defId: 'BitSplit', params: { leftWidth: 0 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'split' &&
          issue.message.includes('leftWidth'),
      ),
    ).toBe(true);
  });

  it('rejects BitSplit leftWidth >= static input width', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 4 } },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'split' &&
          issue.message.includes('must be less than the input width'),
      ),
    ).toBe(true);
  });

  it('accepts valid BitSplit leftWidth within input width', () => {
    const project: Project = {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 0, 1, 0] } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 4 } },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
      ],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(true);
  });

  it('rejects BitPad targetWidth that is not a positive integer', () => {
    const project: Project = {
      modules: [{ id: 'pad', defId: 'BitPad', params: { targetWidth: 0 } }],
      connections: [],
    };

    const result = validateProject(project, registry);

    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (issue) =>
          issue.moduleId === 'pad' &&
          issue.message.includes('targetWidth'),
      ),
    ).toBe(true);
  });
});
