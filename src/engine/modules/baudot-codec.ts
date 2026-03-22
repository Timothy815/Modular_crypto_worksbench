const BAUDOT_LETTERS_TABLE = [
  '',
  'E',
  '\n',
  'A',
  ' ',
  'S',
  'I',
  'U',
  '\r',
  'D',
  'R',
  'J',
  'N',
  'F',
  'C',
  'K',
  'T',
  'Z',
  'L',
  'W',
  'H',
  'Y',
  'P',
  'Q',
  'O',
  'B',
  'G',
  '',
  'M',
  'X',
  'V',
  '',
];

const NORMALIZED_BAUDOT_MAP = new Map<string, number>(
  BAUDOT_LETTERS_TABLE.flatMap((symbol, index) => {
    if (!symbol || symbol === '\n' || symbol === '\r') {
      return [];
    }

    return [[symbol, index] as const];
  }),
);

export function validateBaudotText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return 'BaudotSource requires a text string';
  }

  for (const char of value.toUpperCase()) {
    if (!NORMALIZED_BAUDOT_MAP.has(char)) {
      return 'BaudotSource accepts only letters A-Z and spaces in letters mode';
    }
  }

  return null;
}

export function encodeBaudotText(value: string): number[] {
  return value
    .toUpperCase()
    .split('')
    .flatMap((char) => {
      const code = NORMALIZED_BAUDOT_MAP.get(char);
      if (code === undefined) {
        throw new Error(`BaudotSource cannot encode "${char}" in letters mode`);
      }

      return [4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
    });
}

export function decodeBaudotBits(bits: number[]): string {
  if (bits.length % 5 !== 0) {
    throw new Error('BitsToBaudot expects a bit signal whose width is divisible by 5');
  }

  let output = '';
  for (let offset = 0; offset < bits.length; offset += 5) {
    const chunk = bits.slice(offset, offset + 5);
    let code = 0;
    for (const bit of chunk) {
      code = (code << 1) | bit;
    }

    output += BAUDOT_LETTERS_TABLE[code] || '?';
  }

  return output;
}
