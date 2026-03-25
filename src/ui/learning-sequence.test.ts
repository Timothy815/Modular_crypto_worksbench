import { describe, expect, it } from 'vitest';

import {
  compareLearningItems,
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
});
