import type { ModuleDef } from '../types';
import { hexToBits, sanitizeHex } from './hex-source';

export const HexSequenceToBits: ModuleDef = {
  id: 'HexSequenceToBits',
  name: 'Hex Sequence → Bits',
  inputs: [{ name: 'in', type: 'symbol', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('HexSequenceToBits expects a symbol signal');
    }

    return {
      out: { type: 'bits', value: hexToBits(sanitizeHex(signal.value)) },
    };
  },
};
