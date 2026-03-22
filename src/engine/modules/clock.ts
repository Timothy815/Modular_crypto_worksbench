import type { TickSliceableModuleDef } from '../types';

/**
 * Compute a single pulse value for a given tick.
 * Returns 1 when (tick - offset) is a non-negative multiple of period, 0 otherwise.
 */
function pulse(tick: number, period: number, offset: number): number {
  if (period <= 0) return 0;
  const adjusted = tick - offset;
  if (adjusted < 0) return 0;
  return adjusted % period === 0 ? 1 : 0;
}

function clampedPeriod(params: Record<string, unknown>): number {
  return Math.max(1, Math.trunc(Number(params.period) || 1));
}

function clampedOffset(params: Record<string, unknown>): number {
  return Math.max(0, Math.trunc(Number(params.offset) || 0));
}

function clampedLength(params: Record<string, unknown>): number {
  return Math.max(0, Math.trunc(Number(params.length) || 0));
}

export const Clock: TickSliceableModuleDef = {
  id: 'Clock',
  name: 'Clock',
  inputs: [],
  outputs: [{ name: 'pulse', type: 'bits' }],
  paramSchema: {
    period: {
      key: 'period',
      label: 'Period',
      kind: 'number',
      defaultValue: 1,
      required: true,
      description: 'Emit a 1-pulse every N ticks (1 = every tick)',
    },
    offset: {
      key: 'offset',
      label: 'Offset',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Phase offset before the first pulse',
    },
    length: {
      key: 'length',
      label: 'Length',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Total number of ticks in the pulse stream',
    },
  },
  evaluate: (_inputs, params) => {
    const period = clampedPeriod(params);
    const offset = clampedOffset(params);
    const length = clampedLength(params);

    const stream: number[] = [];
    for (let t = 0; t < length; t++) {
      stream.push(pulse(t, period, offset));
    }

    return {
      pulse: { type: 'bits', value: stream },
    };
  },
  tickSlice: (params, tick) => {
    const period = clampedPeriod(params);
    const offset = clampedOffset(params);
    const length = clampedLength(params);

    // Return params that make evaluate produce exactly the single-tick pulse.
    // Set length=1 and offset=0, with period=1 if this tick is a pulse, period=2 if not.
    const bit = tick < length ? pulse(tick, period, offset) : -1;
    if (bit < 0) {
      // Beyond stream length — produce empty output
      return { ...params, length: 0 };
    }

    // Produce a length-1 stream: period=1,offset=0 always emits [1] at tick 0.
    // If bit is 0, we need a length-1 stream that emits [0]: period=1,offset=1 does it.
    return {
      ...params,
      length: 1,
      period: 1,
      offset: bit === 1 ? 0 : 1,
    };
  },
  tickLength: (params) => clampedLength(params),
};
