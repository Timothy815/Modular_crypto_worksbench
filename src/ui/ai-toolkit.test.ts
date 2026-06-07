import { describe, expect, it } from 'vitest';

import { V1_REGISTRY } from '../engine/modules';
import { generateAiToolkitDocument, getAiToolkitFileName } from './ai-toolkit';

describe('generateAiToolkitDocument', () => {
  it('builds a single-file prompt pack with live registry content', () => {
    const document = generateAiToolkitDocument({ generatedAt: '2026-03-29' });
    const inventorySection =
      document
        .split('## Primitive Inventory\n\n')[1]
        ?.split('\n\n---\n\n## Minimal Workspace Example')[0] ?? '';

    expect(document).toContain('# MCW AI Toolkit');
    expect(document).toContain('Generated: 2026-03-29');
    expect(document).toContain('## Prompt Scaffold');
    expect(document).toContain('## Connection Rules');
    expect(document).toContain('## Signal Domains');
    expect(document).toContain('## Param Kinds');
    expect(document).toContain('## ECC Module Family');
    expect(document).toContain('## GF(2⁸) Field Arithmetic');
    expect(document).toContain('## Engine Types');
    expect(document).toContain('## Workspace Types');
    expect(document).toContain('## Challenge Types');
    expect(document).toContain('## Primitive Inventory');
    expect(document).toContain('## Minimal Workspace Example');
    expect(document).toContain('## ECC Workspace Example');
    expect(document).toContain('## GF(2⁸) Workspace Example');
    expect(document).toContain('## Challenge Example');

    expect(document).toContain('`XOR`');
    expect(document).toContain('`Rotor`');
    expect(document).toContain('`SymbolToBits`');
    expect(document).toContain('`HexOutput`');
    expect(document).toContain('`GF2Mul`');
    expect(document).toContain('`GF2Inv`');
    expect(document).toContain('`ScalarMultiply`');
    expect(document).toContain('`NamedCurveBasePoint`');
    expect(document).toContain('`BitsToInteger`');

    expect(document).toContain('export interface WorkbenchDocument');
    expect(document).toContain('export interface GuidedChallenge');
    expect(document).toContain('bigint-hex');
    expect(document).toContain('ec-point');
    expect(document).toContain('secp256k1');
    expect(document).toContain('11B');

    expect(inventorySection.split('\n').filter((line) => line.startsWith('- `')).length).toBe(
      Object.keys(V1_REGISTRY).length,
    );
  });

  it('uses a stable markdown file name', () => {
    expect(getAiToolkitFileName()).toBe('mcw-ai-toolkit.md');
  });
});
