import type { ExecutionResult, Project, Signal } from '../engine/types';
import { getConnectionComparisonKey } from './workspace-comparison';

export interface TickPulseProjectionEntry {
  connectionKey: string;
  targetModuleId: string;
  domain: 'bits' | 'symbol' | 'integer' | 'ec-point';
  visible: boolean;
}

export interface TickPulseProjection {
  mode: 'wire' | 'halo';
  wireConnectionKeys: string[];
  haloModuleIds: string[];
  domainByConnectionKey: Record<string, TickPulseProjectionEntry['domain']>;
  domainByModuleId: Record<string, TickPulseProjectionEntry['domain']>;
}

const MAX_VISIBLE_WIRE_PULSES = 24;

function isNonEmptySignal(signal: Signal | null | undefined) {
  if (!signal) {
    return false;
  }

  switch (signal.type) {
    case 'bits':
      return signal.value.length > 0;
    case 'symbol':
      return signal.value.length > 0;
    case 'integer':
      return signal.value.trim().length > 0;
    case 'ec-point':
      return true;
  }
}

export function deriveTickActiveConnectionKeys(
  project: Project,
  execution: ExecutionResult | null,
): string[] {
  if (!execution) {
    return [];
  }

  return project.connections.flatMap((connection) => {
    const signal = execution.outputsByModuleId[connection.from.moduleId]?.[connection.from.port];
    return isNonEmptySignal(signal) ? [getConnectionComparisonKey(connection)] : [];
  });
}

export function projectTickPulseVisibility(
  entries: TickPulseProjectionEntry[],
): TickPulseProjection {
  const visibleEntries = entries.filter((entry) => entry.visible);
  const domainByConnectionKey = Object.fromEntries(
    visibleEntries.map((entry) => [entry.connectionKey, entry.domain]),
  ) as Record<string, TickPulseProjectionEntry['domain']>;

  if (visibleEntries.length > MAX_VISIBLE_WIRE_PULSES) {
    const domainByModuleId = visibleEntries.reduce<
      Record<string, TickPulseProjectionEntry['domain']>
    >((map, entry) => {
      if (!(entry.targetModuleId in map)) {
        map[entry.targetModuleId] = entry.domain;
      }
      return map;
    }, {});

    return {
      mode: 'halo',
      wireConnectionKeys: [],
      haloModuleIds: [...new Set(visibleEntries.map((entry) => entry.targetModuleId))],
      domainByConnectionKey: {},
      domainByModuleId,
    };
  }

  return {
    mode: 'wire',
    wireConnectionKeys: visibleEntries.map((entry) => entry.connectionKey),
    haloModuleIds: [],
    domainByConnectionKey,
    domainByModuleId: {},
  };
}

export function shouldSuppressTickPulseDuringScrub(
  isScrubbing: boolean,
  nowMs: number,
  lastScrubTickAtMs: number | null,
) {
  return isScrubbing && lastScrubTickAtMs !== null && nowMs - lastScrubTickAtMs < 120;
}
