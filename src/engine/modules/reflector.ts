import type { ModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const Reflector: ModuleDef = {
  id: 'Reflector',
  name: 'Reflector',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: ALPHABET.split('').reverse(),
      required: true,
      description: 'Involutive mapping: each letter maps to its pair (wiring[i] maps i, and wiring[indexOf(wiring[i])] maps back)',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('Reflector expects a symbol signal');
    }

    const wiring = params.wiring as string[];
    const index = ALPHABET.indexOf(signal.value.toUpperCase());
    if (index === -1) {
      throw new Error(`Reflector: "${signal.value}" is not in the alphabet`);
    }

    return {
      out: { type: 'symbol', value: wiring[index] },
    };
  },
};
