import { describe, expect, it } from 'vitest';

import { computeModulusAnalysis, isExponentCoprime } from './modexp-analysis';

describe('computeModulusAnalysis', () => {
  it('identifies prime modulus', () => {
    const result = computeModulusAnalysis(17);
    expect(result.isPrime).toBe(true);
    expect(result.groupOrder).toBe(16);
    expect(result.smallFactors).toEqual([]);
  });

  it('identifies prime modulus 257', () => {
    const result = computeModulusAnalysis(257);
    expect(result.isPrime).toBe(true);
    expect(result.groupOrder).toBe(256);
  });

  it('identifies composite modulus', () => {
    const result = computeModulusAnalysis(15);
    expect(result.isPrime).toBe(false);
    expect(result.groupOrder).toBe(8); // phi(15) = phi(3)*phi(5) = 2*4 = 8
  });

  it('identifies composite modulus 12', () => {
    const result = computeModulusAnalysis(12);
    expect(result.isPrime).toBe(false);
    expect(result.groupOrder).toBe(4); // phi(12) = 4
  });

  it('identifies small factors of composite modulus', () => {
    const result = computeModulusAnalysis(15);
    expect(result.smallFactors).toContain(3);
    expect(result.smallFactors).toContain(5);
  });

  it('RSA-like: two primes p=3 q=5, modulus=15 has groupOrder=8', () => {
    // phi(15) = (3-1)*(5-1) = 8
    const result = computeModulusAnalysis(15);
    expect(result.groupOrder).toBe(8);
  });

  it('modulus 2 is prime with groupOrder 1', () => {
    const result = computeModulusAnalysis(2);
    expect(result.isPrime).toBe(true);
    expect(result.groupOrder).toBe(1);
  });
});

describe('isExponentCoprime', () => {
  it('e=3 is coprime to phi(15)=8', () => {
    expect(isExponentCoprime(3, 8)).toBe(true);
  });

  it('e=4 is NOT coprime to phi(15)=8', () => {
    expect(isExponentCoprime(4, 8)).toBe(false); // gcd(4,8)=4
  });

  it('e=65537 is coprime to phi(3*5=15)=8', () => {
    expect(isExponentCoprime(65537, 8)).toBe(true); // 65537 is odd
  });

  it('e=1 is coprime to any groupOrder', () => {
    expect(isExponentCoprime(1, 16)).toBe(true);
  });

  it('handles zero groupOrder safely', () => {
    expect(isExponentCoprime(3, 0)).toBe(false);
  });
});
