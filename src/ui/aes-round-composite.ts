import type { CompositeDef } from '../engine/composites';
import type { Project } from '../engine/types';
import { parseSBoxTable, serializeSBoxTable } from '../engine/modules/s-box';
import { generateSBoxTable, getSBoxGenerationShape } from './sbox-transforms';

const AES_SBOX_TABLE = serializeSBoxTable(generateSBoxTable(getSBoxGenerationShape(8, 8), 'aes'));

const IDENTITY_128 = Array.from({ length: 128 }, (_, i) => i).join(',');

function buildAesCompositeShiftRowsOrder(): string {
  const order: number[] = [];
  const rowShifts = [0, 1, 2, 3];
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      const sourceColumn = (column + rowShifts[row]) % 4;
      const sourceByteIndex = sourceColumn * 4 + row;
      for (let bit = 0; bit < 8; bit++) {
        order.push(sourceByteIndex * 8 + bit);
      }
    }
  }
  return order.join(',');
}

const AES_COMPOSITE_SHIFT_ROWS_ORDER = buildAesCompositeShiftRowsOrder();

const MIX_COLUMNS_COEFFICIENTS = [
  [2, 3, 1, 1],
  [1, 2, 3, 1],
  [1, 1, 2, 3],
  [3, 1, 1, 2],
] as const;

function buildBitJoinTree(
  modules: Project['modules'],
  connections: Project['connections'],
  layout: Record<string, { x: number; y: number }>,
  sourceIds: string[],
  prefix: string,
  baseX: number,
): string {
  let currentLevel = [...sourceIds];
  let levelIndex = 0;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let pairIndex = 0; pairIndex < currentLevel.length; pairIndex += 2) {
      const joinId = `${prefix}-${levelIndex}-${pairIndex / 2}`;
      modules.push({ id: joinId, defId: 'BitJoin', params: {} });
      connections.push({
        from: { moduleId: currentLevel[pairIndex], port: 'out' },
        to: { moduleId: joinId, port: 'a' },
      });
      connections.push({
        from: { moduleId: currentLevel[pairIndex + 1], port: 'out' },
        to: { moduleId: joinId, port: 'b' },
      });
      const leftPos = layout[currentLevel[pairIndex]];
      const rightPos = layout[currentLevel[pairIndex + 1]];
      layout[joinId] = {
        x: baseX + levelIndex * 120,
        y: ((leftPos?.y ?? 0) + (rightPos?.y ?? 0)) / 2,
      };
      nextLevel.push(joinId);
    }
    currentLevel = nextLevel;
    levelIndex++;
  }
  return currentLevel[0];
}

export function buildAesRoundCompositeDef(): CompositeDef {
  const modules: Project['modules'] = [];
  const connections: Project['connections'] = [];
  const layout: Record<string, { x: number; y: number }> = {};

  // Input receivers — external state and roundKey arrive via inputBindings
  modules.push({ id: 'state-pass', defId: 'Permutation', params: { order: IDENTITY_128 } });
  modules.push({ id: 'key-pass', defId: 'Permutation', params: { order: IDENTITY_128 } });
  layout['state-pass'] = { x: 80, y: 260 };
  layout['key-pass'] = { x: 3600, y: 260 };

  // State byte extractors + SubBytes (16 bytes)
  const subByteIds: string[] = [];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      const flatIndex = col * 4 + row;
      const stateByteId = `state-byte-${row}-${col}`;
      const sboxId = `sub-${row}-${col}`;
      modules.push({ id: stateByteId, defId: 'BitWindow', params: { start: flatIndex * 8, width: 8 } });
      modules.push({ id: sboxId, defId: 'SBox', params: { table: AES_SBOX_TABLE } });
      connections.push({ from: { moduleId: 'state-pass', port: 'out' }, to: { moduleId: stateByteId, port: 'in' } });
      connections.push({ from: { moduleId: stateByteId, port: 'out' }, to: { moduleId: sboxId, port: 'in' } });
      layout[stateByteId] = { x: 300 + col * 120, y: 80 + row * 120 };
      layout[sboxId] = { x: 540 + col * 120, y: 80 + row * 120 };
      subByteIds.push(sboxId);
    }
  }

  // BitJoin tree: 16 SubBytes outputs → bits[128]
  const subJoinRootId = buildBitJoinTree(modules, connections, layout, subByteIds, 'sub-join', 820);

  // ShiftRows
  modules.push({ id: 'shift-rows', defId: 'Permutation', params: { order: AES_COMPOSITE_SHIFT_ROWS_ORDER } });
  connections.push({ from: { moduleId: subJoinRootId, port: 'out' }, to: { moduleId: 'shift-rows', port: 'in' } });
  layout['shift-rows'] = { x: 1340, y: 260 };

  // Post-ShiftRows byte extractors (16 bytes)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      const shiftByteId = `shift-byte-${row}-${col}`;
      modules.push({ id: shiftByteId, defId: 'BitWindow', params: { start: (col * 4 + row) * 8, width: 8 } });
      connections.push({ from: { moduleId: 'shift-rows', port: 'out' }, to: { moduleId: shiftByteId, port: 'in' } });
      layout[shiftByteId] = { x: 1560 + col * 120, y: 80 + row * 120 };
    }
  }

  // Round key byte extractors (16 bytes)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      const keyByteId = `key-byte-${row}-${col}`;
      modules.push({ id: keyByteId, defId: 'BitWindow', params: { start: (col * 4 + row) * 8, width: 8 } });
      connections.push({ from: { moduleId: 'key-pass', port: 'out' }, to: { moduleId: keyByteId, port: 'in' } });
      layout[keyByteId] = { x: 3600 + col * 120, y: 80 + row * 120 };
    }
  }

  // MixColumns (4 column groups) + AddRoundKey (16 XOR)
  const arkIds: string[] = [];
  for (let col = 0; col < 4; col++) {
    const const2Id = `mix-const2-${col}`;
    const const3Id = `mix-const3-${col}`;
    modules.push({ id: const2Id, defId: 'HexSource', params: { value: '02' } });
    modules.push({ id: const3Id, defId: 'HexSource', params: { value: '03' } });
    layout[const2Id] = { x: 1820 + col * 440, y: 20 };
    layout[const3Id] = { x: 1820 + col * 440, y: 620 };

    const colInputIds = [
      `shift-byte-0-${col}`,
      `shift-byte-1-${col}`,
      `shift-byte-2-${col}`,
      `shift-byte-3-${col}`,
    ];

    for (let row = 0; row < 4; row++) {
      const terms: string[] = [];
      for (let srcRow = 0; srcRow < 4; srcRow++) {
        const coeff = MIX_COLUMNS_COEFFICIENTS[row][srcRow];
        if (coeff === 1) {
          terms.push(colInputIds[srcRow]);
          continue;
        }
        const mulId = `mix-c${col}-r${row}-m${srcRow}`;
        modules.push({ id: mulId, defId: 'GF2Mul', params: { poly: '11B' } });
        connections.push({
          from: { moduleId: colInputIds[srcRow], port: 'out' },
          to: { moduleId: mulId, port: 'a' },
        });
        connections.push({
          from: { moduleId: coeff === 2 ? const2Id : const3Id, port: 'out' },
          to: { moduleId: mulId, port: 'b' },
        });
        layout[mulId] = { x: 2000 + col * 440, y: 80 + row * 140 + srcRow * 24 };
        terms.push(mulId);
      }

      const xor0Id = `mix-c${col}-r${row}-xor0`;
      const xor1Id = `mix-c${col}-r${row}-xor1`;
      const xor2Id = `mix-c${col}-r${row}-xor2`;
      const arkId = `ark-${row}-${col}`;

      modules.push({ id: xor0Id, defId: 'XOR', params: {} });
      modules.push({ id: xor1Id, defId: 'XOR', params: {} });
      modules.push({ id: xor2Id, defId: 'XOR', params: {} });
      modules.push({ id: arkId, defId: 'XOR', params: {} });

      connections.push({ from: { moduleId: terms[0], port: 'out' }, to: { moduleId: xor0Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[1], port: 'out' }, to: { moduleId: xor0Id, port: 'b' } });
      connections.push({ from: { moduleId: xor0Id, port: 'out' }, to: { moduleId: xor1Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[2], port: 'out' }, to: { moduleId: xor1Id, port: 'b' } });
      connections.push({ from: { moduleId: xor1Id, port: 'out' }, to: { moduleId: xor2Id, port: 'a' } });
      connections.push({ from: { moduleId: terms[3], port: 'out' }, to: { moduleId: xor2Id, port: 'b' } });
      connections.push({ from: { moduleId: xor2Id, port: 'out' }, to: { moduleId: arkId, port: 'a' } });
      connections.push({
        from: { moduleId: `key-byte-${row}-${col}`, port: 'out' },
        to: { moduleId: arkId, port: 'b' },
      });

      layout[xor0Id] = { x: 2240 + col * 440, y: 80 + row * 140 };
      layout[xor1Id] = { x: 2460 + col * 440, y: 80 + row * 140 };
      layout[xor2Id] = { x: 2680 + col * 440, y: 80 + row * 140 };
      layout[arkId] = { x: 3840 + col * 120, y: 80 + row * 120 };

      arkIds.push(arkId);
    }
  }

  // Final BitJoin tree: 16 ARK outputs → bits[128] (the composite output)
  const finalJoinRootId = buildBitJoinTree(modules, connections, layout, arkIds, 'final-join', 4080);

  return {
    id: 'AesRound',
    name: 'AES Round',
    kind: 'composite',
    version: 1,
    inputs: [
      { name: 'state', type: 'bits' },
      { name: 'roundKey', type: 'bits' },
    ],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    project: { modules, connections },
    layout,
    inputBindings: [
      { externalPort: 'state', internalModuleId: 'state-pass', internalPort: 'in' },
      { externalPort: 'roundKey', internalModuleId: 'key-pass', internalPort: 'in' },
    ],
    outputBindings: [
      { externalPort: 'out', internalModuleId: finalJoinRootId, internalPort: 'out' },
    ],
    purpose:
      'One full AES round (SubBytes → ShiftRows → MixColumns → AddRoundKey) accepting a 128-bit state and 128-bit round key, producing a 128-bit output. FIPS 197 Appendix B Round 1 verified when chained with the aes-4-round demo.',
  };
}

/** Compute the AES-128 key schedule from a 16-byte key, returning 11 round keys. */
export function computeAes128KeySchedule(keyBytes: number[]): number[][] {
  const AES_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
  const sbox = parseSBoxTable(AES_SBOX_TABLE);

  const words: number[][] = [];
  for (let i = 0; i < 4; i++) {
    words.push([keyBytes[i * 4], keyBytes[i * 4 + 1], keyBytes[i * 4 + 2], keyBytes[i * 4 + 3]]);
  }

  for (let i = 4; i < 44; i++) {
    let temp = [...words[i - 1]];
    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]];
      temp = temp.map((b) => sbox[b]);
      temp[0] ^= AES_RCON[i / 4 - 1];
    }
    words.push(words[i - 4].map((b, j) => b ^ temp[j]));
  }

  const roundKeys: number[][] = [];
  for (let r = 0; r < 11; r++) {
    const rk: number[] = [];
    for (let j = 0; j < 4; j++) {
      rk.push(...words[r * 4 + j]);
    }
    roundKeys.push(rk);
  }
  return roundKeys;
}

/** Convert a 16-byte round key (column-major) to a 32-char hex string for HexSource. */
export function roundKeyToHexString(rkBytes: number[]): string {
  return rkBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}
