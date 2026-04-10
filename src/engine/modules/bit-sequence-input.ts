import type { ModuleDef } from '../types';

export const BitSequenceInput: ModuleDef = {
  id: 'BitSequenceInput',
  name: 'Bit Sequence Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    stream: {
      key: 'stream',
      label: 'Bit Sequence',
      kind: 'bits',
      defaultValue: [1, 0, 1, 1, 0, 0, 1, 1],
      required: true,
      description: 'A whole ordered bit buffer such as 10110011 or a longer repeated-key bit sequence.',
    },
  },
  evaluate: (_inputs, params) => {
    const stream = params.stream;
    if (!Array.isArray(stream)) {
      throw new Error('BitSequenceInput requires a bits array');
    }

    return {
      out: { type: 'bits', value: stream as number[] },
    };
  },
};
