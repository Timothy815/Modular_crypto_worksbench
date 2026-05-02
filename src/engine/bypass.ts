import { isClockedIteratorDefinition, isCompositeDefinition, isIteratorDefinition } from './composites';
import {
  type ModuleDefinition,
  type ModuleInputs,
  type ModuleOutputs,
} from './types';

const BYPASSABLE_MODULE_IDS = new Set([
  'Rotor',
  'Reflector',
  'Plugboard',
  'BitShifter',
  'Permutation',
  'SymbolPermutation',
  'SymbolWindow',
  'BitWindow',
  'BitPad',
  'BitUnpad',
  'SBox',
]);

export function isBypassEligibleDefinition(def: ModuleDefinition): boolean {
  if (isCompositeDefinition(def) || isIteratorDefinition(def) || isClockedIteratorDefinition(def)) {
    return false;
  }

  if (!BYPASSABLE_MODULE_IDS.has(def.id)) {
    return false;
  }

  return (
    def.inputs.length === 1 &&
    def.outputs.length === 1 &&
    def.inputs[0]?.type === def.outputs[0]?.type
  );
}

export function getBypassIneligibilityReason(def: ModuleDefinition): string {
  if (isCompositeDefinition(def) || isIteratorDefinition(def) || isClockedIteratorDefinition(def)) {
    return 'Bypass V1 does not apply to composite, iterator, or clocked iterator definitions.';
  }

  if (def.inputs.length !== 1 || def.outputs.length !== 1) {
    return 'Bypass V1 is limited to modules with exactly one input and one output.';
  }

  if (def.inputs[0]?.type !== def.outputs[0]?.type) {
    return 'Bypass V1 only applies when input and output stay in the same signal domain.';
  }

  if (!BYPASSABLE_MODULE_IDS.has(def.id)) {
    return 'Bypass V1 is only enabled for the current explicit allow-list of eligible modules.';
  }

  return 'This module is not bypassable in V1.';
}

export function evaluateBypass(def: ModuleDefinition, inputs: ModuleInputs): ModuleOutputs {
  const inputPort = def.inputs[0];
  const outputPort = def.outputs[0];

  if (!inputPort || !outputPort) {
    throw new Error(`Module "${def.id}" cannot be bypassed without one input and one output.`);
  }

  const signal = inputs[inputPort.name];
  if (!signal) {
    throw new Error(`Bypassed module "${def.id}" is missing input "${inputPort.name}".`);
  }

  return {
    [outputPort.name]:
      signal.type === 'bits'
        ? { type: 'bits', value: [...signal.value] }
        : signal.type === 'symbol'
          ? { type: 'symbol', value: signal.value }
          : signal.type === 'integer'
            ? { type: 'integer', value: signal.value }
            : {
                type: 'ec-point',
                value:
                  signal.value.kind === 'infinity'
                    ? { kind: 'infinity', curve: { ...signal.value.curve } }
                    : {
                        kind: 'affine',
                        curve: { ...signal.value.curve },
                        x: signal.value.x,
                        y: signal.value.y,
                      },
              },
  };
}
