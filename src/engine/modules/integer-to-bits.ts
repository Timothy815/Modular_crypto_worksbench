import type { ModuleDef } from '../types';
import { normalizePositiveInteger, unsignedBigIntToBits } from './bit-word';
import { normalizeUnsignedIntegerSignalValue, parseUnsignedIntegerString } from './integer-signal';

export const IntegerToBits: ModuleDef = {
  id: 'IntegerToBits',
  name: 'Integer → Bits',
  inputs: [{ name: 'in', type: 'integer' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    width: {
      key: 'width',
      label: 'Width',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Number of output bits to emit. The integer must fit exactly in this width.',
    },
  },
  evaluate: (inputs, params) => {
    const width = normalizePositiveInteger(params.width, 'IntegerToBits', 'width');
    const normalizedValue = normalizeUnsignedIntegerSignalValue(inputs.in.value, 'IntegerToBits');
    const value = parseUnsignedIntegerString(normalizedValue, 'IntegerToBits');
    const maxValue = 1n << BigInt(width);
    if (value >= maxValue) {
      throw new Error(`IntegerToBits cannot fit ${normalizedValue} into ${width} bits`);
    }

    return {
      out: {
        type: 'bits',
        value: unsignedBigIntToBits(value, width),
      },
    };
  },
};
