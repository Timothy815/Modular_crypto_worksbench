import type { CSSProperties } from 'react';

import { parsePlugboardWiring } from '../engine/modules/plugboard';
import { parseReflectorWiring } from '../engine/modules/reflector';
import { getSBoxShape, parseSBoxTable } from '../engine/modules/s-box';
import { serializeRotorWiring } from '../engine/modules/rotor';
import { formatUnsignedIntegerAsHex, parseUnsignedIntegerString } from '../engine/modules/integer-signal';
import { computeSBoxAnalysis } from '../engine/analysis/sbox-analysis';
import type { SBoxAnalysis } from '../engine/analysis/sbox-analysis';
export type { SBoxAnalysis } from '../engine/analysis/sbox-analysis';
import { computePermutationAnalysis } from '../engine/analysis/permutation-analysis';
import type { PermutationAnalysis } from '../engine/analysis/permutation-analysis';
export type { PermutationAnalysis } from '../engine/analysis/permutation-analysis';
import { getLFSRAnalysisFromParams } from '../engine/analysis/lfsr-analysis';
export type { LFSRAnalysis } from '../engine/analysis/lfsr-analysis';
import { getPlugboardAnalysisFromParams, getReflectorAnalysisFromParams } from '../engine/analysis/plugboard-analysis';
export type { PlugboardAnalysis, ReflectorAnalysis } from '../engine/analysis/plugboard-analysis';
import { getModulusAnalysisFromParams } from '../engine/analysis/modexp-analysis';
export type { ModulusAnalysis } from '../engine/analysis/modexp-analysis';
import type {
  Connection,
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleRegistry,
  Project,
  ValidationIssue,
} from '../engine/types';
import { resolveTraceModuleInstance } from './transformation-resolver';
import type { ParameterComparisonFieldStatus } from './parameter-comparison';
import {
  buildSBoxDisplayOrder,
  getSBoxDisplayIndexForInputValue,
  getSBoxGridColumns,
} from './sbox-transforms';

export interface RoutingTransformationRow {
  inputIndex: number;
  inputValue: number | string;
  outputIndex: number;
  outputValue: number | string;
  inputY: number;
  outputY: number;
  color: string;
  kind: 'line' | 'fill';
}

interface XorTransformationRow {
  index: number;
  aBit: number;
  bBit: number;
  resultBit: number;
  explanation: 'same' | 'different';
}

export interface RoutingTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'routing';
  title: string;
  copy: string;
  configLabel: string | null;
  configValue: string | null;
  middleLabel: string;
  rows: RoutingTransformationRow[];
  inputLane: RoutingTransformationRow[];
  outputLane: RoutingTransformationRow[];
  svgHeight: number;
  summary: string;
}

interface XorTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'xor';
  title: string;
  copy: string;
  rows: XorTransformationRow[];
  summary: string;
}

interface CompareTransformationRow {
  index: number;
  aBit: number;
  bBit: number;
  explanation: 'same' | 'different';
}

interface CompareTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'compare';
  title: string;
  copy: string;
  ruleLabel: string;
  ruleValue: string;
  leftValue: number;
  rightValue: number;
  outputBit: number;
  rows: CompareTransformationRow[];
  summary: string;
}

interface GateTransformationRow {
  index: number;
  inputBit: number;
  outputBit: number;
}

interface GateTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'gate';
  title: string;
  copy: string;
  controlValue: number[];
  active: boolean;
  rows: GateTransformationRow[];
  summary: string;
}

interface MajorityTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'majority';
  title: string;
  copy: string;
  inputs: { label: string; bit: number }[];
  activeCount: number;
  outputBit: number;
  summary: string;
}

interface MuxTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'mux';
  title: string;
  copy: string;
  selectBit: number;
  aBit: number;
  bBit: number;
  outputBit: number;
  chosenInput: 'a' | 'b';
  summary: string;
}

interface DemuxTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'demux';
  title: string;
  copy: string;
  selectBit: number;
  inputBit: number;
  outputABit: number;
  outputBBit: number;
  chosenOutput: 'a' | 'b';
  summary: string;
}

interface LookupTransformationChunk {
  index: number;
  inputBits: number[];
  inputValue: number;
  outputValue: number;
  outputBits: number[];
}

interface LookupTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'lookup';
  title: string;
  copy: string;
  inputWidth: number;
  outputWidth: number;
  gridColumns: number;
  table: number[];
  displayOrder: number[];
  displayIndexByInputValue: number[];
  usesHexGrid: boolean;
  activeRowIndex: number | null;
  activeColumnIndex: number | null;
  chunks: LookupTransformationChunk[];
  summary: string;
  sboxAnalysis: SBoxAnalysis | null;
}

interface SplitTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'split';
  title: string;
  copy: string;
  inputBits: number[];
  leftWidth: number;
  leftBits: number[];
  rightBits: number[];
  summary: string;
}

interface PadTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'pad';
  title: string;
  copy: string;
  inputBits: number[];
  outputBits: number[];
  targetWidth: number;
  side: string;
  padBit: number;
  padCount: number;
  summary: string;
}

interface ArithmeticTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'arithmetic';
  title: string;
  copy: string;
  operationLabel: string;
  operationExpression: string;
  resultValue: number;
  inputBits: number[];
  outputBits: number[];
  summary: string;
}

interface IntegerArithmeticOperandView {
  label: string;
  decimal: string;
  hex: string;
}

interface IntegerArithmeticTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'integer-arithmetic';
  title: string;
  copy: string;
  operationLabel: string;
  operationExpression: string;
  operands: IntegerArithmeticOperandView[];
  modulusDecimal: string;
  modulusHex: string;
  resultDecimal: string;
  resultHex: string;
  summary: string;
}

interface UnpadTransformationView {
  entry: ExecutionTraceEntry;
  kind: 'unpad';
  title: string;
  copy: string;
  inputBits: number[];
  outputBits: number[];
  originalWidth: number;
  side: string;
  strippedCount: number;
  summary: string;
}

export type TransformationView =
  | RoutingTransformationView
  | XorTransformationView
  | CompareTransformationView
  | GateTransformationView
  | MajorityTransformationView
  | MuxTransformationView
  | DemuxTransformationView
  | LookupTransformationView
  | SplitTransformationView
  | PadTransformationView
  | ArithmeticTransformationView
  | IntegerArithmeticTransformationView
  | UnpadTransformationView;

export const PERMUTATION_EDITOR_PORT_HEIGHT = 52;
export const PERMUTATION_EDITOR_PORT_GAP = 10;
export const PERMUTATION_EDITOR_HEADER_OFFSET = 22;

export function measureWireLayout(
  inputLane: HTMLDivElement | null,
  outputLane: HTMLDivElement | null,
  inputButtons: Array<HTMLButtonElement | null>,
  outputButtons: Array<HTMLButtonElement | null>,
): { height: number; inputYs: number[]; outputYs: number[] } | null {
  if (!inputLane || !outputLane) {
    return null;
  }

  const inputLaneRect = inputLane.getBoundingClientRect();
  const outputLaneRect = outputLane.getBoundingClientRect();
  const inputYs = inputButtons
    .map((button) =>
      button
        ? button.getBoundingClientRect().top - inputLaneRect.top + button.getBoundingClientRect().height / 2
        : null,
    )
    .filter((value): value is number => value !== null);
  const outputYs = outputButtons
    .map((button) =>
      button
        ? button.getBoundingClientRect().top - outputLaneRect.top + button.getBoundingClientRect().height / 2
        : null,
    )
    .filter((value): value is number => value !== null);

  if (inputYs.length === 0 || outputYs.length === 0) {
    return null;
  }

  return {
    height: Math.max(inputLaneRect.height, outputLaneRect.height),
    inputYs,
    outputYs,
  };
}

export function getTransformationView(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): TransformationView | null {
  if (entry.defId === 'Permutation' || entry.defId === 'PermutationBits') {
    return getPermutationTransformation(entry, project, registry);
  }
  if (entry.defId === 'SymbolPermutation') {
    return getSymbolPermutationTransformation(entry, project, registry);
  }
  if (entry.defId === 'SymbolWindow') {
    return getSymbolWindowTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitShifter') {
    return getBitShifterTransformation(entry, project, registry);
  }
  if (entry.defId === 'XOR') {
    return getXorTransformation(entry);
  }
  if (entry.defId === 'Equals' || entry.defId === 'AtLeast' || entry.defId === 'GreaterThan') {
    return getCompareTransformation(entry);
  }
  if (entry.defId === 'Gate') {
    return getGateTransformation(entry);
  }
  if (entry.defId === 'Majority') {
    return getMajorityTransformation(entry);
  }
  if (entry.defId === 'Mux') {
    return getMuxTransformation(entry);
  }
  if (entry.defId === 'Demux') {
    return getDemuxTransformation(entry);
  }
  if (entry.defId === 'SBox') {
    return getSBoxTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitSplit') {
    return getSplitTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitPad') {
    return getPadTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitWindow') {
    return getBitWindowTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitSelect') {
    return getBitSelectTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitExpand') {
    return getBitExpandTransformation(entry, project, registry);
  }
  if (entry.defId === 'MulMod') {
    return getMulModTransformation(entry);
  }
  if (entry.defId === 'ModExp') {
    return getModExpTransformation(entry, project, registry);
  }
  if (entry.defId === 'ModInverse') {
    return getModInverseTransformation(entry, project, registry);
  }
  if (entry.defId === 'FieldAdd' || entry.defId === 'FieldSub' || entry.defId === 'FieldMul') {
    return getPrimeFieldBinaryTransformation(entry, project, registry);
  }
  if (entry.defId === 'FieldInverse') {
    return getPrimeFieldInverseTransformation(entry, project, registry);
  }
  if (entry.defId === 'BitUnpad') {
    return getUnpadTransformation(entry, project, registry);
  }
  return null;
}

export function stepHexString(value: string, delta: -1 | 1): string {
  const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
  const width = Math.max(2, normalized.length || 0);
  const modulus = 16 ** width;
  const currentValue = normalized.length === 0 ? 0 : Number.parseInt(normalized, 16);

  if (!Number.isFinite(currentValue)) {
    return '00';
  }

  const nextValue = (currentValue + delta + modulus) % modulus;
  return nextValue.toString(16).toUpperCase().padStart(width, '0');
}

function getPermutationTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const orderValue = resolved.instance.params.order;
  const order = parsePermutationOrder(orderValue);
  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const rows = order.map((sourceIndex, outputIndex) => ({
    inputIndex: sourceIndex,
    inputValue: inputSignal.value[sourceIndex] ?? 0,
    outputIndex,
    outputValue: outputSignal.value[outputIndex] ?? 0,
    kind: 'line' as const,
  }));
  const inputLane = [...rows].sort((left, right) => left.inputIndex - right.inputIndex);
  const outputLane = [...rows].sort((left, right) => left.outputIndex - right.outputIndex);
  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row) => ({
    ...row,
    inputY: laneOffset + inputLane.findIndex((candidate) => candidate.inputIndex === row.inputIndex) * laneStep,
    outputY:
      laneOffset + outputLane.findIndex((candidate) => candidate.outputIndex === row.outputIndex) * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  const inputLaneRows = [...rowsWithPositions].sort((left, right) => left.inputIndex - right.inputIndex);
  const outputLaneRows = [...rowsWithPositions].sort((left, right) => left.outputIndex - right.outputIndex);

  return {
    entry,
    kind: 'routing',
    title: 'Permutation Mapping',
    copy: 'This permutation reorders bit positions without changing the bit values themselves.',
    configLabel: 'Order',
    configValue: order.join(', '),
    middleLabel: 'Route',
    rows: rowsWithPositions,
    inputLane: inputLaneRows,
    outputLane: outputLaneRows,
    svgHeight,
    summary:
      rows.length === 0
        ? 'This permutation has no visible positions to remap.'
        : `Output position 0 reads input position ${rows[0]?.inputIndex}. Each wire shows where one input position lands in the output.`,
  };
}

function getSymbolPermutationTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const orderValue = resolved.instance.params.order;
  const order = parsePermutationOrder(orderValue);
  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'symbol' || outputSignal?.type !== 'symbol') {
    return null;
  }

  const inputSymbols = Array.from(inputSignal.value);
  const outputSymbols = Array.from(outputSignal.value);
  const rows = order.map((sourceIndex, outputIndex) => ({
    inputIndex: sourceIndex,
    inputValue: inputSymbols[sourceIndex] ?? '',
    outputIndex,
    outputValue: outputSymbols[outputIndex] ?? '',
    kind: 'line' as const,
  }));
  const inputLane = [...rows].sort((left, right) => left.inputIndex - right.inputIndex);
  const outputLane = [...rows].sort((left, right) => left.outputIndex - right.outputIndex);
  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row) => ({
    ...row,
    inputY: laneOffset + inputLane.findIndex((candidate) => candidate.inputIndex === row.inputIndex) * laneStep,
    outputY:
      laneOffset + outputLane.findIndex((candidate) => candidate.outputIndex === row.outputIndex) * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  return {
    entry,
    kind: 'routing',
    title: 'Symbol Permutation Mapping',
    copy: 'This symbol permutation reorders whole symbol positions without changing the symbols themselves.',
    configLabel: 'Order',
    configValue: order.join(', '),
    middleLabel: 'Route',
    rows: rowsWithPositions,
    inputLane: [...rowsWithPositions].sort((left, right) => left.inputIndex - right.inputIndex),
    outputLane: [...rowsWithPositions].sort((left, right) => left.outputIndex - right.outputIndex),
    svgHeight,
    summary:
      rows.length === 0
        ? 'This symbol permutation has no visible positions to remap.'
        : `Output position 0 reads input position ${rows[0]?.inputIndex}. The symbols stay the same; only their order changes.`,
  };
}

function getSymbolWindowTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'symbol' || output?.type !== 'symbol') {
    return null;
  }

  const inputSymbols = Array.from(input.value);
  const outputSymbols = Array.from(output.value);
  const start =
    typeof resolved.instance.params.start === 'number' && Number.isInteger(resolved.instance.params.start)
      ? resolved.instance.params.start
      : 0;
  const width =
    typeof resolved.instance.params.width === 'number' && Number.isInteger(resolved.instance.params.width)
      ? resolved.instance.params.width
      : outputSymbols.length;

  const rows = outputSymbols.map((outputValue, outputIndex) => {
    const inputIndex = start + outputIndex;
    return {
      inputIndex,
      inputValue: inputSymbols[inputIndex] ?? '',
      outputIndex,
      outputValue,
      kind: 'line' as const,
    };
  });
  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row, laneIndex) => ({
    ...row,
    inputY: laneOffset + laneIndex * laneStep,
    outputY: laneOffset + laneIndex * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  return {
    entry,
    kind: 'routing',
    title: 'Symbol Window Mapping',
    copy:
      'SymbolWindow extracts one contiguous slice from a larger visible symbol message. It does not permute or substitute symbols; it shows exactly which positions a downstream branch receives.',
    configLabel: 'Start / Width',
    configValue: `${start} / ${width}`,
    middleLabel: 'Slice',
    rows: rowsWithPositions,
    inputLane: rowsWithPositions,
    outputLane: rowsWithPositions,
    svgHeight,
    summary:
      rows.length === 0
        ? 'This SymbolWindow has no visible output symbols.'
        : `The output reads symbol positions ${start} through ${start + rows.length - 1} from the visible message.`,
  };
}

function getBitShifterTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const amountValue = resolved.instance.params.amount;
  const modeValue = resolved.instance.params.mode;
  const amount =
    typeof amountValue === 'number' && Number.isFinite(amountValue) ? Math.max(0, Math.trunc(amountValue)) : 0;
  const mode = typeof modeValue === 'string' ? modeValue : 'left';
  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const bitLength = Math.max(inputSignal.value.length, outputSignal.value.length);
  if (bitLength === 0) {
    return null;
  }

  const rows: RoutingTransformationRow[] = [];
  for (let outputIndex = 0; outputIndex < outputSignal.value.length; outputIndex += 1) {
    const sourceIndex = getBitShifterSourceIndex(outputIndex, inputSignal.value.length, amount, mode);
    rows.push({
      inputIndex: sourceIndex ?? outputIndex,
      inputValue: sourceIndex === null ? 0 : inputSignal.value[sourceIndex] ?? 0,
      outputIndex,
      outputValue: outputSignal.value[outputIndex] ?? 0,
      inputY: 0,
      outputY: 0,
      color: sourceIndex === null ? 'var(--muted)' : getPermutationWireColor(sourceIndex),
      kind: sourceIndex === null ? 'fill' : 'line',
    });
  }

  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(
    laneHeight,
    outputSignal.value.length * laneHeight + Math.max(0, outputSignal.value.length - 1) * laneGap,
  );

  const rowsWithPositions = rows.map((row) => ({
    ...row,
    inputY: row.kind === 'fill' ? laneOffset + row.outputIndex * laneStep : laneOffset + row.inputIndex * laneStep,
    outputY: laneOffset + row.outputIndex * laneStep,
  }));

  const inputLane = inputSignal.value.map((inputValue, inputIndex) => {
    const row = rowsWithPositions.find((candidate) => candidate.inputIndex === inputIndex && candidate.kind === 'line');
    return {
      inputIndex,
      inputValue,
      outputIndex: row?.outputIndex ?? inputIndex,
      outputValue: row?.outputValue ?? 0,
      inputY: laneOffset + inputIndex * laneStep,
      outputY: row?.outputY ?? laneOffset + inputIndex * laneStep,
      color: row?.color ?? getPermutationWireColor(inputIndex),
      kind: 'line' as const,
    };
  });
  const outputLane = [...rowsWithPositions].sort((left, right) => left.outputIndex - right.outputIndex);

  return {
    entry,
    kind: 'routing',
    title: 'Bit Shift Mapping',
    copy:
      mode === 'rotate-left' || mode === 'rotate-right'
        ? 'This shifter rotates positions, so bits wrap around instead of dropping off the edge.'
        : 'This shifter moves positions and fills the opened edge with zero bits.',
    configLabel: 'Mode / Amount',
    configValue: `${formatBitShifterMode(mode)} · ${amount}`,
    middleLabel: mode.startsWith('rotate') ? 'Wrap' : 'Shift',
    rows: rowsWithPositions,
    inputLane,
    outputLane,
    svgHeight,
    summary: getBitShifterSummary(mode, amount, rowsWithPositions),
  };
}

function getXorTransformation(entry: ExecutionTraceEntry): XorTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const length = Math.min(inputA.value.length, inputB.value.length, output.value.length);
  const rows: XorTransformationRow[] = [];
  for (let index = 0; index < length; index += 1) {
    const aBit = inputA.value[index] ?? 0;
    const bBit = inputB.value[index] ?? 0;
    const resultBit = output.value[index] ?? 0;
    rows.push({
      index,
      aBit,
      bBit,
      resultBit,
      explanation: aBit === bBit ? 'same' : 'different',
    });
  }

  const differentCount = rows.filter((row) => row.resultBit === 1).length;
  return {
    entry,
    kind: 'xor',
    title: 'Exclusive-Or Comparison',
    copy:
      'XOR compares two input bits at the same position. When exactly one input is 1, the output becomes 1. When both inputs match, the output becomes 0.',
    rows,
    summary:
      rows.length === 0
        ? 'This XOR has no overlapping bit positions to compare.'
        : `${differentCount} of ${rows.length} bit pair${rows.length === 1 ? '' : 's'} differ. XOR outputs 1 only where the two inputs disagree.`,
  };
}

function getCompareTransformation(entry: ExecutionTraceEntry): CompareTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const length = Math.min(inputA.value.length, inputB.value.length);
  const rows: CompareTransformationRow[] = [];
  for (let index = 0; index < length; index += 1) {
    const aBit = inputA.value[index] ?? 0;
    const bBit = inputB.value[index] ?? 0;
    rows.push({
      index,
      aBit,
      bBit,
      explanation: aBit === bBit ? 'same' : 'different',
    });
  }

  const leftValue = bitsToNumber(inputA.value);
  const rightValue = bitsToNumber(inputB.value);
  const outputBit = output.value[0] ?? 0;
  const isEquality = entry.defId === 'Equals';
  const isGreaterThan = entry.defId === 'GreaterThan';

  return {
    entry,
    kind: 'compare',
    title: isEquality ? 'Equality Comparison' : isGreaterThan ? 'Strict Comparison' : 'Threshold Comparison',
    copy: isEquality
      ? 'Equals checks whether two same-width bit words match exactly, then emits a one-bit control result.'
      : isGreaterThan
        ? 'GreaterThan reads both inputs as fixed-width unsigned words, then emits a one-bit control result when the left word is strictly greater than the right one.'
        : 'AtLeast reads both inputs as fixed-width unsigned words, then emits a one-bit control result when the left word has reached or exceeded the right one.',
    ruleLabel: 'Rule',
    ruleValue: isEquality ? 'A == B -> [1], else [0]' : isGreaterThan ? 'A > B -> [1], else [0]' : 'A >= B -> [1], else [0]',
    leftValue,
    rightValue,
    outputBit,
    rows,
    summary: isEquality
      ? outputBit === 1
        ? `The two ${length}-bit words match exactly, so the control output is active.`
        : `At least one bit differs, so the equality control output stays inactive.`
      : isGreaterThan
        ? outputBit === 1
          ? `${leftValue} is strictly greater than ${rightValue}, so the comparison output is active.`
          : `${leftValue} is not greater than ${rightValue}, so the comparison output stays inactive.`
        : outputBit === 1
          ? `${leftValue} has reached or exceeded ${rightValue}, so the threshold output is active.`
          : `${leftValue} is still below ${rightValue}, so the threshold output stays inactive.`,
  };
}

function getGateTransformation(entry: ExecutionTraceEntry): GateTransformationView | null {
  const input = entry.inputs.in;
  const control = entry.inputs.control;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || control?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const rows: GateTransformationRow[] = output.value.map((outputBit, index) => ({
    index,
    inputBit: input.value[index] ?? 0,
    outputBit,
  }));
  const active = control.value.length === 1 && control.value[0] === 1;

  return {
    entry,
    kind: 'gate',
    title: 'Pulse Gate',
    copy:
      'Gate lets a bit signal through only when the control input is the active pulse [1]. Otherwise it outputs a zero-filled word of the same width.',
    controlValue: control.value,
    active,
    rows,
    summary: active
      ? 'The control pulse is active, so the gate passes the incoming word through unchanged.'
      : 'The control pulse is inactive, so the gate blocks the word and emits zeros instead.',
  };
}

function getMajorityTransformation(entry: ExecutionTraceEntry): MajorityTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const inputC = entry.inputs.c;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || inputC?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const a = inputA.value[0] ?? 0;
  const b = inputB.value[0] ?? 0;
  const c = inputC.value[0] ?? 0;
  const activeCount = a + b + c;
  const outputBit = output.value[0] ?? 0;

  return {
    entry,
    kind: 'majority',
    title: 'Majority Vote',
    copy:
      'Majority reads three 1-bit inputs and emits [1] when at least two of them are active. It is a small visible voting rule for stream control and irregular clocking.',
    inputs: [
      { label: 'A', bit: a },
      { label: 'B', bit: b },
      { label: 'C', bit: c },
    ],
    activeCount,
    outputBit,
    summary:
      outputBit === 1
        ? `${activeCount} of 3 inputs are active, so the majority output is [1].`
        : `${activeCount} of 3 inputs are active, so the majority output stays [0].`,
  };
}

function getMuxTransformation(entry: ExecutionTraceEntry): MuxTransformationView | null {
  const select = entry.inputs.select;
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (select?.type !== 'bits' || inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const selectBit = select.value[0] ?? 0;
  const aBit = inputA.value[0] ?? 0;
  const bBit = inputB.value[0] ?? 0;
  const outputBit = output.value[0] ?? 0;
  const chosenInput = selectBit === 1 ? 'b' : 'a';

  return {
    entry,
    kind: 'mux',
    title: 'Bit Selector',
    copy:
      'Mux reads one 1-bit select line and chooses which of two candidate 1-bit inputs continues forward. It is visible selection, not voting or pulse gating.',
    selectBit,
    aBit,
    bBit,
    outputBit,
    chosenInput,
    summary:
      chosenInput === 'a'
        ? `Select is [0], so Mux forwards input a (${aBit}) and ignores input b (${bBit}).`
        : `Select is [1], so Mux forwards input b (${bBit}) and ignores input a (${aBit}).`,
  };
}

function getDemuxTransformation(entry: ExecutionTraceEntry): DemuxTransformationView | null {
  const select = entry.inputs.select;
  const input = entry.inputs.in;
  const outputA = entry.outputs.a;
  const outputB = entry.outputs.b;
  if (select?.type !== 'bits' || input?.type !== 'bits' || outputA?.type !== 'bits' || outputB?.type !== 'bits') {
    return null;
  }

  const selectBit = select.value[0] ?? 0;
  const inputBit = input.value[0] ?? 0;
  const outputABit = outputA.value[0] ?? 0;
  const outputBBit = outputB.value[0] ?? 0;
  const chosenOutput = selectBit === 1 ? 'b' : 'a';

  return {
    entry,
    kind: 'demux',
    title: 'Bit Router',
    copy:
      'Demux reads one 1-bit select line and routes one 1-bit input into one of two outputs. It is visible routing, not pulse gating and not output selection.',
    selectBit,
    inputBit,
    outputABit,
    outputBBit,
    chosenOutput,
    summary:
      chosenOutput === 'a'
        ? `Select is [0], so Demux routes the input bit (${inputBit}) to output a and leaves output b at 0.`
        : `Select is [1], so Demux routes the input bit (${inputBit}) to output b and leaves output a at 0.`,
  };
}

export function getSBoxAnalysisFromParams(params: {
  table?: unknown;
  inputBits?: unknown;
  outputBits?: unknown;
}): SBoxAnalysis | null {
  try {
    const shape = getSBoxShape(params);
    const table = parseSBoxTable(params.table, params);
    return computeSBoxAnalysis(table, shape.inputWidth, shape.outputWidth);
  } catch {
    return null;
  }
}

export function getPermutationAnalysisFromParams(
  params: { order?: unknown },
  blockSize?: number,
): PermutationAnalysis | null {
  try {
    const order = parsePermutationOrder(params.order);
    return computePermutationAnalysis(order, blockSize);
  } catch {
    return null;
  }
}

function getSBoxTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): LookupTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const inputSignal = entry.inputs.in;
  const outputSignal = entry.outputs.out;
  if (inputSignal?.type !== 'bits' || outputSignal?.type !== 'bits') {
    return null;
  }

  const shape = getSBoxShape(resolved.instance.params);
  const table = parseSBoxTable(resolved.instance.params.table, resolved.instance.params);
  if (shape.inputWidth < 1 || inputSignal.value.length % shape.inputWidth !== 0) {
    return null;
  }

  const chunks: LookupTransformationChunk[] = [];
  for (let start = 0; start < inputSignal.value.length; start += shape.inputWidth) {
    const inputBits = inputSignal.value.slice(start, start + shape.inputWidth);
    const outputBits = outputSignal.value.slice(start, start + shape.outputWidth);
    const inputValue = bitsToNumber(inputBits);
    const outputValue = bitsToNumber(outputBits);
    chunks.push({
      index: start / shape.inputWidth,
      inputBits,
      inputValue,
      outputValue,
      outputBits,
    });
  }

  const gridColumns = getSBoxGridColumns({
    inputWidth: shape.inputWidth as 4 | 6 | 8,
    outputWidth: shape.outputWidth as 4 | 8,
  });
  const displayOrder = buildSBoxDisplayOrder(table.length, {
    inputWidth: shape.inputWidth as 4 | 6 | 8,
    outputWidth: shape.outputWidth as 4 | 8,
  });
  const displayIndexByInputValue = Array.from({ length: table.length }, (_, inputValue) =>
    getSBoxDisplayIndexForInputValue(inputValue, {
      inputWidth: shape.inputWidth as 4 | 6 | 8,
      outputWidth: shape.outputWidth as 4 | 8,
    }),
  );
  const activeDisplayIndex = chunks.length > 0 ? displayIndexByInputValue[chunks[0].inputValue] : null;

  return {
    entry,
    kind: 'lookup',
    title: 'Substitution Lookup',
    copy:
      'SBox groups bits into fixed-width chunks, reads each chunk as a number, and substitutes it with the table value stored at that index.',
    inputWidth: shape.inputWidth,
    outputWidth: shape.outputWidth,
    gridColumns,
    table,
    displayOrder,
    displayIndexByInputValue,
    usesHexGrid: shape.outputWidth >= 8 && gridColumns === 16,
    activeRowIndex:
      activeDisplayIndex !== null
        ? Math.floor(activeDisplayIndex / gridColumns)
        : null,
    activeColumnIndex:
      activeDisplayIndex !== null
        ? activeDisplayIndex % gridColumns
        : null,
    chunks,
    summary:
      chunks.length === 1
        ? 'This S-Box replaces one grouped value with another by table lookup.'
        : `This S-Box processes ${chunks.length} grouped chunks independently, using the same substitution table for each chunk.`,
    sboxAnalysis: (() => {
      try {
        return computeSBoxAnalysis(table, shape.inputWidth, shape.outputWidth);
      } catch {
        return null;
      }
    })(),
  };
}

function getSplitTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): SplitTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const left = entry.outputs.left;
  const right = entry.outputs.right;
  if (input?.type !== 'bits' || left?.type !== 'bits' || right?.type !== 'bits') {
    return null;
  }

  const leftWidth = left.value.length;

  return {
    entry,
    kind: 'split',
    title: 'Block Split',
    copy:
      'BitSplit divides one bit vector into two sub-blocks at the configured left width. The first leftWidth bits become the left output, and the remaining bits become the right output.',
    inputBits: input.value,
    leftWidth,
    leftBits: left.value,
    rightBits: right.value,
    summary: `A ${input.value.length}-bit input was split into a ${leftWidth}-bit left block and a ${input.value.length - leftWidth}-bit right block.`,
  };
}

function getPadTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): PadTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const targetWidth =
    typeof resolved.instance.params.targetWidth === 'number' ? resolved.instance.params.targetWidth : output.value.length;
  const side = resolved.instance.params.side === 'left' ? 'left' : 'right';
  const padBit = resolved.instance.params.padBit === '1' ? 1 : 0;
  const padCount = Math.max(0, output.value.length - input.value.length);

  return {
    entry,
    kind: 'pad',
    title: 'Block Pad',
    copy:
      'BitPad extends a bit vector to a target width by appending or prepending a chosen pad bit. If the input already meets the target, it passes through unchanged.',
    inputBits: input.value,
    outputBits: output.value,
    targetWidth,
    side,
    padBit,
    padCount,
    summary: padCount > 0
      ? `${padCount} ${padBit === 0 ? 'zero' : 'one'} bit${padCount === 1 ? '' : 's'} ${side === 'left' ? 'prepended' : 'appended'} to reach ${output.value.length} bits.`
      : `Input already meets the target width (${output.value.length} bits), so no padding was added.`,
  };
}

function getMulModTransformation(entry: ExecutionTraceEntry): ArithmeticTransformationView | null {
  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'bits' || inputB?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const aValue = bitsToNumber(inputA.value);
  const bValue = bitsToNumber(inputB.value);
  const width = inputA.value.length;
  const modulus = 2 ** width;
  const resultValue = bitsToNumber(output.value);

  return {
    entry,
    kind: 'arithmetic',
    title: 'Modular Multiplication',
    copy:
      'MulMod multiplies two equal-width unsigned bit words and reduces the product modulo 2^n, where n is the shared input width. Overflow wraps.',
    operationLabel: 'Operation',
    operationExpression: `${aValue} × ${bValue} mod ${modulus} = ${resultValue}`,
    resultValue,
    inputBits: inputA.value,
    outputBits: output.value,
    summary: `${aValue} × ${bValue} = ${aValue * bValue}, reduced mod ${modulus} to ${resultValue} (${width}-bit result).`,
  };
}

function getModExpTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): ArithmeticTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const base = entry.inputs.base;
  const exp = entry.inputs.exp;
  const output = entry.outputs.out;
  if (base?.type !== 'bits' || exp?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const baseValue = bitsToNumber(base.value);
  const expValue = bitsToNumber(exp.value);
  const modulus = typeof resolved.instance.params.modulus === 'number' ? resolved.instance.params.modulus : 2;
  const resultValue = bitsToNumber(output.value);

  return {
    entry,
    kind: 'arithmetic',
    title: 'Modular Exponentiation',
    copy:
      'ModExp raises the base to the exponent power modulo a chosen modulus using repeated squaring. The result fits inside the base input width.',
    operationLabel: 'Operation',
    operationExpression: `${baseValue}^${expValue} mod ${modulus} = ${resultValue}`,
    resultValue,
    inputBits: base.value,
    outputBits: output.value,
    summary: `${baseValue} raised to the ${expValue} power mod ${modulus} gives ${resultValue} (${base.value.length}-bit result).`,
  };
}

function getModInverseTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): ArithmeticTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const inputValue = bitsToNumber(input.value);
  const modulus = typeof resolved.instance.params.modulus === 'number' ? resolved.instance.params.modulus : 2;
  const resultValue = bitsToNumber(output.value);

  return {
    entry,
    kind: 'arithmetic',
    title: 'Modular Inverse',
    copy:
      'ModInverse finds the multiplicative inverse of the input modulo a chosen modulus using the extended Euclidean algorithm. The result satisfies input × result ≡ 1 (mod modulus).',
    operationLabel: 'Operation',
    operationExpression: `${inputValue}⁻¹ mod ${modulus} = ${resultValue}`,
    resultValue,
    inputBits: input.value,
    outputBits: output.value,
    summary: `The inverse of ${inputValue} mod ${modulus} is ${resultValue}. Verify: ${inputValue} × ${resultValue} = ${inputValue * resultValue}, and ${inputValue * resultValue} mod ${modulus} = ${(inputValue * resultValue) % modulus}.`,
  };
}

function makeIntegerOperand(label: string, decimal: string): IntegerArithmeticOperandView {
  return {
    label,
    decimal,
    hex: formatUnsignedIntegerAsHex(decimal),
  };
}

function getPrimeFieldBinaryTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): IntegerArithmeticTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const inputA = entry.inputs.a;
  const inputB = entry.inputs.b;
  const output = entry.outputs.out;
  if (inputA?.type !== 'integer' || inputB?.type !== 'integer' || output?.type !== 'integer') {
    return null;
  }

  const modulusValue =
    typeof resolved.instance.params.modulus === 'number' ? resolved.instance.params.modulus.toString(10) : '2';
  const aValue = parseUnsignedIntegerString(inputA.value, resolved.definition.id);
  const bValue = parseUnsignedIntegerString(inputB.value, resolved.definition.id);
  const resultValue = parseUnsignedIntegerString(output.value, resolved.definition.id);

  const configByDefId = {
    FieldAdd: {
      title: 'Prime-Field Addition',
      copy:
        'FieldAdd adds two visible field elements modulo a prime p. The inputs are integer-domain field elements, not fixed-width bit words.',
      symbol: '+',
      summary: `${aValue.toString(10)} + ${bValue.toString(10)} reduced modulo ${modulusValue} gives ${resultValue.toString(10)}.`,
    },
    FieldSub: {
      title: 'Prime-Field Subtraction',
      copy:
        'FieldSub subtracts one visible field element from another modulo a prime p. The result stays in the field range 0..p-1.',
      symbol: '−',
      summary: `${aValue.toString(10)} − ${bValue.toString(10)} reduced modulo ${modulusValue} gives ${resultValue.toString(10)}.`,
    },
    FieldMul: {
      title: 'Prime-Field Multiplication',
      copy:
        'FieldMul multiplies two visible field elements modulo a prime p. This is field arithmetic, not fixed-width word wraparound.',
      symbol: '×',
      summary: `${aValue.toString(10)} × ${bValue.toString(10)} reduced modulo ${modulusValue} gives ${resultValue.toString(10)}.`,
    },
  } as const;

  const config = configByDefId[resolved.definition.id as keyof typeof configByDefId];
  if (!config) {
    return null;
  }

  return {
    entry,
    kind: 'integer-arithmetic',
    title: config.title,
    copy: config.copy,
    operationLabel: 'Operation',
    operationExpression: `${aValue.toString(10)} ${config.symbol} ${bValue.toString(10)} mod ${modulusValue} = ${resultValue.toString(10)}`,
    operands: [
      makeIntegerOperand('A', aValue.toString(10)),
      makeIntegerOperand('B', bValue.toString(10)),
    ],
    modulusDecimal: modulusValue,
    modulusHex: formatUnsignedIntegerAsHex(modulusValue),
    resultDecimal: resultValue.toString(10),
    resultHex: formatUnsignedIntegerAsHex(resultValue.toString(10)),
    summary: config.summary,
  };
}

function getPrimeFieldInverseTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): IntegerArithmeticTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'integer' || output?.type !== 'integer') {
    return null;
  }

  const modulusValue =
    typeof resolved.instance.params.modulus === 'number' ? resolved.instance.params.modulus.toString(10) : '2';
  const inputValue = parseUnsignedIntegerString(input.value, 'FieldInverse');
  const resultValue = parseUnsignedIntegerString(output.value, 'FieldInverse');
  const checkValue = (inputValue * resultValue) % BigInt(modulusValue);

  return {
    entry,
    kind: 'integer-arithmetic',
    title: 'Prime-Field Inverse',
    copy:
      'FieldInverse finds the multiplicative inverse of one visible field element modulo a prime p. A nonzero field element multiplied by its inverse lands on 1.',
    operationLabel: 'Operation',
    operationExpression: `${inputValue.toString(10)}⁻¹ mod ${modulusValue} = ${resultValue.toString(10)}`,
    operands: [makeIntegerOperand('Input', inputValue.toString(10))],
    modulusDecimal: modulusValue,
    modulusHex: formatUnsignedIntegerAsHex(modulusValue),
    resultDecimal: resultValue.toString(10),
    resultHex: formatUnsignedIntegerAsHex(resultValue.toString(10)),
    summary: `${inputValue.toString(10)} × ${resultValue.toString(10)} mod ${modulusValue} = ${checkValue.toString(10)}, so the inverse check lands on the multiplicative identity.`,
  };
}

function getUnpadTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): UnpadTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const originalWidth =
    typeof resolved.instance.params.originalWidth === 'number' ? resolved.instance.params.originalWidth : output.value.length;
  const side = resolved.instance.params.side === 'left' ? 'left' : 'right';
  const strippedCount = Math.max(0, input.value.length - output.value.length);

  return {
    entry,
    kind: 'unpad',
    title: 'Block Unpad',
    copy:
      'BitUnpad strips padding bits from a signal to recover the original width. It is the inverse of BitPad.',
    inputBits: input.value,
    outputBits: output.value,
    originalWidth,
    side,
    strippedCount,
    summary: strippedCount > 0
      ? `${strippedCount} bit${strippedCount === 1 ? '' : 's'} stripped from the ${side} to recover ${output.value.length}-bit original.`
      : `Input already matches the original width (${output.value.length} bits), so nothing was stripped.`,
  };
}

function getBitWindowTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const start =
    typeof resolved.instance.params.start === 'number' && Number.isInteger(resolved.instance.params.start)
      ? resolved.instance.params.start
      : 0;
  const width =
    typeof resolved.instance.params.width === 'number' && Number.isInteger(resolved.instance.params.width)
      ? resolved.instance.params.width
      : output.value.length;

  const rows = output.value.map((outputValue, outputIndex) => {
    const inputIndex = start + outputIndex;
    return {
      inputIndex,
      inputValue: input.value[inputIndex] ?? 0,
      outputIndex,
      outputValue,
      kind: 'line' as const,
    };
  });
  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row, laneIndex) => ({
    ...row,
    inputY: laneOffset + laneIndex * laneStep,
    outputY: laneOffset + laneIndex * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  return {
    entry,
    kind: 'routing',
    title: 'Bit Window Mapping',
    copy:
      'BitWindow extracts one contiguous slice from a larger bit bus. It does not derive a new key; it shows exactly which visible positions the downstream round receives.',
    configLabel: 'Start / Width',
    configValue: `${start} / ${width}`,
    middleLabel: 'Slice',
    rows: rowsWithPositions,
    inputLane: rowsWithPositions,
    outputLane: rowsWithPositions,
    svgHeight,
    summary:
      rows.length === 0
        ? 'This BitWindow has no visible output bits.'
        : `The output reads input positions ${start} through ${start + rows.length - 1} from the visible bus.`,
  };
}

function getBitSelectTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const orderParam = resolved.instance.params.order;
  const order: number[] =
    typeof orderParam === 'string'
      ? orderParam
          .split(',')
          .map((p) => Number(p.trim()))
          .filter((n) => Number.isInteger(n) && n >= 0)
      : [];

  if (order.length === 0) {
    return null;
  }

  const rows = order.map((inputIndex, outputIndex) => ({
    inputIndex,
    inputValue: input.value[inputIndex] ?? 0,
    outputIndex,
    outputValue: output.value[outputIndex] ?? 0,
    kind: 'line' as const,
  }));

  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row, laneIndex) => ({
    ...row,
    inputY: laneOffset + laneIndex * laneStep,
    outputY: laneOffset + laneIndex * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  const droppedCount = input.value.length - order.length;
  const selectedPositions = order.join(', ');

  return {
    entry,
    kind: 'routing',
    title: 'Bit Select Mapping',
    copy:
      'BitSelect picks arbitrary non-contiguous positions from the input and emits them in the specified order. Positions not listed are permanently dropped — this is how DES PC-1 strips parity bits and PC-2 extracts each round subkey.',
    configLabel: 'Selected positions',
    configValue: selectedPositions,
    middleLabel: 'Selection',
    rows: rowsWithPositions,
    inputLane: rowsWithPositions,
    outputLane: rowsWithPositions,
    svgHeight,
    summary:
      droppedCount > 0
        ? `Selects ${order.length} of ${input.value.length} input bits. ${droppedCount} bit${droppedCount !== 1 ? 's' : ''} dropped permanently.`
        : `Selects all ${order.length} bits — output order differs from input order.`,
  };
}

function getBitExpandTransformation(
  entry: ExecutionTraceEntry,
  project: Project,
  registry: ModuleRegistry,
): RoutingTransformationView | null {
  const resolved = resolveTraceModuleInstance(entry.moduleId, project, registry);
  if (!resolved) {
    return null;
  }

  const input = entry.inputs.in;
  const output = entry.outputs.out;
  if (input?.type !== 'bits' || output?.type !== 'bits') {
    return null;
  }

  const orderParam = resolved.instance.params.order;
  const order: number[] =
    typeof orderParam === 'string'
      ? orderParam
          .split(',')
          .map((p) => Number(p.trim()))
          .filter((n) => Number.isInteger(n) && n >= 0)
      : [];

  if (order.length === 0) {
    return null;
  }

  // Count how many times each input index is used
  const useCounts = new Map<number, number>();
  for (const idx of order) {
    useCounts.set(idx, (useCounts.get(idx) ?? 0) + 1);
  }

  const rows = order.map((inputIndex, outputIndex) => ({
    inputIndex,
    inputValue: input.value[inputIndex] ?? 0,
    outputIndex,
    outputValue: output.value[outputIndex] ?? 0,
    kind: 'line' as const,
  }));

  const laneHeight = 32;
  const laneGap = 6;
  const laneStep = laneHeight + laneGap;
  const laneOffset = laneHeight / 2;
  const svgHeight = Math.max(laneHeight, rows.length * laneHeight + Math.max(0, rows.length - 1) * laneGap);
  const rowsWithPositions = rows.map((row, laneIndex) => ({
    ...row,
    inputY: laneOffset + laneIndex * laneStep,
    outputY: laneOffset + laneIndex * laneStep,
    color: getPermutationWireColor(row.inputIndex),
  }));

  const repeatedCount = [...useCounts.values()].filter((c) => c > 1).length;
  const addedBits = output.value.length - input.value.length;

  return {
    entry,
    kind: 'routing',
    title: 'Bit Expand Mapping',
    copy:
      'BitExpand copies input bits to an expanded output, allowing duplicate indices. Repeated positions let one input bit feed multiple downstream slots — this is how DES E-expansion gives boundary bits dual participation in adjacent 6-bit subkey groups.',
    configLabel: 'Expanded positions',
    configValue: order.join(', '),
    middleLabel: 'Expansion',
    rows: rowsWithPositions,
    inputLane: rowsWithPositions,
    outputLane: rowsWithPositions,
    svgHeight,
    summary:
      repeatedCount > 0
        ? `Expands ${input.value.length} → ${output.value.length} bits (+${addedBits}). ${repeatedCount} input position${repeatedCount !== 1 ? 's' : ''} used more than once.`
        : `Maps ${input.value.length} → ${output.value.length} bits. No repeated positions.`,
  };
}

function parsePermutationOrder(value: unknown): number[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part >= 0);
}

export function getPermutationWireColor(index: number) {
  const hue = (index * 47) % 360;
  return `hsl(${hue} 72% 54%)`;
}

function getBitShifterSourceIndex(outputIndex: number, bitLength: number, amount: number, mode: string) {
  switch (mode) {
    case 'left':
      return outputIndex + amount < bitLength ? outputIndex + amount : null;
    case 'right':
      return outputIndex - amount >= 0 ? outputIndex - amount : null;
    case 'rotate-left':
      return bitLength === 0 ? null : (outputIndex + (amount % bitLength)) % bitLength;
    case 'rotate-right':
      if (bitLength === 0) {
        return null;
      }
      return (outputIndex - (amount % bitLength) + bitLength) % bitLength;
    default:
      return null;
  }
}

function formatBitShifterMode(mode: string) {
  switch (mode) {
    case 'left':
      return 'Shift Left';
    case 'right':
      return 'Shift Right';
    case 'rotate-left':
      return 'Rotate Left';
    case 'rotate-right':
      return 'Rotate Right';
    default:
      return mode;
  }
}

function getBitShifterSummary(mode: string, amount: number, rows: RoutingTransformationRow[]) {
  const fillCount = rows.filter((row) => row.kind === 'fill').length;
  if (mode === 'rotate-left' || mode === 'rotate-right') {
    return `Every output position pulls from another input position. A ${formatBitShifterMode(mode).toLowerCase()} by ${amount} wraps bits around the far edge instead of discarding them.`;
  }

  return fillCount === 0
    ? `This shift moves every visible bit by ${amount} position${amount === 1 ? '' : 's'} without opening a zero-filled edge.`
    : `${fillCount} output position${fillCount === 1 ? '' : 's'} are zero-filled because a plain ${formatBitShifterMode(mode).toLowerCase()} shift drops bits off one edge and opens space on the other.`;
}

function bitsToNumber(bits: number[]) {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

export function formatSBoxAxisLabel(value: number, gridColumns: number) {
  return gridColumns >= 16 ? value.toString(16).toUpperCase() : String(value);
}

export function formatSBoxHexValue(value: number, chunkWidth: number) {
  const digits = Math.max(1, Math.ceil(chunkWidth / 4));
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

export function getEditablePermutationOrder(value: unknown): number[] | null {
  try {
    return parsePermutationOrder(value);
  } catch {
    return null;
  }
}

export function getEditableReflectorWiring(value: unknown): string[] | null {
  try {
    return parseReflectorWiring(value);
  } catch {
    return null;
  }
}

export function getEditablePlugboardWiring(value: unknown): string[] | null {
  try {
    return parsePlugboardWiring(value);
  } catch {
    return null;
  }
}

export function getEditableRotorWiring(value: unknown): string[] | null {
  return Array.isArray(value) &&
    value.length === 26 &&
    value.every((entry) => typeof entry === 'string' && /^[A-Z]$/.test(entry))
    ? (value as string[])
    : null;
}

export function isSimplePermutationOrder(order: number[]) {
  if (order.length === 0) {
    return false;
  }

  const sorted = [...order].sort((left, right) => left - right);
  return sorted.every((value, index) => value === index);
}

const REFLECTOR_PAIR_PALETTE = [
  { accent: '#2F6FB3' },
  { accent: '#2C8C73' },
  { accent: '#B86A2F' },
  { accent: '#7A5CC7' },
  { accent: '#B24C6B' },
  { accent: '#5E8D3A' },
  { accent: '#C08A1B' },
  { accent: '#3C7E9E' },
  { accent: '#9B5D8C' },
  { accent: '#8F6B38' },
  { accent: '#4466C1' },
  { accent: '#A15434' },
  { accent: '#4E8A8C' },
];

export function getPairKey(left: string, right: string) {
  return [left, right].sort().join('-');
}

export function buildPairStyles(wiring: string[], options?: { includeSelfPairs?: boolean }) {
  const includeSelfPairs = options?.includeSelfPairs ?? true;
  const uniquePairKeys = [
    ...new Set(
      wiring
        .map((target, index) => [String.fromCharCode(65 + index), target] as const)
        .filter(([source, target]) => includeSelfPairs || source !== target)
        .map(([source, target]) => getPairKey(source, target)),
    ),
  ];
  uniquePairKeys.sort();

  return Object.fromEntries(
    uniquePairKeys.map((pairKey, index) => {
      const palette = REFLECTOR_PAIR_PALETTE[index % REFLECTOR_PAIR_PALETTE.length];
      return [
        pairKey,
        ({
          '--reflector-pair-accent': palette.accent,
        } as CSSProperties),
      ];
    }),
  ) as Record<string, CSSProperties>;
}

export function getEditableSBoxTable(
  value: unknown,
  options?: {
    inputBits?: unknown;
    outputBits?: unknown;
  },
): number[] | null {
  try {
    return parseSBoxTable(value, options);
  } catch {
    return null;
  }
}

function humanizeIssueCode(code: ValidationIssue['code']) {
  return code
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function getIssueTargetModuleId(issue: ValidationIssue) {
  return issue.moduleId ?? issue.connection?.to.moduleId ?? issue.connection?.from.moduleId ?? null;
}

export function getTraceEntries(args: {
  execution: ExecutionResult | null;
  project: Project;
  selectedModuleId: string | null;
  traceMode: 'focused' | 'upstream' | 'downstream' | 'full';
  focusedRoundPath: string;
}) {
  const { execution, project, selectedModuleId, traceMode, focusedRoundPath } = args;
  if (!execution) {
    return [];
  }

  const analysisTrace = execution.analysisTrace ?? execution.trace;
  const roundFilteredTrace =
    focusedRoundPath === 'all'
      ? analysisTrace
      : analysisTrace.filter((entry) => isEntryInsideRound(entry, focusedRoundPath));

  if (!selectedModuleId || traceMode === 'full') {
    return roundFilteredTrace;
  }

  if (traceMode === 'focused') {
    return roundFilteredTrace.filter(
      (entry) => entry.moduleId === selectedModuleId || entry.moduleId.startsWith(`${selectedModuleId}/`),
    );
  }

  const relatedModuleIds =
    traceMode === 'upstream'
      ? collectReachableModules(project.connections, selectedModuleId, 'upstream')
      : collectReachableModules(project.connections, selectedModuleId, 'downstream');

  relatedModuleIds.add(selectedModuleId);
  return roundFilteredTrace.filter((entry) =>
    [...relatedModuleIds].some((moduleId) => entry.moduleId === moduleId || entry.moduleId.startsWith(`${moduleId}/`)),
  );
}

export function getIteratorRoundOptions(analysisTrace: ExecutionTraceEntry[], iteratorModuleId: string) {
  const seen = new Set<string>();
  const options: { path: string; label: string }[] = [];
  const prefix = `${iteratorModuleId}/round-`;

  for (const entry of analysisTrace) {
    if (!entry.moduleId.startsWith(prefix)) {
      continue;
    }

    const parts = entry.moduleId.split('/');
    const roundIndex = parts.findIndex((part) => /^round-\d+$/.test(part));
    const roundPart = roundIndex >= 0 ? parts[roundIndex] : null;
    if (!roundPart) {
      continue;
    }

    const path = parts.slice(0, roundIndex + 1).join('/');
    if (seen.has(path)) {
      continue;
    }

    seen.add(path);
    options.push({
      path,
      label: roundPart.replace('round-', 'Round '),
    });
  }

  return options.sort((left, right) => left.path.localeCompare(right.path, undefined, { numeric: true }));
}

function isEntryInsideRound(entry: ExecutionTraceEntry, focusedRoundPath: string) {
  return entry.moduleId === focusedRoundPath || entry.moduleId.startsWith(`${focusedRoundPath}/`);
}

export function getTopLevelTraceModuleId(entry: ExecutionTraceEntry) {
  return entry.moduleId.split('/')[0] ?? entry.moduleId;
}

export function getDisplayTraceModuleId(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  return parts[parts.length - 1] ?? entry.moduleId;
}

export function getNestedTracePath(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  if (parts.length <= 1) {
    return null;
  }

  return parts.slice(0, -1).join(' / ');
}

export function getIteratorRoundPath(entry: ExecutionTraceEntry) {
  const parts = entry.moduleId.split('/');
  const roundIndex = parts.findIndex((part) => /^round-\d+$/.test(part));
  if (roundIndex < 0) {
    return null;
  }

  return parts.slice(0, roundIndex + 1).join('/');
}

export function formatIteratorRoundLabel(roundPath: string) {
  const roundPart = roundPath.split('/').find((part) => /^round-\d+$/.test(part));
  return roundPart ? roundPart.replace('round-', 'Round ') : 'Round';
}

function collectReachableModules(
  connections: Connection[],
  originModuleId: string,
  direction: 'upstream' | 'downstream',
) {
  const visited = new Set<string>();
  const queue = [originModuleId];

  while (queue.length > 0) {
    const moduleId = queue.shift();
    if (!moduleId) {
      continue;
    }

    for (const connection of connections) {
      const nextModuleId =
        direction === 'upstream'
          ? connection.to.moduleId === moduleId
            ? connection.from.moduleId
            : null
          : connection.from.moduleId === moduleId
            ? connection.to.moduleId
            : null;

      if (!nextModuleId || visited.has(nextModuleId)) {
        continue;
      }

      visited.add(nextModuleId);
      queue.push(nextModuleId);
    }
  }

  return visited;
}

export function groupIssuesByTarget(issues: ValidationIssue[]) {
  const groups = new Map<string, { targetModuleId: string | null; title: string; messages: string[] }>();

  for (const issue of issues) {
    const targetModuleId = getIssueTargetModuleId(issue);
    const key = `${targetModuleId ?? 'global'}:${issue.code}`;
    const existing = groups.get(key);
    if (existing) {
      if (!existing.messages.includes(issue.message)) {
        existing.messages.push(issue.message);
      }
      continue;
    }

    groups.set(key, {
      targetModuleId,
      title: humanizeIssueCode(issue.code),
      messages: [issue.message],
    });
  }

  return [...groups.values()];
}

export function formatParameterComparisonChipLabel(fieldComparison: ParameterComparisonFieldStatus) {
  if (fieldComparison.status === 'aligned') {
    return fieldComparison.totalSiblingCount === 1
      ? 'Aligned'
      : `Aligned ${fieldComparison.alignedSiblingCount}/${fieldComparison.totalSiblingCount}`;
  }

  return fieldComparison.totalSiblingCount === 1
    ? 'Divergent'
    : `Divergent ${fieldComparison.divergentSiblingCount}/${fieldComparison.totalSiblingCount}`;
}

export function formatLinkedRotorFieldValue(fieldKey: string, value: unknown) {
  if (fieldKey === 'wiring') {
    const rotorWiring = getEditableRotorWiring(value);
    return rotorWiring ? serializeRotorWiring(rotorWiring) : 'Unavailable';
  }

  if (fieldKey === 'notches') {
    const text = typeof value === 'string' ? value.trim() : '';
    return text.length > 0 ? text : 'None';
  }

  return String(value ?? '');
}

export function getLFSRAnalysis(params: Record<string, unknown>) {
  return getLFSRAnalysisFromParams(params);
}

export function getPlugboardAnalysis(params: Record<string, unknown>) {
  return getPlugboardAnalysisFromParams(params);
}

export function getReflectorAnalysis(params: Record<string, unknown>) {
  return getReflectorAnalysisFromParams(params);
}

export function getModulusAnalysis(params: Record<string, unknown>) {
  return getModulusAnalysisFromParams(params);
}
