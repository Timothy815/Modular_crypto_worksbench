import { describe, expect, it } from 'vitest';

import { Counter } from '../engine/modules/counter';
import { LFSR } from '../engine/modules/lfsr';
import { Rotor } from '../engine/modules/rotor';
import type { ModuleInstance } from '../engine/types';
import { buildLiveStateSummary } from './live-state-display';

describe('buildLiveStateSummary', () => {
  it('formats rotor positions as letters and shows start-to-current progression', () => {
    const moduleInstance: ModuleInstance = {
      id: 'rotor-a',
      defId: 'Rotor',
      params: {
        wiring: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        position: 0,
        ringOffset: 0,
        notches: '',
      },
    };

    const summary = buildLiveStateSummary(
      Rotor,
      moduleInstance,
      { ...moduleInstance.params, position: 3 },
      { ...moduleInstance.params, position: 2 },
    );

    expect(summary?.label).toBe('pos');
    expect(summary?.startText).toBe('A');
    expect(summary?.currentText).toBe('D');
    expect(summary?.displayText).toBe('A -> D');
    expect(summary?.advancedSinceLastTick).toBe(true);
  });

  it('formats counter live state numerically', () => {
    const moduleInstance: ModuleInstance = {
      id: 'counter-a',
      defId: 'Counter',
      params: {
        width: 4,
        value: 0,
        step: 1,
      },
    };

    const summary = buildLiveStateSummary(
      Counter,
      moduleInstance,
      { ...moduleInstance.params, value: 3 },
      { ...moduleInstance.params, value: 2 },
    );

    expect(summary?.label).toBe('count');
    expect(summary?.displayText).toBe('0 -> 3');
  });

  it('formats LFSR live state as compact bit text', () => {
    const moduleInstance: ModuleInstance = {
      id: 'lfsr-a',
      defId: 'LFSR',
      params: {
        seed: [1, 0, 0, 1, 1],
        taps: '0,2',
        outputLength: 5,
      },
    };

    const summary = buildLiveStateSummary(
      LFSR,
      moduleInstance,
      { ...moduleInstance.params, seed: [0, 1, 0, 0, 1] },
      { ...moduleInstance.params, seed: [1, 1, 0, 0, 1] },
    );

    expect(summary?.label).toBe('reg');
    expect(summary?.startText).toBe('10011');
    expect(summary?.currentText).toBe('01001');
    expect(summary?.advancedSinceLastTick).toBe(true);
  });
});
