export function parseUnsignedIntegerString(value: string, moduleName: string): bigint {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${moduleName} expects a non-negative integer value`);
  }

  return BigInt(normalized);
}

export function normalizeUnsignedIntegerSignalValue(value: unknown, moduleName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${moduleName} expects an integer signal encoded as a decimal string`);
  }

  const parsed = parseUnsignedIntegerString(value, moduleName);
  return parsed.toString(10);
}

export function formatUnsignedIntegerAsHex(value: string): string {
  const parsed = parseUnsignedIntegerString(value, 'Integer formatting');
  return `0x${parsed.toString(16).toUpperCase()}`;
}
