import { describe, expect, it } from 'vitest';

import { USER_MANUAL_SECTIONS } from './manual-content';
import { buildManualIndex, searchManualContent } from './manual-support';

describe('manual support helpers', () => {
  it('presents the V2 contract top-level section order', () => {
    expect(USER_MANUAL_SECTIONS.map((section) => section.id)).toEqual([
      'start-here',
      'core-workflows',
      'troubleshoot',
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

  it('exposes all six required V2 intent gateways in start-here', () => {
    const startHere = USER_MANUAL_SECTIONS.find((s) => s.id === 'start-here');
    const gatewayEntry = startHere?.entries.find((e) => e.id === 'intent-gateways');

    expect(gatewayEntry).toBeDefined();
    expect(gatewayEntry?.intents?.length).toBe(6);

    const intents = gatewayEntry?.intents?.map((g) => g.intent) ?? [];
    expect(intents).toContain('I want a first tour');
    expect(intents).toContain('I want to build');
    expect(intents).toContain('I want repair practice');
    expect(intents).toContain('I want to learn AES');
    expect(intents).toContain('I want to learn ECC');
    expect(intents).toContain('I want to verify or export');
  });

  it('includes route blocks on required high-value entries', () => {
    const allEntries = USER_MANUAL_SECTIONS.flatMap((s) => s.entries);
    const requiredIds = [
      'where-to-begin',
      'atlas-and-learning-surfaces',
      'create-composite',
      'create-iterator',
      'verification-station',
      'export-and-parity',
      'aes-route',
      'ecc-route',
      'find-flagship-labs',
    ];

    for (const id of requiredIds) {
      const entry = allEntries.find((e) => e.id === id);
      expect(entry?.routeBlock, `expected routeBlock on entry ${id}`).toBeDefined();
    }
  });

  it('includes all five required troubleshooting entries', () => {
    const troubleshoot = USER_MANUAL_SECTIONS.find((s) => s.id === 'troubleshoot');

    expect(troubleshoot).toBeDefined();
    expect(troubleshoot?.entries.length).toBeGreaterThanOrEqual(5);

    const ids = troubleshoot?.entries.map((e) => e.id) ?? [];
    expect(ids).toContain('why-cant-create-composite');
    expect(ids).toContain('why-challenge-empty');
    expect(ids).toContain('why-save-not-writing');
    expect(ids).toContain('why-reusable-not-portable');
    expect(ids).toContain('why-python-not-matching');
  });

  it('troubleshooting entries have complete diagnosis blocks', () => {
    const troubleshoot = USER_MANUAL_SECTIONS.find((s) => s.id === 'troubleshoot');

    for (const entry of troubleshoot?.entries ?? []) {
      expect(entry.diagnosis?.likelyCause, `${entry.id} missing likelyCause`).toBeTruthy();
      expect(entry.diagnosis?.whatToCheck, `${entry.id} missing whatToCheck`).toBeTruthy();
      expect(entry.diagnosis?.whatToDoNext, `${entry.id} missing whatToDoNext`).toBeTruthy();
    }
  });

  it('all seeAlso IDs resolve to valid entries', () => {
    const allEntries = USER_MANUAL_SECTIONS.flatMap((s) => s.entries);
    const validIds = new Set(allEntries.map((e) => e.id));

    for (const entry of allEntries) {
      for (const ref of entry.seeAlso ?? []) {
        expect(validIds.has(ref), `entry "${entry.id}" has seeAlso ref "${ref}" that does not exist`).toBe(true);
      }
    }
  });

  it('searches V2 task-language terms', () => {
    const intentResults = searchManualContent(USER_MANUAL_SECTIONS, 'intent gateways');
    expect(intentResults.some((r) => r.entryId === 'intent-gateways')).toBe(true);

    const compositeErrorResults = searchManualContent(USER_MANUAL_SECTIONS, 'create composite not working');
    expect(compositeErrorResults.some((r) => r.entryId === 'why-cant-create-composite')).toBe(true);

    const parityMismatchResults = searchManualContent(USER_MANUAL_SECTIONS, 'parity mismatch');
    expect(parityMismatchResults.some((r) => r.entryId === 'why-python-not-matching')).toBe(true);
  });
});
