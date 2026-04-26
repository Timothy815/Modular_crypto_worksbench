export interface ModulusAnalysis {
  modulus: number;
  isPrime: boolean;
  groupOrder: number; // phi(modulus)
  smallFactors: number[]; // prime factors if not prime and modulus is small enough
  isAnalysisExact: boolean;
}

const MAX_EXACT_MODULUS = 100_000;

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function isPrimeTrialDivision(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function smallPrimeFactors(n: number): number[] {
  const factors: number[] = [];
  let remaining = n;
  for (let p = 2; p * p <= remaining && p < 1000; p++) {
    if (remaining % p === 0) {
      factors.push(p);
      while (remaining % p === 0) remaining = Math.floor(remaining / p);
    }
  }
  if (remaining > 1) factors.push(remaining);
  return factors;
}

function eulerTotient(n: number): number {
  if (isPrimeTrialDivision(n)) return n - 1;
  // For small n, compute directly via GCD
  if (n <= 10_000) {
    let count = 0;
    for (let i = 1; i < n; i++) {
      if (gcd(i, n) === 1) count++;
    }
    return count;
  }
  // Fallback via factorization formula
  let result = n;
  let temp = n;
  for (let p = 2; p * p <= temp; p++) {
    if (temp % p === 0) {
      while (temp % p === 0) temp = Math.floor(temp / p);
      result -= Math.floor(result / p);
    }
  }
  if (temp > 1) result -= Math.floor(result / temp);
  return result;
}

export function computeModulusAnalysis(modulus: number): ModulusAnalysis {
  if (!Number.isInteger(modulus) || modulus < 2) {
    return {
      modulus,
      isPrime: false,
      groupOrder: 0,
      smallFactors: [],
      isAnalysisExact: false,
    };
  }

  const isPrime = isPrimeTrialDivision(modulus);
  const groupOrder = modulus <= MAX_EXACT_MODULUS ? eulerTotient(modulus) : 0;
  const smallFactors = !isPrime ? smallPrimeFactors(modulus) : [];

  return {
    modulus,
    isPrime,
    groupOrder,
    smallFactors,
    isAnalysisExact: modulus <= MAX_EXACT_MODULUS,
  };
}

export function isExponentCoprime(exponent: number, groupOrder: number): boolean {
  return groupOrder > 0 && gcd(exponent, groupOrder) === 1;
}

export function getModulusAnalysisFromParams(params: { modulus?: unknown }): ModulusAnalysis | null {
  try {
    const modulus = params.modulus;
    if (typeof modulus !== 'number' || !Number.isFinite(modulus)) return null;
    return computeModulusAnalysis(modulus);
  } catch {
    return null;
  }
}
