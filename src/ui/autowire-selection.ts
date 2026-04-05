import type { ModuleRegistry, Project } from '../engine/types';
import { getTargetPortState } from './connection-authoring';

export type AutoWireMode = 'matching-ports' | 'left-to-right' | 'top-to-bottom';

export interface AutoWireCandidate {
  fromModuleId: string;
  fromPort: string;
  toModuleId: string;
  toPort: string;
}

/**
 * Compute which connections to create for the selected modules.
 *
 * matching-ports: connects outputs to inputs with an exact port-name + type match.
 *   Useful when ports have been deliberately named to align.
 *
 * left-to-right / top-to-bottom: sorts adjacent pairs by position then connects
 *   each output of the earlier module to the first unconnected input of the later
 *   module with a compatible signal type (positional pairing, ignores port names).
 *   This is the common case — e.g. XOR.out → Register.a.
 *
 * All modes:
 * - Only fill unconnected input ports (never overwrite existing connections).
 * - Respect validation rules including cycle detection.
 * - Return a deterministic list for dispatch as a single undo step.
 */
export function computeAutoWireConnections(
  project: Project,
  registry: ModuleRegistry,
  selectedModuleIds: string[],
  layout: Record<string, { x: number; y: number }>,
  mode: AutoWireMode,
): AutoWireCandidate[] {
  if (selectedModuleIds.length < 2) {
    return [];
  }

  const pairs = buildPairs(selectedModuleIds, layout, mode);
  const results: AutoWireCandidate[] = [];

  // Track which input ports have been scheduled so we don't assign two sources.
  const scheduledInputs = new Set<string>();

  // Maintain an incremental project for cycle detection across candidates.
  let effectiveProject = project;

  for (const [fromModuleId, toModuleId] of pairs) {
    const fromInstance = project.modules.find((m) => m.id === fromModuleId);
    const toInstance = project.modules.find((m) => m.id === toModuleId);
    if (!fromInstance || !toInstance) continue;

    const fromDef = registry[fromInstance.defId];
    const toDef = registry[toInstance.defId];
    if (!fromDef || !toDef) continue;

    if (mode === 'matching-ports') {
      // Name-based: output port name must exactly match input port name.
      for (const outputPort of fromDef.outputs) {
        const matchingInput = toDef.inputs.find(
          (inputPort) => inputPort.name === outputPort.name && inputPort.type === outputPort.type,
        );
        if (!matchingInput) continue;

        const inputKey = `${toModuleId}:${matchingInput.name}`;
        if (scheduledInputs.has(inputKey)) continue;

        const portState = getTargetPortState(
          effectiveProject,
          registry,
          fromModuleId,
          outputPort.name,
          toModuleId,
          matchingInput.name,
        );
        if (!portState.valid || portState.mode !== 'new') continue;

        results.push({ fromModuleId, fromPort: outputPort.name, toModuleId, toPort: matchingInput.name });
        scheduledInputs.add(inputKey);
        effectiveProject = addToEffectiveProject(effectiveProject, fromModuleId, outputPort.name, toModuleId, matchingInput.name);
      }
    } else {
      // Positional: pair each output with the first available unconnected input of matching type.
      // Port names are irrelevant — this is what connects XOR.out → Register.a.
      for (const outputPort of fromDef.outputs) {
        for (const inputPort of toDef.inputs) {
          if (inputPort.type !== outputPort.type) continue;

          const inputKey = `${toModuleId}:${inputPort.name}`;
          if (scheduledInputs.has(inputKey)) continue;

          const portState = getTargetPortState(
            effectiveProject,
            registry,
            fromModuleId,
            outputPort.name,
            toModuleId,
            inputPort.name,
          );
          if (!portState.valid || portState.mode !== 'new') continue;

          results.push({ fromModuleId, fromPort: outputPort.name, toModuleId, toPort: inputPort.name });
          scheduledInputs.add(inputKey);
          effectiveProject = addToEffectiveProject(effectiveProject, fromModuleId, outputPort.name, toModuleId, inputPort.name);
          break; // move on to the next output port
        }
      }
    }
  }

  return results;
}

function addToEffectiveProject(
  project: Project,
  fromModuleId: string,
  fromPort: string,
  toModuleId: string,
  toPort: string,
): Project {
  return {
    ...project,
    connections: [
      ...project.connections,
      { from: { moduleId: fromModuleId, port: fromPort }, to: { moduleId: toModuleId, port: toPort } },
    ],
  };
}

function buildPairs(
  selectedModuleIds: string[],
  layout: Record<string, { x: number; y: number }>,
  mode: AutoWireMode,
): Array<[string, string]> {
  if (mode === 'matching-ports') {
    // All ordered pairs — both (A→B) and (B→A) so outputs of either can match inputs of the other.
    const pairs: Array<[string, string]> = [];
    for (const a of selectedModuleIds) {
      for (const b of selectedModuleIds) {
        if (a !== b) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }

  // Directional modes: sort by position, then connect adjacent pairs only.
  const sorted = [...selectedModuleIds].sort((a, b) => {
    const posA = layout[a] ?? { x: 0, y: 0 };
    const posB = layout[b] ?? { x: 0, y: 0 };
    return mode === 'left-to-right' ? posA.x - posB.x : posA.y - posB.y;
  });

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }
  return pairs;
}
