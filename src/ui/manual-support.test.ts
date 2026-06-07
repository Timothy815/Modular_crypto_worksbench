import { describe, expect, it } from 'vitest';

import { USER_MANUAL_SECTIONS } from './manual-content';
import { buildManualIndex, searchManualContent } from './manual-support';

describe('manual support helpers', () => {
  it('presents the contract top-level section order', () => {
    expect(USER_MANUAL_SECTIONS.map((section) => section.id)).toEqual([
      'start-here',
      'core-workflows',
      'find-learning-content',
      'reference',
    ]);
  });

  it('builds a stable alphabetical index from manual terms', () => {
    const index = buildManualIndex(USER_MANUAL_SECTIONS);

    expect(index.length).toBeGreaterThan(10);
    expect(index.every((entry, indexPosition) => {
      if (indexPosition === 0) {
        return true;
      }
      return index[indexPosition - 1]!.term.localeCompare(entry.term) <= 0;
    })).toBe(true);
  });

  it('searches titles, body text, and index terms', () => {
    const compositeResults = searchManualContent(USER_MANUAL_SECTIONS, 'create composite');
    expect(compositeResults.some((result) => result.entryId === 'create-composite')).toBe(true);

    const parityResults = searchManualContent(USER_MANUAL_SECTIONS, 'verify_parity.py');
    expect(parityResults.some((result) => result.entryId === 'export-and-parity')).toBe(true);

    const flagshipResults = searchManualContent(USER_MANUAL_SECTIONS, 'flagship labs');
    expect(flagshipResults.some((result) => result.entryId === 'find-flagship-labs')).toBe(true);
  });
});
