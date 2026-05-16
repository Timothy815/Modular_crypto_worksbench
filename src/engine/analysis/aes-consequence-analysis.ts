import type { BitsSignal } from '../types';

export interface AesConsequenceStageAnalysis {
  label: string;
  canonicalHex: string;
  perturbedHex: string;
  changedBytes: number;
  matches: boolean;
}

export interface AesConsequenceAnalysis {
  ruleChanged: string;
  claimBoundary: string;
  firstDivergenceLabel: string | null;
  firstDivergenceSummary: string;
  hasAnyDifference: boolean;
  stages: [AesConsequenceStageAnalysis, AesConsequenceStageAnalysis];
}

export interface AesConsequenceAnalysisParams {
  stage0Label?: unknown;
  stage1Label?: unknown;
  ruleChanged?: unknown;
  claimBoundary?: unknown;
  canonicalStage0?: BitsSignal;
  perturbedStage0?: BitsSignal;
  canonicalStage1?: BitsSignal;
  perturbedStage1?: BitsSignal;
}

function expectStringParam(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`AES Consequence Summary requires ${field} to be a non-empty string.`);
  }
  return value.trim();
}

function expectAesState(signal: BitsSignal | undefined, field: string): number[] {
  if (!signal || signal.type !== 'bits') {
    throw new Error(`AES Consequence Summary requires ${field} to be a bits signal.`);
  }
  if (signal.value.length !== 128) {
    throw new Error(`AES Consequence Summary requires ${field} to be exactly 128 bits.`);
  }
  return signal.value;
}

function bitsToHex(bits: number[]): string {
  let hex = '';
  for (let index = 0; index < bits.length; index += 4) {
    const nibble = bits.slice(index, index + 4).join('');
    hex += Number.parseInt(nibble, 2).toString(16).toUpperCase();
  }
  return hex;
}

function countChangedBytes(left: number[], right: number[]): number {
  let changed = 0;
  for (let index = 0; index < 128; index += 8) {
    const leftByte = left.slice(index, index + 8).join('');
    const rightByte = right.slice(index, index + 8).join('');
    if (leftByte !== rightByte) {
      changed += 1;
    }
  }
  return changed;
}

function buildStage(
  label: string,
  canonicalBits: number[],
  perturbedBits: number[],
): AesConsequenceStageAnalysis {
  const changedBytes = countChangedBytes(canonicalBits, perturbedBits);
  return {
    label,
    canonicalHex: bitsToHex(canonicalBits),
    perturbedHex: bitsToHex(perturbedBits),
    changedBytes,
    matches: changedBytes === 0,
  };
}

export function computeAesConsequenceAnalysis(params: AesConsequenceAnalysisParams): AesConsequenceAnalysis {
  const stage0Label = expectStringParam(params.stage0Label, 'stage0Label');
  const stage1Label = expectStringParam(params.stage1Label, 'stage1Label');
  const ruleChanged = expectStringParam(params.ruleChanged, 'ruleChanged');
  const claimBoundary = expectStringParam(params.claimBoundary, 'claimBoundary');

  const stage0 = buildStage(
    stage0Label,
    expectAesState(params.canonicalStage0, 'canonicalStage0'),
    expectAesState(params.perturbedStage0, 'perturbedStage0'),
  );
  const stage1 = buildStage(
    stage1Label,
    expectAesState(params.canonicalStage1, 'canonicalStage1'),
    expectAesState(params.perturbedStage1, 'perturbedStage1'),
  );

  const firstDivergence = [stage0, stage1].find((stage) => !stage.matches) ?? null;

  return {
    ruleChanged,
    claimBoundary,
    firstDivergenceLabel: firstDivergence?.label ?? null,
    firstDivergenceSummary: firstDivergence
      ? `${firstDivergence.label} is the first tracked stage where the canonical and perturbed branches differ.`
      : 'No divergence: the tracked canonical and perturbed stages currently match.',
    hasAnyDifference: firstDivergence !== null,
    stages: [stage0, stage1],
  };
}

