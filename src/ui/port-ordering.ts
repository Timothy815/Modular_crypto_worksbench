import type { PortDef } from '../engine/types';

export type OrderedPortDirection = 'input' | 'output';

export function clonePortOrder(portOrder?: string[]): string[] | undefined {
  return portOrder ? [...portOrder] : undefined;
}

export function normalizePortOrder(portNames: string[], storedPortOrder?: string[]): string[] {
  const remaining = new Set(portNames);
  const ordered: string[] = [];

  for (const portName of storedPortOrder ?? []) {
    if (remaining.has(portName)) {
      ordered.push(portName);
      remaining.delete(portName);
    }
  }

  for (const portName of portNames) {
    if (remaining.has(portName)) {
      ordered.push(portName);
      remaining.delete(portName);
    }
  }

  return ordered;
}

export function normalizePortOrderOverride(
  portNames: string[],
  storedPortOrder?: string[],
): string[] | undefined {
  const normalized = normalizePortOrder(portNames, storedPortOrder);
  return normalized.every((portName, index) => portName === portNames[index]) ? undefined : normalized;
}

export function getOrderedPorts<TPort extends PortDef>(
  ports: TPort[],
  storedPortOrder?: string[],
): TPort[] {
  const portByName = new Map(ports.map((port) => [port.name, port]));
  return normalizePortOrder(
    ports.map((port) => port.name),
    storedPortOrder,
  )
    .map((portName) => portByName.get(portName))
    .filter((port): port is TPort => Boolean(port));
}

export function movePortInOrder(
  portNames: string[],
  storedPortOrder: string[] | undefined,
  portName: string,
  delta: -1 | 1,
): string[] | undefined {
  const ordered = normalizePortOrder(portNames, storedPortOrder);
  const currentIndex = ordered.findIndex((candidate) => candidate === portName);
  if (currentIndex === -1) {
    return normalizePortOrderOverride(portNames, storedPortOrder);
  }

  const nextIndex = currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= ordered.length) {
    return normalizePortOrderOverride(portNames, storedPortOrder);
  }

  const nextOrdered = [...ordered];
  const [movedPort] = nextOrdered.splice(currentIndex, 1);
  nextOrdered.splice(nextIndex, 0, movedPort);
  return normalizePortOrderOverride(portNames, nextOrdered);
}
