import type { ModuleDef } from '../types';

type ShiftMode = 'left' | 'right' | 'rotate-left' | 'rotate-right';

function normalizeAmount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('BitShifter requires a numeric shift amount');
  }

  return Math.max(0, Math.trunc(value));
}

export const BitShifter: ModuleDef = {
  id: 'BitShifter',
  name: 'Bit Shifter',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    amount: {
      key: 'amount',
      label: 'Shift Amount',
      kind: 'number',
      defaultValue: 1,
      required: true,
      description: 'How many positions to shift or rotate by',
    },
    mode: {
      key: 'mode',
      label: 'Mode',
      kind: 'select',
      defaultValue: 'left',
      required: true,
      options: [
        { label: 'Shift Left', value: 'left' },
        { label: 'Shift Right', value: 'right' },
        { label: 'Rotate Left', value: 'rotate-left' },
        { label: 'Rotate Right', value: 'rotate-right' },
      ],
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitShifter expects a bits signal');
    }

    const bits = signal.value;
    const amount = normalizeAmount(params.amount);
    const mode = params.mode as ShiftMode;

    if (bits.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    switch (mode) {
      case 'left': {
        if (amount >= bits.length) {
          return { out: { type: 'bits', value: bits.map(() => 0) } };
        }

        return {
          out: {
            type: 'bits',
            value: [...bits.slice(amount), ...Array(amount).fill(0)],
          },
        };
      }
      case 'right': {
        if (amount >= bits.length) {
          return { out: { type: 'bits', value: bits.map(() => 0) } };
        }

        return {
          out: {
            type: 'bits',
            value: [...Array(amount).fill(0), ...bits.slice(0, bits.length - amount)],
          },
        };
      }
      case 'rotate-left': {
        const offset = amount % bits.length;
        return {
          out: {
            type: 'bits',
            value: [...bits.slice(offset), ...bits.slice(0, offset)],
          },
        };
      }
      case 'rotate-right': {
        const offset = amount % bits.length;
        if (offset === 0) {
          return { out: { type: 'bits', value: [...bits] } };
        }

        return {
          out: {
            type: 'bits',
            value: [...bits.slice(bits.length - offset), ...bits.slice(0, bits.length - offset)],
          },
        };
      }
      default:
        throw new Error(`Unsupported BitShifter mode "${String(mode)}"`);
    }
  },
};
