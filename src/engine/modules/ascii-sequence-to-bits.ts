import type { ModuleDef } from '../types';
import { charToBits } from './ascii-char-to-bits';

export const AsciiSequenceToBits: ModuleDef = {
  id: 'AsciiSequenceToBits',
  name: 'ASCII Sequence → Bits',
  inputs: [{ name: 'in', type: 'symbol', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('AsciiSequenceToBits expects a symbol signal');
    }

    return {
      out: {
        type: 'bits',
        value: [...signal.value].flatMap((char) => {
          if (char.charCodeAt(0) > 0x7f) {
            throw new Error('AsciiSequenceToBits accepts only 7-bit ASCII characters');
          }
          return charToBits(char);
        }),
      },
    };
  },
};
