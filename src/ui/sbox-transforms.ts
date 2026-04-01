export type SBoxTransformDirection = 'left' | 'right' | 'up' | 'down';

export function getSBoxGridColumns(entryCount: number): number {
  return Math.min(16, Math.max(1, Math.sqrt(entryCount)));
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

export type SBoxGenerationPreset = 'identity' | 'reverse' | 'random' | 'pair-swap';

export const SBOX_GENERATION_SIZES = [
  { label: '4-bit / 16 entries', entryCount: 16 },
  { label: '8-bit / 256 entries', entryCount: 256 },
] as const;

export const SBOX_GENERATION_PRESETS: readonly { id: SBoxGenerationPreset; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'reverse', label: 'Reverse' },
  { id: 'random', label: 'Random Permutation' },
  { id: 'pair-swap', label: 'Pair-Swap' },
] as const;

export function generateSBoxTable(entryCount: number, preset: SBoxGenerationPreset): number[] {
  switch (preset) {
    case 'identity':
      return Array.from({ length: entryCount }, (_, index) => index);
    case 'reverse':
      return Array.from({ length: entryCount }, (_, index) => entryCount - 1 - index);
    case 'random': {
      const table = Array.from({ length: entryCount }, (_, index) => index);
      for (let i = table.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [table[i], table[j]] = [table[j], table[i]];
      }
      return table;
    }
    case 'pair-swap': {
      const table = Array.from({ length: entryCount }, (_, index) => index);
      for (let i = 0; i + 1 < entryCount; i += 2) {
        [table[i], table[i + 1]] = [table[i + 1], table[i]];
      }
      return table;
    }
  }
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
