import type { ExecutionResult, ExecutionTraceEntry, Signal } from '../engine/types';
import { ENGLISH_LETTER_FREQUENCIES } from './cryptanalysis-data';

const SYMBOL_BIT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface LetterFrequencyEntry {
  letter: string;
  count: number;
  share: number;
}

export interface NGramFrequencyEntry {
  gram: string;
  count: number;
  share: number;
}

export interface RepeatedFragmentEntry {
  fragment: string;
  positions: number[];
  distances: number[];
}

export interface CandidatePeriodEntry {
  period: number;
  averageIndexOfCoincidence: number | null;
  supportingDistanceCount: number;
}

export interface VigenereColumnEntry {
  columnIndex: number;
  text: string;
  letterCount: number;
  indexOfCoincidence: number | null;
  topLetters: LetterFrequencyEntry[];
  shiftCandidates: ShiftScoreEntry[];
  topShiftCandidates: ShiftScoreEntry[];
}

export interface ShiftScoreEntry {
  shift: number;
  keyLetter: string;
  score: number;
  preview: string;
}

export interface VigenereCandidate {
  key: string;
  plaintext: string;
}

export interface FrequencyGraphEntry {
  letter: string;
  english: number;
  shifted: number;
}

export interface ShiftConfidenceEntry {
  shift: number;
  keyLetter: string;
  score: number;
  preview: string;
  fitPercent: number;
  gapFromBest: number;
}

export interface BitDifferenceAnalysis {
  baselineBits: number[];
  variantBits: number[];
  changedFlags: boolean[];
  changedCount: number;
  changedPercent: number;
}

export interface RoundDiffusionEntry {
  round: number;
  moduleId: string;
  label: string;
  baselineBits: number[];
  variantBits: number[];
  changedFlags: boolean[];
  changedCount: number;
  changedPercent: number;
}

export interface RoundDiffusionChartEntry {
  round: number;
  moduleId: string;
  label: string;
  changedCount: number;
  changedPercent: number;
  barPercent: number;
}

export interface RoundContributionEntry {
  round: number;
  moduleId: string;
  label: string;
  changedCount: number;
  changedPercent: number;
  deltaChangedCount: number;
  deltaChangedPercent: number;
}

export interface RoundContributionSummary {
  entries: RoundContributionEntry[];
  biggestGain: RoundContributionEntry | null;
  plateauOrRegressionRounds: RoundContributionEntry[];
}

export interface InfluenceHeatmapColumnEntry {
  outputIndex: number;
  activationCount: number;
  activationShare: number;
  intensity: number;
}

export interface CandidatePeriodChartEntry {
  period: number;
  averageIndexOfCoincidence: number | null;
  supportingDistanceCount: number;
  iocBarPercent: number;
  supportBarPercent: number;
}

export interface AvalancheSweepEntry {
  inputIndex: number;
  changedFlags: boolean[];
  changedCount: number;
  changedPercent: number;
}

export interface AvalancheSweepExtremeEntry {
  inputIndex: number;
  changedCount: number;
  changedPercent: number;
}

export interface AvalancheSweepByteGroupEntry {
  byteIndex: number;
  startBitIndex: number;
  endBitIndex: number;
  averageChangedCount: number;
  averageChangedPercent: number;
}

export interface AvalancheSweepSummary {
  flipCount: number;
  minimumChangedCount: number;
  maximumChangedCount: number;
  averageChangedCount: number;
  medianChangedCount: number;
  standardDeviation: number;
  weakestInputs: AvalancheSweepExtremeEntry[];
  strongestInputs: AvalancheSweepExtremeEntry[];
  byteGroups: AvalancheSweepByteGroupEntry[];
}

export interface KeyScheduleStageSnapshot {
  moduleId: string;
  label: string;
  bits: number[];
}

export interface KeyScheduleAdjacentDifferenceEntry {
  fromModuleId: string;
  fromLabel: string;
  toModuleId: string;
  toLabel: string;
  width: number | null;
  changedCount: number | null;
  changedPercent: number | null;
  widthMismatch: boolean;
}

export interface KeyScheduleSweepStageEntry {
  moduleId: string;
  label: string;
  width: number;
  minimumChangedCount: number;
  maximumChangedCount: number;
  averageChangedCount: number;
  averageChangedPercent: number;
}

export interface KeyScheduleSweepCalloutEntry {
  moduleId: string;
  label: string;
  averageChangedCount: number;
  averageChangedPercent: number;
}

export interface KeyScheduleSweepRow {
  inputIndex: number;
  stageResults: Array<{
    moduleId: string;
    changedCount: number;
    changedPercent: number;
  }>;
}

export interface KeyScheduleSweepSummary {
  flipCount: number;
  stageEntries: KeyScheduleSweepStageEntry[];
  weakestStages: KeyScheduleSweepCalloutEntry[];
  strongestStages: KeyScheduleSweepCalloutEntry[];
}

export interface BitstreamRunLengthGroup {
  lengthLabel: string;
  zeroRuns: number;
  oneRuns: number;
}

export interface BitstreamRepeatedWindowEntry {
  window: string;
  count: number;
}

export interface BitstreamRepeatedWindowGroup {
  size: number;
  matches: BitstreamRepeatedWindowEntry[];
  truncated: boolean;
}

export interface BitstreamPatternHeatmapCell {
  pattern: string;
  count: number;
  share: number;
  intensity: number;
}

export interface BitstreamRandomnessAnalysis {
  bits: number[];
  sampleBitCount: number;
  zeroCount: number;
  oneCount: number;
  zeroShare: number;
  oneShare: number;
  imbalance: number;
  lowConfidence: boolean;
  longestZeroRun: number;
  longestOneRun: number;
  runLengthSummary: BitstreamRunLengthGroup[];
  transitionCounts: Record<'00' | '01' | '10' | '11', number>;
  equalAdjacentCount: number;
  differentAdjacentCount: number;
  equalAdjacentShare: number | null;
  entropyPerBit: number | null;
  entropyGap: number | null;
  transitionShares: Record<'00' | '01' | '10' | '11', number>;
  patternHeatmap: BitstreamPatternHeatmapCell[];
  repeatedWindowGroups: BitstreamRepeatedWindowGroup[];
}

const RANDOMNESS_LOW_CONFIDENCE_BIT_COUNT = 64;
const RANDOMNESS_REPEATED_WINDOW_LIMIT = 1024;
const RANDOMNESS_REPEATED_WINDOW_SIZES = [4, 8] as const;

export function hexToBits(value: string): number[] {
  return value
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('')
    .filter((digit) => /^[0-9A-F]$/.test(digit))
    .flatMap((digit) => {
      const nibble = Number.parseInt(digit, 16);
      return [3, 2, 1, 0].map((shift) => (nibble >> shift) & 1);
    });
}

export function bitsToHex(bits: number[]): string {
  if (bits.length === 0) {
    return '';
  }

  const padded = [...bits];
  while (padded.length % 4 !== 0) {
    padded.push(0);
  }

  let output = '';
  for (let index = 0; index < padded.length; index += 4) {
    const nibbleBits = padded.slice(index, index + 4);
    const nibble = nibbleBits.reduce((value, bit) => (value << 1) | (bit ? 1 : 0), 0);
    output += nibble.toString(16).toUpperCase();
  }

  return output;
}

export function bitsToAsciiText(bits: number[]): string {
  if (bits.length === 0) {
    return '';
  }

  const padded = [...bits];
  while (padded.length % 8 !== 0) {
    padded.push(0);
  }

  let output = '';
  for (let index = 0; index < padded.length; index += 8) {
    const byteBits = padded.slice(index, index + 8);
    const value = byteBits.reduce((current, bit) => (current << 1) | (bit ? 1 : 0), 0);
    output += String.fromCharCode(Math.min(value, 0x7f));
  }

  return output;
}

export function symbolToBits(symbol: string): number[] | null {
  if (symbol.length !== 1) {
    return null;
  }

  const index = SYMBOL_BIT_ALPHABET.indexOf(symbol.toUpperCase());
  if (index === -1) {
    return null;
  }

  return [4, 3, 2, 1, 0].map((shift) => (index >> shift) & 1);
}

export function bitsToAlphabetSymbol(bits: number[]): string | null {
  if (bits.length !== 5) {
    return null;
  }

  const index = bits.reduce((value, bit) => (value << 1) | (bit ? 1 : 0), 0);
  if (index < 0 || index >= SYMBOL_BIT_ALPHABET.length) {
    return null;
  }

  return SYMBOL_BIT_ALPHABET[index] ?? null;
}

export interface SymbolTextAnalysis {
  sourceText: string;
  normalizedText: string;
  symbolCount: number;
  letterCount: number;
  uniqueLetterCount: number;
  indexOfCoincidence: number | null;
  topLetters: LetterFrequencyEntry[];
  topBigrams: NGramFrequencyEntry[];
  topTrigrams: NGramFrequencyEntry[];
  repeatedFragments: RepeatedFragmentEntry[];
  candidatePeriods: CandidatePeriodEntry[];
}

export function analyzeVigenereColumns(
  normalizedText: string,
  period: number,
): VigenereColumnEntry[] {
  if (period < 1 || normalizedText.length === 0) {
    return [];
  }

  return splitIntoColumns(normalizedText, period).map((columnText, index) => {
    const counts = countLetters(columnText);

    return {
      columnIndex: index,
      text: columnText,
      letterCount: columnText.length,
      indexOfCoincidence: calculateIndexOfCoincidence([...counts.values()], columnText.length),
      topLetters: calculateTopLetters(counts, columnText.length),
      shiftCandidates: calculateShiftCandidates(columnText),
      topShiftCandidates: calculateShiftCandidates(columnText).slice(0, 3),
    };
  });
}

export function reconstructVigenereCandidate(
  normalizedText: string,
  shifts: number[],
): VigenereCandidate {
  if (normalizedText.length === 0 || shifts.length === 0) {
    return { key: '', plaintext: '' };
  }

  let plaintext = '';
  for (let index = 0; index < normalizedText.length; index += 1) {
    const shift = shifts[index % shifts.length] ?? 0;
    plaintext += decodeCaesar(normalizedText[index], shift);
  }

  return {
    key: shifts.map((shift) => String.fromCharCode(65 + shift)).join(''),
    plaintext,
  };
}

export function buildFrequencyGraphEntries(
  columnText: string,
  shift: number,
): FrequencyGraphEntry[] {
  const decoded = decodeCaesar(columnText, shift);
  const counts = countLetters(decoded);
  const total = decoded.length;

  return Array.from({ length: 26 }, (_, index) => {
    const letter = String.fromCharCode(65 + index);
    const observed = counts.get(letter) ?? 0;

    return {
      letter,
      english: ENGLISH_LETTER_FREQUENCIES[letter] ?? 0,
      shifted: total > 0 ? observed / total : 0,
    };
  });
}

export function buildShiftConfidenceEntries(
  candidates: ShiftScoreEntry[],
  limit = 5,
): ShiftConfidenceEntry[] {
  const ranked = candidates.slice(0, Math.max(1, limit));
  if (ranked.length === 0) {
    return [];
  }

  const bestScore = ranked[0]?.score ?? 0;
  const worstScore = ranked.reduce((worst, entry) => Math.max(worst, entry.score), bestScore);
  const spread = Math.max(worstScore - bestScore, 0);

  return ranked.map((entry) => ({
    shift: entry.shift,
    keyLetter: entry.keyLetter,
    score: entry.score,
    preview: entry.preview,
    fitPercent:
      spread > 0
        ? Math.max(10, ((worstScore - entry.score) / spread) * 100)
        : 100,
    gapFromBest: Math.max(0, entry.score - bestScore),
  }));
}

export function analyzeSymbolSignal(signal: Signal | null): SymbolTextAnalysis | null {
  if (!signal || signal.type !== 'symbol') {
    return null;
  }

  const sourceText = signal.value;
  const normalizedText = sourceText.toUpperCase().replace(/[^A-Z]/g, '');
  const symbolCount = sourceText.length;
  const letterCount = normalizedText.length;

  const counts = countLetters(normalizedText);
  const topLetters = calculateTopLetters(counts, letterCount);

  return {
    sourceText,
    normalizedText,
    symbolCount,
    letterCount,
    uniqueLetterCount: counts.size,
    indexOfCoincidence: calculateIndexOfCoincidence([...counts.values()], letterCount),
    topLetters,
    topBigrams: calculateTopNGrams(normalizedText, 2),
    topTrigrams: calculateTopNGrams(normalizedText, 3),
    repeatedFragments: calculateRepeatedFragments(normalizedText),
    candidatePeriods: calculateCandidatePeriods(normalizedText),
  };
}

export function parseBitString(value: string): number[] {
  return value
    .replace(/[^01]/g, '')
    .split('')
    .map((bit) => Number(bit));
}

export function flipBitAtIndex(bits: number[], index: number): number[] {
  if (index < 0 || index >= bits.length) {
    return [...bits];
  }

  return bits.map((bit, currentIndex) => (currentIndex === index ? (bit === 0 ? 1 : 0) : bit));
}

export function calculateBitDifference(a: number[], b: number[]): boolean[] {
  const maxLength = Math.max(a.length, b.length);
  return Array.from({ length: maxLength }, (_, index) => (a[index] ?? -1) !== (b[index] ?? -1));
}

export function analyzeBitDifference(baselineBits: number[], variantBits: number[]): BitDifferenceAnalysis {
  const changedFlags = calculateBitDifference(baselineBits, variantBits);
  const changedCount = changedFlags.filter(Boolean).length;

  return {
    baselineBits,
    variantBits,
    changedFlags,
    changedCount,
    changedPercent: changedFlags.length > 0 ? changedCount / changedFlags.length : 0,
  };
}

export function analyzeRoundDiffusion(
  baseline: ExecutionResult | null,
  variant: ExecutionResult | null,
): RoundDiffusionEntry[] {
  if (!baseline || !variant) {
    return [];
  }

  const baselineByModuleId = new Map(
    baseline.analysisTrace.map((entry) => [entry.moduleId, entry] as const),
  );
  const latestByRound = new Map<number, RoundDiffusionEntry>();

  for (const variantEntry of variant.analysisTrace) {
    const round = extractRoundNumber(variantEntry.moduleId);
    if (round === null) {
      continue;
    }

    const baselineEntry = baselineByModuleId.get(variantEntry.moduleId);
    if (!baselineEntry) {
      continue;
    }

    const baselineBits = getEntryBits(baselineEntry);
    const variantBits = getEntryBits(variantEntry);
    if (!baselineBits || !variantBits) {
      continue;
    }

    const diff = analyzeBitDifference(baselineBits, variantBits);
    latestByRound.set(round, {
      round,
      moduleId: variantEntry.moduleId,
      label: formatRoundDiffusionLabel(variantEntry),
      baselineBits,
      variantBits,
      changedFlags: diff.changedFlags,
      changedCount: diff.changedCount,
      changedPercent: diff.changedPercent,
    });
  }

  return [...latestByRound.values()].sort((left, right) => left.round - right.round);
}

export function buildRoundDiffusionChartEntries(
  entries: RoundDiffusionEntry[],
): RoundDiffusionChartEntry[] {
  return entries.map((entry) => ({
    round: entry.round,
    moduleId: entry.moduleId,
    label: entry.label,
    changedCount: entry.changedCount,
    changedPercent: entry.changedPercent,
    barPercent: Math.max(entry.changedPercent * 100, 2),
  }));
}

export function buildRoundContributionSummary(
  entries: RoundDiffusionEntry[],
): RoundContributionSummary {
  const orderedEntries = [...entries].sort((left, right) => left.round - right.round);
  const contributionEntries = orderedEntries.map((entry, index) => {
    const previousEntry = orderedEntries[index - 1] ?? null;
    const deltaChangedCount = previousEntry
      ? entry.changedCount - previousEntry.changedCount
      : entry.changedCount;
    const deltaChangedPercent = previousEntry
      ? entry.changedPercent - previousEntry.changedPercent
      : entry.changedPercent;

    return {
      round: entry.round,
      moduleId: entry.moduleId,
      label: entry.label,
      changedCount: entry.changedCount,
      changedPercent: entry.changedPercent,
      deltaChangedCount,
      deltaChangedPercent,
    } satisfies RoundContributionEntry;
  });

  const biggestGainCandidates =
    contributionEntries.length > 1 ? contributionEntries.slice(1) : contributionEntries;
  const biggestGain = biggestGainCandidates.reduce<RoundContributionEntry | null>((best, entry) => {
    if (!best || entry.deltaChangedCount > best.deltaChangedCount) {
      return entry;
    }
    return best;
  }, null);

  return {
    entries: contributionEntries,
    biggestGain,
    plateauOrRegressionRounds: contributionEntries.filter(
      (entry, index) => index > 0 && entry.deltaChangedCount <= 0,
    ),
  };
}

export function buildCandidatePeriodChartEntries(
  entries: CandidatePeriodEntry[],
): CandidatePeriodChartEntry[] {
  const maxIoc = entries.reduce(
    (best, entry) => Math.max(best, entry.averageIndexOfCoincidence ?? 0),
    0,
  );
  const maxSupport = entries.reduce(
    (best, entry) => Math.max(best, entry.supportingDistanceCount),
    0,
  );

  return entries.map((entry) => ({
    period: entry.period,
    averageIndexOfCoincidence: entry.averageIndexOfCoincidence,
    supportingDistanceCount: entry.supportingDistanceCount,
    iocBarPercent:
      maxIoc > 0 && entry.averageIndexOfCoincidence !== null
        ? (entry.averageIndexOfCoincidence / maxIoc) * 100
        : 0,
    supportBarPercent:
      maxSupport > 0 ? (entry.supportingDistanceCount / maxSupport) * 100 : 0,
  }));
}

export function buildInfluenceHeatmapColumnEntries(
  changedFlagsByInput: boolean[][],
): InfluenceHeatmapColumnEntry[] {
  const outputBitCount = changedFlagsByInput.reduce(
    (best, row) => Math.max(best, row.length),
    0,
  );
  const inputCount = changedFlagsByInput.length;

  return Array.from({ length: outputBitCount }, (_, outputIndex) => {
    const activationCount = changedFlagsByInput.reduce(
      (sum, row) => sum + (row[outputIndex] ? 1 : 0),
      0,
    );

    return {
      outputIndex,
      activationCount,
      activationShare: inputCount > 0 ? activationCount / inputCount : 0,
      intensity: inputCount > 0 ? activationCount / inputCount : 0,
    };
  });
}

export function buildAvalancheSweepSummary(
  entries: AvalancheSweepEntry[],
  inputBitLength: number,
): AvalancheSweepSummary | null {
  if (entries.length === 0) {
    return null;
  }

  const counts = entries.map((entry) => entry.changedCount);
  const averageChangedCount = counts.reduce((sum, value) => sum + value, 0) / counts.length;
  const sortedCounts = [...counts].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedCounts.length / 2);
  const medianChangedCount =
    sortedCounts.length % 2 === 0
      ? (sortedCounts[middleIndex - 1] + sortedCounts[middleIndex]) / 2
      : sortedCounts[middleIndex] ?? 0;
  const variance =
    counts.reduce((sum, value) => sum + ((value - averageChangedCount) ** 2), 0) / counts.length;

  const weakestInputs = [...entries]
    .sort((left, right) => {
      if (left.changedCount !== right.changedCount) {
        return left.changedCount - right.changedCount;
      }
      return left.inputIndex - right.inputIndex;
    })
    .slice(0, 8)
    .map((entry) => ({
      inputIndex: entry.inputIndex,
      changedCount: entry.changedCount,
      changedPercent: entry.changedPercent,
    }));

  const strongestInputs = [...entries]
    .sort((left, right) => {
      if (right.changedCount !== left.changedCount) {
        return right.changedCount - left.changedCount;
      }
      return left.inputIndex - right.inputIndex;
    })
    .slice(0, 8)
    .map((entry) => ({
      inputIndex: entry.inputIndex,
      changedCount: entry.changedCount,
      changedPercent: entry.changedPercent,
    }));

  return {
    flipCount: entries.length,
    minimumChangedCount: sortedCounts[0] ?? 0,
    maximumChangedCount: sortedCounts[sortedCounts.length - 1] ?? 0,
    averageChangedCount,
    medianChangedCount,
    standardDeviation: Math.sqrt(variance),
    weakestInputs,
    strongestInputs,
    byteGroups:
      inputBitLength > 0 && inputBitLength % 8 === 0
        ? buildAvalancheByteGroups(entries, inputBitLength)
        : [],
  };
}

function buildAvalancheByteGroups(
  entries: AvalancheSweepEntry[],
  inputBitLength: number,
): AvalancheSweepByteGroupEntry[] {
  const byteCount = Math.floor(inputBitLength / 8);
  const groups: AvalancheSweepByteGroupEntry[] = [];

  for (let byteIndex = 0; byteIndex < byteCount; byteIndex += 1) {
    const startBitIndex = byteIndex * 8;
    const endBitIndex = startBitIndex + 7;
    const groupEntries = entries.filter(
      (entry) => entry.inputIndex >= startBitIndex && entry.inputIndex <= endBitIndex,
    );
    if (groupEntries.length === 0) {
      continue;
    }

    const averageChangedCount =
      groupEntries.reduce((sum, entry) => sum + entry.changedCount, 0) / groupEntries.length;
    const averageChangedPercent =
      groupEntries.reduce((sum, entry) => sum + entry.changedPercent, 0) / groupEntries.length;

    groups.push({
      byteIndex,
      startBitIndex,
      endBitIndex,
      averageChangedCount,
      averageChangedPercent,
    });
  }

  return groups;
}

export function buildKeyScheduleAdjacentDifferences(
  stages: KeyScheduleStageSnapshot[],
): KeyScheduleAdjacentDifferenceEntry[] {
  const entries: KeyScheduleAdjacentDifferenceEntry[] = [];

  for (let index = 0; index < stages.length - 1; index += 1) {
    const current = stages[index];
    const next = stages[index + 1];
    if (!current || !next) {
      continue;
    }

    if (current.bits.length !== next.bits.length) {
      entries.push({
        fromModuleId: current.moduleId,
        fromLabel: current.label,
        toModuleId: next.moduleId,
        toLabel: next.label,
        width: null,
        changedCount: null,
        changedPercent: null,
        widthMismatch: true,
      });
      continue;
    }

    const difference = analyzeBitDifference(current.bits, next.bits);
    entries.push({
      fromModuleId: current.moduleId,
      fromLabel: current.label,
      toModuleId: next.moduleId,
      toLabel: next.label,
      width: current.bits.length,
      changedCount: difference.changedCount,
      changedPercent: difference.changedPercent,
      widthMismatch: false,
    });
  }

  return entries;
}

export function buildKeyScheduleSweepSummary(
  rows: KeyScheduleSweepRow[],
  stages: KeyScheduleStageSnapshot[],
): KeyScheduleSweepSummary | null {
  if (rows.length === 0 || stages.length === 0) {
    return null;
  }

  const stageEntries = stages.flatMap<KeyScheduleSweepStageEntry>((stage) => {
    const matching = rows
      .map((row) => row.stageResults.find((entry) => entry.moduleId === stage.moduleId))
      .filter(
        (
          entry,
        ): entry is {
          moduleId: string;
          changedCount: number;
          changedPercent: number;
        } => entry !== undefined,
      );

    if (matching.length === 0) {
      return [];
    }

    const counts = matching.map((entry) => entry.changedCount);
    const percents = matching.map((entry) => entry.changedPercent);

    return [{
      moduleId: stage.moduleId,
      label: stage.label,
      width: stage.bits.length,
      minimumChangedCount: Math.min(...counts),
      maximumChangedCount: Math.max(...counts),
      averageChangedCount: counts.reduce((sum, value) => sum + value, 0) / counts.length,
      averageChangedPercent: percents.reduce((sum, value) => sum + value, 0) / percents.length,
    }];
  });

  if (stageEntries.length === 0) {
    return null;
  }

  const toCallout = (entry: KeyScheduleSweepStageEntry): KeyScheduleSweepCalloutEntry => ({
    moduleId: entry.moduleId,
    label: entry.label,
    averageChangedCount: entry.averageChangedCount,
    averageChangedPercent: entry.averageChangedPercent,
  });

  const weakestStages = [...stageEntries]
    .sort((left, right) => {
      if (left.averageChangedCount !== right.averageChangedCount) {
        return left.averageChangedCount - right.averageChangedCount;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, 8)
    .map(toCallout);

  const strongestStages = [...stageEntries]
    .sort((left, right) => {
      if (right.averageChangedCount !== left.averageChangedCount) {
        return right.averageChangedCount - left.averageChangedCount;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, 8)
    .map(toCallout);

  return {
    flipCount: rows.length,
    stageEntries,
    weakestStages,
    strongestStages,
  };
}

export function analyzeBitstreamRandomness(bits: number[]): BitstreamRandomnessAnalysis {
  const normalizedBits = bits.map((bit) => (bit ? 1 : 0));
  const sampleBitCount = normalizedBits.length;
  const oneCount = normalizedBits.reduce<number>((sum, bit) => sum + bit, 0);
  const zeroCount = sampleBitCount - oneCount;
  const zeroShare = sampleBitCount > 0 ? zeroCount / sampleBitCount : 0;
  const oneShare = sampleBitCount > 0 ? oneCount / sampleBitCount : 0;
  const imbalance = Math.abs(zeroCount - oneCount);

  const transitionCounts: Record<'00' | '01' | '10' | '11', number> = {
    '00': 0,
    '01': 0,
    '10': 0,
    '11': 0,
  };
  let equalAdjacentCount = 0;
  let differentAdjacentCount = 0;

  for (let index = 0; index < normalizedBits.length - 1; index += 1) {
    const pair = `${normalizedBits[index]}${normalizedBits[index + 1]}` as '00' | '01' | '10' | '11';
    transitionCounts[pair] += 1;
    if (normalizedBits[index] === normalizedBits[index + 1]) {
      equalAdjacentCount += 1;
    } else {
      differentAdjacentCount += 1;
    }
  }

  const runs = collectBitRuns(normalizedBits);
  const longestZeroRun = runs
    .filter((run) => run.bit === 0)
    .reduce((best, run) => Math.max(best, run.length), 0);
  const longestOneRun = runs
    .filter((run) => run.bit === 1)
    .reduce((best, run) => Math.max(best, run.length), 0);
  const transitionTotal = equalAdjacentCount + differentAdjacentCount;
  const transitionShares: Record<'00' | '01' | '10' | '11', number> = {
    '00': transitionTotal > 0 ? transitionCounts['00'] / transitionTotal : 0,
    '01': transitionTotal > 0 ? transitionCounts['01'] / transitionTotal : 0,
    '10': transitionTotal > 0 ? transitionCounts['10'] / transitionTotal : 0,
    '11': transitionTotal > 0 ? transitionCounts['11'] / transitionTotal : 0,
  };
  const entropyPerBit = calculateShannonEntropy([zeroCount, oneCount], sampleBitCount);

  return {
    bits: normalizedBits,
    sampleBitCount,
    zeroCount,
    oneCount,
    zeroShare,
    oneShare,
    imbalance,
    lowConfidence: sampleBitCount < RANDOMNESS_LOW_CONFIDENCE_BIT_COUNT,
    longestZeroRun,
    longestOneRun,
    runLengthSummary: summarizeRunLengths(runs),
    transitionCounts,
    equalAdjacentCount,
    differentAdjacentCount,
    equalAdjacentShare:
      equalAdjacentCount + differentAdjacentCount > 0
        ? equalAdjacentCount / (equalAdjacentCount + differentAdjacentCount)
        : null,
    entropyPerBit,
    entropyGap: entropyPerBit !== null ? 1 - entropyPerBit : null,
    transitionShares,
    patternHeatmap: buildPatternHeatmap(normalizedBits, 3),
    repeatedWindowGroups: RANDOMNESS_REPEATED_WINDOW_SIZES.map((size) =>
      analyzeRepeatedWindows(normalizedBits, size),
    ),
  };
}

function calculateShannonEntropy(counts: number[], total: number): number | null {
  if (total === 0) {
    return null;
  }

  return counts.reduce((entropy, count) => {
    if (count === 0) {
      return entropy;
    }

    const probability = count / total;
    return entropy - probability * Math.log2(probability);
  }, 0);
}

function collectBitRuns(bits: number[]) {
  const runs: Array<{ bit: 0 | 1; length: number }> = [];
  if (bits.length === 0) {
    return runs;
  }

  let currentBit = bits[0] as 0 | 1;
  let currentLength = 1;

  for (let index = 1; index < bits.length; index += 1) {
    const bit = bits[index] as 0 | 1;
    if (bit === currentBit) {
      currentLength += 1;
      continue;
    }

    runs.push({ bit: currentBit, length: currentLength });
    currentBit = bit;
    currentLength = 1;
  }

  runs.push({ bit: currentBit, length: currentLength });
  return runs;
}

function summarizeRunLengths(
  runs: Array<{ bit: 0 | 1; length: number }>,
): BitstreamRunLengthGroup[] {
  const buckets = [
    { lengthLabel: '1', zeroRuns: 0, oneRuns: 0 },
    { lengthLabel: '2', zeroRuns: 0, oneRuns: 0 },
    { lengthLabel: '3', zeroRuns: 0, oneRuns: 0 },
    { lengthLabel: '4+', zeroRuns: 0, oneRuns: 0 },
  ];

  for (const run of runs) {
    const bucket =
      run.length === 1 ? buckets[0]
        : run.length === 2 ? buckets[1]
        : run.length === 3 ? buckets[2]
        : buckets[3];
    if (run.bit === 0) {
      bucket.zeroRuns += 1;
    } else {
      bucket.oneRuns += 1;
    }
  }

  return buckets;
}

function analyzeRepeatedWindows(
  bits: number[],
  size: number,
): BitstreamRepeatedWindowGroup {
  const cappedBits = bits.slice(0, RANDOMNESS_REPEATED_WINDOW_LIMIT);
  if (cappedBits.length < size) {
    return {
      size,
      matches: [],
      truncated: bits.length > RANDOMNESS_REPEATED_WINDOW_LIMIT,
    };
  }

  const counts = new Map<string, number>();
  for (let index = 0; index <= cappedBits.length - size; index += 1) {
    const window = cappedBits.slice(index, index + size).join('');
    counts.set(window, (counts.get(window) ?? 0) + 1);
  }

  return {
    size,
    matches: [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }
        return left[0].localeCompare(right[0]);
      })
      .slice(0, 4)
      .map(([window, count]) => ({ window, count })),
    truncated: bits.length > RANDOMNESS_REPEATED_WINDOW_LIMIT,
  };
}

function buildPatternHeatmap(bits: number[], size: number): BitstreamPatternHeatmapCell[] {
  const cappedBits = bits.slice(0, RANDOMNESS_REPEATED_WINDOW_LIMIT);
  const patternCount = 2 ** size;
  const counts = new Map<string, number>(
    Array.from({ length: patternCount }, (_, index) => [
      index.toString(2).padStart(size, '0'),
      0,
    ]),
  );

  if (cappedBits.length >= size) {
    for (let index = 0; index <= cappedBits.length - size; index += 1) {
      const pattern = cappedBits.slice(index, index + size).join('');
      counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
    }
  }

  const total = Math.max(cappedBits.length - size + 1, 0);
  const maxCount = Math.max(...counts.values(), 0);

  return [...counts.entries()].map(([pattern, count]) => ({
    pattern,
    count,
    share: total > 0 ? count / total : 0,
    intensity: maxCount > 0 ? count / maxCount : 0,
  }));
}

function calculateIndexOfCoincidence(counts: number[], totalLetters: number) {
  if (totalLetters < 2) {
    return null;
  }

  const numerator = counts.reduce((sum, count) => sum + count * (count - 1), 0);
  const denominator = totalLetters * (totalLetters - 1);
  return denominator === 0 ? null : numerator / denominator;
}

function calculateTopNGrams(text: string, size: number): NGramFrequencyEntry[] {
  const total = Math.max(text.length - size + 1, 0);
  if (total === 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (let index = 0; index <= text.length - size; index += 1) {
    const gram = text.slice(index, index + size);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] === left[1]) {
        return left[0].localeCompare(right[0]);
      }
      return right[1] - left[1];
    })
    .slice(0, 5)
    .map(([gram, count]) => ({
      gram,
      count,
      share: count / total,
    }));
}

function getEntryBits(entry: ExecutionTraceEntry): number[] | null {
  const firstOutput = Object.values(entry.outputs).find((signal) => signal.type === 'bits') ?? null;
  if (firstOutput?.type === 'bits') {
    return firstOutput.value;
  }

  const firstInput = Object.values(entry.inputs).find((signal) => signal.type === 'bits') ?? null;
  return firstInput?.type === 'bits' ? firstInput.value : null;
}

function extractRoundNumber(moduleId: string): number | null {
  const roundPart = moduleId.split('/').find((part) => /^round-\d+$/.test(part));
  if (!roundPart) {
    return null;
  }

  const parsed = Number(roundPart.replace('round-', ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRoundDiffusionLabel(entry: ExecutionTraceEntry): string {
  const parts = entry.moduleId.split('/');
  const lastPart = parts[parts.length - 1] ?? entry.moduleId;
  return lastPart.startsWith('round-') ? entry.defId : lastPart;
}

function countLetters(text: string) {
  const counts = new Map<string, number>();
  for (const letter of text) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

function calculateTopLetters(counts: Map<string, number>, letterCount: number): LetterFrequencyEntry[] {
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] === left[1]) {
        return left[0].localeCompare(right[0]);
      }
      return right[1] - left[1];
    })
    .slice(0, 5)
    .map(([letter, count]) => ({
      letter,
      count,
      share: letterCount > 0 ? count / letterCount : 0,
    }));
}

function calculateRepeatedFragments(text: string): RepeatedFragmentEntry[] {
  const entries: RepeatedFragmentEntry[] = [];

  for (let size = 5; size >= 3; size -= 1) {
    if (text.length < size * 2) {
      continue;
    }

    const positionsByFragment = new Map<string, number[]>();
    for (let index = 0; index <= text.length - size; index += 1) {
      const fragment = text.slice(index, index + size);
      const positions = positionsByFragment.get(fragment) ?? [];
      positions.push(index);
      positionsByFragment.set(fragment, positions);
    }

    for (const [fragment, positions] of positionsByFragment.entries()) {
      if (positions.length < 2) {
        continue;
      }

      const distances: number[] = [];
      for (let index = 1; index < positions.length; index += 1) {
        distances.push(positions[index] - positions[index - 1]);
      }

      entries.push({
        fragment,
        positions,
        distances,
      });
    }
  }

  return entries
    .sort((left, right) => {
      if (right.fragment.length !== left.fragment.length) {
        return right.fragment.length - left.fragment.length;
      }
      if (right.positions.length !== left.positions.length) {
        return right.positions.length - left.positions.length;
      }
      return left.fragment.localeCompare(right.fragment);
    })
    .slice(0, 8);
}

function calculateCandidatePeriods(text: string): CandidatePeriodEntry[] {
  const maxPeriod = Math.min(12, Math.floor(text.length / 2));
  if (maxPeriod < 1) {
    return [];
  }

  const repeatedFragments = calculateRepeatedFragments(text);

  const candidates: CandidatePeriodEntry[] = [];
  for (let period = 1; period <= maxPeriod; period += 1) {
    const columns = splitIntoColumns(text, period);
    const columnIocs = columns
      .map((column) => calculateIndexOfCoincidenceForText(column))
      .filter((value): value is number => value !== null);
    const averageIndexOfCoincidence =
      columnIocs.length > 0
        ? columnIocs.reduce((sum, value) => sum + value, 0) / columnIocs.length
        : null;
    const supportingDistanceCount = repeatedFragments.reduce(
      (sum, entry) =>
        sum + entry.distances.filter((distance) => distance % period === 0).length,
      0,
    );

    candidates.push({
      period,
      averageIndexOfCoincidence,
      supportingDistanceCount,
    });
  }

  return candidates
    .sort((left, right) => {
      if (right.supportingDistanceCount !== left.supportingDistanceCount) {
        return right.supportingDistanceCount - left.supportingDistanceCount;
      }
      const leftIoc = left.averageIndexOfCoincidence ?? -1;
      const rightIoc = right.averageIndexOfCoincidence ?? -1;
      if (rightIoc !== leftIoc) {
        return rightIoc - leftIoc;
      }
      return left.period - right.period;
    })
    .slice(0, 6);
}

function splitIntoColumns(text: string, period: number): string[] {
  const columns = Array.from({ length: period }, () => '');

  for (let index = 0; index < text.length; index += 1) {
    columns[index % period] += text[index];
  }

  return columns;
}

function calculateIndexOfCoincidenceForText(text: string): number | null {
  const counts = new Map<string, number>();
  for (const letter of text) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }

  return calculateIndexOfCoincidence([...counts.values()], text.length);
}

function calculateShiftCandidates(text: string): ShiftScoreEntry[] {
  if (text.length === 0) {
    return [];
  }

  const candidates: ShiftScoreEntry[] = [];
  for (let shift = 0; shift < 26; shift += 1) {
    const decoded = decodeCaesar(text, shift);
    candidates.push({
      shift,
      keyLetter: String.fromCharCode(65 + shift),
      score: calculateChiSquaredScore(decoded),
      preview: decoded.slice(0, 12),
    });
  }

  return candidates.sort((left, right) => left.score - right.score);
}

function decodeCaesar(text: string, shift: number) {
  let decoded = '';
  for (const letter of text) {
    const value = letter.charCodeAt(0) - 65;
    const shifted = (value - shift + 26) % 26;
    decoded += String.fromCharCode(65 + shifted);
  }
  return decoded;
}

function calculateChiSquaredScore(text: string) {
  if (text.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const counts = countLetters(text);
  let score = 0;
  for (let index = 0; index < 26; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const observed = counts.get(letter) ?? 0;
    const expected = (ENGLISH_LETTER_FREQUENCIES[letter] ?? 0) * text.length;
    if (expected > 0) {
      score += ((observed - expected) ** 2) / expected;
    }
  }
  return score;
}
