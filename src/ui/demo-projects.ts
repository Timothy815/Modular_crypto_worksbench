import { executeProject } from '../engine/executor';
import { serializeSBoxTable } from '../engine/modules/s-box';
import { V1_REGISTRY } from '../engine/modules';
import type {
  ExecutionResult,
  ModuleRegistry,
  Project,
} from '../engine/types';
import {
  compareLearningItems,
  isCoreLearningItem,
  type LearningSequenceMeta,
} from './learning-sequence';
import { generateSBoxTable, getSBoxGenerationShape } from './sbox-transforms';

export interface DemoProject extends LearningSequenceMeta {
  id: string;
  name: string;
  group?: string;
  summary: string;
  pipeline: string;
  defaultTickedMode?: boolean;
  project: Project;
  layout: Record<string, { x: number; y: number }>;
}

const AES_SBOX_TABLE = serializeSBoxTable(generateSBoxTable(getSBoxGenerationShape(8, 8), 'aes'));
const DES_S1_TABLE = serializeSBoxTable(generateSBoxTable(getSBoxGenerationShape(6, 4), 'des-s1'));
// PRESENT cipher 4→4 S-box: bijective, high nonlinearity, used in Feistel round demos
const PRESENT_SBOX_TABLE = '12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2';

function buildAesShiftRowsOrder(rowShifts: readonly [number, number, number, number]): string {
  const order: number[] = [];
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const sourceColumn = (column + rowShifts[row]) % 4;
      const sourceByteIndex = sourceColumn * 4 + row;
      for (let bit = 0; bit < 8; bit += 1) {
        order.push(sourceByteIndex * 8 + bit);
      }
    }
  }
  return order.join(',');
}

const AES_SHIFT_ROWS_ORDER = buildAesShiftRowsOrder([0, 1, 2, 3]);
const AES_SHIFT_ROWS_ROW1_ZERO_ORDER = buildAesShiftRowsOrder([0, 0, 2, 3]);

const AES_ROUND_STATE_BYTES = [
  '19', '3D', 'E3', 'BE',
  'A0', 'F4', 'E2', '2B',
  '9A', 'C6', '8D', '2A',
  'E9', 'F8', '48', '08',
];

const AES_ROUND_KEY_BYTES = [
  'A0', 'FA', 'FE', '17',
  '88', '54', '2C', 'B1',
  '23', 'A3', '39', '39',
  '2A', '6C', '76', '05',
];

const MIX_COLUMNS_COEFFICIENT_ROWS = [
  [2, 3, 1, 1],
  [1, 2, 3, 1],
  [1, 1, 2, 3],
  [3, 1, 1, 2],
] as const;

function aesByteId(prefix: string, row: number, column: number) {
  return `${prefix}-${row}-${column}`;
}

function buildAesRoundDemoWorkspace(): {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
} {
  const modules: Project['modules'] = [];
  const connections: Project['connections'] = [];
  const layout: Record<string, { x: number; y: number }> = {};

  const subByteIds: string[] = [];

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const flatIndex = column * 4 + row;
      const stateId = aesByteId('s', row, column);
      const keyId = aesByteId('k', row, column);
      const sboxId = aesByteId('sub', row, column);
      const shiftByteId = aesByteId('shift-byte', row, column);
      const addRoundKeyId = aesByteId('ark', row, column);
      const toHexId = aesByteId('hex', row, column);
      const outId = aesByteId('out', row, column);

      subByteIds.push(sboxId);

      modules.push({ id: stateId, defId: 'HexSource', params: { value: AES_ROUND_STATE_BYTES[flatIndex] } });
      modules.push({ id: keyId, defId: 'HexSource', params: { value: AES_ROUND_KEY_BYTES[flatIndex] } });
      modules.push({ id: sboxId, defId: 'SBox', params: { table: AES_SBOX_TABLE } });
      modules.push({ id: shiftByteId, defId: 'BitWindow', params: { start: flatIndex * 8, width: 8 } });
      modules.push({ id: addRoundKeyId, defId: 'XOR', params: {} });
      modules.push({ id: toHexId, defId: 'BitsToHex', params: {} });
      modules.push({ id: outId, defId: 'HexOutput', params: {} });

      connections.push({ from: { moduleId: stateId, port: 'out' }, to: { moduleId: sboxId, port: 'in' } });
      connections.push({ from: { moduleId: addRoundKeyId, port: 'out' }, to: { moduleId: toHexId, port: 'in' } });
      connections.push({ from: { moduleId: toHexId, port: 'out' }, to: { moduleId: outId, port: 'in' } });

      layout[stateId] = { x: 80 + column * 120, y: 80 + row * 120 };
      layout[sboxId] = { x: 560 + column * 120, y: 80 + row * 120 };
      layout[shiftByteId] = { x: 1620 + column * 120, y: 80 + row * 120 };
      layout[keyId] = { x: 3400 + column * 120, y: 80 + row * 120 };
      layout[addRoundKeyId] = { x: 3660 + column * 120, y: 80 + row * 120 };
      layout[toHexId] = { x: 3880 + column * 120, y: 80 + row * 120 };
      layout[outId] = { x: 4100 + column * 120, y: 80 + row * 120 };
    }
  }

  let currentLevel = [...subByteIds];
  let levelIndex = 0;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let pairIndex = 0; pairIndex < currentLevel.length; pairIndex += 2) {
      const joinId = `join-${levelIndex}-${pairIndex / 2}`;
      modules.push({ id: joinId, defId: 'BitJoin', params: {} });
      connections.push({ from: { moduleId: currentLevel[pairIndex], port: 'out' }, to: { moduleId: joinId, port: 'a' } });
      connections.push({ from: { moduleId: currentLevel[pairIndex + 1], port: 'out' }, to: { moduleId: joinId, port: 'b' } });

      const leftPosition = layout[currentLevel[pairIndex]];
      const rightPosition = layout[currentLevel[pairIndex + 1]];
      layout[joinId] = {
        x: 900 + levelIndex * 120,
        y: ((leftPosition?.y ?? 0) + (rightPosition?.y ?? 0)) / 2,
      };

      nextLevel.push(joinId);
    }
    currentLevel = nextLevel;
    levelIndex += 1;
  }

  const joinedStateId = currentLevel[0];
  modules.push({ id: 'shift-rows', defId: 'Permutation', params: { order: AES_SHIFT_ROWS_ORDER } });
  connections.push({ from: { moduleId: joinedStateId, port: 'out' }, to: { moduleId: 'shift-rows', port: 'in' } });
  layout['shift-rows'] = { x: 1380, y: 260 };

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const shiftByteId = aesByteId('shift-byte', row, column);
      connections.push({ from: { moduleId: 'shift-rows', port: 'out' }, to: { moduleId: shiftByteId, port: 'in' } });
    }
  }

  for (let column = 0; column < 4; column += 1) {
    const const2Id = `mix-const2-${column}`;
    const const3Id = `mix-const3-${column}`;
    modules.push({ id: const2Id, defId: 'HexSource', params: { value: '02' } });
    modules.push({ id: const3Id, defId: 'HexSource', params: { value: '03' } });
    layout[const2Id] = { x: 1880 + column * 440, y: 20 };
    layout[const3Id] = { x: 1880 + column * 440, y: 620 };

    const columnInputIds = [
      aesByteId('shift-byte', 0, column),
      aesByteId('shift-byte', 1, column),
      aesByteId('shift-byte', 2, column),
      aesByteId('shift-byte', 3, column),
    ];

    for (let row = 0; row < 4; row += 1) {
      const terms: string[] = [];
      for (let sourceRow = 0; sourceRow < 4; sourceRow += 1) {
        const coefficient = MIX_COLUMNS_COEFFICIENT_ROWS[row][sourceRow];
        if (coefficient === 1) {
          terms.push(columnInputIds[sourceRow]);
          continue;
        }

        const multiplyId = `mix-c${column}-r${row}-m${sourceRow}`;
        modules.push({ id: multiplyId, defId: 'GF2Mul', params: { poly: '11B' } });
        connections.push({ from: { moduleId: columnInputIds[sourceRow], port: 'out' }, to: { moduleId: multiplyId, port: 'a' } });
        connections.push({
          from: { moduleId: coefficient === 2 ? const2Id : const3Id, port: 'out' },
          to: { moduleId: multiplyId, port: 'b' },
        });
        layout[multiplyId] = { x: 2060 + column * 440, y: 80 + row * 140 + sourceRow * 24 };
        terms.push(multiplyId);
      }

      const xor0Id = `mix-c${column}-r${row}-xor0`;
      const xor1Id = `mix-c${column}-r${row}-xor1`;
      const xor2Id = `mix-c${column}-r${row}-xor2`;
      const addRoundKeyId = aesByteId('ark', row, column);
      const keyId = aesByteId('k', row, column);

      modules.push({ id: xor0Id, defId: 'XOR', params: {} });
      modules.push({ id: xor1Id, defId: 'XOR', params: {} });
      modules.push({ id: xor2Id, defId: 'XOR', params: {} });

      connections.push({ from: { moduleId: terms[0], port: 'out' }, to: { moduleId: xor0Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[1], port: 'out' }, to: { moduleId: xor0Id, port: 'b' } });
      connections.push({ from: { moduleId: xor0Id, port: 'out' }, to: { moduleId: xor1Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[2], port: 'out' }, to: { moduleId: xor1Id, port: 'b' } });
      connections.push({ from: { moduleId: xor1Id, port: 'out' }, to: { moduleId: xor2Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[3], port: 'out' }, to: { moduleId: xor2Id, port: 'b' } });
      connections.push({ from: { moduleId: xor2Id, port: 'out' }, to: { moduleId: addRoundKeyId, port: 'a' } });
      connections.push({ from: { moduleId: keyId, port: 'out' }, to: { moduleId: addRoundKeyId, port: 'b' } });

      layout[xor0Id] = { x: 2300 + column * 440, y: 80 + row * 140 };
      layout[xor1Id] = { x: 2520 + column * 440, y: 80 + row * 140 };
      layout[xor2Id] = { x: 2740 + column * 440, y: 80 + row * 140 };
    }
  }

  return {
    project: { modules, connections },
    layout,
  };
}

const AES_ROUND_FULL_WORKSPACE = buildAesRoundDemoWorkspace();

function appendBitJoinTree(
  modules: Project['modules'],
  connections: Project['connections'],
  layout: Record<string, { x: number; y: number }>,
  sourceIds: string[],
  joinPrefix: string,
  baseX: number,
): string {
  let currentLevel = [...sourceIds];
  let levelIndex = 0;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let pairIndex = 0; pairIndex < currentLevel.length; pairIndex += 2) {
      const joinId = `${joinPrefix}-${levelIndex}-${pairIndex / 2}`;
      modules.push({ id: joinId, defId: 'BitJoin', params: {} });
      connections.push({ from: { moduleId: currentLevel[pairIndex], port: 'out' }, to: { moduleId: joinId, port: 'a' } });
      connections.push({ from: { moduleId: currentLevel[pairIndex + 1], port: 'out' }, to: { moduleId: joinId, port: 'b' } });

      const leftPosition = layout[currentLevel[pairIndex]];
      const rightPosition = layout[currentLevel[pairIndex + 1]];
      layout[joinId] = {
        x: baseX + levelIndex * 120,
        y: ((leftPosition?.y ?? 0) + (rightPosition?.y ?? 0)) / 2,
      };

      nextLevel.push(joinId);
    }
    currentLevel = nextLevel;
    levelIndex += 1;
  }

  return currentLevel[0];
}

function buildAesRoundBranch(
  modules: Project['modules'],
  connections: Project['connections'],
  layout: Record<string, { x: number; y: number }>,
  options: {
    prefix: string;
    yOffset: number;
    shiftOrder: string;
    stateSourceIds: string[][];
    keySourceIds: string[][];
    includePostMixOutputs?: boolean;
    mixRow0SecondCoefficientHex?: string;
  },
): {
  shiftBusId: string;
  finalBusId: string;
  shiftOutputId: string;
  finalOutputId: string;
  postMixBusId?: string;
  postMixOutputId?: string;
} {
  const {
    prefix,
    yOffset,
    shiftOrder,
    stateSourceIds,
    keySourceIds,
    includePostMixOutputs = false,
    mixRow0SecondCoefficientHex,
  } = options;
  const subByteIds: string[] = [];
  const shiftByteIds: string[] = [];
  const postMixByteIds: string[] = [];
  const finalByteIds: string[] = [];

  const mixRow0SecondCoefficientId =
    mixRow0SecondCoefficientHex !== undefined ? `${prefix}-mix-row0-col1-coeff` : null;
  if (mixRow0SecondCoefficientId) {
    modules.push({
      id: mixRow0SecondCoefficientId,
      defId: 'HexSource',
      params: { value: mixRow0SecondCoefficientHex },
    });
    layout[mixRow0SecondCoefficientId] = { x: 2820, y: yOffset + 700 };
  }

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const sboxId = `${prefix}-sub-${row}-${column}`;
      const shiftByteId = `${prefix}-shift-byte-${row}-${column}`;
      const addRoundKeyId = `${prefix}-ark-${row}-${column}`;

      modules.push({ id: sboxId, defId: 'SBox', params: { table: AES_SBOX_TABLE } });
      modules.push({ id: shiftByteId, defId: 'BitWindow', params: { start: (column * 4 + row) * 8, width: 8 } });
      modules.push({ id: addRoundKeyId, defId: 'XOR', params: {} });

      connections.push({ from: { moduleId: stateSourceIds[row][column], port: 'out' }, to: { moduleId: sboxId, port: 'in' } });

      layout[sboxId] = { x: 500 + column * 120, y: yOffset + 80 + row * 120 };
      layout[shiftByteId] = { x: 1660 + column * 120, y: yOffset + 80 + row * 120 };
      layout[addRoundKeyId] = { x: 3420 + column * 120, y: yOffset + 80 + row * 120 };

      subByteIds.push(sboxId);
      shiftByteIds.push(shiftByteId);
      finalByteIds.push(addRoundKeyId);
    }
  }

  const joinedStateId = appendBitJoinTree(modules, connections, layout, subByteIds, `${prefix}-join`, 840);
  const shiftRowsId = `${prefix}-shift-rows`;
  modules.push({ id: shiftRowsId, defId: 'Permutation', params: { order: shiftOrder } });
  connections.push({ from: { moduleId: joinedStateId, port: 'out' }, to: { moduleId: shiftRowsId, port: 'in' } });
  layout[shiftRowsId] = { x: 1320, y: yOffset + 260 };

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      connections.push({ from: { moduleId: shiftRowsId, port: 'out' }, to: { moduleId: `${prefix}-shift-byte-${row}-${column}`, port: 'in' } });
    }
  }

  const shiftBusId = appendBitJoinTree(modules, connections, layout, shiftByteIds, `${prefix}-shift-join`, 1880);
  const shiftHexId = `${prefix}-shift-hex`;
  const shiftOutputId = `${prefix}-shift-out`;
  modules.push({ id: shiftHexId, defId: 'BitsToHex', params: {} });
  modules.push({ id: shiftOutputId, defId: 'HexOutput', params: {} });
  connections.push({ from: { moduleId: shiftBusId, port: 'out' }, to: { moduleId: shiftHexId, port: 'in' } });
  connections.push({ from: { moduleId: shiftHexId, port: 'out' }, to: { moduleId: shiftOutputId, port: 'in' } });
  layout[shiftHexId] = { x: 2360, y: yOffset + 240 };
  layout[shiftOutputId] = { x: 2580, y: yOffset + 240 };

  for (let column = 0; column < 4; column += 1) {
    const const2Id = `${prefix}-mix-const2-${column}`;
    const const3Id = `${prefix}-mix-const3-${column}`;
    modules.push({ id: const2Id, defId: 'HexSource', params: { value: '02' } });
    modules.push({ id: const3Id, defId: 'HexSource', params: { value: '03' } });
    layout[const2Id] = { x: 2820 + column * 440, y: yOffset + 20 };
    layout[const3Id] = { x: 2820 + column * 440, y: yOffset + 620 };

    const columnInputIds = [
      `${prefix}-shift-byte-0-${column}`,
      `${prefix}-shift-byte-1-${column}`,
      `${prefix}-shift-byte-2-${column}`,
      `${prefix}-shift-byte-3-${column}`,
    ];

    for (let row = 0; row < 4; row += 1) {
      const terms: string[] = [];
      for (let sourceRow = 0; sourceRow < 4; sourceRow += 1) {
        const coefficient = MIX_COLUMNS_COEFFICIENT_ROWS[row][sourceRow];
        if (coefficient === 1) {
          terms.push(columnInputIds[sourceRow]);
          continue;
        }

        const multiplyId = `${prefix}-mix-c${column}-r${row}-m${sourceRow}`;
        modules.push({ id: multiplyId, defId: 'GF2Mul', params: { poly: '11B' } });
        connections.push({ from: { moduleId: columnInputIds[sourceRow], port: 'out' }, to: { moduleId: multiplyId, port: 'a' } });
        const coefficientSourceId =
          row === 0 && sourceRow === 1 && mixRow0SecondCoefficientId
            ? mixRow0SecondCoefficientId
            : coefficient === 2
              ? const2Id
              : const3Id;
        connections.push({
          from: { moduleId: coefficientSourceId, port: 'out' },
          to: { moduleId: multiplyId, port: 'b' },
        });
        layout[multiplyId] = { x: 3000 + column * 440, y: yOffset + 80 + row * 140 + sourceRow * 24 };
        terms.push(multiplyId);
      }

      const xor0Id = `${prefix}-mix-c${column}-r${row}-xor0`;
      const xor1Id = `${prefix}-mix-c${column}-r${row}-xor1`;
      const xor2Id = `${prefix}-mix-c${column}-r${row}-xor2`;

      modules.push({ id: xor0Id, defId: 'XOR', params: {} });
      modules.push({ id: xor1Id, defId: 'XOR', params: {} });
      modules.push({ id: xor2Id, defId: 'XOR', params: {} });

      connections.push({ from: { moduleId: terms[0], port: 'out' }, to: { moduleId: xor0Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[1], port: 'out' }, to: { moduleId: xor0Id, port: 'b' } });
      connections.push({ from: { moduleId: xor0Id, port: 'out' }, to: { moduleId: xor1Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[2], port: 'out' }, to: { moduleId: xor1Id, port: 'b' } });
      connections.push({ from: { moduleId: xor1Id, port: 'out' }, to: { moduleId: xor2Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[3], port: 'out' }, to: { moduleId: xor2Id, port: 'b' } });
      connections.push({ from: { moduleId: xor2Id, port: 'out' }, to: { moduleId: `${prefix}-ark-${row}-${column}`, port: 'a' } });
      connections.push({ from: { moduleId: keySourceIds[row][column], port: 'out' }, to: { moduleId: `${prefix}-ark-${row}-${column}`, port: 'b' } });

      layout[xor0Id] = { x: 3240 + column * 440, y: yOffset + 80 + row * 140 };
      layout[xor1Id] = { x: 3460 + column * 440, y: yOffset + 80 + row * 140 };
      layout[xor2Id] = { x: 3680 + column * 440, y: yOffset + 80 + row * 140 };
      postMixByteIds.push(xor2Id);
    }
  }

  let postMixBusId: string | undefined;
  let postMixOutputId: string | undefined;
  if (includePostMixOutputs) {
    postMixBusId = appendBitJoinTree(modules, connections, layout, postMixByteIds, `${prefix}-postmix-join`, 3920);
    const postMixHexId = `${prefix}-postmix-hex`;
    postMixOutputId = `${prefix}-postmix-out`;
    modules.push({ id: postMixHexId, defId: 'BitsToHex', params: {} });
    modules.push({ id: postMixOutputId, defId: 'HexOutput', params: {} });
    connections.push({ from: { moduleId: postMixBusId, port: 'out' }, to: { moduleId: postMixHexId, port: 'in' } });
    connections.push({ from: { moduleId: postMixHexId, port: 'out' }, to: { moduleId: postMixOutputId, port: 'in' } });
    layout[postMixHexId] = { x: 3920, y: yOffset + 240 };
    layout[postMixOutputId] = { x: 4140, y: yOffset + 240 };
  }

  const finalBusId = appendBitJoinTree(modules, connections, layout, finalByteIds, `${prefix}-final-join`, 3920);
  const finalHexId = `${prefix}-final-hex`;
  const finalOutputId = `${prefix}-final-out`;
  modules.push({ id: finalHexId, defId: 'BitsToHex', params: {} });
  modules.push({ id: finalOutputId, defId: 'HexOutput', params: {} });
  connections.push({ from: { moduleId: finalBusId, port: 'out' }, to: { moduleId: finalHexId, port: 'in' } });
  connections.push({ from: { moduleId: finalHexId, port: 'out' }, to: { moduleId: finalOutputId, port: 'in' } });
  layout[finalHexId] = { x: 4400, y: yOffset + 240 };
  layout[finalOutputId] = { x: 4620, y: yOffset + 240 };

  return {
    shiftBusId,
    finalBusId,
    shiftOutputId,
    finalOutputId,
    postMixBusId,
    postMixOutputId,
  };
}

function buildAesRowPerturbationWorkspace(): {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
} {
  const modules: Project['modules'] = [];
  const connections: Project['connections'] = [];
  const layout: Record<string, { x: number; y: number }> = {};
  const stateSourceIds: string[][] = Array.from({ length: 4 }, () => Array(4).fill(''));
  const keySourceIds: string[][] = Array.from({ length: 4 }, () => Array(4).fill(''));

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const flatIndex = column * 4 + row;
      const stateId = `shared-s-${row}-${column}`;
      const keyId = `shared-k-${row}-${column}`;
      stateSourceIds[row][column] = stateId;
      keySourceIds[row][column] = keyId;
      modules.push({ id: stateId, defId: 'HexSource', params: { value: AES_ROUND_STATE_BYTES[flatIndex] } });
      modules.push({ id: keyId, defId: 'HexSource', params: { value: AES_ROUND_KEY_BYTES[flatIndex] } });
      layout[stateId] = { x: 80 + column * 120, y: 120 + row * 120 };
      layout[keyId] = { x: 80 + column * 120, y: 1180 + row * 120 };
    }
  }

  const canonical = buildAesRoundBranch(modules, connections, layout, {
    prefix: 'canonical',
    yOffset: 40,
    shiftOrder: AES_SHIFT_ROWS_ORDER,
    stateSourceIds,
    keySourceIds,
  });

  const perturbed = buildAesRoundBranch(modules, connections, layout, {
    prefix: 'perturbed',
    yOffset: 1020,
    shiftOrder: AES_SHIFT_ROWS_ROW1_ZERO_ORDER,
    stateSourceIds,
    keySourceIds,
  });

  modules.push({ id: 'shift-match', defId: 'Equals', params: {} });
  modules.push({ id: 'shift-match-out', defId: 'BitOutput', params: {} });
  modules.push({ id: 'final-match', defId: 'Equals', params: {} });
  modules.push({ id: 'final-match-out', defId: 'BitOutput', params: {} });
  modules.push({
    id: 'row-consequence-summary',
    defId: 'AesConsequenceSummary',
    params: {
      stage0Label: 'ShiftRows',
      stage1Label: 'Final output',
      ruleChanged: 'Row 1 ShiftRows rotation changed from 1 byte to 0 bytes in the perturbed branch.',
      claimBoundary: 'This is a local routing consequence inside one visible AES round, not a proof of cryptographic quality or failure.',
    },
  });

  connections.push({ from: { moduleId: canonical.shiftBusId, port: 'out' }, to: { moduleId: 'shift-match', port: 'a' } });
  connections.push({ from: { moduleId: perturbed.shiftBusId, port: 'out' }, to: { moduleId: 'shift-match', port: 'b' } });
  connections.push({ from: { moduleId: 'shift-match', port: 'out' }, to: { moduleId: 'shift-match-out', port: 'in' } });
  connections.push({ from: { moduleId: canonical.finalBusId, port: 'out' }, to: { moduleId: 'final-match', port: 'a' } });
  connections.push({ from: { moduleId: perturbed.finalBusId, port: 'out' }, to: { moduleId: 'final-match', port: 'b' } });
  connections.push({ from: { moduleId: 'final-match', port: 'out' }, to: { moduleId: 'final-match-out', port: 'in' } });
  connections.push({ from: { moduleId: canonical.shiftBusId, port: 'out' }, to: { moduleId: 'row-consequence-summary', port: 'canonicalStage0' } });
  connections.push({ from: { moduleId: perturbed.shiftBusId, port: 'out' }, to: { moduleId: 'row-consequence-summary', port: 'perturbedStage0' } });
  connections.push({ from: { moduleId: canonical.finalBusId, port: 'out' }, to: { moduleId: 'row-consequence-summary', port: 'canonicalStage1' } });
  connections.push({ from: { moduleId: perturbed.finalBusId, port: 'out' }, to: { moduleId: 'row-consequence-summary', port: 'perturbedStage1' } });

  layout['shift-match'] = { x: 4900, y: 740 };
  layout['shift-match-out'] = { x: 5160, y: 740 };
  layout['final-match'] = { x: 4900, y: 860 };
  layout['final-match-out'] = { x: 5160, y: 860 };
  layout['row-consequence-summary'] = { x: 4900, y: 560 };

  return {
    project: { modules, connections },
    layout,
  };
}

const AES_ROW_PERTURBATION_WORKSPACE = buildAesRowPerturbationWorkspace();

function buildAesColumnPerturbationWorkspace(): {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
} {
  const modules: Project['modules'] = [];
  const connections: Project['connections'] = [];
  const layout: Record<string, { x: number; y: number }> = {};
  const stateSourceIds: string[][] = Array.from({ length: 4 }, () => Array(4).fill(''));
  const keySourceIds: string[][] = Array.from({ length: 4 }, () => Array(4).fill(''));

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const flatIndex = column * 4 + row;
      const stateId = `shared-s-${row}-${column}`;
      const keyId = `shared-k-${row}-${column}`;
      stateSourceIds[row][column] = stateId;
      keySourceIds[row][column] = keyId;
      modules.push({ id: stateId, defId: 'HexSource', params: { value: AES_ROUND_STATE_BYTES[flatIndex] } });
      modules.push({ id: keyId, defId: 'HexSource', params: { value: AES_ROUND_KEY_BYTES[flatIndex] } });
      layout[stateId] = { x: 80 + column * 120, y: 120 + row * 120 };
      layout[keyId] = { x: 80 + column * 120, y: 1420 + row * 120 };
    }
  }

  const canonical = buildAesRoundBranch(modules, connections, layout, {
    prefix: 'canonical',
    yOffset: 40,
    shiftOrder: AES_SHIFT_ROWS_ORDER,
    stateSourceIds,
    keySourceIds,
    includePostMixOutputs: true,
    mixRow0SecondCoefficientHex: '03',
  });

  const perturbed = buildAesRoundBranch(modules, connections, layout, {
    prefix: 'perturbed',
    yOffset: 1260,
    shiftOrder: AES_SHIFT_ROWS_ORDER,
    stateSourceIds,
    keySourceIds,
    includePostMixOutputs: true,
    mixRow0SecondCoefficientHex: '02',
  });

  if (!canonical.postMixBusId || !perturbed.postMixBusId) {
    throw new Error('Expected AES column perturbation branches to expose post-MixColumns buses.');
  }

  modules.push({ id: 'postmix-match', defId: 'Equals', params: {} });
  modules.push({ id: 'postmix-match-out', defId: 'BitOutput', params: {} });
  modules.push({ id: 'final-match', defId: 'Equals', params: {} });
  modules.push({ id: 'final-match-out', defId: 'BitOutput', params: {} });
  modules.push({
    id: 'column-consequence-summary',
    defId: 'AesConsequenceSummary',
    params: {
      stage0Label: 'post-MixColumns',
      stage1Label: 'Final output',
      ruleChanged: 'The first MixColumns row changed from 02 03 01 01 to 02 02 01 01 across all four visible column mixers in the perturbed branch.',
      claimBoundary: 'This is one local diffusion-rule consequence inside one visible AES round, not a proof of strength, weakness, or breakability.',
    },
  });

  connections.push({ from: { moduleId: canonical.postMixBusId, port: 'out' }, to: { moduleId: 'postmix-match', port: 'a' } });
  connections.push({ from: { moduleId: perturbed.postMixBusId, port: 'out' }, to: { moduleId: 'postmix-match', port: 'b' } });
  connections.push({ from: { moduleId: 'postmix-match', port: 'out' }, to: { moduleId: 'postmix-match-out', port: 'in' } });
  connections.push({ from: { moduleId: canonical.finalBusId, port: 'out' }, to: { moduleId: 'final-match', port: 'a' } });
  connections.push({ from: { moduleId: perturbed.finalBusId, port: 'out' }, to: { moduleId: 'final-match', port: 'b' } });
  connections.push({ from: { moduleId: 'final-match', port: 'out' }, to: { moduleId: 'final-match-out', port: 'in' } });
  connections.push({ from: { moduleId: canonical.postMixBusId, port: 'out' }, to: { moduleId: 'column-consequence-summary', port: 'canonicalStage0' } });
  connections.push({ from: { moduleId: perturbed.postMixBusId, port: 'out' }, to: { moduleId: 'column-consequence-summary', port: 'perturbedStage0' } });
  connections.push({ from: { moduleId: canonical.finalBusId, port: 'out' }, to: { moduleId: 'column-consequence-summary', port: 'canonicalStage1' } });
  connections.push({ from: { moduleId: perturbed.finalBusId, port: 'out' }, to: { moduleId: 'column-consequence-summary', port: 'perturbedStage1' } });

  layout['postmix-match'] = { x: 4900, y: 980 };
  layout['postmix-match-out'] = { x: 5160, y: 980 };
  layout['final-match'] = { x: 4900, y: 1100 };
  layout['final-match-out'] = { x: 5160, y: 1100 };
  layout['column-consequence-summary'] = { x: 4900, y: 780 };

  return {
    project: { modules, connections },
    layout,
  };
}

const AES_COLUMN_PERTURBATION_WORKSPACE = buildAesColumnPerturbationWorkspace();

function buildKeyedSBoxAuthoringWorkspace(keyBits: [number, number]): {
  project: Project;
  layout: Record<string, { x: number; y: number }>;
} {
  return {
    project: {
      modules: [
        { id: 'input-a', defId: 'BitSource', params: { stream: [0, 0, 0, 1] } },
        { id: 'input-b', defId: 'BitSource', params: { stream: [1, 0, 0, 1] } },
        { id: 'key-source', defId: 'BitSource', params: { stream: [...keyBits] } },
        { id: 'baseline-a', defId: 'SBox', params: { table: PRESENT_SBOX_TABLE } },
        { id: 'keyed-a', defId: 'KeyedSBox4', params: {} },
        { id: 'baseline-b', defId: 'SBox', params: { table: PRESENT_SBOX_TABLE } },
        { id: 'keyed-b', defId: 'KeyedSBox4', params: {} },
        { id: 'baseline-a-hex', defId: 'BitsToHexDigit', params: {} },
        { id: 'keyed-a-hex', defId: 'BitsToHexDigit', params: {} },
        { id: 'baseline-b-hex', defId: 'BitsToHexDigit', params: {} },
        { id: 'keyed-b-hex', defId: 'BitsToHexDigit', params: {} },
        { id: 'baseline-a-out', defId: 'Output', params: {} },
        { id: 'keyed-a-out', defId: 'Output', params: {} },
        { id: 'baseline-b-out', defId: 'Output', params: {} },
        { id: 'keyed-b-out', defId: 'Output', params: {} },
        { id: 'match-a', defId: 'Equals', params: {} },
        { id: 'match-b', defId: 'Equals', params: {} },
        { id: 'match-a-out', defId: 'BitOutput', params: {} },
        { id: 'match-b-out', defId: 'BitOutput', params: {} },
        { id: 'valid-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'input-a', port: 'out' }, to: { moduleId: 'baseline-a', port: 'in' } },
        { from: { moduleId: 'input-a', port: 'out' }, to: { moduleId: 'keyed-a', port: 'in' } },
        { from: { moduleId: 'input-b', port: 'out' }, to: { moduleId: 'baseline-b', port: 'in' } },
        { from: { moduleId: 'input-b', port: 'out' }, to: { moduleId: 'keyed-b', port: 'in' } },
        { from: { moduleId: 'key-source', port: 'out' }, to: { moduleId: 'keyed-a', port: 'key' } },
        { from: { moduleId: 'key-source', port: 'out' }, to: { moduleId: 'keyed-b', port: 'key' } },
        { from: { moduleId: 'baseline-a', port: 'out' }, to: { moduleId: 'baseline-a-hex', port: 'in' } },
        { from: { moduleId: 'keyed-a', port: 'out' }, to: { moduleId: 'keyed-a-hex', port: 'in' } },
        { from: { moduleId: 'baseline-b', port: 'out' }, to: { moduleId: 'baseline-b-hex', port: 'in' } },
        { from: { moduleId: 'keyed-b', port: 'out' }, to: { moduleId: 'keyed-b-hex', port: 'in' } },
        { from: { moduleId: 'baseline-a-hex', port: 'out' }, to: { moduleId: 'baseline-a-out', port: 'in' } },
        { from: { moduleId: 'keyed-a-hex', port: 'out' }, to: { moduleId: 'keyed-a-out', port: 'in' } },
        { from: { moduleId: 'baseline-b-hex', port: 'out' }, to: { moduleId: 'baseline-b-out', port: 'in' } },
        { from: { moduleId: 'keyed-b-hex', port: 'out' }, to: { moduleId: 'keyed-b-out', port: 'in' } },
        { from: { moduleId: 'baseline-a', port: 'out' }, to: { moduleId: 'match-a', port: 'a' } },
        { from: { moduleId: 'keyed-a', port: 'out' }, to: { moduleId: 'match-a', port: 'b' } },
        { from: { moduleId: 'baseline-b', port: 'out' }, to: { moduleId: 'match-b', port: 'a' } },
        { from: { moduleId: 'keyed-b', port: 'out' }, to: { moduleId: 'match-b', port: 'b' } },
        { from: { moduleId: 'match-a', port: 'out' }, to: { moduleId: 'match-a-out', port: 'in' } },
        { from: { moduleId: 'match-b', port: 'out' }, to: { moduleId: 'match-b-out', port: 'in' } },
        { from: { moduleId: 'keyed-a', port: 'valid' }, to: { moduleId: 'valid-out', port: 'in' } },
      ],
    },
    layout: {
      'input-a': { x: 88, y: 144 },
      'input-b': { x: 88, y: 404 },
      'key-source': { x: 88, y: 664 },
      'baseline-a': { x: 320, y: 144 },
      'keyed-a': { x: 320, y: 404 },
      'baseline-b': { x: 320, y: 664 },
      'keyed-b': { x: 320, y: 924 },
      'baseline-a-hex': { x: 600, y: 144 },
      'keyed-a-hex': { x: 600, y: 404 },
      'baseline-b-hex': { x: 600, y: 664 },
      'keyed-b-hex': { x: 600, y: 924 },
      'baseline-a-out': { x: 840, y: 144 },
      'keyed-a-out': { x: 840, y: 404 },
      'baseline-b-out': { x: 840, y: 664 },
      'keyed-b-out': { x: 840, y: 924 },
      'match-a': { x: 1080, y: 264 },
      'match-b': { x: 1080, y: 784 },
      'match-a-out': { x: 1320, y: 264 },
      'match-b-out': { x: 1320, y: 784 },
      'valid-out': { x: 1080, y: 1084 },
    },
  };
}

const KEYED_SBOX_AUTHORING_WORKSPACE = buildKeyedSBoxAuthoringWorkspace([0, 1]);

export const demoProjects: DemoProject[] = [
  {
    id: 'bit-sequence-segment-and-rejoin',
    name: 'Bit Sequence Segment And Rejoin',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 145,
    recommendedAfter: ['pad-and-split'],
    summary: 'A whole bit buffer is segmented into fixed-width words across ticks, transformed one word at a time, then collected back into one visible sequence.',
    pipeline: 'BitSequenceInput -> BitsSequenceToTicked + Clock -> NOT -> TickedBitsToSequence -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 3 } },
        {
          id: 'segment',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: false, remainderMode: 'error' },
        },
        { id: 'invert', defId: 'NOT', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'segment', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'segment', port: 'clock' } },
        { from: { moduleId: 'segment', port: 'out' }, to: { moduleId: 'invert', port: 'in' } },
        { from: { moduleId: 'invert', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    layout: {
      sequence: { x: 64, y: 88 },
      clock: { x: 64, y: 256 },
      segment: { x: 356, y: 88 },
      invert: { x: 612, y: 88 },
      collect: { x: 872, y: 88 },
      out: { x: 1140, y: 88 },
    },
  },
  {
    id: 'visible-repeated-key-repair',
    name: 'Visible Repeated-Key Repair',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 150,
    recommendedAfter: ['bridge'],
    summary: 'A shorter ASCII key is visibly repeated to the message length, bridged into 8-bit words, XORed per tick, and collected back into readable hex.',
    pipeline:
      'AsciiSequenceInput(message) + AsciiSequenceInput(key) -> RepeatSymbolToMatch(reference=message) -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR + Clock -> TickedBitsToSequence -> BitsToHex -> HexOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'ATTACK' } },
        { id: 'key', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'repeat', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'expanded-key', defId: 'TextOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'message-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'message-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'expanded-key', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'message-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'message-tick', port: 'clock' } },
        { from: { moduleId: 'message-tick', port: 'out' }, to: { moduleId: 'message-bits', port: 'in' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'cipher', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 48, y: 96 },
      key: { x: 48, y: 304 },
      repeat: { x: 316, y: 304 },
      'expanded-key': { x: 596, y: 304 },
      clock: { x: 48, y: 496 },
      'message-tick': { x: 316, y: 96 },
      'message-bits': { x: 588, y: 96 },
      'key-tick': { x: 852, y: 304 },
      'key-bits': { x: 1116, y: 304 },
      xor: { x: 1380, y: 192 },
      collect: { x: 1648, y: 192 },
      hex: { x: 1912, y: 192 },
      cipher: { x: 2176, y: 192 },
    },
  },
  {
    id: 'visible-strict-length-gate',
    name: 'Visible Strict-Length Gate',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 155,
    recommendedAfter: ['visible-repeated-key-repair'],
    summary: 'A strict ASCII key path is allowed through only because it already matches the message length, while a shorter sibling key shows the explicit repair alternative beside it.',
    pipeline:
      'AsciiSequenceInput(message) + AsciiSequenceInput(equal key) -> RequireSymbolLengthMatch -> AsciiSequenceToTicked -> AsciiCharToBits -> XOR + Clock -> TickedBitsToSequence -> BitsToHex -> HexOutput, plus AsciiSequenceInput(short key) -> RepeatSymbolToMatch(reference=message) -> TextOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'SECRET' } },
        { id: 'strict-key', defId: 'AsciiSequenceInput', params: { value: 'PUZZLE' } },
        { id: 'require', defId: 'RequireSymbolLengthMatch', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'message-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'message-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'key-tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'key-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher', defId: 'HexOutput', params: {} },
        { id: 'short-key', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'repair', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'repair-preview', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'strict-key', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'message-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'message-tick', port: 'clock' } },
        { from: { moduleId: 'message-tick', port: 'out' }, to: { moduleId: 'message-bits', port: 'in' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'key-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'key-tick', port: 'clock' } },
        { from: { moduleId: 'key-tick', port: 'out' }, to: { moduleId: 'key-bits', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key-bits', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'cipher', port: 'in' } },
        { from: { moduleId: 'short-key', port: 'out' }, to: { moduleId: 'repair', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repair', port: 'reference' } },
        { from: { moduleId: 'repair', port: 'out' }, to: { moduleId: 'repair-preview', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 48, y: 80 },
      'strict-key': { x: 48, y: 248 },
      require: { x: 316, y: 248 },
      clock: { x: 48, y: 488 },
      'message-tick': { x: 316, y: 80 },
      'message-bits': { x: 596, y: 80 },
      'key-tick': { x: 860, y: 248 },
      'key-bits': { x: 1124, y: 248 },
      xor: { x: 1392, y: 164 },
      collect: { x: 1656, y: 164 },
      hex: { x: 1916, y: 164 },
      cipher: { x: 2176, y: 164 },
      'short-key': { x: 48, y: 672 },
      repair: { x: 316, y: 672 },
      'repair-preview': { x: 596, y: 672 },
    },
  },
  {
    id: 'visible-hex-block-paths',
    name: 'Visible Hex Block Paths',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 160,
    recommendedAfter: ['visible-strict-length-gate'],
    summary: 'The top branch shows direct equal-width hex block XOR, while the lower branch shows truncate-plus-pad normalization before the same byte-word XOR pattern.',
    pipeline:
      'HexSequenceInput(blockA) + HexSequenceInput(blockB) -> BitsSequenceToTicked(wordWidth=8) -> XOR -> TickedBitsToSequence -> BitsToHex -> HexOutput, plus HexSequenceInput(shortBuffer) -> TruncateBitsToMatch -> PadBitsToMatch -> BitsSequenceToTicked(wordWidth=8) -> XOR(blockB)',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'left', defId: 'HexSequenceInput', params: { value: 'A1B2C3D4' } },
        { id: 'right', defId: 'HexSequenceInput', params: { value: '0F0F0F0F' } },
        {
          id: 'left-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        {
          id: 'right-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
        { id: 'short-buffer', defId: 'HexSequenceInput', params: { value: 'A1B2C3' } },
        { id: 'truncate', defId: 'TruncateBitsToMatch', params: { side: 'left' } },
        { id: 'pad', defId: 'PadBitsToMatch', params: { side: 'right', padBit: '0' } },
        {
          id: 'buffer-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'normalize-xor', defId: 'XOR', params: {} },
        { id: 'normalize-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'normalize-hex', defId: 'BitsToHex', params: {} },
        { id: 'normalize-out', defId: 'HexOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'left-tick', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'right-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'left-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'right-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collect', port: 'clock' } },
        { from: { moduleId: 'left-tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'right-tick', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'collect', port: 'in' } },
        { from: { moduleId: 'collect', port: 'out' }, to: { moduleId: 'hex', port: 'in' } },
        { from: { moduleId: 'hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
        { from: { moduleId: 'short-buffer', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'buffer-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'buffer-tick', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'normalize-collect', port: 'clock' } },
        { from: { moduleId: 'buffer-tick', port: 'out' }, to: { moduleId: 'normalize-xor', port: 'a' } },
        { from: { moduleId: 'right-tick', port: 'out' }, to: { moduleId: 'normalize-xor', port: 'b' } },
        { from: { moduleId: 'normalize-xor', port: 'out' }, to: { moduleId: 'normalize-collect', port: 'in' } },
        { from: { moduleId: 'normalize-collect', port: 'out' }, to: { moduleId: 'normalize-hex', port: 'in' } },
        { from: { moduleId: 'normalize-hex', port: 'out' }, to: { moduleId: 'normalize-out', port: 'in' } },
      ],
    },
    layout: {
      left: { x: 52, y: 64 },
      right: { x: 52, y: 236 },
      'left-tick': { x: 340, y: 64 },
      'right-tick': { x: 340, y: 236 },
      clock: { x: 340, y: 424 },
      xor: { x: 636, y: 148 },
      collect: { x: 904, y: 148 },
      hex: { x: 1168, y: 148 },
      out: { x: 1388, y: 148 },
      'short-buffer': { x: 52, y: 624 },
      truncate: { x: 340, y: 560 },
      pad: { x: 636, y: 560 },
      'buffer-tick': { x: 904, y: 560 },
      'normalize-xor': { x: 1168, y: 452 },
      'normalize-collect': { x: 1432, y: 452 },
      'normalize-hex': { x: 1696, y: 452 },
      'normalize-out': { x: 1916, y: 452 },
    },
  },
  {
    id: 'visible-mismatch-policy-family',
    name: 'Visible Mismatch Policy Family',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 165,
    recommendedAfter: ['visible-hex-block-paths'],
    summary: 'One message/reference sequence fans out into four sibling policy branches so `Require`, `Repeat`, `Truncate`, and `Pad` can be compared as explicit graph decisions.',
    pipeline:
      'AsciiSequenceInput(message) -> RequireSymbolLengthMatch / RepeatSymbolToMatch / TruncateSymbolToMatch / PadSymbolToMatch -> TextOutput',
    project: {
      modules: [
        { id: 'message', defId: 'AsciiSequenceInput', params: { value: 'SECRET' } },
        { id: 'equal-key', defId: 'AsciiSequenceInput', params: { value: 'PUZZLE' } },
        { id: 'short-repeat', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'long-key', defId: 'AsciiSequenceInput', params: { value: 'TOOLONGKEY' } },
        { id: 'short-pad', defId: 'AsciiSequenceInput', params: { value: 'ID' } },
        { id: 'require', defId: 'RequireSymbolLengthMatch', params: {} },
        { id: 'repeat', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'truncate', defId: 'TruncateSymbolToMatch', params: { side: 'left' } },
        { id: 'pad', defId: 'PadSymbolToMatch', params: { side: 'right', padChar: '_' } },
        { id: 'require-out', defId: 'TextOutput', params: {} },
        { id: 'repeat-out', defId: 'TextOutput', params: {} },
        { id: 'truncate-out', defId: 'TextOutput', params: {} },
        { id: 'pad-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'equal-key', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'require-out', port: 'in' } },
        { from: { moduleId: 'short-repeat', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'repeat-out', port: 'in' } },
        { from: { moduleId: 'long-key', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'truncate-out', port: 'in' } },
        { from: { moduleId: 'short-pad', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'pad-out', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 52, y: 80 },
      'equal-key': { x: 52, y: 240 },
      require: { x: 340, y: 240 },
      'require-out': { x: 636, y: 240 },
      'short-repeat': { x: 52, y: 432 },
      repeat: { x: 340, y: 432 },
      'repeat-out': { x: 636, y: 432 },
      'long-key': { x: 932, y: 240 },
      truncate: { x: 1220, y: 240 },
      'truncate-out': { x: 1516, y: 240 },
      'short-pad': { x: 932, y: 432 },
      pad: { x: 1220, y: 432 },
      'pad-out': { x: 1516, y: 432 },
    },
  },
  {
    id: 'visible-bridge-family',
    name: 'Visible Bridge Family',
    group: 'Sequences & Streams',
    stage: 'modern-bit-machines',
    order: 170,
    recommendedAfter: ['visible-mismatch-policy-family'],
    summary: 'One canvas compares whole-buffer ASCII bridging, ASCII ticked-byte bridging, and hex ticked-byte bridging so the common representation crossings read as one family.',
    pipeline:
      'AsciiSequenceInput -> AsciiSequenceToBits -> BitsToHex -> HexOutput, plus AsciiSequenceInput -> AsciiSequenceToTicked -> AsciiCharToBits -> TickedBitsToSequence -> BitsToAscii -> TextOutput, plus HexSequenceInput -> BitsSequenceToTicked(wordWidth=8) -> TickedBitsToSequence -> BitsToAscii -> TextOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'ascii-whole', defId: 'AsciiSequenceInput', params: { value: 'OK' } },
        { id: 'ascii-whole-bits', defId: 'AsciiSequenceToBits', params: {} },
        { id: 'ascii-whole-hex', defId: 'BitsToHex', params: {} },
        { id: 'ascii-whole-out', defId: 'HexOutput', params: {} },

        { id: 'ascii-ticked', defId: 'AsciiSequenceInput', params: { value: 'GO' } },
        { id: 'ascii-tick-bridge', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: false } },
        { id: 'ascii-char-bits', defId: 'AsciiCharToBits', params: {} },
        { id: 'ascii-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'ascii-return', defId: 'BitsToAscii', params: {} },
        { id: 'ascii-return-out', defId: 'TextOutput', params: {} },

        { id: 'hex-sequence', defId: 'HexSequenceInput', params: { value: '4849' } },
        {
          id: 'hex-tick-bridge',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: false, remainderMode: 'error' },
        },
        { id: 'hex-collect', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'hex-return', defId: 'BitsToAscii', params: {} },
        { id: 'hex-return-out', defId: 'TextOutput', params: {} },

        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 2 } },
      ],
      connections: [
        { from: { moduleId: 'ascii-whole', port: 'out' }, to: { moduleId: 'ascii-whole-bits', port: 'in' } },
        { from: { moduleId: 'ascii-whole-bits', port: 'out' }, to: { moduleId: 'ascii-whole-hex', port: 'in' } },
        { from: { moduleId: 'ascii-whole-hex', port: 'out' }, to: { moduleId: 'ascii-whole-out', port: 'in' } },

        { from: { moduleId: 'ascii-ticked', port: 'out' }, to: { moduleId: 'ascii-tick-bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'ascii-tick-bridge', port: 'clock' } },
        { from: { moduleId: 'ascii-tick-bridge', port: 'out' }, to: { moduleId: 'ascii-char-bits', port: 'in' } },
        { from: { moduleId: 'ascii-char-bits', port: 'out' }, to: { moduleId: 'ascii-collect', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'ascii-collect', port: 'clock' } },
        { from: { moduleId: 'ascii-collect', port: 'out' }, to: { moduleId: 'ascii-return', port: 'in' } },
        { from: { moduleId: 'ascii-return', port: 'out' }, to: { moduleId: 'ascii-return-out', port: 'in' } },

        { from: { moduleId: 'hex-sequence', port: 'out' }, to: { moduleId: 'hex-tick-bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'hex-tick-bridge', port: 'clock' } },
        { from: { moduleId: 'hex-tick-bridge', port: 'out' }, to: { moduleId: 'hex-collect', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'hex-collect', port: 'clock' } },
        { from: { moduleId: 'hex-collect', port: 'out' }, to: { moduleId: 'hex-return', port: 'in' } },
        { from: { moduleId: 'hex-return', port: 'out' }, to: { moduleId: 'hex-return-out', port: 'in' } },
      ],
    },
    layout: {
      'ascii-whole': { x: 52, y: 64 },
      'ascii-whole-bits': { x: 340, y: 64 },
      'ascii-whole-hex': { x: 636, y: 64 },
      'ascii-whole-out': { x: 876, y: 64 },

      'ascii-ticked': { x: 52, y: 300 },
      'ascii-tick-bridge': { x: 340, y: 300 },
      'ascii-char-bits': { x: 636, y: 300 },
      'ascii-collect': { x: 928, y: 300 },
      'ascii-return': { x: 1216, y: 300 },
      'ascii-return-out': { x: 1456, y: 300 },

      'hex-sequence': { x: 52, y: 540 },
      'hex-tick-bridge': { x: 340, y: 540 },
      'hex-collect': { x: 636, y: 540 },
      'hex-return': { x: 928, y: 540 },
      'hex-return-out': { x: 1168, y: 540 },

      clock: { x: 340, y: 708 },
    },
  },
  {
    id: 'visible-operator-family',
    name: 'Visible Operator Family',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 175,
    recommendedAfter: ['visible-bridge-family'],
    summary: 'One shared pair of visible input words fans out into XOR, AND, modular addition, and rotate branches so the operator family can be compared directly.',
    pipeline:
      'HexSource(left,right) -> XOR / AND / AddMod / BitShifter -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'left', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'right', defId: 'HexSource', params: { value: '5C' } },

        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'xor-hex', defId: 'BitsToHex', params: {} },
        { id: 'xor-out', defId: 'HexOutput', params: {} },

        { id: 'and', defId: 'AND', params: {} },
        { id: 'and-hex', defId: 'BitsToHex', params: {} },
        { id: 'and-out', defId: 'HexOutput', params: {} },

        { id: 'add', defId: 'AddMod', params: {} },
        { id: 'add-hex', defId: 'BitsToHex', params: {} },
        { id: 'add-out', defId: 'HexOutput', params: {} },

        { id: 'rotate', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } },
        { id: 'rotate-hex', defId: 'BitsToHex', params: {} },
        { id: 'rotate-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'xor-hex', port: 'in' } },
        { from: { moduleId: 'xor-hex', port: 'out' }, to: { moduleId: 'xor-out', port: 'in' } },

        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'and', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'and', port: 'b' } },
        { from: { moduleId: 'and', port: 'out' }, to: { moduleId: 'and-hex', port: 'in' } },
        { from: { moduleId: 'and-hex', port: 'out' }, to: { moduleId: 'and-out', port: 'in' } },

        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'add', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'add', port: 'b' } },
        { from: { moduleId: 'add', port: 'out' }, to: { moduleId: 'add-hex', port: 'in' } },
        { from: { moduleId: 'add-hex', port: 'out' }, to: { moduleId: 'add-out', port: 'in' } },

        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'rotate', port: 'in' } },
        { from: { moduleId: 'rotate', port: 'out' }, to: { moduleId: 'rotate-hex', port: 'in' } },
        { from: { moduleId: 'rotate-hex', port: 'out' }, to: { moduleId: 'rotate-out', port: 'in' } },
      ],
    },
    layout: {
      left: { x: 52, y: 72 },
      right: { x: 52, y: 248 },

      xor: { x: 328, y: 72 },
      'xor-hex': { x: 608, y: 72 },
      'xor-out': { x: 844, y: 72 },

      and: { x: 328, y: 248 },
      'and-hex': { x: 608, y: 248 },
      'and-out': { x: 844, y: 248 },

      add: { x: 1104, y: 72 },
      'add-hex': { x: 1384, y: 72 },
      'add-out': { x: 1620, y: 72 },

      rotate: { x: 1104, y: 248 },
      'rotate-hex': { x: 1384, y: 248 },
      'rotate-out': { x: 1620, y: 248 },
    },
  },
  {
    id: 'visible-stateful-family',
    name: 'Visible Stateful Family',
    group: 'Conditional Clocking',
    stage: 'modern-bit-machines',
    order: 180,
    recommendedAfter: ['visible-operator-family'],
    summary: 'One shared clock fans out into pulse emission, counting, evolving keystream state, and clocked structural traversal so the core stateful family can be compared directly.',
    pipeline:
      'Clock -> BitOutput, Clock -> Counter -> BitOutput, Clock -> LFSR -> BitOutput, and Clock + BitSequenceInput -> ClockedByteRoundIterator -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'clock-out', defId: 'BitOutput', params: {} },

        { id: 'counter', defId: 'Counter', params: { width: 5, value: 0, step: 1 } },
        { id: 'counter-out', defId: 'BitOutput', params: {} },

        { id: 'lfsr', defId: 'LFSR', params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 } },
        { id: 'lfsr-out', defId: 'BitOutput', params: {} },

        { id: 'byte-seed', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 0, 0, 1, 1, 0] } },
        { id: 'iterator', defId: 'ClockedByteRoundIterator', params: {} },
        { id: 'iterator-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'clock-out', port: 'in' } },

        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'counter-out', port: 'in' } },

        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'lfsr-out', port: 'in' } },

        { from: { moduleId: 'byte-seed', port: 'out' }, to: { moduleId: 'iterator', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'iterator', port: 'clock' } },
        { from: { moduleId: 'iterator', port: 'out' }, to: { moduleId: 'iterator-out', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 52, y: 80 },
      'clock-out': { x: 348, y: 80 },

      counter: { x: 52, y: 260 },
      'counter-out': { x: 348, y: 260 },

      lfsr: { x: 708, y: 80 },
      'lfsr-out': { x: 1004, y: 80 },

      'byte-seed': { x: 708, y: 260 },
      iterator: { x: 1004, y: 260 },
      'iterator-out': { x: 1300, y: 260 },
    },
  },
  {
    id: 'visible-stepped-mechanisms',
    name: 'Visible Stepped Mechanisms',
    group: 'Conditional Clocking',
    stage: 'modern-bit-machines',
    order: 185,
    recommendedAfter: ['visible-stateful-family'],
    summary: 'One shared clock drives a stepped rotor branch and a clocked iterator branch so users can compare stateful substitution against pulse-driven structural traversal.',
    pipeline:
      'Clock + TextInput -> Rotor -> TextOutput, and Clock + IV -> ClockedByteRoundIterator -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },

        { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
        {
          id: 'rotor',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: 'Q',
          },
        },
        { id: 'rotor-out', defId: 'TextOutput', params: {} },

        { id: 'seed', defId: 'IV', params: { width: 8, value: 'a6' } },
        { id: 'iterator', defId: 'ClockedByteRoundIterator', params: {} },
        { id: 'iterator-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'rotor', port: 'clock' } },
        { from: { moduleId: 'rotor', port: 'out' }, to: { moduleId: 'rotor-out', port: 'in' } },

        { from: { moduleId: 'seed', port: 'out' }, to: { moduleId: 'iterator', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'iterator', port: 'clock' } },
        { from: { moduleId: 'iterator', port: 'out' }, to: { moduleId: 'iterator-out', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 56, y: 56 },

      text: { x: 56, y: 204 },
      rotor: { x: 340, y: 204 },
      'rotor-out': { x: 624, y: 204 },

      seed: { x: 936, y: 204 },
      iterator: { x: 1220, y: 204 },
      'iterator-out': { x: 1504, y: 204 },
    },
  },
  {
    id: 'visible-control-family',
    name: 'Visible Control Family',
    group: 'Conditional Clocking',
    stage: 'modern-bit-machines',
    order: 190,
    recommendedAfter: ['visible-stepped-mechanisms'],
    summary: 'One shared clock drives a gate branch, a mux branch, and a multi-router branch so users can compare blocking, choosing, and routing on one canvas.',
    pipeline:
      'Clock + BitSequenceInput -> BitsSequenceToTicked -> Gate / Mux, and Clock -> Counter -> MultiRouter',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },

        { id: 'control-seq', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1] } },
        {
          id: 'control-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 1, wrap: false, remainderMode: 'error' },
        },

        { id: 'gate-source', defId: 'IV', params: { width: 8, value: 'a6' } },
        { id: 'gate', defId: 'Gate', params: {} },
        { id: 'gate-out', defId: 'BitOutput', params: {} },

        { id: 'mux-a', defId: 'ConstantBit', params: { value: 0 } },
        { id: 'mux-b', defId: 'ConstantBit', params: { value: 1 } },
        { id: 'mux', defId: 'Mux', params: {} },
        { id: 'mux-out', defId: 'BitOutput', params: {} },

        { id: 'route-source', defId: 'IV', params: { width: 8, value: '3c' } },
        { id: 'route-select', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        { id: 'router', defId: 'MultiRouter', params: { routeCount: '4' } },
        { id: 'route-out-0', defId: 'BitOutput', params: {} },
        { id: 'route-out-1', defId: 'BitOutput', params: {} },
        { id: 'route-out-2', defId: 'BitOutput', params: {} },
        { id: 'route-out-3', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'control-seq', port: 'out' }, to: { moduleId: 'control-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-tick', port: 'clock' } },

        { from: { moduleId: 'gate-source', port: 'out' }, to: { moduleId: 'gate', port: 'in' } },
        { from: { moduleId: 'control-tick', port: 'out' }, to: { moduleId: 'gate', port: 'control' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'gate-out', port: 'in' } },

        { from: { moduleId: 'control-tick', port: 'out' }, to: { moduleId: 'mux', port: 'select' } },
        { from: { moduleId: 'mux-a', port: 'out' }, to: { moduleId: 'mux', port: 'a' } },
        { from: { moduleId: 'mux-b', port: 'out' }, to: { moduleId: 'mux', port: 'b' } },
        { from: { moduleId: 'mux', port: 'out' }, to: { moduleId: 'mux-out', port: 'in' } },

        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'route-select', port: 'clock' } },
        { from: { moduleId: 'route-source', port: 'out' }, to: { moduleId: 'router', port: 'in' } },
        { from: { moduleId: 'route-select', port: 'out' }, to: { moduleId: 'router', port: 'select' } },
        { from: { moduleId: 'router', port: 'out0' }, to: { moduleId: 'route-out-0', port: 'in' } },
        { from: { moduleId: 'router', port: 'out1' }, to: { moduleId: 'route-out-1', port: 'in' } },
        { from: { moduleId: 'router', port: 'out2' }, to: { moduleId: 'route-out-2', port: 'in' } },
        { from: { moduleId: 'router', port: 'out3' }, to: { moduleId: 'route-out-3', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 56, y: 52 },
      'control-seq': { x: 56, y: 196 },
      'control-tick': { x: 340, y: 196 },

      'gate-source': { x: 624, y: 56 },
      gate: { x: 900, y: 56 },
      'gate-out': { x: 1176, y: 56 },

      'mux-a': { x: 624, y: 196 },
      'mux-b': { x: 624, y: 336 },
      mux: { x: 900, y: 252 },
      'mux-out': { x: 1176, y: 252 },

      'route-source': { x: 1460, y: 56 },
      'route-select': { x: 1460, y: 252 },
      router: { x: 1740, y: 156 },
      'route-out-0': { x: 2016, y: 24 },
      'route-out-1': { x: 2016, y: 120 },
      'route-out-2': { x: 2016, y: 216 },
      'route-out-3': { x: 2016, y: 312 },
    },
  },
  {
    id: 'integer-round-trip',
    name: 'Integer Round Trip',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 220,
    summary: 'A visible bit word becomes an exact integer-domain value, then re-enters the bit domain at an explicit width.',
    pipeline: 'BitSource -> BitsToInteger -> IntegerOutput, plus IntegerToBits(width=8) -> BitOutput',
    project: {
      modules: [
        { id: 'bits', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 0, 1, 1, 0] } },
        { id: 'to-integer', defId: 'BitsToInteger', params: {} },
        { id: 'integer-out', defId: 'IntegerOutput', params: {} },
        { id: 'to-bits', defId: 'IntegerToBits', params: { width: 8 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits', port: 'out' }, to: { moduleId: 'to-integer', port: 'in' } },
        { from: { moduleId: 'to-integer', port: 'out' }, to: { moduleId: 'integer-out', port: 'in' } },
        { from: { moduleId: 'to-integer', port: 'out' }, to: { moduleId: 'to-bits', port: 'in' } },
        { from: { moduleId: 'to-bits', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    },
    layout: {
      bits: { x: 72, y: 188 },
      'to-integer': { x: 340, y: 188 },
      'integer-out': { x: 612, y: 80 },
      'to-bits': { x: 612, y: 292 },
      'bits-out': { x: 884, y: 292 },
    },
  },
  {
    id: 'prime-field-inverse-check',
    name: 'Prime-Field Inverse Check',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 223,
    recommendedAfter: ['integer-round-trip'],
    summary: 'A visible integer-domain field element is inverted modulo a prime p, then multiplied back to prove the result is 1 in the field.',
    pipeline: 'BitSource -> BitsToInteger -> FieldInverse(p=5) and FieldMul(p=5) -> IntegerOutput sinks',
    project: {
      modules: [
        { id: 'bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'to-integer', defId: 'BitsToInteger', params: {} },
        { id: 'field-inverse', defId: 'FieldInverse', params: { modulus: 5 } },
        { id: 'inverse-out', defId: 'IntegerOutput', params: {} },
        { id: 'field-mul', defId: 'FieldMul', params: { modulus: 5 } },
        { id: 'check-out', defId: 'IntegerOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits', port: 'out' }, to: { moduleId: 'to-integer', port: 'in' } },
        { from: { moduleId: 'to-integer', port: 'out' }, to: { moduleId: 'field-inverse', port: 'in' } },
        { from: { moduleId: 'field-inverse', port: 'out' }, to: { moduleId: 'inverse-out', port: 'in' } },
        { from: { moduleId: 'to-integer', port: 'out' }, to: { moduleId: 'field-mul', port: 'a' } },
        { from: { moduleId: 'field-inverse', port: 'out' }, to: { moduleId: 'field-mul', port: 'b' } },
        { from: { moduleId: 'field-mul', port: 'out' }, to: { moduleId: 'check-out', port: 'in' } },
      ],
    },
    layout: {
      bits: { x: 72, y: 220 },
      'to-integer': { x: 340, y: 220 },
      'field-inverse': { x: 620, y: 120 },
      'inverse-out': { x: 900, y: 120 },
      'field-mul': { x: 620, y: 332 },
      'check-out': { x: 900, y: 332 },
    },
  },
  {
    id: 'visible-point-mechanics',
    name: 'Visible Point Mechanics',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 226,
    recommendedAfter: ['prime-field-inverse-check'],
    summary: 'A visible point is negated, added to its inverse to reach infinity, then doubled and compared with adding the point to itself.',
    pipeline: 'PointSource -> PointNegate / PointAdd / PointDouble / PointOnCurve -> PointOutput + BitOutput',
    project: {
      modules: [
        { id: 'point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'negate', defId: 'PointNegate', params: { p: 17, a: 2, b: 3 } },
        { id: 'inverse-sum', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'inverse-out', defId: 'PointOutput', params: {} },
        { id: 'double', defId: 'PointDouble', params: { p: 17, a: 2, b: 3 } },
        { id: 'double-out', defId: 'PointOutput', params: {} },
        { id: 'self-add', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'self-add-out', defId: 'PointOutput', params: {} },
        { id: 'on-curve', defId: 'PointOnCurve', params: { p: 17, a: 2, b: 3 } },
        { id: 'curve-check-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'negate', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'inverse-sum', port: 'a' } },
        { from: { moduleId: 'negate', port: 'out' }, to: { moduleId: 'inverse-sum', port: 'b' } },
        { from: { moduleId: 'inverse-sum', port: 'out' }, to: { moduleId: 'inverse-out', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'double', port: 'in' } },
        { from: { moduleId: 'double', port: 'out' }, to: { moduleId: 'double-out', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'self-add', port: 'a' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'self-add', port: 'b' } },
        { from: { moduleId: 'self-add', port: 'out' }, to: { moduleId: 'self-add-out', port: 'in' } },
        { from: { moduleId: 'double', port: 'out' }, to: { moduleId: 'on-curve', port: 'in' } },
        { from: { moduleId: 'on-curve', port: 'out' }, to: { moduleId: 'curve-check-out', port: 'in' } },
      ],
    },
    layout: {
      point: { x: 72, y: 220 },
      negate: { x: 360, y: 92 },
      'inverse-sum': { x: 640, y: 92 },
      'inverse-out': { x: 928, y: 92 },
      double: { x: 360, y: 260 },
      'double-out': { x: 928, y: 232 },
      'self-add': { x: 640, y: 404 },
      'self-add-out': { x: 928, y: 404 },
      'on-curve': { x: 640, y: 260 },
      'curve-check-out': { x: 928, y: 556 },
    },
  },
  {
    id: 'visible-scalar-multiplication',
    name: 'Visible Scalar Multiplication',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227,
    recommendedAfter: ['visible-point-mechanics'],
    summary: 'A visible integer scalar acts on one visible point so students can compare 2P with doubling, see 0P become infinity, and verify 3P = 2P + P.',
    pipeline: 'BitSource -> BitsToInteger -> ScalarMultiply(point) -> PointOutput, compared with PointDouble and PointAdd on the same curve',
    project: {
      modules: [
        { id: 'point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'scalar-2-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 0] } },
        { id: 'scalar-2', defId: 'BitsToInteger', params: {} },
        { id: 'times-2', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'times-2-out', defId: 'PointOutput', params: {} },
        { id: 'double', defId: 'PointDouble', params: { p: 17, a: 2, b: 3 } },
        { id: 'double-out', defId: 'PointOutput', params: {} },
        { id: 'scalar-0-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0] } },
        { id: 'scalar-0', defId: 'BitsToInteger', params: {} },
        { id: 'times-0', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'times-0-out', defId: 'PointOutput', params: {} },
        { id: 'scalar-1-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 1] } },
        { id: 'scalar-1', defId: 'BitsToInteger', params: {} },
        { id: 'times-1', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'times-1-out', defId: 'PointOutput', params: {} },
        { id: 'scalar-3-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'scalar-3', defId: 'BitsToInteger', params: {} },
        { id: 'times-3', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'times-3-out', defId: 'PointOutput', params: {} },
        { id: 'verify-3-add', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-3-out', defId: 'PointOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'scalar-2-bits', port: 'out' }, to: { moduleId: 'scalar-2', port: 'in' } },
        { from: { moduleId: 'scalar-2', port: 'out' }, to: { moduleId: 'times-2', port: 'scalar' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'times-2', port: 'point' } },
        { from: { moduleId: 'times-2', port: 'out' }, to: { moduleId: 'times-2-out', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'double', port: 'in' } },
        { from: { moduleId: 'double', port: 'out' }, to: { moduleId: 'double-out', port: 'in' } },
        { from: { moduleId: 'scalar-0-bits', port: 'out' }, to: { moduleId: 'scalar-0', port: 'in' } },
        { from: { moduleId: 'scalar-0', port: 'out' }, to: { moduleId: 'times-0', port: 'scalar' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'times-0', port: 'point' } },
        { from: { moduleId: 'times-0', port: 'out' }, to: { moduleId: 'times-0-out', port: 'in' } },
        { from: { moduleId: 'scalar-1-bits', port: 'out' }, to: { moduleId: 'scalar-1', port: 'in' } },
        { from: { moduleId: 'scalar-1', port: 'out' }, to: { moduleId: 'times-1', port: 'scalar' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'times-1', port: 'point' } },
        { from: { moduleId: 'times-1', port: 'out' }, to: { moduleId: 'times-1-out', port: 'in' } },
        { from: { moduleId: 'scalar-3-bits', port: 'out' }, to: { moduleId: 'scalar-3', port: 'in' } },
        { from: { moduleId: 'scalar-3', port: 'out' }, to: { moduleId: 'times-3', port: 'scalar' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'times-3', port: 'point' } },
        { from: { moduleId: 'times-3', port: 'out' }, to: { moduleId: 'times-3-out', port: 'in' } },
        { from: { moduleId: 'times-2', port: 'out' }, to: { moduleId: 'verify-3-add', port: 'a' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'verify-3-add', port: 'b' } },
        { from: { moduleId: 'verify-3-add', port: 'out' }, to: { moduleId: 'verify-3-out', port: 'in' } },
      ],
    },
    layout: {
      point: { x: 72, y: 248 },
      'scalar-2-bits': { x: 72, y: 56 },
      'scalar-2': { x: 332, y: 56 },
      'times-2': { x: 620, y: 56 },
      'times-2-out': { x: 920, y: 56 },
      double: { x: 620, y: 188 },
      'double-out': { x: 920, y: 188 },
      'scalar-0-bits': { x: 72, y: 360 },
      'scalar-0': { x: 332, y: 360 },
      'times-0': { x: 620, y: 360 },
      'times-0-out': { x: 920, y: 360 },
      'scalar-1-bits': { x: 72, y: 492 },
      'scalar-1': { x: 332, y: 492 },
      'times-1': { x: 620, y: 492 },
      'times-1-out': { x: 920, y: 492 },
      'scalar-3-bits': { x: 72, y: 624 },
      'scalar-3': { x: 332, y: 624 },
      'times-3': { x: 620, y: 624 },
      'times-3-out': { x: 920, y: 624 },
      'verify-3-add': { x: 920, y: 756 },
      'verify-3-out': { x: 1196, y: 756 },
    },
  },
  {
    id: 'visible-double-and-add',
    name: 'Visible Double-And-Add',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227.5,
    recommendedAfter: ['visible-scalar-multiplication'],
    summary:
      'One visible scalar is decomposed into live control bits, one running addend is doubled step by step, and one accumulator either stays or absorbs that addend until the explicit construction matches shipped ScalarMultiply.',
    pipeline:
      'BitSource -> BitsToInteger -> IntegerToBits -> BitWindow(step bits) + PointSource(G) -> PointNegate/PointAdd(start at ∞) -> PointDouble + PointAdd + PointSelector -> PointEquals -> BitOutput',
    project: {
      modules: [
        { id: 'point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'scalar-bits', defId: 'BitSource', params: { stream: [1, 0, 1] } },
        { id: 'scalar', defId: 'BitsToInteger', params: {} },
        { id: 'scalar-out', defId: 'IntegerOutput', params: {} },
        { id: 'scalar-expanded', defId: 'IntegerToBits', params: { width: 3 } },
        { id: 'bit-lsb', defId: 'BitWindow', params: { start: 2, width: 1 } },
        { id: 'bit-mid', defId: 'BitWindow', params: { start: 1, width: 1 } },
        { id: 'bit-msb', defId: 'BitWindow', params: { start: 0, width: 1 } },
        { id: 'bit-lsb-out', defId: 'BitOutput', params: {} },
        { id: 'bit-mid-out', defId: 'BitOutput', params: {} },
        { id: 'bit-msb-out', defId: 'BitOutput', params: {} },
        { id: 'negate', defId: 'PointNegate', params: { p: 17, a: 2, b: 3 } },
        { id: 'infinity-start', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'infinity-out', defId: 'PointOutput', params: {} },
        { id: 'step0-candidate', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'step0-select', defId: 'PointSelector', params: { p: 17, a: 2, b: 3 } },
        { id: 'step0-out', defId: 'PointOutput', params: {} },
        { id: 'step0-double', defId: 'PointDouble', params: { p: 17, a: 2, b: 3 } },
        { id: 'step0-double-out', defId: 'PointOutput', params: {} },
        { id: 'step1-candidate', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'step1-select', defId: 'PointSelector', params: { p: 17, a: 2, b: 3 } },
        { id: 'step1-out', defId: 'PointOutput', params: {} },
        { id: 'step1-double', defId: 'PointDouble', params: { p: 17, a: 2, b: 3 } },
        { id: 'step1-double-out', defId: 'PointOutput', params: {} },
        { id: 'step2-candidate', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'step2-select', defId: 'PointSelector', params: { p: 17, a: 2, b: 3 } },
        { id: 'explicit-out', defId: 'PointOutput', params: {} },
        { id: 'step2-double', defId: 'PointDouble', params: { p: 17, a: 2, b: 3 } },
        { id: 'step2-double-out', defId: 'PointOutput', params: {} },
        { id: 'reference', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'reference-out', defId: 'PointOutput', params: {} },
        { id: 'match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'scalar-bits', port: 'out' }, to: { moduleId: 'scalar', port: 'in' } },
        { from: { moduleId: 'scalar', port: 'out' }, to: { moduleId: 'scalar-out', port: 'in' } },
        { from: { moduleId: 'scalar', port: 'out' }, to: { moduleId: 'scalar-expanded', port: 'in' } },
        { from: { moduleId: 'scalar', port: 'out' }, to: { moduleId: 'reference', port: 'scalar' } },
        { from: { moduleId: 'scalar-expanded', port: 'out' }, to: { moduleId: 'bit-lsb', port: 'in' } },
        { from: { moduleId: 'scalar-expanded', port: 'out' }, to: { moduleId: 'bit-mid', port: 'in' } },
        { from: { moduleId: 'scalar-expanded', port: 'out' }, to: { moduleId: 'bit-msb', port: 'in' } },
        { from: { moduleId: 'bit-lsb', port: 'out' }, to: { moduleId: 'bit-lsb-out', port: 'in' } },
        { from: { moduleId: 'bit-mid', port: 'out' }, to: { moduleId: 'bit-mid-out', port: 'in' } },
        { from: { moduleId: 'bit-msb', port: 'out' }, to: { moduleId: 'bit-msb-out', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'negate', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'infinity-start', port: 'a' } },
        { from: { moduleId: 'negate', port: 'out' }, to: { moduleId: 'infinity-start', port: 'b' } },
        { from: { moduleId: 'infinity-start', port: 'out' }, to: { moduleId: 'infinity-out', port: 'in' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'reference', port: 'point' } },
        { from: { moduleId: 'infinity-start', port: 'out' }, to: { moduleId: 'step0-candidate', port: 'a' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'step0-candidate', port: 'b' } },
        { from: { moduleId: 'infinity-start', port: 'out' }, to: { moduleId: 'step0-select', port: 'keep' } },
        { from: { moduleId: 'step0-candidate', port: 'out' }, to: { moduleId: 'step0-select', port: 'take' } },
        { from: { moduleId: 'bit-lsb', port: 'out' }, to: { moduleId: 'step0-select', port: 'select' } },
        { from: { moduleId: 'step0-select', port: 'out' }, to: { moduleId: 'step0-out', port: 'in' } },
        { from: { moduleId: 'step0-select', port: 'out' }, to: { moduleId: 'step1-candidate', port: 'a' } },
        { from: { moduleId: 'step0-select', port: 'out' }, to: { moduleId: 'step1-select', port: 'keep' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'step0-double', port: 'in' } },
        { from: { moduleId: 'step0-double', port: 'out' }, to: { moduleId: 'step0-double-out', port: 'in' } },
        { from: { moduleId: 'step0-double', port: 'out' }, to: { moduleId: 'step1-candidate', port: 'b' } },
        { from: { moduleId: 'step0-double', port: 'out' }, to: { moduleId: 'step1-double', port: 'in' } },
        { from: { moduleId: 'step1-candidate', port: 'out' }, to: { moduleId: 'step1-select', port: 'take' } },
        { from: { moduleId: 'bit-mid', port: 'out' }, to: { moduleId: 'step1-select', port: 'select' } },
        { from: { moduleId: 'step1-select', port: 'out' }, to: { moduleId: 'step1-out', port: 'in' } },
        { from: { moduleId: 'step1-select', port: 'out' }, to: { moduleId: 'step2-candidate', port: 'a' } },
        { from: { moduleId: 'step1-select', port: 'out' }, to: { moduleId: 'step2-select', port: 'keep' } },
        { from: { moduleId: 'step1-double', port: 'out' }, to: { moduleId: 'step1-double-out', port: 'in' } },
        { from: { moduleId: 'step1-double', port: 'out' }, to: { moduleId: 'step2-candidate', port: 'b' } },
        { from: { moduleId: 'step1-double', port: 'out' }, to: { moduleId: 'step2-double', port: 'in' } },
        { from: { moduleId: 'step2-candidate', port: 'out' }, to: { moduleId: 'step2-select', port: 'take' } },
        { from: { moduleId: 'bit-msb', port: 'out' }, to: { moduleId: 'step2-select', port: 'select' } },
        { from: { moduleId: 'step2-select', port: 'out' }, to: { moduleId: 'explicit-out', port: 'in' } },
        { from: { moduleId: 'step2-select', port: 'out' }, to: { moduleId: 'match', port: 'a' } },
        { from: { moduleId: 'step2-double', port: 'out' }, to: { moduleId: 'step2-double-out', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'reference-out', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'match', port: 'b' } },
        { from: { moduleId: 'match', port: 'out' }, to: { moduleId: 'match-out', port: 'in' } },
      ],
    },
    layout: {
      point: { x: 64, y: 348 },
      'scalar-bits': { x: 64, y: 48 },
      scalar: { x: 316, y: 48 },
      'scalar-out': { x: 564, y: 48 },
      'scalar-expanded': { x: 316, y: 148 },
      'bit-msb': { x: 564, y: 148 },
      'bit-mid': { x: 564, y: 248 },
      'bit-lsb': { x: 564, y: 348 },
      'bit-msb-out': { x: 812, y: 148 },
      'bit-mid-out': { x: 812, y: 248 },
      'bit-lsb-out': { x: 812, y: 348 },
      negate: { x: 316, y: 452 },
      'infinity-start': { x: 564, y: 452 },
      'infinity-out': { x: 812, y: 452 },
      'step0-candidate': { x: 1080, y: 348 },
      'step0-select': { x: 1340, y: 348 },
      'step0-out': { x: 1600, y: 300 },
      'step0-double': { x: 1080, y: 468 },
      'step0-double-out': { x: 1600, y: 420 },
      'step1-candidate': { x: 1860, y: 300 },
      'step1-select': { x: 2120, y: 300 },
      'step1-out': { x: 2380, y: 252 },
      'step1-double': { x: 1860, y: 420 },
      'step1-double-out': { x: 2380, y: 420 },
      'step2-candidate': { x: 2640, y: 252 },
      'step2-select': { x: 2900, y: 252 },
      'explicit-out': { x: 3160, y: 204 },
      'step2-double': { x: 2640, y: 372 },
      'step2-double-out': { x: 3160, y: 372 },
      reference: { x: 2640, y: 60 },
      'reference-out': { x: 2900, y: 60 },
      match: { x: 3420, y: 132 },
      'match-out': { x: 3670, y: 132 },
    },
  },
  {
    id: 'toy-curve-point-map',
    name: 'Toy Curve Point Map',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227.75,
    recommendedAfter: ['visible-double-and-add'],
    summary:
      'One ToyPointMap module turns the toy curve y^2 = x^3 + 2x + 3 (mod 17) into a visible finite-field point set while a neighboring branch machine-checks the selected point and 3P against shipped ECC arithmetic.',
    pipeline:
      'ToyPointMap(selectedPoint, walk3) + PointSource(P) + BitSource(3) -> BitsToInteger -> ScalarMultiply -> PointEquals(selected/walk3 matches) -> BitOutput',
    project: {
      modules: [
        { id: 'map', defId: 'ToyPointMap', params: { p: 17, a: 2, b: 3, selectedX: 5, selectedY: 6, walkLength: 5 } },
        { id: 'map-selected-out', defId: 'PointOutput', params: {} },
        { id: 'map-walk3-out', defId: 'PointOutput', params: {} },
        { id: 'reference-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'reference-point-out', defId: 'PointOutput', params: {} },
        { id: 'selected-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'selected-match-out', defId: 'BitOutput', params: {} },
        { id: 'scalar-3-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'scalar-3', defId: 'BitsToInteger', params: {} },
        { id: 'scalar-3-out', defId: 'IntegerOutput', params: {} },
        { id: 'reference-3p', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'reference-3p-out', defId: 'PointOutput', params: {} },
        { id: 'walk3-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'walk3-match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'map', port: 'selectedPoint' }, to: { moduleId: 'map-selected-out', port: 'in' } },
        { from: { moduleId: 'map', port: 'selectedPoint' }, to: { moduleId: 'selected-match', port: 'a' } },
        { from: { moduleId: 'reference-point', port: 'out' }, to: { moduleId: 'reference-point-out', port: 'in' } },
        { from: { moduleId: 'reference-point', port: 'out' }, to: { moduleId: 'selected-match', port: 'b' } },
        { from: { moduleId: 'selected-match', port: 'out' }, to: { moduleId: 'selected-match-out', port: 'in' } },
        { from: { moduleId: 'map', port: 'walk3' }, to: { moduleId: 'map-walk3-out', port: 'in' } },
        { from: { moduleId: 'map', port: 'walk3' }, to: { moduleId: 'walk3-match', port: 'a' } },
        { from: { moduleId: 'scalar-3-bits', port: 'out' }, to: { moduleId: 'scalar-3', port: 'in' } },
        { from: { moduleId: 'scalar-3', port: 'out' }, to: { moduleId: 'scalar-3-out', port: 'in' } },
        { from: { moduleId: 'scalar-3', port: 'out' }, to: { moduleId: 'reference-3p', port: 'scalar' } },
        { from: { moduleId: 'reference-point', port: 'out' }, to: { moduleId: 'reference-3p', port: 'point' } },
        { from: { moduleId: 'reference-3p', port: 'out' }, to: { moduleId: 'reference-3p-out', port: 'in' } },
        { from: { moduleId: 'reference-3p', port: 'out' }, to: { moduleId: 'walk3-match', port: 'b' } },
        { from: { moduleId: 'walk3-match', port: 'out' }, to: { moduleId: 'walk3-match-out', port: 'in' } },
      ],
    },
    layout: {
      map: { x: 84, y: 184 },
      'map-selected-out': { x: 372, y: 72 },
      'map-walk3-out': { x: 372, y: 256 },
      'reference-point': { x: 700, y: 72 },
      'reference-point-out': { x: 980, y: 72 },
      'selected-match': { x: 700, y: 184 },
      'selected-match-out': { x: 980, y: 184 },
      'scalar-3-bits': { x: 700, y: 332 },
      'scalar-3': { x: 980, y: 332 },
      'scalar-3-out': { x: 1240, y: 332 },
      'reference-3p': { x: 1240, y: 472 },
      'reference-3p-out': { x: 1508, y: 472 },
      'walk3-match': { x: 1240, y: 184 },
      'walk3-match-out': { x: 1508, y: 184 },
    },
  },
  {
    id: 'visible-ecdh-key-agreement',
    name: 'Visible ECDH Key Agreement',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228,
    recommendedAfter: ['visible-double-and-add'],
    summary:
      'One shared base point fans out to Alice and Bob, each side derives a visible public point, and both repeated point action paths land on the same shared point, not finished key material.',
    pipeline:
      'PointSource(G) fan-out + private scalar bridges -> ScalarMultiply(publics/shared points) -> PointEquals -> PointOutput + BitOutput',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'alice-private-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'alice-private', defId: 'BitsToInteger', params: {} },
        { id: 'alice-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'alice-public-out', defId: 'PointOutput', params: {} },
        { id: 'bob-private-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'bob-private', defId: 'BitsToInteger', params: {} },
        { id: 'bob-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'bob-public-out', defId: 'PointOutput', params: {} },
        { id: 'alice-shared', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'alice-shared-out', defId: 'PointOutput', params: {} },
        { id: 'bob-shared', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'bob-shared-out', defId: 'PointOutput', params: {} },
        { id: 'shared-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'shared-match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'alice-private-bits', port: 'out' }, to: { moduleId: 'alice-private', port: 'in' } },
        { from: { moduleId: 'alice-private', port: 'out' }, to: { moduleId: 'alice-public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'alice-public', port: 'point' } },
        { from: { moduleId: 'alice-public', port: 'out' }, to: { moduleId: 'alice-public-out', port: 'in' } },
        { from: { moduleId: 'bob-private-bits', port: 'out' }, to: { moduleId: 'bob-private', port: 'in' } },
        { from: { moduleId: 'bob-private', port: 'out' }, to: { moduleId: 'bob-public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'bob-public', port: 'point' } },
        { from: { moduleId: 'bob-public', port: 'out' }, to: { moduleId: 'bob-public-out', port: 'in' } },
        { from: { moduleId: 'alice-private', port: 'out' }, to: { moduleId: 'alice-shared', port: 'scalar' } },
        { from: { moduleId: 'bob-public', port: 'out' }, to: { moduleId: 'alice-shared', port: 'point' } },
        { from: { moduleId: 'alice-shared', port: 'out' }, to: { moduleId: 'alice-shared-out', port: 'in' } },
        { from: { moduleId: 'bob-private', port: 'out' }, to: { moduleId: 'bob-shared', port: 'scalar' } },
        { from: { moduleId: 'alice-public', port: 'out' }, to: { moduleId: 'bob-shared', port: 'point' } },
        { from: { moduleId: 'bob-shared', port: 'out' }, to: { moduleId: 'bob-shared-out', port: 'in' } },
        { from: { moduleId: 'alice-shared', port: 'out' }, to: { moduleId: 'shared-match', port: 'a' } },
        { from: { moduleId: 'bob-shared', port: 'out' }, to: { moduleId: 'shared-match', port: 'b' } },
        { from: { moduleId: 'shared-match', port: 'out' }, to: { moduleId: 'shared-match-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 72, y: 316 },
      'alice-private-bits': { x: 72, y: 52 },
      'alice-private': { x: 332, y: 52 },
      'alice-public': { x: 620, y: 52 },
      'alice-public-out': { x: 928, y: 52 },
      'bob-private-bits': { x: 72, y: 580 },
      'bob-private': { x: 332, y: 580 },
      'bob-public': { x: 620, y: 580 },
      'bob-public-out': { x: 928, y: 580 },
      'alice-shared': { x: 928, y: 200 },
      'alice-shared-out': { x: 1216, y: 200 },
      'bob-shared': { x: 928, y: 432 },
      'bob-shared-out': { x: 1216, y: 432 },
      'shared-match': { x: 1216, y: 316 },
      'shared-match-out': { x: 1496, y: 316 },
    },
  },
  {
    id: 'secp256k1-ecdh',
    name: 'secp256k1 ECDH',
    group: 'ECC',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.5,
    recommendedAfter: ['visible-ecdh-key-agreement'],
    summary:
      'The same Diffie-Hellman key agreement structure from the toy-curve demo, now running on the real secp256k1 curve used by Bitcoin. NamedCurveBasePoint supplies the generator G without manual hex entry, and both shared-secret branches still land on the same point.',
    pipeline:
      'NamedCurveBasePoint(secp256k1) -> fan-out G to ScalarMultiply(alice-pub, bob-pub) -> cross-shared ScalarMultiply -> PointEquals -> BitOutput',
    project: {
      modules: [
        { id: 'g', defId: 'NamedCurveBasePoint', params: { curve: 'secp256k1' } },
        { id: 'alice-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 0, 1, 1] } },
        { id: 'alice-scalar', defId: 'BitsToInteger', params: {} },
        {
          id: 'alice-pub',
          defId: 'ScalarMultiply',
          params: {
            p: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
            a: '0',
            b: '7',
          },
        },
        { id: 'alice-pub-out', defId: 'PointOutput', params: {} },
        { id: 'bob-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 1, 0, 1] } },
        { id: 'bob-scalar', defId: 'BitsToInteger', params: {} },
        {
          id: 'bob-pub',
          defId: 'ScalarMultiply',
          params: {
            p: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
            a: '0',
            b: '7',
          },
        },
        { id: 'bob-pub-out', defId: 'PointOutput', params: {} },
        {
          id: 'alice-shared',
          defId: 'ScalarMultiply',
          params: {
            p: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
            a: '0',
            b: '7',
          },
        },
        { id: 'alice-shared-out', defId: 'PointOutput', params: {} },
        {
          id: 'bob-shared',
          defId: 'ScalarMultiply',
          params: {
            p: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
            a: '0',
            b: '7',
          },
        },
        { id: 'bob-shared-out', defId: 'PointOutput', params: {} },
        {
          id: 'verify',
          defId: 'PointEquals',
          params: {
            p: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F',
            a: '0',
            b: '7',
          },
        },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'alice-bits', port: 'out' }, to: { moduleId: 'alice-scalar', port: 'in' } },
        { from: { moduleId: 'alice-scalar', port: 'out' }, to: { moduleId: 'alice-pub', port: 'scalar' } },
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'alice-pub', port: 'point' } },
        { from: { moduleId: 'alice-pub', port: 'out' }, to: { moduleId: 'alice-pub-out', port: 'in' } },
        { from: { moduleId: 'bob-bits', port: 'out' }, to: { moduleId: 'bob-scalar', port: 'in' } },
        { from: { moduleId: 'bob-scalar', port: 'out' }, to: { moduleId: 'bob-pub', port: 'scalar' } },
        { from: { moduleId: 'g', port: 'point' }, to: { moduleId: 'bob-pub', port: 'point' } },
        { from: { moduleId: 'bob-pub', port: 'out' }, to: { moduleId: 'bob-pub-out', port: 'in' } },
        { from: { moduleId: 'alice-scalar', port: 'out' }, to: { moduleId: 'alice-shared', port: 'scalar' } },
        { from: { moduleId: 'bob-pub', port: 'out' }, to: { moduleId: 'alice-shared', port: 'point' } },
        { from: { moduleId: 'alice-shared', port: 'out' }, to: { moduleId: 'alice-shared-out', port: 'in' } },
        { from: { moduleId: 'bob-scalar', port: 'out' }, to: { moduleId: 'bob-shared', port: 'scalar' } },
        { from: { moduleId: 'alice-pub', port: 'out' }, to: { moduleId: 'bob-shared', port: 'point' } },
        { from: { moduleId: 'bob-shared', port: 'out' }, to: { moduleId: 'bob-shared-out', port: 'in' } },
        { from: { moduleId: 'alice-shared', port: 'out' }, to: { moduleId: 'verify', port: 'a' } },
        { from: { moduleId: 'bob-shared', port: 'out' }, to: { moduleId: 'verify', port: 'b' } },
        { from: { moduleId: 'verify', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
      ],
    },
    layout: {
      'g':              { x: 72,  y: 316 },
      'alice-bits':     { x: 72,  y: 52  },
      'alice-scalar':   { x: 332, y: 52  },
      'alice-pub':      { x: 620, y: 52  },
      'alice-pub-out':  { x: 928, y: 52  },
      'bob-bits':       { x: 72,  y: 580 },
      'bob-scalar':     { x: 332, y: 580 },
      'bob-pub':        { x: 620, y: 580 },
      'bob-pub-out':    { x: 928, y: 580 },
      'alice-shared':   { x: 928, y: 200 },
      'alice-shared-out': { x: 1216, y: 200 },
      'bob-shared':     { x: 928, y: 432 },
      'bob-shared-out': { x: 1216, y: 432 },
      'verify':         { x: 1216, y: 316 },
      'verify-out':     { x: 1496, y: 316 },
    },
  },
  {
    id: 'gf2-multiply',
    name: 'GF(2⁸) Multiply',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.7,
    recommendedAfter: ['secp256k1-ecdh'],
    summary:
      'Two byte values are multiplied in GF(2⁸) under the AES reduction polynomial 0x11B. The result is the first half of what AES MixColumns does to each column byte: repeated GF field multiplications and XOR reductions keep every intermediate value inside one byte.',
    pipeline: 'BitSource(0x57) + BitSource(0x83) -> GF2Mul(poly=11B) -> HexOutput',
    project: {
      modules: [
        { id: 'byte-a', defId: 'HexSource', params: { value: '57' } },
        { id: 'byte-b', defId: 'HexSource', params: { value: '83' } },
        { id: 'gf-mul', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'to-hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
        { id: 'byte-a2', defId: 'HexSource', params: { value: '02' } },
        { id: 'byte-b2', defId: 'HexSource', params: { value: '02' } },
        { id: 'gf-mul2', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'to-hex2', defId: 'BitsToHex', params: {} },
        { id: 'out2', defId: 'HexOutput', params: {} },
        { id: 'byte-inv', defId: 'HexSource', params: { value: '35' } },
        { id: 'gf-inv', defId: 'GF2Inv', params: { poly: '11B' } },
        { id: 'to-hex-inv', defId: 'BitsToHex', params: {} },
        { id: 'out-inv', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'byte-a', port: 'out' }, to: { moduleId: 'gf-mul', port: 'a' } },
        { from: { moduleId: 'byte-b', port: 'out' }, to: { moduleId: 'gf-mul', port: 'b' } },
        { from: { moduleId: 'gf-mul', port: 'out' }, to: { moduleId: 'to-hex', port: 'in' } },
        { from: { moduleId: 'to-hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
        { from: { moduleId: 'byte-a2', port: 'out' }, to: { moduleId: 'gf-mul2', port: 'a' } },
        { from: { moduleId: 'byte-b2', port: 'out' }, to: { moduleId: 'gf-mul2', port: 'b' } },
        { from: { moduleId: 'gf-mul2', port: 'out' }, to: { moduleId: 'to-hex2', port: 'in' } },
        { from: { moduleId: 'to-hex2', port: 'out' }, to: { moduleId: 'out2', port: 'in' } },
        { from: { moduleId: 'byte-inv', port: 'out' }, to: { moduleId: 'gf-inv', port: 'in' } },
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'to-hex-inv', port: 'in' } },
        { from: { moduleId: 'to-hex-inv', port: 'out' }, to: { moduleId: 'out-inv', port: 'in' } },
      ],
    },
    layout: {
      'byte-a':      { x: 72,  y: 52  },
      'byte-b':      { x: 72,  y: 200 },
      'gf-mul':      { x: 340, y: 126 },
      'to-hex':      { x: 600, y: 126 },
      'out':         { x: 860, y: 126 },
      'byte-a2':     { x: 72,  y: 400 },
      'byte-b2':     { x: 72,  y: 548 },
      'gf-mul2':     { x: 340, y: 474 },
      'to-hex2':     { x: 600, y: 474 },
      'out2':        { x: 860, y: 474 },
      'byte-inv':    { x: 72,  y: 720 },
      'gf-inv':      { x: 340, y: 720 },
      'to-hex-inv':  { x: 600, y: 720 },
      'out-inv':     { x: 860, y: 720 },
    },
  },
  {
    id: 'visible-mix-columns',
    name: 'Visible MixColumns',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.8,
    recommendedAfter: ['gf2-multiply'],
    summary:
      'One full column of the AES MixColumns operation built from explicit GF(2⁸) multiplications and byte-level XOR. Uses the NIST FIPS 197 test vector [D4, BF, 5D, 30] and produces the known correct output [04, 66, 81, E5]. Every intermediate field product and XOR combination is visible.',
    pipeline:
      'HexSource(s0..s3) + constants(02,03) -> GF2Mul(×2/×3) -> XOR chain -> BitsToHex -> HexOutput for each of the 4 output bytes',
    project: {
      modules: [
        // Input column bytes (NIST FIPS 197 Appendix B, round 1, first column after SubBytes+ShiftRows)
        { id: 's0', defId: 'HexSource', params: { value: 'D4' } },
        { id: 's1', defId: 'HexSource', params: { value: 'BF' } },
        { id: 's2', defId: 'HexSource', params: { value: '5D' } },
        { id: 's3', defId: 'HexSource', params: { value: '30' } },
        // Row 0: out0 = 2·s0 ⊕ 3·s1 ⊕ s2 ⊕ s3  → 04
        { id: 'r0-c2', defId: 'HexSource', params: { value: '02' } },
        { id: 'r0-c3', defId: 'HexSource', params: { value: '03' } },
        { id: 'gf-2s0', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'gf-3s1', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'xor-0a', defId: 'XOR', params: {} },
        { id: 'xor-0b', defId: 'XOR', params: {} },
        { id: 'xor-0c', defId: 'XOR', params: {} },
        { id: 'bth-0', defId: 'BitsToHex', params: {} },
        { id: 'out-0', defId: 'HexOutput', params: {} },
        // Row 1: out1 = s0 ⊕ 2·s1 ⊕ 3·s2 ⊕ s3  → 66
        { id: 'r1-c2', defId: 'HexSource', params: { value: '02' } },
        { id: 'r1-c3', defId: 'HexSource', params: { value: '03' } },
        { id: 'gf-2s1', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'gf-3s2', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'xor-1a', defId: 'XOR', params: {} },
        { id: 'xor-1b', defId: 'XOR', params: {} },
        { id: 'xor-1c', defId: 'XOR', params: {} },
        { id: 'bth-1', defId: 'BitsToHex', params: {} },
        { id: 'out-1', defId: 'HexOutput', params: {} },
        // Row 2: out2 = s0 ⊕ s1 ⊕ 2·s2 ⊕ 3·s3  → 81
        { id: 'r2-c2', defId: 'HexSource', params: { value: '02' } },
        { id: 'r2-c3', defId: 'HexSource', params: { value: '03' } },
        { id: 'gf-2s2', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'gf-3s3', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'xor-2a', defId: 'XOR', params: {} },
        { id: 'xor-2b', defId: 'XOR', params: {} },
        { id: 'xor-2c', defId: 'XOR', params: {} },
        { id: 'bth-2', defId: 'BitsToHex', params: {} },
        { id: 'out-2', defId: 'HexOutput', params: {} },
        // Row 3: out3 = 3·s0 ⊕ s1 ⊕ s2 ⊕ 2·s3  → E5
        { id: 'r3-c3', defId: 'HexSource', params: { value: '03' } },
        { id: 'r3-c2', defId: 'HexSource', params: { value: '02' } },
        { id: 'gf-3s0', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'gf-2s3', defId: 'GF2Mul', params: { poly: '11B' } },
        { id: 'xor-3a', defId: 'XOR', params: {} },
        { id: 'xor-3b', defId: 'XOR', params: {} },
        { id: 'xor-3c', defId: 'XOR', params: {} },
        { id: 'bth-3', defId: 'BitsToHex', params: {} },
        { id: 'out-3', defId: 'HexOutput', params: {} },
      ],
      connections: [
        // Row 0 GF2Mul inputs
        { from: { moduleId: 's0',   port: 'out' }, to: { moduleId: 'gf-2s0', port: 'a' } },
        { from: { moduleId: 'r0-c2',port: 'out' }, to: { moduleId: 'gf-2s0', port: 'b' } },
        { from: { moduleId: 's1',   port: 'out' }, to: { moduleId: 'gf-3s1', port: 'a' } },
        { from: { moduleId: 'r0-c3',port: 'out' }, to: { moduleId: 'gf-3s1', port: 'b' } },
        // Row 0 XOR chain: 2s0 ⊕ 3s1 ⊕ s2 ⊕ s3
        { from: { moduleId: 'gf-2s0', port: 'out' }, to: { moduleId: 'xor-0a', port: 'a' } },
        { from: { moduleId: 'gf-3s1', port: 'out' }, to: { moduleId: 'xor-0a', port: 'b' } },
        { from: { moduleId: 'xor-0a', port: 'out' }, to: { moduleId: 'xor-0b', port: 'a' } },
        { from: { moduleId: 's2',     port: 'out' }, to: { moduleId: 'xor-0b', port: 'b' } },
        { from: { moduleId: 'xor-0b', port: 'out' }, to: { moduleId: 'xor-0c', port: 'a' } },
        { from: { moduleId: 's3',     port: 'out' }, to: { moduleId: 'xor-0c', port: 'b' } },
        { from: { moduleId: 'xor-0c', port: 'out' }, to: { moduleId: 'bth-0',  port: 'in' } },
        { from: { moduleId: 'bth-0',  port: 'out' }, to: { moduleId: 'out-0',  port: 'in' } },
        // Row 1 GF2Mul inputs
        { from: { moduleId: 's1',   port: 'out' }, to: { moduleId: 'gf-2s1', port: 'a' } },
        { from: { moduleId: 'r1-c2',port: 'out' }, to: { moduleId: 'gf-2s1', port: 'b' } },
        { from: { moduleId: 's2',   port: 'out' }, to: { moduleId: 'gf-3s2', port: 'a' } },
        { from: { moduleId: 'r1-c3',port: 'out' }, to: { moduleId: 'gf-3s2', port: 'b' } },
        // Row 1 XOR chain: s0 ⊕ 2s1 ⊕ 3s2 ⊕ s3
        { from: { moduleId: 's0',     port: 'out' }, to: { moduleId: 'xor-1a', port: 'a' } },
        { from: { moduleId: 'gf-2s1', port: 'out' }, to: { moduleId: 'xor-1a', port: 'b' } },
        { from: { moduleId: 'xor-1a', port: 'out' }, to: { moduleId: 'xor-1b', port: 'a' } },
        { from: { moduleId: 'gf-3s2', port: 'out' }, to: { moduleId: 'xor-1b', port: 'b' } },
        { from: { moduleId: 'xor-1b', port: 'out' }, to: { moduleId: 'xor-1c', port: 'a' } },
        { from: { moduleId: 's3',     port: 'out' }, to: { moduleId: 'xor-1c', port: 'b' } },
        { from: { moduleId: 'xor-1c', port: 'out' }, to: { moduleId: 'bth-1',  port: 'in' } },
        { from: { moduleId: 'bth-1',  port: 'out' }, to: { moduleId: 'out-1',  port: 'in' } },
        // Row 2 GF2Mul inputs
        { from: { moduleId: 's2',   port: 'out' }, to: { moduleId: 'gf-2s2', port: 'a' } },
        { from: { moduleId: 'r2-c2',port: 'out' }, to: { moduleId: 'gf-2s2', port: 'b' } },
        { from: { moduleId: 's3',   port: 'out' }, to: { moduleId: 'gf-3s3', port: 'a' } },
        { from: { moduleId: 'r2-c3',port: 'out' }, to: { moduleId: 'gf-3s3', port: 'b' } },
        // Row 2 XOR chain: s0 ⊕ s1 ⊕ 2s2 ⊕ 3s3
        { from: { moduleId: 's0',     port: 'out' }, to: { moduleId: 'xor-2a', port: 'a' } },
        { from: { moduleId: 's1',     port: 'out' }, to: { moduleId: 'xor-2a', port: 'b' } },
        { from: { moduleId: 'xor-2a', port: 'out' }, to: { moduleId: 'xor-2b', port: 'a' } },
        { from: { moduleId: 'gf-2s2', port: 'out' }, to: { moduleId: 'xor-2b', port: 'b' } },
        { from: { moduleId: 'xor-2b', port: 'out' }, to: { moduleId: 'xor-2c', port: 'a' } },
        { from: { moduleId: 'gf-3s3', port: 'out' }, to: { moduleId: 'xor-2c', port: 'b' } },
        { from: { moduleId: 'xor-2c', port: 'out' }, to: { moduleId: 'bth-2',  port: 'in' } },
        { from: { moduleId: 'bth-2',  port: 'out' }, to: { moduleId: 'out-2',  port: 'in' } },
        // Row 3 GF2Mul inputs
        { from: { moduleId: 's0',   port: 'out' }, to: { moduleId: 'gf-3s0', port: 'a' } },
        { from: { moduleId: 'r3-c3',port: 'out' }, to: { moduleId: 'gf-3s0', port: 'b' } },
        { from: { moduleId: 's3',   port: 'out' }, to: { moduleId: 'gf-2s3', port: 'a' } },
        { from: { moduleId: 'r3-c2',port: 'out' }, to: { moduleId: 'gf-2s3', port: 'b' } },
        // Row 3 XOR chain: 3s0 ⊕ s1 ⊕ s2 ⊕ 2s3
        { from: { moduleId: 'gf-3s0', port: 'out' }, to: { moduleId: 'xor-3a', port: 'a' } },
        { from: { moduleId: 's1',     port: 'out' }, to: { moduleId: 'xor-3a', port: 'b' } },
        { from: { moduleId: 'xor-3a', port: 'out' }, to: { moduleId: 'xor-3b', port: 'a' } },
        { from: { moduleId: 's2',     port: 'out' }, to: { moduleId: 'xor-3b', port: 'b' } },
        { from: { moduleId: 'xor-3b', port: 'out' }, to: { moduleId: 'xor-3c', port: 'a' } },
        { from: { moduleId: 'gf-2s3', port: 'out' }, to: { moduleId: 'xor-3c', port: 'b' } },
        { from: { moduleId: 'xor-3c', port: 'out' }, to: { moduleId: 'bth-3',  port: 'in' } },
        { from: { moduleId: 'bth-3',  port: 'out' }, to: { moduleId: 'out-3',  port: 'in' } },
      ],
    },
    layout: {
      // Input column bytes
      's0':     { x: 80,  y: 80  },
      's1':     { x: 80,  y: 280 },
      's2':     { x: 80,  y: 480 },
      's3':     { x: 80,  y: 680 },
      // Row 0: 2·s0 ⊕ 3·s1 ⊕ s2 ⊕ s3
      'r0-c2':  { x: 260, y: 40  },
      'r0-c3':  { x: 260, y: 200 },
      'gf-2s0': { x: 440, y: 80  },
      'gf-3s1': { x: 440, y: 200 },
      'xor-0a': { x: 640, y: 140 },
      'xor-0b': { x: 840, y: 80  },
      'xor-0c': { x: 1020,y: 80  },
      'bth-0':  { x: 1200,y: 80  },
      'out-0':  { x: 1380,y: 80  },
      // Row 1: s0 ⊕ 2·s1 ⊕ 3·s2 ⊕ s3
      'r1-c2':  { x: 260, y: 280 },
      'r1-c3':  { x: 260, y: 400 },
      'gf-2s1': { x: 440, y: 280 },
      'gf-3s2': { x: 440, y: 400 },
      'xor-1a': { x: 640, y: 280 },
      'xor-1b': { x: 840, y: 340 },
      'xor-1c': { x: 1020,y: 280 },
      'bth-1':  { x: 1200,y: 280 },
      'out-1':  { x: 1380,y: 280 },
      // Row 2: s0 ⊕ s1 ⊕ 2·s2 ⊕ 3·s3
      'r2-c2':  { x: 260, y: 480 },
      'r2-c3':  { x: 260, y: 600 },
      'gf-2s2': { x: 440, y: 480 },
      'gf-3s3': { x: 440, y: 600 },
      'xor-2a': { x: 640, y: 480 },
      'xor-2b': { x: 840, y: 540 },
      'xor-2c': { x: 1020,y: 480 },
      'bth-2':  { x: 1200,y: 480 },
      'out-2':  { x: 1380,y: 480 },
      // Row 3: 3·s0 ⊕ s1 ⊕ s2 ⊕ 2·s3
      'r3-c3':  { x: 260, y: 680 },
      'r3-c2':  { x: 260, y: 800 },
      'gf-3s0': { x: 440, y: 680 },
      'gf-2s3': { x: 440, y: 800 },
      'xor-3a': { x: 640, y: 680 },
      'xor-3b': { x: 840, y: 740 },
      'xor-3c': { x: 1020,y: 680 },
      'bth-3':  { x: 1200,y: 680 },
      'out-3':  { x: 1380,y: 680 },
    },
  },
  {
    id: 'visible-subbytes',
    name: 'Visible SubBytes',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.9,
    recommendedAfter: ['visible-mix-columns'],
    summary:
      'One AES SubBytes step built two ways side by side: the explicit GF(2⁸) inverse followed by the four-rotation affine transform, and the equivalent AES S-box lookup. Both produce the NIST-specified output for input 0x53 → 0xED, confirming that the S-box is exactly the composed function.',
    pipeline:
      'HexSource(53) → GF2Inv → [BitShifter×4 rotations + XOR chain + 0x63] → BitsToHex → HexOutput, in parallel with HexSource(53) → SBox(AES) → BitsToHex → HexOutput',
    project: {
      modules: [
        // Shared input
        { id: 'src', defId: 'HexSource', params: { value: '53' } },
        // Explicit path: GF2Inv → affine transform (M·a ⊕ 0x63)
        { id: 'gf-inv', defId: 'GF2Inv', params: { poly: '11B' } },
        { id: 'rot1', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 1 } },
        { id: 'rot2', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 2 } },
        { id: 'rot3', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 3 } },
        { id: 'rot4', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 4 } },
        { id: 'xor-1', defId: 'XOR', params: {} },
        { id: 'xor-2', defId: 'XOR', params: {} },
        { id: 'xor-3', defId: 'XOR', params: {} },
        { id: 'xor-4', defId: 'XOR', params: {} },
        { id: 'c63', defId: 'HexSource', params: { value: '63' } },
        { id: 'xor-5', defId: 'XOR', params: {} },
        { id: 'bth', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
        // S-box path: AES S-box lookup (equivalent shortcut)
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: [
               99,124,119,123,242,107,111,197, 48,  1,103, 43,254,215,171,118,
              202,130,201,125,250, 89, 71,240,173,212,162,175,156,164,114,192,
              183,253,147, 38, 54, 63,247,204, 52,165,229,241,113,216, 49, 21,
                4,199, 35,195, 24,150,  5,154,  7, 18,128,226,235, 39,178,117,
                9,131, 44, 26, 27,110, 90,160, 82, 59,214,179, 41,227, 47,132,
               83,209,  0,237, 32,252,177, 91,106,203,190, 57, 74, 76, 88,207,
              208,239,170,251, 67, 77, 51,133, 69,249,  2,127, 80, 60,159,168,
               81,163, 64,143,146,157, 56,245,188,182,218, 33, 16,255,243,210,
              205, 12, 19,236, 95,151, 68, 23,196,167,126, 61,100, 93, 25,115,
               96,129, 79,220, 34, 42,144,136, 70,238,184, 20,222, 94, 11,219,
              224, 50, 58, 10, 73,  6, 36, 92,194,211,172, 98,145,149,228,121,
              231,200, 55,109,141,213, 78,169,108, 86,244,234,101,122,174,  8,
              186,120, 37, 46, 28,166,180,198,232,221,116, 31, 75,189,139,138,
              112, 62,181,102, 72,  3,246, 14, 97, 53, 87,185,134,193, 29,158,
              225,248,152, 17,105,217,142,148,155, 30,135,233,206, 85, 40,223,
              140,161,137, 13,191,230, 66,104, 65,153, 45, 15,176, 84,187, 22,
            ].join(','),
          },
        },
        { id: 'bth-sb', defId: 'BitsToHex', params: {} },
        { id: 'out-sb', defId: 'HexOutput', params: {} },
      ],
      connections: [
        // Shared input → explicit path
        { from: { moduleId: 'src',   port: 'out' }, to: { moduleId: 'gf-inv', port: 'in' } },
        // GF2Inv fans out to all four rotations and the first XOR accumulator
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'rot1',  port: 'in' } },
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'rot2',  port: 'in' } },
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'rot3',  port: 'in' } },
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'rot4',  port: 'in' } },
        { from: { moduleId: 'gf-inv', port: 'out' }, to: { moduleId: 'xor-1', port: 'a' } },
        // XOR accumulator chain
        { from: { moduleId: 'rot1',  port: 'out' }, to: { moduleId: 'xor-1', port: 'b' } },
        { from: { moduleId: 'xor-1', port: 'out' }, to: { moduleId: 'xor-2', port: 'a' } },
        { from: { moduleId: 'rot2',  port: 'out' }, to: { moduleId: 'xor-2', port: 'b' } },
        { from: { moduleId: 'xor-2', port: 'out' }, to: { moduleId: 'xor-3', port: 'a' } },
        { from: { moduleId: 'rot3',  port: 'out' }, to: { moduleId: 'xor-3', port: 'b' } },
        { from: { moduleId: 'xor-3', port: 'out' }, to: { moduleId: 'xor-4', port: 'a' } },
        { from: { moduleId: 'rot4',  port: 'out' }, to: { moduleId: 'xor-4', port: 'b' } },
        // Final XOR with affine constant 0x63
        { from: { moduleId: 'xor-4', port: 'out' }, to: { moduleId: 'xor-5', port: 'a' } },
        { from: { moduleId: 'c63',   port: 'out' }, to: { moduleId: 'xor-5', port: 'b' } },
        { from: { moduleId: 'xor-5', port: 'out' }, to: { moduleId: 'bth',   port: 'in' } },
        { from: { moduleId: 'bth',   port: 'out' }, to: { moduleId: 'out',   port: 'in' } },
        // Shared input → S-box path
        { from: { moduleId: 'src',   port: 'out' }, to: { moduleId: 'sbox',  port: 'in' } },
        { from: { moduleId: 'sbox',  port: 'out' }, to: { moduleId: 'bth-sb',port: 'in' } },
        { from: { moduleId: 'bth-sb',port: 'out' }, to: { moduleId: 'out-sb',port: 'in' } },
      ],
    },
    layout: {
      'src':    { x: 80,   y: 360 },
      // Explicit path
      'gf-inv': { x: 260,  y: 360 },
      'rot1':   { x: 440,  y: 80  },
      'rot2':   { x: 440,  y: 220 },
      'rot3':   { x: 440,  y: 360 },
      'rot4':   { x: 440,  y: 500 },
      'xor-1':  { x: 640,  y: 140 },
      'xor-2':  { x: 640,  y: 280 },
      'xor-3':  { x: 640,  y: 420 },
      'xor-4':  { x: 640,  y: 560 },
      'c63':    { x: 840,  y: 700 },
      'xor-5':  { x: 840,  y: 560 },
      'bth':    { x: 1020, y: 560 },
      'out':    { x: 1200, y: 560 },
      // S-box path
      'sbox':   { x: 260,  y: 700 },
      'bth-sb': { x: 440,  y: 700 },
      'out-sb': { x: 620,  y: 700 },
    },
  },
  {
    id: 'visible-shiftrows',
    name: 'Visible ShiftRows',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.91,
    recommendedAfter: ['visible-subbytes'],
    summary:
      'The full 16-byte AES state passes through a single Permutation module wired with the ShiftRows byte positions. Row 0 stays put, row 1 rotates left by one byte, row 2 by two, row 3 by three — all encoded as an explicit 128-bit index mapping. FIPS 197 test vector: D42711AE… → D4BF5D30…',
    pipeline:
      'HexSource(128-bit state) -> Permutation(128-element ShiftRows index map) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'state',      defId: 'HexSource',   params: { value: 'D42711AEE0BF98F1B8B45DE51E415230' } },
        { id: 'shift-rows', defId: 'Permutation',  params: { order: '0,1,2,3,4,5,6,7,40,41,42,43,44,45,46,47,80,81,82,83,84,85,86,87,120,121,122,123,124,125,126,127,32,33,34,35,36,37,38,39,72,73,74,75,76,77,78,79,112,113,114,115,116,117,118,119,24,25,26,27,28,29,30,31,64,65,66,67,68,69,70,71,104,105,106,107,108,109,110,111,16,17,18,19,20,21,22,23,56,57,58,59,60,61,62,63,96,97,98,99,100,101,102,103,8,9,10,11,12,13,14,15,48,49,50,51,52,53,54,55,88,89,90,91,92,93,94,95' } },
        { id: 'bth',        defId: 'BitsToHex',    params: {} },
        { id: 'out',        defId: 'HexOutput',    params: {} },
      ],
      connections: [
        { from: { moduleId: 'state',      port: 'out' }, to: { moduleId: 'shift-rows', port: 'in' } },
        { from: { moduleId: 'shift-rows', port: 'out' }, to: { moduleId: 'bth',        port: 'in' } },
        { from: { moduleId: 'bth',        port: 'out' }, to: { moduleId: 'out',        port: 'in' } },
      ],
    },
    layout: {
      'state':      { x: 80,  y: 200 },
      'shift-rows': { x: 400, y: 200 },
      'bth':        { x: 700, y: 200 },
      'out':        { x: 960, y: 200 },
    },
  },
  {
    id: 'visible-add-round-key',
    name: 'Visible AddRoundKey',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.92,
    recommendedAfter: ['visible-shiftrows'],
    summary:
      'Four data bytes from MixColumns ([04,66,81,E5]) and four round-key bytes ([A0,FA,FE,17]) feed four independent XOR modules. Each output byte is one byte of data XOR one byte of key — the round-key injection step. FIPS 197 output: [A4,9C,7F,F2].',
    pipeline:
      '4x HexSource(data) + 4x HexSource(key) -> 4x XOR(data[i] ⊕ key[i]) -> 4x BitsToHex -> 4x HexOutput',
    project: {
      modules: [
        // Data bytes (MixColumns output)
        { id: 'd0', defId: 'HexSource', params: { value: '04' } },
        { id: 'd1', defId: 'HexSource', params: { value: '66' } },
        { id: 'd2', defId: 'HexSource', params: { value: '81' } },
        { id: 'd3', defId: 'HexSource', params: { value: 'E5' } },
        // Round-key bytes
        { id: 'k0', defId: 'HexSource', params: { value: 'A0' } },
        { id: 'k1', defId: 'HexSource', params: { value: 'FA' } },
        { id: 'k2', defId: 'HexSource', params: { value: 'FE' } },
        { id: 'k3', defId: 'HexSource', params: { value: '17' } },
        // XOR each byte with its key byte
        { id: 'xor0', defId: 'XOR', params: {} },
        { id: 'xor1', defId: 'XOR', params: {} },
        { id: 'xor2', defId: 'XOR', params: {} },
        { id: 'xor3', defId: 'XOR', params: {} },
        // Convert to hex
        { id: 'bth0', defId: 'BitsToHex', params: {} },
        { id: 'bth1', defId: 'BitsToHex', params: {} },
        { id: 'bth2', defId: 'BitsToHex', params: {} },
        { id: 'bth3', defId: 'BitsToHex', params: {} },
        // Outputs
        { id: 'out0', defId: 'HexOutput', params: {} },
        { id: 'out1', defId: 'HexOutput', params: {} },
        { id: 'out2', defId: 'HexOutput', params: {} },
        { id: 'out3', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'd0',   port: 'out' }, to: { moduleId: 'xor0', port: 'a' } },
        { from: { moduleId: 'k0',   port: 'out' }, to: { moduleId: 'xor0', port: 'b' } },
        { from: { moduleId: 'd1',   port: 'out' }, to: { moduleId: 'xor1', port: 'a' } },
        { from: { moduleId: 'k1',   port: 'out' }, to: { moduleId: 'xor1', port: 'b' } },
        { from: { moduleId: 'd2',   port: 'out' }, to: { moduleId: 'xor2', port: 'a' } },
        { from: { moduleId: 'k2',   port: 'out' }, to: { moduleId: 'xor2', port: 'b' } },
        { from: { moduleId: 'd3',   port: 'out' }, to: { moduleId: 'xor3', port: 'a' } },
        { from: { moduleId: 'k3',   port: 'out' }, to: { moduleId: 'xor3', port: 'b' } },
        { from: { moduleId: 'xor0', port: 'out' }, to: { moduleId: 'bth0', port: 'in' } },
        { from: { moduleId: 'xor1', port: 'out' }, to: { moduleId: 'bth1', port: 'in' } },
        { from: { moduleId: 'xor2', port: 'out' }, to: { moduleId: 'bth2', port: 'in' } },
        { from: { moduleId: 'xor3', port: 'out' }, to: { moduleId: 'bth3', port: 'in' } },
        { from: { moduleId: 'bth0', port: 'out' }, to: { moduleId: 'out0', port: 'in' } },
        { from: { moduleId: 'bth1', port: 'out' }, to: { moduleId: 'out1', port: 'in' } },
        { from: { moduleId: 'bth2', port: 'out' }, to: { moduleId: 'out2', port: 'in' } },
        { from: { moduleId: 'bth3', port: 'out' }, to: { moduleId: 'out3', port: 'in' } },
      ],
    },
    layout: {
      // Data column
      'd0': { x: 80, y: 60  },
      'd1': { x: 80, y: 180 },
      'd2': { x: 80, y: 300 },
      'd3': { x: 80, y: 420 },
      // Key column
      'k0': { x: 80, y: 120 },
      'k1': { x: 80, y: 240 },
      'k2': { x: 80, y: 360 },
      'k3': { x: 80, y: 480 },
      // XOR column
      'xor0': { x: 340, y: 80  },
      'xor1': { x: 340, y: 200 },
      'xor2': { x: 340, y: 320 },
      'xor3': { x: 340, y: 440 },
      // BitsToHex column
      'bth0': { x: 560, y: 80  },
      'bth1': { x: 560, y: 200 },
      'bth2': { x: 560, y: 320 },
      'bth3': { x: 560, y: 440 },
      // Output column
      'out0': { x: 760, y: 80  },
      'out1': { x: 760, y: 200 },
      'out2': { x: 760, y: 320 },
      'out3': { x: 760, y: 440 },
    },
  },
  {
    id: 'aes-round-full',
    name: 'AES Round (Full)',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.93,
    recommendedAfter: ['visible-add-round-key'],
    summary:
      'A complete AES round from FIPS 197 Appendix B wired as one explicit machine: 16 byte-wise SubBytes lookups, one 128-bit ShiftRows permutation, four MixColumns column mixers, and 16 AddRoundKey XORs. Every intermediate byte remains probeable.',
    pipeline:
      '16x HexSource(state) -> 16x SBox(AES) -> BitJoin tree -> Permutation(ShiftRows) -> 16x BitWindow -> 4x MixColumns GF2Mul/XOR columns -> 16x XOR(round key) -> 16x BitsToHex -> 16x HexOutput',
    project: AES_ROUND_FULL_WORKSPACE.project,
    layout: AES_ROUND_FULL_WORKSPACE.layout,
  },
  {
    id: 'visible-aes-key-schedule',
    name: 'Visible AES Key Schedule',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.94,
    recommendedAfter: ['aes-round-full'],
    summary:
      'One round of the AES-128 key schedule built from explicit primitives: RotWord (ByteRotate), SubWord (four AES S-Box lookups), XOR with Rcon[1], and the four-word XOR cascade. Uses the NIST FIPS 197 Appendix A.1 key 2B7E1516…09CF4F3C and produces Round Key 1 A0FAFE17 88542CB1 23A33939 2A6C7605.',
    pipeline:
      'HexSource(W[0..3]) -> ByteRotate(RotWord) -> 4x BitWindow -> 4x SBox(AES) -> 3x BitJoin(SubWord) -> XOR(Rcon[1]=01000000) -> 4x XOR(cascade) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        // Original key: W[0..3] (FIPS 197 Appendix A.1)
        { id: 'w0', defId: 'HexSource', params: { value: '2B7E1516' } },
        { id: 'w1', defId: 'HexSource', params: { value: '28AED2A6' } },
        { id: 'w2', defId: 'HexSource', params: { value: 'ABF71588' } },
        { id: 'w3', defId: 'HexSource', params: { value: '09CF4F3C' } },
        // RotWord: rotate W[3] left by 1 byte → CF4F3C09
        { id: 'rotword', defId: 'ByteRotate', params: { amount: 1, direction: 'left' } },
        // Split rotated word into 4 bytes for SubWord
        { id: 'rb0', defId: 'BitWindow', params: { start: 0, width: 8 } },   // CF
        { id: 'rb1', defId: 'BitWindow', params: { start: 8, width: 8 } },   // 4F
        { id: 'rb2', defId: 'BitWindow', params: { start: 16, width: 8 } },  // 3C
        { id: 'rb3', defId: 'BitWindow', params: { start: 24, width: 8 } },  // 09
        // SubWord: AES S-Box on each byte → 8A 84 EB 01
        { id: 'sub0', defId: 'SBox', params: { table: AES_SBOX_TABLE } },
        { id: 'sub1', defId: 'SBox', params: { table: AES_SBOX_TABLE } },
        { id: 'sub2', defId: 'SBox', params: { table: AES_SBOX_TABLE } },
        { id: 'sub3', defId: 'SBox', params: { table: AES_SBOX_TABLE } },
        // Rejoin SubWord bytes: two pairs then final word
        { id: 'join-sb01', defId: 'BitJoin', params: {} },  // [8A, 84]
        { id: 'join-sb23', defId: 'BitJoin', params: {} },  // [EB, 01]
        { id: 'subword', defId: 'BitJoin', params: {} },    // [8A, 84, EB, 01]
        // Rcon[1] = 01 00 00 00
        { id: 'rcon1', defId: 'HexSource', params: { value: '01000000' } },
        // XOR SubWord with Rcon → g(W[3]) = 8B 84 EB 01
        { id: 'gw3', defId: 'XOR', params: {} },
        // XOR cascade: W[4..7] = Round Key 1 words
        { id: 'xor4', defId: 'XOR', params: {} },  // W[4] = W[0] ⊕ g(W[3]) → A0FAFE17
        { id: 'xor5', defId: 'XOR', params: {} },  // W[5] = W[1] ⊕ W[4]   → 88542CB1
        { id: 'xor6', defId: 'XOR', params: {} },  // W[6] = W[2] ⊕ W[5]   → 23A33939
        { id: 'xor7', defId: 'XOR', params: {} },  // W[7] = W[3] ⊕ W[6]   → 2A6C7605
        // Output: Round Key 1 words
        { id: 'hex4', defId: 'BitsToHex', params: {} },
        { id: 'hex5', defId: 'BitsToHex', params: {} },
        { id: 'hex6', defId: 'BitsToHex', params: {} },
        { id: 'hex7', defId: 'BitsToHex', params: {} },
        { id: 'out4', defId: 'HexOutput', params: {} },  // A0FAFE17
        { id: 'out5', defId: 'HexOutput', params: {} },  // 88542CB1
        { id: 'out6', defId: 'HexOutput', params: {} },  // 23A33939
        { id: 'out7', defId: 'HexOutput', params: {} },  // 2A6C7605
      ],
      connections: [
        // W[3] → RotWord
        { from: { moduleId: 'w3', port: 'out' }, to: { moduleId: 'rotword', port: 'in' } },
        // RotWord → byte windows
        { from: { moduleId: 'rotword', port: 'out' }, to: { moduleId: 'rb0', port: 'in' } },
        { from: { moduleId: 'rotword', port: 'out' }, to: { moduleId: 'rb1', port: 'in' } },
        { from: { moduleId: 'rotword', port: 'out' }, to: { moduleId: 'rb2', port: 'in' } },
        { from: { moduleId: 'rotword', port: 'out' }, to: { moduleId: 'rb3', port: 'in' } },
        // Byte windows → SubWord S-Boxes
        { from: { moduleId: 'rb0', port: 'out' }, to: { moduleId: 'sub0', port: 'in' } },
        { from: { moduleId: 'rb1', port: 'out' }, to: { moduleId: 'sub1', port: 'in' } },
        { from: { moduleId: 'rb2', port: 'out' }, to: { moduleId: 'sub2', port: 'in' } },
        { from: { moduleId: 'rb3', port: 'out' }, to: { moduleId: 'sub3', port: 'in' } },
        // SubWord byte pairs → BitJoin tree
        { from: { moduleId: 'sub0', port: 'out' }, to: { moduleId: 'join-sb01', port: 'a' } },
        { from: { moduleId: 'sub1', port: 'out' }, to: { moduleId: 'join-sb01', port: 'b' } },
        { from: { moduleId: 'sub2', port: 'out' }, to: { moduleId: 'join-sb23', port: 'a' } },
        { from: { moduleId: 'sub3', port: 'out' }, to: { moduleId: 'join-sb23', port: 'b' } },
        { from: { moduleId: 'join-sb01', port: 'out' }, to: { moduleId: 'subword', port: 'a' } },
        { from: { moduleId: 'join-sb23', port: 'out' }, to: { moduleId: 'subword', port: 'b' } },
        // SubWord ⊕ Rcon → g(W[3])
        { from: { moduleId: 'subword', port: 'out' }, to: { moduleId: 'gw3', port: 'a' } },
        { from: { moduleId: 'rcon1', port: 'out' }, to: { moduleId: 'gw3', port: 'b' } },
        // XOR cascade: W[4..7]
        { from: { moduleId: 'w0', port: 'out' }, to: { moduleId: 'xor4', port: 'a' } },
        { from: { moduleId: 'gw3', port: 'out' }, to: { moduleId: 'xor4', port: 'b' } },
        { from: { moduleId: 'w1', port: 'out' }, to: { moduleId: 'xor5', port: 'a' } },
        { from: { moduleId: 'xor4', port: 'out' }, to: { moduleId: 'xor5', port: 'b' } },
        { from: { moduleId: 'w2', port: 'out' }, to: { moduleId: 'xor6', port: 'a' } },
        { from: { moduleId: 'xor5', port: 'out' }, to: { moduleId: 'xor6', port: 'b' } },
        { from: { moduleId: 'w3', port: 'out' }, to: { moduleId: 'xor7', port: 'a' } },
        { from: { moduleId: 'xor6', port: 'out' }, to: { moduleId: 'xor7', port: 'b' } },
        // Outputs
        { from: { moduleId: 'xor4', port: 'out' }, to: { moduleId: 'hex4', port: 'in' } },
        { from: { moduleId: 'xor5', port: 'out' }, to: { moduleId: 'hex5', port: 'in' } },
        { from: { moduleId: 'xor6', port: 'out' }, to: { moduleId: 'hex6', port: 'in' } },
        { from: { moduleId: 'xor7', port: 'out' }, to: { moduleId: 'hex7', port: 'in' } },
        { from: { moduleId: 'hex4', port: 'out' }, to: { moduleId: 'out4', port: 'in' } },
        { from: { moduleId: 'hex5', port: 'out' }, to: { moduleId: 'out5', port: 'in' } },
        { from: { moduleId: 'hex6', port: 'out' }, to: { moduleId: 'out6', port: 'in' } },
        { from: { moduleId: 'hex7', port: 'out' }, to: { moduleId: 'out7', port: 'in' } },
      ],
    },
    layout: {
      // Original key words (left column)
      w0: { x: 60, y: 80 },
      w1: { x: 60, y: 280 },
      w2: { x: 60, y: 480 },
      w3: { x: 60, y: 800 },
      // RotWord
      rotword: { x: 280, y: 800 },
      // Byte windows (split rotated word)
      rb0: { x: 480, y: 680 },
      rb1: { x: 480, y: 760 },
      rb2: { x: 480, y: 840 },
      rb3: { x: 480, y: 920 },
      // SubWord S-Boxes
      sub0: { x: 660, y: 680 },
      sub1: { x: 660, y: 760 },
      sub2: { x: 660, y: 840 },
      sub3: { x: 660, y: 920 },
      // BitJoin tree for SubWord
      'join-sb01': { x: 860, y: 700 },
      'join-sb23': { x: 860, y: 860 },
      subword: { x: 1040, y: 780 },
      // Rcon and g() function
      rcon1: { x: 1040, y: 960 },
      gw3: { x: 1220, y: 860 },
      // XOR cascade (right side, aligned with W words)
      xor4: { x: 1420, y: 80 },
      xor5: { x: 1420, y: 280 },
      xor6: { x: 1420, y: 480 },
      xor7: { x: 1420, y: 800 },
      // Outputs
      hex4: { x: 1620, y: 80 },
      hex5: { x: 1620, y: 280 },
      hex6: { x: 1620, y: 480 },
      hex7: { x: 1620, y: 800 },
      out4: { x: 1820, y: 80 },
      out5: { x: 1820, y: 280 },
      out6: { x: 1820, y: 480 },
      out7: { x: 1820, y: 800 },
    },
  },
  {
    id: 'aes-row-perturbation',
    name: 'AES Row Perturbation',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.94,
    recommendedAfter: ['aes-round-full'],
    summary:
      'One canonical AES round branch and one ShiftRows-perturbed branch share the same FIPS 197 state and round key. The canonical branch keeps row 1 at a left rotation of 1 byte; the perturbed branch changes only that rule to 0 bytes so the changed ShiftRows state and changed final round output stay visible as machine consequences.',
    pipeline:
      'Shared HexSource(state,key) -> [Canonical AES Round | Perturbed AES Round(row1=0)] -> BitsToHex(ShiftRows and final state) -> Equals(branch comparisons) + AesConsequenceSummary -> BitOutput',
    project: AES_ROW_PERTURBATION_WORKSPACE.project,
    layout: AES_ROW_PERTURBATION_WORKSPACE.layout,
  },
  {
    id: 'keyed-sbox-authoring',
    name: 'Keyed S-Box Authoring',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.95,
    recommendedAfter: ['aes-row-perturbation'],
    summary:
      'One visible 2-bit key selects one of four explicit 4-bit table variants. The board keeps a fixed baseline branch beside the keyed branch so table change, output change, and permutation validity can be compared without claiming stronger cryptography.',
    pipeline:
      'Shared BitSource(input) + BitSource(key) -> [SBox(PRESENT) | KeyedSBox4] -> BitsToHexDigit -> Output, plus Equals(output comparisons) and BitOutput(valid permutation)',
    project: KEYED_SBOX_AUTHORING_WORKSPACE.project,
    layout: KEYED_SBOX_AUTHORING_WORKSPACE.layout,
  },
  {
    id: 'aes-column-perturbation',
    name: 'AES Column Perturbation',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.96,
    recommendedAfter: ['keyed-sbox-authoring'],
    summary:
      'One canonical AES round branch and one MixColumns-perturbed branch share the same FIPS 197 state and round key. The canonical branch keeps the first MixColumns row at 02 03 01 01, while the perturbed branch changes only that second coefficient to 02 so the changed post-MixColumns state and changed final round output stay visible as machine consequences.',
    pipeline:
      'Shared HexSource(state,key) -> [Canonical AES Round | Perturbed AES Round(mix row0 = 02 02 01 01)] -> BitsToHex(post-MixColumns and final state) -> Equals(branch comparisons) + AesConsequenceSummary -> BitOutput',
    project: AES_COLUMN_PERTURBATION_WORKSPACE.project,
    layout: AES_COLUMN_PERTURBATION_WORKSPACE.layout,
  },
  {
    id: 'visible-point-order-and-subgroups',
    name: 'Visible Point Order And Subgroups',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229,
    recommendedAfter: ['visible-ecdh-key-agreement'],
    summary:
      'Two visible points on the same small pedagogical curve generate different subgroup sizes, and each order is verified by sending nP to visible infinity as point-local subgroup structure, not deployment validation.',
    pipeline:
      'PointSource(P,Q) -> PointOrder -> IntegerOutput, then PointOrder -> ScalarMultiply -> PointOutput to verify nP = ∞ on the same curve',
    project: {
      modules: [
        { id: 'point-p', defId: 'PointSource', params: { p: 17, a: 0, b: 13, x: 5, y: 6 } },
        { id: 'order-p', defId: 'PointOrder', params: { p: 17, a: 0, b: 13 } },
        { id: 'order-p-out', defId: 'IntegerOutput', params: {} },
        { id: 'verify-p', defId: 'ScalarMultiply', params: { p: 17, a: 0, b: 13 } },
        { id: 'verify-p-out', defId: 'PointOutput', params: {} },
        { id: 'point-q', defId: 'PointSource', params: { p: 17, a: 0, b: 13, x: 2, y: 2 } },
        { id: 'order-q', defId: 'PointOrder', params: { p: 17, a: 0, b: 13 } },
        { id: 'order-q-out', defId: 'IntegerOutput', params: {} },
        { id: 'verify-q', defId: 'ScalarMultiply', params: { p: 17, a: 0, b: 13 } },
        { id: 'verify-q-out', defId: 'PointOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'point-p', port: 'out' }, to: { moduleId: 'order-p', port: 'point' } },
        { from: { moduleId: 'order-p', port: 'out' }, to: { moduleId: 'order-p-out', port: 'in' } },
        { from: { moduleId: 'order-p', port: 'out' }, to: { moduleId: 'verify-p', port: 'scalar' } },
        { from: { moduleId: 'point-p', port: 'out' }, to: { moduleId: 'verify-p', port: 'point' } },
        { from: { moduleId: 'verify-p', port: 'out' }, to: { moduleId: 'verify-p-out', port: 'in' } },
        { from: { moduleId: 'point-q', port: 'out' }, to: { moduleId: 'order-q', port: 'point' } },
        { from: { moduleId: 'order-q', port: 'out' }, to: { moduleId: 'order-q-out', port: 'in' } },
        { from: { moduleId: 'order-q', port: 'out' }, to: { moduleId: 'verify-q', port: 'scalar' } },
        { from: { moduleId: 'point-q', port: 'out' }, to: { moduleId: 'verify-q', port: 'point' } },
        { from: { moduleId: 'verify-q', port: 'out' }, to: { moduleId: 'verify-q-out', port: 'in' } },
      ],
    },
    layout: {
      'point-p': { x: 72, y: 112 },
      'order-p': { x: 360, y: 112 },
      'order-p-out': { x: 648, y: 48 },
      'verify-p': { x: 648, y: 176 },
      'verify-p-out': { x: 948, y: 176 },
      'point-q': { x: 72, y: 468 },
      'order-q': { x: 360, y: 468 },
      'order-q-out': { x: 648, y: 404 },
      'verify-q': { x: 648, y: 532 },
      'verify-q-out': { x: 948, y: 532 },
    },
  },
  {
    id: 'ecdh-low-order-point-consequence',
    name: 'ECDH Low-Order Point Consequence',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229.5,
    recommendedAfter: ['visible-point-order-and-subgroups'],
    summary:
      'One honest toy-curve ECDH reference path contrasts with a low-order peer point of order 2. Two different private scalars collapse onto the same shared point under that peer, and one PointEquals sink makes the shared-secret collapse machine-visible.',
    pipeline:
      'PointSource(G,Q_low) + PointOrder(Q_low) + private scalar bridges -> ScalarMultiply(aG,B,aB,aQ_low,a-prime Q_low) -> PointEquals(low-order collapse) -> PointOutput + IntegerOutput + BitOutput',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 15, y: 12 } },
        { id: 'base-order', defId: 'PointOrder', params: { p: 17, a: 2, b: 3 } },
        { id: 'base-order-out', defId: 'IntegerOutput', params: {} },
        { id: 'peer-scalar-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 0] } },
        { id: 'peer-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'peer-scalar-out', defId: 'IntegerOutput', params: {} },
        { id: 'honest-peer-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-peer-public-out', defId: 'PointOutput', params: {} },
        { id: 'low-order-peer', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 16, y: 0 } },
        { id: 'low-order-order', defId: 'PointOrder', params: { p: 17, a: 2, b: 3 } },
        { id: 'low-order-order-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-a-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'private-a', defId: 'BitsToInteger', params: {} },
        { id: 'private-a-out', defId: 'IntegerOutput', params: {} },
        { id: 'public-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'public-a-out', defId: 'PointOutput', params: {} },
        { id: 'private-aprime-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'private-aprime', defId: 'BitsToInteger', params: {} },
        { id: 'private-aprime-out', defId: 'IntegerOutput', params: {} },
        { id: 'honest-shared-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-shared-a-out', defId: 'PointOutput', params: {} },
        { id: 'collapse-shared-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-shared-a-out', defId: 'PointOutput', params: {} },
        { id: 'collapse-shared-aprime', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-shared-aprime-out', defId: 'PointOutput', params: {} },
        { id: 'collapse-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'base-order', port: 'point' } },
        { from: { moduleId: 'base-order', port: 'out' }, to: { moduleId: 'base-order-out', port: 'in' } },
        { from: { moduleId: 'peer-scalar-bits', port: 'out' }, to: { moduleId: 'peer-scalar', port: 'in' } },
        { from: { moduleId: 'peer-scalar', port: 'out' }, to: { moduleId: 'peer-scalar-out', port: 'in' } },
        { from: { moduleId: 'peer-scalar', port: 'out' }, to: { moduleId: 'honest-peer-public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'honest-peer-public', port: 'point' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'honest-peer-public-out', port: 'in' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'low-order-order', port: 'point' } },
        { from: { moduleId: 'low-order-order', port: 'out' }, to: { moduleId: 'low-order-order-out', port: 'in' } },
        { from: { moduleId: 'private-a-bits', port: 'out' }, to: { moduleId: 'private-a', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'private-a-out', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'public-a', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'public-a', port: 'point' } },
        { from: { moduleId: 'public-a', port: 'out' }, to: { moduleId: 'public-a-out', port: 'in' } },
        { from: { moduleId: 'private-aprime-bits', port: 'out' }, to: { moduleId: 'private-aprime', port: 'in' } },
        { from: { moduleId: 'private-aprime', port: 'out' }, to: { moduleId: 'private-aprime-out', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'honest-shared-a', port: 'scalar' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'honest-shared-a', port: 'point' } },
        { from: { moduleId: 'honest-shared-a', port: 'out' }, to: { moduleId: 'honest-shared-a-out', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'collapse-shared-a', port: 'scalar' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'collapse-shared-a', port: 'point' } },
        { from: { moduleId: 'collapse-shared-a', port: 'out' }, to: { moduleId: 'collapse-shared-a-out', port: 'in' } },
        { from: { moduleId: 'private-aprime', port: 'out' }, to: { moduleId: 'collapse-shared-aprime', port: 'scalar' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'collapse-shared-aprime', port: 'point' } },
        { from: { moduleId: 'collapse-shared-aprime', port: 'out' }, to: { moduleId: 'collapse-shared-aprime-out', port: 'in' } },
        { from: { moduleId: 'collapse-shared-a', port: 'out' }, to: { moduleId: 'collapse-match', port: 'a' } },
        { from: { moduleId: 'collapse-shared-aprime', port: 'out' }, to: { moduleId: 'collapse-match', port: 'b' } },
        { from: { moduleId: 'collapse-match', port: 'out' }, to: { moduleId: 'collapse-match-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 72, y: 284 },
      'base-order': { x: 344, y: 284 },
      'base-order-out': { x: 620, y: 196 },
      'peer-scalar-bits': { x: 72, y: 56 },
      'peer-scalar': { x: 344, y: 56 },
      'peer-scalar-out': { x: 620, y: 56 },
      'honest-peer-public': { x: 620, y: 384 },
      'honest-peer-public-out': { x: 920, y: 384 },
      'low-order-peer': { x: 72, y: 540 },
      'low-order-order': { x: 344, y: 540 },
      'low-order-order-out': { x: 620, y: 540 },
      'private-a-bits': { x: 920, y: 40 },
      'private-a': { x: 1188, y: 40 },
      'private-a-out': { x: 1456, y: 40 },
      'public-a': { x: 1188, y: 212 },
      'public-a-out': { x: 1456, y: 212 },
      'private-aprime-bits': { x: 920, y: 716 },
      'private-aprime': { x: 1188, y: 716 },
      'private-aprime-out': { x: 1456, y: 716 },
      'honest-shared-a': { x: 1456, y: 384 },
      'honest-shared-a-out': { x: 1736, y: 384 },
      'collapse-shared-a': { x: 1736, y: 120 },
      'collapse-shared-a-out': { x: 2016, y: 120 },
      'collapse-shared-aprime': { x: 1736, y: 612 },
      'collapse-shared-aprime-out': { x: 2016, y: 612 },
      'collapse-match': { x: 2016, y: 368 },
      'collapse-match-out': { x: 2284, y: 368 },
    },
  },
  {
    id: 'ecc-public-key-validation-consequence',
    name: 'ECC Public-Key Validation Consequence',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229.75,
    recommendedAfter: ['ecdh-low-order-point-consequence'],
    summary:
      'One toy-curve ECDH board shows why curve-membership checking alone is not enough. The low-order peer point Q_low is on the same visible curve, still fails the intended subgroup check, and still collapses the shared-secret space if a broken acceptance path lets it into ECDH.',
    pipeline:
      'PointSource(G,B,Q_low) + PointOnCurve + ScalarMultiply(11B,11Q_low,0B,aB,a-prime B,aQ_low,a-prime Q_low) + PointSelector(accepted peers) -> PointEquals(validation + collapse contrast) -> PointOutput + IntegerOutput + BitOutput',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 15, y: 12 } },
        { id: 'peer-scalar-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 0] } },
        { id: 'peer-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'peer-scalar-out', defId: 'IntegerOutput', params: {} },
        { id: 'honest-peer-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-peer-public-out', defId: 'PointOutput', params: {} },
        { id: 'low-order-peer', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 16, y: 0 } },
        { id: 'curve-check-honest', defId: 'PointOnCurve', params: { p: 17, a: 2, b: 3 } },
        { id: 'curve-check-honest-out', defId: 'BitOutput', params: {} },
        { id: 'curve-check-low-order', defId: 'PointOnCurve', params: { p: 17, a: 2, b: 3 } },
        { id: 'curve-check-low-order-out', defId: 'BitOutput', params: {} },
        { id: 'order-bits', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'order-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'order-scalar-out', defId: 'IntegerOutput', params: {} },
        { id: 'zero-bits', defId: 'BitSource', params: { stream: [0] } },
        { id: 'zero-scalar', defId: 'BitsToInteger', params: {} },
        { id: 'zero-scalar-out', defId: 'IntegerOutput', params: {} },
        { id: 'infinity-reference', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'infinity-reference-out', defId: 'PointOutput', params: {} },
        { id: 'subgroup-check-honest', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'subgroup-check-honest-out', defId: 'PointOutput', params: {} },
        { id: 'subgroup-check-honest-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'subgroup-check-honest-match-out', defId: 'BitOutput', params: {} },
        { id: 'subgroup-check-low-order', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'subgroup-check-low-order-out', defId: 'PointOutput', params: {} },
        { id: 'subgroup-check-low-order-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'subgroup-check-low-order-match-out', defId: 'BitOutput', params: {} },
        { id: 'accepted-peer-broken', defId: 'PointSelector', params: { p: 17, a: 2, b: 3 } },
        { id: 'accepted-peer-broken-out', defId: 'PointOutput', params: {} },
        { id: 'accepted-peer-honest', defId: 'PointSelector', params: { p: 17, a: 2, b: 3 } },
        { id: 'accepted-peer-honest-out', defId: 'PointOutput', params: {} },
        { id: 'private-a-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'private-a', defId: 'BitsToInteger', params: {} },
        { id: 'private-a-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-aprime-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'private-aprime', defId: 'BitsToInteger', params: {} },
        { id: 'private-aprime-out', defId: 'IntegerOutput', params: {} },
        { id: 'honest-shared-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-shared-a-out', defId: 'PointOutput', params: {} },
        { id: 'honest-shared-aprime', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-shared-aprime-out', defId: 'PointOutput', params: {} },
        { id: 'honest-shared-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-shared-match-out', defId: 'BitOutput', params: {} },
        { id: 'collapse-shared-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-shared-a-out', defId: 'PointOutput', params: {} },
        { id: 'collapse-shared-aprime', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-shared-aprime-out', defId: 'PointOutput', params: {} },
        { id: 'collapse-match', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'collapse-match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'peer-scalar-bits', port: 'out' }, to: { moduleId: 'peer-scalar', port: 'in' } },
        { from: { moduleId: 'peer-scalar', port: 'out' }, to: { moduleId: 'peer-scalar-out', port: 'in' } },
        { from: { moduleId: 'peer-scalar', port: 'out' }, to: { moduleId: 'honest-peer-public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'honest-peer-public', port: 'point' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'honest-peer-public-out', port: 'in' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'curve-check-honest', port: 'in' } },
        { from: { moduleId: 'curve-check-honest', port: 'out' }, to: { moduleId: 'curve-check-honest-out', port: 'in' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'curve-check-low-order', port: 'in' } },
        { from: { moduleId: 'curve-check-low-order', port: 'out' }, to: { moduleId: 'curve-check-low-order-out', port: 'in' } },
        { from: { moduleId: 'order-bits', port: 'out' }, to: { moduleId: 'order-scalar', port: 'in' } },
        { from: { moduleId: 'order-scalar', port: 'out' }, to: { moduleId: 'order-scalar-out', port: 'in' } },
        { from: { moduleId: 'zero-bits', port: 'out' }, to: { moduleId: 'zero-scalar', port: 'in' } },
        { from: { moduleId: 'zero-scalar', port: 'out' }, to: { moduleId: 'zero-scalar-out', port: 'in' } },
        { from: { moduleId: 'zero-scalar', port: 'out' }, to: { moduleId: 'infinity-reference', port: 'scalar' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'infinity-reference', port: 'point' } },
        { from: { moduleId: 'infinity-reference', port: 'out' }, to: { moduleId: 'infinity-reference-out', port: 'in' } },
        { from: { moduleId: 'order-scalar', port: 'out' }, to: { moduleId: 'subgroup-check-honest', port: 'scalar' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'subgroup-check-honest', port: 'point' } },
        { from: { moduleId: 'subgroup-check-honest', port: 'out' }, to: { moduleId: 'subgroup-check-honest-out', port: 'in' } },
        { from: { moduleId: 'subgroup-check-honest', port: 'out' }, to: { moduleId: 'subgroup-check-honest-match', port: 'a' } },
        { from: { moduleId: 'infinity-reference', port: 'out' }, to: { moduleId: 'subgroup-check-honest-match', port: 'b' } },
        { from: { moduleId: 'subgroup-check-honest-match', port: 'out' }, to: { moduleId: 'subgroup-check-honest-match-out', port: 'in' } },
        { from: { moduleId: 'order-scalar', port: 'out' }, to: { moduleId: 'subgroup-check-low-order', port: 'scalar' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'subgroup-check-low-order', port: 'point' } },
        { from: { moduleId: 'subgroup-check-low-order', port: 'out' }, to: { moduleId: 'subgroup-check-low-order-out', port: 'in' } },
        { from: { moduleId: 'subgroup-check-low-order', port: 'out' }, to: { moduleId: 'subgroup-check-low-order-match', port: 'a' } },
        { from: { moduleId: 'infinity-reference', port: 'out' }, to: { moduleId: 'subgroup-check-low-order-match', port: 'b' } },
        { from: { moduleId: 'subgroup-check-low-order-match', port: 'out' }, to: { moduleId: 'subgroup-check-low-order-match-out', port: 'in' } },
        { from: { moduleId: 'curve-check-low-order', port: 'out' }, to: { moduleId: 'accepted-peer-broken', port: 'select' } },
        { from: { moduleId: 'infinity-reference', port: 'out' }, to: { moduleId: 'accepted-peer-broken', port: 'keep' } },
        { from: { moduleId: 'low-order-peer', port: 'out' }, to: { moduleId: 'accepted-peer-broken', port: 'take' } },
        { from: { moduleId: 'accepted-peer-broken', port: 'out' }, to: { moduleId: 'accepted-peer-broken-out', port: 'in' } },
        { from: { moduleId: 'subgroup-check-honest-match', port: 'out' }, to: { moduleId: 'accepted-peer-honest', port: 'select' } },
        { from: { moduleId: 'infinity-reference', port: 'out' }, to: { moduleId: 'accepted-peer-honest', port: 'keep' } },
        { from: { moduleId: 'honest-peer-public', port: 'out' }, to: { moduleId: 'accepted-peer-honest', port: 'take' } },
        { from: { moduleId: 'accepted-peer-honest', port: 'out' }, to: { moduleId: 'accepted-peer-honest-out', port: 'in' } },
        { from: { moduleId: 'private-a-bits', port: 'out' }, to: { moduleId: 'private-a', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'private-a-out', port: 'in' } },
        { from: { moduleId: 'private-aprime-bits', port: 'out' }, to: { moduleId: 'private-aprime', port: 'in' } },
        { from: { moduleId: 'private-aprime', port: 'out' }, to: { moduleId: 'private-aprime-out', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'honest-shared-a', port: 'scalar' } },
        { from: { moduleId: 'accepted-peer-honest', port: 'out' }, to: { moduleId: 'honest-shared-a', port: 'point' } },
        { from: { moduleId: 'honest-shared-a', port: 'out' }, to: { moduleId: 'honest-shared-a-out', port: 'in' } },
        { from: { moduleId: 'private-aprime', port: 'out' }, to: { moduleId: 'honest-shared-aprime', port: 'scalar' } },
        { from: { moduleId: 'accepted-peer-honest', port: 'out' }, to: { moduleId: 'honest-shared-aprime', port: 'point' } },
        { from: { moduleId: 'honest-shared-aprime', port: 'out' }, to: { moduleId: 'honest-shared-aprime-out', port: 'in' } },
        { from: { moduleId: 'honest-shared-a', port: 'out' }, to: { moduleId: 'honest-shared-match', port: 'a' } },
        { from: { moduleId: 'honest-shared-aprime', port: 'out' }, to: { moduleId: 'honest-shared-match', port: 'b' } },
        { from: { moduleId: 'honest-shared-match', port: 'out' }, to: { moduleId: 'honest-shared-match-out', port: 'in' } },
        { from: { moduleId: 'private-a', port: 'out' }, to: { moduleId: 'collapse-shared-a', port: 'scalar' } },
        { from: { moduleId: 'accepted-peer-broken', port: 'out' }, to: { moduleId: 'collapse-shared-a', port: 'point' } },
        { from: { moduleId: 'collapse-shared-a', port: 'out' }, to: { moduleId: 'collapse-shared-a-out', port: 'in' } },
        { from: { moduleId: 'private-aprime', port: 'out' }, to: { moduleId: 'collapse-shared-aprime', port: 'scalar' } },
        { from: { moduleId: 'accepted-peer-broken', port: 'out' }, to: { moduleId: 'collapse-shared-aprime', port: 'point' } },
        { from: { moduleId: 'collapse-shared-aprime', port: 'out' }, to: { moduleId: 'collapse-shared-aprime-out', port: 'in' } },
        { from: { moduleId: 'collapse-shared-a', port: 'out' }, to: { moduleId: 'collapse-match', port: 'a' } },
        { from: { moduleId: 'collapse-shared-aprime', port: 'out' }, to: { moduleId: 'collapse-match', port: 'b' } },
        { from: { moduleId: 'collapse-match', port: 'out' }, to: { moduleId: 'collapse-match-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 72, y: 72 },
      'peer-scalar-bits': { x: 72, y: 220 },
      'peer-scalar': { x: 324, y: 220 },
      'peer-scalar-out': { x: 580, y: 220 },
      'honest-peer-public': { x: 580, y: 72 },
      'honest-peer-public-out': { x: 860, y: 72 },
      'low-order-peer': { x: 72, y: 492 },
      'curve-check-honest': { x: 860, y: 148 },
      'curve-check-honest-out': { x: 1128, y: 148 },
      'curve-check-low-order': { x: 324, y: 492 },
      'curve-check-low-order-out': { x: 580, y: 492 },
      'order-bits': { x: 72, y: 360 },
      'order-scalar': { x: 324, y: 360 },
      'order-scalar-out': { x: 580, y: 360 },
      'zero-bits': { x: 860, y: 292 },
      'zero-scalar': { x: 1128, y: 292 },
      'zero-scalar-out': { x: 1388, y: 292 },
      'infinity-reference': { x: 1388, y: 72 },
      'infinity-reference-out': { x: 1660, y: 72 },
      'subgroup-check-honest': { x: 860, y: 360 },
      'subgroup-check-honest-out': { x: 1128, y: 360 },
      'subgroup-check-honest-match': { x: 1388, y: 360 },
      'subgroup-check-honest-match-out': { x: 1660, y: 360 },
      'subgroup-check-low-order': { x: 860, y: 560 },
      'subgroup-check-low-order-out': { x: 1128, y: 560 },
      'subgroup-check-low-order-match': { x: 1388, y: 560 },
      'subgroup-check-low-order-match-out': { x: 1660, y: 560 },
      'accepted-peer-broken': { x: 1660, y: 732 },
      'accepted-peer-broken-out': { x: 1924, y: 732 },
      'accepted-peer-honest': { x: 1660, y: 200 },
      'accepted-peer-honest-out': { x: 1924, y: 200 },
      'private-a-bits': { x: 1924, y: 40 },
      'private-a': { x: 2188, y: 40 },
      'private-a-out': { x: 2452, y: 40 },
      'private-aprime-bits': { x: 1924, y: 888 },
      'private-aprime': { x: 2188, y: 888 },
      'private-aprime-out': { x: 2452, y: 888 },
      'honest-shared-a': { x: 2188, y: 200 },
      'honest-shared-a-out': { x: 2452, y: 200 },
      'honest-shared-aprime': { x: 2188, y: 360 },
      'honest-shared-aprime-out': { x: 2452, y: 360 },
      'honest-shared-match': { x: 2716, y: 280 },
      'honest-shared-match-out': { x: 2968, y: 280 },
      'collapse-shared-a': { x: 2188, y: 640 },
      'collapse-shared-a-out': { x: 2452, y: 640 },
      'collapse-shared-aprime': { x: 2188, y: 812 },
      'collapse-shared-aprime-out': { x: 2452, y: 812 },
      'collapse-match': { x: 2716, y: 724 },
      'collapse-match-out': { x: 2968, y: 724 },
    },
  },
  {
    id: 'visible-schnorr-signature',
    name: 'Visible Schnorr Signature',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 230,
    recommendedAfter: ['visible-point-order-and-subgroups'],
    summary:
      'One visible order-11 base point supports public-key derivation, nonce commitment, one pedagogical challenge stage, one scalar response, and one point-equality verification equation in a glass-box Schnorr-style signature flow.',
    pipeline:
      'PointSource(G) + PointOrder(n) + integer bridges -> ScalarMultiply(P,R,sG,cP) + ChallengeCombine + ScalarLinearCombine + PointAdd -> PointEquals',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 15, y: 12 } },
        { id: 'base-order', defId: 'PointOrder', params: { p: 17, a: 2, b: 3 } },
        { id: 'base-order-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'private', defId: 'BitsToInteger', params: {} },
        { id: 'public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'public-out', defId: 'PointOutput', params: {} },
        { id: 'nonce-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 0] } },
        { id: 'nonce', defId: 'BitsToInteger', params: {} },
        { id: 'commitment', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'commitment-out', defId: 'PointOutput', params: {} },
        { id: 'message-bits', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'message', defId: 'BitsToInteger', params: {} },
        { id: 'challenge', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'challenge-out', defId: 'IntegerOutput', params: {} },
        { id: 'response', defId: 'ScalarLinearCombine', params: { n: 11 } },
        { id: 'response-out', defId: 'IntegerOutput', params: {} },
        { id: 'verify-left', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-left-out', defId: 'PointOutput', params: {} },
        { id: 'verify-scale-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-right-add', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-right-out', defId: 'PointOutput', params: {} },
        { id: 'verify-equals', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-equals-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'base-order', port: 'point' } },
        { from: { moduleId: 'base-order', port: 'out' }, to: { moduleId: 'base-order-out', port: 'in' } },
        { from: { moduleId: 'private-bits', port: 'out' }, to: { moduleId: 'private', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'public', port: 'point' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'public-out', port: 'in' } },
        { from: { moduleId: 'nonce-bits', port: 'out' }, to: { moduleId: 'nonce', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'commitment', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'commitment', port: 'point' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'commitment-out', port: 'in' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'message', port: 'in' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'challenge', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'challenge', port: 'publicKey' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'challenge', port: 'message' } },
        { from: { moduleId: 'challenge', port: 'out' }, to: { moduleId: 'challenge-out', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'response', port: 'nonce' } },
        { from: { moduleId: 'challenge', port: 'out' }, to: { moduleId: 'response', port: 'challenge' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'response', port: 'private' } },
        { from: { moduleId: 'response', port: 'out' }, to: { moduleId: 'response-out', port: 'in' } },
        { from: { moduleId: 'response', port: 'out' }, to: { moduleId: 'verify-left', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'verify-left', port: 'point' } },
        { from: { moduleId: 'verify-left', port: 'out' }, to: { moduleId: 'verify-left-out', port: 'in' } },
        { from: { moduleId: 'challenge', port: 'out' }, to: { moduleId: 'verify-scale-public', port: 'scalar' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'verify-scale-public', port: 'point' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'verify-right-add', port: 'a' } },
        { from: { moduleId: 'verify-scale-public', port: 'out' }, to: { moduleId: 'verify-right-add', port: 'b' } },
        { from: { moduleId: 'verify-right-add', port: 'out' }, to: { moduleId: 'verify-right-out', port: 'in' } },
        { from: { moduleId: 'verify-left', port: 'out' }, to: { moduleId: 'verify-equals', port: 'a' } },
        { from: { moduleId: 'verify-right-add', port: 'out' }, to: { moduleId: 'verify-equals', port: 'b' } },
        { from: { moduleId: 'verify-equals', port: 'out' }, to: { moduleId: 'verify-equals-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 76, y: 300 },
      'base-order': { x: 356, y: 300 },
      'base-order-out': { x: 640, y: 204 },
      'private-bits': { x: 76, y: 48 },
      private: { x: 356, y: 48 },
      public: { x: 656, y: 48 },
      'public-out': { x: 948, y: 48 },
      'nonce-bits': { x: 76, y: 536 },
      nonce: { x: 356, y: 536 },
      commitment: { x: 656, y: 536 },
      'commitment-out': { x: 948, y: 536 },
      'message-bits': { x: 76, y: 712 },
      message: { x: 356, y: 712 },
      challenge: { x: 948, y: 300 },
      'challenge-out': { x: 1236, y: 204 },
      response: { x: 1236, y: 396 },
      'response-out': { x: 1496, y: 396 },
      'verify-left': { x: 1496, y: 136 },
      'verify-left-out': { x: 1768, y: 136 },
      'verify-scale-public': { x: 1496, y: 560 },
      'verify-right-add': { x: 1768, y: 444 },
      'verify-right-out': { x: 2044, y: 444 },
      'verify-equals': { x: 2044, y: 276 },
      'verify-equals-out': { x: 2308, y: 276 },
    },
  },
  {
    id: 'schnorr-nonce-reuse-consequence',
    name: 'Schnorr Nonce Reuse Consequence',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 235,
    recommendedAfter: ['visible-schnorr-signature'],
    summary:
      'Two visible pedagogical Schnorr signatures reuse the same nonce commitment point R, then a graph-visible scalar lane computes Δs, Δc, one inversion step modulo n, and the recovered secret scalar.',
    pipeline:
      'PointSource(G) + PointOrder(n) + integer bridges -> two Schnorr-style lanes sharing nonce R + ScalarLinearCombine(s1,s2) -> FieldSub(Δs,Δc) + FieldInverse + FieldMul(recover x) -> PointEquals(R reuse) + Equals(secret recovery)',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 15, y: 12 } },
        { id: 'base-order', defId: 'PointOrder', params: { p: 17, a: 2, b: 3 } },
        { id: 'base-order-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-bits', defId: 'BitSource', params: { stream: [0, 1, 1, 1] } },
        { id: 'private', defId: 'BitsToInteger', params: {} },
        { id: 'private-out', defId: 'IntegerOutput', params: {} },
        { id: 'public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'public-out', defId: 'PointOutput', params: {} },
        { id: 'nonce-a-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'nonce-a', defId: 'BitsToInteger', params: {} },
        { id: 'nonce-a-out', defId: 'IntegerOutput', params: {} },
        { id: 'nonce-b-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'nonce-b', defId: 'BitsToInteger', params: {} },
        { id: 'nonce-b-out', defId: 'IntegerOutput', params: {} },
        { id: 'commitment-a', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'commitment-a-out', defId: 'PointOutput', params: {} },
        { id: 'message-a-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'message-a', defId: 'BitsToInteger', params: {} },
        { id: 'challenge-a', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'challenge-a-out', defId: 'IntegerOutput', params: {} },
        { id: 'response-a', defId: 'ScalarLinearCombine', params: { n: 11 } },
        { id: 'response-a-out', defId: 'IntegerOutput', params: {} },
        { id: 'commitment-b', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'commitment-b-out', defId: 'PointOutput', params: {} },
        { id: 'message-b-bits', defId: 'BitSource', params: { stream: [1, 0, 0, 0] } },
        { id: 'message-b', defId: 'BitsToInteger', params: {} },
        { id: 'challenge-b', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'challenge-b-out', defId: 'IntegerOutput', params: {} },
        { id: 'response-b', defId: 'ScalarLinearCombine', params: { n: 11 } },
        { id: 'response-b-out', defId: 'IntegerOutput', params: {} },
        { id: 'reused-r-equals', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'reused-r-equals-out', defId: 'BitOutput', params: {} },
        { id: 'delta-s', defId: 'FieldSub', params: { modulus: 11 } },
        { id: 'delta-s-out', defId: 'IntegerOutput', params: {} },
        { id: 'delta-c', defId: 'FieldSub', params: { modulus: 11 } },
        { id: 'delta-c-out', defId: 'IntegerOutput', params: {} },
        { id: 'delta-c-inverse', defId: 'FieldInverse', params: { modulus: 11 } },
        { id: 'delta-c-inverse-out', defId: 'IntegerOutput', params: {} },
        { id: 'recovered-secret', defId: 'FieldMul', params: { modulus: 11 } },
        { id: 'recovered-secret-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-compare-bits', defId: 'IntegerToBits', params: { width: 4 } },
        { id: 'recovered-compare-bits', defId: 'IntegerToBits', params: { width: 4 } },
        { id: 'recovered-secret-equals', defId: 'Equals', params: {} },
        { id: 'recovered-secret-equals-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'base-order', port: 'point' } },
        { from: { moduleId: 'base-order', port: 'out' }, to: { moduleId: 'base-order-out', port: 'in' } },
        { from: { moduleId: 'private-bits', port: 'out' }, to: { moduleId: 'private', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'private-out', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'public', port: 'point' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'public-out', port: 'in' } },
        { from: { moduleId: 'nonce-a-bits', port: 'out' }, to: { moduleId: 'nonce-a', port: 'in' } },
        { from: { moduleId: 'nonce-a', port: 'out' }, to: { moduleId: 'nonce-a-out', port: 'in' } },
        { from: { moduleId: 'nonce-b-bits', port: 'out' }, to: { moduleId: 'nonce-b', port: 'in' } },
        { from: { moduleId: 'nonce-b', port: 'out' }, to: { moduleId: 'nonce-b-out', port: 'in' } },
        { from: { moduleId: 'nonce-a', port: 'out' }, to: { moduleId: 'commitment-a', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'commitment-a', port: 'point' } },
        { from: { moduleId: 'commitment-a', port: 'out' }, to: { moduleId: 'commitment-a-out', port: 'in' } },
        { from: { moduleId: 'message-a-bits', port: 'out' }, to: { moduleId: 'message-a', port: 'in' } },
        { from: { moduleId: 'commitment-a', port: 'out' }, to: { moduleId: 'challenge-a', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'challenge-a', port: 'publicKey' } },
        { from: { moduleId: 'message-a', port: 'out' }, to: { moduleId: 'challenge-a', port: 'message' } },
        { from: { moduleId: 'challenge-a', port: 'out' }, to: { moduleId: 'challenge-a-out', port: 'in' } },
        { from: { moduleId: 'nonce-a', port: 'out' }, to: { moduleId: 'response-a', port: 'nonce' } },
        { from: { moduleId: 'challenge-a', port: 'out' }, to: { moduleId: 'response-a', port: 'challenge' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'response-a', port: 'private' } },
        { from: { moduleId: 'response-a', port: 'out' }, to: { moduleId: 'response-a-out', port: 'in' } },
        { from: { moduleId: 'nonce-a', port: 'out' }, to: { moduleId: 'commitment-b', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'commitment-b', port: 'point' } },
        { from: { moduleId: 'commitment-b', port: 'out' }, to: { moduleId: 'commitment-b-out', port: 'in' } },
        { from: { moduleId: 'message-b-bits', port: 'out' }, to: { moduleId: 'message-b', port: 'in' } },
        { from: { moduleId: 'commitment-b', port: 'out' }, to: { moduleId: 'challenge-b', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'challenge-b', port: 'publicKey' } },
        { from: { moduleId: 'message-b', port: 'out' }, to: { moduleId: 'challenge-b', port: 'message' } },
        { from: { moduleId: 'challenge-b', port: 'out' }, to: { moduleId: 'challenge-b-out', port: 'in' } },
        { from: { moduleId: 'nonce-a', port: 'out' }, to: { moduleId: 'response-b', port: 'nonce' } },
        { from: { moduleId: 'challenge-b', port: 'out' }, to: { moduleId: 'response-b', port: 'challenge' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'response-b', port: 'private' } },
        { from: { moduleId: 'response-b', port: 'out' }, to: { moduleId: 'response-b-out', port: 'in' } },
        { from: { moduleId: 'commitment-a', port: 'out' }, to: { moduleId: 'reused-r-equals', port: 'a' } },
        { from: { moduleId: 'commitment-b', port: 'out' }, to: { moduleId: 'reused-r-equals', port: 'b' } },
        { from: { moduleId: 'reused-r-equals', port: 'out' }, to: { moduleId: 'reused-r-equals-out', port: 'in' } },
        { from: { moduleId: 'response-a', port: 'out' }, to: { moduleId: 'delta-s', port: 'a' } },
        { from: { moduleId: 'response-b', port: 'out' }, to: { moduleId: 'delta-s', port: 'b' } },
        { from: { moduleId: 'delta-s', port: 'out' }, to: { moduleId: 'delta-s-out', port: 'in' } },
        { from: { moduleId: 'challenge-a', port: 'out' }, to: { moduleId: 'delta-c', port: 'a' } },
        { from: { moduleId: 'challenge-b', port: 'out' }, to: { moduleId: 'delta-c', port: 'b' } },
        { from: { moduleId: 'delta-c', port: 'out' }, to: { moduleId: 'delta-c-out', port: 'in' } },
        { from: { moduleId: 'delta-c', port: 'out' }, to: { moduleId: 'delta-c-inverse', port: 'in' } },
        { from: { moduleId: 'delta-c-inverse', port: 'out' }, to: { moduleId: 'delta-c-inverse-out', port: 'in' } },
        { from: { moduleId: 'delta-s', port: 'out' }, to: { moduleId: 'recovered-secret', port: 'a' } },
        { from: { moduleId: 'delta-c-inverse', port: 'out' }, to: { moduleId: 'recovered-secret', port: 'b' } },
        { from: { moduleId: 'recovered-secret', port: 'out' }, to: { moduleId: 'recovered-secret-out', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'private-compare-bits', port: 'in' } },
        { from: { moduleId: 'recovered-secret', port: 'out' }, to: { moduleId: 'recovered-compare-bits', port: 'in' } },
        { from: { moduleId: 'private-compare-bits', port: 'out' }, to: { moduleId: 'recovered-secret-equals', port: 'a' } },
        { from: { moduleId: 'recovered-compare-bits', port: 'out' }, to: { moduleId: 'recovered-secret-equals', port: 'b' } },
        { from: { moduleId: 'recovered-secret-equals', port: 'out' }, to: { moduleId: 'recovered-secret-equals-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 72, y: 284 },
      'base-order': { x: 348, y: 284 },
      'base-order-out': { x: 620, y: 184 },
      'private-bits': { x: 72, y: 52 },
      private: { x: 348, y: 52 },
      'private-out': { x: 620, y: 52 },
      public: { x: 620, y: 368 },
      'public-out': { x: 912, y: 368 },
      'nonce-a-bits': { x: 72, y: 548 },
      'nonce-a': { x: 348, y: 548 },
      'nonce-a-out': { x: 620, y: 500 },
      'nonce-b-bits': { x: 72, y: 712 },
      'nonce-b': { x: 348, y: 712 },
      'nonce-b-out': { x: 620, y: 664 },
      'commitment-a': { x: 912, y: 120 },
      'commitment-a-out': { x: 1200, y: 120 },
      'message-a-bits': { x: 620, y: 16 },
      'message-a': { x: 912, y: 16 },
      'challenge-a': { x: 1200, y: 248 },
      'challenge-a-out': { x: 1484, y: 184 },
      'response-a': { x: 1484, y: 332 },
      'response-a-out': { x: 1756, y: 332 },
      'commitment-b': { x: 912, y: 604 },
      'commitment-b-out': { x: 1200, y: 604 },
      'message-b-bits': { x: 620, y: 816 },
      'message-b': { x: 912, y: 816 },
      'challenge-b': { x: 1200, y: 720 },
      'challenge-b-out': { x: 1484, y: 656 },
      'response-b': { x: 1484, y: 804 },
      'response-b-out': { x: 1756, y: 804 },
      'reused-r-equals': { x: 1484, y: 472 },
      'reused-r-equals-out': { x: 1756, y: 472 },
      'delta-s': { x: 2028, y: 280 },
      'delta-s-out': { x: 2300, y: 280 },
      'delta-c': { x: 2028, y: 472 },
      'delta-c-out': { x: 2300, y: 472 },
      'delta-c-inverse': { x: 2576, y: 472 },
      'delta-c-inverse-out': { x: 2844, y: 472 },
      'recovered-secret': { x: 2576, y: 280 },
      'recovered-secret-out': { x: 2844, y: 280 },
      'private-compare-bits': { x: 2576, y: 96 },
      'recovered-compare-bits': { x: 2576, y: 656 },
      'recovered-secret-equals': { x: 3116, y: 376 },
      'recovered-secret-equals-out': { x: 3384, y: 376 },
    },
  },
  {
    id: 'schnorr-challenge-binding-consequence',
    name: 'Schnorr Challenge Binding Consequence',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 236,
    recommendedAfter: ['schnorr-nonce-reuse-consequence'],
    summary:
      'One visible Schnorr signature over message 3 is checked two ways: a broken verifier lane still binds its challenge to the signed message and emits success, while the honest verifier lane binds to claimed message 8 and fails.',
    pipeline:
      'PointSource(G) + PointOrder(n) + visible signer transcript -> ChallengeCombine(c_sig,c_broken,c_claim) + ScalarLinearCombine(s) + ScalarMultiply(sG,cP) + PointAdd -> PointEquals(broken verifier vs honest verifier)',
    project: {
      modules: [
        { id: 'base-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 15, y: 12 } },
        { id: 'base-order', defId: 'PointOrder', params: { p: 17, a: 2, b: 3 } },
        { id: 'base-order-out', defId: 'IntegerOutput', params: {} },
        { id: 'private-bits', defId: 'BitSource', params: { stream: [0, 1, 1, 1] } },
        { id: 'private', defId: 'BitsToInteger', params: {} },
        { id: 'private-out', defId: 'IntegerOutput', params: {} },
        { id: 'public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'public-out', defId: 'PointOutput', params: {} },
        { id: 'nonce-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'nonce', defId: 'BitsToInteger', params: {} },
        { id: 'nonce-out', defId: 'IntegerOutput', params: {} },
        { id: 'commitment', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'commitment-out', defId: 'PointOutput', params: {} },
        { id: 'message-sig-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'message-sig', defId: 'BitsToInteger', params: {} },
        { id: 'message-sig-out', defId: 'IntegerOutput', params: {} },
        { id: 'signer-challenge', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'signer-challenge-out', defId: 'IntegerOutput', params: {} },
        { id: 'response', defId: 'ScalarLinearCombine', params: { n: 11 } },
        { id: 'response-out', defId: 'IntegerOutput', params: {} },
        { id: 'verify-left', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'verify-left-out', defId: 'PointOutput', params: {} },
        { id: 'message-claim-bits', defId: 'BitSource', params: { stream: [1, 0, 0, 0] } },
        { id: 'message-claim', defId: 'BitsToInteger', params: {} },
        { id: 'message-claim-out', defId: 'IntegerOutput', params: {} },
        { id: 'broken-verify-challenge', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'broken-verify-challenge-out', defId: 'IntegerOutput', params: {} },
        { id: 'broken-verify-scale-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'broken-verify-right-add', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'broken-verify-right-out', defId: 'PointOutput', params: {} },
        { id: 'broken-verify-equals', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'broken-verify-equals-out', defId: 'BitOutput', params: {} },
        { id: 'honest-verify-challenge', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'honest-verify-challenge-out', defId: 'IntegerOutput', params: {} },
        { id: 'honest-verify-scale-public', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-verify-right-add', defId: 'PointAdd', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-verify-right-out', defId: 'PointOutput', params: {} },
        { id: 'honest-verify-equals', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'honest-verify-equals-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'base-order', port: 'point' } },
        { from: { moduleId: 'base-order', port: 'out' }, to: { moduleId: 'base-order-out', port: 'in' } },
        { from: { moduleId: 'private-bits', port: 'out' }, to: { moduleId: 'private', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'private-out', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'public', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'public', port: 'point' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'public-out', port: 'in' } },
        { from: { moduleId: 'nonce-bits', port: 'out' }, to: { moduleId: 'nonce', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'nonce-out', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'commitment', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'commitment', port: 'point' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'commitment-out', port: 'in' } },
        { from: { moduleId: 'message-sig-bits', port: 'out' }, to: { moduleId: 'message-sig', port: 'in' } },
        { from: { moduleId: 'message-sig', port: 'out' }, to: { moduleId: 'message-sig-out', port: 'in' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'signer-challenge', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'signer-challenge', port: 'publicKey' } },
        { from: { moduleId: 'message-sig', port: 'out' }, to: { moduleId: 'signer-challenge', port: 'message' } },
        { from: { moduleId: 'signer-challenge', port: 'out' }, to: { moduleId: 'signer-challenge-out', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'response', port: 'nonce' } },
        { from: { moduleId: 'signer-challenge', port: 'out' }, to: { moduleId: 'response', port: 'challenge' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'response', port: 'private' } },
        { from: { moduleId: 'response', port: 'out' }, to: { moduleId: 'response-out', port: 'in' } },
        { from: { moduleId: 'response', port: 'out' }, to: { moduleId: 'verify-left', port: 'scalar' } },
        { from: { moduleId: 'base-point', port: 'out' }, to: { moduleId: 'verify-left', port: 'point' } },
        { from: { moduleId: 'verify-left', port: 'out' }, to: { moduleId: 'verify-left-out', port: 'in' } },
        { from: { moduleId: 'message-claim-bits', port: 'out' }, to: { moduleId: 'message-claim', port: 'in' } },
        { from: { moduleId: 'message-claim', port: 'out' }, to: { moduleId: 'message-claim-out', port: 'in' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'broken-verify-challenge', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'broken-verify-challenge', port: 'publicKey' } },
        { from: { moduleId: 'message-sig', port: 'out' }, to: { moduleId: 'broken-verify-challenge', port: 'message' } },
        { from: { moduleId: 'broken-verify-challenge', port: 'out' }, to: { moduleId: 'broken-verify-challenge-out', port: 'in' } },
        { from: { moduleId: 'broken-verify-challenge', port: 'out' }, to: { moduleId: 'broken-verify-scale-public', port: 'scalar' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'broken-verify-scale-public', port: 'point' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'broken-verify-right-add', port: 'a' } },
        { from: { moduleId: 'broken-verify-scale-public', port: 'out' }, to: { moduleId: 'broken-verify-right-add', port: 'b' } },
        { from: { moduleId: 'broken-verify-right-add', port: 'out' }, to: { moduleId: 'broken-verify-right-out', port: 'in' } },
        { from: { moduleId: 'verify-left', port: 'out' }, to: { moduleId: 'broken-verify-equals', port: 'a' } },
        { from: { moduleId: 'broken-verify-right-add', port: 'out' }, to: { moduleId: 'broken-verify-equals', port: 'b' } },
        { from: { moduleId: 'broken-verify-equals', port: 'out' }, to: { moduleId: 'broken-verify-equals-out', port: 'in' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'honest-verify-challenge', port: 'commitment' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'honest-verify-challenge', port: 'publicKey' } },
        { from: { moduleId: 'message-claim', port: 'out' }, to: { moduleId: 'honest-verify-challenge', port: 'message' } },
        { from: { moduleId: 'honest-verify-challenge', port: 'out' }, to: { moduleId: 'honest-verify-challenge-out', port: 'in' } },
        { from: { moduleId: 'honest-verify-challenge', port: 'out' }, to: { moduleId: 'honest-verify-scale-public', port: 'scalar' } },
        { from: { moduleId: 'public', port: 'out' }, to: { moduleId: 'honest-verify-scale-public', port: 'point' } },
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'honest-verify-right-add', port: 'a' } },
        { from: { moduleId: 'honest-verify-scale-public', port: 'out' }, to: { moduleId: 'honest-verify-right-add', port: 'b' } },
        { from: { moduleId: 'honest-verify-right-add', port: 'out' }, to: { moduleId: 'honest-verify-right-out', port: 'in' } },
        { from: { moduleId: 'verify-left', port: 'out' }, to: { moduleId: 'honest-verify-equals', port: 'a' } },
        { from: { moduleId: 'honest-verify-right-add', port: 'out' }, to: { moduleId: 'honest-verify-equals', port: 'b' } },
        { from: { moduleId: 'honest-verify-equals', port: 'out' }, to: { moduleId: 'honest-verify-equals-out', port: 'in' } },
      ],
    },
    layout: {
      'base-point': { x: 76, y: 332 },
      'base-order': { x: 344, y: 332 },
      'base-order-out': { x: 612, y: 244 },
      'private-bits': { x: 76, y: 48 },
      private: { x: 344, y: 48 },
      'private-out': { x: 612, y: 48 },
      public: { x: 612, y: 412 },
      'public-out': { x: 892, y: 412 },
      'nonce-bits': { x: 76, y: 612 },
      nonce: { x: 344, y: 612 },
      'nonce-out': { x: 612, y: 564 },
      commitment: { x: 612, y: 700 },
      'commitment-out': { x: 892, y: 700 },
      'message-sig-bits': { x: 612, y: 16 },
      'message-sig': { x: 892, y: 16 },
      'message-sig-out': { x: 1164, y: 16 },
      'signer-challenge': { x: 1164, y: 164 },
      'signer-challenge-out': { x: 1440, y: 116 },
      response: { x: 1440, y: 244 },
      'response-out': { x: 1712, y: 244 },
      'verify-left': { x: 1712, y: 92 },
      'verify-left-out': { x: 1992, y: 92 },
      'message-claim-bits': { x: 612, y: 880 },
      'message-claim': { x: 892, y: 880 },
      'message-claim-out': { x: 1164, y: 880 },
      'broken-verify-challenge': { x: 1164, y: 480 },
      'broken-verify-challenge-out': { x: 1440, y: 432 },
      'broken-verify-scale-public': { x: 1712, y: 428 },
      'broken-verify-right-add': { x: 1992, y: 412 },
      'broken-verify-right-out': { x: 2272, y: 412 },
      'broken-verify-equals': { x: 2272, y: 252 },
      'broken-verify-equals-out': { x: 2548, y: 252 },
      'honest-verify-challenge': { x: 1164, y: 736 },
      'honest-verify-challenge-out': { x: 1440, y: 688 },
      'honest-verify-scale-public': { x: 1712, y: 740 },
      'honest-verify-right-add': { x: 1992, y: 724 },
      'honest-verify-right-out': { x: 2272, y: 724 },
      'honest-verify-equals': { x: 2272, y: 564 },
      'honest-verify-equals-out': { x: 2548, y: 564 },
    },
  },
  {
    id: 'toy-rsa',
    name: 'Toy RSA',
    group: 'Number Theory',
    summary: 'A visible RSA round-trip: encrypt a message with one exponent, decrypt with the inverse exponent, all modulo the same n.',
    pipeline: 'HexSource -> ModExp(encrypt) -> ModExp(decrypt) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'message', defId: 'HexSource', params: { value: '02' } },
        { id: 'pub-exp', defId: 'HexSource', params: { value: '03' } },
        { id: 'priv-exp', defId: 'HexSource', params: { value: '03' } },
        { id: 'encrypt', defId: 'ModExp', params: { modulus: 15 } },
        { id: 'decrypt', defId: 'ModExp', params: { modulus: 15 } },
        { id: 'hex-out', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'encrypt', port: 'base' } },
        { from: { moduleId: 'pub-exp', port: 'out' }, to: { moduleId: 'encrypt', port: 'exp' } },
        { from: { moduleId: 'encrypt', port: 'out' }, to: { moduleId: 'decrypt', port: 'base' } },
        { from: { moduleId: 'priv-exp', port: 'out' }, to: { moduleId: 'decrypt', port: 'exp' } },
        { from: { moduleId: 'decrypt', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
        { from: { moduleId: 'hex-out', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 72, y: 88 },
      'pub-exp': { x: 72, y: 232 },
      encrypt: { x: 340, y: 156 },
      'priv-exp': { x: 340, y: 316 },
      decrypt: { x: 600, y: 232 },
      'hex-out': { x: 860, y: 232 },
      output: { x: 1020, y: 232 },
    },
  },
  {
    id: 'diffie-hellman-key-exchange',
    name: 'Diffie-Hellman Key Exchange',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 225,
    recommendedAfter: ['toy-rsa'],
    summary: 'Two visible exponentiation branches exchange public values, then derive the same shared secret without ever transmitting that secret directly.',
    pipeline: 'HexSource(g,a,b) -> ModExp public values -> ModExp shared secrets -> BitsToHex + Equals',
    project: {
      modules: [
        { id: 'generator', defId: 'HexSource', params: { value: '05' } },
        { id: 'alice-private', defId: 'HexSource', params: { value: '06' } },
        { id: 'bob-private', defId: 'HexSource', params: { value: '0F' } },
        { id: 'alice-public', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'bob-public', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'alice-secret', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'bob-secret', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'alice-public-hex', defId: 'BitsToHex', params: {} },
        { id: 'bob-public-hex', defId: 'BitsToHex', params: {} },
        { id: 'alice-secret-hex', defId: 'BitsToHex', params: {} },
        { id: 'bob-secret-hex', defId: 'BitsToHex', params: {} },
        { id: 'alice-public-out', defId: 'HexOutput', params: {} },
        { id: 'bob-public-out', defId: 'HexOutput', params: {} },
        { id: 'alice-secret-out', defId: 'HexOutput', params: {} },
        { id: 'bob-secret-out', defId: 'HexOutput', params: {} },
        { id: 'secrets-match', defId: 'Equals', params: {} },
        { id: 'match-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'generator', port: 'out' }, to: { moduleId: 'alice-public', port: 'base' } },
        { from: { moduleId: 'generator', port: 'out' }, to: { moduleId: 'bob-public', port: 'base' } },
        { from: { moduleId: 'alice-private', port: 'out' }, to: { moduleId: 'alice-public', port: 'exp' } },
        { from: { moduleId: 'alice-private', port: 'out' }, to: { moduleId: 'alice-secret', port: 'exp' } },
        { from: { moduleId: 'bob-private', port: 'out' }, to: { moduleId: 'bob-public', port: 'exp' } },
        { from: { moduleId: 'bob-private', port: 'out' }, to: { moduleId: 'bob-secret', port: 'exp' } },
        { from: { moduleId: 'alice-public', port: 'out' }, to: { moduleId: 'alice-public-hex', port: 'in' } },
        { from: { moduleId: 'alice-public-hex', port: 'out' }, to: { moduleId: 'alice-public-out', port: 'in' } },
        { from: { moduleId: 'alice-public', port: 'out' }, to: { moduleId: 'bob-secret', port: 'base' } },
        { from: { moduleId: 'bob-public', port: 'out' }, to: { moduleId: 'bob-public-hex', port: 'in' } },
        { from: { moduleId: 'bob-public-hex', port: 'out' }, to: { moduleId: 'bob-public-out', port: 'in' } },
        { from: { moduleId: 'bob-public', port: 'out' }, to: { moduleId: 'alice-secret', port: 'base' } },
        { from: { moduleId: 'alice-secret', port: 'out' }, to: { moduleId: 'alice-secret-hex', port: 'in' } },
        { from: { moduleId: 'alice-secret-hex', port: 'out' }, to: { moduleId: 'alice-secret-out', port: 'in' } },
        { from: { moduleId: 'alice-secret', port: 'out' }, to: { moduleId: 'secrets-match', port: 'a' } },
        { from: { moduleId: 'bob-secret', port: 'out' }, to: { moduleId: 'bob-secret-hex', port: 'in' } },
        { from: { moduleId: 'bob-secret-hex', port: 'out' }, to: { moduleId: 'bob-secret-out', port: 'in' } },
        { from: { moduleId: 'bob-secret', port: 'out' }, to: { moduleId: 'secrets-match', port: 'b' } },
        { from: { moduleId: 'secrets-match', port: 'out' }, to: { moduleId: 'match-out', port: 'in' } },
      ],
    },
    layout: {
      generator: { x: 64, y: 72 },
      'alice-private': { x: 64, y: 228 },
      'bob-private': { x: 64, y: 384 },
      'alice-public': { x: 320, y: 72 },
      'bob-public': { x: 320, y: 384 },
      'alice-public-hex': { x: 560, y: 24 },
      'alice-public-out': { x: 760, y: 24 },
      'bob-public-hex': { x: 560, y: 384 },
      'bob-public-out': { x: 760, y: 384 },
      'alice-secret': { x: 560, y: 156 },
      'bob-secret': { x: 560, y: 540 },
      'alice-secret-hex': { x: 808, y: 156 },
      'alice-secret-out': { x: 1008, y: 156 },
      'bob-secret-hex': { x: 808, y: 540 },
      'bob-secret-out': { x: 1008, y: 540 },
      'secrets-match': { x: 1040, y: 344 },
      'match-out': { x: 1260, y: 344 },
    },
  },
  {
    id: 'visible-signature-verification',
    name: 'Visible Signature Verification',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 245,
    recommendedAfter: ['visible-authenticated-encryption'],
    summary: 'A visible message is signed, then verified.',
    pipeline: 'HexSource -> ModExp(sign) -> ModExp(verify) -> Equals -> BitOutput',
    project: {
      modules: [
        { id: 'message', defId: 'HexSource', params: { value: '02' } },
        { id: 'private-exp', defId: 'HexSource', params: { value: '03' } },
        { id: 'public-exp', defId: 'HexSource', params: { value: '03' } },
        { id: 'sign', defId: 'ModExp', params: { modulus: 15 } },
        { id: 'verify', defId: 'ModExp', params: { modulus: 15 } },
        { id: 'matches', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'sign', port: 'base' } },
        { from: { moduleId: 'private-exp', port: 'out' }, to: { moduleId: 'sign', port: 'exp' } },
        { from: { moduleId: 'sign', port: 'out' }, to: { moduleId: 'verify', port: 'base' } },
        { from: { moduleId: 'public-exp', port: 'out' }, to: { moduleId: 'verify', port: 'exp' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'matches', port: 'a' } },
        { from: { moduleId: 'verify', port: 'out' }, to: { moduleId: 'matches', port: 'b' } },
        { from: { moduleId: 'matches', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 56, y: 136 },
      'private-exp': { x: 56, y: 292 },
      'public-exp': { x: 632, y: 292 },
      sign: { x: 336, y: 216 },
      verify: { x: 912, y: 216 },
      matches: { x: 1160, y: 328 },
      'verify-out': { x: 1360, y: 328 },
    },
  },
  {
    id: 'visible-secure-handshake',
    name: 'Visible Secure Handshake',
    group: 'Systems Composition',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 255,
    recommendedAfter: ['visible-signature-verification'],
    summary: 'A compact handshake exchanges public values, verifies one of them, derives a shared key, and uses it to protect one later message.',
    pipeline: 'DH exchange -> signature check -> shared key -> XOR protect -> Gate -> Equals',
    project: {
      modules: [
        { id: 'generator', defId: 'HexSource', params: { value: '05' } },
        { id: 'sender-private', defId: 'HexSource', params: { value: '06' } },
        { id: 'receiver-private', defId: 'HexSource', params: { value: '0F' } },
        { id: 'sender-sign-private', defId: 'HexSource', params: { value: '0F' } },
        { id: 'sender-sign-public', defId: 'HexSource', params: { value: '03' } },
        { id: 'plaintext', defId: 'HexSource', params: { value: '09' } },
        { id: 'sender-public', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'receiver-public', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'sender-sign', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'verify-sign', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'auth-match', defId: 'Equals', params: {} },
        { id: 'sender-session', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'receiver-session', defId: 'ModExp', params: { modulus: 23 } },
        { id: 'encrypt', defId: 'XOR', params: {} },
        { id: 'decrypt', defId: 'XOR', params: {} },
        { id: 'auth-gate', defId: 'Gate', params: {} },
        { id: 'message-match', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'generator', port: 'out' }, to: { moduleId: 'sender-public', port: 'base' } },
        { from: { moduleId: 'generator', port: 'out' }, to: { moduleId: 'receiver-public', port: 'base' } },
        { from: { moduleId: 'sender-private', port: 'out' }, to: { moduleId: 'sender-public', port: 'exp' } },
        { from: { moduleId: 'receiver-private', port: 'out' }, to: { moduleId: 'receiver-public', port: 'exp' } },
        { from: { moduleId: 'sender-public', port: 'out' }, to: { moduleId: 'sender-sign', port: 'base' } },
        { from: { moduleId: 'sender-sign-private', port: 'out' }, to: { moduleId: 'sender-sign', port: 'exp' } },
        { from: { moduleId: 'sender-sign', port: 'out' }, to: { moduleId: 'verify-sign', port: 'base' } },
        { from: { moduleId: 'sender-sign-public', port: 'out' }, to: { moduleId: 'verify-sign', port: 'exp' } },
        { from: { moduleId: 'verify-sign', port: 'out' }, to: { moduleId: 'auth-match', port: 'a' } },
        { from: { moduleId: 'sender-public', port: 'out' }, to: { moduleId: 'auth-match', port: 'b' } },
        { from: { moduleId: 'receiver-public', port: 'out' }, to: { moduleId: 'sender-session', port: 'base' } },
        { from: { moduleId: 'sender-private', port: 'out' }, to: { moduleId: 'sender-session', port: 'exp' } },
        { from: { moduleId: 'sender-public', port: 'out' }, to: { moduleId: 'receiver-session', port: 'base' } },
        { from: { moduleId: 'receiver-private', port: 'out' }, to: { moduleId: 'receiver-session', port: 'exp' } },
        { from: { moduleId: 'plaintext', port: 'out' }, to: { moduleId: 'encrypt', port: 'a' } },
        { from: { moduleId: 'sender-session', port: 'out' }, to: { moduleId: 'encrypt', port: 'b' } },
        { from: { moduleId: 'encrypt', port: 'out' }, to: { moduleId: 'decrypt', port: 'a' } },
        { from: { moduleId: 'receiver-session', port: 'out' }, to: { moduleId: 'decrypt', port: 'b' } },
        { from: { moduleId: 'decrypt', port: 'out' }, to: { moduleId: 'auth-gate', port: 'in' } },
        { from: { moduleId: 'auth-match', port: 'out' }, to: { moduleId: 'auth-gate', port: 'control' } },
        { from: { moduleId: 'auth-gate', port: 'out' }, to: { moduleId: 'message-match', port: 'a' } },
        { from: { moduleId: 'plaintext', port: 'out' }, to: { moduleId: 'message-match', port: 'b' } },
        { from: { moduleId: 'message-match', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
      ],
    },
    layout: {
      generator: { x: 48, y: 60 },
      'sender-private': { x: 48, y: 188 },
      'receiver-private': { x: 48, y: 316 },
      'sender-sign-private': { x: 48, y: 444 },
      'sender-sign-public': { x: 632, y: 444 },
      plaintext: { x: 1088, y: 444 },
      'sender-public': { x: 280, y: 60 },
      'receiver-public': { x: 280, y: 316 },
      'sender-sign': { x: 504, y: 60 },
      'verify-sign': { x: 856, y: 60 },
      'auth-match': { x: 1088, y: 60 },
      'sender-session': { x: 504, y: 252 },
      'receiver-session': { x: 856, y: 252 },
      encrypt: { x: 1320, y: 252 },
      decrypt: { x: 1552, y: 252 },
      'auth-gate': { x: 1784, y: 252 },
      'message-match': { x: 2016, y: 252 },
      'verify-out': { x: 2248, y: 252 },
    },
  },
  {
    id: 'key-schedule-workshop',
    name: 'Key Schedule Workshop',
    group: 'Key Schedule',
    summary: 'A visible two-round key schedule that derives distinct round keys from one master key using rotation and XOR with a round constant.',
    pipeline: 'HexSource(master key) -> BitShifter -> XOR(round constant) -> round key branches',
    project: {
      modules: [
        { id: 'master-key', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'data', defId: 'HexSource', params: { value: '5F' } },
        { id: 'round-const', defId: 'HexSource', params: { value: '1B' } },
        { id: 'rotate', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 2 } },
        { id: 'mix', defId: 'XOR', params: {} },
        { id: 'round1-xor', defId: 'XOR', params: {} },
        { id: 'round2-xor', defId: 'XOR', params: {} },
        { id: 'out1-hex', defId: 'BitsToHex', params: {} },
        { id: 'out2-hex', defId: 'BitsToHex', params: {} },
        { id: 'out1', defId: 'HexOutput', params: {} },
        { id: 'out2', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'round1-xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'round1-xor', port: 'b' } },
        { from: { moduleId: 'round1-xor', port: 'out' }, to: { moduleId: 'out1-hex', port: 'in' } },
        { from: { moduleId: 'out1-hex', port: 'out' }, to: { moduleId: 'out1', port: 'in' } },
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'rotate', port: 'in' } },
        { from: { moduleId: 'rotate', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
        { from: { moduleId: 'round-const', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
        { from: { moduleId: 'mix', port: 'out' }, to: { moduleId: 'round2-xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'round2-xor', port: 'b' } },
        { from: { moduleId: 'round2-xor', port: 'out' }, to: { moduleId: 'out2-hex', port: 'in' } },
        { from: { moduleId: 'out2-hex', port: 'out' }, to: { moduleId: 'out2', port: 'in' } },
      ],
    },
    layout: {
      'master-key': { x: 72, y: 88 },
      data: { x: 72, y: 316 },
      'round-const': { x: 72, y: 500 },
      'round1-xor': { x: 340, y: 200 },
      'out1-hex': { x: 540, y: 200 },
      out1: { x: 740, y: 200 },
      rotate: { x: 340, y: 88 },
      mix: { x: 340, y: 430 },
      'round2-xor': { x: 540, y: 380 },
      'out2-hex': { x: 740, y: 380 },
      out2: { x: 940, y: 380 },
    },
  },
  {
    id: 'recursive-key-schedule',
    name: 'Recursive Key Schedule',
    group: 'Key Schedule',
    stage: 'framing-and-protocol-context',
    order: 125,
    recommendedAfter: ['key-schedule-workshop'],
    summary: 'A visible three-step key ladder derives each new round key from the previous one, then joins those keys into one bus for a keyed iterator.',
    pipeline: 'HexSource(master key) -> rotate/xor ladder -> BitJoin key bus -> KeyedByteRoundIterator -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'data', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'master-key', defId: 'HexSource', params: { value: '1C' } },
        { id: 'round-const-2', defId: 'HexSource', params: { value: '2D' } },
        { id: 'round-const-3', defId: 'HexSource', params: { value: 'C3' } },
        { id: 'rotate-2', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 2 } },
        { id: 'mix-2', defId: 'XOR', params: {} },
        { id: 'rotate-3', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 1 } },
        { id: 'mix-3', defId: 'XOR', params: {} },
        { id: 'join-12', defId: 'BitJoin', params: {} },
        { id: 'keybus', defId: 'BitJoin', params: {} },
        { id: 'rounds', defId: 'KeyedByteRoundIterator', params: { iterationCount: 3 } },
        { id: 'key-1-hex', defId: 'BitsToHex', params: {} },
        { id: 'key-2-hex', defId: 'BitsToHex', params: {} },
        { id: 'key-3-hex', defId: 'BitsToHex', params: {} },
        { id: 'key-1-out', defId: 'HexOutput', params: {} },
        { id: 'key-2-out', defId: 'HexOutput', params: {} },
        { id: 'key-3-out', defId: 'HexOutput', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'rotate-2', port: 'in' } },
        { from: { moduleId: 'rotate-2', port: 'out' }, to: { moduleId: 'mix-2', port: 'a' } },
        { from: { moduleId: 'round-const-2', port: 'out' }, to: { moduleId: 'mix-2', port: 'b' } },
        { from: { moduleId: 'mix-2', port: 'out' }, to: { moduleId: 'rotate-3', port: 'in' } },
        { from: { moduleId: 'rotate-3', port: 'out' }, to: { moduleId: 'mix-3', port: 'a' } },
        { from: { moduleId: 'round-const-3', port: 'out' }, to: { moduleId: 'mix-3', port: 'b' } },
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'join-12', port: 'a' } },
        { from: { moduleId: 'mix-2', port: 'out' }, to: { moduleId: 'join-12', port: 'b' } },
        { from: { moduleId: 'join-12', port: 'out' }, to: { moduleId: 'keybus', port: 'a' } },
        { from: { moduleId: 'mix-3', port: 'out' }, to: { moduleId: 'keybus', port: 'b' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'rounds', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'rounds', port: 'key' } },
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'key-1-hex', port: 'in' } },
        { from: { moduleId: 'mix-2', port: 'out' }, to: { moduleId: 'key-2-hex', port: 'in' } },
        { from: { moduleId: 'mix-3', port: 'out' }, to: { moduleId: 'key-3-hex', port: 'in' } },
        { from: { moduleId: 'key-1-hex', port: 'out' }, to: { moduleId: 'key-1-out', port: 'in' } },
        { from: { moduleId: 'key-2-hex', port: 'out' }, to: { moduleId: 'key-2-out', port: 'in' } },
        { from: { moduleId: 'key-3-hex', port: 'out' }, to: { moduleId: 'key-3-out', port: 'in' } },
        { from: { moduleId: 'rounds', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      data: { x: 40, y: 240 },
      'master-key': { x: 40, y: 48 },
      'round-const-2': { x: 40, y: 392 },
      'round-const-3': { x: 360, y: 392 },
      'rotate-2': { x: 360, y: 48 },
      'mix-2': { x: 360, y: 184 },
      'rotate-3': { x: 680, y: 184 },
      'mix-3': { x: 680, y: 336 },
      'join-12': { x: 680, y: 48 },
      keybus: { x: 980, y: 120 },
      rounds: { x: 980, y: 280 },
      'key-1-hex': { x: 980, y: 24 },
      'key-1-out': { x: 1180, y: 24 },
      'key-2-hex': { x: 980, y: 424 },
      'key-2-out': { x: 1180, y: 424 },
      'key-3-hex': { x: 1280, y: 424 },
      'key-3-out': { x: 1480, y: 424 },
      encode: { x: 1280, y: 280 },
      output: { x: 1480, y: 280 },
    },
  },
  {
    id: 'key-schedule-lab',
    name: 'Key Schedule Lab',
    group: 'Cryptanalysis Labs',
    stage: 'framing-and-protocol-context',
    order: 124,
    summary: 'Compare a rotation-only weak key schedule against a stronger constant-mixed schedule, then use key-schedule analysis to inspect adjacent round differences and key-bit spread.',
    pipeline: 'HexSource(master key) -> weak rotate ladder + stronger xor/rotate/add/xor ladder -> BitOutput round-key stages for manual key-schedule analysis',
    project: {
      modules: [
        { id: 'master-key', defId: 'HexSource', params: { value: 'A3F9' } },
        { id: 'weak-rotate-1', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 1 } },
        { id: 'weak-rotate-2', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 1 } },
        { id: 'weak-rk1-out', defId: 'BitOutput', params: {} },
        { id: 'weak-rk2-out', defId: 'BitOutput', params: {} },
        { id: 'weak-rk3-out', defId: 'BitOutput', params: {} },
        { id: 'strong-const-1', defId: 'IV', params: { value: '1B2D', width: 16 } },
        { id: 'strong-const-2', defId: 'IV', params: { value: 'C34F', width: 16 } },
        { id: 'strong-xor-1', defId: 'XOR', params: {} },
        { id: 'strong-rotate-2', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 3 } },
        { id: 'strong-add-2', defId: 'AddMod', params: {} },
        { id: 'strong-rotate-3', defId: 'BitShifter', params: { mode: 'rotate-left', amount: 5 } },
        { id: 'strong-xor-3', defId: 'XOR', params: {} },
        { id: 'strong-rk1-out', defId: 'BitOutput', params: {} },
        { id: 'strong-rk2-out', defId: 'BitOutput', params: {} },
        { id: 'strong-rk3-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'weak-rk1-out', port: 'in' } },
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'weak-rotate-1', port: 'in' } },
        { from: { moduleId: 'weak-rotate-1', port: 'out' }, to: { moduleId: 'weak-rk2-out', port: 'in' } },
        { from: { moduleId: 'weak-rotate-1', port: 'out' }, to: { moduleId: 'weak-rotate-2', port: 'in' } },
        { from: { moduleId: 'weak-rotate-2', port: 'out' }, to: { moduleId: 'weak-rk3-out', port: 'in' } },
        { from: { moduleId: 'master-key', port: 'out' }, to: { moduleId: 'strong-xor-1', port: 'a' } },
        { from: { moduleId: 'strong-const-1', port: 'out' }, to: { moduleId: 'strong-xor-1', port: 'b' } },
        { from: { moduleId: 'strong-xor-1', port: 'out' }, to: { moduleId: 'strong-rk1-out', port: 'in' } },
        { from: { moduleId: 'strong-xor-1', port: 'out' }, to: { moduleId: 'strong-rotate-2', port: 'in' } },
        { from: { moduleId: 'strong-rotate-2', port: 'out' }, to: { moduleId: 'strong-add-2', port: 'a' } },
        { from: { moduleId: 'strong-const-2', port: 'out' }, to: { moduleId: 'strong-add-2', port: 'b' } },
        { from: { moduleId: 'strong-add-2', port: 'out' }, to: { moduleId: 'strong-rk2-out', port: 'in' } },
        { from: { moduleId: 'strong-add-2', port: 'out' }, to: { moduleId: 'strong-rotate-3', port: 'in' } },
        { from: { moduleId: 'strong-rotate-3', port: 'out' }, to: { moduleId: 'strong-xor-3', port: 'a' } },
        { from: { moduleId: 'strong-xor-1', port: 'out' }, to: { moduleId: 'strong-xor-3', port: 'b' } },
        { from: { moduleId: 'strong-xor-3', port: 'out' }, to: { moduleId: 'strong-rk3-out', port: 'in' } },
      ],
    },
    layout: {
      'master-key': { x: 64, y: 104 },
      'weak-rotate-1': { x: 304, y: 104 },
      'weak-rotate-2': { x: 544, y: 104 },
      'weak-rk1-out': { x: 304, y: 264 },
      'weak-rk2-out': { x: 544, y: 264 },
      'weak-rk3-out': { x: 784, y: 264 },
      'strong-const-1': { x: 64, y: 520 },
      'strong-const-2': { x: 544, y: 696 },
      'strong-xor-1': { x: 304, y: 520 },
      'strong-rotate-2': { x: 544, y: 520 },
      'strong-add-2': { x: 784, y: 520 },
      'strong-rotate-3': { x: 1024, y: 520 },
      'strong-xor-3': { x: 1264, y: 520 },
      'strong-rk1-out': { x: 304, y: 696 },
      'strong-rk2-out': { x: 784, y: 696 },
      'strong-rk3-out': { x: 1264, y: 696 },
    },
  },
  {
    id: 'visible-block-chaining',
    name: 'Visible Block Chaining',
    group: 'Framing',
    stage: 'framing-and-protocol-context',
    order: 135,
    recommendedAfter: ['recursive-key-schedule'],
    summary: 'Two visible 8-bit blocks pass through the same S-Box transform, but the second block first mixes with the first block’s ciphertext instead of the IV.',
    pipeline: 'HexSource -> BitSplit -> XOR(IV/prev ciphertext) -> SBox -> BitJoin -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'message', defId: 'HexSource', params: { value: '1234' } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'iv', defId: 'IV', params: { value: '3C', width: 8 } },
        { id: 'chain-1', defId: 'XOR', params: {} },
        {
          id: 'encrypt-1',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'cipher-1-hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher-1-out', defId: 'HexOutput', params: {} },
        { id: 'chain-2', defId: 'XOR', params: {} },
        {
          id: 'encrypt-2',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'cipher-2-hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher-2-out', defId: 'HexOutput', params: {} },
        { id: 'join', defId: 'BitJoin', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
        { from: { moduleId: 'iv', port: 'out' }, to: { moduleId: 'chain-1', port: 'a' } },
        { from: { moduleId: 'split', port: 'left' }, to: { moduleId: 'chain-1', port: 'b' } },
        { from: { moduleId: 'chain-1', port: 'out' }, to: { moduleId: 'encrypt-1', port: 'in' } },
        { from: { moduleId: 'encrypt-1', port: 'out' }, to: { moduleId: 'cipher-1-hex', port: 'in' } },
        { from: { moduleId: 'cipher-1-hex', port: 'out' }, to: { moduleId: 'cipher-1-out', port: 'in' } },
        { from: { moduleId: 'encrypt-1', port: 'out' }, to: { moduleId: 'chain-2', port: 'a' } },
        { from: { moduleId: 'split', port: 'right' }, to: { moduleId: 'chain-2', port: 'b' } },
        { from: { moduleId: 'chain-2', port: 'out' }, to: { moduleId: 'encrypt-2', port: 'in' } },
        { from: { moduleId: 'encrypt-2', port: 'out' }, to: { moduleId: 'cipher-2-hex', port: 'in' } },
        { from: { moduleId: 'cipher-2-hex', port: 'out' }, to: { moduleId: 'cipher-2-out', port: 'in' } },
        { from: { moduleId: 'encrypt-1', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
        { from: { moduleId: 'encrypt-2', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        { from: { moduleId: 'join', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 48, y: 236 },
      split: { x: 300, y: 236 },
      iv: { x: 300, y: 76 },
      'chain-1': { x: 560, y: 132 },
      'encrypt-1': { x: 780, y: 132 },
      'cipher-1-hex': { x: 1020, y: 48 },
      'cipher-1-out': { x: 1240, y: 48 },
      'chain-2': { x: 1020, y: 312 },
      'encrypt-2': { x: 1240, y: 312 },
      'cipher-2-hex': { x: 1480, y: 312 },
      'cipher-2-out': { x: 1700, y: 312 },
      join: { x: 1480, y: 132 },
      encode: { x: 1700, y: 132 },
      output: { x: 1920, y: 132 },
    },
  },
  {
    id: 'visible-byte-order',
    name: 'Visible Byte Order',
    group: 'Modern Rounds',
    stage: 'framing-and-protocol-context',
    order: 145,
    recommendedAfter: ['visible-block-chaining'],
    summary: 'One visible 32-bit word fans out into byte-order reversal, byte-granularity rotation, and an equivalent BitShifter rotation so students can compare byte structure against raw bit movement.',
    pipeline: 'HexSource -> ByteSwap / ByteRotate / BitShifter(8-bit rotate) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'word', defId: 'HexSource', params: { value: '41424344' } },
        { id: 'original-hex', defId: 'BitsToHex', params: {} },
        { id: 'original-out', defId: 'HexOutput', params: {} },
        { id: 'swap', defId: 'ByteSwap', params: {} },
        { id: 'swap-hex', defId: 'BitsToHex', params: {} },
        { id: 'swap-out', defId: 'HexOutput', params: {} },
        { id: 'byte-rotate', defId: 'ByteRotate', params: { amount: 1, direction: 'left' } },
        { id: 'rotate-hex', defId: 'BitsToHex', params: {} },
        { id: 'rotate-out', defId: 'HexOutput', params: {} },
        { id: 'bit-rotate', defId: 'BitShifter', params: { amount: 8, mode: 'rotate-left' } },
        { id: 'bit-rotate-hex', defId: 'BitsToHex', params: {} },
        { id: 'bit-rotate-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'word', port: 'out' }, to: { moduleId: 'original-hex', port: 'in' } },
        { from: { moduleId: 'original-hex', port: 'out' }, to: { moduleId: 'original-out', port: 'in' } },
        { from: { moduleId: 'word', port: 'out' }, to: { moduleId: 'swap', port: 'in' } },
        { from: { moduleId: 'swap', port: 'out' }, to: { moduleId: 'swap-hex', port: 'in' } },
        { from: { moduleId: 'swap-hex', port: 'out' }, to: { moduleId: 'swap-out', port: 'in' } },
        { from: { moduleId: 'word', port: 'out' }, to: { moduleId: 'byte-rotate', port: 'in' } },
        { from: { moduleId: 'byte-rotate', port: 'out' }, to: { moduleId: 'rotate-hex', port: 'in' } },
        { from: { moduleId: 'rotate-hex', port: 'out' }, to: { moduleId: 'rotate-out', port: 'in' } },
        { from: { moduleId: 'word', port: 'out' }, to: { moduleId: 'bit-rotate', port: 'in' } },
        { from: { moduleId: 'bit-rotate', port: 'out' }, to: { moduleId: 'bit-rotate-hex', port: 'in' } },
        { from: { moduleId: 'bit-rotate-hex', port: 'out' }, to: { moduleId: 'bit-rotate-out', port: 'in' } },
      ],
    },
    layout: {
      word: { x: 48, y: 204 },
      'original-hex': { x: 300, y: 40 },
      'original-out': { x: 520, y: 40 },
      swap: { x: 300, y: 148 },
      'swap-hex': { x: 520, y: 148 },
      'swap-out': { x: 740, y: 148 },
      'byte-rotate': { x: 300, y: 268 },
      'rotate-hex': { x: 520, y: 268 },
      'rotate-out': { x: 740, y: 268 },
      'bit-rotate': { x: 300, y: 388 },
      'bit-rotate-hex': { x: 520, y: 388 },
      'bit-rotate-out': { x: 740, y: 388 },
    },
  },
  {
    id: 'visible-tamper-check',
    name: 'Visible Tamper Check',
    group: 'Integrity',
    stage: 'framing-and-protocol-context',
    order: 155,
    recommendedAfter: ['visible-byte-order'],
    summary: 'A readable sender message and a readable received message each derive a keyed tag, then Equals checks whether the transmitted and recomputed tags still match.',
    pipeline: 'AsciiSource + HexSource -> XOR -> BitSplit -> ToyCompressionHashComposite -> Equals -> BitOutput',
    project: {
      modules: [
        { id: 'sender-message', defId: 'AsciiSource', params: { value: 'HI' } },
        { id: 'sender-read', defId: 'BitsToAscii', params: {} },
        { id: 'sender-text', defId: 'TextOutput', params: {} },
        { id: 'received-message', defId: 'AsciiSource', params: { value: 'HI' } },
        { id: 'receiver-read', defId: 'BitsToAscii', params: {} },
        { id: 'receiver-text', defId: 'TextOutput', params: {} },
        { id: 'sender-key', defId: 'HexSource', params: { value: '0F0F' } },
        { id: 'receiver-key', defId: 'HexSource', params: { value: '0F0F' } },
        { id: 'sender-mix', defId: 'XOR', params: {} },
        { id: 'sender-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'sender-tag', defId: 'ToyCompressionHashComposite', params: {} },
        { id: 'sender-tag-hex', defId: 'BitsToHex', params: {} },
        { id: 'sender-tag-out', defId: 'HexOutput', params: {} },
        { id: 'receiver-mix', defId: 'XOR', params: {} },
        { id: 'receiver-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'receiver-tag', defId: 'ToyCompressionHashComposite', params: {} },
        { id: 'receiver-tag-hex', defId: 'BitsToHex', params: {} },
        { id: 'receiver-tag-out', defId: 'HexOutput', params: {} },
        { id: 'tags-match', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sender-message', port: 'out' }, to: { moduleId: 'sender-read', port: 'in' } },
        { from: { moduleId: 'sender-read', port: 'out' }, to: { moduleId: 'sender-text', port: 'in' } },
        { from: { moduleId: 'sender-message', port: 'out' }, to: { moduleId: 'sender-mix', port: 'a' } },
        { from: { moduleId: 'sender-key', port: 'out' }, to: { moduleId: 'sender-mix', port: 'b' } },
        { from: { moduleId: 'sender-mix', port: 'out' }, to: { moduleId: 'sender-split', port: 'in' } },
        { from: { moduleId: 'sender-split', port: 'left' }, to: { moduleId: 'sender-tag', port: 'left' } },
        { from: { moduleId: 'sender-split', port: 'right' }, to: { moduleId: 'sender-tag', port: 'right' } },
        { from: { moduleId: 'sender-tag', port: 'out' }, to: { moduleId: 'sender-tag-hex', port: 'in' } },
        { from: { moduleId: 'sender-tag-hex', port: 'out' }, to: { moduleId: 'sender-tag-out', port: 'in' } },
        { from: { moduleId: 'received-message', port: 'out' }, to: { moduleId: 'receiver-read', port: 'in' } },
        { from: { moduleId: 'receiver-read', port: 'out' }, to: { moduleId: 'receiver-text', port: 'in' } },
        { from: { moduleId: 'received-message', port: 'out' }, to: { moduleId: 'receiver-mix', port: 'a' } },
        { from: { moduleId: 'receiver-key', port: 'out' }, to: { moduleId: 'receiver-mix', port: 'b' } },
        { from: { moduleId: 'receiver-mix', port: 'out' }, to: { moduleId: 'receiver-split', port: 'in' } },
        { from: { moduleId: 'receiver-split', port: 'left' }, to: { moduleId: 'receiver-tag', port: 'left' } },
        { from: { moduleId: 'receiver-split', port: 'right' }, to: { moduleId: 'receiver-tag', port: 'right' } },
        { from: { moduleId: 'receiver-tag', port: 'out' }, to: { moduleId: 'receiver-tag-hex', port: 'in' } },
        { from: { moduleId: 'receiver-tag-hex', port: 'out' }, to: { moduleId: 'receiver-tag-out', port: 'in' } },
        { from: { moduleId: 'sender-tag', port: 'out' }, to: { moduleId: 'tags-match', port: 'a' } },
        { from: { moduleId: 'receiver-tag', port: 'out' }, to: { moduleId: 'tags-match', port: 'b' } },
        { from: { moduleId: 'tags-match', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
      ],
    },
    layout: {
      'sender-message': { x: 40, y: 60 },
      'sender-read': { x: 260, y: 24 },
      'sender-text': { x: 460, y: 24 },
      'sender-key': { x: 40, y: 180 },
      'sender-mix': { x: 260, y: 164 },
      'sender-split': { x: 520, y: 164 },
      'sender-tag': { x: 760, y: 164 },
      'sender-tag-hex': { x: 1040, y: 112 },
      'sender-tag-out': { x: 1260, y: 112 },
      'received-message': { x: 40, y: 396 },
      'receiver-read': { x: 260, y: 360 },
      'receiver-text': { x: 460, y: 360 },
      'receiver-key': { x: 40, y: 516 },
      'receiver-mix': { x: 260, y: 500 },
      'receiver-split': { x: 520, y: 500 },
      'receiver-tag': { x: 760, y: 500 },
      'receiver-tag-hex': { x: 1040, y: 448 },
      'receiver-tag-out': { x: 1260, y: 448 },
      'tags-match': { x: 1040, y: 268 },
      'verify-out': { x: 1260, y: 268 },
    },
  },
  {
    id: 'visible-authenticated-encryption',
    name: 'Visible Authenticated Encryption',
    group: 'Integrity',
    stage: 'framing-and-protocol-context',
    order: 165,
    recommendedAfter: ['visible-tamper-check'],
    summary: 'A readable plaintext is encrypted into ciphertext, then that ciphertext is authenticated with a separate tag path so the receiver can verify before trusting the recovered text.',
    pipeline:
      'AsciiSource -> BitSplit + XOR(key) + SBox -> ciphertext -> XOR(auth key) -> ToyCompressionHashComposite -> Equals + decrypt',
    project: {
      modules: [
        { id: 'sender-message', defId: 'AsciiSource', params: { value: 'HI' } },
        { id: 'sender-read', defId: 'BitsToAscii', params: {} },
        { id: 'sender-text', defId: 'TextOutput', params: {} },
        { id: 'sender-enc-key', defId: 'HexSource', params: { value: '0F1E' } },
        { id: 'sender-key-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'plain-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'enc-left-xor', defId: 'XOR', params: {} },
        { id: 'enc-right-xor', defId: 'XOR', params: {} },
        {
          id: 'enc-left-box',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        {
          id: 'enc-right-box',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'cipher-join', defId: 'BitJoin', params: {} },
        { id: 'cipher-hex', defId: 'BitsToHex', params: {} },
        { id: 'cipher-out', defId: 'HexOutput', params: {} },
        { id: 'sender-auth-key', defId: 'HexSource', params: { value: '55AA' } },
        { id: 'tag-mix', defId: 'XOR', params: {} },
        { id: 'tag-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'tag-hash', defId: 'ToyCompressionHashComposite', params: {} },
        { id: 'tag-hex', defId: 'BitsToHex', params: {} },
        { id: 'tag-out', defId: 'HexOutput', params: {} },
        { id: 'receiver-auth-key', defId: 'HexSource', params: { value: '55AA' } },
        { id: 'verify-mix', defId: 'XOR', params: {} },
        { id: 'verify-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'verify-hash', defId: 'ToyCompressionHashComposite', params: {} },
        { id: 'verify-hex', defId: 'BitsToHex', params: {} },
        { id: 'verify-tag-out', defId: 'HexOutput', params: {} },
        { id: 'tags-match', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
        { id: 'receiver-enc-key', defId: 'HexSource', params: { value: '0F1E' } },
        { id: 'receiver-key-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'cipher-split', defId: 'BitSplit', params: { leftWidth: 8 } },
        {
          id: 'dec-left-box',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        {
          id: 'dec-right-box',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'dec-left-xor', defId: 'XOR', params: {} },
        { id: 'dec-right-xor', defId: 'XOR', params: {} },
        { id: 'plain-join', defId: 'BitJoin', params: {} },
        { id: 'recover-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'recovered-text', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sender-message', port: 'out' }, to: { moduleId: 'sender-read', port: 'in' } },
        { from: { moduleId: 'sender-read', port: 'out' }, to: { moduleId: 'sender-text', port: 'in' } },
        { from: { moduleId: 'sender-message', port: 'out' }, to: { moduleId: 'plain-split', port: 'in' } },
        { from: { moduleId: 'sender-enc-key', port: 'out' }, to: { moduleId: 'sender-key-split', port: 'in' } },
        { from: { moduleId: 'plain-split', port: 'left' }, to: { moduleId: 'enc-left-xor', port: 'a' } },
        { from: { moduleId: 'sender-key-split', port: 'left' }, to: { moduleId: 'enc-left-xor', port: 'b' } },
        { from: { moduleId: 'enc-left-xor', port: 'out' }, to: { moduleId: 'enc-left-box', port: 'in' } },
        { from: { moduleId: 'plain-split', port: 'right' }, to: { moduleId: 'enc-right-xor', port: 'a' } },
        { from: { moduleId: 'sender-key-split', port: 'right' }, to: { moduleId: 'enc-right-xor', port: 'b' } },
        { from: { moduleId: 'enc-right-xor', port: 'out' }, to: { moduleId: 'enc-right-box', port: 'in' } },
        { from: { moduleId: 'enc-left-box', port: 'out' }, to: { moduleId: 'cipher-join', port: 'a' } },
        { from: { moduleId: 'enc-right-box', port: 'out' }, to: { moduleId: 'cipher-join', port: 'b' } },
        { from: { moduleId: 'cipher-join', port: 'out' }, to: { moduleId: 'cipher-hex', port: 'in' } },
        { from: { moduleId: 'cipher-hex', port: 'out' }, to: { moduleId: 'cipher-out', port: 'in' } },
        { from: { moduleId: 'cipher-join', port: 'out' }, to: { moduleId: 'tag-mix', port: 'a' } },
        { from: { moduleId: 'sender-auth-key', port: 'out' }, to: { moduleId: 'tag-mix', port: 'b' } },
        { from: { moduleId: 'tag-mix', port: 'out' }, to: { moduleId: 'tag-split', port: 'in' } },
        { from: { moduleId: 'tag-split', port: 'left' }, to: { moduleId: 'tag-hash', port: 'left' } },
        { from: { moduleId: 'tag-split', port: 'right' }, to: { moduleId: 'tag-hash', port: 'right' } },
        { from: { moduleId: 'tag-hash', port: 'out' }, to: { moduleId: 'tag-hex', port: 'in' } },
        { from: { moduleId: 'tag-hex', port: 'out' }, to: { moduleId: 'tag-out', port: 'in' } },
        { from: { moduleId: 'cipher-join', port: 'out' }, to: { moduleId: 'verify-mix', port: 'a' } },
        { from: { moduleId: 'receiver-auth-key', port: 'out' }, to: { moduleId: 'verify-mix', port: 'b' } },
        { from: { moduleId: 'verify-mix', port: 'out' }, to: { moduleId: 'verify-split', port: 'in' } },
        { from: { moduleId: 'verify-split', port: 'left' }, to: { moduleId: 'verify-hash', port: 'left' } },
        { from: { moduleId: 'verify-split', port: 'right' }, to: { moduleId: 'verify-hash', port: 'right' } },
        { from: { moduleId: 'verify-hash', port: 'out' }, to: { moduleId: 'verify-hex', port: 'in' } },
        { from: { moduleId: 'verify-hex', port: 'out' }, to: { moduleId: 'verify-tag-out', port: 'in' } },
        { from: { moduleId: 'tag-hash', port: 'out' }, to: { moduleId: 'tags-match', port: 'a' } },
        { from: { moduleId: 'verify-hash', port: 'out' }, to: { moduleId: 'tags-match', port: 'b' } },
        { from: { moduleId: 'tags-match', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
        { from: { moduleId: 'receiver-enc-key', port: 'out' }, to: { moduleId: 'receiver-key-split', port: 'in' } },
        { from: { moduleId: 'cipher-join', port: 'out' }, to: { moduleId: 'cipher-split', port: 'in' } },
        { from: { moduleId: 'cipher-split', port: 'left' }, to: { moduleId: 'dec-left-box', port: 'in' } },
        { from: { moduleId: 'cipher-split', port: 'right' }, to: { moduleId: 'dec-right-box', port: 'in' } },
        { from: { moduleId: 'dec-left-box', port: 'out' }, to: { moduleId: 'dec-left-xor', port: 'a' } },
        { from: { moduleId: 'receiver-key-split', port: 'left' }, to: { moduleId: 'dec-left-xor', port: 'b' } },
        { from: { moduleId: 'dec-right-box', port: 'out' }, to: { moduleId: 'dec-right-xor', port: 'a' } },
        { from: { moduleId: 'receiver-key-split', port: 'right' }, to: { moduleId: 'dec-right-xor', port: 'b' } },
        { from: { moduleId: 'dec-left-xor', port: 'out' }, to: { moduleId: 'plain-join', port: 'a' } },
        { from: { moduleId: 'dec-right-xor', port: 'out' }, to: { moduleId: 'plain-join', port: 'b' } },
        { from: { moduleId: 'plain-join', port: 'out' }, to: { moduleId: 'recover-ascii', port: 'in' } },
        { from: { moduleId: 'recover-ascii', port: 'out' }, to: { moduleId: 'recovered-text', port: 'in' } },
      ],
    },
    layout: {
      'sender-message': { x: 40, y: 60 },
      'sender-read': { x: 260, y: 24 },
      'sender-text': { x: 460, y: 24 },
      'sender-enc-key': { x: 40, y: 188 },
      'sender-key-split': { x: 260, y: 188 },
      'plain-split': { x: 260, y: 332 },
      'enc-left-xor': { x: 520, y: 132 },
      'enc-right-xor': { x: 520, y: 300 },
      'enc-left-box': { x: 760, y: 132 },
      'enc-right-box': { x: 760, y: 300 },
      'cipher-join': { x: 1000, y: 220 },
      'cipher-hex': { x: 1240, y: 120 },
      'cipher-out': { x: 1460, y: 120 },
      'sender-auth-key': { x: 1000, y: 404 },
      'tag-mix': { x: 1240, y: 312 },
      'tag-split': { x: 1480, y: 312 },
      'tag-hash': { x: 1720, y: 312 },
      'tag-hex': { x: 1960, y: 248 },
      'tag-out': { x: 2180, y: 248 },
      'receiver-auth-key': { x: 1000, y: 620 },
      'verify-mix': { x: 1240, y: 528 },
      'verify-split': { x: 1480, y: 528 },
      'verify-hash': { x: 1720, y: 528 },
      'verify-hex': { x: 1960, y: 464 },
      'verify-tag-out': { x: 2180, y: 464 },
      'tags-match': { x: 1960, y: 616 },
      'verify-out': { x: 2180, y: 616 },
      'receiver-enc-key': { x: 1000, y: 792 },
      'receiver-key-split': { x: 1240, y: 792 },
      'cipher-split': { x: 1240, y: 936 },
      'dec-left-box': { x: 1480, y: 820 },
      'dec-right-box': { x: 1480, y: 988 },
      'dec-left-xor': { x: 1720, y: 820 },
      'dec-right-xor': { x: 1720, y: 988 },
      'plain-join': { x: 1960, y: 904 },
      'recover-ascii': { x: 2180, y: 904 },
      'recovered-text': { x: 2400, y: 904 },
    },
  },
  {
    id: 'multiply-compare-unpad',
    name: 'Multiply Compare Unpad',
    group: 'Arithmetic Expansion',
    summary: 'Modular multiplication feeds a threshold comparison while a parallel branch demonstrates pad-then-unpad round-tripping.',
    pipeline: 'HexSource * HexSource -> MulMod -> GreaterThan + BitPad -> BitUnpad',
    project: {
      modules: [
        { id: 'a', defId: 'HexSource', params: { value: '03' } },
        { id: 'b', defId: 'HexSource', params: { value: '05' } },
        { id: 'mul', defId: 'MulMod', params: {} },
        { id: 'threshold', defId: 'HexSource', params: { value: '0A' } },
        { id: 'gt', defId: 'GreaterThan', params: {} },
        { id: 'gt-out', defId: 'BitOutput', params: {} },
        { id: 'pad', defId: 'BitPad', params: { targetWidth: 16 } },
        { id: 'unpad', defId: 'BitUnpad', params: { originalWidth: 8 } },
        { id: 'unpad-out', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'a', port: 'out' }, to: { moduleId: 'mul', port: 'a' } },
        { from: { moduleId: 'b', port: 'out' }, to: { moduleId: 'mul', port: 'b' } },
        { from: { moduleId: 'mul', port: 'out' }, to: { moduleId: 'gt', port: 'a' } },
        { from: { moduleId: 'threshold', port: 'out' }, to: { moduleId: 'gt', port: 'b' } },
        { from: { moduleId: 'gt', port: 'out' }, to: { moduleId: 'gt-out', port: 'in' } },
        { from: { moduleId: 'mul', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'unpad', port: 'in' } },
        { from: { moduleId: 'unpad', port: 'out' }, to: { moduleId: 'unpad-out', port: 'in' } },
        { from: { moduleId: 'unpad-out', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      a: { x: 72, y: 88 },
      b: { x: 72, y: 232 },
      mul: { x: 340, y: 156 },
      threshold: { x: 340, y: 316 },
      gt: { x: 600, y: 232 },
      'gt-out': { x: 860, y: 232 },
      pad: { x: 600, y: 88 },
      unpad: { x: 760, y: 88 },
      'unpad-out': { x: 920, y: 88 },
      output: { x: 1080, y: 88 },
    },
  },
  {
    id: 'visible-message-window',
    name: 'Visible Message Window',
    group: 'Symbol Structure',
    summary: 'One visible message feeds two contiguous symbol windows so downstream branches can read different submessages without hidden chunking.',
    pipeline: 'TextInput -> SymbolWindow / SymbolWindow -> TextOutput comparison',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'MATH' } },
        { id: 'window-1', defId: 'SymbolWindow', params: { start: 0, width: 2 } },
        { id: 'window-2', defId: 'SymbolWindow', params: { start: 2, width: 2 } },
        { id: 'out-1', defId: 'TextOutput', params: {} },
        { id: 'out-2', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'window-1', port: 'in' } },
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'window-2', port: 'in' } },
        { from: { moduleId: 'window-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
        { from: { moduleId: 'window-2', port: 'out' }, to: { moduleId: 'out-2', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 72, y: 172 },
      'window-1': { x: 372, y: 88 },
      'window-2': { x: 372, y: 256 },
      'out-1': { x: 680, y: 88 },
      'out-2': { x: 680, y: 256 },
    },
  },
  {
    id: 'visible-symbol-scramble',
    name: 'Visible Symbol Scramble',
    group: 'Symbol Permutation',
    summary: 'A direct symbol-order transform that rearranges positions while leaving the symbols themselves unchanged.',
    pipeline: 'TextInput -> SymbolPermutation -> TextOutput',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'MATH' } },
        { id: 'permute', defId: 'SymbolPermutation', params: { order: '2,0,3,1' } },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 80, y: 156 },
      permute: { x: 392, y: 156 },
      output: { x: 704, y: 156 },
    },
  },
  {
    id: 'baudot-bridge',
    name: 'Baudot Telegraph',
    group: 'Historical Bridges',
    summary: 'A teleprinter-era 5-bit bridge that begins in Baudot, stays explicit in bits, and returns to readable text.',
    pipeline: 'BaudotSource -> BitsToBaudot -> BaudotOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BaudotSource', params: { value: 'TEST' } },
        { id: 'decode', defId: 'BitsToBaudot', params: {} },
        { id: 'output', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 80, y: 156 },
      decode: { x: 392, y: 156 },
      output: { x: 704, y: 156 },
    },
  },
  {
    id: 'pollux-fractionation',
    name: 'Pollux Fractionation',
    group: 'Historical Bridges',
    summary: 'A visible Pollux-style bridge that fractionates bits into disjoint symbol sets so disguise stays separate from diffusion.',
    pipeline: 'BitSource -> PolluxFractionation -> TextOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 1, 0, 0, 1] } },
        {
          id: 'pollux',
          defId: 'PolluxFractionation',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'pollux', port: 'in' } },
        { from: { moduleId: 'pollux', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 64, y: 176 },
      pollux: { x: 364, y: 176 },
      output: { x: 664, y: 176 },
    },
  },
  {
    id: 'pollux-round-trip',
    name: 'Pollux Round Trip',
    group: 'Historical Bridges',
    summary:
      'A sender/receiver Pollux lab that fractionates one visible bit stream into symbols, recovers it by shared alphabet agreement, and proves the round-trip with an explicit equality check.',
    pipeline: 'BitSource -> PolluxFractionation -> PolluxInverse -> Equals + TextOutput + BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [0, 1, 1, 0, 1, 0, 0, 1] } },
        {
          id: 'encode',
          defId: 'PolluxFractionation',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'ciphertext', defId: 'TextOutput', params: {} },
        {
          id: 'decode',
          defId: 'PolluxInverse',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'matches', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
        { id: 'recovered', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'ciphertext', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'matches', port: 'a' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'matches', port: 'b' } },
        { from: { moduleId: 'matches', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'recovered', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 56, y: 180 },
      encode: { x: 324, y: 180 },
      ciphertext: { x: 608, y: 72 },
      decode: { x: 608, y: 272 },
      matches: { x: 888, y: 180 },
      'verify-out': { x: 1148, y: 120 },
      recovered: { x: 1148, y: 260 },
    },
  },
  {
    id: 'pollux-controlled-selection',
    name: 'Pollux Controlled Selection',
    group: 'Historical Bridges',
    summary:
      'A clocked selector-driven Pollux lab where the message bit chooses the zero/one alphabet and a live counter chooses which symbol inside that alphabet is emitted on each tick.',
    pipeline:
      'Clock -> Counter(select) + BitSource(message) -> PolluxControlledFractionation -> PolluxInverse -> Equals + TextOutput + BitOutput',
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'message', defId: 'BitSource', params: { stream: [0, 1, 1, 0, 1, 0, 0, 1] } },
        { id: 'selector', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        {
          id: 'encode',
          defId: 'PolluxControlledFractionation',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'ciphertext', defId: 'TextOutput', params: {} },
        {
          id: 'decode',
          defId: 'PolluxInverse',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'matches', defId: 'Equals', params: {} },
        { id: 'verify-out', defId: 'BitOutput', params: {} },
        { id: 'recovered', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'selector', port: 'clock' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'selector', port: 'out' }, to: { moduleId: 'encode', port: 'select' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'ciphertext', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'matches', port: 'a' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'matches', port: 'b' } },
        { from: { moduleId: 'matches', port: 'out' }, to: { moduleId: 'verify-out', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'recovered', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 44, y: 300 },
      message: { x: 56, y: 120 },
      selector: { x: 340, y: 300 },
      encode: { x: 620, y: 202 },
      ciphertext: { x: 932, y: 84 },
      decode: { x: 932, y: 320 },
      matches: { x: 1220, y: 202 },
      'verify-out': { x: 1480, y: 144 },
      recovered: { x: 1480, y: 280 },
    },
    defaultTickedMode: true,
  },
  {
    id: 'lorenz-foundation',
    name: 'Lorenz SZ42 Foundation',
    group: 'Historical Bridges',
    summary: 'A clocked teleprinter-style keystream machine that unmasks one Baudot codeword per tick before decoding it back into text.',
    pipeline: 'Clock -> BaudotSource -> XOR <- LFSR -> BitsToBaudot -> BaudotOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'source', defId: 'BaudotSource', params: { value: 'WCNCE' } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 1, 1, 0, 0], taps: '1,3', outputLength: 5 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToBaudot', params: {} },
        { id: 'output', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 68 },
      source: { x: 40, y: 236 },
      lfsr: { x: 280, y: 68 },
      xor: { x: 520, y: 152 },
      decode: { x: 760, y: 152 },
      output: { x: 1000, y: 152 },
    },
  },
  {
    id: 'gated-lorenz',
    name: 'Gated Lorenz Wheels',
    group: 'Historical Bridges',
    summary: 'One clocked wheel stream gates a second 5-bit keystream register before each Baudot codeword is unmixed and decoded.',
    pipeline: 'Clock -> Gate LFSR -> Data LFSR -> XOR(BaudotSource) -> BitsToBaudot -> BaudotOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'source', defId: 'BaudotSource', params: { value: 'WCNCE' } },
        {
          id: 'gate',
          defId: 'LFSR',
          params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 1 },
        },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 5 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToBaudot', params: {} },
        { id: 'output', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'gate', port: 'clock' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 36, y: 56 },
      source: { x: 36, y: 248 },
      gate: { x: 260, y: 56 },
      data: { x: 500, y: 56 },
      xor: { x: 736, y: 152 },
      decode: { x: 972, y: 152 },
      output: { x: 1208, y: 152 },
    },
  },
  {
    id: 'paired-lorenz',
    name: 'Paired Lorenz Wheels',
    group: 'Historical Bridges',
    summary: 'Two 5-bit wheel streams combine into one teleprinter keystream before each Baudot codeword is unmixed and decoded.',
    pipeline: 'Clock -> Wheel A LFSR + Wheel B LFSR -> XOR -> XOR(BaudotSource) -> BitsToBaudot -> BaudotOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'source', defId: 'BaudotSource', params: { value: 'WCNCE' } },
        {
          id: 'wheel-a',
          defId: 'LFSR',
          params: { seed: [1, 1, 1, 0, 0], taps: '1,3', outputLength: 5 },
        },
        {
          id: 'wheel-b',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 5 },
        },
        { id: 'mix', defId: 'XOR', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToBaudot', params: {} },
        { id: 'output', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'wheel-a', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'wheel-b', port: 'clock' } },
        { from: { moduleId: 'wheel-a', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
        { from: { moduleId: 'wheel-b', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'mix', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 28, y: 56 },
      source: { x: 28, y: 248 },
      'wheel-a': { x: 252, y: 56 },
      'wheel-b': { x: 252, y: 248 },
      mix: { x: 500, y: 152 },
      xor: { x: 748, y: 152 },
      decode: { x: 996, y: 152 },
      output: { x: 1244, y: 152 },
    },
  },
  {
    id: 'banked-lorenz',
    name: 'Banked Lorenz Control',
    group: 'Historical Bridges',
    summary: 'Two control wheels combine into one explicit gate signal that decides when the 5-bit data wheel is allowed to advance.',
    pipeline: 'Clock -> Control Wheels -> XOR Gate -> Data LFSR -> XOR(BaudotSource) -> BitsToBaudot -> BaudotOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'source', defId: 'BaudotSource', params: { value: 'WCNCE' } },
        {
          id: 'control-a',
          defId: 'LFSR',
          params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 1 },
        },
        {
          id: 'control-b',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 0, 1], taps: '1,3', outputLength: 1 },
        },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 5 },
        },
        { id: 'gate-mix', defId: 'XOR', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToBaudot', params: {} },
        { id: 'output', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-a', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-b', port: 'clock' } },
        { from: { moduleId: 'control-a', port: 'out' }, to: { moduleId: 'gate-mix', port: 'a' } },
        { from: { moduleId: 'control-b', port: 'out' }, to: { moduleId: 'gate-mix', port: 'b' } },
        { from: { moduleId: 'gate-mix', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 28, y: 56 },
      source: { x: 28, y: 248 },
      'control-a': { x: 252, y: 40 },
      'control-b': { x: 252, y: 168 },
      'gate-mix': { x: 500, y: 104 },
      data: { x: 748, y: 40 },
      xor: { x: 996, y: 152 },
      decode: { x: 1244, y: 152 },
      output: { x: 1492, y: 152 },
    },
  },
  {
    id: 'bridge',
    name: 'Bridge Pipeline',
    group: 'Foundations',
    summary: 'A minimal symbol-to-bits-to-symbol run that proves the engine/UI bridge.',
    pipeline: 'TextInput -> SymbolToBits -> XOR -> BitsToSymbol -> TextOutput',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'M' } },
        { id: 'key', defId: 'BitSource', params: { stream: [0, 0, 0, 1, 1] } },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 28, y: 72 },
      key: { x: 28, y: 262 },
      encode: { x: 240, y: 72 },
      xor: { x: 452, y: 162 },
      decode: { x: 664, y: 72 },
      output: { x: 876, y: 72 },
    },
  },
  {
    id: 'modern',
    name: 'Modern Toy Round',
    group: 'Foundations',
    summary: 'A small bit-domain toy round using permutation and shifting before XOR.',
    pipeline: 'TextInput -> SymbolToBits -> Permutation -> BitShifter -> XOR -> BitsToSymbol -> TextOutput',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'C' } },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'permute', defId: 'Permutation', params: { order: '2,0,4,1,3' } },
        { id: 'shift', defId: 'BitShifter', params: { amount: 1, mode: 'rotate-left' } },
        { id: 'key', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1] } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'shift', port: 'in' } },
        { from: { moduleId: 'shift', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 24, y: 136 },
      encode: { x: 184, y: 136 },
      permute: { x: 344, y: 136 },
      shift: { x: 504, y: 136 },
      key: { x: 504, y: 304 },
      xor: { x: 664, y: 220 },
      decode: { x: 824, y: 136 },
      output: { x: 984, y: 136 },
    },
  },
  {
    id: 'beyond-xor',
    name: 'Beyond XOR',
    group: 'Foundations',
    summary: 'A visible word-mixing machine that uses modular addition, rotation, masking, and XOR instead of relying on XOR alone.',
    pipeline: 'HexSource + HexSource -> ADD mod 2^n -> BitShifter -> AND(mask) -> XOR(key) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'left', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'right', defId: 'HexSource', params: { value: '19' } },
        { id: 'add', defId: 'AddMod', params: {} },
        { id: 'rotate', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } },
        { id: 'mask', defId: 'BitSource', params: { stream: [1, 1, 1, 1, 0, 0, 0, 0] } },
        { id: 'and', defId: 'AND', params: {} },
        { id: 'key', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 1, 0, 1, 0] } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'add', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'add', port: 'b' } },
        { from: { moduleId: 'add', port: 'out' }, to: { moduleId: 'rotate', port: 'in' } },
        { from: { moduleId: 'rotate', port: 'out' }, to: { moduleId: 'and', port: 'a' } },
        { from: { moduleId: 'mask', port: 'out' }, to: { moduleId: 'and', port: 'b' } },
        { from: { moduleId: 'and', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      left: { x: 24, y: 92 },
      right: { x: 24, y: 248 },
      add: { x: 220, y: 168 },
      rotate: { x: 416, y: 168 },
      mask: { x: 416, y: 324 },
      and: { x: 612, y: 168 },
      key: { x: 612, y: 324 },
      xor: { x: 808, y: 168 },
      encode: { x: 1004, y: 168 },
      output: { x: 1200, y: 168 },
    },
  },
  {
    id: 'avalanche-lab',
    name: 'Avalanche Lab',
    group: 'Cryptanalysis Labs',
    stage: 'modern-bit-machines',
    order: 126,
    summary: 'Compare one uneven low-diffusion branch against one stronger branch inside the same project, then use batch avalanche sweep to see why one good flip is not enough.',
    pipeline: 'HexSource -> weak AddMod branch + stronger AddMod/rotate/permutation/XOR branch -> BitOutput sinks for comparison in Modern analysis',
    project: {
      modules: [
        { id: 'plain', defId: 'HexSource', params: { value: '3C' } },
        { id: 'weak-const', defId: 'IV', params: { value: '11', width: 8 } },
        { id: 'weak-add', defId: 'AddMod', params: {} },
        { id: 'weak-out', defId: 'BitOutput', params: {} },
        { id: 'strong-const', defId: 'IV', params: { value: '11', width: 8 } },
        { id: 'strong-add', defId: 'AddMod', params: {} },
        { id: 'strong-rotate', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } },
        { id: 'strong-permute', defId: 'Permutation', params: { order: '2,5,0,7,1,4,6,3' } },
        { id: 'strong-key', defId: 'IV', params: { value: 'B4', width: 8 } },
        { id: 'strong-xor', defId: 'XOR', params: {} },
        { id: 'strong-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'weak-add', port: 'a' } },
        { from: { moduleId: 'weak-const', port: 'out' }, to: { moduleId: 'weak-add', port: 'b' } },
        { from: { moduleId: 'weak-add', port: 'out' }, to: { moduleId: 'weak-out', port: 'in' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'strong-add', port: 'a' } },
        { from: { moduleId: 'strong-const', port: 'out' }, to: { moduleId: 'strong-add', port: 'b' } },
        { from: { moduleId: 'strong-add', port: 'out' }, to: { moduleId: 'strong-rotate', port: 'in' } },
        { from: { moduleId: 'strong-rotate', port: 'out' }, to: { moduleId: 'strong-permute', port: 'in' } },
        { from: { moduleId: 'strong-permute', port: 'out' }, to: { moduleId: 'strong-xor', port: 'a' } },
        { from: { moduleId: 'strong-key', port: 'out' }, to: { moduleId: 'strong-xor', port: 'b' } },
        { from: { moduleId: 'strong-xor', port: 'out' }, to: { moduleId: 'strong-out', port: 'in' } },
      ],
    },
    layout: {
      plain: { x: 56, y: 184 },
      'weak-const': { x: 56, y: 360 },
      'weak-add': { x: 292, y: 272 },
      'weak-out': { x: 528, y: 272 },
      'strong-const': { x: 56, y: 544 },
      'strong-add': { x: 292, y: 520 },
      'strong-rotate': { x: 528, y: 520 },
      'strong-permute': { x: 764, y: 520 },
      'strong-key': { x: 764, y: 696 },
      'strong-xor': { x: 1000, y: 608 },
      'strong-out': { x: 1236, y: 608 },
    },
  },
  {
    id: 'bypass-workshop',
    name: 'Bypass Workshop',
    group: 'Modern Rounds',
    summary: 'A visible shift stage can be turned off without deleting it from the chain, making it easy to compare one machine with and without that transform.',
    pipeline: 'HexSource -> BitShifter -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'shift', defId: 'BitShifter', params: { amount: 2, mode: 'rotate-left' } },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'shift', port: 'in' } },
        { from: { moduleId: 'shift', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 72, y: 156 },
      shift: { x: 360, y: 156 },
      encode: { x: 648, y: 156 },
      output: { x: 936, y: 156 },
    },
  },
  {
    id: 'split-transform-rejoin',
    name: 'Split Transform Rejoin',
    group: 'Block Framing',
    summary: 'A 16-bit hex input is split into two 8-bit halves, each is transformed independently, and the halves are rejoined into one visible output.',
    pipeline: 'HexSource -> BitSplit -> XOR(left key) + XOR(right key) -> BitJoin -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3F1' } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'left-key', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 0, 1, 0] } },
        { id: 'right-key', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 0, 1, 0, 1] } },
        { id: 'left-xor', defId: 'XOR', params: {} },
        { id: 'right-xor', defId: 'XOR', params: {} },
        { id: 'join', defId: 'BitJoin', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
        { from: { moduleId: 'split', port: 'left' }, to: { moduleId: 'left-xor', port: 'a' } },
        { from: { moduleId: 'left-key', port: 'out' }, to: { moduleId: 'left-xor', port: 'b' } },
        { from: { moduleId: 'split', port: 'right' }, to: { moduleId: 'right-xor', port: 'a' } },
        { from: { moduleId: 'right-key', port: 'out' }, to: { moduleId: 'right-xor', port: 'b' } },
        { from: { moduleId: 'left-xor', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
        { from: { moduleId: 'right-xor', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        { from: { moduleId: 'join', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 24, y: 168 },
      split: { x: 220, y: 168 },
      'left-key': { x: 416, y: 56 },
      'right-key': { x: 416, y: 280 },
      'left-xor': { x: 612, y: 92 },
      'right-xor': { x: 612, y: 244 },
      join: { x: 808, y: 168 },
      encode: { x: 1004, y: 168 },
      output: { x: 1200, y: 168 },
    },
  },
  {
    id: 'pad-and-split',
    name: 'Pad and Split',
    group: 'Block Framing',
    summary: 'A short 8-bit input is padded to 16 bits, then split into two halves for independent processing — showing how padding prepares undersized messages for fixed-width block pipelines.',
    pipeline: 'HexSource -> BitPad(16) -> BitSplit(8) -> XOR(left key) + XOR(right key) -> BitJoin -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'C7' } },
        { id: 'pad', defId: 'BitPad', params: { targetWidth: 16, side: 'right', padBit: '0' } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'left-key', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 0, 1, 0] } },
        { id: 'right-key', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 0, 1, 0, 1] } },
        { id: 'left-xor', defId: 'XOR', params: {} },
        { id: 'right-xor', defId: 'XOR', params: {} },
        { id: 'join', defId: 'BitJoin', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
        { from: { moduleId: 'split', port: 'left' }, to: { moduleId: 'left-xor', port: 'a' } },
        { from: { moduleId: 'left-key', port: 'out' }, to: { moduleId: 'left-xor', port: 'b' } },
        { from: { moduleId: 'split', port: 'right' }, to: { moduleId: 'right-xor', port: 'a' } },
        { from: { moduleId: 'right-key', port: 'out' }, to: { moduleId: 'right-xor', port: 'b' } },
        { from: { moduleId: 'left-xor', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
        { from: { moduleId: 'right-xor', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        { from: { moduleId: 'join', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 24, y: 168 },
      pad: { x: 180, y: 168 },
      split: { x: 336, y: 168 },
      'left-key': { x: 532, y: 56 },
      'right-key': { x: 532, y: 280 },
      'left-xor': { x: 728, y: 92 },
      'right-xor': { x: 728, y: 244 },
      join: { x: 924, y: 168 },
      encode: { x: 1120, y: 168 },
      output: { x: 1316, y: 168 },
    },
  },
  {
    id: 'counter-pulse-gate',
    name: 'Counter Pulse Gate',
    group: 'Control Foundations',
    summary: 'A visible counter is compared against a fixed threshold word, and that comparison decides when a downstream keystream register is allowed to advance.',
    pipeline: 'Clock -> Counter -> AtLeast(threshold) -> Gate(clock pulse) -> LFSR -> BitsToSymbol -> TextOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'counter', defId: 'Counter', params: { width: 5, value: 0, step: 1 } },
        { id: 'threshold', defId: 'KeyInput', params: { value: 'D' } },
        { id: 'threshold-bits', defId: 'SymbolToBits', params: {} },
        { id: 'atleast', defId: 'AtLeast', params: {} },
        { id: 'gate', defId: 'Gate', params: {} },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 },
        },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'threshold', port: 'out' }, to: { moduleId: 'threshold-bits', port: 'in' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'atleast', port: 'a' } },
        { from: { moduleId: 'threshold-bits', port: 'out' }, to: { moduleId: 'atleast', port: 'b' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'gate', port: 'in' } },
        { from: { moduleId: 'atleast', port: 'out' }, to: { moduleId: 'gate', port: 'control' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 36, y: 60 },
      counter: { x: 252, y: 60 },
      threshold: { x: 252, y: 244 },
      'threshold-bits': { x: 476, y: 244 },
      atleast: { x: 700, y: 152 },
      gate: { x: 924, y: 152 },
      data: { x: 1148, y: 60 },
      decode: { x: 1372, y: 60 },
      output: { x: 1596, y: 60 },
    },
  },
  {
    id: 'packaged-iterated-rounds',
    name: 'Packaged Iterated Rounds',
    group: 'Modern Rounds',
    summary: 'A two-round byte machine packaged as one reusable composite so repeated round structure stays explicit but compact.',
    pipeline: 'HexSource -> IteratedByteRoundsComposite -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'rounds', defId: 'ByteRoundIterator', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'rounds', port: 'in' } },
        { from: { moduleId: 'rounds', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      rounds: { x: 372, y: 156 },
      encode: { x: 696, y: 156 },
      output: { x: 1020, y: 156 },
    },
  },
  {
    id: 'iterated-byte-rounds',
    name: 'Iterated Byte Rounds',
    group: 'Modern Rounds',
    summary: 'A byte-oriented machine that reuses the same round composite twice instead of hand-wiring each round from scratch.',
    pipeline: 'HexSource -> ByteRoundComposite -> ByteRoundComposite -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'round-1', defId: 'ByteRoundComposite', params: {} },
        { id: 'round-2', defId: 'ByteRoundComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'round-1', port: 'in' } },
        { from: { moduleId: 'round-1', port: 'out' }, to: { moduleId: 'round-2', port: 'in' } },
        { from: { moduleId: 'round-2', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      'round-1': { x: 292, y: 156 },
      'round-2': { x: 536, y: 156 },
      encode: { x: 780, y: 156 },
      output: { x: 1024, y: 156 },
    },
  },
  {
    id: 'keyed-byte-rounds',
    name: 'Scheduled Byte Rounds',
    group: 'Modern Rounds',
    summary: 'Two visible sub-keys feed two keyed byte rounds so repeated-round structure stays explicit before any iterator-aware key schedule exists.',
    pipeline: 'HexSource + Round Keys -> KeyedByteRound -> KeyedByteRound -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'key-1', defId: 'HexSource', params: { value: '1C' } },
        { id: 'key-2', defId: 'HexSource', params: { value: 'E7' } },
        { id: 'round-1', defId: 'KeyedByteRoundComposite', params: {} },
        { id: 'round-2', defId: 'KeyedByteRoundComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'round-1', port: 'in' } },
        { from: { moduleId: 'key-1', port: 'out' }, to: { moduleId: 'round-1', port: 'key' } },
        { from: { moduleId: 'round-1', port: 'out' }, to: { moduleId: 'round-2', port: 'in' } },
        { from: { moduleId: 'key-2', port: 'out' }, to: { moduleId: 'round-2', port: 'key' } },
        { from: { moduleId: 'round-2', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 32, y: 152 },
      'key-1': { x: 32, y: 40 },
      'key-2': { x: 312, y: 40 },
      'round-1': { x: 312, y: 152 },
      'round-2': { x: 592, y: 152 },
      encode: { x: 872, y: 152 },
      output: { x: 1152, y: 152 },
    },
  },
  {
    id: 'visible-subkey-bus',
    name: 'Visible Sub-Key Bus',
    group: 'Modern Rounds',
    summary: 'One visible key bus is sliced into two explicit sub-keys so each keyed round can read a different window without iterator magic.',
    pipeline: 'HexSource + Key Bus -> BitWindow -> KeyedByteRound -> BitWindow -> KeyedByteRound -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'keybus', defId: 'HexSource', params: { value: '1CE7' } },
        { id: 'window-1', defId: 'BitWindow', params: { start: 0, width: 8 } },
        { id: 'window-2', defId: 'BitWindow', params: { start: 8, width: 8 } },
        { id: 'round-1', defId: 'KeyedByteRoundComposite', params: {} },
        { id: 'round-2', defId: 'KeyedByteRoundComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'round-1', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'window-1', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'window-2', port: 'in' } },
        { from: { moduleId: 'window-1', port: 'out' }, to: { moduleId: 'round-1', port: 'key' } },
        { from: { moduleId: 'round-1', port: 'out' }, to: { moduleId: 'round-2', port: 'in' } },
        { from: { moduleId: 'window-2', port: 'out' }, to: { moduleId: 'round-2', port: 'key' } },
        { from: { moduleId: 'round-2', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 32, y: 184 },
      keybus: { x: 32, y: 40 },
      'window-1': { x: 292, y: 40 },
      'window-2': { x: 572, y: 40 },
      'round-1': { x: 292, y: 184 },
      'round-2': { x: 572, y: 184 },
      encode: { x: 852, y: 184 },
      output: { x: 1132, y: 184 },
    },
  },
  {
    id: 'keyed-byte-iterator',
    name: 'Scheduled Byte Iterator',
    group: 'Modern Rounds',
    summary: 'A bounded keyed iterator splits one visible key bus into round-sized sub-keys and feeds them across the unrolled round chain.',
    pipeline: 'HexSource + Key Bus -> KeyedByteRoundIterator -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'keybus', defId: 'HexSource', params: { value: '1CE7' } },
        { id: 'rounds', defId: 'KeyedByteRoundIterator', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'rounds', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'rounds', port: 'key' } },
        { from: { moduleId: 'rounds', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 40, y: 160 },
      keybus: { x: 40, y: 48 },
      rounds: { x: 360, y: 160 },
      encode: { x: 680, y: 160 },
      output: { x: 1000, y: 160 },
    },
  },
  {
    id: 'clocked-byte-round-iterator',
    name: 'Clocked Byte Round Iterator',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 132,
    recommendedAfter: ['counters-conditions-pulses', 'keyed-byte-iterator'],
    summary: 'A bounded round bank that holds one accumulated byte state and advances exactly one visible round per incoming pulse.',
    pipeline: 'BitSequenceInput + Clock -> ClockedByteRoundIterator -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'source', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'clocked', defId: 'ClockedByteRoundIterator', params: {} },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'clocked', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'clocked', port: 'clock' } },
        { from: { moduleId: 'clocked', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 64, y: 188 },
      clock: { x: 64, y: 64 },
      clocked: { x: 380, y: 188 },
      out: { x: 696, y: 188 },
    },
  },
  {
    id: 'feistel-network',
    name: '[LAB-2.2] Feistel Network',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 135,
    recommendedAfter: ['byte-round'],
    summary: 'A small keyed Feistel network that splits a byte into left and right halves, transforms the right half, recombines the result, and iterates that structure visibly.',
    pipeline: 'HexSource + Key Bus -> FeistelRoundIterator -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'keybus', defId: 'HexSource', params: { value: '1C' } },
        { id: 'rounds', defId: 'FeistelRoundIterator', params: { iterationCount: 2 } },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'rounds', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'rounds', port: 'key' } },
        { from: { moduleId: 'rounds', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 40, y: 160 },
      keybus: { x: 40, y: 48 },
      rounds: { x: 360, y: 160 },
      encode: { x: 680, y: 160 },
      output: { x: 1000, y: 160 },
    },
  },
  {
    id: 'protocol-material-mixer',
    name: 'Protocol Material Mixer',
    group: 'Protocol Materials',
    summary: 'A framed byte-sized message is padded, split, then mixed with an explicit IV on one branch and a visible key on the other so context stays legible on the graph.',
    pipeline: 'HexSource -> BitPad -> BitSplit -> XOR(IV) + XOR(Key) -> BitJoin -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'message', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'pad', defId: 'BitPad', params: { targetWidth: 16, side: 'right', padBit: '0' } },
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 8 } },
        { id: 'iv', defId: 'IV', params: { value: '1C', width: 8 } },
        { id: 'key', defId: 'HexSource', params: { value: '55' } },
        { id: 'left-xor', defId: 'XOR', params: {} },
        { id: 'right-xor', defId: 'XOR', params: {} },
        { id: 'join', defId: 'BitJoin', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
        { from: { moduleId: 'split', port: 'left' }, to: { moduleId: 'left-xor', port: 'a' } },
        { from: { moduleId: 'iv', port: 'out' }, to: { moduleId: 'left-xor', port: 'b' } },
        { from: { moduleId: 'split', port: 'right' }, to: { moduleId: 'right-xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'right-xor', port: 'b' } },
        { from: { moduleId: 'left-xor', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
        { from: { moduleId: 'right-xor', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        { from: { moduleId: 'join', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      message: { x: 40, y: 156 },
      pad: { x: 260, y: 156 },
      split: { x: 500, y: 156 },
      iv: { x: 500, y: 44 },
      key: { x: 500, y: 284 },
      'left-xor': { x: 760, y: 92 },
      'right-xor': { x: 760, y: 220 },
      join: { x: 1020, y: 156 },
      encode: { x: 1280, y: 156 },
      output: { x: 1540, y: 156 },
    },
  },
  {
    id: 'byte-round',
    name: '[LAB-2.1] Byte S-Box Round',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 130,
    recommendedAfter: ['bridge'],
    summary: 'An 8-bit substitution and permutation round that stays fully in the bit domain.',
    pipeline: 'BitSource -> SBox(256) -> Permutation -> BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 1, 0, 0] } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 292, y: 156 },
      permute: { x: 536, y: 156 },
      output: { x: 780, y: 156 },
    },
  },
  {
    id: 'des-s1-lookup',
    name: 'DES S1 Lookup',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 132,
    recommendedAfter: ['sbox-table-transform'],
    summary: 'A 6→4 DES-style substitution board that makes the outer-bit row and inner-bit column lookup pattern explicit.',
    pipeline: 'BitSource(6 bits) -> SBox(6→4 DES S1) -> BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 1] } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            inputBits: '6',
            outputBits: '4',
            table: DES_S1_TABLE,
          },
        },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 64, y: 176 },
      sbox: { x: 356, y: 176 },
      output: { x: 648, y: 176 },
    },
  },
  {
    id: 'aes-byte-sbox',
    name: 'AES Byte S-Box',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 134,
    recommendedAfter: ['byte-round'],
    summary: 'A seeded AES 8→8 substitution board that starts from a hex byte so students can inspect the active row, column, and output directly.',
    pipeline: 'HexSource -> SBox(AES 8→8) -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: '53' } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            inputBits: '8',
            outputBits: '8',
            table: AES_SBOX_TABLE,
          },
        },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 292, y: 156 },
      encode: { x: 536, y: 156 },
      output: { x: 780, y: 156 },
    },
  },
  {
    id: 'sbox-table-transform',
    name: 'S-Box Table Transform',
    group: 'Modern Rounds',
    summary: 'A focused 4-bit S-Box lab for swapping and rotating table rows and columns while keeping the table valid.',
    pipeline: 'BitSource -> SBox(16) -> BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7',
          },
        },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 64, y: 176 },
      sbox: { x: 332, y: 176 },
      output: { x: 600, y: 176 },
    },
  },
  {
    id: 'hex-round',
    name: 'Hex Byte Round',
    group: 'Bridge Rounds',
    summary: 'A byte-oriented round that starts from hex, stays in bits for substitution/permutation, and returns to hex.',
    pipeline: 'HexSource -> SBox(256) -> Permutation -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 252, y: 156 },
      permute: { x: 456, y: 156 },
      encode: { x: 660, y: 156 },
      output: { x: 864, y: 156 },
    },
  },
  {
    id: 'ascii-round',
    name: 'ASCII Byte Round',
    group: 'Bridge Rounds',
    summary: 'A byte-oriented round that begins with ASCII text, transforms it in bits, and returns to ASCII.',
    pipeline: 'AsciiSource -> SBox(256) -> Permutation -> BitsToAscii -> TextOutput',
    project: {
      modules: [
        { id: 'source', defId: 'AsciiSource', params: { value: 'A' } },
        {
          id: 'sbox',
          defId: 'SBox',
          params: {
            table: Array.from({ length: 256 }, (_, index) => 255 - index).join(','),
          },
        },
        { id: 'permute', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        { id: 'encode', defId: 'BitsToAscii', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'permute', port: 'in' } },
        { from: { moduleId: 'permute', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      sbox: { x: 252, y: 156 },
      permute: { x: 456, y: 156 },
      encode: { x: 660, y: 156 },
      output: { x: 864, y: 156 },
    },
  },
  {
    id: 'toy-compression-hash',
    name: 'Toy Compression Hash',
    group: 'Hash Foundations',
    summary: 'Two visible message bytes are mixed separately, XOR-compressed into one digest byte, and then diffused through repeated digest rounds.',
    pipeline: 'HexSource + HexSource -> ToyCompressionHashComposite -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'left-source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'right-source', defId: 'HexSource', params: { value: '6F' } },
        { id: 'hash', defId: 'ToyCompressionHashComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-source', port: 'out' }, to: { moduleId: 'hash', port: 'left' } },
        { from: { moduleId: 'right-source', port: 'out' }, to: { moduleId: 'hash', port: 'right' } },
        { from: { moduleId: 'hash', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      'left-source': { x: 44, y: 108 },
      'right-source': { x: 44, y: 236 },
      hash: { x: 352, y: 172 },
      encode: { x: 660, y: 172 },
      output: { x: 968, y: 172 },
    },
  },
  {
    id: 'hash-digest-round',
    name: 'Hash Digest Round',
    group: 'Hash Foundations',
    summary: 'A single digest round that substitutes, rotates, and constant-mixes one byte so students can hear the effect of mode changes before stacking rounds.',
    pipeline: 'HexSource -> HashDigestRoundComposite -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'digest', defId: 'HashDigestRoundComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'digest', port: 'in' } },
        { from: { moduleId: 'digest', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 48, y: 156 },
      digest: { x: 336, y: 156 },
      encode: { x: 624, y: 156 },
      output: { x: 912, y: 156 },
    },
  },
  {
    id: 'visible-compression-hash',
    name: 'Visible Compression Hash',
    group: 'Hash Foundations',
    summary:
      'A two-input compression function built from explicit primitives: each message byte travels a separate substitution-and-permutation path, the paths are XOR-compressed into one byte, and four digest rounds finalize the hash. Every transformation is a visible canvas node with a drillable interior.',
    pipeline:
      'HexSource(M_L) → SBox(invert) → Permutation(bit-reverse) → XOR ← Permutation(bit-reverse) ← SBox(invert) ← Permutation(bit-reverse) ← HexSource(M_R) → HashDigestRoundIterator(4) → BitsToHex → HexOutput',
    project: {
      modules: [
        // Message inputs
        { id: 'msg-l', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'msg-r', defId: 'HexSource', params: { value: '6F' } },
        // Left path: substitute → bit-reverse
        {
          id: 'l-sub',
          defId: 'SBox',
          params: { table: Array.from({ length: 256 }, (_, i) => 255 - i).join(',') },
        },
        { id: 'l-perm', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        // Right path: bit-reverse → substitute → bit-reverse
        { id: 'r-pre', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        {
          id: 'r-sub',
          defId: 'SBox',
          params: { table: Array.from({ length: 256 }, (_, i) => 255 - i).join(',') },
        },
        { id: 'r-perm', defId: 'Permutation', params: { order: '7,6,5,4,3,2,1,0' } },
        // Visible intermediate outputs for left and right paths
        { id: 'l-bth', defId: 'BitsToHex', params: {} },
        { id: 'l-out', defId: 'HexOutput', params: {} },
        { id: 'r-bth', defId: 'BitsToHex', params: {} },
        { id: 'r-out', defId: 'HexOutput', params: {} },
        // Compress: XOR left and right
        { id: 'compress', defId: 'XOR', params: {} },
        // Visible compressed byte
        { id: 'c-bth', defId: 'BitsToHex', params: {} },
        { id: 'c-out', defId: 'HexOutput', params: {} },
        // Finalize: 4 digest rounds
        { id: 'digest', defId: 'HashDigestRoundIterator', params: { iterationCount: 4 } },
        { id: 'out-bth', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        // Left path
        { from: { moduleId: 'msg-l', port: 'out' }, to: { moduleId: 'l-sub', port: 'in' } },
        { from: { moduleId: 'l-sub', port: 'out' }, to: { moduleId: 'l-perm', port: 'in' } },
        { from: { moduleId: 'l-perm', port: 'out' }, to: { moduleId: 'l-bth', port: 'in' } },
        { from: { moduleId: 'l-bth', port: 'out' }, to: { moduleId: 'l-out', port: 'in' } },
        { from: { moduleId: 'l-perm', port: 'out' }, to: { moduleId: 'compress', port: 'a' } },
        // Right path
        { from: { moduleId: 'msg-r', port: 'out' }, to: { moduleId: 'r-pre', port: 'in' } },
        { from: { moduleId: 'r-pre', port: 'out' }, to: { moduleId: 'r-sub', port: 'in' } },
        { from: { moduleId: 'r-sub', port: 'out' }, to: { moduleId: 'r-perm', port: 'in' } },
        { from: { moduleId: 'r-perm', port: 'out' }, to: { moduleId: 'r-bth', port: 'in' } },
        { from: { moduleId: 'r-bth', port: 'out' }, to: { moduleId: 'r-out', port: 'in' } },
        { from: { moduleId: 'r-perm', port: 'out' }, to: { moduleId: 'compress', port: 'b' } },
        // Compress and visible compressed byte
        { from: { moduleId: 'compress', port: 'out' }, to: { moduleId: 'c-bth', port: 'in' } },
        { from: { moduleId: 'c-bth', port: 'out' }, to: { moduleId: 'c-out', port: 'in' } },
        { from: { moduleId: 'compress', port: 'out' }, to: { moduleId: 'digest', port: 'in' } },
        // Finalize
        { from: { moduleId: 'digest', port: 'out' }, to: { moduleId: 'out-bth', port: 'in' } },
        { from: { moduleId: 'out-bth', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      // Left path (top row)
      'msg-l': { x: 60, y: 80 },
      'l-sub': { x: 260, y: 80 },
      'l-perm': { x: 460, y: 80 },
      'l-bth': { x: 660, y: 80 },
      'l-out': { x: 860, y: 80 },
      // Right path (bottom row)
      'msg-r': { x: 60, y: 300 },
      'r-pre': { x: 260, y: 300 },
      'r-sub': { x: 460, y: 300 },
      'r-perm': { x: 660, y: 300 },
      'r-bth': { x: 860, y: 300 },
      'r-out': { x: 1060, y: 300 },
      // Compress (center)
      compress: { x: 660, y: 180 },
      'c-bth': { x: 860, y: 180 },
      'c-out': { x: 1060, y: 180 },
      // Finalize
      digest: { x: 1060, y: 80 },
      'out-bth': { x: 1260, y: 80 },
      output: { x: 1460, y: 80 },
    },
  },
  {
    id: 'toy-sponge-hash',
    name: 'Toy Sponge Hash',
    group: 'Hash Foundations',
    summary: 'Two visible message bytes are absorbed one at a time into a 16-bit sponge state, mixed after each absorb, and then squeezed back down to one digest byte.',
    pipeline: 'HexSource + HexSource -> ToySpongeHashComposite -> BitsToHex -> HexOutput',
    project: {
      modules: [
        { id: 'left-source', defId: 'HexSource', params: { value: 'AA' } },
        { id: 'right-source', defId: 'HexSource', params: { value: 'BB' } },
        { id: 'sponge', defId: 'ToySpongeHashComposite', params: {} },
        { id: 'encode', defId: 'BitsToHex', params: {} },
        { id: 'output', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-source', port: 'out' }, to: { moduleId: 'sponge', port: 'left' } },
        { from: { moduleId: 'right-source', port: 'out' }, to: { moduleId: 'sponge', port: 'right' } },
        { from: { moduleId: 'sponge', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      'left-source': { x: 44, y: 108 },
      'right-source': { x: 44, y: 236 },
      sponge: { x: 352, y: 172 },
      encode: { x: 660, y: 172 },
      output: { x: 968, y: 172 },
    },
  },
  {
    id: 'sequential',
    name: 'Sequential Heart',
    group: 'Sequential',
    summary: 'A clocked keystream pipeline that turns state changes into a symbol stream over time.',
    pipeline: 'Clock -> LFSR -> BitsToSymbol -> TextOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 5 },
        },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 48, y: 156 },
      lfsr: { x: 292, y: 156 },
      decode: { x: 536, y: 156 },
      output: { x: 780, y: 156 },
    },
  },
  {
    id: 'keystream',
    name: 'Modern Keystream',
    group: 'Sequential',
    stage: 'streams-and-scheduling',
    order: 130,
    recommendedAfter: ['counter-pulse-gate'],
    summary:
      'EDUCATIONAL MODEL: NOT CRYPTOGRAPHICALLY SECURE. A 5-bit LFSR keystream XORs a plaintext bit stream without leaving the bit domain. With width 5, the maximum theoretical period is 31 states.',
    pipeline: 'Clock -> LFSR -> XOR(BitSource) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 1 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 48, y: 72 },
      plain: { x: 48, y: 262 },
      lfsr: { x: 292, y: 72 },
      xor: { x: 536, y: 168 },
      output: { x: 780, y: 168 },
    },
  },
  {
    id: 'lfsr-predictability',
    name: 'LFSR Predictability Lab',
    group: 'Sequential',
    stage: 'streams-and-scheduling',
    order: 135,
    recommendedAfter: ['keystream'],
    summary:
      'EDUCATIONAL MODEL: NOT CRYPTOGRAPHICALLY SECURE. The first eight output bits are already copied into a visible prediction stream; the goal is to infer the ninth bit of this 5-bit LFSR. Maximum theoretical period: 31.',
    pipeline: 'Clock -> LFSR + Prediction BitSource -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 9 } },
        {
          id: 'lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 1 },
        },
        { id: 'prediction', defId: 'BitSource', params: { stream: [0, 1, 1, 0, 1, 0, 0, 1, 1] } },
        { id: 'stream-out', defId: 'BitOutput', params: {} },
        { id: 'prediction-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'stream-out', port: 'in' } },
        { from: { moduleId: 'prediction', port: 'out' }, to: { moduleId: 'prediction-out', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 48 },
      lfsr: { x: 280, y: 48 },
      prediction: { x: 280, y: 256 },
      'stream-out': { x: 560, y: 64 },
      'prediction-out': { x: 560, y: 240 },
    },
  },
  {
    id: 'gated-keystream',
    name: 'Gated Keystream',
    group: 'Conditional Clocking',
    stage: 'streams-and-scheduling',
    order: 140,
    recommendedAfter: ['lfsr-predictability'],
    summary:
      'EDUCATIONAL MODEL: NOT CRYPTOGRAPHICALLY SECURE. One clocked LFSR gates a second keystream register, changing the output rhythm without making the machine cryptographically strong.',
    pipeline: 'Clock -> Gate LFSR -> Data LFSR -> XOR(BitSource) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'gate',
          defId: 'LFSR',
          params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 1 },
        },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 1 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'gate', port: 'clock' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 64 },
      plain: { x: 40, y: 256 },
      gate: { x: 260, y: 64 },
      data: { x: 500, y: 64 },
      xor: { x: 720, y: 168 },
      output: { x: 940, y: 168 },
    },
  },
  {
    id: 'majority-keystream',
    name: 'Majority-Clocked Keystream',
    group: 'Conditional Clocking',
    stage: 'streams-and-scheduling',
    order: 150,
    recommendedAfter: ['gated-keystream'],
    summary:
      'EDUCATIONAL MODEL: NOT CRYPTOGRAPHICALLY SECURE. Three visible control registers vote through Majority on whether a data register advances, making irregular clocking explicit without claiming algebraic hardness.',
    pipeline: 'Clock -> 3 Control LFSRs -> Majority -> Gate(clock pulse) -> Data LFSR -> XOR(BitSource) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'control-a',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 0, 1], taps: '0,2', outputLength: 1 },
        },
        {
          id: 'control-b',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 1, 0], taps: '1,3', outputLength: 1 },
        },
        {
          id: 'control-c',
          defId: 'LFSR',
          params: { seed: [0, 1, 1, 0, 1], taps: '0,3', outputLength: 1 },
        },
        { id: 'majority', defId: 'Majority', params: {} },
        { id: 'gate', defId: 'Gate', params: {} },
        {
          id: 'data',
          defId: 'LFSR',
          params: { seed: [1, 1, 0, 0, 1], taps: '1,4', outputLength: 1 },
        },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-a', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-b', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-c', port: 'clock' } },
        { from: { moduleId: 'control-a', port: 'out' }, to: { moduleId: 'majority', port: 'a' } },
        { from: { moduleId: 'control-b', port: 'out' }, to: { moduleId: 'majority', port: 'b' } },
        { from: { moduleId: 'control-c', port: 'out' }, to: { moduleId: 'majority', port: 'c' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'gate', port: 'in' } },
        { from: { moduleId: 'majority', port: 'out' }, to: { moduleId: 'gate', port: 'control' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'data', port: 'clock' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 56 },
      plain: { x: 40, y: 296 },
      'control-a': { x: 280, y: 24 },
      'control-b': { x: 280, y: 136 },
      'control-c': { x: 280, y: 248 },
      majority: { x: 540, y: 136 },
      gate: { x: 800, y: 136 },
      data: { x: 1060, y: 56 },
      xor: { x: 1320, y: 184 },
      output: { x: 1580, y: 184 },
    },
  },
  {
    id: 'filtered-keystream',
    name: 'Filtered Keystream',
    group: 'Conditional Clocking',
    summary: 'One visible control bit selects which of two candidate keystream bits continues forward before masking the plaintext.',
    pipeline: 'Clock -> Control LFSR + Data A LFSR + Data B LFSR -> Mux -> XOR(BitSource) -> BitOutput',
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'control',
          defId: 'LFSR',
          params: { seed: [1], taps: '0', outputLength: 1 },
        },
        {
          id: 'data-a',
          defId: 'LFSR',
          params: { seed: [1], taps: '0', outputLength: 1 },
        },
        {
          id: 'data-b',
          defId: 'LFSR',
          params: { seed: [0], taps: '0', outputLength: 1 },
        },
        { id: 'mux', defId: 'Mux', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'data-a', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'data-b', port: 'clock' } },
        { from: { moduleId: 'control', port: 'out' }, to: { moduleId: 'mux', port: 'select' } },
        { from: { moduleId: 'data-a', port: 'out' }, to: { moduleId: 'mux', port: 'a' } },
        { from: { moduleId: 'data-b', port: 'out' }, to: { moduleId: 'mux', port: 'b' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'mux', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 56 },
      plain: { x: 40, y: 296 },
      control: { x: 300, y: 24 },
      'data-a': { x: 300, y: 152 },
      'data-b': { x: 300, y: 280 },
      mux: { x: 560, y: 152 },
      xor: { x: 820, y: 224 },
      output: { x: 1080, y: 224 },
    },
  },
  {
    id: 'randomness-lab',
    name: 'Randomness Lab',
    group: 'Cryptanalysis Labs',
    stage: 'streams-and-scheduling',
    order: 155,
    summary: 'Compare an obviously repetitive bit source against a simple LFSR-driven stream so the randomness tools can show what they can reveal and what they do not prove.',
    pipeline: 'BitSequenceInput -> BitsSequenceToTicked + Clock -> BitOutput + LFSR -> BitOutput sinks for weak-vs-stronger randomness comparison',
    defaultTickedMode: true,
    project: {
      modules: [
        {
          id: 'weak-sequence',
          defId: 'BitSequenceInput',
          params: { stream: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
        },
        {
          id: 'weak-tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 1, wrap: false, remainderMode: 'error' },
        },
        { id: 'weak-out', defId: 'BitOutput', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 32 } },
        {
          id: 'strong-lfsr',
          defId: 'LFSR',
          params: { seed: [1, 0, 1, 1, 0], taps: '0,2', outputLength: 1 },
        },
        { id: 'strong-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'weak-sequence', port: 'out' }, to: { moduleId: 'weak-tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'weak-tick', port: 'clock' } },
        { from: { moduleId: 'weak-tick', port: 'out' }, to: { moduleId: 'weak-out', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'strong-lfsr', port: 'clock' } },
        { from: { moduleId: 'strong-lfsr', port: 'out' }, to: { moduleId: 'strong-out', port: 'in' } },
      ],
    },
    layout: {
      'weak-sequence': { x: 72, y: 120 },
      'weak-tick': { x: 352, y: 120 },
      'weak-out': { x: 632, y: 120 },
      clock: { x: 72, y: 456 },
      'strong-lfsr': { x: 352, y: 456 },
      'strong-out': { x: 632, y: 456 },
    },
  },
  {
    id: 'routed-clock-keystream',
    name: 'Routed Clock Keystream',
    group: 'Conditional Clocking',
    summary: 'One visible control bit routes the live clock pulse into one of two candidate data registers before their outputs are recombined.',
    pipeline: 'Clock -> Demux(select, pulse) -> Data A LFSR + Data B LFSR -> XOR -> XOR(BitSource) -> BitOutput',
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'plain', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        {
          id: 'control',
          defId: 'LFSR',
          params: { seed: [1], taps: '0', outputLength: 1 },
        },
        { id: 'route', defId: 'Demux', params: {} },
        {
          id: 'data-a',
          defId: 'LFSR',
          params: { seed: [1], taps: '0', outputLength: 1 },
        },
        {
          id: 'data-b',
          defId: 'LFSR',
          params: { seed: [0], taps: '0', outputLength: 1 },
        },
        { id: 'mix', defId: 'XOR', params: {} },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control', port: 'clock' } },
        { from: { moduleId: 'control', port: 'out' }, to: { moduleId: 'route', port: 'select' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'route', port: 'in' } },
        { from: { moduleId: 'route', port: 'a' }, to: { moduleId: 'data-a', port: 'clock' } },
        { from: { moduleId: 'route', port: 'b' }, to: { moduleId: 'data-b', port: 'clock' } },
        { from: { moduleId: 'data-a', port: 'out' }, to: { moduleId: 'mix', port: 'a' } },
        { from: { moduleId: 'data-b', port: 'out' }, to: { moduleId: 'mix', port: 'b' } },
        { from: { moduleId: 'plain', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'mix', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 56 },
      plain: { x: 40, y: 312 },
      control: { x: 280, y: 24 },
      route: { x: 520, y: 56 },
      'data-a': { x: 780, y: 24 },
      'data-b': { x: 780, y: 184 },
      mix: { x: 1040, y: 104 },
      xor: { x: 1300, y: 232 },
      output: { x: 1560, y: 232 },
    },
  },
  {
    id: 'hybrid',
    name: 'Hybrid Reference',
    summary: 'The V1 hybrid machine crossing classical and modern domains.',
    pipeline: 'TextInput -> Rotor -> Reflector -> RotorReverse -> SymbolToBits -> XOR -> BitsToSymbol -> TextOutput',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''), position: 0 },
        },
        {
          id: 'reflector',
          defId: 'Reflector',
          params: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('') },
        },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: {
            linkedRotorId: 'rotor-fwd',
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
          },
        },
        { id: 'encode', defId: 'SymbolToBits', params: {} },
        { id: 'key', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0] } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'decode', defId: 'BitsToSymbol', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
        { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'encode', port: 'in' } },
        { from: { moduleId: 'encode', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'decode', port: 'in' } },
        { from: { moduleId: 'decode', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 24, y: 132 },
      'rotor-fwd': { x: 184, y: 132 },
      reflector: { x: 344, y: 132 },
      'rotor-rev': { x: 504, y: 132 },
      encode: { x: 664, y: 132 },
      key: { x: 664, y: 304 },
      xor: { x: 824, y: 218 },
      decode: { x: 984, y: 132 },
      output: { x: 1144, y: 132 },
    },
  },
  {
    id: 'rotor-return-path',
    name: '[LAB-1.1] Rotor Return Path',
    group: 'Rotor Realism',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 170,
    recommendedAfter: ['bridge'],
    summary: 'A minimal Enigma-style path showing why the signal must return through the inverse rotor mapping after reflection.',
    pipeline: 'TextInput -> Rotor -> Reflector -> RotorReverse -> TextOutput',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        {
          id: 'rotor-fwd',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        {
          id: 'reflector',
          defId: 'Reflector',
          params: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('') },
        },
        {
          id: 'rotor-rev',
          defId: 'RotorReverse',
          params: {
            linkedRotorId: 'rotor-fwd',
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-fwd', port: 'in' } },
        { from: { moduleId: 'rotor-fwd', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
        { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-rev', port: 'in' } },
        { from: { moduleId: 'rotor-rev', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      text: { x: 48, y: 176 },
      'rotor-fwd': { x: 288, y: 176 },
      reflector: { x: 544, y: 176 },
      'rotor-rev': { x: 800, y: 176 },
      output: { x: 1056, y: 176 },
    },
  },
  {
    id: 'advanced-rotor-stepping',
    name: '[LAB-1.2] Advanced Rotor Stepping',
    group: 'Rotor Realism',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 180,
    recommendedAfter: ['rotor-return-path'],
    summary: 'A bounded three-rotor machine with explicit turnover wiring, ring setting, and visible double-step control.',
    pipeline: 'TextInput -> Rotor -> Rotor -> Rotor -> TextOutput, with Clock -> Rotor Double-Step Control -> middle rotor and explicit left gate turnover',
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        {
          id: 'right',
          defId: 'Rotor',
          params: {
            wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
            position: 15,
            ringOffset: 0,
            notches: 'Q',
          },
        },
        {
          id: 'middle',
          defId: 'Rotor',
          params: {
            wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE'.split(''),
            position: 4,
            ringOffset: 0,
            notches: 'E',
          },
        },
        {
          id: 'left',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 2,
            notches: 'Q',
          },
        },
        { id: 'middle-step-control', defId: 'RotorDoubleStepControl', params: {} },
        { id: 'left-gate', defId: 'Gate', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'right', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'middle', port: 'in' } },
        { from: { moduleId: 'middle', port: 'out' }, to: { moduleId: 'left', port: 'in' } },
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'right', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'middle-step-control', port: 'pulse' } },
        { from: { moduleId: 'right', port: 'turnover' }, to: { moduleId: 'middle-step-control', port: 'turnoverA' } },
        { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'middle-step-control', port: 'turnoverB' } },
        { from: { moduleId: 'middle-step-control', port: 'step' }, to: { moduleId: 'middle', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'left-gate', port: 'in' } },
        { from: { moduleId: 'middle', port: 'turnover' }, to: { moduleId: 'left-gate', port: 'control' } },
        { from: { moduleId: 'left-gate', port: 'out' }, to: { moduleId: 'left', port: 'clock' } },
      ],
    },
    layout: {
      text: { x: 40, y: 208 },
      clock: { x: 40, y: 40 },
      right: { x: 280, y: 208 },
      'middle-step-control': { x: 520, y: 40 },
      middle: { x: 760, y: 208 },
      'left-gate': { x: 1000, y: 40 },
      left: { x: 1240, y: 208 },
      output: { x: 1480, y: 208 },
    },
  },
  {
    id: 'rotor-control-bank',
    name: 'Rotor Control Bank',
    group: 'Rotor Realism',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 120,
    recommendedAfter: ['advanced-rotor-stepping'],
    summary: 'A bounded control-bank machine where one rotor pair visibly decides whether a base pulse steps the left or right driven rotor.',
    pipeline: 'Clock -> control rotors -> Rotor Control Bank Router -> driven rotor clocks, with TextInput -> driven rotor bank -> TextOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        {
          id: 'control-enable',
          defId: 'Rotor',
          params: {
            wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
            position: 0,
            ringOffset: 0,
            notches: 'A,C',
          },
        },
        {
          id: 'control-select',
          defId: 'Rotor',
          params: {
            wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE'.split(''),
            position: 0,
            ringOffset: 0,
            notches: 'A',
          },
        },
        {
          id: 'driven-left',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        {
          id: 'driven-right',
          defId: 'Rotor',
          params: {
            wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        { id: 'control-router', defId: 'RotorControlBankRouter', params: {} },
        { id: 'output', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'driven-right', port: 'in' } },
        { from: { moduleId: 'driven-right', port: 'out' }, to: { moduleId: 'driven-left', port: 'in' } },
        { from: { moduleId: 'driven-left', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'control-enable', port: 'in' } },
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'control-select', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-enable', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-select', port: 'clock' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'control-router', port: 'pulse' } },
        { from: { moduleId: 'control-enable', port: 'turnover' }, to: { moduleId: 'control-router', port: 'enable' } },
        { from: { moduleId: 'control-select', port: 'turnover' }, to: { moduleId: 'control-router', port: 'select' } },
        { from: { moduleId: 'control-router', port: 'stepA' }, to: { moduleId: 'driven-left', port: 'clock' } },
        { from: { moduleId: 'control-router', port: 'stepB' }, to: { moduleId: 'driven-right', port: 'clock' } },
      ],
    },
    layout: {
      text: { x: 40, y: 232 },
      clock: { x: 40, y: 48 },
      'control-enable': { x: 280, y: 48 },
      'control-select': { x: 520, y: 48 },
      'control-router': { x: 760, y: 48 },
      'driven-right': { x: 520, y: 232 },
      'driven-left': { x: 880, y: 232 },
      output: { x: 1240, y: 232 },
    },
  },
  {
    id: 'clocked-round-traversal',
    name: 'Clocked Round Traversal',
    group: 'Conditional Clocking',
    stage: 'streams-and-scheduling',
    order: 165,
    recommendedAfter: ['filtered-keystream'],
    summary:
      'A bounded round body advances one step per clock pulse. Watch the accumulated output change with each tick, then halt when the round bank is exhausted.',
    pipeline: 'Clock + BitSource -> ClockedByteRoundIterator(3 rounds, halt) -> BitOutput',
    defaultTickedMode: true,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'input', defId: 'IV', params: { width: 8, value: 'a6' } },
        { id: 'iterator', defId: 'ClockedByteRoundIterator', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'iterator', port: 'clock' } },
        { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'iterator', port: 'in' } },
        { from: { moduleId: 'iterator', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      clock: { x: 40, y: 56 },
      input: { x: 40, y: 248 },
      iterator: { x: 320, y: 152 },
      output: { x: 600, y: 152 },
    },
  },
  {
    id: 'one-machine-two-directions',
    name: 'One Machine Two Directions',
    group: 'Conditional Clocking',
    stage: 'streams-and-scheduling',
    order: 175,
    summary:
      'Two instances of the same conditional cipher show how a single mode bit selects the forward path or the inverse path — encryption and decryption from one definition.',
    pipeline:
      'BitSource -> CipherDirectionSwitch(select=0) -> BitOutput | CipherDirectionSwitch(select=0).out -> CipherDirectionSwitch(select=1) -> BitOutput',
    project: {
      modules: [
        { id: 'plaintext', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'mode-enc', defId: 'BitSource', params: { stream: [0] } },
        { id: 'cipher-enc', defId: 'CipherDirectionSwitch', params: {} },
        { id: 'encrypted-out', defId: 'BitOutput', params: {} },
        { id: 'mode-dec', defId: 'BitSource', params: { stream: [1] } },
        { id: 'cipher-dec', defId: 'CipherDirectionSwitch', params: {} },
        { id: 'recovered-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'plaintext', port: 'out' }, to: { moduleId: 'cipher-enc', port: 'in' } },
        { from: { moduleId: 'mode-enc', port: 'out' }, to: { moduleId: 'cipher-enc', port: 'select' } },
        { from: { moduleId: 'cipher-enc', port: 'out' }, to: { moduleId: 'encrypted-out', port: 'in' } },
        { from: { moduleId: 'cipher-enc', port: 'out' }, to: { moduleId: 'cipher-dec', port: 'in' } },
        { from: { moduleId: 'mode-dec', port: 'out' }, to: { moduleId: 'cipher-dec', port: 'select' } },
        { from: { moduleId: 'cipher-dec', port: 'out' }, to: { moduleId: 'recovered-out', port: 'in' } },
      ],
    },
    layout: {
      plaintext: { x: 40, y: 200 },
      'mode-enc': { x: 40, y: 80 },
      'cipher-enc': { x: 280, y: 140 },
      'encrypted-out': { x: 520, y: 60 },
      'mode-dec': { x: 520, y: 280 },
      'cipher-dec': { x: 760, y: 140 },
      'recovered-out': { x: 1000, y: 140 },
    },
  },
  {
    id: 'differential-characteristic',
    name: 'Differential Characteristic',
    group: 'Cryptanalysis Labs',
    stage: 'framing-and-protocol-context',
    order: 126,
    recommendedAfter: ['key-schedule-lab'],
    summary: 'Feed two inputs that differ by a fixed Δ through a weak (identity) and a strong (PRESENT) S-box side by side. Watch how a weak S-box lets the input difference pass through unchanged — exactly what differential cryptanalysis exploits.',
    pipeline: 'BitSource(P) + BitSource(Δ) -> XOR(P prime) -> SBox(weak/strong) x2 -> XOR(output difference) -> BitOutput',
    project: {
      modules: [
        { id: 'p', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'delta', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'p-prime', defId: 'XOR', params: {} },
        { id: 'delta-out', defId: 'BitOutput', params: {} },
        { id: 'weak-p', defId: 'SBox', params: { table: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15' } },
        { id: 'weak-p-prime', defId: 'SBox', params: { table: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15' } },
        { id: 'weak-diff', defId: 'XOR', params: {} },
        { id: 'weak-out', defId: 'BitOutput', params: {} },
        { id: 'strong-p', defId: 'SBox', params: { table: '12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2' } },
        { id: 'strong-p-prime', defId: 'SBox', params: { table: '12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2' } },
        { id: 'strong-diff', defId: 'XOR', params: {} },
        { id: 'strong-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'p', port: 'out' }, to: { moduleId: 'p-prime', port: 'a' } },
        { from: { moduleId: 'delta', port: 'out' }, to: { moduleId: 'p-prime', port: 'b' } },
        { from: { moduleId: 'delta', port: 'out' }, to: { moduleId: 'delta-out', port: 'in' } },
        { from: { moduleId: 'p', port: 'out' }, to: { moduleId: 'weak-p', port: 'in' } },
        { from: { moduleId: 'p-prime', port: 'out' }, to: { moduleId: 'weak-p-prime', port: 'in' } },
        { from: { moduleId: 'weak-p', port: 'out' }, to: { moduleId: 'weak-diff', port: 'a' } },
        { from: { moduleId: 'weak-p-prime', port: 'out' }, to: { moduleId: 'weak-diff', port: 'b' } },
        { from: { moduleId: 'weak-diff', port: 'out' }, to: { moduleId: 'weak-out', port: 'in' } },
        { from: { moduleId: 'p', port: 'out' }, to: { moduleId: 'strong-p', port: 'in' } },
        { from: { moduleId: 'p-prime', port: 'out' }, to: { moduleId: 'strong-p-prime', port: 'in' } },
        { from: { moduleId: 'strong-p', port: 'out' }, to: { moduleId: 'strong-diff', port: 'a' } },
        { from: { moduleId: 'strong-p-prime', port: 'out' }, to: { moduleId: 'strong-diff', port: 'b' } },
        { from: { moduleId: 'strong-diff', port: 'out' }, to: { moduleId: 'strong-out', port: 'in' } },
      ],
    },
    layout: {
      p: { x: 80, y: 80 },
      delta: { x: 400, y: 80 },
      'delta-out': { x: 680, y: 80 },
      'p-prime': { x: 240, y: 260 },
      'weak-p': { x: 80, y: 460 },
      'weak-p-prime': { x: 400, y: 460 },
      'weak-diff': { x: 240, y: 640 },
      'weak-out': { x: 240, y: 820 },
      'strong-p': { x: 720, y: 460 },
      'strong-p-prime': { x: 1040, y: 460 },
      'strong-diff': { x: 880, y: 640 },
      'strong-out': { x: 880, y: 820 },
    },
  },
  {
    id: 'visible-key-selection',
    name: 'Visible Key Selection',
    group: 'Key Routing',
    summary: 'One 16-bit key bus feeds two explicit selection steps: a contiguous BitWindow slice and a non-contiguous BitSelect parity-drop, so the difference is visible on the canvas.',
    pipeline: 'HexSource -> BitWindow / BitSelect -> BitOutput comparison',
    project: {
      modules: [
        { id: 'keybus', defId: 'HexSource', params: { value: 'A5C3' } },
        { id: 'window', defId: 'BitWindow', params: { start: 0, width: 8 } },
        { id: 'select', defId: 'BitSelect', params: { order: '0,1,2,3,4,5,6,8,9,10,11,12,13,14' } },
        { id: 'out-window', defId: 'BitOutput', params: {} },
        { id: 'out-select', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'window', port: 'in' } },
        { from: { moduleId: 'keybus', port: 'out' }, to: { moduleId: 'select', port: 'in' } },
        { from: { moduleId: 'window', port: 'out' }, to: { moduleId: 'out-window', port: 'in' } },
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'out-select', port: 'in' } },
      ],
    },
    layout: {
      keybus: { x: 80, y: 200 },
      window: { x: 380, y: 100 },
      select: { x: 380, y: 300 },
      'out-window': { x: 700, y: 100 },
      'out-select': { x: 700, y: 300 },
    },
  },
  {
    id: 'visible-key-remap',
    name: 'Selection Removes, Expansion Repeats',
    group: 'Key Routing',
    summary: 'One 8-bit source feeds both a BitSelect path and a BitExpand path so the contrast is on canvas: selection narrows the output by dropping bits, expansion widens it by repeating bits.',
    pipeline: 'HexSource -> BitSelect (drop) + BitExpand (repeat) -> BitOutput comparison',
    project: {
      modules: [
        { id: 'source', defId: 'HexSource', params: { value: 'A5' } },
        { id: 'select', defId: 'BitSelect', params: { order: '0,1,2,4,5,7', inputWidth: 8 } },
        { id: 'expand', defId: 'BitExpand', params: { order: '7,0,1,2,3,4,5,6,7,0', inputWidth: 8 } },
        { id: 'out-select', defId: 'BitOutput', params: {} },
        { id: 'out-expand', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'select', port: 'in' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'expand', port: 'in' } },
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'out-select', port: 'in' } },
        { from: { moduleId: 'expand', port: 'out' }, to: { moduleId: 'out-expand', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 80, y: 200 },
      select: { x: 380, y: 100 },
      expand: { x: 380, y: 300 },
      'out-select': { x: 700, y: 100 },
      'out-expand': { x: 700, y: 300 },
    },
  },
  {
    id: 'enigma-machine',
    name: 'Enigma Machine',
    group: 'Classical Machines',
    summary: 'A historically faithful three-rotor Enigma graph with plugboard, UKW-B reflector, and explicit return path — every component is a visible module so the signal path, self-reciprocal property, and structural weaknesses are all directly inspectable.',
    pipeline: 'TextInput → Plugboard → Rotor III → Rotor II → Rotor I → UKW-B → RotorReverse I → RotorReverse II → RotorReverse III → Plugboard → Output',
    project: {
      modules: [
        { id: 'source', defId: 'TextInput', params: { value: 'A' } },
        { id: 'plug-in', defId: 'Plugboard', params: { wiring: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] } },
        { id: 'right', defId: 'Rotor', params: { wiring: ['B','D','F','H','J','L','C','P','R','T','X','V','Z','N','Y','E','I','W','G','A','K','M','U','S','Q','O'], position: 0, ringOffset: 0, notches: 'V' } },
        { id: 'mid', defId: 'Rotor', params: { wiring: ['A','J','D','K','S','I','R','U','X','B','L','H','W','T','M','C','Q','G','Z','N','P','Y','F','V','O','E'], position: 0, ringOffset: 0, notches: 'E' } },
        { id: 'left', defId: 'Rotor', params: { wiring: ['E','K','M','F','L','G','D','Q','V','Z','N','T','O','W','Y','H','X','U','S','P','A','I','B','R','C','J'], position: 0, ringOffset: 0, notches: 'Q' } },
        { id: 'ukw', defId: 'Reflector', params: { wiring: ['Y','R','U','H','Q','S','L','D','P','X','N','G','O','K','M','I','E','B','F','Z','C','W','V','J','A','T'] } },
        { id: 'left-rev', defId: 'RotorReverse', params: { linkedRotorId: 'left', wiring: ['E','K','M','F','L','G','D','Q','V','Z','N','T','O','W','Y','H','X','U','S','P','A','I','B','R','C','J'], position: 0, ringOffset: 0, notches: 'Q' } },
        { id: 'mid-rev', defId: 'RotorReverse', params: { linkedRotorId: 'mid', wiring: ['A','J','D','K','S','I','R','U','X','B','L','H','W','T','M','C','Q','G','Z','N','P','Y','F','V','O','E'], position: 0, ringOffset: 0, notches: 'E' } },
        { id: 'right-rev', defId: 'RotorReverse', params: { linkedRotorId: 'right', wiring: ['B','D','F','H','J','L','C','P','R','T','X','V','Z','N','Y','E','I','W','G','A','K','M','U','S','Q','O'], position: 0, ringOffset: 0, notches: 'V' } },
        { id: 'plug-out', defId: 'Plugboard', params: { wiring: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] } },
        { id: 'output', defId: 'Output', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'plug-in', port: 'in' } },
        { from: { moduleId: 'plug-in', port: 'out' }, to: { moduleId: 'right', port: 'in' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'mid', port: 'in' } },
        { from: { moduleId: 'mid', port: 'out' }, to: { moduleId: 'left', port: 'in' } },
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'ukw', port: 'in' } },
        { from: { moduleId: 'ukw', port: 'out' }, to: { moduleId: 'left-rev', port: 'in' } },
        { from: { moduleId: 'left-rev', port: 'out' }, to: { moduleId: 'mid-rev', port: 'in' } },
        { from: { moduleId: 'mid-rev', port: 'out' }, to: { moduleId: 'right-rev', port: 'in' } },
        { from: { moduleId: 'right-rev', port: 'out' }, to: { moduleId: 'plug-out', port: 'in' } },
        { from: { moduleId: 'plug-out', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 60, y: 280 },
      'plug-in': { x: 300, y: 280 },
      right: { x: 540, y: 280 },
      mid: { x: 780, y: 280 },
      left: { x: 1020, y: 280 },
      ukw: { x: 1260, y: 280 },
      'left-rev': { x: 1500, y: 280 },
      'mid-rev': { x: 1740, y: 280 },
      'right-rev': { x: 1980, y: 280 },
      'plug-out': { x: 2220, y: 280 },
      output: { x: 2460, y: 280 },
    },
  },
  {
    id: 'visible-key-expansion',
    name: 'Visible Key Expansion',
    group: 'Key Routing',
    summary: 'A 4-bit source feeds a BitExpand module that copies two boundary bits, producing a 6-bit output — so the duplication is visible on the canvas. Contrast with BitSelect which only drops bits.',
    pipeline: 'BitSource -> BitExpand(order:3,0,1,2,3,0) -> BitOutput',
    project: {
      modules: [
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'expand', defId: 'BitExpand', params: { order: '3,0,1,2,3,0', inputWidth: 4 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'expand', port: 'in' } },
        { from: { moduleId: 'expand', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    layout: {
      source: { x: 80, y: 200 },
      expand: { x: 380, y: 200 },
      out: { x: 680, y: 200 },
    },
  },
  {
    id: 'visible-des-f-function',
    name: 'Visible DES F-Function',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 133,
    recommendedAfter: ['des-s1-lookup'],
    summary: 'The DES F-function in miniature: a 4-bit right half expands via DES-style E-expansion, mixes with a round key through XOR, passes through the DES S1 S-box, then diffuses through a P-permutation — every step is an explicit visible module.',
    pipeline: 'BitSource(4) -> BitExpand(E-expansion 4→6) -> XOR(round key) -> SBox(6→4 DES S1) -> Permutation(P) -> BitOutput',
    project: {
      modules: [
        { id: 'right-half', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'round-key', defId: 'BitSource', params: { stream: [0, 1, 1, 0, 1, 0] } },
        { id: 'e-expand', defId: 'BitExpand', params: { order: '3,0,1,2,3,0', inputWidth: 4 } },
        { id: 'f-xor', defId: 'XOR', params: {} },
        { id: 's1', defId: 'SBox', params: { inputBits: '6', outputBits: '4', table: DES_S1_TABLE } },
        { id: 'p-perm', defId: 'Permutation', params: { order: '2,0,3,1' } },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'right-half', port: 'out' }, to: { moduleId: 'e-expand', port: 'in' } },
        { from: { moduleId: 'e-expand', port: 'out' }, to: { moduleId: 'f-xor', port: 'a' } },
        { from: { moduleId: 'round-key', port: 'out' }, to: { moduleId: 'f-xor', port: 'b' } },
        { from: { moduleId: 'f-xor', port: 'out' }, to: { moduleId: 's1', port: 'in' } },
        { from: { moduleId: 's1', port: 'out' }, to: { moduleId: 'p-perm', port: 'in' } },
        { from: { moduleId: 'p-perm', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      'right-half': { x: 48, y: 320 },
      'round-key': { x: 48, y: 100 },
      'e-expand': { x: 280, y: 320 },
      'f-xor': { x: 520, y: 210 },
      's1': { x: 760, y: 210 },
      'p-perm': { x: 1000, y: 210 },
      output: { x: 1240, y: 210 },
    },
  },
  {
    id: 'visible-feistel-round',
    name: 'Visible Feistel Round',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 134,
    recommendedAfter: ['visible-des-f-function'],
    summary: 'Two explicit unrolled Feistel rounds on an 8-bit block. Each round is a separate cluster of visible modules — split, F-function, XOR, swap — so the Feistel structure is directly inspectable before the iterator abstraction is introduced.',
    pipeline: 'HexSource -> BitSplit -> [R XOR key -> SBox -> XOR L] -> BitJoin -> BitSplit -> [R XOR key -> SBox -> XOR L] -> BitJoin -> BitOutput',
    project: {
      modules: [
        // inputs
        { id: 'block', defId: 'HexSource', params: { value: 'A3' } },
        { id: 'key1', defId: 'BitSource', params: { stream: [0, 1, 0, 1] } },
        { id: 'key2', defId: 'BitSource', params: { stream: [1, 1, 0, 0] } },
        // round 1
        { id: 'split1', defId: 'BitSplit', params: { leftWidth: 4 } },
        { id: 'f1-xor', defId: 'XOR', params: {} },
        { id: 'f1-sbox', defId: 'SBox', params: { table: PRESENT_SBOX_TABLE } },
        { id: 'r1-xor', defId: 'XOR', params: {} },
        { id: 'join1', defId: 'BitJoin', params: {} },
        // round 2
        { id: 'split2', defId: 'BitSplit', params: { leftWidth: 4 } },
        { id: 'f2-xor', defId: 'XOR', params: {} },
        { id: 'f2-sbox', defId: 'SBox', params: { table: PRESENT_SBOX_TABLE } },
        { id: 'r2-xor', defId: 'XOR', params: {} },
        { id: 'join2', defId: 'BitJoin', params: {} },
        { id: 'output', defId: 'BitOutput', params: {} },
      ],
      connections: [
        // feed round 1
        { from: { moduleId: 'block', port: 'out' }, to: { moduleId: 'split1', port: 'in' } },
        // F-function round 1: F(R0, K1) = SBox(R0 XOR K1)
        { from: { moduleId: 'split1', port: 'right' }, to: { moduleId: 'f1-xor', port: 'a' } },
        { from: { moduleId: 'key1', port: 'out' }, to: { moduleId: 'f1-xor', port: 'b' } },
        { from: { moduleId: 'f1-xor', port: 'out' }, to: { moduleId: 'f1-sbox', port: 'in' } },
        // new right = L0 XOR F1
        { from: { moduleId: 'f1-sbox', port: 'out' }, to: { moduleId: 'r1-xor', port: 'a' } },
        { from: { moduleId: 'split1', port: 'left' }, to: { moduleId: 'r1-xor', port: 'b' } },
        // Feistel swap: new left = R0, new right = L0 XOR F1
        { from: { moduleId: 'split1', port: 'right' }, to: { moduleId: 'join1', port: 'a' } },
        { from: { moduleId: 'r1-xor', port: 'out' }, to: { moduleId: 'join1', port: 'b' } },
        // feed round 2
        { from: { moduleId: 'join1', port: 'out' }, to: { moduleId: 'split2', port: 'in' } },
        // F-function round 2: F(R1, K2) = SBox(R1 XOR K2)
        { from: { moduleId: 'split2', port: 'right' }, to: { moduleId: 'f2-xor', port: 'a' } },
        { from: { moduleId: 'key2', port: 'out' }, to: { moduleId: 'f2-xor', port: 'b' } },
        { from: { moduleId: 'f2-xor', port: 'out' }, to: { moduleId: 'f2-sbox', port: 'in' } },
        // new right = L1 XOR F2
        { from: { moduleId: 'f2-sbox', port: 'out' }, to: { moduleId: 'r2-xor', port: 'a' } },
        { from: { moduleId: 'split2', port: 'left' }, to: { moduleId: 'r2-xor', port: 'b' } },
        // Feistel swap: new left = R1, new right = L1 XOR F2
        { from: { moduleId: 'split2', port: 'right' }, to: { moduleId: 'join2', port: 'a' } },
        { from: { moduleId: 'r2-xor', port: 'out' }, to: { moduleId: 'join2', port: 'b' } },
        { from: { moduleId: 'join2', port: 'out' }, to: { moduleId: 'output', port: 'in' } },
      ],
    },
    layout: {
      // inputs
      block:   { x: 48,   y: 240 },
      key1:    { x: 48,   y: 48  },
      key2:    { x: 1100, y: 48  },
      // round 1
      split1:  { x: 280,  y: 240 },
      'f1-xor':  { x: 500,  y: 100 },
      'f1-sbox': { x: 720,  y: 100 },
      'r1-xor':  { x: 720,  y: 380 },
      join1:   { x: 940,  y: 240 },
      // round 2
      split2:  { x: 1160, y: 240 },
      'f2-xor':  { x: 1380, y: 100 },
      'f2-sbox': { x: 1600, y: 100 },
      'r2-xor':  { x: 1600, y: 380 },
      join2:   { x: 1820, y: 240 },
      output:  { x: 2060, y: 240 },
    },
  },
];

export function getDefaultDemoProject(projects: DemoProject[]): DemoProject | null {
  const sortedProjects = [...projects].sort(compareLearningItems);
  return sortedProjects.find((project) => isCoreLearningItem(project)) ?? sortedProjects[0] ?? null;
}

export function runDemoProject(project: Project, registry: ModuleRegistry = V1_REGISTRY): ExecutionResult {
  return executeProject(project, registry);
}
