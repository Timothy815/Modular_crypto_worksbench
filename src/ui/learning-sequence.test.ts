import { describe, expect, it } from 'vitest';

import {
  compareLearningItems,
  getFirstLearningItemInGroup,
  getLearningGroupLabel,
  getRecommendedAfterTitles,
  getSortedLearningGroups,
  inferLearningStage,
  isCoreLearningItem,
  type SequencedLearningItem,
} from './learning-sequence';

describe('learning-sequence helpers', () => {
  it('infers framing before streams and message structure for shipped vocabulary families', () => {
    const framing: SequencedLearningItem = {
      id: 'visible-subkey-bus',
      title: 'Visible Sub-Key Bus',
      group: 'Key Schedule',
    };
    const stream: SequencedLearningItem = {
      id: 'filtered-keystream',
      title: 'Filtered Keystream',
      group: 'Conditional Clocking',
    };
    const structure: SequencedLearningItem = {
      id: 'visible-message-window',
      title: 'Visible Message Window',
      group: 'Symbol Structure',
    };

    expect(inferLearningStage(framing)).toBe('framing-and-protocol-context');
    expect(inferLearningStage(stream)).toBe('streams-and-scheduling');
    expect(inferLearningStage(structure)).toBe('message-structure-and-composition');
    expect([framing, stream, structure].sort(compareLearningItems).map((item) => item.id)).toEqual([
      'visible-subkey-bus',
      'filtered-keystream',
      'visible-message-window',
    ]);
  });

  it('sorts groups by suggested stage instead of insertion order', () => {
    const items: SequencedLearningItem[] = [
      { id: 'visible-message-window', title: 'Visible Message Window', group: 'Symbol Structure' },
      { id: 'bridge', title: 'Bridge', group: 'Foundations' },
      { id: 'advanced-rotor-stepping', title: 'Advanced Rotor Stepping', group: 'Rotor Realism' },
    ];

    expect(getSortedLearningGroups(items)).toEqual([
      'Foundations',
      'Rotor Realism',
      'Symbol Structure',
    ]);
  });

  it('places integrity before asymmetric verification and systems composition in the late path', () => {
    const items: SequencedLearningItem[] = [
      { id: 'visible-secure-handshake', title: 'Visible Secure Handshake', group: 'Systems Composition' },
      { id: 'visible-tamper-check', title: 'Visible Tamper Check', group: 'Integrity' },
      { id: 'visible-signature-verification', title: 'Visible Signature Verification', group: 'Asymmetric Verification' },
      { id: 'toy-rsa', title: 'Toy RSA', group: 'Number Theory' },
    ];

    expect(items.map(inferLearningStage)).toEqual([
      'asymmetric-verification-and-systems-composition',
      'integrity-and-authentication',
      'asymmetric-verification-and-systems-composition',
      'advanced-arithmetic-and-number-theory',
    ]);

    expect([...items].sort(compareLearningItems).map((item) => item.id)).toEqual([
      'toy-rsa',
      'visible-tamper-check',
      'visible-signature-verification',
      'visible-secure-handshake',
    ]);

    expect(getSortedLearningGroups(items)).toEqual([
      'Number Theory',
      'Integrity',
      'Asymmetric Verification',
      'Systems Composition',
    ]);
  });

  it('resolves best-after titles from shared id hints', () => {
    const items: SequencedLearningItem[] = [
      { id: 'visible-symbol-scramble', title: 'Visible Symbol Scramble', group: 'Symbol Permutation' },
      { id: 'visible-message-window', title: 'Visible Message Window', group: 'Symbol Structure' },
    ];

    expect(getRecommendedAfterTitles(items, items[1])).toEqual(['Visible Symbol Scramble']);
  });

  it('treats cryptanalysis items as optional by default', () => {
    const item: SequencedLearningItem = {
      id: 'avalanche-effect',
      title: 'The Avalanche Effect',
      group: 'Cryptanalysis',
    };

    expect(isCoreLearningItem(item)).toBe(false);
  });

  it('builds stage-aware group labels for selector surfaces', () => {
    expect(getLearningGroupLabel('Integrity', 2)).toBe(
      'Stage 10 · Integrity And Authentication — Integrity (2 items)',
    );
    expect(getLearningGroupLabel('Systems Composition', 1)).toBe(
      'Stage 11 · Asymmetric Verification And Systems Composition — Systems Composition (1 item)',
    );
  });

  it('chooses the first group item by suggested learning order instead of source order', () => {
    const items: SequencedLearningItem[] = [
      {
        id: 'visible-secure-handshake',
        title: 'Visible Secure Handshake',
        group: 'Systems Composition',
        order: 255,
      },
      {
        id: 'visible-signature-verification',
        title: 'Visible Signature Verification',
        group: 'Systems Composition',
        order: 245,
      },
    ];

    expect(getFirstLearningItemInGroup(items, 'Systems Composition')?.id).toBe(
      'visible-signature-verification',
    );
  });
});
