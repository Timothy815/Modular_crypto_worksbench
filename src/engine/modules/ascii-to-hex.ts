import type { ModuleDef } from '../types';

export const AsciiToHex: ModuleDef = {
  id: 'AsciiToHex',
  name: 'ASCII → Hex',
  inputs: [{ name: 'in', type: 'symbol', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('AsciiToHex expects a symbol signal');
    }

    const chars = signal.value;
    const hexBytes: string[] = [];
    for (const char of chars) {
      const code = char.charCodeAt(0);
      if (code > 0x7f) {
        throw new Error('AsciiToHex can only encode 7-bit ASCII characters (code points 0-127)');
      }
      hexBytes.push(code.toString(16).toUpperCase().padStart(2, '0'));
    }

    return {
      out: { type: 'symbol', value: hexBytes.join('') },
    };
  },
};
