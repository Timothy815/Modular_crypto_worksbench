import {
  type ConnectionEndpoint,
  type ModuleDefinition,
  type ModuleInstance,
  type ModuleParams,
  type ModuleRegistry,
  type ParamFieldDef,
  type Project,
  type ValidationIssue,
  type ValidationResult,
  isStatefulModule,
} from './types';
import {
  isClockedIteratorDefinition,
  isConditionalDefinition,
  isCompositeDefinition,
  isIteratorDefinition,
  isMultiConditionalDefinition,
  type ClockedIteratorDef,
  type CompositeDef,
  type CompositePortBinding,
  type ConditionalDef,
  type IteratorDef,
} from './composites';
import { validateAsciiSourceValue } from './modules/ascii-source';
import { validateAsciiSequenceToTickedParam } from './modules/ascii-sequence-to-ticked';
import { validateTickedBitsToSequenceParam } from './modules/ticked-bits-to-sequence';
import { validateTickedSymbolsToSequenceParam } from './modules/ticked-symbols-to-sequence';
import { validateBaudotSourceValue } from './modules/baudot-source';
import { validateHexSourceValue } from './modules/hex-source';
import { validatePermutationOrderParam } from './modules/permutation';
import { validatePlugboardWiringParam } from './modules/plugboard';
import { validateReflectorWiringParam } from './modules/reflector';
import { validateRotorParam } from './modules/rotor';
import { validateSBoxParams } from './modules/s-box';
import { validateModExpParam } from './modules/mod-exp';
import { validateModInverseParam } from './modules/mod-inverse';
import { validateModuloParam } from './modules/modulo';
import { validatePrimeFieldModulusParam } from './modules/prime-field';
import {
  validateEcCurveParamsStatic,
  validateEcPointParam,
  validatePointSourceParamsStatic,
} from './modules/ec-point';
import { validateCounterParam } from './modules/counter';
import { validateBitSplitParam } from './modules/bit-split';
import { validateBitPadParam } from './modules/bit-pad';
import { validateBitUnpadParam } from './modules/bit-unpad';
import { validateBitWindowParam } from './modules/bit-window';
import { validateBitSelectOrderParam, parseBitSelectOrder } from './modules/bit-select';
import { validateBitExpandOrderParam, parseBitExpandOrder } from './modules/bit-expand';
import { validateByteRotateParam } from './modules/byte-rotate';
import { validateBroadcastBitsParam } from './modules/broadcast-bits';
import { validateBitsSequenceToTickedParam } from './modules/bits-sequence-to-ticked';
import { validatePadBitsToMatchParam } from './modules/pad-bits-to-match';
import { validatePadBitsSequenceParam } from './modules/pad-bits-sequence';
import { validatePadSymbolToMatchParam } from './modules/pad-symbol-to-match';
import { parsePolluxAlphabet, validatePolluxFractionationParam } from './modules/pollux-fractionation';
import { validateRepeatBitsToLengthParam } from './modules/repeat-bits-to-length';
import { validateRepeatSymbolToLengthParam } from './modules/repeat-symbol-to-length';
import { validateTruncateBitsSequenceParam } from './modules/truncate-bits-sequence';
import { validateTruncateBitsToMatchParam } from './modules/truncate-bits-to-match';
import { validateTruncateSymbolSequenceParam } from './modules/truncate-symbol-sequence';
import { validateTruncateSymbolToMatchParam } from './modules/truncate-symbol-to-match';
import { isBypassEligibleDefinition } from './bypass';
import {
  validateProtocolMaterialParam,
  validateProtocolMaterialValueFitsWidth,
} from './modules/protocol-material';
import { validateSymbolPermutationOrderParam } from './modules/symbol-permutation';
import { validateSymbolWindowParam } from './modules/symbol-window';
import {
  formatSignalKindMismatchMessage,
  formatSignalTypeMismatchMessage,
} from './connection-mismatch-message';

const EQUAL_WIDTH_BINARY_MODULE_IDS = new Set([
  'AND',
  'OR',
  'AddMod',
  'SubMod',
  'MulMod',
  'Equals',
  'AtLeast',
  'GreaterThan',
]);

const SINGLE_BIT_TERNARY_MODULE_IDS = new Set(['Majority']);
const SINGLE_BIT_SELECTOR_MODULE_IDS = new Set(['Mux']);
const SINGLE_BIT_ROUTER_MODULE_IDS = new Set(['Demux']);
const CLOCK_PORT = 'clock';
const CONDITIONAL_SELECT_PORT = 'select';

function findPort(def: ModuleDefinition, portName: string, direction: 'input' | 'output') {
  const ports = direction === 'input' ? def.inputs : def.outputs;
  return ports.find((port) => port.name === portName);
}

function buildModuleMaps(project: Project, registry: ModuleRegistry) {
  const issues: ValidationIssue[] = [];
  const instancesById = new Map<string, ModuleInstance>();
  const defsByInstanceId = new Map<string, ModuleDefinition>();

  for (const moduleInstance of project.modules) {
    if (instancesById.has(moduleInstance.id)) {
      issues.push({
        code: 'duplicate-module-id',
        message: `Duplicate module instance id "${moduleInstance.id}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    instancesById.set(moduleInstance.id, moduleInstance);

    const def = registry[moduleInstance.defId];
    if (!def) {
      issues.push({
        code: 'unknown-module-def',
        message: `Module instance "${moduleInstance.id}" references unknown definition "${moduleInstance.defId}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    defsByInstanceId.set(moduleInstance.id, def);
  }

  return { defsByInstanceId, instancesById, issues };
}

function validateParamValue(field: ParamFieldDef, value: unknown): ValidationIssue['code'] | null {
  switch (field.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'invalid-param-type';
    case 'string':
      return typeof value === 'string' ? null : 'invalid-param-type';
    case 'boolean':
      return typeof value === 'boolean' ? null : 'invalid-param-type';
    case 'bits':
      return Array.isArray(value) && value.every((bit) => bit === 0 || bit === 1)
        ? null
        : 'invalid-param-type';
    case 'wiring': {
      // Must be an array of 26 unique uppercase letters
      if (!Array.isArray(value) || value.length !== 26) return 'invalid-wiring';
      if (!value.every((entry) => typeof entry === 'string' && entry.length === 1 && /^[A-Z]$/.test(entry))) {
        return 'invalid-wiring';
      }
      const unique = new Set(value);
      if (unique.size !== 26) return 'invalid-wiring';
      return null;
    }
    case 'select': {
      if (typeof value !== 'string') return 'invalid-param-type';
      if (!field.options || field.options.length === 0) return null;
      return field.options.some((option) => option.value === value) ? null : 'invalid-param-option';
    }
    default:
      return 'invalid-param-type';
  }
}

function getModuleSpecificParamMessage(
  def: ModuleDefinition,
  field: ParamFieldDef,
  value: unknown,
): string | null {
  if (isCompositeDefinition(def)) {
    return null;
  }

  if (isIteratorDefinition(def)) {
    if (field.key === 'iterationCount') {
      return typeof value === 'number' && Number.isInteger(value) && value > 0
        ? null
        : 'Iteration count must be a positive integer';
    }

    return null;
  }

  if (isClockedIteratorDefinition(def)) {
    return null;
  }

  if (isConditionalDefinition(def)) {
    return null;
  }

  if (def.id === 'Permutation' && field.key === 'order') {
    return validatePermutationOrderParam(value);
  }

  if (def.id === 'SymbolPermutation' && field.key === 'order') {
    return validateSymbolPermutationOrderParam(value);
  }

  if (def.id === 'SymbolWindow') {
    return validateSymbolWindowParam(field.key, value);
  }

  if (def.id === 'Reflector' && field.key === 'wiring') {
    return validateReflectorWiringParam(value);
  }

  if (def.id === 'Plugboard' && field.key === 'wiring') {
    return validatePlugboardWiringParam(value);
  }

  if (
    (def.id === 'Rotor' || def.id === 'RotorReverse') &&
    (field.key === 'wiring' || field.key === 'position' || field.key === 'ringOffset' || field.key === 'notches')
  ) {
    return validateRotorParam(field.key, value);
  }

  if (def.id === 'HexSource' && field.key === 'value') {
    return validateHexSourceValue(value);
  }

  if ((def.id === 'IV' || def.id === 'Nonce' || def.id === 'Salt') && (field.key === 'value' || field.key === 'width')) {
    return validateProtocolMaterialParam(field.key, value);
  }

  if (def.id === 'AsciiSource' && field.key === 'value') {
    return validateAsciiSourceValue(value);
  }

  if (def.id === 'AsciiSequenceInput' && field.key === 'value') {
    return validateAsciiSourceValue(value);
  }

  if (def.id === 'AsciiSequenceToTicked') {
    return validateAsciiSequenceToTickedParam(field.key, value);
  }

  if (def.id === 'TickedSymbolsToSequence') {
    return validateTickedSymbolsToSequenceParam(field.key, value);
  }

  if (def.id === 'TickedBitsToSequence') {
    return validateTickedBitsToSequenceParam(field.key, value);
  }

  if (def.id === 'BaudotSource' && field.key === 'value') {
    return validateBaudotSourceValue(value);
  }

  if (def.id === 'Modulo' && field.key === 'modulus') {
    return validateModuloParam(value);
  }

  if (def.id === 'ModExp') {
    return validateModExpParam(field.key, value);
  }

  if (def.id === 'ModInverse') {
    return validateModInverseParam(field.key, value);
  }

  if (
    def.id === 'FieldAdd' ||
    def.id === 'FieldSub' ||
    def.id === 'FieldMul' ||
    def.id === 'FieldInverse'
  ) {
    return validatePrimeFieldModulusParam(def.id, field.key, value);
  }

  if (
    def.id === 'PointSource' ||
    def.id === 'PointOnCurve' ||
    def.id === 'PointNegate' ||
    def.id === 'PointAdd' ||
    def.id === 'PointDouble'
  ) {
    if (field.key === 'p' || field.key === 'a' || field.key === 'b' || field.key === 'x' || field.key === 'y') {
      return validateEcPointParam(def.id, field.key as 'p' | 'a' | 'b' | 'x' | 'y', value);
    }
    return null;
  }

  if (def.id === 'Counter') {
    return validateCounterParam(field.key, value);
  }

  if (def.id === 'BitSplit') {
    return validateBitSplitParam(field.key, value);
  }

  if (def.id === 'BitPad') {
    return validateBitPadParam(field.key, value);
  }

  if (def.id === 'BitUnpad') {
    return validateBitUnpadParam(field.key, value);
  }

  if (def.id === 'BitWindow') {
    return validateBitWindowParam(field.key, value);
  }

  if (def.id === 'BitSelect') {
    if (field.key === 'order') {
      return validateBitSelectOrderParam(value);
    }
    return null;
  }

  if (def.id === 'BitExpand') {
    if (field.key === 'order') {
      return validateBitExpandOrderParam(value);
    }
    return null;
  }

  if (def.id === 'RepeatBitsToLength') {
    return validateRepeatBitsToLengthParam(field.key, value);
  }

  if (def.id === 'RepeatSymbolToLength') {
    return validateRepeatSymbolToLengthParam(field.key, value);
  }

  if (def.id === 'TruncateSymbolSequence') {
    return validateTruncateSymbolSequenceParam(field.key, value);
  }

  if (def.id === 'TruncateSymbolToMatch') {
    return validateTruncateSymbolToMatchParam(field.key, value);
  }

  if (def.id === 'BroadcastBits') {
    return validateBroadcastBitsParam(field.key, value);
  }

  if (def.id === 'PadSymbolToMatch') {
    return validatePadSymbolToMatchParam(field.key, value);
  }

  if (def.id === 'TruncateBitsSequence') {
    return validateTruncateBitsSequenceParam(field.key, value);
  }

  if (def.id === 'TruncateBitsToMatch') {
    return validateTruncateBitsToMatchParam(field.key, value);
  }

  if (def.id === 'PadBitsSequence') {
    return validatePadBitsSequenceParam(field.key, value);
  }

  if (def.id === 'PadBitsToMatch') {
    return validatePadBitsToMatchParam(field.key, value);
  }

  if (def.id === 'BitsSequenceToTicked') {
    return validateBitsSequenceToTickedParam(field.key, value);
  }

  if (def.id === 'ByteRotate') {
    return validateByteRotateParam(field.key, value);
  }

  if (
    def.id === 'PolluxFractionation' ||
    def.id === 'PolluxControlledFractionation' ||
    def.id === 'PolluxInverse'
  ) {
    return validatePolluxFractionationParam(field.key, value);
  }

  return null;
}

function buildIncomingConnectionMap(project: Project) {
  const incomingConnections = new Map<string, ConnectionEndpoint>();

  for (const connection of project.connections) {
    incomingConnections.set(`${connection.to.moduleId}:${connection.to.port}`, connection.from);
  }

  return incomingConnections;
}

function inferStaticBitWidth(
  moduleId: string,
  defsByInstanceId: Map<string, ModuleDefinition>,
  instancesById: Map<string, ModuleInstance>,
  incomingConnections: Map<string, ConnectionEndpoint>,
  memo: Map<string, number | null>,
  visiting: Set<string>,
): number | null {
  if (memo.has(moduleId)) {
    return memo.get(moduleId) ?? null;
  }

  if (visiting.has(moduleId)) {
    return null;
  }

  const def = defsByInstanceId.get(moduleId);
  const instance = instancesById.get(moduleId);
  if (!def || !instance || isCompositeDefinition(def) || isIteratorDefinition(def) || isClockedIteratorDefinition(def) || isConditionalDefinition(def) || isMultiConditionalDefinition(def)) {
    memo.set(moduleId, null);
    return null;
  }

  visiting.add(moduleId);

  const inferFromInput = (portName = 'in') => {
    const upstream = incomingConnections.get(`${moduleId}:${portName}`);
    if (!upstream) {
      return null;
    }

    return inferStaticBitWidth(
      upstream.moduleId,
      defsByInstanceId,
      instancesById,
      incomingConnections,
      memo,
      visiting,
    );
  };

  const inferBinaryWidth = () => {
    const left = incomingConnections.get(`${moduleId}:a`);
    const right = incomingConnections.get(`${moduleId}:b`);
    if (!left || !right) {
      return null;
    }

    const leftWidth = inferStaticBitWidth(
      left.moduleId,
      defsByInstanceId,
      instancesById,
      incomingConnections,
      memo,
      visiting,
    );
    const rightWidth = inferStaticBitWidth(
      right.moduleId,
      defsByInstanceId,
      instancesById,
      incomingConnections,
      memo,
      visiting,
    );

    return leftWidth !== null && leftWidth === rightWidth ? leftWidth : null;
  };

  let width: number | null = null;

  switch (def.id) {
    case 'BitSource': {
      const stream = instance.params.stream;
      width = Array.isArray(stream) ? stream.length : null;
      break;
    }
    case 'HexSource': {
      const value = instance.params.value;
      width = typeof value === 'string' ? value.replace(/\s+/g, '').length * 4 : null;
      break;
    }
    case 'HexDigitToBits':
      width = 4;
      break;
    case 'IV':
    case 'Nonce':
    case 'Salt': {
      const widthParam = instance.params.width;
      width =
        typeof widthParam === 'number' && Number.isInteger(widthParam) && widthParam > 0
          ? widthParam
          : null;
      break;
    }
    case 'AsciiSource': {
      const value = instance.params.value;
      width = typeof value === 'string' ? value.length * 8 : null;
      break;
    }
    case 'AsciiCharToBits':
      width = 8;
      break;
    case 'BaudotSource': {
      const value = instance.params.value;
      width = typeof value === 'string' ? value.length * 5 : null;
      break;
    }
    case 'SymbolToBits':
      width = 5;
      break;
    case 'Clock': {
      const length = instance.params.length;
      width = typeof length === 'number' && Number.isInteger(length) && length >= 0 ? length : null;
      break;
    }
    case 'Counter': {
      const widthParam = instance.params.width;
      width =
        typeof widthParam === 'number' && Number.isInteger(widthParam) && widthParam > 0
          ? widthParam
          : null;
      break;
    }
    case 'LFSR': {
      const outputLength = instance.params.outputLength;
      width =
        typeof outputLength === 'number' && Number.isInteger(outputLength) && outputLength >= 0
          ? outputLength
          : null;
      break;
    }
    case 'XOR':
    case 'AND':
    case 'OR':
    case 'AddMod':
    case 'SubMod':
    case 'MulMod':
      width = inferBinaryWidth();
      break;
    case 'NOT':
    case 'BitShifter':
    case 'ByteRotate':
    case 'ByteSwap':
    case 'Modulo':
    case 'ModInverse':
    case 'SBox':
    case 'Gate':
      width = inferFromInput();
      break;
    case 'ModExp':
      width = inferFromInput('base');
      break;
    case 'Equals':
    case 'AtLeast':
    case 'GreaterThan':
    case 'Majority':
      width = 1;
      break;
    case 'Permutation': {
      const order = instance.params.order;
      if (typeof order === 'string') {
        const entries = order
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part.length > 0);
        width = entries.length > 0 ? entries.length : null;
      }
      break;
    }
    case 'BitJoin': {
      const leftWidth = inferFromInput('a');
      const rightWidth = inferFromInput('b');
      width = leftWidth !== null && rightWidth !== null ? leftWidth + rightWidth : null;
      break;
    }
    case 'BitSplit':
      width = null;
      break;
    case 'BitPad': {
      const tw = instance.params.targetWidth;
      if (typeof tw === 'number' && Number.isInteger(tw) && tw >= 1) {
        const inputW = inferFromInput();
        width = inputW !== null && inputW >= tw ? inputW : tw;
      }
      break;
    }
    case 'BitUnpad': {
      const ow = instance.params.originalWidth;
      width =
        typeof ow === 'number' && Number.isInteger(ow) && ow >= 1 ? ow : null;
      break;
    }
    case 'BitWindow': {
      const windowWidth = instance.params.width;
      width =
        typeof windowWidth === 'number' && Number.isInteger(windowWidth) && windowWidth >= 1
          ? windowWidth
          : null;
      break;
    }
    case 'BitSelect': {
      try {
        const order = parseBitSelectOrder(instance.params.order);
        width = order.length;
      } catch {
        width = null;
      }
      break;
    }
    case 'BitExpand': {
      try {
        const order = parseBitExpandOrder(instance.params.order);
        width = order.length;
      } catch {
        width = null;
      }
      break;
    }
    default:
      width = null;
  }

  visiting.delete(moduleId);
  memo.set(moduleId, width);
  return width;
}

function validateBitWidthConstraints(
  project: Project,
  defsByInstanceId: Map<string, ModuleDefinition>,
  instancesById: Map<string, ModuleInstance>,
  issues: ValidationIssue[],
) {
  const incomingConnections = buildIncomingConnectionMap(project);
  const memo = new Map<string, number | null>();

  const getWidth = (moduleId: string) =>
    inferStaticBitWidth(moduleId, defsByInstanceId, instancesById, incomingConnections, memo, new Set());
  const getControlWidth = (endpoint: ConnectionEndpoint) => {
    const upstreamDef = defsByInstanceId.get(endpoint.moduleId);
    if (upstreamDef?.id === 'Clock') {
      return 1;
    }

    return getWidth(endpoint.moduleId);
  };

  for (const moduleInstance of project.modules) {
    const def = defsByInstanceId.get(moduleInstance.id);
    if (!def || isCompositeDefinition(def) || isIteratorDefinition(def) || isClockedIteratorDefinition(def) || isMultiConditionalDefinition(def)) {
      continue;
    }

    if (isConditionalDefinition(def)) {
      const select = incomingConnections.get(`${moduleInstance.id}:${CONDITIONAL_SELECT_PORT}`);
      if (select) {
        const selectWidth = getControlWidth(select);
        if (selectWidth !== null && selectWidth !== 1) {
          issues.push({
            code: 'signal-width-mismatch',
            message: `Module "${moduleInstance.id}" requires a 1-bit conditional select input.`,
            moduleId: moduleInstance.id,
          });
        }
      }
      continue;
    }

    if (EQUAL_WIDTH_BINARY_MODULE_IDS.has(def.id)) {
      const left = incomingConnections.get(`${moduleInstance.id}:a`);
      const right = incomingConnections.get(`${moduleInstance.id}:b`);

      if (left && right) {
        const leftWidth = getWidth(left.moduleId);
        const rightWidth = getWidth(right.moduleId);

        if (leftWidth !== null && rightWidth !== null && leftWidth !== rightWidth) {
          issues.push({
            code: 'signal-width-mismatch',
            message: `Module "${moduleInstance.id}" requires equal-width bits inputs, but received widths ${leftWidth} and ${rightWidth}.`,
            moduleId: moduleInstance.id,
          });
        }
      }
    }

    if (def.id === 'Modulo' || def.id === 'ModInverse') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      const modulus = moduleInstance.params.modulus;
      if (
        !upstream ||
        typeof modulus !== 'number' ||
        !Number.isInteger(modulus) ||
        !Number.isSafeInteger(modulus) ||
        modulus <= 0
      ) {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null && BigInt(modulus) > (1n << BigInt(inputWidth))) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameter "modulus" is invalid. ${def.id} modulus must not exceed the input word range for a ${inputWidth}-bit input.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'ModExp') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:base`);
      const modulus = moduleInstance.params.modulus;
      if (
        !upstream ||
        typeof modulus !== 'number' ||
        !Number.isInteger(modulus) ||
        !Number.isSafeInteger(modulus) ||
        modulus < 2
      ) {
        continue;
      }

      const baseWidth = getWidth(upstream.moduleId);
      if (baseWidth !== null && BigInt(modulus) > (1n << BigInt(baseWidth))) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameter "modulus" is invalid. ModExp modulus must not exceed the base word range for a ${baseWidth}-bit input.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'BitSplit') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      const leftWidth = moduleInstance.params.leftWidth;
      if (
        !upstream ||
        typeof leftWidth !== 'number' ||
        !Number.isInteger(leftWidth) ||
        leftWidth < 1
      ) {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null && leftWidth >= inputWidth) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameter "leftWidth" is invalid. BitSplit leftWidth must be less than the input width (${inputWidth}).`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'BitWindow') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      const start = moduleInstance.params.start;
      const width = moduleInstance.params.width;
      if (
        !upstream ||
        typeof start !== 'number' ||
        !Number.isInteger(start) ||
        start < 0 ||
        typeof width !== 'number' ||
        !Number.isInteger(width) ||
        width < 1
      ) {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null && start + width > inputWidth) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameters "start" and "width" are invalid. BitWindow range must fit within the input width (${inputWidth}).`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'BitSelect') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      if (!upstream) {
        continue;
      }

      let order: number[];
      try {
        order = parseBitSelectOrder(moduleInstance.params.order);
      } catch {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null) {
        const maxIndex = Math.max(...order);
        if (maxIndex >= inputWidth) {
          issues.push({
            code: 'invalid-param-type',
            message: `Module "${moduleInstance.id}" BitSelect index ${maxIndex} is out of range for input width ${inputWidth}.`,
            moduleId: moduleInstance.id,
          });
        }
      }

      const seen = new Set<number>();
      for (const index of order) {
        if (seen.has(index)) {
          issues.push({
            code: 'invalid-param-type',
            message: `Module "${moduleInstance.id}" BitSelect index ${index} appears more than once in the selection order.`,
            moduleId: moduleInstance.id,
          });
          break;
        }
        seen.add(index);
      }
    }

    if (def.id === 'BitExpand') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      if (!upstream) {
        continue;
      }

      let order: number[];
      try {
        order = parseBitExpandOrder(moduleInstance.params.order);
      } catch {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null) {
        const maxIndex = Math.max(...order);
        if (maxIndex >= inputWidth) {
          issues.push({
            code: 'invalid-param-type',
            message: `Module "${moduleInstance.id}" BitExpand index ${maxIndex} is out of range for input width ${inputWidth}.`,
            moduleId: moduleInstance.id,
          });
        }
      }
    }

    if (def.id === 'ByteRotate' || def.id === 'ByteSwap') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      if (!upstream) {
        continue;
      }

      const inputWidth = getWidth(upstream.moduleId);
      if (inputWidth !== null && inputWidth % 8 !== 0) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires an input width divisible by 8.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (SINGLE_BIT_TERNARY_MODULE_IDS.has(def.id)) {
      const inputPorts = ['a', 'b', 'c'] as const;
      const knownWidths = inputPorts
        .map((portName) => incomingConnections.get(`${moduleInstance.id}:${portName}`))
        .filter((endpoint): endpoint is ConnectionEndpoint => endpoint !== undefined)
        .map((endpoint) => getControlWidth(endpoint))
        .filter((width): width is number => width !== null);

      if (knownWidths.some((width) => width !== 1)) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires 1-bit inputs on ports a, b, and c.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (SINGLE_BIT_SELECTOR_MODULE_IDS.has(def.id)) {
      const inputPorts = ['select', 'a', 'b'] as const;
      const knownWidths = inputPorts
        .map((portName) => incomingConnections.get(`${moduleInstance.id}:${portName}`))
        .filter((endpoint): endpoint is ConnectionEndpoint => endpoint !== undefined)
        .map((endpoint) => getControlWidth(endpoint))
        .filter((width): width is number => width !== null);

      if (knownWidths.some((width) => width !== 1)) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires 1-bit inputs on ports select, a, and b.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (SINGLE_BIT_ROUTER_MODULE_IDS.has(def.id)) {
      const inputPorts = ['select', 'in'] as const;
      const knownWidths = inputPorts
        .map((portName) => incomingConnections.get(`${moduleInstance.id}:${portName}`))
        .filter((endpoint): endpoint is ConnectionEndpoint => endpoint !== undefined)
        .map((endpoint) => getControlWidth(endpoint))
        .filter((width): width is number => width !== null);

      if (knownWidths.some((width) => width !== 1)) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires 1-bit inputs on ports select and in.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'SymbolPermutation') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      const order = moduleInstance.params.order;
      if (!upstream || typeof order !== 'string') {
        continue;
      }

      const instance = instancesById.get(upstream.moduleId);
      const upstreamDef = defsByInstanceId.get(upstream.moduleId);
      if (!instance || !upstreamDef || isCompositeDefinition(upstreamDef) || isIteratorDefinition(upstreamDef) || isClockedIteratorDefinition(upstreamDef) || isConditionalDefinition(upstreamDef) || isMultiConditionalDefinition(upstreamDef)) {
        continue;
      }

      const staticSymbolLength = inferStaticSymbolLength(instance);
      if (staticSymbolLength === null) {
        continue;
      }

      const entries = order
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      if (entries.length > 0 && entries.length !== staticSymbolLength) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires a symbol permutation order with ${staticSymbolLength} entries to match the input symbol length.`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (def.id === 'SymbolWindow') {
      const upstream = incomingConnections.get(`${moduleInstance.id}:in`);
      const start = moduleInstance.params.start;
      const width = moduleInstance.params.width;
      if (
        !upstream ||
        typeof start !== 'number' ||
        !Number.isInteger(start) ||
        start < 0 ||
        typeof width !== 'number' ||
        !Number.isInteger(width) ||
        width < 1
      ) {
        continue;
      }

      const instance = instancesById.get(upstream.moduleId);
      const upstreamDef = defsByInstanceId.get(upstream.moduleId);
      if (!instance || !upstreamDef || isCompositeDefinition(upstreamDef) || isIteratorDefinition(upstreamDef) || isClockedIteratorDefinition(upstreamDef) || isConditionalDefinition(upstreamDef) || isMultiConditionalDefinition(upstreamDef)) {
        continue;
      }

      const staticSymbolLength = inferStaticSymbolLength(instance);
      if (staticSymbolLength === null) {
        continue;
      }

      if (start + width > staticSymbolLength) {
        issues.push({
          code: 'signal-width-mismatch',
          message: `Module "${moduleInstance.id}" requires a symbol window that fits within the input symbol length (${staticSymbolLength}).`,
          moduleId: moduleInstance.id,
        });
      }
    }
  }
}

function inferStaticSymbolLength(instance: ModuleInstance): number | null {
  switch (instance.defId) {
    case 'TextInput':
    case 'KeyInput': {
      const value = instance.params.value;
      return typeof value === 'string' ? Array.from(value).length : null;
    }
    case 'SymbolWindow': {
      const width = instance.params.width;
      return typeof width === 'number' && Number.isInteger(width) && width >= 1 ? width : null;
    }
    case 'BitsToAscii': {
      return null;
    }
    default:
      return null;
  }
}

function validateParams(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const schemaKeys = new Set(Object.keys(def.paramSchema));
  const params = moduleInstance.params as ModuleParams;

  for (const field of Object.values(def.paramSchema)) {
    const value = params[field.key];

    if (value === undefined) {
      if (field.required) {
        issues.push({
          code: 'missing-required-param',
          message: `Module "${moduleInstance.id}" is missing required param "${field.key}".`,
          moduleId: moduleInstance.id,
        });
      }
      continue;
    }

    const validationCode = validateParamValue(field, value);
    if (validationCode) {
      let message = `Module "${moduleInstance.id}" has invalid value for param "${field.key}" of kind "${field.kind}".`;

      if (validationCode === 'invalid-param-option') {
        message = `Module "${moduleInstance.id}" has invalid option "${String(value)}" for param "${field.key}".`;
      } else if (validationCode === 'invalid-wiring') {
        message = `Module "${moduleInstance.id}" parameter "${field.key}" must be an array of 26 unique uppercase letters.`;
      }

      issues.push({
        code: validationCode,
        message,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const moduleSpecificMessage = getModuleSpecificParamMessage(def, field, value);
    if (moduleSpecificMessage) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" parameter "${field.key}" is invalid. ${moduleSpecificMessage}`,
        moduleId: moduleInstance.id,
      });
    }
  }

  for (const key of Object.keys(params)) {
    if (!schemaKeys.has(key)) {
      issues.push({
        code: 'unknown-param',
        message: `Module "${moduleInstance.id}" provided unknown param "${key}".`,
        moduleId: moduleInstance.id,
      });
    }
  }

  if (!isCompositeDefinition(def) && !isIteratorDefinition(def) && !isClockedIteratorDefinition(def) && !isConditionalDefinition(def) && !isMultiConditionalDefinition(def)) {
    if (def.id === 'SBox') {
      const message = validateSBoxParams({
        table: params.table,
        inputBits: params.inputBits,
        outputBits: params.outputBits,
      });
      if (message) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameter "table" is invalid. ${message}`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (
      def.id === 'PolluxFractionation' ||
      def.id === 'PolluxControlledFractionation' ||
      def.id === 'PolluxInverse'
    ) {
      try {
        const zeroAlphabet = parsePolluxAlphabet(params.zeroAlphabet, 'zeroAlphabet');
        const oneAlphabet = parsePolluxAlphabet(params.oneAlphabet, 'oneAlphabet');
        const overlap = zeroAlphabet.find((symbol) => oneAlphabet.includes(symbol));
        if (overlap) {
          issues.push({
            code: 'invalid-param-type',
            message: `Module "${moduleInstance.id}" parameter "oneAlphabet" is invalid. Pollux Fractionation requires zeroAlphabet and oneAlphabet to be disjoint (overlap: "${overlap}")`,
            moduleId: moduleInstance.id,
          });
        }
      } catch {
        // Field-level validation already reports malformed alphabet inputs.
      }
    }

    if (def.id === 'IV' || def.id === 'Nonce' || def.id === 'Salt') {
      const widthMessage = validateProtocolMaterialValueFitsWidth(params.value, params.width);
      if (widthMessage) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" parameter "value" is invalid. ${widthMessage}`,
          moduleId: moduleInstance.id,
        });
      }
    }

    if (
      def.id === 'PointSource' ||
      def.id === 'PointOnCurve' ||
      def.id === 'PointNegate' ||
      def.id === 'PointAdd' ||
      def.id === 'PointDouble'
    ) {
      const curveMessage = validateEcCurveParamsStatic(
        { p: params.p, a: params.a, b: params.b },
        def.id,
      );
      if (curveMessage) {
        issues.push({
          code: 'invalid-param-type',
          message: `Module "${moduleInstance.id}" curve parameters are invalid. ${curveMessage}`,
          moduleId: moduleInstance.id,
        });
      } else if (def.id === 'PointSource') {
        const pointMessage = validatePointSourceParamsStatic(
          { p: params.p, a: params.a, b: params.b, x: params.x, y: params.y },
          def.id,
        );
        if (pointMessage) {
          issues.push({
            code: 'invalid-param-type',
            message: `Module "${moduleInstance.id}" point parameters are invalid. ${pointMessage}`,
            moduleId: moduleInstance.id,
          });
        }
      }
    }
  }

  if (isCompositeDefinition(def) && def.forwardedParams?.length) {
    validateForwardedParamValues(moduleInstance, def, registry, issues);
  }

  if (moduleInstance.bypass && !isBypassEligibleDefinition(def)) {
    issues.push({
      code: 'invalid-bypass',
      message: `Module "${moduleInstance.id}" cannot be bypassed in V1. Only explicit one-input / one-output same-domain modules are eligible.`,
      moduleId: moduleInstance.id,
    });
  }
}

function validateLinkedRotorPairings(
  project: Project,
  defsByInstanceId: Map<string, ModuleDefinition>,
  instancesById: Map<string, ModuleInstance>,
  issues: ValidationIssue[],
) {
  for (const moduleInstance of project.modules) {
    const def = defsByInstanceId.get(moduleInstance.id);
    if (!def || isCompositeDefinition(def) || isIteratorDefinition(def) || isClockedIteratorDefinition(def) || isConditionalDefinition(def) || isMultiConditionalDefinition(def) || def.id !== 'RotorReverse') {
      continue;
    }

    const linkedRotorId = moduleInstance.params.linkedRotorId;
    if (typeof linkedRotorId !== 'string' || linkedRotorId.trim().length === 0) {
      continue;
    }

    const trimmedLinkedRotorId = linkedRotorId.trim();
    if (trimmedLinkedRotorId === moduleInstance.id) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" parameter "linkedRotorId" cannot reference itself.`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const linkedInstance = instancesById.get(trimmedLinkedRotorId);
    if (!linkedInstance) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" parameter "linkedRotorId" references unknown module "${trimmedLinkedRotorId}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const linkedDef = defsByInstanceId.get(trimmedLinkedRotorId);
    if (!linkedDef || isCompositeDefinition(linkedDef) || isIteratorDefinition(linkedDef) || isClockedIteratorDefinition(linkedDef) || isConditionalDefinition(linkedDef) || isMultiConditionalDefinition(linkedDef) || linkedDef.id !== 'Rotor') {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" parameter "linkedRotorId" must reference a forward Rotor, not "${linkedInstance.defId}".`,
        moduleId: moduleInstance.id,
      });
    }
  }
}

export function validateProject(project: Project, registry: ModuleRegistry): ValidationResult {
  const { defsByInstanceId, instancesById, issues } = buildModuleMaps(project, registry);
  const validatedDefinitionIds = new Set<string>();
  const inboundEdgeKeys = new Set<string>();
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);

    const def = defsByInstanceId.get(moduleInstance.id);
    if (def) {
      if (!validatedDefinitionIds.has(def.id)) {
        if (isConditionalDefinition(def)) {
          issues.push(...validateConditionalDef(def, registry).issues);
        } else if (isIteratorDefinition(def)) {
          issues.push(...validateIteratorDef(def, registry).issues);
        } else if (isClockedIteratorDefinition(def)) {
          issues.push(...validateClockedIteratorDef(def, registry).issues);
        }
        validatedDefinitionIds.add(def.id);
      }
      validateParams(moduleInstance, def, registry, issues);
    }
  }

  for (const connection of project.connections) {
    const sourceDef = defsByInstanceId.get(connection.from.moduleId);
    const targetDef = defsByInstanceId.get(connection.to.moduleId);

    if (!instancesById.has(connection.from.moduleId)) {
      issues.push({
        code: 'unknown-module-instance',
        message: `Connection source references unknown module "${connection.from.moduleId}".`,
        connection,
      });
      continue;
    }

    if (!instancesById.has(connection.to.moduleId)) {
      issues.push({
        code: 'unknown-module-instance',
        message: `Connection target references unknown module "${connection.to.moduleId}".`,
        connection,
      });
      continue;
    }

    if (!sourceDef || !targetDef) {
      continue;
    }

    const sourcePort = findPort(sourceDef, connection.from.port, 'output');
    if (!sourcePort) {
      issues.push({
        code: 'unknown-port',
        message: `Unknown output port "${connection.from.port}" on module "${connection.from.moduleId}".`,
        moduleId: connection.from.moduleId,
        connection,
      });
      continue;
    }

    const targetPort = findPort(targetDef, connection.to.port, 'input');
    if (!targetPort) {
      issues.push({
        code: 'unknown-port',
        message: `Unknown input port "${connection.to.port}" on module "${connection.to.moduleId}".`,
        moduleId: connection.to.moduleId,
        connection,
      });
      continue;
    }

    const inboundKey = `${connection.to.moduleId}:${connection.to.port}`;
    if (inboundEdgeKeys.has(inboundKey)) {
      issues.push({
        code: 'duplicate-input-connection',
        message: `Input "${connection.to.port}" on module "${connection.to.moduleId}" has more than one incoming connection.`,
        moduleId: connection.to.moduleId,
        connection,
      });
      continue;
    }

    inboundEdgeKeys.add(inboundKey);

    if (sourcePort.type !== targetPort.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: formatSignalTypeMismatchMessage(
          `${connection.from.moduleId}.${connection.from.port}`,
          `${connection.to.moduleId}.${connection.to.port}`,
          sourcePort.type,
          targetPort.type,
        ),
        connection,
      });
      continue;
    }

    const sourceKind = sourcePort.kind ?? null;
    const targetKind = targetPort.kind ?? null;
    if (sourceKind && targetKind && sourceKind !== targetKind) {
      issues.push({
        code: 'signal-kind-mismatch',
        message: formatSignalKindMismatchMessage(
          `${connection.from.moduleId}.${connection.from.port}`,
          `${connection.to.moduleId}.${connection.to.port}`,
          sourcePort.type,
          sourceKind,
          targetKind,
        ),
        connection,
      });
      continue;
    }

    if (!(connection.to.port === CLOCK_PORT && !isCompositeDefinition(targetDef) && !isIteratorDefinition(targetDef) && !isConditionalDefinition(targetDef) && isStatefulModule(targetDef))) {
      adjacency.get(connection.from.moduleId)?.push(connection.to.moduleId);
      indegree.set(
        connection.to.moduleId,
        (indegree.get(connection.to.moduleId) ?? 0) + 1,
      );
    }
  }

  const ready = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([moduleId]) => moduleId);
  let visitedCount = 0;

  while (ready.length > 0) {
    const moduleId = ready.shift();
    if (!moduleId) {
      continue;
    }

    visitedCount += 1;

    for (const neighbor of adjacency.get(moduleId) ?? []) {
      const nextDegree = (indegree.get(neighbor) ?? 0) - 1;
      indegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(neighbor);
      }
    }
  }

  if (visitedCount !== project.modules.length) {
    issues.push({
      code: 'cycle-detected',
      message: 'The project graph contains a cycle and cannot be executed as a DAG.',
    });
  }

  validateLinkedRotorPairings(project, defsByInstanceId, instancesById, issues);
  validateBitWidthConstraints(project, defsByInstanceId, instancesById, issues);

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function validateCompositeDef(
  composite: CompositeDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const projectValidation = validateProject(composite.project, registry);
  issues.push(...projectValidation.issues);

  validateExternalPorts(composite, issues);
  validateCompositeBindings(
    composite,
    composite.inputBindings,
    'input',
    registry,
    issues,
  );
  validateCompositeBindings(
    composite,
    composite.outputBindings,
    'output',
    registry,
    issues,
  );
  validateForwardedParams(composite, registry, issues);

  return {
    ok: issues.length === 0,
    issues,
  };
}

function portSignature(port: { name: string; type: string; kind?: string | undefined }) {
  return `${port.name}:${port.type}:${port.kind ?? ''}`;
}

function paramFieldSignature(field: ParamFieldDef | undefined) {
  if (!field) {
    return null;
  }

  const options = field.options?.map((option) => `${option.label}:${option.value}`).join('|') ?? '';
  return `${field.key}:${field.kind}:${field.required ? 'required' : 'optional'}:${options}`;
}

function paramSchemasMatch(
  leftSchema: Record<string, ParamFieldDef>,
  rightSchema: Record<string, ParamFieldDef>,
): boolean {
  const leftKeys = Object.keys(leftSchema).sort();
  const rightKeys = Object.keys(rightSchema).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(
    (key, index) =>
      key === rightKeys[index] &&
      paramFieldSignature(leftSchema[key]) === paramFieldSignature(rightSchema[key]),
  );
}

function conditionalForwardedInputs(def: ConditionalDef) {
  return def.inputs.filter((port) => port.name !== CONDITIONAL_SELECT_PORT);
}

export function validateConditionalDef(
  conditional: ConditionalDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const selectPort = conditional.inputs.find((port) => port.name === CONDITIONAL_SELECT_PORT);
  if (!selectPort) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Conditional "${conditional.id}" must expose a reserved "${CONDITIONAL_SELECT_PORT}" input.`,
    });
  } else if (selectPort.type !== 'bits' || (selectPort.kind ?? 'scalar') !== 'scalar') {
    issues.push({
      code: 'signal-type-mismatch',
      message: `Conditional "${conditional.id}" must expose "${CONDITIONAL_SELECT_PORT}" as a scalar bits input.`,
    });
  }

  if (conditional.thenDefId === conditional.id || conditional.elseDefId === conditional.id) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Conditional "${conditional.id}" cannot reference itself directly as a branch definition.`,
    });
  }

  const thenDef = registry[conditional.thenDefId];
  const elseDef = registry[conditional.elseDefId];
  if (!thenDef) {
    issues.push({
      code: 'unknown-module-def',
      message: `Conditional "${conditional.id}" references unknown then definition "${conditional.thenDefId}".`,
    });
  }

  if (!elseDef) {
    issues.push({
      code: 'unknown-module-def',
      message: `Conditional "${conditional.id}" references unknown else definition "${conditional.elseDefId}".`,
    });
  }

  if (!thenDef || !elseDef) {
    return { ok: issues.length === 0, issues };
  }

  const expectedInputs = conditionalForwardedInputs(conditional).map(portSignature);
  const thenInputs = thenDef.inputs.map(portSignature);
  const elseInputs = elseDef.inputs.map(portSignature);
  if (
    expectedInputs.length !== thenInputs.length ||
    expectedInputs.length !== elseInputs.length ||
    expectedInputs.some((signature, index) => signature !== thenInputs[index] || signature !== elseInputs[index])
  ) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Conditional "${conditional.id}" requires both branches to expose the same forwarded input ports as the conditional definition.`,
    });
  }

  const expectedOutputs = conditional.outputs.map(portSignature);
  const thenOutputs = thenDef.outputs.map(portSignature);
  const elseOutputs = elseDef.outputs.map(portSignature);
  if (
    expectedOutputs.length !== thenOutputs.length ||
    expectedOutputs.length !== elseOutputs.length ||
    expectedOutputs.some((signature, index) => signature !== thenOutputs[index] || signature !== elseOutputs[index])
  ) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Conditional "${conditional.id}" requires both branches to expose the same output ports as the conditional definition.`,
    });
  }

  if (
    !paramSchemasMatch(conditional.paramSchema, thenDef.paramSchema) ||
    !paramSchemasMatch(conditional.paramSchema, elseDef.paramSchema)
  ) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Conditional "${conditional.id}" requires branch param schemas to match the conditional param schema exactly.`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function validateForwardedParams(
  composite: CompositeDef,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const seenKeys = new Set<string>();

  for (const binding of composite.forwardedParams ?? []) {
    if (seenKeys.has(binding.externalParam)) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards duplicate external param "${binding.externalParam}".`,
      });
      continue;
    }
    seenKeys.add(binding.externalParam);

    const externalField = composite.paramSchema[binding.externalParam];
    if (!externalField) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards unknown external param "${binding.externalParam}".`,
      });
      continue;
    }

    const internalModule = composite.project.modules.find(
      (moduleInstance) => moduleInstance.id === binding.internalModuleId,
    );
    if (!internalModule) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" to unknown internal module "${binding.internalModuleId}".`,
      });
      continue;
    }

    const targetDef = registry[internalModule.defId];
    if (!targetDef) {
      issues.push({
        code: 'unknown-module-def',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" through unknown definition "${internalModule.defId}".`,
      });
      continue;
    }

    const targetField = targetDef.paramSchema[binding.internalParamKey];
    if (!targetField) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" to missing internal param "${binding.internalModuleId}.${binding.internalParamKey}".`,
      });
      continue;
    }

    if (externalField.kind !== targetField.kind) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" forwards "${binding.externalParam}" with kind "${externalField.kind}" to incompatible target kind "${targetField.kind}".`,
      });
    }
  }
}

function validateForwardedParamValues(
  moduleInstance: ModuleInstance,
  composite: CompositeDef,
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  for (const binding of composite.forwardedParams ?? []) {
    const value = moduleInstance.params[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    const internalModule = composite.project.modules.find(
      (candidate) => candidate.id === binding.internalModuleId,
    );
    if (!internalModule) {
      continue;
    }

    const targetDef = registry[internalModule.defId];
    if (!targetDef) {
      continue;
    }

    const targetField = targetDef.paramSchema[binding.internalParamKey];
    if (!targetField) {
      continue;
    }

    const validationCode = validateParamValue(targetField, value);
    if (validationCode) {
      issues.push({
        code: validationCode,
        message: `Module "${moduleInstance.id}" has invalid forwarded value for "${binding.externalParam}" targeting "${binding.internalModuleId}.${binding.internalParamKey}".`,
        moduleId: moduleInstance.id,
      });
      continue;
    }

    const moduleSpecificMessage = getModuleSpecificParamMessage(targetDef, targetField, value);
    if (moduleSpecificMessage) {
      issues.push({
        code: 'invalid-param-type',
        message: `Module "${moduleInstance.id}" forwarded param "${binding.externalParam}" is invalid for target "${binding.internalModuleId}.${binding.internalParamKey}". ${moduleSpecificMessage}`,
        moduleId: moduleInstance.id,
      });
    }
  }
}

export function validateIteratorDef(
  iterator: IteratorDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const roundDef = registry[iterator.roundDefId];
  const hasKeyBus = iterator.roundKeyWidth !== undefined;

  if (!roundDef) {
    issues.push({
      code: 'unknown-module-def',
      message: `Iterator "${iterator.id}" references unknown round definition "${iterator.roundDefId}".`,
    });
  } else {
    if (isIteratorDefinition(roundDef) && roundDef.id === iterator.id) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" cannot reference itself as its round definition.`,
      });
    }

    const expectedInputCount = hasKeyBus ? 2 : 1;

    if (roundDef.inputs.length !== expectedInputCount || roundDef.outputs.length !== 1) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" requires a round definition with exactly ${expectedInputCount} input${expectedInputCount === 1 ? '' : 's'} and one output.`,
      });
    } else if (
      roundDef.inputs[0]?.name !== 'in' ||
      roundDef.outputs[0]?.name !== 'out' ||
      (hasKeyBus && roundDef.inputs[1]?.name !== 'key')
    ) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Iterator "${iterator.id}" currently requires round ports named "in"${hasKeyBus ? ', "key",' : ' and'} "out".`,
      });
    } else if (roundDef.inputs[0]?.type !== roundDef.outputs[0]?.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" requires a round definition whose input and output types match.`,
      });
    } else if (
      (roundDef.inputs[0]?.kind ?? null) &&
      (roundDef.outputs[0]?.kind ?? null) &&
      roundDef.inputs[0]?.kind !== roundDef.outputs[0]?.kind
    ) {
      issues.push({
        code: 'signal-kind-mismatch',
        message: `Iterator "${iterator.id}" requires a round definition whose input and output kinds match.`,
      });
    } else if (hasKeyBus && roundDef.inputs[1]?.type !== 'bits') {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" requires its round key port to use bits signals.`,
      });
    } else if (
      iterator.inputs.length !== expectedInputCount ||
      iterator.outputs.length !== 1 ||
      iterator.inputs[0]?.name !== 'in' ||
      (hasKeyBus && iterator.inputs[1]?.name !== 'key') ||
      iterator.outputs[0]?.name !== 'out' ||
      iterator.inputs[0]?.type !== roundDef.inputs[0]?.type ||
      ((iterator.inputs[0]?.kind ?? null) &&
        (roundDef.inputs[0]?.kind ?? null) &&
        iterator.inputs[0]?.kind !== roundDef.inputs[0]?.kind) ||
      (hasKeyBus && iterator.inputs[1]?.type !== 'bits') ||
      iterator.outputs[0]?.type !== roundDef.outputs[0]?.type ||
      ((iterator.outputs[0]?.kind ?? null) &&
        (roundDef.outputs[0]?.kind ?? null) &&
        iterator.outputs[0]?.kind !== roundDef.outputs[0]?.kind)
    ) {
      issues.push({
        code:
          ((iterator.inputs[0]?.kind ?? null) &&
            (roundDef.inputs[0]?.kind ?? null) &&
            iterator.inputs[0]?.kind !== roundDef.inputs[0]?.kind) ||
          ((iterator.outputs[0]?.kind ?? null) &&
            (roundDef.outputs[0]?.kind ?? null) &&
            iterator.outputs[0]?.kind !== roundDef.outputs[0]?.kind)
            ? 'signal-kind-mismatch'
            : 'signal-type-mismatch',
        message: `Iterator "${iterator.id}" must expose one input and one output matching its round definition.`,
      });
    }
  }

  if (!Number.isInteger(iterator.iterationCount) || iterator.iterationCount < 1) {
    issues.push({
      code: 'invalid-param-type',
      message: `Iterator "${iterator.id}" must declare a positive integer iteration count.`,
    });
  }

  if (
    hasKeyBus &&
    (!Number.isInteger(iterator.roundKeyWidth) || (iterator.roundKeyWidth ?? 0) < 1)
  ) {
    issues.push({
      code: 'invalid-param-type',
      message: `Iterator "${iterator.id}" must declare a positive integer round key width when key distribution is enabled.`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function validateClockedIteratorDef(
  iterator: ClockedIteratorDef,
  registry: ModuleRegistry,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const roundDef = registry[iterator.roundDefId];

  if (!roundDef) {
    issues.push({
      code: 'unknown-module-def',
      message: `Clocked iterator "${iterator.id}" references unknown round definition "${iterator.roundDefId}".`,
    });
    return { ok: false, issues };
  }

  if (isIteratorDefinition(roundDef) || isClockedIteratorDefinition(roundDef)) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Clocked iterator "${iterator.id}" cannot currently use iterator bodies in V1.`,
    });
  }

  if (roundDef.inputs.length !== 1 || roundDef.outputs.length !== 1) {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Clocked iterator "${iterator.id}" requires a body with exactly one input and one output.`,
    });
  } else if (roundDef.inputs[0]?.name !== 'in' || roundDef.outputs[0]?.name !== 'out') {
    issues.push({
      code: 'invalid-composite-binding',
      message: `Clocked iterator "${iterator.id}" currently requires body ports named "in" and "out".`,
    });
  } else if (roundDef.inputs[0]?.type !== roundDef.outputs[0]?.type) {
    issues.push({
      code: 'signal-type-mismatch',
      message: `Clocked iterator "${iterator.id}" requires a body whose input and output types match.`,
    });
  } else if (
    (roundDef.inputs[0]?.kind ?? null) &&
    (roundDef.outputs[0]?.kind ?? null) &&
    roundDef.inputs[0]?.kind !== roundDef.outputs[0]?.kind
  ) {
    issues.push({
      code: 'signal-kind-mismatch',
      message: `Clocked iterator "${iterator.id}" requires a body whose input and output kinds match.`,
    });
  }

  if (
    iterator.inputs.length !== 2 ||
    iterator.outputs.length !== 1 ||
    iterator.inputs[0]?.name !== 'in' ||
    iterator.inputs[1]?.name !== CLOCK_PORT ||
    iterator.inputs[1]?.type !== 'bits' ||
    (iterator.inputs[1]?.kind ?? 'scalar') !== 'scalar' ||
    iterator.outputs[0]?.name !== 'out' ||
    iterator.inputs[0]?.type !== roundDef.inputs[0]?.type ||
    ((iterator.inputs[0]?.kind ?? null) &&
      (roundDef.inputs[0]?.kind ?? null) &&
      iterator.inputs[0]?.kind !== roundDef.inputs[0]?.kind) ||
    iterator.outputs[0]?.type !== roundDef.outputs[0]?.type ||
    ((iterator.outputs[0]?.kind ?? null) &&
      (roundDef.outputs[0]?.kind ?? null) &&
      iterator.outputs[0]?.kind !== roundDef.outputs[0]?.kind)
  ) {
    issues.push({
      code: 'signal-type-mismatch',
      message: `Clocked iterator "${iterator.id}" must expose "in", scalar bits "clock", and "out" matching its body definition.`,
    });
  }

  if (!Number.isInteger(iterator.roundCount) || iterator.roundCount < 1) {
    issues.push({
      code: 'invalid-param-type',
      message: `Clocked iterator "${iterator.id}" must declare a positive integer round count.`,
    });
  }

  if (iterator.endPolicy !== 'halt' && iterator.endPolicy !== 'wrap') {
    issues.push({
      code: 'invalid-param-option',
      message: `Clocked iterator "${iterator.id}" must declare endPolicy as "halt" or "wrap".`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function validateExternalPorts(
  composite: CompositeDef,
  issues: ValidationIssue[],
) {
  const seen = new Set<string>();

  for (const port of [...composite.inputs, ...composite.outputs]) {
    if (seen.has(port.name)) {
      issues.push({
        code: 'duplicate-external-port',
        message: `Composite "${composite.id}" exposes duplicate external port "${port.name}".`,
      });
      continue;
    }

    seen.add(port.name);
  }
}

function validateCompositeBindings(
  composite: CompositeDef,
  bindings: CompositePortBinding[],
  direction: 'input' | 'output',
  registry: ModuleRegistry,
  issues: ValidationIssue[],
) {
  const externalPorts = direction === 'input' ? composite.inputs : composite.outputs;
  const usedExternalPorts = new Set<string>();

  for (const binding of bindings) {
    const externalPort = externalPorts.find((port) => port.name === binding.externalPort);
    if (!externalPort) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binding references unknown external ${direction} port "${binding.externalPort}".`,
      });
      continue;
    }

    if (usedExternalPorts.has(binding.externalPort)) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binds external ${direction} port "${binding.externalPort}" more than once.`,
      });
      continue;
    }

    usedExternalPorts.add(binding.externalPort);

    const endpoint: ConnectionEndpoint =
      direction === 'input'
        ? { moduleId: binding.internalModuleId, port: binding.internalPort }
        : { moduleId: binding.internalModuleId, port: binding.internalPort };
    const internalPort = findInternalBoundPort(
      composite.project,
      endpoint,
      direction,
      registry,
    );

    if (!internalPort) {
      issues.push({
        code: 'invalid-composite-binding',
        message: `Composite "${composite.id}" binding references unknown internal ${direction} port "${binding.internalModuleId}.${binding.internalPort}".`,
        moduleId: binding.internalModuleId,
      });
      continue;
    }

    if (internalPort.type !== externalPort.type) {
      issues.push({
        code: 'signal-type-mismatch',
        message: `Composite "${composite.id}" has mismatched types between external port "${binding.externalPort}" and internal port "${binding.internalModuleId}.${binding.internalPort}".`,
        moduleId: binding.internalModuleId,
      });
    }

    const internalKind = internalPort.kind ?? null;
    const externalKind = externalPort.kind ?? null;
    if (internalKind && externalKind && internalKind !== externalKind) {
      issues.push({
        code: 'signal-kind-mismatch',
        message: `Composite "${composite.id}" has mismatched kinds between external port "${binding.externalPort}" (${externalKind}) and internal port "${binding.internalModuleId}.${binding.internalPort}" (${internalKind}).`,
        moduleId: binding.internalModuleId,
      });
    }
  }
}

function findInternalBoundPort(
  project: Project,
  endpoint: ConnectionEndpoint,
  direction: 'input' | 'output',
  registry: ModuleRegistry,
) {
  const moduleInstance = project.modules.find(
    (candidate) => candidate.id === endpoint.moduleId,
  );
  if (!moduleInstance) {
    return null;
  }

  const def = registry[moduleInstance.defId];
  if (!def) {
    return null;
  }

  return findPort(def, endpoint.port, direction);
}
