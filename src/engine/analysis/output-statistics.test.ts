import { describe, expect, it } from 'vitest';

import {
  computeByteFrequency,
  computeOutputStatistics,
  computeRunsUniformity,
} from './output-statistics';

describe('output statistics validity states', () => {
  it('marks coarse bucket mode when the sample is too small for 256-bucket chi-squared', () => {
    const values = Array.from({ length: 256 }, (_, index) => index);
    const result = computeByteFrequency(values, 8);

    expect(result.bucketCount).toBe(16);
    expect(result.bucketMode).toBe('coarse');
    expect(result.sampleValid).toBe(true);
    expect(result.validity).toBe('coarse-buckets');
  });

  it('marks chi-squared invalid when expected counts remain too small even after coarse bucketing', () => {
    const values = Array.from({ length: 32 }, (_, index) => index % 16);
    const result = computeByteFrequency(values, 8);

    expect(result.bucketCount).toBe(16);
    expect(result.expectedCount).toBe(2);
    expect(result.sampleValid).toBe(false);
    expect(result.validity).toBe('low-sample');
  });

  it('marks runs validity as prerequisite failed when the monobit prerequisite does not hold', () => {
    const result = computeRunsUniformity(new Array(1024).fill(0));

    expect(result.prerequisitePasses).toBe(false);
    expect(result.sampleValid).toBe(false);
    expect(result.validity).toBe('prerequisite-failed');
  });

  it('marks wide-output analyses as projected-byte mode with limited evidence when few tests are valid', () => {
    const observations = [
      new Array(32).fill(0),
      new Array(32).fill(1),
      Array.from({ length: 32 }, (_, index) => index % 2),
      Array.from({ length: 32 }, (_, index) => (index + 1) % 2),
      new Array(32).fill(0),
      new Array(32).fill(1),
      Array.from({ length: 32 }, (_, index) => index % 2),
      Array.from({ length: 32 }, (_, index) => (index + 1) % 2),
    ];

    const result = computeOutputStatistics(observations, 32, 'sampled', true);

    expect(result.isWideOutput).toBe(true);
    expect(result.analysisUnitLabel).toBe('projected byte');
    expect(result.byteEntropy.validity).toBe('valid');
    expect(result.correlation.validity).toBe('low-sample');
    expect(result.profileLabel).toBe('limited evidence');
  });
});
