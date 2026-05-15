import type { EcPointSignalValue } from '../types';
import {
  formatEcPointAsText,
  normalizeEcCurveParams,
  normalizeEcPointSignal,
  scalarMultiplyPoint,
  validatePointSourceParamsStatic,
} from '../modules/ec-point';
import { normalizeBigIntHexParam } from '../modules/bigint-param';

export interface ToyPointMapGridPoint {
  x: number;
  y: number;
  label: string;
  isSelected: boolean;
  walkLabels: string[];
}

export interface ToyPointMapWalkEntry {
  scalar: number;
  label: string;
  point: EcPointSignalValue;
  pointText: string;
  isInfinity: boolean;
  x: number | null;
  y: number | null;
}

export interface ToyPointMapAnalysis {
  curveLabel: string;
  totalAffinePoints: number;
  fieldSize: number;
  selectedPointText: string;
  walkLength: number;
  validPoints: ToyPointMapGridPoint[];
  walkEntries: ToyPointMapWalkEntry[];
}

export interface ToyPointMapParams {
  p?: unknown;
  a?: unknown;
  b?: unknown;
  selectedX?: unknown;
  selectedY?: unknown;
  walkLength?: unknown;
}

const MAX_TOY_POINT_MAP_FIELD = 31n;
const MAX_TOY_POINT_MAP_WALK = 8;

function mod(value: bigint, modulus: bigint) {
  return ((value % modulus) + modulus) % modulus;
}

function parseWalkLength(raw: unknown) {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    throw new Error('ToyPointMap requires walkLength to be an integer.');
  }
  if (raw < 1 || raw > MAX_TOY_POINT_MAP_WALK) {
    throw new Error(`ToyPointMap requires walkLength to be between 1 and ${MAX_TOY_POINT_MAP_WALK}.`);
  }
  return raw;
}

function normalizeToyPointMapParams(params: ToyPointMapParams) {
  const curve = normalizeEcCurveParams({ p: params.p, a: params.a, b: params.b }, 'ToyPointMap');
  if (curve.p > MAX_TOY_POINT_MAP_FIELD) {
    throw new Error(
      `ToyPointMap requires a bounded toy curve with p <= ${MAX_TOY_POINT_MAP_FIELD.toString(10)} so the point map stays readable.`,
    );
  }

  const validationMessage = validatePointSourceParamsStatic(
    {
      p: params.p,
      a: params.a,
      b: params.b,
      x: params.selectedX,
      y: params.selectedY,
    },
    'ToyPointMap',
  );
  if (validationMessage) {
    throw new Error(validationMessage.replace('PointSource', 'ToyPointMap'));
  }

  const walkLength = parseWalkLength(params.walkLength);
  const selectedX = normalizeBigIntHexParam(params.selectedX, 'ToyPointMap', 'selectedX');
  const selectedY = normalizeBigIntHexParam(params.selectedY, 'ToyPointMap', 'selectedY');
  const selectedSignal = {
    type: 'ec-point' as const,
    value: {
      kind: 'affine' as const,
      curve: curve.curve,
      x: selectedX.toString(10),
      y: selectedY.toString(10),
    },
  };
  const selectedPoint = normalizeEcPointSignal(selectedSignal, 'ToyPointMap', 'selected point');

  if (selectedPoint.kind !== 'affine') {
    throw new Error('ToyPointMap requires one affine selected point.');
  }

  return {
    curve,
    walkLength,
    selectedPoint,
  };
}

export function computeToyPointMapAnalysis(params: ToyPointMapParams): ToyPointMapAnalysis {
  const { curve, walkLength, selectedPoint } = normalizeToyPointMapParams(params);

  const walkEntries: ToyPointMapWalkEntry[] = [];
  for (let scalar = 1; scalar <= walkLength; scalar += 1) {
    const signal = scalarMultiplyPoint(BigInt(scalar), selectedPoint, curve);
    const point = signal.value;
    walkEntries.push({
      scalar,
      label: scalar === 1 ? 'P' : `${scalar}P`,
      point,
      pointText: formatEcPointAsText(point),
      isInfinity: point.kind === 'infinity',
      x: point.kind === 'affine' ? Number(BigInt(point.x)) : null,
      y: point.kind === 'affine' ? Number(BigInt(point.y)) : null,
    });
  }

  const walkLabelsByCoordinate = new Map<string, string[]>();
  for (const entry of walkEntries) {
    if (entry.isInfinity || entry.x === null || entry.y === null) continue;
    const key = `${entry.x},${entry.y}`;
    const labels = walkLabelsByCoordinate.get(key) ?? [];
    labels.push(entry.label);
    walkLabelsByCoordinate.set(key, labels);
  }

  const validPoints: ToyPointMapGridPoint[] = [];
  for (let x = 0n; x < curve.p; x += 1n) {
    const rhs = mod(x * x * x + curve.a * x + curve.b, curve.p);
    for (let y = 0n; y < curve.p; y += 1n) {
      if (mod(y * y, curve.p) !== rhs) continue;
      const xNumber = Number(x);
      const yNumber = Number(y);
      const key = `${xNumber},${yNumber}`;
      validPoints.push({
        x: xNumber,
        y: yNumber,
        label: `(${xNumber}, ${yNumber})`,
        isSelected: selectedPoint.x === x && selectedPoint.y === y,
        walkLabels: walkLabelsByCoordinate.get(key) ?? [],
      });
    }
  }

  return {
    curveLabel: `y² = x³ + ${curve.a.toString(10)}x + ${curve.b.toString(10)} (mod ${curve.p.toString(10)})`,
    totalAffinePoints: validPoints.length,
    fieldSize: Number(curve.p),
    selectedPointText: `(${selectedPoint.xDecimal}, ${selectedPoint.yDecimal})`,
    walkLength,
    validPoints,
    walkEntries,
  };
}
