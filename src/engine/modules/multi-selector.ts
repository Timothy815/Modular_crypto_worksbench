import type { ModuleDef } from '../types';
import { bitsToUnsignedNumber, expectBitsSignal } from './bit-word';

type SelectCount = 2 | 4 | 8;

const ACTIVE_INPUT_NAMES = [
  'in0',
  'in1',
  'in2',
  'in3',
  'in4',
  'in5',
  'in6',
  'in7',
] as const;

function normalizeSelectCount(value: unknown): SelectCount {
  if (value === 2 || value === 4 || value === 8) {
    return value;
  }
  throw new Error('MultiSelector requires "selectCount" to be 2, 4, or 8');
}

function expectedSelectWidth(selectCount: SelectCount): number {
  switch (selectCount) {
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
  }
}

export const MultiSelector: ModuleDef = {
  id: 'MultiSelector',
  name: 'Multi Selector',
  inputs: [
    { name: 'select', type: 'bits' },
    ...ACTIVE_INPUT_NAMES.map((name) => ({ name, type: 'bits' as const })),
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    selectCount: {
      key: 'selectCount',
      label: 'Select Count',
      kind: 'select',
      defaultValue: '4',
      required: true,
      options: [
        { label: '2 Inputs', value: '2' },
        { label: '4 Inputs', value: '4' },
        { label: '8 Inputs', value: '8' },
      ],
      description: 'How many visible inputs participate in active selection',
    },
  },
  evaluate: (inputs, params) => {
    const selectBits = expectBitsSignal(inputs.select, 'MultiSelector');
    const selectCount = normalizeSelectCount(Number(params.selectCount ?? 4));
    const requiredSelectWidth = expectedSelectWidth(selectCount);

    if (selectBits.length !== requiredSelectWidth) {
      throw new Error(
        `MultiSelector expects select to be a ${requiredSelectWidth}-bit word when selectCount is ${selectCount}`,
      );
    }

    const selectedIndex = bitsToUnsignedNumber(selectBits);
    const selectedInputName = ACTIVE_INPUT_NAMES[selectedIndex < selectCount ? selectedIndex : 0];
    const selectedSignal = inputs[selectedInputName];

    if (!selectedSignal || selectedSignal.type !== 'bits') {
      throw new Error(
        `MultiSelector: selected input "${selectedInputName}" is missing or not a bits signal`,
      );
    }

    return { out: { type: 'bits', value: [...selectedSignal.value] } };
  },
};
