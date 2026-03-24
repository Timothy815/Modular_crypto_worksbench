import type { ModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function isUppercaseLetter(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]$/.test(value);
}

export function parsePlugboardWiring(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== 26 || !value.every(isUppercaseLetter)) {
    throw new Error('Plugboard wiring must be an array of 26 uppercase letters.');
  }

  if (new Set(value).size !== 26) {
    throw new Error('Plugboard wiring must be a permutation with no duplicates.');
  }

  for (let index = 0; index < ALPHABET.length; index += 1) {
    const source = ALPHABET[index];
    const target = value[index];
    const targetIndex = ALPHABET.indexOf(target);
    if (value[targetIndex] !== source) {
      throw new Error('Plugboard wiring must be reciprocal: every mapped pair must map back to itself.');
    }
  }

  return value;
}

export function validatePlugboardWiringParam(value: unknown): string | null {
  try {
    parsePlugboardWiring(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Plugboard wiring is invalid.';
  }
}

export function serializePlugboardWiring(wiring: string[]): string {
  return wiring.join(', ');
}

export function buildIdentityPlugboardWiring(): string[] {
  return ALPHABET.split('');
}

export function pairPlugboardLetters(wiring: string[], left: string, right: string): string[] {
  const normalizedLeft = left.toUpperCase();
  const normalizedRight = right.toUpperCase();
  if (
    normalizedLeft === normalizedRight ||
    !ALPHABET.includes(normalizedLeft) ||
    !ALPHABET.includes(normalizedRight)
  ) {
    return [...wiring];
  }

  const next = [...parsePlugboardWiring(wiring)];
  const leftIndex = ALPHABET.indexOf(normalizedLeft);
  const rightIndex = ALPHABET.indexOf(normalizedRight);
  const leftPartner = next[leftIndex];
  const rightPartner = next[rightIndex];

  if (leftPartner !== normalizedLeft) {
    const leftPartnerIndex = ALPHABET.indexOf(leftPartner);
    next[leftPartnerIndex] = leftPartner;
  }
  if (rightPartner !== normalizedRight) {
    const rightPartnerIndex = ALPHABET.indexOf(rightPartner);
    next[rightPartnerIndex] = rightPartner;
  }

  next[leftIndex] = normalizedRight;
  next[rightIndex] = normalizedLeft;

  return next;
}

export function unpairPlugboardLetter(wiring: string[], letter: string): string[] {
  const normalizedLetter = letter.toUpperCase();
  if (!ALPHABET.includes(normalizedLetter)) {
    return [...wiring];
  }

  const next = [...parsePlugboardWiring(wiring)];
  const index = ALPHABET.indexOf(normalizedLetter);
  const partner = next[index];
  if (partner === normalizedLetter) {
    return next;
  }

  const partnerIndex = ALPHABET.indexOf(partner);
  next[index] = normalizedLetter;
  next[partnerIndex] = partner;
  return next;
}

export const Plugboard: ModuleDef = {
  id: 'Plugboard',
  name: 'Plugboard',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: buildIdentityPlugboardWiring(),
      required: true,
      description:
        'Reciprocal symbolic swaps with passthrough allowed. Unpaired letters map to themselves; paired letters map to each other.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('Plugboard expects a symbol signal');
    }

    const wiring = parsePlugboardWiring(params.wiring);
    const index = ALPHABET.indexOf(signal.value.toUpperCase());
    if (index === -1) {
      throw new Error(`Plugboard: "${signal.value}" is not in the alphabet`);
    }

    return {
      out: { type: 'symbol', value: wiring[index] },
    };
  },
};
