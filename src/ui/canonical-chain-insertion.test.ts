import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import {
  buildInsertChainTemplates,
  getCanonicalChainDefinition,
  getMatchingCanonicalChains,
  getMatchingCanonicalChainsForTarget,
  getMatchingCanonicalRepairChains,
} from './canonical-chain-insertion';

describe('canonical chain insertion', () => {
  it('matches the ASCII bridge chain for symbol sequences', () => {
    const matches = getMatchingCanonicalChains({
      sourceType: 'symbol',
      sourceKind: 'sequence',
      registry: V1_REGISTRY,
    });

    expect(matches.map((chain) => chain.id)).toEqual([
      'ascii-sequence-to-bit-words',
      'expand-key-to-bit-words',
    ]);
  });

  it('can exclude reference-aware chains when only linear chains should be shown', () => {
    const matches = getMatchingCanonicalChains({
      sourceType: 'symbol',
      sourceKind: 'sequence',
      registry: V1_REGISTRY,
      includeReferenceAware: false,
    });

    expect(matches.map((chain) => chain.id)).toEqual(['ascii-sequence-to-bit-words']);
  });

  it('matches both collector chains for ticked bit outputs in alphabetical order', () => {
    const matches = getMatchingCanonicalChains({
      sourceType: 'bits',
      sourceKind: 'scalar',
      registry: V1_REGISTRY,
    });

    expect(matches.map((chain) => chain.label)).toEqual([
      'Collect ticked bits -> ASCII',
      'Collect ticked bits -> hex',
    ]);
  });

  it('matches only the chain that fully solves a failed source-target pair', () => {
    const asciiRepair = getMatchingCanonicalRepairChains({
      sourceType: 'symbol',
      sourceKind: 'sequence',
      targetType: 'bits',
      targetKind: 'scalar',
      registry: V1_REGISTRY,
    });
    const collectorRepair = getMatchingCanonicalRepairChains({
      sourceType: 'bits',
      sourceKind: 'scalar',
      targetType: 'symbol',
      targetKind: 'sequence',
      registry: V1_REGISTRY,
    });
    const noRepair = getMatchingCanonicalRepairChains({
      sourceType: 'bits',
      sourceKind: 'scalar',
      targetType: 'bits',
      targetKind: 'scalar',
      registry: V1_REGISTRY,
    });

    expect(asciiRepair.map((chain) => chain.id)).toEqual(['ascii-sequence-to-bit-words']);
    expect(collectorRepair.map((chain) => chain.label)).toEqual([
      'Collect ticked bits -> ASCII',
      'Collect ticked bits -> hex',
    ]);
    expect(noRepair).toEqual([]);
  });

  it('matches canonical chains that can feed a hovered target input', () => {
    const bitWordTargetMatches = getMatchingCanonicalChainsForTarget({
      targetType: 'bits',
      targetKind: 'scalar',
      registry: V1_REGISTRY,
    });
    const symbolSequenceTargetMatches = getMatchingCanonicalChainsForTarget({
      targetType: 'symbol',
      targetKind: 'sequence',
      registry: V1_REGISTRY,
    });

    expect(bitWordTargetMatches.map((chain) => chain.id)).toEqual(['ascii-sequence-to-bit-words']);
    expect(symbolSequenceTargetMatches.map((chain) => chain.label)).toEqual([
      'Collect ticked bits -> ASCII',
      'Collect ticked bits -> hex',
    ]);
    expect(getCanonicalChainDefinition('ascii-sequence-to-bit-words')?.label).toBe(
      'ASCII sequence -> bit words',
    );
    expect(getCanonicalChainDefinition('expand-key-to-bit-words')?.requiresReferenceChoice).toBe(
      true,
    );
  });

  it('builds a forward horizontal lane for inserted modules', () => {
    const chain = getMatchingCanonicalChains({
      sourceType: 'symbol',
      sourceKind: 'sequence',
      registry: V1_REGISTRY,
    })[0];

    if (!chain) {
      throw new Error('Expected ASCII chain to exist.');
    }

    const templates = buildInsertChainTemplates({
      chain,
      canvasPosition: { x: 200, y: 160 },
      layoutDirection: 'horizontal',
    });

    expect(templates.modules.map((module) => module.defId)).toEqual([
      'AsciiSequenceToTicked',
      'AsciiCharToBits',
    ]);
    expect(templates.modules.map((module) => module.position)).toEqual([
      { x: 200, y: 160 },
      { x: 420, y: 160 },
    ]);
    expect(templates.connections).toEqual([
      { fromIndex: 0, fromPort: 'out', toIndex: 1, toPort: 'in' },
    ]);
  });
});
