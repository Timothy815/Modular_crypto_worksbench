import type { ClockedIteratorDef, CompositeDef, ConditionalDef, IteratorDef, MultiConditionalDef } from './composites';

export type SignalType = 'symbol' | 'bits' | 'integer' | 'ec-point';
export type PortKind = 'scalar' | 'sequence';

export interface SymbolSignal {
  type: 'symbol';
  value: string;
}

export interface BitsSignal {
  type: 'bits';
  value: number[];
}

export interface IntegerSignal {
  type: 'integer';
  value: string;
}

export interface EcCurveDescriptor {
  p: number;
  a: number;
  b: number;
}

export interface EcPointAffineValue {
  kind: 'affine';
  curve: EcCurveDescriptor;
  x: string;
  y: string;
}

export interface EcPointInfinityValue {
  kind: 'infinity';
  curve: EcCurveDescriptor;
}

export type EcPointSignalValue = EcPointAffineValue | EcPointInfinityValue;

export interface EcPointSignal {
  type: 'ec-point';
  value: EcPointSignalValue;
}

export type Signal = SymbolSignal | BitsSignal | IntegerSignal | EcPointSignal;

export interface PortDef {
  name: string;
  type: SignalType;
  kind?: PortKind;
}

export type ParamKind =
  | 'number'
  | 'string'
  | 'boolean'
  | 'select'
  | 'wiring'
  | 'bits';

export interface ParamOption {
  label: string;
  value: string;
}

export interface ParamFieldDef {
  key: string;
  label: string;
  kind: ParamKind;
  defaultValue: unknown;
  required?: boolean;
  hidden?: boolean;
  options?: ParamOption[];
  description?: string;
}

export type ParamSchema = Record<string, ParamFieldDef>;
export type ModuleParams = Record<string, unknown>;
export type ModuleInputs = Record<string, Signal>;
export type ModuleOutputs = Record<string, Signal>;

export interface RuntimeState {
  [key: string]: unknown;
}

export interface ModuleDef {
  id: string;
  name: string;
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  evaluate: (inputs: ModuleInputs, params: ModuleParams) => ModuleOutputs;
}

export interface StatefulModuleDef extends ModuleDef {
  usesClockAsInput?: boolean;
  liveStateDisplay?: {
    key: string;
    label: string;
    format?: 'default' | 'bits' | 'rotor-position';
  };
  advance: (params: ModuleParams, tick: number, inputs?: ModuleInputs) => ModuleParams;
}

export interface TickSliceableModuleDef extends ModuleDef {
  tickSlice: (params: ModuleParams, tick: number) => ModuleParams;
  tickLength: (params: ModuleParams) => number;
}

export type ModuleDefinition = ModuleDef | CompositeDef | IteratorDef | ClockedIteratorDef | ConditionalDef | MultiConditionalDef;

export function isStatefulModule(def: ModuleDefinition): def is StatefulModuleDef {
  return 'advance' in def && typeof (def as StatefulModuleDef).advance === 'function';
}

export function usesClockAsInput(def: ModuleDefinition): boolean {
  return isStatefulModule(def) && Boolean(def.usesClockAsInput);
}

export function isTickSliceable(def: ModuleDefinition): def is TickSliceableModuleDef {
  return (
    'tickSlice' in def &&
    typeof (def as TickSliceableModuleDef).tickSlice === 'function' &&
    'tickLength' in def &&
    typeof (def as TickSliceableModuleDef).tickLength === 'function'
  );
}

export interface ModuleInstance {
  id: string;
  defId: string;
  params: ModuleParams;
  bypass?: boolean;
}

export interface ConnectionEndpoint {
  moduleId: string;
  port: string;
}

export interface Connection {
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
}

export interface Project {
  modules: ModuleInstance[];
  connections: Connection[];
}

export type ModuleRegistry = Record<string, ModuleDefinition>;

export interface ValidationIssue {
  code:
    | 'duplicate-module-id'
    | 'unknown-module-def'
    | 'unknown-module-instance'
    | 'unknown-port'
    | 'duplicate-external-port'
    | 'missing-required-param'
    | 'unknown-param'
    | 'invalid-param-type'
    | 'invalid-param-option'
    | 'invalid-wiring'
    | 'duplicate-input-connection'
    | 'signal-type-mismatch'
    | 'signal-kind-mismatch'
    | 'signal-width-mismatch'
    | 'cycle-detected'
    | 'invalid-composite-binding'
    | 'invalid-bypass';
  message: string;
  moduleId?: string;
  connection?: Connection;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionTraceEntry {
  moduleId: string;
  defId: string;
  inputs: ModuleInputs;
  outputs: ModuleOutputs;
  scopeModuleId?: string;
  depth?: number;
}

export interface ExecutionResult {
  order: string[];
  outputsByModuleId: Record<string, ModuleOutputs>;
  trace: ExecutionTraceEntry[];
  analysisTrace: ExecutionTraceEntry[];
}

export interface TickedExecutionResult {
  ticks: ExecutionResult[];
  paramsByModuleByTick: Record<string, ModuleParams[]>;
}
