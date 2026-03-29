import type { ModuleDef } from '../types';

function normalizeAlphabetToken(token: string): string {
  return token.toUpperCase();
}

export function parsePolluxAlphabet(value: unknown, fieldName: string): string[] {
  if (typeof value !== 'string') {
    throw new Error(`Pollux Fractionation requires "${fieldName}" to be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Pollux Fractionation requires "${fieldName}" to contain at least one symbol`);
  }

  const rawTokens = /[\s,]/.test(trimmed)
    ? trimmed.split(/[\s,]+/).filter((token) => token.length > 0)
    : Array.from(trimmed);

  const tokens = rawTokens.map(normalizeAlphabetToken);
  if (tokens.some((token) => token.length !== 1)) {
    throw new Error(`Pollux Fractionation requires "${fieldName}" to contain only single-character symbols`);
  }

  if (tokens.some((token) => /[\s,]/.test(token))) {
    throw new Error(`Pollux Fractionation requires "${fieldName}" to contain visible non-separator symbols`);
  }

  if (new Set(tokens).size !== tokens.length) {
    throw new Error(`Pollux Fractionation requires "${fieldName}" to avoid duplicate symbols`);
  }

  return tokens;
}

export function validatePolluxFractionationParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'zeroAlphabet':
        parsePolluxAlphabet(value, 'zeroAlphabet');
        return null;
      case 'oneAlphabet':
        parsePolluxAlphabet(value, 'oneAlphabet');
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Pollux Fractionation parameter is invalid.';
  }
}

function parsePolluxAlphabets(params: Record<string, unknown>) {
  const zeroAlphabet = parsePolluxAlphabet(params.zeroAlphabet, 'zeroAlphabet');
  const oneAlphabet = parsePolluxAlphabet(params.oneAlphabet, 'oneAlphabet');

  const overlap = zeroAlphabet.find((symbol) => oneAlphabet.includes(symbol));
  if (overlap) {
    throw new Error(
      `Pollux Fractionation requires zeroAlphabet and oneAlphabet to be disjoint (overlap: "${overlap}")`,
    );
  }

  return { oneAlphabet, zeroAlphabet };
}

export function encodePolluxFractionation(
  bits: number[],
  zeroAlphabet: string[],
  oneAlphabet: string[],
): string {
  let zeroIndex = 0;
  let oneIndex = 0;
  let output = '';

  for (const bit of bits) {
    if (bit === 0) {
      output += zeroAlphabet[zeroIndex % zeroAlphabet.length];
      zeroIndex += 1;
      continue;
    }

    if (bit === 1) {
      output += oneAlphabet[oneIndex % oneAlphabet.length];
      oneIndex += 1;
      continue;
    }

    throw new Error('Pollux Fractionation expects only 0/1 bits');
  }

  return output;
}

export const PolluxFractionation: ModuleDef = {
  id: 'PolluxFractionation',
  name: 'Pollux Fractionation',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    zeroAlphabet: {
      key: 'zeroAlphabet',
      label: 'Zero Symbols',
      kind: 'string',
      defaultValue: 'XQZ',
      required: true,
      description: 'Single-character symbols used to represent 0 bits. Commas/spaces are optional separators.',
    },
    oneAlphabet: {
      key: 'oneAlphabet',
      label: 'One Symbols',
      kind: 'string',
      defaultValue: 'MNO',
      required: true,
      description: 'Single-character symbols used to represent 1 bits. Commas/spaces are optional separators.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('Pollux Fractionation expects a bits signal');
    }

    const { zeroAlphabet, oneAlphabet } = parsePolluxAlphabets(params);
    return {
      out: {
        type: 'symbol',
        value: encodePolluxFractionation(signal.value, zeroAlphabet, oneAlphabet),
      },
    };
  },
};
