import { describe, expect, it } from 'vitest';

import { USER_MANUAL_SECTIONS } from './manual-content';
import { buildManualIndex, searchManualContent } from './manual-support';

describe('manual support helpers', () => {
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
    const splitResults = searchManualContent(USER_MANUAL_SECTIONS, 'split view');
    expect(splitResults.some((result) => result.entryId === 'choosing-a-layout')).toBe(true);

    const parityResults = searchManualContent(USER_MANUAL_SECTIONS, 'verify_parity.py');
    expect(parityResults.some((result) => result.entryId === 'parity-and-known-vectors')).toBe(true);
  });
});
