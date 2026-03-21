import type { ModuleDef } from '../types';

export const BitSource: ModuleDef = {
  id: 'BitSource',
  name: 'Bit Source',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    stream: {
      key: 'stream',
      label: 'Bit Stream',
      kind: 'bits',
      defaultValue: [0, 0, 0, 0, 0],
      required: true,
      description: 'Static or repeating bit pattern',
    },
  },
  evaluate: (_inputs, params) => {
    const stream = params.stream;
    if (!Array.isArray(stream)) {
      throw new Error('BitSource requires a bits array');
    }
    return {
      out: { type: 'bits', value: stream as number[] },
    };
  },
};
