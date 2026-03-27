import type { ModuleDef } from '../types';
import {
  bitsToUnsignedNumber,
  expectBitsSignal,
} from './bit-word';

type RouteCount = 2 | 4 | 8;

const ACTIVE_OUTPUT_NAMES = [
  'out0',
  'out1',
  'out2',
  'out3',
  'out4',
  'out5',
  'out6',
  'out7',
] as const;

function normalizeRouteCount(value: unknown): RouteCount {
  if (value === 2 || value === 4 || value === 8) {
    return value;
  }
  throw new Error('MultiRouter requires "routeCount" to be 2, 4, or 8');
}

function expectedSelectWidth(routeCount: RouteCount): number {
  switch (routeCount) {
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
  }
}

function buildZeroWord(width: number): number[] {
  return Array.from({ length: width }, () => 0);
}

export const MultiRouter: ModuleDef = {
  id: 'MultiRouter',
  name: 'Multi Router',
  inputs: [
    { name: 'select', type: 'bits' },
    { name: 'in', type: 'bits' },
  ],
  outputs: ACTIVE_OUTPUT_NAMES.map((name) => ({ name, type: 'bits' })),
  paramSchema: {
    routeCount: {
      key: 'routeCount',
      label: 'Route Count',
      kind: 'select',
      defaultValue: '4',
      required: true,
      options: [
        { label: '2 Routes', value: '2' },
        { label: '4 Routes', value: '4' },
        { label: '8 Routes', value: '8' },
      ],
      description: 'How many visible outputs participate in active routing',
    },
  },
  evaluate: (inputs, params) => {
    const signal = expectBitsSignal(inputs.in, 'MultiRouter');
    const selectBits = expectBitsSignal(inputs.select, 'MultiRouter');
    const routeCount = normalizeRouteCount(Number(params.routeCount ?? 4));
    const requiredSelectWidth = expectedSelectWidth(routeCount);

    if (selectBits.length !== requiredSelectWidth) {
      throw new Error(
        `MultiRouter expects select to be a ${requiredSelectWidth}-bit word when routeCount is ${routeCount}`,
      );
    }

    const selectedIndex = bitsToUnsignedNumber(selectBits);
    const zeroWord = buildZeroWord(signal.length);

    return Object.fromEntries(
      ACTIVE_OUTPUT_NAMES.map((name, index) => [
        name,
        {
          type: 'bits',
          value:
            index < routeCount && index === selectedIndex
              ? [...signal]
              : [...zeroWord],
        },
      ]),
    );
  },
};
