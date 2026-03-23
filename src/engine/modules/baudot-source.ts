import type { TickSliceableModuleDef } from '../types';
import { encodeBaudotText, validateBaudotText } from './baudot-codec';

export function validateBaudotSourceValue(value: unknown): string | null {
  return validateBaudotText(value);
}

export const BaudotSource: TickSliceableModuleDef = {
  id: 'BaudotSource',
  name: 'Baudot Source',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Baudot Text',
      kind: 'string',
      defaultValue: 'TEST',
      required: true,
      description: 'Letters-mode Baudot text using A-Z and spaces',
    },
  },
  evaluate: (_inputs, params) => {
    const validationMessage = validateBaudotSourceValue(params.value);
    if (validationMessage) {
      throw new Error(validationMessage);
    }

    return {
      out: {
        type: 'bits',
        value: encodeBaudotText(typeof params.value === 'string' ? params.value : ''),
      },
    };
  },
  tickSlice: (params, tick) => {
    const value = typeof params.value === 'string' ? params.value : '';
    return {
      ...params,
      value: value[tick] ?? '',
    };
  },
  tickLength: (params) => (typeof params.value === 'string' ? params.value.length : 0),
};
