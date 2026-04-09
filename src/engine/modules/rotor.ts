import type { StatefulModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ROTOR_SIZE = ALPHABET.length;
const ROTOR_WIRING_DEFAULT = ALPHABET.split('');

function normalizeRotorOffset(value: number): number {
  return ((value % ROTOR_SIZE) + ROTOR_SIZE) % ROTOR_SIZE;
}

function isUppercaseLetter(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]$/.test(value);
}

export function parseRotorWiring(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== ROTOR_SIZE || !value.every(isUppercaseLetter)) {
    throw new Error('Rotor wiring must be an array of 26 uppercase letters.');
  }

  if (new Set(value).size !== ROTOR_SIZE) {
    throw new Error('Rotor wiring must be a permutation with no duplicates.');
  }

  return value;
}

export function parseRotorNotches(value: unknown): number[] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  const entries = value
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length > 0);

  const unique = new Set<number>();
  for (const entry of entries) {
    if (!/^[A-Z]$/.test(entry)) {
      continue;
    }

    unique.add(ALPHABET.indexOf(entry));
  }

  return [...unique];
}

export function validateRotorParam(fieldKey: string, value: unknown): string | null {
  if (fieldKey === 'wiring') {
    try {
      parseRotorWiring(value);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Rotor wiring is invalid.';
    }
  }

  if (fieldKey === 'position' || fieldKey === 'ringOffset') {
    return typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 0 &&
      value < ROTOR_SIZE
      ? null
      : `${fieldKey === 'position' ? 'Position' : 'Ring offset'} must be an integer from 0 to 25`;
  }

  if (fieldKey === 'notches') {
    if (typeof value !== 'string') {
      return 'Notches must be a comma-separated list of uppercase letters';
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const entries = trimmed.split(',').map((entry) => entry.trim());
    if (entries.some((entry) => !/^[A-Z]$/.test(entry))) {
      return 'Notches must use uppercase single letters like "Q" or "Q, E"';
    }

    const unique = new Set(entries);
    if (unique.size !== entries.length) {
      return 'Notches must not repeat the same turnover letter';
    }

    return null;
  }

  return null;
}

export type RotorTraversalDirection = 'forward' | 'reverse';

export function traverseRotor(
  inputSymbol: string,
  wiring: string[],
  position: number,
  ringOffset: number,
  direction: RotorTraversalDirection,
): string {
  const inputIndex = ALPHABET.indexOf(inputSymbol.toUpperCase());
  if (inputIndex === -1) {
    throw new Error(`Rotor: "${inputSymbol}" is not in the alphabet`);
  }

  const effectiveShift = normalizeRotorOffset(position - ringOffset);
  const shiftedIndex = normalizeRotorOffset(inputIndex + effectiveShift);

  if (direction === 'forward') {
    const mappedIndex = ALPHABET.indexOf(wiring[shiftedIndex]);
    const unshifted = normalizeRotorOffset(mappedIndex - effectiveShift);
    return ALPHABET[unshifted];
  }

  const targetLetter = ALPHABET[shiftedIndex];
  const inverseIndex = wiring.indexOf(targetLetter);
  const unshifted = normalizeRotorOffset(inverseIndex - effectiveShift);
  return ALPHABET[unshifted];
}

export function advanceRotorParams(params: Record<string, unknown>): Record<string, unknown> {
  return {
    ...params,
    position: normalizeRotorOffset(((params.position as number) ?? 0) + 1),
  };
}

export function buildRotorOutputs(
  inputSymbol: string,
  params: Record<string, unknown>,
  direction: RotorTraversalDirection,
) {
  const wiring = parseRotorWiring(params.wiring);
  const position = normalizeRotorOffset((params.position as number) ?? 0);
  const ringOffset = normalizeRotorOffset((params.ringOffset as number) ?? 0);
  const notches = parseRotorNotches(params.notches);
  const turnoverActive = isRotorTurnoverActive(position, ringOffset, notches);

  return {
    out: {
      type: 'symbol' as const,
      value: traverseRotor(inputSymbol, wiring, position, ringOffset, direction),
    },
    turnover: { type: 'bits' as const, value: [turnoverActive ? 1 : 0] },
  };
}

export function isRotorTurnoverActive(
  position: number,
  ringOffset: number,
  notches: number[],
): boolean {
  const normalizedPosition = normalizeRotorOffset(position);
  const normalizedRingOffset = normalizeRotorOffset(ringOffset);

  return notches.some(
    (notchIndex) =>
      normalizedPosition ===
      normalizeRotorOffset(notchIndex - normalizedRingOffset),
  );
}

export function serializeRotorWiring(wiring: string[]): string {
  return wiring.join(', ');
}

export function swapRotorWiringTargets(wiring: string[], leftIndex: number, rightIndex: number): string[] {
  if (
    !Array.isArray(wiring) ||
    leftIndex < 0 ||
    rightIndex < 0 ||
    leftIndex >= wiring.length ||
    rightIndex >= wiring.length ||
    leftIndex === rightIndex
  ) {
    return [...wiring];
  }

  const nextWiring = [...wiring];
  const leftValue = nextWiring[leftIndex];
  nextWiring[leftIndex] = nextWiring[rightIndex];
  nextWiring[rightIndex] = leftValue;
  return nextWiring;
}

export const Rotor: StatefulModuleDef = {
  id: 'Rotor',
  name: 'Rotor',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'scalar' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [
    { name: 'out', type: 'symbol', kind: 'scalar' },
    { name: 'turnover', type: 'bits' },
  ],
  liveStateDisplay: {
    key: 'position',
    label: 'pos',
    format: 'rotor-position',
  },
  paramSchema: {
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: ROTOR_WIRING_DEFAULT,
      required: true,
      description: 'Permutation mapping: wiring[i] is the output letter for input index i',
    },
    position: {
      key: 'position',
      label: 'Position',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current visible rotor position (0-25)',
    },
    ringOffset: {
      key: 'ringOffset',
      label: 'Ring Offset',
      kind: 'number',
      defaultValue: 0,
      description: 'Ring setting offset (0-25), kept distinct from rotor position',
    },
    notches: {
      key: 'notches',
      label: 'Notches',
      kind: 'string',
      defaultValue: '',
      description: 'Comma-separated turnover letters such as "Q" or "Q, E"',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('Rotor expects a symbol signal');
    }
    return buildRotorOutputs(signal.value, params, 'forward');
  },
  advance: advanceRotorParams,
};
