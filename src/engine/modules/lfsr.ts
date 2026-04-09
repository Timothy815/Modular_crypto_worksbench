import type { StatefulModuleDef } from '../types';

function parseTapIndexes(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('LFSR taps must be a comma-separated index list');
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new Error('LFSR taps cannot be empty');
  }

  const indexes = parts.map((part) => Number(part));
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('LFSR taps must contain only non-negative integers');
  }

  if (new Set(indexes).size !== indexes.length) {
    throw new Error('LFSR taps must not repeat indexes');
  }

  return indexes;
}

function xorBits(values: number[]) {
  return values.reduce((accumulator, value) => accumulator ^ value, 0);
}

/**
 * Shift the register by one step: output the last bit, compute feedback
 * from tap positions, pop the tail, and unshift the feedback bit.
 * Returns the output bit and the new register state.
 */
function shiftRegister(
  register: number[],
  taps: number[],
): { outputBit: number; next: number[] } {
  const outputBit = register[register.length - 1];
  const feedback = xorBits(taps.map((tapIndex) => register[tapIndex]));
  const next = [feedback, ...register.slice(0, -1)];
  return { outputBit, next };
}

export const LFSR: StatefulModuleDef = {
  id: 'LFSR',
  name: 'LFSR',
  inputs: [
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  liveStateDisplay: {
    key: 'seed',
    label: 'reg',
    format: 'bits',
  },
  paramSchema: {
    seed: {
      key: 'seed',
      label: 'Seed Bits',
      kind: 'bits',
      defaultValue: [1, 0, 0, 1, 1],
      required: true,
      description: 'Initial register state',
    },
    taps: {
      key: 'taps',
      label: 'Tap Indexes',
      kind: 'string',
      defaultValue: '0,2',
      required: true,
      description: 'Comma-separated tap indexes inside the register',
    },
    outputLength: {
      key: 'outputLength',
      label: 'Output Length',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'How many output bits to emit',
    },
  },
  evaluate: (_inputs, params) => {
    const seed = params.seed;
    const outputLength = params.outputLength;
    if (!Array.isArray(seed) || !seed.every((bit) => bit === 0 || bit === 1)) {
      throw new Error('LFSR requires a seed bit array');
    }
    if (typeof outputLength !== 'number' || !Number.isFinite(outputLength)) {
      throw new Error('LFSR requires a numeric output length');
    }

    if (seed.length === 0) {
      throw new Error('LFSR seed cannot be empty');
    }

    const taps = parseTapIndexes(params.taps);
    if (taps.some((index) => index >= seed.length)) {
      throw new Error('LFSR tap index is out of range for the seed width');
    }

    const result: number[] = [];
    const totalBits = Math.max(0, Math.trunc(outputLength));
    let register = [...seed];

    for (let index = 0; index < totalBits; index += 1) {
      const step = shiftRegister(register, taps);
      result.push(step.outputBit);
      register = step.next;
    }

    return {
      out: { type: 'bits', value: result },
    };
  },
  advance: (params) => {
    const seed = params.seed;
    if (!Array.isArray(seed) || seed.length === 0) {
      return params;
    }

    const taps = parseTapIndexes(params.taps);
    if (taps.some((index) => index >= seed.length)) {
      return params;
    }

    const { next } = shiftRegister(seed as number[], taps);
    return { ...params, seed: next };
  },
};
