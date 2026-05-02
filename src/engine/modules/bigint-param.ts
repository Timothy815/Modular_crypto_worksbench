/**
 * Shared helper for module params that represent large non-negative integers stored as hex strings.
 *
 * The param kind is 'bigint-hex'. Values are persisted as uppercase hex strings without a 0x prefix
 * (e.g. "11" for 17, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F" for secp256k1 p).
 *
 * Backward compatibility: if a saved project still carries a JavaScript number for a bigint-hex param,
 * the value is accepted and silently coerced. This preserves all workspaces created before the
 * Real-Scale Arithmetic Substrate migration.
 */

export function normalizeBigIntHexParam(value: unknown, moduleName: string, fieldName: string): bigint {
  // Runtime bigint values pass through directly (normal engine signal flow)
  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new Error(`${moduleName} requires "${fieldName}" to be non-negative.`);
    }
    return value;
  }

  // Backward compat: legacy projects may carry a JavaScript number
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new Error(`${moduleName} requires "${fieldName}" to be a non-negative integer.`);
    }
    return BigInt(Math.trunc(value));
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${moduleName} requires "${fieldName}" to be a non-empty hex string.`);
  }

  const stripped = value.trim().replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]+$/.test(stripped)) {
    throw new Error(
      `${moduleName} requires "${fieldName}" to be a valid hex string (got: "${value}").`,
    );
  }

  return BigInt(`0x${stripped}`);
}

export function validateBigIntHexParam(
  moduleName: string,
  fieldName: string,
  value: unknown,
): string | null {
  try {
    normalizeBigIntHexParam(value, moduleName, fieldName);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} requires "${fieldName}" to be a valid hex string.`;
  }
}

/** Format a bigint as an uppercase hex string without 0x prefix, for use as a persisted param value. */
export function bigIntToHexParam(value: bigint): string {
  return value.toString(16).toUpperCase();
}
