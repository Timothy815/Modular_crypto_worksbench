import type { ModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function isUppercaseLetter(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]$/.test(value);
}

export function parseReflectorWiring(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== 26 || !value.every(isUppercaseLetter)) {
    throw new Error('Reflector wiring must be an array of 26 uppercase letters.');
  }

  if (new Set(value).size !== 26) {
    throw new Error('Reflector wiring must be a permutation with no duplicates.');
  }

  for (let index = 0; index < ALPHABET.length; index += 1) {
    const source = ALPHABET[index];
    const target = value[index];
    if (target === source) {
      throw new Error('Reflector wiring cannot map a letter to itself.');
    }

    const targetIndex = ALPHABET.indexOf(target);
    if (value[targetIndex] !== source) {
      throw new Error('Reflector wiring must be involutive: every pair must map back to itself.');
    }
  }

  return value;
}

export function validateReflectorWiringParam(value: unknown): string | null {
  try {
    parseReflectorWiring(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Reflector wiring is invalid.';
  }
}

export function serializeReflectorWiring(wiring: string[]): string {
  return wiring.join(', ');
}

export function normalizeReflectorReciprocalWiring(wiring: string[]): string[] {
  return [...parseReflectorWiring(wiring)];
}

export function pairReflectorLetters(wiring: string[], left: string, right: string): string[] {
  const normalizedLeft = left.toUpperCase();
  const normalizedRight = right.toUpperCase();
  if (
    normalizedLeft === normalizedRight ||
    !ALPHABET.includes(normalizedLeft) ||
    !ALPHABET.includes(normalizedRight)
  ) {
    return [...wiring];
  }

  const next = [...parseReflectorWiring(wiring)];
  const leftIndex = ALPHABET.indexOf(normalizedLeft);
  const rightIndex = ALPHABET.indexOf(normalizedRight);
  const leftPartner = next[leftIndex];
  const rightPartner = next[rightIndex];

  if (leftPartner === normalizedRight && rightPartner === normalizedLeft) {
    return next;
  }

  const leftPartnerIndex = ALPHABET.indexOf(leftPartner);
  const rightPartnerIndex = ALPHABET.indexOf(rightPartner);

  next[leftIndex] = normalizedRight;
  next[rightIndex] = normalizedLeft;
  next[leftPartnerIndex] = rightPartner;
  next[rightPartnerIndex] = leftPartner;

  return next;
}

export const Reflector: ModuleDef = {
  id: 'Reflector',
  name: 'Reflector',
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: ALPHABET.split('').reverse(),
      required: true,
      description: 'Involutive mapping: each letter maps to its pair (wiring[i] maps i, and wiring[indexOf(wiring[i])] maps back)',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('Reflector expects a symbol signal');
    }

    const wiring = parseReflectorWiring(params.wiring);
    const index = ALPHABET.indexOf(signal.value.toUpperCase());
    if (index === -1) {
      throw new Error(`Reflector: "${signal.value}" is not in the alphabet`);
    }

    return {
      out: { type: 'symbol', value: wiring[index] },
    };
  },
};
