export type SBoxTransformDirection = 'left' | 'right' | 'up' | 'down';

export interface SBoxEditorShape {
  inputWidth: 4 | 6 | 8;
  outputWidth: 4 | 8;
}

export interface SBoxGenerationShape extends SBoxEditorShape {
  label: string;
  entryCount: number;
  maxEntry: number;
  permutation: boolean;
}

export type SBoxGenerationPreset =
  | 'identity'
  | 'reverse'
  | 'random'
  | 'pair-swap'
  | 'present'
  | 'des-s1'
  | 'aes';

const PRESENT_SBOX = [12, 5, 6, 11, 9, 0, 10, 13, 3, 14, 15, 8, 4, 7, 1, 2] as const;
const AES_SBOX = [
  99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118,
  202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192,
  183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21,
  4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117,
  9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132,
  83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207,
  208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168,
  81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210,
  205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115,
  96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219,
  224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121,
  231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8,
  186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138,
  112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158,
  225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223,
  140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22,
] as const;
const DES_S1 = [
  14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
  0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
  4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
  15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13,
] as const;

export const SBOX_GENERATION_SIZES: readonly SBoxGenerationShape[] = [
  { label: '4 → 4 bits / 16 entries', inputWidth: 4, outputWidth: 4, entryCount: 16, maxEntry: 15, permutation: true },
  { label: '6 → 4 bits / 64 entries', inputWidth: 6, outputWidth: 4, entryCount: 64, maxEntry: 15, permutation: false },
  { label: '8 → 8 bits / 256 entries', inputWidth: 8, outputWidth: 8, entryCount: 256, maxEntry: 255, permutation: true },
] as const;

export function getDefaultSBoxPresetForShape(shape: SBoxGenerationShape): SBoxGenerationPreset {
  if (shape.inputWidth === 4 && shape.outputWidth === 4) {
    return 'present';
  }

  if (shape.inputWidth === 6 && shape.outputWidth === 4) {
    return 'des-s1';
  }

  return 'aes';
}

export const SBOX_GENERATION_PRESETS: readonly {
  id: SBoxGenerationPreset;
  label: string;
  supports: (shape: SBoxGenerationShape) => boolean;
}[] = [
  { id: 'identity', label: 'Identity', supports: (shape) => shape.permutation },
  { id: 'reverse', label: 'Reverse', supports: (shape) => shape.permutation },
  { id: 'random', label: 'Random', supports: () => true },
  { id: 'pair-swap', label: 'Pair-Swap', supports: (shape) => shape.permutation },
  { id: 'present', label: 'PRESENT', supports: (shape) => shape.inputWidth === 4 && shape.outputWidth === 4 },
  { id: 'des-s1', label: 'DES S1', supports: (shape) => shape.inputWidth === 6 && shape.outputWidth === 4 },
  { id: 'aes', label: 'AES', supports: (shape) => shape.inputWidth === 8 && shape.outputWidth === 8 },
] as const;

export function getSBoxGenerationShape(inputWidth: number, outputWidth: number): SBoxGenerationShape {
  const shape = SBOX_GENERATION_SIZES.find(
    (candidate) => candidate.inputWidth === inputWidth && candidate.outputWidth === outputWidth,
  );
  if (!shape) {
    throw new Error('Unsupported S-Box shape');
  }
  return shape;
}

export function getSBoxGridColumns(shapeOrEntryCount: SBoxEditorShape | number): number {
  if (typeof shapeOrEntryCount === 'number') {
    return Math.min(16, Math.max(1, Math.sqrt(shapeOrEntryCount)));
  }

  if (shapeOrEntryCount.inputWidth === 6 && shapeOrEntryCount.outputWidth === 4) {
    return 16;
  }

  return Math.min(16, Math.max(1, Math.sqrt(1 << shapeOrEntryCount.inputWidth)));
}

export function getSBoxGridRow(index: number, gridColumns: number): number {
  return Math.floor(index / gridColumns);
}

export function getSBoxGridColumn(index: number, gridColumns: number): number {
  return index % gridColumns;
}

function cloneTable(table: number[]): number[] {
  return [...table];
}

function getRowCount(table: number[], gridColumns: number): number {
  return Math.ceil(table.length / gridColumns);
}

export function getSBoxDisplayIndexForInputValue(inputValue: number, shape: SBoxEditorShape): number {
  if (shape.inputWidth === 6 && shape.outputWidth === 4) {
    const row = ((inputValue & 0b100000) >> 4) | (inputValue & 0b1);
    const column = (inputValue >> 1) & 0b1111;
    return row * 16 + column;
  }

  return inputValue;
}

export function getSBoxInputValueForDisplayIndex(displayIndex: number, shape: SBoxEditorShape): number {
  if (shape.inputWidth === 6 && shape.outputWidth === 4) {
    const row = Math.floor(displayIndex / 16);
    const column = displayIndex % 16;
    const highBit = (row >> 1) & 0b1;
    const lowBit = row & 0b1;
    return (highBit << 5) | (column << 1) | lowBit;
  }

  return displayIndex;
}

export function buildSBoxDisplayOrder(tableLength: number, shape: SBoxEditorShape): number[] {
  return Array.from({ length: tableLength }, (_, displayIndex) =>
    getSBoxInputValueForDisplayIndex(displayIndex, shape),
  );
}

export function swapSBoxRows(
  table: number[],
  firstRow: number,
  secondRow: number,
  gridColumns: number,
): number[] {
  const rowCount = getRowCount(table, gridColumns);
  if (
    firstRow < 0 ||
    secondRow < 0 ||
    firstRow >= rowCount ||
    secondRow >= rowCount ||
    firstRow === secondRow
  ) {
    return cloneTable(table);
  }

  const nextTable = cloneTable(table);
  for (let column = 0; column < gridColumns; column += 1) {
    const firstIndex = firstRow * gridColumns + column;
    const secondIndex = secondRow * gridColumns + column;
    [nextTable[firstIndex], nextTable[secondIndex]] = [nextTable[secondIndex], nextTable[firstIndex]];
  }
  return nextTable;
}

export function swapSBoxColumns(
  table: number[],
  firstColumn: number,
  secondColumn: number,
  gridColumns: number,
): number[] {
  if (
    firstColumn < 0 ||
    secondColumn < 0 ||
    firstColumn >= gridColumns ||
    secondColumn >= gridColumns ||
    firstColumn === secondColumn
  ) {
    return cloneTable(table);
  }

  const nextTable = cloneTable(table);
  for (let row = 0; row < getRowCount(table, gridColumns); row += 1) {
    const firstIndex = row * gridColumns + firstColumn;
    const secondIndex = row * gridColumns + secondColumn;
    [nextTable[firstIndex], nextTable[secondIndex]] = [nextTable[secondIndex], nextTable[firstIndex]];
  }
  return nextTable;
}

export function rotateSBoxRow(
  table: number[],
  row: number,
  gridColumns: number,
  direction: Extract<SBoxTransformDirection, 'left' | 'right'>,
): number[] {
  const rowCount = getRowCount(table, gridColumns);
  if (row < 0 || row >= rowCount) {
    return cloneTable(table);
  }

  const start = row * gridColumns;
  const rowValues = table.slice(start, start + gridColumns);
  if (rowValues.length <= 1) {
    return cloneTable(table);
  }

  const rotated =
    direction === 'left'
      ? [...rowValues.slice(1), rowValues[0]]
      : [rowValues[rowValues.length - 1], ...rowValues.slice(0, -1)];

  const nextTable = cloneTable(table);
  nextTable.splice(start, rowValues.length, ...rotated);
  return nextTable;
}

export function rotateSBoxColumn(
  table: number[],
  column: number,
  gridColumns: number,
  direction: Extract<SBoxTransformDirection, 'up' | 'down'>,
): number[] {
  if (column < 0 || column >= gridColumns) {
    return cloneTable(table);
  }

  const rowCount = getRowCount(table, gridColumns);
  const columnValues = Array.from({ length: rowCount }, (_, row) => table[row * gridColumns + column]);
  if (columnValues.length <= 1) {
    return cloneTable(table);
  }

  const rotated =
    direction === 'up'
      ? [...columnValues.slice(1), columnValues[0]]
      : [columnValues[columnValues.length - 1], ...columnValues.slice(0, -1)];

  const nextTable = cloneTable(table);
  for (let row = 0; row < rowCount; row += 1) {
    nextTable[row * gridColumns + column] = rotated[row];
  }
  return nextTable;
}

function buildPermutationTable(entryCount: number): number[] {
  return Array.from({ length: entryCount }, (_, index) => index);
}

function buildNonPermutationRandomTable(entryCount: number, maxEntry: number): number[] {
  return Array.from({ length: entryCount }, () => Math.floor(Math.random() * (maxEntry + 1)));
}

export function generateSBoxTable(shape: SBoxGenerationShape, preset: SBoxGenerationPreset): number[] {
  switch (preset) {
    case 'identity':
      return buildPermutationTable(shape.entryCount);
    case 'reverse':
      return Array.from({ length: shape.entryCount }, (_, index) => shape.entryCount - 1 - index);
    case 'random':
      if (!shape.permutation) {
        return buildNonPermutationRandomTable(shape.entryCount, shape.maxEntry);
      }

      return (() => {
        const table = buildPermutationTable(shape.entryCount);
        for (let i = table.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [table[i], table[j]] = [table[j], table[i]];
        }
        return table;
      })();
    case 'pair-swap': {
      const table = buildPermutationTable(shape.entryCount);
      for (let i = 0; i + 1 < shape.entryCount; i += 2) {
        [table[i], table[i + 1]] = [table[i + 1], table[i]];
      }
      return table;
    }
    case 'present':
      return [...PRESENT_SBOX];
    case 'des-s1':
      return [...DES_S1];
    case 'aes':
      return [...AES_SBOX];
  }
}

export function invertSBoxTable(table: number[]): number[] {
  const inverse = new Array<number>(table.length);
  for (let i = 0; i < table.length; i += 1) {
    inverse[table[i]] = i;
  }
  return inverse;
}

export function countSBoxFixedPoints(table: number[]): number {
  let count = 0;
  for (let i = 0; i < table.length; i += 1) {
    if (table[i] === i) count += 1;
  }
  return count;
}

export function isSBoxInvolution(table: number[]): boolean {
  for (let i = 0; i < table.length; i += 1) {
    if (table[table[i]] !== i) return false;
  }
  return true;
}
