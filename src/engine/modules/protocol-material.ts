import type { ModuleDef, ModuleParams } from '../types';
import { validateHexSourceValue } from './hex-source';

export function validateProtocolMaterialParam(fieldKey: string, value: unknown): string | null {
  if (fieldKey === 'value') {
    return validateHexSourceValue(value);
  }

  if (fieldKey === 'width') {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      return 'Protocol-material width must be a positive integer';
    }
    if (value % 4 !== 0) {
      return 'Protocol-material width must be a multiple of 4 bits';
    }
    return null;
  }

  return null;
}

export function validateProtocolMaterialValueFitsWidth(
  value: unknown,
  width: unknown,
): string | null {
  const valueMessage = validateProtocolMaterialParam('value', value);
  if (valueMessage) {
    return valueMessage;
  }

  const widthMessage = validateProtocolMaterialParam('width', width);
  if (widthMessage) {
    return widthMessage;
  }

  const normalizedValue =
    typeof value === 'string' ? value.trim().replace(/\s+/g, '').toUpperCase() : '';
  const normalizedWidth = typeof width === 'number' ? width : 0;

  if (normalizedValue.length * 4 > normalizedWidth) {
    return 'Protocol-material value must fit within the declared width';
  }

  return null;
}

function sanitizeHex(value: unknown): string {
  const validationMessage = validateHexSourceValue(value);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, '').toUpperCase()
    : '';
}

function normalizeWidth(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error('Protocol-material width must be a positive integer');
  }
  if (value % 4 !== 0) {
    throw new Error('Protocol-material width must be a multiple of 4 bits');
  }
  return value;
}

function hexToBits(value: string): number[] {
  return value.split('').flatMap((digit) => {
    const nibble = Number.parseInt(digit, 16);
    return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
  });
}

export function evaluateProtocolMaterialSource(moduleName: string, params: ModuleParams) {
  const value = sanitizeHex(params.value);
  const width = normalizeWidth(params.width);
  const bits = hexToBits(value);

  if (bits.length > width) {
    throw new Error(`${moduleName} value exceeds declared width`);
  }

  return {
    out: {
      type: 'bits' as const,
      value: [...bits, ...Array.from({ length: width - bits.length }, () => 0)],
    },
  };
}

export function buildProtocolMaterialSource(
  id: string,
  name: string,
  label: string,
  description: string,
): ModuleDef {
  return {
    id,
    name,
    inputs: [],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {
      value: {
        key: 'value',
        label,
        kind: 'string',
        defaultValue: 'A3',
        required: true,
        description,
      },
      width: {
        key: 'width',
        label: 'Width',
        kind: 'number',
        defaultValue: 8,
        required: true,
        description: 'Declared output width in bits. Must be a multiple of 4; shorter hex values are right-padded with zeros.',
      },
    },
    evaluate: (_inputs, params) => evaluateProtocolMaterialSource(name, params),
  };
}
