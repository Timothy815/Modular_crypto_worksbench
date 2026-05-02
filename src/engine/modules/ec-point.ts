import type { EcCurveDescriptor, EcPointSignal, EcPointSignalValue, Signal } from '../types';
import { normalizeBigIntHexParam } from './bigint-param';
import { parseUnsignedIntegerString } from './integer-signal';
import { isPrimeSafeIntegerBigInt, multiplicativeInverse } from './prime-field';

export interface NormalizedCurveParams {
  curve: EcCurveDescriptor;
  p: bigint;
  a: bigint;
  b: bigint;
}

export interface NormalizedAffinePoint {
  kind: 'affine';
  curve: EcCurveDescriptor;
  xDecimal: string;
  yDecimal: string;
  x: bigint;
  y: bigint;
}

export interface NormalizedInfinityPoint {
  kind: 'infinity';
  curve: EcCurveDescriptor;
}

export type NormalizedPoint = NormalizedAffinePoint | NormalizedInfinityPoint;

export const POINT_ORDER_OBSERVATION_LIMIT = 256n;

function getCurveParamError(moduleName: string, key: 'p' | 'a' | 'b' | 'x' | 'y', value: unknown): string | null {
  let parsed: bigint;
  try {
    parsed = normalizeBigIntHexParam(value, moduleName, key);
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} requires "${key}" to be a valid hex integer.`;
  }

  if (parsed < 0n) {
    return `${moduleName} requires "${key}" to be non-negative.`;
  }

  if (key === 'p') {
    if (parsed < 2n) {
      return `${moduleName} requires "p" to be a prime modulus of at least 2.`;
    }
    if (!isPrimeSafeIntegerBigInt(parsed)) {
      return `${moduleName} requires "p" to be prime.`;
    }
  }

  return null;
}

export function validateEcPointParam(
  moduleName: string,
  key: 'p' | 'a' | 'b' | 'x' | 'y',
  value: unknown,
): string | null {
  return getCurveParamError(moduleName, key, value);
}

function mod(value: bigint, modulus: bigint) {
  return ((value % modulus) + modulus) % modulus;
}

export function normalizeEcCurveParams(
  params: { p: unknown; a: unknown; b: unknown },
  moduleName: string,
): NormalizedCurveParams {
  const pError = getCurveParamError(moduleName, 'p', params.p);
  if (pError) {
    throw new Error(pError);
  }
  const aError = getCurveParamError(moduleName, 'a', params.a);
  if (aError) {
    throw new Error(aError);
  }
  const bError = getCurveParamError(moduleName, 'b', params.b);
  if (bError) {
    throw new Error(bError);
  }

  const p = normalizeBigIntHexParam(params.p, moduleName, 'p');
  const a = normalizeBigIntHexParam(params.a, moduleName, 'a');
  const b = normalizeBigIntHexParam(params.b, moduleName, 'b');

  if (a >= p || b >= p) {
    throw new Error(`${moduleName} requires "a" and "b" to be in the field range 0..${(p - 1n).toString(10)}.`);
  }

  const discriminant = mod(4n * a * a * a + 27n * b * b, p);
  if (discriminant === 0n) {
    throw new Error(`${moduleName} requires a non-singular curve: 4a^3 + 27b^2 must be nonzero modulo p.`);
  }

  return {
    curve: { p, a, b },
    p,
    a,
    b,
  };
}

export function validateEcCurveParamsStatic(params: { p: unknown; a: unknown; b: unknown }, moduleName: string): string | null {
  try {
    normalizeEcCurveParams(params, moduleName);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} curve parameters are invalid.`;
  }
}

export function validatePointSourceParamsStatic(
  params: { p: unknown; a: unknown; b: unknown; x: unknown; y: unknown },
  moduleName: string,
): string | null {
  try {
    const curve = normalizeEcCurveParams(params, moduleName);
    const xError = getCurveParamError(moduleName, 'x', params.x);
    const yError = getCurveParamError(moduleName, 'y', params.y);
    if (xError) {
      throw new Error(xError);
    }
    if (yError) {
      throw new Error(yError);
    }
    const x = normalizeBigIntHexParam(params.x, moduleName, 'x');
    const y = normalizeBigIntHexParam(params.y, moduleName, 'y');
    if (x >= curve.p || y >= curve.p) {
      throw new Error(`${moduleName} requires "x" and "y" to be in the field range 0..${(curve.p - 1n).toString(10)}.`);
    }
    if (!isAffinePointOnCurve(x, y, curve)) {
      throw new Error(`${moduleName} requires the declared point to lie on the declared curve.`);
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} point parameters are invalid.`;
  }
}

function isAffinePointOnCurve(x: bigint, y: bigint, curve: NormalizedCurveParams) {
  const left = mod(y * y, curve.p);
  const right = mod(x * x * x + curve.a * x + curve.b, curve.p);
  return left === right;
}

function parseCurveDescriptor(value: unknown, moduleName: string, label: string): EcCurveDescriptor {
  if (!value || typeof value !== 'object') {
    throw new Error(`${moduleName} expects ${label} to carry explicit curve provenance.`);
  }

  const raw = value as Record<string, unknown>;
  // EcCurveDescriptor.p/a/b are bigint at runtime, but may arrive as number or string from signal values
  const p = raw['p'];
  const a = raw['a'];
  const b = raw['b'];

  // If already bigint (normal runtime path), use directly
  if (typeof p === 'bigint' && typeof a === 'bigint' && typeof b === 'bigint') {
    return { p, a, b };
  }

  // Fallback: parse from number or string (for deserialized or mixed signals)
  const normalized = normalizeEcCurveParams({ p, a, b }, moduleName);
  return normalized.curve;
}

export function normalizeEcPointSignal(
  signal: Signal,
  moduleName: string,
  label: string,
): NormalizedPoint {
  if (signal.type !== 'ec-point') {
    throw new Error(`${moduleName} expects ${label} to be an ec-point signal`);
  }

  const value = signal.value as EcPointSignalValue;
  const curve = parseCurveDescriptor(value?.curve, moduleName, label);
  if (value.kind === 'infinity') {
    return { kind: 'infinity', curve };
  }
  if (value.kind !== 'affine') {
    throw new Error(`${moduleName} expects ${label} to be an affine point or infinity.`);
  }

  const x = parseUnsignedIntegerString(value.x, moduleName);
  const y = parseUnsignedIntegerString(value.y, moduleName);
  if (x >= curve.p || y >= curve.p) {
    throw new Error(`${moduleName} expects ${label} coordinates to be in the field range 0..${(curve.p - 1n).toString(10)}.`);
  }
  const normalizedCurve = normalizeEcCurveParams(curve, moduleName);
  if (!isAffinePointOnCurve(x, y, normalizedCurve)) {
    throw new Error(`${moduleName} expects ${label} to lie on the declared curve.`);
  }

  return {
    kind: 'affine',
    curve,
    xDecimal: x.toString(10),
    yDecimal: y.toString(10),
    x,
    y,
  };
}

export function expectPointOnCurveSignal(
  signal: Signal,
  curve: NormalizedCurveParams,
  moduleName: string,
  label: string,
): NormalizedPoint {
  const point = normalizeEcPointSignal(signal, moduleName, label);
  if (
    point.curve.p !== curve.curve.p ||
    point.curve.a !== curve.curve.a ||
    point.curve.b !== curve.curve.b
  ) {
    throw new Error(
      `${moduleName} expects ${label} to belong to curve y^2 = x^3 + ${curve.curve.a.toString(10)}x + ${curve.curve.b.toString(10)} (mod ${curve.curve.p.toString(10)}).`,
    );
  }
  return point;
}

export function createAffineEcPointSignal(
  x: bigint,
  y: bigint,
  curve: EcCurveDescriptor,
): EcPointSignal {
  return {
    type: 'ec-point',
    value: {
      kind: 'affine',
      curve,
      x: x.toString(10),
      y: y.toString(10),
    },
  };
}

export function createInfinityEcPointSignal(curve: EcCurveDescriptor): EcPointSignal {
  return {
    type: 'ec-point',
    value: {
      kind: 'infinity',
      curve,
    },
  };
}

export function formatEcPointAsText(value: EcPointSignalValue): string {
  if (value.kind === 'infinity') {
    return '∞';
  }
  return `(${value.x}, ${value.y})`;
}

export function formatEcPointAsHex(value: EcPointSignalValue): string {
  if (value.kind === 'infinity') {
    return '∞';
  }
  return `(0x${BigInt(value.x).toString(16).toUpperCase()}, 0x${BigInt(value.y).toString(16).toUpperCase()})`;
}

export function areEcCurveDescriptorsEqual(left: EcCurveDescriptor, right: EcCurveDescriptor) {
  return left.p === right.p && left.a === right.a && left.b === right.b;
}

export function areEcPointValuesEqual(left: EcPointSignalValue, right: EcPointSignalValue) {
  if (left.kind !== right.kind) {
    return false;
  }
  if (!areEcCurveDescriptorsEqual(left.curve, right.curve)) {
    return false;
  }
  if (left.kind === 'infinity') {
    return true;
  }
  return right.kind === 'affine' && left.x === right.x && left.y === right.y;
}

export function negatePoint(point: NormalizedPoint, curve: NormalizedCurveParams): EcPointSignal {
  if (point.kind === 'infinity') {
    return createInfinityEcPointSignal(curve.curve);
  }
  return createAffineEcPointSignal(point.x, mod(-point.y, curve.p), curve.curve);
}

export function doublePoint(point: NormalizedPoint, curve: NormalizedCurveParams): EcPointSignal {
  if (point.kind === 'infinity') {
    return createInfinityEcPointSignal(curve.curve);
  }
  if (point.y === 0n) {
    return createInfinityEcPointSignal(curve.curve);
  }

  const slope = mod((3n * point.x * point.x + curve.a) * multiplicativeInverse(mod(2n * point.y, curve.p), curve.p), curve.p);
  const x3 = mod(slope * slope - 2n * point.x, curve.p);
  const y3 = mod(slope * (point.x - x3) - point.y, curve.p);
  return createAffineEcPointSignal(x3, y3, curve.curve);
}

export function addPoints(
  left: NormalizedPoint,
  right: NormalizedPoint,
  curve: NormalizedCurveParams,
): EcPointSignal {
  if (left.kind === 'infinity') {
    return right.kind === 'infinity'
      ? createInfinityEcPointSignal(curve.curve)
      : createAffineEcPointSignal(right.x, right.y, curve.curve);
  }
  if (right.kind === 'infinity') {
    return createAffineEcPointSignal(left.x, left.y, curve.curve);
  }

  if (left.x === right.x) {
    if (mod(left.y + right.y, curve.p) === 0n) {
      return createInfinityEcPointSignal(curve.curve);
    }
    return doublePoint(left, curve);
  }

  const slope = mod((right.y - left.y) * multiplicativeInverse(mod(right.x - left.x, curve.p), curve.p), curve.p);
  const x3 = mod(slope * slope - left.x - right.x, curve.p);
  const y3 = mod(slope * (left.x - x3) - left.y, curve.p);
  return createAffineEcPointSignal(x3, y3, curve.curve);
}

export function scalarMultiplyPoint(
  scalar: bigint,
  point: NormalizedPoint,
  curve: NormalizedCurveParams,
): EcPointSignal {
  if (scalar < 0n) {
    throw new Error('ScalarMultiply expects a non-negative scalar.');
  }

  if (scalar === 0n || point.kind === 'infinity') {
    return createInfinityEcPointSignal(curve.curve);
  }

  let remaining = scalar;
  let accumulator: NormalizedPoint = { kind: 'infinity', curve: curve.curve };
  let current: NormalizedPoint = point;

  while (remaining > 0n) {
    if ((remaining & 1n) === 1n) {
      accumulator = normalizeEcPointSignal(
        addPoints(accumulator, current, curve),
        'ScalarMultiply',
        'accumulator',
      );
    }
    remaining >>= 1n;
    if (remaining > 0n) {
      current = normalizeEcPointSignal(doublePoint(current, curve), 'ScalarMultiply', 'current');
    }
  }

  return accumulator.kind === 'infinity'
    ? createInfinityEcPointSignal(curve.curve)
    : createAffineEcPointSignal(accumulator.x, accumulator.y, curve.curve);
}

export function getPointOrder(
  point: NormalizedPoint,
  curve: NormalizedCurveParams,
  options?: { limit?: bigint; moduleName?: string },
): bigint {
  const moduleName = options?.moduleName ?? 'PointOrder';
  const limit = options?.limit ?? POINT_ORDER_OBSERVATION_LIMIT;

  if (limit < 1n) {
    throw new Error(`${moduleName} requires an observable order limit of at least 1.`);
  }

  if (point.kind === 'infinity') {
    return 1n;
  }

  let current: NormalizedPoint = point;
  let order = 1n;

  while (current.kind !== 'infinity') {
    if (order > limit) {
      throw new Error(
        `${moduleName} order exceeds the observable workbench limit of ${limit.toString(10)} repeated point actions on this curve.`,
      );
    }

    current = normalizeEcPointSignal(
      addPoints(current, point, curve),
      moduleName,
      'order search',
    );
    order += 1n;
  }

  return order;
}
