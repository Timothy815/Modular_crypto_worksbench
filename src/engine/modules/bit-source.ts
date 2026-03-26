import type { TickSliceableModuleDef } from '../types';

export const BitSource: TickSliceableModuleDef = {
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
      description: 'Static or repeating bit pattern. Accepts raw 0/1 text such as 01000001 01000010.',
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
  tickSlice: (params, tick) => {
    const stream = Array.isArray(params.stream) ? (params.stream as number[]) : [];
    const bit = tick < stream.length ? [stream[tick]] : [];
    return { ...params, stream: bit };
  },
  tickLength: (params) =>
    Array.isArray(params.stream) ? (params.stream as number[]).length : 0,
};
