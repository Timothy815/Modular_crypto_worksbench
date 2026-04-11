import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import {
  MODULE_LIBRARY_SECTIONS,
  getModuleLibrarySectionId,
  getModuleRoleDetail,
  getModuleRoleSummary,
  getModuleLibrarySortOrder,
  matchesModuleDomainTab,
  matchesModuleSearch,
} from './module-library';

describe('module library palette coherence', () => {
  it('keeps the palette bounded to ten top-level sections', () => {
    expect(MODULE_LIBRARY_SECTIONS).toHaveLength(10);
  });

  it('moves protocol context inputs out of generic inputs and outputs', () => {
    expect(getModuleLibrarySectionId(V1_REGISTRY.IV)).toBe('protocol-context');
    expect(getModuleLibrarySectionId(V1_REGISTRY.Nonce)).toBe('protocol-context');
    expect(getModuleLibrarySectionId(V1_REGISTRY.Salt)).toBe('protocol-context');

    expect(getModuleLibrarySectionId(V1_REGISTRY.TextInput)).toBe('inputs-outputs');
    expect(getModuleLibrarySectionId(V1_REGISTRY.BitSource)).toBe('inputs-outputs');
    expect(getModuleLibrarySectionId(V1_REGISTRY.Output)).toBe('inputs-outputs');
    expect(getModuleLibrarySectionId(V1_REGISTRY.BitOutput)).toBe('inputs-outputs');
  });

  it('separates modular arithmetic from general bit logic', () => {
    expect(getModuleLibrarySectionId(V1_REGISTRY.XOR)).toBe('bit-logic');
    expect(getModuleLibrarySectionId(V1_REGISTRY.Gate)).toBe('bit-logic');
    expect(getModuleLibrarySectionId(V1_REGISTRY.ModExp)).toBe('number-theory');
    expect(getModuleLibrarySectionId(V1_REGISTRY.ModInverse)).toBe('number-theory');
  });

  it('keeps the bit tab aligned with the new section families', () => {
    expect(matchesModuleDomainTab(V1_REGISTRY.XOR, 'bit')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.ModExp, 'bit')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.BitSplit, 'bit')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.SBox, 'bit')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.LFSR, 'bit')).toBe(true);

    expect(matchesModuleDomainTab(V1_REGISTRY.IV, 'bit')).toBe(false);
    expect(matchesModuleDomainTab(V1_REGISTRY.SymbolToBits, 'bit')).toBe(false);
  });

  it('preserves explicit input and output tab behavior for protocol context modules', () => {
    expect(matchesModuleDomainTab(V1_REGISTRY.IV, 'inputs')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.Nonce, 'inputs')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.Salt, 'inputs')).toBe(true);
    expect(matchesModuleDomainTab(V1_REGISTRY.Clock, 'inputs')).toBe(true);

    expect(matchesModuleDomainTab(V1_REGISTRY.IV, 'outputs')).toBe(false);
    expect(matchesModuleDomainTab(V1_REGISTRY.Output, 'outputs')).toBe(true);
  });

  it('uses stable intentional ordering inside a section', () => {
    expect(getModuleLibrarySortOrder(V1_REGISTRY.XOR)).toBeLessThan(getModuleLibrarySortOrder(V1_REGISTRY.AND));
    expect(getModuleLibrarySortOrder(V1_REGISTRY.AND)).toBeLessThan(getModuleLibrarySortOrder(V1_REGISTRY.AddMod));
    expect(getModuleLibrarySortOrder(V1_REGISTRY.ModExp)).toBeLessThan(getModuleLibrarySortOrder(V1_REGISTRY.ModInverse));
    expect(getModuleLibrarySortOrder(V1_REGISTRY.BitJoin)).toBeLessThan(getModuleLibrarySortOrder(V1_REGISTRY.BitSplit));
  });

  it('keeps old and new search vocabulary for reassigned modules', () => {
    expect(matchesModuleSearch(V1_REGISTRY.IV, 'protocol')).toBe(true);
    expect(matchesModuleSearch(V1_REGISTRY.SBox, 'diffusion')).toBe(true);
    expect(matchesModuleSearch(V1_REGISTRY.BitSplit, 'framing')).toBe(true);
    expect(matchesModuleSearch(V1_REGISTRY.BitSplit, 'feistel')).toBe(true);
  });

  it('assigns stable workflow roles to pipeline-critical modules', () => {
    expect(getModuleRoleSummary(V1_REGISTRY.HexSource)).toEqual({
      role: 'Source',
      detail: 'graph entry point',
    });
    expect(getModuleRoleSummary(V1_REGISTRY.AsciiSequenceToTicked)).toEqual({
      role: 'Bridge',
      detail: 'whole sequence -> one per tick',
      typicalPath: 'Typical path: whole ASCII source → this bridge → AsciiCharToBits → operator → collector',
    });
    expect(getModuleRoleSummary(V1_REGISTRY.TickedBitsToSequence)).toEqual({
      role: 'Collector',
      detail: 'one per tick -> whole sequence',
      typicalPath: 'Typical path: ticked operator output → this collector → representation bridge or sink',
    });
    expect(getModuleRoleSummary(V1_REGISTRY.RepeatBitsToMatch)).toEqual({
      role: 'Mismatch Helper',
      detail: 'repair visible reference length mismatch',
      typicalPath: 'Typical path: short bit key → this mismatch helper → BitsSequenceToTicked → operator',
    });
    expect(getModuleRoleSummary(V1_REGISTRY.RequireBitsLengthMatch)).toEqual({
      role: 'Mismatch Helper',
      detail: 'require exact visible reference length',
      typicalPath:
        'Stops the graph loudly if bit widths differ. Use when a mismatch must never proceed silently — place a repair mismatch helper upstream if normalization is the intent instead.',
    });
    expect(getModuleRoleSummary(V1_REGISTRY.BitOutput)).toEqual({
      role: 'Sink',
      detail: 'final endpoint for the visible result',
    });
  });

  it('keeps ordinary transformation stages labeled as operators', () => {
    expect(getModuleRoleSummary(V1_REGISTRY.XOR)).toEqual({
      role: 'Operator',
      detail: 'visible transformation stage',
    });
    expect(getModuleRoleDetail(V1_REGISTRY.BitsSequenceToTicked)).toBe('whole sequence -> fixed-width word per tick');
  });
});
