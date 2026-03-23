import type { Signal } from '../engine/types';
import { ENGLISH_LETTER_FREQUENCIES } from './cryptanalysis-data';

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
