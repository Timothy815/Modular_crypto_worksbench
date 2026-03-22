import type { StatefulModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const Rotor: StatefulModuleDef = {
  id: 'Rotor',
  name: 'Rotor',
  inputs: [
    { name: 'in', type: 'symbol' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: ALPHABET.split(''),
      required: true,
      description: 'Permutation mapping: wiring[i] is the output letter for input index i',
    },
    position: {
      key: 'position',
      label: 'Position',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current rotor offset (0-25)',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('Rotor expects a symbol signal');
    }

    const wiring = params.wiring as string[];
    const position = (params.position as number) ?? 0;

    const index = ALPHABET.indexOf(signal.value.toUpperCase());
    if (index === -1) {
      throw new Error(`Rotor: "${signal.value}" is not in the alphabet`);
    }

    // Shift input by rotor position, apply wiring, then shift back
    const shifted = (index + position) % 26;
    const mapped = ALPHABET.indexOf(wiring[shifted]);
    const unshifted = ((mapped - position) % 26 + 26) % 26;

    return {
      out: { type: 'symbol', value: ALPHABET[unshifted] },
    };
  },
  advance: (params) => ({
    ...params,
    position: (((params.position as number) ?? 0) + 1) % 26,
  }),
};
