import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import { getPaletteContextRank } from './palette-wayfinding';

describe('palette wayfinding context ranking', () => {
  it('prefers modules whose outputs match a hovered input port', () => {
    const context = {
      hoveredInputPort: {
        moduleId: 'xor-1',
        defId: 'XOR',
        port: 'a',
        type: 'bits',
      },
    };

    expect(getPaletteContextRank(V1_REGISTRY.AsciiCharToBits, context)).toBeGreaterThan(
      getPaletteContextRank(V1_REGISTRY.TextInput, context),
    );
    expect(getPaletteContextRank(V1_REGISTRY.BitSource, context)).toBeGreaterThan(
      getPaletteContextRank(V1_REGISTRY.Output, context),
    );
  });

  it('gives extra weight to known chain adjacency when the target def is known', () => {
    const context = {
      hoveredInputPort: {
        moduleId: 'xor-1',
        defId: 'XOR',
        port: 'a',
        type: 'bits',
      },
    };

    expect(getPaletteContextRank(V1_REGISTRY.AsciiCharToBits, context)).toBeGreaterThan(
      getPaletteContextRank(V1_REGISTRY.IV, context),
    );
  });

  it('prefers compatible drop targets when a pending connection is active', () => {
    const context = {
      pendingConnectionSourceType: 'bits',
    };

    expect(getPaletteContextRank(V1_REGISTRY.XOR, context)).toBeGreaterThan(0);
    expect(getPaletteContextRank(V1_REGISTRY.TextOutput, context)).toBe(0);
  });
});

