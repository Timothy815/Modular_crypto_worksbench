import type { ModuleRegistry, PortKind, SignalType } from '../engine/types';
import type { WorkbenchLayoutDirection } from './workbench-document';

export interface ChainPortShape {
  type: SignalType;
  kind: PortKind;
}

export interface CanonicalChainModuleTemplate {
  defId: string;
  params?: Record<string, unknown>;
}

export interface CanonicalChainDefinition {
  id: string;
  label: string;
  description: string;
  startPortShape: ChainPortShape;
  endPortShape: ChainPortShape;
  modules: CanonicalChainModuleTemplate[];
}

export interface InsertChainModuleTemplate extends CanonicalChainModuleTemplate {
  position: { x: number; y: number };
}

export interface InsertChainConnectionTemplate {
  fromIndex: number;
  fromPort: string;
  toIndex: number;
  toPort: string;
}

export const CANONICAL_CHAIN_INSERTION_GAP = 220;

export const CANONICAL_CHAIN_DEFINITIONS: CanonicalChainDefinition[] = [
  {
    id: 'ascii-sequence-to-bit-words',
    label: 'ASCII sequence -> bit words',
    description: 'Common chain · AsciiSequenceToTicked -> AsciiCharToBits',
    startPortShape: { type: 'symbol', kind: 'sequence' },
    endPortShape: { type: 'bits', kind: 'scalar' },
    modules: [
      { defId: 'AsciiSequenceToTicked' },
      { defId: 'AsciiCharToBits' },
    ],
  },
  {
    id: 'collect-ticked-bits-to-ascii',
    label: 'Collect ticked bits -> ASCII',
    description: 'Common chain · TickedBitsToSequence -> BitsToAscii',
    startPortShape: { type: 'bits', kind: 'scalar' },
    endPortShape: { type: 'symbol', kind: 'sequence' },
    modules: [
      { defId: 'TickedBitsToSequence' },
      { defId: 'BitsToAscii' },
    ],
  },
  {
    id: 'collect-ticked-bits-to-hex',
    label: 'Collect ticked bits -> hex',
    description: 'Common chain · TickedBitsToSequence -> BitsToHex',
    startPortShape: { type: 'bits', kind: 'scalar' },
    endPortShape: { type: 'symbol', kind: 'sequence' },
    modules: [
      { defId: 'TickedBitsToSequence' },
      { defId: 'BitsToHex' },
    ],
  },
];

export function getPortKindSignature(kind: PortKind | undefined): PortKind {
  return kind ?? 'scalar';
}

export function getMatchingCanonicalChains({
  sourceType,
  sourceKind,
  registry,
}: {
  sourceType: SignalType;
  sourceKind: PortKind;
  registry: ModuleRegistry;
}) {
  return CANONICAL_CHAIN_DEFINITIONS
    .filter(
      (chain) =>
        chain.startPortShape.type === sourceType &&
        chain.startPortShape.kind === sourceKind &&
        chain.modules.every((moduleTemplate) => registry[moduleTemplate.defId]),
    )
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getMatchingCanonicalRepairChains({
  sourceType,
  sourceKind,
  targetType,
  targetKind,
  registry,
}: {
  sourceType: SignalType;
  sourceKind: PortKind;
  targetType: SignalType;
  targetKind: PortKind;
  registry: ModuleRegistry;
}) {
  return CANONICAL_CHAIN_DEFINITIONS
    .filter(
      (chain) =>
        chain.startPortShape.type === sourceType &&
        chain.startPortShape.kind === sourceKind &&
        chain.endPortShape.type === targetType &&
        chain.endPortShape.kind === targetKind &&
        chain.modules.every((moduleTemplate) => registry[moduleTemplate.defId]),
    )
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function buildInsertChainTemplates({
  chain,
  canvasPosition,
  layoutDirection,
}: {
  chain: CanonicalChainDefinition;
  canvasPosition: { x: number; y: number };
  layoutDirection: WorkbenchLayoutDirection;
}) {
  const modules: InsertChainModuleTemplate[] = chain.modules.map((moduleTemplate, index) => ({
    ...moduleTemplate,
    position:
      layoutDirection === 'vertical'
        ? {
            x: canvasPosition.x,
            y: canvasPosition.y + index * CANONICAL_CHAIN_INSERTION_GAP,
          }
        : {
            x: canvasPosition.x + index * CANONICAL_CHAIN_INSERTION_GAP,
            y: canvasPosition.y,
          },
  }));

  const connections: InsertChainConnectionTemplate[] = chain.modules
    .slice(0, -1)
    .map((_, index) => ({
      fromIndex: index,
      fromPort: 'out',
      toIndex: index + 1,
      toPort: 'in',
    }));

  return { modules, connections };
}
