import { isCompositeDefinition, isIteratorDefinition } from './composites';
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
  if (isCompositeDefinition(def) || isIteratorDefinition(def)) {
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
        : { type: 'symbol', value: signal.value },
  };
}
